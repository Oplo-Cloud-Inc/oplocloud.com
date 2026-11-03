// Request ids (X4): node api/scripts/test-request-id.mjs
//
// Every error the API sends carries error.requestId; the same id is in the x-request-id header; an unexpected failure
// writes one log line that starts with that id, so what a person quotes ("Quote request id req_...") finds what the
// server wrote down. A 429 says when to come back. No server and no database: the Worker is called as a function,
// with a database that is not answering.
import assert from "node:assert/strict";
import worker from "../src/index.js";
import { ApiError, errorResponse, corsHeaders } from "../src/lib/http.js";
import { rateLimit } from "../src/core/auth.js";
import { SESSION_COOKIE } from "../src/lib/cookies.js";

const ORIGIN = "https://edu.example";
const env = { DB: { prepare() { throw new Error("D1_ERROR: the database is not answering"); } }, ENVIRONMENT: "production", ALLOWED_ORIGINS: ORIGIN, SESSION_PEPPER: "test" };
let n = 0;
const ok = async (name, fn) => { await fn(); n++; console.log("  ok  " + name); };

/* Run a request with console.error captured: the lines the server wrote down. */
async function call(url, headers = {}) {
  const lines = [], was = console.error;
  console.error = (...a) => lines.push(a.join(" "));
  try {
    const res = await worker.fetch(new Request(url, { headers: { origin: ORIGIN, ...headers } }), env, { waitUntil() {} });
    return { res, body: await res.json(), lines };
  } finally { console.error = was; }
}

await ok("a forced 500 carries one request id in the body and in the header, and the log line starts with the same id", async () => {
  const { res, body, lines } = await call("https://api.example/api/v1/directory/students?q=asha&token=secret", { cookie: `${SESSION_COOKIE}=abc` });
  assert.equal(res.status, 500);
  const id = body.error.requestId;
  assert.match(id, /^req_[0-9a-f]{12}$/);
  assert.equal(res.headers.get("x-request-id"), id, "the header and the body say the same");
  assert.equal(body.error.code, "internal");
  assert.equal(body.error.detail, undefined, "production says nothing of the cause");
  assert.equal(lines.length, 1, "one log line for the request");
  assert.ok(lines[0].startsWith(`[${id}] 500 GET /api/v1/directory/students `), lines[0]);
  assert.ok(lines[0].includes("the database is not answering"), "the log says why");
  assert.ok(!lines[0].includes("secret") && !lines[0].includes("asha"), "the query string stays out of the log");
});

await ok("a refused request carries an id too, writes no log line, and two requests never share an id", async () => {
  const a = await call("https://api.example/api/v1/no/such/route");
  const b = await call("https://api.example/api/v1/no/such/route");
  assert.equal(a.res.status, 404);
  assert.match(a.body.error.requestId, /^req_[0-9a-f]{12}$/);
  assert.equal(a.res.headers.get("x-request-id"), a.body.error.requestId);
  assert.deepEqual(a.lines, [], "a 404 is not worth a log line");
  assert.notEqual(a.body.error.requestId, b.body.error.requestId);
});

await ok("a 429 says when to come back (the limiter's own wait, or 60 seconds), and another origin may read it", async () => {
  let limited;
  for (let i = 0; i < 12 && !limited; i++) { try { rateLimit("pw:test-x"); } catch (e) { limited = e; } }
  assert.equal(limited.status, 429);
  assert.ok(Number(errorResponse(limited, env, { id: "req_000000000001" }).headers.get("retry-after")) > 0);
  const plain = errorResponse(ApiError.tooMany("Slow down."), env);
  assert.equal(plain.status, 429);
  assert.equal(plain.headers.get("retry-after"), "60");
  assert.match((await plain.json()).error.requestId, /^req_[0-9a-f]{12}$/);
  const exposed = corsHeaders(new Request("https://api.example/x", { headers: { origin: ORIGIN } }), env)["access-control-expose-headers"];
  assert.match(exposed, /retry-after/);
  assert.match(exposed, /x-request-id/);
});

console.log(`\n${n} checks passed\nRESULT: ok`);
