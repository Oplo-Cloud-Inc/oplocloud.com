# OEdu Implementation Summary

## What was built

A 4-section student navigation for OEdu — Home, Explore, Exams, Progress — with Apple design language and the Course data model documented. Assignments and Library were removed on 2026-09-18; Exams is the assessment runtime in `learn/exam.js`.

The build first shipped a separate Class concept (a "My Classes" tab, a Class Home screen, and `/classes/*` API calls). It was removed on 2026-09-18: OEdu has courses and nothing beside them.

## Files created

| File | View | Purpose |
|---|---|---|
| `learn/exam.js`, `learn/exam.css` | Exams | The assessment runtime — see docs/OEDU_ASSESSMENT_EXPERIENCE_SYSTEM.md |
| `learn/progress.js` | Progress | Mastery, streak, badges, week overview, daily goal |

## Files modified

| File | Change |
|---|---|
| `learn/index.html` | 4-section navigation (Home, Explore, Exams, Progress) |
| `learn/app.js` | View routing for new sections, OPLO_APP bridge, record→progress sync |
| `learn/api.js` | No new endpoint groups; exam sittings use `progress` |
| `learn/app.css` | Apple design styles for the progress view |
| `OEdu-Architecture.md` | Full product architecture document |

## Navigation

Home · Explore · Exams · Progress

## Architecture decisions

- **One Course**: a course carries the curriculum, who is enrolled, the work set on it and every mark. There is no Class or section object.
- **Assignment is the universal primitive**: connects Course → Student → Grade.
- **Local first**: all new views read from the API when online, gracefully degrade when offline.
- **Apple HIG**: `--paper #ffffff`, `--canvas #f5f5f7`, `--ink #1d1d1f`, `--blue #0071e3`, SF Pro fonts, 16px cards, 100px pills, translucent sticky bars.

## API endpoints needed (server-side)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/assessments` | Assessments set for the caller |
| GET | `/api/v1/assessments/:id` | The student spec, released at sitting time only |
| POST | `/api/v1/assessments/:id/submit` | Server-side lock on a submitted sitting |

## Blocked on backend

- Assessment endpoints: until they exist, exam questions are public static files (never answers)
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
