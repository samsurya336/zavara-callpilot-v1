import { useEffect, useRef, useState } from 'react'
import { Dialog } from 'radix-ui'
import {
  AudioLines,
  BookOpen,
  Building2,
  ChevronRight,
  History,
  LayoutDashboard,
  LogOut,
  Loader2,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Radio,
  Settings2,
  Sun,
  Swords,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ConsolePage, pageTitles } from '@/features/workspace/console-page'
import { cn } from '@/lib/utils'
import { useUIStore, type Page } from '@/stores/ui-store'
import '@/styles/layout.css'

function NavigationItem({
  page,
  label,
  icon: Icon,
  onNavigate,
}: {
  page: Page
  label: string
  icon: LucideIcon
  onNavigate?: () => void
}) {
  const currentPage = useUIStore((state) => state.page)
  const setPage = useUIStore((state) => state.setPage)
  return (
    <Tooltip open={onNavigate ? false : undefined}>
      <TooltipTrigger asChild>
        <button
          className={cn('nav-item', currentPage === page && 'nav-item-active')}
          aria-label={label}
          aria-current={currentPage === page ? 'page' : undefined}
          onClick={() => {
            setPage(page)
            onNavigate?.()
          }}
        >
          <Icon size={19} aria-hidden="true" />
          <span className="nav-label">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

function SidebarContent({
  organizationName,
  userName,
  onNavigate,
}: {
  organizationName: string
  userName: string
  onNavigate?: () => void
}) {
  return (
    <>
      <div className="brand" aria-label="Zavara Callpilot">
        <div className="brand-mark">
          <AudioLines size={23} aria-hidden="true" />
        </div>
        <div className="nav-label">
          <span className="brand-name">callpilot</span>
          <span className="brand-byline">by Zavara</span>
        </div>
      </div>
      <nav aria-label="Main navigation" className="navigation">
        <p className="section-label nav-label nav-group-label">Workspace</p>
        <NavigationItem
          page="overview"
          label="Dashboard"
          icon={LayoutDashboard}
          onNavigate={onNavigate}
        />
        <NavigationItem
          page="knowledge"
          label="Knowledge Base"
          icon={BookOpen}
          onNavigate={onNavigate}
        />
        <Separator className="my-5" />
        <p className="section-label nav-label nav-group-label">Practice World</p>
        <NavigationItem
          page="challenges"
          label="Challenges"
          icon={Swords}
          onNavigate={onNavigate}
        />
        <NavigationItem page="clients" label="Clients" icon={Building2} onNavigate={onNavigate} />
        <NavigationItem
          page="sessions"
          label="My Sessions"
          icon={History}
          onNavigate={onNavigate}
        />
        <Separator className="my-5" />
        {[
          { label: 'Live Copilot', icon: Radio },
          { label: 'Integrations', icon: Plug },
        ].map(({ label, icon: Icon }) => (
          <button
            key={label}
            className="nav-item opacity-45"
            disabled
            aria-label={`${label}, coming soon`}
            title={`${label}, coming soon`}
          >
            <Icon size={19} aria-hidden="true" />
            <span className="nav-label flex-1">{label}</span>
            <span className="nav-label text-[10px]">Soon</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <NavigationItem page="settings" label="Settings" icon={Settings2} onNavigate={onNavigate} />
        <Separator className="my-4" />
        <div className="workspace-identity">
          <span className="workspace-avatar" aria-hidden="true">
            {organizationName.trim().slice(0, 1).toUpperCase()}
          </span>
          <div className="nav-label min-w-0">
            <p className="truncate text-sm font-semibold" title={organizationName}>
              {organizationName}
            </p>
            <p className="truncate text-xs text-muted-foreground" title={userName}>
              {userName}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export function ConsoleShell({
  organizationName = 'Zavara Callpilot',
  userName = 'Practice World',
  onSignOut,
  signingOut = false,
  signOutError,
}: {
  organizationName?: string
  userName?: string
  onSignOut?: () => void
  signingOut?: boolean
  signOutError?: string
}) {
  const collapsed = useUIStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const theme = useUIStore((state) => state.theme)
  const setTheme = useUIStore((state) => state.setTheme)
  const page = useUIStore((state) => state.page)
  const contentRef = useRef<HTMLElement>(null)
  const previousPage = useRef(page)
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const focusAfterNavigation = useRef(false)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const closeOnResize = () => {
      if (media.matches) setMobileNavigationOpen(false)
    }
    media.addEventListener('change', closeOnResize)
    return () => media.removeEventListener('change', closeOnResize)
  }, [])

  useEffect(() => {
    if (previousPage.current !== page) {
      contentRef.current?.focus()
      previousPage.current = page
    }
  }, [page])

  return (
    <TooltipProvider delayDuration={200}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="console-layout" data-collapsed={collapsed}>
        <aside className="sidebar glass-strong" aria-label="Sidebar">
          <SidebarContent organizationName={organizationName} userName={userName} />
        </aside>
        <div className="console-body">
          <header className="topbar">
            <div className="flex min-w-0 items-center gap-3">
              <Dialog.Root open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
                <Dialog.Trigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mobile-navigation-trigger size-11 rounded-full"
                    aria-label="Open navigation"
                    title="Open navigation"
                  >
                    <Menu aria-hidden="true" />
                  </Button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="mobile-navigation-overlay" />
                  <Dialog.Content
                    className="mobile-navigation-panel glass-sheet"
                    onCloseAutoFocus={(event) => {
                      if (
                        focusAfterNavigation.current ||
                        window.matchMedia('(min-width: 768px)').matches
                      ) {
                        event.preventDefault()
                        contentRef.current?.focus()
                      }
                      focusAfterNavigation.current = false
                    }}
                  >
                    <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                    <Dialog.Description className="sr-only">
                      Workspace and practice views
                    </Dialog.Description>
                    <Dialog.Close asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mobile-navigation-close size-11 rounded-full"
                        aria-label="Close navigation"
                        title="Close navigation"
                      >
                        <X aria-hidden="true" />
                      </Button>
                    </Dialog.Close>
                    <SidebarContent
                      organizationName={organizationName}
                      userName={userName}
                      onNavigate={() => {
                        focusAfterNavigation.current = true
                        setMobileNavigationOpen(false)
                      }}
                    />
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="sidebar-toggle size-11 rounded-full"
                    aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
                    onClick={toggleSidebar}
                  >
                    {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {collapsed ? 'Expand navigation' : 'Collapse navigation'}
                </TooltipContent>
              </Tooltip>
              <span className="hidden text-sm text-muted-foreground sm:inline">Workspace</span>
              <ChevronRight
                size={14}
                className="hidden text-muted-foreground sm:block"
                aria-hidden="true"
              />
              <span className="truncate text-sm font-medium">{pageTitles[page]}</span>
            </div>
            <div className="topbar-actions flex shrink-0 items-center gap-3">
              <Badge
                variant="secondary"
                className="hidden rounded-full px-3 py-1.5 text-xs sm:flex"
              >
                Practice World
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 rounded-full"
                    aria-label="Toggle color theme"
                    onClick={() =>
                      setTheme(
                        document.documentElement.classList.contains('dark') ? 'light' : 'dark',
                      )
                    }
                  >
                    <Sun className="hidden dark:block" aria-hidden="true" />
                    <Moon className="dark:hidden" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle color theme ({theme})</TooltipContent>
              </Tooltip>
              {onSignOut && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-11 rounded-full"
                      aria-label="Sign out"
                      disabled={signingOut}
                      onClick={onSignOut}
                    >
                      {signingOut ? (
                        <Loader2 className="animate-spin" aria-hidden="true" />
                      ) : (
                        <LogOut aria-hidden="true" />
                      )}
                      <span className="hidden sm:inline">Sign out</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sign out</TooltipContent>
                </Tooltip>
              )}
            </div>
          </header>
          {signOutError && (
            <p role="alert" className="auth-error mx-8 mt-5">
              {signOutError}
            </p>
          )}
          <main id="main-content" ref={contentRef} tabIndex={-1} className="main-content">
            <ConsolePage key={page} page={page} />
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
