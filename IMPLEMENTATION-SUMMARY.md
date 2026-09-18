# OEdu Implementation Summary

## What was built

A 5-section student navigation for OEdu with new views, Apple design language, and the Course data model documented.

The build first shipped a separate Class concept (a "My Classes" tab, a Class Home screen, and `/classes/*` API calls). It was removed on 2026-09-18: OEdu has courses and nothing beside them.

## Files created (3 new view modules)

| File | View | Purpose |
|---|---|---|
| `learn/assignments.js` | Assignments | All assigned work across courses, sorted by due date |
| `learn/progress.js` | Progress | Mastery, streak, badges, week overview, daily goal |
| `learn/library.js` | Library | Published courses and study sets catalog |

## Files modified

| File | Change |
|---|---|
| `learn/index.html` | 5-section navigation, 3 new view sections, 3 new script tags |
| `learn/app.js` | View routing for new sections, OPLO_APP bridge, record→progress sync |
| `learn/api.js` | New `assignments` endpoint group (2 methods) |
| `learn/app.css` | Apple design styles for assignment, library, progress views |
| `OEdu-Architecture.md` | Full product architecture document |

## Navigation

Home · Explore · Assignments · Progress · Library

## Architecture decisions

- **One Course**: a course carries the curriculum, who is enrolled, the work set on it and every mark. There is no Class or section object.
- **Assignment is the universal primitive**: connects Course → Student → Grade.
- **Local first**: all new views read from the API when online, gracefully degrade when offline.
- **Apple HIG**: `--paper #ffffff`, `--canvas #f5f5f7`, `--ink #1d1d1f`, `--blue #0071e3`, SF Pro fonts, 16px cards, 100px pills, translucent sticky bars.

## API endpoints needed (server-side)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/assignments?student=true` | All assignments for a student |
| GET | `/api/v1/assignments?upcoming=true` | Upcoming assignments |

## Blocked on backend

- `/api/v1/assignments` needs server implementation before the Assignments view can load
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
