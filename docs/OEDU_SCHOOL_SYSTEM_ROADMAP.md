# OEdu — the school system roadmap

Written 2026-10-12 from the administrator and teacher guides pasted into the
attendance session (attendance grades, attendance setup, bell schedules,
New York's SIRS page, scheduling, detention, discipline and referrals, test scores
and analytics, seating charts, staff accounts, special education, team teaching,
substitutes, gradebooks and terms, staff directory, monitoring staff, grade
troubleshooting, grade scales and special marks, categories, cumulative grades,
grading defaults, standards, rubrics, citizenship and effort, grades that do not
count, drop low scores, override and curve, class averages, assignments, weights,
extra credit, penalties, combined classes, hidden work, sort order, missing work,
curriculum maps, turned-in files, cheating and AI).

Each topic was set against the code on both lines of the repository
(`origin/platform-backend`, which is what edu serves, and `origin/main`), not
against any description of it.

## 0. Read this first

**Two things are true at once.**

1. **A great deal of what you pasted is already built, and is not live.** The
   teacher console at gradebook parity (20 panels: scales, special marks,
   categories, drop lowest, curves, rubrics, what-if, overrides, seating, lesson
   plans, announcements, standards, curriculum map) was built and shipped on
   2026-10-04, then replaced on 2026-10-12 when the facilities build was deployed
   from the other line. Live edu returns 404 for `teach.js` today. `main` and
   `platform-backend` have diverged (25 commits vs 10); they conflict in five
   files, 13 hunks, and the conflicts are small. **Until they are one line, every
   plan below is partly guessing what is live.**
2. **Three of the guides contradicted a rule written down on purpose**
   (`OEdu-Architecture.md` §2.1: no class, section or period). On 2026-10-12 the
   owner decided: sections and periods come back as the guides describe them.
   §2.1 now says so, and why a section is still the course's own row.

## 1. The rules this plan keeps

These are standing decisions, not preferences of mine. Each slice below is held to them.

| Rule | What it means for the work |
|---|---|
| The course is the only unit | A Jupiter *section* is an OEdu *course* (one roster, its teachers, its work and marks). A Jupiter *course* is the catalogue course. Nothing here adds a second object |
| No finance | Fees, lab fees, payments, tuition: marked out of scope every time they appear in a guide |
| No other company's name or trademark on our sites | The guides are research. Nothing from them is quoted on a page |
| Nothing is locked | Students may go to any lesson or unit. Admin *lock* means "the record is closed to edits", never "the student cannot proceed" |
| The server decides who may | Every screen draws what it was given; the guard (`api/src/core/guard.js`) is the only place access is decided |
| Teach step by step; small habits | Applies to lessons, and to how a screen asks a person to act: one move, a clear result |
| OEdu sends no messages | Email and text are an open infrastructure decision (D3). Until then: an in-app inbox |
| Desktop and laptop first | A phone is its own page, never the desktop squeezed (the jobs page is the model) |
| One slice, one proof | Each slice ends with a re-runnable script over HTTP, the way `prove-care.mjs` and `prove-attendance.mjs` do, and the neighbours' proofs still pass |
| Migrations are additive | A new table or column; nothing existing is rewritten in place. Rollback is the previous Worker version |

## 2. The status map

**Live** = on edu now. **On main** = built and verified, absent from live until the lines are joined.
**Built, not shipped** = finished here (the attendance admin screen, commit `e8ac3fb`), waiting on a deploy.
**Partial / Absent** as before. **Rule** = held back by a rule in §1.

### Attendance

| Topic in the guides | State | Where it stands |
|---|---|---|
| Registers by date, correct one, student record, bulk excuse, audit log, find errors, online access | **Built, not shipped** | `docs/OEDU_ADMIN_ATTENDANCE.md`; migration `0020`; 16-step proof |
| Teacher takes roll | **Built, not shipped** | Teacher console › Attendance: their courses for a day, the same register. From the seating chart: waits for the seating chart (on `main`) |
| Customisable attendance codes: the first is the default; each counts as present / tardy / absent / not enrolled separately for report cards, average daily attendance and state reporting | **Built, not shipped** | Settings › Attendance codes: any number, each of a kind; totals by kind; retire, never delete. Half-day codes wait for meeting minutes |
| Attendance methods: daily, period, class | Partial | OEdu's is *class* attendance (one register per course per day). Daily needs a homeroom on the student; period needs D1 |
| Half days; minutes present for a full or half day; minimum days | **Built, not shipped** | Attendance › Settings › Whole days and half days: the minutes for each. A day is worth a whole, a half or nothing by the minutes in the room, taken from the periods a student's sections meet in; a student there for all of a minimum day is given a half |
| Average daily attendance | **Built, not shipped** | Attendance › Daily attendance: a rate for each school day and for the span, from the same registers, the school's codes and the calendar. By minutes when the school sets them; otherwise a day is whole when a student was marked in any course. A day nobody took a register for counts as nobody present |
| Restrict teachers: homeroom only; roll reminders; no edits after N days; admin-only codes | Partial | **Built, not shipped:** edit window; no future days; Office-only codes; marks the office set. Homeroom needs a homeroom field; reminders need the inbox |
| Attendance grades: a generated "Attendance" column from penalties and waived infractions, points or adjusted percents, refreshed on demand, one per grading period | **Built, not shipped** (points modes) | Teacher › Attendance › Grade attendance: start-with, take-off-the-total, earn-for-presence; which codes count; waive the first few. Adjust percents needs the engine on `main` |
| Remote attendance from sign-ins | Absent | Sign-in events are not recorded (see staff monitoring) |

### Calendar, schedule and courses

| Topic | State | Where it stands |
|---|---|---|
| School days: school / holiday / staff day / canceled | **Built, not shipped** | Schedule › School Days: a usual week, a month grid, a date or a span set to holiday, staff day, canceled, or a bell schedule; migration `0021` |
| Bell schedules; minimum days; A/B days; legacy schedules for past dates | **Built, not shipped** | Schedule › Bell Schedules: named days of labelled periods with optional times and a minimum-day flag; the weekday shortcut makes M1…F7 from one. Past dates keep the schedule they ran |
| Course settings: extracurricular; counts for attendance; on report cards; on transcripts; college GPA; duration; credits; GPA scale; grad requirement; capacity; approval; order | **Built, not shipped** | Schedule › Courses (the subject a section is of). **Fee: out of scope** |
| Sections: teacher, co-teachers, period, room, capacity, section number, homeroom | **Built, not shipped** | Schedule › Sections: a list, a master grid by period, teachers and co-teachers, periods (several for a block or a rotating day), room, capacity, tab, roster. A section is the row OEdu has always kept as a course, so its roster, gradebook and registers do not move. Homeroom waits for the homeroom field |
| Add / drop; transfer between sections keeping grades; add many; copy a roster | **Built, not shipped** (a transfer that carries the marks waits) | Schedule › Add and Drop: a student's sections, same-period clashes, the ones they could be in, what they asked for; add many by names, copy a roster. A drop keeps the marks on record |
| Drafts and publish; merge summary; undelete for 30 days | **Built, not shipped** | Schedule › Plans: a plan is a copy of the live schedule kept apart in `learn_schedule_drafts` (migration `0022`); publishing says first what it will do, then does exactly that, once. Sections are put away, never deleted, and come back with *Bring back*; no 30-day timer is needed |
| Year rollover (copy courses, not sections) | **Built, not shipped** | Plans › Roll over to next year: a year plan copies this year's sections; publishing puts the old ones away with rosters, marks and grades kept. Rosters: start empty and build from requests, none, or carried over |
| Automatic scheduling; analyse and build a master schedule | **Built, not shipped** | Course requests (must take, first, second, third choice) on Add and Drop; a plan's analysis names the course asked for and offered nowhere, the course short of seats, the period over capacity; *Build from requests* seats required courses and first choices first, alternates only for a student whose first choice failed, never into a clashing period, and says why each request that could not be placed was not |
| Combine classes on one screen | Partial | One piece of work is set in several courses at once; no merged roster view |

### Behaviour and care

| Topic | State | Where it stands |
|---|---|---|
| Incidents, merits, counselling notes; family sees what the school shows | Live | `0018`; Students › Behavior |
| Referral workflow: refer to counsellor / assistant principal / homeroom; inbox new-open-closed; pools; take back; read-only notices; caseload | Absent | One owner per entry exists; no inbox and no routing |
| Other log types: academic concern, general concern, health visit, parent contact | Partial | Health is its own record; the rest are not log types |
| Several students in one incident, cross-referenced, each with its own consequence | Absent | |
| Staff notes; "for admins only" | Absent | |
| Detention: assigned minutes; sessions; in and out; skipped raises a referral; running balance | Absent | Needs consequences with a quantity and a unit |
| Saturday school, clean-up, service hours | Absent | Same ledger with a different unit |
| Reports: individual log (print, for parents or internal), tally, statistics with a compare of two ranges and a per-day normaliser, export | Absent | |
| Teacher form to record an entry | Absent | The API takes it; the teacher console has no form |

### Tests and analytics

| Topic | State | Where it stands |
|---|---|---|
| Test templates: subject, percent / points / proficiency, subtopics, cut scores, date ranges, formative and summative | Absent | School assessments are a different system (items, exams) |
| Import state, district and benchmark scores from a file; edit manually; export | Absent | |
| List by test and by student; bar charts; proficiency bands | Partial | Score bands, not proficiency levels |
| Compare teachers (subject-area teacher correlation); statistical analysis with a t-test | Partial | Compare and Welch's t-test are live; no pre-test, no control group, no subject-area correlation |
| Cohort follow and teacher-progress views | Absent | |
| Demographic groups (gender, race and ethnicity, special programs) | Absent | Not recorded on accounts; needs custom fields with per-field rights |

### Grading (mostly On main)

| Topic | State |
|---|---|
| Scales, special marks, minimum score, categories and weights, cumulative grades, drop lowest, curve, override, adjust percents, extra credit, adjustments like `25+2`, what-if, impact, rubrics, hide and independent study, missing work, stickers, comment shortcuts, curriculum map, sort order | **On main** |
| Grading defaults for the school and per course; apply to existing gradebooks; prevent teachers changing their own | Absent. Terms exist twice (marking periods on this line, grading periods on main) and must become one |
| Lock grades through a term | Partial. Marking periods already go open → grading → posted → locked, with approved grade changes |
| Standards: average / summative / both; dual grades | Partial. Average only |
| Citizenship, effort and study-skills columns per term | Absent |
| Shared rubrics across the school | Absent (within a course only) |
| Recurring assignments; import and export assignments as a spreadsheet | Absent |
| Grade troubleshooting (the fifteen failure modes) | Absent as a tool. It is a checklist, and a checklist can run: see slice 6 |

### People and access

| Topic | State |
|---|---|
| Staff accounts: create, roles, edit | Live |
| Archive and unarchive staff; invite by link; domain-restricted sign-up; reset by link | Absent (needs D3 for links) |
| Transfer an account; staff groups | Absent; departments exist |
| Staff directory; print | Live |
| Monitor staff: days used, last login, access log, open a teacher's gradebook | Partial. An administrator already reads every course. Sign-in events are not recorded |
| Special education: individual work, override | On main |
| Special education: time-limit exceptions, resource teacher who sees grades but does not give them, needs notes visible to teachers | Absent. A teacher can already read a student's IEP record |
| Team teaching (several teachers on a course) | Live |
| Substitute teachers: plan per absence, emergency instructions, one-day one-teacher sign-in, roll and feedback | Absent. Plans and the seating chart already live with the course |
| Seating charts | On main. Admin print for a substitute: absent. Photos: absent (no file storage) |

### Files, writing and integrity

| Topic | State |
|---|---|
| Hand in files; grade on the page; draw on PDFs and images; peer review; portfolios | Absent. **There is no file storage.** This is the largest single dependency |
| Writing in the app; log or block pasted text; lockdown | Absent. Needs the above, and an editor |
| Tests a teacher writes, with answer keys that never reach the browser | Absent |

### State reporting

| Topic | State |
|---|---|
| New York SIRS | Stub. The page you pasted is the New York State Education Department's landing page; the data templates, their validation rules and the 2026-27 calendar are on the pages it links to. They have not been read. See slice 8 |

## 3. Decisions only you can make

| # | Question | My recommendation |
|---|---|---|
| **D1** | Do periods and bell schedules come back, against §2.1? | **Decided 2026-10-12, by you: yes, as in the guides.** A *course* is the subject (number, credits, GPA scale) and a *section* is one instance of it with its teachers, periods, room and roster. The section is the row OEdu has always kept as a course, so nothing that reads a course moves. §2.1 is rewritten to say so |
| **D2** | Join `main` into `platform-backend` now? | **Yes, first.** Thirteen small conflicts. It restores the teacher console, the Algebra I–II, Geometry and Prealgebra courses, and Kern's files to the line that edu serves. I started it on 2026-10-12 and the permission layer stopped me; the tree is clean and nothing was changed |
| **D3** | How does OEdu tell a person something? | **An in-app inbox first** (roll reminders, referrals, missing work, absence notices), and an email provider as a separate, later decision. Password-reset links and invitations wait for that |
| **D4** | Does OEdu store files? | **Yes: object storage with a per-file cap, scanned type allow-list, and the same guard rules as records.** Without it, a third of the guides cannot be built |
| **D5** | May I fan out researchers on the state reporting specification? | **Yes, once D2 is done.** Five readers on disjoint documents (demographics and enrollment; special education and program services; staff, course and instructor; assessments and graduation; calendar, validation and certification), then one writer. It is the "good reason" case: independent reading that would flood this chat |
| **D6** | Is this school's attendance daily, by period, or by class? | Excel High School reports by period in the city's system. OEdu's *class* method fits until D1 lands. Daily is for the elementary schools OEdu serves, and needs a homeroom field |

## 4. The order

Each slice is shippable by itself and ends with a proof. Slices 1 and 2 are the
only ones that need a decision first.

| # | Slice | What it gives | Needs |
|---|---|---|---|
| **0** | **Make live whole.** Deploy the attendance screen (migration `0020`, API, edu). Join `main` into `platform-backend`, run every proof (care, enrollment, attendance, grades), verify both consoles in the preview, deploy once | The teacher console and every course back on edu, and attendance with it | D2, and your terminal for the deploy commands |
| **1** (built; roll reminders and the seating chart wait) | **Attendance, finished.** A school code table (name, mark, counts-as for report cards / average daily attendance / state, admin-only, order) replacing the five fixed codes; edit window and admin-only codes enforced on the server; roll reminders in the inbox; the teacher's own roll screen from the seating chart; **attendance grades** as a generated, overridable column | Everything in the attendance setup and attendance-grades guides that does not need a bell schedule | 0 |
| **2** | **Conduct to discipline.** Consequences with a quantity and a unit; the referral inbox (new, open, closed; take back; read-only notices; caseload); other log types; several students cross-referenced; staff notes; **detention** sessions, in and out, skipped raising a referral, a running balance; the teacher's form; individual log, tally, statistics with compare, export | The discipline and detention guides | 0, D3 for the inbox |
| **3** (built, 2026-10-12) | **Calendar and meeting patterns.** Day types; bell-schedule templates with labelled slots and minimum days; effective dates for past days; a course's meeting pattern and room; "where is a teacher / student now"; half-day rules and **average daily attendance** | Bell schedules, school days, period attendance, half days | D1, 1 |
| **4** | **Tests and analytics.** Templates, import of state and benchmark scores from a file, proficiency levels, formative and summative, pre-test and post-test, correlate teachers by subject area, compare schools, demographic groups once custom fields exist | The test-score and analytics guides | 0 |
| **5** | **People.** Archive staff, groups, invitations, sign-in events and the access log, "view as" with an audit line, a resource-teacher role, special-needs flags for teachers, assessment time-limit exceptions, **substitute plans and the one-day sign-in** | Staff, special education, monitoring, substitutes | 3 for substitutes, D3 for invitations |
| **6** | **Grading governance.** One definition of a term for the whole school; school and per-course grading defaults with apply-to-existing and prevent-changes; lock through a term; summative and dual grades; citizenship and effort columns; shared rubrics; recurring assignments and spreadsheet import; **grade doctor**, which runs the fifteen troubleshooting checks across a school and names the students and courses each one hits | Grading defaults, locks, standards options, troubleshooting | 0 |
| **7** | **Files and writing.** Storage; hand-ins; grade on the page; return files; then an editor with a paste log; then peer review and portfolios. Tests a teacher writes sit beside this | Turn-in, cheating and AI, the rest of grading files | D4 |
| **8** (scheduling built; SIRS waits) | **State reporting and scheduling.** The SIRS extracts, validated before anything is sent; then drafts, course requests, capacity and the master-schedule analysis | State reporting; the schedule guide's second half | D5, 1, 3, 4 |

## 5. What each slice proves

- Server rules have an HTTP proof run as the people who use them, ending in the refusals.
- A screen has a play-through with real clicks; a hidden pane is not a reason to skip it.
- Neighbour proofs (care 15, enrollment 48, attendance 16, grades) still pass.
- A deploy is a copy built from the commit, compared byte for byte with live first, uploaded in the order migration → API → edu, compared again after.

## 6. Risks, said plainly

- **Whole-asset-set deploys drop anything the copy lacks.** That is how the teacher console left live. Slice 0 exists because of it; every later deploy starts from live and overlays.
- **`learn/app.js` is 19,000 lines and both lines edit it.** Each slice keeps its screens in its own file behind a small mount (`attend.js`, `care.js`, `office.js`), so a future join stays a handful of hunks.
- **Notifications and files are platform decisions, not features.** Building screens that assume them first would be building on air (D3, D4).
- **A state specification read from memory is worse than none.** Slice 8 does not start from what I recall of it.
- **Scheduling last is deliberate.** It is the largest, the most error-prone to change after a year has started, and everything before it makes it smaller.

---

*2026-10-13:* the market benchmark of 60 feature categories, with a wave order, is `docs/OEDU_FEATURE_BENCHMARK.md`. Its waves 2 to 8 extend slices 2 to 8 above.
