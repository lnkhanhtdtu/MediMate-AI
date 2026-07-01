import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isPlaceholder = !url || !anonKey || url === 'your_supabase_url_here' || anonKey === 'your_supabase_anon_key_here'
  if (isPlaceholder) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return createBrowserClient(
        'https://placeholder-url.supabase.co',
        'placeholder-anon-key'
      )
    }
    throw new Error('Missing/invalid Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createBrowserClient(url, anonKey)
}
