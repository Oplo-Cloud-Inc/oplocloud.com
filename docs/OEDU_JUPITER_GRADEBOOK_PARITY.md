# OEdu for teachers vs Jupiter Ed — the gradebook

Checked 2026-10-04 against <https://jupitered.com/Gradebook_public.php>, panel by panel (all twenty), with its feature list (`modules.php`) and its comparison page (`compare.php`), reading the OEdu code (branch `claude/teacher-jupiter`), not its descriptions. The school office's side is in [OEDU_JUPITER_PARITY.md](OEDU_JUPITER_PARITY.md).

**Live**: a teacher can do it in the console today, with real data. **Partial**: part of it is real, and the rest is named. **Absent**: nothing yet.

Every grade is computed by the server (`api/src/services/grades.js`), so a rule a teacher sets in Gradebook › Setup reaches the student and the family on the next request. The rules are checked by `node api/scripts/check-grades.mjs`.

## Grading

### Easy grade entry

| Jupiter | OEdu | Where / what is missing |
|---|---|---|
| Enter scores as points, percents, letter grades | Live | In any cell: `18`, `85%`, `B+`. A percent or a letter is turned into points on the course's scale; the cell shows points |
| Enter scores as rubrics | Live | Set work › Rubric; in Grading each requirement takes its points and the score is their sum. The student sees the breakdown |
| Enter by grid | Live | Gradebook › Grades |
| Enter by assignment | Live | A column › Grade one by one; To Grade |
| Enter by student | Live | A student's name in the sheet: every mark down one page |
| Enter by seating chart | Live | Seating › Mark a piece of work from the seats |
| Combine sections on one screen | Partial | A section is a course: the same catalogue course taught to a second roster (see Who work is for). One piece of work is set in several at once; each still has its own sheet |
| Anonymous grading | Live | Grading › Hide names: Student 1, Student 2, in an order that says nothing |
| Grade one question at a time on tests | Absent | Needs teacher-written tests with written answers (see Online tests) |
| Independent study, differentiated assignments | Live | Set work › Only some students. Nobody else is owed it or shown it |
| Adjustments like `25+2`, `40-5%` | Live | In any cell; the mark keeps what was typed |
| Override a grade with any percent or mark; raise or lower it | Live | A student's page › Override the grade. The computed grade is kept and shown beside it, to the student too |
| Backups to undo mistakes | Live | Grade History and Undo on every mark; a curve is undone a mark at a time |

### Who work is for

Not on Jupiter's page, and the part teachers ask for first. OEdu's shape is catalogue course (the shell, with its code) → the school's course (one roster and its teachers; work and marks live here) → student. Algebra I taught to three rosters is three courses made from one catalogue course, each keeping its lessons.

| What a teacher does | OEdu | Where |
|---|---|---|
| Set one piece of work in several courses at once | Live | New assignment: the first field is the teacher's courses, any number ticked |
| A different due date for each | Live | A date beside each course, on the same sheet |
| Set it for one course only, because that one is ahead | Live | Tick that one |
| Set it for specific students | Live | Specific students: ticked under each course's name |
| For everyone else it does not exist | Live | Not on their page, not owed, not in their grade; no "excused" to type. A course where nobody is ticked gets no work at all |
| Rules, objectives and comments shared across rosters of one course | Absent | Each course keeps its own Setup |

### Standards based

| Jupiter | OEdu | Where / what is missing |
|---|---|---|
| Grade on learning objectives, a traditional average, or both | Live | Standards shows mastery by objective; the gradebook keeps the average |
| Your own objectives | Live | Standards › Edit objectives; tick them on work when you set it |
| Common Core preloaded | Absent | Codes are typed or pasted |
| 4, 3, 2, 1 … or A–F, or any scale | Partial | The course's scale is anything (Setup). The mastery chart's four levels are fixed at 90 / 75 / 60 |
| Mastery chart, with the class average | Live | Standards: every student against every objective |
| Curriculum map | Live | Standards › Curriculum map; Curriculum |
| Summative grade, or the average across the term | Partial | The average of the work about an objective. No "most recent" or summative choice |
| Test questions aligned to objectives | Partial | An OEdu unit test counts towards its unit. No alignment question by question |
| Standards on report cards | Absent | Report cards are traditional |
| Rubric charts; subtotal points; weight each requirement | Live | A requirement's points are its weight |

### Report cards

| Jupiter | OEdu | Where / what is missing |
|---|---|---|
| Report cards and progress reports from the gradebook, no extra step | Live | Reports (teacher); Academics › Report Cards (school console) |
| Real-time access for admins and support teachers | Live | The school console reads the same record; a co-teacher sees the same gradebook |

### Data visualization

| Jupiter | OEdu | Where / what is missing |
|---|---|---|
| Rising and falling grades on the dashboard | Live | Today › Rising and falling |
| Grade distribution on any assignment or the course total, with mean and median | Live | A column › Distribution (mean, median, highest, lowest); Gradebook › Overview for the course |
| Grade impact of each assignment | Partial | A student's page: what each piece did to the grade. The student's own Grades page does not draw it yet |

### Grading files

| Jupiter | OEdu | Where / what is missing |
|---|---|---|
| Students turn in files; grade them online | Absent | A hand-in is what OEdu measured on a lesson, a test or a study set. There is no file storage |
| Import from Google and Dropbox | Absent | |
| Draw and type on PDFs and images | Absent | |
| Stickers | Live | Ten, on any mark; not animated |
| Comment shortcuts | Live | Grading: one click inserts one; Edit… keeps your own, shared with co-teachers |
| Portfolios | Absent | |

### Customize

| Jupiter | OEdu | Where / what is missing |
|---|---|---|
| Any grade scale | Live | Setup › Grade scale: letters, 4·3·2·1, E·S·N, pass and fail, or your own |
| Categories, optionally weighted | Live | Setup › Categories |
| Special marks | Live | Setup › Special marks: a code, and whether it counts as zero, is left out, or counts as a percent |
| Minimum score | Live | Setup › Rules. Applies to work not handed in too |
| Cumulative grades across grading periods, weighted | Live | Setup › Grading periods |

### Shortcuts

| Jupiter | OEdu | Where / what is missing |
|---|---|---|
| Drop low scores from a category | Live | Setup › Categories › Drop lowest |
| Curve scores on any assignment | Live | A column › Curve: add points, top score to full marks, or square root |
| Transfer grades between sections | Absent | No sections |
| What-if grades | Live | A student's page › What if…; students have "What do I need?" on Grades |
| Automatically grade attendance and forum participation | Absent | Needs attendance and forums |

### Anti-cheating

| Jupiter | OEdu | Where / what is missing |
|---|---|---|
| Paste blocker | Absent | No writing done on OEdu yet |
| Log edits | Absent | |
| Lockdown browser | Absent | An assessment's answers never reach the browser, which is a different protection |

## Learning

| Jupiter | OEdu | Where / what is missing |
|---|---|---|
| Online tests you write yourself | Partial | OEdu's own unit tests are marked automatically and understand equivalent math. School assessments run timed, with no answers in the browser. A teacher cannot yet write a test: no question bank, question types, import, random order, item analysis or re-key |
| Interactive lessons | Partial | The OEdu Library: lessons with instant feedback, set as work in two clicks. A teacher writes study sets, not lessons |
| Math and chemistry | Partial | OEdu lessons accept equivalent expressions and have graphing. No equation editor for a teacher's own questions; no chemistry notation |
| Text to speech | Absent | |

## Classroom management

| Jupiter | OEdu | Where / what is missing |
|---|---|---|
| Homework organizer | Live | Students: Home and School show what is due, what is missing, and new marks and comments, for every course at once |
| Announcements | Live | Communicate › Announcements; at the head of the course on the student's School page |
| Remote learning | Partial | A link and instructions on any piece of work. No meetings, forums, file hand-ins or attendance from sign-ins |
| Peer reviews | Absent | |
| Multiple teachers on a course | Live | Teachers and assistants share the gradebook, plans, seating chart and comments |
| Teaching assistants with limited access | Partial | The assistant role exists and has a teacher's rights |
| Substitute login | Absent | Plans and the seating chart are kept with the course, ready for one |
| Share files, rubrics, plans; a curriculum library | Partial | Within a course. The OEdu Library is every teacher's. Nothing is shared across courses |
| Staff forums | Absent | |
| Apps and integration (Google, Dropbox, LTI, Clever, SSO, SFTP) | Absent | |
| Special ed: individual assignments, overrides | Live | Only some students; Override the grade |
| Special ed: time-limit exceptions, special needs, IEP reports | Absent | Student records are the school console's |
| Lesson plans: a collection, on a calendar | Live | Teach › Lesson Plans: month view with the work due each day; Use again; print |
| Lesson plans shared with colleagues | Partial | With whoever else teaches the course |
| Seating charts: drag and drop, anywhere | Live | Students › Seating |
| Seating charts: shuffle | Live | |
| Seating charts: photos | Partial | Initials; accounts have no photos |
| Seating charts: combine sections | Absent | |
| Attendance | Absent | A place in the rail that says so. The school's attendance records come first |

## Jupiter's "exclusive features" (compare.php)

| Jupiter | OEdu |
|---|---|
| Drop low scores | Live |
| Custom marks | Live |
| Stickers | Live |
| Single database | Live: one API and one database behind admin, teacher, student and family |
| Math grading, graphing and drawing | Partial: in OEdu's own lessons and tests |
| Flexible text grading, participation grading, chemistry, text to speech | Absent |

## What it would take to close the rest

1. **File hand-ins and an essay grader.** Needs file storage. Unlocks grading files, writing on work, peer review, portfolios, the paste blocker and the edit log.
2. **Tests a teacher writes.** Answer keys held on the server and never sent to a browser, a question bank, the question types, item analysis, re-key.
3. **Attendance**, after the school's own records: taking roll from the seating chart, and grading participation from it.
4. **Messages and forums.**
5. **Integrations:** Google Classroom and Drive, LTI, Clever.
6. **Small ones:** text to speech on student pages, the impact chart on the student's Grades page, Common Core preloaded, objectives on report cards, a substitute's sign-in.
