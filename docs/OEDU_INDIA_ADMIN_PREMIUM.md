# OEdu for an Indian school's administrator: the premium pass

Written 2026-10-18 on `claude/india-product-gaps-b244dd`, cut onto `origin/main` (`3807895`, the India playbook build). Nothing here is pushed or deployed. No migration is needed.

The brief: a vice principal reviewed the console and scored it about 4 out of 10 for an Indian CBSE school ("clean, consistent, fast; most screens speak US"), and the direction was *stop being minimalist, go crazy but not ugly, keep it premium, own the UI/UX and every workflow*. This is that pass. Fees stay out (your ruling of 2026-10-07, confirmed 2026-10-18); the review's other findings are mapped below.

## The look

`learn/console-premium.css` repaints the school's console only (everything is under `body.a-console`, set when the address is `/admin` and the window is not a phone). The teacher console, the student portal, the family page and the phone layouts are untouched.

The direction, after a first coloured version was rejected as childish: **flat Apple, from the front page's own tokens.** A quiet canvas (`#f5f5f7`), white tiles on it with a whisper of shadow, near-black ink, one blue (`#0071e3`) for what you press and where you are, SF type (Inter as the fallback off Apple devices), a translucent sidebar with grey glyphs, pill buttons and a segmented control. Colour only where it means something: green is well, orange is waiting, red is wrong, always as a tint. No gradients, no glowing tiles, no saturated chips; people are grey monograms the way Contacts draws them; the one dark tile is the Overview's feature tile. Light, dark and auto; reduced motion respected. `india-home.css` and `india-pages.css` carry the new pages' own pieces in the same surface.

## The review, item by item

| Review said | State |
|---|---|
| Fees module missing | **Held** by the 2026-10-07 ruling; not built. The data it needs (sections, rolls, categories incl. EWS/DG) is in. |
| SMS + WhatsApp missing | **Not connected, and said so.** A circular carries a channel block: the app (always), email (through the Outbox, once a mail service is connected), SMS and WhatsApp shown as not connected with what each needs. What works today for the WhatsApp groups schools already run: "Share on WhatsApp" opens the circular's text ready to forward, and "Copy". |
| CBSE exams and report cards | Built before this pass (`OEDU_INDIA_PLAYBOOK_BUILD.md`). New here: the **exam board** (sections down, subjects across, each paper's stage in colour; a whole stage moves on in one press, each paper still one step at a time) and **Results analysis** (toppers, section comparison, subject averages and pass share, category and gender, who failed what; counted from the report cards; says when papers are unpublished or a group is small). |
| Section timetable grid missing | **Built.** Schedule › Timetable draws a class's week (periods down, Mon–Sat across, subject and teacher in each box), a teacher's week with workload, and names clashes. It reads the existing sections and bell schedules; the list of sections is its third tab. |
| Cover linked to the timetable | **Built.** Staff › Cover is a desk: pick a day, it finds the teachers on approved leave, lists each period of theirs that day, offers the free teachers (those who teach the subject first), and saves the assignment as the same cover record as before. |
| Student record too thin; Student 360 shows no class, DOB, address, blood group, gender | **Built.** Students › Student profile is a directory of every child (search, section, "under 75%", early warning, consent pending, record gaps, special needs) and a profile sheet: who they are, the numbers a board asks for, attendance by month, marks, family with call and WhatsApp links, certificates and cases. |
| Homework / diary | Built before (class teacher's phone day, family Diary). Not given an admin screen of its own. |
| 75% rule | Built before; now on the home page and in the directory filters. |
| Circulars: attachments, categories, read receipts, notice board | **Built.** Communicate › Circulars: category, audience (school, families, students, staff) and **which classes**, a PDF or photo, a live preview of how a family sees it, and per circular how many opened it (counted from each family's own notice). |
| PTM scheduling | Built before (exam cycle). |
| Admissions front end (enquiry funnel, registration, RTE seats, entrance test) | **Partly.** The admissions workflow existed; its defaults were American (Pre-K to Grade 12, school year from June, US papers). For an Indian school they are now Nursery to Class XII with the age a child must be on 1 April, the year from April, and the papers a school here asks for (no identity number by default). The funnel, registration fee, entrance test, merit list and a free-quota seat count are **not built**. |
| Board and government lists (CBSE LOC, UDISE+) | Not built: the layouts are not public. The board eligibility list and the APAAR / PEN / consent lists were already there. |
| Parent portal rebuilt for India | **Done for the front of it.** An Indian family now sees attendance, class, latest result and the three things to act on (homework, a meeting, a published result). The diploma credits, "Excel High School", course grades, state benchmarks and "fees" wording are gone for an Indian school. The phone layout is not redone. |
| Language | Unchanged: the family page reads in Hindi and Punjabi (73 phrases, needs a native reader). The admin console is English. |
| India reports | Results analysis above; the list of children under 75%; the compliance page. Attendance defaulters by section and a fee-dues report are not built (fees held). |
| Transport, library | **Added** as pages of records (Transport: routes with bus, driver, stops, times; Library: books out and due). No live tracking, no fines. |
| Staff profiles, Indian leave types | Qualifications (was Certifications) exists; leave types are the existing ones. Not extended. |
| Multi-branch dashboards, payroll, biometric | Not built. |
| Class X-C says ICSE | Fixed in the demo seed (it said ICSE in three places). |
| "Excel High School" on the parent preview | Fixed: the page names the school it is for. |
| Sidebar says Administrator, account says Vice Principal | Fixed: the rail foot shows the person's own title. |
| Pass marks 70 / 65 vs 33 | The Indian home reads none of them; results use the exam's own scale (33). |
| Demo has 1 student | The demo can now be filled (below). |
| Hide Meal Eligibility, Lockers, GPA, credits, IEP; rename Rosters, Watchlist, Enrollment… | Done in the tree: Menus, Meal Eligibility, Lockers, Add and Drop, Detention are hidden for India; Enrollment → Admissions, Rosters → Class lists, Guardians → Parents and guardians, Behavior → Discipline, Watchlist → Needs attention, Forms → Circulars, Mail Queue → Outbox, School Days → Academic calendar, Bell Schedules → Period timings, Certifications → Qualifications, Support plans → Learning support, Accommodations → Exam accommodations, Gradebook → Course marks. GPA, credits and the diploma were already hidden. There is no separate "India mode" switch: the school's country (Settings › School) decides. |

## The principal's desk (Overview)

An Indian school's Overview is no longer the US dashboard. `learn/india-home.js`: a hero with today's attendance ring; six cards (children, 30-day attendance with its curve, under 75%, exam papers published, early warnings, identity records); **Needs you** (papers to approve or publish, certificates to sign, leave to answer, cover needed, registers not in, admissions to move, children under 75%, high-risk children, records a board's list would refuse, unread mail), each a press from its screen; today's register for every section as a heat board; the exam cycle as a funnel; who needs a look; what is coming. Every figure is read from the API; a card whose source fails says so and the rest draw.

## API changes (all additive, no migration)

- `GET /register/pulse?days=30`: attendance per school day and, for today (or the latest day with registers), per section.
- `GET /items/:id/reach`: how many a notice reached and how many opened it (staff only); counted from `learn_notices.read_at`.
- A circular (`form` record) gained `category`, `classes`, `channels`, `file`, and an audience of `everyone`. A circular for named classes reaches the children seated in them and their families. **Fixed on the way:** a notice to a whole school failed once there were more than about a hundred children (D1's bound-value limit in `guardianIdsOf`); and a school whose children are seated in sections rather than courses reached nobody.
- Enrollment defaults by country (classes, age, year from the school's `yearStartMonth`, papers). What a school saved still wins.
- New registry kinds `route` and `loan`.

## The demo school

`api/scripts/seed-sfhs-full.mjs` fills Strawberry Fields High School through the API, the way a school's own loading goes: 26 teachers and 6 office roles (invited, no password), 13 sections and about 330 children with families, every child's India record, a month of registers (some children often away), the half-yearly exam with papers at every stage of the cycle, 95 subject sections placed Monday to Saturday with their teachers, certificates, leave, cover, events, six circulars, 9 bus routes, library loans and 12 applications. A fixed random seed makes it the same school each run; every name is made up and every address cannot receive mail. Run `seed-demo-school.mjs` first, then it, as that school's administrator. Safe to run twice.

```
API=http://127.0.0.1:8787/api/v1 ORIGIN=http://127.0.0.1:8123 CRED=admin.json node api/scripts/seed-sfhs-full.mjs
```

## Proof

On a brand-new local database: prove-india 12, prove-school 30, prove-exams 13, prove-certificates 10, prove-hpc 9, prove-attendance 27, prove-schedule 23, prove-platform 12, prove-care 15, prove-enrollment 48, prove-facilities 32, prove-student 9, **prove-circulars 4** (new), unit suites test-enrollment 29 (two new checks) and the rest unchanged. prove-india, prove-schedule and prove-attendance assume a school with no classes and an empty calendar: run them before the demo is seeded. prove-enrollment now uses the school's own class names and an age that fits an Indian class.

Browser checks (the in-app pane, 1440×900, light and dark): the desk, directory, profile (every tab), exam board, timetable, cover desk, circulars and composer, results analysis, certificates board, transport, the family page, and a click through every place in the rail looking for a failed page.

## Not done, said plainly

Fees and the free-quota ledger (held); SMS and WhatsApp sending (need accounts only you can open); board and UDISE+ upload layouts; an installable app; the phone layouts for the new pages (the premium look is the desktop console's, a phone keeps its own pages); Hindi and Punjabi in the admin console; the admissions funnel's registration fee, entrance test and merit list; attendance defaulters and a library fine; multi-branch dashboards; staff profiles beyond Qualifications.

## Deploy

No migration. API first (the desk and Circulars call the two new routes and degrade softly without them), then the edu app. Run `python3 tools/stamp.py` after editing anything under `learn/` (done for this branch).
