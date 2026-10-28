import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Missing env vars used to throw here, which killed the bundle before React
// mounted and left a blank page — the failure mode on a deploy where the
// variables were never set. Flag it instead and let the app render a notice.
export const isSupabaseConfigured =
  Boolean(url) && Boolean(anonKey) && !url.includes('placeholder')

export const supabase = createClient(
  url || 'https://unconfigured.supabase.co',
  anonKey || 'unconfigured',
)
