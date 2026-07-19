# OTeams — "The connected canvas for work"

**Route:** `/oteams/index.html` — single self-contained premium marketing page, same
pattern as `/roxan/` and `/productivity/`. Wires in the shared `oplo-shell`
(`/assets/css/oplo-shell.css` + `/assets/js/oplo-shell.js`) for the waffle launcher +
account chip, and registers OTeams in the shell's `OPLO_APPS` so it appears in every
app-launcher across the ecosystem.

## Positioning

OTeams is Oplo Cloud's team-communication platform. The source brief is Slack's marketing
content; we keep its **message architecture** but transpose it to the Oplo world — no
competitor names. Slack → OTeams, Slackbot/Agentforce → **Roxan**, Salesforce/Microsoft →
**Oplo apps + partners**.

**The differentiating idea:** rivals sell a *list of features*. OTeams sells **one living
canvas** — a spatial workspace where channels, huddles, canvas docs, lists, Roxan and
app-agents are objects on an infinite surface. The page is a scroll-narrative *through
that canvas*.

## Art direction

- Porcelain base (`#FCFCFD` / panel `#F4F5F7`, ink `#0B0C0F`), Oplo type
  (Instrument Serif display / Instrument Sans body / Spline Sans Mono labels).
- **Hybrid light+dark:** the hero and two key sections are dark "spatial" panels with
  opal glow; the rest is airy porcelain — the trust corporates expect, with next-gen
  wow where it counts.
- **OTeams signature accent:** a sky→lilac "connection" gradient
  (`#9CC3FF → #D4B3FF`) — two dots linking = communication. Its own identity, still in
  the opal family.

## Section map (Slack structure → Oplo-native)

1. Hero (dark spatial) — "One canvas where work connects." Living workspace: channel rail,
   a thread, a Roxan popover, a huddle bubble, floating app-agent chips. CTAs Get started /
   Request a demo.
2. Thesis (light) — one open, connected platform; Roxan is part of the team, not an add-on.
3. The connected canvas (dark spatial) — signature interactive: infinite surface with
   channels, a canvas doc, a huddle, a list as parallax/drag objects.
4. Apps & agents (light) — Oplo apps + partners deeply connected.
5. Enterprise search (light) — Roxan-powered search across apps, chats, files.
6. Workflow builder (light) — no-code automation as connected nodes.
7. Feature pillars (tabbed) — Collaboration · Project management · Integrations ·
   Intelligence, each with sub-features.
8. Testimonial — one clearly-fictional Oplo-world customer quote.
9. Resources — 3–4 cards → `/soon/`.
10. FAQ (accordion) — 6 Slack FAQs transposed to OTeams.
11. CTA band + footer (Oplo convention).

## Interactions (front-end only, reduced-motion safe)

Spatial pointer-parallax + light drag on canvas objects; tabbed feature pillars; FAQ
accordion; reveal-on-scroll; opal glow; nav translucent-on-scroll + mobile toggle. No real
sends/data — consistent with the rest of the ecosystem.

## Out of scope

No backend, no real auth, no real search/messaging. Testimonial + compliance claims are
fictional product marketing within the fictional Oplo brand world.
