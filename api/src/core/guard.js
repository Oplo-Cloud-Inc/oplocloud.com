/* ==========================================================================
   Authorization — "what are you allowed to do?"

   Every permission decision in this API is made here. Not in a route, not in
   a service, and never in the frontend. A hidden button is a courtesy to the
   user; it is not a control, because the same page ships with a console.

   The shape is one function:

       await can(ctx, action, resource)

   which returns true or false, and `must(...)`, which throws 403 with a
   sentence naming the rule. Naming the rule matters: "you do not have
   permission" tells somebody nothing, while "you are not a teacher on this
   course" tells them who to ask.

   ------------------------------------------------------------------- Roles

   Product-scoped, because one account holds different roles in different
   products and different organizations:

     learn.student   their own work
     learn.teacher   the courses they teach, and the students in them
     learn.author    content they wrote
     learn.admin     everything inside their organization
     platform.admin  everything, everywhere

   The teacher rule is the load-bearing one and it is deliberately narrow: a
   teacher acts on a course they teach. Not on all courses, and not on a
   student who merely shares an organization with them. Widening that is one
   line in this file rather than an audit of every route.
   ========================================================================== */

import { ApiError } from "../lib/http.js";

export const ACTIONS = [
  "account.read", "account.write", "account.create",
  "org.manage",
  "course.read", "course.write", "course.create", "course.enrol",
  "assignment.write",
  "set.read", "set.write", "set.create",
  "grade.read", "grade.write",
  "progress.read", "progress.write",
  "role.grant"
];

function hasRole(actor, product, role, orgId) {
  if (!actor || !actor.roles) return false;
  return actor.roles.some((r) =>
    r.product === product && r.role === role &&
    (orgId == null || r.org_id == null || r.org_id === orgId));
}

export const isPlatformAdmin = (actor) => hasRole(actor, "platform", "admin");
export const isLearnAdmin = (actor, orgId) =>
  isPlatformAdmin(actor) || hasRole(actor, "learn", "admin", orgId);

/* Whether the actor teaches a given course. This is a database question, not
   a claim in a token, which is the whole point — a role in a session that has
   gone stale must not outlive the enrolment it describes. */
async function teachesCourse(ctx, actor, courseId) {
  if (!actor || !courseId) return false;
  const m = await ctx.repo.courseMembership(courseId, actor.id);
  return !!m && (m.role === "teacher" || m.role === "assistant");
}

async function studiesCourse(ctx, actor, courseId) {
  if (!actor || !courseId) return false;
  const m = await ctx.repo.courseMembership(courseId, actor.id);
  return !!m && m.role === "student";
}

/* Whether the actor teaches any course this student is enrolled in. This is
   what "their students" means: a teaching relationship through a course, not
   a roster somebody typed. */
export async function teachesStudent(ctx, actor, studentId) {
  if (!actor || !studentId) return false;
  if (actor.id === studentId) return false;
  const mine = await ctx.repo.listCourses({ accountId: actor.id });
  const teaching = mine.filter((c) => c.my_role === "teacher" || c.my_role === "assistant");
  if (!teaching.length) return false;
  const theirs = await ctx.repo.listCourses({ accountId: studentId });
  const theirIds = new Set(theirs.filter((c) => c.my_role === "student").map((c) => c.id));
  return teaching.some((c) => theirIds.has(c.id));
}

export async function can(ctx, action, resource = {}) {
  const actor = ctx.actor;
  if (!actor) return false;
  if (isPlatformAdmin(actor)) return true;

  const orgId = resource.orgId ?? resource.org_id ?? null;
  const learnAdmin = isLearnAdmin(actor, orgId);

  switch (action) {
    /* -------------------------------------------------------- Accounts */
    case "account.read":
      if (resource.accountId === actor.id) return true;
      if (learnAdmin) return true;
      return teachesStudent(ctx, actor, resource.accountId);

    case "account.write":
      // A person edits their own profile. Changing somebody else's is an
      // administrative act, never a teaching one.
      return resource.accountId === actor.id || learnAdmin;

    case "account.create":
    case "role.grant":
    case "org.manage":
      return learnAdmin;

    /* --------------------------------------------------------- Courses */
    case "course.read":
      if (learnAdmin) return true;
      if (resource.status === "published") return true;
      return (await teachesCourse(ctx, actor, resource.id)) ||
             (await studiesCourse(ctx, actor, resource.id));

    case "course.create":
      return learnAdmin || hasRole(actor, "learn", "teacher") ||
             hasRole(actor, "learn", "author");

    case "course.write":
      if (learnAdmin) return true;
      // An author owns what they wrote; a teacher may edit a course they
      // teach. Neither may touch a course they have no relationship to.
      if (resource.created_by === actor.id) return true;
      return teachesCourse(ctx, actor, resource.id);

    case "course.enrol":
      return learnAdmin || (await teachesCourse(ctx, actor, resource.courseId));

    case "assignment.write":
      return learnAdmin || (await teachesCourse(ctx, actor, resource.courseId));

    /* ----------------------------------------------------- Study sets
       Readable by the people it was written for: the course it belongs to,
       the organization if it was published that way, or the author alone.
       A draft is nobody's but its author's — an author fixing a typo should
       not be broadcasting a half-written set to a class. */
    case "set.read": {
      if (resource.created_by === actor.id) return true;
      if (resource.status !== "published") return false;
      if (learnAdmin) return true;
      if (resource.visibility === "org") {
        return (actor.orgs || []).some((o) => o.org_id === resource.org_id);
      }
      if (resource.visibility === "course" && resource.course_id) {
        return !!(await ctx.repo.courseMembership(resource.course_id, actor.id));
      }
      return false;
    }

    case "set.create":
      return learnAdmin || hasRole(actor, "learn", "teacher") ||
             hasRole(actor, "learn", "author");

    case "set.write":
      if (learnAdmin) return true;
      if (resource.created_by === actor.id) return true;
      // A teacher of the course a set is attached to can maintain it, so a
      // set does not die with the teacher who happened to write it.
      return resource.course_id
        ? teachesCourse(ctx, actor, resource.course_id)
        : false;

    /* ---------------------------------------------------------- Grades
       The asymmetry here is the entire point of having this file. A student
       may READ their own grade and may never WRITE one — not their own, not
       anybody's. There is no branch below that lets them. */
    case "grade.read":
      if (resource.accountId === actor.id) return true;
      if (learnAdmin) return true;
      return teachesCourse(ctx, actor, resource.courseId);

    case "grade.write":
      return learnAdmin || (await teachesCourse(ctx, actor, resource.courseId));

    /* -------------------------------------------------------- Progress
       A student's own work, which they write and their teachers read. Note
       that a teacher cannot write it: progress is evidence of what a student
       did, and evidence somebody else can edit is not evidence. */
    case "progress.read":
      if (resource.accountId === actor.id) return true;
      if (learnAdmin) return true;
      return teachesStudent(ctx, actor, resource.accountId);

    case "progress.write":
      return resource.accountId === actor.id;

    default:
      return false;
  }
}

/* The sentence shown when the answer is no. It names the rule rather than the
   refusal, and it deliberately does not confirm that the resource exists —
   "you are not a teacher on this course" is safe; "no such course" combined
   with a 403 elsewhere would let somebody enumerate. */
const REASONS = {
  "account.read": "You can only see your own account and the students you teach.",
  "account.write": "You can only change your own profile. An administrator can change others.",
  "account.create": "Only administrators can add people.",
  "org.manage": "Only administrators can change the organization.",
  "course.write": "You can only edit courses you teach or wrote.",
  "course.create": "Only teachers, authors and administrators can create courses.",
  "course.enrol": "You can only enrol students into courses you teach.",
  "assignment.write": "You can only set work on courses you teach.",
  "set.read": "That study set has not been shared with you.",
  "set.create": "Only teachers, authors and administrators can write study sets.",
  "set.write": "You can only edit study sets you wrote, or ones attached to a course you teach.",
  "grade.read": "You can only see your own grades and those of students you teach.",
  "grade.write": "You can only enter grades for courses you teach. Students cannot change grades.",
  "progress.read": "You can only see your own progress and that of students you teach.",
  "progress.write": "Progress is written by the student it belongs to, and by nobody else.",
  "role.grant": "Only administrators can change roles."
};

export async function must(ctx, action, resource = {}) {
  if (await can(ctx, action, resource)) return true;
  if (!ctx.actor) throw ApiError.unauthorized();
  throw ApiError.forbidden(REASONS[action] || "You do not have access to that.");
}
