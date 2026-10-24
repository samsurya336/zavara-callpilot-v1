import { type CallSessionStatus, type CallSpeaker, type ReportStatus, TABLES } from './calls.ts'
import type { serviceClient } from './index.ts'
import { buildReport, type ReportInput } from './report.ts'
import {
  continuedTranscript,
  mapTranscript,
  type ProviderTurn,
  type TranscriptTurn,
} from './transcript.ts'

type Db = ReturnType<typeof serviceClient>

// An ElevenLabs conversation, as sent in the post_call_transcription webhook's `data` and returned
// by GET /v1/convai/conversations/{id}. The webhook and the end-call sync share everything below.
export interface ProviderConversation {
  conversation_id: string
  status?: string
  transcript?: ProviderTurn[]
  metadata?: { start_time_unix_secs?: number; call_duration_secs?: number; cost?: number }
}

// Writes the final transcript, status, timing and credits to the call session matched by
// conversation ID. Returns the session ID, or null for an unknown conversation. Repeating it with
// the same conversation produces the same row, so webhook retries are safe.
export async function saveConversation(db: Db, conversation: ProviderConversation) {
  const { data: session, error } = await db
    .from(TABLES.callSessions)
    .select('id, metadata')
    .eq('provider_session_id', conversation.conversation_id)
    .maybeSingle()
  if (error) throw error
  if (!session) return null

  const { metadata } = conversation
  const speakers = (session.metadata?.speakers ?? []) as CallSpeaker[]
  const prefix = (session.metadata?.branchPrefix ?? []) as TranscriptTurn[]
  const transcript = continuedTranscript(
    prefix,
    mapTranscript(conversation.transcript ?? [], speakers),
  )
  const start = metadata?.start_time_unix_secs
  const duration = metadata?.call_duration_secs
  const status: CallSessionStatus = conversation.status === 'failed' ? 'FAILED' : 'COMPLETED'
  const { error: updateError } = await db
    .from(TABLES.callSessions)
    .update({
      transcript,
      status,
      started_at: start ? new Date(start * 1000).toISOString() : null,
      ended_at: start && duration != null
        ? new Date((start + duration) * 1000).toISOString()
        : null,
      duration_seconds: duration ?? null,
      usage: {
        provider: 'elevenlabs',
        credits: metadata?.cost ?? null,
        durationSeconds: duration,
      },
    })
    .eq('id', session.id)
  if (updateError) throw updateError
  return session.id as string
}

// A PROCESSING claim older than this is treated as a crashed run and may be taken over.
const REPORT_STALE_MINUTES = 5

// Generates and saves the session's report once. The claim is a conditional update, so the webhook,
// its retries and the end-call sync can all call this and only one of them does the work. A failure
// marks the report FAILED, keeps the transcript, and leaves it claimable by the next attempt.
export async function generateReport(db: Db, callSessionId: string) {
  const staleBefore = new Date(Date.now() - REPORT_STALE_MINUTES * 60_000).toISOString()
  const { data: session, error } = await db
    .from(TABLES.callSessions)
    .update({ report_status: 'PROCESSING' satisfies ReportStatus })
    .eq('id', callSessionId)
    .in('status', ['COMPLETED', 'FAILED'] satisfies CallSessionStatus[])
    .or(
      'report_status.in.(NOT_REQUESTED,FAILED),' +
        `and(report_status.eq.PROCESSING,updated_at.lt.${staleBefore})`,
    )
    .select('challenge_id, mode, transcript, duration_seconds, metadata')
    .maybeSingle()
  if (error) throw error
  if (!session) return

  try {
    // The snapshot is the challenge as it was during the call; the product brief is not in it.
    const { data: challenge, error: challengeError } = await db
      .from(TABLES.challenges)
      .select('title, description, call_type, difficulty, objective, scenario, product_context')
      .eq('id', session.challenge_id)
      .single()
    if (challengeError) throw challengeError

    const snapshot = session.metadata?.snapshot
    const input: ReportInput = {
      challenge: snapshot?.challenge ?? challenge,
      participants: snapshot?.participants ?? [],
      productContext: challenge.product_context?.trim() || null,
      mode: session.mode,
      durationSeconds: session.duration_seconds,
      transcript: session.transcript ?? [],
    }
    const report = await buildReport(input)
    const { error: saveError } = await db
      .from(TABLES.callSessions)
      .update({ report, report_status: 'READY' satisfies ReportStatus })
      .eq('id', callSessionId)
    if (saveError) throw saveError
  } catch (error) {
    const { error: markError } = await db
      .from(TABLES.callSessions)
      .update({ report_status: 'FAILED' satisfies ReportStatus })
      .eq('id', callSessionId)
    if (markError) console.error(markError)
    throw error
  }
}
