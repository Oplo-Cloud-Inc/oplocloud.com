/* ==========================================================================
   /api/v1/feeds — the school's calendar, to subscribe to.

   A calendar application cannot send a session cookie, so the address itself
   carries the proof: an HMAC of the account id under the deployment's secret.
   It shows what that person may already read — the school's events, its days
   off, and, for a student, work coming due. ponytail: the address cannot be
   revoked on its own; rotating the deployment secret rotates every one.
   ========================================================================== */
import { json, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";

async function proof(env, accountId) {
  const secret = env.SESSION_PEPPER || "oplo-dev-feed";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("feed:" + accountId));
  return Array.from(new Uint8Array(sig)).slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* GET /feeds/link — the address for the signed-in person. */
export async function link(ctx) {
  const actor = requireActor(ctx);
  const origin = new URL(ctx.request.url).origin;
  return json({ url: `${origin}/api/v1/feeds/${actor.id}/${await proof(ctx.env, actor.id)}/calendar.ics` });
}

const esc = (t) => String(t || "").replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const ymd = (d) => d.replace(/-/g, "");
const nextDay = (d) => new Date(Date.parse(d + "T00:00:00Z") + 86400000).toISOString().slice(0, 10).replace(/-/g, "");

/* GET /feeds/:accountId/:token/calendar.ics */
export async function calendar(ctx, { accountId, token }) {
  if (token !== await proof(ctx.env, accountId)) throw ApiError.notFound("No such calendar.");
  const orgs = await ctx.repo.membershipsFor(accountId);
  const orgId = orgs[0] && orgs[0].org_id;
  if (!orgId) throw ApiError.notFound("No such calendar.");
  const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = new Date(Date.now() + 240 * 86400000).toISOString().slice(0, 10);
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//OEdu//School calendar//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:School calendar"];
  const ev = (uid, day, title, note) => lines.push("BEGIN:VEVENT", `UID:${uid}@oedu`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${ymd(day)}`, `DTEND;VALUE=DATE:${nextDay(day)}`, `SUMMARY:${esc(title)}`, ...(note ? [`DESCRIPTION:${esc(note)}`] : []), "END:VEVENT");
  for (const d of await ctx.repo.listSchoolDays(orgId, from, to)) {
    if (d.kind !== "school") ev("day-" + d.day, d.day, d.label || (d.kind === "staff" ? "Staff day" : d.kind === "canceled" ? "No school" : "Holiday"), "No school");
  }
  for (const it of await ctx.repo.listItems({ orgId, kind: "event", from, to })) {
    if (it.status === "canceled" || !it.due_on) continue;
    let d = {}; try { d = JSON.parse(it.data_json); } catch { d = {}; }
    ev("item-" + it.id, it.due_on, it.title, [d.place, d.about].filter(Boolean).join(" · "));
  }
  // A student's own work coming due.
  for (const c of await ctx.repo.listCourses({ accountId })) {
    if (c.my_role !== "student" || c.status === "archived") continue;
    for (const a of await ctx.repo.listAssignments(c.id)) {
      if (a.status === "draft" || !a.due_at) continue;
      const day = new Date(a.due_at - 5 * 3600000).toISOString().slice(0, 10);
      if (day < from || day > to) continue;
      ev("work-" + a.id, day, `Due: ${a.title} (${c.title})`, null);
    }
  }
  lines.push("END:VCALENDAR");
  return new Response(lines.join("\r\n") + "\r\n", { headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "private, max-age=900" } });
}
