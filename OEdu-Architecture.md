# OEdu — Product Architecture

## 1. Overview

OEdu is an Oplo product for schools: courses you work through by solving, study sets you drill until they stick, and one record that students, teachers, and families all read the same way. This document defines the product architecture — the data model, the screen map, and the design principles that govern every decision below it.

## 2. Core Data Model

### 2.1 Course vs Class

The single most important distinction in OEdu:

| | **Course** | **Class** |
|---|---|---|
| What it is | Canonical curriculum — the syllabus, units, and content | Live enrollment instance — students, teacher, schedule |
| Written by | Authors / publishers | Teachers (instantiated from a Course) |
| Shared | Across all schools that license it | Only within the school that created it |
| Has | Units, readings, practice problems, study sets | Students, teacher, assignments, grades |
| Lifetime | Years | One term (or longer) |
| Example | "Media Arts Grade 10" | "Ms. Rivera's Period 3 Media Arts" |

A Course can have many Classes. A Class belongs to one Course. A student can be enrolled in a Class without having started the Course.

### 2.2 Entity Relationships

```
Organization
├── Course (canonical curriculum)
│   ├── Unit (sequenced learning material)
│   ├── StudySet (drillable terms, authored for a Course)
│   └── Assignment (work that can be set and graded)
│
├── Class (enrollment instance of a Course)
│   ├── Enrolment (Student ↔ Class, with role)
│   ├── Assignment (set on this Class, optional overrides)
│   └── Grade (mark on an Assignment, per student)
│
├── Student (Account with role "student")
│   ├── Enrolment (× many Classes)
│   ├── Progress (mastery record, synced)
│   ├── Transcript (formal record, graduation)
│   └── FamilyLink (guardians who can read)
│
└── Teacher (Account with role "teacher")
    ├── Teaching (Classes they teach)
    └── AuthoredContent (Courses, StudySets they created)
```

### 2.3 Assignment — The Universal Primitive

An Assignment is the thing a teacher sets. It is the most important object in OEdu because it connects everything:

```
Assignment
├── Course        — what curriculum it belongs to
├── Class         — who it is set for (optional: can be Course-level)
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
        ├── My Classes → Class list
        │   └── Class Home → Class detail
        │       ├── Assignments (set work)
        │       ├── Gradebook (per student)
        │       └── Roster (class members)
        ├── Explore (open catalog)
        │   ├── All courses
        │   └── Published study sets
        ├── Assignments (all work, across classes)
        ├── Progress (mastery, streak, badges)
        └── Library (published content)
```

### 3.2 Navigation

The top bar shows six sections:

1. **Home** — Command centre: standing, next step, set work, today's plan
2. **My Classes** — Every Class the student is enrolled in, with progress
3. **Explore** — Open learning catalog: courses and study sets not yet enrolled
4. **Assignments** — All assigned work across all Classes, sorted by due date
5. **Progress** — Mastery, streak, badges, week overview
6. **Library** — Published study sets and courses available to browse

### 3.3 Teacher Journey

```
Sign-in
└── Teacher home (/teacher/)
    ├── Teaching (Classes I teach)
    │   └── Class Home → Class detail
    │       ├── Roster (students)
    │       ├── Assignments (set and grade)
    │       ├── Gradebook (whole class)
    │       └── Reporting (comments, readiness)
    ├── Create (course or class)
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
| `/api/v1/courses` | Home, Explore, Library | List courses (mine or org) |
| `/api/v1/courses/:id` | Class Home | Course detail |
| `/api/v1/courses/:id/members` | Class Home | Class roster |
| `/api/v1/courses/:id/assignments` | Class Home, Assignments | Set work |
| `/api/v1/courses/:id/enrol` | Teacher | Enrol/unenrol |
| `/api/v1/grades` | Student, Teacher | Individual marks |
| `/api/v1/grades/batch` | Teacher | Fill a column |
| `/api/v1/grades/undo` | Teacher | Reverse a change |
| `/api/v1/courses/:id/gradebook` | Teacher | Whole class register |
| `/api/v1/courses/:id/whatif` | Teacher | Hypothetical grade |
| `/api/v1/grades/history` | All | Mark audit trail |
| `/api/v1/progress` | Sync | Student record sync |
| `/api/v1/gamification/standing` | Home | XP, rank, streak |
| `/api/v1/gamification/events` | Sync | XP events |
| `/api/v1/study-sets` | Explore, Library | Study sets |
| `/api/v1/teaching` | Teacher | Classes taught |
| `/api/v1/coursework` | Home | Set work summary |
| `/api/v1/family` | Parent | Children |
| `/api/v1/graduation` | Student | Diploma progress |
| `/api/v1/reporting` | Teacher | Reporting readiness |

### 5.2 Course/Class Endpoint Design

**New endpoints needed:**

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/classes` | Classes a student/teacher is enrolled in |
| GET | `/api/v1/classes/:id` | Class detail (roster, teacher, schedule) |
| POST | `/api/v1/classes` | Create a Class from a Course template |
| GET | `/api/v1/classes/:id/assignments` | Assignments set on this Class |
| POST | `/api/v1/classes/:id/assignments` | Set an Assignment on this Class |
| GET | `/api/v1/classes/:id/gradebook` | Whole class register |
| GET | `/api/v1/courses/catalog` | Open catalog (publishable courses) |

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
├── classes.js          — My Classes dashboard (NEW)
├── class-home.js       — Class homepage (NEW)
├── assignments.js      — Assignments view (NEW)
├── progress.js         — Progress/analytics view (NEW)
├── library.js          — Library/catalog view (NEW)
└── explore.js          — Explore catalog (NEW)
```

## 9. Implementation Priority

### Phase 1: Foundation — COMPLETED
- [x] Course/Class data model documented (Course = curriculum, Class = enrollment instance)
- [x] New student navigation (6 sections: Home, My Classes, Explore, Assignments, Progress, Library)
- [x] My Classes dashboard (`learn/classes.js`)
- [x] Explore page (exists via `app.js` drawExplore)

### Phase 2: Class Experience — COMPLETED
- [x] Class homepage for students and teachers (`learn/class-home.js`)
- [x] Assignment list across all classes (`learn/assignments.js`)
- [x] Class gradebook (teacher view, in class-home.js)

### Phase 3: Progress and Library — COMPLETED
- [x] Progress/analytics view (`learn/progress.js`)
- [x] Library/catalog view (`learn/library.js`)
- [x] Apple design language already built into existing app.css

### Phase 4: Teacher Tools — PARTIALLY IMPLEMENTED
- [x] Create assignment entry point (toast: "coming soon")
- [x] Class creation endpoint defined in API adapter
- [x] Interactive learning components (existing in app.js)

### Phase 5: Polish — NEXT STEPS
- [ ] API backend endpoints for `/classes/*` need server implementation
- [ ] Cross-device sync for new views (sync.js framework exists)
- [ ] DNS records for `auth.oplocloud.com` (manual Cloudflare setup required)
- [ ] Deploy auth Worker to custom domain after DNS resolves
