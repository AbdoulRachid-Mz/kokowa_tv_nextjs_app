:'Trying to verify as session cookie
Session cookie verification failed, trying ID token: Error: Firebase session cookie has incorrect "iss" (issuer) claim. Expected "" but got "". Make sure the session cookie comes from the same Firebase project as the service account used to authenticate this SDK. See  for details on how to retrieve a session cookie.
    at async verifyFirebaseToken (lib\server\auth-middleware.ts:53:22)
    at async apiHandler (lib\server\api-handler.ts:219:26)
  51 |       console.log('Trying to verify as session cookie');
  52 |       // Essayer comme session cookie d'abord
> 53 |       decodedToken = await adminAuth.verifySessionCookie(token, true);
     |                      ^
  54 |       console.log('Successfully verified as session cookie');
  55 |     } catch (sessionError) {
  56 |       console.log('Session cookie verification failed, trying ID token:', sessionErr... {
  errorInfo: {
    code: 'auth/argument-error',
    message: 'Firebase session cookie has incorrect "iss" (issuer) claim. Expected "" but got "". Make sure the session cookie comes from the same Firebase project as the service account used to authenticate this SDK. See  for details on how to retrieve a session cookie.'
  },
  codePrefix: 'auth'
}
Successfully verified as ID token
Token verified, returning user
Calling sync API, ctx: {
  params: undefined,
  appId: 'web-client',
  user: {
    uid: 'jHPGHLJMtmWEOwGrXGhFbMtIKyD3',
    email: 'rashwrightmz@gmail.com',
    email_verified: true,
    name: 'Abdoul Rachid Awal',
    picture: '',
    role: 'user',
    permissions: []
  },
  firebaseUser: {
    uid: 'jHPGHLJMtmWEOwGrXGhFbMtIKyD3',
    email: 'rashwrightmz@gmail.com',
    email_verified: true,
    name: 'Abdoul Rachid Awal',
    picture: '',
    role: 'user',
    permissions: []
  }
}
🔍 SQL: SELECT id, auth_id, username, email, role, first_name, last_name, profile_picture, is_active, is_verified, created_at ...
🔍 SQL: UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1 ...
 POST /api/auth/sync 200 in 4.4s (next.js: 1562ms, application-code: 2.8s)
🔍 SQL: SELECT  ...
🔍 SQL: SELECT  ...
🔍 SQL: SELECT  ...
🔍 SQL: SELECT  ...
🔍 SQL: SELECT  ...
🔍 SQL: SELECT  ...
🔍 SQL: SELECT  ...
🔍 SQL: SELECT  ...
🔍 SQL: SELECT  ...
🔍 SQL: SELECT COUNT(*) as total FROM messages ...
🔍 SQL: SELECT  ...
🔍 SQL: SELECT  ...
🔍 SQL: SELECT  ...
 POST / 200 in 411ms (next.js: 9ms, application-code: 403ms)
  └─ ƒ getGlobalStats() in 381ms actions/stats.ts
🔍 SQL: SELECT COUNT(DISTINCT m.id) as total ...
🔍 SQL: SELECT m.*,  ...
 POST / 200 in 464ms (next.js: 8ms, application-code: 456ms)
  └─ ƒ getMatches({"limit":10,"status":"live"}) in 409ms actions/matches.ts
🔍 SQL: SELECT  ...
🔍 SQL: SELECT  ...