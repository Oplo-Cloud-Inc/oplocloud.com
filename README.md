# Oplo — oplocloud.com

The Oplo ecosystem, as one repository. A single static site that ties every Oplo
surface together the way Google ties Gmail, Docs and Maps together: **one shared
shell** — the same app-launcher and account chip on every page — over a family of
apps that each keep their own product colour.

> *Technology at every order of magnitude* — engineered for a single person, ten
> thousand people, and entire nations.

## What's in here

| Path | What it is |
| --- | --- |
| `/` ([index.html](index.html)) | The Oplo landing page |
| `/productivity/` | The productivity suite hub (ODocs, OSheets, OMails, OMaps, OSurf, OPhotos, OCanvas) |
| `/roxan/` | Roxan — the AI woven through every app |
| `/oedu/` | OEdu education landing |
| `/oedu/teacher/` | **OEdu Teacher** — a full, working teacher dashboard app (vanilla ES modules) |
| `/odocs/` `/osheets/` `/omails/` `/omaps/` `/osurf/` `/ophotos/` `/ocanvas/` | Suite app pages (early "coming soon" surfaces) |
| `/oplo-accounts/` | Oplo Accounts — the ecosystem's single sign-in, over self-hosted [ZITADEL](https://zitadel.com) (OIDC). See its [README](oplo-accounts/README.md) |
| `/soon/` | Generic "coming soon" surface |
| `/assets/` | Shared chrome — see below |

## The shared shell (the connective tissue)

Everything that makes Oplo feel like *one* place lives in three files, loaded by
every page:

- **`assets/js/oplo-shell.js`** — injects the **waffle app-launcher** and the
  **account chip** into every page, and keeps them there even as the OEdu Teacher
  single-page app re-renders. The app registry at the top of this file is the
  **single source of truth** for what's in the ecosystem — add an app there and it
  appears in the launcher everywhere.
- **`assets/css/oplo-shell.css`** — self-contained styles for the launcher and
  account menu (its own design tokens, so it renders identically inside apps that
  carry a different design system, like OEdu Teacher).
- **`assets/css/site.css`** + **`assets/js/site.js`** — the marketing-site chrome
  (nav, mega-menu, footer, scroll reveals) shared by the landing and hub pages.

Each page just needs `<div id="oplo-actions"></div>` where the cluster should sit
and `<script src="/assets/js/oplo-shell.js" defer></script>`. If no slot exists, the
shell floats it top-right.

Account state is read from the same OIDC session that
[Oplo Accounts](oplo-accounts/README.md) writes, so signing in once lights up the
avatar across the whole ecosystem.

## Run it locally

Pure static — no build step. Any static server works:

```bash
python3 -m http.server 4173
# then open http://localhost:4173
```

(There's a `.claude/launch.json` preconfigured for this on port 4173.)

## Deploy — GitHub Pages on oplocloud.com

This repo is set up to publish to **GitHub Pages** at the apex domain
`oplocloud.com` (see the `CNAME` file). To go live:

1. **Repo → Settings → Pages** → Source: **Deploy from a branch**, Branch:
   `main` / `/ (root)`.
2. Pages reads the `CNAME` file and sets the custom domain to `oplocloud.com`.
3. At your DNS provider, point the domain at GitHub Pages:
   - Apex `oplocloud.com` → four `A` records:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
     (and the matching `AAAA` records if you want IPv6).
   - `www` → `CNAME` to `<org>.github.io`.
4. Enable **Enforce HTTPS** once the certificate is issued.

> Note: **Oplo Accounts** (the ZITADEL identity server in `oplo-accounts/`) is a
> backend and does **not** run on GitHub Pages — only its browser sign-in *client*
> ships here. Host ZITADEL separately and point the client's `authority` at it.

## Design system

The opal signature (a mint → sky → lilac → peach conic gradient), Schibsted Grotesk
for display, Instrument Sans for body, Spline Sans Mono for labels. Product apps
each get their own icon gradient; the shell and marketing chrome stay neutral so the
ecosystem reads as one system.
