import { createClient } from '@supabase/supabase-js'
import { corsHeaders, jsonResponse } from '../_shared/index.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Use GET' }, 405)
  }

  const authorization = request.headers.get('Authorization')
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return jsonResponse({ error: 'Sign in first' }, 401)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    )
    const { data: identity, error: authError } = await supabase.auth.getUser(token)
    if (authError || !identity.user) {
      return jsonResponse({ error: 'Invalid or expired session' }, 401)
    }

    const [profiles, organizations, memberships] = await Promise.all([
      supabase.from('profiles').select('id, name, email, created_at').order('created_at'),
      supabase.from('organizations').select('id, name, created_by, created_at'),
      supabase.from('organization_members').select('organization_id, user_id, role'),
    ])
    const queryError = profiles.error ?? organizations.error ?? memberships.error
    if (queryError) return jsonResponse({ error: queryError.message }, 500)

    const users = (profiles.data ?? []).map((profile) => ({
      ...profile,
      organizations: (memberships.data ?? [])
        .filter((membership) => membership.user_id === profile.id)
        .flatMap((membership) => {
          const organization = organizations.data?.find(
            (item) => item.id === membership.organization_id,
          )
          return organization ? [{ ...organization, role: membership.role }] : []
        }),
    }))

    return jsonResponse({ users })
  } catch {
    return jsonResponse({ error: 'Could not list users and organizations' }, 500)
  }
})
