import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isPlaceholder = !url || !anonKey || url === 'your_supabase_url_here' || anonKey === 'your_supabase_anon_key_here'
  if (isPlaceholder) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return createServerClient(
        'https://placeholder-url.supabase.co',
        'placeholder-anon-key',
        {
          cookies: {
            getAll() {
              return []
            },
            setAll() {},
          },
        }
      )
    }
    throw new Error('Missing/invalid Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
