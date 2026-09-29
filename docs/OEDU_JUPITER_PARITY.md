# OEdu Admin vs Jupiter Ed — private K–12 SIS

Checked 2026-09-29 against the feature list on <https://www.jupitered.com/SIS_private.php>, item by item, reading the OEdu code (branch `claude/admin-console`), not its descriptions.

**Live**: an administrator can do it in the console today, with real data. **Partial**: part of it is real, and the rest is named below. **Stub**: the console has an honest "not set up yet" page for it. **Absent**: nothing yet.

## Grade reports

| Jupiter | OEdu | Where / what is missing |
|---|---|---|
| Report cards (traditional) | Live | Academics › Report Cards: every student's readiness; the report itself |
| Report cards (standards-based) | Absent | Needs standards (see Standards) |
| Progress reports | Live | Report Cards › Progress reports; printable, one page per student |
| Transcripts | Live | Academics › Transcripts: diploma-record marks plus this year; sheet, CSV |
| Weighted and unweighted GPA | Partial | Unweighted current and cumulative are live. Weighted needs honors/AP weights on courses |
| Grade reports | Live | Gradebook drill-down: School › Department › Course › Student |
| Missing assignments | Live | Missing work: by student, by course, or every piece; CSV |
| Class grade lists | Live | Rosters, and Print class lists (one page per course) |
| Gradebook spreadsheet | Live | Gradebook › Open the full gradebook |
| GPA / eligibility | Partial | Eligibility is live, with a fixed rule: pass every course and GPA ≥ 2.0. The school cannot set its own rule yet |
| Standards proficiency | Stub | Work is not tagged to standards yet |

## Test scores and test analytics

| Jupiter | OEdu | Where / what is missing |
|---|---|---|
| List scores by test and by student | Live | Analytics › Assessments: each assessment; By student |
| Bar charts | Live | Every analytics page |
| Proficiency bands | Partial | Score bands (90+, 80s …), not state proficiency levels |
| Analyze class and school exams | Live | Tests and quizzes from every gradebook |
| Analyze state exams | Partial | Regents results live on each diploma record; no school-wide view |
| Compare teachers | Live | Compare two groups (teacher, course or department), and Staff › Teacher Analytics |
| Statistical significance (t-test) | Live | Welch's t-test with p-value and effect size, checked against textbook values |
| Longitudinal comparison | Partial | This year, week by week. Earlier years exist only on transcripts |
| Compare schools | Absent | One school per console |
| Compare by gender, race/ethnicity, IEP | Absent | Not recorded on accounts |
| Teachers compare their own results to the school | Absent | Teacher console |
| Pre-tests and control groups | Absent | No baseline assessment is recorded |

## Graduation

| Jupiter | OEdu | Where / what is missing |
|---|---|---|
| Track progress, find what's missing | Live | Academics › Graduation; Student 360 › Graduation (requirements, gaps, courses that count) |
| Find students off track | Live | Graduation › Off track: projected finish later than the program's expected date |
| Plan every class a student needs | Partial | The gaps and the courses that would count are shown; there is no plan builder |
| Honors tracks, college requirements | Absent | |

## Records, directories, student reports

| Jupiter | OEdu | Where / what is missing |
|---|---|---|
| Records and reports | Live | Students › Records; Student 360 |
| Staff directory | Live | Staff › Teachers, Print directory; Permissions lists every account |
| Parent directory | Live | Guardians › Parent directory: print, CSV |
| Student emergency info | Live | Records › Print emergency info, CSV |
| Class and school rosters | Live | Rosters, including Whole school |
| Student counts | Live | Enrollment; Analytics › Groups |
| Passwords for students and parents | Partial | Set when an account is created. Only the owner changes it afterwards (by design) |
| Role-based security | Partial | Roles are enforced on the server. No custom restrictions |
| Parent portal | Live | Family view (/parent) |
| Documents / Google Drive | Partial | A documents section on each record. No file storage |
| Custom fields, with per-field view/edit rights | Absent | Needs backend |
| Student and teacher locator, locator cards, schedules, seating charts | Absent | Need scheduling |
| Student and parent login stats | Absent | Sessions are visible to their owner only |

## Attendance, behavior, scheduling, operations, state reporting

| Jupiter | OEdu |
|---|---|
| Attendance: period, daily and half-day; roll alerts; truancy; ADA; codes; roll audit | Stub. Another chat has periods and attendance tables in progress (uncommitted, not deployed) |
| Discipline: logs, stats, merit points, codes, referrals, parent alerts, detention | Stub |
| Automatic scheduling: requests, balancing, drafts, walk-ins | Stub |
| Cafeteria: menus, lunch counts, payments | Stub |
| Inventory: textbooks, devices, check-out, lost/damaged | Stub |
| Lockers | Stub |
| State reporting (New York SIRS and 18 other states) | Stub. Needs attendance and scheduling first |

## Data integration

| Jupiter | OEdu |
|---|---|
| Export grades, transcripts, assignments, scores | Live: Data Center › Exports; Transcripts |
| Export staff, courses, rosters | Live |
| Export students and contacts | Partial: students CSV, plus contacts through emergency info and the parent directory |
| Export attendance, behavior, fees, forms, logins | Absent (no such records) |
| Import students, staff, courses, sections, rosters, standards, test questions, test scores | Stub. What exists today: one person at a time, and a previous school's transcript per student |
| Scheduled SFTP, Clever sync, custom import formats | Stub |

## Security and reliability

| Jupiter | OEdu |
|---|---|
| Encrypted connections | Live: the session cookie is Secure in production |
| XSS, SQL injection, brute-force defenses | Live: output escaping; bound query parameters; sign-in rate limits |
| Audit log of grade changes, and undo | Live: Audit Log, now with Undo. The undo is logged too |
| Auto save | Live: each mark is saved as it is entered |
| One data model, not synced apps | Live: one API and one database behind admin, teacher, student and family |
| Two-factor sign-in, suspicious-login alerts, cross-referenced access logs | Absent |
| Automatic logout (configurable) | Absent: sessions last 30 days |
| Content security policy | Absent |
| Stated backup schedule, undelete, offline access | Absent |
| Mobile app | Absent: the console is desktop-first, by decision |

## What it would take to close the rest (all need backend)

1. **Periods, then attendance, then scheduling.** Attendance and state reporting both depend on these. Another chat has started the tables.
2. **Standards.** Standards-based report cards, standards proficiency and standards analytics all wait on work being tagged to standards.
3. **Imports and Clever / OneRoster sync**, after sign-in invitations exist.
4. **Custom fields with per-field permissions.** Demographic groups for analytics are a use of these.
5. **Account security:** two-step sign-in, suspicious-login alerts, a configurable idle sign-out, and a content security policy.
6. **Behavior**, then school operations: inventory, lockers, cafeteria.
