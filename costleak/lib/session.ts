import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'costleak-dev-secret-change-in-production-32chars'
)

export interface SessionUser {
  id: string
  email: string
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ id: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)

  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET)
    return { id: payload.id as string, email: payload.email as string }
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
