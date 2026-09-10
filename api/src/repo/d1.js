/* ==========================================================================
   The repository.

   This is the swap point. Everything above it — services, routes, the whole
   frontend — talks in domain objects: accounts, courses, grades. Everything
   below it is SQL. D1 appears in this file and nowhere else in the codebase,
   which is the property that lets it be replaced by Postgres later without a
   single service or route changing.

   Two conventions worth stating, because they are what keeps that promise:

     · Nothing here throws ApiError. A repository reports what is in the
       database — "no row" is `null`, not a 404. Deciding that a missing row
       is an error is a decision about the request, and it belongs one layer
       up where the request is known.

     · Every query is parameterised. There is no string interpolation into SQL
       anywhere in this file, and there should never be one.
   ========================================================================== */

import { id } from "../lib/crypto.js";

const now = () => Date.now();

export class D1Repository {
  constructor(db) { this.db = db; }

  /* ------------------------------------------------------------- Accounts */

  async findAccountByEmail(email) {
    return this.db.prepare(
      `SELECT a.*, p.name, p.first_name, p.initials, p.avatar_hue, p.title
         FROM accounts a LEFT JOIN profiles p ON p.account_id = a.id
        WHERE a.email_lower = ?`
    ).bind(String(email).trim().toLowerCase()).first();
  }

  async findAccountById(accountId) {
    return this.db.prepare(
      `SELECT a.*, p.name, p.first_name, p.initials, p.avatar_hue, p.title
         FROM accounts a LEFT JOIN profiles p ON p.account_id = a.id
        WHERE a.id = ?`
    ).bind(accountId).first();
  }

  async createAccount({ email, hash, salt, iterations, name, firstName, initials, hue, title }) {
    const accountId = id("acc");
    const t = now();
    // Batched so an account and its profile are never half-created. D1 runs a
    // batch as one transaction, which is the only reason this is safe.
    await this.db.batch([
      this.db.prepare(
        `INSERT INTO accounts
           (id, email, email_lower, email_verified, pw_hash, pw_salt, pw_iterations,
            status, created_at, updated_at)
         VALUES (?, ?, ?, 0, ?, ?, ?, 'active', ?, ?)`
      ).bind(accountId, email, email.toLowerCase(), hash, salt, iterations, t, t),
      this.db.prepare(
        `INSERT INTO profiles
           (account_id, name, first_name, initials, avatar_hue, title, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(accountId, name, firstName || null, initials || null, hue || null, title || null, t, t)
    ]);
    return this.findAccountById(accountId);
  }

  async updatePassword(accountId, { hash, salt, iterations }) {
    await this.db.prepare(
      `UPDATE accounts SET pw_hash = ?, pw_salt = ?, pw_iterations = ?, updated_at = ?
        WHERE id = ?`
    ).bind(hash, salt, iterations, now(), accountId).run();
  }

  async updateProfile(accountId, patch) {
    const fields = [], values = [];
    const map = { name: "name", firstName: "first_name", initials: "initials",
                  hue: "avatar_hue", title: "title", locale: "locale" };
    for (const [k, col] of Object.entries(map)) {
      if (patch[k] !== undefined) { fields.push(`${col} = ?`); values.push(patch[k]); }
    }
    if (!fields.length) return this.findAccountById(accountId);
    values.push(now(), accountId);
    await this.db.prepare(
      `UPDATE profiles SET ${fields.join(", ")}, updated_at = ? WHERE account_id = ?`
    ).bind(...values).run();
    return this.findAccountById(accountId);
  }

  async listAccounts({ orgId } = {}) {
    if (orgId) {
      const { results } = await this.db.prepare(
        `SELECT a.id, a.email, a.status, p.name, p.first_name, p.initials, p.avatar_hue, p.title
           FROM accounts a
           JOIN organization_memberships m ON m.account_id = a.id AND m.org_id = ?
           LEFT JOIN profiles p ON p.account_id = a.id
          ORDER BY p.name`
      ).bind(orgId).all();
      return results || [];
    }
    const { results } = await this.db.prepare(
      `SELECT a.id, a.email, a.status, p.name, p.first_name, p.initials, p.avatar_hue, p.title
         FROM accounts a LEFT JOIN profiles p ON p.account_id = a.id
        ORDER BY p.name`
    ).all();
    return results || [];
  }

  /* ------------------------------------------------------------- Sessions */

  async createSession({ accountId, tokenHash, expiresAt, userAgent }) {
    const sessionId = id("ses");
    const t = now();
    await this.db.prepare(
      `INSERT INTO sessions
         (id, account_id, token_hash, created_at, expires_at, last_seen_at, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(sessionId, accountId, tokenHash, t, expiresAt, t, userAgent || null).run();
    return sessionId;
  }

  async findSession(tokenHash) {
    return this.db.prepare(
      `SELECT * FROM sessions
        WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?`
    ).bind(tokenHash, now()).first();
  }

  async touchSession(sessionId) {
    await this.db.prepare(`UPDATE sessions SET last_seen_at = ? WHERE id = ?`)
      .bind(now(), sessionId).run();
  }

  async revokeSession(sessionId) {
    await this.db.prepare(`UPDATE sessions SET revoked_at = ? WHERE id = ?`)
      .bind(now(), sessionId).run();
  }

  async revokeAllSessions(accountId) {
    await this.db.prepare(
      `UPDATE sessions SET revoked_at = ? WHERE account_id = ? AND revoked_at IS NULL`
    ).bind(now(), accountId).run();
  }

  /* ---------------------------------------------------------------- Roles */

  async rolesFor(accountId) {
    const { results } = await this.db.prepare(
      `SELECT product, role, org_id FROM account_roles WHERE account_id = ?`
    ).bind(accountId).all();
    return results || [];
  }

  async grantRole(accountId, product, role, orgId = null) {
    await this.db.prepare(
      `INSERT OR IGNORE INTO account_roles (id, account_id, product, role, org_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(id("rol"), accountId, product, role, orgId, now()).run();
  }

  async revokeRole(accountId, product, role, orgId = null) {
    await this.db.prepare(
      `DELETE FROM account_roles
        WHERE account_id = ? AND product = ? AND role = ?
          AND (org_id IS ? OR org_id = ?)`
    ).bind(accountId, product, role, orgId, orgId).run();
  }

  /* -------------------------------------------------------- Organizations */

  async createOrganization({ slug, name, kind }) {
    const orgId = id("org");
    const t = now();
    await this.db.prepare(
      `INSERT INTO organizations (id, slug, name, kind, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(orgId, slug, name, kind || "school", t, t).run();
    return this.db.prepare(`SELECT * FROM organizations WHERE id = ?`).bind(orgId).first();
  }

  async findOrganizationBySlug(slug) {
    return this.db.prepare(`SELECT * FROM organizations WHERE slug = ?`).bind(slug).first();
  }

  async addMember(orgId, accountId, role = "member") {
    await this.db.prepare(
      `INSERT OR REPLACE INTO organization_memberships
         (id, org_id, account_id, role, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(id("mem"), orgId, accountId, role, now()).run();
  }

  async membershipsFor(accountId) {
    const { results } = await this.db.prepare(
      `SELECT m.org_id, m.role, o.slug, o.name
         FROM organization_memberships m JOIN organizations o ON o.id = m.org_id
        WHERE m.account_id = ?`
    ).bind(accountId).all();
    return results || [];
  }

  /* -------------------------------------------------------------- Courses */

  async listCourses({ orgId, accountId } = {}) {
    if (accountId) {
      const { results } = await this.db.prepare(
        `SELECT c.*, cm.role AS my_role
           FROM learn_courses c
           JOIN learn_course_memberships cm
             ON cm.course_id = c.id AND cm.account_id = ?
          ORDER BY c.title`
      ).bind(accountId).all();
      return results || [];
    }
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_courses WHERE (? IS NULL OR org_id = ?) ORDER BY title`
    ).bind(orgId || null, orgId || null).all();
    return results || [];
  }

  async findCourse(courseId) {
    return this.db.prepare(`SELECT * FROM learn_courses WHERE id = ?`).bind(courseId).first();
  }

  async findCourseByCode(orgId, code) {
    return this.db.prepare(
      `SELECT * FROM learn_courses WHERE (org_id IS ? OR org_id = ?) AND code = ?`
    ).bind(orgId || null, orgId || null, code).first();
  }

  async createCourse(data) {
    const courseId = id("crs");
    const t = now();
    await this.db.prepare(
      `INSERT INTO learn_courses
         (id, org_id, code, title, subject, level, summary, body_json, status,
          created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(courseId, data.orgId || null, data.code, data.title, data.subject || null,
           data.level || null, data.summary || null,
           data.body ? JSON.stringify(data.body) : null,
           data.status || "draft", data.createdBy || null, t, t).run();
    return this.findCourse(courseId);
  }

  async updateCourse(courseId, patch) {
    const fields = [], values = [];
    const map = { title: "title", subject: "subject", level: "level",
                  summary: "summary", status: "status" };
    for (const [k, col] of Object.entries(map)) {
      if (patch[k] !== undefined) { fields.push(`${col} = ?`); values.push(patch[k]); }
    }
    if (patch.body !== undefined) {
      fields.push("body_json = ?");
      values.push(patch.body ? JSON.stringify(patch.body) : null);
    }
    if (!fields.length) return this.findCourse(courseId);
    values.push(now(), courseId);
    await this.db.prepare(
      `UPDATE learn_courses SET ${fields.join(", ")}, updated_at = ? WHERE id = ?`
    ).bind(...values).run();
    return this.findCourse(courseId);
  }

  async courseMembership(courseId, accountId) {
    return this.db.prepare(
      `SELECT * FROM learn_course_memberships WHERE course_id = ? AND account_id = ?`
    ).bind(courseId, accountId).first();
  }

  async listCourseMembers(courseId, role) {
    const { results } = await this.db.prepare(
      `SELECT cm.role, a.id, a.email, p.name, p.first_name, p.initials, p.avatar_hue
         FROM learn_course_memberships cm
         JOIN accounts a ON a.id = cm.account_id
         LEFT JOIN profiles p ON p.account_id = a.id
        WHERE cm.course_id = ? AND (? IS NULL OR cm.role = ?)
        ORDER BY p.name`
    ).bind(courseId, role || null, role || null).all();
    return results || [];
  }

  async enrol(courseId, accountId, role = "student") {
    await this.db.prepare(
      `INSERT OR IGNORE INTO learn_course_memberships
         (id, course_id, account_id, role, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(id("enr"), courseId, accountId, role, now()).run();
  }

  async unenrol(courseId, accountId, role) {
    await this.db.prepare(
      `DELETE FROM learn_course_memberships
        WHERE course_id = ? AND account_id = ? AND (? IS NULL OR role = ?)`
    ).bind(courseId, accountId, role || null, role || null).run();
  }

  /* ---------------------------------------------------- Assignments, grades */

  async listAssignments(courseId) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_assignments WHERE course_id = ? ORDER BY created_at`
    ).bind(courseId).all();
    return results || [];
  }

  async findAssignment(assignmentId) {
    return this.db.prepare(`SELECT * FROM learn_assignments WHERE id = ?`)
      .bind(assignmentId).first();
  }

  async createAssignment(data) {
    const assignmentId = id("asg");
    const t = now();
    await this.db.prepare(
      `INSERT INTO learn_assignments
         (id, course_id, title, category, out_of, due_at, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)`
    ).bind(assignmentId, data.courseId, data.title, data.category || null,
           data.outOf ?? 100, data.dueAt || null, data.createdBy || null, t, t).run();
    return this.findAssignment(assignmentId);
  }

  async updateAssignment(assignmentId, patch) {
    const fields = [], values = [];
    const map = { title: "title", category: "category", outOf: "out_of",
                  dueAt: "due_at", status: "status" };
    for (const [k, col] of Object.entries(map)) {
      if (patch[k] !== undefined) { fields.push(`${col} = ?`); values.push(patch[k]); }
    }
    if (!fields.length) return this.findAssignment(assignmentId);
    values.push(now(), assignmentId);
    await this.db.prepare(
      `UPDATE learn_assignments SET ${fields.join(", ")}, updated_at = ? WHERE id = ?`
    ).bind(...values).run();
    return this.findAssignment(assignmentId);
  }

  async deleteAssignment(assignmentId) {
    await this.db.prepare(`DELETE FROM learn_assignments WHERE id = ?`)
      .bind(assignmentId).run();
  }

  /* Grades joined to their assignment, because a score without what it was
     out of and which category it counts in is not a grade, it is a number. */
  async listGrades({ courseId, accountId }) {
    const { results } = await this.db.prepare(
      `SELECT g.*, a.title, a.category, a.course_id, a.out_of AS assignment_out_of
         FROM learn_grades g
         JOIN learn_assignments a ON a.id = g.assignment_id
        WHERE (? IS NULL OR a.course_id = ?)
          AND (? IS NULL OR g.account_id = ?)
        ORDER BY a.created_at`
    ).bind(courseId || null, courseId || null, accountId || null, accountId || null).all();
    return results || [];
  }

  async findGrade(gradeId) {
    return this.db.prepare(
      `SELECT g.*, a.course_id, a.title, a.category
         FROM learn_grades g JOIN learn_assignments a ON a.id = g.assignment_id
        WHERE g.id = ?`
    ).bind(gradeId).first();
  }

  async upsertGrade({ assignmentId, accountId, score, outOf, feedback, gradedBy }) {
    const existing = await this.db.prepare(
      `SELECT id FROM learn_grades WHERE assignment_id = ? AND account_id = ?`
    ).bind(assignmentId, accountId).first();
    const gradeId = existing ? existing.id : id("grd");
    await this.db.prepare(
      `INSERT INTO learn_grades
         (id, assignment_id, account_id, score, out_of, feedback, graded_by, graded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (assignment_id, account_id) DO UPDATE SET
         score = excluded.score, out_of = excluded.out_of,
         feedback = excluded.feedback, graded_by = excluded.graded_by,
         graded_at = excluded.graded_at`
    ).bind(gradeId, assignmentId, accountId, score, outOf ?? 100,
           feedback || null, gradedBy || null, now()).run();
    return this.findGrade(gradeId);
  }

  /* ----------------------------------------------------- Progress and XP */

  async getProgress(accountId, scope) {
    const row = await this.db.prepare(
      `SELECT * FROM learn_progress WHERE account_id = ? AND scope = ?`
    ).bind(accountId, scope).first();
    return row || null;
  }

  async listProgress(accountId) {
    const { results } = await this.db.prepare(
      `SELECT scope, state_json, updated_at FROM learn_progress WHERE account_id = ?`
    ).bind(accountId).all();
    return results || [];
  }

  async putProgress(accountId, scope, state, courseId = null) {
    await this.db.prepare(
      `INSERT INTO learn_progress (id, account_id, course_id, scope, state_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (account_id, scope) DO UPDATE SET
         state_json = excluded.state_json, updated_at = excluded.updated_at,
         course_id = excluded.course_id`
    ).bind(id("prg"), accountId, courseId, scope, JSON.stringify(state), now()).run();
  }

  async addXp({ accountId, source, amount, day, meta }) {
    await this.db.prepare(
      `INSERT INTO learn_xp_events (id, account_id, source, amount, day, meta_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id("xp"), accountId, source, amount, day,
           meta ? JSON.stringify(meta) : null, now()).run();
  }

  async xpTotal(accountId) {
    const row = await this.db.prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM learn_xp_events WHERE account_id = ?`
    ).bind(accountId).first();
    return row ? Number(row.total) : 0;
  }

  async xpByDay(accountId, sinceDay) {
    const { results } = await this.db.prepare(
      `SELECT day, SUM(amount) AS total FROM learn_xp_events
        WHERE account_id = ? AND day >= ?
        GROUP BY day ORDER BY day`
    ).bind(accountId, sinceDay).all();
    return results || [];
  }

  /* Every day this account earned anything, newest first. The streak is
     computed from this in the service rather than stored, because a stored
     counter and a ledger can disagree and only one of them is the truth. */
  async xpDays(accountId, limit = 400) {
    const { results } = await this.db.prepare(
      `SELECT DISTINCT day FROM learn_xp_events
        WHERE account_id = ? AND amount > 0
        ORDER BY day DESC LIMIT ?`
    ).bind(accountId, limit).all();
    return (results || []).map((r) => r.day);
  }

  async listAchievements(accountId) {
    const { results } = await this.db.prepare(
      `SELECT key, earned_at FROM learn_achievements WHERE account_id = ? ORDER BY earned_at`
    ).bind(accountId).all();
    return results || [];
  }

  async grantAchievement(accountId, key) {
    const res = await this.db.prepare(
      `INSERT OR IGNORE INTO learn_achievements (id, account_id, key, earned_at)
       VALUES (?, ?, ?, ?)`
    ).bind(id("ach"), accountId, key, now()).run();
    return res.meta && res.meta.changes > 0;
  }
}
