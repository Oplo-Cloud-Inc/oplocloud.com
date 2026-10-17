#!/usr/bin/env node
/* ==========================================================================
   A demo school: Strawberry Fields High School, with one person in each role.

     node scripts/seed-demo-school.mjs            # local database (default)
     node scripts/seed-demo-school.mjs --remote   # production
     node scripts/seed-demo-school.mjs --remove [--remote]

   The school is a made-up demo (the SFHS demo workbook): the four people are
   taken from its staff, students and guardians sheets, with the same emails
   as the import CSVs, so loading the full roster later finds them instead of
   making second accounts. They are one coherent story: Ritika Sood runs the
   school, Myra Malhotra teaches Biology to Class X-C, Tanvi Jindal sits in
   it, and her father Tarun is her guardian.

   NO PASSWORDS. Like provision-account.sh, every account is made `invited`:
   it exists, it has its role, and it cannot sign in. Whoever will use it sets
   the password, which is also the moment it becomes `active`:

     ./scripts/set-password.sh ritika.sood@sfhs.in --remote

   Safe to run twice: every row is written only if it is missing. --remove
   takes the school and these four accounts out again (and what hangs off
   them), so a demo does not outlive its use.
   ========================================================================== */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const WHERE = args.includes("--remote") ? "--remote" : "--local";
const REMOVE = args.includes("--remove");
const DB = "oplo-platform-db";
const ORG = "org_sfhs";
const T = Date.now();

const PEOPLE = {
  admin:    { email: "ritika.sood@sfhs.in",         name: "Ritika Sood",    title: "Vice Principal (Senior School)", role: "admin" },
  teacher:  { email: "myra.malhotra@sfhs.in",       name: "Myra Malhotra",  title: "Biology teacher, Class X-C",     role: "teacher" },
  student:  { email: "tanvi.jindal@sfhs.in",        name: "Tanvi Jindal",   title: null,                             role: "student" },
  // .example can never receive mail (RFC 2606), which is what a demo wants.
  guardian: { email: "tarun.jindal2@gmail.example", name: "Tarun Jindal",   title: null,                             role: "guardian" }
};

const q = (s) => (s == null ? "NULL" : "'" + String(s).replace(/'/g, "''") + "'");
const who = (k) => `(SELECT id FROM accounts WHERE email_lower = ${q(PEOPLE[k].email)})`;

function build() {
  if (REMOVE) {
    // The organization first: its courses, sections, subjects and enrollments
    // go with it, so deleting the accounts is not blocked by them.
    return [
      `DELETE FROM organizations WHERE id = ${q(ORG)};`,
      `DELETE FROM accounts WHERE substr(id, 1, 9) = 'acc_sfhs_';`
    ].join("\n") + "\n";
  }
  const sql = [
    `INSERT OR IGNORE INTO organizations (id, slug, name, kind, created_at, updated_at)
       VALUES (${q(ORG)}, 'sfhs', 'Strawberry Fields High School (Demo)', 'school', ${T}, ${T});`
  ];
  for (const [k, p] of Object.entries(PEOPLE)) {
    const first = p.name.split(/\s+/)[0];
    const initials = p.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const mine = `email_lower = ${q(p.email.toLowerCase())}`;
    sql.push(
      `INSERT OR IGNORE INTO accounts (id, email, email_lower, email_verified, pw_hash, pw_salt, pw_iterations, status, created_at, updated_at)
         VALUES (${q("acc_sfhs_" + k)}, ${q(p.email)}, ${q(p.email.toLowerCase())}, 0, NULL, NULL, NULL, 'invited', ${T}, ${T});`,
      `INSERT OR IGNORE INTO profiles (account_id, name, first_name, initials, avatar_hue, title, created_at, updated_at)
         SELECT id, ${q(p.name)}, ${q(first)}, ${q(initials)}, '#0071e3', ${q(p.title)}, ${T}, ${T} FROM accounts WHERE ${mine};`,
      `INSERT OR IGNORE INTO account_roles (id, account_id, product, role, org_id, created_at)
         SELECT ${q("rol_sfhs_" + k)}, id, 'learn', ${q(p.role)}, ${q(ORG)}, ${T} FROM accounts WHERE ${mine};`,
      `INSERT OR IGNORE INTO organization_memberships (id, org_id, account_id, role, created_at)
         SELECT ${q("mem_sfhs_" + k)}, ${q(ORG)}, id, ${q(p.role === "admin" ? "admin" : "member")}, ${T} FROM accounts WHERE ${mine};`
    );
  }

  // Biology, Class X-C: one section, taught by Myra, with Tanvi in it.
  sql.push(
    `INSERT OR IGNORE INTO learn_subjects (id, org_id, number, title, grades_json, credits, created_by, created_at, updated_at)
       VALUES ('sub_sfhs_bio_x', ${q(ORG)}, 'BIO-X', 'Biology', '["Grade 10"]', 1, ${who("admin")}, ${T}, ${T});`,
    `INSERT OR IGNORE INTO learn_courses (id, org_id, code, title, subject, level, summary, body_json, status, created_by, created_at, updated_at)
       VALUES ('crs_sfhs_bio_xc', ${q(ORG)}, 'bio-x-c', 'Biology', 'Science', 'Class X', NULL, NULL, 'published', ${who("admin")}, ${T}, ${T});`,
    `INSERT OR IGNORE INTO learn_sections (course_id, subject_id, section_no, tab, room, capacity, periods_json, updated_by, updated_at)
       VALUES ('crs_sfhs_bio_xc', 'sub_sfhs_bio_x', 'C', 'X-C', 'S-322', 30, '[]', ${who("admin")}, ${T});`,
    `INSERT OR IGNORE INTO learn_course_memberships (id, course_id, account_id, role, created_at)
       VALUES ('enr_sfhs_teacher', 'crs_sfhs_bio_xc', ${who("teacher")}, 'teacher', ${T}),
              ('enr_sfhs_student', 'crs_sfhs_bio_xc', ${who("student")}, 'student', ${T});`,
    // OEdu's grade names are still the US ones; "Class X" is Grade 10 here.
    `INSERT OR IGNORE INTO learn_enrollments (id, org_id, student_id, school_year, grade, enrollment_type, state, starts_on, admission_no, sync_state, created_by, created_at, updated_at)
       VALUES ('enl_sfhs_student', ${q(ORG)}, ${who("student")}, '2026-27', 'Grade 10', 'returning', 'enrolled', '2026-04-01', 'SFHS/2016/1517', 'done', ${who("admin")}, ${T}, ${T});`
  );

  // The family: a guardian link (what the guard checks), contact cards, and
  // the student's own record page.
  const home = "#588, Sector 16, Chandigarh";
  sql.push(
    `INSERT OR IGNORE INTO learn_guardians (id, guardian_id, student_id, org_id, relationship, label, is_primary, created_by, created_at, updated_at)
       VALUES ('gdn_sfhs_1', ${who("guardian")}, ${who("student")}, ${q(ORG)}, 'parent', 'Father', 1, ${who("admin")}, ${T}, ${T});`,
    `INSERT OR IGNORE INTO account_contacts (account_id, mailing_address, cell_phone, alt_phone, date_of_birth, updated_by, updated_at)
       VALUES (${who("guardian")}, ${q(home)}, '+91 9845398272', '+91 9921891357', NULL, ${who("admin")}, ${T}),
              (${who("student")}, ${q(home)}, NULL, NULL, '2010-09-10', ${who("admin")}, ${T});`,
    `INSERT OR IGNORE INTO learn_student_records (id, account_id, org_id, section, body_json, updated_by, created_at, updated_at)
       VALUES ('rec_sfhs_student', ${who("student")}, ${q(ORG)}, 'student', ${q(JSON.stringify({
         summary: "Class X-C, ICSE. Demo data: every detail on this page is made up.",
         facts: [
           { label: "Admission number", value: "SFHS/2016/1517" },
           { label: "Class and section", value: "X-C" },
           { label: "Programme", value: "ICSE" },
           { label: "House", value: "Agni" },
           { label: "Roll number", value: "21" },
           { label: "Second language", value: "Hindi" }
         ]
       }))}, ${who("admin")}, ${T}, ${T});`
  );
  return sql.join("\n") + "\n";
}

const apiDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const wrangler = (...a) => execFileSync("npx", ["wrangler", "d1", "execute", DB, WHERE, ...a], { cwd: apiDir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

const dir = mkdtempSync(join(tmpdir(), "demo-school-"));
try {
  const file = join(dir, "seed.sql");
  writeFileSync(file, build());
  try { wrangler("--file", file); }
  catch (e) { console.error(String(e.stderr || e.message).split("\n").slice(-8).join("\n")); console.error("Stopped: the statements above failed."); process.exit(1); }

  // Say what is true now, from the database.
  const emails = Object.values(PEOPLE).map((p) => q(p.email.toLowerCase())).join(",");
  const out = wrangler("--json", "--command",
    `SELECT a.email, a.status, (a.pw_hash IS NOT NULL) AS has_password, p.name,
            (SELECT group_concat(r.product || '.' || r.role) FROM account_roles r WHERE r.account_id = a.id AND r.org_id = ${q(ORG)}) AS roles
       FROM accounts a LEFT JOIN profiles p ON p.account_id = a.id WHERE a.email_lower IN (${emails}) ORDER BY a.email`);
  const rows = JSON.parse(out.slice(out.indexOf("[")))[0].results;
  console.log(REMOVE ? `Removed. Demo accounts still present: ${rows.length}` : `Strawberry Fields High School (Demo), ${rows.length} accounts:`);
  for (const r of rows) console.log(`  ${r.email.padEnd(30)} ${String(r.roles).padEnd(14)} ${r.status}  ·  password: ${r.has_password ? "set" : "not set (cannot sign in yet)"}`);
  console.log(WHERE === "--remote" ? "(--remote: production)" : "(--local: nothing in production was touched)");
} finally { rmSync(dir, { recursive: true, force: true }); }
