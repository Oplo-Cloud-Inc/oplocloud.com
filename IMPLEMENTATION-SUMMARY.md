# OEdu Implementation Summary

## What was built

A complete 6-section student navigation for OEdu with new views, Apple design language, and the Course/Class data model architecture documented.

## Files created (5 new view modules)

| File | View | Purpose |
|---|---|---|
| `learn/classes.js` | My Classes | Dashboard showing all enrolled classes with progress |
| `learn/class-home.js` | Class Home | Class detail (assignments, roster, gradebook for teachers) |
| `learn/assignments.js` | Assignments | All assigned work across classes, sorted by due date |
| `learn/progress.js` | Progress | Mastery, streak, badges, week overview, daily goal |
| `learn/library.js` | Library | Published courses and study sets catalog |

## Files modified

| File | Change |
|---|---|
| `learn/index.html` | New 6-section navigation, 5 new view sections, 5 new script tags |
| `learn/app.js` | View routing for new sections, OPLO_APP bridge, record→progress sync |
| `learn/api.js` | New `classes`, `assignments` endpoint groups (7 methods) |
| `learn/app.css` | Apple design styles for class, assignment, library, progress views |
| `OEdu-Architecture.md` | Full product architecture document |

## Navigation

Home · My Classes · Explore · Assignments · Progress · Library

## Architecture decisions

- **Course vs Class**: Course = canonical curriculum. Class = enrollment instance. A course has many classes.
- **Assignment is the universal primitive**: connects Course → Class → Student → Grade.
- **Local first**: all new views read from the API when online, gracefully degrade when offline.
- **Apple HIG**: `--paper #ffffff`, `--canvas #f5f5f7`, `--ink #1d1d1f`, `--blue #0071e3`, SF Pro fonts, 16px cards, 100px pills, translucent sticky bars.

## API endpoints needed (server-side)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/classes?mine=true` | Classes a student/teacher is enrolled in |
| GET | `/api/v1/classes/catalog` | Published class catalog |
| GET | `/api/v1/classes/:id` | Class detail |
| GET | `/api/v1/classes/:id/assignments` | Assignments for a class |
| GET | `/api/v1/classes/:id/members` | Class roster |
| GET | `/api/v1/classes/:id/gradebook` | Whole class gradebook |
| GET | `/api/v1/assignments?student=true` | All assignments for a student |
| GET | `/api/v1/assignments?upcoming=true` | Upcoming assignments |

## Blocked on backend

- All `/classes/*` endpoints need server implementation
- DNS records for `auth.oplocloud.com` require manual Cloudflare setup (wrangler has only read zone permission)
- Deploy auth Worker to custom domain pending DNS resolution

## Design principles maintained

1. The server decides who the user is
2. The server decides what every request may read
3. Nothing that ships can be destroyed by an edit
4. A convincing lie is worse than a missing feature
5. Mastery never falls locally
6. Merge, never replace
7. The server's clock, never ours
8. Local first
9. A gradebook that explains itself
