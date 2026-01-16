import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = request.cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // Note: In Next.js Server Components/Routes, we can't set cookies directly on the store
            // We have to return a response with the Set-Cookie header.
            // @supabase/ssr handles this by calling this `set` method, 
            // but we need to pass the updated cookies to the response.
            // However, inside a Route Handler, we can essentially ignore the 'set' here 
            // if we are just exchanging code for session, BUT the exchange writes the session cookie.
            // The correct pattern for Route Handlers is a bit different than Middleware.
            // Let's use the recommended pattern for Next.js App Router API Routes.
            
          },
          remove(name: string, options: CookieOptions) {
            
          },
        },
      }
    )
    
    // We need to override the cookie methods to actually write to the response
    // But wait, the standard pattern for Route Handlers in Next.js 15 + @supabase/ssr is slightly more verbose
    // because `request.cookies` is read-only.
    
    const response = NextResponse.redirect(`${origin}${next}`)
    
    // Re-create client with response-aware cookie handling
    const supabaseResponse = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    const { error } = await supabaseResponse.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
