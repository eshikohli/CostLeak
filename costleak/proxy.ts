import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'costleak-dev-secret-change-in-production-32chars'
)

const protectedRoutes = ['/dashboard', '/library']
const authRoutes = ['/login', '/signup']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('session')?.value

  let isAuthenticated = false
  if (token) {
    try {
      await jwtVerify(token, SECRET)
      isAuthenticated = true
    } catch {
      isAuthenticated = false
    }
  }

  if (protectedRoutes.some((r) => pathname.startsWith(r)) && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (authRoutes.some((r) => pathname.startsWith(r)) && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/library/:path*', '/login', '/signup'],
}
