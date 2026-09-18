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
         (id, course_id, title, category, out_of, due_at, extra_credit, status,
          created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)`
    ).bind(assignmentId, data.courseId, data.title, data.category || null,
           data.outOf ?? 100, data.dueAt || null, data.extraCredit ? 1 : 0,
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
                      note, gradedBy }) {
    const before = await this.db.prepare(
      `SELECT * FROM learn_grades WHERE assignment_id = ? AND account_id = ?`
    ).bind(assignmentId, accountId).first();
    const t = now();

    if (!before) {
      const gradeId = id("grd");
      await this.db.prepare(
        `INSERT INTO learn_grades
           (id, assignment_id, account_id, score, out_of, status, late, feedback,
            graded_by, graded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(gradeId, assignmentId, accountId, score ?? null, outOf ?? 100,
             status || "marked", late ? 1 : 0, feedback ?? null, gradedBy || null, t).run();
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
}
