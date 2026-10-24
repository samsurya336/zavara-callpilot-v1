import type { serviceClient } from '../_shared/index.ts'
import {
  type CallSessionStatus,
  type CallSpeaker,
  type ReportStatus,
  TABLES,
} from '../_shared/calls.ts'

// Column names follow the agreed challenge/participant/call_session schema in snake_case.
// This file is the only place that knows them.

type Db = ReturnType<typeof serviceClient>

export type CallType = 'ONE_ON_ONE' | 'BOARDROOM'
export type CallMode = 'ASSIST' | 'BATTLE'

export interface VoiceConfigs {
  voiceId?: string
  stability?: number
  similarityBoost?: number
  speed?: number
}

export interface AgentRef {
  agentId: string
  configHash: string
  syncedAt: string
}

export interface ChallengeRow {
  id: string
  title: string
  description: string | null
  category: string | null
  difficulty: string | null
  call_type: CallType
  duration_minutes: number
  objective: string | null
  scenario: string | null
  is_active: boolean
  source: 'INTERNAL' | 'KNOWLEDGE_BASE'
  configs: { elevenlabs?: AgentRef; [key: string]: unknown } | null
  created_by: string | null
}

export interface ParticipantRow {
  id: string
  name: string
  designation: string
  company: string
  personality: string | null
  communication_style: string | null
  hidden_motivation: string | null
  objections: string | string[] | null
  decision_authority: string | null
  voice_configs: VoiceConfigs | null
}

const CHALLENGE_COLUMNS =
  'id, title, description, category, difficulty, call_type, duration_minutes, objective, ' +
  'scenario, is_active, source, configs, created_by'
const PARTICIPANT_COLUMNS =
  'id, name, designation, company, personality, communication_style, hidden_motivation, ' +
  'objections, decision_authority, voice_configs'
// The first participant leads the meeting and speaks in the agent's default voice.
const PARTICIPANT_ORDER = 'sort_order'
const AGENT_ID_PATH = 'configs->elevenlabs->>agentId'

export async function loadChallenge(db: Db, challengeId: string) {
  const { data: challenge, error } = await db
    .from(TABLES.challenges)
    .select(CHALLENGE_COLUMNS)
    .eq('id', challengeId)
    .maybeSingle()
  if (error) throw error
  if (!challenge) return null

  const { data: participants, error: participantError } = await db
    .from(TABLES.participants)
    .select(PARTICIPANT_COLUMNS)
    .eq('challenge_id', challengeId)
    .order(PARTICIPANT_ORDER)
  if (participantError) throw participantError

  return {
    challenge: challenge as unknown as ChallengeRow,
    participants: (participants ?? []) as unknown as ParticipantRow[],
  }
}

export async function loadAgentRef(db: Db, challengeId: string): Promise<AgentRef | null> {
  const { data, error } = await db
    .from(TABLES.challenges)
    .select('configs')
    .eq('id', challengeId)
    .single()
  if (error) throw error
  return (data.configs as ChallengeRow['configs'])?.elevenlabs ?? null
}

// Compare-and-swap on the stored agent ID so two first starts cannot both keep a new agent.
// Returns false when another request changed the reference first.
export async function saveAgentRef(
  db: Db,
  challenge: ChallengeRow,
  ref: AgentRef,
  expectedAgentId: string | null,
) {
  const update = db
    .from(TABLES.challenges)
    .update({ configs: { ...challenge.configs, elevenlabs: ref } })
    .eq('id', challenge.id)
  const { data, error } =
    await (expectedAgentId === null
      ? update.is(AGENT_ID_PATH, null)
      : update.eq(AGENT_ID_PATH, expectedAgentId)).select('id')
  if (error) throw error
  return data.length > 0
}

// Ends the user's unfinished sessions, or just one: a session that never connected is cancelled
// and a connected one is completed. The post-call webhook later stores the transcript and final
// status by conversation ID, so ending first loses nothing.
const CLOSE_TRANSITIONS: [CallSessionStatus, CallSessionStatus][] = [
  ['CREATED', 'CANCELLED'],
  ['ACTIVE', 'COMPLETED'],
]

export async function closeCallSessions(db: Db, userId: string, callSessionId?: string) {
  const endedAt = new Date().toISOString()
  for (const [from, to] of CLOSE_TRANSITIONS) {
    let query = db
      .from(TABLES.callSessions)
      .update({ status: to, ended_at: endedAt })
      .eq('user_id', userId)
      .eq('status', from)
    if (callSessionId) query = query.eq('id', callSessionId)
    const { error } = await query
    if (error) throw error
  }
}

// The provider conversation of the user's ended call, or null when it never connected or its
// report is already saved.
export async function loadEndedConversationId(db: Db, userId: string, callSessionId: string) {
  const { data, error } = await db
    .from(TABLES.callSessions)
    .select('provider_session_id')
    .eq('id', callSessionId)
    .eq('user_id', userId)
    .in('status', ['COMPLETED', 'FAILED'] satisfies CallSessionStatus[])
    .neq('report_status', 'READY' satisfies ReportStatus)
    .maybeSingle()
  if (error) throw error
  return (data?.provider_session_id as string | null) ?? null
}

export interface NewCallSession {
  userId: string
  challengeId: string
  mode: CallMode
  providerSessionId: string | null
  metadata: {
    snapshot: { challenge: Omit<ChallengeRow, 'configs'>; participants: ParticipantRow[] }
    speakers: CallSpeaker[]
    agentId: string
    configHash: string
  }
}

// Returns null when another start for the same user won the race (unique index on open sessions).
export async function insertCallSession(db: Db, session: NewCallSession) {
  const { data, error } = await db
    .from(TABLES.callSessions)
    .insert({
      user_id: session.userId,
      challenge_id: session.challengeId,
      status: 'CREATED' satisfies CallSessionStatus,
      mode: session.mode,
      provider_session_id: session.providerSessionId,
      metadata: session.metadata,
    })
    .select('id')
    .single()
  if (error?.code === '23505') return null
  if (error) throw error
  return data.id as string
}

export async function activateCallSession(
  db: Db,
  userId: string,
  callSessionId: string,
  conversationId: string,
) {
  const { data, error } = await db
    .from(TABLES.callSessions)
    .update({
      status: 'ACTIVE' satisfies CallSessionStatus,
      provider_session_id: conversationId,
      started_at: new Date().toISOString(),
    })
    .eq('id', callSessionId)
    .eq('user_id', userId)
    .eq('status', 'CREATED')
    .select('id')
    .maybeSingle()
  if (error?.code === '23505') return 'CONFLICT' as const
  if (error) throw error
  return data ? 'ACTIVE' as const : 'NOT_FOUND' as const
}
