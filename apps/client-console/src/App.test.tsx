import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConsoleShell as App } from '@/components/layout/console-shell'
import { AppProviders } from '@/app/providers'
import { useUIStore } from '@/stores/ui-store'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  useUIStore.setState({ theme: 'light', sidebarCollapsed: false, page: 'overview' })
})

function renderApp() {
  return render(
    <AppProviders>
      <App />
    </AppProviders>,
  )
}

describe('client console shell', () => {
  it('opens labelled mobile navigation and closes it after choosing a page', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByLabelText('Open navigation'))
    const drawer = screen.getByRole('dialog', { name: 'Navigation' })
    expect(
      within(drawer).getByText('Practice World', { selector: 'p.section-label' }),
    ).toBeInTheDocument()
    await user.click(within(drawer).getByRole('button', { name: 'Challenges' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('heading', { level: 1, name: 'Challenges' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('dismisses mobile navigation with Escape and restores trigger focus', async () => {
    const user = userEvent.setup()
    renderApp()
    const trigger = screen.getByLabelText('Open navigation')
    await user.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Navigation' })).toBeInTheDocument()
    await user.tab()
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Dashboard' }),
    ).toHaveFocus()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  it('dismisses mobile navigation when resizing to tablet', async () => {
    const media = new EventTarget() as MediaQueryList
    Object.defineProperty(media, 'matches', { value: false, configurable: true })
    const original = window.matchMedia
    vi.spyOn(window, 'matchMedia').mockImplementation((query) =>
      query === '(min-width: 768px)' ? media : original(query),
    )
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByLabelText('Open navigation'))
    expect(screen.getByRole('dialog', { name: 'Navigation' })).toBeInTheDocument()
    act(() => {
      Object.defineProperty(media, 'matches', { value: true })
      media.dispatchEvent(new Event('change'))
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('tracks operating-system appearance changes in system mode', async () => {
    const media = new EventTarget() as MediaQueryList
    Object.defineProperty(media, 'matches', { value: true, configurable: true })
    vi.spyOn(window, 'matchMedia').mockReturnValue(media)
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('radio', { name: 'System' }))
    expect(document.documentElement).toHaveClass('dark')
    Object.defineProperty(media, 'matches', { value: false })
    act(() => {
      media.dispatchEvent(new Event('change'))
    })
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('renders the empty overview and navigates to challenges', async () => {
    const user = userEvent.setup()
    renderApp()
    expect(screen.getByRole('heading', { name: 'My overview' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'No sessions yet' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'View challenges' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Challenges' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Challenges' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('changes appearance through settings and persists the preference', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('radio', { name: 'Dark' }))
    expect(document.documentElement).toHaveClass('dark')
    expect(JSON.parse(localStorage.getItem('callpilot-ui')!).state.theme).toBe('dark')
    await user.click(screen.getByRole('radio', { name: 'Light' }))
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('collapses navigation and toggles theme from the toolbar', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Collapse navigation' }))
    expect(screen.getByRole('button', { name: 'Expand navigation' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Toggle color theme' }))
    expect(document.documentElement).toHaveClass('dark')
    expect(screen.getByRole('button', { name: 'Live Copilot, coming soon' })).toBeDisabled()
  })
})
