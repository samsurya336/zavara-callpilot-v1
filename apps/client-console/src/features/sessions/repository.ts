import { supabase } from '@/lib/supabase/client'
import type { CallReport } from './types'

export interface SavedTurn {
  id: string
  speaker: 'user' | 'agent'
  text: string
  order: number
  participantId: string | null
  timeInCallSecs: number
}

export interface SessionParticipant {
  id: string
  name: string
  designation: string
  company: string
  communicationStyle: string
  decisionAuthority: string
}

export interface SessionRecord {
  id: string
  user_id: string
  challenge_id: string
  title: string
  status: 'CREATED' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  mode: 'ASSIST' | 'BATTLE'
  report_status: 'NOT_REQUESTED' | 'PROCESSING' | 'READY' | 'FAILED'
  created_at: string
  started_at: string | null
  ended_at: string | null
  duration_seconds: number | null
  parent_session_id: string | null
  branch_from_turn_id: string | null
  provider_session_id: string | null
  recording_url: string | null
  ownerName: string
  ownerEmail: string
  callType: 'ONE_ON_ONE' | 'BOARDROOM'
  category: string
  difficulty: string
  description: string
  objective: string
  participants: SessionParticipant[]
  report: CallReport | null
  transcript: SavedTurn[]
}

type Snapshot = { snapshot?: { challenge?: { title?: string; call_type?: string } } }

export async function listSessions(): Promise<SessionRecord[]> {
  const { data: rows, error } = await supabase
    .from('call_session')
    .select(
      'id, user_id, challenge_id, created_at, started_at, ended_at, status, mode, duration_seconds, report_status, report, transcript, metadata, parent_session_id, branch_from_turn_id, provider_session_id, recording_url',
    )
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  if (!rows.length) return []

  const challengeIds = [...new Set(rows.map((row) => row.challenge_id))]
  const userIds = [...new Set(rows.map((row) => row.user_id))]
  const [challengeResult, participantResult, profileResult] = await Promise.all([
    supabase
      .from('challenge')
      .select('id, title, call_type, category, difficulty, description, objective')
      .in('id', challengeIds),
    supabase
      .from('participant_public')
      .select(
        'id, challenge_id, name, designation, company, communication_style, decision_authority, sort_order',
      )
      .in('challenge_id', challengeIds)
      .order('sort_order'),
    supabase.from('profiles').select('id, name, email').in('id', userIds),
  ])
  if (challengeResult.error) throw challengeResult.error
  if (participantResult.error) throw participantResult.error
  if (profileResult.error) throw profileResult.error

  const challenges = new Map(challengeResult.data.map((item) => [item.id, item]))
  const profiles = new Map(profileResult.data.map((item) => [item.id, item]))
  return rows.map((row) => {
    const challenge = challenges.get(row.challenge_id)
    const profile = profiles.get(row.user_id)
    const snapshot = row.metadata as Snapshot | null
    return {
      ...row,
      title: challenge?.title ?? snapshot?.snapshot?.challenge?.title ?? 'Practice call',
      ownerName: profile?.name || 'Unknown user',
      ownerEmail: profile?.email || '',
      callType:
        challenge?.call_type === 'BOARDROOM' ||
        snapshot?.snapshot?.challenge?.call_type === 'BOARDROOM'
          ? 'BOARDROOM'
          : 'ONE_ON_ONE',
      category: challenge?.category ?? 'General',
      difficulty: challenge?.difficulty ?? 'Not set',
      description: challenge?.description ?? '',
      objective: challenge?.objective ?? '',
      participants: participantResult.data
        .filter((person) => person.challenge_id === row.challenge_id)
        .map((person, index) => ({
          id: person.id ?? `${row.challenge_id}-${index}`,
          name: person.name ?? 'Buyer',
          designation: person.designation ?? 'Participant',
          company: person.company ?? '',
          communicationStyle: person.communication_style ?? 'Not specified',
          decisionAuthority: person.decision_authority ?? 'Not specified',
        })),
      report: row.report as unknown as CallReport | null,
      transcript: (Array.isArray(row.transcript) ? row.transcript : []) as unknown as SavedTurn[],
    }
  })
}
