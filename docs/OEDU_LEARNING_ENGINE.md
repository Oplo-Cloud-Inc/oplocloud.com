# OEdu learning engine — the directive

The core directive for anyone building OEdu's learning engine: what it must be, what we take from ALEKS, OpenStax and Brilliant and what we deliberately do not, and how far `learn/engine/` has got. Read with [`OEdu-Architecture.md`](../OEdu-Architecture.md) (the product), [`OEDU_BRILLIANT_CONCEPT.md`](OEDU_BRILLIANT_CONCEPT.md) (how a lesson is written) and [`OEDU_ASSESSMENT_EXPERIENCE_SYSTEM.md`](OEDU_ASSESSMENT_EXPERIENCE_SYSTEM.md) (how a sitting runs). The engine's own contract is [`learn/engine/contract.js`](../learn/engine/contract.js); where this document and the contract disagree, the contract is what is enforced, and this document is what it should be changed towards.

---

## 1. The directive

**OEdu is not ALEKS + OpenStax + Brilliant.** We borrow the strongest underlying idea from each — ALEKS's knowledge-state modelling, OpenStax's structured, authoritative content, Brilliant's learning by doing — and build a different engine around one thing: **continuous evidence of understanding.**

1. **Knowledge graph.** Model every subject as concepts, prerequisites, representations, misconceptions, procedures, applications and the relationships between them — not as chapters and questions.
2. **Student state.** Hold a probabilistic state per concept — *unknown → emerging → functional → proficient → transferable → retained* — with the confidence and the evidence behind it. Never a mastery boolean.
3. **Evidence engine.** Every student action is evidence: the answer, the error pattern, hesitation, hint use, an explanation, a manipulation, the reasoning path, success on transfer, and later retrieval.
4. **No fixed lesson path.** The next learning action is computed from the student's current state. The system may change concept, representation, difficulty, explanation, practice or application when the evidence says the current approach is not working.
5. **Learn by doing is the primitive.** Concepts are taught through executable interactions first. Formal text, notation, examples and explanations are selected around the need the student has demonstrated. Brilliant proves interactive problem solving works; OEdu makes interaction the underlying instructional unit.
6. **Representation engine.** Every concept has interchangeable representations — concrete, visual, symbolic, verbal, quantitative, procedural, real-world. When one fails, switch representation rather than lowering difficulty.
7. **Misconception engine.** Model incorrect reasoning explicitly. A wrong answer updates a misconception hypothesis and triggers targeted conceptual repair — not just another question.
8. **Dynamic scaffolding.** A hint exposes the minimum missing reasoning step. Escalate *cue → representation → partial structure → explanation → worked reasoning*. Never default to revealing the answer.
9. **Transfer engine.** Never declare mastery from repeated success on one problem type. Require variation across wording, representation, context and problem structure.
10. **Retrieval engine.** After apparent mastery, re-surface concepts deliberately, at expanding intervals and in unrelated contexts. Retrieval evidence updates the same student model.
11. **Assessment engine.** Assessment is another evidence-gathering mode of the same system, not a separate quiz product. It estimates what the student can produce independently, without scaffolding.
12. **Content architecture.** Content is stored as reusable atomic instructional objects, not pages: concept explanations, examples, interactives, representations, misconceptions, prompts, applications, assessment items. Every object is machine-addressable and usable adaptively.
13. **Teacher-authoring intelligence.** A teacher states the intended outcome and the curriculum constraints. OEdu resolves prerequisites, concept relationships, practice variants, misconceptions, transfer opportunities and evidence requirements.
14. **Curriculum independence.** Curriculum order is kept apart from knowledge dependency. A school may require Algebra → Quadratics; the engine still knows the real prerequisite graph and repairs gaps without breaking the assigned order.
15. **Multidimensional mastery.** Conceptual understanding, procedural fluency, reasoning, transfer, independence and retention are tracked separately.
16. **Confidence-aware decisions.** No major instructional decision rests on one response. Decisions use accumulated evidence and its uncertainty, and the engine probes deliberately when it is unsure.
17. **AI works inside the model.** AI operates against the structured knowledge and content model. It does not invent explanations, prerequisites, misconceptions or assessment criteria.

**The core loop.** Model the student → choose the experience → observe evidence → update the model → repair weakness → increase complexity → test transfer → verify retention.

**The objective.** A system that can answer, continuously and defensibly: *What does this student understand? What evidence supports that belief? What are they missing? What experience has the most instructional value next?*

**The distinction.** ALEKS is built around adaptive knowledge-state progression. Brilliant is built around interactive problem solving. OpenStax is built around open, structured textbook content. OEdu is built around the evidence-backed model of each student's understanding. Progression, interaction and content are the instruments that feed and serve that model, and none of them is the product on its own.

---

## 2. What we take from each, and where each stops

Everything below is from each product's own published material (sources in §6). Where a product does not say how something works, this document does not guess.

### 2.1 ALEKS — the knowledge state

**What it is.** McGraw Hill's adaptive system, built on *Knowledge Space Theory* (Doignon and Falmagne). A subject is a set of problem types — around 400–500 for Algebra 1 — and a student's *knowledge state* is the subset they can solve. Prerequisite structure rules most subsets out, leaving "a few trillion empirically feasible states" for Algebra 1. An adaptive assessment finds a student's state in roughly 20–25 questions; the *Initial Knowledge Check* is under 30. The topics just outside the state, whose prerequisites are all inside it, are the *outer fringe*: what the student is "ready to learn".

**Learned is not mastered.** In ALEKS a topic is *learned* after "several practice problems correctly (doesn't have to be in a row)", and *mastered* only when it is answered "without help on an ALEKS Knowledge Check". Progress Knowledge Checks arrive after a few hours or a number of topics learned, and they deliberately re-ask topics already mastered. A topic that has been forgotten goes back on the pie.

**What we take:**
- A prerequisite structure strong enough to *infer*. A right answer raises belief in everything beneath it, and a wrong answer lowers belief in everything above it. That is how ~20 questions can place a student among 70 topics.
- "Ready to learn" as the default frontier: the next topic is one whose foundations hold up.
- Practising and confirming are separate. Practice with help available can make something *learned*. Only unassisted evidence, later, makes it *mastered*.

**Where it stops, and what we do instead:**
- The unit of knowledge is a *problem type*, and the state is a yes/no per type. We keep a posterior per concept per dimension, so "can do the procedure, can't say why" is a state the model can hold, not a rounding error.
- The state says *whether* a student can solve a type, not *why* they cannot. We hold misconception hypotheses as part of the state (directive 7).
- Instruction around the fringe is explanation and practice in one form. We switch representation before lowering difficulty (directive 6).

### 2.2 OpenStax — structured, authoritative content

**What it is.** Rice University's nonprofit publisher of peer-reviewed, openly licensed textbooks. Its original content system (CNXML, on OpenStax CNX) was designed so markup conveys "the content of the material and not a particular presentation". *Algebra 1* is a complete K-12 curriculum, approved by the Texas Education Agency as high-quality instructional material (HQIM) and aligned to the Texas standards (TEKS and ELPS). Its free teacher guide gives learning targets, prerequisite-skill guidance and the standards addressed for every lesson, and it has diagnostic, formative and summative assessments at both unit and lesson level. OpenStax also ran an adaptive layer, *OpenStax Tutor* (launched in 2017, with personalised questions and spaced practice). It announced in October 2022 that Tutor was being discontinued.

**What we take:**
- Authority. A course follows a real, reviewed book in the book's order (Algebra I Unit N is book Unit N), so a teacher can teach from either. This is the *curriculum order* half of directive 14.
- Separating content from presentation: the CNXML idea, taken further. A content object is addressable on its own, not only as a span of a page.
- The teacher apparatus around the text — prerequisites named per lesson, assessment at each grain — read as *declared structure* to seed the graph, not as prose.

**Where it stops, and what we do instead:**
- The book is a sequence of pages. Its prerequisite guidance is written for a teacher to read, not for an engine to reason over. We encode it as `prereq` edges and test it (`KG.audit()`).
- Tutor was an adaptive layer added on top of a book, and it was discontinued. The lesson for us: adaptivity cannot be a separate product sitting on top of the content. The content has to be authored as objects the engine can address from the start (directive 12).

**Licensing — a constraint, not a footnote.** *Algebra 1*, *Introduction to Business 2e* and *World History* are used in OEdu under **CC BY-NC-SA 4.0**. The attribution is already in `learn/data.js` and `learn/alg/u01.js`. Two consequences for engineering:
- *NonCommercial.* Before any adapted text sits behind a paid tier, whoever owns licensing for Oplo has to decide whether that use counts as commercial.
- *ShareAlike.* Atomic objects derived from that text carry the licence with them. Keep the licence and source on each derived object, not only on the course, so the engine never mixes it into content under another licence without knowing.

### 2.3 Brilliant — learning by doing

**What it is.** Interactive lessons built from problems the learner works, with answers given through a math keyboard or by dragging and dropping. *Koji*, its AI tutor, works on an "interactive canvas", where it "asks guiding questions, sketches on your screen, gives hints, and provides visual help". It "sees what you are working on and walks you through the thinking step by step, without giving the answer". Because it "can see everything that happens in the lesson, he can also reach into it and adjust it – highlighting a region, annotating a graph, or posing an intermediate interactive question". Brilliant says Koji is "available in most of our math and coding courses, with more on the way". Brilliant is a consumer product for individual learners. (What OEdu already takes from it is set out in [`OEDU_BRILLIANT_CONCEPT.md`](OEDU_BRILLIANT_CONCEPT.md) §1–4: *Try, See, Name, Vary, Use*.)

**What we take:**
- The problem comes before the explanation. The interaction is the thinking, not decoration.
- A tutor that can see the interaction state, and asks instead of telling.

**Where it stops, and what we do instead:**
- Brilliant's public material describes interaction as a way to design *lessons*. For us an interaction is an *evidence source*: a manipulation is observed, recorded and scored like an answer (directive 3). The first move, the number of moves and time to the gate are all signal.
- A consumer product has no teacher, no assigned order, no gradebook and no family. OEdu's model must answer a teacher's question about a student, with the evidence attached, as well as the student's own.

---

## 3. Where the codebase stands against the directive

**Headline.** `learn/engine/` *is* this directive, implemented for one unit (Algebra I Unit 1: 26 concepts, 13 misconceptions, 52 content objects). Its fifteen invariants pass (`node learn/engine/contract.js`), and so does its behavioural suite (`node learn/engine/test.js`). **But no page in the product loads it.** Nothing outside `learn/engine/` references it.

What students use today is three separate adaptive systems side by side:
- **Pathway** (`learn/lab/pathkit.js`) is ALEKS-style: ~20-question check, learned vs mastered, a ring.
- **The lab** (`learn/lab/`, `learn/alg/`) is Brilliant-style: lessons, skills levelled 0–4, unit tests.
- **The Algebra I course** follows OpenStax.

Each keeps its own record. So does `learn/learn.js`, which uses the five-dimension model described in `OEdu-Architecture.md` §6. In practice the product is "ALEKS + OpenStax + Brilliant", the arrangement the directive's first line rules out. The engine is the way out of that, but only once the other systems feed it.

| # | Directive | In the engine | In the product | Gap |
|---|---|---|---|---|
| 1 | Knowledge graph | **Partial.** `kg.js`: concepts, `prereq`, `reps`, `needs`, `audit()`. Misconceptions are a separate store keyed by concept. | No. Pathway keeps its own 70-topic graph (`pre`) | Procedures, applications and concept–concept relationships other than "requires" are not typed. There are two graphs, unconnected. |
| 2 | Student state | **Built.** `state.js`: the six rungs exactly as listed, a Beta posterior per dimension, the probability attached to every claim | No | — |
| 3 | Evidence engine | **Partial.** `Engine.observe`: answer, value produced, scaffold, representation, self-rated confidence (`believed`), latency (`ms`), retrieval, transfer | No. Lab, challenges, checks, Pathway and exams each write their own progress scope | No explanation text, manipulation trace or reasoning path is observed |
| 4 | No fixed path | **Built.** `Policy.nextAction`: six ordered priorities, each decision carrying a reason code | No. Lessons are fixed sequences | Needs a "continue" surface that asks the engine what's next |
| 5 | Learn by doing | **Partial.** Content kind `interact` (5 objects) | **Built** as UI: `challenge.js`, `lab/widgets.js` | The manipulatives don't emit evidence to the engine |
| 6 | Representations | **Built.** 8 representations; `pickRep` never reuses one that just failed, and an untried form outranks a failed one; every Unit 1 concept has at least two | — | Concrete is authored for 2 of 26 concepts |
| 7 | Misconceptions | **Built.** `misconception.js`: posterior over named beliefs, signatures matched against the value typed, discriminating probes, repair outranks practice | Partly. Challenges carry per-wrong-answer replies, but nothing updates a hypothesis | 16 of 26 concepts have no misconception authored |
| 8 | Scaffolding | **Built.** `LADDER`: none → cue → representation → partial → explanation → worked. Worked is terminal and costs independence evidence | **Two other ladders**: `tutor.js` (Ask back … Explain) and challenge `hints[]` with "Show me" | One ladder, the engine's, and the others become views of it |
| 9 | Transfer | **Partial.** `wasFresh` (a form seen 3+ times is no longer fresh); transfer dimension; `transfer_probe` action; 5 transfer items | No | Freshness is judged by representation only. Items aren't tagged with *wording, context, structure*, so the directive's four axes of variation can't be measured |
| 10 | Retrieval | **Partial.** Retention dimension with decay, `due`, `retention_check`; 3 retrieve items | **Three other schedulers**: Pathway review, `learn.js` spacing, study sets | One retention model, fed by every source |
| 11 | Assessment | **Missing.** Content kind `assess` exists with 0 objects | `exam.js` writes `exam:<id>` and nothing reads it as evidence | Exam responses → `observe` with `scaffold: "none"`, action `mastery_check` |
| 12 | Atomic content | **Partial.** `content.js`: 8 kinds, seeded variant generators, addressable by id | Lessons and challenges are page-shaped (`alg/u01.js`, `challenges-*.js`) | `explain`, `example`, `repair` and `assess` have 0 objects; repairs live inside misconception definitions |
| 13 | Teacher authoring | **Partial.** `Teacher.plan(concept)`: prerequisite closure in depth order, evidence needed, beliefs to watch, content and representation gaps. `Teacher.conflicts()`, `Teacher.assumed()` | No. The console doesn't call it | It takes one concept, not an outcome plus constraints, and it reports variants rather than generating them. It lives in a content file (`alg1u1.js`) and should be its own module |
| 14 | Curriculum independence | **Built.** `unit` (where a school meets it) kept apart from `prereq` (what it rests on); gaps repaired inside the open unit | — | — |
| 15 | Multidimensional mastery | **Built.** 6 dimensions; the rung is a floor over them, not an average | **Conflicting.** `OEdu-Architecture.md` §6 documents 5 dimensions and 6 different states; the lab has 5 levels; Pathway has 3 | One model. The others are display adapters over it |
| 16 | Confidence-aware | **Built.** `evidenceState` (insufficient / emerging / sufficient / high_confidence), `informationGain`, probes chosen on gain, cooldowns against livelock | — | — |
| 17 | AI inside the model | **Built** for the engine: it serves only authored content, and says "untaught" rather than generating anything | `tutor.js` constrains *how much* help the model gives but doesn't take its material from the engine | The tutor's context should be the engine's current concept, misconception hypothesis and authored repair, and nothing else |
| — | Core loop / the four questions | **Built.** `Engine.report()`, `Engine.explain()` | No surface shows them | The teacher's Insights view and the student's Progress view should read `report()` |

---

## 4. Build order

The order is chosen so each step makes the next one measurable. Nothing here needs new pedagogy — the engine already holds it. The work is connecting the existing systems to the engine and adding content.

1. **Connect the engine to Algebra I Unit 1.** Load `learn/engine/` with the lab, the same on-demand way `lab/widgets.js` loads. Every lab step result goes through `Engine.observe`. `Engine.changed` pushes the record to a progress scope (`engine:alg1:u1`) through `sync.js`, with merge, never replace. Add a *Continue* action on the unit page that plays `Engine.next()`. The assigned lesson list stays as it is: School follows the assigned order, and the engine repairs gaps *inside* it (directive 14).
2. **One student model.** Pathway answers, lab skills, checks, challenges and exam items all emit `observe` calls. The lab's 0–4 levels, Pathway's ring and the Progress view become *read-only views* derived from engine rungs. Rewrite `OEdu-Architecture.md` §6 to the engine's six rungs and six dimensions, and retire the five-dimension model in `learn.js` for engine-backed courses.
3. **One graph.** Map Pathway's 70 topics into `kg.js` concepts (`pre` → `prereq`), so the ALEKS-style placement check seeds the engine's posteriors instead of a separate ring. `KG.audit()`, `node learn/engine/contract.js` and `node learn/engine/test.js` run in `tools/ship.sh` and in the deploy workflow's verify step. Today neither runs any of them, so a change that breaks the engine can still be deployed.
4. **Assessment as evidence.** `exam.js` responses become observations with `scaffold: "none"` and `action: "mastery_check"`. This is the *independent production* estimate (directive 11). The exam stays a sitting with its own rules; only its evidence is shared.
5. **Transfer you can measure.** Tag every variant with `wording`, `context`, `structure` and `rep`. `wasFresh` then judges novelty on all four, and `transferable` requires success on at least two that changed (directive 9).
6. **Wider evidence.** Challenge `explain` steps record the student's text and their self-rating against the model answer. Widgets report first move, move count and time to the gate. Hints taken in the challenge player and the tutor become rungs on the engine's ladder.
7. **Content coverage for Unit 1.** Misconceptions for the 16 concepts that have none. `explain`, `example` and `repair` as atomic objects, so a repair can be delivered in a different representation from the one that failed. Concrete representations where they make sense.
8. **The teacher's view.** `report()` and `explain()` in the console's Insights, per student and per course. `Teacher.plan` moves to `learn/engine/teacher.js` and takes an outcome plus constraints (assigned units, date). Its content-gap report becomes the authoring queue.
9. **The tutor works inside the model.** `tutor.js` receives the engine's current action (concept, misconception hypothesis, authored repair, scaffold rung) as its only material, and its ladder *is* the engine's ladder.
10. **Unit 2 onward**, authored straight into `content.js` objects rather than as pages.

**Contract additions as each step lands** (in `contract.js`, before the code):
- Every student-facing interaction on an engine-backed course produces exactly one `observe` call.
- No progress scope for an engine-backed course holds a mastery figure the engine did not produce.
- `transferable` is unreachable on evidence that varies along fewer than two axes.
- A tutor reply cannot reference a concept, prerequisite or misconception that is not in the graph.

---

## 5. Found while writing this

- **Fixed on this branch: an engine flake.** `node learn/engine/test.js` failed intermittently: 8 of 400 seeded runs, about 1 in 50. The cause: the diagnostic-probe branch picked its item through `unseen()`. When every candidate has just been served, `unseen()` returns the whole list ("never return nothing"). So a concept with one authored probe got that probe again as a *diagnosis* two steps after it was shown as a *repair*. Reproduce on the old code by seeding `Math.random` (xorshift32, seed 39) before running `test.js`. The fix filters strictly and lets the branch yield. Result: 0/400 seeded runs fail, and all fifteen contract invariants still hold.
- **A referenced document is missing.** `docs/OEDU_LEARN_BY_DOING_BENCHMARK.md` is cited by `OEDU_BRILLIANT_CONCEPT.md`, `learn/engine/content.js` and `learn/alg/u01.js`, but it is not in the repository.
- **Licensing** (§2.2): CC BY-NC-SA material needs a decision before it sits behind any paid tier.

---

## 6. Sources

- ALEKS — [About ALEKS](https://www.aleks.com/about_aleks); [Research behind ALEKS](https://www.aleks.com/about_aleks/research_behind) (Knowledge Space Theory, 20–25 questions, feasible states); [All About Knowledge Checks](https://www.aleks.com/resources/ALEKS_Knowledge_Checks_Overview_for_Students.pdf) (learned vs mastered, Progress Knowledge Checks, ≤30 questions); Cosyn, Uzun, Doble and Matayoshi, [*A practical perspective on knowledge space theory: ALEKS and its data*](https://www.researchgate.net/publication/348444388_A_practical_perspective_on_knowledge_space_theory_ALEKS_and_its_data), Journal of Mathematical Psychology, 2021 (the outer fringe as "ready to learn").
- OpenStax — [About OpenStax](https://openstax.org/about); [Algebra 1: About this course](https://openstax.org/books/algebra-1/pages/about-this-course) (CC BY-NC-SA); [Algebra 1 for K12](https://openstax.org/k12/algebra) (TEA approval, TEKS/ELPS, teacher resources); [Wikipedia: OpenStax](https://en.wikipedia.org/wiki/OpenStax) (Tutor launched 2017, discontinued 2022); [Rice: OpenStax Tutor launch](https://news2.rice.edu/2017/07/10/openstax-launches-personalized-learning-tool-for-college-courses-2/); [Wikipedia: OpenStax CNX](https://en.wikipedia.org/wiki/OpenStax_CNX) (CNXML).
- Brilliant — [brilliant.org](https://brilliant.org/) (Koji's interactive canvas); [Product features](https://brilliant.org/help/features/) (interactive problems; Koji "without giving the answer"); [A world-class tutor in every home](https://blog.brilliant.org/a-world-class-tutor-in-every-home/) (Koji reaching into the lesson; course coverage).
