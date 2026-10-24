import { supabase } from '@/lib/supabase/client'
import type { Enums } from '@/lib/supabase/database.types'

export type ChallengeDifficulty = 'EASY' | 'MEDIUM' | 'HARD'
export type ChallengeCallType = Enums<'call_type'>
export type ChallengeSource = Enums<'challenge_source'>
export type CallMode = Enums<'call_mode'>

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
  createdAt: string
  participants: ChallengeParticipant[]
}

export interface AccountUsage {
  availableMinutes: number
  reservedMinutes: number
}

export interface GenerateChallengeInput {
  knowledgeId: string
  callType: ChallengeCallType
  difficulty: ChallengeDifficulty | null
  goal: string
}

// Agent configs, hidden motivations and objections stay server-side; only brief fields are read.
const CHALLENGE_COLUMNS =
  'id, title, description, category, difficulty, call_type, duration_minutes, objective, scenario, product_context, tags, source, knowledge_id, created_at'

export const challengeRepository = {
  async list(userId: string): Promise<Challenge[]> {
    const { data: rows, error } = await supabase
      .from('challenge')
      .select(CHALLENGE_COLUMNS)
      .eq('is_active', true)
      .or(`source.eq.INTERNAL,created_by.eq.${userId}`)
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
      createdAt: row.created_at,
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

  async generate(input: GenerateChallengeInput) {
    const { data, error } = await supabase.functions.invoke<{ challengeId: string }>(
      'generate-challenge',
      { body: input },
    )
    if (error) throw new Error('Could not generate a challenge. Your choices are kept; try again.')
    return data
  },
}
