# OEdu Admin — Schedule, against what a school office does with it

A school sets its year in a few steps: the bell schedules, which days are school,
the courses it teaches, the sections of each with their teachers and periods, and
then, each year, a plan for the next. This is read against a school information
system's schedule guides (bell schedules, school days, courses, sections, add and
drop, drafts, rollover, automatic scheduling).

A **course** is a subject (number, credits, GPA scale). A **section** is one
instance of it: its teachers, periods, room, capacity and roster. A section is the
row OEdu has always kept as a course (`OEdu-Architecture.md` §2.1), so its
gradebook, work and registers did not move.

| The office does | Where in OEdu | Notes |
| --- | --- | --- |
| Define the school's days of periods | Schedule › Bell Schedules | Labelled periods (`1`, `M1`, `Lunch`), optional times, a minimum-day flag. *Weekdays* makes five from one: `1` becomes `M1 T1 W1 R1 F1`, a period named with a word stays. A schedule a day still runs cannot be deleted |
| Say which days are school and which bell schedule each runs | Schedule › School Days | A usual week, a month grid; a date or a span set to holiday, staff day, canceled, or a different bell schedule; the year's first and last day |
| List the school's courses | Schedule › Courses | Number never reused, credits, duration, GPA scale, graduation requirement, what appears on report cards and transcripts, whether students may request it. *Courses from sections* builds one per title from the sections already there |
| Place a section | Schedule › Sections | Course, teachers and co-teachers, periods (several for a block or a rotating day), room, capacity, tab, roster. A list, a master grid by period, and filters for what is not in a period, has no teacher or is over capacity. *Put away* keeps the roster and marks and takes it out of everyone's day; *Bring back* undoes it |
| Add, drop and move one student | Schedule › Add and Drop | Their sections with same-period clashes, the ones they could be in (full ones dimmed), what they asked for. A drop keeps the marks on record |
| Plan a term or next year | Schedule › Plans | A copy of the live schedule kept apart. Publishing says first what it will do (new, changed, put away, students placed and taken out), then does exactly that, once. A year plan: rosters empty then built from requests, none, or carried over |
| Check the plan against what students asked for | Plans › Against what students asked for | A course asked for and offered nowhere; a course short of seats; seats by period |
| Seat students | Plans › Build from requests | Required courses and first choices first; second and third choices only for a student whose first failed; never into a period the student already has; says why each request that could not be placed was not. Only adds; nobody already placed is moved |
| Count whole and half days | Attendance › Settings › Whole days and half days; Attendance › Daily attendance | Minutes for a whole and for a half day. A minimum day needs no rule: a student there for all of it is given a half |
| Let students and families see their day | Student home › This week; family view › Schedule | Periods, times and rooms for the week; a day with no school says why; courses not yet in a period are listed once, apart |

## Who may do what

Setting the schedule (bell schedules, calendar, courses, sections, plans, requests
for others) is the `period.write` permission: principal, registrar, administrator.
Anyone signed in reads bell schedules and the calendar. Staff read the whole
school's sections and plans; a teacher places their own students. A family reads
their child's day and may ask for courses students may request; the office may
require any.

## Proof

```
API=http://localhost:8794/api/v1 CRED=<credentials.json> node api/scripts/prove-schedule.mjs   # 23 steps, re-runnable, tidies after itself
node api/scripts/check-scheduler.mjs                                                          # the placement rules, no database
```

Migrations: `0021_schedule.sql` (courses, sections, bell schedules, calendar),
`0022_drafts_requests.sql` (plans, requests). Neither is applied to production.

## Not built

- A transfer between sections that carries the marks.
- Homeroom, and daily (rather than class) attendance.
- Students asking for their own courses on the student side (the API accepts it; the screen is the office's).
- A 30-day undelete timer: a section is put away, never deleted, so there is nothing to undelete.
