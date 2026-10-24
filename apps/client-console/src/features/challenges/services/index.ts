import type { CallMode, ChallengeCallType, ChallengeDifficulty } from '../repositories'

export const difficultyLabels: Record<ChallengeDifficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
}

export const callTypeLabels: Record<ChallengeCallType, string> = {
  ONE_ON_ONE: 'One-on-One',
  BOARDROOM: 'Boardroom',
}

export const callModes: { value: CallMode; label: string; description: string }[] = [
  {
    value: 'ASSIST',
    label: 'Assist',
    description: 'Ask the coach for private suggestions during the call.',
  },
  {
    value: 'BATTLE',
    label: 'Battle',
    description: 'No hints. Handle every question on your own.',
  },
]

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export const formatMinutes = (minutes: number) => `${minutes} min`
