# The teacher's console

The rules this surface is built to. They are here because a console is built
by many people over a long time, and the thing that makes one feel designed is
not talent — it is everybody deciding the same way when nobody is watching.

---

## The one rule

> **Does this make the teacher's next useful decision easier?**

Not *does this show more*. Not *could AI go here*. Not *does this look
advanced*. A console is read for hours a day by somebody whose job is not
software, and every element on it is rent charged against their attention.

---

## The loop

Everything is a step in one loop, and a screen that does not sit somewhere on
it does not belong:

**Notice → Understand → Decide → Act → Verify**

- *Notice* — Today, and the strip at the top of the gradebook.
- *Understand* — the grade that explains itself, the evidence beside the comment.
- *Decide* — the teacher. Never the software.
- *Act* — the cell, the batch, the comment.
- *Verify* — the history, Activity, the recomputed grade coming back with the write.

---

## Navigation is the rail, and only the rail

There is no top bar. The rail is flush to the left edge of the screen, runs its
full height, and is the whole of how a teacher gets around. Two things sit
outside it: a back control at the head of the content when there is somewhere
to go back to, and — below 900px, where the rail is a drawer — one control to
open it. Neither is a bar and neither ever holds navigation of its own.

The student's chrome does not appear here. A teacher navigating with two things
that disagree about where they are is worse off than a teacher navigating with
one.

**Eight to ten destinations, grouped by the part of the job.** Not by database
table. `People → Students → Enrolment → Course → Gradebook` is a schema;
*my class → my students → what happened → what needs me* is a teacher.

---

## The shapes

Three, and every screen is built from them.

**Table.** A teacher comparing thirty students is doing the one thing a table
is for. A card grid makes that comparison impossible — the old console drew a
card per student and twenty-eight of them was nine screens of scrolling to
answer a question a table answers at a glance. Numbers right-aligned, tabular
figures, names left, one shape per screen.

**Split view.** Selecting a row is not a page transition. Losing your place in
a list to look at one row, and losing it again coming back, is the most common
way software wastes a professional's afternoon.

**Inspector.** Everything that does not fit in a row. It changes with the
selection and it never moves.

Density is a variable, not a redesign: the same markup at three row heights,
chosen by the person doing the work. **The type never shrinks.** Solving
density with 10px text is how professional software becomes unreadable by the
people who use it most.

---

## Say the number, then say why

A chart is never the answer. `Average: 73%` and a line is not an insight; it is
a homework assignment handed to the reader.

Every number is followed down:

    84%  →  Why?  →  which categories, at what weight
                  →  which pieces of work
                  →  which submission

Every claim carries its evidence, and the evidence is the actual marks. The
comment box on a report card sits *next to* the student's marks by category and
the second half of term against the first — because a teacher writing thirty of
these is otherwise writing from memory, and memory is how last term's sentence
ends up on this term's report.

---

## What a blank means

The distinction the whole gradebook rests on:

| | |
|---|---|
| blank | nobody has marked it yet — the teacher owes this |
| `M` | not handed in — a zero, and counted as one |
| `Ex` | does not apply to this student — out of the divisor entirely |

Three different facts. Every gradebook that draws them as one blank cell
eventually tells a student something untrue about themselves.

---

## Nothing is generated

A report card is a view, not a file. There is one record, and a student's grade
is the same function whether it is read by them, by their teacher, or by a
report card. So there is no *Generate*, no queue, no sync, and no window in
which the printed number and the live number differ.

The browser never works out a grade. A mark is written and the recomputed grade
comes back with the response. Two implementations of a weighted average
disagree eventually, and the disagreement is always found by the person it
costs.

---

## Every important action is reversible

The history holds both sides of every change, so undo is not a mechanism — it
is a normal write of the value the record says was there before. Nothing is
erased: *92, then 72 for eleven minutes, then 92* is the true story, and the
eleven minutes are exactly what somebody asking about it wants to know.

---

## Where AI is, and is not

AI is plumbing. It never has a button with a robot on it, it never writes the
sentence a school publishes about a child, and it never decides anything.

What ships instead, and why it is better:
- The comment box shows the evidence rather than drafting the comment.
- The one check on wording is deterministic and narrow — a warm comment over a
  failing grade — because a family reads that as *nothing is wrong*. It says
  *possible* and changes nothing.

If a model is ever added, three things are non-negotiable: it shows what data
it used, the teacher approves before anything is published, and the result is
undoable.

---

## The things we are not going to build

Written down so they stay unbuilt without being re-argued:

- **A log of what teachers looked at.** Activity records changes to marks.
  A record of which screens somebody opened is surveillance of teachers, and
  "activity feed" is the name under which it usually arrives.
- **A dashboard of tiles nobody acts on.** A number earns a tile by being
  something the teacher can do something about today.
- **A template builder.** Report Studio, drag-and-drop layouts, per-school
  templates. This is where school software goes to die.
- **A readiness percentage.** 98.7% ready is a number that hides seventeen
  children. States and names, or nothing.
- **Sparklines over data that is not a series.** A trend drawn through one
  point is a drawing.

---

## The vocabulary is the teacher's

If the product says *performance variance anomaly* and a teacher says *the
grade changed unexpectedly*, the teacher wins. Every label on this surface
should be a phrase somebody would actually say out loud in a staffroom.

---

## When it is finished

Not when it looks good. When a teacher can, without being taught:

| | |
|---|---|
| find a student | ⌘K, or the roster's search |
| see what is owed | the moment Today loads |
| resume marking | two clicks from anywhere |
| understand why a grade changed | one click, on the number |
| find who is struggling | one filter |
| undo a mistake | immediately, from the history |
| know whether it saved | always, without asking |

---

## Known gaps

Named so nobody mistakes them for decisions:

- **No marking periods.** `term` is a column with one value in it. Publishing
  and locking a term need a real model, and it is the next thing that blocks
  reporting.
- **No URL per entity.** The console navigates on an internal stack, so a
  teacher cannot send somebody a link to one student. That is a routing change,
  and it is the main thing standing between this and a shareable console.
- **No dark mode.** The stylesheet has one palette. It is a pass, not a patch.
- **No standards or mastery model.** Insights over grades alone would be the
  descriptive dashboard this document rejects. It needs item-level assessment
  data first.
