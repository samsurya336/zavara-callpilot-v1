import { createClient, type User } from '@supabase/supabase-js'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Validates the caller's bearer session with Supabase Auth. Gateway verify_jwt stays off so this
// also works with current Supabase signing keys; returns a 401 response instead of a user.
export async function authenticate(request: Request): Promise<User | Response> {
  const authorization = request.headers.get('Authorization')
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return jsonResponse({ error: 'Sign in first' }, 401)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return jsonResponse({ error: 'Invalid or expired session' }, 401)
  return data.user
}

// Bypasses table policies. Use only for server-side reads/writes the caller is already authorised
// for, and never return its rows unfiltered.
export function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
