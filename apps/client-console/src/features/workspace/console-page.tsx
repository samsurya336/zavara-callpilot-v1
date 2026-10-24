import {
  ArrowUpRight,
  BookOpen,
  Building2,
  History,
  Monitor,
  Moon,
  Sun,
  Swords,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChallengesPage } from '@/features/challenges'
import { SessionsPage } from '@/features/sessions/sessions-page'
import { KnowledgePage } from '@/features/knowledge'
import { useUIStore, type Page, type Theme } from '@/stores/ui-store'

export const pageTitles: Record<Page, string> = {
  overview: 'Dashboard',
  knowledge: 'Knowledge Base',
  challenges: 'Challenges',
  clients: 'Clients',
  sessions: 'My Sessions',
  settings: 'Settings',
}

const destinations: { page: Page; title: string; icon: LucideIcon; eyebrow: string }[] = [
  { page: 'challenges', title: 'Challenges', icon: Swords, eyebrow: 'Practice World' },
  { page: 'clients', title: 'Clients', icon: Building2, eyebrow: 'Practice World' },
  { page: 'knowledge', title: 'Knowledge Base', icon: BookOpen, eyebrow: 'Workspace' },
]

function Overview() {
  const setPage = useUIStore((state) => state.setPage)
  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
  return (
    <div className="animate-fade-in">
      <div className="page-heading">
        <div>
          <p className="section-label mb-3">Dashboard</p>
          <h1>My overview</h1>
          <p className="mt-3 text-sm text-muted-foreground">{today}</p>
        </div>
        <Button className="h-11 rounded-full px-5 shadow-cta" onClick={() => setPage('challenges')}>
          <Swords aria-hidden="true" />
          View challenges
        </Button>
      </div>
      <section aria-label="Practice statistics" className="statistics">
        {[
          { label: 'Completed sessions', value: '0', detail: 'All time' },
          { label: 'Practice time', value: '0 min', detail: 'All time' },
          { label: 'Average score', value: 'Not scored', detail: 'Completed sessions' },
        ].map(({ label, value, detail }) => (
          <div key={label} className="statistic">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-3 font-display text-[28px] font-semibold leading-tight">{value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
          </div>
        ))}
      </section>
      <section aria-labelledby="workspace-heading" className="mt-10">
        <h2 id="workspace-heading" className="mb-5 text-lg font-semibold">
          Your workspace
        </h2>
        <div className="destination-grid">
          {destinations.map(({ page, title, icon: Icon, eyebrow }) => (
            <button key={page} className="destination glass" onClick={() => setPage(page)}>
              <div className="mb-8 flex items-center justify-between">
                <span className="icon-tile">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <ArrowUpRight size={18} className="text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="mb-2 text-xs text-muted-foreground">{eyebrow}</p>
              <h3 className="text-base font-semibold">{title}</h3>
            </button>
          ))}
        </div>
      </section>
      <section aria-labelledby="sessions-heading" className="mt-10">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id="sessions-heading" className="text-lg font-semibold">
            Recent sessions
          </h2>
          <Button
            variant="ghost"
            className="h-11 rounded-full text-muted-foreground"
            onClick={() => setPage('sessions')}
          >
            View all
            <ArrowUpRight aria-hidden="true" />
          </Button>
        </div>
        <div className="empty-state border-y border-border">
          <span className="icon-tile mb-4">
            <History size={24} aria-hidden="true" />
          </span>
          <h3 className="text-base font-medium">No sessions yet</h3>
        </div>
      </section>
    </div>
  )
}

function Appearance() {
  const theme = useUIStore((state) => state.theme)
  const setTheme = useUIStore((state) => state.setTheme)
  const options: { value: Theme; label: string; icon: LucideIcon }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]
  return (
    <section className="mt-10 border-t border-border py-7" aria-labelledby="appearance-title">
      <h2 id="appearance-title" className="mb-5 text-lg font-semibold">
        Appearance
      </h2>
      <fieldset>
        <legend className="mb-3 text-sm text-muted-foreground">Color theme</legend>
        <div className="inline-flex max-w-full flex-wrap gap-1 rounded-full bg-muted p-1">
          {options.map(({ value, label, icon: Icon }) => (
            <label key={value} className="relative cursor-pointer">
              <input
                className="peer sr-only"
                type="radio"
                name="theme"
                value={value}
                checked={theme === value}
                onChange={() => setTheme(value)}
              />
              <span className="flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm text-muted-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
                <Icon size={16} aria-hidden="true" />
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  )
}

export function ConsolePage({ page }: { page: Page }) {
  if (page === 'overview') return <Overview />
  if (page === 'knowledge') return <KnowledgePage />
  if (page === 'challenges') return <ChallengesPage />
  if (page === 'sessions') return <SessionsPage />
  const emptyStates: Partial<Record<Page, { icon: LucideIcon; message: string }>> = {
    clients: { icon: Building2, message: 'No fictional clients yet' },
    sessions: { icon: History, message: 'No sessions yet' },
  }
  const empty = emptyStates[page]
  return (
    <div className="animate-fade-in">
      <div className="page-heading">
        <div>
          <p className="section-label mb-3">
            {page === 'settings' ? 'Workspace' : 'Practice World'}
          </p>
          <h1>{pageTitles[page]}</h1>
        </div>
      </div>
      {page === 'settings' && <Appearance />}
      {empty && (
        <div className="empty-state mt-8 min-h-80 border-y border-border">
          <span className="icon-tile mb-4">
            <empty.icon size={24} aria-hidden="true" />
          </span>
          <h2 className="text-base font-medium">{empty.message}</h2>
        </div>
      )}
    </div>
  )
}
