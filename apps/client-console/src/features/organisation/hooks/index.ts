import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { organizationRepository } from '../repositories'

export const organizationKey = (userId: string) => ['organization', userId] as const

export function useOrganization() {
  const { session } = useAuth()
  return useQuery({
    queryKey: organizationKey(session?.user.id ?? ''),
    enabled: Boolean(session),
    queryFn: async () => {
      const organizations = await organizationRepository.listForUser(session!.user.id)
      return organizations[0] ?? null
    },
  })
}
