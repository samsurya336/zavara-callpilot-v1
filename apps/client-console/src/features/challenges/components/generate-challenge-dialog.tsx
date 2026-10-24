import { useState, type FormEvent, type ReactNode } from 'react'
import { Dialog } from 'radix-ui'
import { Loader2, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useKnowledgeList } from '@/features/knowledge'
import { knowledgeStatus } from '@/features/knowledge/services'
import { useGenerateChallenge } from '../hooks'
import type { ChallengeDifficulty } from '../repositories'
import { difficultyLabels } from '../services'
import '@/styles/auth.css'

const GOAL_MAX_LENGTH = 240

function Segmented<Value extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string
  name: string
  value: Value
  options: { value: Value; label: string }[]
  onChange: (value: Value) => void
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-[9px] text-[13px] font-semibold">{legend}</legend>
      <div className="knowledge-filter challenge-segment">
        {options.map((option) => (
          <label key={option.value} className="relative min-w-0 flex-1 cursor-pointer">
            <input
              className="peer sr-only"
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="flex min-h-11 items-center justify-center rounded-full px-3 text-sm text-muted-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function GenerateChallengeDialog({
  children,
  onOpenKnowledge,
}: {
  children: ReactNode
  onOpenKnowledge: () => void
}) {
  const knowledge = useKnowledgeList()
  const generate = useGenerateChallenge()
  const [open, setOpen] = useState(false)
  const [knowledgeId, setKnowledgeId] = useState('')
  const [difficulty, setDifficulty] = useState<ChallengeDifficulty | 'ANY'>('ANY')
  const [goal, setGoal] = useState('')

  const ready = (knowledge.data ?? []).filter((entry) => knowledgeStatus(entry) === 'ready')

  const changeOpen = (next: boolean) => {
    if (generate.isPending) return
    if (next) {
      generate.reset()
      if (!ready.some((entry) => entry.id === knowledgeId)) setKnowledgeId(ready[0]?.id ?? '')
    }
    setOpen(next)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!knowledgeId) return
    generate.mutate(
      {
        knowledgeId,
        difficulty: difficulty === 'ANY' ? null : difficulty,
        goal: goal.trim(),
      },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="knowledge-overlay" />
        <Dialog.Content className="knowledge-dialog glass-sheet animate-fade-in">
          <Dialog.Title className="knowledge-dialog-title pr-14">General Challenges</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm text-muted-foreground">
            Creates three Knowledge-based Challenges from one ready knowledge entry: two One-on-One
            calls and one Boardroom with a CEO, CTO and CFO.
          </Dialog.Description>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="knowledge-dialog-close size-11 rounded-full"
              aria-label="Close"
              title="Close"
              disabled={generate.isPending}
            >
              <X aria-hidden="true" />
            </Button>
          </Dialog.Close>
          {knowledge.isPending ? (
            <p role="status" className="knowledge-note mt-7">
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              Loading knowledge...
            </p>
          ) : ready.length === 0 ? (
            <div className="mt-7">
              <p className="knowledge-note">
                You need at least one ready knowledge entry. Open Challenges stay available without
                it.
              </p>
              <div className="knowledge-dialog-actions mt-7">
                <Dialog.Close asChild>
                  <Button variant="ghost" className="h-12 rounded-full px-5">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  className="h-12 rounded-full px-6 shadow-cta"
                  onClick={() => {
                    setOpen(false)
                    onOpenKnowledge()
                  }}
                >
                  Go to Knowledge Base
                </Button>
              </div>
            </div>
          ) : (
            <form className="mt-7" onSubmit={submit} aria-label="Generate challenges">
              <fieldset className="auth-fields" disabled={generate.isPending}>
                <div>
                  <label htmlFor="challenge-knowledge">Knowledge</label>
                  <select
                    id="challenge-knowledge"
                    required
                    className="auth-input challenge-select"
                    value={knowledgeId}
                    onChange={(event) => setKnowledgeId(event.target.value)}
                  >
                    {ready.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.title}
                      </option>
                    ))}
                  </select>
                </div>
                <Segmented<ChallengeDifficulty | 'ANY'>
                  legend="Difficulty"
                  name="challenge-difficulty"
                  value={difficulty}
                  onChange={setDifficulty}
                  options={[
                    { value: 'ANY' as const, label: 'Any' },
                    ...(['EASY', 'MEDIUM', 'HARD'] as const).map((value) => ({
                      value,
                      label: difficultyLabels[value],
                    })),
                  ]}
                />
                <div>
                  <label htmlFor="challenge-goal">
                    Goal <span className="font-normal text-muted-foreground">(optional)</span>
                  </label>
                  <textarea
                    id="challenge-goal"
                    rows={3}
                    maxLength={GOAL_MAX_LENGTH}
                    className="auth-input challenge-textarea"
                    placeholder="e.g. Book a pilot with the operations lead"
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                  />
                </div>
                {generate.error && (
                  <p role="alert" className="auth-error">
                    {generate.error.message}
                  </p>
                )}
                <div className="knowledge-dialog-actions">
                  <Dialog.Close asChild>
                    <Button type="button" variant="ghost" className="h-12 rounded-full px-5">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button type="submit" className="h-12 rounded-full px-6 shadow-cta">
                    {generate.isPending ? (
                      <Loader2 className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkles aria-hidden="true" />
                    )}
                    {generate.isPending ? 'Starting...' : 'Generate 3 challenges'}
                  </Button>
                </div>
              </fieldset>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
