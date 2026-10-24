import type { Challenge, ChallengeCallType, ChallengeDifficulty } from '../repositories'

export const difficultyLabels: Record<ChallengeDifficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
}

export const callTypeLabels: Record<ChallengeCallType, string> = {
  ONE_ON_ONE: 'One-on-One',
  BOARDROOM: 'Boardroom',
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export const formatMinutes = (minutes: number) => `${minutes} min`

export type GenerationState = 'generating' | 'failed' | 'ready'

// Matches the server: a run still processing after this was cut off and can be retried.
export const GENERATION_STALE_MS = 5 * 60_000
export const GENERATION_POLL_MS = 3_000

export function generationState(
  { generationStatus, updatedAt }: Pick<Challenge, 'generationStatus' | 'updatedAt'>,
  now = Date.now(),
): GenerationState {
  if (generationStatus === 'READY') return 'ready'
  if (generationStatus === 'FAILED') return 'failed'
  return now - new Date(updatedAt).getTime() > GENERATION_STALE_MS ? 'failed' : 'generating'
}
