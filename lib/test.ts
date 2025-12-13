restart_alt
salut il faut m'aider a ajuster la methode pour la gestion de token pour que le proxy nextjs l'utilise bien. voila le proxy:"import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyFirebaseToken } from './lib/server/auth-middleware';
import { getUserByFirebaseUid } from './lib/server/auth-utils';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques (accessibles sans être connecté)
  const publicRoutes = [
    '/',
    "/competitions/**",
    "/editions/**",
    "/fighters/**",
    '/about',
    '/contact',
    '/help',
    '/privacy',
    '/terms',
    '/maintenance',
    '/404',
    '/unauthorized',
    '/500',
  ];

  // Routes liées à l'auth que l'on doit BLOQUER si user est déjà connecté
  const authRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/sign-in',
    '/auth/sign-up',
  ];

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAuthRoute = authRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // On vérifie l'existence d'un token via le nouveau middleware
  const authResult = await verifyFirebaseToken(request);
  let isAuthenticated = !!authResult.user;
  let firebaseUser = authResult.user;
  let sqlUser: any = null;

  if (isAuthenticated && firebaseUser) {
    try {
      // On récupère l'utilisateur SQL
      sqlUser = await getUserByFirebaseUid(firebaseUser.uid);
    } catch (error) {
      console.error('Failed to fetch SQL user:', error);
    }
  }

  /**
   * 🔄 1. Si utilisateur déjà connecté → empêcher l'accès aux pages auth
   */
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  /**
   * 🟢 2. Accès aux routes publiques → autorisé
   */
  if (isPublicRoute) {
    const res = NextResponse.next();
    if (isAuthenticated && sqlUser) {
      res.headers.set('x-user-uid', firebaseUser!.uid);
      res.headers.set('x-user-role', sqlUser.role || 'user');
    }
    return res;
  }

  /**
   * 🔐 3. Routes protégées (nécessitent auth)
   */
  // if (!isAuthenticated) {
  //   return NextResponse.redirect(new URL('/auth/sign-up', request.url));
  // }

  /**
   * 🛡️ 4. Vérification pour les rôles avancés
   */
  console.log("sqlUser", sqlUser);
  const userRole = sqlUser?.role || 'user';

  // Admin only
  if (pathname.startsWith('/ad/')) {
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/auth/unauthorized?req=admin', request.url));
    }
  }

  // Éditeur (tu peux modifier selon tes rôles)
  if (pathname.startsWith('/editor/')) {
    if (!['admin', 'editor'].includes(userRole)) {
      return NextResponse.redirect(new URL('/auth/unauthorized?req=editor', request.url));
    }
  }

  // Manager
  if (pathname.startsWith('/manager/')) {
    if (!['admin', 'manager'].includes(userRole)) {
      return NextResponse.redirect(new URL('/auth/unauthorized?req=manager', request.url));
    }
  }

  /**
   * 🎫 5. Transmission des infos utilisateur aux pages Next.js
   */
  const response = NextResponse.next();
  if (firebaseUser) {
    response.headers.set('x-user-uid', firebaseUser.uid);
  }
  response.headers.set('x-user-role', userRole);

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
"voila le middleware a corriger:"// lib/server/auth-middleware
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../firebase-admin';

export interface AuthUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export async function verifyFirebaseToken(request: NextRequest): Promise<{
  user: AuthUser | null;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Token manquant' };
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return { user: null, error: 'Token invalide' };
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const user: AuthUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

    return { user };

  } catch (error: any) {
    console.error('Error verifying Firebase token:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return { user: null, error: 'Token expiré' };
    }
    if (error.code === 'auth/id-token-revoked') {
      return { user: null, error: 'Token révoqué' };
    }
    if (error.code === 'auth/invalid-id-token') {
      return { user: null, error: 'Token invalide' };
    }
    
    return { user: null, error: 'Erreur de vérification du token' };
  }
}

export async function requireAuth(
  request: NextRequest, 
  requiredPermissions: string[] = []
): Promise<{
  authorized: boolean;
  user?: any;
  firebaseUser?: AuthUser;
  error?: string;
  status?: number;
}> {
  const authResult = await verifyFirebaseToken(request);
  
  if (!authResult.user) {
    return { 
      authorized: false, 
      error: authResult.error || 'Non autorisé',
      status: 401 
    };
  }

  // Vérifier les permissions si demandé
  if (requiredPermissions.length > 0) {
    const { checkUserPermissions } = await import('./auth-utils');
    const permissionResult = await checkUserPermissions(
      authResult.user.uid, 
      requiredPermissions
    );

    if (!permissionResult.hasPermission) {
      return { 
        authorized: false, 
        error: 'Permissions insuffisantes',
        status: 403 
      };
    }

    return { 
      authorized: true, 
      user: permissionResult.user,
      firebaseUser: authResult.user 
    };
  }

  return { 
    authorized: true, 
    user: authResult.user 
  };
}

// Nouvelle version corrigée pour Next.js 14+
export function withAuth(
  handler: (request: NextRequest, user: any) => Promise<Response>,
  requiredPermissions: string[] = []
) {
  return async (request: NextRequest, context: { params: Promise<{ [key: string]: string }> }): Promise<Response> => {
    const authResult = await requireAuth(request, requiredPermissions);
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    return handler(request, authResult.user);
  };
}

// Version alternative plus simple si vous n'utilisez pas les params
export function withAuthSimple(
  handler: (request: NextRequest, user: any) => Promise<Response>,
  requiredPermissions: string[] = []
) {
  return async (request: NextRequest): Promise<Response> => {
    const authResult = await requireAuth(request, requiredPermissions);
    
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    return handler(request, authResult.user);
  };
}"firebase-admin:"import * as admin from 'firebase-admin';

// Vérifier si l'application Admin est déjà initialisée
if (!admin.apps.length) {
  try {
    // Option 1: Utiliser les variables d'environnement (recommandé pour Vercel/Production)
    if (process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // La clé privée doit être formatée correctement pour les nouvelles lignes
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } 
    // Option 2: Application Default Credentials (pour Google Cloud)
    else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

export const adminAuth = admin.auth();
export default admin;"
Bonjour Abdoul Rachid Awal,

Je comprends que vous souhaitez ajuster votre méthode de gestion des tokens pour que votre proxy Next.js utilise correctement l'authentification Firebase. C'est une excellente approche pour sécuriser vos routes.

Après avoir examiné votre code, il semble que la logique principale de vérification du token Firebase dans verifyFirebaseToken soit déjà bien structurée. Le problème principal que je vois est que le proxy (qui est un middleware Next.js) ne transmet pas le token d'authentification à la fonction verifyFirebaseToken. Les navigateurs n'envoient pas automatiquement le token Firebase ID dans l'en-tête Authorization pour chaque requête après la connexion. Ce token doit être récupéré côté client et envoyé manuellement avec les requêtes protégées.

Voici les ajustements que je vous propose pour que votre système fonctionne correctement :

1. Côté Client (Frontend)
Vous devez vous assurer que votre application Next.js côté client récupère le token d'ID Firebase de l'utilisateur connecté et l'inclut dans l'en-tête Authorization de toutes les requêtes envoyées à vos routes protégées.

Exemple de récupération et d'envoi du token (par exemple, avec fetch ou axios) :


// Assurez-vous que Firebase est initialisé côté client
import { getAuth } from 'firebase/auth';

async function callProtectedApi() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    try {
      // Récupérer le token d'ID Firebase
      const idToken = await user.getIdToken();

      // Envoyer la requête à votre API ou à une route protégée via le proxy
      const response = await fetch('/api/protected-route', { // Ou une route comme /ad/dashboard
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Gérer les erreurs (ex: 401 Unauthorized, 403 Forbidden)
        if (response.status === 401) {
          console.error("Non autorisé : Token invalide ou manquant.");
          // Rediriger vers la page de connexion
        } else if (response.status === 403) {
          console.error("Accès refusé : Permissions insuffisantes.");
          // Rediriger vers une page d'accès refusé
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);

    } catch (error) {
      console.error("Erreur lors de l'appel à l'API protégée:", error);
    }
  } else {
    console.log("Aucun utilisateur connecté.");
    // Rediriger vers la page de connexion
  }
}

// Appeler cette fonction lorsque vous avez besoin d'accéder à une ressource protégée
// callProtectedApi();

Utilisez ce code avec précaution.
2. Côté Serveur (Votre proxy et auth-middleware)
Votre proxy Next.js est un middleware qui s'exécute sur le serveur. Il intercepte les requêtes avant qu'elles n'atteignent vos pages ou API. La fonction verifyFirebaseToken est déjà conçue pour extraire le token de l'en-tête Authorization.

Aucune modification majeure n'est nécessaire dans verifyFirebaseToken ou firebase-admin.ts, car ils sont déjà configurés pour vérifier le token une fois qu'il est présent dans l'en-tête de la requête.

Cependant, dans votre proxy actuel, la section pour les routes protégées est commentée :


  /**
   * 🔐 3. Routes protégées (nécessitent auth)
   */
  // if (!isAuthenticated) {
  //   return NextResponse.redirect(new URL('/auth/sign-up', request.url));
  // }

Utilisez ce code avec précaution.
Pour que les routes protégées fonctionnent, vous devez décommenter et activer cette logique.

Voici le proxy ajusté avec la logique décommentée et quelques améliorations pour la gestion des redirections :


// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyFirebaseToken } from './lib/server/auth-middleware';
import { getUserByFirebaseUid } from './lib/server/auth-utils'; // Assurez-vous que ce fichier existe et est correct

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques (accessibles sans être connecté)
  const publicRoutes = [
    '/',
    "/competitions", // Utilisez le chemin exact ou un pattern plus précis si nécessaire
    "/editions",
    "/fighters",
    '/about',
    '/contact',
    '/help',
    '/privacy',
    '/terms',
    '/maintenance',
    '/404',
    '/unauthorized',
    '/500',
  ];

  // Routes liées à l'auth que l'on doit BLOQUER si user est déjà connecté
  const authRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/sign-in',
    '/auth/sign-up',
  ];

  // Fonction utilitaire pour vérifier si un chemin correspond à une route (avec ou sans sous-chemins)
  const matchesRoute = (routeList: string[], path: string) => {
    return routeList.some(route => {
      if (route.endsWith('/**')) { // Gérer les jokers pour les sous-chemins
        const baseRoute = route.slice(0, -3);
        return path === baseRoute || path.startsWith(`${baseRoute}/`);
      }
      return path === route || path.startsWith(`${route}/`);
    });
  };

  const isPublicRoute = matchesRoute(publicRoutes, pathname);
  const isAuthRoute = matchesRoute(authRoutes, pathname);

  // On vérifie l'existence d'un token via le middleware
  const authResult = await verifyFirebaseToken(request);
  let isAuthenticated = !!authResult.user;
  let firebaseUser = authResult.user;
  let sqlUser: any = null;

  if (isAuthenticated && firebaseUser) {
    try {
      // On récupère l'utilisateur SQL
      sqlUser = await getUserByFirebaseUid(firebaseUser.uid);
    } catch (error) {
      console.error('Failed to fetch SQL user:', error);
      // Si l'utilisateur SQL ne peut pas être récupéré, on peut considérer l'utilisateur comme non authentifié pour les routes nécessitant des rôles
      // ou gérer cette erreur spécifiquement. Pour l'instant, on continue mais sqlUser sera null.
    }
  }

  /**
   * 🔄 1. Si utilisateur déjà connecté → empêcher l'accès aux pages auth
   */
  if (isAuthenticated && isAuthRoute) {
    // Rediriger vers le profil si déjà connecté et tente d'accéder à une page d'authentification
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  /**
   * 🟢 2. Accès aux routes publiques → autorisé
   */
  if (isPublicRoute) {
    const res = NextResponse.next();
    // Si l'utilisateur est authentifié, on peut ajouter ses infos aux headers pour les pages publiques
    if (isAuthenticated && firebaseUser && sqlUser) {
      res.headers.set('x-user-uid', firebaseUser.uid);
      res.headers.set('x-user-role', sqlUser.role || 'user');
    }
    return res;
  }

  /**
   * 🔐 3. Routes protégées (nécessitent auth)
   * Si la route n'est ni publique, ni une route d'authentification, elle est considérée comme protégée.
   * Si l'utilisateur n'est pas authentifié, il est redirigé vers la page de connexion.
   */
  if (!isAuthenticated) {
    // Rediriger vers la page de connexion/inscription si non authentifié
    // Vous pouvez ajouter un paramètre de redirection pour revenir à la page d'origine après connexion
    const redirectUrl = new URL('/auth/sign-in', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  /**
   * 🛡️ 4. Vérification pour les rôles avancés
   * Cette section s'exécute uniquement si l'utilisateur est authentifié.
   */
  const userRole = sqlUser?.role || 'user'; // Assurez-vous que sqlUser est bien défini ici

  // Admin only
  if (pathname.startsWith('/ad/')) {
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/auth/unauthorized?req=admin', request.url));
    }
  }

  // Éditeur
  if (pathname.startsWith('/editor/')) {
    if (!['admin', 'editor'].includes(userRole)) {
      return NextResponse.redirect(new URL('/auth/unauthorized?req=editor', request.url));
    }
  }

  // Manager
  if (pathname.startsWith('/manager/')) {
    if (!['admin', 'manager'].includes(userRole)) {
      return NextResponse.redirect(new URL('/auth/unauthorized?req=manager', request.url));
    }
  }

  /**
   * 🎫 5. Transmission des infos utilisateur aux pages Next.js
   * Si l'utilisateur est authentifié et a passé toutes les vérifications de rôle.
   */
  const response = NextResponse.next();
  if (firebaseUser) {
    response.headers.set('x-user-uid', firebaseUser.uid);
  }
  response.headers.set('x-user-role', userRole); // userRole est toujours défini ici

  return response;
}

export const config = {
  matcher: [
    // Exclure les fichiers statiques, les images, les icônes de favicon, et les routes d'API internes de Next.js
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

Utilisez ce code avec précaution.
Points clés des modifications :

Décommenter la section des routes protégées (if (!isAuthenticated)) : C'est crucial pour que votre middleware bloque l'accès aux routes non publiques et non d'authentification si l'utilisateur n'est pas connecté.
Gestion des redirections : J'ai ajouté un paramètre redirect à l'URL de connexion pour que l'utilisateur puisse être redirigé vers la page qu'il tentait d'atteindre après s'être connecté.
Fonction matchesRoute : J'ai créé une petite fonction utilitaire pour gérer plus proprement la correspondance des routes, notamment avec les jokers comme /**.
sqlUser dans les headers des routes publiques : J'ai ajusté la logique pour s'assurer que sqlUser est bien défini avant d'essayer d'accéder à sa propriété role lors de la définition des headers pour les routes publiques.
console.log("sqlUser", sqlUser); : J'ai retiré ce console.log car il n'est pas nécessaire en production et peut être bruyant.
3. auth-middleware.ts
Votre fichier auth-middleware.ts est déjà bien écrit pour la vérification du token. Aucune modification n'est nécessaire ici.


// lib/server/auth-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../firebase-admin';

export interface AuthUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export async function verifyFirebaseToken(request: NextRequest): Promise<{
  user: AuthUser | null;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Si aucun token n'est fourni, ce n'est pas une erreur mais un état non authentifié
      return { user: null, error: 'Token manquant ou format incorrect' };
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return { user: null, error: 'Token vide après Bearer' };
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const user: AuthUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

    return { user };

  } catch (error: any) {
    console.error('Error verifying Firebase token:', error);
    
    // Gérer les erreurs spécifiques de Firebase Auth
    if (error.code === 'auth/id-token-expired') {
      return { user: null, error: 'Token expiré' };
    }
    if (error.code === 'auth/id-token-revoked') {
      return { user: null, error: 'Token révoqué' };
    }
    if (error.code === 'auth/invalid-id-token') {
      return { user: null, error: 'Token invalide' };
    }
    
    return { user: null, error: 'Erreur de vérification du token' };
  }
}

// ... (le reste de votre fichier auth-middleware.ts reste inchangé)

Utilisez ce code avec précaution.
4. firebase-admin.ts
Ce fichier est également correct et ne nécessite pas de modifications.

En résumé
Le point crucial est de s'assurer que le token d'ID Firebase est envoyé par le client dans l'en-tête Authorization pour toutes les requêtes qui doivent être authentifiées. Votre middleware Next.js (proxy) se chargera ensuite de vérifier ce token et d'appliquer les règles d'accès et de rôle que vous avez définies.

N'hésitez pas si vous avez d'autres questions ou si vous rencontrez des difficultés après ces ajustements !