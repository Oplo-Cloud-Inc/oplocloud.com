/* ==========================================================================
   /api/v1/inbox, /messages, /reminders — telling people things.

   A person reads their own inbox and nobody else's. A message is one row per
   person with a shared thread id; replying goes to everyone who is in the
   thread. A student or family may write to the school's staff and teachers,
   not to each other and not to a whole audience; staff may write to anyone in
   the school and to an audience (a course, all students, all staff, all
   families). Reminders are made once per person per key, so running them
   twice says nothing twice.
   ========================================================================== */

import { profileOf, dayIn } from "../services/profile.js";
import { json, readJson, check, ApiError } from "../lib/http.js";
import { requireActor } from "../core/auth.js";
import { id } from "../lib/crypto.js";
import { notify, flushOutbox, isDemoOrg, NOTICE_KINDS } from "../services/notify.js";
import { orgOf, isOffice, isSchoolStaff, STAFF_ROLES_ALL } from "../services/who.js";

const shape = (n) => ({
  id: n.id, threadId: n.thread_id, kind: n.kind, from: n.from_id ? { id: n.from_id, name: n.from_name || "Someone" } : null,
  title: n.title, body: n.body, link: n.link, box: n.box, createdAt: n.created_at, readAt: n.read_at, archivedAt: n.archived_at
});

/* GET /inbox?box=inbox|sent&archived=1 */
export async function list(ctx) {
  const actor = requireActor(ctx);
  const q = ctx.url.searchParams;
  const box = q.get("box") === "sent" ? "sent" : "inbox";
  const rows = await ctx.repo.listNotices({ accountId: actor.id, box, archived: q.get("archived") === "1", limit: 150 });
  return json({ notices: rows.map(shape), unread: await ctx.repo.countUnread(actor.id) });
}

/* GET /inbox/unread — the one number the rail polls for. */
export async function unread(ctx) {
  const actor = requireActor(ctx);
  return json({ unread: await ctx.repo.countUnread(actor.id) });
}

/* POST /inbox/read { ids } or { all: true } */
export async function read(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request);
  if (body.all === true) await ctx.repo.markNotices(actor.id, null);
  else if (Array.isArray(body.ids) && body.ids.length <= 200) await ctx.repo.markNotices(actor.id, body.ids.map(String));
  else throw ApiError.badRequest("Say which, or all.", "ids");
  return json({ unread: await ctx.repo.countUnread(actor.id) });
}

/* POST /inbox/archive { ids, undo? } */
export async function archive(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request);
  if (!Array.isArray(body.ids) || !body.ids.length || body.ids.length > 200) throw ApiError.badRequest("Say which.", "ids");
  await ctx.repo.archiveNotices(actor.id, body.ids.map(String), body.undo !== true);
  return json({ ok: true });
}

/* GET /inbox/thread/:threadId — a conversation, as this person has it. Opening it reads it. */
export async function thread(ctx, { threadId }) {
  const actor = requireActor(ctx);
  const rows = await ctx.repo.threadNotices(actor.id, threadId);
  if (!rows.length) throw ApiError.notFound("No such conversation.");
  await ctx.repo.markNotices(actor.id, rows.filter((r) => !r.read_at).map((r) => r.id));
  const members = await ctx.repo.threadMembers(threadId);
  return json({ notices: rows.map(shape), members: members.length });
}

/* Who the actor may write to. */
async function mayWrite(ctx, actor, orgId, ids) {
  if (isSchoolStaff(actor, orgId)) return true;
  const staff = new Set(await ctx.repo.accountsWithRole(orgId, STAFF_ROLES_ALL));
  return ids.every((x) => staff.has(x));
}

/* POST /messages { to?: [ids], audience?: { kind, courseId }, title, body, threadId? } */
export async function send(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  const body = await readJson(ctx.request);
  const title = check.string(body.title, "title", { max: 160 });
  const text = check.string(body.body, "body", { max: 6000 });
  let to = Array.isArray(body.to) ? body.to.map(String).slice(0, 200) : [];
  let thread = null;
  if (body.threadId) {
    thread = check.string(body.threadId, "threadId", { max: 100 });
    const members = await ctx.repo.threadMembers(thread);
    if (!members.includes(actor.id)) throw ApiError.forbidden("You are not in that conversation.");
    to = members.filter((m) => m !== actor.id);
  }
  const a = body.audience;
  if (a) {
    if (!isSchoolStaff(actor, orgId)) throw ApiError.forbidden("Only the school’s staff write to a whole group.");
    if (a.kind === "course") {
      const c = await ctx.repo.findCourse(check.string(a.courseId, "courseId", { max: 100 }));
      if (!c || c.org_id !== orgId) throw ApiError.notFound("No such course.");
      to = to.concat((await ctx.repo.listCourseMembers(c.id)).map((m) => m.id));
    } else if (a.kind === "students" || a.kind === "staff" || a.kind === "families") {
      if (!isOffice(actor, orgId)) throw ApiError.forbidden("Writing to everyone is the office’s.");
      if (a.kind === "staff") to = to.concat(await ctx.repo.accountsWithRole(orgId, STAFF_ROLES_ALL));
      else {
        const studs = (await ctx.repo.listStudentMemberships(orgId)).map((m) => m.account_id);
        to = to.concat(a.kind === "students" ? studs : await ctx.repo.guardianIdsOf(Array.from(new Set(studs))));
      }
    } else throw ApiError.badRequest("audience.kind is course, students, staff or families.", "audience");
  }
  to = Array.from(new Set(to)).filter((x) => x !== actor.id);
  if (!to.length) throw ApiError.badRequest("Say who it is for.", "to");
  if (to.length > 1000) throw ApiError.badRequest("That is too many people at once.", "to");
  if (!(await mayWrite(ctx, actor, orgId, to))) throw ApiError.forbidden("You can write to the school’s staff and teachers.");
  const tid = thread || id("thr");
  const kind = a ? "announcement" : "message";
  const reached = await notify(ctx.repo, { orgId, to, kind, from: actor.id, title, body: text, threadId: tid });
  // The sender's own copy, in Sent.
  await ctx.repo.insertNotice({ orgId, accountId: actor.id, threadId: tid, kind, fromId: actor.id, title, body: text, box: "sent", read: true });
  return json({ threadId: tid, reached }, { status: 201 });
}

/* GET/PUT /inbox/prefs */
export async function getPrefs(ctx) {
  const actor = requireActor(ctx);
  const have = await ctx.repo.noticePrefs(actor.id);
  const prefs = NOTICE_KINDS.filter((k) => k !== "message").map((k) => {
    const p = have.find((x) => x.kind === k);
    return { kind: k, inApp: p ? !!p.in_app : true, email: p ? !!p.email : false };
  });
  return json({ prefs, mail: !!(ctx.env.MAIL_ENDPOINT && ctx.env.MAIL_KEY) });
}
export async function putPrefs(ctx) {
  const actor = requireActor(ctx);
  const body = await readJson(ctx.request);
  for (const p of Array.isArray(body.prefs) ? body.prefs.slice(0, 10) : []) {
    const kind = check.oneOf(p.kind, "kind", NOTICE_KINDS.filter((k) => k !== "message"));
    await ctx.repo.setNoticePref(actor.id, kind, p.inApp !== false, p.email === true);
  }
  return getPrefs(ctx);
}

/* ---------------------------------------------------------------- Reminders
   Run by the office, or by the Worker's schedule. Each reminder is a notice
   with a key, so the same day's run can be repeated safely.
   The school's day is read in the school's own time zone (its profile; New
   York for a US school that never said, Kolkata for an Indian one). */
function localNow(at, tz) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
  const p = Object.fromEntries(f.formatToParts(at).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, minutes: (+p.hour % 24) * 60 + +p.minute };
}
export async function runReminders(repo, env, orgId, at = new Date(), opts = {}) {
  const tz = profileOf(await repo.getOrganization(orgId)).timezone;
  const { day, minutes } = opts.day ? { day: opts.day, minutes: opts.minutes ?? 12 * 60 } : localNow(at, tz);
  const made = { roll: 0, due: 0, documents: 0 };
  const org = { orgId };
  // 1. A teacher whose section meets today and has no register, after nine thirty.
  if (minutes >= 9 * 60 + 30) {
    const secs = (await repo.listCourses({ orgId })).filter((c) => c.status === "published");
    for (const c of secs) {
      const taken = await repo.listAttendance({ courseId: c.id, day });
      if (taken.length) continue;
      const mem = await repo.listCourseMembers(c.id, "student");
      if (!mem.length) continue;
      const teachers = (await repo.listCourseMembers(c.id)).filter((m) => m.role === "teacher").map((m) => m.id);
      made.roll += await notify(repo, { ...org, to: teachers, kind: "reminder", title: `No register yet for ${c.title}`, body: `Take today’s register for ${c.title}.`,
        link: "attendance", dedupe: `roll:${c.id}:${day}` });
    }
  }
  // 2. Work due within a day that a student has not handed in.
  const tomorrow = new Date(Date.parse(day + "T12:00:00Z") + 86400000).toISOString().slice(0, 10);
  const members = await repo.listStudentMemberships(orgId);
  const byCourse = new Map();
  for (const m of members) (byCourse.get(m.course_id) || byCourse.set(m.course_id, []).get(m.course_id)).push(m.account_id);
  for (const [courseId, students] of byCourse) {
    for (const a of await repo.listAssignments(courseId)) {
      if (a.status === "draft" || !a.due_at) continue;
      const due = dayIn(tz, a.due_at);   // the school's evening, not UTC midnight
      if (due !== day && due !== tomorrow) continue;
      const to = [];
      for (const s of students) {
        const g = (await repo.listGrades({ courseId, accountId: s })).find((x) => x.assignment_id === a.id);
        if (!g || (g.status !== "marked" && g.status !== "excused")) to.push(s);
      }
      made.due += await notify(repo, { ...org, to, kind: "reminder", title: `Due ${due === day ? "today" : "tomorrow"}: ${a.title}`, body: `${a.title} is due ${due === day ? "today" : "tomorrow"}.`,
        link: "assignments/todo", dedupe: `due:${a.id}:${due}` });
    }
  }
  // 3. Certifications that run out within thirty days.
  const soon = new Date(Date.parse(day + "T12:00:00Z") + 30 * 86400000).toISOString().slice(0, 10);
  for (const it of await repo.listItems({ orgId, kind: "certification", to: soon })) {
    if (it.due_on && it.due_on < day) continue;
    const offices = await repo.accountsWithRole(orgId, ["admin", "principal"]);
    made.documents += await notify(repo, { ...org, to: offices.concat(it.subject_id ? [it.subject_id] : []), kind: "reminder",
      title: `${it.title} runs out ${it.due_on}`, body: `${it.subject_name || "A staff member"}’s ${it.title} expires on ${it.due_on}.`, link: "certifications", dedupe: `cert:${it.id}:${it.due_on}` });
  }
  return made;
}

/* POST /reminders/run { day?, minutes? } — the office, on demand. */
export async function runNow(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  if (!isOffice(actor, orgId)) throw ApiError.forbidden("Reminders are run by the office.");
  const body = await readJson(ctx.request).catch(() => ({}));
  return json({ made: await runReminders(ctx.repo, ctx.env, orgId, new Date(), { day: body.day, minutes: body.minutes }) });
}

/* GET /outbox, POST /outbox/flush — the office sees what is waiting to be mailed. */
export async function outbox(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  if (!isOffice(actor, orgId)) throw ApiError.forbidden("The mail queue is the office’s.");
  const rows = await ctx.repo.listOutbox(orgId, null);
  return json({ configured: !!(ctx.env.MAIL_ENDPOINT && ctx.env.MAIL_KEY), demo: isDemoOrg(ctx.env, orgId),
    mail: rows.map((m) => ({ id: m.id, to: m.to_email, subject: m.subject, status: m.status, error: m.error, createdAt: m.created_at, sentAt: m.sent_at })) });
}
export async function flush(ctx) {
  const actor = requireActor(ctx);
  const orgId = orgOf(actor);
  if (!isOffice(actor, orgId)) throw ApiError.forbidden("The mail queue is the office’s.");
  return json(await flushOutbox(ctx.repo, ctx.env, orgId));
}
