/* One person's Roxan, as a Durable Object: a private SQLite database, an alarm
   clock that wakes it for routines, and the WebSockets the open pages listen on.
   All of the thinking is in core.js; this only connects it to the platform.

   Pages that are open hear everything as it happens (messages growing word by
   word, steps, status). A page that was closed hears nothing and asks for the
   state when it opens, so nothing depends on anyone listening. */
import { DurableObject } from "cloudflare:workers";
import { Store } from "./db.js";
import { Core } from "./core.js";
import { realModel } from "./model.js";
import { route } from "./api.js";
import { Invalid } from "./util.js";

const MAX_BODY = 12 * 1024 * 1024;
const HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" };
const reply = (status, body, headers) => new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...headers } });

export class Agent extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
    this.core = new Core({
      store: new Store(ctx.storage.sql), env,
      model: env.ROXAN_MODEL_KEY ? realModel(env) : null,
      emit: m => { const s = JSON.stringify(m); for (const ws of ctx.getWebSockets()) try { ws.send(s); } catch { /* that page has gone */ } },
      alarm: t => (t == null ? ctx.storage.deleteAlarm() : ctx.storage.setAlarm(t)),
    });
    ctx.blockConcurrencyWhile(async () => { this.core.recover(); this.core.rearm(); });
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/api/live") {
      if (request.headers.get("upgrade") !== "websocket") return reply(426, { error: { code: "upgrade", message: "Open this as a WebSocket." } });
      const [client, server] = Object.values(new WebSocketPair());
      this.ctx.acceptWebSocket(server);
      server.send(JSON.stringify({ t: "hello", now: Date.now() }));
      return new Response(null, { status: 101, webSocket: client });
    }
    try {
      let body;
      if (request.method !== "GET" && request.method !== "DELETE") {
        if (Number(request.headers.get("content-length")) > MAX_BODY) throw new Invalid("That is too much to send at once.", 413);
        const text = await request.text();
        if (text.length > MAX_BODY) throw new Invalid("That is too much to send at once.", 413);
        try { body = text ? JSON.parse(text) : {}; } catch { throw new Invalid("That was not valid JSON."); }
      }
      const r = await route(this.core, request.method, url.pathname.slice(5).split("/").filter(Boolean), url.searchParams, body);
      return reply(r.status, r.body, r.headers);
    } catch (e) {
      if (e instanceof Invalid) return reply(e.status, { error: { code: "request", message: e.message } });
      console.error("roxan api", e?.name ?? "", e?.message?.slice(0, 120) ?? "");
      return reply(500, { error: { code: "server", message: "Something went wrong on Roxan's side." } });
    }
  }

  alarm() { this.core.alarm(); }
  webSocketMessage() { /* pages only listen; "ping" is answered without waking this */ }
  webSocketClose(ws, code) { try { ws.close(code); } catch { /* already closed */ } }
}
