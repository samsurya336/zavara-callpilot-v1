// Table names for the call feature. The DB team owns the migrations; adjust here if they differ.
export const TABLES = {
  challenges: 'challenges',
  participants: 'participants',
  callSessions: 'call_sessions',
} as const

export type CallSessionStatus = 'CREATED' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

// Stored in call_sessions.metadata.speakers so the post-call webhook can map multi-voice tags back
// to participants. The lead speaks in the agent's default voice, so their lines carry no tag.
export interface CallSpeaker {
  participantId: string
  name: string
  label: string
  lead: boolean
}
