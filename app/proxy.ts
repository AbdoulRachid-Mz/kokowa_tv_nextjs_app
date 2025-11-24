// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Vérifier si la route commence par /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Vérifier l'authentification (à adapter avec ton système d'auth)
    const token = request.cookies.get('auth-token')
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Vérifier les rôles (exemple basique)
    const userRole = request.cookies.get('user-role')
    const allowedRoles = ['admin', 'editor', 'moderator']
    
    if (!userRole || !allowedRoles.includes(userRole.value)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}