# Roxan for Ministry of Finance — cockpit prototype

**Date:** 2026-07-18
**Route:** `oplocloud.com/roxan/mof/` → `roxan/mof/index.html`
**Status:** Approved, building

## What it is

A front-end **prototype of the Roxan AI advisor, verticalized for a Ministry of
Finance**. It is the tool a finance leader would actually use — not a marketing
page about it. Front-end only: no live LLM, no backend, no network calls. All
responses are scripted; it should *feel* like a live tool without pretending to
be one.

It slots into the Oplo ecosystem as a nested page under the existing Roxan
flagship (`/roxan/`), the way Anthropic pairs a "Financial services" and a
"Government" solution — but here rendered as the working product surface.

## Layout — a command cockpit

Two panes inside a slim top bar.

- **Top bar:** opal presence dot + `Roxan · Ministry of Finance`; an honest
  `Illustrative data · Prototype` chip that stays visible at all times; an
  account glyph; a link back to `/roxan/` and `/`.
- **Left chat rail (~270–300px):** the conversation with Roxan (user bubbles +
  assistant bubbles), a "Suggested" set of prompt chips, and a composer.
- **Main canvas (fills remaining width):** a title, a tab strip
  (Pulse / Fiscal / Trade / Risk), and a scenario view built from KPI tiles,
  hand-drawn inline-SVG charts, and Roxan's narrated "read" cards.

## Aesthetic

Light, Apple-calm, institutional — following the OCRD self-contained recipe:

- Tokens: `--bg #fbfbfd`, `--surface #fff`, `--panel #f5f5f7`, `--ink #1d1d1f`,
  `--muted #6e6e73`, `--faint #86868b`, `--hairline #d2d2d7`,
  `--hairline-soft #e8e8ed`.
- Type: Apple system font stack (`-apple-system, BlinkMacSystemFont, "SF Pro …"`).
- Accent: the opal conic (`from 210deg, mint → sky → lilac → peach`) used *only*
  as Roxan's presence dot, the send affordance, and chart/heading highlights.
- Restrained color for data: green for favorable moves, warm amber/orange for
  watch items. No gradients on surfaces; flat panels with hairline borders.

## Behavior — the "dynamic" feel

Clicking a suggested prompt (or typing a phrase that matches one) plays a short
choreographed sequence:

1. user bubble appears in the rail;
2. Roxan "thinks" — an opal shimmer / typing indicator;
3. the reply **streams** into the rail (token-by-token feel);
4. the **canvas animates in** the matching view — tiles count up, chart paths
   draw on, cards reveal in sequence.

Respects `prefers-reduced-motion` (no counting/draw animation; content appears
directly). Keyboard operable; focus-visible rings.

## Scenarios (four, each = one canvas view)

All data is **illustrative sample data for a fictional "Republic of Meridia,"**
never presented as any real jurisdiction's official statistics.

1. **Economy Pulse** (ANALYZE) — "Give me the state of the economy."
   KPI tiles: GDP growth, inflation, unemployment, fiscal balance (watch),
   debt/GDP. Real-GDP trend chart (8 quarters). Roxan's read + a flagged watch
   item on the deficit.
2. **Policy Simulator** (GROW) — "Simulate cutting VAT to 12%."
   Before/after projection: revenue, growth, deficit, jobs, with paired
   before/after bars and a plain-language tradeoffs + risks list.
3. **Revenue & Leakage Finder** (FIND) — "Where are we losing money?"
   Ranked, quantified list: tax gap, subsidy leakage, underperforming programs,
   collection opportunities, each with a recovery estimate + a total.
4. **Growth & Brief Builder** (GROW + ACT) — "Which sectors should we back, and
   draft the cabinet memo." Sector priorities with projected jobs/ROI, then
   Roxan compiles a cabinet-ready policy brief that opens as an artifact panel.

## Structure

Single self-contained `index.html`:

- Inline `<style>` (tokens + components) and inline `<script>` — no external
  fonts, no CDN, no chart library, no build step (consistent with `/roxan/`,
  `/ocrd/`).
- A `SCENARIOS` data object: `key → { prompt, reply, canvas-spec }`, where the
  canvas-spec declares tiles/charts/cards/brief. A small renderer builds the DOM
  from the spec, so adding a scenario later is one more entry.

## Accessibility & responsive

- `prefers-reduced-motion` honored; visible focus; adequate contrast; the
  prototype/illustrative labeling is always on screen.
- Responsive: below ~640px the rail stacks above the canvas; KPI grid collapses
  to two columns.

## Honesty / non-goals

- Explicitly a **prototype with illustrative data** — no claim of real official
  statistics, no real country, no data collection, no external calls.
- No authentication, persistence, or real model inference (out of scope).
- Not a marketing/landing page (that is the existing `/roxan/` flagship's job).
