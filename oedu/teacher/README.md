# OEdu · Teacher

**All-in-one, without the bloat.** One primitive — *the session* — and three surfaces.
Zero build step: plain HTML, CSS, and ES modules. Just serve the folder.

A **session** is one class, at one time, on one day. Everything a teacher does is
before / during / after a session, so the app isn't a suite of modules — it's a
**timeline of sessions**, and attendance, plans, exams, and grades are attachments
to one. Everything **persists** in the browser (localStorage); reset from
**Settings → Reset all data**.

## Run it

```bash
cd "OEdu Teacher"
python3 -m http.server 4599
# open http://localhost:4599
```

Any static server works (`npx serve`, VS Code Live Server, etc.). It must be
served over HTTP — ES modules don't load from `file://`.

## Three surfaces (not ten)

| Surface | What it is |
|---|---|
| **Today** | The session timeline — open the app, see your day. A *Needs you* strip surfaces post-session admin (grade yesterday's exam, take a missed register) only when relevant. Tap a session → its workspace. |
| **Roster** | The people. Class-level analytics live inline (attendance, GPA, at-risk) and update with the class filter. Tap a student → their whole story + an AI report-card comment. |
| **Library** | Reusable lesson plans, exams, and assignments you build once and pull into any session. |

There is no Attendance tab (you take it *inside* the session), no Schedule tab
(Today *is* the schedule), no Messages inbox, and no separate Analytics dashboard.

## The session workspace + the two laws

Tap a session and it becomes a focused workspace with exactly **one primary action**
(*Take attendance* now, *Grade* after), the roster to mark, and the plan/assignment
attached.

- **Law 1 — Single Entry.** Mark a student absent once and it saves instantly and
  propagates — session register, roster, class rate, records. No re-entry anywhere.
- **Law 2 — Close the Loop.** When an absence crosses the threshold, a card appears
  *right there*: "Maya has now missed 3 of the last 5 sessions" → **Review & send** →
  an AI-drafted parent note you approve and send. Admin that visibly *does something*.

AI is quiet plumbing (parent notes, report-card comments) — never a headline feature.

## Beating the incumbents (v2)

Google Classroom knows what you *assigned*; MagicSchool knows how to *write* things;
neither knows what happened **in the room**. OEdu owns the session and attendance, so
everything else gets better. Built on top of the three surfaces:

- **Sign in — three roles.** OEdu Identity (`auth.js`) is the app's **own** auth (not
  Google): **Teacher**, **Admin**, **Guardian**. Demo any of them from the login screen.
- **A real gradebook** (Roster → *Gradebook*) — **weighted categories**, automatic
  calculation, and a **standards-based** view. The thing Classroom doesn't have.
- **OEdu Family — the parent surface.** The loudest Classroom complaint, fixed and then
  some. Multi-child home with a weekly digest; per-child a full **report card** across
  subjects (with trend + standards mastery), a plain-language "how they're doing" summary,
  **insight cards** that flag concerns and celebrate wins, an **attendance heatmap**,
  **missing / due-soon / graded** work with teacher feedback, this week's schedule, the
  notes school sent, and one-tap **Message a teacher / Request a conference**. Mobile-first.
- **Admin mode** (a separate mode, not a fourth tab) — accounts + guardian linking,
  tunable Close-the-Loop **thresholds**, and school settings.
- **Zero tools, infinite actions.** No AI tool directory. AI appears as an action on the
  thing you're already looking at, already knowing the context: *"Build a catch-up pack
  for the 4 who missed this"*, *"Draft report comments from these scores"*, *"Level this
  for the students below grade"*, *"Plan next session"*.
- **Migration** (Library → *Import*) — one-click Google Classroom / Docs import.

### Two clean seams (stubbed, ready to wire)

- **The model.** All AI routes through `callModel()` in `ai.js`. Real production prompts
  already live in `PROMPTS`; local drafts stand in until you point `callModel` at your
  inference endpoint. Change **one function**.
- **The backend.** `auth.js` ships a `LocalAuthProvider`; an `ApiAuthProvider` sketch shows
  the same interface against your server. Real Google Docs interop needs OAuth + a backend
  and is *simulated* here on purpose.

## Design system

The through-line is a **subject-color system**: every subject (Math=violet,
Physics=sky, English=blush, Art=peach, Chemistry=mint, Biology=teal,
History=amber, CS=lilac) keeps the same tint everywhere — exam cards, timetable
blocks, assignment tags, analytics series, student chips. That consistency is
what makes the product read as one system.

- **Type** — `Bricolage Grotesque` (display), `Inter` (UI), `JetBrains Mono` (data/times)
- **Tokens** — all color, radius, shadow, and motion live as CSS variables in `assets/css/app.css`
- **Quality floor** — responsive to mobile (nav drawer), visible keyboard focus, `prefers-reduced-motion` respected

## Structure

```
index.html
assets/
  css/app.css        design tokens (light + dark) + every component
  js/
    data.js          seed data + the app's "today" (students, schedule, exams, …)
    store.js         persistent state + SESSION engine + gradebook + two laws
    auth.js          OEdu Identity — own auth, roles; swap point for your backend
    ai.js            AI service — real prompts + local drafts + one callModel() seam
    modal.js         modal / form-builder / confirm / aiModal (the draft UX)
    icons.js         inline line-icon set
    ui.js            DOM helpers, tints, avatars, SVG charts, toasts, file export
    views.js         teacher surfaces (today/session/roster/library/gradebook)
    guardian.js      the Family surface (parents see grades)
    admin.js         admin mode (accounts, thresholds, school)
    app.js           auth-gated shell + role router + theme
```

The seed lives in `data.js`; the live, mutable state lives in `store.js`. To back
it with a real API, swap the store's read/write functions — the views already go
through it. Bump the store's version key to invalidate saved state after a schema
change.

## Shortcuts

- `⌘/Ctrl + K` — focus search
- `⌘/Ctrl + D` — jump to Today
