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

  /* Every live session on this account. Shown to the person it belongs to so
     "sign out everywhere" is a thing they can see the effect of rather than a
     button they have to trust. */
  async listSessions(accountId) {
    const { results } = await this.db.prepare(
      `SELECT id, created_at, last_seen_at, expires_at, user_agent
         FROM sessions
        WHERE account_id = ? AND revoked_at IS NULL AND expires_at > ?
        ORDER BY last_seen_at DESC`
    ).bind(accountId, now()).all();
    return results || [];
  }

  async revokeOtherSessions(accountId, keepSessionId) {
    await this.db.prepare(
      `UPDATE sessions SET revoked_at = ?
        WHERE account_id = ? AND id != ? AND revoked_at IS NULL`
    ).bind(now(), accountId, keepSessionId).run();
  }

  /* Expired and revoked rows are not needed once they are past their window.
     Left alone they grow without bound, and D1's free tier is a budget. */
  async pruneSessions(olderThan) {
    await this.db.prepare(
      `DELETE FROM sessions WHERE expires_at < ? OR (revoked_at IS NOT NULL AND revoked_at < ?)`
    ).bind(olderThan, olderThan).run();
  }

  /* -------------------------------------------------------------- OC EFM */

  async efmBook(bookId) {
    return this.db.prepare(
      `SELECT id, name, config, created_at FROM efm_books WHERE id = ?`
    ).bind(bookId).first();
  }

  /* Every set of books, oldest first. */
  async efmBooks() {
    const { results } = await this.db.prepare(`SELECT id, name, config, created_at FROM efm_books ORDER BY created_at, id`).all();
    return results || [];
  }

  /* Starts a new set of books with its first command, or leaves nothing behind. */
  async efmCreateBook(book, config, first) {
    try {
      await this.db.prepare(`INSERT INTO efm_books (id, name, config, created_at) VALUES (?, ?, ?, ?)`).bind(book.id, book.name, config, now()).run();
    } catch (e) {
      if (/UNIQUE|PRIMARY KEY|constraint/i.test(String(e && e.message))) return false;
      throw e;
    }
    const won = await this.efmAppendCommand(book.id, first);
    if (!won) { await this.db.prepare(`DELETE FROM efm_books WHERE id = ?`).bind(book.id).run(); return false; }
    return true;
  }

  /* Everyone who has been given OC EFM, and how. */
  async efmAccess() {
    const { results } = await this.db.prepare(
      `SELECT a.id AS id, a.email AS email, a.status AS status, p.name AS name, r.role AS role
         FROM account_roles r JOIN accounts a ON a.id = r.account_id LEFT JOIN profiles p ON p.account_id = a.id
        WHERE r.product = 'efm' ORDER BY p.name, a.email`
    ).all();
    return results || [];
  }

  /* The commands after `after`, in order. */
  async efmCommands(bookId, after = 0) {
    const { results } = await this.db.prepare(
      `SELECT seq, type, payload, actor_id, actor_name, actor_role, at, prev_hash, hash
         FROM efm_commands WHERE book_id = ? AND seq > ? ORDER BY seq`
    ).bind(bookId, after).all();
    return results || [];
  }

  /* The command already recorded under a key, if any. */
  async efmCommandByKey(bookId, key) {
    return this.db.prepare(`SELECT seq, at, hash, actor_id FROM efm_commands WHERE book_id = ? AND idem_key = ?`).bind(bookId, key).first();
  }

  /* Appends one command. False when its place has been taken — somebody else
     got there first — which is the caller's cue to say the books have moved. */
  async efmAppendCommand(bookId, row) {
    try {
      await this.db.prepare(
        `INSERT INTO efm_commands
           (book_id, seq, type, payload, actor_id, actor_name, actor_role, at, prev_hash, hash, idem_key)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(bookId, row.seq, row.type, row.payload, row.actorId, row.actorName, row.actorRole,
             row.at, row.prev, row.hash, row.key || null).run();
      return true;
    } catch (e) {
      if (/UNIQUE|PRIMARY KEY|constraint/i.test(String(e && e.message))) return false;
      throw e;
    }
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

  async getOrganization(orgId) {
    return this.db.prepare(`SELECT * FROM organizations WHERE id = ?`).bind(orgId).first();
  }

  /* A school's profile (migration 0026). Only the columns named are written. */
  async setOrgProfile(orgId, p, by) {
    const cols = { region: p.region, boards: p.boards && JSON.stringify(p.boards), state_code: p.stateCode, timezone: p.timezone,
      locale: p.locale, year_start_month: p.yearStartMonth, languages: p.languages && JSON.stringify(p.languages) };
    const sets = [], vals = [];
    for (const [k, v] of Object.entries(cols)) if (v !== undefined) { sets.push(`${k} = ?`); vals.push(v); }
    sets.push("profile_set_at = ?", "profile_set_by = ?", "updated_at = ?");
    vals.push(now(), by || null, now(), orgId);
    await this.db.prepare(`UPDATE organizations SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
    return this.getOrganization(orgId);
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
      `SELECT m.org_id, m.role, o.*
         FROM organization_memberships m JOIN organizations o ON o.id = m.org_id
        WHERE m.account_id = ?`
    ).bind(accountId).all();
    return results || [];
  }

  /* --------------------------------------------------------------- Family */

  async guardianship(guardianId, studentId) {
    return this.db.prepare(
      `SELECT * FROM learn_guardians WHERE guardian_id = ? AND student_id = ?`
    ).bind(guardianId, studentId).first();
  }

  async listGuardians(studentId) {
    const { results } = await this.db.prepare(
      `SELECT g.relationship, g.label, g.is_primary, g.created_at AS linked_at,
              a.id, a.email, a.status, p.name, p.first_name, p.initials, p.avatar_hue,
              c.mailing_address, c.cell_phone, c.alt_phone, c.date_of_birth,
              c.updated_at AS contact_updated_at
         FROM learn_guardians g
         JOIN accounts a ON a.id = g.guardian_id
         LEFT JOIN profiles p ON p.account_id = a.id
         LEFT JOIN account_contacts c ON c.account_id = a.id
        WHERE g.student_id = ?
        ORDER BY g.is_primary DESC, p.name`
    ).bind(studentId).all();
    return results || [];
  }

  async listWards(guardianId) {
    const { results } = await this.db.prepare(
      `SELECT g.relationship, g.label, g.is_primary,
              a.id, a.email, p.name, p.first_name, p.initials, p.avatar_hue,
              sp.grade_level, sp.program
         FROM learn_guardians g
         JOIN accounts a ON a.id = g.student_id
         LEFT JOIN profiles p ON p.account_id = a.id
         LEFT JOIN learn_student_programs sp ON sp.account_id = a.id
        WHERE g.guardian_id = ?
        ORDER BY p.name`
    ).bind(guardianId).all();
    return results || [];
  }

  /* One primary guardian per student, so marking one primary clears the
     others in the same batch rather than in a second request that can fail. */
  async linkGuardian({ guardianId, studentId, orgId, relationship, label, primary, createdBy }) {
    const t = now();
    const statements = [];
    if (primary) {
      statements.push(this.db.prepare(
        `UPDATE learn_guardians SET is_primary = 0, updated_at = ? WHERE student_id = ?`
      ).bind(t, studentId));
    }
    statements.push(this.db.prepare(
      `INSERT INTO learn_guardians
         (id, guardian_id, student_id, org_id, relationship, label, is_primary, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (guardian_id, student_id) DO UPDATE SET
         relationship = excluded.relationship, label = excluded.label,
         is_primary = excluded.is_primary, updated_at = excluded.updated_at`
    ).bind(id("grd"), guardianId, studentId, orgId || null, relationship, label || null,
           primary ? 1 : 0, createdBy || null, t, t));
    await this.db.batch(statements);
    return this.guardianship(guardianId, studentId);
  }

  async unlinkGuardian(guardianId, studentId) {
    await this.db.prepare(
      `DELETE FROM learn_guardians WHERE guardian_id = ? AND student_id = ?`
    ).bind(guardianId, studentId).run();
  }

  async getContact(accountId) {
    return this.db.prepare(`SELECT * FROM account_contacts WHERE account_id = ?`).bind(accountId).first();
  }

  async putContact(accountId, c, actorId) {
    await this.db.prepare(
      `INSERT INTO account_contacts
         (account_id, mailing_address, cell_phone, alt_phone, date_of_birth, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (account_id) DO UPDATE SET
         mailing_address = excluded.mailing_address, cell_phone = excluded.cell_phone,
         alt_phone = excluded.alt_phone, date_of_birth = excluded.date_of_birth,
         updated_by = excluded.updated_by, updated_at = excluded.updated_at`
    ).bind(accountId, c.mailingAddress ?? null, c.cellPhone ?? null, c.altPhone ?? null,
           c.dateOfBirth ?? null, actorId || null, now()).run();
    return this.getContact(accountId);
  }

  async listStudentRecords(accountId) {
    const { results } = await this.db.prepare(
      `SELECT r.section, r.body_json, r.updated_at, p.name AS updated_by_name
         FROM learn_student_records r
         LEFT JOIN profiles p ON p.account_id = r.updated_by
        WHERE r.account_id = ?`
    ).bind(accountId).all();
    return results || [];
  }

  async putStudentRecord({ accountId, orgId, section, body, actorId }) {
    const t = now();
    await this.db.prepare(
      `INSERT INTO learn_student_records
         (id, account_id, org_id, section, body_json, updated_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (account_id, section) DO UPDATE SET
         body_json = excluded.body_json, updated_by = excluded.updated_by,
         updated_at = excluded.updated_at`
    ).bind(id("srec"), accountId, orgId || null, section, JSON.stringify(body), actorId || null, t, t).run();
  }

  async deleteStudentRecord(accountId, section) {
    await this.db.prepare(
      `DELETE FROM learn_student_records WHERE account_id = ? AND section = ?`
    ).bind(accountId, section).run();
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
      `SELECT cm.role, cm.created_at AS joined_at, a.id, a.email, p.name, p.first_name, p.initials, p.avatar_hue
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

  /* Drafts are work a teacher has not set yet, so every read leaves them out
     unless it asks for them — only the teacher's own list of work does. */
  async listAssignments(courseId, { drafts = false } = {}) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_assignments
        WHERE course_id = ? AND (? = 1 OR status <> 'draft') ORDER BY created_at`
    ).bind(courseId, drafts ? 1 : 0).all();
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
         (id, course_id, title, category, out_of, due_at, extra_credit, status,
          activity_json, details_json, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(assignmentId, data.courseId, data.title, data.category || null,
           data.outOf ?? 100, data.dueAt || null, data.extraCredit ? 1 : 0,
           data.status || "open",
           data.activity ? JSON.stringify(data.activity) : null,
           data.details ? JSON.stringify(data.details) : null,
           data.createdBy || null, t, t).run();
    return this.findAssignment(assignmentId);
  }

  async updateAssignment(assignmentId, patch) {
    const fields = [], values = [];
    const map = { title: "title", category: "category", outOf: "out_of",
                  dueAt: "due_at", status: "status", extraCredit: "extra_credit" };
    for (const [k, col] of Object.entries(map)) {
      if (patch[k] !== undefined) { fields.push(`${col} = ?`); values.push(patch[k]); }
    }
    if (patch.activity !== undefined) {
      fields.push("activity_json = ?");
      values.push(patch.activity ? JSON.stringify(patch.activity) : null);
    }
    if (patch.details !== undefined) {
      fields.push("details_json = ?");
      values.push(patch.details ? JSON.stringify(patch.details) : null);
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

  /* Hand-ins. One per student per assignment; handing in again replaces what
     was handed in, and keeps the first time it arrived as well as the last. */
  async putSubmission(assignmentId, accountId, content) {
    const t = now();
    await this.db.prepare(
      `INSERT INTO learn_submissions (id, assignment_id, account_id, content, submitted_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (assignment_id, account_id) DO UPDATE SET
         content = excluded.content, submitted_at = excluded.submitted_at`
    ).bind(id("sub"), assignmentId, accountId, content, t).run();
    return this.db.prepare(
      `SELECT * FROM learn_submissions WHERE assignment_id = ? AND account_id = ?`
    ).bind(assignmentId, accountId).first();
  }

  async listSubmissions({ courseId = null, accountId = null }) {
    const { results } = await this.db.prepare(
      `SELECT s.* FROM learn_submissions s
         JOIN learn_assignments a ON a.id = s.assignment_id
        WHERE (? IS NULL OR a.course_id = ?) AND (? IS NULL OR s.account_id = ?)`
    ).bind(courseId, courseId, accountId, accountId).all();
    return results || [];
  }

  async isEnrolled(courseId, accountId, role) {
    const row = await this.db.prepare(
      `SELECT 1 AS ok FROM learn_course_memberships
        WHERE course_id = ? AND account_id = ? AND role = ?`
    ).bind(courseId, accountId, role).first();
    return !!row;
  }

  /* Grades joined to their assignment, because a score without what it was
     out of and which category it counts in is not a grade, it is a number. */
  async listGrades({ courseId, accountId }) {
    const { results } = await this.db.prepare(
      `SELECT g.*, a.title, a.category, a.course_id, a.out_of AS assignment_out_of,
              a.created_at AS work_created_at, a.due_at, a.extra_credit
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

  /* A patch, not a replacement. A teacher who writes a comment has not
     withdrawn the mark, and a teacher who corrects a mark has not withdrawn
     the comment — so a field that was not sent is a field that is left where
     it was. The old upsert overwrote every column from whatever the caller
     happened to include, which made "save the feedback" quietly erase a
     score.

     Every write also lands in `learn_grade_events`, from here rather than
     from a service, because a history that a caller can forget to write is
     not a history. */
  async upsertGrade({ assignmentId, accountId, score, outOf, status, late, feedback,
                      mark, detail, note, gradedBy }) {
    const before = await this.db.prepare(
      `SELECT * FROM learn_grades WHERE assignment_id = ? AND account_id = ?`
    ).bind(assignmentId, accountId).first();
    const t = now();

    if (!before) {
      const gradeId = id("grd");
      await this.db.prepare(
        `INSERT INTO learn_grades
           (id, assignment_id, account_id, score, out_of, status, late, feedback,
            mark, detail_json, graded_by, graded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(gradeId, assignmentId, accountId, score ?? null, outOf ?? 100,
             status || "marked", late ? 1 : 0, feedback ?? null, mark ?? null,
             detail ? JSON.stringify(detail) : null, gradedBy || null, t).run();
      await this.recordGradeEvent({
        assignmentId, accountId, fromScore: null, fromStatus: null,
        toScore: score ?? null, toStatus: status || "marked", note, actorId: gradedBy, at: t
      });
      return this.findGrade(gradeId);
    }

    const fields = [], values = [];
    const set = (col, v) => { fields.push(`${col} = ?`); values.push(v); };
    if (score !== undefined)    set("score", score);
    if (outOf !== undefined)    set("out_of", outOf);
    if (status !== undefined)   set("status", status);
    if (late !== undefined)     set("late", late ? 1 : 0);
    if (feedback !== undefined) set("feedback", feedback);

    // A write that changes nothing is not an event. Otherwise tabbing across
    // a row fills the history with rows saying a grade stayed the same.
    const scoreChanged = score !== undefined &&
      (score == null ? before.score != null : Number(score) !== Number(before.score));
    const statusChanged = status !== undefined && status !== before.status;

    /* A special mark and the working behind a score describe the score they
       were given with. When the score or the status changes and nothing was
       said about them, they are about a mark that is no longer there: the
       code goes, and so does how the old score was arrived at. A sticker is
       the teacher's, not the score's, and stays. */
    if (mark !== undefined) set("mark", mark);
    else if ((scoreChanged || statusChanged) && before.mark) set("mark", null);
    if (detail !== undefined) set("detail_json", detail ? JSON.stringify(detail) : null);
    else if ((scoreChanged || statusChanged) && before.detail_json) {
      let kept = null;
      try { const d = JSON.parse(before.detail_json); if (d && d.sticker) kept = { sticker: d.sticker }; } catch { kept = null; }
      set("detail_json", kept ? JSON.stringify(kept) : null);
    }
    if (!fields.length) return this.findGrade(before.id);

    set("graded_by", gradedBy || before.graded_by || null);
    set("graded_at", t);
    values.push(before.id);
    await this.db.prepare(
      `UPDATE learn_grades SET ${fields.join(", ")} WHERE id = ?`
    ).bind(...values).run();

    if (scoreChanged || statusChanged) {
      await this.recordGradeEvent({
        assignmentId, accountId,
        fromScore: before.score, fromStatus: before.status,
        toScore: score !== undefined ? score : before.score,
        toStatus: status !== undefined ? status : before.status,
        note, actorId: gradedBy, at: t
      });
    }
    return this.findGrade(before.id);
  }

  async recordGradeEvent({ assignmentId, accountId, fromScore, fromStatus,
                           toScore, toStatus, note, actorId, at }) {
    await this.db.prepare(
      `INSERT INTO learn_grade_events
         (id, assignment_id, account_id, from_score, from_status, to_score,
          to_status, note, actor_id, at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id("gev"), assignmentId, accountId, fromScore ?? null, fromStatus ?? null,
           toScore ?? null, toStatus ?? null, note || null, actorId || null,
           at || now()).run();
  }

  /* The history of one mark, or of everything one student has been given in
     one course. Newest first, because the question is almost always "what
     just happened". */
  async listGradeEvents({ assignmentId, accountId, courseId, limit = 50 }) {
    const { results } = await this.db.prepare(
      `SELECT e.*, a.title, a.out_of AS assignment_out_of, a.course_id,
              p.name AS actor_name
         FROM learn_grade_events e
         JOIN learn_assignments a ON a.id = e.assignment_id
         LEFT JOIN profiles p ON p.account_id = e.actor_id
        WHERE (? IS NULL OR e.assignment_id = ?)
          AND (? IS NULL OR e.account_id = ?)
          AND (? IS NULL OR a.course_id = ?)
        ORDER BY e.at DESC
        LIMIT ?`
    ).bind(assignmentId || null, assignmentId || null,
           accountId || null, accountId || null,
           courseId || null, courseId || null,
           Math.min(Number(limit) || 50, 200)).all();
    return results || [];
  }

  /* Everything that happened across a set of courses, newest first. The
     placeholders are generated from the list's length and the values are still
     bound — there is no interpolation of a value into SQL here and there must
     never be one, whatever the shape of the query. */
  async listGradeEventsForCourses(courseIds, limit = 60) {
    if (!courseIds || !courseIds.length) return [];
    const slots = courseIds.map(() => "?").join(", ");
    const { results } = await this.db.prepare(
      `SELECT e.*, a.title, a.out_of AS assignment_out_of, a.course_id,
              c.title AS course_title,
              p.name AS actor_name, sp.name AS student_name,
              sp.initials AS student_initials, sp.avatar_hue AS student_hue
         FROM learn_grade_events e
         JOIN learn_assignments a ON a.id = e.assignment_id
         JOIN learn_courses c ON c.id = a.course_id
         LEFT JOIN profiles p ON p.account_id = e.actor_id
         LEFT JOIN profiles sp ON sp.account_id = e.account_id
        WHERE a.course_id IN (${slots})
        ORDER BY e.at DESC
        LIMIT ?`
    ).bind(...courseIds, Math.min(Number(limit) || 60, 200)).all();
    return results || [];
  }

  async findGradeEvent(eventId) {
    return this.db.prepare(
      `SELECT e.*, a.course_id, a.title, a.out_of AS assignment_out_of
         FROM learn_grade_events e
         JOIN learn_assignments a ON a.id = e.assignment_id
        WHERE e.id = ?`
    ).bind(eventId).first();
  }

  /* --------------------------------------------------------- Course documents
     What a course's teachers keep about it that is not a grade: a seating
     chart, lesson plans, their stock comments, an override. Read whole and
     written whole, one row each. */

  async listCourseDocs(courseId, kind = null) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_course_docs
        WHERE course_id = ? AND (? IS NULL OR kind = ?) ORDER BY updated_at DESC`
    ).bind(courseId, kind, kind).all();
    return results || [];
  }

  async putCourseDoc({ courseId, kind, docId, body, actorId }) {
    await this.db.prepare(
      `INSERT INTO learn_course_docs (course_id, kind, doc_id, body_json, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (course_id, kind, doc_id) DO UPDATE SET
         body_json = excluded.body_json, updated_by = excluded.updated_by,
         updated_at = excluded.updated_at`
    ).bind(courseId, kind, docId, JSON.stringify(body), actorId || null, now()).run();
    return this.db.prepare(
      `SELECT * FROM learn_course_docs WHERE course_id = ? AND kind = ? AND doc_id = ?`
    ).bind(courseId, kind, docId).first();
  }

  async deleteCourseDoc(courseId, kind, docId) {
    await this.db.prepare(
      `DELETE FROM learn_course_docs WHERE course_id = ? AND kind = ? AND doc_id = ?`
    ).bind(courseId, kind, docId).run();
  }

  /* ----------------------------------------------------------- Reporting
     The one thing on a report card that is written rather than computed. */

  async listReportComments({ courseId, accountId, term = "current" }) {
    const { results } = await this.db.prepare(
      `SELECT rc.*, c.title AS course_title, p.name AS author_name
         FROM learn_report_comments rc
         JOIN learn_courses c ON c.id = rc.course_id
         LEFT JOIN profiles p ON p.account_id = rc.author_id
        WHERE (? IS NULL OR rc.course_id = ?)
          AND (? IS NULL OR rc.account_id = ?)
          AND rc.term = ?
        ORDER BY c.title`
    ).bind(courseId || null, courseId || null,
           accountId || null, accountId || null, term).all();
    return results || [];
  }

  async upsertReportComment({ courseId, accountId, term = "current", body, actorId }) {
    const existing = await this.db.prepare(
      `SELECT * FROM learn_report_comments
        WHERE course_id = ? AND account_id = ? AND term = ?`
    ).bind(courseId, accountId, term).first();
    const t = now();

    if (!existing) {
      const commentId = id("rcm");
      await this.db.prepare(
        `INSERT INTO learn_report_comments
           (id, course_id, account_id, term, body, author_id, updated_by,
            created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(commentId, courseId, accountId, term, body || null,
             actorId || null, actorId || null, t, t).run();
      return this.findReportComment(commentId);
    }

    // The author stays whoever wrote it. Editing somebody's sentence about a
    // child does not make it yours.
    await this.db.prepare(
      `UPDATE learn_report_comments SET body = ?, updated_by = ?, updated_at = ?
        WHERE id = ?`
    ).bind(body || null, actorId || null, t, existing.id).run();
    return this.findReportComment(existing.id);
  }

  async findReportComment(commentId) {
    return this.db.prepare(
      `SELECT rc.*, c.title AS course_title, p.name AS author_name
         FROM learn_report_comments rc
         JOIN learn_courses c ON c.id = rc.course_id
         LEFT JOIN profiles p ON p.account_id = rc.author_id
        WHERE rc.id = ?`
    ).bind(commentId).first();
  }

  /* ---------------------------------------------------------- Study sets */

  async listStudySets({ orgId, courseId, accountId } = {}) {
    const { results } = await this.db.prepare(
      `SELECT s.*, (SELECT COUNT(*) FROM learn_study_terms t WHERE t.set_id = s.id) AS term_count
         FROM learn_study_sets s
        WHERE s.status != 'archived'
          AND (? IS NULL OR s.org_id = ?)
          AND (? IS NULL OR s.course_id = ?)
          AND (? IS NULL OR s.created_by = ?)
        ORDER BY s.title`
    ).bind(orgId || null, orgId || null, courseId || null, courseId || null,
           accountId || null, accountId || null).all();
    return results || [];
  }

  /* Every set this account can legitimately reach: the ones in their courses,
     the ones published to their organization, and their own. Done as one
     query rather than three round trips, because this runs on every sign-in. */
  async listStudySetsFor(accountId, orgId) {
    const { results } = await this.db.prepare(
      `SELECT s.*, (SELECT COUNT(*) FROM learn_study_terms t WHERE t.set_id = s.id) AS term_count
         FROM learn_study_sets s
        WHERE s.status = 'published'
          AND (
            s.created_by = ?
            OR (s.visibility = 'org' AND s.org_id = ?)
            OR (s.visibility = 'course' AND s.course_id IN (
                  SELECT course_id FROM learn_course_memberships WHERE account_id = ?))
          )
        ORDER BY s.title`
    ).bind(accountId, orgId || null, accountId).all();
    return results || [];
  }

  /* ---------------------------------------------------------- Assessments
     A published assessment reaches only the accounts it was set for. The
     spec is stored as the JSON a student is shown — services/assessments.js
     has already refused anything carrying an answer. */

  async findAssessment(assessmentId) {
    return this.db.prepare(`SELECT * FROM learn_assessments WHERE id = ?`)
      .bind(assessmentId).first();
  }

  async listAssessments() {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_assessments WHERE status != 'archived'
        ORDER BY COALESCE(opens_at, created_at) DESC`
    ).all();
    return results || [];
  }

  async listAssessmentsFor(accountId) {
    const { results } = await this.db.prepare(
      `SELECT a.* FROM learn_assessments a
         JOIN learn_assessment_assignees x ON x.assessment_id = a.id
        WHERE x.account_id = ? AND a.status = 'published'
        ORDER BY COALESCE(a.opens_at, a.created_at)`
    ).bind(accountId).all();
    return results || [];
  }

  async isAssessmentAssignee(assessmentId, accountId) {
    const row = await this.db.prepare(
      `SELECT 1 AS ok FROM learn_assessment_assignees WHERE assessment_id = ? AND account_id = ?`
    ).bind(assessmentId, accountId).first();
    return !!row;
  }

  async listAssessmentAssignees(assessmentId) {
    const { results } = await this.db.prepare(
      `SELECT account_id, assigned_at FROM learn_assessment_assignees
        WHERE assessment_id = ? ORDER BY assigned_at`
    ).bind(assessmentId).all();
    return results || [];
  }

  async upsertAssessment(a) {
    const t = now();
    await this.db.prepare(
      `INSERT INTO learn_assessments
         (id, org_id, course_code, title, version, status, opens_at, closes_at,
          spec_json, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         org_id = excluded.org_id, course_code = excluded.course_code,
         title = excluded.title, version = excluded.version, status = excluded.status,
         opens_at = excluded.opens_at, closes_at = excluded.closes_at,
         spec_json = excluded.spec_json, updated_at = excluded.updated_at`
    ).bind(a.id, a.orgId || null, a.courseCode || null, a.title, a.version, a.status,
           a.opensAt ?? null, a.closesAt ?? null, a.specJson, a.createdBy || null, t, t).run();
    return this.findAssessment(a.id);
  }

  /* The whole list at once, in one transaction: a partial list is a student
     who was set an exam and cannot open it. */
  async replaceAssessmentAssignees(assessmentId, accountIds, assignedBy) {
    const t = now();
    const stmts = [
      this.db.prepare(`DELETE FROM learn_assessment_assignees WHERE assessment_id = ?`).bind(assessmentId)
    ];
    for (const accountId of accountIds) {
      stmts.push(this.db.prepare(
        `INSERT INTO learn_assessment_assignees (assessment_id, account_id, assigned_by, assigned_at)
         VALUES (?, ?, ?, ?)`
      ).bind(assessmentId, accountId, assignedBy || null, t));
    }
    await this.db.batch(stmts);
  }

  async findStudySet(setId) {
    return this.db.prepare(`SELECT * FROM learn_study_sets WHERE id = ?`)
      .bind(setId).first();
  }

  async findStudySetByCode(orgId, code) {
    return this.db.prepare(
      `SELECT * FROM learn_study_sets WHERE (org_id IS ? OR org_id = ?) AND code = ?`
    ).bind(orgId || null, orgId || null, code).first();
  }

  async listTerms(setId) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_study_terms WHERE set_id = ? ORDER BY position`
    ).bind(setId).all();
    return results || [];
  }

  async createStudySet(data) {
    const setId = id("set");
    const t = now();
    await this.db.prepare(
      `INSERT INTO learn_study_sets
         (id, org_id, course_id, code, title, summary, visibility, status,
          created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(setId, data.orgId || null, data.courseId || null, data.code, data.title,
           data.summary || null, data.visibility || "course",
           data.status || "draft", data.createdBy || null, t, t).run();
    return this.findStudySet(setId);
  }

  async updateStudySet(setId, patch) {
    const fields = [], values = [];
    const map = { title: "title", summary: "summary", courseId: "course_id",
                  visibility: "visibility", status: "status" };
    for (const [k, col] of Object.entries(map)) {
      if (patch[k] !== undefined) { fields.push(`${col} = ?`); values.push(patch[k]); }
    }
    if (!fields.length) return this.findStudySet(setId);
    values.push(now(), setId);
    await this.db.prepare(
      `UPDATE learn_study_sets SET ${fields.join(", ")}, updated_at = ? WHERE id = ?`
    ).bind(...values).run();
    return this.findStudySet(setId);
  }

  /* Terms are replaced wholesale, because that is how a set is edited: the
     author works on the whole list and saves it. Diffing to preserve ids
     would buy nothing — nothing references a term by id — and would cost a
     reconciliation loop that could get it wrong.

     Batched so a set is never half-replaced. A partial write here would show
     a student a set with six of its twelve terms and no indication why. */
  async replaceTerms(setId, terms) {
    const t = now();
    const statements = [
      this.db.prepare(`DELETE FROM learn_study_terms WHERE set_id = ?`).bind(setId)
    ];
    terms.forEach((row, i) => {
      statements.push(this.db.prepare(
        `INSERT INTO learn_study_terms
           (id, set_id, position, term, definition, why, example, hint, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(id("trm"), setId, i, row.term, row.definition,
             row.why || null, row.example || null, row.hint || null, t, t));
    });
    statements.push(this.db.prepare(
      `UPDATE learn_study_sets SET updated_at = ? WHERE id = ?`
    ).bind(t, setId));
    await this.db.batch(statements);
    return this.listTerms(setId);
  }

  /* Archived rather than deleted. A set a class has been studying from is not
     something one click should be able to remove from their history. */
  async archiveStudySet(setId) {
    await this.db.prepare(
      `UPDATE learn_study_sets SET status = 'archived', updated_at = ? WHERE id = ?`
    ).bind(now(), setId).run();
  }

  /* ------------------------------------------- Programs and transfer credit */

  async getProgram(accountId) {
    return this.db.prepare(`SELECT * FROM learn_student_programs WHERE account_id = ?`)
      .bind(accountId).first();
  }

  async upsertProgram(accountId, orgId, data) {
    const t = now();
    await this.db.prepare(
      `INSERT INTO learn_student_programs
         (id, account_id, org_id, program, track, grade_level, enrolled_at, expected_grad,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (account_id) DO UPDATE SET
         org_id = excluded.org_id, program = excluded.program, track = excluded.track,
         grade_level = excluded.grade_level,
         enrolled_at = COALESCE(excluded.enrolled_at, learn_student_programs.enrolled_at),
         expected_grad = COALESCE(excluded.expected_grad, learn_student_programs.expected_grad),
         updated_at = excluded.updated_at`
    ).bind(id("prg"), accountId, orgId || null, data.program || null, data.track,
           data.gradeLevel ?? null, data.enrolledAt ?? null, data.expectedGrad ?? null, t, t).run();
    return this.getProgram(accountId);
  }

  async listTransferRecords(accountId) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_transfer_records WHERE account_id = ? ORDER BY created_at`
    ).bind(accountId).all();
    return results || [];
  }

  async findTransferRecord(recordId) {
    return this.db.prepare(`SELECT * FROM learn_transfer_records WHERE id = ?`).bind(recordId).first();
  }

  async listTransferCourses(accountId) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_transfer_courses WHERE account_id = ? ORDER BY record_id, position`
    ).bind(accountId).all();
    return results || [];
  }

  async listTransferExams(accountId) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_transfer_exams WHERE account_id = ? ORDER BY sitting, name`
    ).bind(accountId).all();
    return results || [];
  }
  async listEhsCourses(accountId) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_ehs_courses WHERE account_id = ? ORDER BY position`
    ).bind(accountId).all();
    return results || [];
  }
  /* EHS's own record of a student: their standing, what EHS issued, and every
     course they took with it. Replaced whole, in one batch, the same as a
     transfer record — a correction must never leave two copies adding up. */
  async replaceEhsRecord({ accountId, orgId, createdBy, enrollment, courses }) {
    const t = now();
    const statements = [
      this.db.prepare(`DELETE FROM learn_ehs_courses WHERE account_id = ?`).bind(accountId),
      this.db.prepare(
        `INSERT INTO learn_student_programs
           (id, account_id, org_id, track, enrolled_at, status, issued_json, created_at, updated_at)
         VALUES (?, ?, ?, '21.5', ?, ?, ?, ?, ?)
         ON CONFLICT (account_id) DO UPDATE SET
           enrolled_at = excluded.enrolled_at, status = excluded.status,
           issued_json = excluded.issued_json, updated_at = excluded.updated_at`
      ).bind(id("prg"), accountId, orgId || null, enrollment.enrolledAt ?? null, enrollment.status || null,
             enrollment.issued ? JSON.stringify(enrollment.issued) : null, t, t)
    ];
    courses.forEach((c, i) => {
      statements.push(this.db.prepare(
        `INSERT INTO learn_ehs_courses
           (id, account_id, org_id, course_id, position, school_year, term, code, title, mark,
            mark_numeric, credits, area, status, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(id("ehc"), accountId, orgId || null, c.courseId || null, i, c.schoolYear, c.term, c.code,
             c.title, c.mark, c.markNumeric, c.credits, c.area, c.status, createdBy || null, t, t));
    });
    await this.db.batch(statements);
    return { courses: courses.length };
  }

  /* A record, its courses and its exams, replacing any earlier record from
     the same school — in one batch, so a re-import is never half applied and
     never leaves two copies adding up to double the credit. Children are
     deleted explicitly rather than trusting cascade to be switched on. */
  async replaceTransferRecord({ accountId, orgId, createdBy, record, courses, exams }) {
    const t = now();
    const recordId = id("trx");
    const { results: old } = await this.db.prepare(
      `SELECT id FROM learn_transfer_records WHERE account_id = ? AND school = ?`
    ).bind(accountId, record.school).all();

    const statements = [];
    for (const o of old || []) {
      statements.push(this.db.prepare(`DELETE FROM learn_transfer_courses WHERE record_id = ?`).bind(o.id));
      statements.push(this.db.prepare(`DELETE FROM learn_transfer_exams WHERE record_id = ?`).bind(o.id));
      statements.push(this.db.prepare(`DELETE FROM learn_transfer_records WHERE id = ?`).bind(o.id));
    }
    statements.push(this.db.prepare(
      `INSERT INTO learn_transfer_records
         (id, account_id, org_id, school, authority, school_code, kind, status, credit_system,
          printed_on, summary_json, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(recordId, accountId, orgId || null, record.school, record.authority || null,
           record.schoolCode || null, record.kind, record.status, record.creditSystem,
           record.printedOn || null, JSON.stringify(record.summary || {}), createdBy || null, t, t));
    courses.forEach((c, i) => {
      statements.push(this.db.prepare(
        `INSERT INTO learn_transfer_courses
           (id, record_id, account_id, position, school_year, grade_level, term, code, title, mark,
            mark_numeric, attempted, earned, area, flags, ehs_credits, decision, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`
      ).bind(id("tcr"), recordId, accountId, i, c.schoolYear, c.gradeLevel, c.term, c.code, c.title,
             c.mark, c.markNumeric, c.attempted, c.earned, c.area, c.flags || null, c.ehsCredits,
             c.decision || "proposed"));
    });
    exams.forEach((e) => {
      statements.push(this.db.prepare(
        `INSERT INTO learn_transfer_exams (id, record_id, account_id, name, sitting, score, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(id("tex"), recordId, accountId, e.name, e.sitting, e.score, e.status));
    });
    await this.db.batch(statements);
    return this.findTransferRecord(recordId);
  }

  async updateTransferRecord(recordId, patch) {
    const fields = [], values = [];
    const map = { kind: "kind", status: "status", evaluatedBy: "evaluated_by", evaluatedAt: "evaluated_at" };
    for (const [k, col] of Object.entries(map)) {
      if (patch[k] !== undefined) { fields.push(`${col} = ?`); values.push(patch[k]); }
    }
    if (!fields.length) return this.findTransferRecord(recordId);
    values.push(now(), recordId);
    await this.db.prepare(
      `UPDATE learn_transfer_records SET ${fields.join(", ")}, updated_at = ? WHERE id = ?`
    ).bind(...values).run();
    return this.findTransferRecord(recordId);
  }

  async findTransferCourse(courseId) {
    return this.db.prepare(`SELECT * FROM learn_transfer_courses WHERE id = ?`).bind(courseId).first();
  }

  async updateTransferCourse(courseId, patch) {
    const fields = [], values = [];
    const map = { decision: "decision", area: "area", ehsCredits: "ehs_credits", note: "note" };
    for (const [k, col] of Object.entries(map)) {
      if (patch[k] !== undefined) { fields.push(`${col} = ?`); values.push(patch[k]); }
    }
    if (!fields.length) return this.findTransferCourse(courseId);
    values.push(courseId);
    await this.db.prepare(
      `UPDATE learn_transfer_courses SET ${fields.join(", ")} WHERE id = ?`
    ).bind(...values).run();
    return this.findTransferCourse(courseId);
  }

  /* ----------------------------------------------------- Progress and XP */

  async getProgress(accountId, scope) {
    const row = await this.db.prepare(
      `SELECT * FROM learn_progress WHERE account_id = ? AND scope = ?`
    ).bind(accountId, scope).first();
    return row || null;
  }

  async listProgress(accountId, scope = null) {
    const stmt = scope
      ? this.db.prepare(
          `SELECT scope, state_json, updated_at FROM learn_progress WHERE account_id = ? AND scope = ?`
        ).bind(accountId, scope)
      : this.db.prepare(
          `SELECT scope, state_json, updated_at FROM learn_progress WHERE account_id = ?`
        ).bind(accountId);
    const { results } = await stmt.all();
    return results || [];
  }

  /* Write one scope of a student's progress.

     With no `base` this is the old unconditional write, kept for callers that
     never learned a base. With one, it is a compare-and-set against the
     server's own updatedAt: `base` 0 means "I believe nothing is stored" and
     only inserts; any other `base` only updates a row still at that value.
     Either way a device that has not seen another device's write gets
     { conflict: true } instead of overwriting it.

     `updated_at` only ever moves forward — MAX(now, previous + 1) — so two
     writes in the same millisecond still have distinct stamps, and a base can
     never match a row that has changed since it was read. RETURNING hands back
     the value actually stored, rather than a second clock reading that could
     disagree with it. */
  async putProgress(accountId, scope, state, courseId = null, base = undefined) {
    const t = now();
    const body = JSON.stringify(state);
    const current = async () => {
      const row = await this.db.prepare(
        `SELECT updated_at FROM learn_progress WHERE account_id = ? AND scope = ?`
      ).bind(accountId, scope).first();
      return row ? row.updated_at : null;
    };

    if (base === undefined || base === null) {
      const row = await this.db.prepare(
        `INSERT INTO learn_progress (id, account_id, course_id, scope, state_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (account_id, scope) DO UPDATE SET
           state_json = excluded.state_json,
           course_id  = excluded.course_id,
           updated_at = MAX(excluded.updated_at, learn_progress.updated_at + 1)
         RETURNING updated_at`
      ).bind(id("prg"), accountId, courseId, scope, body, t).first();
      return { ok: true, updatedAt: row ? row.updated_at : t };
    }

    if (Number(base) === 0) {
      try {
        const row = await this.db.prepare(
          `INSERT INTO learn_progress (id, account_id, course_id, scope, state_json, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           RETURNING updated_at`
        ).bind(id("prg"), accountId, courseId, scope, body, t).first();
        return { ok: true, updatedAt: row.updated_at };
      } catch (e) {
        // Another device created the scope first. That is the conflict this
        // exists to catch, not an error.
        if (!/unique|constraint/i.test(String(e && e.message))) throw e;
        return { conflict: true, updatedAt: await current() };
      }
    }

    const row = await this.db.prepare(
      `UPDATE learn_progress
          SET state_json = ?,
              course_id  = COALESCE(?, course_id),
              updated_at = MAX(?, updated_at + 1)
        WHERE account_id = ? AND scope = ? AND updated_at = ?
        RETURNING updated_at`
    ).bind(body, courseId, t, accountId, scope, Number(base)).first();
    if (row) return { ok: true, updatedAt: row.updated_at };
    return { conflict: true, updatedAt: await current() };
  }

  /* ------------------------------------------------------------- Marks
     The student's reading, as rows. `putMark` is an upsert on an id the
     client generated, which is what makes syncing a mark idempotent: a
     retry after a dropped connection writes the same row rather than a
     second copy of the same highlight. */
  async listMarks(accountId, scope = null) {
    const sql = scope
      ? `SELECT * FROM learn_marks WHERE account_id = ? AND scope = ? ORDER BY created_at`
      : `SELECT * FROM learn_marks WHERE account_id = ? ORDER BY created_at`;
    const stmt = scope
      ? this.db.prepare(sql).bind(accountId, scope)
      : this.db.prepare(sql).bind(accountId);
    const { results } = await stmt.all();
    return results || [];
  }

  async getMark(markId) {
    return await this.db.prepare(
      `SELECT * FROM learn_marks WHERE id = ?`
    ).bind(markId).first();
  }

  async putMark(m) {
    const t = now();
    await this.db.prepare(
      `INSERT INTO learn_marks
         (id, account_id, course_id, scope, section, pass, text,
          exact, prefix, suffix, char_offset, note, reply_to, visibility,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         pass = excluded.pass, text = excluded.text,
         exact = excluded.exact, prefix = excluded.prefix,
         suffix = excluded.suffix, char_offset = excluded.char_offset,
         note = excluded.note, visibility = excluded.visibility,
         updated_at = excluded.updated_at`
    ).bind(
      m.id, m.accountId, m.courseId || null, m.scope, m.section, m.pass,
      m.text, m.exact, m.prefix || null, m.suffix || null,
      m.charOffset == null ? null : m.charOffset,
      m.note || null, m.replyTo || null, m.visibility || "private",
      m.createdAt || t, t
    ).run();
  }

  async deleteMark(markId) {
    await this.db.prepare(`DELETE FROM learn_marks WHERE id = ?`).bind(markId).run();
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

  /* ------------------------------------------------ Marking periods and record
     The school's official record: periods, the grades posted in them, the
     requests to change those, and attendance. Nothing here decides who may do
     what; that is guard.js. */

  async listPeriods(orgId) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_periods WHERE (? IS NULL OR org_id IS ? OR org_id = ?)
        ORDER BY starts_on`
    ).bind(orgId || null, orgId || null, orgId || null).all();
    return results || [];
  }

  async findPeriod(periodId) {
    return this.db.prepare(`SELECT * FROM learn_periods WHERE id = ?`).bind(periodId).first();
  }

  async createPeriod({ orgId, name, kind, startsOn, endsOn, passMark }) {
    const periodId = id("per");
    await this.db.prepare(
      `INSERT INTO learn_periods (id, org_id, name, kind, starts_on, ends_on, pass_mark, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(periodId, orgId || null, name, kind, startsOn, endsOn, passMark, now()).run();
    return this.findPeriod(periodId);
  }

  async setPeriodState(periodId, state, actorId) {
    const t = now();
    if (state === "posted") {
      await this.db.prepare(
        `UPDATE learn_periods SET state = ?, posted_at = ?, posted_by = ? WHERE id = ?`
      ).bind(state, t, actorId, periodId).run();
    } else if (state === "locked") {
      await this.db.prepare(
        `UPDATE learn_periods SET state = ?, locked_at = ?, locked_by = ? WHERE id = ?`
      ).bind(state, t, actorId, periodId).run();
    } else {
      await this.db.prepare(
        `UPDATE learn_periods SET state = ?, posted_at = NULL, posted_by = NULL WHERE id = ?`
      ).bind(state, periodId).run();
    }
    return this.findPeriod(periodId);
  }

  async listPosted({ periodId, courseId, accountId }) {
    const { results } = await this.db.prepare(
      `SELECT pg.*, c.title AS course_title, p.name AS period_name, p.pass_mark,
              pr.name AS student_name
         FROM learn_posted_grades pg
         JOIN learn_courses c ON c.id = pg.course_id
         JOIN learn_periods p ON p.id = pg.period_id
         LEFT JOIN profiles pr ON pr.account_id = pg.account_id
        WHERE (? IS NULL OR pg.period_id = ?)
          AND (? IS NULL OR pg.course_id = ?)
          AND (? IS NULL OR pg.account_id = ?)
        ORDER BY p.starts_on, c.title, pr.name`
    ).bind(periodId || null, periodId || null, courseId || null, courseId || null,
           accountId || null, accountId || null).all();
    return results || [];
  }

  async findPosted(postedId) {
    return this.db.prepare(
      `SELECT pg.*, p.state AS period_state, p.pass_mark FROM learn_posted_grades pg
         JOIN learn_periods p ON p.id = pg.period_id WHERE pg.id = ?`
    ).bind(postedId).first();
  }

  /* Posting again while a period is still in grading replaces the earlier
     snapshot; once posted, the route refuses before it gets here. */
  async upsertPosted({ periodId, courseId, accountId, percent, letter, passing, parts, actorId }) {
    await this.db.prepare(
      `INSERT INTO learn_posted_grades
         (id, period_id, course_id, account_id, percent, letter, passing, parts_json, posted_by, posted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (period_id, course_id, account_id) DO UPDATE SET
         percent = excluded.percent, letter = excluded.letter, passing = excluded.passing,
         parts_json = excluded.parts_json, posted_by = excluded.posted_by, posted_at = excluded.posted_at`
    ).bind(id("pgr"), periodId, courseId, accountId, percent ?? null, letter ?? null,
           passing ?? null, parts ? JSON.stringify(parts) : null, actorId || null, now()).run();
  }

  async createGradeChange({ postedId, fromPercent, toPercent, reason, actorId }) {
    const changeId = id("gch");
    await this.db.prepare(
      `INSERT INTO learn_grade_changes
         (id, posted_id, from_percent, to_percent, reason, requested_by, requested_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(changeId, postedId, fromPercent ?? null, toPercent, reason, actorId, now()).run();
    return this.findGradeChange(changeId);
  }

  async findGradeChange(changeId) {
    return this.db.prepare(
      `SELECT gc.*, pg.course_id, pg.account_id, pg.period_id, p.state AS period_state,
              p.pass_mark, c.title AS course_title, sp.name AS student_name,
              rp.name AS requested_by_name, dp.name AS decided_by_name
         FROM learn_grade_changes gc
         JOIN learn_posted_grades pg ON pg.id = gc.posted_id
         JOIN learn_periods p ON p.id = pg.period_id
         JOIN learn_courses c ON c.id = pg.course_id
         LEFT JOIN profiles sp ON sp.account_id = pg.account_id
         LEFT JOIN profiles rp ON rp.account_id = gc.requested_by
         LEFT JOIN profiles dp ON dp.account_id = gc.decided_by
        WHERE gc.id = ?`
    ).bind(changeId).first();
  }

  async listGradeChanges({ status, requestedBy }) {
    const { results } = await this.db.prepare(
      `SELECT gc.id FROM learn_grade_changes gc
        WHERE (? IS NULL OR gc.status = ?) AND (? IS NULL OR gc.requested_by = ?)
        ORDER BY gc.requested_at DESC LIMIT 200`
    ).bind(status || null, status || null, requestedBy || null, requestedBy || null).all();
    const out = [];
    for (const r of results || []) out.push(await this.findGradeChange(r.id));
    return out;
  }

  /* Approving rewrites the posted grade; the request row keeps what it was
     and who decided, which is the record of why the number moved. */
  async decideGradeChange({ changeId, approve, note, actorId, letter, passing }) {
    const change = await this.findGradeChange(changeId);
    const t = now();
    const stmts = [this.db.prepare(
      `UPDATE learn_grade_changes SET status = ?, decided_by = ?, decided_at = ?, decision_note = ?
        WHERE id = ? AND status = 'pending'`
    ).bind(approve ? "approved" : "denied", actorId, t, note || null, changeId)];
    if (approve) {
      stmts.push(this.db.prepare(
        `UPDATE learn_posted_grades SET percent = ?, letter = ?, passing = ? WHERE id = ?`
      ).bind(change.to_percent, letter, passing, change.posted_id));
    }
    await this.db.batch(stmts);
    return this.findGradeChange(changeId);
  }

  /* One mark, and the line of history that goes with it. A mark that is
     saved again unchanged writes nothing, so "who marked this" stays the
     person who did. `via` says by which route it moved. */
  async upsertAttendance({ accountId, courseId, day, status, note, reason, actorId, via, afterLock, why }) {
    const existing = courseId
      ? await this.db.prepare(`SELECT id, status, note, reason FROM learn_attendance WHERE account_id = ? AND day = ? AND course_id = ?`)
          .bind(accountId, day, courseId).first()
      : await this.db.prepare(`SELECT id, status, note, reason FROM learn_attendance WHERE account_id = ? AND day = ? AND course_id IS NULL`)
          .bind(accountId, day).first();
    const t = now(), n = note ?? null, rs = reason ?? null;
    if (existing && existing.status === status && (existing.note ?? null) === n && (existing.reason ?? null) === rs) return existing.id;
    // Every change is a row of history: what it was, what it became, who, how, and whether it was made after the span was locked.
    const log = this.db.prepare(
      `INSERT INTO learn_attendance_log (id, account_id, course_id, day, from_status, to_status, from_note, to_note, from_reason, to_reason, via, by_id, at, after_lock, why)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id("attlog"), accountId, courseId || null, day, existing ? existing.status : null, status,
           existing ? existing.note ?? null : null, n, existing ? existing.reason ?? null : null, rs, via || "register", actorId || null, t, afterLock ? 1 : 0, why || null);
    if (existing) {
      await this.db.batch([
        this.db.prepare(`UPDATE learn_attendance SET status = ?, note = ?, reason = ?, marked_by = ?, marked_at = ? WHERE id = ?`)
          .bind(status, n, rs, actorId || null, t, existing.id),
        log
      ]);
      return existing.id;
    }
    const attId = id("att");
    await this.db.batch([
      this.db.prepare(
        `INSERT INTO learn_attendance (id, account_id, course_id, day, status, note, reason, marked_by, marked_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(attId, accountId, courseId || null, day, status, n, rs, actorId || null, t),
      log
    ]);
    return attId;
  }

  /* ----------------------------------------------------------- The register
     Whole-day marks (no course), by section, and the locks the school put on
     spans it has reported. */

  async wholeDayMarks(day, accountIds) {
    const out = [];
    for (let i = 0; i < accountIds.length; i += 80) {
      const part = accountIds.slice(i, i + 80);
      const { results } = await this.db.prepare(
        `SELECT a.*, p.name AS marked_by_name FROM learn_attendance a LEFT JOIN profiles p ON p.account_id = a.marked_by
          WHERE a.course_id IS NULL AND a.day = ? AND a.account_id IN (${part.map(() => "?").join(",")})`
      ).bind(day, ...part).all();
      out.push(...(results || []));
    }
    return out;
  }

  /* How many children of each section have a whole-day mark on a day. */
  async registerTaken(orgId, day) {
    const { results } = await this.db.prepare(
      `SELECT s.class_id, COUNT(*) AS marked, MAX(a.marked_at) AS at
         FROM learn_attendance a JOIN learn_student_india s ON s.account_id = a.account_id AND s.org_id = ? AND s.class_id IS NOT NULL
        WHERE a.course_id IS NULL AND a.day = ? GROUP BY s.class_id`
    ).bind(orgId, day).all();
    return results || [];
  }

  /* Per child and status, the whole-day marks of a span. One section, or every section. */
  async watchCounts(orgId, from, to, classId) {
    const { results } = await this.db.prepare(
      `SELECT a.account_id, a.status, COUNT(*) AS n
         FROM learn_attendance a JOIN learn_student_india s ON s.account_id = a.account_id AND s.org_id = ? AND s.class_id IS NOT NULL
        WHERE a.course_id IS NULL AND a.day >= ? AND a.day <= ? AND (? IS NULL OR s.class_id = ?)
        GROUP BY a.account_id, a.status`
    ).bind(orgId, from, to, classId || null, classId || null).all();
    return results || [];
  }

  async listAttendanceLocks(orgId) {
    const { results } = await this.db.prepare(
      `SELECT l.*, p.name AS locked_by_name FROM learn_attendance_locks l LEFT JOIN profiles p ON p.account_id = l.locked_by
        WHERE l.org_id = ? ORDER BY l.from_day DESC`
    ).bind(orgId).all();
    return results || [];
  }

  async addAttendanceLock(orgId, { from, to, label }, actorId) {
    const lid = id("lock");
    await this.db.prepare(`INSERT INTO learn_attendance_locks (id, org_id, from_day, to_day, label, locked_by, locked_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(lid, orgId, from, to, label, actorId || null, now()).run();
    return lid;
  }

  /* Marks changed inside a locked span: who, what it was, what it became, and what they said. */
  async editsAfterLock(orgId, limit) {
    const { results } = await this.db.prepare(
      `SELECT l.*, sp.name AS student_name, bp.name AS by_name
         FROM learn_attendance_log l JOIN organization_memberships m ON m.account_id = l.account_id AND m.org_id = ?
         LEFT JOIN profiles sp ON sp.account_id = l.account_id LEFT JOIN profiles bp ON bp.account_id = l.by_id
        WHERE l.after_lock = 1 ORDER BY l.at DESC LIMIT ?`
    ).bind(orgId, limit || 100).all();
    return results || [];
  }

  /* Takes marks away, each as a line in the history. Returns how many went.
     Marks of another school's courses are not this school's to remove. */
  async removeAttendance(ids, actorId, orgId, opts = {}) {
    const rows = [];
    for (const attId of ids) {
      const row = await this.db.prepare(
        `SELECT a.* FROM learn_attendance a LEFT JOIN learn_courses c ON c.id = a.course_id
          WHERE a.id = ? AND (? IS NULL OR c.org_id IS NULL OR c.org_id = ?)`
      ).bind(attId, orgId || null, orgId || null).first();
      if (row) rows.push(row);
    }
    // Marks in a locked span go only with a reason, and the history says they were removed after the lock.
    const lockedRow = (r) => !!(opts.locked && opts.locked(r.day));
    if (!opts.why && rows.some(lockedRow)) return { removed: 0, needWhy: true };
    for (const row of rows) {
      const lk = lockedRow(row);
      await this.db.batch([
        this.db.prepare(`DELETE FROM learn_attendance WHERE id = ?`).bind(row.id),
        this.db.prepare(
          `INSERT INTO learn_attendance_log (id, account_id, course_id, day, from_status, to_status, from_note, to_note, from_reason, via, by_id, at, after_lock, why)
           VALUES (?, ?, ?, ?, ?, NULL, ?, NULL, ?, 'remove', ?, ?, ?, ?)`
        ).bind(id("attlog"), row.account_id, row.course_id, row.day, row.status, row.note ?? null, row.reason ?? null, actorId || null, now(), lk ? 1 : 0, lk ? opts.why : null)
      ]);
    }
    return { removed: rows.length, needWhy: false };
  }

  async listAttendance({ courseId, accountId, day, from, to }) {
    const { results } = await this.db.prepare(
      `SELECT at.*, pr.name AS student_name, c.title AS course_title FROM learn_attendance at
         LEFT JOIN profiles pr ON pr.account_id = at.account_id
         LEFT JOIN learn_courses c ON c.id = at.course_id
        WHERE (? IS NULL OR at.course_id = ?) AND (? IS NULL OR at.account_id = ?)
          AND (? IS NULL OR at.day = ?) AND (? IS NULL OR at.day >= ?) AND (? IS NULL OR at.day <= ?)
        ORDER BY at.day DESC, pr.name LIMIT 5000`
    ).bind(courseId || null, courseId || null, accountId || null, accountId || null,
           day || null, day || null, from || null, from || null, to || null, to || null).all();
    return results || [];
  }

  /* The school-wide count by status for a span of days, and the students
     with the most absences, for a dean or principal's first look. */
  async attendanceSummary({ from, to, awayKeys, lateKeys }) {
    const { results: byStatus } = await this.db.prepare(
      `SELECT status, COUNT(*) AS n FROM learn_attendance
        WHERE day >= ? AND day <= ? GROUP BY status`
    ).bind(from, to).all();
    const { results: top } = await this.db.prepare(
      `SELECT at.account_id, pr.name AS student_name,
              SUM(CASE WHEN at.status IN (${awayKeys.map(() => "?").join(",") || "''"}) THEN 1 ELSE 0 END) AS absences,
              SUM(CASE WHEN at.status IN (${lateKeys.map(() => "?").join(",") || "''"}) THEN 1 ELSE 0 END) AS lates,
              COUNT(*) AS days
         FROM learn_attendance at LEFT JOIN profiles pr ON pr.account_id = at.account_id
        WHERE at.day >= ? AND at.day <= ?
        GROUP BY at.account_id ORDER BY absences DESC, lates DESC LIMIT 25`
    ).bind(...awayKeys, ...lateKeys, from, to).all();
    return { byStatus: byStatus || [], top: top || [] };
  }

  /* How the registers stood over a span of days: one line per course and
     day that has any mark, who last wrote it and when. A course-day with no
     line is a register nobody took. */
  async attendanceCoverage({ orgId, from, to }) {
    const { results } = await this.db.prepare(
      `SELECT a.course_id, a.day, a.status, COUNT(*) AS n,
              MAX(a.marked_at) AS at, a.marked_by AS by_id, p.name AS by_name
         FROM learn_attendance a
         JOIN learn_courses c ON c.id = a.course_id
         LEFT JOIN profiles p ON p.account_id = a.marked_by
        WHERE a.day >= ? AND a.day <= ? AND (? IS NULL OR c.org_id = ?)
        GROUP BY a.course_id, a.day, a.status`
    ).bind(from, to, orgId || null, orgId || null).all();
    return results || [];
  }

  /* Marks that look wrong, three ways. Each list is capped, because a
     school with a bad import should see the first two hundred, not wait for
     all of them. `noSchool` is a list of days (weekends and closures). */
  async attendanceProblems({ orgId, from, to, today, noSchool, awayKeys, hereKeys }) {
    const cols = `a.id, a.account_id, p.name AS student_name, a.course_id, c.title AS course_title, a.day, a.status, a.note`;
    const base = `FROM learn_attendance a
         JOIN learn_courses c ON c.id = a.course_id
         LEFT JOIN profiles p ON p.account_id = a.account_id
        WHERE a.day >= ? AND a.day <= ? AND (? IS NULL OR c.org_id = ?)`;
    const args = [from, to, orgId || null, orgId || null];
    const notEnrolled = await this.db.prepare(
      `SELECT ${cols} ${base}
          AND NOT EXISTS (SELECT 1 FROM learn_course_memberships m
                           WHERE m.course_id = a.course_id AND m.account_id = a.account_id AND m.role = 'student')
        ORDER BY a.day DESC LIMIT 200`
    ).bind(...args).all();
    const days = (noSchool || []).slice(0, 120);
    const dayMarks = days.length || today
      ? await this.db.prepare(
          `SELECT ${cols} ${base}
              AND (a.day IN (${days.map(() => "?").join(",") || "''"}) OR (? IS NOT NULL AND a.day > ?))
            ORDER BY a.day DESC LIMIT 200`
        ).bind(...args, ...days, today || null, today || null).all()
      : { results: [] };
    // Absent from one course and in the room for another, the same day.
    const disagree = await this.db.prepare(
      `SELECT x.account_id, p.name AS student_name, x.day, x.course_id AS absent_course_id, cx.title AS absent_course_title,
              y.course_id AS here_course_id, cy.title AS here_course_title, y.status AS here_status
         FROM learn_attendance x
         JOIN learn_attendance y ON y.account_id = x.account_id AND y.day = x.day AND y.course_id <> x.course_id
         JOIN learn_courses cx ON cx.id = x.course_id
         JOIN learn_courses cy ON cy.id = y.course_id
         LEFT JOIN profiles p ON p.account_id = x.account_id
        WHERE x.day >= ? AND x.day <= ? AND (? IS NULL OR cx.org_id = ?)
          AND x.status IN (${awayKeys.map(() => "?").join(",") || "''"})
          AND y.status IN (${hereKeys.map(() => "?").join(",") || "''"})
        GROUP BY x.account_id, x.day
        ORDER BY x.day DESC LIMIT 200`
    ).bind(...args, ...awayKeys, ...hereKeys).all();
    return { notEnrolled: notEnrolled.results || [], dayMarks: dayMarks.results || [], disagree: disagree.results || [] };
  }

  /* The history: one date for everybody, or one student for every date. */
  async attendanceLog({ orgId, day, accountId, courseId, limit }) {
    const { results } = await this.db.prepare(
      `SELECT l.*, ps.name AS student_name, pb.name AS by_name, c.title AS course_title
         FROM learn_attendance_log l
         LEFT JOIN profiles ps ON ps.account_id = l.account_id
         LEFT JOIN profiles pb ON pb.account_id = l.by_id
         LEFT JOIN learn_courses c ON c.id = l.course_id
        WHERE (? IS NULL OR l.day = ?) AND (? IS NULL OR l.account_id = ?) AND (? IS NULL OR l.course_id = ?)
          AND (? IS NULL OR c.org_id IS NULL OR c.org_id = ?)
        ORDER BY l.at DESC LIMIT ?`
    ).bind(day || null, day || null, accountId || null, accountId || null, courseId || null, courseId || null,
           orgId || null, orgId || null, limit || 500).all();
    return results || [];
  }

  async getAttendanceSettings(orgId) {
    if (!orgId) return null;
    return this.db.prepare(`SELECT * FROM learn_attendance_settings WHERE org_id = ?`).bind(orgId).first();
  }

  async putAttendanceSettings(orgId, body, actorId) {
    await this.db.prepare(
      `INSERT INTO learn_attendance_settings (org_id, body_json, updated_by, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (org_id) DO UPDATE SET body_json = excluded.body_json,
         updated_by = excluded.updated_by, updated_at = excluded.updated_at`
    ).bind(orgId, JSON.stringify(body), actorId || null, now()).run();
    return this.getAttendanceSettings(orgId);
  }

  /* --------------------------------------------------------------- Schedule
     Courses, sections, bell schedules and the calendar. A section is a row of
     learn_courses; what is kept here is what the schedule adds to it. */

  async listSubjects(orgId) {
    const { results } = await this.db.prepare(
      `SELECT s.*, (SELECT COUNT(*) FROM learn_sections x WHERE x.subject_id = s.id) AS sections
         FROM learn_subjects s WHERE (? IS NULL OR s.org_id = ?) ORDER BY s.retired, s.position IS NULL, s.position, s.title`
    ).bind(orgId || null, orgId || null).all();
    return results || [];
  }

  async findSubject(subjectId) {
    return this.db.prepare(`SELECT * FROM learn_subjects WHERE id = ?`).bind(subjectId).first();
  }

  async findSubjectByNumber(orgId, number) {
    return this.db.prepare(`SELECT * FROM learn_subjects WHERE org_id = ? AND number = ?`).bind(orgId, number).first();
  }

  async createSubject(d) {
    const sid = id("sub"), t = now();
    await this.db.prepare(
      `INSERT INTO learn_subjects
         (id, org_id, number, title, catalog_code, extracurricular, show_online, count_attendance, on_report_cards,
          on_transcripts, college_credit, requestable, standards, duration, credits, max_credits, gpa, position,
          grad_req, grades_json, gender, capacity, approval, description, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(sid, d.orgId, d.number, d.title, d.catalogCode ?? null, d.extracurricular ? 1 : 0, d.showOnline === false ? 0 : 1,
           d.countAttendance === false ? 0 : 1, d.onReportCards === false ? 0 : 1, d.onTranscripts === false ? 0 : 1,
           d.collegeCredit === false ? 0 : 1, d.requestable ? 1 : 0, d.standards ?? null, d.duration || "year",
           d.credits ?? 0, d.maxCredits ?? null, d.gpa || "regular", d.position ?? null, d.gradReq ?? null,
           d.grades ? JSON.stringify(d.grades) : null, d.gender ?? null, d.capacity ?? null, d.approval ? 1 : 0,
           d.description ?? null, d.createdBy || null, t, t).run();
    return this.findSubject(sid);
  }

  async updateSubject(subjectId, patch) {
    const map = { number: "number", title: "title", catalogCode: "catalog_code", extracurricular: "extracurricular",
      showOnline: "show_online", countAttendance: "count_attendance", onReportCards: "on_report_cards",
      onTranscripts: "on_transcripts", collegeCredit: "college_credit", requestable: "requestable", standards: "standards",
      duration: "duration", credits: "credits", maxCredits: "max_credits", gpa: "gpa", position: "position",
      gradReq: "grad_req", gender: "gender", capacity: "capacity", approval: "approval", description: "description",
      retired: "retired" };
    const fields = [], values = [];
    for (const [k, col] of Object.entries(map)) {
      if (patch[k] === undefined) continue;
      const v = patch[k];
      fields.push(`${col} = ?`);
      values.push(typeof v === "boolean" ? (v ? 1 : 0) : v);
    }
    if (patch.grades !== undefined) { fields.push("grades_json = ?"); values.push(patch.grades ? JSON.stringify(patch.grades) : null); }
    if (!fields.length) return this.findSubject(subjectId);
    values.push(now(), subjectId);
    await this.db.prepare(`UPDATE learn_subjects SET ${fields.join(", ")}, updated_at = ? WHERE id = ?`).bind(...values).run();
    return this.findSubject(subjectId);
  }

  /* Every section of a school: the course row, its schedule facts, who
     teaches it and how many students are in it. Two aggregate reads, not one
     per section. */
  async listSections(orgId) {
    const { results: courses } = await this.db.prepare(
      `SELECT c.id, c.code, c.title, c.subject AS area, c.status, c.body_json,
              sc.subject_id, sc.section_no, sc.tab, sc.room, sc.capacity, sc.periods_json,
              sb.number AS subject_number, sb.title AS subject_title, sb.capacity AS subject_capacity, sb.duration, sb.credits
         FROM learn_courses c
         LEFT JOIN learn_sections sc ON sc.course_id = c.id
         LEFT JOIN learn_subjects sb ON sb.id = sc.subject_id
        WHERE (? IS NULL OR c.org_id = ?) ORDER BY c.title`
    ).bind(orgId || null, orgId || null).all();
    const { results: people } = await this.db.prepare(
      `SELECT cm.course_id, cm.role, cm.account_id, p.name
         FROM learn_course_memberships cm
         JOIN learn_courses c ON c.id = cm.course_id
         LEFT JOIN profiles p ON p.account_id = cm.account_id
        WHERE (? IS NULL OR c.org_id = ?) AND cm.role IN ('teacher', 'assistant')
        ORDER BY cm.created_at`
    ).bind(orgId || null, orgId || null).all();
    const { results: counts } = await this.db.prepare(
      `SELECT cm.course_id, COUNT(*) AS n FROM learn_course_memberships cm
         JOIN learn_courses c ON c.id = cm.course_id
        WHERE (? IS NULL OR c.org_id = ?) AND cm.role = 'student' GROUP BY cm.course_id`
    ).bind(orgId || null, orgId || null).all();
    return { courses: courses || [], people: people || [], counts: counts || [] };
  }

  /* ------------------------------------------------------------ Drafts */

  async listDrafts(orgId) {
    const { results } = await this.db.prepare(
      `SELECT d.*, (SELECT COUNT(*) FROM learn_draft_sections s WHERE s.draft_id = d.id) AS sections
         FROM learn_schedule_drafts d WHERE d.org_id = ? ORDER BY d.published_at IS NOT NULL, d.created_at DESC`
    ).bind(orgId).all();
    return results || [];
  }
  async findDraft(draftId) { return this.db.prepare(`SELECT * FROM learn_schedule_drafts WHERE id = ?`).bind(draftId).first(); }
  async createDraft(orgId, name, kind, withRosters, actorId) {
    const did = id("drf");
    await this.db.prepare(
      `INSERT INTO learn_schedule_drafts (id, org_id, name, kind, with_rosters, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(did, orgId, name, kind, withRosters ? 1 : 0, actorId || null, now()).run();
    return did;
  }
  async deleteDraft(draftId) { await this.db.prepare(`DELETE FROM learn_schedule_drafts WHERE id = ?`).bind(draftId).run(); }
  async markDraftPublished(draftId) { await this.db.prepare(`UPDATE learn_schedule_drafts SET published_at = ? WHERE id = ?`).bind(now(), draftId).run(); }
  async listDraftSections(draftId) {
    const { results } = await this.db.prepare(
      `SELECT s.*, sb.number AS subject_number, sb.title AS subject_title, sb.capacity AS subject_capacity
         FROM learn_draft_sections s LEFT JOIN learn_subjects sb ON sb.id = s.subject_id
        WHERE s.draft_id = ? ORDER BY s.position, s.title, s.section_no`
    ).bind(draftId).all();
    return results || [];
  }
  async findDraftSection(sid) { return this.db.prepare(`SELECT * FROM learn_draft_sections WHERE id = ?`).bind(sid).first(); }
  async insertDraftSection(draftId, d) {
    const sid = id("dsec");
    await this.db.prepare(
      `INSERT INTO learn_draft_sections (id, draft_id, source_course_id, subject_id, title, code, area, section_no, tab, room, capacity,
          periods_json, teachers_json, students_json, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(sid, draftId, d.sourceCourseId || null, d.subjectId || null, d.title, d.code || null, d.area || null, d.sectionNo || null, d.tab || null,
           d.room || null, d.capacity ?? null, JSON.stringify(d.periods || []), JSON.stringify(d.teachers || []), JSON.stringify(d.students || []), d.position || 0).run();
    return sid;
  }
  async updateDraftSection(sid, d) {
    await this.db.prepare(
      `UPDATE learn_draft_sections SET subject_id = ?, title = ?, section_no = ?, tab = ?, room = ?, capacity = ?,
          periods_json = ?, teachers_json = ?, students_json = ? WHERE id = ?`
    ).bind(d.subjectId || null, d.title, d.sectionNo || null, d.tab || null, d.room || null, d.capacity ?? null,
           JSON.stringify(d.periods || []), JSON.stringify(d.teachers || []), JSON.stringify(d.students || []), sid).run();
  }
  async deleteDraftSection(sid) { await this.db.prepare(`DELETE FROM learn_draft_sections WHERE id = ?`).bind(sid).run(); }

  /* Every student's seat in every section of a school, with when they joined. */
  async listStudentMemberships(orgId) {
    const { results } = await this.db.prepare(
      `SELECT cm.account_id, cm.course_id, cm.created_at AS joined
         FROM learn_course_memberships cm JOIN learn_courses c ON c.id = cm.course_id
        WHERE cm.role = 'student' AND (? IS NULL OR c.org_id = ?) AND c.status <> 'archived'`
    ).bind(orgId || null, orgId || null).all();
    return results || [];
  }
  /* The marks a rate is made from; over the cap the caller asks for less. */
  async listAdaMarks({ orgId, from, to, limit }) {
    const { results } = await this.db.prepare(
      `SELECT a.account_id, a.course_id, a.day, a.status FROM learn_attendance a JOIN learn_courses c ON c.id = a.course_id
        WHERE a.day >= ? AND a.day <= ? AND (? IS NULL OR c.org_id = ?) LIMIT ?`
    ).bind(from, to, orgId || null, orgId || null, limit).all();
    return results || [];
  }

  /* ----------------------------------------------------- Course requests */

  async listRequests({ orgId, accountId, subjectId }) {
    const { results } = await this.db.prepare(
      `SELECT r.*, s.number, s.title, p.name AS student_name FROM learn_course_requests r
         JOIN learn_subjects s ON s.id = r.subject_id LEFT JOIN profiles p ON p.account_id = r.account_id
        WHERE r.org_id = ? AND (? IS NULL OR r.account_id = ?) AND (? IS NULL OR r.subject_id = ?)
        ORDER BY r.account_id, r.rank, s.title`
    ).bind(orgId, accountId || null, accountId || null, subjectId || null, subjectId || null).all();
    return results || [];
  }
  async setRequests(orgId, accountId, list, actorId) {
    const stmts = [this.db.prepare(`DELETE FROM learn_course_requests WHERE org_id = ? AND account_id = ?`).bind(orgId, accountId)];
    for (const r of list) {
      stmts.push(this.db.prepare(
        `INSERT INTO learn_course_requests (id, org_id, account_id, subject_id, rank, set_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(id("req"), orgId, accountId, r.subjectId, r.rank, actorId || null, now()));
    }
    await this.db.batch(stmts);
  }

  /* Just which periods each section meets in, for the registers. */
  async listSectionPeriods(orgId) {
    const { results } = await this.db.prepare(
      `SELECT sc.course_id, sc.periods_json FROM learn_sections sc JOIN learn_courses c ON c.id = sc.course_id
        WHERE (? IS NULL OR c.org_id = ?)`
    ).bind(orgId || null, orgId || null).all();
    return results || [];
  }

  async upsertSection(courseId, info, actorId) {
    await this.db.prepare(
      `INSERT INTO learn_sections (course_id, subject_id, section_no, tab, room, capacity, periods_json, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (course_id) DO UPDATE SET subject_id = excluded.subject_id, section_no = excluded.section_no,
         tab = excluded.tab, room = excluded.room, capacity = excluded.capacity, periods_json = excluded.periods_json,
         updated_by = excluded.updated_by, updated_at = excluded.updated_at`
    ).bind(courseId, info.subjectId ?? null, info.sectionNo ?? null, info.tab ?? null, info.room ?? null,
           info.capacity ?? null, JSON.stringify(info.periods || []), actorId || null, now()).run();
  }

  async findSection(courseId) {
    return this.db.prepare(`SELECT * FROM learn_sections WHERE course_id = ?`).bind(courseId).first();
  }

  async listBellSchedules(orgId) {
    const { results: schedules } = await this.db.prepare(
      `SELECT * FROM learn_bell_schedules WHERE (? IS NULL OR org_id = ?) ORDER BY position, name`
    ).bind(orgId || null, orgId || null).all();
    const { results: periods } = await this.db.prepare(
      `SELECT bp.* FROM learn_bell_periods bp JOIN learn_bell_schedules bs ON bs.id = bp.schedule_id
        WHERE (? IS NULL OR bs.org_id = ?) ORDER BY bp.schedule_id, bp.position`
    ).bind(orgId || null, orgId || null).all();
    return { schedules: schedules || [], periods: periods || [] };
  }

  async findBellSchedule(scheduleId) {
    return this.db.prepare(`SELECT * FROM learn_bell_schedules WHERE id = ?`).bind(scheduleId).first();
  }

  async createBellSchedule(orgId, name, minimumDay, periods) {
    const bid = id("bell");
    const last = await this.db.prepare(`SELECT COALESCE(MAX(position), -1) AS p FROM learn_bell_schedules WHERE org_id = ?`).bind(orgId).first();
    const stmts = [this.db.prepare(
      `INSERT INTO learn_bell_schedules (id, org_id, name, minimum_day, position, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(bid, orgId, name, minimumDay ? 1 : 0, (last ? last.p : -1) + 1, now())];
    periods.forEach((p, i) => stmts.push(this.db.prepare(
      `INSERT INTO learn_bell_periods (id, schedule_id, label, starts_at, ends_at, kind, position) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id("bp"), bid, p.label, p.startsAt || null, p.endsAt || null, p.kind || "class", i)));
    await this.db.batch(stmts);
    return bid;
  }

  async updateBellSchedule(scheduleId, patch) {
    const stmts = [];
    if (patch.name !== undefined || patch.minimumDay !== undefined) {
      stmts.push(this.db.prepare(
        `UPDATE learn_bell_schedules SET name = COALESCE(?, name), minimum_day = COALESCE(?, minimum_day) WHERE id = ?`
      ).bind(patch.name ?? null, patch.minimumDay === undefined ? null : patch.minimumDay ? 1 : 0, scheduleId));
    }
    if (patch.periods) {
      stmts.push(this.db.prepare(`DELETE FROM learn_bell_periods WHERE schedule_id = ?`).bind(scheduleId));
      patch.periods.forEach((p, i) => stmts.push(this.db.prepare(
        `INSERT INTO learn_bell_periods (id, schedule_id, label, starts_at, ends_at, kind, position) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(id("bp"), scheduleId, p.label, p.startsAt || null, p.endsAt || null, p.kind || "class", i)));
    }
    if (stmts.length) await this.db.batch(stmts);
  }

  async deleteBellSchedule(scheduleId) {
    await this.db.prepare(`DELETE FROM learn_bell_schedules WHERE id = ?`).bind(scheduleId).run();
  }

  async bellScheduleInUse(orgId, scheduleId) {
    const day = await this.db.prepare(`SELECT 1 AS x FROM learn_school_days WHERE org_id = ? AND schedule_id = ? LIMIT 1`).bind(orgId, scheduleId).first();
    return !!day;
  }

  async getCalendar(orgId) {
    return this.db.prepare(`SELECT * FROM learn_calendar WHERE org_id = ?`).bind(orgId).first();
  }

  async putCalendar(orgId, pattern, yearStart, yearEnd, actorId) {
    await this.db.prepare(
      `INSERT INTO learn_calendar (org_id, pattern_json, year_start, year_end, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (org_id) DO UPDATE SET pattern_json = excluded.pattern_json, year_start = excluded.year_start,
         year_end = excluded.year_end, updated_by = excluded.updated_by, updated_at = excluded.updated_at`
    ).bind(orgId, JSON.stringify(pattern), yearStart ?? null, yearEnd ?? null, actorId || null, now()).run();
  }

  async listSchoolDays(orgId, from, to) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_school_days WHERE org_id = ? AND day >= ? AND day <= ? ORDER BY day`
    ).bind(orgId, from, to).all();
    return results || [];
  }

  async setSchoolDays(orgId, days) {
    const stmts = [];
    for (const d of days) {
      if (d.kind === "clear") stmts.push(this.db.prepare(`DELETE FROM learn_school_days WHERE org_id = ? AND day = ?`).bind(orgId, d.day));
      else stmts.push(this.db.prepare(
        `INSERT INTO learn_school_days (org_id, day, kind, schedule_id, label) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (org_id, day) DO UPDATE SET kind = excluded.kind, schedule_id = excluded.schedule_id, label = excluded.label`
      ).bind(orgId, d.day, d.kind, d.scheduleId || null, d.label || null));
    }
    // D1 takes a batch of at most a hundred statements at a time.
    for (let i = 0; i < stmts.length; i += 90) await this.db.batch(stmts.slice(i, i + 90));
  }

  /* ----------------------------------------------------------- Enrollment
     Applications, their documents and history, and the enrollments made from
     them. The rules that act on these rows are in services/enrollment.js;
     this block only reads and writes them. */

  async getEnrollmentSettings(orgId) {
    return this.db.prepare(
      `SELECT * FROM learn_enrollment_settings WHERE org_id = ?`
    ).bind(orgId).first();
  }

  async putEnrollmentSettings(orgId, body, actorId) {
    await this.db.prepare(
      `INSERT INTO learn_enrollment_settings (org_id, body_json, updated_by, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (org_id) DO UPDATE SET
         body_json = excluded.body_json, updated_by = excluded.updated_by,
         updated_at = excluded.updated_at`
    ).bind(orgId, JSON.stringify(body), actorId || null, now()).run();
    return this.getEnrollmentSettings(orgId);
  }

  /* The next admission number, taken atomically. The row is made if it is
     not there, so the first school to admit somebody needs no setup. */
  async takeAdmissionNumber(orgId) {
    await this.db.prepare(
      `INSERT OR IGNORE INTO learn_enrollment_settings (org_id, body_json, admission_next, updated_at)
       VALUES (?, '{}', 1, ?)`
    ).bind(orgId, now()).run();
    const row = await this.db.prepare(
      `UPDATE learn_enrollment_settings SET admission_next = admission_next + 1
        WHERE org_id = ? RETURNING admission_next - 1 AS n`
    ).bind(orgId).first();
    return row.n;
  }

  async findApplication(applicationId) {
    return this.db.prepare(`SELECT * FROM learn_applications WHERE id = ?`).bind(applicationId).first();
  }

  async findApplicationByKey(createdBy, clientKey) {
    return this.db.prepare(
      `SELECT * FROM learn_applications WHERE created_by = ? AND client_key = ?`
    ).bind(createdBy, clientKey).first();
  }

  /* The sequence number is taken in the same statement that inserts, so two
     applications made at once cannot be given the same one. */
  async createApplication(a) {
    const applicationId = id("app");
    const t = now();
    await this.db.prepare(
      `INSERT INTO learn_applications
         (id, org_id, seq, student_id, school_year, entry_grade, enrollment_type, status,
          legal_first, legal_last, preferred_name, dob, body_json, review_json,
          assigned_to, due_on, intended_start, acceptance, source, client_key,
          created_by, created_at, updated_at)
       SELECT ?, ?, COALESCE(MAX(seq), 0) + 1, ?, ?, ?, ?, 'draft',
              ?, ?, ?, ?, ?, '{}', ?, ?, ?, 'not_required', ?, ?, ?, ?, ?
         FROM learn_applications WHERE org_id IS ?`
    ).bind(applicationId, a.orgId || null, a.studentId || null, a.schoolYear, a.grade, a.type,
           a.legalFirst || null, a.legalLast || null, a.preferredName || null, a.dob || null,
           JSON.stringify(a.form || {}), a.assignedTo || null, a.dueOn || null, a.intendedStart || null,
           a.source || "staff", a.clientKey || null, a.createdBy || null, t, t, a.orgId || null).run();
    return this.findApplication(applicationId);
  }

  /* `patch` keys are the domain's names; only the ones given are written.
     With `ifUpdatedAt` the write happens only if nobody changed the row since
     it was read — the caller learns that by `null`. */
  async updateApplication(applicationId, patch, { ifUpdatedAt } = {}) {
    const map = {
      studentId: "student_id", schoolYear: "school_year", grade: "entry_grade", type: "enrollment_type",
      status: "status", legalFirst: "legal_first", legalLast: "legal_last", preferredName: "preferred_name",
      dob: "dob", admissionNo: "admission_no", assignedTo: "assigned_to", dueOn: "due_on",
      intendedStart: "intended_start", decision: "decision", decisionReason: "decision_reason",
      decisionNote: "decision_note", decidedBy: "decided_by", decidedAt: "decided_at",
      offerUntil: "offer_until", acceptance: "acceptance", acceptedAt: "accepted_at",
      waitlistedAt: "waitlisted_at", enrollmentId: "enrollment_id", submittedAt: "submitted_at",
      closedAt: "closed_at"
    };
    const fields = [], values = [];
    for (const [k, col] of Object.entries(map)) {
      if (patch[k] !== undefined) { fields.push(`${col} = ?`); values.push(patch[k]); }
    }
    if (patch.form !== undefined) { fields.push("body_json = ?"); values.push(JSON.stringify(patch.form)); }
    if (patch.review !== undefined) { fields.push("review_json = ?"); values.push(JSON.stringify(patch.review)); }
    const t = now();
    fields.push("updated_at = ?");
    values.push(t, applicationId);
    let where = "id = ?";
    if (ifUpdatedAt != null) { where += " AND updated_at = ?"; values.push(ifUpdatedAt); }
    const res = await this.db.prepare(
      `UPDATE learn_applications SET ${fields.join(", ")} WHERE ${where}`
    ).bind(...values).run();
    if (ifUpdatedAt != null && !(res.meta && res.meta.changes > 0)) return null;
    return this.findApplication(applicationId);
  }

  /* Every application for a school year, or for all years. Filtering, sorting
     and paging happen above: the computed things a queue shows (how complete,
     what is blocking) depend on the school's settings, which SQL cannot see. */
  async listApplications({ orgId, year = null } = {}) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_applications
        WHERE (org_id IS ? OR org_id = ?) AND (? IS NULL OR school_year = ?)
        ORDER BY updated_at DESC`
    ).bind(orgId || null, orgId || null, year, year).all();
    return results || [];
  }

  async listApplicationsOf(accountId) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_applications
        WHERE created_by = ? OR student_id = ?
        ORDER BY updated_at DESC`
    ).bind(accountId, accountId).all();
    return results || [];
  }

  /* The accounts the school already knows as students, with a date of birth
     when the contact card has one — what a new application is checked
     against. */
  async listStudentIdentities(orgId) {
    const { results } = await this.db.prepare(
      `SELECT a.id, a.email, p.name, p.first_name, c.date_of_birth AS dob
         FROM accounts a
         JOIN account_roles r ON r.account_id = a.id AND r.product = 'learn' AND r.role = 'student'
              AND (r.org_id IS NULL OR r.org_id = ?)
         LEFT JOIN profiles p ON p.account_id = a.id
         LEFT JOIN account_contacts c ON c.account_id = a.id
        GROUP BY a.id
        ORDER BY p.name`
    ).bind(orgId || null).all();
    return results || [];
  }

  /* Students whose guardian has one of these email addresses — who a new
     applicant's brothers and sisters already at the school are. */
  async wardsOfGuardianEmails(emails) {
    if (!emails.length) return [];
    const marks = emails.map(() => "?").join(",");
    const { results } = await this.db.prepare(
      `SELECT s.id AS student_id, sp.name AS student_name, g.email_lower AS guardian_email
         FROM learn_guardians lg
         JOIN accounts g ON g.id = lg.guardian_id
         JOIN accounts s ON s.id = lg.student_id
         LEFT JOIN profiles sp ON sp.account_id = s.id
        WHERE g.email_lower IN (${marks})`
    ).bind(...emails).all();
    return results || [];
  }

  async listDocuments(applicationId) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_application_documents WHERE application_id = ? ORDER BY rowid`
    ).bind(applicationId).all();
    return results || [];
  }

  async listDocumentsFor(applicationIds) {
    if (!applicationIds.length) return [];
    const out = [];
    // D1 allows 100 bound parameters a statement.
    for (let i = 0; i < applicationIds.length; i += 90) {
      const chunk = applicationIds.slice(i, i + 90);
      const { results } = await this.db.prepare(
        `SELECT * FROM learn_application_documents
          WHERE application_id IN (${chunk.map(() => "?").join(",")}) ORDER BY rowid`
      ).bind(...chunk).all();
      out.push(...(results || []));
    }
    return out;
  }

  /* Brings an application's checklist in line with what its grade and type
     require. A document that already has a status keeps it: a requirement
     that was dropped later does not erase work already done. */
  async syncDocuments(applicationId, defs) {
    const t = now();
    const existing = new Map((await this.listDocuments(applicationId)).map((d) => [d.key, d]));
    const statements = [];
    for (const d of defs) {
      const have = existing.get(d.key);
      if (!have) {
        statements.push(this.db.prepare(
          `INSERT INTO learn_application_documents
             (application_id, key, label, required, sensitive, status, updated_at)
           VALUES (?, ?, ?, ?, ?, 'missing', ?)`
        ).bind(applicationId, d.key, d.label, d.required ? 1 : 0, d.sensitive ? 1 : 0, t));
      } else {
        statements.push(this.db.prepare(
          `UPDATE learn_application_documents SET label = ?, required = ?, sensitive = ?
            WHERE application_id = ? AND key = ?`
        ).bind(d.label, d.required ? 1 : 0, d.sensitive ? 1 : 0, applicationId, d.key));
      }
    }
    // A checklist row nobody touched, for a document no longer asked for, goes.
    const keep = new Set(defs.map((d) => d.key));
    for (const [key, d] of existing) {
      if (!keep.has(key) && d.status === "missing" && !d.file_id) {
        statements.push(this.db.prepare(
          `DELETE FROM learn_application_documents WHERE application_id = ? AND key = ?`
        ).bind(applicationId, key));
      }
    }
    if (statements.length) await this.db.batch(statements);
    return this.listDocuments(applicationId);
  }

  async updateDocument(applicationId, key, patch) {
    const map = { status: "status", note: "note", fileId: "file_id", fileName: "file_name",
                  fileType: "file_type", fileSize: "file_size", receivedAt: "received_at",
                  reviewedBy: "reviewed_by", reviewedAt: "reviewed_at" };
    const fields = [], values = [];
    for (const [k, col] of Object.entries(map)) {
      if (patch[k] !== undefined) { fields.push(`${col} = ?`); values.push(patch[k]); }
    }
    fields.push("updated_at = ?");
    values.push(now(), applicationId, key);
    await this.db.prepare(
      `UPDATE learn_application_documents SET ${fields.join(", ")}
        WHERE application_id = ? AND key = ?`
    ).bind(...values).run();
    return this.db.prepare(
      `SELECT * FROM learn_application_documents WHERE application_id = ? AND key = ?`
    ).bind(applicationId, key).first();
  }

  async putApplicationFile({ applicationId, key, name, type, size, data, actorId }) {
    const fileId = id("file");
    await this.db.prepare(
      `INSERT INTO learn_application_files
         (id, application_id, doc_key, name, type, size, data, uploaded_by, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(fileId, applicationId, key, name, type, size, data, actorId || null, now()).run();
    return fileId;
  }

  async getApplicationFile(fileId) {
    return this.db.prepare(`SELECT * FROM learn_application_files WHERE id = ?`).bind(fileId).first();
  }

  /* A replaced scan is removed: what the registrar looked at is the document
     on the checklist, and an old file nobody can see is only a liability. */
  async deleteApplicationFiles(applicationId, key, exceptId) {
    await this.db.prepare(
      `DELETE FROM learn_application_files
        WHERE application_id = ? AND doc_key = ? AND id IS NOT ?`
    ).bind(applicationId, key, exceptId || null).run();
  }

  async addApplicationEvent(applicationId, e) {
    await this.db.prepare(
      `INSERT INTO learn_application_events
         (id, application_id, at, actor_id, actor_name, kind, from_value, to_value, field, note, internal, meta_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id("evt"), applicationId, now(), e.actorId || null, e.actorName || null, e.kind,
           e.from == null ? null : String(e.from), e.to == null ? null : String(e.to),
           e.field || null, e.note || null, e.internal === false ? 0 : 1,
           e.meta ? JSON.stringify(e.meta) : null).run();
  }

  async listApplicationEvents(applicationId) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_application_events WHERE application_id = ? ORDER BY at DESC, rowid DESC`
    ).bind(applicationId).all();
    return results || [];
  }

  async findEnrollment(enrollmentId) {
    return this.db.prepare(`SELECT * FROM learn_enrollments WHERE id = ?`).bind(enrollmentId).first();
  }

  async findLiveEnrollment(studentId, year) {
    return this.db.prepare(
      `SELECT * FROM learn_enrollments
        WHERE student_id = ? AND school_year = ? AND state IN ('enrolled', 'suspended')`
    ).bind(studentId, year).first();
  }

  async listEnrollments({ orgId, year = null, studentId = null } = {}) {
    const { results } = await this.db.prepare(
      `SELECT e.*, p.name AS student_name, p.first_name, p.initials, p.avatar_hue, a.email AS student_email
         FROM learn_enrollments e
         JOIN accounts a ON a.id = e.student_id
         LEFT JOIN profiles p ON p.account_id = e.student_id
        WHERE (e.org_id IS ? OR e.org_id = ?) AND (? IS NULL OR e.school_year = ?)
          AND (? IS NULL OR e.student_id = ?)
        ORDER BY e.starts_on DESC, p.name`
    ).bind(orgId || null, orgId || null, year, year, studentId, studentId).all();
    return results || [];
  }

  async updateEnrollment(enrollmentId, patch) {
    const map = { state: "state", startsOn: "starts_on", endsOn: "ends_on", exitReason: "exit_reason",
                  exitNote: "exit_note", syncState: "sync_state", grade: "grade" };
    const fields = [], values = [];
    for (const [k, col] of Object.entries(map)) {
      if (patch[k] !== undefined) { fields.push(`${col} = ?`); values.push(patch[k]); }
    }
    if (patch.placements !== undefined) { fields.push("placements_json = ?"); values.push(JSON.stringify(patch.placements)); }
    if (patch.sync !== undefined) { fields.push("sync_json = ?"); values.push(JSON.stringify(patch.sync)); }
    fields.push("updated_at = ?");
    values.push(now(), enrollmentId);
    await this.db.prepare(
      `UPDATE learn_enrollments SET ${fields.join(", ")} WHERE id = ?`
    ).bind(...values).run();
    return this.findEnrollment(enrollmentId);
  }

  /* Seats taken in each grade for a school year: students enrolled or
     suspended, plus applications admitted but not yet enrolled. The unique
     index and this count are what stop a grade being over-promised. */
  async seatUsage(orgId, year) {
    const { results } = await this.db.prepare(
      `SELECT grade, COUNT(*) AS n FROM (
         SELECT grade FROM learn_enrollments
          WHERE (org_id IS ? OR org_id = ?) AND school_year = ? AND state IN ('enrolled', 'suspended')
         UNION ALL
         SELECT entry_grade AS grade FROM learn_applications
          WHERE (org_id IS ? OR org_id = ?) AND school_year = ? AND status = 'admitted' AND enrollment_id IS NULL
       ) GROUP BY grade`
    ).bind(orgId || null, orgId || null, year, orgId || null, orgId || null, year).all();
    const out = {};
    for (const r of results || []) out[r.grade] = r.n;
    return out;
  }

  /* Activation, as one transaction: the enrollment exists and the
     application points at it, or neither happened. What is set up around it
     afterwards is separate and retryable, so a class that cannot be joined
     today never undoes a student that was admitted. */
  async createEnrollmentFrom(application, e, event) {
    const enrollmentId = id("enrl");
    const t = now();
    await this.db.batch([
      this.db.prepare(
        `INSERT INTO learn_enrollments
           (id, org_id, student_id, application_id, school_year, grade, enrollment_type, state,
            starts_on, previous_school, admission_no, placements_json, sync_json, sync_state,
            created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'enrolled', ?, ?, ?, '[]', '[]', 'pending', ?, ?, ?)`
      ).bind(enrollmentId, application.org_id || null, e.studentId, application.id, application.school_year,
             e.grade, application.enrollment_type, e.startsOn, e.previousSchool || null,
             e.admissionNo || null, e.createdBy || null, t, t),
      this.db.prepare(
        `UPDATE learn_applications
            SET enrollment_id = ?, student_id = ?, closed_at = ?, updated_at = ?
          WHERE id = ? AND enrollment_id IS NULL`
      ).bind(enrollmentId, e.studentId, t, t, application.id),
      this.db.prepare(
        `INSERT INTO learn_application_events
           (id, application_id, at, actor_id, actor_name, kind, from_value, to_value, field, note, internal, meta_json)
         VALUES (?, ?, ?, ?, ?, 'enrollment', NULL, ?, NULL, ?, 0, ?)`
      ).bind(id("evt"), application.id, t, event.actorId || null, event.actorName || null, "enrolled",
             event.note || null, JSON.stringify({ enrollmentId, startsOn: e.startsOn, grade: e.grade }))
    ]);
    return this.findEnrollment(enrollmentId);
  }

  /* The people who work on enrollment: administrators, registrars and
     admissions reviewers of this organization — who an application can be
     assigned to. */
  async listEnrollmentTeam(orgId) {
    const { results } = await this.db.prepare(
      `SELECT a.id, a.email, p.name, p.title, GROUP_CONCAT(DISTINCT r.role) AS roles
         FROM account_roles r
         JOIN accounts a ON a.id = r.account_id
         LEFT JOIN profiles p ON p.account_id = a.id
        WHERE a.status != 'suspended'
          AND ((r.product = 'learn' AND r.role IN ('admin', 'registrar', 'admissions'))
               OR (r.product = 'platform' AND r.role = 'admin'))
          AND (r.org_id IS NULL OR r.org_id = ?)
        GROUP BY a.id
        ORDER BY p.name`
    ).bind(orgId || null).all();
    return results || [];
  }

  /* Display names for a handful of accounts — who assigned, who verified. */
  async namesFor(accountIds) {
    const ids = [...new Set(accountIds.filter(Boolean))];
    if (!ids.length) return {};
    const { results } = await this.db.prepare(
      `SELECT account_id, name FROM profiles WHERE account_id IN (${ids.map(() => "?").join(",")})`
    ).bind(...ids).all();
    const out = {};
    for (const r of results || []) out[r.account_id] = r.name;
    return out;
  }

  /* Enrollments that were set up ahead of their start date and whose course
     placement has been waiting for it. */
  async listEnrollmentsDue(orgId, day, limit = 25) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_enrollments
        WHERE (org_id IS ? OR org_id = ?) AND state = 'enrolled'
          AND placements_json LIKE '%"status":"scheduled"%' AND starts_on <= ?
        ORDER BY starts_on LIMIT ?`
    ).bind(orgId || null, orgId || null, day, limit).all();
    return results || [];
  }

  async admissionNoOf(accountId) {
    const row = await this.db.prepare(
      `SELECT admission_no FROM learn_enrollments
        WHERE student_id = ? AND admission_no IS NOT NULL ORDER BY created_at LIMIT 1`
    ).bind(accountId).first();
    return row ? row.admission_no : null;
  }

  /* ------------------------------------------------- Conduct and health
     Two ledgers the office keeps and the school rules over. The rules —
     who may read an entry, what a family is shown — are in guard.js and the
     routes; this block reads and writes rows. */

  async createConduct(c) {
    const cid = id("cnd");
    const t = now();
    await this.db.prepare(
      `INSERT INTO learn_conduct
         (id, org_id, student_id, kind, category, severity, title, details, occurred_on, location,
          course_id, people, action_taken, follow_up_on, status, family_sees, reported_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)`
    ).bind(cid, c.orgId || null, c.studentId, c.kind, c.category || null, c.severity || null, c.title, c.details || null,
           c.occurredOn, c.location || null, c.courseId || null, c.people || null, c.actionTaken || null,
           c.followUpOn || null, c.familySees ? 1 : 0, c.reportedBy || null, t, t).run();
    return this.findConduct(cid);
  }

  async findConduct(conductId) {
    return this.db.prepare(
      `SELECT c.*, sp.name AS student_name, rp.name AS reporter_name, cr.title AS course_title
         FROM learn_conduct c
         LEFT JOIN profiles sp ON sp.account_id = c.student_id
         LEFT JOIN profiles rp ON rp.account_id = c.reported_by
         LEFT JOIN learn_courses cr ON cr.id = c.course_id
        WHERE c.id = ?`
    ).bind(conductId).first();
  }

  async updateConduct(conductId, patch) {
    const map = { category: "category", severity: "severity", title: "title", details: "details", occurredOn: "occurred_on",
                  location: "location", courseId: "course_id", people: "people", actionTaken: "action_taken",
                  followUpOn: "follow_up_on", status: "status", familySees: "family_sees", resolvedBy: "resolved_by",
                  resolvedAt: "resolved_at" };
    const fields = [], values = [];
    for (const [k, col] of Object.entries(map)) {
      if (patch[k] !== undefined) { fields.push(`${col} = ?`); values.push(typeof patch[k] === "boolean" ? (patch[k] ? 1 : 0) : patch[k]); }
    }
    fields.push("updated_at = ?");
    values.push(now(), conductId);
    await this.db.prepare(`UPDATE learn_conduct SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
    return this.findConduct(conductId);
  }

  async listConduct({ orgId, studentId, kind, status, from, to, reportedBy, familyOnly, limit = 500 } = {}) {
    const { results } = await this.db.prepare(
      `SELECT c.*, sp.name AS student_name, rp.name AS reporter_name, cr.title AS course_title
         FROM learn_conduct c
         LEFT JOIN profiles sp ON sp.account_id = c.student_id
         LEFT JOIN profiles rp ON rp.account_id = c.reported_by
         LEFT JOIN learn_courses cr ON cr.id = c.course_id
        WHERE (? IS NULL OR c.org_id = ? OR c.org_id IS NULL)
          AND (? IS NULL OR c.student_id = ?) AND (? IS NULL OR c.kind = ?) AND (? IS NULL OR c.status = ?)
          AND (? IS NULL OR c.occurred_on >= ?) AND (? IS NULL OR c.occurred_on <= ?)
          AND (? IS NULL OR c.reported_by = ?) AND (? = 0 OR c.family_sees = 1)
        ORDER BY c.occurred_on DESC, c.created_at DESC LIMIT ?`
    ).bind(orgId || null, orgId || null, studentId || null, studentId || null, kind || null, kind || null,
           status || null, status || null, from || null, from || null, to || null, to || null,
           reportedBy || null, reportedBy || null, familyOnly ? 1 : 0, limit).all();
    return results || [];
  }

  async addConductEvent(conductId, e) {
    await this.db.prepare(
      `INSERT INTO learn_conduct_events (id, conduct_id, at, actor_id, actor_name, kind, note) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id("cev"), conductId, now(), e.actorId || null, e.actorName || null, e.kind, e.note || null).run();
  }

  async listConductEvents(conductId) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_conduct_events WHERE conduct_id = ? ORDER BY at DESC, rowid DESC`
    ).bind(conductId).all();
    return results || [];
  }

  async createHealth(h) {
    const hid = id("hlt");
    const t = now();
    await this.db.prepare(
      `INSERT INTO learn_health
         (id, org_id, student_id, kind, title, detail, severity, on_date, due_on, status, flag, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`
    ).bind(hid, h.orgId || null, h.studentId, h.kind, h.title, h.detail || null, h.severity || null, h.onDate || null,
           h.dueOn || null, h.flag || null, h.createdBy || null, t, t).run();
    return this.findHealth(hid);
  }

  async findHealth(healthId) {
    return this.db.prepare(
      `SELECT h.*, sp.name AS student_name FROM learn_health h
         LEFT JOIN profiles sp ON sp.account_id = h.student_id WHERE h.id = ?`
    ).bind(healthId).first();
  }

  async updateHealth(healthId, patch) {
    const map = { title: "title", detail: "detail", severity: "severity", onDate: "on_date", dueOn: "due_on",
                  status: "status", flag: "flag" };
    const fields = [], values = [];
    for (const [k, col] of Object.entries(map)) {
      if (patch[k] !== undefined) { fields.push(`${col} = ?`); values.push(patch[k]); }
    }
    fields.push("updated_at = ?");
    values.push(now(), healthId);
    await this.db.prepare(`UPDATE learn_health SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
    return this.findHealth(healthId);
  }

  async listHealth({ orgId, studentId, kind, status, studentIds, limit = 2000 } = {}) {
    let where = `(? IS NULL OR h.org_id = ? OR h.org_id IS NULL) AND (? IS NULL OR h.student_id = ?)
                 AND (? IS NULL OR h.kind = ?) AND (? IS NULL OR h.status = ?)`;
    const binds = [orgId || null, orgId || null, studentId || null, studentId || null, kind || null, kind || null, status || null, status || null];
    if (studentIds && studentIds.length) {
      where += ` AND h.student_id IN (${studentIds.map(() => "?").join(",")})`;
      binds.push(...studentIds);
    }
    const { results } = await this.db.prepare(
      `SELECT h.*, sp.name AS student_name FROM learn_health h
         LEFT JOIN profiles sp ON sp.account_id = h.student_id
        WHERE ${where} ORDER BY sp.name, h.kind, h.on_date DESC LIMIT ?`
    ).bind(...binds, limit).all();
    return results || [];
  }

  async addHealthEvent(healthId, e) {
    await this.db.prepare(
      `INSERT INTO learn_health_events (id, health_id, at, actor_id, actor_name, kind, note) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id("hev"), healthId, now(), e.actorId || null, e.actorName || null, e.kind, e.note || null).run();
  }

  async listHealthEvents(healthId) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_health_events WHERE health_id = ? ORDER BY at DESC, rowid DESC`
    ).bind(healthId).all();
    return results || [];
  }

  /* ------------------------------------------------------------ Facilities
     Rooms, the things in them, what has to be done, who may use them when.
     The rules — who may do what, when an order is due, whether a room is free —
     are in guard.js and services/facilities.js; this block reads and writes
     rows. */

  async _patchRow(table, map, patch, rowId) {
    const fields = [], values = [];
    for (const [k, col] of Object.entries(map)) {
      if (patch[k] === undefined) continue;
      const v = patch[k];
      fields.push(`${col} = ?`);
      values.push(typeof v === "boolean" ? (v ? 1 : 0) : (v !== null && typeof v === "object" ? JSON.stringify(v) : v));
    }
    fields.push("updated_at = ?");
    values.push(now(), rowId);
    await this.db.prepare(`UPDATE ${table} SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  }

  /* Who can be given work: the facilities team, the office, IT, the principal
     and administrators. */
  async listFacilityTeam(orgId) {
    const { results } = await this.db.prepare(
      `SELECT a.id, a.email, p.name, p.title, GROUP_CONCAT(DISTINCT r.role) AS roles
         FROM account_roles r
         JOIN accounts a ON a.id = r.account_id
         LEFT JOIN profiles p ON p.account_id = a.id
        WHERE a.status != 'suspended'
          AND ((r.product = 'learn' AND r.role IN ('admin', 'facilities', 'office', 'it', 'principal'))
               OR (r.product = 'platform' AND r.role = 'admin'))
          AND (r.org_id IS NULL OR r.org_id = ?)
        GROUP BY a.id
        ORDER BY p.name`
    ).bind(orgId || null).all();
    return results || [];
  }

  /* ---- spaces */

  async listSpaces(orgId) {
    const { results } = await this.db.prepare(
      `SELECT s.*, ap.name AS approver_name,
              (SELECT COUNT(*) FROM learn_assets a WHERE a.space_id = s.id AND a.status != 'retired') AS asset_count,
              (SELECT COUNT(*) FROM learn_work_orders o WHERE o.space_id = s.id
                  AND o.status IN ('pending', 'open', 'in_progress', 'on_hold')) AS open_count
         FROM learn_spaces s
         LEFT JOIN profiles ap ON ap.account_id = s.approver_id
        WHERE s.org_id IS ? AND s.archived = 0
        ORDER BY s.name`
    ).bind(orgId || null).all();
    return results || [];
  }

  async findSpace(spaceId) {
    return this.db.prepare(
      `SELECT s.*, ap.name AS approver_name FROM learn_spaces s
         LEFT JOIN profiles ap ON ap.account_id = s.approver_id WHERE s.id = ?`
    ).bind(spaceId).first();
  }

  _spaceInsert(s) {
    const t = now();
    return this.db.prepare(
      `INSERT INTO learn_spaces (id, org_id, parent_id, kind, name, code, capacity, bookable, rules_json, approver_id, notes, archived, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    ).bind(s.id, s.orgId || null, s.parentId || null, s.kind, s.name, s.code || null, s.capacity ?? null,
           s.bookable ? 1 : 0, s.rules ? JSON.stringify(s.rules) : null, s.approverId || null, s.notes || null, t, t);
  }

  async createSpaces(list) {
    const rows = list.map((s) => ({ ...s, id: id("spc") }));
    await this.db.batch(rows.map((s) => this._spaceInsert(s)));
    return rows.map((s) => s.id);
  }

  async updateSpace(spaceId, patch) {
    await this._patchRow("learn_spaces", { parentId: "parent_id", kind: "kind", name: "name", code: "code", capacity: "capacity",
      bookable: "bookable", rules: "rules_json", approverId: "approver_id", notes: "notes", archived: "archived" }, patch, spaceId);
    return this.findSpace(spaceId);
  }

  /* ---- assets */

  async createAsset(a) {
    const aid = id("ast");
    const t = now();
    await this.db.prepare(
      `INSERT INTO learn_assets
         (id, org_id, seq, space_id, name, kind, code, serial, custodian_id, custodian_label, status, condition,
          installed_on, warranty_end, life_years, notes, created_at, updated_at)
       SELECT ?, ?, COALESCE(MAX(seq), 0) + 1, ?, ?, ?,
              COALESCE(?, 'AST-' || printf('%04d', COALESCE(MAX(seq), 0) + 1)),
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
         FROM learn_assets WHERE org_id IS ?`
    ).bind(aid, a.orgId || null, a.spaceId || null, a.name, a.kind || null, a.code || null, a.serial || null,
           a.custodianId || null, a.custodianLabel || null, a.status || "in_service", a.condition || null,
           a.installedOn || null, a.warrantyEnd || null, a.lifeYears ?? null, a.notes || null, t, t, a.orgId || null).run();
    return this.findAsset(aid);
  }

  async findAsset(assetId) {
    return this.db.prepare(
      `SELECT a.*, sp.name AS space_name, cp.name AS custodian_name FROM learn_assets a
         LEFT JOIN learn_spaces sp ON sp.id = a.space_id
         LEFT JOIN profiles cp ON cp.account_id = a.custodian_id WHERE a.id = ?`
    ).bind(assetId).first();
  }

  async updateAsset(assetId, patch) {
    await this._patchRow("learn_assets", { spaceId: "space_id", name: "name", kind: "kind", code: "code", serial: "serial",
      custodianId: "custodian_id", custodianLabel: "custodian_label", status: "status", condition: "condition",
      installedOn: "installed_on", warrantyEnd: "warranty_end", lifeYears: "life_years", lastSeenOn: "last_seen_on", notes: "notes" }, patch, assetId);
    return this.findAsset(assetId);
  }

  async listAssets({ orgId, spaceId, status, custodianId, limit = 2000 } = {}) {
    const { results } = await this.db.prepare(
      `SELECT a.*, sp.name AS space_name, cp.name AS custodian_name FROM learn_assets a
         LEFT JOIN learn_spaces sp ON sp.id = a.space_id
         LEFT JOIN profiles cp ON cp.account_id = a.custodian_id
        WHERE a.org_id IS ? AND (? IS NULL OR a.space_id = ?) AND (? IS NULL OR a.status = ?)
          AND (? IS NULL OR a.custodian_id = ?)
        ORDER BY a.name LIMIT ?`
    ).bind(orgId || null, spaceId || null, spaceId || null, status || null, status || null,
           custodianId || null, custodianId || null, limit).all();
    return results || [];
  }

  async assetsByCodes(orgId, codes) {
    const out = [];
    for (let i = 0; i < codes.length; i += 80) {
      const part = codes.slice(i, i + 80);
      const { results } = await this.db.prepare(
        `SELECT a.*, sp.name AS space_name FROM learn_assets a LEFT JOIN learn_spaces sp ON sp.id = a.space_id
          WHERE a.org_id IS ? AND a.code IN (${part.map(() => "?").join(",")})`
      ).bind(orgId || null, ...part).all();
      out.push(...(results || []));
    }
    return out;
  }

  /* ---- work orders */

  _orderInsert(o, verb = "INSERT") {
    const t = now();
    return this.db.prepare(
      `${verb} INTO learn_work_orders
         (id, org_id, seq, kind, title, details, category, priority, status, space_id, asset_id, vendor_id, schedule_id,
          requested_by, assignee_id, due_on, due_key, checklist_json, client_key, created_at, updated_at)
       SELECT ?, ?, COALESCE(MAX(seq), 0) + 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
         FROM learn_work_orders WHERE org_id IS ?`
    ).bind(o.id, o.orgId || null, o.kind, o.title, o.details || null, o.category, o.priority, o.status,
           o.spaceId || null, o.assetId || null, o.vendorId || null, o.scheduleId || null, o.requestedBy || null,
           o.assigneeId || null, o.dueOn || null, o.dueKey || null,
           o.checklist && o.checklist.length ? JSON.stringify(o.checklist) : null, o.clientKey || null, t, t, o.orgId || null);
  }

  async createOrder(o) {
    const oid = id("wo");
    await this._orderInsert({ ...o, id: oid }).run();
    return this.findOrder(oid);
  }

  /* An order a schedule answers. The (schedule, due date) pair is unique, so a
     second sync cannot make a second order; the schedule moves on once the
     order exists, whichever sync made it. */
  async generateOrder(o, schedulePatch) {
    const oid = id("wo");
    const r = await this._orderInsert({ ...o, id: oid }, "INSERT OR IGNORE").run();
    let made = !!(r.meta && r.meta.changes);
    if (!made) {
      const have = await this.db.prepare(`SELECT id FROM learn_work_orders WHERE schedule_id = ? AND due_key = ?`)
        .bind(o.scheduleId, o.dueKey).first();
      if (!have) return { made: false, moved: false };
    }
    await this.updateSchedule(o.scheduleId, schedulePatch);
    return { made, moved: true, id: made ? oid : null };
  }

  _orderSelect() {
    return `SELECT o.*, sp.name AS space_name, a.name AS asset_name, a.code AS asset_code, v.name AS vendor_name,
                   rq.name AS requester_name, asg.name AS assignee_name
              FROM learn_work_orders o
              LEFT JOIN learn_spaces sp ON sp.id = o.space_id
              LEFT JOIN learn_assets a ON a.id = o.asset_id
              LEFT JOIN learn_vendors v ON v.id = o.vendor_id
              LEFT JOIN profiles rq ON rq.account_id = o.requested_by
              LEFT JOIN profiles asg ON asg.account_id = o.assignee_id`;
  }

  async findOrder(orderId) {
    return this.db.prepare(`${this._orderSelect()} WHERE o.id = ?`).bind(orderId).first();
  }

  async findOrderByKey(orgId, clientKey) {
    return this.db.prepare(`${this._orderSelect()} WHERE o.org_id IS ? AND o.client_key = ?`).bind(orgId || null, clientKey).first();
  }

  async updateOrder(orderId, patch) {
    await this._patchRow("learn_work_orders", { kind: "kind", title: "title", details: "details", category: "category",
      priority: "priority", status: "status", spaceId: "space_id", assetId: "asset_id", vendorId: "vendor_id",
      assigneeId: "assignee_id", dueOn: "due_on", startedAt: "started_at", completedAt: "completed_at",
      completedBy: "completed_by", minutes: "minutes", checklist: "checklist_json", outcome: "outcome",
      declineReason: "decline_reason" }, patch, orderId);
    return this.findOrder(orderId);
  }

  async listOrders({ orgId, statuses, assigneeId, requestedBy, spaceId, assetId, vendorId, scheduleId, kind, overdueBefore, limit = 500 } = {}) {
    const where = ["o.org_id IS ?"], binds = [orgId || null];
    const eq = (col, v) => { if (v) { where.push(`${col} = ?`); binds.push(v); } };
    if (statuses && statuses.length) { where.push(`o.status IN (${statuses.map(() => "?").join(",")})`); binds.push(...statuses); }
    eq("o.assignee_id", assigneeId); eq("o.requested_by", requestedBy); eq("o.space_id", spaceId); eq("o.asset_id", assetId);
    eq("o.vendor_id", vendorId); eq("o.schedule_id", scheduleId); eq("o.kind", kind);
    if (overdueBefore) {
      where.push("o.due_on IS NOT NULL AND o.due_on < ? AND o.status IN ('pending','open','in_progress','on_hold')");
      binds.push(overdueBefore);
    }
    const { results } = await this.db.prepare(
      `${this._orderSelect()} WHERE ${where.join(" AND ")}
        ORDER BY CASE o.status WHEN 'pending' THEN 0 WHEN 'open' THEN 1 WHEN 'in_progress' THEN 1 WHEN 'on_hold' THEN 2 ELSE 3 END,
                 CASE o.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
                 COALESCE(o.due_on, '9999'), o.created_at DESC LIMIT ?`
    ).bind(...binds, limit).all();
    return results || [];
  }

  /* What is already open in a room, in a line each — enough to see that the
     problem was reported, not enough to read other people's requests. */
  async listOpenBrief(orgId, spaceId) {
    const { results } = await this.db.prepare(
      `SELECT id, seq, title, status, category, created_at FROM learn_work_orders
        WHERE org_id IS ? AND space_id = ? AND status IN ('pending', 'open', 'in_progress', 'on_hold')
        ORDER BY created_at DESC LIMIT 20`
    ).bind(orgId || null, spaceId).all();
    return results || [];
  }

  async openOrdersFor(scheduleId) {
    const row = await this.db.prepare(
      `SELECT COUNT(*) AS n FROM learn_work_orders WHERE schedule_id = ? AND status IN ('pending', 'open', 'in_progress', 'on_hold')`
    ).bind(scheduleId).first();
    return row ? row.n : 0;
  }

  async orderCounts(orgId, today, actorId) {
    const row = await this.db.prepare(
      `SELECT SUM(status = 'pending') AS pending, SUM(status = 'open') AS open,
              SUM(status = 'in_progress') AS in_progress, SUM(status = 'on_hold') AS on_hold,
              SUM(status IN ('pending','open','in_progress','on_hold') AND due_on IS NOT NULL AND due_on < ?) AS overdue,
              SUM(status IN ('open','in_progress','on_hold') AND assignee_id = ?) AS mine,
              SUM(status IN ('pending','open','in_progress','on_hold') AND assignee_id IS NULL AND status != 'pending') AS unassigned
         FROM learn_work_orders WHERE org_id IS ?`
    ).bind(today, actorId || "", orgId || null).first();
    return row || {};
  }

  async ordersForReport(orgId, sinceMs) {
    const { results } = await this.db.prepare(
      `SELECT o.id, o.kind, o.status, o.category, o.priority, o.due_on, o.created_at, o.completed_at, o.minutes, sp.name AS space_name
         FROM learn_work_orders o LEFT JOIN learn_spaces sp ON sp.id = o.space_id
        WHERE o.org_id IS ? AND (o.created_at >= ? OR o.completed_at >= ? OR o.status IN ('pending','open','in_progress','on_hold'))
        ORDER BY o.created_at DESC LIMIT 5000`
    ).bind(orgId || null, sinceMs, sinceMs).all();
    return results || [];
  }

  /* ---- schedules */

  async createSchedule(s) {
    const sid = id("sch");
    const t = now();
    await this.db.prepare(
      `INSERT INTO learn_schedules
         (id, org_id, kind, title, details, category, priority, space_id, asset_id, vendor_id, assignee_id, every, unit,
          starts_on, ends_on, lead_days, from_completion, skip_if_open, skip_breaks, checklist_json, authority, source,
          active, next_due_on, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`
    ).bind(sid, s.orgId || null, s.kind, s.title, s.details || null, s.category, s.priority, s.spaceId || null,
           s.assetId || null, s.vendorId || null, s.assigneeId || null, s.every, s.unit, s.startsOn, s.endsOn || null,
           s.leadDays || 0, s.fromCompletion ? 1 : 0, s.skipIfOpen === false ? 0 : 1, s.skipBreaks ? 1 : 0,
           s.checklist && s.checklist.length ? JSON.stringify(s.checklist) : null, s.authority || null, s.source || null,
           s.nextDueOn || null, s.createdBy || null, t, t).run();
    return this.findSchedule(sid);
  }

  _scheduleSelect() {
    return `SELECT s.*, sp.name AS space_name, a.name AS asset_name, v.name AS vendor_name, asg.name AS assignee_name
              FROM learn_schedules s
              LEFT JOIN learn_spaces sp ON sp.id = s.space_id
              LEFT JOIN learn_assets a ON a.id = s.asset_id
              LEFT JOIN learn_vendors v ON v.id = s.vendor_id
              LEFT JOIN profiles asg ON asg.account_id = s.assignee_id`;
  }

  async findSchedule(scheduleId) {
    return this.db.prepare(`${this._scheduleSelect()} WHERE s.id = ?`).bind(scheduleId).first();
  }

  async listSchedules(orgId) {
    const { results } = await this.db.prepare(
      `${this._scheduleSelect()} WHERE s.org_id IS ? ORDER BY s.active DESC, COALESCE(s.next_due_on, '9999'), s.title`
    ).bind(orgId || null).all();
    return results || [];
  }

  async updateSchedule(scheduleId, patch) {
    await this._patchRow("learn_schedules", { title: "title", details: "details", category: "category", priority: "priority",
      spaceId: "space_id", assetId: "asset_id", vendorId: "vendor_id", assigneeId: "assignee_id", every: "every", unit: "unit",
      startsOn: "starts_on", endsOn: "ends_on", leadDays: "lead_days", fromCompletion: "from_completion",
      skipIfOpen: "skip_if_open", skipBreaks: "skip_breaks", checklist: "checklist_json", authority: "authority",
      source: "source", active: "active", nextDueOn: "next_due_on", lastDoneOn: "last_done_on",
      lastGeneratedOn: "last_generated_on" }, patch, scheduleId);
    return this.findSchedule(scheduleId);
  }

  /* Schedules whose window has opened: the due date minus its lead days is
     today or earlier. */
  async listDueSchedules(orgId, today, limit = 50) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_schedules
        WHERE org_id IS ? AND active = 1 AND next_due_on IS NOT NULL
          AND date(next_due_on, '-' || lead_days || ' day') <= ?
        ORDER BY next_due_on LIMIT ?`
    ).bind(orgId || null, today, limit).all();
    return results || [];
  }

  /* ---- bookings */

  async createBookings(list) {
    const t = now();
    const rows = list.map((b) => ({ ...b, id: id("bk") }));
    await this.db.batch(rows.map((b) => this.db.prepare(
      `INSERT INTO learn_bookings (id, org_id, space_id, title, notes, attendees, day, starts, ends, status, series_id,
                                   booked_by, decided_by, decided_at, decision_note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(b.id, b.orgId || null, b.spaceId, b.title, b.notes || null, b.attendees ?? null, b.day, b.starts, b.ends,
           b.status, b.seriesId || null, b.bookedBy || null, b.decidedBy || null, b.decidedAt || null, b.decisionNote || null, t, t)));
    return rows.map((b) => b.id);
  }

  _bookingSelect() {
    return `SELECT b.*, sp.name AS space_name, sp.approver_id AS space_approver, bp.name AS booker_name, dp.name AS decider_name
              FROM learn_bookings b
              JOIN learn_spaces sp ON sp.id = b.space_id
              LEFT JOIN profiles bp ON bp.account_id = b.booked_by
              LEFT JOIN profiles dp ON dp.account_id = b.decided_by`;
  }

  async findBooking(bookingId) {
    return this.db.prepare(`${this._bookingSelect()} WHERE b.id = ?`).bind(bookingId).first();
  }

  async listBookings({ orgId, spaceId, from, to, bookedBy, statuses, seriesId, limit = 1000 } = {}) {
    const where = ["b.org_id IS ?"], binds = [orgId || null];
    const eq = (col, v) => { if (v) { where.push(`${col} = ?`); binds.push(v); } };
    eq("b.space_id", spaceId); eq("b.booked_by", bookedBy); eq("b.series_id", seriesId);
    if (from) { where.push("b.day >= ?"); binds.push(from); }
    if (to) { where.push("b.day <= ?"); binds.push(to); }
    if (statuses && statuses.length) { where.push(`b.status IN (${statuses.map(() => "?").join(",")})`); binds.push(...statuses); }
    const { results } = await this.db.prepare(
      `${this._bookingSelect()} WHERE ${where.join(" AND ")} ORDER BY b.day, b.starts LIMIT ?`
    ).bind(...binds, limit).all();
    return results || [];
  }

  async bookingsOnDays(spaceId, days) {
    if (!days.length) return [];
    const { results } = await this.db.prepare(
      `SELECT id, day, starts, ends, status, title, series_id FROM learn_bookings
        WHERE space_id = ? AND day IN (${days.map(() => "?").join(",")}) AND status IN ('pending', 'approved')`
    ).bind(spaceId, ...days).all();
    return results || [];
  }

  async decideBookings(ids, { status, decidedBy, note }) {
    const t = now();
    await this.db.batch(ids.map((bid) => this.db.prepare(
      `UPDATE learn_bookings SET status = ?, decided_by = ?, decided_at = ?, decision_note = ?, updated_at = ? WHERE id = ?`
    ).bind(status, decidedBy || null, t, note || null, t, bid)));
  }

  /* ---- vendors */

  async createVendor(v) {
    const vid = id("vnd");
    const t = now();
    await this.db.prepare(
      `INSERT INTO learn_vendors (id, org_id, name, trade, contact_name, phone, email, notes, contract_ends_on, requires_json, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    ).bind(vid, v.orgId || null, v.name, v.trade || null, v.contactName || null, v.phone || null, v.email || null,
           v.notes || null, v.contractEndsOn || null, JSON.stringify(v.requires || []), t, t).run();
    return this.findVendor(vid);
  }

  async findVendor(vendorId) {
    return this.db.prepare(`SELECT * FROM learn_vendors WHERE id = ?`).bind(vendorId).first();
  }

  async listVendors(orgId) {
    const { results } = await this.db.prepare(
      `SELECT v.*, (SELECT COUNT(*) FROM learn_work_orders o WHERE o.vendor_id = v.id
                      AND o.status IN ('pending','open','in_progress','on_hold')) AS open_count
         FROM learn_vendors v WHERE v.org_id IS ? ORDER BY v.active DESC, v.name`
    ).bind(orgId || null).all();
    return results || [];
  }

  async updateVendor(vendorId, patch) {
    await this._patchRow("learn_vendors", { name: "name", trade: "trade", contactName: "contact_name", phone: "phone",
      email: "email", notes: "notes", contractEndsOn: "contract_ends_on", requires: "requires_json", active: "active" }, patch, vendorId);
    return this.findVendor(vendorId);
  }

  /* ---- documents and files */

  async createFacilityDocument(d) {
    const did = id("fdoc");
    await this.db.prepare(
      `INSERT INTO learn_documents (id, org_id, owner_kind, owner_id, kind, title, issued_on, expires_on, url, file_id, note, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(did, d.orgId || null, d.ownerKind, d.ownerId || null, d.kind, d.title, d.issuedOn || null, d.expiresOn || null,
           d.url || null, d.fileId || null, d.note || null, d.createdBy || null, now()).run();
    return this.findFacilityDocument(did);
  }

  async findFacilityDocument(documentId) {
    return this.db.prepare(
      `SELECT d.*, f.name AS file_name, f.type AS file_type, f.size AS file_size FROM learn_documents d
         LEFT JOIN learn_facility_files f ON f.id = d.file_id WHERE d.id = ?`
    ).bind(documentId).first();
  }

  async listFacilityDocuments({ orgId, ownerKind, ownerId, includeArchived = false, limit = 2000 } = {}) {
    const { results } = await this.db.prepare(
      `SELECT d.*, f.name AS file_name, f.type AS file_type, f.size AS file_size FROM learn_documents d
         LEFT JOIN learn_facility_files f ON f.id = d.file_id
        WHERE d.org_id IS ? AND (? IS NULL OR d.owner_kind = ?) AND (? IS NULL OR d.owner_id = ?)
          AND (? = 1 OR d.archived_at IS NULL)
        ORDER BY COALESCE(d.expires_on, '9999'), d.title LIMIT ?`
    ).bind(orgId || null, ownerKind || null, ownerKind || null, ownerId || null, ownerId || null, includeArchived ? 1 : 0, limit).all();
    return results || [];
  }

  async updateFacilityDocument(documentId, patch) {
    const map = { kind: "kind", title: "title", issuedOn: "issued_on", expiresOn: "expires_on", url: "url", fileId: "file_id",
                  note: "note", archivedAt: "archived_at" };
    const fields = [], values = [];
    for (const [k, col] of Object.entries(map)) if (patch[k] !== undefined) { fields.push(`${col} = ?`); values.push(patch[k]); }
    if (fields.length) {
      values.push(documentId);
      await this.db.prepare(`UPDATE learn_documents SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
    }
    return this.findFacilityDocument(documentId);
  }

  async facilityDocumentCounts(orgId, today, soonDay) {
    const row = await this.db.prepare(
      `SELECT SUM(expires_on < ?) AS expired, SUM(expires_on >= ? AND expires_on <= ?) AS soon
         FROM learn_documents WHERE org_id IS ? AND archived_at IS NULL AND expires_on IS NOT NULL`
    ).bind(today, today, soonDay, orgId || null).first();
    return row || {};
  }

  async putFacilityFile({ orgId, ownerKind, ownerId, name, type, size, data, actorId }) {
    const fid = id("ffile");
    await this.db.prepare(
      `INSERT INTO learn_facility_files (id, org_id, owner_kind, owner_id, name, type, size, data, uploaded_by, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(fid, orgId || null, ownerKind, ownerId, name, type, size, data, actorId || null, now()).run();
    return fid;
  }

  async getFacilityFile(fileId) {
    return this.db.prepare(`SELECT * FROM learn_facility_files WHERE id = ?`).bind(fileId).first();
  }

  async listFacilityFiles(ownerKind, ownerId) {
    const { results } = await this.db.prepare(
      `SELECT id, name, type, size, uploaded_by, uploaded_at FROM learn_facility_files
        WHERE owner_kind = ? AND owner_id = ? ORDER BY uploaded_at`
    ).bind(ownerKind, ownerId).all();
    return results || [];
  }

  async deleteFacilityFile(fileId) {
    await this.db.prepare(`DELETE FROM learn_facility_files WHERE id = ?`).bind(fileId).run();
  }

  /* ---- history */

  async addFacilityEvent(orgId, ownerKind, ownerId, e) {
    await this.db.prepare(
      `INSERT INTO learn_facility_events (id, org_id, owner_kind, owner_id, at, actor_id, actor_name, kind, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id("fev"), orgId || null, ownerKind, ownerId, now(), e.actorId || null, e.actorName || null, e.kind, e.note || null).run();
  }

  async listFacilityEvents(ownerKind, ownerId) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_facility_events WHERE owner_kind = ? AND owner_id = ? ORDER BY at DESC, rowid DESC`
    ).bind(ownerKind, ownerId).all();
    return results || [];
  }

  /* ===================================================== Inbox and notices */

  /* A notice is one person's. `dedupe` makes a reminder once per person per key. */
  async insertNotice(n) {
    const nid = id("ntc");
    const r = await this.db.prepare(
      `INSERT OR IGNORE INTO learn_notices
         (id, org_id, account_id, thread_id, kind, from_id, title, body, link, dedupe, box, created_at, read_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(nid, n.orgId || null, n.accountId, n.threadId || nid, n.kind || "message", n.fromId || null, n.title, n.body || null,
            n.link || null, n.dedupe || null, n.box || "inbox", now(), n.read ? now() : null).run();
    return (r.meta && r.meta.changes) ? nid : null;
  }
  async listNotices({ accountId, box, archived, limit }) {
    const { results } = await this.db.prepare(
      `SELECT n.*, p.name AS from_name FROM learn_notices n
         LEFT JOIN profiles p ON p.account_id = n.from_id
        WHERE n.account_id = ? AND n.box = ? AND ((? = 1 AND n.archived_at IS NOT NULL) OR (? = 0 AND n.archived_at IS NULL))
        ORDER BY n.created_at DESC LIMIT ?`
    ).bind(accountId, box, archived ? 1 : 0, archived ? 1 : 0, limit || 100).all();
    return results || [];
  }
  async countUnread(accountId) {
    const r = await this.db.prepare(
      `SELECT COUNT(*) AS n FROM learn_notices WHERE account_id = ? AND box = 'inbox' AND read_at IS NULL AND archived_at IS NULL`
    ).bind(accountId).first();
    return r ? r.n : 0;
  }
  async markNotices(accountId, ids) {
    if (!ids) {
      await this.db.prepare(`UPDATE learn_notices SET read_at = ? WHERE account_id = ? AND read_at IS NULL`).bind(now(), accountId).run();
      return;
    }
    for (const nid of ids) await this.db.prepare(`UPDATE learn_notices SET read_at = COALESCE(read_at, ?) WHERE id = ? AND account_id = ?`).bind(now(), nid, accountId).run();
  }
  async archiveNotices(accountId, ids, on) {
    for (const nid of ids) await this.db.prepare(`UPDATE learn_notices SET archived_at = ? WHERE id = ? AND account_id = ?`).bind(on ? now() : null, nid, accountId).run();
  }
  async threadNotices(accountId, threadId) {
    const { results } = await this.db.prepare(
      `SELECT n.*, p.name AS from_name FROM learn_notices n LEFT JOIN profiles p ON p.account_id = n.from_id
        WHERE n.account_id = ? AND n.thread_id = ? ORDER BY n.created_at, n.rowid`
    ).bind(accountId, threadId).all();
    return results || [];
  }
  async threadMembers(threadId) {
    const { results } = await this.db.prepare(
      `SELECT DISTINCT account_id FROM learn_notices WHERE thread_id = ? AND kind = 'message'`
    ).bind(threadId).all();
    return (results || []).map((r) => r.account_id);
  }
  async noticePrefs(accountId) {
    const { results } = await this.db.prepare(`SELECT kind, in_app, email FROM learn_notice_prefs WHERE account_id = ?`).bind(accountId).all();
    return results || [];
  }
  async setNoticePref(accountId, kind, inApp, email) {
    await this.db.prepare(
      `INSERT INTO learn_notice_prefs (account_id, kind, in_app, email) VALUES (?, ?, ?, ?)
       ON CONFLICT(account_id, kind) DO UPDATE SET in_app = excluded.in_app, email = excluded.email`
    ).bind(accountId, kind, inApp ? 1 : 0, email ? 1 : 0).run();
  }
  async queueEmail(e) {
    await this.db.prepare(
      `INSERT INTO learn_outbox (id, org_id, to_email, account_id, subject, body, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id("eml"), e.orgId || null, e.to, e.accountId || null, e.subject, e.body || null, now()).run();
  }
  async listOutbox(orgId, status) {
    const { results } = await this.db.prepare(
      `SELECT * FROM learn_outbox WHERE (org_id IS ? OR org_id = ?) AND (? IS NULL OR status = ?) ORDER BY created_at DESC LIMIT 200`
    ).bind(orgId || null, orgId || null, status || null, status || null).all();
    return results || [];
  }
  async markOutbox(oid, status, error) {
    await this.db.prepare(`UPDATE learn_outbox SET status = ?, error = ?, sent_at = ? WHERE id = ?`)
      .bind(status, error || null, status === "sent" ? now() : null, oid).run();
  }
  async accountsWithRole(orgId, roles) {
    const marks = roles.map(() => "?").join(",");
    const { results } = await this.db.prepare(
      `SELECT DISTINCT r.account_id AS id FROM account_roles r
        WHERE r.product = 'learn' AND r.role IN (${marks}) AND (r.org_id IS NULL OR r.org_id = ?)`
    ).bind(...roles, orgId).all();
    return (results || []).map((r) => r.id);
  }
  async guardianIdsOf(studentIds) {
    if (!studentIds.length) return [];
    const marks = studentIds.map(() => "?").join(",");
    const { results } = await this.db.prepare(`SELECT DISTINCT guardian_id FROM learn_guardians WHERE student_id IN (${marks})`).bind(...studentIds).all();
    return (results || []).map((r) => r.guardian_id);
  }
  async emailOf(accountId) {
    const r = await this.db.prepare(`SELECT email FROM accounts WHERE id = ?`).bind(accountId).first();
    return r ? r.email : null;
  }

  /* ================================================ The school's small records */

  async insertItem(o) {
    const iid = id("itm"), t = now();
    await this.db.prepare(
      `INSERT INTO learn_items (id, org_id, kind, title, status, subject_id, course_id, starts_at, ends_at, due_on, data_json, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(iid, o.orgId, o.kind, o.title, o.status || null, o.subjectId || null, o.courseId || null, o.startsAt ?? null, o.endsAt ?? null,
            o.dueOn || null, JSON.stringify(o.data || {}), o.createdBy || null, t, t).run();
    return iid;
  }
  async findItem(itemId) { return this.db.prepare(`SELECT * FROM learn_items WHERE id = ?`).bind(itemId).first(); }
  async updateItem(itemId, o) {
    await this.db.prepare(
      `UPDATE learn_items SET title = ?, status = ?, subject_id = ?, course_id = ?, starts_at = ?, ends_at = ?, due_on = ?, data_json = ?, updated_at = ? WHERE id = ?`
    ).bind(o.title, o.status || null, o.subjectId || null, o.courseId || null, o.startsAt ?? null, o.endsAt ?? null, o.dueOn || null,
            JSON.stringify(o.data || {}), now(), itemId).run();
  }
  async archiveItem(itemId) { await this.db.prepare(`UPDATE learn_items SET archived_at = ?, updated_at = ? WHERE id = ?`).bind(now(), now(), itemId).run(); }
  async listItems({ orgId, kind, subjectIds, courseId, status, from, to, limit }) {
    const where = ["i.org_id = ?", "i.kind = ?", "i.archived_at IS NULL"], bind = [orgId, kind];
    if (subjectIds) { where.push(`i.subject_id IN (${subjectIds.map(() => "?").join(",") || "NULL"})`); bind.push(...subjectIds); }
    if (courseId) { where.push("i.course_id = ?"); bind.push(courseId); }
    if (status) { where.push("i.status = ?"); bind.push(status); }
    if (from) { where.push("COALESCE(i.due_on, substr(datetime(i.starts_at / 1000, 'unixepoch'), 1, 10)) >= ?"); bind.push(from); }
    if (to) { where.push("COALESCE(i.due_on, substr(datetime(i.starts_at / 1000, 'unixepoch'), 1, 10)) <= ?"); bind.push(to); }
    const { results } = await this.db.prepare(
      `SELECT i.*, p.name AS subject_name, c.title AS course_title
         FROM learn_items i LEFT JOIN profiles p ON p.account_id = i.subject_id LEFT JOIN learn_courses c ON c.id = i.course_id
        WHERE ${where.join(" AND ")} ORDER BY COALESCE(i.due_on, i.starts_at) DESC, i.created_at DESC LIMIT ?`
    ).bind(...bind, limit || 300).all();
    return results || [];
  }

  /* ===================================================================== Files */

  async putFile(f) {
    const fid = id("file");
    await this.db.prepare(
      `INSERT INTO learn_files (id, org_id, owner_kind, owner_id, name, type, size, data, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(fid, f.orgId || null, f.ownerKind, f.ownerId, f.name, f.type, f.size, f.data, f.actorId || null, now()).run();
    return fid;
  }
  async getFile(fid) { return this.db.prepare(`SELECT * FROM learn_files WHERE id = ?`).bind(fid).first(); }
  async listFiles(ownerKind, ownerId) {
    const { results } = await this.db.prepare(
      `SELECT id, name, type, size, uploaded_by, uploaded_at FROM learn_files WHERE owner_kind = ? AND owner_id = ? ORDER BY uploaded_at`
    ).bind(ownerKind, ownerId).all();
    return results || [];
  }
  async deleteFile(fid) { await this.db.prepare(`DELETE FROM learn_files WHERE id = ?`).bind(fid).run(); }

  /* ================================================================== District */

  async childOrgs(parentId) {
    const { results } = await this.db.prepare(`SELECT id, slug, name FROM organizations WHERE parent_id = ? ORDER BY name`).bind(parentId).all();
    return results || [];
  }
  async setOrgParent(orgId, parentId) { await this.db.prepare(`UPDATE organizations SET parent_id = ?, updated_at = ? WHERE id = ?`).bind(parentId || null, now(), orgId).run(); }
  async orgCounts(orgId) {
    const roles = await this.db.prepare(
      `SELECT role, COUNT(DISTINCT account_id) AS n FROM account_roles WHERE product = 'learn' AND org_id = ? GROUP BY role`
    ).bind(orgId).all();
    const sections = await this.db.prepare(`SELECT COUNT(*) AS n FROM learn_courses WHERE org_id = ? AND status = 'published'`).bind(orgId).first();
    return { roles: Object.fromEntries((roles.results || []).map((r) => [r.role, r.n])), sections: sections ? sections.n : 0 };
  }
  async attendanceRate(orgId, from, to, awayKeys) {
    const keys = awayKeys && awayKeys.length ? awayKeys : ["absent"];
    const r = await this.db.prepare(
      `SELECT COUNT(*) AS n, SUM(CASE WHEN a.status IN (${keys.map(() => "?").join(",")}) THEN 1 ELSE 0 END) AS away
         FROM learn_attendance a JOIN learn_courses c ON c.id = a.course_id WHERE c.org_id = ? AND a.day >= ? AND a.day <= ?`
    ).bind(...keys, orgId, from, to).first();
    return r && r.n ? { marks: r.n, away: r.away || 0 } : { marks: 0, away: 0 };
  }

  /* The rows a state or district extract is made of: one per student of the school. */
  async studentExtractRows(orgId) {
    const { results } = await this.db.prepare(
      `SELECT a.id, a.email, p.name, sp.grade_level, sp.program, sp.enrolled_at, c.date_of_birth, c.mailing_address
         FROM account_roles r JOIN accounts a ON a.id = r.account_id
         LEFT JOIN profiles p ON p.account_id = a.id
         LEFT JOIN learn_student_programs sp ON sp.account_id = a.id
         LEFT JOIN account_contacts c ON c.account_id = a.id
        WHERE r.product = 'learn' AND r.role = 'student' AND (r.org_id = ? OR r.org_id IS NULL)
        ORDER BY p.name`
    ).bind(orgId).all();
    return results || [];
  }
  async listOrgCourses(orgId) {
    const { results } = await this.db.prepare(`SELECT id, code, title, subject, status FROM learn_courses WHERE org_id = ? ORDER BY title`).bind(orgId).all();
    return results || [];
  }
  async listMemberships(orgId) {
    const { results } = await this.db.prepare(
      `SELECT cm.course_id, cm.role, c.code, a.id AS account_id, a.email, p.name
         FROM learn_course_memberships cm JOIN learn_courses c ON c.id = cm.course_id
         JOIN accounts a ON a.id = cm.account_id LEFT JOIN profiles p ON p.account_id = a.id
        WHERE c.org_id = ? AND c.status = 'published' ORDER BY c.code, p.name`
    ).bind(orgId).all();
    return results || [];
  }

  async listFamilies(orgId) {
    const { results } = await this.db.prepare(
      `SELECT gp.name AS guardian, ga.email AS guardian_email, gc.cell_phone AS guardian_phone, g.relationship, g.is_primary,
              sp.name AS student, sa.email AS student_email
         FROM learn_guardians g
         JOIN accounts ga ON ga.id = g.guardian_id LEFT JOIN profiles gp ON gp.account_id = ga.id
         LEFT JOIN account_contacts gc ON gc.account_id = ga.id
         JOIN accounts sa ON sa.id = g.student_id LEFT JOIN profiles sp ON sp.account_id = sa.id
        WHERE g.org_id IS ? OR g.org_id = ?
        ORDER BY sp.name, g.is_primary DESC`
    ).bind(orgId, orgId).all();
    return results || [];
  }

  /* ---------------------------------------------------------------- India
     Classes and the details an Indian school's office keeps on a child.
     Column names are written out once, below, from constants; nothing a
     caller sends is ever part of the SQL text. */

  async listIndiaClasses(orgId, year) {
    const { results } = await this.db.prepare(
      `SELECT c.*, t.name AS teacher_name,
              (SELECT COUNT(*) FROM learn_student_india s WHERE s.class_id = c.id) AS strength
         FROM learn_classes c LEFT JOIN profiles t ON t.account_id = c.class_teacher_id
        WHERE c.org_id = ? AND c.school_year = ?`
    ).bind(orgId, year).all();
    return results || [];
  }

  async findIndiaClass(orgId, year, grade, section) {
    return this.db.prepare(
      `SELECT * FROM learn_classes WHERE org_id = ? AND school_year = ? AND grade = ? AND section = ?`
    ).bind(orgId, year, grade, section).first();
  }

  async upsertIndiaClass(orgId, year, c) {
    const t = now();
    await this.db.prepare(
      `INSERT INTO learn_classes
         (id, org_id, school_year, grade, section, programme, stream, class_teacher_id, room, capacity, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (org_id, school_year, grade, section) DO UPDATE SET
         programme = excluded.programme, stream = excluded.stream, class_teacher_id = excluded.class_teacher_id,
         room = excluded.room, capacity = excluded.capacity, updated_at = excluded.updated_at`
    ).bind(id("cls"), orgId, year, c.grade, c.section, c.programme ?? null, c.stream ?? null,
           c.classTeacherId ?? null, c.room ?? null, c.capacity ?? null, t, t).run();
    return this.findIndiaClass(orgId, year, c.grade, c.section);
  }

  async listIndiaStudents(orgId, classId) {
    const { results } = await this.db.prepare(
      `SELECT s.*, a.email, p.name, c.grade, c.section, c.programme, c.stream, k.date_of_birth, k.mailing_address
         FROM learn_student_india s
         JOIN accounts a ON a.id = s.account_id LEFT JOIN profiles p ON p.account_id = s.account_id
         LEFT JOIN learn_classes c ON c.id = s.class_id LEFT JOIN account_contacts k ON k.account_id = s.account_id
        WHERE s.org_id = ? AND (? IS NULL OR s.class_id = ?)`
    ).bind(orgId, classId || null, classId || null).all();
    return results || [];
  }

  async getIndiaStudent(orgId, accountId) {
    return this.db.prepare(
      `SELECT s.*, a.email, p.name, c.grade, c.section, c.programme, c.stream, k.date_of_birth, k.mailing_address
         FROM learn_student_india s
         JOIN accounts a ON a.id = s.account_id LEFT JOIN profiles p ON p.account_id = s.account_id
         LEFT JOIN learn_classes c ON c.id = s.class_id LEFT JOIN account_contacts k ON k.account_id = s.account_id
        WHERE s.org_id = ? AND s.account_id = ?`
    ).bind(orgId, accountId).first();
  }

  /* Several students' rows at once, as getIndiaStudent would give each. */
  async getIndiaStudents(orgId, accountIds) {
    const out = [];
    for (let i = 0; i < accountIds.length; i += 80) {
      const part = accountIds.slice(i, i + 80);
      const { results } = await this.db.prepare(
        `SELECT s.*, a.email, p.name, c.grade, c.section, c.programme, c.stream, k.date_of_birth, k.mailing_address
           FROM learn_student_india s
           JOIN accounts a ON a.id = s.account_id LEFT JOIN profiles p ON p.account_id = s.account_id
           LEFT JOIN learn_classes c ON c.id = s.class_id LEFT JOIN account_contacts k ON k.account_id = s.account_id
          WHERE s.org_id = ? AND s.account_id IN (${part.map(() => "?").join(",")})`
      ).bind(orgId, ...part).all();
      out.push(...(results || []));
    }
    return out;
  }

  /* Students and their contact card, one batch. `row` carries every column of
     learn_student_india; `contact` the date of birth and address, where null
     leaves what is there alone. A batch is one transaction, so a duplicate
     number in one row stops the lot and the caller says which. */
  async putIndiaStudents(orgId, items, actorId, day) {
    const t = now(), today = day || new Date(t).toISOString().slice(0, 10);
    const stmts = [];
    for (const it of items) {
      const r = it.row;
      stmts.push(this.db.prepare(INDIA_UPSERT).bind(it.accountId, orgId, ...INDIA_COLS.map((c) => r[c] ?? null), actorId || null, t, t));
      // Where the child sits is kept year by year: the section they leave is closed, the one they are in is open.
      stmts.push(this.db.prepare(`UPDATE learn_class_students SET left_on = ? WHERE account_id = ? AND left_on IS NULL AND class_id IS NOT ?`)
        .bind(today, it.accountId, r.class_id ?? null));
      if (r.class_id) stmts.push(this.db.prepare(SEAT).bind(r.class_id, it.accountId, r.roll_no ?? null, today));
      if (it.contact && (it.contact.dateOfBirth || it.contact.mailingAddress)) {
        stmts.push(this.db.prepare(
          `INSERT INTO account_contacts (account_id, mailing_address, date_of_birth, updated_by, updated_at) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (account_id) DO UPDATE SET
             mailing_address = COALESCE(excluded.mailing_address, account_contacts.mailing_address),
             date_of_birth = COALESCE(excluded.date_of_birth, account_contacts.date_of_birth),
             updated_by = excluded.updated_by, updated_at = excluded.updated_at`
        ).bind(it.accountId, it.contact.mailingAddress ?? null, it.contact.dateOfBirth ?? null, actorId || null, t));
      }
    }
    for (let i = 0; i < stmts.length; i += 80) await this.db.batch(stmts.slice(i, i + 80));
  }

  /* Seat children in a section: [{ accountId, classId, rollNo }]. A child the office
     has no row for yet gets one. The section they leave is closed on `day`. */
  async seatStudents(orgId, moves, actorId, day) {
    const t = now(), stmts = [];
    for (const m of moves) {
      stmts.push(this.db.prepare(
        `INSERT INTO learn_student_india (account_id, org_id, class_id, roll_no, consent_status, updated_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)
         ON CONFLICT (account_id) DO UPDATE SET class_id = excluded.class_id, roll_no = excluded.roll_no,
           left_on = NULL, left_reason = NULL, updated_by = excluded.updated_by, updated_at = excluded.updated_at`
      ).bind(m.accountId, orgId, m.classId, m.rollNo ?? null, actorId || null, t, t));
      stmts.push(this.db.prepare(`UPDATE learn_class_students SET left_on = ? WHERE account_id = ? AND left_on IS NULL AND class_id IS NOT ?`).bind(day, m.accountId, m.classId));
      stmts.push(this.db.prepare(SEAT).bind(m.classId, m.accountId, m.rollNo ?? null, day));
    }
    for (let i = 0; i < stmts.length; i += 80) await this.db.batch(stmts.slice(i, i + 80));
  }

  /* Number a section's children: [{ id, rollNo }]. Every number is cleared first, so
     a child may take another's old number in the same pass. */
  async numberRolls(classId, rolls) {
    await this.db.batch([
      this.db.prepare(`UPDATE learn_student_india SET roll_no = NULL WHERE class_id = ?`).bind(classId),
      this.db.prepare(`UPDATE learn_class_students SET roll_no = NULL WHERE class_id = ? AND left_on IS NULL`).bind(classId)
    ]);
    const stmts = [];
    for (const r of rolls) {
      stmts.push(this.db.prepare(`UPDATE learn_student_india SET roll_no = ? WHERE account_id = ? AND class_id = ?`).bind(r.rollNo, r.id, classId));
      stmts.push(this.db.prepare(`UPDATE learn_class_students SET roll_no = ? WHERE account_id = ? AND class_id = ? AND left_on IS NULL`).bind(r.rollNo, r.id, classId));
    }
    for (let i = 0; i < stmts.length; i += 80) await this.db.batch(stmts.slice(i, i + 80));
  }

  /* A child leaves the school: out of their section, and the day and reason kept. */
  async leaveSchool(orgId, accountId, day, reason, actorId) {
    const t = now();
    await this.db.batch([
      this.db.prepare(
        `INSERT INTO learn_student_india (account_id, org_id, consent_status, left_on, left_reason, updated_by, created_at, updated_at)
         VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)
         ON CONFLICT (account_id) DO UPDATE SET class_id = NULL, roll_no = NULL, left_on = excluded.left_on, left_reason = excluded.left_reason,
           updated_by = excluded.updated_by, updated_at = excluded.updated_at`
      ).bind(accountId, orgId, day, reason || null, actorId || null, t, t),
      this.db.prepare(`UPDATE learn_class_students SET left_on = ? WHERE account_id = ? AND left_on IS NULL`).bind(day, accountId)
    ]);
  }

  /* Students the school has who sit in no section and have not left. */
  async unplacedStudents(orgId) {
    const { results } = await this.db.prepare(
      `SELECT DISTINCT a.id, a.email, p.name
         FROM account_roles r JOIN accounts a ON a.id = r.account_id LEFT JOIN profiles p ON p.account_id = a.id
         LEFT JOIN learn_student_india s ON s.account_id = a.id
        WHERE r.org_id = ? AND r.product = 'learn' AND r.role = 'student'
          AND (s.account_id IS NULL OR (s.class_id IS NULL AND s.left_on IS NULL))
        ORDER BY p.name COLLATE NOCASE`
    ).bind(orgId).all();
    return results || [];
  }

  /* ------------------------------------------------------------------ Exams
     Scales, exams, the papers of a section, their marks and the history of
     every change, the class teacher's words on a card, and the parent meeting. */

  async listScales(orgId) {
    const { results } = await this.db.prepare(
      `SELECT sc.*, (SELECT COUNT(*) FROM learn_exams e WHERE e.scale_id = sc.id OR e.coscale_id = sc.id) AS used
         FROM learn_grading_scales sc WHERE sc.org_id = ? ORDER BY sc.kind, sc.name`
    ).bind(orgId).all();
    return results || [];
  }
  async getScale(orgId, scaleId) {
    return this.db.prepare(`SELECT * FROM learn_grading_scales WHERE org_id = ? AND id = ?`).bind(orgId, scaleId).first();
  }
  async putScale(orgId, scaleId, sc, actorId) {
    const t = now(), sid = scaleId || id("scale");
    await this.db.prepare(
      `INSERT INTO learn_grading_scales (id, org_id, name, board, kind, bands_json, pass_percent, note, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET name = excluded.name, board = excluded.board, kind = excluded.kind, bands_json = excluded.bands_json,
         pass_percent = excluded.pass_percent, note = excluded.note, updated_at = excluded.updated_at`
    ).bind(sid, orgId, sc.name, sc.board ?? null, sc.kind, JSON.stringify(sc.bands), sc.passPercent ?? null, sc.note ?? null, actorId || null, t, t).run();
    return this.getScale(orgId, sid);
  }
  async deleteScale(orgId, scaleId) {
    await this.db.prepare(`DELETE FROM learn_grading_scales WHERE org_id = ? AND id = ?`).bind(orgId, scaleId).run();
  }

  async listExams(orgId, year) {
    const { results } = await this.db.prepare(
      `SELECT e.*, (SELECT COUNT(*) FROM learn_exam_papers p WHERE p.exam_id = e.id) AS papers,
              (SELECT COUNT(*) FROM learn_exam_papers p WHERE p.exam_id = e.id AND p.state = 'published') AS published
         FROM learn_exams e WHERE e.org_id = ? AND (? IS NULL OR e.school_year = ?) ORDER BY e.school_year DESC, e.created_at`
    ).bind(orgId, year || null, year || null).all();
    return results || [];
  }
  async getExam(orgId, examId) {
    return this.db.prepare(`SELECT * FROM learn_exams WHERE org_id = ? AND id = ?`).bind(orgId, examId).first();
  }
  async insertExam(orgId, e, actorId) {
    const eid = id("exam");
    await this.db.prepare(
      `INSERT INTO learn_exams (id, org_id, school_year, name, kind, scale_id, coscale_id, starts_on, ends_on, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(eid, orgId, e.year, e.name, e.kind, e.scaleId ?? null, e.coscaleId ?? null, e.startsOn ?? null, e.endsOn ?? null, actorId || null, now()).run();
    return this.getExam(orgId, eid);
  }
  async updateExam(orgId, examId, e) {
    await this.db.prepare(`UPDATE learn_exams SET scale_id = ?, coscale_id = ?, starts_on = ?, ends_on = ? WHERE org_id = ? AND id = ?`)
      .bind(e.scaleId ?? null, e.coscaleId ?? null, e.startsOn ?? null, e.endsOn ?? null, orgId, examId).run();
    return this.getExam(orgId, examId);
  }

  /* Papers, with their section, teacher, and how many children have a mark. */
  async listPapers({ orgId, examId, classId, teacherId, classTeacherId }) {
    const { results } = await this.db.prepare(
      `SELECT p.*, c.grade, c.section, c.class_teacher_id, c.school_year AS class_year, t.name AS teacher_name, e.name AS exam_name, e.school_year,
              (SELECT COUNT(*) FROM learn_student_india s WHERE s.class_id = p.class_id) AS strength,
              (SELECT COUNT(*) FROM learn_exam_marks m WHERE m.paper_id = p.id AND (m.absent = 1 OR m.theory IS NOT NULL OR m.internal IS NOT NULL OR m.practical IS NOT NULL)) AS entered
         FROM learn_exam_papers p JOIN learn_exams e ON e.id = p.exam_id JOIN learn_classes c ON c.id = p.class_id
         LEFT JOIN profiles t ON t.account_id = p.teacher_id
        WHERE e.org_id = ? AND (? IS NULL OR p.exam_id = ?) AND (? IS NULL OR p.class_id = ?) AND (? IS NULL OR p.teacher_id = ?)
          AND (? IS NULL OR c.class_teacher_id = ?)
        ORDER BY c.grade, c.section, p.subject`
    ).bind(orgId, examId || null, examId || null, classId || null, classId || null, teacherId || null, teacherId || null, classTeacherId || null, classTeacherId || null).all();
    return results || [];
  }
  async getPaper(orgId, paperId) {
    return this.db.prepare(
      `SELECT p.*, c.grade, c.section, c.class_teacher_id, t.name AS teacher_name, e.name AS exam_name, e.school_year, e.scale_id, e.coscale_id, e.starts_on, e.ends_on
         FROM learn_exam_papers p JOIN learn_exams e ON e.id = p.exam_id JOIN learn_classes c ON c.id = p.class_id LEFT JOIN profiles t ON t.account_id = p.teacher_id
        WHERE e.org_id = ? AND p.id = ?`
    ).bind(orgId, paperId).first();
  }
  async insertPapers(examId, classId, list) {
    const stmts = list.map((p) => this.db.prepare(
      `INSERT INTO learn_exam_papers (id, exam_id, class_id, subject, teacher_id, max_theory, max_internal, max_practical, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (exam_id, class_id, subject) DO UPDATE SET teacher_id = excluded.teacher_id`
    ).bind(id("paper"), examId, classId, p.subject, p.teacherId ?? null, p.maxTheory, p.maxInternal, p.maxPractical, now()));
    for (let i = 0; i < stmts.length; i += 80) await this.db.batch(stmts.slice(i, i + 80));
  }
  async setPaperState(paperId, state, actorId, note) {
    const t = now();
    const col = { submitted: "submitted", checked: "checked", approved: "approved", published: "published" }[state];
    const stamp = col ? `, ${col}_by = ?, ${col}_at = ?` : "";
    const bind = [state, note ?? null];
    if (col) bind.push(actorId || null, t);
    await this.db.prepare(`UPDATE learn_exam_papers SET state = ?, returned_note = ?${stamp} WHERE id = ?`).bind(...bind, paperId).run();
  }
  async setPaperTeacher(paperId, teacherId) {
    await this.db.prepare(`UPDATE learn_exam_papers SET teacher_id = ? WHERE id = ?`).bind(teacherId || null, paperId).run();
  }

  async listMarks(paperId) {
    const { results } = await this.db.prepare(`SELECT * FROM learn_exam_marks WHERE paper_id = ?`).bind(paperId).all();
    return results || [];
  }
  /* Write marks and, for every field that changed, its history. `rows`: [{ accountId, theory, internal, practical, absent }]. */
  async saveMarks(paperId, rows, actorId, state, afterLock, why) {
    const t = now(), was = new Map((await this.listMarks(paperId)).map((m) => [m.account_id, m]));
    const stmts = [];
    for (const r of rows) {
      const old = was.get(r.accountId) || {};
      for (const f of ["theory", "internal", "practical", "absent"]) {
        const a = old[f] ?? null, b = r[f] ?? null;
        if (String(a) !== String(b) && !(f === "absent" && !a && !b)) {
          stmts.push(this.db.prepare(
            `INSERT INTO learn_exam_mark_log (id, paper_id, account_id, field, from_value, to_value, by_id, at, state, after_lock, why) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(id("mlog"), paperId, r.accountId, f, a === null ? null : String(a), b === null ? null : String(b), actorId || null, t, state, afterLock ? 1 : 0, afterLock ? why : null));
        }
      }
      stmts.push(this.db.prepare(
        `INSERT INTO learn_exam_marks (paper_id, account_id, theory, internal, practical, absent, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (paper_id, account_id) DO UPDATE SET theory = excluded.theory, internal = excluded.internal, practical = excluded.practical,
           absent = excluded.absent, updated_by = excluded.updated_by, updated_at = excluded.updated_at`
      ).bind(paperId, r.accountId, r.theory ?? null, r.internal ?? null, r.practical ?? null, r.absent ? 1 : 0, actorId || null, t));
    }
    for (let i = 0; i < stmts.length; i += 80) await this.db.batch(stmts.slice(i, i + 80));
  }
  async markEditsAfterLock(orgId, limit) {
    const { results } = await this.db.prepare(
      `SELECT l.*, sp.name AS student_name, bp.name AS by_name, p.subject, c.grade, c.section, e.name AS exam_name
         FROM learn_exam_mark_log l JOIN learn_exam_papers p ON p.id = l.paper_id JOIN learn_exams e ON e.id = p.exam_id JOIN learn_classes c ON c.id = p.class_id
         LEFT JOIN profiles sp ON sp.account_id = l.account_id LEFT JOIN profiles bp ON bp.account_id = l.by_id
        WHERE e.org_id = ? AND l.after_lock = 1 ORDER BY l.at DESC LIMIT ?`
    ).bind(orgId, limit || 100).all();
    return results || [];
  }

  /* Everything a class's report cards are made of, for one exam. */
  async cardPapers(examId, classId) {
    const { results } = await this.db.prepare(
      `SELECT p.* FROM learn_exam_papers p WHERE p.exam_id = ? AND p.class_id = ? ORDER BY p.subject`
    ).bind(examId, classId).all();
    return results || [];
  }
  async marksOfPapers(paperIds) {
    const out = [];
    for (let i = 0; i < paperIds.length; i += 80) {
      const part = paperIds.slice(i, i + 80);
      const { results } = await this.db.prepare(`SELECT * FROM learn_exam_marks WHERE paper_id IN (${part.map(() => "?").join(",")})`).bind(...part).all();
      out.push(...(results || []));
    }
    return out;
  }
  async cardExtras(examId, accountIds) {
    const cards = [], cos = [];
    for (let i = 0; i < accountIds.length; i += 80) {
      const part = accountIds.slice(i, i + 80), ph = part.map(() => "?").join(",");
      cards.push(...((await this.db.prepare(`SELECT * FROM learn_exam_cards WHERE exam_id = ? AND account_id IN (${ph})`).bind(examId, ...part).all()).results || []));
      cos.push(...((await this.db.prepare(`SELECT * FROM learn_exam_cos WHERE exam_id = ? AND account_id IN (${ph})`).bind(examId, ...part).all()).results || []));
    }
    return { cards, cos };
  }
  async saveCards(examId, items, actorId) {
    const t = now(), stmts = [];
    for (const it of items) {
      stmts.push(this.db.prepare(
        `INSERT INTO learn_exam_cards (exam_id, account_id, remark, result, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (exam_id, account_id) DO UPDATE SET remark = excluded.remark, result = excluded.result, updated_by = excluded.updated_by, updated_at = excluded.updated_at`
      ).bind(examId, it.accountId, it.remark ?? null, it.result ?? null, actorId || null, t));
      if (it.cos) {
        stmts.push(this.db.prepare(`DELETE FROM learn_exam_cos WHERE exam_id = ? AND account_id = ?`).bind(examId, it.accountId));
        for (const [area, grade] of Object.entries(it.cos)) stmts.push(this.db.prepare(`INSERT INTO learn_exam_cos (exam_id, account_id, area, grade) VALUES (?, ?, ?, ?)`).bind(examId, it.accountId, area, grade));
      }
    }
    for (let i = 0; i < stmts.length; i += 80) await this.db.batch(stmts.slice(i, i + 80));
  }
  /* The exams a child has a published paper in, for the family's view. */
  async examsWithPublished(accountId) {
    const { results } = await this.db.prepare(
      `SELECT DISTINCT e.*, s.class_id, c.grade, c.section
         FROM learn_exam_marks m JOIN learn_exam_papers p ON p.id = m.paper_id AND p.state = 'published'
         JOIN learn_exams e ON e.id = p.exam_id JOIN learn_classes c ON c.id = p.class_id
         LEFT JOIN learn_student_india s ON s.account_id = m.account_id
        WHERE m.account_id = ? ORDER BY e.school_year DESC, e.created_at DESC`
    ).bind(accountId).all();
    return results || [];
  }

  /* A child's published results, one line per exam: marks gained and what they were out of. Absent papers are left out. */
  async examPercents(orgId, accountIds) {
    const out = [];
    for (let i = 0; i < Math.max(1, accountIds.length); i += 80) {
      const part = accountIds ? accountIds.slice(i, i + 80) : [];
      const where = part.length ? `AND m.account_id IN (${part.map(() => "?").join(",")})` : "";
      const { results } = await this.db.prepare(
        `SELECT m.account_id, e.id AS exam_id, e.name AS exam_name, e.created_at AS exam_at, e.scale_id,
                SUM(COALESCE(m.theory, 0) + COALESCE(m.internal, 0) + COALESCE(m.practical, 0)) AS total,
                SUM(p.max_theory + p.max_internal + p.max_practical) AS max
           FROM learn_exam_marks m JOIN learn_exam_papers p ON p.id = m.paper_id AND p.state = 'published' JOIN learn_exams e ON e.id = p.exam_id
          WHERE e.org_id = ? AND m.absent = 0 ${where} GROUP BY m.account_id, e.id`
      ).bind(orgId, ...part).all();
      out.push(...(results || []));
      if (!accountIds.length) break;
    }
    return out;
  }

  /* --------------------------------------------- Competencies and the HPC */
  async listCompetencies(orgId, stage) {
    const { results } = await this.db.prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM learn_comp_levels l WHERE l.competency_id = c.id) AS rated FROM learn_competencies c
        WHERE c.org_id = ? AND (? IS NULL OR c.stage IS NULL OR c.stage = ?) ORDER BY c.subject, c.name`
    ).bind(orgId, stage || null, stage || null).all();
    return results || [];
  }
  async addCompetencies(orgId, list, actorId) {
    const stmts = list.map((c) => this.db.prepare(
      `INSERT INTO learn_competencies (id, org_id, stage, subject, name, code, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (org_id, subject, name) DO UPDATE SET stage = excluded.stage, code = excluded.code`
    ).bind(id("comp"), orgId, c.stage ?? null, c.subject, c.name, c.code ?? null, actorId || null, now()));
    for (let i = 0; i < stmts.length; i += 80) await this.db.batch(stmts.slice(i, i + 80));
  }
  async deleteCompetency(orgId, compId) {
    await this.db.prepare(`DELETE FROM learn_competencies WHERE org_id = ? AND id = ?`).bind(orgId, compId).run();
  }
  async levelsFor(accountIds, year, term) {
    const out = [];
    for (let i = 0; i < accountIds.length; i += 80) {
      const part = accountIds.slice(i, i + 80);
      if (!part.length) continue;
      const { results } = await this.db.prepare(
        `SELECT * FROM learn_comp_levels WHERE school_year = ? AND (? IS NULL OR term = ?) AND account_id IN (${part.map(() => "?").join(",")})`
      ).bind(year, term || null, term || null, ...part).all();
      out.push(...(results || []));
    }
    return out;
  }
  async allLevelsOf(accountId) {
    const { results } = await this.db.prepare(`SELECT * FROM learn_comp_levels WHERE account_id = ? ORDER BY school_year, term`).bind(accountId).all();
    return results || [];
  }
  async setLevels(rows, year, term, actorId) {
    const t = now();
    const stmts = rows.map((r) => r.level === null
      ? this.db.prepare(`DELETE FROM learn_comp_levels WHERE account_id = ? AND competency_id = ? AND school_year = ? AND term = ?`).bind(r.accountId, r.competencyId, year, term)
      : this.db.prepare(
        `INSERT INTO learn_comp_levels (account_id, competency_id, school_year, term, level, note, set_by, set_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (account_id, competency_id, school_year, term) DO UPDATE SET level = excluded.level, note = excluded.note, set_by = excluded.set_by, set_at = excluded.set_at`
      ).bind(r.accountId, r.competencyId, year, term, r.level, r.note ?? null, actorId || null, t));
    for (let i = 0; i < stmts.length; i += 80) await this.db.batch(stmts.slice(i, i + 80));
  }
  /* Every rating of a term, with the child's section, for the school's own analysis. */
  async levelsOfTerm(orgId, year, term, subject) {
    const { results } = await this.db.prepare(
      `SELECT l.competency_id, l.level, s.class_id, c.grade, c.section, k.subject, k.name
         FROM learn_comp_levels l JOIN learn_competencies k ON k.id = l.competency_id AND k.org_id = ?
         JOIN learn_student_india s ON s.account_id = l.account_id LEFT JOIN learn_classes c ON c.id = s.class_id
        WHERE l.school_year = ? AND l.term = ? AND (? IS NULL OR k.subject = ?)`
    ).bind(orgId, year, term, subject || null, subject || null).all();
    return results || [];
  }
  async addHpcNote(orgId, n) {
    const nid = id("hpc");
    await this.db.prepare(`INSERT INTO learn_hpc_notes (id, org_id, account_id, school_year, term, source, area, body, by_id, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(nid, orgId, n.accountId, n.year, n.term, n.source, n.area ?? null, n.body, n.byId || null, now()).run();
    return nid;
  }
  async hpcNotes(accountId, year, term) {
    const { results } = await this.db.prepare(
      `SELECT n.*, p.name AS by_name FROM learn_hpc_notes n LEFT JOIN profiles p ON p.account_id = n.by_id
        WHERE n.account_id = ? AND n.school_year = ? AND (? IS NULL OR n.term = ?) ORDER BY n.at`
    ).bind(accountId, year, term || null, term || null).all();
    return results || [];
  }
  async removeHpcNote(noteId, orgId) {
    await this.db.prepare(`DELETE FROM learn_hpc_notes WHERE id = ? AND org_id = ?`).bind(noteId, orgId).run();
  }
  async getHpcNote(noteId, orgId) {
    return this.db.prepare(`SELECT * FROM learn_hpc_notes WHERE id = ? AND org_id = ?`).bind(noteId, orgId).first();
  }

  /* ------------------------------------------------ Certificates, disclosure */
  /* The next number in a series, handed out once: the count and the row are one statement. */
  async nextNumber(orgId, series, year) {
    const r = await this.db.prepare(
      `INSERT INTO learn_numbers (org_id, series, year, last) VALUES (?, ?, ?, 1)
       ON CONFLICT (org_id, series, year) DO UPDATE SET last = last + 1 RETURNING last`
    ).bind(orgId, series, year).first();
    return r.last;
  }
  async setDisclosure(orgId, d) {
    await this.db.prepare(`UPDATE organizations SET disclosure_json = ?, updated_at = ? WHERE id = ?`).bind(JSON.stringify(d), now(), orgId).run();
  }
  async issuedCertificates(orgId) {
    const { results } = await this.db.prepare(
      `SELECT i.id, i.data_json, i.updated_at, p.name FROM learn_items i LEFT JOIN profiles p ON p.account_id = i.subject_id
        WHERE i.org_id = ? AND i.kind = 'certificate' AND i.status = 'issued' AND i.archived_at IS NULL ORDER BY i.updated_at DESC LIMIT 1000`
    ).bind(orgId).all();
    return results || [];
  }
  async enrolmentByGrade(orgId, year) {
    const { results } = await this.db.prepare(
      `SELECT c.grade, COUNT(*) AS sections, SUM((SELECT COUNT(*) FROM learn_student_india s WHERE s.class_id = c.id)) AS students
         FROM learn_classes c WHERE c.org_id = ? AND c.school_year = ? GROUP BY c.grade`
    ).bind(orgId, year).all();
    return results || [];
  }
  async countRole(orgId, role) {
    const r = await this.db.prepare(`SELECT COUNT(DISTINCT account_id) AS n FROM account_roles WHERE org_id = ? AND product = 'learn' AND role = ?`).bind(orgId, role).first();
    return r ? r.n : 0;
  }

  /* ------------------------------------------------------ The diary, the day */
  async addDiary(orgId, d, actorId) {
    const did = id("diary");
    try {
      await this.db.prepare(`INSERT INTO learn_diary (id, org_id, class_id, day, kind, subject, body, client_key, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(did, orgId, d.classId, d.day, d.kind, d.subject ?? null, d.body, d.clientKey ?? null, actorId || null, now()).run();
    } catch (e) {
      // The same entry sent twice (a phone that did not hear back) is found, not made again.
      if (d.clientKey && /UNIQUE/i.test(String(e && e.message))) {
        const was = await this.db.prepare(`SELECT * FROM learn_diary WHERE class_id = ? AND client_key = ?`).bind(d.classId, d.clientKey).first();
        return { row: was, again: true };
      }
      throw e;
    }
    return { row: await this.db.prepare(`SELECT * FROM learn_diary WHERE id = ?`).bind(did).first(), again: false };
  }
  async listDiary({ classId, from, to, limit }) {
    const { results } = await this.db.prepare(
      `SELECT d.*, p.name AS by_name FROM learn_diary d LEFT JOIN profiles p ON p.account_id = d.created_by
        WHERE d.class_id = ? AND (? IS NULL OR d.day >= ?) AND (? IS NULL OR d.day <= ?) ORDER BY d.day DESC, d.created_at DESC LIMIT ?`
    ).bind(classId, from || null, from || null, to || null, to || null, limit || 100).all();
    return results || [];
  }
  async saveTeacherDay(orgId, classId, day, teacherId, seconds, steps, offline) {
    await this.db.prepare(
      `INSERT INTO learn_teacher_day (id, org_id, class_id, day, teacher_id, seconds, steps_json, offline, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (class_id, day, teacher_id) DO UPDATE SET seconds = excluded.seconds, steps_json = excluded.steps_json, offline = excluded.offline, created_at = excluded.created_at`
    ).bind(id("tday"), orgId, classId, day, teacherId, seconds, JSON.stringify(steps), offline ? 1 : 0, now()).run();
  }
  async teacherDays(orgId, from, to) {
    const { results } = await this.db.prepare(`SELECT seconds, steps_json, offline, class_id, day FROM learn_teacher_day WHERE org_id = ? AND day >= ? AND day <= ? ORDER BY seconds`).bind(orgId, from, to).all();
    return results || [];
  }

  /* ------------------------------------------------------- Parent meetings */
  async insertPtm(orgId, p, slots, actorId) {
    const pid = id("ptm");
    const stmts = [this.db.prepare(
      `INSERT INTO learn_ptm (id, org_id, class_id, exam_id, title, day, start_time, slot_minutes, mode, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(pid, orgId, p.classId, p.examId ?? null, p.title, p.day, p.start, p.slotMinutes, p.mode, actorId || null, now())];
    for (const sl of slots) stmts.push(this.db.prepare(`INSERT INTO learn_ptm_slots (ptm_id, slot_no, starts, account_id) VALUES (?, ?, ?, ?)`).bind(pid, sl.no, sl.starts, sl.accountId ?? null));
    for (let i = 0; i < stmts.length; i += 80) await this.db.batch(stmts.slice(i, i + 80));
    return pid;
  }
  async listPtm(orgId, classId) {
    const { results } = await this.db.prepare(
      `SELECT m.*, c.grade, c.section, (SELECT COUNT(*) FROM learn_ptm_slots s WHERE s.ptm_id = m.id) AS slots,
              (SELECT COUNT(*) FROM learn_ptm_slots s WHERE s.ptm_id = m.id AND s.account_id IS NOT NULL) AS booked
         FROM learn_ptm m JOIN learn_classes c ON c.id = m.class_id WHERE m.org_id = ? AND (? IS NULL OR m.class_id = ?) ORDER BY m.day DESC`
    ).bind(orgId, classId || null, classId || null).all();
    return results || [];
  }
  async getPtm(orgId, ptmId) {
    return this.db.prepare(`SELECT m.*, c.grade, c.section, c.class_teacher_id FROM learn_ptm m JOIN learn_classes c ON c.id = m.class_id WHERE m.org_id = ? AND m.id = ?`).bind(orgId, ptmId).first();
  }
  async ptmSlots(ptmId) {
    const { results } = await this.db.prepare(
      `SELECT s.*, p.name AS child_name FROM learn_ptm_slots s LEFT JOIN profiles p ON p.account_id = s.account_id WHERE s.ptm_id = ? ORDER BY s.slot_no`
    ).bind(ptmId).all();
    return results || [];
  }
  /* Give a child a slot (first releasing the one they had). A slot another child holds is refused by the caller. */
  async bookSlot(ptmId, slotNo, accountId, byId) {
    await this.db.batch([
      this.db.prepare(`UPDATE learn_ptm_slots SET account_id = NULL, booked_by = NULL, booked_at = NULL WHERE ptm_id = ? AND account_id = ?`).bind(ptmId, accountId),
      this.db.prepare(`UPDATE learn_ptm_slots SET account_id = ?, booked_by = ?, booked_at = ? WHERE ptm_id = ? AND slot_no = ? AND account_id IS NULL`).bind(accountId, byId || null, now(), ptmId, slotNo)
    ]);
  }
  async releaseSlot(ptmId, accountId) {
    await this.db.prepare(`UPDATE learn_ptm_slots SET account_id = NULL, booked_by = NULL, booked_at = NULL WHERE ptm_id = ? AND account_id = ?`).bind(ptmId, accountId).run();
  }
  async ptmFor(accountId) {
    const { results } = await this.db.prepare(
      `SELECT m.*, c.grade, c.section, s.slot_no, s.starts FROM learn_ptm m JOIN learn_classes c ON c.id = m.class_id
         JOIN learn_student_india si ON si.class_id = m.class_id AND si.account_id = ?
         LEFT JOIN learn_ptm_slots s ON s.ptm_id = m.id AND s.account_id = ?
        ORDER BY m.day DESC`
    ).bind(accountId, accountId).all();
    return results || [];
  }

  async namesOf(ids) {
    const out = new Map();
    for (let i = 0; i < ids.length; i += 80) {
      const part = ids.slice(i, i + 80);
      if (!part.length) continue;
      const { results } = await this.db.prepare(`SELECT account_id, name FROM profiles WHERE account_id IN (${part.map(() => "?").join(",")})`).bind(...part).all();
      for (const r of results || []) out.set(r.account_id, r.name);
    }
    return out;
  }

  async getIndiaClass(orgId, classId) {
    return this.db.prepare(`SELECT * FROM learn_classes WHERE org_id = ? AND id = ?`).bind(orgId, classId).first();
  }

  /* Every section a child has sat in, newest first. */
  async classHistory(accountId) {
    const { results } = await this.db.prepare(
      `SELECT m.class_id, m.roll_no, m.joined_on, m.left_on, c.school_year, c.grade, c.section
         FROM learn_class_students m JOIN learn_classes c ON c.id = m.class_id
        WHERE m.account_id = ? ORDER BY m.joined_on DESC, c.school_year DESC`
    ).bind(accountId).all();
    return results || [];
  }

  /* Who, among these addresses, belongs to this school: [{ id, email_lower }]. */
  async accountsByEmails(orgId, emails) {
    const out = [];
    const list = [...new Set(emails.map((e) => String(e).trim().toLowerCase()).filter(Boolean))];
    for (let i = 0; i < list.length; i += 80) {
      const part = list.slice(i, i + 80);
      const { results } = await this.db.prepare(
        `SELECT a.id, a.email_lower FROM accounts a
           JOIN organization_memberships m ON m.account_id = a.id AND m.org_id = ?
          WHERE a.email_lower IN (${part.map(() => "?").join(",")})`
      ).bind(orgId, ...part).all();
      out.push(...(results || []));
    }
    return out;
  }

  /* Who, among these addresses, already has an Oplo Account — in this school or
     not: [{ id, email_lower, status, member, roles }], roles being this school's
     learn roles as "a,b". */
  async peopleByEmails(orgId, emails) {
    const out = [];
    const list = [...new Set(emails.map((e) => String(e).trim().toLowerCase()).filter(Boolean))];
    for (let i = 0; i < list.length; i += 80) {
      const part = list.slice(i, i + 80);
      const { results } = await this.db.prepare(
        `SELECT a.id, a.email_lower, a.status,
                EXISTS (SELECT 1 FROM organization_memberships m WHERE m.account_id = a.id AND m.org_id = ?) AS member,
                (SELECT group_concat(r.role) FROM account_roles r WHERE r.account_id = a.id AND r.org_id = ? AND r.product = 'learn') AS roles
           FROM accounts a WHERE a.email_lower IN (${part.map(() => "?").join(",")})`
      ).bind(orgId, orgId, ...part).all();
      out.push(...(results || []));
    }
    return out;
  }

  /* The guardian links these students already have, by email:
     [{ student, guardian, relationship, label, is_primary }]. */
  async guardianLinksByStudentEmails(emails) {
    const out = [];
    const list = [...new Set(emails.map((e) => String(e).trim().toLowerCase()).filter(Boolean))];
    for (let i = 0; i < list.length; i += 80) {
      const part = list.slice(i, i + 80);
      const { results } = await this.db.prepare(
        `SELECT s.email_lower AS student, g.email_lower AS guardian, l.relationship, l.label, l.is_primary
           FROM learn_guardians l JOIN accounts s ON s.id = l.student_id JOIN accounts g ON g.id = l.guardian_id
          WHERE s.email_lower IN (${part.map(() => "?").join(",")})`
      ).bind(...part).all();
      out.push(...(results || []));
    }
    return out;
  }

  /* A school's people in one transaction, written from a few JSON lists rather
     than a statement per person. Everything is keyed by email and written
     only if missing, so the same call twice changes nothing.
       fresh    [{ id, email, lower, name, first, initials, hue, title }]  new accounts: `invited`, NO password
       roles    [{ lower, role }]            learn roles in this school
       members  [{ lower, mrole }]           membership in this school
       links    [{ student, guardian, rel, label, primary }]   lower-cased emails
       clear    [student email]              whose primary guardian is being reset first */
  async importPeople(orgId, { fresh, roles, members, links, clear }, actorId) {
    const t = now(), stmts = [];
    const on = "FROM json_each(?) j JOIN accounts a ON a.email_lower = json_extract(j.value, '$.lower')";
    if (fresh.length) {
      stmts.push(this.db.prepare(
        `INSERT OR IGNORE INTO accounts (id, email, email_lower, email_verified, status, created_at, updated_at)
         SELECT json_extract(j.value, '$.id'), json_extract(j.value, '$.email'), json_extract(j.value, '$.lower'), 0, 'invited', ?, ?
           FROM json_each(?) j`).bind(t, t, JSON.stringify(fresh)));
      stmts.push(this.db.prepare(
        `INSERT OR IGNORE INTO profiles (account_id, name, first_name, initials, avatar_hue, title, created_at, updated_at)
         SELECT a.id, json_extract(j.value, '$.name'), json_extract(j.value, '$.first'), json_extract(j.value, '$.initials'),
                json_extract(j.value, '$.hue'), json_extract(j.value, '$.title'), ?, ? ${on}`).bind(t, t, JSON.stringify(fresh)));
    }
    if (roles.length) {
      stmts.push(this.db.prepare(
        `INSERT OR IGNORE INTO account_roles (id, account_id, product, role, org_id, created_at)
         SELECT 'rol_' || lower(hex(randomblob(16))), a.id, 'learn', json_extract(j.value, '$.role'), ?, ? ${on}`).bind(orgId, t, JSON.stringify(roles)));
    }
    if (members.length) {
      stmts.push(this.db.prepare(
        `INSERT OR IGNORE INTO organization_memberships (id, org_id, account_id, role, created_at)
         SELECT 'mem_' || lower(hex(randomblob(16))), ?, a.id, json_extract(j.value, '$.mrole'), ? ${on}`).bind(orgId, t, JSON.stringify(members)));
    }
    if (clear.length) {
      stmts.push(this.db.prepare(
        `UPDATE learn_guardians SET is_primary = 0, updated_at = ?
          WHERE is_primary = 1 AND student_id IN (SELECT a.id FROM json_each(?) j JOIN accounts a ON a.email_lower = j.value)`).bind(t, JSON.stringify(clear)));
    }
    if (links.length) {
      stmts.push(this.db.prepare(
        `INSERT INTO learn_guardians (id, guardian_id, student_id, org_id, relationship, label, is_primary, created_by, created_at, updated_at)
         SELECT 'grd_' || lower(hex(randomblob(16))), g.id, s.id, ?, json_extract(j.value, '$.rel'), json_extract(j.value, '$.label'),
                json_extract(j.value, '$.primary'), ?, ?, ?
           FROM json_each(?) j
           JOIN accounts s ON s.email_lower = json_extract(j.value, '$.student')
           JOIN accounts g ON g.email_lower = json_extract(j.value, '$.guardian')
          WHERE s.id <> g.id
         ON CONFLICT (guardian_id, student_id) DO UPDATE SET relationship = excluded.relationship, label = excluded.label,
           is_primary = excluded.is_primary, updated_at = excluded.updated_at`).bind(orgId, actorId || null, t, t, JSON.stringify(links)));
    }
    if (stmts.length) await this.db.batch(stmts);
  }

  async countOrgStudents(orgId) {
    const r = await this.db.prepare(
      `SELECT COUNT(DISTINCT account_id) AS n FROM account_roles WHERE org_id = ? AND product = 'learn' AND role = 'student'`
    ).bind(orgId).first();
    return r ? r.n : 0;
  }

  async isOrgMember(orgId, accountId) {
    return !!(await this.db.prepare(`SELECT 1 AS ok FROM organization_memberships WHERE org_id = ? AND account_id = ?`).bind(orgId, accountId).first());
  }
}

const INDIA_COLS = ["class_id", "admission_no", "admitted_on", "roll_no", "gender", "house", "category", "second_language", "blood_group",
  "apaar", "pen", "aadhaar", "consent_status", "consent_method", "consent_on", "consent_note", "transport", "pin", "district", "state",
  "father_name", "father_phone", "mother_name", "mother_phone", "primary_contact", "whatsapp", "language", "guardian_email",
  "guardian_name", "guardian_phone", "guardian_relation", "cwsn", "disability", "udid", "migrant", "mother_tongue", "board_roll_no", "previous_school"];
const SEAT = `INSERT INTO learn_class_students (class_id, account_id, roll_no, joined_on) VALUES (?, ?, ?, ?)
  ON CONFLICT (class_id, account_id) DO UPDATE SET roll_no = excluded.roll_no, left_on = NULL`;
const INDIA_UPSERT =
  `INSERT INTO learn_student_india (account_id, org_id, ${INDIA_COLS.join(", ")}, updated_by, created_at, updated_at)
   VALUES (?, ?, ${INDIA_COLS.map(() => "?").join(", ")}, ?, ?, ?)
   ON CONFLICT (account_id) DO UPDATE SET ${INDIA_COLS.map((c) => `${c} = excluded.${c}`).join(", ")},
     updated_by = excluded.updated_by, updated_at = excluded.updated_at`;
