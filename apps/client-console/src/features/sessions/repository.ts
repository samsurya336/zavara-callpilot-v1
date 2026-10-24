import { supabase } from '@/lib/supabase/client'
import type { CallReport } from './types'

export interface SavedTurn {
  id: string
  speaker: 'user' | 'agent'
  text: string
  timeInCallSecs: number | null
}

export async function listSessions(userId: string) {
  const { data, error } = await supabase
    .from('call_session')
    .select(
      'id, challenge_id, created_at, status, mode, duration_seconds, report_status, report, transcript, metadata',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data.map((row) => ({
    ...row,
    title:
      (row.metadata as { snapshot?: { challenge?: { title?: string } } } | null)?.snapshot
        ?.challenge?.title ?? 'Practice call',
    report: row.report as unknown as CallReport | null,
    transcript: (Array.isArray(row.transcript) ? row.transcript : []) as unknown as SavedTurn[],
  }))
}
