# OEdu administrative gradebook: audit and build plan

Goal: a gradebook and school-administration system that competes with Jupiter Ed and covers what US public schools (NYC especially) run on: marking periods, official grades, attendance, report cards and transcripts, and the work of counselors, deans and principals.

Audit date 2026-09-29. Findings come from reading the repo, not from running production.

## What exists (keep it, it is good)

| Area | State |
|---|---|
| Grade engine | Weighted categories, drop lowest, extra credit, late flag, excused, missing vs unmarked. Server computes every grade. |
| Audit trail | `learn_grade_events`: every change to every mark is permanent, with before/after, who, when. |
| Teacher console | Rail with Today, Assessments, Courses, Gradebook, Students, Activity, Reports, People, System. |
| Reporting | Term comments, report-card assembly, teacher "pile" of ungraded work. |
| Graduation | Credit audit against EHS rules (two tracks, transfer cap, surplus rules, GPA). |
| Assessments | 10-state lifecycle with governance and security policy. |
| Family | Guardian portal at /parent. |

## What is missing (the gap to Jupiter Ed)

| Jupiter Ed capability | OEdu today | Priority |
|---|---|---|
| **Roles: counselor, dean, principal / assistant principal, registrar** | Only `admin` and `teacher`. Console SECTIONS allow just those two. | Foundation |
| **Marking periods / terms** (Q1–Q4, S1/S2, year) with open, closed, locked | `term` is a free-text label. Nothing can be closed. | Foundation |
| **Official (posted) grades**: teacher posts to the record, principal/registrar locks | Grades are always live. No "final" state. | Foundation |
| **Grade-change requests with approval** after a period closes | None. Audit trail exists, approval flow does not. | P1 |
| **Attendance** (daily and per period, excused/unexcused, tardy, cuts) | Not present. | P1 |
| **Master schedule**: sections, periods, rooms, teacher load, student schedules | Courses only, no section or period concept. | P1 |
| **Principal dashboard**: failing counts, grade distributions by teacher/course, missing-grade compliance, attendance rates | Nothing school-wide. | P1 |
| **At-risk early warning** (failing, absent, missing work, dropping) | One stray mention. | P1 |
| **Counselor tools**: caseload, credit audit per student, 4-year plan, course requests, programme changes | Credit audit exists per student; no caseload, plans or requests. | P2 |
| **Dean tools**: incidents, discipline log, referrals, interventions | None. | P2 |
| **Standards-based grading and rubrics** | Points and percent only. | P2 |
| **Honor roll, class rank, GPA weighted/unweighted** | GPA exists; no rank list, weighting or honor roll. | P2 |
| **Progress reports and published report cards per period**, printable PDFs | Assembled on request, not published or locked. | P2 |
| **Messaging and announcements** to students and families | Not present. | P3 |
| **IEP / 504 flags and accommodations** visible to teachers (privacy-gated) | Not present. | P3 |
| **Import/export** (SIS, CSV, state reporting) | Grade import script only. | P3 |

## Design decisions to take

1. **One console for all staff (decided 2026-09-29).** Counselors, deans, principals, registrars and teachers get the same screens. Roles decide what a person may *change*, never which world they see (same rule as EFM). Screens a role cannot act on show read-only, not hidden. Every check goes through `guard.js` `can()`, as grades do today. New actions: `attendance.write`, `period.close`, `grade.approve`, `caseload.read`, `incident.write`, `dashboard.read`.
2. **A marking period is a real record**, not a label. States: `open → grading → posted → locked`. Posting freezes a grade snapshot into the record; a change after posting must go through an approval that writes to `learn_grade_events`.
3. **The published grade is a snapshot**, computed once by the server engine and stored with the policy version that produced it, so a report card printed in June says the same thing in September.
4. **One grading policy per school with per-course overrides**, defaulting to NYC public school rules (decided 2026-09-29): 0–100 scale, pass at 65, marking periods each with a posted grade. Every value is changeable per school.
5. **Privacy first**: discipline, IEP/504 and counseling notes are separate, role-gated stores with access logging. A teacher never sees a counselor's notes by default.
6. **Nothing here changes the student side.** Students and families read only what has been posted.

## Build order

**Phase 1 — foundation (the part everything else hangs on)**
1. Roles: `counselor`, `dean`, `principal`, `registrar` in accounts, guard and console rail (role-aware sections).
2. Marking periods with open/grading/posted/locked, and posting a grade snapshot.
3. Grade-change request and approval.
4. Attendance (daily plus per period) with excused/unexcused and a teacher take-attendance screen.

**Phase 2 — the views administrators actually open**
5. Principal dashboard: failing by course/teacher, missing-grade compliance, grade distribution, attendance.
6. At-risk list with the reasons, one click to the student.
7. Counselor caseload, credit audit, 4-year plan, course requests.
8. Dean incident log and interventions.
9. Published report cards and progress reports per period, print-ready.

**Phase 3 — breadth**
10. Master schedule and sections. 11. Standards/rubrics. 12. Honor roll, rank, weighted GPA. 13. Messaging. 14. IEP/504. 15. Imports and exports.

## How we will verify each phase

- **API tests**: a role that should be refused is refused (a teacher cannot post another teacher's period; a counselor cannot write grades; a dean cannot read counseling notes).
- **Recompute test**: the posted snapshot equals the live engine result at post time, and stays fixed when live marks change afterwards.
- **Browser check**: sign in as each role on a local server and confirm the rail, the empty states and the numbers against fixture data.
- **Parity checklist** against Jupiter Ed's feature list above, ticked only when the flow works end to end.

---

# Comparison: OEdu vs Jupiter Ed vs what school staff need

Jupiter column is from jupitered.com's public Gradebook and SIS pages, fetched 2026-09-29 (features Jupiter names, not verified by using it). OEdu column is from reading this repo. ✅ have · 🟡 partial · ❌ missing.

## A. Gradebook (the teacher's daily tool)

| Jupiter feature | OEdu |
|---|---|
| Points, percent, letter or rubric score entry | 🟡 points/percent only |
| Grid entry (spreadsheet) | ✅ |
| Entry by assignment, by student, seating chart | ❌ grid only |
| Custom grade scales (A–F, 4-3-2-1, E/S/N) | ❌ one fixed letter scale |
| Weighted categories | ✅ |
| Drop lowest | ✅ |
| Extra credit, late penalty | ✅ |
| Excused / missing distinct from ungraded | ✅ (better than most) |
| Minimum score (e.g. 50% floor) | ❌ |
| Curve an assignment | ❌ |
| Grade override / raise or lower by percent | ❌ |
| Cumulative grade across grading periods, weighted | ❌ (no periods) |
| Standards / learning objectives, mastery chart, curriculum map | ❌ |
| Rubrics and rubric charts | ❌ |
| Test items aligned to objectives, item analysis | ❌ |
| Grade distribution graph (mean/median) | ❌ |
| "Grade impact" of an assignment | 🟡 what-if exists, impact view does not |
| Falling-grades alert on dashboard | 🟡 teacher "pile", no alert |
| Change history on every mark | ✅ (Jupiter's is weaker) |
| Anonymous grading | ❌ |
| Online file grading, PDF/image annotation | ❌ |
| Paste blocker, edit log, lockdown for integrity | ❌ |
| Discussion participation grading | ❌ |
| Transfer grades between sections | ❌ (no sections) |
| Special-needs overrides, extended time | ❌ |
| Lesson plans scheduling and sharing | ❌ |

## B. Administration (the part this request is about)

| Jupiter feature | OEdu |
|---|---|
| Report cards, traditional or standards-based | 🟡 assembled on request, not published per period |
| Progress reports | ❌ |
| Transcripts with GPA | ✅ (EHS rules) |
| Grade reports, missing-assignment lists, class grade lists | 🟡 per teacher, not school-wide |
| Marking periods with posting and locking | ❌ |
| Attendance: period, daily, half-day | ❌ |
| Roll sheets, attendance logs, truancy notices | ❌ |
| Automated alert for forgotten roll | ❌ |
| Attendance counted into a grade | ❌ |
| Behavior: discipline logs, statistics, referrals, detention | ❌ |
| Merit / good-behavior points | ❌ |
| Scheduling and automatic scheduling | ❌ |
| Student and teacher locator | 🟡 search exists |
| Staff and parent directory | 🟡 people, guardians |
| Custom fields on students | 🟡 free-form record sections |
| Graduation requirements tracking | ✅ (EHS, strong) |
| State reporting | ❌ |
| Test analytics and score reports | ❌ |
| Textbook inventory, lockers, cafeteria | ❌ (out of scope, skip) |
| Data import/export | 🟡 scripts only |
| Communications: email, text, alerts, forums, calendar | ❌ |
| Parent portal | ✅ /parent |
| Online payments, enrolment, tuition | ❌ (out of scope, skip) |

## C. What each staff role actually opens the system to do

| Role | Their daily questions | OEdu answers it? |
|---|---|---|
| **Teacher** | Who is absent? What do I still need to mark? Who is failing? Enter a grade fast. Tell a parent. | 🟡 marks and pile yes; attendance, alerts, messaging no |
| **Counselor** | Is this student on track to graduate? Who is failing or absent a lot? What courses should they take next? Meeting notes. | 🟡 credit audit yes; caseload, at-risk, course requests, notes no |
| **Dean** | What happened today? Who has repeat incidents? Who is cutting? Detentions. | ❌ nothing |
| **Assistant principal / principal** | Which teachers have not posted grades? Failure rates by course and teacher? Attendance rate today? Any grade-change requests? | ❌ nothing school-wide |
| **Registrar** | Lock the period. Correct a record with a paper trail. Print the transcript. Enrol and withdraw. | 🟡 transcripts and history yes; periods, locks, approvals no |

## D. The honest read

- **Where OEdu is already ahead of Jupiter:** grade history with before/after and who; excused vs missing vs ungraded handled as three different things; what-if and "what do I need" for students; graduation audit; learning content that Jupiter has none of.
- **Where it is far behind:** everything after the teacher's own class. There are no marking periods, no attendance, no behavior, no school-wide reporting, no scheduling, no messaging. Those are what principals, deans and counselors buy Jupiter for, and they are the difference between a gradebook and a school system.
- **Where the gradebook itself falls short:** custom scales, curves, minimum score, standards and rubrics, cumulative grades across periods, distributions. A teacher coming from Jupiter would miss these in the first week.
- **Not worth copying:** cafeteria, lockers, textbooks, tuition and payments, enrolment applications. Skip them.

## E. Suggested cut to be at parity for a public school

1. Marking periods with post/lock, and cumulative grades. 2. Attendance. 3. School-wide dashboards: failing, missing, absent, unposted. 4. Behavior log and referrals. 5. Custom grade scales, curve, minimum score, distributions. 6. Published report cards and progress reports. 7. Standards and rubrics. 8. Messaging. 9. Scheduling. 10. State/SIS export.
