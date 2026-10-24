// Table names for the call feature. The DB team owns the migrations; adjust here if they differ.
export const TABLES = {
  challenges: 'challenge',
  participants: 'participant',
  callSessions: 'call_session',
} as const

export type CallSessionStatus = 'CREATED' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type ReportStatus = 'NOT_REQUESTED' | 'PROCESSING' | 'READY' | 'FAILED'

// Stored in call_session.metadata.speakers so the post-call webhook can map multi-voice tags back
// to participants. The lead speaks in the agent's default voice, so their lines carry no tag.
export interface CallSpeaker {
  participantId: string
  name: string
  label: string
  lead: boolean
}
