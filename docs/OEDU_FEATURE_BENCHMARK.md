# OEdu against the market's 60 features

The benchmark is the 60 feature categories a school-management buyer compares systems on. It replaces the earlier idea of measuring OEdu against any one product: each row is a capability, judged by what OEdu does today in this repository, not by what is on live edu.

**Where OEdu stands (updated 2026-10-13):** 41 built, 17 partial, 0 absent, 2 held. Built means verified here by a proof or a clicked-through screen; none of it is deployed yet.

| # | Feature | Status | What exists | What is missing | Wave |
|---|---|---|---|---|---|
| 1 | Admissions Management | Built | Enrollment workflow: queue, review, decision, enroll, sync; family apply; waitlist and decline states | Application fee (held); invitations by email wait on Communications | — |
| 2 | Alerts/Notifications | Built | Inbox with read state and preferences; alerts for absences, lates and decisions; announcements; reminders | Push to a phone | — |
| 3 | Assessment Management | Built | Assessment lifecycle (draft to archived), governance, secure sitting runtime, results release | Admin Assessments tab still shows sample data in places; accommodations per student | 5 Care |
| 4 | Attendance Management | Built | Admin registers, codes by kind, bulk edit, audit log, find errors, online access | — | — |
| 5 | Attendance Tracking | Built | Teacher roll, period minutes, whole and half days, average daily attendance | Remote attendance from sign-in events; roll reminders | 2 Communications |
| 6 | Billing & Invoicing | Partial | Fees, invoices (draft, issued, paid, void) and their families' view | Late fees, statements, tax | 8 Money |
| 7 | Built-in LMS | Partial | Courses, sections, assignments, marks, announcements, tests; the learning itself is Kern's | Hand in files or written work, comments on work, rubrics | 3 Files |
| 8 | Cafeteria Management | Partial | Menus with allergens; meal eligibility kept to the office | Balances and point of sale | 7 Operations |
| 9 | Calendar Management | Built | School days, holidays, bell schedules, per-date overrides; student week and month | Subscribe (iCal), per-person calendars | 6 Planning |
| 10 | Class Registration | Built | Course requests, add and drop, plans, analysis, build | Student-facing add and drop windows | — |
| 11 | Class Scheduling | Built | Sections, periods, rooms, capacity, plans, year rollover, auto-build | Teacher load and room conflict reports | 6 Planning |
| 12 | Classroom Management | Partial | Rosters, groups, seating chart (on main), attendance | Seating on the live line; behaviour points | 6 Planning |
| 13 | Communication Management | Built | Messages and threads, course and whole-school announcements, family writes to a teacher, mail queue | Templates | — |
| 14 | Contact Database | Built | Contact cards, guardians, a families export, staff directory | — | — |
| 15 | Course Management | Built | Courses (subjects) and sections, credits, GPA scale, requestable flags | — | — |
| 16 | Curriculum Management | Built | Written curriculum, course lessons, curriculum map by course and week | Standards alignment on work | — |
| 17 | Customizable Reports | Built | Report builder over the school's data sets: columns, filter, download, saved | Scheduled delivery | — |
| 18 | Data Import/Export | Built | Export of people, families, sections, rosters, attendance, marks; checked import of people and rosters | Marks import | — |
| 19 | Data Storage Management | Partial | Files on records and people, same access rules as the record, 800 KB each | Object storage for large files | 3 Files |
| 20 | Discipline Management | Built | Referrals with routing and status, detention minutes assigned and served, family told, files, saved reports | Cross-referenced multi-student incidents | — |
| 21 | Electronic Payments | Held | Card payments can be recorded by hand; taking one needs a payment provider | A provider account and its keys, which only you can create | 8 Money |
| 22 | Email Management | Partial | A mail queue per person who asked for email, flushed to any HTTP mail provider the deployment is given | A provider connected (needs your account and key); bounce handling | 2 Communications |
| 23 | Employee Portal | Partial | Leave requests with approval, certifications, the teacher console | Pay, benefits and documents (outside scope) | 7 Operations |
| 24 | Enrollments/Onboarding | Built | Admissions to activated student; family apply; document checks | Staff onboarding and invitations | 2 Communications |
| 25 | Event Calendar | Built | Events with audience, place, notice to that audience, replies | — | — |
| 26 | Faculty/Staff Management | Built | Staff list, departments, roles, permissions, leave, cover, certifications | — | — |
| 27 | Fee Collection | Partial | Payments recorded against invoices by the office | Collection through a provider | 8 Money |
| 28 | Financial Management | Partial | The ledger of fees, invoices and payments; OC EFM keeps the books | General ledger in OEdu (by design in EFM) | 8 Money |
| 29 | For Classroom | Built | Teacher console: gradebook, grading queue, attendance, assignments, seating | — | — |
| 30 | For Higher Education | Partial | Credits, GPA scales, degree audit, transcripts, prerequisites on requests | Credit-hour terms, program of study | 7 Operations |
| 31 | For Labs | Partial | Spaces, bookings, assets, work orders, equipment checkout | Lab safety records | 7 Operations |
| 32 | Grade Calculations | Built | Server-side weights, drops, late rules, scales, what-if, goal search | — | — |
| 33 | Gradebook | Built | Teacher gradebook, school gradebook, marking periods, posted and locked grades | — | — |
| 34 | Independent/Private | Built | One school per organisation, no district assumptions | — | — |
| 35 | Individualized Assessments | Partial | Accommodations are recorded and shown; work can go to named students | The test timer reading an accommodation | 5 Care |
| 36 | K-12 | Built | Grade levels, tracks, elementary course content on Kern | — | — |
| 37 | Lesson Planning | Built | Lesson plans per course in the teacher console; curriculum map | — | — |
| 38 | Mobile App | Partial | Installable web app (manifest) and a phone layout for the portals; /jobs/ for staff | A store app | 7 Operations |
| 39 | Online Calendar | Built | Week and month in the portal; a private address any calendar app can subscribe to | — | — |
| 40 | Online Payments | Held | As above: families see what is owed and cannot pay in the portal | A provider account and its keys | 8 Money |
| 41 | Parent Portal | Built | Family view: grades, work, attendance, schedule, documents, guardians, messages, forms and fees | — | — |
| 42 | Parent/Student Portal | Built | Family view and the student portal on one record | — | — |
| 43 | Performance Metrics | Partial | Academic, growth, group, longitudinal and teacher analytics | Staff performance, goals | 5 Care |
| 44 | Progress Reports | Built | Report view, narrative comments, readiness per course | Scheduled delivery to families | 2 Communications |
| 45 | Progress Tracking | Built | Standing, trend, missing work, graduation pace | — | — |
| 46 | Real-Time Notifications | Partial | The inbox count refreshes every 30 seconds in every console | A live channel for sub-second delivery | 2 Communications |
| 47 | Records Management | Built | Student records, transcripts, documents list, guardians, audit trail | Files themselves (see Data Storage) | 3 Files |
| 48 | Registration Management | Built | Enrollment and course registration | — | — |
| 49 | Reminders | Built | Roll not taken, work due, certifications expiring; once per person per key; run by a 30-minute schedule and on demand | Per-school timezone (New York is fixed) | — |
| 50 | Report Cards | Built | Report cards, marking periods, posted grades, print | Official PDF with signature | 4 Records |
| 51 | Reporting & Statistics | Built | Average daily attendance, summaries, exports, the enrollment extract with its problems | A named state's own file layout (needs its specification) | 4 Records |
| 52 | Reporting/Analytics | Built | Analytics section, watchlist, student support | — | — |
| 53 | Role-Based Permissions | Built | Product-scoped roles, per-action guard, office roles, permissions page | Per-field visibility settings | — |
| 54 | School District | Partial | Schools can belong to a district; a district summary of the schools | District-wide catalogs and user directory | 7 Operations |
| 55 | Special Education | Built | Support plans (IEP, 504, other) with goals, services, review dates; accommodations; shown to the student and family | Service minutes logging; reminders on review dates | — |
| 56 | Student Information/Records | Built | Student 360, contact, guardians, program, records | — | — |
| 57 | Student Management | Built | Student 360, support, enrollment, rosters | — | — |
| 58 | Tests/Assessments | Built | Teacher-set tests, secure sittings, results | — | — |
| 59 | Third-Party Integrations | Partial | Signed webhooks on every record, checked import and export, calendar feed, Oplo Account sign-in | A roster standard format, SFTP (not possible here), partner keys | 4 Records |
| 60 | Transcripts | Built | Transcripts by year, credits, GPA, print, transfer records | Official issue and release log | 4 Records |

## The course of action

Finishing is cheaper than starting, and a few pieces of plumbing unlock many rows at once. So the order is by what each piece unlocks.

| Wave | What | Rows it moves | Needs |
|---|---|---|---|
| 1 | **Ship what is built.** Migrations 0021 and 0022, API, edu | Everything marked Built | You, at a terminal |
| 2 | **Communications spine.** An in-app inbox with read state and preferences; announcements and messages on it; reminders and alerts written to it; a live channel for real-time; email as a later provider behind it | Alerts, Notifications, Real-Time, Reminders, Communication, Email, parts of Parent Portal, Progress Reports, Attendance | Your decision on an email provider, later |
| 3 | **Files.** Object storage with caps, type allow-list and the same access rules as records; hand-ins; document upload; bulk import with a check before write | Data Storage, Built-in LMS, Data Import/Export, Records | D4 (yes recommended) |
| 4 | **Records and exchange.** Searchable family directory, official transcript and report card issue, roster import and export in a standard format, SFTP, state extracts | Contact Database, Transcripts, Report Cards, Reporting, Third-Party Integrations | Wave 3, the New York extract specifications |
| 5 | **Care.** Referral inbox and detention, IEP and 504 plans with deadlines, accommodations on tests, report builder, staff performance | Discipline, Special Education, Individualized Assessments, Customizable Reports, Performance Metrics, Assessment Management | Wave 2 |
| 6 | **Planning.** Lesson plans by section, curriculum map, events with RSVP, calendar subscribe, classroom tools | Lesson Planning, Curriculum, Event Calendar, Online Calendar, Classroom Management, Class Scheduling | — |
| 7 | **Operations.** Staff self-service, substitutes, district roll-up, higher-education terms, labs, cafeteria, phone layouts | Employee Portal, Staff, District, Higher Ed, Labs, Cafeteria, Mobile | A decision to lift desktop-only |
| 8 | **Money.** Billing, fees, payments | the five held rows | See below |

## Decisions that are yours

1. **Money.** On 2026-10-07 you ruled finance out of OEdu. “Have all of them” may reverse that, so the five rows are held, not dropped. Lifting it needs a payment provider and its terms before any code, and I have not started it. Say “finance in” and Wave 8 is planned in full.
2. **Email provider** (Wave 2). Until then the inbox is in-app only, which is what you chose earlier.
3. **File storage** (Wave 3). Recommended yes; without it a third of the guides cannot be built.
4. **Desktop-only** (Wave 7). Phone layouts wait until you lift that rule.

## Rules this benchmark keeps

No other company's name appears on a OEdu page; the categories are generic. Each row is re-judged when a wave ships, and a row only moves to Built with a proof or a clicked-through screen.

## What was built against this on 2026-10-13

Waves 2 to 8 were built in one pass, on one shared base (migration `0023`, five route files, `learn/platform.js`), so each row above is a configuration of the same few pieces rather than a screen of its own:

- **Inbox and reminders** (`routes/inbox.js`, `services/notify.js`): per-person notices with thread, read state, archive and preferences; messages with the rule that students and families write to staff, never to each other; reminders made once per person per key and run every thirty minutes by the Worker.
- **Small records** (`services/items.js`): one registry, one table, one set of routes; each kind says who reads and writes it. The screens are drawn from the registry, so adding a kind is an entry.
- **Files, exchange, district, feeds**: files on records, a checked import, an extract with its problems, signed webhooks, a district summary, an iCalendar address.
- **Proof:** `api/scripts/prove-platform.mjs`, 12 steps, as the people who use it, ending with the refusals.

## What still needs you

- **A payment provider** for card payments (Electronic and Online Payments).
- **A mail provider** (set `MAIL_ENDPOINT` and `MAIL_KEY` on the API) for email to leave the queue.
- **The New York extract specification** (or any state's) for a file in its own layout.
- **Object storage** if files are to be larger than 800 KB.
- **The deploy**: migrations 0021 to 0023, the API (which now has a 30-minute schedule), and edu.
