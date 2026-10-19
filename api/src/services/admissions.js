/* ==========================================================================
   Admissions reporting — what the office is asked at the end of a cycle and
   at every governors' meeting: how many asked, how many applied, how many
   were seen, offered, took the offer, joined; where they came from; how long
   the school took; and the register the law asks every school to keep.

   Pure functions. The route reads the rows and the day; this counts them.
   Every figure is a count of records that exist — nothing is estimated — so
   a number on the report can be traced to the applications behind it.
   ========================================================================== */

const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);
const median = (xs) => {
  if (!xs.length) return null;
  const s = xs.slice().sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
const DAY = 86400000;
const parse = (s, dflt) => { try { const v = s ? JSON.parse(s) : dflt; return v == null ? dflt : v; } catch { return dflt; } };

/* How far an application went. `offered` is "was ever admitted": an admission number is given at the moment of
   the decision and kept even if the family later declines, so it counts what the school offered, not what held. */
export function reached(a, sessions) {
  const sent = !!a.submitted_at || !["draft"].includes(a.status);
  const assessed = (sessions || []).some((s) => s.status === "completed");
  const offered = !!a.admission_no;
  const confirmed = offered && a.acceptance !== "pending" && a.acceptance !== "declined" && a.status !== "withdrawn" && a.status !== "rejected";
  return { sent, assessed, offered, confirmed, enrolled: !!a.enrollment_id };
}

/* reportOf({ apps, enquiries, sessions, enrollments, settings, day }) → the whole picture for one year. */
export function reportOf({ apps, enquiries, sessions, enrollments, settings, day }) {
  const byApp = new Map();
  for (const s of sessions) { if (!byApp.has(s.application_id)) byApp.set(s.application_id, []); byApp.get(s.application_id).push(s); }
  const rows = apps.map((a) => ({ a, r: reached(a, byApp.get(a.id)), form: parse(a.body_json, {}) }));
  const sent = rows.filter((x) => x.r.sent);

  const stage = (key, label, n, prev) => ({ key, label, n, ofPrevious: pct(n, prev) });
  const nEnq = enquiries.length;
  const nSent = sent.length, nAssessed = sent.filter((x) => x.r.assessed).length, nOffered = sent.filter((x) => x.r.offered).length;
  const nConfirmed = sent.filter((x) => x.r.confirmed).length, nEnrolled = sent.filter((x) => x.r.enrolled).length;
  const funnel = [
    stage("enquiries", "Enquiries", nEnq, null),
    stage("applications", "Applications sent in", nSent, null),
    stage("assessed", "Assessed or interviewed", nAssessed, nSent),
    stage("offered", "Offered a seat", nOffered, nSent),
    stage("confirmed", "Seat taken up", nConfirmed, nOffered),
    stage("enrolled", "Enrolled", nEnrolled, nConfirmed)
  ];
  // Applications are not a conversion of enquiries — most families apply without having asked first — so say how many did.
  funnel[1].ofPrevious = null;
  funnel[1].fromEnquiry = sent.filter((x) => x.form.admission && x.form.admission.enquiryId).length;

  const gradeRow = (g) => {
    const mine = rows.filter((x) => x.a.entry_grade === g.name);
    const sentG = mine.filter((x) => x.r.sent);
    return {
      name: g.name, seats: g.seats, applications: sentG.length, offered: sentG.filter((x) => x.r.offered).length,
      enrolled: sentG.filter((x) => x.r.enrolled).length, waitlisted: mine.filter((x) => x.a.status === "waitlisted").length,
      declined: mine.filter((x) => x.a.status === "rejected").length, withdrawn: mine.filter((x) => x.a.status === "withdrawn").length
    };
  };
  const grades = settings.grades.map(gradeRow).filter((g) => g.applications || g.waitlisted || g.declined || g.withdrawn || g.seats != null);

  // Where families came from: the enquiry that began it, or "direct" when somebody simply applied.
  const sources = new Map();
  const bump = (k, f) => { if (!sources.has(k)) sources.set(k, { source: k, enquiries: 0, applications: 0, enrolled: 0 }); sources.get(k)[f]++; };
  for (const e of enquiries) bump(e.source || "other", "enquiries");
  for (const x of sent) {
    const k = (x.form.admission && x.form.admission.source) || "direct";
    bump(k, "applications");
    if (x.r.enrolled) bump(k, "enrolled");
  }

  const tally = (pick, limit) => {
    const m = new Map();
    for (const x of sent) { const k = pick(x) || "—"; m.set(k, (m.get(k) || 0) + 1); }
    return [...m.entries()].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n).slice(0, limit || 20);
  };
  const priority = tally((x) => (x.form.admission || {}).priority);
  const category = tally((x) => (x.form.student || {}).category);

  // How long the school took: from sending an application in to a decision, against its own promise.
  const decided = sent.filter((x) => x.a.decided_at && x.a.submitted_at);
  const days = decided.map((x) => Math.max(0, Math.round((x.a.decided_at - x.a.submitted_at) / DAY)));
  const within = days.filter((d) => d <= settings.decisionDays).length;
  const open = rows.filter((x) => ["submitted", "incomplete", "under_review", "changes_requested", "awaiting_decision"].includes(x.a.status) && !x.a.enrollment_id);
  const waiting = open.map((x) => Math.max(0, Math.floor((Date.parse(day + "T00:00:00Z") - (x.a.submitted_at || x.a.updated_at)) / DAY)));
  const timeliness = {
    decided: decided.length, medianDays: median(days), target: settings.decisionDays,
    withinTarget: pct(within, decided.length), open: open.length,
    openPastTarget: waiting.filter((d) => d > settings.decisionDays).length, oldestOpenDays: waiting.length ? Math.max(...waiting) : null,
    overdue: rows.filter((x) => x.a.due_on && x.a.due_on < day && ["submitted", "incomplete", "under_review", "changes_requested", "awaiting_decision"].includes(x.a.status) && !x.a.enrollment_id).length
  };

  // Enquiries that need a call today.
  const followUps = enquiries.filter((e) => !["applied", "not_proceeding"].includes(e.status) && e.follow_up_on && e.follow_up_on <= day).length;
  const lost = new Map();
  for (const e of enquiries.filter((x) => x.status === "not_proceeding")) { const k = e.lost_reason || "No reason given"; lost.set(k, (lost.get(k) || 0) + 1); }

  return {
    funnel, grades, timeliness,
    sources: [...sources.values()].sort((a, b) => b.applications - a.applications || b.enquiries - a.enquiries),
    priority, category, followUps,
    notProceeding: [...lost.entries()].map(([reason, n]) => ({ reason, n })).sort((a, b) => b.n - a.n),
    outcomes: {
      waitlisted: rows.filter((x) => x.a.status === "waitlisted").length,
      declined: rows.filter((x) => x.a.status === "rejected").length,
      withdrawn: rows.filter((x) => x.a.status === "withdrawn").length,
      drafts: rows.filter((x) => !x.r.sent).length
    },
    enrolledNow: enrollments.filter((e) => e.state === "enrolled" || e.state === "suspended").length
  };
}

const GENDER = { M: "Male", F: "Female", O: "Other" };

/* The register: one line per student, the way an inspector expects to read it — serial number, admission number,
   date, the child, the parents, the address, where from, and which class. `sensitive` is whether the reader may
   see a category; a registrar who is not an administrator reads the rest. */
export function registerRows(rows, { sensitive }) {
  return rows.map((r, i) => {
    const form = parse(r.body_json, {});
    const gs = form.guardians || [];
    const father = r.father_name || (gs.find((g) => /father|dad/i.test(g.relationship || "")) || {}).name || "";
    const mother = r.mother_name || (gs.find((g) => /mother|mom/i.test(g.relationship || "")) || {}).name || "";
    const other = r.guardian_name || (gs.find((g) => g.name && g.name !== father && g.name !== mother) || {}).name || "";
    const name = r.student_name || [r.legal_first, r.legal_last].filter(Boolean).join(" ");
    const cls = r.class_grade ? `${r.class_grade}-${r.class_section}` : "";
    return {
      serial: i + 1, admissionNo: r.admission_no || "", admittedOn: r.admitted_on || r.starts_on || "",
      name, dob: r.dob || r.date_of_birth || "", gender: GENDER[r.gender] || (form.student || {}).gender || "",
      father, mother, guardian: father || mother ? "" : other,
      address: (form.contact || {}).address || r.mailing_address || "",
      nationality: (form.student || {}).nationality || "", motherTongue: r.mother_tongue || (form.student || {}).motherTongue || "",
      category: sensitive ? (r.category || (form.student || {}).category || "") : "",
      previousSchool: r.prev_school || r.roster_prev || (form.previous || {}).school || "",
      tcNumber: (form.previous || {}).tcNumber || "",
      admittedToClass: r.admitted_to, class: cls, state: r.state, leftOn: r.left_on || r.ends_on || "",
      leftReason: r.left_reason || r.exit_reason || "", enrollmentId: r.enrollment_id, studentId: r.student_id
    };
  });
}
