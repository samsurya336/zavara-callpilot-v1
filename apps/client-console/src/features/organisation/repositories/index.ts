import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/lib/supabase/database.types'

export type Organization = Tables<'organizations'>

export const organizationRepository = {
  async create(name: string) {
    const { data, error } = await supabase
      .rpc('create_organization', { organization_name: name })
      .single()
    if (error) throw error
    return data
  },

  async listForUser(userId: string) {
    const { data, error } = await supabase
      .from('organization_members')
      .select('role, organization:organizations!inner(*)')
      .eq('user_id', userId)
    if (error) throw error
    return data.map(({ organization, role }) => ({ ...organization, role }))
  },
}
