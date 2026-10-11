# How Brilliant builds its activities — and what Grade 1 took from it

Written 2026-10-11, with `OEDU_BRILLIANT_CONCEPT.md` (the *teaching* method) in mind: this is the *engineering* side. It answers "what does Brilliant actually run?" from their own public files, checks a circulating write-up against it, and records what Kern's Grade 1 course now does because of it.

## 1. How this was checked

- brilliant.org was opened in the built-in browser, **signed out**: page data (`__NEXT_DATA__`), the course map, the build manifest (every route the app can serve).
- The 1,504 JavaScript chunks the app references (48 MB, all public static files under `/_next/static/`) were downloaded and read locally: the lesson route's chunks, the shared interactive runtime, the GraphQL documents embedded in the client.
- A lesson itself could **not** be opened: starting one needs an account, and creating one is not something done on the user's behalf. So everything below is about the *player and the runtime*, which is code, not about a specific lesson's pictures.

## 2. What was found

**The website is a Next.js / React app.** Pages router with server-side props, Turbopack build, Apollo Client over GraphQL, react-intl, Sentry, Amplitude and Segment. This part of the circulating note is right.

**A lesson is versioned data, not a React component.** The GraphQL fragment for lesson content is: `pages[]`, each a list of typed components — text, image, video, table, choice, concept box, interactive, and *problem* (a prompt, a `solvable` asset that decides correctness, an explanation either as steps or as another asset, a difficulty). The route is `/courses/[course]/[chapter]/[lesson]/[blockIndex]`; lessons carry a version name; progress is saved per lesson as `progressData`, `blocksCompleted`, `blocksTotal` and `contentHashes` (so a revised block can be told from the one the learner did).

**The activities themselves are Elm programs.** This is where the circulating note is wrong: it says React + TypeScript + SVG. The interactive host does:

1. take `compiledJs` and an `interactivesManifest` — one compiled bundle per lesson;
2. mount into a `div.viz-elm`;
3. look up `window.Elm` by the asset's module name and call `init({ flags, node })`, with flags such as the initial width, platform, experiments, debug mode and the attempt policy;
4. talk to it only through two Elm ports, `fromManagerToInteractive` and `fromInteractiveToManager`, with a tagged message protocol.

**The message protocol** (the part worth copying in shape):

| Direction | Messages |
|---|---|
| host → activity | CheckCorrectness · RevealAnswer · StartOver · NextStep · PreviousStep · FeedbackWasDismissed · Pause · Resume · ContainerWidthChanged · DocumentPointerEvent · SetTutorTimerState · PerformActions (highlight, selectable region) |
| activity → host | MarkCorrect · MarkIncorrect · TrackEvent · "can check now" · "reset behaviour changed" · send a tutor message · setup succeeded / failed |
| activity ↔ activity | BroadcastValueChanged · BroadcastNewValue · BroadcastError (two activities on one page can share a value) |

The *host* owns Check, the verdict, hints, "show me", start over, progress, sounds and analytics; the *activity* owns the picture and the manipulation and says only whether it can be checked, and whether it is right. Quizzes run with `LimitToOneAttempt`, lessons with `AllowMultipleAttempts`.

**A named scene graph sits on top of every activity.** Elements carry `data-scene-graph-node`, `-name`, `-parent-name`, `-layout`, `-enter-together`, and `aria-description`. The player reads them into a tree, `name: description [row|column]`, one line per node — that text is what the AI tutor is shown. The tutor's way of acting on the picture is `PerformActions` with a **JSON-schema enum of the node names**, so it can only point at things that exist. Authors can also attach `data-tutor-hint { kind, description, content }` to nodes: facts the tutor may use.

**Hints glow on one shared clock.** Elements opt in with `data-synced-to-pulse-timer`; their CSS animations are forced to a 2000 ms beat and driven through the Web Animations API (`getAnimations`). The host sets the clock to *playing*, *settling* (finish the beat it is in) or *paused* (rest at time 0), so everything that glows is in step and nothing is cut off half way.

**Libraries seen in the lesson route:** KaTeX (math display), MathLive (`math-field`, math input), Rive (mascot and end-state animations; 28 `.riv` files), Framer Motion (page transitions), Howler (plays `/sounds/<action>.mp3`; a native-app channel can take over; gated by a per-account *Sound effects* preference saved to the backend — the key-press and "plonk" files in the bundle are MathLive's own keyboard defaults, not Brilliant's), Immer, XState, Lottie, and Pyodide for the Python lessons. Authoring is in-house: lesson editor v2, canvases, skill tagging, translations, per-page screenshot routes with a colour-mode parameter (visual regression), and AI review tooling.

## 3. The circulating note, claim by claim

| Claim | Verdict |
|---|---|
| Next.js, React, JavaScript, Node | **Right** for the site shell. |
| TypeScript | Plausible for the shell (source maps not available); **not** how activities are written. |
| "Activities are React components with SVG" | **Wrong.** Elm, behind a host/guest protocol. SVG and HTML are both handled by the scene-graph code, so the Elm views draw into one or the other; which, per lesson, was not observable signed out. |
| Framer-style motion | **Right** (Framer Motion in the shell), plus Rive for characters. |
| KaTeX + a custom math input | **Right** (KaTeX; MathLive). |
| "Tutor: AI model + validated action tools" | **Right in shape**, and more precise than the note: the validation is an enum of scene-graph node names. |
| "Activity state: React state + structured lesson data" | **Half right**: structured, versioned lesson data yes; activity state lives in the Elm model and is mirrored to the host as problem / interactive / steppable state. |

## 4. What this means for Kern

Kern's student app is plain JavaScript with no build step, and `boardui-native-lookalikes` keeps it that way. Rewriting Grade 1 in React or TypeScript would copy the part of Brilliant that is *not* how its activities work. What *is* worth taking is the shape:

| Brilliant | Kern before | Kern now (Grade 1) |
|---|---|---|
| Lesson = data; activity = separate program; one protocol between them | Same: a step is data, a kind is a factory returning `{ el, ready, check, reveal, destroy }` | unchanged — it was already this |
| Named scene graph with a sentence per node, in `aria-*` | things had ids and labels; no state sentence | `Scene.graph()`, `Scene.text()`, `data-scene-graph-name`, `aria-description` kept current on every move |
| Actions validated against the graph's names | none | `Scene.act([{ tag: "highlight", ids }, { tag: "clear" }])` → `{ rejected }` |
| One 2 s pulse clock: playing / settling / paused | a one-off dashed zone on the second failure | `Scene.pulse()`, `Scene.flash()`, rings opt in with `data-synced-to-pulse-timer`; reduced motion = a steady ring |
| Host-driven "point at it" when the learner is stuck | Hint button only | after 8 s of quiet (and never while the voice is still reading) the thing the words are about glows; a touch lets the beat finish |
| Sound effects, one preference | none ("on purpose") | `SFX`: tick, soft landing, a bell that climbs with each thing counted, three notes for yes, two gentle falling ones for "look again"; synthesised in the browser, one remembered switch |

**Deliberately not taken:** React/TypeScript/Next (no build step on Kern); an Elm toolchain; Rive (needs the Rive editor to author; Moti stays an SVG with CSS motion); the LLM tutor on this course (six-year-olds do not chat; Kern's `tutor.js` is a local-Ollama ladder for older learners) — but `Scene.text()` and `Scene.act()` are exactly the two things a tutor would need, so adding one later changes nothing in the activities. Interactive-to-interactive broadcast, and per-lesson content hashes, are worth a look when a unit needs two linked pictures (a number line and a ten frame).

## 5. Using it (Grade 1 kit, `learn/lab/k1kit.js`)

```js
var S = Scene(spec);
S.text();                       // "scene: A room…\n\tmoti: Moti is on the table.\n\ttable: the table"
S.graph();                      // { name, description, children: [{ name, label, role, description }] }
S.act([{ tag: "highlight", ids: ["moti", "ghost"] }]);   // → { rejected: ["ghost"] }; one ring is drawn
S.pulse("playing");             // start the clock;  "settling" finishes the beat;  "paused" rests and clears
S.flash(["moti"], 2);           // ring for two beats, then settle
S.nudge = function () { return ["moti"]; };   // a kind says what to point at after a quiet moment
```

Test: `g1b/t/nudge.js` in the Grade 1 harness (33 checks: graph, validated actions, shared start time, settle within one beat, nudge, touch quiets it, sounds sequence, mute, count pitch, reduced motion).

## 6. Not established

- Whether Elm views draw SVG, HTML or both (needs a signed-in lesson).
- Which sounds exist and which verdict plays which: file names are built at run time from action strings (a retry is "hint", a streak "streak-inlesson"), so the bundle does not list them; only the ~630 onboarding-narration clips are enumerable.
- Anything about how lessons are authored internally beyond the route names.
