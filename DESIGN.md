# Design law of Oplo Learn

What the front end of edu.oplocloud.com (`learn/`) depends on, in one place. It is the part of the
Rebuild Brief (Volume 01, the design system) that the code enforces, plus the decisions made since
(D1 to D12 in `docs/OEDU_INDIA_SCHOOL_OS_PLAN.md`). Where this file and the brief differ, the brief's
Volume 01 wins over the screen blueprints and this file says so; where the plan amended the brief, the
amendment is marked.

`node api/scripts/check-design.mjs` fails when this file falls behind the code: a token family, a
template, a component file or a phone answer that is not written here, or a browser-surface rule that
is missing from `base.css` (codes DES001 to DES005, explained in `learn/README.md`).

## The look

Flat. Hairlines, not shadows; solid fills, not gradients; no emoji; no illustrations. Colour is meaning:
the accent marks the one thing to press, green, amber, red and blue say done, watch, problem and
information, and a status is never colour alone (the word and a small icon come with it). Only what
floats (a menu, a drawer, a modal, a toast) casts a shadow.

**Cards are for queue items and asides only.** A record's Overview is a main tab panel plus an aside,
not a stack of cards. A card is a titled, hairline-bordered box (`C-14`, `learn/ui/surfaces.js`) that
holds one thing a person acts on: a task in a queue, a fact beside the record. A page made only of
cards is a list that has not been designed.

## Tokens

`learn/tokens.css` is the only file allowed a raw colour, a raw type size or a raw shadow;
`api/scripts/check-ui.mjs` (UI001 to UI007) fails the build anywhere else, and `tools/check_tokens.py`
checks every text/background pair for contrast in all four themes (text 4.5:1, large text and UI parts
3:1). A theme is a block of the same names with other values, chosen by
`<html data-theme="light|dark|auto|hc">`; a density by `data-density="comfortable|standard|dense"`;
a shell by `data-shell="family"`.

| Family | Names | What it holds |
|---|---|---|
| Colour | `--c-*` | surfaces and lines (`bg`, `bg-subtle`, `surface`, `surface-raised`, `line`, `line-strong`, `line-input`, `scrim`), text (`text`, `text-2`, `text-3`), accent (`accent`, `accent-hover`, `accent-soft`, `on-accent`), meaning (`success`, `warning`, `danger`, `info`, each with `-soft`), focus (`focus`, `focus-solid`), eight chart colours (`chart-1` to `chart-8`) |
| Font | `--font-*` | `ui` (Inter, then Noto Sans and Noto Sans Devanagari), `mono` |
| Type | `--t-*` | a whole `font` shorthand each: `display` 28/36, `h1` 22/30, `h2` 17/24, `h3` 15/22, `body` 14/20, `body-strong`, `small` 13/18, `caption` 12/16, `caption-track`, `control-phone` (16 px) |
| Weight | `--w-*` | `regular` 400, `medium` 500, `strong` 600, `display` 650 |
| Space | `--s-*` | a 4 px base: `s-1` 4, `s-2` 8, `s-3` 12, `s-4` 16, `s-5` 20, `s-6` 24, `s-8` 32, `s-10` 40, `s-12` 48 |
| Layout | `--page-*`, `--max-*`, `--rail-*`, `--topbar-*` | `page-pad` (24, 16 under 1024, 12 under 640), `max-list` 1440, `max-form` 960, `rail-w` 240, `rail-w-collapsed` 64, `topbar-h` 56 |
| Radius | `--r-*` | `sm` 6, `md` 10, `lg` 14, `full` |
| Elevation | `--e-*` | `e-1` for popovers and menus, `e-2` for drawers and modals; nothing else has one |
| Motion | `--dur-*`, `--ease-*` | `dur-fast` 120 ms, `dur-modal` 160, `dur-drawer` 200; reduced motion removes all of it |
| Layers | `--z-*` | `rail` 10, `topbar` 20, `sticky` 30, `drawer` 40, `modal` 50, `toast` 60, `palette` 70 |
| Density | `--ctl-*`, `--row-*`, `--cell-*` | `ctl-h` (control height 36, 40 comfortable, 32 dense), `row-h`, `cell-py`. Density never changes the type size |

The type scale has one more step for the **family shell** (D5): `[data-shell="family"]` makes the body
16 px (17 px in Hindi, with a line of at least 1.6), scales the headings to match, and sets the control
height to 44 px so every target is at least 44 px high. A text field is 16 px at every width (under 640 px
the admin's fields are 16 px too, D6, so iOS Safari does not zoom). The admin keeps 14 px. The
gallery draws the same sign-in screen at both scales side by side (`family` section).

### Browser surfaces

What the browser paints itself is themed from the tokens in `base.css`, inside `.ol-app` and the
overlays: `::selection` (the accent with its own text colour), `caret-color`, `accent-color` (native
ticks and toggles), `scrollbar-color` (the thumb on a transparent track, including the page's own).

## Breakpoints

| Name | Width | The shell |
|---|---|---|
| Phone | under 640 | the rail becomes a menu; tables become cards (`C-10` card mode: a title, two secondary fields, the status); drawers are full-screen sheets; fields are 16 px |
| Tablet | 640 to 1023 | the rail is icons; two-column card grids; drawers 90% wide |
| Laptop | 1024 to 1439 | the full rail; drawers 560 and 720 |
| Desktop | 1440 and up | content centred at 1440; a record's side column is shown |

## Templates

Every screen declares one (`OL.pages.register(key, { template: "T2", … })`; UI013 fails a page that does
not). The template owns the order of the parts and the states every page of its kind has; the page owns
its words, its columns and what its buttons do. Built templates are in `learn/ui/templates.js`; the page
furniture they share (header, search, numbers, toolbar) is `learn/ui/page.js`.

| | Template | Use it for | Built |
|---|---|---|---|
| T1 | Today / Dashboard | a role's front door: greeting, at most six numbers, a grid of cards that each load alone | not yet (Today, Step 4) |
| T2 | Index | any list of records: header with one primary action, numbers, toolbar, table, bulk bar, server paging | yes: Directory, Admissions, Classes, Guardians |
| T3 | Record | one student, section, application: header with Back, tabs, a main panel and an aside | yes: a student's record, a section's record |
| T4 | Workspace | dense, keyboard-driven grids: the register, marks, the timetable builder, cover; the rail folds to icons | not yet; its engine is `learn/ui/grid.js` |
| T5 | Form | create or edit with more than twelve fields, several sections or a live preview; 960 wide, a footer that is the same everywhere | not yet as a template; the student form is one |
| T6 | Wizard | steps that depend on each other: import, new academic year, exam series; each step saves a draft | not yet |
| T7 | Settings | cards that each save on their own, with an audit entry; the shell's sub-tab row is the list of groups until a page needs more | yes: Admin › Settings › Modules (`learn/settings/modules.js`) |
| T8 | Calendar and timetable | month, week and day views with the date navigator, legend chips, clashes outlined | not yet |
| T9 | States | empty, loading, error, not permitted, not built: the copy patterns of the brief's Part 4 | the states of T2 and T3 are in `templates.js`; the parts are in `surfaces.js` |

Which surface for create and edit: one decision with no fields is a confirm dialog (440); up to four
fields a quick dialog (520); five to twelve fields one record a side drawer (560, or 720 with a
preview); more than that a T5 page or a T6 wizard.

## Components

One file each in `learn/ui/`, tokens only, a documented list of states, drawn in every state, theme,
density and language by the gallery (`learn/_ui.html`, never published). `learn/ui/index.js` is the
catalogue the gallery and the tests read.

| ID | Component | File |
|---|---|---|
| C-01 | Button | `learn/ui/button.js` |
| C-02 | Input and textarea | `learn/ui/input.js` |
| C-03 | Select (searchable) | `learn/ui/select.js` |
| C-04 | Class and section picker | `learn/ui/classpicker.js` |
| C-05 | People picker | `learn/ui/people.js` |
| C-06 | Date and time | `learn/ui/datetime.js` |
| C-07 | Chips and segmented control | `learn/ui/chips.js` |
| C-08 | Date navigator | `learn/ui/datenav.js` |
| C-09 | Tabs, sub-tab row | `learn/ui/tabs.js` |
| C-10 | Data table, with card mode | `learn/ui/table.js` |
| C-11 | Grid editor | `learn/ui/grid.js` |
| C-12 | KPI tile | `learn/ui/surfaces.js` |
| C-13 | Status pill | `learn/ui/pill.js` |
| C-14 | Card | `learn/ui/surfaces.js` |
| C-15 | Drawer | `learn/ui/drawer.js` |
| C-16 | Modal dialog | `learn/ui/modal.js` |
| C-17 | Toast | `learn/ui/toast.js` |
| C-18 | Banner | `learn/ui/surfaces.js` |
| C-19 | Empty state | `learn/ui/surfaces.js` |
| C-20 | Skeleton | `learn/ui/surfaces.js` |
| C-21 | Avatar | `learn/ui/surfaces.js` |
| C-22 | Breadcrumb | `learn/ui/breadcrumb.js` |
| C-23 | Command palette | `learn/shell/palette.js` |
| — | Checkbox, radio, switch | `learn/ui/check.js` |
| — | Menu | `learn/ui/menu.js` |

Not built yet, written in the step that first needs them: C-24 stepper (Admissions), C-25 chart wrapper
(Insights), C-26 phone preview and C-27 file uploader (Communicate and the forms), C-28 timeline (record
pages), C-29 print layout (certificates, receipts, report cards), C-30 inline help, and the family
bundle's C-31 bottom tab bar, C-32 one-time-code input and C-33 child switcher.

The rest of `learn/ui/` is plumbing: `core.js` (the `OL` namespace, `OL.h`, overlays, shortcuts),
`icons.js` (one outline set, 1.5 px, a sprite), `page.js` and `templates.js` (above), `index.js` (the
catalogue), `gallery.js` (the gallery page). The shell is `learn/shell/shell.js` (rail, top bar, module
tabs), `routes.js` (the menu), `pages.js` (which screens are rebuilt) and `url.js` (the address as state).

Rules the lints enforce, so a page cannot forget them: no network call outside `learn/api.js` (UI008), no
markup built from a string (UI009), no `eval` (UI010), no `console.log` (UI011), a class name that starts
`ol-` (UI015), every string from the packs (I18N001 to I18N008). Module CSS is `ol-<module>-<name>`,
BEM-light. Rules kept by review only, because no lint reads for them yet: no native `<select>` outside
`select.js`, no `confirm()` or `alert()`, buttons in the verb dictionary below.

## Words

Sentence case, second person, sentences of 20 words or fewer, no vendor name in working text, no
exclamation marks. Packs are `learn/i18n/en-IN.js` (the base: every key), `hi-IN.js` and `en-US.js`.

- **Verbs** (buttons are verb plus noun): Add, New, Save, Submit, Send, Publish, Issue, Approve,
  Decline, Delete, Withdraw, Archive, Import, Export, Print; and Take (a register), Remind, Arrange
  (cover), Assign, Enrol, Move, Lock and Unlock, Compute, Release, Sign, Request, Return, Book, Run,
  Set (homework), Share, Retry, Record (an event that already happened). Never: Make, Allot, "Write
  the first", Do, "Make it", "Record it".
- **Statuses** are one word, one colour, everywhere: the dictionary is `OL.ui.pill.TONES` in
  `learn/ui/pill.js` and the labels are `status.*` in the packs. Neutral is for stopped or not started
  (Draft, Declined, Withdrawn, Cancelled, Not invited, Enquiry, Empty, Left, Alumni, Waived); info for
  handed over or planned (Submitted, Invited, Applied, Allotted, Prepared, Editing, Scheduled);
  success for done (Approved, Issued, Published, Paid, Present, Active, Enrolled, Handed over,
  Complete, Sent, Cleared); warning for watch or someone must act (Pending, Waiting, Late, Leave, At
  risk, Waiting list, On leave, Partly paid, No role); danger for a problem (Overdue, Absent, Failed,
  Blocked, Struck off, Mismatch, Bounced, Below 75%, Needs cover).
- **Glossary**: the school's words come from `term.*` in the packs and the region in `learn/i18n/format.js`.
  India is the default (Class X, Section X-C, Admission no., Roll no., Term, Unit test, Merit list,
  CWSN, Transfer Certificate, Admit card, Mon to Sat); a US school gets Grade, Homeroom and the rest only
  when its country is US. The full table is Volume 01 §7.2 and §10.4.
- **Numbers and dates**: Indian grouping (12,34,567), `0` and not "none" in a number, dd/mm/yyyy in
  lists, the long form in headers, stored as ISO; all through `OL.fmt`, one formatter.

## Switches

Three layers decide what a school sees, and each can only take away what the layer above gave.

1. **The flag** (`FLAGS` in `learn/shell/routes.js`): false until the thing behind it ships. It is the hard
   off-switch: a module that is not built cannot be reached, whatever a school's settings say.
2. **The school's switch** (Admin › Settings › Modules, `organizations.modules`, migration 0071): Family,
   Fees, Homework, Lesson plans and Messages, all off until the school turns them on. Each change is one
   row in the audit log. A tab behind one of these flags shows only when the flag *and* the school's switch
   are on (`OL.routes.setSchool`, told the profile at sign-in and again when the page saves).
3. **The frame** (the new navigation itself) is on until it is turned off, without a deploy: for one
   browser with `?frame=off` (remembered; `?frame=on` or `?frame=default` clears it), or for a whole school
   with `PUT /school/modules {"frame": false}`. The browser wins, so a school that has it off can still be
   looked at. It has no card on the Modules page, so a school cannot switch off the page it would switch it
   back on from.

The folder of a page is never `learn/admin/`, `learn/teacher/` or `learn/student/`: those are the console's
addresses (`/admin/…`), the server strips them, and a script there is a 404 that looks like a missing page.
Modules lives in `learn/settings/`.

## Addresses

The address is the state: filters, tab, page and a drawer's record are in the query string.

- Modules: `/admin/{module}/{tab}/{sub-or-record}/{record-tab}?filters` (`learn/shell/routes.js`).
- Admin is flat (decision D-07): `/admin/settings/{group}`, `/admin/compliance/{view}`,
  `/admin/data/{tab}`, `/admin/security`, `/admin/audit-log`, `/admin/year-end`.
- Student: `/me/{tab}`.
- **Family** (decision D-08, amended by D10): `/family/{school}/{tab}/{record?}?child=stu_123`, where
  `{school}` is the school's `slug` in `organizations` (for example `sfhs`), or the school's own subdomain.
  A phone number that belongs to several schools is shown a school chooser before anything else. The
  school is in the address because a parent's number alone does not say whose children these are.
  (The family bundle is wave 3; the two-school proof is O9.)

## And on a phone?

Every module states its phone answer in the route table (`phone` in `learn/shell/routes.js`, D11,
checked against this table by DES005). **page**: the jobs done away from a desk have a phone page of
their own, named in `phonePages`; the rest of the module is cards. **cards**: desktop-first, every table
becomes a card list. The new frame stays desktop-only (`shellOn()` is false on a phone) until a module's
phone pages are built in it; the phone pages that exist today are in `learn/phone-*.js`.

| Module | Phone | Phone pages | Where it is now |
|---|---|---|---|
| `today` | page | overview | `learn/phone-staff.js` (the teacher's and the administrator's home) |
| `students` | page | admissions | `learn/phone-admin.js` (the application queue); the rest is cards |
| `attendance` | page | registers | `learn/phone-class.js` (register, diary, a word to the families, offline) |
| `academics` | page | timetable, homework | homework is the diary in `learn/phone-class.js`; the teacher's own timetable is not built |
| `exams` | page | mark | `learn/phone-teach.js` (marking one student at a time); the marks grid in card mode is not built |
| `fees` | cards | | behind a flag; a parent pays in the family bundle, not here |
| `wellbeing` | cards | | |
| `communicate` | page | circulars | a note or circular to one class goes from the diary in `learn/phone-class.js`; the inbox is `learn/phone-shared.js`; a school-wide circular with approval is not built for a phone |
| `staff` | cards | | |
| `campus` | cards | | the work-order list for maintenance is `learn/jobs/` |
| `insights` | cards | | |
| `admin` | cards | | |

The family portal is not a module of this table: it is a separate phone-first bundle (D5, D10).

## Accessibility and performance

WCAG 2.2 AA, enforced: `api/scripts/test-ui.mjs`, `test-shell.mjs` and `test-students.mjs` run axe in
light and dark at 1440 and 360 px. A visible focus ring on everything (a solid 2 px ring), a skip link,
one `h1` per page, `th scope` and a hidden caption on tables, live regions for toasts and autosave, a
target of at least 24 px (44 px on touch). Budgets: JS per route 120 KB gzip (the shell 60), CSS 40 KB
in all, two font files, LCP 2 s on a throttled 4G phone, INP 200 ms, CLS 0.05; lists page on the
server and never send more than 100 rows unless exporting.

## Where to look

| To | Read or run |
|---|---|
| see every component in every state | `learn/_ui.html` through `api/scripts/serve-learn.mjs` |
| add a page | `learn/README.md` |
| check the rules | `bash tools/verify.sh` |
| the brief | `Oplo-Learn-UIUX-Rebuild-Brief.pdf` (kept by the owner; it joins `docs/design/` only if the owner agrees) |
| the plan, its obligations and storyboards | `docs/OEDU_INDIA_SCHOOL_OS_PLAN.md` |
| the state tables and copy of the screens the plan adds | `docs/design/state-tables.md` |
