# OEdu Admin — Attendance, against what a school office does with it

The office's job with attendance is not taking the register; a teacher does that.
It is knowing which registers were taken, mending the ones that are wrong, and
being able to say who changed what. This is the admin screen for that, read
against a school information system's administrator guide (Main view, Class view,
Student view, Comments, Bulk edit, Audit log, Online access, Troubleshooting).

OEdu has no class or period (`OEdu-Architecture.md` §2.1): a register is one
**course** on one **day**. Where that guide says "class" or "period", this says
course.

| The office does | Where in OEdu | Notes |
| --- | --- | --- |
| See which registers were taken on a date, and which were not | Attendance, any date | Taken / **Marked n of m** (someone is unmarked) / Not taken. A closure or weekend says so instead of "not taken". Teachers named on each course. |
| Open a course's register and correct it | Click a course | Everyone starts present; five codes (present, late, absent, excused, cut); a comment per student. Saving the same register again changes nothing and writes no history. |
| One student's marks, courses down and days across | Find student, or Student 360 → Attendance → Open the full record | Click a mark: present → absent → late. A mark with a comment opens the comment instead of changing. |
| Set a code for many marks, or a whole day | Student view legend | Pick a code, then click marks or a date; or click a date, then a code. The comment typed in the legend goes with the marks it sets, then clears. |
| Abs and Late over a marking period, not just the weeks on screen | Student view | Period menu; Abs counts excused and unexcused alike. Defaults to the marking period the date is in, else the school year (Aug–Jul). |
| Print an individual attendance report | Student view → Print report | Totals by course and every absence and late with its comment. |
| Excuse a group for a trip or closure | Bulk edit | A course, a grade level (diploma record) or a program (IEP, supports, pathways where a record exists), a date or run of dates (school days only), the courses ticked, one code, one comment. A mark already carrying a comment keeps it when none is given. Two clicks to apply. |
| Say who changed what, when | Audit log | One date for everybody, or one student for every date; never everybody for every date. Every route is recorded: register, student record, bulk edit, correction, removal. |
| Find registers nobody took | Find errors | By teacher, with each missing date one click from its register. Skips weekends, closures and days before a course existed or a student joined it. |
| Find marks that look wrong, and fix them | Find errors → Marks to check | Mark for a student not in the course (remove); a register on a weekend, closure or future day (remove); absent in one course and in the room for another the same day (set the day one way, or open the record). Removals stay in the log. |
| Say which days there is no school | Settings | Weekends never count. Closure spans with a reason. |
| Define the school's own attendance codes | Settings › Attendance codes | Any number, each of a **kind** (present, tardy, absent, excused, no record). The first in use is what a register starts as and must be Present. Clicking a mark moves through the first three. A code is retired, never deleted. Every total counts by kind, so "Illness" can be excused and "Field trip" absent without any screen knowing the words |
| Say what a teacher may change | Settings › What teachers may change; Office-only codes | A window (same day only … a month, or any day); no register for a day that has not come; Office-only codes a teacher cannot set; a mark the office set a teacher cannot change. All enforced by the server, shown disabled on the sheet. The office can always correct any day |
| A teacher takes roll | Teacher console › Attendance | Their courses for a chosen day, Taken / Marked n of m / Not taken, the same register sheet |
| Turn attendance into a mark | Teacher console › Attendance › Grade attendance | Start with N points and take some off per absence and per tardy (after the first few are waived), or start at nothing and take points off the total, or earn points for each day present. Choose which codes count as an absence. A snapshot: one piece of work named "Attendance" per course, rewritten when run again; rename it and the next run makes a new one |
| Let students and families see attendance | Settings → Online access; family view | **Off until the school turns it on.** On: every absence, late and cut with its comment; present is not listed. A principal, registrar or administrator decides. |

## What is left

- **Roll reminders** need the in-app inbox (slice 2), and "20 minutes after the
  period starts" needs a meeting pattern on the course (slice 3). Until then the
  teacher's page shows what is not taken.
- **Taking roll from the seating chart** needs the seating chart, which is on
  `main`, not on this line.
- **Adjust percents** (take a percentage off the final grade per absence): this
  line's grade engine has no percent adjustment. Points off the total does the
  same job with a number a student can read.
- **Method: daily or period.** OEdu's is a register per course per day. Daily
  attendance needs a homeroom on the student; period attendance needs a course's
  meeting pattern (slice 3). Half days and average daily attendance need the same.
- **Homeroom-only roll** needs a homeroom on the student.
- **Remote attendance from sign-ins** needs sign-in events to be recorded.
- **A student's own attendance page** is not drawn: the student side has no
  School page on this line. The server already answers a student's own
  `GET /attendance?accountId=` under the same online setting.
- **Absence notes from a family** is not built; it is the next step once
  families can see attendance and OEdu has an inbox.
- **Daily attendance for the whole day** (a mark with no course) exists in the
  table and the API but has no screen; every screen here works by course.
- **Flags can be wrong** when rosters or dates were changed after the register
  was taken. The page says so beside the results.
