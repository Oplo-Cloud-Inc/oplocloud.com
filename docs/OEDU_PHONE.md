# OEdu on a phone

Added 2026-10-16. Before this, OEdu on a phone was the laptop console with its
sidebar pushed off the left edge: the page body sat 312px from the left and a
375px screen saw a sliver of it. A phone now gets its own interface, drawn by
its own files, chosen by width. A laptop never loads a line of it into the page.

## The idea: Depth

The home screen is the menu. Every place opens as a **layer** that rises over
it; what is under a layer stays where it was, smaller and dimmer, the way an
iPhone sheet does. A layer's address is the console's address
(`/student/Courses/alg-1`), the layers open are only a drawing of the browser's
history, and Back, a pull down on a layer and the close button are one
movement. There is no bottom tab bar and no hamburger.

* **Ground** a wash of the hue of whatever is happening, never a photo.
* **Glass** translucent cards and bars; dark mode is a real dark, not an inversion.
* **Type** a large title that folds into the bar; numbers set big and light.
* **Motion** one spring for everything; transforms and opacity only; none of it under `prefers-reduced-motion`.
* **A subject keeps its hue** (`P.toneOf`): the same on the schedule, the stack of courses and a mark.

## What each role gets

| Role | Home | Places |
| --- | --- | --- |
| Student | what is on now (ring of the period), what needs you, six tiles | Schedule (day/week/month), Courses (a stack, then one course with its grade and a goal), Assignments, Grades, Attendance (month of dots), Record (graduation, transcript), Me, Requests, Account, Forms, Inbox, Search |
| Teacher | the class on now with its register state, six tiles | Attendance (a day's registers; **the register, a student a row**), Students (find one; a profile with Message/Call), Classes, Inbox |
| Administrator | the school today (who is in, which registers are missing), six tiles | Attendance (school-wide, missing registers, who is away), People (profile with family numbers), Inbox |
| Everyone | "Everything" lists every place the console has | any place without a phone page opens the console's own page in a layer (`phone-adapt.css`) |

## Files (all in `learn/`)

* `phone.css` tokens and every component; everything is under `.ph`, so a laptop is untouched.
* `phone-adapt.css` how a console page reads in a layer: tables become cards, a header becomes the label on each value, dialogs rise as sheets.
* `phone.js` the shell: layers, the pull-down gesture, sheet, rings, rows, segmented control, pull to refresh.
* `phone-shared.js` the inbox (list, thread, reply, compose, preferences) and the page adapter.
* `phone-student.js`, `phone-record.js` the student's places.
* `phone-staff.js` teachers and administrators.
* `tools/check_phone.mjs` self-check for the pure parts (`node tools/check_phone.mjs`).

Hooks in `app.js`: `openStudentConsole` and `openAdmin` each hand the place to
`phone().student()` / `phone().staff()` when `phoneOn()`; `leaveConsole`,
`signOut` and `toast` know the shell. `openAdmin`'s dispatch table became
`adminPageFor(tab, admin)` so a phone can still draw a console page. `student.js`
exports its kit (`X.api.kit`) so the phone reads the same data with the same
cache. A phone is `(max-width: 700px)` or a coarse-pointer screen under 520px
tall (a phone on its side). Resizing across it re-draws the current place.

## Traps

* The console writes into `#v-admin` **by name** (about twenty sub-views do).
  So the shell lives on `<body>`, and `#v-admin` is moved into the layer that is
  showing a console page (`P.legacy`) and back when that layer goes.
* `student.css` has a 760px rule that gives table rows `min-width:560px`; the
  adapter overrides it. A short class name can collide with a global one:
  `.m` is a math style in `lab.css` (that is why the week bar is `.wk`).
* Resets use `:where()` so they never outrank a component class.
* A teacher may read a register only a course at a time (`attendance.list`
  with a `courseId`); `review` and `summary` are for the office.
* The staff `enter()` restore closure used to read `S.tab` when called, so
  Back could not return to Home; it now keeps the tab it was made for.

## Testing it

Preview at 375x812. In the Browser pane a hidden pane draws no frames: change
the viewport width by one pixel and back (376 then 375) to force a paint, and
turn transitions off in the page when you only want the end state. Width sweeps
at 320, 375 and 430 found no sideways scroll in any student place, and none in
the 45 console pages opened through "Everything" at 375 (teacher 25, administrator 20).

## Not built

* Gradebook entry as a phone-native screen (the console's grid scrolls inside its layer; grading one piece of work through "To Grade" works).
* Native versions of the other ~60 console places: they are readable, not designed.
* The family view (`/parent`) keeps its own phone deck.
* Nothing is deployed; `main` auto-deploys edu.
