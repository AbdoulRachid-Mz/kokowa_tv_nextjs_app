You are a senior backend engineer specialized in Node.js, WebSockets, and scalable realtime systems.

I have an existing WebSocket system using:

* Node.js + ws
* Custom WSConnectionManager with rooms (entityType:entityId)
* Next.js frontend
* Realtime client with auto-reconnect
* Deployed on Railway (https://kokowa-tv.up.railway.app/)

The system works perfectly in local but is NOT production ready.

Your task is to refactor and upgrade the system to a fully production-ready architecture for Web + Flutter clients.

---

## 🔴 CURRENT ISSUES TO FIX

1. Authentication is NOT secure:

* Currently any client can send `{ type: "auth", userId, token }`
* No verification is done

2. No authorization:

* Any client can subscribe to any room

3. Not scalable:

* Uses in-memory Map for clients and rooms
* Will break with multiple Railway instances

4. WebSocket URL is hardcoded to localhost

5. No rate limiting (possible abuse)

6. No centralized event broadcasting

---

## 🎯 OBJECTIVES

Refactor the system with:

### ✅ 1. Secure Authentication

* Use JWT verification
* Reject invalid tokens
* Extract userId from token (do NOT trust client input)

### ✅ 2. Authorization Layer

* Prevent unauthorized subscriptions
* Add optional room access control

### ✅ 3. Redis Pub/Sub (MANDATORY)

* Use Redis to sync events across instances
* Publish events from backend
* Subscribe in WS server and broadcast to clients

### ✅ 4. Environment-based config

* Use:

  * NEXT_PUBLIC_WS_URL (frontend)
  * WS_PORT
  * REDIS_URL
* Automatically switch between:

  * ws:// (dev)
  * wss:// (prod)

### ✅ 5. Railway-ready WebSocket setup

* Use correct host (no localhost)
* Support secure WebSocket (wss)
* Ensure compatibility with Railway deployment

### ✅ 6. Rate limiting

* Limit messages per client (e.g. 10/sec)
* Prevent spam subscribe/unsubscribe

### ✅ 7. Robust connection handling

* Keep heartbeat system
* Improve cleanup
* Prevent memory leaks

### ✅ 8. Event-driven architecture

* Add a central function:
  broadcastEvent(payload)
* Publish to Redis instead of direct broadcast

### ✅ 9. Improve typing

* Replace string event types with enums
* Strong typing for messages

---

## 📦 EXPECTED OUTPUT

Provide:

1. Updated WebSocket server (full code)
2. Updated WSConnectionManager (refactored)
3. Redis integration (pub/sub)
4. Secure auth implementation
5. Updated RealtimeClient (if needed)
6. ENV example for Railway
7. Instructions for deployment
8. Flutter compatibility notes

---

## ⚠️ CONSTRAINTS

* Keep the same overall architecture (rooms, subscriptions)
* Do NOT introduce heavy frameworks (no Socket.io)
* Keep ws library
* Code must be clean, modular, and production-grade

---

## BONUS (if possible)

* Add logging system
* Add metrics endpoint (/metrics)
* Add basic role-based access control
* Suggest horizontal scaling strategy

---

Make the system scalable, secure, and ready for thousands of concurrent users across Web and Flutter.
