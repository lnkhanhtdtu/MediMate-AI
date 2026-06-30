import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey || url === 'your_supabase_url_here' || anonKey === 'your_supabase_anon_key_here') {
    // Fallback placeholder to prevent build-time crashing
    return createBrowserClient(
      'https://placeholder-url.supabase.co',
      'placeholder-anon-key'
    )
  }

  return createBrowserClient(url, anonKey)
}
