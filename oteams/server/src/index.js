// OTeams API — HTTP + WebSocket, fronted by Caddy in production.
import http from "node:http";
import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import pino from "pino";
import { ZodError } from "zod";
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
