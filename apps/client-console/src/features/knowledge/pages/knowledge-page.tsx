import { useState } from 'react'
import { BookOpen, CircleAlert, Loader2, Plus, RotateCcw, Search, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/ui-store'
import { AddKnowledgeDialog, KnowledgeDetailsSheet, KnowledgeList } from '../components'
import { useKnowledgeList } from '../hooks'
import { knowledgeStatus, knowledgeStatusLabels, type KnowledgeStatus } from '../services'
import '@/styles/knowledge.css'

type StatusFilter = 'all' | KnowledgeStatus

const filters: StatusFilter[] = ['all', 'ready', 'processing', 'failed']

export function KnowledgePage() {
  const knowledge = useKnowledgeList()
  const setPage = useUIStore((state) => state.setPage)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const entries = knowledge.data ?? []
  const countOf = (value: StatusFilter) =>
    value === 'all'
      ? entries.length
      : entries.filter((entry) => knowledgeStatus(entry) === value).length
  const search = query.trim().toLowerCase()
  const visible = entries.filter(
    (entry) =>
      (filter === 'all' || knowledgeStatus(entry) === filter) &&
      (!search ||
        entry.title.toLowerCase().includes(search) ||
        entry.fileMeta.name.toLowerCase().includes(search)),
  )

  return (
    <div className="animate-fade-in">
      <div className="page-heading">
        <div>
          <p className="section-label mb-3">Workspace</p>
          <h1>Knowledge Base</h1>
          {entries.length > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} · {countOf('ready')}{' '}
              ready
            </p>
          )}
        </div>
        <AddKnowledgeDialog>
          <Button className="h-11 rounded-full px-5 shadow-cta">
            <Plus aria-hidden="true" />
            Add knowledge
          </Button>
        </AddKnowledgeDialog>
      </div>
      {knowledge.isPending ? (
        <div role="status" className="empty-state mt-8 min-h-80 border-y border-border">
          <Loader2 size={22} className="animate-spin text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted-foreground">Loading knowledge...</p>
        </div>
      ) : knowledge.isError ? (
        <div className="empty-state mt-8 min-h-80 border-y border-border">
          <span className="icon-tile mb-4">
            <CircleAlert size={24} aria-hidden="true" />
          </span>
          <h2 className="text-base font-medium">Could not load knowledge</h2>
          <p role="alert" className="mt-2 max-w-md text-sm text-muted-foreground">
            {knowledge.error.message}
          </p>
          <Button
            variant="secondary"
            className="mt-6 h-11 rounded-full px-5"
            onClick={() => {
              void knowledge.refetch()
            }}
          >
            <RotateCcw aria-hidden="true" />
            Try again
          </Button>
        </div>
      ) : entries.length === 0 ? (
        <div className="empty-state mt-8 min-h-80 border-y border-border">
          <span className="icon-tile mb-4">
            <BookOpen size={24} aria-hidden="true" />
          </span>
          <h2 className="text-base font-medium">No knowledge items yet</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Optional. Add a PDF about your product to generate Knowledge-based Challenges.
          </p>
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
                aria-label="Search knowledge"
                placeholder="Search title or file name"
              />
            </div>
            <fieldset className="min-w-0">
              <legend className="sr-only">Filter by status</legend>
              <div className="knowledge-filter">
                {filters.map((value) => (
                  <label
                    key={value}
                    className="relative min-w-0 flex-1 cursor-pointer sm:flex-none"
                  >
                    <input
                      className="peer sr-only"
                      type="radio"
                      name="knowledge-status"
                      value={value}
                      checked={filter === value}
                      onChange={() => setFilter(value)}
                    />
                    <span className="flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-[13px] text-muted-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 sm:px-4 sm:text-sm">
                      {value === 'all' ? 'All' : knowledgeStatusLabels[value]}
                      <span className="hidden tabular-nums sm:inline">{countOf(value)}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <p role="status" className="sr-only">
            Showing {visible.length} of {entries.length}
          </p>
          {visible.length > 0 ? (
            <KnowledgeList entries={visible} onSelect={setSelectedId} />
          ) : (
            <div className="empty-state mt-5 border-y border-border">
              <span className="icon-tile mb-4">
                <SearchX size={24} aria-hidden="true" />
              </span>
              <h2 className="text-base font-medium">No matching knowledge</h2>
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
          )}
        </>
      )}
      <KnowledgeDetailsSheet
        entry={entries.find((entry) => entry.id === selectedId)}
        onClose={() => setSelectedId(null)}
        onGenerate={() => {
          setSelectedId(null)
          setPage('challenges')
        }}
      />
    </div>
  )
}
