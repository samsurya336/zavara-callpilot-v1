import { useEffect } from 'react'
import { closeTimeMachineCall, useTimeMachine } from './time-machine-store'
import { useQuery } from '@tanstack/react-query'
import { Dialog } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { ChallengeDetailsSheet } from './components/challenge-details-sheet'
import { challengeRepository, type TimeMachineInput } from './repositories'
import '@/styles/knowledge.css'
import '@/styles/challenges.css'

function TimeMachineRequest({ input }: { input: TimeMachineInput }) {
  const context = useQuery({
    queryKey: ['time-machine-context', input.parentSessionId, input.branchFromTurnId],
    queryFn: () => challengeRepository.timeMachineContext(input),
    retry: false,
    gcTime: 0,
    staleTime: 0,
  })
  if (context.data)
    return (
      <ChallengeDetailsSheet
        challenge={context.data.challenge}
        branch={input}
        transcript={context.data.transcript}
        onClose={closeTimeMachineCall}
      />
    )
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) closeTimeMachineCall()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="knowledge-overlay" />
        <Dialog.Content className="knowledge-sheet glass-sheet p-6">
          <Dialog.Title className="text-lg font-semibold">Time Machine</Dialog.Title>
          <Dialog.Description className="my-4">
            {context.isError ? context.error.message : 'Loading the previous conversation…'}
          </Dialog.Description>
          {context.isError && <Button onClick={() => void context.refetch()}>Try again</Button>}
          <Dialog.Close asChild>
            <Button variant="secondary" className="ml-2">
              Close
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Mounted once in the authenticated console, so callers can trigger from any page. */
export function TimeMachineCallHost() {
  useEffect(() => closeTimeMachineCall, [])
  const input = useTimeMachine((state) => state.input)
  return input ? (
    <TimeMachineRequest key={`${input.parentSessionId}:${input.branchFromTurnId}`} input={input} />
  ) : null
}
