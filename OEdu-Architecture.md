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
| GET | `/api/v1/assessments` | Assessments set for the caller, replacing the public `learn/assessments/index.json` |
| GET | `/api/v1/assessments/:id` | The student spec, released only to an assigned student within the sitting's window — exam questions must not be public files |
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
├── assessments/        — Published assessment specs (no answers) and who each is for
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
