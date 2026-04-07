// @/server/ws-connection-manager.ts
import { WebSocket } from "ws";
import { IncomingMessage } from "http";
import {
  WSClient,
  WSMessage,
  WSMessageType,
  SubscriptionData,
  RealtimeUpdatePayload,
  ServerStats,
  Platform,
  RedisMessage,
} from "./ws-types";

import * as admin from "firebase-admin";
import { createClient, RedisClientType } from "redis";
import crypto from "crypto";

// ================= CONFIG =================

const RATE_LIMIT = {
  MESSAGES_PER_MINUTE: 60,
  SUBSCRIBES_PER_MINUTE: 30,
  WINDOW_MS: 60000,
};

const PING_FREQ = 30000;
const CLIENT_TIMEOUT = 65000;

const REDIS_CHANNEL = "ws:broadcast";

// ================= CLASS =================

class WSConnectionManager {
  private clients = new Map<string, WSClient>();
  private rooms = new Map<string, Set<string>>();

  private pubClient: RedisClientType | null = null;
  private subClient: RedisClientType | null = null;

  private instanceId: string;

  private pingInterval: NodeJS.Timeout | null = null;
  private rateLimitInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.instanceId = crypto.randomBytes(12).toString("hex");

    this.init();
  }

  // ================= INIT =================

  private async init() {
    this.startHeartbeat();
    this.startRateLimitCleanup();
    await this.connectRedis();
  }

  private async connectRedis() {
    if (!process.env.REDIS_WS_URL) {
      console.warn("⚠️ No Redis → single instance mode");
      return;
    }

    try {
      this.pubClient = createClient({
        url: process.env.REDIS_WS_URL,
      });

      this.subClient = this.pubClient.duplicate();

      await this.pubClient.connect();
      await this.subClient.connect();

      console.log(`✅ Redis connected (${this.instanceId})`);

      await this.subClient.subscribe(REDIS_CHANNEL, (message) => {
        try {
          const parsed: RedisMessage = JSON.parse(message);

          if (parsed.instanceId === this.instanceId) return;

          this.broadcastToLocal(parsed.payload);
        } catch (err) {
          console.error("❌ Redis parse error:", err);
        }
      });
    } catch (err) {
      console.error("❌ Redis connection failed:", err);
      this.pubClient = null;
      this.subClient = null;
    }
  }

  // ================= CLIENT =================

  public addClient(ws: WebSocket, req: IncomingMessage) {
    const id = crypto.randomBytes(8).toString("hex");

    const client: WSClient = {
      id,
      ws,
      authenticated: false,
      subscriptions: new Set(),
      connectedAt: new Date(),
      userAgent: req.headers["user-agent"] || "",
      platform: this.detectPlatform(req.headers["user-agent"] || ""),
      lastPing: Date.now(),
      rateLimit: {
        messageCount: 0,
        subscribeCount: 0,
        lastReset: Date.now(),
      },
    };

    this.clients.set(id, client);

    ws.on("message", (data) => this.handleMessage(id, data));
    ws.on("close", () => this.removeClient(id));
    ws.on("error", () => this.removeClient(id));
    ws.on("pong", () => (client.lastPing = Date.now()));

    this.send(id, "connected", {
      clientId: id,
      instanceId: this.instanceId,
    });

    return id;
  }

  private removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.forEach((room) => {
      const set = this.rooms.get(room);
      set?.delete(clientId);

      if (set?.size === 0) this.rooms.delete(room);
    });

    this.clients.delete(clientId);

    if (client.ws.readyState !== WebSocket.CLOSED) {
      client.ws.terminate();
    }
  }

  // ================= MESSAGE =================

  private async handleMessage(clientId: string, raw: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (!this.checkRateLimit(client, "message")) {
      return this.send(clientId, "rate_limit_exceeded", {});
    }

    try {
      const msg: WSMessage = JSON.parse(raw.toString());

      switch (msg.type) {
        case "auth":
          await this.handleAuth(client, msg.data);
          break;

        case "subscribe":
          this.handleSubscribe(client, msg.data);
          break;

        case "unsubscribe":
          this.handleUnsubscribe(client, msg.data);
          break;

        case "ping":
          this.send(clientId, "pong", {});
          break;
      }
    } catch {
      this.send(clientId, "error", { message: "Invalid message" });
    }
  }

  private async handleAuth(client: WSClient, data: any) {
    try {
      const decoded = await admin.auth().verifyIdToken(data.token);

      client.userId = decoded.uid;
      client.authenticated = true;

      this.send(client.id, "auth_success", { userId: decoded.uid });
    } catch {
      this.send(client.id, "error", { message: "Auth failed" });
    }
  }

  private handleSubscribe(client: WSClient, data: SubscriptionData) {
    if (!this.checkRateLimit(client, "subscribe")) return;

    const room = `${data.entityType}:${data.entityId}`;

    client.subscriptions.add(room);

    if (!this.rooms.has(room)) this.rooms.set(room, new Set());

    this.rooms.get(room)!.add(client.id);

    this.send(client.id, "subscribed", data);
  }

  private handleUnsubscribe(client: WSClient, data: SubscriptionData) {
    const room = `${data.entityType}:${data.entityId}`;

    client.subscriptions.delete(room);
    this.rooms.get(room)?.delete(client.id);
  }

  // ================= BROADCAST =================

  public broadcast(payload: RealtimeUpdatePayload) {
    this.broadcastToLocal(payload);

    if (this.pubClient) {
      const msg: RedisMessage = {
        type: "broadcast",
        payload,
        instanceId: this.instanceId,
        timestamp: Date.now(),
      };

      this.pubClient.publish(REDIS_CHANNEL, JSON.stringify(msg));
    }
  }

  private broadcastToLocal(payload: RealtimeUpdatePayload) {
    const room = `${payload.entityType}:${payload.entityId}`;
    const clients = this.rooms.get(room);

    if (!clients) return;

    const message = JSON.stringify({
      type: "update",
      data: payload,
    });

    clients.forEach((id) => {
      const c = this.clients.get(id);
      if (c?.ws.readyState === WebSocket.OPEN) {
        c.ws.send(message);
      }
    });
  }

  // ================= UTILS =================

  private send(clientId: string, type: WSMessageType, data: any) {
    const client = this.clients.get(clientId);
    if (client?.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({ type, data }));
    }
  }

  private detectPlatform(ua: string): Platform {
    if (ua.includes("Flutter")) return "flutter";
    if (ua.includes("Mozilla")) return "web";
    return "unknown";
  }

  private checkRateLimit(client: WSClient, type: "message" | "subscribe") {
    const now = Date.now();

    if (now - client.rateLimit.lastReset > RATE_LIMIT.WINDOW_MS) {
      client.rateLimit.messageCount = 0;
      client.rateLimit.subscribeCount = 0;
      client.rateLimit.lastReset = now;
    }

    if (type === "message") {
      return ++client.rateLimit.messageCount <= RATE_LIMIT.MESSAGES_PER_MINUTE;
    }

    return (
      ++client.rateLimit.subscribeCount <= RATE_LIMIT.SUBSCRIBES_PER_MINUTE
    );
  }

  private startHeartbeat() {
    this.pingInterval = setInterval(() => {
      const now = Date.now();

      this.clients.forEach((c, id) => {
        if (now - c.lastPing > CLIENT_TIMEOUT) {
          this.removeClient(id);
        } else {
          c.ws.ping();
        }
      });
    }, PING_FREQ);
  }

  private startRateLimitCleanup() {
    this.rateLimitInterval = setInterval(() => {
      const now = Date.now();

      this.clients.forEach((c) => {
        if (now - c.rateLimit.lastReset > RATE_LIMIT.WINDOW_MS) {
          c.rateLimit.messageCount = 0;
          c.rateLimit.subscribeCount = 0;
          c.rateLimit.lastReset = now;
        }
      });
    }, RATE_LIMIT.WINDOW_MS);
  }

  public getStats(): ServerStats {
    return {
      totalClients: this.clients.size,
      activeSubscriptions: this.rooms.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      redisConnected: !!this.pubClient,
      instanceId: this.instanceId,
      clientsByPlatform: { web: 0, flutter: 0, unknown: 0 },
      authenticatedClients: 0,
      rateLimitedClients: 0,
    };
  }

  public async shutdown() {
    this.clients.forEach((c) => c.ws.close());

    if (this.pubClient) await this.pubClient.quit();
    if (this.subClient) await this.subClient.quit();

    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.rateLimitInterval) clearInterval(this.rateLimitInterval);
  }
}

// ================= SINGLETON =================

export const wsManager = (global as any).wsManager || new WSConnectionManager();

if (process.env.NODE_ENV !== "production") {
  (global as any).wsManager = wsManager;
}
