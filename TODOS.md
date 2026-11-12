# TODOS

Deferred by `/autoplan` on 2026-10-27 (plan: `docs/OEDU_INDIA_SCHOOL_OS_PLAN.md`). Each item is real work with a trigger; none is rejected.

## OEdu

### Pilot-evidence page

**What:** An admin page showing logins per role, registers taken before 9:00, weekly active parents and message delivery rates for a school.

**Why:** A pilot is only useful if it produces evidence; today the plan has no named pilot and no way to show usage.

**Context:** Feed it from `learn_audit` (migration 0070) and the delivery-state tables required by O12 in the plan. Pros: shows what a school actually does, answers "who would be upset if it vanished". Cons: adds a screen before there is a pilot. Build it the week a pilot starts.

**Effort:** M (human ~3 days / CC ~3 hours)
**Priority:** P2
**Depends on:** a named pilot school (O1); delivery-state tables (O12)

### Attendance push to parents and the principal's 8:45 digest

**What:** A parent hears within minutes when their child is marked absent; the principal gets "registers in 52/68" at 8:45.

**Why:** The two highest-value uses of the register that need no new screen.

**Context:** Needs an approved WhatsApp or SMS sender and DLT templates (O3) and the channel layer (B5). Pros: visible daily value to parents and principal. Cons: a wrongly sent absence alert is a trust problem; needs opt-out handling.

**Effort:** M (human ~3 days / CC ~3 hours)
**Priority:** P2
**Depends on:** B5 channels approved; O12 delivery state

### Multi-branch school groups

**What:** A school group with several branches and a group-level view (the owner's layer 1 gap).

**Why:** A group principal cannot see all branches; layer 1 is marked partial in the owner's map.

**Context:** No evidence in the repo or brief that a pilot needs it. Tenancy is `org_id` on a shared D1; groups mean a parent organisation and cross-org reads. Pros: opens the group-school market. Cons: touches authorization everywhere. Revisit when a school with two or more branches is in the pipeline.

**Effort:** L (human ~2 weeks / CC ~2 days)
**Priority:** P3
**Depends on:** a pilot school with branches; O8 module switches

### Payroll with PF, ESI and TDS

**What:** Staff payroll with statutory deductions, staff attendance feed, payslips.

**Why:** Layer 6 gap; the accounts office keeps a second tool for it.

**Context:** Statutory computation is high risk and rules change each year; needs an accountant's review. Pros: removes a second tool. Cons: wrong figures cost staff real money. Not before the first school has fees working.

**Effort:** XL (human ~6 weeks / CC ~1 week)
**Priority:** P3
**Depends on:** fees ledger (O10); finance stays in scope (decision of 2026-10-23)

### Transport with live GPS and parent alerts

**What:** Routes, stops, riders (partly present) plus live location and parent alerts.

**Why:** Layer 7 gap; a child's transport is a line of text today.

**Context:** Needs hardware or a driver app and a messaging channel; high cost, low evidence of need for a first pilot. Pros: parents value it. Cons: hardware, privacy of children's location, constant data.

**Effort:** XL (human ~6 weeks / CC ~1 week)
**Priority:** P3
**Depends on:** B5 channels; O11 residency memo

### AI helper (drafts only, a person approves)

**What:** Drafts circulars and HPC remarks and flags at-risk children; every output needs human approval.

**Why:** Time saver for teachers; named in the owner's map.

**Context:** An AI side panel exists on another branch with no model key. Children's data going to a model is a disclosure under the Supreme Court APAAR order and DPDP: needs the O11 memo and processor terms first. Pros: saves teacher time. Cons: data leaves India, malformed or refused output needs handling.

**Effort:** L (human ~2 weeks / CC ~2 days)
**Priority:** P3
**Depends on:** O11 memo; a model key from the owner; B3 HPC layouts

### Per-school accent colour

**What:** Let a school set its brand colour in settings; generate hover and soft shades and fall back to the default when contrast against white is under 4.5:1 (brief 3.1).

**Why:** Schools expect their colour in the product; the brief allows it.

**Context:** No code or screen exists. A pilot can use the default blue. Pros: a school sees itself in the product. Cons: a contrast-safe shade generator for four themes, and a risk of off-brand colours breaking the flat look.

**Effort:** M (human ~3 days / CC ~3 hours)
**Priority:** P3
**Depends on:** DESIGN.md (D1); tokens checked by `tools/check_tokens.py`

### Official HPC print layouts

**What:** The stage layouts (foundational, preparatory, middle, secondary) of the Holistic Progress Card, printable on A4 portrait.

**Why:** A school prints the card parents receive; v1 prints OEdu's own layout.

**Context:** The official templates are not in the repo (readiness doc: not public or not supplied). Pros: matches what boards and parents expect. Cons: blocked on obtaining the templates.

**Effort:** M (human ~1 week / CC ~1 day)
**Priority:** P2
**Depends on:** the school or PARAKH supplying the layouts; print rules (D12)

### Receipt share by WhatsApp

**What:** A parent can share a fee receipt as a link or PDF from the family app.

**Why:** Parents ask for proof of payment; it also reduces office queries.

**Context:** Needs fees (O10) and the channel layer (B5).

**Effort:** S (human ~1 day / CC ~1 hour)
**Priority:** P3
**Depends on:** fees ledger; B5

### Family shell dark and high-contrast verification

**What:** Check the family shell in the dark and high-contrast themes at 360 px with axe.

**Why:** The tokens ship four themes; the family shell is a separate bundle and may drift.

**Context:** Do at step 10 with the performance pass.

**Effort:** S (human ~1 day / CC ~1 hour)
**Priority:** P3
**Depends on:** the family shell (step 8)

### Page scaffold generator

**What:** `api/scripts/new-page.mjs <module>/<page>` writes the page file, registers it with its template, adds the script tag, adds empty keys to both packs and runs the lints.

**Why:** 72 screens each need the same four edits in three places; an agent repeats them and gets one wrong.

**Context:** Build after the shared T2 and T3 templates are extracted (O6), so the scaffold writes config, not markup. Pros: removes boilerplate, enforces the template field. Cons: one more tool to maintain.

**Effort:** S (human ~1 day / CC ~1 hour)
**Priority:** P2
**Depends on:** O6 template extraction; X2 README

### Deprecation helper for the component library

**What:** `OL.ui.deprecate(name, since, use)` warns once in development when an old option name is used.

**Why:** Option renames across 72 call sites should fail loudly, not silently.

**Context:** A new API, so outside DX POLISH. X7 (changelog and same-commit rule) covers the gap until then.

**Effort:** S (human ~0.5 day / CC ~30 minutes)
**Priority:** P3
**Depends on:** X7

### Types for window.OL

**What:** JSDoc or a `.d.ts` file describing `OL.ui.*`, `OL.pages` and `OL.fmt` so an editor or agent can complete options.

**Why:** No compile step means no type errors; completion is the only static help.

**Context:** The brief locks vanilla JS; types as documentation do not change that.

**Effort:** M (human ~3 days / CC ~3 hours)
**Priority:** P3
**Depends on:** X2 README

### Per-student attendance summary table

**What:** A table of each student's attendance totals, updated when a register is saved, so the Directory reads one row per student instead of scanning every whole-day mark of the year.

**Why:** `watchCounts` (`api/src/repo/d1.js:1629-1634`) reads every whole-day mark of the year on each Directory request: about 216,000 rows at 1,801 students and 120 school days (estimated).

**Context:** Build only if the E7 bench misses its budget (p95 600 ms filtered page). Pros: constant cost per request. Cons: a second copy of attendance that must stay in step with the register (split ownership).

**Effort:** M (human ~3 days / CC ~3 hours)
**Priority:** P2
**Depends on:** O17 seed; E7 bench result

### Audit retention and archival policy

**What:** Decide how long audit rows are kept, how old rows are archived, and how a DPDP erasure request treats them; index or restructure the audit search.

**Why:** `listAudit` searches five columns with a leading wildcard (`api/src/repo/d1.js:4305`) and the log grows with every change, reveal and export.

**Context:** Decide inside the O11 memo with counsel. Pros: a log that stays fast and lawful. Cons: legal input needed.

**Effort:** M (human ~2 days / CC ~2 hours)
**Priority:** P2
**Depends on:** O11 memo

### Rate Limiting binding as a coarse per-IP front throttle

**What:** Add Cloudflare's Rate Limiting binding in front of the public sign-in endpoints as a cheap first filter, keeping the D1 counter (E4) as the exact limit.

**Why:** It absorbs floods before they reach D1. It is approximate and per location, so it cannot be the only limit.

**Context:** Add at the first public OTP endpoint. Pros: less load on D1. Cons: one more binding to configure.

**Effort:** S (human ~0.5 day / CC ~30 minutes)
**Priority:** P3
**Depends on:** E4; the family sign-in endpoint
