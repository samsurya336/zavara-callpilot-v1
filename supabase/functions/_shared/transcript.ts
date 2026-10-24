import type { CallSpeaker } from './calls.ts'

export interface ProviderTurn {
  role: 'user' | 'agent'
  message: string | null
  time_in_call_secs?: number | null
}

// Agreed saved-turn format. IDs depend only on order, so webhook retries reproduce them and
// Time Machine branches can reference them.
export interface TranscriptTurn {
  id: string
  order: number
  speaker: 'user' | 'agent'
  participantId: string | null
  text: string
  timeInCallSecs: number | null
}

const TAGGED_SEGMENT = /<([A-Za-z0-9]+)>([\s\S]*?)<\/\1>/g

// Rebuild from the immutable prefix each time, so webhook retries cannot duplicate history.
export function continuedTranscript(prefix: TranscriptTurn[], current: TranscriptTurn[]) {
  return [...prefix, ...current].map((turn, order) => ({ ...turn, id: `turn-${order}`, order }))
}

// Multi-voice replies wrap non-lead stakeholders in <Label>...</Label>; untagged text is the lead.
// A reply that breaks the one-speaker rule is split into one turn per speaker.
export function mapTranscript(turns: ProviderTurn[], speakers: CallSpeaker[]): TranscriptTurn[] {
  const lead = speakers.find((speaker) => speaker.lead)?.participantId ?? null
  const byLabel = new Map(speakers.map((speaker) => [speaker.label, speaker.participantId]))
  const result: TranscriptTurn[] = []
  const push = (
    speaker: 'user' | 'agent',
    participantId: string | null,
    text: string,
    turn: ProviderTurn,
  ) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const order = result.length
    result.push({
      id: `turn-${order}`,
      order,
      speaker,
      participantId,
      text: trimmed,
      timeInCallSecs: turn.time_in_call_secs ?? null,
    })
  }

  for (const turn of turns) {
    if (!turn.message) continue
    if (turn.role === 'user') {
      push('user', null, turn.message, turn)
      continue
    }
    let cursor = 0
    for (const match of turn.message.matchAll(TAGGED_SEGMENT)) {
      push('agent', lead, turn.message.slice(cursor, match.index), turn)
      push('agent', byLabel.get(match[1]) ?? lead, match[2], turn)
      cursor = match.index + match[0].length
    }
    push('agent', lead, turn.message.slice(cursor), turn)
  }
  return result
}
