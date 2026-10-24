import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks'
import { challengeRepository } from '@/features/challenges/repositories'
import { listSessions, type SavedTurn } from './repository'
import type { CallReport, ReportImprovement } from './types'

function Improvement({ item, turns }: { item: ReportImprovement; turns: SavedTurn[] }) {
  return (
    <article className="space-y-3 border-t border-border py-5">
      <h3 className="font-semibold">{item.title}</h3>
      {item.quote && (
        <blockquote className="border-l-2 border-primary pl-4 text-muted-foreground">
          “{item.quote}”
        </blockquote>
      )}
      <p>{item.whatToChange}</p>
      <p className="text-muted-foreground">{item.whyItMatters}</p>
      <p>
        <strong>Try this: </strong>
        {item.tryThis}
      </p>
      {item.exampleResponse && (
        <blockquote className="rounded-xl bg-muted p-4">“{item.exampleResponse}”</blockquote>
      )}
      <details>
        <summary className="cursor-pointer font-medium">View conversation evidence</summary>
        {turns
          .filter((turn) => item.turnIds.includes(turn.id))
          .map((turn) => (
            <p key={turn.id} className="mt-3">
              <strong>{turn.speaker === 'user' ? 'You' : 'Buyer'}: </strong>
              {turn.text}
            </p>
          ))}
      </details>
    </article>
  )
}

export function ReportView({ report, turns }: { report: CallReport; turns: SavedTurn[] }) {
  return (
    <div className="space-y-6 text-sm leading-relaxed">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {report.evidence.level === 'FULL' ? 'Call feedback' : 'Partial feedback'}
        </p>
        <h3 className="font-display text-2xl font-semibold">{report.outcome.label}</h3>
        <p>{report.summary}</p>
        <p>{report.outcome.explanation}</p>
        {report.evidence.note && <p className="rounded-xl bg-muted p-4">{report.evidence.note}</p>}
        <p className="text-lg font-semibold">
          {report.overall.score === null
            ? 'Not enough evidence'
            : `${report.overall.score}/100 · ${report.overall.label}`}
        </p>
        <p className="text-muted-foreground">{report.overall.explanation}</p>
        <p className="text-xs text-muted-foreground">
          AI practice feedback · Simulated buyer outcome
        </p>
      </section>
      {report.priorityImprovement && (
        <section>
          <h2 className="text-lg font-semibold">Focus on this first</h2>
          <Improvement item={report.priorityImprovement} turns={turns} />
        </section>
      )}
      {report.strengths.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Keep doing this</h2>
          {report.strengths.map((item) => (
            <p key={item.turnId + item.title} className="mb-3">
              <strong>{item.title}. </strong>
              {item.reason}
            </p>
          ))}
        </section>
      )}
      <details className="border-t border-border pt-4">
        <summary className="cursor-pointer font-semibold">Skill breakdown and scoring</summary>
        <p className="my-3 text-muted-foreground">
          1 = not shown, 2 = weak, 3 = adequate, 4 = strong, 5 = excellent. Skills without enough
          evidence are unscored.
        </p>
        {report.skills.map((skill) => (
          <p className="my-3" key={skill.key}>
            <strong>
              {skill.label} · {skill.score === null ? 'Not enough evidence' : `${skill.score}/5`}
            </strong>
            <br />
            {skill.reason}
          </p>
        ))}
      </details>
      {report.moreImprovements.length > 0 && (
        <details>
          <summary className="cursor-pointer font-semibold">Other improvements</summary>
          {report.moreImprovements.map((item) => (
            <Improvement key={item.title} item={item} turns={turns} />
          ))}
        </details>
      )}
      {report.stakeholders && (
        <details>
          <summary className="cursor-pointer font-semibold">Boardroom feedback</summary>
          {report.stakeholders.map((person) => (
            <div className="mt-4 space-y-2" key={person.participantId}>
              <h3 className="font-semibold">{person.name}</h3>
              <p>Concern: {person.mainConcern}</p>
              <p>Addressed: {person.addressed}</p>
              <p>Still open: {person.stillOpen}</p>
            </div>
          ))}
        </details>
      )}
      {report.productChecks && (
        <details>
          <summary className="cursor-pointer font-semibold">Product fact checks</summary>
          {report.productChecks.map((check, index) => (
            <p className="mt-4" key={index}>
              <strong>{check.verdict}: </strong>
              {check.claim}
              <br />
              {check.explanation}
            </p>
          ))}
        </details>
      )}
      <section className="rounded-xl bg-muted p-5">
        <h2 className="mb-2 font-semibold">Your next practice step</h2>
        <p>{report.nextStep.label}</p>
      </section>
      <details>
        <summary className="cursor-pointer font-semibold">View full transcript</summary>
        {turns.map((turn) => (
          <p className="mt-3" key={turn.id}>
            <strong>
              {Math.floor(turn.timeInCallSecs / 60)}:
              {String(Math.floor(turn.timeInCallSecs % 60)).padStart(2, '0')} ·{' '}
              {turn.speaker === 'user' ? 'You' : 'Buyer'}:{' '}
            </strong>
            {turn.text}
          </p>
        ))}
      </details>
    </div>
  )
}

export function SessionsPage() {
  const { session } = useAuth()
  const user = session?.user
  const [selected, setSelected] = useState<string | null>(null)
  const sessions = useQuery({
    queryKey: ['sessions', user?.id],
    queryFn: () => listSessions(user!.id),
    enabled: Boolean(user),
    refetchInterval: 3_000,
  })
  const retry = useMutation({
    mutationFn: challengeRepository.endCall,
    onSuccess: () => {
      void sessions.refetch()
    },
  })
  const current = sessions.data?.find((session) => session.id === selected)
  return (
    <div className="animate-fade-in mx-auto max-w-4xl">
      <div className="page-heading">
        <div>
          <p className="section-label mb-3">Practice World</p>
          <h1>{current ? current.title : 'My Sessions'}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your calls, transcripts and coaching reports
          </p>
        </div>
        {current && (
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Back to sessions
          </Button>
        )}
      </div>
      {sessions.isPending && <p role="status">Loading sessions…</p>}
      {sessions.isError && (
        <div role="alert">
          <p>Could not load sessions.</p>
          <Button onClick={() => void sessions.refetch()}>Try again</Button>
        </div>
      )}
      {retry.isError && <p role="alert">Could not request the report. Please try again.</p>}
      {current ? (
        <>
          <p className="mb-6 text-sm text-muted-foreground">
            {new Date(current.created_at).toLocaleString()} · {current.mode} · {current.status} ·{' '}
            {current.duration_seconds ?? 0}s
          </p>
          {current.report_status === 'READY' && current.report ? (
            <ReportView report={current.report} turns={current.transcript} />
          ) : current.status === 'CANCELLED' ? (
            <p>The call ended before it connected, so there is no conversation to review.</p>
          ) : (
            <section className="space-y-4 rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold">
                {current.report_status === 'FAILED'
                  ? 'Report could not be generated'
                  : 'Preparing your report'}
              </h2>
              <p>
                The transcript is saved when the voice service finishes processing. You can leave
                this page and return later.
              </p>
              <Button disabled={retry.isPending} onClick={() => retry.mutate(current.id)}>
                {retry.isPending ? 'Requested…' : 'Check and retry report'}
              </Button>
            </section>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {sessions.data?.length === 0 && (
            <p className="py-12 text-muted-foreground">
              No sessions yet. Start a challenge to practise.
            </p>
          )}
          {sessions.data?.map((session) => (
            <button
              key={session.id}
              className="flex w-full items-center justify-between gap-4 rounded-xl border border-border p-5 text-left hover:bg-muted"
              onClick={() => setSelected(session.id)}
            >
              <span>
                <strong>{session.title}</strong>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {new Date(session.created_at).toLocaleString()} · {session.mode} ·{' '}
                  {session.duration_seconds ?? 0}s
                </span>
              </span>
              <span className="text-sm">
                {session.report_status === 'READY'
                  ? 'View report →'
                  : session.report_status === 'FAILED'
                    ? 'Retry report'
                    : session.status === 'CANCELLED'
                      ? 'Not connected'
                      : 'Processing…'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
