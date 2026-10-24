import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import { TimeMachineCallHost } from './time-machine'
import { openTimeMachineCall } from './time-machine-store'

const mocks = vi.hoisted(() => ({ context: vi.fn() }))
vi.mock('./repositories', () => ({ challengeRepository: { timeMachineContext: mocks.context } }))
vi.mock('./components/challenge-details-sheet', () => ({
  ChallengeDetailsSheet: ({
    challenge,
    branch,
    transcript,
    onClose,
  }: {
    challenge: { title: string }
    branch: { branchFromTurnId: string }
    transcript: Array<{ text: string }>
    onClose: () => void
  }) => (
    <div>
      {challenge.title} {branch.branchFromTurnId} {transcript[0]?.text}
      <button onClick={onClose}>Close call</button>
    </div>
  ),
}))

beforeEach(() => vi.resetAllMocks())

function mount() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
          },
        })
      }
    >
      <TimeMachineCallHost />
    </QueryClientProvider>,
  )
}

it('opens from the two IDs and passes saved context to the shared drawer', async () => {
  mocks.context.mockResolvedValue({
    challenge: { title: 'Saved meeting' },
    transcript: [{ text: 'Earlier question' }],
  })
  mount()
  const input = { parentSessionId: 'source-session', branchFromTurnId: 'turn-3' }
  act(() => openTimeMachineCall(input))
  await screen.findByText(/Saved meeting turn-3 Earlier question/)
  expect(mocks.context).toHaveBeenCalledWith(input)
  act(() => openTimeMachineCall({ ...input, branchFromTurnId: 'turn-9' }))
  expect(mocks.context).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByText('Close call'))
  await waitFor(() => expect(screen.queryByText(/Saved meeting/)).not.toBeInTheDocument())
})

it('shows a recoverable error without opening a call when source loading fails', async () => {
  mocks.context.mockRejectedValue(new Error('Saved answer is unavailable'))
  mount()
  act(() => openTimeMachineCall({ parentSessionId: 'source', branchFromTurnId: 'missing' }))
  await screen.findByText('Saved answer is unavailable')
  expect(screen.getByText('Try again')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Close'))
})
