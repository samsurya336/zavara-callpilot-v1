import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { AuthContext } from '../store'
import { authRepository } from '../repositories'
import { useUIStore } from '@/stores/ui-store'

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const userId = useRef<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{
    session: Session | null
    loading: boolean
    error: string | null
  }>({
    session: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let active = true
    let events = 0
    const applySession = (session: Session | null) => {
      if (!active) return
      const nextUserId = session?.user.id ?? null
      if (userId.current !== nextUserId) {
        queryClient.clear()
        useUIStore.getState().setPage('overview')
        userId.current = nextUserId
      }
      setState({ session, loading: false, error: null })
    }

    const subscription = authRepository.onAuthStateChange((_event, session) => {
      events += 1
      applySession(session)
    })
    authRepository
      .getSession()
      .then((session) => {
        if (events === 0) applySession(session)
      })
      .catch((error: unknown) => {
        if (active && events === 0) {
          setState({
            session: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Could not restore your session.',
          })
        }
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [queryClient, attempt])

  const retry = () => {
    setState({ session: null, loading: true, error: null })
    setAttempt((value) => value + 1)
  }

  return <AuthContext.Provider value={{ ...state, retry }}>{children}</AuthContext.Provider>
}
