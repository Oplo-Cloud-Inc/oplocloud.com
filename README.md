# Oplo — oplocloud.com

The Oplo ecosystem, as one repository. A single static site that ties every Oplo
surface together the way Google ties Gmail, Docs and Maps together: **one shared
shell** — the same app-launcher and account chip on every page — over a family of
apps that each keep their own product colour.

> *Technology for people, business, and government* — hardware, software, and
> cloud, engineered as one system.

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
- **`assets/css/oplo-design.css`** — the **design system**: tokens, the type
  ladder, links and buttons, the full-bleed "unit" bands and tile grid, the
  fine-print footer, and the one scroll reveal everything uses. Load this on any
  page that should look like the front page.
- **`assets/js/oplo-motion.js`** — the reveal-on-scroll, the footer's mobile
  disclosure rows, and the pointer-tracked highlight. Fails open: content is
  visible until the script arms the animation, so nothing can be left blank.
- **`assets/css/site.css`** + **`assets/js/site.js`** — the older marketing
  chrome still used by the suite "coming soon" pages, being retired in favour of
  `oplo-design.css`.

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

A quiet canvas, one accent blue, an enormous type scale, and the product as the
only ornament — the front page and the global chrome are built to that rule.

- **Canvas** — `#fff`, `#f5f5f7` for grey bands, `#000` for dark ones. Tiles sit
  on the page ground with a 12px gutter between them; a tile is never pure white.
- **Ink** — `#1d1d1f` for text, `#6e6e73` secondary, `#86868b` tertiary.
- **Accent** — one blue: `#0066cc` for links, `#0071e3` for buttons, `#2997ff` on
  dark. Nothing else is coloured.
- **Type** — SF Pro where it exists, Inter everywhere else. Six sizes, two
  weights: `.t-hero`, `.t-display`, `.t-title`, `.t-head`, `.t-sub`, `.t-lead`,
  plus `.t-body` and `.t-fine`. The size does the talking.
- **Measure** — a 980px copy well; tile grids stop at 1680px.
- **Chrome** — a 44px translucent bar on every page, its dropdowns opaque
  full-width sheets, and a 12px fine-print footer.
- **Motion** — one reveal: rise 28px and resolve over 1s. Nothing bounces.

The **opal** (a mint → sky → lilac → peach conic gradient) stays as the mark for
Roxan and for Oplo itself; product apps keep their own icon gradients. Every
product on the front page — the notebook, the handset, the O1 die, the rack, the
app dock — is drawn in CSS and SVG, so the page ships no images.
