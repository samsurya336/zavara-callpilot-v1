import { useCallback, useEffect, useRef, useState } from 'react'
import { useConversation } from '@elevenlabs/react'
import { challengeRepository, type Challenge } from '../repositories'

export type CallPhase = 'idle' | 'requesting' | 'connecting' | 'active' | 'ended' | 'error'

/**
 * Runs one voice call for a challenge: opens the server call session, connects to the agent,
 * counts down the challenge length and hangs up at the limit. Server bookkeeping (activate/end)
 * never hangs up a live call. Must render inside `ConversationProvider`.
 */
export function useChallengeCall(challenge: Challenge) {
  const [phase, setPhase] = useState<CallPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const phaseRef = useRef<CallPhase>('idle')
  const callSessionId = useRef<string | null>(null)

  const setCallPhase = useCallback((next: CallPhase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  // Every way a call ends goes through here, so the server session is freed exactly once.
  const releaseSession = useCallback(() => {
    const sessionId = callSessionId.current
    callSessionId.current = null
    if (sessionId) {
      void challengeRepository
        .endCall(sessionId)
        .catch((cause: unknown) => console.error('Could not end call session', cause))
    }
  }, [])

  const conversation = useConversation({
    onConnect: ({ conversationId }) => {
      setSecondsLeft(challenge.durationMinutes * 60)
      setCallPhase('active')
      const sessionId = callSessionId.current
      if (!sessionId) return
      // Bookkeeping only: the audio is already live, so a failure here is logged, not hung up.
      void challengeRepository
        .activateCall(sessionId, conversationId)
        .catch((cause: unknown) => console.error('Could not activate call session', cause))
    },
    onDisconnect: (details) => {
      releaseSession()
      // Already ended by us (End Call, time limit) or by a failed start.
      if (phaseRef.current === 'ended' || phaseRef.current === 'error') return
      if (details.reason === 'error') {
        console.error('Call disconnected', details)
        setError('The voice connection dropped. Start again to continue.')
        setCallPhase('error')
        return
      }
      // 'agent': the agent or the server-side duration cap hung up.
      setCallPhase('ended')
    },
    // The SDK also reports recoverable mid-call problems here (a server error event, a failed
    // mute) and keeps the session open; a fatal drop still arrives through onDisconnect. Only a
    // failure while connecting ends the call.
    onError: (message, context) => {
      console.error('Call error', message, context)
      if (phaseRef.current === 'connecting') {
        failCall(message || 'The voice connection failed. Try again.')
      }
    },
  })
  const { endSession, startSession } = conversation

  const failCall = (message: string) => {
    setError(message)
    setCallPhase('error')
    endSession()
    releaseSession()
  }

  const start = async () => {
    setError(null)
    setSecondsLeft(null)
    setCallPhase('requesting')
    try {
      const permission = await navigator.mediaDevices.getUserMedia({ audio: true })
      permission.getTracks().forEach((track) => track.stop())
      const session = await challengeRepository.startCall(challenge.id)
      callSessionId.current = session.callSessionId
      setCallPhase('connecting')
      startSession({
        signedUrl: session.signedUrl,
        connectionType: 'websocket',
        dynamicVariables: session.dynamicVariables,
      })
    } catch (cause) {
      failCall(cause instanceof Error ? cause.message : 'Could not start the call. Try again.')
    }
  }

  const end = useCallback(() => {
    setCallPhase('ended')
    endSession()
    releaseSession()
  }, [endSession, releaseSession, setCallPhase])

  // Count down once connected; hang up at the time limit. A deadline stays accurate when a
  // background tab throttles the timer.
  useEffect(() => {
    if (phase !== 'active') return
    const deadline = Date.now() + challenge.durationMinutes * 60_000
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1_000))
      setSecondsLeft(left)
      if (left === 0) end()
    }, 1_000)
    return () => window.clearInterval(timer)
  }, [phase, challenge.durationMinutes, end])

  // Leaving mid-call: the provider hangs up the audio, this frees the server session.
  useEffect(() => releaseSession, [releaseSession])

  return {
    phase,
    error,
    secondsLeft,
    isSpeaking: conversation.isSpeaking,
    isMuted: conversation.isMuted,
    setMuted: conversation.setMuted,
    start,
    end,
  }
}
