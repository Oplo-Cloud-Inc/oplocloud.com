// Central config. Reads .env (via docker compose env_file or the shell) once.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Minimal .env loader so `npm start` works without extra deps.
const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, "..", ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const key = m[1];
    let val = m[2].replace(/^["']|["']$/g, "");
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

const num = (v, d) => (v == null || v === "" ? d : Number(v));
const bool = (v, d) => (v == null || v === "" ? d : /^(1|true|yes)$/i.test(v));

export const config = {
  env: process.env.NODE_ENV || "development",
  port: num(process.env.PORT, 8787),
  corsOrigins: (process.env.CORS_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean),

  databaseUrl: process.env.DATABASE_URL || "postgres://oteams:oteams@localhost:5432/oteams",

  oidc: {
    issuer: (process.env.OIDC_ISSUER || "").replace(/\/+$/, ""),
    audience: process.env.OIDC_AUDIENCE || "",
    cacheTtl: num(process.env.AUTH_CACHE_TTL, 300),
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
    publicEndpoint: process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT || "http://localhost:9000",
    region: process.env.S3_REGION || "us-east-1",
    bucket: process.env.S3_BUCKET || "oteams",
    accessKey: process.env.S3_ACCESS_KEY || "",
    secretKey: process.env.S3_SECRET_KEY || "",
    forcePathStyle: bool(process.env.S3_FORCE_PATH_STYLE, true),
    maxUploadBytes: num(process.env.MAX_UPLOAD_BYTES, 25 * 1024 * 1024),
  },

  webrtc: {
    turnUrl: process.env.TURN_URL || "",
    turnUser: process.env.TURN_USER || "",
    turnPassword: process.env.TURN_PASSWORD || "",
    stunUrl: process.env.STUN_URL || "stun:stun.l.google.com:19302",
  },

  bootstrap: {
    ownerEmail: (process.env.BOOTSTRAP_OWNER_EMAIL || "").toLowerCase(),
    workspaceName: process.env.BOOTSTRAP_WORKSPACE_NAME || "Northwind",
    workspaceSlug: process.env.BOOTSTRAP_WORKSPACE_SLUG || "northwind",
  },
};

if (!config.oidc.issuer) {
  console.warn("[config] OIDC_ISSUER is not set — every request will be rejected as unauthenticated.");
}
