import { create } from 'zustand'
import type { TimeMachineInput } from './repositories'

export const useTimeMachine = create<{ input: TimeMachineInput | null }>(() => ({ input: null }))

/** Opens the shared calling drawer. Does not request the microphone or start a call until Continue Call. */
export function openTimeMachineCall(input: TimeMachineInput) {
  if (!input.parentSessionId.trim() || !input.branchFromTurnId.trim()) {
    throw new Error('parentSessionId and branchFromTurnId are required.')
  }
  // Repeated triggers must not replace a call that is already open.
  if (!useTimeMachine.getState().input) useTimeMachine.setState({ input: { ...input } })
}

export function closeTimeMachineCall() {
  useTimeMachine.setState({ input: null })
}
