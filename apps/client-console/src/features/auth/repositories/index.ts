import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/lib/supabase/database.types'

export type Profile = Tables<'profiles'>
export type UserWithOrganizations = Profile & {
  organizations: (Tables<'organizations'> & { role: 'SUPER_ADMIN' })[]
}

export interface SignUpInput {
  name: string
  email: string
  password: string
}

export const authRepository = {
  async signUp({ name, email, password }: SignUpInput) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw error
    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback).data.subscription
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error) throw error
    return data
  },

  async listUsersWithOrganizations() {
    const { data, error } = await supabase.functions.invoke<{ users: UserWithOrganizations[] }>(
      'list-users-organizations',
      { method: 'GET' },
    )
    if (error) throw error
    if (!data) throw new Error('The diagnostic function returned no data')
    return data.users
  },
}
