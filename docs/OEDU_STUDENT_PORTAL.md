# OEdu Students — the school's record, read by the student

OEdu's student side used to be a learning app with school grafted on: a streak, a
rank, badges, a tutor, an Explore catalogue, lessons, mastery. Learning has moved to
Kern, and what is left in OEdu is the part a school's system of record owes a
student. So the student side is redesigned as a **student information system
portal**, drawn in the same console shell as the school's and the teacher's, and
reading the same record they write.

## What it is for

A student comes here to answer the questions a school office answers every day:

| The student asks | Where |
| --- | --- |
| Where do I go next, and who is it with? | Overview › Today; Schedule |
| What is due, and what is late? | Overview › Due soon; Assignments |
| How am I doing, and why? | Grades; Courses › a course |
| What do I need to get a B? | Courses › a course › What do I need? |
| Am I marked in? How many have I missed? | Attendance; Overview › Today |
| What have I earned toward graduating? | Transcript; Graduation |
| What does the school have on file for me? | Profile |
| What do I want to take next year? | Requests |

## What it is not

There is no streak, rank, badge, experience counter, mistake log, tutor, lesson, or
"what to learn next" anywhere in it. A number on a page is a fact the school entered,
or a sum the server made of facts the school entered — never a score for being
there. Work that is done on Kern is handed in from Kern, and the portal says so.

## Pages

| Page | Reads | Notes |
| --- | --- | --- |
| Overview | schedule/mine, coursework, report, attendance, calendar, announcements | Four figures (attendance rate, average, due this week, past due or missing); Today with each class's register mark; Needs attention (missing, past due, below a pass, days away, days off); Recent marks; Announcements; Coming up |
| Schedule | schedule/mine ×5, calendar | Week and month. A day with no school says why. A course with no period is listed once, apart |
| Courses | sections, report, coursework, attendance | A section's teachers, period, room; its grade, how it is made (category, weight, percent), every mark, the teacher's comment, attendance in the course, announcements |
| Assignments | coursework | To do · Past due · Handed in · Graded · All · Tests (the exam runtime). Grouped by week. Each piece opens with its instructions, mark and comment |
| Grades | report, periods | Current grade per course with trend; posted marking periods; a goal calculator that asks the server's what-if |
| Attendance | attendance (as the student), codes | Only when the school has put attendance online; otherwise it says so. Rate by the school's codes, a month by day, by course, every absence and late with its comment |
| Transcript | graduation | Courses by year with marks, credits, grade-point average; the transfer record; print |
| Graduation | graduation | Requirements and their areas, residency, exams, what to confirm with the school |
| Profile | contact, guardians, records, graduation | The contact card is editable by the student; date of birth and family are the office's |
| Requests | course-requests, subjects | First, second and third choice from courses the school opened for requests. What the office requires is kept when a student saves |
| Account | auth | Password and sessions |

## Rules it keeps

- **The server decides.** Every figure is computed on the server (grade, standing,
  credits, rate); the portal adds up nothing it was not given.
- **Nothing is locked.** A student can open any page, course or piece of work.
- **Put away means gone from daily lists.** A section put away by a year rollover is
  out of the report, the work and the sections lists, and stays on the transcript.
- **Their own record only.** A student reads their own marks, registers and
  requests; conduct and health records are not theirs to read, and the portal does
  not ask.

## Where it lives

`learn/student.js` (shell, data layer, Overview, Schedule, Courses, Assignments,
search), `learn/student-record.js` (Grades, Attendance, Transcript, Graduation,
Profile, Requests, Account), `learn/student.css`. `app.js` hands them the console's
pieces and gives them a rail (`STUDENT_TREE`, `openStudentConsole`). Kern is the same
page with `window.OPLO_KERN` set, and keeps the learning app.

## Not built

- Messages (waits on the in-app inbox) and a calendar a student can add to.
- Handing in a file or written work (waits on file storage).
- Course requests with a teacher's recommendation (the flag is shown, not routed).
- A student ID number and a homeroom (the record has no field for either yet).
