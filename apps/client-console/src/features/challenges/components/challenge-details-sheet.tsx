import { useState } from 'react'
import { Dialog } from 'radix-ui'
import { Info, Mic, Play, Target, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccountUsage } from '../hooks'
import type { CallMode, Challenge } from '../repositories'
import { callModes, callTypeLabels, formatMinutes, initials } from '../services'
import { DifficultyLabel } from './challenge-card'

function Allowance({ challenge }: { challenge: Challenge }) {
  const usage = useAccountUsage()
  const available = usage.data
    ? Math.max(usage.data.availableMinutes - usage.data.reservedMinutes, 0)
    : null
  const short = available !== null && available < challenge.durationMinutes

  return (
    <div className="knowledge-note challenge-notice" data-short={short}>
      <Info size={18} aria-hidden="true" />
      <p>
        Uses up to {formatMinutes(challenge.durationMinutes)} of your practice allowance
        {available !== null && <> · {formatMinutes(available)} available</>}. Your audio is
        processed to run the call and create your report.
        {short && <strong className="mt-1 block text-foreground">Not enough minutes left.</strong>}
      </p>
    </div>
  )
}

function ChallengeDetails({ challenge }: { challenge: Challenge }) {
  const [mode, setMode] = useState<CallMode>('ASSIST')
  const boardroom = challenge.callType === 'BOARDROOM'

  return (
    <Dialog.Content className="knowledge-sheet challenge-sheet glass-sheet">
      <header className="knowledge-sheet-header">
        <p className="section-label mb-3">
          {challenge.source === 'INTERNAL' ? 'Open Challenge' : 'Knowledge-based Challenge'}
        </p>
        <Dialog.Title className="knowledge-dialog-title pr-14">{challenge.title}</Dialog.Title>
        <Dialog.Description className="mt-2 text-sm text-muted-foreground">
          {challenge.description}
        </Dialog.Description>
        <div className="mt-4 flex flex-wrap gap-2">
          <DifficultyLabel difficulty={challenge.difficulty} />
          <span className="challenge-chip">{callTypeLabels[challenge.callType]}</span>
          <span className="challenge-chip">{formatMinutes(challenge.durationMinutes)}</span>
        </div>
        <Dialog.Close asChild>
          <Button
            variant="ghost"
            size="icon"
            className="knowledge-dialog-close size-11 rounded-full"
            aria-label="Close brief"
            title="Close brief"
          >
            <X aria-hidden="true" />
          </Button>
        </Dialog.Close>
      </header>
      <div className="knowledge-sheet-body">
        <section className="knowledge-sheet-section" aria-labelledby="challenge-goal-heading">
          <h3 id="challenge-goal-heading" className="sr-only">
            Goal
          </h3>
          <div className="challenge-goal">
            <span className="icon-tile">
              <Target size={22} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="section-label mb-1">Your goal</p>
              <p className="text-sm font-semibold">{challenge.objective}</p>
            </div>
          </div>
        </section>
        <section className="knowledge-sheet-section" aria-labelledby="challenge-brief-heading">
          <h3 id="challenge-brief-heading" className="mb-4 text-base font-semibold">
            Brief
          </h3>
          <dl className="challenge-brief">
            <div>
              <dt>Situation</dt>
              <dd>{challenge.scenario}</dd>
            </div>
            {challenge.productContext && (
              <div>
                <dt>What you’re selling</dt>
                <dd>{challenge.productContext}</dd>
              </div>
            )}
          </dl>
          {challenge.tags.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Skills">
              {challenge.tags.map((tag) => (
                <li key={tag} className="challenge-chip">
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section
          className="knowledge-sheet-section"
          aria-labelledby="challenge-participants-heading"
        >
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h3 id="challenge-participants-heading" className="text-base font-semibold">
              {boardroom ? 'Boardroom' : 'Buyer'}
            </h3>
            <p className="text-xs text-muted-foreground">Simulated people and companies</p>
          </div>
          {challenge.participants.length === 0 ? (
            <p className="knowledge-note">No participant details are available.</p>
          ) : (
            <ul className="challenge-people">
              {challenge.participants.map((person) => (
                <li key={person.id} className="challenge-person">
                  <span className="challenge-avatar challenge-avatar-lg" aria-hidden="true">
                    {initials(person.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {person.name}
                      <span className="font-normal text-muted-foreground">
                        {' '}
                        · {person.designation}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {person.company} · {person.decisionAuthority}
                    </p>
                    <dl className="knowledge-facts mt-3">
                      <div>
                        <dt>Personality</dt>
                        <dd>{person.personality}</dd>
                      </div>
                      <div>
                        <dt>Speaks</dt>
                        <dd>{person.communicationStyle}</dd>
                      </div>
                    </dl>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="knowledge-sheet-section" aria-labelledby="challenge-mode-heading">
          <fieldset>
            <legend id="challenge-mode-heading" className="mb-4 text-base font-semibold">
              Mode
            </legend>
            <div className="challenge-modes">
              {callModes.map((option) => (
                <label key={option.value} className="challenge-mode">
                  <input
                    className="peer sr-only"
                    type="radio"
                    name="challenge-mode"
                    value={option.value}
                    checked={mode === option.value}
                    onChange={() => setMode(option.value)}
                  />
                  <span className="challenge-mode-body">
                    <span className="text-sm font-semibold">{option.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-5">
            <Allowance challenge={challenge} />
          </div>
        </section>
      </div>
      <footer className="knowledge-sheet-footer">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mic size={14} aria-hidden="true" />
          Live calls are not connected yet
        </p>
        <Button className="h-11 flex-1 rounded-full px-5 shadow-cta sm:flex-none" disabled>
          <Play aria-hidden="true" />
          Start {callModes.find((option) => option.value === mode)?.label}
        </Button>
      </footer>
    </Dialog.Content>
  )
}

export function ChallengeDetailsSheet({
  challenge,
  onClose,
}: {
  challenge?: Challenge
  onClose: () => void
}) {
  return (
    <Dialog.Root
      open={Boolean(challenge)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="knowledge-overlay" />
        {challenge && <ChallengeDetails key={challenge.id} challenge={challenge} />}
      </Dialog.Portal>
    </Dialog.Root>
  )
}
