import { supabase } from '@/lib/supabase/client'
import type { Enums } from '@/lib/supabase/database.types'

export type ChallengeDifficulty = 'EASY' | 'MEDIUM' | 'HARD'
export type ChallengeCallType = Enums<'call_type'>
export type ChallengeSource = Enums<'challenge_source'>
export type CallMode = Enums<'call_mode'>
export type GenerationStatus = Enums<'challenge_generation_status'>

export interface ChallengeParticipant {
  id: string
  name: string
  designation: string
  company: string
  personality: string
  communicationStyle: string
  decisionAuthority: string
}

export interface Challenge {
  id: string
  title: string
  description: string
  category: string
  difficulty: ChallengeDifficulty
  callType: ChallengeCallType
  durationMinutes: number
  objective: string
  scenario: string
  productContext: string | null
  tags: string[]
  source: ChallengeSource
  knowledgeId: string | null
  generationStatus: GenerationStatus
  generationError: string | null
  createdAt: string
  updatedAt: string
  participants: ChallengeParticipant[]
}

export interface AccountUsage {
  availableMinutes: number
  reservedMinutes: number
}

export interface GenerateChallengeInput {
  knowledgeId: string
  difficulty: ChallengeDifficulty | null
  goal: string
}

export interface CallSession {
  callSessionId: string
  conversationToken: string
  challenge: {
    id: string
    title: string
    callType: ChallengeCallType
    durationMinutes: number
  }
  participants: Array<{
    id: string
    name: string
    designation: string
    company: string
    voiceLabel: string
    lead: boolean
  }>
  dynamicVariables: Record<string, string | number | boolean>
}

async function functionError(error: unknown, fallback: string, name = 'edge-function') {
  const context = (error as { context?: Response })?.context
  if (context) {
    const body = await context
      .clone()
      .json()
      .catch(() => null)
    // Logged so a failing click shows the real status and server message in the console.
    console.error(`[${name}] HTTP ${context.status}`, body)
    if (typeof body?.error === 'string') return new Error(body.error)
  } else {
    // No response at all: network error, CORS, or the function is not deployed/reachable.
    console.error(`[${name}] request failed`, error)
  }
  return new Error(fallback)
}

// Agent configs, hidden motivations and objections stay server-side; only brief fields are read.
const CHALLENGE_COLUMNS =
  'id, title, description, category, difficulty, call_type, duration_minutes, objective, scenario, product_context, tags, source, knowledge_id, generation_status, generation_error, created_at, updated_at'

export const challengeRepository = {
  async list(userId: string): Promise<Challenge[]> {
    const { data: rows, error } = await supabase
      .from('challenge')
      .select(CHALLENGE_COLUMNS)
      // Open Challenges, plus the user's own: ready ones and those still generating or failed.
      .or(
        `and(source.eq.INTERNAL,is_active.eq.true),and(created_by.eq.${userId},or(is_active.eq.true,generation_status.neq.READY))`,
      )
      .order('created_at', { ascending: false })
      .order('id')
    if (error) throw error
    if (rows.length === 0) return []

    const { data: people, error: peopleError } = await supabase
      .from('participant_public')
      .select(
        'id, challenge_id, name, designation, company, personality, communication_style, decision_authority, sort_order',
      )
      .in(
        'challenge_id',
        rows.map((row) => row.id),
      )
      .order('sort_order')
    if (peopleError) throw peopleError

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      difficulty: row.difficulty as ChallengeDifficulty,
      callType: row.call_type,
      durationMinutes: row.duration_minutes,
      objective: row.objective,
      scenario: row.scenario,
      productContext: row.product_context,
      tags: row.tags,
      source: row.source,
      knowledgeId: row.knowledge_id,
      generationStatus: row.generation_status,
      generationError: row.generation_error,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      participants: people
        .filter((person) => person.challenge_id === row.id)
        .map((person) => ({
          id: person.id ?? `${row.id}-${person.sort_order}`,
          name: person.name ?? 'Unnamed participant',
          designation: person.designation ?? '',
          company: person.company ?? '',
          personality: person.personality ?? '',
          communicationStyle: person.communication_style ?? '',
          decisionAuthority: person.decision_authority ?? '',
        })),
    }))
  },

  async usage(userId: string): Promise<AccountUsage | null> {
    const { data, error } = await supabase
      .from('account_usage')
      .select('available_minutes, reserved_minutes')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw error
    return data
      ? { availableMinutes: data.available_minutes, reservedMinutes: data.reserved_minutes }
      : null
  },

  // Starts background generation of three challenges and returns their placeholder IDs.
  async generate(input: GenerateChallengeInput) {
    console.info('[generate-challenges] start', input)
    const { data, error } = await supabase.functions.invoke<{ challengeIds: string[] }>(
      'generate-challenges',
      { body: input },
    )
    if (error)
      throw await functionError(
        error,
        'Could not generate challenges. Your choices are kept; try again.',
        'generate-challenges',
      )
    console.info('[generate-challenges] accepted', data)
    return data
  },

  async retryGeneration(challengeId: string) {
    console.info('[generate-challenges] retry', challengeId)
    const { error } = await supabase.functions.invoke('generate-challenges', {
      body: { retryChallengeId: challengeId },
    })
    if (error)
      throw await functionError(
        error,
        'Could not retry this challenge. Try again.',
        'generate-challenges',
      )
  },

  async startCall(challengeId: string) {
    const { data, error } = await supabase.functions.invoke<CallSession>(
      'elevenlabs-agent-session',
      { body: { challengeId, connectionType: 'webrtc' } },
    )
    if (error) throw await functionError(error, 'Could not prepare the call. Try again.')
    if (!data?.conversationToken || !data.callSessionId) {
      throw new Error('The call service returned an incomplete session.')
    }
    return data
  },

  async activateCall(callSessionId: string, conversationId: string) {
    const { error } = await supabase.functions.invoke('elevenlabs-agent-session', {
      body: { action: 'activate', callSessionId, conversationId },
    })
    if (error) throw await functionError(error, 'Could not connect the call session.')
  },

  async endCall(callSessionId: string) {
    const { error } = await supabase.functions.invoke('elevenlabs-agent-session', {
      body: { action: 'end', callSessionId },
    })
    if (error) throw await functionError(error, 'Could not end the call session.')
  },
}
