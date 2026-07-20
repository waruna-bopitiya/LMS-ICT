import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    const { error } = await supabase.auth.getUser()
    if (error && (error.message?.includes('Refresh Token') || error.message?.includes('JWT') || error.status === 400)) {
      // Clear stale Supabase auth cookies when refresh token is invalid or missing
      const allCookies = request.cookies.getAll()
      allCookies.forEach(c => {
        if (c.name.startsWith('sb-') || c.name.includes('auth-token')) {
          supabaseResponse.cookies.delete(c.name)
        }
      })
    }
  } catch {
    // Ignore any auth check errors in proxy
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files & images
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
