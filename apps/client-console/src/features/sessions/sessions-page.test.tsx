import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import { SessionsPage } from './sessions-page'

const mocks = vi.hoisted(() => ({
  listSessions: vi.fn(),
  endCall: vi.fn(),
  openTimeMachineCall: vi.fn(),
}))
vi.mock('@/features/challenges/time-machine-store', () => ({
  openTimeMachineCall: mocks.openTimeMachineCall,
}))
vi.mock('./repository', () => ({ listSessions: mocks.listSessions }))
vi.mock('@/features/auth/hooks', () => ({
  useAuth: () => ({ session: { user: { id: 'owner' } } }),
}))
vi.mock('@/features/challenges/repositories', () => ({
  challengeRepository: { endCall: mocks.endCall },
}))
const report = {
  evidence: { level: 'PARTIAL', note: 'The call was interrupted.' },
  outcome: { label: 'Budget still open', explanation: 'The buyer needs more information.' },
  summary: 'You asked about the budget.',
  overall: { score: null, label: 'Not enough evidence', explanation: 'The call was short.' },
  priorityImprovement: {
    title: 'Ask about timing',
    turnIds: ['turn-1'],
    quote: 'What is your budget?',
    whatToChange: 'Explore the timing.',
    whyItMatters: 'The next step is unclear.',
    tryThis: 'Ask when they need a decision.',
    exampleResponse: 'When do you need this in place?',
  },
  moreImprovements: [],
  strengths: [],
  skills: [{ key: 'discovery', label: 'Discovery', score: null, reason: 'Too short.' }],
  stakeholders: null,
  productChecks: null,
  nextStep: { label: 'Practise discovery.' },
}
const session = {
  id: 'call',
  title: 'Budget challenge',
  created_at: '2026-10-24T10:00:00Z',
  mode: 'BATTLE',
  status: 'COMPLETED',
  duration_seconds: 30,
  report_status: 'READY',
  report,
  transcript: [{ id: 'turn-1', speaker: 'user', text: 'What is your budget?', timeInCallSecs: 10 }],
}
function open() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <SessionsPage />
    </QueryClientProvider>,
  )
}
beforeEach(() => {
  vi.resetAllMocks()
  mocks.listSessions.mockResolvedValue([session])
  mocks.endCall.mockResolvedValue(undefined)
})
it('opens the saved coaching report and shows linked transcript evidence', async () => {
  open()
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: /Budget challenge/ }))
  expect(screen.getByText('Partial feedback')).toBeInTheDocument()
  expect(screen.getByText('Ask about timing')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'View moment at 0:10' }))
  expect(screen.getByText('View conversation evidence').closest('details')).toHaveAttribute('open')
  expect(screen.getByText('View conversation evidence').closest('details')).toHaveTextContent(
    'What is your budget?',
  )
  expect(mocks.listSessions).toHaveBeenCalledWith('owner')
})

it('shows missing timestamps without inventing a moment at zero', async () => {
  mocks.listSessions.mockResolvedValue([
    {
      ...session,
      transcript: [{ ...session.transcript[0], timeInCallSecs: null }],
    },
  ])
  open()
  await userEvent.click(await screen.findByRole('button', { name: /Budget challenge/ }))
  expect(
    screen.getByRole('button', { name: 'View moment at Time unavailable' }),
  ).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'View moment at 0:00' })).not.toBeInTheDocument()
})
it('lets a failed report be retried without creating another call', async () => {
  mocks.listSessions.mockResolvedValue([{ ...session, report: null, report_status: 'FAILED' }])
  open()
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: /Budget challenge/ }))
  await user.click(screen.getByRole('button', { name: 'Check and retry report' }))
  expect(mocks.endCall).toHaveBeenCalledWith('call', expect.anything())
})

it('triggers Time Machine with the saved session and chosen user answer', async () => {
  mocks.listSessions.mockResolvedValue([
    {
      ...session,
      transcript: [
        { id: 'turn-0', speaker: 'agent', text: 'Buyer question', timeInCallSecs: 0 },
        ...session.transcript,
        { id: 'turn-3', speaker: 'user', text: 'Another answer', timeInCallSecs: 20 },
      ],
    },
  ])
  open()
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: /Budget challenge/ }))
  expect(screen.queryByRole('option', { name: /Buyer question/ })).not.toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText('Choose an answer to retry'), 'turn-3')
  await user.click(screen.getByRole('button', { name: 'Test Time Machine' }))
  expect(mocks.openTimeMachineCall).toHaveBeenCalledWith({
    parentSessionId: 'call',
    branchFromTurnId: 'turn-3',
  })
})
