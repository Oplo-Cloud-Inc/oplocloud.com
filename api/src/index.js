/* ==========================================================================
   The Oplo platform API.

       Browser
          |
       Worker  (this file — routing, CORS, session resolution)
          |
       Routes  (request shape, response shape)
          |
      Services (domain rules: what a grade means, what an answer is worth)
          |
     Repository (the only file that knows SQL)
          |
         D1

   Nothing skips a layer. In particular no route touches env.DB directly,
   which is what makes D1 replaceable later without the frontend noticing.

   The API is versioned in the path from the first commit. Adding /v2 later is
   cheap; retrofitting a version onto unversioned URLs that clients depend on
   is not.
   ========================================================================== */

import { json, errorResponse, withCors, corsHeaders, ApiError } from "./lib/http.js";
import { D1Repository } from "./repo/d1.js";
import { currentActor } from "./core/auth.js";

import * as auth from "./routes/auth.js";
import * as accounts from "./routes/accounts.js";
import * as courses from "./routes/courses.js";
import * as grades from "./routes/grades.js";
import * as progress from "./routes/progress.js";

/* A route table rather than a chain of ifs, so the whole surface of the API
   is readable in one screen and an endpoint cannot be added without appearing
   here. `:name` segments become params. */
const ROUTES = [
  ["POST",   "/api/v1/auth/login",     auth.login],
  ["POST",   "/api/v1/auth/logout",    auth.logout],
  ["POST",   "/api/v1/auth/password",  auth.changePassword],
  ["GET",    "/api/v1/me",             auth.me],

  ["GET",    "/api/v1/accounts",             accounts.list],
  ["POST",   "/api/v1/accounts",             accounts.create],
  ["GET",    "/api/v1/accounts/:accountId",  accounts.get],
  ["PATCH",  "/api/v1/accounts/:accountId",  accounts.update],
  ["POST",   "/api/v1/accounts/:accountId/roles", accounts.grantRole],

  ["GET",    "/api/v1/courses",                          courses.list],
  ["POST",   "/api/v1/courses",                          courses.create],
  ["GET",    "/api/v1/courses/:courseId",                courses.get],
  ["PATCH",  "/api/v1/courses/:courseId",                courses.update],
  ["GET",    "/api/v1/courses/:courseId/members",        courses.members],
  ["POST",   "/api/v1/courses/:courseId/members",        courses.enrol],
  ["GET",    "/api/v1/courses/:courseId/assignments",    courses.listAssignments],
  ["POST",   "/api/v1/courses/:courseId/assignments",    courses.createAssignment],
  ["PATCH",  "/api/v1/assignments/:assignmentId",        courses.updateAssignment],
  ["DELETE", "/api/v1/assignments/:assignmentId",        courses.deleteAssignment],

  ["GET",    "/api/v1/grades",   grades.list],
  ["PUT",    "/api/v1/grades",   grades.put],

  ["GET",    "/api/v1/progress", progress.list],
  ["PUT",    "/api/v1/progress", progress.put],
  ["GET",    "/api/v1/gamification/standing", progress.standing],
  ["POST",   "/api/v1/gamification/events",   progress.events]
];

function match(method, path) {
  for (const [m, pattern, handler] of ROUTES) {
    if (m !== method) continue;
    const want = pattern.split("/");
    const got = path.split("/");
    if (want.length !== got.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < want.length; i++) {
      if (want[i].startsWith(":")) params[want[i].slice(1)] = decodeURIComponent(got[i]);
      else if (want[i] !== got[i]) { ok = false; break; }
    }
    if (ok) return { handler, params };
  }
  return null;
}

export default {
  async fetch(request, env, executionCtx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    // Liveness. Deliberately says nothing about the database or the build —
    // a health endpoint is a public endpoint.
    if (url.pathname === "/api/v1/health") {
      return withCors(json({ ok: true, service: "oplo-api", version: "v1" }), request, env);
    }

    try {
      if (!env.DB) {
        throw new ApiError(503, "no_database",
          "The database binding is missing. Check `DB` in wrangler.toml.");
      }

      const found = match(request.method, url.pathname);
      if (!found) throw ApiError.notFound(`No route for ${request.method} ${url.pathname}.`);

      const ctx = {
        request, env, url,
        repo: new D1Repository(env.DB),
        waitUntil: (p) => executionCtx.waitUntil(p),
        actor: null
      };
      // Resolved once per request, from the session token alone. This is the
      // only place the caller's identity is established, and it is never read
      // from the request body.
      ctx.actor = await currentActor(ctx);

      const response = await found.handler(ctx, found.params);
      return withCors(response, request, env);
    } catch (err) {
      return withCors(errorResponse(err, env), request, env);
    }
  }
};
