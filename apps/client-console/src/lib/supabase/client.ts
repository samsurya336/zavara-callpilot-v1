import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error('Supabase is not configured. Run pnpm supabase:env in apps/client-console.')
}

export const supabase = createClient<Database>(url, publishableKey)
export const DOCUMENTS_BUCKET = 'documents'
