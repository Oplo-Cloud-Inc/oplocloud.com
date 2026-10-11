# OEdu Admin — what the school office expects, and where OEdu stands

Checked 2026-10-11 against the deployed build (`platform-backend` + enrollment,
`d715ba0`). A feature list of a typical student-information system for private
schools — about 170 named reports and eight feature areas — was sorted into
four columns. "Have" means a real page that reads real data; a page that only
says what it will do is **Soon**.

No finance (OEdu does not do fees, billing, payments, tuition, payroll) and no
third-party vendor exports; those rows are **Out of scope**, not absent.

## Have

| Office need | Where in OEdu |
| --- | --- |
| Admissions and online enrollment, re-enrolment, document review, waitlist | Students → Enrollment, and the family view's Applications |
| Gradebook, averages, assignment and course analytics | Academics → Gradebook, Analytics |
| Report cards, progress reports, transcripts, graduation progress | Academics → Report Cards, Transcripts, Graduation |
| Student information, demographics, family, contact card | Student 360, Records, Guardians |
| Family directory, class lists, emergency information (print / CSV) | Rosters, Guardians, Data Center → Exports |
| Parent and student access | Family view; student app |
| Student documents | Students → Documents |
| Students with low grades, missing work, who needs attention | Overview, Student Support, Missing work |
| Teacher gradebooks, rubrics, curves, seating, lesson plans | Teacher console |
| Staff roster, roles and permissions | Staff → Teachers, Permissions |
| Audit log, sessions, security | Audit Log, Security |
| Transcript and graduation requirements shown per student | Graduation |

## Built in the API, page not merged

| Need | State |
| --- | --- |
| Attendance (daily and per course), marking periods, posted grades, grade-change approvals | tables and routes deployed (migration 0014); the console pages are on `claude/admin-compete`, not merged |

## Soon — a page that names the gap

| Need | What it takes |
| --- | --- |
| Discipline and behavior: incidents, merits, follow-up, teacher flag, parent visibility, alerts | a table and a page; rides on the same ownership/audit pattern as enrollment |
| Medical: allergies, immunizations and due dates, medications, screenings, insurance, visits — restricted, teacher-visible flags | restricted records; same restricted-access rule as enrollment's support notes |
| Scheduling: periods, rooms, teacher and student schedules, conflict display | a master-schedule model; OEdu has no class/section concept, so this is course-based |
| Messaging, announcements, broadcast history | a platform messaging service (none exists) |
| School calendar and class calendars | a calendar model |
| Standards and standards-based report cards | work is not tagged to standards yet |
| Imports and SIS sync, SFTP | import pipeline |
| State reporting | per-state formats |
| Inventory, lockers | not started |

## Derivable from data OEdu already holds — no new tables

Honor roll, deficiency and low-grade lists, age by grade, count by grade, gender
and demographic counts, birthday list, address and student labels, student and
family directory with chosen columns, class bell curves and assignment-type
averages (teacher side exists; a school-wide one does not), "not re-enrolled"
students (enrollment now knows), volunteer or service hours (a small table).

## Out of scope

Accounts receivable, aging, billing statements, family and student ledgers,
tuition, automatic payments, receipts, donations, lunch billing, incidental
billing, extended-care billing, childcare expenses. Vendor-specific exports
(device-management and district rostering formats) belong behind a generic
exports and API surface, which exists.

## Suggested order

1. **Office reports pack** — everything in the derivable list, printable and
   CSV, one page. Highest count of named needs, no schema.
2. **Behavior and discipline** — most-asked-for, and it needs the audit and
   visibility rules enrollment already settled.
3. **Health records** — restricted; teachers see flags, not records.
4. **Merge the attendance pages** from `claude/admin-compete`.
5. **Announcements** — needs a decision about sending (email, in-app).
