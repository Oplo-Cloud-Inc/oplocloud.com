# OEdu Assessment Experience System

**Internal Developer + Site Policy + Design Principles**

- **Status:** Internal Product Standard
- **Applies to:** Assessment Engine, AI Assessment Designer, Student Assessment Experience, Teacher Assessment Studio, Admin Console
- **Primary perspective:** Student experience
- **Core principle:** The assessment should feel like a clear, purposeful experience — not a form full of questions.

> **The Golden Rule.** Never ask "How can we make this assessment more exciting?" first.
> Ask: "What do we need to learn about the student, and what is the clearest, most meaningful way for the student to demonstrate it?"
> Then make that experience exceptional.

Where this standard is implemented today: the student runtime is `learn/exam.js` with `learn/exam.css`; published assessments are stored in the database and served by `/api/v1/assessments` (`api/src/routes/assessments.js`). See [Implementation notes](#implementation-notes) at the end.

---

## 0. The North Star

Every assessment created or transformed on OEdu must satisfy this:

> Take the teacher's assessment intent and turn it into the clearest, most engaging, rigorous, accessible, and appropriate way for a student to demonstrate what they know.

We are **not** optimizing for more animations, more gamification, more question types, more AI, more screens, more features, more points, or more visual effects.

We **are** optimizing for: **better demonstration of learning with less unnecessary friction.**

## 1. The Student Is the Center of the Assessment

Every design decision must begin with: *What is the student trying to accomplish right now?* — not *What database field are we displaying?*, not *What feature do we want to showcase?*, not *What can the AI generate?*

The student should always understand:

1. Where am I?
2. What am I being asked to do?
3. Why am I doing it?
4. What information do I have?
5. What can I interact with?
6. What happens next?
7. How much remains?

If a student has to figure out how OEdu works while taking an assessment, we have failed the UX.

## 2. The Assessment Is an Experience, Not a Question List

Never design around `Question 1, Question 2, Question 3 …` as the primary mental model. Internally, questions/tasks can absolutely exist. But the student experience should be organized around:

```
Context → Task → Thinking → Action → Evidence → Progress
```

A student might experience — **Mission:** Analyze the data. **Task:** Determine which ecosystem is most stable. **Evidence:** Support your conclusion using two observations. The underlying system may record three separate scored items. The student doesn't need to experience them as three disconnected database records.

## 3. Every Assessment Needs an Intent

Every assessment object must have an explicit `assessment_goal` — e.g. *Determine whether students can apply Newton's laws to unfamiliar situations.* From that, the system derives `learning_objectives`, `skills`, `evidence_requirements`, `task_types`, `scoring`, `experience_structure`.

**Developer rule:** never allow AI to generate an assessment without an identifiable assessment purpose. If the intent is unclear, the AI should ask or identify the ambiguity.

## 4. Preserve the Teacher's Meaning

When transforming an existing assessment, OEdu **may change:** presentation, interaction, sequencing, visual representation, task framing, navigation, unnecessary repetition, experience structure.

OEdu **must not silently change:** intended learning objective, required content, correct answer, scoring meaning, required evidence, assessment constraints, authorized accommodations, assessment security rules.

The system distinguishes *transform presentation* from *change assessment meaning*. The second requires explicit review.

## 5. "Make It OEdu" Is a Transformation, Not a Rewrite

When a teacher uploads `Unit 4 Test.pdf`, OEdu thinks:

```
SOURCE → UNDERSTAND → EXTRACT OBJECTIVES → IDENTIFY EVIDENCE → DETECT STRUCTURE
       → REDESIGN EXPERIENCE → VALIDATE → HUMAN REVIEW → STUDENT EXPERIENCE
```

Not `PDF → LLM → 50 new questions`.

## 6. Student Experience Principle: One Clear Thing at a Time

Aggressively reduce unnecessary cognitive load. The student should generally encounter one primary objective, one primary task, one clear action, one clear next step.

Avoid screens that simultaneously present huge instructions, five buttons, multiple charts, unrelated information, navigation menus, decorative animation, progress analytics, or unrelated tips. **The assessment should feel calm.**

## 7. The "Focus Zone"

The student assessment interface has a dedicated focus area:

```
┌───────────────────────────────────────────────┐
│ OEdu                         12 of 24         │
├───────────────────────────────────────────────┤
│               YOUR TASK                       │
│     Analyze the population graph.             │
│     [Graph / Data / Scenario]                 │
│     What conclusion does the evidence         │
│     support?                                  │
│       ○ A   ○ B   ○ C   ○ D                   │
│                         [Continue →]          │
└───────────────────────────────────────────────┘
```

The exact UI can evolve. The principle cannot: **the student should know exactly where to look.**

## 8. Navigation Must Never Become the Challenge

OEdu assessments must not test *Can you figure out our interface?* The student should never wonder "Do I click this?", "Did my answer save?", "How do I go back?", "Am I finished?", "Did I submit?", "Where is the next question?" The interface makes these answers obvious.

## 9. Every Interaction Must Have a Reason

Before implementing an interaction, answer: *What learning evidence does this interaction provide?* If the answer is "It looks cool," don't build it. If the answer is "It makes students manipulate variables so we can observe whether they understand the relationship," build it.

## 10. Interaction > Decoration

Good: *Drag the forces to construct the free-body diagram* — the interaction is the learning task. Bad: *Click floating stars to reveal the answer* — the interaction is decorative.

## 11. Gamification Policy

**We do not gamify assessments. We make assessment experiences engaging.** These are different.

Allowed when appropriate: missions, challenges, progress, discovery, scenarios, simulations, meaningful choices, investigation, unlocking information, interactive environments.

Avoid by default — especially for older students: XP spam, meaningless points, badges, streaks, confetti after every question, cartoon rewards, fake urgency, lives/health bars, random sounds, casino-like mechanics.

## 12. The Experience Must Match the Student's Age

| Level | More |
|---|---|
| Elementary | visual, playful, expressive, guided |
| Middle school | discovery, challenge, experimentation, narrative |
| High school | professional, sophisticated, authentic, mission-oriented |
| College | professional, analytical, simulation-oriented, discipline-specific |

The system must never assume "engaging = childish."

## 13. The Student Should Feel Progress

Progress answers *Where am I in this experience?* — not *How many meaningless points did I earn?* Good: "3 of 5 challenges complete", "Final investigation", "2 tasks remaining", potentially "Evidence collected: 4/6".

## 14. Never Create False Progress

Do not show "83% complete" when the student has merely clicked through 83% of screens. Progress represents meaningful assessment progression.

## 15. Assessment Arc

```
HOOK → ORIENT → UNDERSTAND → APPLY → CHALLENGE → DEMONSTRATE → COMPLETE
```

Not every assessment needs every stage. The AI chooses the smallest structure necessary.

## 16. Start With Context When Context Helps

Instead of "Question 1" we can sometimes begin with *The Problem: A city is redesigning its public transportation system. Your job is to determine which route design best meets the city's constraints.* This creates purpose. But do not force narratives: if context adds unnecessary reading, remove it.

## 17. No "Fluff Reading"

Every sentence shown to a student should earn its place. If removing a sentence doesn't affect understanding, reasoning, context, accessibility, or authenticity, consider removing it.

## 18. Real World, When It Actually Helps

Real-world ≠ automatically better. Do not turn *Solve a system of equations* into a five-paragraph story about a fictional lemonade business just to call it "real world." The context should improve the task.

## 19. Multiple Representations

Where appropriate, let students reason through text, diagrams, graphs, tables, images, data, models, simulations, equations, timelines — so we measure the intended skill rather than one presentation format.

## 20. But Don't Give Students Unnecessary Choices

If the objective is *interpret a graph*, don't make students choose between graph / video / article / simulation / audio / infographic unless that choice is educationally meaningful. Choice should serve learning.

## 21. The Student Should Have Tools, Not Clutter

Contextual tools — Calculator, Formula Sheet, Reference, Scratchpad, Zoom — appear when needed. Tools are discoverable, predictable, unobtrusive, and never cover the task.

## 22. Never Hide Important Controls

Do not make students discover "there is a calculator if you click the tiny three-dot menu." Important tools are visible when permitted.

## 23. The AI Must Understand Assessment Mode

Every assessment has a mode — `FORMATIVE`, `PRACTICE`, `CLASSROOM`, `BENCHMARK`, `CONTROLLED`, `HIGH_STAKES` — and the mode controls what OEdu may do.

## 24. Formative Mode

Can allow hints, immediate feedback, explanations, retries, adaptive difficulty, AI tutoring, scaffolding. The goal: help the student learn.

## 25. Summative Mode

May restrict immediate correctness feedback, hints, retries, AI assistance. The goal: measure the student's current performance.

## 26. Controlled/High-Stakes Mode

The experience obeys its defined policy: potentially a secure environment, restricted resources, controlled navigation, controlled feedback, fixed content, fixed scoring, approved accommodations, detailed session logging. **Never assume that a feature permitted in practice is permitted in a high-stakes assessment.**

## 27. The Student Must Always Know the Rules

Before a controlled assessment, clearly communicate what the student has (e.g. 60 minutes, calculator permitted, reference sheet permitted), what they cannot do (leave the assessment, access external resources, use unauthorized assistance), and: *Make sure you're ready. Your timer begins when you start.* No hidden rules.

## 28. Never Surprise the Student With the Timer

If timing matters, show it before starting. During the assessment show `58:42 remaining` — but the timer should not visually dominate the experience.

## 29. Timer Anxiety

Not `🔴 00:32!!!` — prefer "32 minutes remaining", with progressively clearer urgency only when appropriate.

## 30. Saving Must Be Automatic

Non-negotiable. Every meaningful student action is safely persisted according to the assessment mode. The student should not have to think "Did I save?" Provide subtle confirmation ("Saved") or make saving invisible.

## 31. Network Failure Must Not Destroy Student Work

If connectivity disappears, gracefully enter *Connection interrupted* while preserving recoverable state. After reconnection: *Your session has been restored.* Never "Oops."

## 32. Student Recovery Is a First-Class Feature

Recover from browser refresh, temporary network loss, device restart where supported, accidental navigation, session timeout, application interruption — continuing without losing valid work, subject to the assessment's security policy.

## 33. Accessibility Is Not an Add-On

Accessibility is part of assessment generation: keyboard navigation, screen readers, text alternatives, captions/transcripts, contrast, readable typography, focus states, motion reduction, interaction alternatives.

## 34. Never Make Accessibility Change the Meaning of the Assessment

If the objective is *analyze data*, an accessible alternative representation still measures *analyze data* — not the ability to manipulate a specific visual interface.

## 35. Student Feedback Policy

Formative: *Correct — your calculation shows…* Practice: *Not quite. Look at the relationship between…* Summative: *Response saved.* No correctness disclosure until authorized.

## 36. Never Accidentally Leak Answers

Through feedback, animations, color, icons, accessible labels, browser metadata, network responses, client-side source, hidden answer keys, or AI messages. **Treat answer leakage as a security issue.**

## 37. The Student Should Never See AI Machinery

Don't expose "Generating assessment…" during the student experience unless truly necessary. The student experiences their task, not the AI infrastructure behind it.

## 38. AI Is Invisible Unless It Has a Student Purpose

In formative learning, *Need a hint?* could invoke AI. In a controlled exam: *AI assistance unavailable for this assessment.* AI availability is determined by assessment policy, not UI whim.

## 39. Never Let AI Freestyle During a Secure Assessment

For controlled assessments, content delivered to students is deterministic and versioned — no "let's ask a model to create a harder question based on how the student is doing" unless the assessment was explicitly designed, validated, and authorized as adaptive.

## 40. The Assessment Should Be Predictable

Students learn OEdu's interaction patterns once, then reuse them. **Continue** always means move forward. **Back** always means return without destroying work. **Submit** always means finalize. Don't change button meaning between assessments.

## 41. Don't Make Students Read the Interface

Prefer "Continue" over "Proceed to subsequent assessment component"; "Review answers" over "Access response verification interface."

## 42. Microcopy Standard

Short. Direct. Human. *Your answer is saved. Take your time. Review before submitting. You're on the final task. Assessment complete.* Avoid *Your response has been successfully persisted to the server.*

## 43. Every Assessment Needs a Completion Moment

Summative: *You're finished. Your assessment has been submitted. Your teacher will release results when they're available.* [Return to OEdu]. Formative: *Challenge complete. Here's what you demonstrated…* Different mode, different experience.

## 44. Never Use Confetti Automatically

Confetti is reserved for appropriate learning moments — not *Student scored 52%. 🎉 AMAZING!* That is emotionally inappropriate and potentially misleading.

## 45. Results Must Be Honest

Never communicate performance with vague celebratory language. Instead: *Completed. Score available. 2 skills demonstrated. Review available.*

## 46. The Student Should Understand Their Learning

When results are allowed, don't stop at *78%*:

```
You demonstrated:
✓ Solving quadratic equations
✓ Identifying roots

Keep practicing:
→ Interpreting quadratic graphs
→ Applying models to unfamiliar situations
```

## 47. But Do Not Overload Results

Start with: what you demonstrated, what to work on, what's next — not 47 metrics, 12 graphs, 18 percentiles, 9 benchmarks and 30 recommendations.

## 48. The Assessment Should Generate Evidence, Not Just Scores

```
Student → Actions → Responses → Evidence → Skills → Score
```

The score is one representation of the evidence, not the only one.

## 49. Every Task Needs an Evidence Definition

```
Task {
  objective        e.g. interpret quadratic models
  skill
  evidence_type    e.g. graph interpretation + explanation
  response_type    e.g. graph interaction + constructed response
  scoring
}
```

## 50. AI Assessment Generation Must Be Structured

Never allow the AI to return only prose. It produces a structured assessment specification:

```
Assessment
├── Metadata
├── Intent
├── Objectives
├── Blueprint
├── Experience
│   ├── Stage
│   ├── Context
│   ├── Task
│   ├── Interaction
│   └── Evidence
├── Scoring
├── Timing
├── Resource Policy
├── Accessibility
└── Security
```

Then the renderer turns that into the student experience.

## 51. Separation of Content and Presentation

Assessment content is never hardcoded into UI components:

```
Assessment JSON → Assessment Runtime → Experience Renderer → Student UI
```

So the same engine supports standard questions, simulations, investigations, graphs, drag/drop, constructed response, and future interaction types.

## 52. Build an Interaction Library

Reusable primitives: `MultipleChoice`, `MultiSelect`, `ShortAnswer`, `LongResponse`, `Numeric`, `Equation`, `Graph`, `GraphManipulation`, `Ordering`, `Matching`, `Categorization`, `Annotation`, `Hotspot`, `Simulation`, `DataTable`, `Timeline`, `CodeEditor`, `Drawing`. Don't expose these to teachers as the primary design language — the AI chooses them based on evidence needs.

## 53. AI Chooses Interaction Based on Evidence

Teacher: *I want to know whether students understand slope.* The AI reasons about possible evidence — calculate, interpret, compare, apply, explain slope — then selects task structures. Far more than "Generate 10 multiple choice questions."

## 54. The AI Must Be Able to Say "No Interaction Needed"

If a straightforward constructed response is the best way to assess something, use it. Innovation is not complexity.

## 55. Performance Is a Product Feature

Target immediate navigation, fast interactions, reliable autosave, lightweight transitions, predictable rendering. No large animation packages or massive assets without reason.

## 56. Motion Must Have Purpose

Animation may communicate transition, state, progress, cause/effect, interaction feedback — never merely "it looks modern."

## 57. Never Interrupt Thinking

No "Great job!", no "Here's a fun fact!", no "Did you know…?" while the student is solving a serious problem. Protect the student's flow state.

## 58. Don't Interrupt With Popups

For learning/reading experiences, optional reinforcement popups can be valuable. For summative assessments, never randomly interrupt with "Quick quiz!" The assessment mode determines whether contextual interventions are permitted.

## 59. Student POV: The Ideal Flow

1. **New Assessment** — *Quadratic Functions Challenge. Estimated time: 45 minutes. 6 tasks. You'll analyze graphs, solve problems, and explain your reasoning.* [Begin]
2. **Orientation** — *Here's your scenario.* Simple.
3. **Tasks 1–5** — the student understands what to do; a new challenge; an interactive graph; an unfamiliar application; a constructed explanation.
4. **Final** — *Review your responses* (Task 1 ✓ … Task 5 ✓) [Submit Assessment]
5. **Completion** — *Assessment submitted.* No ambiguity.

## 60. The "Three-Second Rule"

At any point, a student can determine within about three seconds: *What am I supposed to do?* If not: simplify the screen, improve hierarchy, rewrite instructions, remove distractions.

## 61. The "One Screen, One Story" Rule

Bad: graph + essay + unrelated chart + five navigation options. Good: *Here's the evidence. Analyze it. Make your conclusion.*

## 62. The "No Dead Ends" Rule

Students never encounter "nothing happens." Every interaction has a clear result: response saved, next task, new evidence, updated model, completion, review.

## 63. The "No Mystery" Rule

Students understand timing, allowed resources, submission, navigation, saving, completion.

## 64. The "Don't Waste Attention" Rule

Every unnecessary animation, sentence, icon, button, transition, modal, or decoration consumes student attention. Use it carefully.

## 65. Assessment Design Priority

When tradeoffs happen — and never reverse this order:

1. Valid assessment
2. Clarity
3. Accessibility
4. Reliability
5. Security / integrity where applicable
6. Meaningful engagement
7. Visual polish

A beautiful but invalid assessment is not an OEdu assessment.

## 66. The AI Quality Gate

Before AI-generated content reaches students:

```
INTENT CHECK → OBJECTIVE ALIGNMENT → CONTENT VALIDATION → ANSWER VALIDATION
→ SCORING VALIDATION → DIFFICULTY REVIEW → ACCESSIBILITY REVIEW → SECURITY POLICY
→ TIMING ESTIMATE → HUMAN REVIEW → PUBLISH
```

Low-stakes contexts may automate or streamline some steps. Controlled assessments use stricter gates.

## 67. AI Must Show Its Work to Educators, Not Students

Teacher/admin: *Why did you create this task?* OEdu: *This task measures application of Newton's second law in an unfamiliar scenario.* Student: *Determine the force.* The student doesn't need the AI's internal design explanation.

## 68. The Student Experience Must Never Depend on AI Being "Creative"

Once published, the assessment is a defined product. The runtime is deterministic where required. AI generation happens before the student assessment, unless adaptive AI behavior is explicitly part of the authorized design.

## 69. Don't Build One Giant Assessment Component

```
Assessment Runtime
├── Session Manager
├── Content Engine
├── Interaction Engine
├── Scoring Engine
├── Progress Engine
├── Resource Manager
├── Accessibility Layer
├── Security Policy
├── Autosave
├── Event Logger
├── Submission Manager
└── Analytics
```

The experience layer sits on top.

## 70. Session State Is Sacred

```
AssessmentSession
├── assessment_version
├── student
├── started_at
├── expires_at
├── current_stage
├── responses
├── response_versions
├── save_state
├── session_events
├── resource_usage
├── incidents
└── submission_state
```

Don't rely entirely on browser state.

## 71. Every Student Action Can Become an Event

Where appropriate: `TASK_VIEWED`, `RESPONSE_STARTED`, `RESPONSE_CHANGED`, `RESPONSE_SAVED`, `RESOURCE_OPENED`, `TASK_COMPLETED`, `SESSION_PAUSED`, `SESSION_RESUMED`, `SUBMITTED` — supporting recovery, debugging, analytics, auditability, operational support. But do not collect unnecessary behavioral data merely because it is technically possible.

## 72. Privacy Principle

**Collect what the assessment needs, not everything the platform can observe.** Assessment telemetry has a defined purpose.

## 73. Don't Call Suspicion "Cheating"

Use *Event requiring review*, not *Cheating detected*. The system reports observable facts; human-authorized processes determine what they mean.

## 74. The AI Must Never Make Disciplinary Decisions

AI can surface *Session experienced 3 connection interruptions.* It must not conclude *Student cheated.* This matters most in high-stakes education.

## 75. Teacher and Admin Are Different From Student

| Student | Teacher | Administrator |
|---|---|---|
| Experience | Intent | Governance |
| Tasks | Design | Policies |
| Progress | Questions | Approvals |
| Tools | Blueprint | Security |
| Submit | Rubric | Operations |
| Results | Preview, Assignments, Results | Analytics, Audit, System |

Do not expose administrative machinery to students.

## 76. Student UI Should Be Almost "Invisible"

The student should remember *"I solved that problem,"* not *"I used OEdu's assessment interface."* The software disappears. The learning remains.

## 77. The Experience Should Feel Like This

Not *"I'm taking an online test."* But: *"I have a problem to solve." "I need to figure this out." "Here's some evidence." "I think this is the answer." "Now I need to defend it."* That psychological shift is the entire purpose of this system.

## 78. Internal Design Test

Before shipping any assessment experience, ask — as the student:

- Can I understand what I'm doing immediately?
- Do I know where I am?
- Do I know what's expected?
- Does the interaction actually measure something?
- Can I recover if something goes wrong?
- Can I access permitted tools easily?
- Is anything distracting me?
- Does this feel appropriate for my age?
- Does the experience respect my intelligence?
- Does the experience make the learning clearer?

If any answer is no: fix it before shipping.

## 79. The "OEdu Test"

1. **Purpose** — What are we trying to learn about the student?
2. **Evidence** — What would convince us the student understands it?
3. **Experience** — What is the most natural way for the student to demonstrate it?
4. **Clarity** — Will the student immediately understand the task?
5. **Engagement** — Is the student meaningfully engaged rather than merely entertained?
6. **Integrity** — Does the experience preserve the intended assessment conditions?
7. **Next** — What should happen after we learn what the student knows?

## 80. The Golden Rule

Put this in the repository, the design system, the AI prompts, the PR checklist, and the assessment documentation:

> Never ask "How can we make this assessment more exciting?" first.
> Ask: "What do we need to learn about the student, and what is the clearest, most meaningful way for the student to demonstrate it?"
> Then make that experience exceptional.

---

## OEdu Assessment Constitution

1. Learning comes before novelty.
2. Evidence comes before question type.
3. Clarity comes before decoration.
4. Engagement must have purpose.
5. Gamification never overrides rigor.
6. The student should never fight the interface.
7. AI assists design; humans retain appropriate control.
8. Assessment mode determines what the system may do.
9. Security and accessibility are architecture, not add-ons.
10. Published assessments are controlled, versioned artifacts.
11. Collect evidence, not unnecessary surveillance.
12. After assessment, turn evidence into better learning.

And the deepest principle: **Make the assessment disappear.** The student shouldn't feel like they're navigating a complicated educational software product. They should feel like they're thinking.

---

## Implementation notes

How the student runtime (`learn/exam.js`) meets this standard today, and what it does not do yet. Keep this section true.

| Section | How |
|---|---|
| §3, §50, §51 | Every published assessment is a JSON spec — an `assessment_goal`, stages, tasks and a policy — stored in `learn_assessments`. The API refuses one without a goal. The runtime renders any spec; no content lives in UI code. |
| §4, §67 | Teacher-facing task titles, skills and readiness numbers are not in the student spec. A title that names the method ("Factor theorem proof") would be a hint the paper never gave. |
| §7, §61 | One task per screen, in a single focus card. Tools open beside it, never over it. |
| §13, §14 | Progress is *answered* tasks, not screens visited. |
| §21, §22 | Calculator and reference sheet sit in the top bar, labelled, whenever the policy allows them. |
| §27, §28, §63 | The briefing screen is generated from the policy (duration, resources, restrictions), so it cannot drift from what the runtime enforces. |
| §29 | The timer reads "54 min left"; it turns amber at 5 minutes, never red, and can be hidden. |
| §30, §31, §32, §70 | Every change is written to this device at once, and to the student's account as the progress scope `exam:<id>` (compare-and-set, merge on conflict). Refresh, a closed tab or a lost connection resume where the student was. |
| §33 | Native radio groups, labelled fields, a keyboard-drivable graph with a text list of its points, focus moved to each task, polite live announcements, `prefers-reduced-motion` honoured. |
| §35, §36 | The API refuses to store a spec with an answer, key, solution or rubric in it — and, outside formative and practice modes, a hint — so none can be served. The questions go only to a signed-in student the assessment was set for, once it has opened, with `cache-control: no-store`; the list the Exams tab draws from carries no question. While a sitting runs its questions are kept on the student's device for offline recovery, and removed when it is submitted. |
| §38, §11 | The Tutor and every XP, streak and badge system are absent inside an assessment. |
| §43, §44, §45 | A calm completion screen that says exactly what happened, including whether the submission has reached the teacher yet. No confetti. |
| §71–§73 | Events recorded: started, resumed, left the page, came back, went offline, reconnected, tools opened, submitted. Neutral words; nothing is called cheating. |

**Not yet done — do not claim otherwise:**

- **Past exposure.** Algebra 2 — MP4 QAM's questions (never its answers) were a public file on edu.oplocloud.com for about half an hour on 2026-09-18, and are in the history of the `platform-backend` branch (commit 2da0f62). Specs are never committed now; the database is their only home.
- **Server-side lock.** The progress API accepts any write from the student, so "submitted" is enforced by the client. Locking a submission belongs on the server.
- **Scoring and results.** No scoring engine exists; answer keys belong in the database, never in this repository.
- **Teacher and admin views** of live sessions and submissions.
