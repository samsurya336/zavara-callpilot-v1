import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { knowledgeRepository } from '../repositories'
import { knowledgeStatus } from '../services'

export const knowledgeKey = (userId: string) => ['knowledge', userId] as const

export function useKnowledgeList() {
  const { session } = useAuth()
  return useQuery({
    queryKey: knowledgeKey(session?.user.id ?? ''),
    enabled: Boolean(session),
    queryFn: () => knowledgeRepository.list(session!.user.id),
    refetchInterval: ({ state }) =>
      state.data?.some((entry) => knowledgeStatus(entry) === 'processing') ? 5_000 : false,
  })
}

function useKnowledgeMutation<Input>(mutationFn: (input: Input) => Promise<unknown>) {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: knowledgeKey(session?.user.id ?? '') }),
  })
}

export function useCreateKnowledge() {
  const { session } = useAuth()
  return useKnowledgeMutation(({ title, file }: { title: string; file: File }) =>
    knowledgeRepository.create({ title, file, createdBy: session!.user.id }),
  )
}

export const useRetryKnowledge = () => useKnowledgeMutation(knowledgeRepository.retry)
export const useDeleteKnowledge = () => useKnowledgeMutation(knowledgeRepository.remove)
