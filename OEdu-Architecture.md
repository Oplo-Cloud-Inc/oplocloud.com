# OEdu — Product Architecture

## 1. Overview

OEdu is an Oplo product for schools: courses you work through by solving, study sets you drill until they stick, and one record that students, teachers, and families all read the same way. This document defines the product architecture — the data model, the screen map, and the design principles that govern every decision below it.

## 2. Core Data Model

### 2.1 The Course

The Course is the one thing people are enrolled in. It carries the curriculum — units, readings, practice, study sets — and everything that happens around it: who teaches it, who takes it, the work set on it, and every mark.

The written curriculum ships with the app (`data.js`) and is matched to a database course by its code, so a database course `media` shows the Media Arts units. A student can be enrolled in a course without having started it.

OEdu has no Class (section, period, or "My Classes") concept. One was added on 2026-09-18 and removed the same day: a teacher's roster, gradebook and work are the course's, and there is no second object to keep in step with it. Do not reintroduce it.

### 2.2 Entity Relationships

```
Organization
├── Course (curriculum and enrolment)
│   ├── Unit (sequenced learning material)
│   ├── StudySet (drillable terms, authored for a Course)
│   ├── Enrolment (Account ↔ Course, with role: student, teacher, assistant)
│   ├── Assignment (work that can be set and graded)
│   └── Grade (mark on an Assignment, per student)
│
├── Student (Account with role "student")
│   ├── Enrolment (× many Courses)
│   ├── Progress (mastery record, synced)
│   ├── Transcript (formal record, graduation)
│   └── FamilyLink (guardians who can read)
│
└── Teacher (Account with role "teacher")
    ├── Teaching (Courses they teach)
    └── AuthoredContent (Courses, StudySets they created)
```

### 2.3 Assignment — The Universal Primitive

An Assignment is the thing a teacher sets. It is the most important object in OEdu because it connects everything:

```
Assignment
├── Course        — what it is set on, and so who it is set for
├── Title         — what it is
├── Category      — Work, Quiz, Project, Exam, Reading
├── OutOf         — maximum score
├── DueAt         — when it is due
├── Status        — open, marked, missing, excused
├── ExtraCredit   — whether it can raise a grade above 100%
├── Grade         — per student: score, feedback, gradedBy, gradedAt
└── History       — every change, who, from what, to what, why
```

Work with no mark yet is not invisible — it is the only work a student can still do something about.

## 3. Screen Map

### 3.1 Student Journey

```
Sign-in (Root)
└── Home (role-based redirect)
    └── Student home (/student/)
        ├── Explore (open catalog)
        │   ├── All courses → Course (units, study sets, mastery)
        │   └── Published study sets
        ├── Exams (assessments set for this student)
        │   └── Briefing → Tasks → Review → Submitted
        └── Progress (mastery, streak, badges)
```

### 3.1a Addresses

Every student place has an address, and the address is the place — typed, bookmarked, shared or reloaded, it opens the same screen (`learn/app.js`, `route()`). The browser's Back and Forward are the only back; the app draws no back button of its own.

```
/student/                                   Home
/student/Explore                            everything on offer
/student/Science                            a subject
/student/Science/Biology                    a course (spaces become hyphens)
/student/Science/Biology/Map                its knowledge map
/student/Science/Biology/u1                 a unit
/student/Science/Biology/u1/l3              a lesson
/student/Science/Biology/u1/l3/Questions    the questions after it
/student/Science/Biology/u1/Practice        a unit's practice
/student/English/Media-Arts/u9/l2/Challenge a lesson's challenge
/student/English/Media-Arts/u9/Challenge    the unit review, mixed from every lesson
/student/Sets/<id>, /Sets/<id>/Flashcards   a study set and a way of studying it
/student/Exams, /Exams/<id>, /Progress, /Grades, /Account, /Notebook, /Mistakes
```

The Worker answers any `/student/…` address without a file extension with the app itself, and the page sets its own base so its files load from the root at any depth. The page carries a plain `<base href="/">` too, which the script corrects when the app is served from a folder: the browser starts fetching files before any script runs, and without it a deep link fetched every file twice. The console (`/admin/`, `/teacher/`) has no addresses of its own yet.

### 3.2 Navigation

The top bar shows four sections, and only four:

1. **Home** — Command centre: standing, next step, set work, today's plan
2. **Explore** — Open learning catalog: courses and study sets
3. **Exams** — Assessments set for this student, run by `learn/exam.js` to [the Assessment Experience System](docs/OEDU_ASSESSMENT_EXPERIENCE_SYSTEM.md)
4. **Progress** — Mastery, streak, badges, week overview

Assignments and Library were removed on 2026-09-18: set work already shows on Home, and Explore is the catalogue.

### 3.3 Teacher Journey

```
Sign-in
└── Teacher home (/teacher/)
    ├── Teaching (Courses I teach)
    │   └── Course
    │       ├── Roster (students)
    │       ├── Assignments (set and grade)
    │       ├── Gradebook (whole course)
    │       └── Reporting (comments, readiness)
    ├── Create (course)
    │   ├── AI-assisted (describe → syllabus)
    │   └── Manual (fill the form)
    └── Authored (my Courses and StudySets)
```

### 3.4 Checks beside the reading

While a student reads a lesson, a few small checks sit in the right-hand margin at the passages that matter most — the places the text itself warns a reader will slip. They are formative (docs/OEDU_ASSESSMENT_EXPERIENCE_SYSTEM.md §24, §35, §58): always there, never a popup, marked at once with the reason, retryable, and switchable off. They share the margin with the student's own notes and are laid out with them, each level with its line. Results are the progress scope `checks`, so they follow the student between devices and their teachers can see which ideas took two tries. Written so far: Biology Unit 1 (`learn/checks-bio1.js`, 25 checks).

### 3.5 Challenges

Where a check asks whether a passage landed, a challenge asks the student to use it. Each lesson ends by offering its challenge — a short path of problems, one to a screen, solved by doing something with the idea rather than recalling a sentence: building Freytag's pyramid from its parts, crewing a production from its problems, laying clips under the music they belong with, packing a DVD case (`learn/challenge.js`, `learn/challenge.css`). The problem comes first and the explanation after it; every wrong answer a student is likely to give has its own reply aimed at the misunderstanding it shows; hints step down one at a time; "Show me" appears after two tries; a self-explanation is compared with a model answer and rated by the student, never by a machine. The end of a path says what the student showed and what is worth another look — no points, no confetti.

Step types: `choice`, `multi`, `sort` (cards into bins), `order`, `slots` (cards onto a diagram, or against labels), `spot` (tap the sentences that do something), `number`, `explain`, and `learn` idea cards between problems. Every card can be dragged, or tapped and then placed, and every control is a button.

The unit review (`…/uN/Challenge`) is not written; it is drawn from the lessons: problems the student needed help with first, then ones not yet tried, then ones already solid, interleaved so no two in a row come from the same lesson. Results are the progress scope `challenges` — first try, tries, hints, whether the answer was shown, and whether the latest solve was clean — merged across devices like checks. Written so far: Media Arts Unit 9 (`learn/challenges-media9.js`, 46 problems across 9.1–9.9).

## 4. Design Principles

### 4.1 Apple Human Interface Guidelines

OEdu follows Apple's design language:

- **Near-monochrome palette** — white paper, grey canvas, black ink, one blue accent
- **Typography** — SF Pro Display (headings), SF Pro Text (body), Inter (web fallback)
- **Spacing** — generous, with clear hierarchy; space does the work decoration usually does
- **Translucency** — sticky bars with `backdrop-filter: saturate(180%) blur(18px)`
- **Rounded corners** — 16px for cards, 100px for pills and buttons, 14px for panels
- **No decoration** — colour is spent on state and nothing else
- **Motion** — subtle easing (`cubic-bezier(.28,.11,.32,1)`), `prefers-reduced-motion` respected

### 4.2 Architectural Rules

1. **The server decides who the user is.** The frontend never names its own account.
2. **The server decides what every request may read.** The frontend's hiding of a button is decoration; the API's refusal is the permission.
3. **A page shown to the wrong person would still be refused every row it asked for.** Security is enforced at the boundary, not at the surface.
4. **Nothing that ships can be destroyed by an edit.** Local overlays patch, never replace, shipped content.
5. **A convincing lie is worse than a missing feature.** If data isn't there, say so — don't show a fake.
6. **Mastery never falls.** Local records can only raise; the server's answer replaces the local one entirely for experience totals.
7. **Merge, never replace.** Sync merges field by field, never overwrites wholesale.
8. **The server's clock, never ours.** Every write carries `base`: the server's `updatedAt` this device last saw.
9. **Local first.** Offline, work stays here and is marked owed.
10. **A gradebook that explains itself.** Missing, excused, and late mean what they say; every change is kept.

## 5. API Surface

### 5.1 Endpoints Used by the Frontend

| Endpoint | Used by | Purpose |
|---|---|---|
| `/api/v1/me` | All | Who is signed in |
| `/api/v1/courses` | Home, Explore | List courses (mine or org) |
| `/api/v1/courses/:id` | Course | Course detail |
| `/api/v1/courses/:id/members` | Teacher | Course roster |
| `/api/v1/courses/:id/assignments` | Teacher | Set work |
| `/api/v1/courses/:id/enrol` | Teacher | Enrol/unenrol |
| `/api/v1/grades` | Student, Teacher | Individual marks |
| `/api/v1/grades/batch` | Teacher | Fill a column |
| `/api/v1/grades/undo` | Teacher | Reverse a change |
| `/api/v1/courses/:id/gradebook` | Teacher | Whole course register |
| `/api/v1/courses/:id/whatif` | Teacher | Hypothetical grade |
| `/api/v1/grades/history` | All | Mark audit trail |
| `/api/v1/progress` | Sync, Exams | Student record sync; an exam sitting is the scope `exam:<id>` |
| `/api/v1/assessments` | Exams | What has been set for the caller — cards with the rules, no questions |
| `/api/v1/assessments/:id` | Exams | The questions, only to an assigned student once open (`PUT` publishes; administrators) |
| `/api/v1/gamification/standing` | Home | XP, rank, streak |
| `/api/v1/gamification/events` | Sync | XP events |
| `/api/v1/study-sets` | Explore | Study sets |
| `/api/v1/teaching` | Teacher | Courses taught |
| `/api/v1/coursework` | Home | Set work summary |
| `/api/v1/family` | Parent | Children |
| `/api/v1/graduation` | Student | Diploma progress |
| `/api/v1/reporting` | Teacher | Reporting readiness |

### 5.2 Endpoints Still Needed

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/assessments/:id/submit` | Lock a sitting on the server; today "submitted" is enforced by the client |

## 6. Progress Model

### 6.1 Mastery Dimensions

Five dimensions, weighted by cognitive demand:

| Dimension | Weight | Question |
|---|---|---|
| Recognise | 1.0 | Can you pick it out of four? |
| Recall | 1.4 | Can you produce it from nothing? |
| Explain | 1.8 | Can you say it in your own words? |
| Apply | 2.2 | Can you use it on a case you have not seen? |
| Transfer | 2.6 | Can you predict something the text never mentioned? |

Mastery = floor of weighted dimensions (not average). A student who recognises perfectly but cannot apply is not 70% done.

### 6.2 Six States

New → Exposed → Familiar → Developing → Strong → Mastered

A binary "mastered/not" hides "you are getting there" which is a true and useful thing to be told.

### 6.3 Retention

Decays with time, half-life proportional to how well it was known when last seen. Something strong fades slowly; something barely learned fades in a day. Repaired only by answering correctly after a gap — the one thing that cannot be faked in a single sitting.

## 7. Sync Model

- **Local first**: write to localStorage first, sync when possible
- **Merge, never replace**: field-by-field merge; mastery only rises
- **Server clock**: `base` (server's `updatedAt`) on every write; 409 on conflict → fetch, merge, retry
- **Scopes**: `record` (student record) and `set:<id>` (each study set)
- **Beacon**: page-closing writes with `keepalive`, capped at 60KB

## 8. File Map

```
learn/
├── index.html          — App shell: all views, chrome, and sign-in
├── app.css             — All application styles (Apple design language)
├── app.js              — Main controller: routing, state, games, sync
├── api.js              — Oplo API adapter (the seam to backend)
├── data.js             — Curriculum content and study sets
├── home.js             — Role-based routing (admin/teacher/student/parent)
├── school.js           — Local course/sets overlay (patches shipped content)
├── store.js            — Student record (mastery, mistakes, game, etc.)
├── sync.js             — Cross-device sync (merge, never replace)
├── learn.js            — Learning engine (5 dimensions, spaced repetition)
├── kmap.js             — Knowledge map visualization
├── home.js             — Role-based routing
├── exam.js / exam.css  — Assessment runtime: Exams tab, briefing, tasks, tools, review, submit
├── checks.js / .css    — Checks beside the reading: small formative checks in the margin, level with the passage
├── checks-<unit>.js    — Their content, per unit, each anchored to a phrase in the lesson text
├── challenge.js / .css — Challenges: problems solved by doing, one to a screen, and the mixed unit review
├── challenges-<unit>.js — Their content, per unit, keyed by section
└── progress.js         — Progress/analytics view
```

## 9. Implementation Priority

### Phase 1: Foundation — COMPLETED
- [x] Course data model documented (one Course carries curriculum, enrolment, work and marks)
- [x] Student navigation (4 sections: Home, Explore, Exams, Progress)
- [x] Explore page (exists via `app.js` drawExplore)

### Phase 2: Exams — COMPLETED (student side)
- [x] Assessment runtime (`learn/exam.js`) built to docs/OEDU_ASSESSMENT_EXPERIENCE_SYSTEM.md
- [x] Algebra 2 — MP4 QAM published for its one student

### Phase 3: Progress — COMPLETED
- [x] Progress/analytics view (`learn/progress.js`)
- [x] Apple design language already built into existing app.css

### Phase 4: Teacher Tools — PARTIALLY IMPLEMENTED
- [x] Interactive learning components (existing in app.js)

### Phase 5: Polish — NEXT STEPS
- [ ] Assessment endpoints (see 5.2), a teacher view of sittings, and scoring
- [ ] Cross-device sync for new views (sync.js framework exists)
- [ ] DNS records for `auth.oplocloud.com` (manual Cloudflare setup required)
- [ ] Deploy auth Worker to custom domain after DNS resolves
