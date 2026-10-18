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
import * as submissions from "./routes/submissions.js";
import * as docs from "./routes/docs.js";
import * as progress from "./routes/progress.js";
import * as marks from "./routes/marks.js";
import * as studysets from "./routes/studysets.js";
import * as graduation from "./routes/graduation.js";
import * as reporting from "./routes/reporting.js";
import * as periods from "./routes/periods.js";
import * as attendance from "./routes/attendance.js";
import * as schedule from "./routes/schedule.js";
import * as family from "./routes/family.js";
import * as assessments from "./routes/assessments.js";
import * as efm from "./routes/efm.js";
import * as enrollment from "./routes/enrollment.js";
import * as conduct from "./routes/conduct.js";
import * as health from "./routes/health.js";
import * as facilities from "./routes/facilities.js";
import * as orders from "./routes/workorders.js";
import * as upkeep from "./routes/upkeep.js";
import * as bookings from "./routes/bookings.js";
import * as vendors from "./routes/vendors.js";
import * as inbox from "./routes/inbox.js";
import * as items from "./routes/items.js";
import * as files from "./routes/files.js";
import * as exchange from "./routes/exchange.js";
import * as district from "./routes/district.js";
import * as feeds from "./routes/feeds.js";
import * as india from "./routes/india.js";
import * as school from "./routes/school.js";
import * as register from "./routes/register.js";
import * as exams from "./routes/exams.js";
import * as certificates from "./routes/certificates.js";

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

  ["GET",    "/api/v1/efm/books",                    efm.books],
  ["POST",   "/api/v1/efm/books",                    efm.openYear],
  ["GET",    "/api/v1/efm/access",                   efm.access],
  ["PUT",    "/api/v1/efm/access",                   efm.setAccess],
  ["GET",    "/api/v1/efm/books/:bookId",            efm.book],
  ["GET",    "/api/v1/efm/books/:bookId/commands",   efm.commandsAfter],
  ["POST",   "/api/v1/efm/books/:bookId/commands",   efm.execute],

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
  ["POST",   "/api/v1/assignments/:assignmentId/submission", submissions.submit],
  ["GET",    "/api/v1/courses/:courseId/docs",               docs.list],
  ["PUT",    "/api/v1/courses/:courseId/docs/:kind/:docId",  docs.put],
  ["DELETE", "/api/v1/courses/:courseId/docs/:kind/:docId",  docs.remove],

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

  ["GET",    "/api/v1/family",                                     family.mine],
  ["GET",    "/api/v1/students/:accountId/guardians",              family.guardians],
  ["POST",   "/api/v1/students/:accountId/guardians",              family.addGuardian],
  ["DELETE", "/api/v1/students/:accountId/guardians/:guardianId",  family.removeGuardian],
  ["GET",    "/api/v1/accounts/:accountId/contact",                family.getContact],
  ["PUT",    "/api/v1/accounts/:accountId/contact",                family.putContact],
  ["GET",    "/api/v1/students/:accountId/records",                family.records],
  ["PUT",    "/api/v1/students/:accountId/records/:section",       family.putRecord],
  ["DELETE", "/api/v1/students/:accountId/records/:section",       family.clearRecord],

  ["GET",    "/api/v1/graduation",                       graduation.get],
  ["PUT",    "/api/v1/accounts/:accountId/program",      graduation.setProgram],
  ["POST",   "/api/v1/accounts/:accountId/transcripts",  graduation.importTranscript],
  ["PUT",    "/api/v1/accounts/:accountId/ehs-record",   graduation.putEhsRecord],
  ["PATCH",  "/api/v1/transcripts/:recordId",            graduation.updateRecord],
  ["PATCH",  "/api/v1/transcript-courses/:courseId",     graduation.updateCourse],

  ["GET",    "/api/v1/periods",                          periods.listPeriods],
  ["POST",   "/api/v1/periods",                          periods.createPeriod],
  ["PATCH",  "/api/v1/periods/:periodId",                periods.moveState],
  ["POST",   "/api/v1/periods/:periodId/post",           periods.postCourse],
  ["GET",    "/api/v1/periods/:periodId/posted",         periods.listPosted],
  ["GET",    "/api/v1/grade-changes",                    periods.listChanges],
  ["POST",   "/api/v1/grade-changes",                    periods.requestChange],
  ["POST",   "/api/v1/grade-changes/:changeId/decision", periods.decideChange],
  ["GET",    "/api/v1/attendance",                       periods.listAttendance],
  ["PUT",    "/api/v1/attendance",                       periods.putAttendance],
  ["GET",    "/api/v1/attendance/summary",               periods.attendanceSummary],
  ["GET",    "/api/v1/inbox",                            inbox.list],
  ["GET",    "/api/v1/inbox/unread",                     inbox.unread],
  ["POST",   "/api/v1/inbox/read",                       inbox.read],
  ["POST",   "/api/v1/inbox/archive",                    inbox.archive],
  ["GET",    "/api/v1/inbox/prefs",                      inbox.getPrefs],
  ["PUT",    "/api/v1/inbox/prefs",                      inbox.putPrefs],
  ["GET",    "/api/v1/inbox/thread/:threadId",           inbox.thread],
  ["POST",   "/api/v1/messages",                         inbox.send],
  ["POST",   "/api/v1/reminders/run",                    inbox.runNow],
  ["GET",    "/api/v1/outbox",                           inbox.outbox],
  ["POST",   "/api/v1/outbox/flush",                     inbox.flush],
  ["GET",    "/api/v1/item-kinds",                       items.kinds],
  ["GET",    "/api/v1/items",                            items.list],
  ["POST",   "/api/v1/items",                            items.create],
  ["GET",    "/api/v1/items/:itemId",                    items.get],
  ["PATCH",  "/api/v1/items/:itemId",                    items.update],
  ["DELETE", "/api/v1/items/:itemId",                    items.remove],
  ["POST",   "/api/v1/files",                            files.put],
  ["GET",    "/api/v1/files/:fileId",                    files.get],
  ["DELETE", "/api/v1/files/:fileId",                    files.remove],
  ["GET",    "/api/v1/exchange/export",                  exchange.exportRows],
  ["POST",   "/api/v1/exchange/import",                  exchange.importRows],
  ["GET",    "/api/v1/exchange/extract",                 exchange.extract],
  ["POST",   "/api/v1/exchange/webhooks/test",           exchange.testHooks],
  ["GET",    "/api/v1/feeds/link",                       feeds.link],
  ["GET",    "/api/v1/feeds/:accountId/:token/calendar.ics", feeds.calendar],
  ["GET",    "/api/v1/school/disclosure",                certificates.getDisclosure],
  ["PUT",    "/api/v1/school/disclosure",                certificates.putDisclosure],
  ["GET",    "/api/v1/public/schools/:slug/disclosure",  certificates.publicDisclosure],
  ["GET",    "/api/v1/school/profile",                   school.getProfile],
  ["PUT",    "/api/v1/school/profile",                   school.putProfile],
  ["GET",    "/api/v1/register",                         register.getRegister],
  ["PUT",    "/api/v1/register",                         register.putRegister],
  ["GET",    "/api/v1/register/classes",                 register.classes],
  ["GET",    "/api/v1/register/watch",                   register.watch],
  ["GET",    "/api/v1/register/locks",                   register.locks],
  ["POST",   "/api/v1/register/locks",                   register.addLock],
  ["GET",    "/api/v1/register/after-lock",              register.afterLock],
  ["POST",   "/api/v1/register/message",                 register.classMessage],
  ["POST",   "/api/v1/register/day",                     register.dayDone],
  ["GET",    "/api/v1/register/day-stats",               register.dayStats],
  ["GET",    "/api/v1/diary",                            register.listDiary],
  ["POST",   "/api/v1/diary",                            register.addDiary],
  ["GET",    "/api/v1/students/:accountId/diary",        register.familyDiary],
  ["GET",    "/api/v1/grading/scales",                   exams.scales],
  ["POST",   "/api/v1/grading/scales",                   exams.createScale],
  ["PUT",    "/api/v1/grading/scales/:scaleId",          exams.updateScale],
  ["DELETE", "/api/v1/grading/scales/:scaleId",          exams.deleteScale],
  ["GET",    "/api/v1/exams",                            exams.listExams],
  ["POST",   "/api/v1/exams",                            exams.createExam],
  ["GET",    "/api/v1/exams/mark-edits",                 exams.markEdits],
  ["PUT",    "/api/v1/exams/:examId",                    exams.updateExam],
  ["POST",   "/api/v1/exams/:examId/papers",             exams.addPapers],
  ["GET",    "/api/v1/exams/:examId/cards",              exams.cards],
  ["PUT",    "/api/v1/exams/:examId/cards",              exams.putCards],
  ["GET",    "/api/v1/papers",                           exams.listPapers],
  ["GET",    "/api/v1/papers/:paperId",                  exams.getPaper],
  ["PUT",    "/api/v1/papers/:paperId",                  exams.reassignPaper],
  ["PUT",    "/api/v1/papers/:paperId/marks",            exams.putMarks],
  ["POST",   "/api/v1/papers/:paperId/advance",          exams.advance],
  ["GET",    "/api/v1/students/:accountId/report-cards", exams.reportCards],
  ["GET",    "/api/v1/students/:accountId/ptm",          exams.ptmFor],
  ["GET",    "/api/v1/ptm",                              exams.listPtm],
  ["POST",   "/api/v1/ptm",                              exams.createPtm],
  ["GET",    "/api/v1/ptm/:ptmId",                       exams.getPtm],
  ["POST",   "/api/v1/ptm/:ptmId/book",                  exams.bookPtm],
  ["POST",   "/api/v1/ptm/:ptmId/release",               exams.releasePtm],
  ["GET",    "/api/v1/india/classes",                    india.classes],
  ["PUT",    "/api/v1/india/classes",                    india.putClass],
  ["GET",    "/api/v1/india/students",                   india.students],
  ["GET",    "/api/v1/india/unplaced",                   india.unplaced],
  ["POST",   "/api/v1/india/classes/:classId/students",  india.seat],
  ["POST",   "/api/v1/india/classes/:classId/rolls",     india.numberRolls],
  ["POST",   "/api/v1/india/classes/:classId/promote",   india.promote],
  ["POST",   "/api/v1/students/:accountId/leave",        india.leave],
  ["GET",    "/api/v1/students/:accountId/classes",      india.classHistory],
  ["GET",    "/api/v1/india/compliance",                 india.compliance],
  ["GET",    "/api/v1/india/export/:kind",               india.exportKind],
  ["POST",   "/api/v1/india/import",                     india.importRows],
  ["GET",    "/api/v1/students/:accountId/india",        india.getStudent],
  ["PUT",    "/api/v1/students/:accountId/india",        india.putStudent],
  ["GET",    "/api/v1/district/summary",                 district.summary],
  ["PATCH",  "/api/v1/district/schools/:orgId",          district.join],
  ["GET",    "/api/v1/attendance/codes",                 attendance.getCodes],
  ["GET",    "/api/v1/attendance/ada",                   attendance.ada],
  ["GET",    "/api/v1/attendance/review",                attendance.review],
  ["GET",    "/api/v1/attendance/log",                   attendance.log],
  ["GET",    "/api/v1/attendance/settings",              attendance.getSettings],
  ["PUT",    "/api/v1/attendance/settings",              attendance.putSettings],
  ["POST",   "/api/v1/attendance/remove",                attendance.remove],
  ["POST",   "/api/v1/courses/:courseId/attendance-grade", attendance.gradeAttendance],

  // The schedule: courses, sections, bell schedules, the calendar, a day's timetable.
  ["GET",    "/api/v1/subjects",                         schedule.listSubjects],
  ["POST",   "/api/v1/subjects",                         schedule.createSubject],
  ["PATCH",  "/api/v1/subjects/:subjectId",              schedule.updateSubject],
  ["GET",    "/api/v1/sections",                         schedule.listSections],
  ["POST",   "/api/v1/sections",                         schedule.createSection],
  ["PUT",    "/api/v1/sections/:courseId",               schedule.putSection],
  ["POST",   "/api/v1/sections/:courseId/students",      schedule.addStudents],
  ["POST",   "/api/v1/sections/:courseId/drop",          schedule.dropStudents],
  ["GET",    "/api/v1/students/:accountId/sections",     schedule.studentSections],
  ["GET",    "/api/v1/bell-schedules",                   schedule.listBell],
  ["POST",   "/api/v1/bell-schedules",                   schedule.createBell],
  ["PATCH",  "/api/v1/bell-schedules/:scheduleId",       schedule.updateBell],
  ["DELETE", "/api/v1/bell-schedules/:scheduleId",       schedule.deleteBell],
  ["POST",   "/api/v1/bell-schedules/:scheduleId/weekdays", schedule.weekdays],
  ["GET",    "/api/v1/calendar",                         schedule.getCalendar],
  ["PUT",    "/api/v1/calendar/pattern",                 schedule.putPattern],
  ["PUT",    "/api/v1/calendar/days",                    schedule.putDays],
  ["GET",    "/api/v1/schedule/day",                     schedule.scheduleDay],
  ["GET",    "/api/v1/schedule/mine",                    schedule.scheduleMine],
  ["GET",    "/api/v1/schedule/drafts",                  schedule.listDrafts],
  ["POST",   "/api/v1/schedule/drafts",                  schedule.createDraft],
  ["GET",    "/api/v1/schedule/drafts/:draftId",         schedule.getDraft],
  ["DELETE", "/api/v1/schedule/drafts/:draftId",         schedule.deleteDraft],
  ["POST",   "/api/v1/schedule/drafts/:draftId/sections", schedule.addDraftSection],
  ["PUT",    "/api/v1/schedule/drafts/:draftId/sections/:sectionId", schedule.putDraftSection],
  ["DELETE", "/api/v1/schedule/drafts/:draftId/sections/:sectionId", schedule.deleteDraftSection],
  ["POST",   "/api/v1/schedule/drafts/:draftId/sections/:sectionId/students", schedule.draftStudents],
  ["GET",    "/api/v1/schedule/drafts/:draftId/publish", schedule.previewPublish],
  ["POST",   "/api/v1/schedule/drafts/:draftId/publish", schedule.publishDraft],
  ["POST",   "/api/v1/schedule/drafts/:draftId/build",   schedule.buildDraft],
  ["GET",    "/api/v1/schedule/analyze",                 schedule.analyze],
  ["POST",   "/api/v1/sections/archive",                 schedule.archiveSections],
  ["GET",    "/api/v1/course-requests",                  schedule.getRequests],
  ["PUT",    "/api/v1/course-requests/:accountId",       schedule.putRequests],

  ["GET",    "/api/v1/marks",           marks.list],
  ["POST",   "/api/v1/marks",           marks.put],
  ["DELETE", "/api/v1/marks/:markId",   marks.remove],

  ["GET",    "/api/v1/progress", progress.list],
  ["PUT",    "/api/v1/progress", progress.put],
  ["GET",    "/api/v1/gamification/standing", progress.standing],
  ["POST",   "/api/v1/gamification/events",   progress.events],

  ["GET",    "/api/v1/conduct",                     conduct.list],
  ["POST",   "/api/v1/conduct",                     conduct.create],
  ["GET",    "/api/v1/conduct/summary",             conduct.summary],
  ["GET",    "/api/v1/conduct/:conductId",          conduct.get],
  ["PATCH",  "/api/v1/conduct/:conductId",          conduct.update],
  ["POST",   "/api/v1/conduct/:conductId/actions/:action", conduct.act],
  ["GET",    "/api/v1/health-records",                      health.list],
  ["POST",   "/api/v1/health-records",                      health.create],
  ["GET",    "/api/v1/health-records/summary",              health.summary],
  ["GET",    "/api/v1/health-records/flags",                health.flags],
  ["PATCH",  "/api/v1/health-records/:healthId",            health.update],
  ["GET",    "/api/v1/health-records/:healthId/history",    health.history],

  ["GET",    "/api/v1/facilities/summary",                          facilities.summary],
  ["GET",    "/api/v1/facilities/team",                             facilities.team],
  ["GET",    "/api/v1/facilities/reports",                          facilities.reports],
  ["GET",    "/api/v1/facilities/templates",                        upkeep.templates],
  ["GET",    "/api/v1/facilities/spaces",                           facilities.listSpaces],
  ["POST",   "/api/v1/facilities/spaces",                           facilities.createSpace],
  ["PUT",    "/api/v1/facilities/spaces/rules",                     facilities.bulkRules],
  ["GET",    "/api/v1/facilities/spaces/:spaceId",                  facilities.getSpace],
  ["PATCH",  "/api/v1/facilities/spaces/:spaceId",                  facilities.updateSpace],
  ["POST",   "/api/v1/facilities/spaces/:spaceId/count",            facilities.countSpace],
  ["GET",    "/api/v1/facilities/assets",                           facilities.listAssets],
  ["POST",   "/api/v1/facilities/assets",                           facilities.createAsset],
  ["GET",    "/api/v1/facilities/assets/:assetId",                  facilities.getAsset],
  ["PATCH",  "/api/v1/facilities/assets/:assetId",                  facilities.updateAsset],
  ["GET",    "/api/v1/facilities/orders",                           orders.list],
  ["POST",   "/api/v1/facilities/orders",                           orders.create],
  ["GET",    "/api/v1/facilities/orders/:orderId",                  orders.get],
  ["PATCH",  "/api/v1/facilities/orders/:orderId",                  orders.update],
  ["POST",   "/api/v1/facilities/orders/:orderId/actions/:action",  orders.act],
  ["POST",   "/api/v1/facilities/orders/:orderId/files",            orders.putFile],
  ["GET",    "/api/v1/facilities/orders/:orderId/files/:fileId",    orders.getFile],
  ["GET",    "/api/v1/facilities/schedules",                        upkeep.list],
  ["POST",   "/api/v1/facilities/schedules",                        upkeep.create],
  ["GET",    "/api/v1/facilities/schedules/:scheduleId",            upkeep.get],
  ["PATCH",  "/api/v1/facilities/schedules/:scheduleId",            upkeep.update],
  ["POST",   "/api/v1/facilities/schedules/:scheduleId/actions/:action", upkeep.act],
  ["GET",    "/api/v1/facilities/bookings",                         bookings.list],
  ["POST",   "/api/v1/facilities/bookings",                         bookings.create],
  ["POST",   "/api/v1/facilities/bookings/:bookingId/actions/:action", bookings.act],
  ["GET",    "/api/v1/facilities/vendors",                          vendors.listVendors],
  ["POST",   "/api/v1/facilities/vendors",                          vendors.createVendor],
  ["GET",    "/api/v1/facilities/vendors/:vendorId",                vendors.getVendor],
  ["PATCH",  "/api/v1/facilities/vendors/:vendorId",                vendors.updateVendor],
  ["GET",    "/api/v1/facilities/documents",                        vendors.listDocuments],
  ["POST",   "/api/v1/facilities/documents",                        vendors.createDocument],
  ["PATCH",  "/api/v1/facilities/documents/:documentId",            vendors.updateDocument],
  ["POST",   "/api/v1/facilities/documents/:documentId/file",       vendors.putDocumentFile],
  ["GET",    "/api/v1/facilities/documents/:documentId/file",       vendors.getDocumentFile],
  ["GET",    "/api/v1/enrollment/settings",         enrollment.getSettings],
  ["PUT",    "/api/v1/enrollment/settings",         enrollment.putSettings],
  ["GET",    "/api/v1/enrollment/team",             enrollment.team],
  ["GET",    "/api/v1/enrollment/summary",          enrollment.summary],
  ["GET",    "/api/v1/enrollment/lookup",           enrollment.lookup],
  ["POST",   "/api/v1/enrollment/reenrol",          enrollment.reenrol],
  ["GET",    "/api/v1/applications",                enrollment.list],
  ["POST",   "/api/v1/applications",                enrollment.create],
  ["POST",   "/api/v1/applications/bulk",           enrollment.bulk],
  ["GET",    "/api/v1/applications/:applicationId", enrollment.get],
  ["PATCH",  "/api/v1/applications/:applicationId", enrollment.update],
  ["POST",   "/api/v1/applications/:applicationId/actions/:action",           enrollment.act],
  ["PUT",    "/api/v1/applications/:applicationId/documents/:key",            enrollment.putDocument],
  ["POST",   "/api/v1/applications/:applicationId/documents/:key/file",       enrollment.putFile],
  ["GET",    "/api/v1/applications/:applicationId/documents/:key/file",       enrollment.getFile],
  ["GET",    "/api/v1/family/applications",         enrollment.mine],
  ["GET",    "/api/v1/enrollments",                 enrollment.listEnrollments],
  ["POST",   "/api/v1/enrollments/:enrollmentId/actions/:action", enrollment.enrollmentAct],

  ["GET",    "/api/v1/assessments",                 assessments.list],
  ["GET",    "/api/v1/assessments/:assessmentId",   assessments.get],
  ["PUT",    "/api/v1/assessments/:assessmentId",   assessments.put]
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
  /* The Worker's own clock: reminders for every school, twice an hour. Each
     reminder is made once per person per key, so a repeat says nothing twice. */
  async scheduled(event, env, executionCtx) {
    if (!env.DB) return;
    const repo = new D1Repository(env.DB);
    const { runReminders } = await import("./routes/inbox.js");
    const { flushOutbox } = await import("./services/notify.js");
    const orgs = await env.DB.prepare(`SELECT id FROM organizations WHERE kind = 'school'`).all();
    for (const o of orgs.results || []) {
      executionCtx.waitUntil(runReminders(repo, env, o.id).then(() => flushOutbox(repo, env, o.id)).catch(() => {}));
    }
  },

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
        rotate: null,
        // Handlers written as (ctx) read their route params here; the rest take them as a second argument.
        params: found.params
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
