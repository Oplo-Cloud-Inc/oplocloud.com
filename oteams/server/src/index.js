// OTeams API — HTTP + WebSocket, fronted by Caddy in production.
import http from "node:http";
import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import pino from "pino";
import { ZodError } from "zod";
import { doubleCsrf } from "csrf-csrf";
import { config } from "./config.js";
import { migrate } from "./migrate.js";
import { ensureBucket } from "./storage.js";
import { attachRealtime } from "./realtime.js";
import { pool } from "./db.js";
import routes from "./routes.js";
import { bootstrapWorkspace } from "./bootstrap.js";

const logger = pino({ level: config.env === "production" ? "info" : "debug" });
const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(pinoHttp({ logger, autoLogging: { ignore: req => req.url === "/healthz" } }));
app.use(express.json({ limit: "1mb" }));

// CSRF protection using double-submit cookie pattern
// The token is sent as both a cookie and a request header
const csrfSecret = process.env.CSRF_SECRET || config.env === "production" 
  ? (process.env.CSRF_SECRET_KEY || crypto.randomUUID())
  : "insecure-dev-secret-change-in-production";

const { generateToken, validateRequest, doubleCsrfProtection } = doubleCsrf({
  secret: csrfSecret,
  cookieName: "__Host-csrf_token",
  cookieOptions: {
    secure: config.env === "production",
    sameSite: "strict",
    path: "/",
    httpOnly: true,
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getTokenFromRequest: (req) => req.headers["x-csrf-token"],
});

// Expose CSRF token generation endpoint for the frontend
app.get("/api/csrf-token", (req, res) => {
  const token = generateToken(req, res);
  res.json({ csrfToken: token });
});

// Apply CSRF protection to all state-changing API routes
app.use("/api", doubleCsrfProtection);

// Rate limiting middleware — simple in-memory sliding window
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // per IP per window

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const now = Date.now();
  let record = rateLimitStore.get(ip);
  
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    record = { windowStart: now, count: 1 };
    rateLimitStore.set(ip, record);
  } else {
    record.count++;
    if (record.count > RATE_LIMIT_MAX_REQUESTS) {
      return res.status(429).json({ error: "too_many_requests", retryAfter: Math.ceil((record.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000) });
    }
  }
  
  // Cleanup old entries periodically (every 1000 requests)
  if (rateLimitStore.size > 10000) {
    for (const [key, val] of rateLimitStore.entries()) {
      if (now - val.windowStart > RATE_LIMIT_WINDOW_MS * 2) rateLimitStore.delete(key);
    }
  }
  
  next();
}

app.use(rateLimiter);

app.use(cors({
  origin(origin, cb) {
    // Same-origin / curl (no Origin header) is always allowed.
    if (!origin) return cb(null, true);
    if (config.corsOrigins.length === 0) return cb(null, true);
    return cb(null, config.corsOrigins.includes(origin));
  },
  credentials: true,
}));

app.use(routes);

app.use((_req, res) => res.status(404).json({ error: "not_found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "invalid_request", details: err.issues });
  }
  const status = err.status || 500;
  if (status >= 500) req.log?.error({ err }, "unhandled error");
  res.status(status).json({ error: err.message || "server_error" });
});

const server = http.createServer(app);
attachRealtime(server);

async function start() {
  await migrate();
  await ensureBucket();
  await bootstrapWorkspace();
  server.listen(config.port, () => {
    logger.info(`OTeams API listening on :${config.port} (${config.env})`);
    logger.info(`  OIDC issuer : ${config.oidc.issuer || "(unset!)"}`);
    logger.info(`  WebSocket   : ws://…:${config.port}/ws`);
  });
}

async function shutdown(signal) {
  logger.info(`${signal} — shutting down`);
  server.close(() => {});
  try { await pool.end(); } catch {}
  setTimeout(() => process.exit(0), 2000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", err => logger.error({ err }, "unhandledRejection"));

start().catch(err => { logger.error({ err }, "failed to start"); process.exit(1); });
