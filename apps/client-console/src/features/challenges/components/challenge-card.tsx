import { ArrowUpRight, Clock, User, Users } from 'lucide-react'
import type { Challenge, ChallengeDifficulty } from '../repositories'
import { callTypeLabels, difficultyLabels, formatMinutes, initials } from '../services'

export function DifficultyLabel({ difficulty }: { difficulty: ChallengeDifficulty }) {
  return (
    <span className="challenge-difficulty" data-difficulty={difficulty.toLowerCase()}>
      {difficultyLabels[difficulty]}
    </span>
  )
}

export function ParticipantStack({ challenge }: { challenge: Challenge }) {
  const [first] = challenge.participants
  if (!first) return null
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="challenge-avatars" aria-hidden="true">
        {challenge.participants.slice(0, 3).map((person) => (
          <span key={person.id} className="challenge-avatar">
            {initials(person.name)}
          </span>
        ))}
      </span>
      <span className="min-w-0 truncate text-xs text-muted-foreground">
        {challenge.participants.length === 1
          ? `${first.name}, ${first.designation}`
          : challenge.participants.map((person) => person.designation).join(' · ')}
      </span>
    </span>
  )
}

export function ChallengeCard({
  challenge,
  onSelect,
}: {
  challenge: Challenge
  onSelect: (id: string) => void
}) {
  const FormatIcon = challenge.callType === 'BOARDROOM' ? Users : User
  return (
    <li className="min-w-0">
      <button
        type="button"
        className="challenge-card destination glass"
        onClick={() => onSelect(challenge.id)}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="icon-tile">
            <FormatIcon size={22} aria-hidden="true" />
          </span>
          <ArrowUpRight size={18} className="text-muted-foreground" aria-hidden="true" />
        </span>
        <span className="mt-6 block truncate text-xs text-muted-foreground">
          {challenge.category}
        </span>
        <span className="mt-2 block font-display text-base font-semibold">{challenge.title}</span>
        <span className="challenge-card-description mt-2 text-sm text-muted-foreground">
          {challenge.description}
        </span>
        <span className="challenge-card-meta">
          <DifficultyLabel difficulty={challenge.difficulty} />
          <span className="challenge-chip">{callTypeLabels[challenge.callType]}</span>
          <span className="challenge-chip">
            <Clock size={13} aria-hidden="true" />
            {formatMinutes(challenge.durationMinutes)}
          </span>
        </span>
        <span className="challenge-card-footer">
          <ParticipantStack challenge={challenge} />
        </span>
      </button>
    </li>
  )
}
