/* ==========================================================================
   HTTP shapes.

   Every response this API produces comes out of this file, so the contract a
   client codes against is one page long rather than being inferred from forty
   handlers. An error is always the same object with the same fields, which is
   what lets a frontend handle failure generically instead of guessing.
   ========================================================================== */

export const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { ...JSON_HEADERS, ...(init.headers || {}) }
  });
}

/* One error shape, always. `code` is for the client to branch on, `message`
   is for a person to read, and `field` names the input at fault when there is
   one — a form that can highlight the wrong box is the difference between a
   usable API and a frustrating one. */
export class ApiError extends Error {
  constructor(status, code, message, field) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
  }
  static badRequest(message, field) { return new ApiError(400, "bad_request", message, field); }
  static unauthorized(message = "Sign in to continue.") {
    return new ApiError(401, "unauthorized", message);
  }
  static forbidden(message = "You do not have access to that.") {
    return new ApiError(403, "forbidden", message);
  }
  static notFound(message = "Not found.") { return new ApiError(404, "not_found", message); }
  static conflict(message, field) { return new ApiError(409, "conflict", message, field); }
  static tooMany(message = "Too many attempts. Try again shortly.", retryAfter) {
    const e = new ApiError(429, "rate_limited", message);
    e.retryAfter = retryAfter;
    return e;
  }
}

export function errorResponse(err, env) {
  const known = err instanceof ApiError;
  const status = known ? err.status : 500;
  const body = {
    error: {
      code: known ? err.code : "internal",
      message: known ? err.message : "Something went wrong at our end."
    }
  };
  if (known && err.field) body.error.field = err.field;
  // The response says nothing about an unexpected error, so the log is the
  // only record of it. The error alone — never the request, which may carry a
  // password.
  if (!known) console.error(String(err && err.stack || err));
  // A stack trace is a gift to an attacker in production and a necessity in
  // development, so it is gated on the environment rather than on a guess.
  if (!known && env && env.ENVIRONMENT !== "production") {
    body.error.detail = String(err && err.stack || err);
  }
  const headers = { ...JSON_HEADERS };
  if (known && err.retryAfter) headers["retry-after"] = String(err.retryAfter);
  return new Response(JSON.stringify(body), { status, headers });
}

/* ------------------------------------------------------------------- CORS
   An allowlist, echoed per request. `*` is not an option here: this API is
   called with credentials, and the two are incompatible by specification —
   which is the browser protecting the user, not an inconvenience to route
   around. */
export function corsHeaders(request, env) {
  const origin = request.headers.get("origin");
  if (!origin) return {};
  const allowed = String(env.ALLOWED_ORIGINS || "").split(",")
    .map((s) => s.trim()).filter(Boolean);
  if (!allowed.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
    "access-control-max-age": "86400",
    "vary": "origin"
  };
}

export function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders(request, env))) headers.set(k, v);
  return new Response(response.body, {
    status: response.status, statusText: response.statusText, headers
  });
}

/* Reading a body that might not be JSON, might be empty, and might be
   enormous. All three are ordinary and none of them should reach a handler. */
export async function readJson(request, { limit = 64 * 1024 } = {}) {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) {
    throw ApiError.badRequest("Send JSON, with a content-type to match.");
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > limit) throw ApiError.badRequest("That request body is too large.");
  const text = await request.text();
  if (text.length > limit) throw ApiError.badRequest("That request body is too large.");
  if (!text) return {};
  try { return JSON.parse(text); }
  catch { throw ApiError.badRequest("That body is not valid JSON."); }
}

/* --------------------------------------------------------------- Validation
   Small, explicit, and it throws the same ApiError everything else does, so a
   validation failure and an authorization failure reach the client in the
   same shape. */
export const check = {
  string(value, field, { min = 1, max = 500, trim = true } = {}) {
    if (typeof value !== "string") throw ApiError.badRequest(`${field} must be text.`, field);
    const v = trim ? value.trim() : value;
    if (v.length < min) throw ApiError.badRequest(`${field} is required.`, field);
    if (v.length > max) throw ApiError.badRequest(`${field} is too long.`, field);
    return v;
  },
  email(value, field = "email") {
    const v = this.string(value, field, { max: 320 });
    // Deliberately permissive. Address syntax is far stranger than most
    // patterns allow, and the real check is whether a verification mail
    // arrives — rejecting a valid address is the worse failure.
    if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(v)) {
      throw ApiError.badRequest("That does not look like an email address.", field);
    }
    return v;
  },
  password(value, field = "password") {
    if (typeof value !== "string") throw ApiError.badRequest("A password is required.", field);
    if (value.length < 10) {
      throw ApiError.badRequest("Use at least 10 characters. Length beats punctuation.", field);
    }
    if (value.length > 512) throw ApiError.badRequest("That password is too long.", field);
    return value;
  },
  number(value, field, { min = -Infinity, max = Infinity, allowNull = false } = {}) {
    if (value == null) {
      if (allowNull) return null;
      throw ApiError.badRequest(`${field} is required.`, field);
    }
    const n = Number(value);
    if (!Number.isFinite(n)) throw ApiError.badRequest(`${field} must be a number.`, field);
    if (n < min || n > max) throw ApiError.badRequest(`${field} is out of range.`, field);
    return n;
  },
  oneOf(value, field, allowed) {
    if (!allowed.includes(value)) {
      throw ApiError.badRequest(`${field} must be one of: ${allowed.join(", ")}.`, field);
    }
    return value;
  },
  slug(value, field) {
    const v = this.string(value, field, { max: 64 }).toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]*$/.test(v)) {
      throw ApiError.badRequest(`${field} may use lowercase letters, numbers and hyphens.`, field);
    }
    return v;
  }
};
