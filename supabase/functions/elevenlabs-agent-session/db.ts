import type { serviceClient } from '../_shared/index.ts'
import { type CallSessionStatus, type CallSpeaker, TABLES } from '../_shared/calls.ts'

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
  mode: CallMode | null
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
  'scenario, is_active, source, mode, configs, created_by'
const PARTICIPANT_COLUMNS =
  'id, name, designation, company, personality, communication_style, hidden_motivation, ' +
  'objections, decision_authority, voice_configs'
// The first participant leads the meeting and speaks in the agent's default voice.
const PARTICIPANT_ORDER = 'created_at'
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

// Unfinished sessions past their expiry would otherwise hold the one-active-call lock forever.
// Expiry is after the provider-enforced max duration, so no live call is cancelled.
export async function expireStaleSessions(db: Db, userId: string, now: Date) {
  const { error } = await db
    .from(TABLES.callSessions)
    .update({ status: 'CANCELLED' satisfies CallSessionStatus })
    .eq('user_id', userId)
    .in('status', ['CREATED', 'ACTIVE'] satisfies CallSessionStatus[])
    .lt('metadata->>expiresAt', now.toISOString())
  if (error) throw error
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
    expiresAt: string
  }
}

// Returns null when the user already has an active call (unique index on active sessions).
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
