import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  subscribe: vi.fn(),
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  listForUser: vi.fn(),
  create: vi.fn(),
  listener: null as ((event: AuthChangeEvent, session: Session | null) => void) | null,
}))

vi.mock('@/features/auth/repositories', () => ({
  authRepository: {
    getSession: mocks.getSession,
    onAuthStateChange: mocks.subscribe,
    signUp: mocks.signUp,
    signIn: mocks.signIn,
    signOut: mocks.signOut,
  },
}))
vi.mock('@/features/organisation/repositories', () => ({
  organizationRepository: { listForUser: mocks.listForUser, create: mocks.create },
}))

const session: Session = {
  access_token: 'session',
  refresh_token: 'refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: 'user-id',
    email: 'asha@example.com',
    user_metadata: { name: 'Asha' },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2026-10-20T00:00:00Z',
  },
}
const organization = {
  id: 'org-id',
  name: 'Asha Team',
  created_by: 'user-id',
  created_at: '2026-10-20',
  role: 'SUPER_ADMIN',
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.listener = null
  mocks.getSession.mockResolvedValue(null)
  mocks.listForUser.mockResolvedValue([])
  mocks.subscribe.mockImplementation((callback) => {
    mocks.listener = callback
    return { unsubscribe: vi.fn() }
  })
  mocks.signOut.mockImplementation(async () => {
    mocks.listener?.('SIGNED_OUT', null)
  })
})

function Location() {
  return <span aria-label="Current route">{useLocation().pathname}</span>
}

function renderApp(route = '/dashboard') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <App />
        <Location />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return queryClient
}

describe('authenticated workspace flow', () => {
  it('waits for session restoration and blocks direct dashboard access when signed out', async () => {
    let restore!: (value: Session | null) => void
    mocks.getSession.mockReturnValue(
      new Promise((resolve) => {
        restore = resolve
      }),
    )
    renderApp()
    expect(screen.getByRole('status')).toHaveTextContent('Loading')
    expect(screen.queryByRole('heading', { name: 'My overview' })).not.toBeInTheDocument()
    await act(async () => {
      restore(null)
    })
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/sign-in')
  })

  it('restores the dashboard for a member and keeps setup inaccessible', async () => {
    mocks.getSession.mockResolvedValue(session)
    mocks.listForUser.mockResolvedValue([organization])
    renderApp('/setup')
    expect(await screen.findByRole('heading', { name: 'My overview' })).toBeInTheDocument()
    expect(screen.getByText('Asha Team')).toBeInTheDocument()
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/dashboard')
  })

  it('sends an authenticated user without an organisation to setup', async () => {
    mocks.getSession.mockResolvedValue(session)
    renderApp()
    expect(
      await screen.findByRole('heading', { name: 'Set up your organisation' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/setup')
  })

  it('signs up, retries failed setup without signing up twice, and opens the dashboard', async () => {
    const user = userEvent.setup()
    mocks.signUp.mockImplementation(async () => {
      mocks.listener?.('SIGNED_IN', session)
      return { user: session.user, session }
    })
    mocks.create
      .mockRejectedValueOnce(new Error('Could not create workspace'))
      .mockResolvedValueOnce(organization)
    renderApp('/sign-up')
    await user.type(await screen.findByLabelText('Your name'), 'Asha')
    await user.type(screen.getByLabelText('Email address'), 'asha@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    await user.type(await screen.findByLabelText('Organisation name'), 'Asha Team')
    await user.click(screen.getByRole('button', { name: 'Create workspace' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not create workspace')
    await user.click(screen.getByRole('button', { name: 'Create workspace' }))
    expect(await screen.findByRole('heading', { name: 'My overview' })).toBeInTheDocument()
    expect(mocks.signUp).toHaveBeenCalledTimes(1)
    expect(mocks.create).toHaveBeenCalledTimes(2)
    expect(mocks.signUp).toHaveBeenCalledWith({
      name: 'Asha',
      email: 'asha@example.com',
      password: 'password123',
    })
  })

  it('shows invalid credentials without opening protected content', async () => {
    const user = userEvent.setup()
    mocks.signIn.mockRejectedValue(new Error('Invalid login credentials'))
    renderApp('/sign-in')
    await user.type(await screen.findByLabelText('Email address'), 'asha@example.com')
    await user.type(screen.getByLabelText('Password'), 'incorrect')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid login credentials')
    expect(screen.queryByRole('heading', { name: 'My overview' })).not.toBeInTheDocument()
  })

  it('allows an existing account to sign in', async () => {
    const user = userEvent.setup()
    mocks.signIn.mockImplementation(async () => {
      mocks.listener?.('SIGNED_IN', session)
      return { user: session.user, session }
    })
    mocks.listForUser.mockResolvedValue([organization])
    renderApp('/sign-in')
    await user.type(await screen.findByLabelText('Email address'), 'asha@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('heading', { name: 'My overview' })).toBeInTheDocument()
  })

  it('does not mistake a failed organisation lookup for missing membership', async () => {
    const user = userEvent.setup()
    mocks.getSession.mockResolvedValue(session)
    mocks.listForUser
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce([])
    renderApp()
    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable')
    expect(screen.queryByLabelText('Organisation name')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByLabelText('Organisation name')).toBeInTheDocument()
  })

  it('clears cached data on signout and ignores late session restoration', async () => {
    const user = userEvent.setup()
    let restore!: (value: Session | null) => void
    mocks.getSession.mockReturnValue(
      new Promise((resolve) => {
        restore = resolve
      }),
    )
    mocks.listForUser.mockResolvedValue([organization])
    const queryClient = renderApp()
    act(() => {
      mocks.listener?.('SIGNED_IN', session)
    })
    expect(await screen.findByRole('heading', { name: 'My overview' })).toBeInTheDocument()
    queryClient.setQueryData(['private-data'], 'previous account data')
    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(queryClient.getQueryData(['private-data'])).toBeUndefined()
    await act(async () => {
      restore(session)
    })
    await waitFor(() =>
      expect(screen.getByLabelText('Current route')).toHaveTextContent('/sign-in'),
    )
    expect(screen.queryByRole('heading', { name: 'My overview' })).not.toBeInTheDocument()
  })
})
