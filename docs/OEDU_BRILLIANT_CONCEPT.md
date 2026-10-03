# OEdu × Brilliant — the concept

What Brilliant is, what of it OEdu should take, what OEdu already has, and how Algebra I Unit 1 is the first course written to it. Read with `OEDU_LEARN_BY_DOING_BENCHMARK.md` (the bar) — this document is how the Brilliant method meets that bar, in a school.

Sources: Brilliant's own pages ([about](https://brilliant.org/about/), [FAQ](https://brilliant.org/faq/), [Why Brilliant](https://brilliant.org/help/why-brilliant)) and independent write-ups. Where a page did not say something (Brilliant does not publish its XP or streak rules), this document does not claim it.

---

## 1. What Brilliant is

**Mission.** "Making a world of great problem solvers": STEM in less time, "with more purpose and joy", for self-directed learners who ask *how far can I go?* rather than *what's on the test?* Its stated bet is that in a world with AI we need more critical thinkers, not fewer.

**The method, in five moves.**

1. **Problem first.** A learner is *pretested* and attempts a problem before being taught the procedure. Instruction arrives after the attempt, so it answers a question the learner now has.
2. **One concept per lesson, from concrete to abstract.** Each lesson builds a single idea: an intuition, then a visual explanation, then a hands-on manipulation, then a harder application. Cognitive load is kept low on purpose.
3. **Interaction is the thinking.** The learner drags, slides, builds and predicts inside a model of the idea. It is not decoration around a video.
4. **Instant, specific feedback.** A wrong answer says *why* and lets the learner go again at once. There is no "Incorrect." dead end.
5. **A tutor that asks.** Koji, the AI tutor, models the learner's misconceptions, generates visuals on the fly for the question being asked, and is "intentionally patient" — it *asks instead of tells*, and its stated aim is to make itself unnecessary.

**The wrapper.** Bite-sized lessons (about 15 minutes a day; most courses 2–6 weeks), streaks, leagues, levels and progress, and recommendations that adaptively choose between *practise what you have* and *learn something new*. Math (Algebra now, more to come through 2026) and coding are the deepest areas. It is WASC-accredited and a MathCounts Foundation partner.

**What it is not.** It is a consumer product for one person. There is no teacher, no roster, no assignment, no grade, no school record, no parent view, and no course that follows a district's sequence. Everything it does well happens inside one learner's head and one screen.

---

## 2. What OEdu already has

OEdu did not start from zero. `challenge.js` says in its own header that it borrows from Brilliant — *a problem first, the explanation after; interaction that is the thinking, not decoration; one step per screen.* Concretely:

| Brilliant move | Where OEdu already does it |
|---|---|
| Problem first | Lessons open on a "Warm up" problem; `then:` text names the idea after it is seen |
| Interaction is the thinking | The lab's manipulatives: balance, plane (drag points, sliders under a family of lines), table, machine, tester, numberline, tiles, walk… |
| Specific feedback | Every wrong option carries its own reply (`fb`); numeric answers carry `near:` replies for known slips |
| Hints that step down | `hints: [..]` three deep, then a worked `why` |
| Levels | Skills run 0–4 (Attempted → Mastered) |
| A tutor | `tutor.js` — a local, Ollama-backed Socratic ladder |
| Streaks / XP | `game.js` — standing, streak, rank, badges |
| Adaptive path | **Pathway** (built alongside this): a map of topics, a placement check that finds what a student knows, a ring that fills, spaced review |

And OEdu has what Brilliant *cannot*: a school. Teachers set work; hand-ins are graded; a course follows a textbook and a district's sequence; parents see a record; self-learning is kept apart from school work and is nobody's business but the student's.

---

## 3. The gap

Scored against the benchmark's six dimensions, the lab is strong on *real consequence* and *productive failure* and weaker in four places. These are the things worth taking from Brilliant that OEdu does not yet do consistently:

1. **Attempt before instruction is a habit of the best lessons, not a rule.** Many lessons still explain, then ask. The benchmark's hard gate 1 (no more than ~60 words before the first action) needs to be a writing rule.
2. **Predict, then test.** Brilliant's most effective interaction is *"where do you think the line goes?"* followed by the model showing it. OEdu's manipulatives let a student play; few ask for a prediction first.
3. **A student-made artifact at the end of a lesson.** Brilliant lessons end on a build or a transfer problem; OEdu lessons often end on the last quiz item.
4. **One idea per lesson.** Several lessons carry two or three. The cost is not length — it is that "what was that lesson about?" has no one-line answer.

What is *not* worth copying: leagues (ranking students against each other has no place beside a gradebook and a parent view), and streak-loss anxiety. A streak should be a record of showing up, never a threat.

---

## 4. The concept: **Try, See, Name, Vary, Use**

Brilliant's five moves and the benchmark's six-step loop collapse into one recipe every OEdu lab lesson is written to. It is five beats; a lesson runs the loop two to four times, each time on a smaller idea, and ends on a *Use*.

| Beat | What the student does | Lab step that carries it | The rule |
|---|---|---|---|
| **Try** | Attempts a situation with no instruction beyond the goal | `num` / `choice` / a scene with a `goal` | The first action comes before ~60 words. A wrong first try is *expected* and costs nothing. |
| **See** | Changes something and watches the model respond | `plane`, `balance`, `table`, `tester`, `machine`, `race`… with `gate: true` | Under one second from action to consequence. Continue waits until the move that shows the idea has been made. |
| **Name** | Reads one line that says what just happened | `then:` on the scene | One sentence, shown *after*. New words are named here, not before. |
| **Vary** | **Predicts**, then changes a condition and checks | a scene with `check`/`goal`, or a `choice` before a scene | A prediction is committed *before* the model is touched. The gap between prediction and result is the lesson. |
| **Use** | Applies it in a situation the lesson did not show | `num` / `expr` / `equation` with new context; the lesson's last step is a *build* | A fresh task, not the worked one with new numbers. Ends on something the student made. |

Hints, the worked solution, and the tutor are *pulled*, never pushed: they sit behind "I'm stuck" and appear after an attempt.

### Rules of the house (the checklist a Brilliant-style OEdu lesson passes)

1. **One idea** in one line, at the top of the lesson file. If it needs "and", it is two lessons.
2. **First action inside ~60 words** and inside 20 seconds.
3. **Every wrong answer we can predict has its own reply.** "Incorrect." is a bug.
4. **A prediction before every manipulation that shows a relationship.**
5. **A *Why* line after, never before.** `then:` names it; `why:` proves it.
6. **The last step is a Use**: a new situation, or something built and kept.
7. **Nothing locked.** Any step opens; only *doing* it counts.
8. **The strip test.** Remove every paragraph. If the lesson still teaches, it passes.
9. **A quiet tone.** No confetti, no loss-aversion. The reward for a right answer is the next, slightly harder, question.

---

## 5. How it works in a school (the part Brilliant doesn't have)

- **The course is the unit of study** and follows a textbook: Algebra I follows OpenStax *Algebra 1* (the Texas edition), unit N = book unit N, exactly as Geometry follows Glencoe and Business follows OpenStax. The Brilliant method changes *how* each lesson is taught, not *what* the course covers.
- **Two paths in, one record.** *Pathway* (ALEKS-style: a check finds what you know; a ring fills; spaced review keeps it honest) is the adaptive path for **breadth** — what to do next. The Brilliant-style lesson is the path for **depth** — why it works. A student who fails a Unit 1 readiness check is sent to the Pathway slice that covers it; a student who finishes a Pathway topic can open the lesson that explains it.
- **Teachers see what students did**, not what they clicked: attempts before a hint, first-try correctness, the last wrong answer and the reply it earned. The lab already records `first`, `tries`, `hints`.
- **Self-learning stays private.** Everything Brilliant-like a student does on their own is in the self-learning record, not the gradebook.

---

## 6. Algebra I Unit 1 — the pilot

The book's Unit 1 is *Linear Equations*: fifteen lessons and a project, threaded by one context — a city manager balancing a budget against **constraints**. The OEdu unit keeps the book's lessons and order, so a teacher can teach from either, and rewrites every lesson to the recipe above.

Readiness comes first and follows the book's three prerequisites (solve, classify, coordinates) — as three attempt-first checks that route a student to the right refresher instead of a page of review.

| | Lesson | The one idea | The manipulable | The Use / artifact |
|---|---|---|---|---|
| R | Ready? | Three checks before the unit | balance, classifier, plane click | a routed plan: "start here" |
| 1.1 | Exploring expressions and equations | Some quantities vary, some are fixed; a *constraint* limits what's possible | a pizza-party planner with a live cost expression | write your own party-cost expression and its constraint |
| 1.2 | Writing equations, part 1 | An equation says two expressions are worth the same | an equation builder from a story | model a purchase with tax |
| 1.3 | Writing equations, part 2 | A table hides a rule; find it | a table whose rule you guess, then test | build the equation for a table you make from a story |
| 1.4 | Equations and their solutions | A solution is a value that makes it true | a "try a value" tester | find every solution in context |
| 1.5 | Equations and their graphs | Every point on the line is a solution | the plane: click a point, see if it works | read a point's meaning |
| 1.6 | Equivalent equations | Equivalent equations have the same solutions | the balance: legal and illegal moves | sort moves into "keeps it" and "breaks it" |
| 1.7 | Explaining steps | Some moves lose solutions; some equations have none | a zero-tester | explain why dividing by *x* is unsafe |
| 1.8 | Choosing the variable, part 1 | Solve for the thing you keep asking about | a table you fill from two forms of one equation | pick the useful form |
| 1.9 | Choosing the variable, part 2 | Rearranging is solving with letters | a rearrangement walk | rearrange a formula and use it |
| 1.10 | Equations to graphs, part 1 | Slope is the rate; the intercept is the start | plane with `m` and `b` sliders | match a story to a line |
| 1.11 | Equations to graphs, part 2 | Slope and intercept from any form | a form-changer | find them from standard form |
| 1.12 | Writing the equation of a line | Slope + a point, or two points | drag two points; the equation writes itself | write a line through your own points |
| 1.13 | Lines from tables and graphs | Table, graph, equation, story — one thing | four-way matcher | make a table from an equation |
| 1.14 | Parallel and perpendicular | Slopes of parallel lines match; perpendicular multiply to −1 | drag a line; the other follows | build a rectangle from lines |
| 1.15 | Direct variation | y = kx: one constant, everything scales | a ratio machine | model a real proportional relationship |
| P | Project: Slopes and intercepts | Read a graph; write its story | matching game + a story to write | **a scenario the student authored** |

---

## 7. What to instrument

From the benchmark, for the Unit 1 pilot: time to first action; words before first action; attempts before a hint; retry rate after a wrong attempt; lessons ending in a made artifact; and — the one that matters — **success on a fresh task seven days later with no hints** (Pathway's Knowledge Check supplies it).

---

## 8. What comes next

Platform pieces this concept implies, in the order they would pay back:

1. **A `predict` step** — commit an answer, *then* the manipulative unlocks, then the gap is named. (Today a lesson approximates this with a `choice` before a `learn` scene.)
2. **Pretest-and-skip** — a lesson opens on two problems; get both first-try and the lesson offers "jump to the check" (nothing is locked; it is a suggestion, and it counts the pretest as evidence).
3. **The Socratic coach inside the lab player** — `tutor.js`'s ladder, seeded with the *wrong answer the student just gave*, asking instead of telling.
4. **Daily practice** — five items, drawn from Pathway's spaced-review queue and the unit's skills, no ranking, no loss.
5. ~~**Unit 2 onward** written to the same recipe, following the book.~~ Done 2026-10-02: Algebra I is now the book's nine units, lesson for lesson (`learn/alg/u01.js` – `u09.js`): 134 lessons (each unit opens on a three-check “Ready?” lesson and ends on its project), 124 practice skills, 30 quizzes. A lesson with a `tag` (“Ready?”, “Project”) wears the tag instead of a number, so the app's Lesson 2.1 is the book's 2.1. Units 2–9 are held to five rules — teach, learn by doing, super interactive, nothing clumsy, never too much — which in practice means one idea and seven to nine short steps a lesson. Two small additions to the plane (`lab/widgets.js`) carry most of the new interaction: `marks` and `segs` may be functions of the plane's state, so residuals, secants and whole parabolas follow dragged points; and `gridY` lets the vertical grid have its own step. Every lesson's naming moment is now a **concept builder** (`lab/algkit.js`, the `build` step): the student drags word and maths pieces into a sentence or formula with gaps, gets a reply for each wrong piece, and the finished idea lights up as a concept card. Each unit page collects them under “Concepts you've built”. Builders are added per unit with `LAB.addConcepts`, which keeps every existing step's id so no student record moves.
