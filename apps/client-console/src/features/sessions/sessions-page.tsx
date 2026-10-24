import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  GitBranch,
  MessageSquareText,
  RotateCcw,
  Target,
  UsersRound,
} from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/hooks'
import { challengeRepository } from '@/features/challenges/repositories'
import { openTimeMachineCall } from '@/features/challenges/time-machine-store'
import { listSessions, type SavedTurn, type SessionRecord } from './repository'
import type { CallReport, ReportImprovement } from './types'

type DetailTab = 'overview' | 'report' | 'transcript'
const humanize = (value: string) =>
  value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (letter) => letter.toUpperCase())
const duration = (seconds: number | null) =>
  `${Math.floor((seconds ?? 0) / 60)}m ${String((seconds ?? 0) % 60).padStart(2, '0')}s`
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(value),
      )
    : 'Not recorded'
const turnTime = (seconds: number | null) => {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return 'Time unavailable'
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

function Status({ value, report = false }: { value: string; report?: boolean }) {
  return (
    <span
      className="session-pill"
      data-status={value.toLowerCase()}
      data-report={report || undefined}
    >
      <i />
      {humanize(value)}
    </span>
  )
}

function Improvement({
  item,
  turns,
  onTimeMachine,
}: {
  item: ReportImprovement
  turns: SavedTurn[]
  onTimeMachine?: (turnId: string) => void
}) {
  const evidence = turns.filter((turn) => item.turnIds.includes(turn.id))
  const retryTurn =
    turns.find((turn) => turn.id === item.retryTurnId && turn.speaker === 'user') ??
    evidence.find((turn) => turn.speaker === 'user')
  return (
    <article className="report-focus-card">
      <header>
        <span>
          <Target size={18} />
        </span>
        <div>
          <p className="section-label">Priority improvement</p>
          <h3>{item.title}</h3>
        </div>
      </header>
      {evidence.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">The moment:</span>
          {evidence.map((turn) =>
            turn.speaker === 'user' && onTimeMachine ? (
              <Button
                key={turn.id}
                variant="secondary"
                size="sm"
                aria-label={`Open Time Machine at ${turnTime(turn.timeInCallSecs)}`}
                onClick={() => onTimeMachine(turn.id)}
              >
                <RotateCcw size={14} />
                {turnTime(turn.timeInCallSecs)} · You
              </Button>
            ) : (
              <span key={turn.id} className="text-sm text-muted-foreground">
                {turnTime(turn.timeInCallSecs)} · {turn.speaker === 'user' ? 'You' : 'Buyer'}
              </span>
            ),
          )}
        </div>
      )}
      {item.quote && <blockquote>“{item.quote}”</blockquote>}
      <div className="report-coaching-grid">
        <div>
          <small>What to change</small>
          <p>{item.whatToChange}</p>
        </div>
        <div>
          <small>Why it matters</small>
          <p>{item.whyItMatters}</p>
        </div>
        <div className="report-try">
          <small>Try this next</small>
          <p>{item.tryThis}</p>
          {item.exampleResponse && <strong>“{item.exampleResponse}”</strong>}
        </div>
      </div>
      {retryTurn && onTimeMachine && (
        <Button className="time-machine-button" onClick={() => onTimeMachine(retryTurn.id)}>
          <RotateCcw size={16} />
          Try a different answer · {turnTime(retryTurn.timeInCallSecs)}
          <ArrowRight size={16} />
        </Button>
      )}
      {evidence.length > 0 && (
        <details className="report-evidence">
          <summary>View conversation evidence</summary>
          {evidence.map((turn) => (
            <p key={turn.id}>
              <b>
                {turnTime(turn.timeInCallSecs)} · {turn.speaker === 'user' ? 'You' : 'Buyer'}:
              </b>{' '}
              {turn.text}
            </p>
          ))}
        </details>
      )}
    </article>
  )
}

function PerformanceChart({
  report,
  branchCount,
  reportStatus,
}: {
  report: CallReport
  branchCount: number
  reportStatus: string
}) {
  const improvementCount = (report.priorityImprovement ? 1 : 0) + report.moreImprovements.length
  const skillColours = ['#63a7ff', '#8b8df8', '#36c6b4', '#f5b84b', '#df77c8']
  const data = [
    ...report.skills.map((skill, index) => ({
      name: skill.label,
      value: skill.score ?? 0.35,
      display: skill.score === null ? 'Not scored' : `${skill.score}/5`,
      color: skillColours[index % skillColours.length],
    })),
    {
      name: 'Improvement moments',
      value: Math.max(improvementCount, 0.35),
      display: String(improvementCount),
      color: '#f5b84b',
    },
    {
      name: 'Time Machine uses',
      value: Math.max(branchCount, 0.35),
      display: String(branchCount),
      color: '#8b8df8',
    },
    {
      name: 'Report status',
      value: 1,
      display: humanize(reportStatus),
      color: reportStatus === 'READY' ? '#49d6ad' : '#ff7f91',
    },
  ]
  return (
    <section className="report-chart-card glass">
      <header>
        <div>
          <p className="section-label">Performance</p>
          <h2>Call performance at a glance</h2>
        </div>
        <small>AI practice feedback · 1–5 skill scale</small>
      </header>
      <div className="report-chart-layout">
        <div className="report-ring" aria-label="Call performance chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="68%"
                outerRadius="92%"
                paddingAngle={2}
                stroke="none"
                isAnimationActive
                animationDuration={650}
              >
                {data.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(_value, _name, item) => item.payload.display}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--popover)',
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="report-ring-center">
            <strong>{report.overall.score ?? '—'}</strong>
            <span>Overall</span>
          </div>
        </div>
        <div className="report-chart-legend">
          {data.map((entry) => (
            <div key={entry.name}>
              <i style={{ background: entry.color }} />
              <span>{entry.name}</span>
              <strong>{entry.display}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ReportView({
  report,
  turns,
  branchCount = 0,
  reportStatus = 'READY',
  onTimeMachine,
}: {
  report: CallReport
  turns: SavedTurn[]
  branchCount?: number
  reportStatus?: string
  onTimeMachine?: (turnId: string) => void
}) {
  return (
    <div className="session-report-view">
      <section className="report-summary-card glass">
        <div>
          <p className="section-label">
            {report.evidence.level === 'FULL' ? 'Complete feedback' : 'Partial feedback'}
          </p>
          <h2>{report.outcome.label}</h2>
          <p>{report.summary}</p>
          <small>{report.outcome.explanation}</small>
        </div>
        <div className="report-score">
          <strong>{report.overall.score ?? '—'}</strong>
          <span>{report.overall.score === null ? 'Not scored' : 'out of 100'}</span>
          <em>{report.overall.label}</em>
        </div>
      </section>
      {report.evidence.note && (
        <div className="report-note">
          <Clock3 size={17} />
          <p>{report.evidence.note}</p>
        </div>
      )}
      {report.priorityImprovement && (
        <Improvement
          item={report.priorityImprovement}
          turns={turns}
          onTimeMachine={onTimeMachine}
        />
      )}
      <PerformanceChart report={report} branchCount={branchCount} reportStatus={reportStatus} />
      <div className="report-detail-grid">
        {report.strengths.length > 0 && (
          <section className="report-section glass">
            <p className="section-label">Keep doing this</p>
            {report.strengths.map((item) => (
              <div className="report-strength" key={item.turnId + item.title}>
                <CheckCircle2 size={18} />
                <p>
                  <strong>{item.title}</strong>
                  <span>{item.reason}</span>
                </p>
              </div>
            ))}
          </section>
        )}
        <section className="report-next glass">
          <RotateCcw />
          <div>
            <p className="section-label">Next practice step</p>
            <h3>{report.nextStep.label}</h3>
          </div>
        </section>
      </div>
      {(report.moreImprovements.length > 0 || report.stakeholders || report.productChecks) && (
        <section className="report-accordions">
          {report.moreImprovements.length > 0 && (
            <details>
              <summary>
                More improvements <span>{report.moreImprovements.length}</span>
              </summary>
              {report.moreImprovements.map((item) => (
                <Improvement
                  key={item.title}
                  item={item}
                  turns={turns}
                  onTimeMachine={onTimeMachine}
                />
              ))}
            </details>
          )}
          {report.stakeholders && (
            <details>
              <summary>
                Boardroom feedback <span>{report.stakeholders.length}</span>
              </summary>
              {report.stakeholders.map((person) => (
                <article key={person.participantId}>
                  <h3>{person.name}</h3>
                  <p>
                    <b>Main concern:</b> {person.mainConcern}
                  </p>
                  <p>
                    <b>Addressed:</b> {person.addressed}
                  </p>
                  <p>
                    <b>Still open:</b> {person.stillOpen}
                  </p>
                </article>
              ))}
            </details>
          )}
          {report.productChecks && (
            <details>
              <summary>
                Product fact checks <span>{report.productChecks.length}</span>
              </summary>
              {report.productChecks.map((check, index) => (
                <article key={index}>
                  <Status value={check.verdict} />
                  <p>
                    <b>{check.claim}</b>
                  </p>
                  <p>{check.explanation}</p>
                </article>
              ))}
            </details>
          )}
        </section>
      )}
    </div>
  )
}

function Overview({ item, all }: { item: SessionRecord; all: SessionRecord[] }) {
  const parent = all.find((session) => session.id === item.parent_session_id)
  const branches = all.filter((session) => session.parent_session_id === item.id)
  return (
    <div className="session-overview-grid">
      <section className="session-info-card glass">
        <header>
          <FileText />
          <div>
            <p className="section-label">Challenge</p>
            <h3>{item.title}</h3>
          </div>
        </header>
        <p className="session-description">
          {item.description || 'No challenge description available.'}
        </p>
        <dl>
          <div>
            <dt>Type</dt>
            <dd>{humanize(item.callType)}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{item.category}</dd>
          </div>
          <div>
            <dt>Difficulty</dt>
            <dd>{humanize(item.difficulty)}</dd>
          </div>
          <div>
            <dt>Mode</dt>
            <dd>{humanize(item.mode)}</dd>
          </div>
        </dl>
        {item.objective && (
          <div className="session-objective">
            <Target size={17} />
            <p>
              <b>Objective</b>
              {item.objective}
            </p>
          </div>
        )}
      </section>
      <section className="session-info-card glass">
        <header>
          <UsersRound />
          <div>
            <p className="section-label">Participants</p>
            <h3>
              {item.participants.length} buyer persona{item.participants.length === 1 ? '' : 's'}
            </h3>
          </div>
        </header>
        <div className="participant-stack">
          {item.participants.length ? (
            item.participants.map((person) => (
              <article key={person.id}>
                <div className="participant-avatar">{person.name.charAt(0)}</div>
                <div>
                  <strong>{person.name}</strong>
                  <span>
                    {person.designation}
                    {person.company ? ` · ${person.company}` : ''}
                  </span>
                  <small>
                    {person.communicationStyle} · {person.decisionAuthority}
                  </small>
                </div>
              </article>
            ))
          ) : (
            <p className="session-description">No participant details available.</p>
          )}
        </div>
      </section>
      <section className="session-info-card session-call-card glass">
        <header>
          <Clock3 />
          <div>
            <p className="section-label">Session information</p>
            <h3>{item.parent_session_id ? 'Time Machine branch' : 'Original call'}</h3>
          </div>
        </header>
        <dl>
          <div>
            <dt>Owner</dt>
            <dd>{item.ownerName}</dd>
          </div>
          <div>
            <dt>Started</dt>
            <dd>{date(item.started_at ?? item.created_at)}</dd>
          </div>
          <div>
            <dt>Ended</dt>
            <dd>{date(item.ended_at)}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{duration(item.duration_seconds)}</dd>
          </div>
          <div>
            <dt>Call status</dt>
            <dd>
              <Status value={item.status} />
            </dd>
          </div>
          <div>
            <dt>Report</dt>
            <dd>
              <Status value={item.report_status} report />
            </dd>
          </div>
        </dl>
      </section>
      {(parent || branches.length > 0) && (
        <section className="session-family glass">
          <header>
            <GitBranch />
            <div>
              <p className="section-label">Time Machine</p>
              <h3>Related attempts</h3>
            </div>
          </header>
          {parent && (
            <p>
              Original: <strong>{parent.title}</strong> · branch from {item.branch_from_turn_id}
            </p>
          )}
          {branches.map((branch) => (
            <p key={branch.id}>
              Branch: <strong>{date(branch.created_at)}</strong> · {humanize(branch.report_status)}
            </p>
          ))}
        </section>
      )}
    </div>
  )
}

function Transcript({ item }: { item: SessionRecord }) {
  const participants = new Map(item.participants.map((person) => [person.id, person.name]))
  if (!item.transcript.length)
    return (
      <div className="session-empty">
        <MessageSquareText />
        <h2>No transcript available</h2>
        <p>The voice service did not save any conversation turns.</p>
      </div>
    )
  return (
    <section className="transcript-panel glass">
      <header>
        <div>
          <p className="section-label">Conversation</p>
          <h2>{item.transcript.length} transcript turns</h2>
        </div>
        <span>{duration(item.duration_seconds)}</span>
      </header>
      <ol>
        {[...item.transcript]
          .sort((a, b) => a.order - b.order)
          .map((turn) => {
            const isUser = turn.speaker === 'user'
            const speaker = isUser ? 'You' : (participants.get(turn.participantId ?? '') ?? 'Buyer')
            return (
              <li
                key={turn.id}
                id={`transcript-${turn.id}`}
                data-speaker={isUser ? 'user' : 'agent'}
              >
                <div>
                  <strong>{speaker}</strong>
                  <time>{turnTime(turn.timeInCallSecs)}</time>
                </div>
                <p>{turn.text.replace(/^<[^>]+>/, '')}</p>
              </li>
            )
          })}
      </ol>
    </section>
  )
}

function SessionDetail({
  item,
  all,
  onBack,
  onRetry,
  retrying,
}: {
  item: SessionRecord
  all: SessionRecord[]
  onBack: () => void
  onRetry: () => void
  retrying: boolean
}) {
  const [tab, setTab] = useState<DetailTab>('overview')
  const openTimeMachine = (turnId: string) => {
    if (!item.transcript.some((turn) => turn.id === turnId && turn.speaker === 'user')) return
    openTimeMachineCall({ parentSessionId: item.id, branchFromTurnId: turnId })
  }
  return (
    <div className="session-detail-page animate-fade-in">
      <button className="session-back" onClick={onBack}>
        <ArrowLeft size={17} /> Back to sessions
      </button>
      <header className="session-detail-header">
        <div>
          <p className="section-label">Call details</p>
          <h1>{item.title}</h1>
          <p>
            {date(item.started_at ?? item.created_at)} · {duration(item.duration_seconds)}
          </p>
        </div>
        <div>
          <Status value={item.status} />
          <Status value={item.report_status} report />
        </div>
      </header>
      <nav className="session-tabs" role="tablist" aria-label="Session details">
        {(['overview', 'report', 'transcript'] as const).map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
          >
            {humanize(value)}
          </button>
        ))}
      </nav>
      <div className="session-tab-content" role="tabpanel">
        {tab === 'overview' && <Overview item={item} all={all} />}
        {tab === 'report' &&
          (item.report_status === 'READY' && item.report ? (
            <ReportView
              report={item.report}
              turns={item.transcript}
              branchCount={all.filter((session) => session.parent_session_id === item.id).length}
              reportStatus={item.report_status}
              onTimeMachine={openTimeMachine}
            />
          ) : (
            <div className="session-empty glass">
              <FileText />
              <h2>
                {item.report_status === 'FAILED'
                  ? 'Report could not be generated'
                  : 'Report is not ready yet'}
              </h2>
              <p>Your saved transcript remains available while the report is prepared.</p>
              <Button disabled={retrying} onClick={onRetry}>
                {retrying ? 'Requesting…' : 'Check and retry report'}
              </Button>
            </div>
          ))}
        {tab === 'transcript' && <Transcript item={item} />}
      </div>
    </div>
  )
}

function SessionTable({ items, onOpen }: { items: SessionRecord[]; onOpen: (id: string) => void }) {
  return (
    <div className="session-table-shell glass">
      <table className="session-table">
        <thead>
          <tr>
            <th>Session</th>
            <th>Participants</th>
            <th>Started</th>
            <th>Duration</th>
            <th>Call status</th>
            <th>Report</th>
            <th>
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              tabIndex={0}
              onClick={() => onOpen(item.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onOpen(item.id)
                }
              }}
            >
              <td>
                <strong>{item.title}</strong>
                <small>
                  {humanize(item.callType)} · {humanize(item.mode)}
                </small>
              </td>
              <td>
                <span>
                  {item.participants.map((person) => person.name).join(', ') || 'No buyer saved'}
                </span>
                <small>{item.ownerName}</small>
              </td>
              <td>{date(item.started_at ?? item.created_at)}</td>
              <td>{duration(item.duration_seconds)}</td>
              <td>
                <Status value={item.status} />
              </td>
              <td>
                <Status value={item.report_status} report />
              </td>
              <td>
                <ArrowRight size={17} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SessionsPage() {
  const { session } = useAuth()
  const user = session?.user
  const [selected, setSelected] = useState<string | null>(null)
  const sessions = useQuery({
    queryKey: ['sessions', user?.id],
    queryFn: listSessions,
    enabled: Boolean(user),
    refetchInterval: 3_000,
  })
  const retry = useMutation({
    mutationFn: challengeRepository.endCall,
    onSuccess: () => void sessions.refetch(),
  })
  const current = sessions.data?.find((item) => item.id === selected)
  if (sessions.isPending)
    return (
      <div className="session-empty" role="status">
        <Clock3 />
        <h2>Loading sessions…</h2>
      </div>
    )
  if (sessions.isError)
    return (
      <div className="session-empty" role="alert">
        <h2>Could not load sessions</h2>
        <p>{sessions.error.message}</p>
        <Button onClick={() => void sessions.refetch()}>Try again</Button>
      </div>
    )
  if (current)
    return (
      <SessionDetail
        key={current.id}
        item={current}
        all={sessions.data ?? []}
        onBack={() => setSelected(null)}
        onRetry={() => retry.mutate(current.id)}
        retrying={retry.isPending}
      />
    )
  return (
    <div className="sessions-page animate-fade-in">
      <header className="sessions-heading">
        <div>
          <p className="section-label">Practice World</p>
          <h1>My Sessions</h1>
          <p>Review every practice call, transcript and coaching report.</p>
        </div>
        <div className="sessions-count">
          <strong>{sessions.data?.length ?? 0}</strong>
          <span>Total calls</span>
        </div>
      </header>
      {sessions.data?.length ? (
        <SessionTable items={sessions.data} onOpen={setSelected} />
      ) : (
        <div className="session-empty">
          <Clock3 />
          <h2>No sessions yet</h2>
          <p>Start a challenge to create your first practice call.</p>
        </div>
      )}
    </div>
  )
}
