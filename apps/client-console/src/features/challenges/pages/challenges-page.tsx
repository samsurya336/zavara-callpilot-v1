import { useState, type ReactNode } from 'react'
import {
  BookOpen,
  CircleAlert,
  Loader2,
  RotateCcw,
  Search,
  SearchX,
  Sparkles,
  Swords,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/ui-store'
import { ChallengeCard, ChallengeDetailsSheet, GenerateChallengeDialog } from '../components'
import { useChallenges } from '../hooks'
import type { Challenge, ChallengeCallType } from '../repositories'
import { callTypeLabels } from '../services'
import '@/styles/knowledge.css'
import '@/styles/challenges.css'

type FormatFilter = 'all' | ChallengeCallType

const filters: FormatFilter[] = ['all', 'ONE_ON_ONE', 'BOARDROOM']

function ChallengeSection({
  id,
  title,
  description,
  challenges,
  onSelect,
  empty,
}: {
  id: string
  title: string
  description: string
  challenges: Challenge[]
  onSelect: (id: string) => void
  empty: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="challenge-section">
      <div className="mb-5">
        <h2 id={id} className="flex items-baseline gap-2 text-lg font-semibold">
          {title}
          <span className="text-sm font-normal tabular-nums text-muted-foreground">
            {challenges.length}
          </span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {challenges.length > 0 ? (
        <ul className="challenge-grid">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} onSelect={onSelect} />
          ))}
        </ul>
      ) : (
        empty
      )}
    </section>
  )
}

export function ChallengesPage() {
  const challenges = useChallenges()
  const setPage = useUIStore((state) => state.setPage)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FormatFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const all = challenges.data ?? []
  const countOf = (value: FormatFilter) =>
    value === 'all' ? all.length : all.filter((item) => item.callType === value).length
  const search = query.trim().toLowerCase()
  const visible = all.filter(
    (item) =>
      (filter === 'all' || item.callType === filter) &&
      (!search ||
        [item.title, item.description, item.category, ...item.tags].some((text) =>
          text.toLowerCase().includes(search),
        )),
  )
  const open = visible.filter((item) => item.source === 'INTERNAL')
  const generated = visible.filter((item) => item.source === 'KNOWLEDGE_BASE')
  const hasGenerated = all.some((item) => item.source === 'KNOWLEDGE_BASE')
  const filtering = Boolean(search) || filter !== 'all'

  const clear = (
    <div className="empty-state border-y border-border">
      <span className="icon-tile mb-4">
        <SearchX size={24} aria-hidden="true" />
      </span>
      <h3 className="text-base font-medium">No matching challenges</h3>
      <Button
        variant="ghost"
        className="mt-4 h-11 rounded-full text-muted-foreground"
        onClick={() => {
          setQuery('')
          setFilter('all')
        }}
      >
        Clear filters
      </Button>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div className="page-heading">
        <div>
          <p className="section-label mb-3">Practice World</p>
          <h1>Challenges</h1>
          {all.length > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {all.length} {all.length === 1 ? 'challenge' : 'challenges'} · Simulated buyers and
              companies
            </p>
          )}
        </div>
        <GenerateChallengeDialog onOpenKnowledge={() => setPage('knowledge')}>
          <Button className="h-11 rounded-full px-5 shadow-cta">
            <Sparkles aria-hidden="true" />
            General Challenges
          </Button>
        </GenerateChallengeDialog>
      </div>
      {challenges.isPending ? (
        <div role="status" className="empty-state mt-8 min-h-80 border-y border-border">
          <Loader2 size={22} className="animate-spin text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted-foreground">Loading challenges...</p>
        </div>
      ) : challenges.isError ? (
        <div className="empty-state mt-8 min-h-80 border-y border-border">
          <span className="icon-tile mb-4">
            <CircleAlert size={24} aria-hidden="true" />
          </span>
          <h2 className="text-base font-medium">Could not load challenges</h2>
          <p role="alert" className="mt-2 max-w-md text-sm text-muted-foreground">
            {challenges.error.message}
          </p>
          <Button
            variant="secondary"
            className="mt-6 h-11 rounded-full px-5"
            onClick={() => {
              void challenges.refetch()
            }}
          >
            <RotateCcw aria-hidden="true" />
            Try again
          </Button>
        </div>
      ) : all.length === 0 ? (
        <div className="empty-state mt-8 min-h-80 border-y border-border">
          <span className="icon-tile mb-4">
            <Swords size={24} aria-hidden="true" />
          </span>
          <h2 className="text-base font-medium">No challenges available</h2>
        </div>
      ) : (
        <>
          <div className="knowledge-toolbar">
            <div className="knowledge-search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search challenges"
                placeholder="Search title, skill or category"
              />
            </div>
            <fieldset className="min-w-0">
              <legend className="sr-only">Filter by format</legend>
              <div className="knowledge-filter">
                {filters.map((value) => (
                  <label
                    key={value}
                    className="relative min-w-0 flex-1 cursor-pointer sm:flex-none"
                  >
                    <input
                      className="peer sr-only"
                      type="radio"
                      name="challenge-format-filter"
                      value={value}
                      checked={filter === value}
                      onChange={() => setFilter(value)}
                    />
                    <span className="flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-[13px] text-muted-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 sm:px-4 sm:text-sm">
                      {value === 'all' ? 'All' : callTypeLabels[value]}
                      <span className="hidden tabular-nums sm:inline">{countOf(value)}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <p role="status" className="sr-only">
            Showing {visible.length} of {all.length}
          </p>
          <ChallengeSection
            id="open-challenges-heading"
            title="Open Challenges"
            description="Ready-made scenarios with a fictional product brief. No knowledge needed."
            challenges={open}
            onSelect={setSelectedId}
            empty={clear}
          />
          <ChallengeSection
            id="knowledge-challenges-heading"
            title="Knowledge-based Challenges"
            description="Generated from your own product knowledge."
            challenges={generated}
            onSelect={setSelectedId}
            empty={
              hasGenerated && filtering ? (
                clear
              ) : (
                <div className="empty-state border-y border-border">
                  <span className="icon-tile mb-4">
                    <BookOpen size={24} aria-hidden="true" />
                  </span>
                  <h3 className="text-base font-medium">No Knowledge-based Challenges yet</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Optional. Add product knowledge, then use General Challenges to practise what
                    you actually sell.
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-6 h-11 rounded-full px-5"
                    onClick={() => setPage('knowledge')}
                  >
                    <BookOpen aria-hidden="true" />
                    Open Knowledge Base
                  </Button>
                </div>
              )
            }
          />
        </>
      )}
      <ChallengeDetailsSheet
        challenge={all.find((item) => item.id === selectedId)}
        onClose={() => setSelectedId(null)}
      />
    </div>
  )
}
