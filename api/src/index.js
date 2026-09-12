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
import { currentActor, rotateSession, SESSION_LIFETIME } from "./core/auth.js";
import { sessionCookie } from "./lib/cookies.js";

import * as auth from "./routes/auth.js";
import * as accounts from "./routes/accounts.js";
import * as courses from "./routes/courses.js";
import * as grades from "./routes/grades.js";
import * as progress from "./routes/progress.js";
import * as marks from "./routes/marks.js";
import * as studysets from "./routes/studysets.js";
import * as graduation from "./routes/graduation.js";
import * as reporting from "./routes/reporting.js";

/* A route table rather than a chain of ifs, so the whole surface of the API
   is readable in one screen and an endpoint cannot be added without appearing
   here. `:name` segments become params. */
const ROUTES = [
  ["POST",   "/api/v1/auth/login",     auth.login],
  ["POST",   "/api/v1/auth/logout",    auth.logout],
  ["POST",   "/api/v1/auth/password",  auth.changePassword],
  ["GET",    "/api/v1/me",             auth.me],
  ["GET",    "/api/v1/auth/sessions",        auth.sessions],
  ["POST",   "/api/v1/auth/sessions/revoke", auth.revokeSessions],

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

  ["GET",    "/api/v1/grades",          grades.list],
  ["PUT",    "/api/v1/grades",          grades.put],
  ["POST",   "/api/v1/grades/batch",    grades.batch],
  ["GET",    "/api/v1/grades/history",  grades.history],
  ["POST",   "/api/v1/grades/undo",     grades.undo],
  ["GET",    "/api/v1/courses/:courseId/gradebook", grades.gradebook],
  ["POST",   "/api/v1/courses/:courseId/whatif",    grades.whatif],

  ["GET",    "/api/v1/study-sets",         studysets.list],
  ["POST",   "/api/v1/study-sets",         studysets.create],
  ["GET",    "/api/v1/study-sets/:setId",  studysets.get],
  ["PATCH",  "/api/v1/study-sets/:setId",  studysets.update],
  ["DELETE", "/api/v1/study-sets/:setId",  studysets.remove],

  ["GET",    "/api/v1/teaching",                 reporting.teaching],
  ["GET",    "/api/v1/students",                 reporting.students],
  ["GET",    "/api/v1/coursework",               reporting.coursework],
  ["GET",    "/api/v1/activity",                 reporting.activity],
  ["GET",    "/api/v1/reporting",                reporting.readiness],
  ["PUT",    "/api/v1/reporting/comment",        reporting.putComment],
  ["GET",    "/api/v1/students/:accountId/report", reporting.report],

  ["GET",    "/api/v1/graduation",                       graduation.get],
  ["PUT",    "/api/v1/accounts/:accountId/program",      graduation.setProgram],
  ["POST",   "/api/v1/accounts/:accountId/transcripts",  graduation.importTranscript],
  ["PATCH",  "/api/v1/transcripts/:recordId",            graduation.updateRecord],
  ["PATCH",  "/api/v1/transcript-courses/:courseId",     graduation.updateCourse],

  ["GET",    "/api/v1/marks",           marks.list],
  ["POST",   "/api/v1/marks",           marks.put],
  ["DELETE", "/api/v1/marks/:markId",   marks.remove],

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

    // Nothing is served over plain HTTP. Cloudflare hands such requests to the
    // route as they arrived, so the Worker sends them to HTTPS itself. Local
    // development runs on http://localhost and is left alone.
    if (url.protocol === "http:" && env.ENVIRONMENT === "production") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 308);
    }

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
        actor: null,
        rotate: null
      };
      // Resolved once per request, from the session token alone. This is the
      // only place the caller's identity is established, and it is never read
      // from the request body.
      ctx.actor = await currentActor(ctx);

      const response = await found.handler(ctx, found.params);

      /* A session past its rotation window is swapped here rather than in a
         route, so every endpoint gets it and none has to know. A response
         that already sets the cookie — sign-in, sign-out, a password change —
         is left alone: it has just made a deliberate decision about the
         session and this must not overwrite it. */
      if (ctx.rotate && !response.headers.has("set-cookie")) {
        const fresh = await rotateSession(ctx, ctx.rotate);
        if (fresh) {
          const headers = new Headers(response.headers);
          headers.append("set-cookie",
            sessionCookie(fresh.token, { maxAge: SESSION_LIFETIME, env }));
          return withCors(new Response(response.body, {
            status: response.status, statusText: response.statusText, headers
          }), request, env);
        }
      }
      return withCors(response, request, env);
    } catch (err) {
      return withCors(errorResponse(err, env), request, env);
    }
  }
};
