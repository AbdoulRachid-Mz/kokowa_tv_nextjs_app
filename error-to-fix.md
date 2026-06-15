See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was created)
✅ Connexion réussie à Neon PostgreSQL : 2026-06-15T16:06:51.069Z
○ Compiling /api/auth/sync ...
 POST / 200 in 54s (next.js: 19ms, application-code: 54s)
  └─ ƒ getAllAppSettings() in 4434ms actions/app-settings.ts
[browser] [2026-06-15T16:06:40.613Z]  @firebase/app-check: AppCheck: 400 error. Attempts allowed again after 00m:01s (appCheck/initial-throttle). (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_0_ghd7m._.js:2477:13)
[browser] [2026-06-15T16:06:40.615Z]  @firebase/app-check: AppCheck: 400 error. Attempts allowed again after 00m:01s (appCheck/initial-throttle). (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_0_ghd7m._.js:2477:13)
[browser] App Check indisponible (fallback autorisé): FirebaseError: AppCheck: 400 error. Attempts allowed again after 00m:01s (appCheck/initial-throttle).
    at ReCaptchaV3Provider.getToken (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/node_modules__pnpm_13drnqb._.js:10997:37) (file://C:/Users/user/Desktop/abdoul/react projets/kokowa_tv/.next/dev/static/chunks/0bij_next_dist_0_ghd7m._.js:2477:13)
✅ Firebase Admin déjà initialisé
 POST /api/auth/sync 401 in 14.5s (next.js: 13.7s, application-code: 878ms)
○ Compiling /api/auth/me ...
 GET /api/auth/me 401 in 7.5s (next.js: 7.5s, application-code: 17ms)