// middleware.ts (à la racine)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from './lib/firebase-admin';

export async function proxy(request: NextRequest) {
  // Vérifier les routes protégées
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }
    // Vérifier si la route commence par /admin
    if (request.nextUrl.pathname.startsWith('/ad')) {
      // Vérifier l'authentification (à adapter avec ton système d'auth)
      const token = request.cookies.get('auth-token')
      
      if (!token) {
        return NextResponse.redirect(new URL('/signin', request.url))
      }
  
      // Vérifier les rôles (exemple basique)
      const userRole = request.cookies.get('user-role')
      const allowedRoles = ['admin', 'editor', 'moderator']
      
      if (!userRole || !allowedRoles.includes(userRole.value)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

  // Pour les autres routes API, vous pouvez ajouter une vérification d'authentification
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('Authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        await adminAuth.verifyIdToken(token);
        return NextResponse.next();
      } catch (error) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};