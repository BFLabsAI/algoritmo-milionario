// proxy.ts — Next.js 16 (substitui middleware.ts)
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Rotas públicas que nunca exigem autenticação
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
]

const PUBLIC_PREFIXES = [
  '/api/auth/',      // registro, login, etc.
  '/api/webhooks/',  // Kiwify, Hotmart
  '/_next/',
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Deixa passar rotas públicas sem verificar sessão
  if (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some(p => pathname.startsWith(p))
  ) {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
