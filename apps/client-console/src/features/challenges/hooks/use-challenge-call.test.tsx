import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Challenge } from '../repositories'
import { useChallengeCall } from './use-challenge-call'

const mocks = vi.hoisted(() => ({
  callbacks: {} as Record<string, (...args: any[]) => void>,
  startSession: vi.fn(),
  endSession: vi.fn(),
  startCall: vi.fn(),
  activateCall: vi.fn(),
  endCall: vi.fn(),
  stop: vi.fn(),
}))
vi.mock('@elevenlabs/react', () => ({
  useConversation: (callbacks: typeof mocks.callbacks) => {
    mocks.callbacks = callbacks
    return { startSession: mocks.startSession, endSession: mocks.endSession, isSpeaking: false }
  },
}))
vi.mock('../repositories', () => ({ challengeRepository: mocks }))
const challenge = { id: 'challenge', durationMinutes: 4 } as Challenge
beforeEach(() => {
  vi.resetAllMocks()
  mocks.startCall.mockResolvedValue({
    callSessionId: 'session',
    conversationToken: 'private-token',
    dynamicVariables: { user_name: 'Test' },
  })
  mocks.startSession.mockResolvedValue('conversation')
  mocks.activateCall.mockResolvedValue(undefined)
  mocks.endCall.mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: mocks.stop }] }) },
  })
})
describe('challenge voice call', () => {
  it('passes the source session and selected answer to the call API', async () => {
    const branch = { parentSessionId: 'previous-session', branchFromTurnId: 'turn-3' }
    const { result } = renderHook(() => useChallengeCall(challenge, branch))
    await act(() => result.current.start())
    expect(mocks.startCall).toHaveBeenCalledWith(challenge.id, branch)
  })
  it('uses a private WebRTC token and releases the microphone permission probe', async () => {
    const { result } = renderHook(() => useChallengeCall(challenge))
    await act(() => result.current.start())
    expect(mocks.startSession).toHaveBeenCalledWith({
      conversationToken: 'private-token',
      connectionType: 'webrtc',
      dynamicVariables: { user_name: 'Test' },
    })
    expect(mocks.stop).toHaveBeenCalledOnce()
  })
  it('catches asynchronous SDK startup failures and frees the server session', async () => {
    mocks.startSession.mockRejectedValue(new Error('Connection failed'))
    const { result } = renderHook(() => useChallengeCall(challenge))
    await act(() => result.current.start())
    expect(result.current.phase).toBe('error')
    expect(result.current.error).toBe('Connection failed')
    await waitFor(() => expect(mocks.endCall).toHaveBeenCalledWith('session'))
  })
  it('waits for activation before releasing a dropped call and submits only once', async () => {
    let activate!: () => void
    mocks.activateCall.mockReturnValue(
      new Promise<void>((resolve) => {
        activate = resolve
      }),
    )
    const { result } = renderHook(() => useChallengeCall(challenge))
    await act(() => result.current.start())
    act(() => mocks.callbacks.onConnect({ conversationId: 'conversation' }))
    act(() => mocks.callbacks.onDisconnect({ reason: 'error' }))
    expect(mocks.endCall).not.toHaveBeenCalled()
    await act(async () => activate())
    await waitFor(() => expect(mocks.endCall).toHaveBeenCalledTimes(1))
    act(() => result.current.end())
    expect(mocks.endCall).toHaveBeenCalledTimes(1)
  })
  it('does not create two sessions on repeated start clicks', async () => {
    const { result } = renderHook(() => useChallengeCall(challenge))
    await act(async () => {
      await Promise.all([result.current.start(), result.current.start()])
    })
    expect(mocks.startCall).toHaveBeenCalledOnce()
  })
})

it('cleans up a server session returned after the call screen unmounts', async () => {
  let resolve!: (value: unknown) => void
  mocks.startCall.mockReturnValue(
    new Promise((done) => {
      resolve = done
    }),
  )
  const { result, unmount } = renderHook(() => useChallengeCall(challenge))
  let starting!: Promise<void>
  act(() => {
    starting = result.current.start()
  })
  await waitFor(() => expect(mocks.startCall).toHaveBeenCalledOnce())
  unmount()
  await act(async () => {
    resolve({ callSessionId: 'late-session', conversationToken: 'token' })
    await starting
  })
  expect(mocks.startSession).not.toHaveBeenCalled()
  expect(mocks.endCall).toHaveBeenCalledWith('late-session')
})
