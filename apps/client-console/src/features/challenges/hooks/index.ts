import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { challengeRepository } from '../repositories'
import { GENERATION_POLL_MS, generationState } from '../services'

export const challengesKey = (userId: string) => ['challenges', userId] as const
export const usageKey = (userId: string) => ['account-usage', userId] as const

export function useChallenges() {
  const { session } = useAuth()
  return useQuery({
    queryKey: challengesKey(session?.user.id ?? ''),
    enabled: Boolean(session),
    queryFn: () => challengeRepository.list(session!.user.id),
    // Poll while Knowledge-based Challenges are generating in the background.
    refetchInterval: (query) =>
      query.state.data?.some((challenge) => generationState(challenge) === 'generating')
        ? GENERATION_POLL_MS
        : false,
  })
}

export function useAccountUsage() {
  const { session } = useAuth()
  return useQuery({
    queryKey: usageKey(session?.user.id ?? ''),
    enabled: Boolean(session),
    queryFn: () => challengeRepository.usage(session!.user.id),
  })
}

export function useRetryChallengeGeneration() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: challengeRepository.retryGeneration,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: challengesKey(session?.user.id ?? '') }),
  })
}

export function useGenerateChallenge() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: challengeRepository.generate,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: challengesKey(session?.user.id ?? '') }),
  })
}
