import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in.',
  )
}

// Placeholder .env values let the app boot but every request fails with an
// opaque "Failed to fetch", so surface it as a setup problem instead.
export const isSupabaseConfigured = !url.includes('placeholder')

export const supabase = createClient(url, anonKey)
