 POST /ad/matches/422 200 in 2.7s (next.js: 36ms, proxy.ts: 10ms, application-code: 2.6s)
  └─ ƒ sendMatchPush(422, "Match entre Ali Seyni et Mansour Issa debute !") in 2526ms actions/matches.ts
[db-perf] {"ms":146,"query":"SELECT fighter_cards","rows":1}
🔴 Passage du match 422 en live
   → 3 autre(s) sous-groupe(s) ongoing arrêté(s)
[2026-11-09T08:26:59.061Z]  @firebase/database: FIREBASE WARNING: {"code":"app/invalid-credential","message":"Credential implementation provided to initializeApp() via the \"credential\" property failed to fetch a valid Google OAuth2 access token with the following error: \"invalid_grant: Invalid JWT Signature.\". There are two likely causes: (1) your server time is not properly synced or (2) your certificate key file has been revoked. To solve (1), re-sync the time on your server. To solve (2), make sure the key ID for your key file is still present at https://console.firebase.google.com/iam-admin/serviceaccounts/project. If not, generate a new key file at https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk."}
[2026-11-09T08:27:02.698Z]  @firebase/database: FIREBASE WARNING: {"code":"app/invalid-credential","message":"Credential implementation provided to initializeApp() via the \"credential\" property failed to fetch a valid Google OAuth2 access token with the following error: \"invalid_grant: Invalid JWT Signature.\". There are two likely causes: (1) your server time is not properly synced or (2) your certificate key file has been revoked. To solve (1), re-sync the time on your server. To solve (2), make sure the key ID for your key file is still present at https://console.firebase.google.com/iam-admin/serviceaccounts/project. If not, generate a new key file at https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk."}
[2026-11-09T08:27:05.459Z]  @firebase/database: FIREBASE WARNING: {"code":"app/invalid-credential","message":"Credential implementation provided to initializeApp() via the \"credential\" property failed to fetch a valid Google OAuth2 access token with the following error: \"invalid_grant: Invalid JWT Signature.\". There are two likely causes: (1) your server time is not properly synced or (2) your certificate key file has been revoked. To solve (1), re-sync the time on your server. To solve (2), make sure the key ID for your key file is still present at https://console.firebase.google.com/iam-admin/serviceaccounts/project. If not, generate a new key file at https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk."}
[2026-11-09T08:27:33.959Z]  @firebase/database: FIREBASE WARNING: {"code":"app/invalid-credential","message":"Credential implementation provided to initializeApp() via the \"credential\" property failed to fetch a valid Google OAuth2 access token with the following error: \"invalid_grant: Invalid JWT Signature.\". There are two likely causes: (1) your server time is not properly synced or (2) your certificate key file has been revoked. To solve (1), re-sync the time on your server. To solve (2), make sure the key ID for your key file is still present at https://console.firebase.google.com/iam-admin/serviceaccounts/project. If not, generate a new key file at https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk."}
[2026-11-09T08:28:08.761Z]  @firebase/database: FIREBASE WARNING: {"code":"app/invalid-credential","message":"Credential implementation provided to initializeApp() via the \"credential\" property failed to fetch a valid Google OAuth2 access token with the following error: \"invalid_grant: Invalid JWT Signature.\". There are two likely causes: (1) your server time is not properly synced or (2) your certificate key file has been revoked. To solve (1), re-sync the time on your server. To solve (2), make sure the key ID for your key file is still present at https://console.firebase.google.com/iam-admin/serviceaccounts/project. If not, generate a new key file at https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk."}
[2026-11-09T08:28:17.010Z]  @firebase/database: FIREBASE WARNING: {"code":"app/invalid-credential","message":"Credential implementation provided to initializeApp() via the \"credential\" property failed to fetch a valid Google OAuth2 access token with the following error: \"invalid_grant: Invalid JWT Signature.\". There are two likely causes: (1) your server time is not properly synced or (2) your certificate key file has been revoked. To solve (1), re-sync the time on your server. To solve (2), make sure the key ID for your key file is still present at https://console.firebase.google.com/iam-admin/serviceaccounts/project. If not, generate a new key file at https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk."}


## 2eme teste apres rechargement de la page:
[db-perf][slow-query] {"ms":677,"query":"SELECT fighter_cards","rows":1,"retryable":true}
 POST /ad/matches/422 200 in 793ms (next.js: 50ms, proxy.ts: 23ms, application-code: 719ms)
  └─ ƒ getMatchById(422) in 679ms actions/matches-2.ts
📤 Envoi push au topic: global {
  topic: 'global',
  notification: {
    title: '🔥 Match en direct',
    body: 'Match entre Ali Seyni et Mansour Issa debute !'
  },
  data: { click_action: 'FLUTTER_NOTIFICATION_CLICK', sound: 'default' },
  android: {
    priority: 'high',
    notification: { channelId: 'match_channel', sound: 'default', priority: 'high' }
  },
  apns: { payload: { aps: [Object] }, headers: { 'apns-priority': '10' } }
}
❌ Erreur push topic: Error: Credential implementation provided to initializeApp() via the "credential" property failed to fetch a valid Google OAuth2 access token with the following error: "invalid_grant: Invalid JWT Signature.". There are two likely causes: (1) your server time is not properly synced or (2) your certificate key file has been revoked. To solve (1), re-sync the time on your server. To solve (2), make sure the key ID for your key file is still present at https://console.firebase.google.com/iam-admin/serviceaccounts/project. If not, generate a new key file at https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk.
    at async sendPushToTopic (lib\push.ts:88:22)
    at async sendMatchPush (actions\matches.ts:1100:3)
  86 |
  87 |     console.log('📤 Envoi push au topic:', cleanTopic, message);
> 88 |     const response = await admin.messaging().send(message);
     |                      ^
  89 |     console.log('✅ Push envoyée au topic:', response);
  90 |     return { success: true, response };
  91 |   } catch (error) { {
  errorInfo: {
    code: 'app/invalid-credential',
    message: 'Credential implementation provided to initializeApp() via the "credential" property failed to fetch a valid Google OAuth2 access token with the following error: "invalid_grant: Invalid JWT Signature.". There are two likely causes: (1) your server time is not properly synced or (2) your certificate key file has been revoked. To solve (1), re-sync the time on your server. To solve (2), make sure the key ID for your key file is still present at https://console.firebase.google.com/iam-admin/serviceaccounts/project. If not, generate a new key file at https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk.'
  },
  codePrefix: 'app'
}
 POST /ad/matches/422 200 in 1128ms (next.js: 34ms, proxy.ts: 10ms, application-code: 1083ms)
  └─ ƒ sendMatchPush(422, "Match entre Ali Seyni et Mansour Issa debute !") in 1048ms actions/matches.ts
[db-perf] {"ms":140,"query":"SELECT fighter_cards","rows":1}
🔴 Passage du match 422 en live
   → 3 autre(s) sous-groupe(s) ongoing arrêté(s)
[2026-11-09T08:35:52.978Z]  @firebase/database: FIREBASE WARNING: {"code":"app/invalid-credential","message":"Credential implementation provided to initializeApp() via the \"credential\" property failed to fetch a valid Google OAuth2 access token with the following error: \"invalid_grant: Invalid JWT Signature.\". There are two likely causes: (1) your server time is not properly synced or (2) your certificate key file has been revoked. To solve (1), re-sync the time on your server. To solve (2), make sure the key ID for your key file is still present at https://console.firebase.google.com/iam-admin/serviceaccounts/project. If not, generate a new key file at https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk."}


## dans la page realtime:
POST /ad/realtime 200 in 315ms (next.js: 129ms, proxy.ts: 13ms, application-code: 172ms)
  └─ ƒ getAllAppSettings() in 134ms actions/app-settings.ts
[db-perf] {"ms":139,"query":"SELECT users","rows":1}
[db-perf][slow-query] {"ms":3767,"query":"UPDATE users","rows":1,"retryable":false}
[api-perf] {"requestId":"771e5296-b00b-4e25-af2a-2be71992fc08","method":"POST","path":"/api/auth/sync","status":200,"appId":"undefined","totalMs":3913,"appIdMs":0,"rateLimitMs":1,"authMs":1,"handlerMs":3909,"sqlCount":2,"sqlMs":3906,"slowestSqlMs":3767,"slowestSql":"UPDATE users","serializationMs":0,"responseBytes":502,"sampled":true}
 POST /api/auth/sync 200 in 11.0s (next.js: 7.0s, proxy.ts: 14ms, application-code: 3.9s)
 POST /ad/realtime 200 in 121ms (next.js: 64ms, proxy.ts: 14ms, application-code: 43ms)
  └─ ƒ getRealtimeStats() in 1ms actions/realtime.ts
 POST /ad/realtime 200 in 114ms (next.js: 28ms, proxy.ts: 31ms, application-code: 54ms)
  └─ ƒ getRealtimeStats() in 0ms actions/realtime.ts
[db-perf][slow-query] {"ms":577,"query":"SELECT matches","rows":1,"retryable":true}
[db-perf] {"ms":199,"query":"SELECT fighter_cards","rows":0}
[2026-11-09T08:38:59.266Z]  @firebase/database: FIREBASE WARNING: {"code":"app/invalid-credential","message":"Credential implementation provided to initializeApp() via the \"credential\" property failed to fetch a valid Google OAuth2 access token with the following error: \"invalid_grant: Invalid JWT Signature.\". There are two likely causes: (1) your server time is not properly synced or (2) your certificate key file has been revoked. To solve (1), re-sync the time on your server. To solve (2), make sure the key ID for your key file is still present at https://console.firebase.google.com/iam-admin/serviceaccounts/project. If not, generate a new key file at https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk."}
RTDB remove error: Error: rtdb ref.remove timeout after 8000ms
    at Timeout._onTimeout (lib\realtime\rtdb-sync.ts:15:31)
  13 |     p,
  14 |     new Promise<T>((_, reject) =>
> 15 |       setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms),
     |                               ^
  16 |     ),
  17 |   ]);
  18 | }
 POST /ad/realtime 200 in 8.9s (next.js: 24ms, proxy.ts: 19ms, application-code: 8.8s)
  └─ ƒ forceSyncMatch(422) in 8800ms actions/realtime.ts
 POST /ad/realtime 200 in 2.8s (next.js: 2.8s, proxy.ts: 13ms, application-code: 44ms)
  └─ ƒ getRealtimeStats() in 0ms actions/realtime.ts


  ## 2eme teste:
   POST /ad/realtime 200 in 8.9s (next.js: 24ms, proxy.ts: 19ms, application-code: 8.8s)
  └─ ƒ forceSyncMatch(422) in 8800ms actions/realtime.ts
 POST /ad/realtime 200 in 2.8s (next.js: 2.8s, proxy.ts: 13ms, application-code: 44ms)
  └─ ƒ getRealtimeStats() in 0ms actions/realtime.ts
[db-perf][slow-query] {"ms":589,"query":"SELECT matches","rows":1,"retryable":true}
[db-perf] {"ms":146,"query":"SELECT fighter_cards","rows":0}
[2026-11-09T08:40:38.760Z]  @firebase/database: FIREBASE WARNING: {"code":"app/invalid-credential","message":"Credential implementation provided to initializeApp() via the \"credential\" property failed to fetch a valid Google OAuth2 access token with the following error: \"invalid_grant: Invalid JWT Signature.\". There are two likely causes: (1) your server time is not properly synced or (2) your certificate key file has been revoked. To solve (1), re-sync the time on your server. To solve (2), make sure the key ID for your key file is still present at https://console.firebase.google.com/iam-admin/serviceaccounts/project. If not, generate a new key file at https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk."}
RTDB remove error: Error: rtdb ref.remove timeout after 8000ms
    at Timeout._onTimeout (lib\realtime\rtdb-sync.ts:15:31)
  13 |     p,
  14 |     new Promise<T>((_, reject) =>
> 15 |       setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms),
     |                               ^
  16 |     ),
  17 |   ]);
  18 | }
 POST /ad/realtime 200 in 12.4s (next.js: 3.6s, proxy.ts: 11ms, application-code: 8.8s)
  └─ ƒ forceSyncMatch(422) in 8753ms actions/realtime.ts
 POST /ad/realtime 200 in 262ms (next.js: 214ms, proxy.ts: 13ms, application-code: 36ms)
  └─ ƒ getRealtimeStats() in 0ms actions/realtime.ts
error: terminating connection due to idle-in-transaction timeout
    at ignore-listed frames {
  length: 122,
  severity: 'FATAL',
  code: '25P03',
  detail: undefined,
  hint: undefined,
  position: undefined,
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  schema: undefined,
  table: undefined,
  column: undefined,
  dataType: undefined,
  constraint: undefined,
  file: 'postgres.c',
  line: '3471',
  routine: 'ProcessInterrupts'
}
⨯ uncaughtException: error: terminating connection due to idle-in-transaction timeout
    at ignore-listed frames {
  length: 122,
  severity: 'FATAL',
  code: '25P03',
  detail: undefined,
  hint: undefined,
  position: undefined,
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  schema: undefined,
  table: undefined,
  column: undefined,
  dataType: undefined,
  constraint: undefined,
  file: 'postgres.c',
  line: '3471',
  routine: 'ProcessInterrupts'
}
⨯ uncaughtException:  error: terminating connection due to idle-in-transaction timeout
    at ignore-listed frames {
  length: 122,
  severity: 'FATAL',
  code: '25P03',
  detail: undefined,
  hint: undefined,
  position: undefined,
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  schema: undefined,
  table: undefined,
  column: undefined,
  dataType: undefined,
  constraint: undefined,
  file: 'postgres.c',
  line: '3471',
  routine: 'ProcessInterrupts'
}
