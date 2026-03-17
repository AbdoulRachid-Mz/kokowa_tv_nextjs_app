import next from "next";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { wsConnectionManager } from "@/lib/realtime/ws-connection-manager";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {

  const server = createServer((req, res) => {
    handle(req, res);
  });

  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    wsConnectionManager.addClient(ws, req);
  });

  server.listen(3000, () => {
    console.log("🚀 Next.js + WebSocket running on 3000");
  });

});