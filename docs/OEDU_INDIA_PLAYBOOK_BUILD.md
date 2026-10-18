# The India playbook: what was built, what was proved, what is not

Written 2026-10-18 against `OEdu-India-Playbook.pdf` (17 October 2026) and the 17-point list that came with it. Branch `claude/indian-school-management-20be66`, cut from `claude/oedu-school-profiles` (`fe7e3f6`, itself on `origin/main`). Nothing here is pushed or deployed.

## The list, item by item

| # | Playbook item | State | Where |
|---|---|---|---|
| 1 | Broken pages working (attendance, sections, bell schedules, messaging) | **Not reproduced.** On a fully migrated database attendance, sections, bell schedules and the inbox load and pass their proofs (attendance 27, schedule 23, platform 12 steps). I could not see what was broken on the live site, so this is unconfirmed there; earlier session notes say the live API was stale. What was genuinely missing was an Indian register: built as item 6 | – |
| 2 | One country setting; ₹, DD/MM/YYYY, IST, lakh grouping; no India menu | **Built.** Settings › School (country, boards, state, families' languages). `learn/locale.js` makes every date, number and time on every screen follow it; the India places moved into Students, Reports, Academics, Attendance; Class not Grade, Subjects/Timetable | `api/migrations/0026`, `services/profile.js`, `learn/locale.js` |
| 3 | Section as the roster; roll no. per year, admission no., APAAR, PEN, category, CwSN, parents, single names | **Built.** Seat, number A–Z, promote into next year's section (history kept), leave; special needs, migrant, mother tongue, guardian, board roll number; one name is enough in an application | `0027`, `routes/india.js`, `learn/india.js` |
| 4 | Per-board grading, not one A–F | **Built as an engine.** A scale is the school's: bands, pass mark, co-scholastic grades; templates say they must be checked. CBSE nine-point bands are in; CISCE is marks-only with the pass mark left to the school | `0029`, `services/grading.js` |
| 5 | Aadhaar optional and masked, consent, audit lock on attendance and marks | **Built.** Aadhaar and consent were already in; now a span reported to a board is **locked** (teacher stopped; the office must say why; the change is flagged "after the lock" and listed), and a mark changed after approval is flagged the same way | `0028`, `0029` |
| 6 | Class teacher's day on a phone in under 10 minutes, offline | **Built, partly.** Register (one tap, a reason), diary, a word to all families or one child's, "done" with the elapsed time the office reads as median / slow end; kept on the phone and sent in order when the signal returns. **Not built:** opening the page cold with no signal | `0030`, `learn/phone-class.js`, `learn/offline.js` |
| 7 | Exam cycle: marks, check, approval, report card, parent meeting slots | **Built.** Paper per subject per section; teacher enters; dean checks; principal approves; principal or registrar publishes; sent back with a reason; report card from what is published; printed; meeting slots by roll order or chosen by families | `0029`, `routes/exams.js`, `learn/exams.js` |
| 8 | Live list under 75% | **Built.** Counts the year, projects the days left, tells "under" from "cannot reach it" from "leave might be condoned"; condonation case; board list download | `routes/register.js`, `services/register.js` |
| 9 | Fees: cap calculator, UPI, accounting export, dues kept from the child | **HELD** (see below). The one part that is a rule, not a ledger, is built: nothing about a certificate or a result reads anything about money, and a test says no certificate field is about money | – |
| 10 | Money the state owes for free-quota seats | **HELD** (same ruling) | – |
| 11 | Android-first parent app in Hindi and Punjabi | **Partly.** The family page reads in Hindi and Punjabi (73 words and phrases: the places, states, report card, diary, meetings, progress card); report cards, parent meetings, diary and progress card are there. **Not built:** an installable Android app, text-message or WhatsApp fallback, translation of the rest of the page, review by a native reader | `learn/i18n.js` |
| 12 | Transfer certificates that auto-post to the website | **Built.** Numbered TC / bonafide / character certificates (never repeated, safe in parallel); a TC takes the child out of the section; prints in the usual form; a public disclosure page the school links to, listing only the TCs the office ticked, **off until the school switches it on** | `0031`, `learn/disclosure/` |
| 13 | Holistic Progress Card | **Built (v1).** Teacher, child, classmate and parent words with the levels by subject and term; printable. **Not built:** the child's own screen to write their words (the API takes it), and the official HPC stage layouts | `0032`, `routes/competency.js`, `learn/hpc.js` |
| 14 | Skills-based gradebook, % at grade level per skill | **Built.** The school's own competencies; 1–4 per child per term; the share at grade level per skill, lowest first, by section; what is carried to next year's teacher | same |
| 15 | Early dropout warnings, Class 8→9 and 10→11 | **Built.** Attendance, marks falling, age against the class, migrant, special needs, and the edges of stages (V, VIII, X); each flag says why; mentoring case with a home-visit log; the child and family do not read it | `services/early.js` |
| 16 | One-click exports to the government and boards | **Not as asked.** The board eligibility list (75%, condonation status) downloads; the existing APAAR / state student list / consent / register lists stay. **UDISE+, CISCE and CBSE upload layouts are not built:** the layouts are not public and are the school's to supply | – |
| 17 | AI that grades from a photo, teacher signs off | **Not built.** It needs a model key and the AI panel another chat is building; an unverifiable half would be worse than none | – |

## Held, and why

The user ruled on 2026-10-07: *"we do not deal anything related to Finance for oedu, only if in the future i change my mind."* The playbook lists fees and the free-quota reimbursement as the hook that makes schools switch (items 9 and 10). They are not built. **If that ruling has changed, say so** and they are the next slice; the data they need (sections, rolls, categories incl. EWS/DG) is in.

## Proved

Every claim above has a check. On a **brand-new database** (every migration 0001–0032 from scratch, one administrator, an Indian school):

| Proof | Steps |
|---|---|
| `prove-india` | 12 |
| `prove-school` (profile, roster, register, lock, diary, messages, day timing, early warning, board list) | 30 |
| `prove-exams` | 13 |
| `prove-certificates` | 10 |
| `prove-hpc` | 9 |
| `prove-attendance`, `prove-schedule`, `prove-platform`, `prove-care`, `prove-enrollment`, `prove-facilities`, `prove-student` | 27, 23, 12, 15, 48, 32, 9 |

Unit checks (no database): profile 8, locale 5, register 9, grading 10, early 10, competency 4, certificates 4, offline queue 10, i18n 4, India 18, enrollment 27. Run any with `node api/scripts/<name>.mjs`; the proofs need `API=… ORIGIN=… CRED=<json of an administrator>`. The proofs are re-runnable and leave nothing that breaks the next run, except a **lock on attendance, which cannot be taken back by design** (the proof locks a span in April that only it uses).

Browser checks (the in-app pane, desktop and a 375px phone): Settings › School, Classes (add, number, promote), Class registers (take and save), the 75% watch, Early warning, Exams (a paper's marks, hand-in, scales), Competencies (grid), the phone "Your class" (taken **with the signal cut and restored**: kept, then sent, then read back from the server), the public disclosure page, and the family page in Hindi with the report card.

## What was checked against the world (deep-research part)

- CBSE nine-point grades A1 (91–100) … E2 (0–20), D 33–40 the lowest pass: several sources agree. They also describe the grades as ranked rather than fixed-band, and one says the report format changes from 2027. So the template says "check this against the current circular", and the school owns its bands.
- 75% attendance for Classes X and XII, counted to **1 January**, with relaxation up to 25% for medical and sports cases with papers; shortage cases go to the regional office in early January (**dates from a single news source**: confirm on cbse.gov.in). The threshold is a setting, not a constant, for this reason.
- CISCE pass marks **conflict** between sources (35 vs 33; ISC 40 vs 35): the CISCE template carries no bands and leaves the pass mark to the school.
- Not verified at all, left for counsel or a CA: the Punjab 5% and Chandigarh 8% fee caps, Chandigarh no-detention, DPDP timing, ISC pass mark. Nothing in this build depends on them.

## Things decided on the way

- **A class teacher's correction window is the school's setting; there is no default.** A first version defaulted to three days for an Indian school; a fresh database showed it breaking existing behaviour and the need for it is already met by the lock.
- An Indian school with no codes of its own starts from four (Present, Absent, Late, On leave), not the US five (the fifth was "Cut"). The leave code keeps the key `excused`.
- The early-warning list ignores a child with under ten marked days: a child absent on day one is not at 0%.
- The public disclosure shows, per transfer certificate, only number, name, class last studied, day left and day issued, and only if the school switched publishing on and the office ticked that certificate.
- Levels for competencies are Beginning, Developing, Proficient, Advanced. They are generic names; the official stage labels should replace them once the school says which it uses.

## Deploy (not run)

Migrations **0026–0032** are additive (new columns, new tables, one backfill in 0027, a unique index on roll numbers that first clears duplicates). Order: remote migrations, then the API, then edu, as in `OEDU_INDIA_DEPLOY.md`; `/me` reads `o.*` so a new column never needs the migration to land first. **0025 belongs to the AI panel branch**; these start at 0026 on purpose. The disclosure page is served at `/disclosure/?school=<slug>` on the edu host.

## Not done, said plainly

Cold-start offline (a service worker); an installable app; text and WhatsApp fallback; every UDISE+/board upload format; AI marking; fees and the free-quota ledger (held); the student's own screen to write their progress-card words; admissions on the Indian year (the enrollment screens still run June to May and list US grades); the remaining US wording across the console; Hindi and Punjabi beyond the words listed, and a native reader's review of those; a phone page for the exam screens (they open in the console's own page in a layer).
