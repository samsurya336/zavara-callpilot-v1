import { jsonResponse, serviceClient } from '../_shared/index.ts'
import { type CallSessionStatus, type CallSpeaker, TABLES } from '../_shared/calls.ts'
import { verifySignature } from './signature.ts'
import { mapTranscript, type ProviderTurn } from './transcript.ts'

interface TranscriptionEvent {
  type: string
  data: {
    conversation_id: string
    status?: string
    transcript?: ProviderTurn[]
    metadata?: { start_time_unix_secs?: number; call_duration_secs?: number; cost?: number }
  }
}

// Called by ElevenLabs, not a user, so gateway verify_jwt is off and the HMAC signature is the
// authentication. Unknown events and calls return 200 so ElevenLabs does not disable the webhook.
Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Use POST' }, 405)
  }
  const secret = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET')
  if (!secret) {
    console.error('ELEVENLABS_WEBHOOK_SECRET is not set')
    return jsonResponse({ error: 'Webhook is not configured' }, 500)
  }

  const rawBody = await request.text()
  if (!(await verifySignature(rawBody, request.headers.get('ElevenLabs-Signature'), secret))) {
    return jsonResponse({ error: 'Invalid signature' }, 401)
  }

  try {
    const event = JSON.parse(rawBody) as TranscriptionEvent
    if (event.type !== 'post_call_transcription') return jsonResponse({ received: true })

    const { conversation_id: conversationId, metadata } = event.data
    const db = serviceClient()
    const { data: session, error } = await db
      .from(TABLES.callSessions)
      .select('id, metadata')
      .eq('provider_session_id', conversationId)
      .maybeSingle()
    if (error) throw error
    if (!session) {
      console.warn(`No call session for ElevenLabs conversation ${conversationId}`)
      return jsonResponse({ received: true })
    }

    const speakers = (session.metadata?.speakers ?? []) as CallSpeaker[]
    const start = metadata?.start_time_unix_secs
    const duration = metadata?.call_duration_secs
    const status: CallSessionStatus = event.data.status === 'failed' ? 'FAILED' : 'COMPLETED'
    const { error: updateError } = await db
      .from(TABLES.callSessions)
      .update({
        transcript: mapTranscript(event.data.transcript ?? [], speakers),
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

    return jsonResponse({ received: true })
  } catch (error) {
    console.error(error)
    // A 5xx lets ElevenLabs retry; the update is keyed by conversation, so retries are safe.
    return jsonResponse({ error: 'Could not store the transcript' }, 500)
  }
})
