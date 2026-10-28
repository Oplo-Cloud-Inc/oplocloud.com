// The write routes of the modules that have moved to the new frame, and the audit row each one writes (O17).
// check-audit.mjs reads this file. A route is written here the way a proof calls it: METHOD, then the path after /api/v1.
//
//   COVERED  the paths a migrated module's pages write to; every write route under one must be named below
//   AUDITED  route -> the audit action(s) it writes. A proof asserts the row with audited() from lib-prove.mjs, which fails
//            when the log did not grow; check-audit.mjs fails when no proof does
//   NOT_YET  a write route under COVERED that no migrated page calls, and why. It moves to AUDITED when its page migrates

export const COVERED = ["/directory", "/india", "/students/:accountId/india", "/students/:accountId/leave", "/school/modules", "/school/profile"];

export const AUDITED = {
  "POST /directory/students": "students.record.created",
  "POST /directory/students/bulk/house": "students.record.changed",
  "POST /directory/students/bulk/message": "communicate.message.sent",
  "POST /directory/students/:accountId/phone": "students.guardian.phone_revealed",
  "GET /directory/students/export": "students.directory.exported",
  "POST /directory/guardians": "students.guardian.created",
  "POST /directory/guardians/:guardianId/phone": "students.guardian.phone_revealed",
  "PUT /india/classes": ["students.class.created", "students.class.changed"],
  "POST /india/classes/:classId/students": "students.class.seated",
  "POST /india/classes/:classId/rolls": "students.record.changed",
  "POST /india/classes/:classId/promote": "students.class.promoted",
  "PUT /students/:accountId/india": "students.record.changed",
  "PUT /school/modules": "admin.modules.changed"
};

export const NOT_YET = {
  "POST /india/import": "the school's file load is still the old Import page",
  "POST /students/:accountId/leave": "no migrated page marks a child as having left yet",
  "PUT /school/profile": "Settings > General is still the old System page"
};
