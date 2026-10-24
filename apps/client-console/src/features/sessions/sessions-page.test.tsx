import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import { SessionsPage } from './sessions-page'

const mocks = vi.hoisted(() => ({ listSessions: vi.fn(), endCall: vi.fn() }))
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
  user_id: 'owner',
  challenge_id: 'challenge',
  title: 'Budget challenge',
  created_at: '2026-10-24T10:00:00Z',
  started_at: '2026-10-24T10:00:00Z',
  ended_at: '2026-10-24T10:00:30Z',
  mode: 'BATTLE',
  status: 'COMPLETED',
  duration_seconds: 30,
  parent_session_id: null,
  branch_from_turn_id: null,
  provider_session_id: null,
  recording_url: null,
  ownerName: 'Test owner',
  ownerEmail: 'owner@example.com',
  callType: 'ONE_ON_ONE',
  category: 'Discovery',
  difficulty: 'MEDIUM',
  description: 'Practise budget discovery.',
  objective: 'Agree a next step.',
  participants: [],
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
  await user.click(await screen.findByText('Budget challenge'))
  await user.click(screen.getByRole('tab', { name: 'Report' }))
  expect(screen.getByText('Partial feedback')).toBeInTheDocument()
  expect(screen.getByText('Ask about timing')).toBeInTheDocument()
  await user.click(screen.getByText('View conversation evidence'))
  expect(screen.getByText('View conversation evidence').closest('details')).toHaveTextContent(
    'What is your budget?',
  )
  expect(mocks.listSessions).toHaveBeenCalled()
})
it('lets a failed report be retried without creating another call', async () => {
  mocks.listSessions.mockResolvedValue([{ ...session, report: null, report_status: 'FAILED' }])
  open()
  const user = userEvent.setup()
  await user.click(await screen.findByText('Budget challenge'))
  await user.click(screen.getByRole('tab', { name: 'Report' }))
  await user.click(screen.getByRole('button', { name: 'Check and retry report' }))
  expect(mocks.endCall).toHaveBeenCalledWith('call', expect.anything())
})
