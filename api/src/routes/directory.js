/* ==========================================================================
   /api/v1/directory — the student directory the console's list, quick look and
   record page are drawn from.

   GET    /directory/students?q=&class=&…&page=&size=   one page, the total, what each chip would show, the school's numbers
   GET    /directory/students/export?…                  every row the filter matches, as rows for a file (audited)
   GET    /directory/students/:id                       one student, whole: facts, numbers a board asks for, who to call, alerts
   POST   /directory/students                           add a student (and their sign-in, invited, no password)
   POST   /directory/students/:id/phone { which }       show one guardian number, and write down that it was shown
   POST   /directory/students/bulk/house   { ids | filter, house }
   POST   /directory/students/bulk/message { ids | filter, title, body }

   Who may: the office (dean, principal, registrar, administrator) reads the
   whole school; a class teacher reads the sections they are class teacher of
   and nothing else, whatever the address says. Changes are the registrar's and
   the administrators'; exporting is the principal's, registrar's and
   administrators'. Every change, export and revealed number is written to the
   audit log. The numbers behind the list (attendance, early warning) are the
   register's own, so the directory and the register can never disagree.
   ========================================================================== */

import { json, readJson, check, ApiError } from "../lib/http.js";
import { can, must } from "../core/guard.js";
import { id as newId } from "../lib/crypto.js";
import * as I from "../services/india.js";
import * as D from "../services/directory.js";
import * as A from "../services/audit.js";
import { notify } from "../services/notify.js";
import { school, watchOf, earlyOf } from "./register.js";
import { clash, conflict } from "./india.js";

const BULK_MAX = 2000;
const WHICH = { father: "fatherPhone", mother: "motherPhone", guardian: "guardianPhone" };
const WHO = { father: "fatherName", mother: "motherName", guardian: "guardianName" };

/* Whom this person may read: the whole school (the office) or only the sections they are class teacher of; refused if
   neither. The list, the record and the number all ask here, so they cannot disagree about it. */
export async function scopeOf(ctx, S) {
  const mine = (await ctx.repo.sectionsOfTeacher(S.orgId, S.actor.id)).map((r) => r.id);
  await must(ctx, "directory.read", { orgId: S.orgId, classTeacher: mine.length > 0 });
  const office = await can(ctx, "directory.read", { orgId: S.orgId });
  return { office, mine, sees: (classId) => office || mine.includes(classId) };
}

/* The school's students as rows, and the sections this person may see (null: all of them). */
async function load(ctx) {
  const S = await school(ctx);
  const sc = await scopeOf(ctx, S);
  const scope = sc.office ? null : new Set(sc.mine);
  const kids = (await ctx.repo.listIndiaStudents(S.orgId, null)).map(I.shapeStudent).filter((k) => !scope || scope.has(k.classId));
  const [w, e] = await Promise.all([watchOf(ctx, S, null, { kids }), earlyOf(ctx, S, null, { kids })]);
  const wby = new Map(w.students.map((x) => [x.id, x])), eby = new Map(e.list.map((x) => [x.id, x]));
  const rows = kids.map((k) => D.rowOf(k, I.problemsOf(k), wby.get(k.id), eby.get(k.id), w.year));
  return { S, scope, rows, year: w.year };
}

/* The ids a bulk call names: the ones listed, or everything the filter matches. */
function pick(body, rows) {
  const limit = (list) => { if (list.length > BULK_MAX) throw ApiError.badRequest(`At most ${BULK_MAX} students at a time.`, "ids"); return list; };
  if (body.filter != null) {
    const f = D.parse(new URLSearchParams(String(body.filter).replace(/^\?/, "")));
    return limit(D.matching(rows, f));
  }
  if (!Array.isArray(body.ids) || !body.ids.length) throw ApiError.badRequest("Choose the students first.", "ids");
  const want = new Set(body.ids.map((x) => String(x)));
  return limit(rows.filter((r) => want.has(r.id)));
}

/* GET /directory/students */
export async function students(ctx) {
  const { S, scope, rows, year } = await load(ctx);
  const f = D.parse(ctx.url.searchParams);
  const out = D.cut(rows, f);
  const labels = scope ? [...new Set(rows.map((r) => r.classLabel).filter(Boolean))].sort() : null;
  return json({
    ...out, year, today: S.today, scope: labels ? { sections: labels } : null,
    can: { write: await can(ctx, "directory.write", { orgId: S.orgId }), export: await can(ctx, "directory.export", { orgId: S.orgId }) }
  });
}

const csvRow = (r) => [r.classLabel || "", r.rollNo || "", r.name, r.admissionNo || "", r.gender || "", r.category || "", r.house || "",
  r.attendance ? r.attendance.percent : "", r.guardian ? `${r.guardian.name} (${r.guardian.relation})` : "", r.gapCount ? "Needs fixing: " + r.gapCount : "Complete"];

/* GET /directory/students/export?… */
export async function exportRows(ctx) {
  const { S, rows } = await load(ctx);
  await must(ctx, "directory.export", { orgId: S.orgId });
  const f = D.parse(ctx.url.searchParams);
  const list = D.matching(rows, f);
  const filter = [...ctx.url.searchParams].filter(([k]) => !["page", "size", "sort", "dir"].includes(k)).map(([k, v]) => `${k}=${v}`).join("&");
  await A.record(ctx, S.orgId, S.actor, { module: "students", action: "students.directory.exported", verb: "exported", recordKind: "student", detail: { filter, rows: list.length } });
  return json({ title: "Students", file: `students-${S.today}.csv`, columns: ["Class", "Roll", "Name", "Admission no", "Gender", "Category", "House", "Attendance %", "Main contact", "Record"], rows: list.map(csvRow), count: list.length });
}

const masked = (v) => I.maskValue(v, 6);

/* GET /directory/students/:id */
export async function record(ctx, { accountId }) {
  const S = await school(ctx);
  const sc = await scopeOf(ctx, S);
  const raw = await ctx.repo.getIndiaStudent(S.orgId, accountId);
  if (!raw) throw ApiError.notFound("That student is not in this school.");
  if (!sc.sees(raw.class_id)) throw ApiError.forbidden("A class teacher reads the students of their own sections.");
  const s = I.shapeStudent(raw), problems = I.problemsOf(s);

  const [w, e, cls, family] = await Promise.all([
    s.classId ? watchOf(ctx, S, s.classId, { kids: [s] }) : null,
    s.classId ? earlyOf(ctx, S, s.classId, { kids: [s] }) : null,
    s.classId ? ctx.repo.getIndiaClass(S.orgId, s.classId) : null,
    ctx.repo.listGuardians(accountId)
  ]);
  const standing = w ? w.students[0] : null, early = e ? e.list[0] : null;
  const row = D.rowOf(s, problems, standing, early, w ? w.year : null);
  const teacher = cls && cls.class_teacher_id ? await ctx.repo.findAccountById(cls.class_teacher_id) : null;

  const contact = (which, relation) => ({ which, name: s[WHO[which]] || null, relation, phone: masked(s[WHICH[which]]), hasPhone: !!s[WHICH[which]],
    primary: s.primaryContact === (which === "guardian" ? "Guardian" : which === "father" ? "Father" : "Mother"), whatsapp: s.whatsapp === 1 });
  const contacts = [contact("father", "Father"), contact("mother", "Mother"), contact("guardian", s.guardianRelation || "Guardian")].filter((c) => c.name || c.hasPhone);

  const alerts = [];
  if (standing && standing.status === "below") alerts.push({ key: "attendance", level: "danger", percent: standing.percent });
  else if (standing && standing.status === "watch") alerts.push({ key: "attendance_watch", level: "warning", percent: standing.percent, canMiss: standing.canMiss });
  if (s.consentStatus !== "verified" && s.consentStatus !== "withdrawn") alerts.push({ key: "consent", level: "warning" });
  if (early && (early.level === "high" || early.level === "medium")) alerts.push({ key: "early_warning", level: early.level === "high" ? "danger" : "warning", signals: early.signals.map((x) => x.key) });
  if (s.cwsn === 1) alerts.push({ key: "cwsn", level: "info" });

  return json({
    student: { ...row, email: s.email, address: s.address, pin: s.pin, district: s.district, state: s.state, language: s.language, whatsapp: s.whatsapp === 1,
      stream: s.stream, programme: s.programme, previousSchool: s.previousSchool, boardRollNo: s.boardRollNo, udid: I.maskValue(s.udid),
      disability: s.disability, migrant: s.migrant === 1, consentMethod: s.consentMethod, consentOn: s.consentOn,
      aadhaar: s.aadhaar ? { onFile: true, last4: String(s.aadhaar).slice(-4) } : { onFile: false }, apaarId: s.apaar && /^\d/.test(s.apaar) ? s.apaar : null,
      penId: s.pen || null },
    standing, early: early ? { level: early.level, score: early.score, signals: early.signals, transition: early.transition } : null, latest: early ? early.latest : null,
    classTeacher: teacher ? { id: teacher.id, name: teacher.name } : null, contacts, alerts,
    family: { linked: family.length, active: family.filter((g) => g.status === "active").length },
    can: { write: await can(ctx, "directory.write", { orgId: S.orgId }) }
  });
}

/* POST /directory/students/:id/phone { which: father|mother|guardian } */
export async function phone(ctx, { accountId }) {
  const S = await school(ctx);
  const sc = await scopeOf(ctx, S);
  const b = await readJson(ctx.request);
  const which = check.oneOf(b.which, "which", Object.keys(WHICH));
  const raw = await ctx.repo.getIndiaStudent(S.orgId, accountId);
  if (!raw) throw ApiError.notFound("That student is not in this school.");
  if (!sc.sees(raw.class_id)) throw ApiError.forbidden("A class teacher reads the students of their own sections.");
  const s = I.shapeStudent(raw), number = s[WHICH[which]];
  if (!number) throw ApiError.notFound("No number is on file for them.");
  // fail closed: if the row cannot be written the number is not given out
  await A.record(ctx, S.orgId, S.actor, { module: "students", action: "students.guardian.phone_revealed", verb: "revealed", recordKind: "student", recordId: accountId,
    recordLabel: `${s.name}${s.classLabel ? " · " + s.classLabel : ""}`, field: WHICH[which], detail: { which } });
  return json({ phone: number });
}

/* POST /directory/students — a new student: an Oplo Account that is invited (no password), the student role, the school's row. */
export async function create(ctx) {
  const S = await school(ctx);
  await must(ctx, "directory.write", { orgId: S.orgId });
  const b = await readJson(ctx.request);
  const fail = (message, field) => { throw ApiError.badRequest(message, field); };
  const name = check.string(b.name, "name", { min: 2, max: 120 });
  if (/[<>\n\r]/.test(name)) fail("A name has letters, spaces and dots.", "name");
  const email = check.email(b.email, "email");
  const fields = I.cleanStudent(b, fail);
  let cls = null;
  if (b.classId) {
    cls = await ctx.repo.getIndiaClass(S.orgId, String(b.classId));
    if (!cls) fail("That class is not in this school. Make it under Classes first.", "classId");
  }
  let dob = null, address = null;
  if (b.dob) { dob = I.dayOf(b.dob); if (!dob) fail("A date of birth is written DD/MM/YYYY or YYYY-MM-DD.", "dob"); if (dob > I.todayIST()) fail("A date of birth is a past date.", "dob"); }
  if (b.address) address = check.string(b.address, "address", { max: 400 });

  // Everything that must be unique is asked before anything is written, so a refusal changes nothing and the office
  // corrects the one field and sends it again (E1). The write below is one batch, so even a clash that slips between
  // this question and the write (two offices at once) leaves no account behind.
  const lower = email.toLowerCase();
  if ((await ctx.repo.peopleByEmails(S.orgId, [email])).length) throw ApiError.conflict("An account with that email already exists. Use another email, or find the student in the Directory.", "email");
  const taken = await ctx.repo.studentClashes(S.orgId, { admissionNo: fields.admissionNo, apaar: fields.apaar, pen: fields.pen, classId: cls ? cls.id : null, rollNo: fields.rollNo });
  if (taken) throw clash(taken);

  const accountId = newId("acc");
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const label = `${name}${cls ? " · " + I.classLabel(cls.grade, cls.section) : ""}`;
  const audit = A.rows(S.orgId, S.actor, [{ module: "students", action: "students.record.created", verb: "created", recordKind: "student", recordId: accountId,
    recordLabel: label, detail: { admissionNo: fields.admissionNo || null } }]);
  try {
    await ctx.repo.createIndiaStudent(S.orgId, {
      people: { fresh: [{ id: accountId, email, lower, name, first: name.split(/\s+/)[0], initials, hue: "#0071e3", title: null }],
        roles: [{ lower, role: "student" }], members: [{ lower, mrole: "member" }], links: [], clear: [] },
      item: { accountId, row: I.toRow({ ...fields, ...(cls ? { classId: cls.id } : {}) }), contact: { dateOfBirth: dob, mailingAddress: address }, audit }
    }, S.actor.id, I.todayIST());
  } catch (e) { throw conflict(e) || e; }
  const saved = I.shapeStudent(await ctx.repo.getIndiaStudent(S.orgId, accountId));
  return json({ student: saved, problems: I.problemsOf(saved), note: "Nobody has a password yet. The family sets one from the invitation." }, { status: 201 });
}

/* POST /directory/students/bulk/house { ids | filter, house } */
export async function bulkHouse(ctx) {
  const { S, rows } = await load(ctx);
  await must(ctx, "directory.write", { orgId: S.orgId });
  const b = await readJson(ctx.request);
  const house = b.house === null || b.house === "" ? null : check.string(b.house, "house", { max: 40 });
  const list = pick(b, rows);
  // Setting a value is idempotent: a student who already has this house is neither written nor logged, so a call that
  // stopped part-way is finished by sending it again. Each student's audit row goes in the batch with their change (E2).
  const todo = list.filter((r) => (r.house || null) !== house);
  const audit = A.rows(S.orgId, S.actor, todo.map((r) => ({ module: "students", action: "students.record.changed", verb: "changed", recordKind: "student", recordId: r.id,
    recordLabel: `${r.name}${r.classLabel ? " · " + r.classLabel : ""}`, field: "house", before: r.house, after: house })));
  let changed;
  try { changed = await ctx.repo.setHouses(S.orgId, todo.map((r, i) => ({ accountId: r.id, audit: audit[i] })), house, S.actor.id); }
  catch (e) { throw stopped(e, todo.length); }
  return json({ changed, matched: list.length, house });
}

/* A bulk call that stopped part-way says how far it got; the same call, sent again, finishes it. */
function stopped(e, wanted) {
  console.error(String((e && e.stack) || e));
  const applied = (e && e.applied) || 0;
  const err = new ApiError(500, "partial", `Changed ${applied} of ${wanted} students before something went wrong. Send it again to finish: the ones already changed will not change twice.`);
  err.extra = { applied, wanted };
  return err;
}

/* POST /directory/students/bulk/message { ids | filter, title, body } — one message to the students' families. */
export async function bulkMessage(ctx) {
  const { S, rows } = await load(ctx);
  const b = await readJson(ctx.request);
  const title = check.string(b.title, "title", { max: 120 }), body = check.string(b.body, "body", { max: 800 });
  const list = pick(b, rows);
  if (!list.length) throw ApiError.conflict("Nobody matches.");
  const ids = list.map((r) => r.id), guardians = await ctx.repo.guardianIdsOf(ids);
  const reached = await notify(ctx.repo, { orgId: S.orgId, to: ids.concat(guardians), kind: "message", from: S.actor.id, title, body, link: "inbox" });
  await A.record(ctx, S.orgId, S.actor, { module: "communicate", action: "communicate.message.sent", verb: "created", recordKind: "message", recordLabel: title, detail: { students: ids.length, reached } });
  return json({ students: ids.length, families: guardians.length, reached });
}
