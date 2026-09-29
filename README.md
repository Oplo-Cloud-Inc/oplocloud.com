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
| `/learn/` | **OEdu** — the working product: the student's app, and the teacher's Console, which has its own left-rail shell and no top bar at all. See [TEACHER_UX.md](docs/TEACHER_UX.md) |
| `/api/` | The platform API — identity, courses, grades. See its [README](api/README.md) |
| `/dev/` | **Oplo Developer** — the developer site at `dev.oplocloud.com`. Black the whole way down, wearing the site's own bar and footer. Every picture and film in it is an empty slot until a file is dropped in `dev/media/` — see its [README](dev/media/README.md). Config: [wrangler.dev.toml](wrangler.dev.toml) |
| `/oedu/` | OEdu education landing |
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

## Ship it

`tools/ship.sh` is the one way work on `platform-backend` goes live. It refuses
a dirty tree, merges into `main` in a throwaway worktree, pushes, and only then
publishes the Workers — from that checkout of `main`, never from the tree being
edited — stopping at the first step that fails.

```bash
tools/ship.sh             # the student app at edu.oplocloud.com
tools/ship.sh --api       # remote D1 migrations, then the API, then the app
tools/ship.sh --dev       # also the developer site at dev.oplocloud.com
tools/ship.sh --dry-run   # merge and verify locally; publish nothing
```

**Every push to `main` is also checked on GitHub** —
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs ship.sh's
checks. With the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository
secrets set, it also publishes: the student app to edu.oplocloud.com, after the
D1 migrations and the API when the push changed `api/`. Without them it skips
publishing quietly (a note on the run, not a failure), and `tools/ship.sh` from
your machine is what puts `main` live. Either way, a pull request merged on
GitHub doesn't publish anything by itself otherwise: the Cloudflare build that
comments on pull requests is a different Worker. The developer site stays a
deliberate `ship.sh --dev`.

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

Near-monochrome, one accent, an enormous type scale. There is one drawn image
on the whole site — the front page opens on it — and it is the brand rather
than a product: a drawn *product* still reads as worse than no product, so
everywhere else the words and the space are the design.

- **Ground** — `#fff`, `#f5f5f7`, and `#000`. Nothing else.
- **Ink** — `#1d1d1f`, `#6e6e73` secondary, `#86868b` tertiary.
- **Accent** — one blue, `#0066cc` on light and `#2997ff` on dark, used on links.
  Buttons are reserved for commerce, with one exception: the two pills in the
  front page's opening picture, which copy apple.com's opener — a filled
  `#0071e3` one and an outlined one (`.pill`, in `assets/css/oplo-home.css`).
- **Type** — SF Pro where it exists, Inter everywhere else. `.t-mega` down
  through `.t-hero`, `.t-display`, `.t-title`, `.t-sub`, `.t-lead`, `.t-fine`.
- **Hierarchy** — a `.band` is a tall full-bleed statement; a `.card` is half
  as tall and comes in pairs. That size difference *is* the hierarchy, and
  flattening it into one repeating tile is what made the first attempt fail.
- **Colour is spent once** — the Earth photograph on the front page, and a single
  soft `.bloom` behind any dark band. The rest of the site is black, white, and grey.
- **The front page** — quiet on purpose, and it has no script of its own. `home()`
  in `tools/build.py` builds it and `assets/css/oplo-home.css` (loaded by
  `index.html` and nothing else) styles it: an opening picture two thirds of the
  window tall with two pills at its foot, a sentence saying what Oplo is, and a
  plain white list with an entry for each door in the bar — words, a hairline
  and a link, no boxes and no pictures. Nothing on it moves except the site's own
  fade-in as a section scrolls into view. An earlier version had a cursor-lit
  wordmark, parallax, tilting tiles and animated pictures; it was taken out on
  purpose, so do not add motion back without being asked.
- **Hero artwork** — the opening picture is `OploWebsite.svg`, a design export
  (Earth at night, with "Hello" over it) whose six megabytes are embedded
  images. `python3 tools/hero.py path/to/OploWebsite.svg` flattens it, exactly as
  the SVG composes it, into `assets/img/hero-earth-1440.webp` and
  `hero-earth-2880.webp`; the SVG itself is not kept in the repository. On a
  phone the picture is shown whole rather than cropped, because the word would
  be cut in half. `hero-nature.svg` (dunes at dusk) is the previous artwork and
  is no longer used. Every URL carries a `?v=` stamp from `tools/build.py`, like
  the CSS. To rebuild only this page without touching the copies of the bar in
  `learn/` and `dev/`:
  `python3 -c "import sys; sys.path.insert(0,'tools'); import build; p,c=build.PAGES[0]; open(p,'w').write(c)"`.

