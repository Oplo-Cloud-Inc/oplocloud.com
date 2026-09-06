#!/usr/bin/env python3
"""
Oplo site builder.

The nav and footer appear on every page, so they live here once rather than in
fifteen copies that drift. Output is plain static HTML with no runtime
dependency on this script — the deployed site is exactly what lands in the repo.

Links are written relative to each page's depth, so every page renders and
navigates correctly whether it is served over http or opened straight off disk.

    python3 tools/build.py
"""
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MARK_VB = "84.13 107.80 206.73 194.91"
MARK_TR = "73.919875, 252.710833"
MARK_D  = ("M 77.929688 -144.414062 C 39.890625 -144.414062 10.710938 -112.648438 10.710938 -76.824219 "
           "C 10.710938 -43.953125 34.71875 -14.40625 71.652344 -10.339844 C 69.066406 -19.207031 "
           "68.699219 -23.269531 68.699219 -30.285156 C 68.699219 -66.851562 98.246094 -98.246094 "
           "135.179688 -98.246094 C 137.027344 -98.246094 139.613281 -98.246094 142.199219 -97.875 "
           "C 131.855469 -127.421875 106.371094 -144.414062 77.929688 -144.414062 Z "
           "M 130.378906 -138.132812 C 149.214844 -120.777344 158.449219 -101.199219 158.449219 -77.5625 "
           "C 158.449219 -32.503906 121.515625 3.324219 78.671875 3.324219 C 61.3125 3.324219 "
           "45.058594 -2.214844 29.917969 -12.558594 L 88.273438 33.609375 C 98.246094 41.367188 "
           "119.296875 49.492188 135.917969 49.492188 C 180.980469 49.492188 216.4375 12.925781 "
           "216.4375 -31.023438 C 216.4375 -56.140625 205.355469 -78.671875 185.78125 -94.183594 Z "
           "M 130.378906 -138.132812")

NAV = [("Hardware", "hardware/"), ("Software", "software/"), ("Intelligence", "intelligence/"),
       ("Privacy", "privacy/"), ("Edu", "edu/"), ("Oplo+", "plus/"), ("Company", "company/"), ("Support", "support/")]

FOOTER = [
    ("Hardware", [("Overview", "hardware/"), ("Silicon", "hardware/#silicon"),
                  ("Devices", "hardware/#devices"), ("Accessories", "hardware/#accessories")]),
    ("Software", [("Overview", "software/"), ("Apps", "software/#apps"),
                  ("Updates", "software/#updates"), ("Downloads", "software/#downloads")]),
    ("Intelligence", [("Overview", "intelligence/"), ("On-device AI", "intelligence/#on-device"),
                      ("Privacy", "privacy/"), ("Research", "intelligence/#research")]),
    ("Developers", [("Documentation", "developers/#docs"), ("SDKs", "developers/#sdks"),
                    ("Design resources", "developers/#design"), ("Support", "developers/#support")]),
    ("Education", [("Oplo Edu", "edu/"), ("Oplo Learn", "learn/"), ("Edu Learn", "edu/learn/"),
                   ("Who it is for", "edu/#who"), ("Contact", "contact/")]),
    ("Membership", [("Oplo+", "plus/"), ("Plans", "plus/#plans"),
                    ("Compare tiers", "plus/#compare"), ("Questions", "plus/#faq")]),
    ("Company", [("About Oplo", "company/"), ("Newsroom", "newsroom/"),
                 ("Careers", "careers/"), ("Investors", "investor/"),
                 ("Contact", "contact/")]),
]
LEGAL = [("Privacy Policy", "legal/privacy-policy/"), ("Terms of Use", "legal/terms/"),
         ("Legal", "legal/"), ("Site Map", "sitemap.xml")]


def rel(depth, target):
    """Rewrite a root-relative target for a page nested `depth` levels down."""
    if target.startswith(("http", "mailto:", "#")):
        return target
    up = "../" * depth
    return (up + target) if target else (up + "index.html")


def head(depth, title, desc, canonical, extra=""):
    a = rel(depth, "assets/")
    fav = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='" + MARK_VB +
           "'%3E%3Cg transform='translate(" + MARK_TR + ")'%3E%3Cpath fill='%23000' d='" +
           MARK_D + "'/%3E%3C/g%3E%3C/svg%3E").replace("#", "%23").replace('"', "%22")
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#ffffff">
<link rel="canonical" href="https://oplocloud.com/{canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Oplo">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="https://oplocloud.com/{canonical}">
<link rel="icon" href="{fav}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{a}css/oplo-design.css">
<script>
  (function (r) {{
    r.classList.add("oplo-motion");
    setTimeout(function () {{ if (!window.__oploMotion) r.classList.remove("oplo-motion"); }}, 4000);
  }})(document.documentElement);
</script>
<style>body {{ padding-top: 44px; }}</style>
{extra}
</head>
<body>
'''


def nav(depth, active=""):
    mark = (f'<svg class="mark" viewBox="{MARK_VB}" aria-hidden="true" focusable="false">'
            f'<g transform="translate({MARK_TR})"><path fill="currentColor" d="{MARK_D}"/></g></svg>')
    items = "".join(
        f'\n        <li><a href="{rel(depth, href)}"'
        + (' aria-current="page"' if href == active else "")
        + f'>{label}</a></li>'
        for label, href in NAV)
    return f'''<nav class="nav" id="nav" aria-label="Oplo">
  <div class="nav-in">
    <a class="nav-brand" href="{rel(depth, "")}" aria-label="Oplo home">
      {mark}
    </a>
    <ul class="nav-links" id="navLinks">{items}
    </ul>
    <div class="nav-end">{"" if active == "sign-in/" else f'<a href="{rel(depth, "sign-in/")}">Sign in</a>'}</div>
    <button class="nav-toggle" id="navToggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="navLinks">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>
'''


def chapter(depth, name, links, home, cta=None):
    """cta is (label, target); it sits outside the scrolling link list so a
    phone cannot push the one actionable thing off the end of the bar."""
    ls = "".join(
        f'<a href="{l[1]}"' + (f' class="{l[2]}"' if len(l) > 2 else "") + f'>{l[0]}</a>'
        for l in links)
    action = ""
    if cta:
        action = f'<a class="chapter-cta" href="{rel(depth, cta[1])}">{cta[0]}</a>'
    return f'''<div class="chapter">
  <div class="chapter-in">
    <a class="chapter-name" href="{rel(depth, home)}">{name}</a>
    <nav class="chapter-links" aria-label="{name} sections">{ls}</nav>
    {action}
  </div>
</div>
'''


def footer(depth, notes=None):
    note_html = ""
    if notes:
        # A <details> that ships open: with no JavaScript the notes read exactly
        # as they always have. oplo-motion folds them on a phone only.
        note_html = ('<div class="notes"><details class="notes-d" open>'
                     '<summary>Notes</summary><ol>'
                     + "".join(f"<li>{n}</li>" for n in notes) + "</ol></details></div>")
    cols = ""
    for title, links in FOOTER:
        li = "".join(f'\n          <li><a href="{rel(depth, h)}">{l}</a></li>' for l, h in links)
        cols += f'''
      <div class="foot-col">
        <h3>{title}</h3>
        <ul>{li}
        </ul>
      </div>'''
    legal = "".join(f'\n        <a href="{rel(depth, h)}">{l}</a>' for l, h in LEGAL)
    return f'''{note_html}
<footer class="foot" aria-label="Oplo footer">
  <div class="foot-in">
    <div class="foot-note">
      <p>Oplo is building its first hardware, software and intelligence products. Pages on this site describe intent and direction; availability and capability are not final.</p>
      <p>Questions about any of it? <a href="{rel(depth, "contact/")}">Get in touch</a>.</p>
    </div>
    <div class="foot-rule"></div>
    <div class="foot-cols">{cols}
    </div>
    <div class="foot-rule"></div>
    <div class="foot-bar">
      <span>Copyright &copy; 2026 Oplo, Inc. All rights reserved.</span>
      <span class="foot-legal">{legal}
      </span>
      <span class="foot-region">United States</span>
    </div>
  </div>
</footer>

<script src="{rel(depth, "assets/")}js/oplo-motion.js" defer></script>
<script>
  (function () {{
    var nav = document.getElementById("nav");
    var links = document.getElementById("navLinks");
    var toggle = document.getElementById("navToggle");
    if (!nav || !links || !toggle) return;
    var held = 0;
    function set(open) {{
      if (open === links.classList.contains("open")) return;
      if (open) {{
        held = window.scrollY;
        document.body.style.top = (-held) + "px";
        document.body.classList.add("locked");
      }} else {{
        document.body.classList.remove("locked");
        document.body.style.top = "";
        window.scrollTo(0, held);
      }}
      links.classList.toggle("open", open);
      nav.classList.toggle("open", open);
      toggle.classList.toggle("on", open);
      toggle.setAttribute("aria-expanded", String(open));
    }}
    toggle.addEventListener("click", function () {{ set(!links.classList.contains("open")); }});
    links.addEventListener("click", function (e) {{ if (e.target.closest("a")) set(false); }});
    window.addEventListener("resize", function () {{ if (links.classList.contains("open")) set(false); }});
    document.addEventListener("keydown", function (e) {{ if (e.key === "Escape") set(false); }});
  }})();
</script>

</body>
</html>
'''

# ---------------------------------------------------------------- Content
# Written to what Oplo has actually said it is: hardware, software and AI,
# built around the person. It names no product that does not exist and quotes
# no specification. Where something is not built yet, the page says so.

def mo(text):
    """Wrap an elaborating clause so a phone drops it. What is left has to be a
    complete sentence on its own — this trims, it does not truncate."""
    return f'<span class="more">{text}</span>'


def band(cls, inner, ident=""):
    i = f' id="{ident}"' if ident else ""
    return f'<section class="band {cls}"{i}>\n{inner}\n</section>\n'


def row(cls, ident, eyebrow, head, lead, cta=None, depth=0):
    c = ""
    if cta:
        c = '<p class="cta-row reveal d2">' + "".join(
            f'<a class="cta" href="{rel(depth, h)}">{t}</a>' for t, h in cta) + "</p>"
    return f'''  <section class="row {cls}" id="{ident}">
    <p class="eyebrow reveal">{eyebrow}</p>
    <h2 class="t-display balance reveal">{head}</h2>
    <p class="t-lead muted balance reveal d1">{lead}</p>
    {c}
  </section>
'''


def section_page(slug, depth, title, desc, hero_eyebrow, hero_head, hero_lead, rows, notes):
    links = [(r[2], "#" + r[1]) for r in rows]
    out = head(depth, title, desc, slug)
    out += nav(depth, slug)
    out += chapter(depth, hero_eyebrow, links, slug)
    out += "<main>\n"
    out += band("opening well", f'''  <h1 class="t-hero balance reveal">{hero_head}</h1>
  <p class="t-sub muted balance reveal d1">{hero_lead}</p>''')
    out += '<div class="rows">\n'
    for cls, ident, eyebrow, h, lead, cta in rows:
        out += row(cls, ident, eyebrow, h, lead, cta, depth)
    out += "</div>\n</main>\n"
    out += footer(depth, notes)
    return out


def doc_page(slug, depth, title, desc, heading, dateline, body):
    out = head(depth, title, desc, slug)
    out += nav(depth)
    out += f'<main class="doc">\n<h1 class="t-hero">{heading}</h1>\n'
    out += f'<p class="dateline">{dateline}</p>\n{body}\n</main>\n'
    out += footer(depth)
    return out


PAGES = []

# ------------------------------------------------------------------- Home
def home():
    depth = 0
    out = head(depth, "Oplo", "Oplo builds hardware, software and intelligence designed around one person at a time.", "")
    out += nav(depth)
    out += "<main>\n"
    out += band("opening well", '''  <h1 class="t-mega reveal">Oplo</h1>
  <p class="t-sub muted measure-wide reveal d1">Hardware, software, and intelligence — designed around one person at a time.</p>
  <p class="cta-row reveal d2">
    <a class="cta" href="hardware/">See what we build</a>
    <a class="cta" href="company/">About Oplo</a>
  </p>''')
    out += band("dark tall", '''  <span class="bloom" aria-hidden="true"></span>
  <div class="well">
    <p class="eyebrow reveal">Intelligence</p>
    <h2 class="t-hero measure reveal">Close to you.<br class="br-wide">Not to a data centre.</h2>
    <p class="t-lead muted measure-wide reveal d1">Models that run on the device in your hand, on silicon designed to carry them.</p>
    <p class="cta-row reveal d2"><a class="cta" href="intelligence/">Learn more</a></p>
  </div>''')
    out += band("grey tall", '''  <div class="well">
    <p class="eyebrow reveal">Hardware</p>
    <h2 class="t-hero measure reveal">We make the machine and everything on it.</h2>
    <p class="t-lead muted measure-wide reveal d1">One team from the silicon to the last pixel, so neither side has to compromise for the other.</p>
    <p class="cta-row reveal d2"><a class="cta" href="hardware/">Learn more</a></p>
  </div>''')
    out += '''<div class="cards">
  <section class="card">
    <p class="eyebrow reveal">Software</p>
    <h2 class="t-display balance reveal">Built for a person,<br class="br-wide">not an org chart.</h2>
    <p class="t-lead muted reveal d1">Tools that assume one user with taste, not a procurement department.</p>
    <p class="cta-row reveal d2"><a class="cta" href="software/">Learn more</a></p>
  </section>
  <section class="card dark">
    <p class="eyebrow reveal">Privacy</p>
    <h2 class="t-display balance reveal">Yours stays yours.</h2>
    <p class="t-lead muted reveal d1">Personal computing only means something if the personal part stays private.</p>
    <p class="cta-row reveal d2"><a class="cta" href="privacy/">Learn more</a></p>
  </section>
  <section class="card">
    <p class="eyebrow reveal">Developers</p>
    <h2 class="t-display balance reveal">Build on Oplo.</h2>
    <p class="t-lead muted reveal d1">One set of tools across the hardware, the software and the models.</p>
    <p class="cta-row reveal d2"><a class="cta" href="developers/">Read the docs</a></p>
  </section>
  <section class="card">
    <p class="eyebrow reveal">Company</p>
    <h2 class="t-display balance reveal">Where we're going.</h2>
    <p class="t-lead muted reveal d1">What we're building, who is building it, and how to join.</p>
    <p class="cta-row reveal d2">
      <a class="cta" href="careers/">Careers</a>
      <a class="cta" href="newsroom/">Newsroom</a>
    </p>
  </section>
</div>
</main>
'''
    out += footer(0)
    return ("index.html", out)

PAGES.append(home())

# --------------------------------------------------------- Section pages
PAGES.append(("hardware/index.html", section_page(
    "hardware/", 1, "Hardware — Oplo",
    "Oplo designs the machine and the software that runs on it, from the silicon up.",
    "Hardware", "The machine, made whole.",
    "One team from the silicon to the last pixel, so neither side has to compromise for the other.",
    [("dark", "silicon", "Silicon", "Designed for the software that runs on it.",
      "General-purpose parts force general-purpose software. Designing our own means the intelligence, the operating system and the chip are shaped to each other rather than negotiated between vendors.",
      [("How that shapes the software", "software/")]),
     ("", "devices", "Devices", "Personal, in the original sense.",
      "A machine that belongs to the person holding it: quiet when it should be, ready when it is needed, and not quietly working for someone else.",
      [("Read our position on privacy", "privacy/")]),
     ("", "accessories", "Accessories", "The parts around the machine.",
      "Everything that attaches to a device is part of the experience of owning it. Nothing here is finished, and we would rather ship it late than ship it thoughtless.",
      None)],
    ["Oplo hardware is in development. Nothing on this page is an offer of sale or a commitment to a specification.",
     "Descriptions of silicon and device behaviour describe design intent and are subject to change."])))

PAGES.append(("software/index.html", section_page(
    "software/", 1, "Software — Oplo",
    "Oplo software is built for one person with taste, not a procurement department.",
    "Software", "Built for a person, not an org chart.",
    "Tools that assume a single user who cares how things work, and are willing to be judged on that.",
    [("dark", "apps", "Apps", "Fewer things, done properly.",
      "Most software grows by accumulation until no one can describe what it is for. We would rather ship a smaller set of things that hold together than a longer feature list that does not.",
      None),
     ("", "updates", "Updates", "Software that improves without asking for your evening.",
      "Updates should be small, frequent and uneventful. A machine that demands attention to stay current is a machine that has made its maintenance your job.",
      None),
     ("", "downloads", "Downloads", "Nothing to download yet.",
      "When there is software to install, it will be here, with its release notes and its checksums. Until then this page is honest about being empty.",
      [("Follow what ships", "newsroom/")])],
    ["Oplo software is in development. Availability, capability and system requirements are not final."])))

PAGES.append(("developers/index.html", section_page(
    "developers/", 1, "Developers — Oplo",
    "Documentation, SDKs and design resources for building on Oplo.",
    "Developers", "Build on Oplo.",
    "One set of tools across the hardware, the software and the models.",
    [("dark", "docs", "Documentation", "Not written yet.",
      "There is no API to document until there is an API. When there is, the reference goes here, and it will be the same document our own engineers work from.",
      None),
     ("", "sdks", "SDKs", "One surface, not one per platform.",
      "A developer should learn the platform once. Splitting an SDK per device is a tax on everyone who builds for us, and we would rather pay that cost internally.",
      None),
     ("", "design", "Design resources", "The system this site is built on.",
      "The type scale, colour and layout rules used across Oplo will be published here as a working design system rather than a PDF that goes stale.",
      None),
     ("", "support", "Developer support", "Talk to the people who built it.",
      "Until there is a forum worth having, developer questions reach us the same way everything else does.",
      [("Get in touch", "contact/")])],
    ["No developer programme is open yet. This page describes what is planned, not what is available."])))


# ==========================================================================
# Intelligence — the flagship page.
# Dark, long-form, and built so the page's argument is the thing you look at
# rather than something written beside a decoration. The only hard number on
# it is the speed of light, which is a fact about the universe rather than a
# claim about a product that does not exist yet.
# ==========================================================================

INTEL_CSS = '''<style>
  /* Black, space and type. No panels, no glass borders, no badges — a section
     is separated from the next by air, and the only rule on the page is a
     hairline where a list genuinely needs one. */

  .ipage .band { padding: clamp(96px, 15vh, 190px) 0; }
  .ipage .band.opening { padding-top: clamp(80px, 12vh, 150px); }
  .ipage .lede { max-width: 30ch; margin-inline: auto; }
  .ipage .kicker {
    font-family: var(--font); font-size: clamp(17px, 1.6vw, 21px);
    font-weight: 600; letter-spacing: .011em; color: var(--ink-lt-2);
    margin-bottom: 16px;
  }
  .ipage .stat { margin-top: clamp(56px, 8vw, 96px); }
  .ipage .stat b {
    display: block; font-family: var(--font); font-weight: 600;
    font-size: clamp(66px, 14vw, 168px); line-height: .92;
    letter-spacing: -.04em; color: var(--ink-lt);
  }
  .ipage .stat span {
    display: block; margin: 18px auto 0; max-width: 42ch;
    font-size: 14px; line-height: 1.5; color: var(--ink-lt-2);
  }

  /* The round trip. Two wires on black — no frame around them. */
  .trip { width: min(100%, 660px); margin: clamp(48px, 7vw, 80px) auto 0; }
  .lane { display: grid; grid-template-columns: 92px 1fr auto; align-items: center;
          gap: 20px; padding: 26px 0; }
  .lane + .lane { border-top: 1px solid rgba(255,255,255,.16); }
  .lane .who { font-size: 13px; color: var(--ink-lt-2); text-align: left; }
  .wire { position: relative; height: 1px; background: rgba(255,255,255,.24); }
  .dot { position: absolute; top: 50%; left: 0; width: 9px; height: 9px;
         margin: -4.5px 0 0 -4.5px; border-radius: 50%; background: #2997ff; }
  .lane.remote .dot { animation: trip 2.8s cubic-bezier(.5,0,.5,1) infinite; }
  .lane.local  .dot { animation: here 2.8s ease-in-out infinite; }
  @keyframes trip { 0% { left: 0 } 44% { left: 100% } 56% { left: 100% } 100% { left: 0 } }
  @keyframes here { 0%,100% { opacity: .3 } 10%,42% { opacity: 1 } }
  .lane .end { font-size: 13px; color: var(--ink-lt-2); text-align: right; min-width: 9ch; }

  /* Feature statements: a text grid, held apart by hairlines rather than boxes. */
  .feats { width: min(100%, 940px); margin: clamp(48px, 7vw, 84px) auto 0;
           display: grid; grid-template-columns: repeat(2, 1fr); gap: 0 clamp(40px, 6vw, 88px); }
  .feats > div { padding: 30px 0; border-top: 1px solid rgba(255,255,255,.16); text-align: left; }
  .feats h3 { font-family: var(--font); font-size: clamp(19px, 2vw, 24px); font-weight: 600;
              letter-spacing: -.01em; margin-bottom: 8px; }
  .feats p { font-size: 15px; line-height: 1.55; color: var(--ink-lt-2); max-width: 40ch; }

  /* Examples. Tabs are words, not pills; the request is the only thing with size. */
  .tabs { width: min(100%, 860px); margin: clamp(40px, 6vw, 72px) auto 0; }
  .tablist { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 30px; }
  .tablist button {
    padding: 6px 0 9px; font-size: 15px; color: var(--ink-lt-2);
    border-bottom: 1px solid transparent; transition: color .2s, border-color .2s;
  }
  .tablist button:hover { color: var(--ink-lt); }
  .tablist button[aria-selected="true"] { color: var(--ink-lt); border-bottom-color: var(--ink-lt); }
  .tabpanel { display: none; }
  .tabpanel.on { display: block; }
  @media (prefers-reduced-motion: no-preference) {
    .tabpanel.on { animation: panel .3s cubic-bezier(.32,.08,.24,1) both; }
    @keyframes panel { from { opacity: 0; transform: translateY(7px); } }
  }
  .ask q {
    display: block; quotes: none;
    margin: clamp(34px, 5vw, 54px) auto 0; max-width: 24ch;
    font-family: var(--font); font-size: clamp(26px, 3.6vw, 46px);
    line-height: 1.16; font-weight: 600; letter-spacing: -.018em; color: var(--ink-lt);
  }
  .ask .src { margin-top: 26px; font-size: 13px; color: var(--ink-lt-2); }
  .ask .src em { font-style: normal; color: #2997ff; }

  /* Three tiers as columns of text. */
  .tiers { width: min(100%, 960px); margin: clamp(48px, 7vw, 84px) auto 0;
           display: grid; grid-template-columns: repeat(3, 1fr); gap: 0 clamp(32px, 4vw, 60px); }
  .tiers > div { padding: 28px 0 0; border-top: 1px solid rgba(255,255,255,.16); text-align: left; }
  .tiers h3 { font-family: var(--font); font-size: 21px; font-weight: 600;
              letter-spacing: -.01em; margin-bottom: 9px; }
  .tiers p { font-size: 15px; line-height: 1.55; color: var(--ink-lt-2); }
  .tiers .terse { margin-top: 12px; font-size: 13px; color: var(--ink-lt-2); }

  /* Open problems: a plain index. */
  .rlist { width: min(100%, 880px); margin: clamp(44px, 6vw, 76px) auto 0; text-align: left; }
  .rrow { display: grid; grid-template-columns: 160px 1fr; gap: 24px;
          padding: 26px 0; border-top: 1px solid rgba(255,255,255,.16); }
  .rrow:last-child { border-bottom: 1px solid rgba(255,255,255,.16); }
  .rrow .cat { font-size: 13px; color: var(--ink-lt-2); }
  .rrow h3 { font-family: var(--font); font-size: clamp(19px, 2vw, 23px); font-weight: 600;
             letter-spacing: -.01em; margin-bottom: 7px; }
  .rrow p { font-size: 15px; line-height: 1.55; color: var(--ink-lt-2); max-width: 52ch; }

  @media (prefers-reduced-motion: reduce) {
    .lane .dot { animation: none; }
    .lane.remote .dot { left: 100%; }
  }
  @media (max-width: 734px) {
    .feats, .tiers { grid-template-columns: 1fr; gap: 0; }
    .rrow { grid-template-columns: 1fr; gap: 6px; }
    .lane { grid-template-columns: 76px 1fr; gap: 14px; }
    .lane .end { display: none; }
    .tablist { gap: 4px 20px; }
  }
</style>'''

HIGHLIGHTS = [
    ("Reasoning, locally", "Work a problem through with a model running on the machine in front of you" + mo(", with no request leaving it") + "."),
    ("Your own context", "Answers grounded in your mail, notes and files" + mo(" — read where they already are, not uploaded to be read") + "."),
    ("Voice", "Speech understood on the device" + mo(", so being understood does not cost you a recording") + "."),
    ("What is on screen", "Ask about whatever you are looking at, without a screenshot going anywhere."),
    ("Writing", "Draft and revise in your own voice, close enough to keep up with typing."),
    ("Actions", "Ask for something to be done across your apps" + mo(", and have it done rather than described") + "."),
]

TABS = [
    ("Write", "Reply to Sam, using the three pricing points from Tuesday's notes.", "Notes, Mail"),
    ("Plan", "What actually has to happen before Thursday, given what is already booked?", "Calendar"),
    ("Find", "The photo from the roof in Lisbon. It was raining, and it was evening.", "Photos"),
    ("Read", "What changed in this contract since the version they sent last month?", "Files"),
    ("Debug", "Why did the build get slower after Friday's commit?", "Projects"),
]

TIERS = [
    ("On device", "The model lives on the machine you are holding and answers without a network.",
     "Works offline. Nothing leaves. No cost per request."),
    ("On your desk", "A larger model where there is room for one, for work a handheld cannot hold.",
     "Longer context. Heavier reasoning. Still yours."),
    ("Asked first", "If a request genuinely cannot be answered locally, you are told before it goes" + mo(", and you can say no") + ".",
     "Explicit consent. Not retained. Declinable."),
]

OPEN_PROBLEMS = [
    ("Efficiency", "Capable models that fit in a pocket",
     "Compressing a model until it runs on a handheld is easy." + mo(" Doing it without hollowing out what made it worth running is the actual problem.")),
    ("Silicon", "Designing the chip around the model",
     "General-purpose parts force general-purpose software." + mo(" What changes when the silicon is shaped to the thing it has to run.")),
    ("Privacy", "Personal context without collection",
     "Grounding answers in someone's own material while ensuring that material never becomes a dataset, including ours."),
    ("Evaluation", "Usefulness, not benchmark scores",
     "A model that tops a leaderboard and irritates the person using it has failed." + mo(" The second measurement is the interesting one.")),
]

DEVICE_SVG = RACK_SVG = ""


def intelligence_page():
    depth = 1
    links = [("Overview", "#top"), ("In use", "#ask"), ("Speed", "#speed"),
             ("Where it runs", "#where"), ("Privacy", "#privacy"), ("Research", "#research")]
    out = head(depth, "Intelligence — Oplo",
               "Oplo Intelligence: a model that runs on your device rather than in a data centre.",
               "intelligence/", INTEL_CSS)
    out += nav(depth, "intelligence/")
    out += chapter(depth, "Intelligence", links, "intelligence/")
    out += '<main class="ipage" id="top">\n'

    out += '''<section class="band dark opening">
  <div class="well">
    <h1 class="t-mega balance reveal">Intelligence,<br class="br-wide">where you are.</h1>
    <p class="t-sub muted lede reveal d1">A model that runs on your device, knows your context, and keeps both to itself.</p>
    <p class="t-fine muted reveal d2" style="margin-top:26px">In development. Nothing described here has shipped.<sup>1</sup></p>
  </div>
</section>
'''

    feats = "".join(f"      <div><h3>{t}</h3><p>{d}</p></div>\n" for t, d in HIGHLIGHTS)
    out += f'''<section class="band dark" id="on-device">
  <div class="well">
    <p class="kicker reveal">What it is for</p>
    <h2 class="t-hero balance lede reveal">Six things a personal model should be good at.</h2>
    <div class="feats reveal d1">
{feats}    </div>
  </div>
</section>
'''

    btns = "".join(
        f'<button type="button" role="tab" id="tab-{i}" aria-controls="panel-{i}" '
        f'aria-selected="{"true" if i == 0 else "false"}">{n}</button>'
        for i, (n, _, _) in enumerate(TABS))
    panels = "".join(
        f'''      <div class="tabpanel{' on' if i == 0 else ''}" id="panel-{i}" role="tabpanel" aria-labelledby="tab-{i}">
        <div class="ask">
          <q>{p}</q>
          <p class="src">Reads {s} &nbsp;·&nbsp; <em>stays on the device</em></p>
        </div>
      </div>
''' for i, (n, p, s) in enumerate(TABS))
    out += f'''<section class="band dark" id="ask">
  <div class="well">
    <p class="kicker reveal">In use</p>
    <h2 class="t-hero balance lede reveal">What you would actually ask it.</h2>
    <div class="tabs reveal d1">
      <div class="tablist" role="tablist" aria-label="Example requests">{btns}</div>
{panels}    </div>
  </div>
</section>
'''

    out += '''<section class="band dark" id="speed">
  <div class="well">
    <p class="kicker reveal">Speed</p>
    <h2 class="t-hero balance lede reveal">The fastest network is no network.</h2>
    <div class="trip reveal d1 phone-hide">
      <div class="lane local">
        <span class="who">On device</span>
        <span class="wire"><span class="dot"></span></span>
        <span class="end">no trip</span>
      </div>
      <div class="lane remote">
        <span class="who">Round trip</span>
        <span class="wire"><span class="dot"></span></span>
        <span class="end">there and back</span>
      </div>
    </div>
    <p class="stat reveal d2">
      <b>186,000</b>
      <span>Miles per second.<span class="more"> The speed of light, and the ceiling on how fast any answer can return from somewhere else.</span><sup>2</sup></span>
    </p>
  </div>
</section>
'''

    tiers = "".join(f'      <div><h3>{n}</h3><p>{d}</p><p class="terse">{t}</p></div>\n'
                    for n, d, t in TIERS)
    out += f'''<section class="band dark" id="where">
  <div class="well">
    <p class="kicker reveal">Where it runs</p>
    <h2 class="t-hero balance lede reveal">One family. Three places it lives.</h2>
    <div class="tiers reveal d1">
{tiers}    </div>
  </div>
</section>
'''

    out += '''<section class="band dark" id="privacy">
  <div class="well">
    <p class="kicker reveal">Privacy</p>
    <h2 class="t-hero balance lede reveal">What never leaves cannot be collected.</h2>
    <div class="tiers reveal d1">
      <div><h3>Processed where you are</h3><p>Personal context is read on the device it already lives on.<span class="more"> Being understood should not require uploading yourself first.</span></p></div>
      <div><h3>Not kept, not trained on</h3><p>What you ask is not retained to improve a model.<span class="more"> If that ever needs an exception, it gets asked for.</span></p></div>
      <div><h3>Told before it leaves</h3><p>If something genuinely cannot be answered locally, you hear about it first<span class="more">, and you can decline</span>.</p></div>
    </div>
    <p class="cta-row reveal d2"><a class="cta" href="../privacy/">Read our position on privacy</a></p>
  </div>
</section>
'''

    rows = "".join(f'''      <div class="rrow">
        <div class="cat">{c}</div>
        <div><h3>{t}</h3><p>{d}</p></div>
      </div>
''' for c, t, d in OPEN_PROBLEMS)
    out += f'''<section class="band dark" id="research">
  <div class="well">
    <p class="kicker reveal">Research</p>
    <h2 class="t-hero balance lede reveal">The open problems.</h2>
    <p class="t-lead muted lede reveal d1" style="margin-top:18px">We have published nothing yet, so this is not a list of papers.<span class="more"> It is what we are stuck on.</span></p>
    <div class="rlist reveal d1">
{rows}    </div>
  </div>
</section>
'''

    out += '''<section class="band">
  <div class="well">
    <p class="kicker reveal" style="color:var(--ink-2)">Developers</p>
    <h2 class="t-hero balance lede reveal">Build on it.</h2>
    <p class="t-lead muted lede reveal d1" style="margin-top:18px">One surface across the hardware, the software and the models.<span class="more"> A model on the device means features that work offline and cost nothing per request.</span></p>
    <p class="cta-row reveal d2">
      <a class="cta" href="../developers/">Developer resources</a>
      <a class="cta" href="../contact/">Talk to us</a>
    </p>
  </div>
</section>
</main>
'''
    notes = [
        "Oplo Intelligence is in development. Everything described on this page is an intention "
        "rather than a shipping feature. Availability, capability and on-device performance are "
        "not final and will vary by device.",
        "Light travels 186,282 miles per second in a vacuum, and slower through glass fibre. The "
        "figure is the physical limit on a network round trip, not a measurement of an Oplo product.",
        "Example requests are illustrations of intended use, not recordings of a working system.",
        "The privacy commitments describe how Oplo intends to build. The binding document is the "
        "privacy policy, which is in preparation.",
    ]
    return ("intelligence/index.html", out + TABS_JS + footer(depth, notes))

TABS_JS = '''<script>
  (function () {
    var list = document.querySelector(".tablist");
    if (!list) return;
    var tabs = [].slice.call(list.querySelectorAll("button"));
    function show(i) {
      tabs.forEach(function (t, n) {
        t.setAttribute("aria-selected", String(n === i));
        var p = document.getElementById("panel-" + n);
        if (p) p.classList.toggle("on", n === i);
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { show(i); });
      t.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = (i + d + tabs.length) % tabs.length;
        tabs[n].focus(); show(n);
      });
    });
  })();
</script>
'''


PAGES.append(intelligence_page())


# ==========================================================================
# Sign in.
# Composed the way an account screen should be: one column, centred, almost
# nothing on it. Deliberately NOT a working credential form — Oplo has no
# accounts, and a live public page with a functioning-looking password box
# that authenticates nothing is the exact shape of a phishing page. People
# type real passwords into those. So: no password field exists at all, the
# form transmits nothing, and pressing continue says so plainly.
# ==========================================================================

SIGNIN_CSS = '''<style>
  .signin {
    min-height: calc(100vh - 44px); min-height: calc(100svh - 44px);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: clamp(48px, 9vh, 96px) var(--gutter) clamp(40px, 7vh, 72px);
    text-align: center;
  }
  .signin .mark { width: 40px; height: 38px; color: var(--ink); margin-bottom: clamp(26px, 4vh, 40px); }
  .signin h1 {
    font-family: var(--font); font-size: clamp(28px, 3.6vw, 40px); line-height: 1.1;
    font-weight: 600; letter-spacing: -.015em;
  }
  .signin .sub {
    margin: 14px auto 0; max-width: 34ch;
    font-size: 17px; line-height: 1.47; color: var(--ink-2);
  }

  /* Status, stated before the field rather than after it. */
  .signin .status {
    margin: clamp(26px, 4vh, 38px) auto 0; max-width: 40ch;
    padding: 13px 18px; border-radius: 12px;
    background: var(--canvas); color: var(--ink-2);
    font-size: 14px; line-height: 1.45;
  }
  .signin .status b { color: var(--ink); font-weight: 600; }

  .form { width: 100%; max-width: 340px; margin: clamp(24px, 3.6vh, 34px) auto 0; }

  /* One field, with the action inside its right edge. */
  .field { position: relative; }
  .field input {
    width: 100%; height: 56px;
    padding: 20px 54px 6px 16px;
    font: inherit; font-size: 17px; color: var(--ink);
    background: var(--paper);
    border: 1px solid var(--rule); border-radius: 12px;
    outline: none;
    transition: border-color .18s ease, box-shadow .18s ease;
    -webkit-appearance: none; appearance: none;
  }
  .field input:hover { border-color: #b8b8bf; }
  .field input:focus {
    border-color: #0071e3;
    box-shadow: 0 0 0 4px rgba(0,113,227,.16);
  }
  .field label {
    position: absolute; left: 17px; top: 50%; transform: translateY(-50%);
    transform-origin: left center; pointer-events: none;
    font-size: 17px; color: var(--ink-3);
    transition: transform .18s ease, color .18s ease;
  }
  .field input:focus + label,
  .field input:not(:placeholder-shown) + label {
    transform: translateY(-19px) scale(.72); color: var(--ink-2);
  }
  .field .go {
    position: absolute; right: 9px; top: 50%; transform: translateY(-50%);
    width: 34px; height: 34px; border-radius: 50%;
    display: grid; place-items: center;
    color: var(--ink-3);
    box-shadow: inset 0 0 0 1px var(--rule);
    transition: background .18s ease, color .18s ease, box-shadow .18s ease;
  }
  .field input:not(:placeholder-shown) ~ .go {
    background: #0071e3; color: #fff; box-shadow: none;
  }
  .field .go svg { width: 15px; height: 15px; }

  .keep {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    margin-top: 20px; font-size: 14px; color: var(--ink-2); cursor: pointer;
  }
  .keep input { width: 15px; height: 15px; accent-color: #0071e3; }

  /* Where the honest answer appears, in place, on submit. */
  .said {
    margin-top: 18px; font-size: 14px; line-height: 1.45; color: var(--ink);
    min-height: 1.45em;
  }
  .said a { color: var(--blue); }
  .said a:hover { text-decoration: underline; }

  .signin .after {
    margin-top: clamp(30px, 4.6vh, 44px); padding-top: clamp(24px, 3.4vh, 32px);
    border-top: 1px solid var(--rule);
    width: 100%; max-width: 340px;
    font-size: 14px; line-height: 1.5; color: var(--ink-2);
  }
  .signin .after a { color: var(--blue); }
  .signin .after a:hover { text-decoration: underline; }

  /* On a phone the account screen is the whole screen. The eight-column
     site footer under it is furniture from another page, so it goes and the
     legal bar stays — which is all an account screen has ever needed. */
  @media (max-width: 734px) {
    .signin {
      justify-content: flex-start;
      padding: clamp(30px, 6vh, 52px) var(--gutter) 28px;
      min-height: calc(100svh - 44px - 86px);
    }
    .signin .mark { width: 34px; height: 32px; margin-bottom: 22px; }
    .signin h1 { font-size: 27px; }
    .signin .sub { font-size: 16px; max-width: 28ch; }
    .signin .status { margin-top: 22px; padding: 12px 15px; font-size: 13.5px; }
    .form { margin-top: 22px; }
    .signin .after { margin-top: 26px; padding-top: 20px; font-size: 13px; }
    .foot-note, .foot-cols, .foot-rule { display: none; }
    .foot-bar { padding-top: 20px; border-top: 1px solid var(--rule); }
  }
</style>'''


def signin_page():
    depth = 1
    mark = (f'<svg class="mark" viewBox="{MARK_VB}" aria-hidden="true" focusable="false">'
            f'<g transform="translate({MARK_TR})"><path fill="currentColor" d="{MARK_D}"/></g></svg>')
    out = head(depth, "Sign in — Oplo", "Sign in to your Oplo account.", "sign-in/", SIGNIN_CSS)
    out += nav(depth, "sign-in/")
    out += f'''<main class="signin">
  {mark}
  <h1 class="balance">Sign in to Oplo</h1>
  <p class="sub">One account for your device, your software<span class="more">,</span> and the model that runs on it.</p>

  <p class="status"><b>Accounts aren&rsquo;t open yet.</b><span class="more"> This is the sign-in we are building.</span> Nothing you type here is sent anywhere or stored.</p>

  <form class="form" id="signinForm" novalidate autocomplete="off">
    <div class="field">
      <input id="oploid" name="oploid" type="email" placeholder=" "
             autocomplete="off" autocapitalize="none" spellcheck="false"
             aria-describedby="said">
      <label for="oploid">Email or Oplo&nbsp;ID</label>
      <button class="go" type="submit" aria-label="Continue">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 2.5 10.5 8 5 13.5"/>
        </svg>
      </button>
    </div>
    <label class="keep"><input type="checkbox" name="keep"> Keep me signed in</label>
    <p class="said" id="said" role="status" aria-live="polite"></p>
  </form>

  <p class="after">
    There is no password field on this page<span class="more">, and there will not be one until
    accounts actually work</span>. <a href="../newsroom/">Hear when accounts open.</a>
  </p>
</main>

<script>
  (function () {{
    var form = document.getElementById("signinForm");
    var said = document.getElementById("said");
    if (!form || !said) return;
    form.addEventListener("submit", function (e) {{
      // Nothing is transmitted. The page has no endpoint and never will
      // until there is a real account system behind it.
      e.preventDefault();
      said.innerHTML = 'Oplo accounts aren\\u2019t open yet, so there is nothing to sign in to. ' +
                       'Nothing was sent. <a href="../newsroom/">Hear when they open</a>.';
    }});
  }})();
</script>
'''
    out += footer(depth)
    return ("sign-in/index.html", out)



# ==========================================================================
# Oplo+ — the membership page, on the iCloud+ architecture: tier cards, a
# feature matrix, an FAQ, footnotes.
#
# Prices are deliberately not invented. This is a commerce page on a live
# domain; a number printed here reads as a commitment, and Oplo has not set
# one. Every price slot renders PRICE_AT_LAUNCH in the exact position and
# weight a figure will occupy, so dropping real numbers in is a one-line
# change to PRICING below and nothing about the layout moves.
# ==========================================================================

# ==========================================================================
# Oplo+ — told as scenes rather than listed as features.
#
# The membership only makes sense at the edges: the moment work outgrows a
# pocket, the moment a machine is lost, the moment someone wants your address
# before they will help you. So the page walks those moments in the second
# person and lets the tier tables come after, once you already know what they
# are for. Prices are still not invented — see PRICING.
# ==========================================================================

PRICE_AT_LAUNCH = "Priced at&nbsp;launch"

PRICING = [
    ("Oplo", "Free", "With every device",
     "The on-device model, encrypted sync for your essentials, and everything that makes the machine work.", False),
    ("Oplo+", PRICE_AT_LAUNCH, "For one person",
     "The larger model, room for a real library, and the privacy features that need somewhere to run.", True),
    ("Oplo+ Family", PRICE_AT_LAUNCH, "Up to six people",
     "Everything in Oplo+, shared across a household, with each person's material kept separate.", False),
]

# (band class, anchor, moment, scene line, body, what it needs)
SCENES = [
    ("dark", "handoff", "The handoff",
     "You start it on the train. You finish it at your desk, and it is already open.",
     "The draft, the tabs, the half-finished thought — carried between your own machines and encrypted "
     "before any of it leaves the one in your hand." + mo(" You do not send it to yourself. It is simply "
     "there."),
     "Encrypted sync"),
    ("", "toobig", "The job that will not fit",
     "A year of receipts, and one question about them.",
     "The model in your pocket handles the day. Some questions need more room than a pocket has — the "
     "whole year at once, held in mind while it works." + mo(" That is what the desk model is for, and it "
     "is the only reason most people will want this."),
     "Desk model"),
    ("dark", "lost", "The machine you lost",
     "The laptop goes in the river. Nothing else does.",
     "A complete restore point, encrypted on the device before it is stored, so what sits on our side is "
     "not readable by us." + mo(" The new machine wakes up as the old one, and the worst day of your week "
     "costs you an afternoon instead of a year."),
     "Device backup"),
    ("", "address", "The address you did not want to give",
     "They want your email before they will show you the price.",
     "Give them one that is not yours. It forwards to you until the day you decide it should not, and "
     "then it stops." + mo(" Without you changing the address that your friends use."),
     "Disposable addresses"),
    ("dark", "household", "The household",
     "Six people. One bill. Six libraries that never touch.",
     "Sharing what you pay for should not mean sharing what you keep." + mo(" Everyone in the house gets "
     "the whole membership and their own material, and nobody can see anybody else\u2019s."),
     "Family"),
]

MATRIX_HEAD = ["Oplo", "Oplo+", "Family"]
MATRIX = [
    ("Discounted deals", "Restaurants, spas, activities and travel at member rates.", ["—", "yes", "yes"]),
    ("On-device model", "The model that runs on the machine in your hand.", ["Standard", "Extended", "Extended"]),
    ("Desk model", "A larger model for work a handheld cannot hold.", ["—", "yes", "yes"]),
    ("Encrypted sync", "Your files and settings, carried between your own devices.", ["Essentials", "Full library", "Full library"]),
    ("Device backup", "A complete restore point, encrypted before it leaves.", ["—", "yes", "yes"]),
    ("Browsing relay", "Traffic routed so sites cannot build a profile from your address.", ["—", "yes", "yes"]),
    ("Disposable addresses", "Single-use email that forwards to you and can be cut off.", ["—", "yes", "yes"]),
    ("Household sharing", "One membership across the people you live with.", ["—", "—", "Six people"]),
    ("Direct support", "A person who works here, rather than a queue.", ["—", "yes", "yes"]),
]

FAQ = [
    ("What is Oplo+?",
     "A single membership covering the parts of Oplo that need somewhere to run or somewhere to live — the "
     "larger model, encrypted sync and backup, and the privacy features." + mo(" The device and its "
     "on-device model work without it.")),
    ("Do I need it for the AI to work?",
     "No. The on-device model is part of the machine, not part of the membership." + mo(" Oplo+ adds the "
     "larger model for work that will not fit on a handheld.")),
    ("What happens to my things if I stop paying?",
     "They stay yours. Anything held in sync remains downloadable, and nothing is deleted as a lever to "
     "make you resubscribe." + mo(" The exact window will be written into the terms before anyone is "
     "charged.")),
    ("Can a household share one membership?",
     "That is what the Family tier is for." + mo(" Each person keeps their own material; sharing the "
     "membership does not mean sharing a library.")),
    ("Is my data used to train models?",
     "No. That commitment does not change between tiers, and paying more does not buy more privacy." + mo(
     " The floor is the same for everyone.")),
    ("When can I subscribe?",
     "Not yet. Oplo has no shipping product for a membership to attach to." + mo(" This page describes "
     "what is being built.")),
]

PLUS_CSS = '''<style>
  /* Perks. Glyph, name, one line. No boxes, no rules — space does the
     separating, which is the whole point of the format. */
  .perks {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: clamp(38px, 4.6vw, 60px) clamp(26px, 3.4vw, 46px);
    width: min(100%, 1020px); margin: clamp(40px, 5.4vw, 66px) auto 0;
    text-align: left;
  }
  .perk svg { width: 25px; height: 25px; color: var(--ink); }
  .band.dark .perk svg { color: var(--ink-lt); }
  .perk h3 {
    font-family: var(--font); font-size: 17px; font-weight: 600;
    letter-spacing: -.01em; margin: 15px 0 5px;
  }
  .perk p { font-size: 15px; line-height: 1.5; color: var(--ink-2); }
  .band.dark .perk p { color: var(--ink-lt-2); }
  @media (max-width: 1068px) { .perks { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 833px)  { .perks { grid-template-columns: repeat(2, 1fr); } }
  /* Two columns all the way down: a glyph, a name and one line do not need
     the full width, and eight single-file rows is a scroll nobody finishes. */
  @media (max-width: 500px)  { .perks { gap: 28px 20px; } .perk h3 { font-size: 15px; margin: 11px 0 4px; }
                               .perk p { font-size: 13.5px; } .perk svg { width: 22px; height: 22px; } }
  /* Scenes. Each moment gets a whole band and the sentence gets the size —
     the scene is the illustration, since there is no photograph to carry it. */
  .scene { padding: clamp(88px, 14vh, 170px) 0; }
  .scene .moment {
    font-family: var(--font); font-size: clamp(15px, 1.5vw, 19px); font-weight: 600;
    letter-spacing: .011em; color: var(--ink-2); margin-bottom: 18px;
  }
  .scene.dark .moment { color: var(--ink-lt-2); }
  .scene q {
    display: block; quotes: none; max-width: 22ch; margin: 0 auto;
    font-family: var(--font); font-size: clamp(30px, 5vw, 62px); line-height: 1.1;
    font-weight: 600; letter-spacing: -.022em;
  }
  .scene .body {
    max-width: 46ch; margin: clamp(26px, 3.4vw, 38px) auto 0;
    font-size: clamp(16px, 1.5vw, 19px); line-height: 1.6; color: var(--ink-2);
  }
  .scene.dark .body { color: var(--ink-lt-2); }
  .scene .needs {
    display: inline-block; margin-top: 26px;
    font-size: 13px; color: var(--ink-2);
    padding-top: 14px; border-top: 1px solid var(--rule);
  }
  .scene.dark .needs { color: var(--ink-lt-2); border-top-color: rgba(255,255,255,.24); }

  /* The handoff, drawn: one piece of work crossing between two machines. */
  .cross { width: min(100%, 480px); margin: clamp(40px, 5vw, 62px) auto 0; }
  .cross .track { position: relative; height: 1px; background: rgba(255,255,255,.24); }
  .cross .pip {
    position: absolute; top: 50%; left: 0; width: 9px; height: 9px;
    margin: -4.5px 0 0 -4.5px; border-radius: 50%; background: #2997ff;
    animation: cross 3.4s cubic-bezier(.55,0,.45,1) infinite;
  }
  @keyframes cross { 0%,10% { left: 0 } 60%,100% { left: 100% } }
  .cross .ends {
    display: flex; justify-content: space-between; margin-top: 14px;
    font-size: 13px; color: var(--ink-lt-2);
  }
  @media (prefers-reduced-motion: reduce) { .cross .pip { animation: none; left: 100%; } }

  /* Tier cards. A pricing page is the one place discrete boxes are correct. */
  .tiers-price {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--gap);
    width: min(100%, 1020px); margin: clamp(36px, 5vw, 56px) auto 0;
  }
  .tier-card {
    display: flex; flex-direction: column; gap: 10px;
    padding: clamp(28px, 3vw, 38px) clamp(22px, 2.4vw, 30px);
    border: 1px solid var(--rule); border-radius: 18px;
    background: var(--paper); text-align: left;
  }
  .tier-card { transition: border-color .2s var(--ease); }
  .tier-card:hover { border-color: var(--ink-3); }
  .tier-card.lead { border-color: var(--ink); }
  .tier-card.lead:hover { border-color: var(--ink); }
  .tier-card .name { font-family: var(--font); font-size: 21px; font-weight: 600; letter-spacing: -.01em; }
  .tier-card .price {
    font-family: var(--font); font-size: clamp(26px, 2.8vw, 34px); font-weight: 600;
    line-height: 1.1; letter-spacing: -.02em; margin-top: 4px;
  }
  .tier-card .allow { font-size: 14px; color: var(--ink-2); }
  .tier-card .blurb { font-size: 15px; line-height: 1.5; color: var(--ink-2); flex: 1; margin-top: 6px; }
  .tier-card .act { margin-top: 18px; }
  @media (max-width: 833px) { .tiers-price { grid-template-columns: 1fr; } }

  .includes {
    width: min(100%, 700px); margin: clamp(26px, 3.4vw, 38px) auto 0;
    font-size: 15px; line-height: 1.55; color: var(--ink-2);
  }

  .compare-wrap { width: min(100%, 1020px); margin: clamp(34px, 4.6vw, 52px) auto 0; overflow-x: auto; }
  table.compare { width: 100%; min-width: 640px; border-collapse: collapse; text-align: left; }
  table.compare th, table.compare td {
    padding: 18px 14px; border-top: 1px solid var(--rule); vertical-align: top;
    font-size: 14px; line-height: 1.45;
  }
  table.compare thead th {
    border-top: 0; border-bottom: 1px solid var(--ink);
    font-family: var(--font); font-size: 15px; font-weight: 600; color: var(--ink);
  }
  table.compare thead th:first-child { font-weight: 400; color: var(--ink-2); }
  table.compare td.f b { display: block; font-weight: 600; font-size: 15px; margin-bottom: 3px; }
  table.compare td.f span { color: var(--ink-2); }
  table.compare td.v { text-align: center; white-space: nowrap; }
  table.compare td.v.no { color: var(--ink-3); }
  table.compare td.v .tick { display: inline-block; width: 15px; height: 15px; }

  .faq { width: min(100%, 760px); margin: clamp(30px, 4vw, 46px) auto 0; text-align: left; }
  .faq details { border-top: 1px solid var(--rule); }
  .faq details:last-child { border-bottom: 1px solid var(--rule); }
  .faq summary {
    display: flex; align-items: center; justify-content: space-between; gap: 18px;
    padding: 21px 2px; cursor: pointer; list-style: none;
    font-family: var(--font); font-size: clamp(17px, 1.8vw, 19px); font-weight: 600; letter-spacing: -.01em;
  }
  .faq summary::-webkit-details-marker { display: none; }
  .faq summary::after {
    content: ""; flex: none; width: 9px; height: 9px;
    border-right: 1.5px solid var(--ink-2); border-bottom: 1.5px solid var(--ink-2);
    transform: translateY(-3px) rotate(45deg); transition: transform .22s var(--ease);
  }
  .faq details[open] summary::after { transform: translateY(2px) rotate(225deg); }
  .faq .a { padding: 0 2px 22px; font-size: 16px; line-height: 1.6; color: var(--ink-2); max-width: 64ch; }
  .faq summary { transition: color .2s var(--ease); }
  .faq summary:hover { color: var(--blue); }
  .faq summary:hover::after { border-color: var(--blue); }
  @media (prefers-reduced-motion: no-preference) {
    .faq details[open] .a { animation: answer .28s cubic-bezier(.32,.08,.24,1) both; }
    @keyframes answer { from { opacity: 0; transform: translateY(-4px); } }
  }

  .plus-status {
    width: min(100%, 46ch); margin: clamp(22px, 3vw, 32px) auto 0;
    padding: 14px 20px; border-radius: 12px; background: var(--canvas);
    font-size: 14px; line-height: 1.5; color: var(--ink-2);
  }
  .plus-status b { color: var(--ink); font-weight: 600; }
</style>'''

TICK = ('<svg class="tick" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" '
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5 6.5 12 13 4.5"/></svg>')

CROSS = '''    <div class="cross reveal d1" aria-hidden="true">
      <div class="track"><span class="pip"></span></div>
      <div class="ends"><span>the train</span><span>your desk</span></div>
    </div>
'''


# Perk glyphs. 24x24, single stroke, no fill — they sit at text weight so the
# line under each one stays the thing you read.
ICONS = {
 "tag":   '<path d="M3 11.5V4a1 1 0 0 1 1-1h7.5L21 12.5 12.5 21z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
 "desk":  '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M9 20.5h6M12 16.5v4"/>',
 "sync":  '<path d="M3.5 12a8.5 8.5 0 0 1 14.5-6M20.5 12a8.5 8.5 0 0 1-14.5 6"/><path d="M18 2.5V6h-3.5M6 21.5V18h3.5"/>',
 "vault": '<path d="M12 2.8 20 6v6c0 5-3.4 7.9-8 9.2C7.4 19.9 4 17 4 12V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
 "relay": '<path d="M2.5 8h5l3 8h5"/><path d="M16.5 5.5 20.5 8l-4 2.5M16.5 13.5l4 2.5-4 2.5"/>',
 "mail":  '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M3.5 7.5 12 13.5 20.5 7.5"/>',
 "home":  '<circle cx="8.5" cy="9" r="3"/><circle cx="16.5" cy="10.5" r="2.4"/><path d="M2.5 19.5c.7-3.2 3-4.8 6-4.8s5.3 1.6 6 4.8M15 14.8c2.4.2 4.1 1.7 4.6 4.7"/>',
 "talk":  '<path d="M20.5 12.5c0 4-3.8 7-8.5 7a10 10 0 0 1-2.7-.35L4 21l1.3-3.6A6.6 6.6 0 0 1 3.5 12.5c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7z"/>',
}

# name, glyph, the single line under it
PERKS = [
    ("Discounted deals",   "tag",   "Restaurants, spas, activities, travel &mdash; for less.<sup>2</sup>"),
    ("The desk model",     "desk",  "A larger model for work a pocket cannot hold."),
    ("Encrypted sync",     "sync",  "Your things, carried between your own machines."),
    ("Device backup",      "vault", "A full restore point, encrypted before it leaves."),
    ("Browsing relay",     "relay", "Sites cannot build a profile from your address."),
    ("Disposable addresses","mail", "Hand one out. Cut it off whenever you like."),
    ("Household sharing",  "home",  "Up to six people, and six separate libraries."),
    ("Direct support",     "talk",  "A person who works here, not a queue."),
]

PERKS_CSS = '''
  /* Perks. Glyph, name, one line. No boxes, no rules — space does the
     separating, which is the whole point of the format. */
  .perks {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: clamp(38px, 4.6vw, 60px) clamp(26px, 3.4vw, 46px);
    width: min(100%, 1020px); margin: clamp(40px, 5.4vw, 66px) auto 0;
    text-align: left;
  }
  .perk svg { width: 25px; height: 25px; color: var(--ink); }
  .band.dark .perk svg { color: var(--ink-lt); }
  .perk h3 {
    font-family: var(--font); font-size: 17px; font-weight: 600;
    letter-spacing: -.01em; margin: 15px 0 5px;
  }
  .perk p { font-size: 15px; line-height: 1.5; color: var(--ink-2); }
  .band.dark .perk p { color: var(--ink-lt-2); }
  @media (max-width: 1068px) { .perks { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 833px)  { .perks { grid-template-columns: repeat(2, 1fr); } }
  /* Two columns all the way down: a glyph, a name and one line do not need
     the full width, and eight single-file rows is a scroll nobody finishes. */
  @media (max-width: 500px)  { .perks { gap: 28px 20px; } .perk h3 { font-size: 15px; margin: 11px 0 4px; }
                               .perk p { font-size: 13.5px; } .perk svg { width: 22px; height: 22px; } }
'''


def perks_block():
    cells = ""
    for name, glyph, line in PERKS:
        cells += f'''      <div class="perk">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[glyph]}</svg>
        <h3>{name}</h3>
        <p>{line}</p>
      </div>
'''
    return f'''<section class="band" id="perks">
  <div class="well">
    <p class="eyebrow reveal">Included</p>
    <h2 class="t-display balance reveal">Everything in one membership.</h2>
    <div class="perks reveal d1">
{cells}    </div>
  </div>
</section>
'''


def plus_page():
    depth = 1
    links = [("Overview", "#top"), ("Moments", "#handoff"), ("Included", "#perks"),
             ("Plans", "#plans"), ("Compare", "#compare", "phone-hide"), ("Questions", "#faq")]
    out = head(depth, "Oplo+ — Oplo",
               "Oplo+ is the membership for the moments your machine outgrows its own pocket.",
               "plus/", PLUS_CSS)
    out += nav(depth, "plus/")
    out += chapter(depth, "Oplo+", links, "plus/")
    out += '<main id="top">\n'

    out += '''<section class="band">
  <div class="well">
    <p class="eyebrow reveal">Oplo+</p>
    <h1 class="t-hero balance reveal" style="max-width:20ch;margin-inline:auto">Most of what you do fits in your pocket.</h1>
    <p class="t-sub muted balance reveal d1" style="margin-top:18px;max-width:32ch;margin-inline:auto">This is for the rest of it.</p>
    <p class="plus-status reveal d2"><b>Not available yet.</b> Oplo has no shipping product for a membership to attach to. Nothing here can be bought, and no price has been set.<sup>1</sup></p>
  </div>
</section>
'''

    for cls, ident, moment, line, body, needs in SCENES:
        band = f"band scene {cls}".strip()
        extra = CROSS if ident == "handoff" else ""
        out += f'''<section class="{band}" id="{ident}">
  <div class="well">
    <p class="moment reveal">{moment}</p>
    <q class="reveal">{line}</q>
{extra}    <p class="body balance reveal d1">{body}</p>
    <p><span class="needs reveal d2">{needs}</span></p>
  </div>
</section>
'''

    out += perks_block()

    cards = ""
    for name, price, allow, blurb, lead in PRICING:
        cards += f'''      <div class="tier-card{' lead' if lead else ''}">
        <span class="name">{name}</span>
        <span class="price">{price}</span>
        <span class="allow">{allow}</span>
        <p class="blurb">{blurb}</p>
        <p class="act"><a class="cta" href="../newsroom/">Hear when it opens</a></p>
      </div>
'''
    out += f'''<section class="band grey" id="plans">
  <div class="well">
    <p class="eyebrow reveal">Plans</p>
    <h2 class="t-display balance reveal">Three tiers. One of them free.</h2>
    <div class="tiers-price reveal d1">
{cards}    </div>
    <p class="includes reveal d2">
      Every tier, including the free one, gets the on-device model, encrypted sync for your essentials, and
      the same privacy floor. Paying more buys capability &mdash; it does not buy back something that was
      withheld.
    </p>
  </div>
</section>
'''

    head_cells = "".join(f'<th scope="col">{h}</th>' for h in MATRIX_HEAD)
    body_rows = ""
    for feat, desc, vals in MATRIX:
        cells = ""
        for v in vals:
            if v == "yes":
                cells += f'<td class="v">{TICK}<span class="sr">Included</span></td>'
            elif v == "—":
                cells += '<td class="v no">&mdash;<span class="sr">Not included</span></td>'
            else:
                cells += f'<td class="v">{v}</td>'
        body_rows += f'      <tr><td class="f"><b>{feat}</b><span>{desc}</span></td>{cells}</tr>\n'
    out += f'''<section class="band phone-hide" id="compare">
  <div class="well">
    <p class="eyebrow reveal">Compare</p>
    <h2 class="t-display balance reveal">What is in each tier.</h2>
    <div class="compare-wrap reveal d1">
      <table class="compare">
        <caption class="sr">Oplo+ tiers compared</caption>
        <thead><tr><th scope="col">Feature</th>{head_cells}</tr></thead>
        <tbody>
{body_rows}        </tbody>
      </table>
    </div>
  </div>
</section>
'''

    faq = "".join(f'''      <details>
        <summary>{q}</summary>
        <div class="a">{a}</div>
      </details>
''' for q, a in FAQ)
    out += f'''<section class="band grey" id="faq">
  <div class="well">
    <p class="eyebrow reveal">Questions</p>
    <h2 class="t-display balance reveal">Answers.</h2>
    <div class="faq reveal d1">
{faq}    </div>
    <p class="cta-row reveal d2"><a class="cta" href="../contact/">Ask us something else</a></p>
  </div>
</section>
</main>
'''
    notes = [
        "Oplo+ is not available. No price has been set, nothing on this page can be purchased, and the tiers "
        "describe what is planned rather than what exists.",
        "Discounted deals would be offered by third-party merchants, not by Oplo. Availability, pricing and "
        "the terms of any offer would be set by the merchant and vary by region.",
        "The scenes on this page illustrate what the membership is intended to do. They are written as "
        "examples, not as recordings of a working system.",
        "Feature descriptions state design intent. Capability, allowances and availability are not final.",
        "The commitment that personal material is not used to train models is the same at every tier, "
        "including the free one. See the privacy policy, which is in preparation.",
    ]
    return ("plus/index.html", out + footer(depth, notes))

PAGES.append(plus_page())


# ==========================================================================
# Oplo Edu.
# Content and structure supplied by Oplo — the mission, the fragmentation
# argument, the four pillars, the two audiences, the vision. Substance kept
# whole; register tuned to match the rest of the site, which is plainer than
# the source draft.
# ==========================================================================

PILLARS = [
    ("Institutional rigour",
     "Structured pathways and professional certifications built to the standards corporate training and "
     "academic credit actually have to meet." + mo(" Not a library of videos with a quiz at the end.")),
    ("Adaptive mastery",
     "Learners move at their own pace through skill trees, and nothing unlocks until the thing before it "
     "is genuinely understood." + mo(" Proficiency is the gate, not attendance.")),
    ("Expert mentorship, on demand",
     "When tracking sees someone stuck, it connects them to a vetted one-to-one tutor rather than letting "
     "them stall." + mo(" The automation knows its own limits.")),
    ("One workflow",
     "Assignments, progress, templates and grading from a single console" + mo(", so the administrative "
     "load stops being the price of running a course") + "."),
]

AUDIENCES = [
    ("K&#8209;12 and higher education",
     "Secure, LTI&#8209;compliant infrastructure that sits inside what a school already runs." + mo(" It "
     "takes administrative weight off teachers and gives students support at the hour they actually get "
     "stuck, which is rarely during the lesson.")),
    ("Enterprise and corporate training",
     "Scalable upskilling pathways with transparent skill&#8209;gap analytics for the people planning "
     "headcount" + mo(", and hands-on training backed by live coaching for the people doing the work") + "."),
]

EDU_CSS = '''<style>
  /* The fragmentation, shown: four things that do not touch, then one that
     does. Type-led, because the argument is about arrangement, not imagery. */
  .split { width: min(100%, 720px); margin: clamp(40px, 5.4vw, 64px) auto 0; }
  .split .four {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
  }
  .split .four span {
    padding: 18px 8px; font-size: 13px; line-height: 1.35;
    color: var(--ink-lt-2); text-align: center;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.22);
    border-radius: 10px;
  }
  .split .verdict {
    margin-top: 18px; font-size: 13px; color: var(--ink-lt-2);
  }
  .split .one {
    margin-top: 26px; padding: 22px 8px; border-radius: 10px;
    background: var(--ink-lt); color: #000;
    font-family: var(--font); font-size: 17px; font-weight: 600; letter-spacing: -.01em;
  }
  @media (max-width: 600px) {
    .split .four { grid-template-columns: repeat(2, 1fr); }
  }

  /* Pillars and audiences: text held apart by hairlines, no panels. */
  .pillars {
    width: min(100%, 940px); margin: clamp(40px, 5.4vw, 64px) auto 0;
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 0 clamp(36px, 5vw, 76px); text-align: left;
  }
  .pillars > div { padding: 30px 0; border-top: 1px solid var(--rule); }
  .pillars h3 {
    font-family: var(--font); font-size: clamp(19px, 2vw, 23px); font-weight: 600;
    letter-spacing: -.01em; margin-bottom: 8px;
  }
  .pillars p { font-size: 15px; line-height: 1.6; color: var(--ink-2); max-width: 42ch; }
  .band.dark .pillars > div { border-top-color: rgba(255,255,255,.2); }
  .band.dark .pillars p { color: var(--ink-lt-2); }
  @media (max-width: 734px) { .pillars { grid-template-columns: 1fr; gap: 0; } }

  .serve { width: min(100%, 900px); margin: clamp(38px, 5vw, 58px) auto 0;
           display: grid; gap: clamp(30px, 4vw, 46px); text-align: left; }
  .serve > div { padding-top: 28px; border-top: 1px solid var(--rule); }
  .serve h3 {
    font-family: var(--font); font-size: clamp(21px, 2.4vw, 28px); font-weight: 600;
    letter-spacing: -.014em; margin-bottom: 10px;
  }
  .serve p { font-size: clamp(16px, 1.5vw, 18px); line-height: 1.6; color: var(--ink-2); max-width: 58ch; }
</style>'''


def edu_page():
    depth = 1
    links = [("Overview", "#top"), ("The problem", "#problem"), ("The platform", "#platform"),
             ("Who it is for", "#who"), ("Vision", "#vision")]
    out = head(depth, "Oplo Edu",
               "Oplo Edu brings structured curriculum, adaptive practice, live expert coaching and classroom administration into one workspace.",
               "edu/", EDU_CSS)
    out += nav(depth, "edu/")
    out += chapter(depth, "Oplo Edu", links, "edu/", ("Try OEdu", "learn/"))
    out += '<main id="top">\n'

    out += '''<section class="band">
  <div class="well">
    <p class="eyebrow reveal">Oplo Edu</p>
    <h1 class="t-hero balance reveal" style="max-width:19ch;margin-inline:auto">Automated where it helps. Human where it counts.</h1>
    <p class="t-sub muted balance reveal d1" style="margin-top:18px;max-width:42ch;margin-inline:auto">Structured curriculum, practice that adapts, live experts, and the administration underneath &mdash; in one workspace.</p>
    <p class="cta-row reveal d2" style="margin-top:24px">
      <a class="cta" href="../learn/">Try OLearn</a>
      <a class="cta" href="learn/">How it works</a>
    </p>
    <p class="t-fine muted reveal d2" style="margin-top:20px">In development.<sup>1</sup></p>
  </div>
</section>
'''

    out += '''<section class="band dark scene" id="problem">
  <div class="well">
    <p class="moment reveal">The problem</p>
    <q class="reveal">One tool for the lecture. Another for the exercises. A third for homework. A fourth to find a tutor.</q>
    <div class="split reveal d1">
      <div class="four" aria-hidden="true">
        <span>Lectures</span><span>Practice</span><span>Assignments</span><span>Tutoring</span>
      </div>
      <p class="verdict">Four logins. Four sets of data. Nobody holding the whole picture of how a learner is actually doing.</p>
      <div class="one" aria-hidden="true">One workspace</div>
    </div>
    <p class="body balance reveal d1">The overhead lands on staff, the gaps land on learners, and completion rates fall for reasons no single system can see.<span class="more"> Fragmentation is not an inconvenience &mdash; it is the reason the numbers look the way they do.</span></p>
  </div>
</section>
'''

    pill = "".join(f"      <div><h3>{t}</h3><p>{d}</p></div>\n" for t, d in PILLARS)
    out += f'''<section class="band" id="platform">
  <div class="well">
    <p class="eyebrow reveal">The platform</p>
    <h2 class="t-display balance reveal" style="max-width:20ch;margin-inline:auto">Four things that usually live apart.</h2>
    <div class="pillars reveal d1">
{pill}    </div>
  </div>
</section>
'''

    serve = "".join(f"      <div><h3>{t}</h3><p>{d}</p></div>\n" for t, d in AUDIENCES)
    out += f'''<section class="band grey" id="who">
  <div class="well">
    <p class="eyebrow reveal">Who it is for</p>
    <h2 class="t-display balance reveal">Schools and organisations.</h2>
    <div class="serve reveal d1">
{serve}    </div>
  </div>
</section>
'''

    out += '''<section class="band dark scene" id="vision">
  <div class="well">
    <p class="moment reveal">Our vision</p>
    <q class="reveal">Technology should carry the load. Not the relationship.</q>
    <p class="body balance reveal d1"><span class="more">Every school and every organisation on the same infrastructure, with automation and human guidance each doing the part it is actually good at. </span>The machine handles the tracking, the marking and the scheduling. A person does the teaching.</p>
    <p class="cta-row reveal d2">
      <a class="cta" href="learn/">See Edu Learn</a>
      <a class="cta" href="../contact/">Talk to us</a>
    </p>
  </div>
</section>
</main>
'''
    notes = [
        "Oplo Edu is in development. Capabilities described on this page state design intent; availability, "
        "integrations and certification scope are not final.",
        "LTI compliance and any accreditation or certification claims will be stated specifically, with the "
        "standard and version named, before the platform is offered to an institution.",
    ]
    return ("edu/index.html", out + footer(depth, notes))


# ==========================================================================
# Oplo Edu — Learn. The online-school product page.
#
# The centrepiece is a wireframe of the lesson console, laid out from the
# reference: an icon rail, a stage spanning two columns, a roster beside it,
# and three tiles underneath. Kept deliberately as a wireframe rather than a
# fake screenshot — grey blocks read as "this is the layout", where invented
# screen content would read as "this exists", which it does not.
#
# The whole thing is sized in em off one clamped font-size, so it scales as a
# single object from 320px to desktop instead of relayouting.
# ==========================================================================

LEARN_CSS = '''<style>
  .console {
    /* One knob. Every measurement below is em, so the console scales whole. */
    font-size: clamp(4.4px, 1.16vw, 11px);
    width: min(100%, 1040px); margin: clamp(40px, 5.6vw, 72px) auto 0;
    display: grid;
    grid-template-columns: 3.4em repeat(3, 1fr);
    grid-template-rows: 21em 13em;
    gap: 1em;
    padding: 1.2em;
    border-radius: 2.2em;
    background: #141517;
    box-shadow: inset 0 0 0 .22em rgba(255,255,255,.5), 0 3em 6em -2em rgba(0,0,0,.8);
  }
  .console > div {
    background: #2b2c30; border-radius: 1.2em; padding: 1.1em;
    display: flex; flex-direction: column; gap: .8em; min-width: 0;
  }
  .console .cx-rail {
    grid-row: 1 / 3; align-items: center; gap: .7em; padding: 1.1em .6em;
    border-radius: 1.6em;
  }
  .console .cx-stage  { grid-column: 2 / 4; }
  .console .cx-roster { grid-column: 4; }

  /* Wireframe vocabulary: a bar, a dot, a field, a void. */
  .cx-bar  { height: 1.5em; border-radius: 1em; background: #c9cacd; }
  .cx-bar.cx-dim{ background: #4a4b50; }
  .cx-dot  { width: 1.9em; height: 1.9em; border-radius: 50%; background: #c9cacd; flex: none; }
  .cx-dot.cx-sm{ width: 1.2em; height: 1.2em; }
  .cx-dot.cx-dim{ background: #4a4b50; }
  .cx-void { flex: 1; border-radius: .8em; background: #1e1f22; min-height: 0; }
  .cx-row  { display: flex; align-items: center; gap: .7em; }
  .cx-row .cx-grow { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .45em; }
  .cx-stack { display: flex; flex-direction: column; gap: .55em; }

  .console .cx-rail .cx-dot { width: 1.6em; height: 1.6em; }
  .console .cx-rail .cx-key { width: 1.9em; height: 1.5em; border-radius: .5em; background: #4a4b50; }
  .console .cx-rail .cx-key.cx-on { background: #c9cacd; }

  .console .cx-tabs { display: flex; gap: .55em; margin-left: auto; }
  .console .cx-tabs span { width: 2.6em; height: 1.4em; border-radius: .8em; background: #c9cacd; }

  /* The selected row in the roster — the one lit element on the whole board. */
  .console .cx-pick { background: #c9cacd; border-radius: 1em; padding: .5em .7em; }
  .console .cx-pick .cx-dot { background: #6d6e73; }
  .console .cx-pick .cx-bar { background: #8e8f94; }

  .console .cx-field { height: 2.4em; border-radius: 1em; background: #c9cacd; }
  .console .cx-ctrls { display: flex; align-items: center; justify-content: center; gap: .7em; }
  .console .cx-ctrls .cx-big { width: 2.6em; height: 2.6em; border-radius: 50%; background: #c9cacd; }

  .cx-cap {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 10px 26px; width: min(100%, 900px); margin: 26px auto 0;
    font-size: 13px; line-height: 1.45; color: var(--ink-lt-2); text-align: left;
  }
  .cx-cap b { display: block; color: var(--ink-lt); font-weight: 600; font-size: 14px; margin-bottom: 2px; }
  @media (max-width: 734px) { .cx-cap { grid-template-columns: 1fr; gap: 12px; } }

  /* Four capability blocks, hairline-separated, no panels. */
  .cx-quad {
    width: min(100%, 940px); margin: clamp(40px, 5.4vw, 64px) auto 0;
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 0 clamp(36px, 5vw, 76px); text-align: left;
  }
  .cx-quad > div { padding: 30px 0; border-top: 1px solid var(--rule); }
  .band.dark .cx-quad > div { border-top-color: rgba(255,255,255,.2); }
  .cx-quad h3 {
    font-family: var(--font); font-size: clamp(19px, 2vw, 23px); font-weight: 600;
    letter-spacing: -.01em; margin-bottom: 8px;
  }
  .cx-quad p { font-size: 15px; line-height: 1.6; color: var(--ink-2); max-width: 42ch; }
  .band.dark .cx-quad p { color: var(--ink-lt-2); }
  @media (max-width: 734px) { .cx-quad { grid-template-columns: 1fr; gap: 0; } }
</style>'''

CONSOLE = '''    <div class="console reveal d1" role="img"
         aria-label="Wireframe of the Oplo Edu lesson console: an icon rail, a lesson stage, a class roster, and panels for coursework, mastery and tutors.">
      <div class="cx-rail">
        <span class="cx-dot"></span>
        <span class="cx-key cx-on"></span><span class="cx-key"></span><span class="cx-key"></span>
        <span class="cx-key"></span><span class="cx-key"></span><span class="cx-key"></span>
        <span style="flex:1"></span>
        <span class="cx-dot"></span>
      </div>

      <div class="cx-stage">
        <div class="cx-row">
          <span class="cx-bar" style="width:8em"></span>
          <span class="cx-tabs"><span></span><span></span><span></span><span></span></span>
        </div>
        <div class="cx-void"></div>
        <div class="cx-row">
          <span class="cx-bar" style="width:6em"></span>
          <span style="flex:1"></span>
          <span class="cx-dot s d"></span><span class="cx-dot s d"></span>
        </div>
      </div>

      <div class="cx-roster">
        <span class="cx-bar" style="width:5.5em"></span>
        <div class="cx-stack">
          <div class="cx-row"><span class="cx-dot"></span><span class="cx-grow"><span class="cx-bar" style="width:60%"></span><span class="cx-bar cx-dim" style="width:40%"></span></span><span class="cx-dot s d"></span></div>
          <div class="cx-row"><span class="cx-dot"></span><span class="cx-grow"><span class="cx-bar" style="width:52%"></span><span class="cx-bar cx-dim" style="width:34%"></span></span><span class="cx-dot s d"></span></div>
          <div class="cx-row cx-pick"><span class="cx-dot"></span><span class="cx-grow"><span class="cx-bar" style="width:72%"></span></span></div>
          <div class="cx-row"><span class="cx-dot"></span><span class="cx-grow"><span class="cx-bar" style="width:56%"></span><span class="cx-bar cx-dim" style="width:38%"></span></span><span class="cx-dot s d"></span></div>
        </div>
        <span style="flex:1"></span>
        <span class="cx-field"></span>
      </div>

      <div class="cx-tile">
        <span class="cx-bar" style="width:5em"></span>
        <div class="cx-void"></div>
        <div class="cx-row"><span class="cx-bar" style="width:6em"></span><span style="flex:1"></span><span class="cx-bar cx-dim" style="width:4em"></span></div>
      </div>

      <div class="cx-tile">
        <span class="cx-bar" style="width:5.5em"></span>
        <div class="cx-void"></div>
        <div class="cx-row" style="background:#3a3b40;border-radius:1em;padding:.45em .7em">
          <span class="cx-bar" style="width:4em"></span><span style="flex:1"></span><span class="cx-dot cx-sm"></span>
        </div>
        <span class="cx-field"></span>
      </div>

      <div class="cx-tile">
        <div class="cx-row"><span class="cx-bar" style="width:5em"></span><span style="flex:1"></span><span class="cx-dot cx-sm"></span></div>
        <div class="cx-void"></div>
        <div class="cx-ctrls">
          <span class="cx-dot cx-sm"></span><span class="cx-dot cx-sm"></span>
          <span class="cx-big"></span>
          <span class="cx-dot cx-sm"></span><span class="cx-dot cx-sm"></span>
        </div>
      </div>
    </div>
'''

QUAD = [
    ("The room",
     "A live lesson that opens in the browser with no install and no meeting id to paste. Video, a shared "
     "board, breakout groups and a hand to raise &mdash; and the teacher can see who has stopped following "
     "before anyone admits it."),
    ("Coursework",
     "Set work once and send it to a class, a group or one person. Submissions come back in one place, "
     "grading carries a rubric, and the marks land in the record without anyone retyping them."),
    ("Mastery",
     "Practice that adapts. Learners move through a skill tree at their own pace, and a topic stays shut "
     "until the one under it is genuinely understood &mdash; so a gap gets closed rather than carried."),
    ("A person, when it stops working",
     "When the tracking sees somebody stuck, it offers a vetted tutor for a live one-to-one rather than "
     "another video. Booked inside the lesson, in the same window, at the moment it would help."),
]


def learn_page():
    depth = 2
    links = [("Overview", "#top"), ("The console", "#console"), ("What it does", "#does"),
             ("For teachers", "#teachers")]
    out = head(depth, "Oplo Edu Learn — online school",
               "Oplo Edu Learn is a single console for online school: live lessons, coursework, adaptive practice and live tutoring.",
               "edu/learn/", LEARN_CSS)
    out += nav(depth, "edu/")
    out += chapter(depth, "Edu Learn", links, "edu/learn/", ("Try OEdu", "learn/"))
    out += '<main id="top">\n'

    out += f'''<section class="band dark" id="console">
  <div class="well">
    <p class="eyebrow reveal">Oplo Edu Learn</p>
    <h1 class="t-hero balance reveal" style="max-width:17ch;margin-inline:auto">School that was built to be online.</h1>
    <p class="t-sub muted balance reveal d1" style="margin-top:18px;max-width:40ch;margin-inline:auto">Not a video call bolted to a homework folder. One room where the lesson, the work and the help all live.</p>
{CONSOLE}
    <div class="cx-cap reveal d2">
      <div><b>The stage</b>Whoever is speaking, whatever is being shown, and the board everyone can draw on.</div>
      <div><b>The roster</b>Who is here, who is following, and who has quietly stopped.</div>
      <div><b>Underneath</b>Coursework, the mastery map, and a tutor a click away.</div>
    </div>
    <p class="cta-row reveal d2" style="margin-top:26px"><a class="cta" href="../../learn/">Open the working demo</a></p>
    <p class="t-fine muted reveal d2" style="margin-top:18px">Wireframe above; the demo is a running build with sample data. Neither is shipping software.<sup>1</sup></p>
  </div>
</section>
'''

    quad = "".join(f"      <div><h3>{t}</h3><p>{d}</p></div>\n" for t, d in QUAD)
    out += f'''<section class="band" id="does">
  <div class="well">
    <p class="eyebrow reveal">What it does</p>
    <h2 class="t-display balance reveal" style="max-width:19ch;margin-inline:auto">Four tools that stopped being four tabs.</h2>
    <div class="cx-quad reveal d1">
{quad}    </div>
  </div>
</section>
'''

    out += '''<section class="band dark scene" id="teachers">
  <div class="well">
    <p class="moment reveal">For teachers</p>
    <q class="reveal">The class is thirty. The attention is not.</q>
    <p class="body balance reveal d1">In a room you can read a face. On a call you get a grid of muted squares and a feeling. The console watches the things a screen hides &mdash; who has stopped answering, who is guessing, who has been on the same step for eleven minutes &mdash; and tells the one person who can do something about it.</p>
    <p class="cta-row reveal d2">
      <a class="cta" href="../../learn/">Try OLearn</a>
      <a class="cta" href="../../contact/">Talk to us</a>
    </p>
  </div>
</section>
</main>
'''
    notes = [
        "Oplo Edu Learn is in development. The console shown is a wireframe of the interface being designed, "
        "not a screenshot of working software. Capabilities described state design intent; availability and "
        "feature scope are not final.",
        "Live tutoring would connect learners with independent tutors. Vetting standards, availability and "
        "pricing will be published before the marketplace opens.",
    ]
    return ("edu/learn/index.html", out + footer(depth, notes))

PAGES.append(edu_page())
PAGES.append(learn_page())

# ----------------------------------------------------- Company & utility
def simple(slug, depth, title, desc, eyebrow, heading, lead, rows_html=""):
    out = head(depth, title, desc, slug) + nav(depth, slug) + "<main>\n"
    out += band("opening well", f'''  <p class="eyebrow reveal">{eyebrow}</p>
  <h1 class="t-hero balance reveal">{heading}</h1>
  <p class="t-sub muted balance reveal d1">{lead}</p>''')
    out += rows_html + "</main>\n" + footer(depth)
    return (slug + "index.html", out)

PAGES.append(simple("company/", 1, "About Oplo", "Oplo builds hardware, software and intelligence designed around the person using it.",
    "Company", "We are building for the person, not the fleet.",
    "Oplo makes hardware, software and intelligence as one system, on the view that a computer should belong to whoever is holding it.",
    '<div class="rows">\n' +
    row("dark", "what", "What we do", "Three things, treated as one.",
        "Hardware, software and intelligence are usually made by different companies with different incentives, and the person using the result absorbs the difference. We would rather own all three and be accountable for the whole.", None, 1) +
    row("", "where", "Where we are", "Early, and saying so.",
        "Oplo is building its first products. We would rather this site be honest about that than dressed up as a catalogue of things you cannot buy.",
        [("Open roles", "careers/"), ("Contact us", "contact/")], 1) +
    '</div>\n'))

PAGES.append(simple("newsroom/", 1, "Newsroom — Oplo", "Announcements and updates from Oplo.",
    "Newsroom", "Nothing announced yet.",
    "When there is something to say, it will be here, dated and attributable. For press enquiries, contact us directly.",
    '<div class="rows">\n' +
    row("", "press", "Press", "Talk to a person.",
        "Press and media enquiries reach us the same way everything else does, and get answered by someone who works here.",
        [("Contact Oplo", "contact/")], 1) + '</div>\n'))

PAGES.append(simple("careers/", 1, "Careers — Oplo", "Work at Oplo, building hardware, software and intelligence as one system.",
    "Careers", "Small team. Whole stack.",
    "Owning the hardware, the software and the models means the people here work across boundaries that most companies never cross.",
    '<div class="rows">\n' +
    row("dark", "roles", "Open roles", "No formal listings yet.",
        "We are not running a structured hiring process at this stage. If what we are building is the thing you want to work on, write to us and say what you would want to own.",
        [("Write to us", "contact/")], 1) + '</div>\n'))

PAGES.append(simple("contact/", 1, "Contact Oplo", "How to reach Oplo about products, press, careers or anything else.",
    "Contact", "Get in touch.",
    "Everything reaches the same place and is read by someone who works here.",
    '<div class="rows">\n' +
    row("", "general", "General and press", "One address, read by people.",
        'Product questions, press enquiries, partnerships and anything that does not fit a category: <a class="cta" href="mailto:hello@oplocloud.com">hello@oplocloud.com</a>', None, 1) +
    row("dark", "careers-contact", "Careers", "Tell us what you want to own.",
        'Rather than a form, write to us and describe the work you would want to do here: <a class="cta" href="mailto:careers@oplocloud.com">careers@oplocloud.com</a>', None, 1) +
    '</div>\n'))

PAGES.append(simple("support/", 1, "Support — Oplo", "Getting help with Oplo hardware, software and accounts.",
    "Support", "How to get help.",
    "There are no shipping products to support yet, so support is simply a person reading your message.",
    '<div class="rows">\n' +
    row("", "help", "Getting help", "Write to us directly.",
        'Until there is a product in your hands, anything you need reaches us at <a class="cta" href="mailto:hello@oplocloud.com">hello@oplocloud.com</a>.', None, 1) +
    row("dark", "developer-help", "Developers", "Building on Oplo.",
        "Developer questions are handled alongside everything else while the platform is still being built.",
        [("Developer resources", "developers/")], 1) + '</div>\n'))

PAGES.append(signin_page())


# ==========================================================================
# Investor Relations — a section of sibling pages sharing one sub-navigation,
# the way a corporate IR site is arranged rather than one page with anchors.
#
# Every fact here is Oplo's. There is no board, so no board is listed; there
# are no filings, so none are implied; documents carry their real status. An
# invented director is a false statement about a person and an invented filing
# a false statement about a regulator, so neither appears.
# ==========================================================================

IR_NAV = [
    ("Overview", ""),
    ("Leadership and Governance", "leadership/"),
    ("Filings", "filings/"),
    ("Our Values", "values/"),
    ("FAQ", "faq/"),
    ("Contact", "contact/"),
]

IR_DISCLAIMER = (
    "Oplo, Inc. is a private company. These pages are published for transparency, not as disclosure "
    "required of a public issuer. Nothing here is an offer to sell or a solicitation of an offer to buy "
    "any security, and nothing here is investment advice."
)


def ir_links(depth):
    """Sibling links, resolved for a page one or two levels deep."""
    up = "../" if depth == 2 else ""
    return [(label, (up + slug) if slug else (up or "./")) for label, slug in IR_NAV]


def ir_page(slug, depth, title, desc, active, body, notes=None):
    out = head(depth, title, desc, slug)
    out += nav(depth)
    # chapter() relativises its own home link, so this takes the root-relative
    # slug. Passing "../" here applied the offset twice and sent every depth-2
    # page's home link above the repo root.
    out += chapter(depth, "Investor Relations", ir_links(depth), "investor/")
    out += '<main id="top">\n' + body + "</main>\n"
    base = [IR_DISCLAIMER,
            "A document marked in preparation has not been written or reviewed. Nothing on these pages "
            "should be relied on as a governing instrument until it is published here as a document.",
            "Descriptions of products in development state intent. They are not commitments, and what "
            "ships may differ or may not ship."]
    return (slug + "index.html", out + footer(depth, (notes or []) + base))


# ------------------------------------------------------------------ Overview
_cards = "".join(
    f'''      <a class="index-card" href="{slug}"><b>{label}</b><span>{blurb}</span></a>\n'''
    for label, slug, blurb in [
        ("Leadership and Governance", "leadership/",
         "Who runs Oplo, the state of its board, and every governance document with its real status."),
        ("Filings", "filings/",
         "Oplo is private and has made no filings. What would appear here, and when."),
        ("Our Values", "values/",
         "The positions Oplo has published and can be held to."),
        ("FAQ", "faq/", "The questions investors actually ask, answered plainly."),
        ("Contact", "contact/", "Investor enquiries, and who reads them."),
    ])

PAGES.append(ir_page("investor/", 1, "Investor Relations — Oplo",
    "Oplo is a privately held company. Leadership, governance, filings and investor contact.",
    "", f'''<section class="band">
  <div class="well">
    <p class="eyebrow reveal">Investor Relations</p>
    <h1 class="t-hero balance reveal" style="max-width:16ch;margin-inline:auto">Who runs Oplo, and on what terms.</h1>
    <p class="notice reveal d1" style="margin-inline:auto;text-align:left">
      <b>Oplo is privately held.</b> There is no public listing, no ticker symbol, and no filings with the
      Securities and Exchange Commission. Nothing on these pages is an offer to sell or a solicitation of
      an offer to buy any security.<sup>1</sup>
    </p>
    <div class="index-cards reveal d1 phone-hide">
{_cards}    </div>
  </div>
</section>
'''))


# -------------------------------------------------- Leadership and Governance
_charters = "".join(f'      <li><span>{t}</span><em>{st}</em></li>\n' for t, st in [
    ("Audit Committee Charter", "On formation of the board"),
    ("Compensation Committee Charter", "On formation of the board"),
    ("Nominating and Governance Committee Charter", "On formation of the board"),
])
_docs = "".join(f'      <li><span>{t}</span><em>{st}</em></li>\n' for t, st in [
    ("Certificate of Incorporation", "Available on request"),
    ("Bylaws", "In preparation"),
    ("Code of Business Conduct", "In preparation"),
    ("Anti-Corruption Policy", "In preparation"),
    ("Related Party Transactions Policy", "In preparation"),
    ("Human Rights Policy", "In preparation"),
    ("Insider Trading Policy", "Not applicable while private"),
])

PAGES.append(ir_page("investor/leadership/", 2, "Leadership and Governance — Oplo",
    "Oplo's leadership, the state of its board, and its governance documents.",
    "leadership/", f'''<section class="band">
  <div class="well">
    <h1 class="t-hero balance reveal">Leadership and Governance</h1>
  </div>
</section>

<section class="band grey" id="executives">
  <div class="well">
    <p class="eyebrow reveal">Executive profiles</p>
    <h2 class="t-display balance reveal">The people accountable for it.</h2>
    <div class="people reveal d1">
      <div class="person">
        <span class="shot">
          <span class="mono" aria-hidden="true">SJ</span>
          <img src="../../assets/img/saswat-ji.jpg" alt="Saswat Ji" loading="lazy" onerror="this.remove()">
        </span>
        <b>Saswat Ji</b>
        <span>Founder</span>
        <p>Directs Oplo&rsquo;s hardware, software and intelligence work, and everything published under
           the Oplo name.</p>
      </div>
    </div>
    <p class="t-fine muted reveal d2" style="margin-top:30px;max-width:60ch">
      This list is short because it is accurate. It grows here as it grows in fact.
    </p>
  </div>
</section>

<section class="band" id="board">
  <div class="well">
    <p class="eyebrow reveal">Board of Directors</p>
    <h2 class="t-display balance reveal">Not yet constituted.</h2>
    <p class="t-lead muted balance reveal d1" style="max-width:56ch;margin:18px auto 0">
      Oplo has no board of directors. When one is formed, its members, their affiliations and the charters
      of its committees are published here before they take effect &mdash; not after.
    </p>
  </div>
</section>

<section class="band grey" id="charters">
  <div class="well">
    <p class="eyebrow reveal">Charters and policies</p>
    <h2 class="t-display balance reveal">Every document, with its real status.</h2>
    <p class="t-lead muted balance reveal d1" style="max-width:58ch;margin:18px auto 0">
      Listed with where each one actually stands rather than as links that go nowhere.<sup>2</sup>
    </p>
    <div class="docs reveal d1" style="text-align:left;max-width:640px;margin-inline:auto">
      <h3>Committee charters</h3>
      <ul>
{_charters}      </ul>
      <h3>Governance documents</h3>
      <ul>
{_docs}      </ul>
    </div>
  </div>
</section>
'''))


# ------------------------------------------------------------------- Filings
PAGES.append(ir_page("investor/filings/", 2, "Filings — Oplo",
    "Oplo is privately held and has made no filings with the SEC.",
    "filings/", '''<section class="band">
  <div class="well">
    <h1 class="t-hero balance reveal">Filings</h1>
    <p class="t-sub muted balance reveal d1" style="margin-top:16px;max-width:40ch;margin-inline:auto">
      There are none, and this page says so rather than showing an empty archive.
    </p>
  </div>
</section>

<section class="band grey">
  <div class="well">
    <p class="eyebrow reveal">Status</p>
    <h2 class="t-display balance reveal">Nothing has been filed.</h2>
    <p class="t-lead muted balance reveal d1" style="max-width:58ch;margin:18px auto 0">
      Oplo has issued no securities to the public, publishes no financial statements, and has made no
      filings with the Securities and Exchange Commission. A private company is not required to, and Oplo
      is not going to imply otherwise by leaving a search box here.
    </p>
    <p class="t-lead muted balance reveal d2" style="max-width:58ch;margin:16px auto 0">
      If that changes, filings appear on this page and the change is announced in the newsroom before it is
      described anywhere else on this site.
    </p>
    <p class="cta-row reveal d2"><a class="cta" href="../../newsroom/">Newsroom</a></p>
  </div>
</section>
'''))


# ---------------------------------------------------------------- Our Values
PAGES.append(ir_page("investor/values/", 2, "Our Values — Oplo",
    "The positions Oplo has published and can be held to.",
    "values/", '''<section class="band">
  <div class="well">
    <h1 class="t-hero balance reveal">Our Values</h1>
    <p class="t-sub muted balance reveal d1" style="margin-top:16px;max-width:44ch;margin-inline:auto">
      Positions Oplo has published elsewhere on this site, gathered here because an investor is entitled
      to see what the company has committed to.
    </p>
  </div>
</section>

<section class="band grey">
  <div class="well">
    <div class="pillars reveal d1" style="max-width:940px">
      <div><h3>Processing stays with the person</h3>
        <p>Oplo builds models that run on the device rather than in a data centre. That is a design
           decision first and a privacy one second, and it constrains what the company can build.</p></div>
      <div><h3>Personal material is not training data</h3>
        <p>What someone asks is not retained to improve a model. This does not vary by what they pay;
           the floor is the same on the free tier as the paid one.</p></div>
      <div><h3>Unshipped is said out loud</h3>
        <p>Every product page on this site states that what it describes is in development. Nothing is
           presented as shipping until it ships.</p></div>
      <div><h3>Documents carry their real status</h3>
        <p>A policy that has not been written is listed as not written. Governance is not implied by
           publishing a link.</p></div>
    </div>
    <p class="cta-row reveal d2" style="margin-top:34px">
      <a class="cta" href="../../privacy/">Our position on privacy</a>
      <a class="cta" href="../../company/">About Oplo</a>
    </p>
  </div>
</section>
'''))


# -------------------------------------------------------------------- FAQ
_faq = "".join(f'''      <details>
        <summary>{q}</summary>
        <div class="a">{a}</div>
      </details>
''' for q, a in [
    ("Is Oplo publicly traded?",
     "No. Oplo is privately held. There is no ticker symbol, no listing on any exchange, and no public "
     "market for its shares."),
    ("Can I invest in Oplo?",
     "There is no public offering. Enquiries about investment reach us at the address on the contact "
     "page and are answered by a person rather than a form."),
    ("Who runs the company?",
     "Saswat Ji, Founder. There is no board of directors yet; the leadership page says so directly and "
     "commits to publishing one before it takes effect."),
    ("What does Oplo make?",
     "Hardware, software, and AI models designed to run on the device rather than in a data centre. "
     "Everything is in development, and every product page on this site states as much."),
    ("When do products ship?",
     "No shipping date has been announced. When one is, it appears in the newsroom first."),
    ("Does Oplo publish financial statements?",
     "No. A private company is not required to, and Oplo does not."),
    ("Where do governance documents live?",
     "On the leadership and governance page, each listed with its real status &mdash; in preparation, "
     "available on request, or not applicable while private."),
])
PAGES.append(ir_page("investor/faq/", 2, "Investor FAQ — Oplo",
    "Common investor questions about Oplo, answered plainly.",
    "faq/", f'''<section class="band">
  <div class="well">
    <h1 class="t-hero balance reveal">Questions</h1>
    <p class="t-sub muted balance reveal d1" style="margin-top:16px;max-width:38ch;margin-inline:auto">
      Answered plainly, including the ones where the answer is no.
    </p>
    <div class="faq reveal d1">
{_faq}    </div>
    <p class="cta-row reveal d2"><a class="cta" href="../contact/">Ask something else</a></p>
  </div>
</section>
'''))


# ---------------------------------------------------------------- IR contact
PAGES.append(ir_page("investor/contact/", 2, "Investor Contact — Oplo",
    "How to reach Oplo about investment, governance or the company's structure.",
    "contact/", '''<section class="band">
  <div class="well">
    <h1 class="t-hero balance reveal">Contact</h1>
    <p class="t-sub muted balance reveal d1" style="margin-top:16px;max-width:44ch;margin-inline:auto">
      Investor enquiries reach a person who works here, because at this size there is nobody else for them
      to reach.
    </p>
  </div>
</section>

<section class="band grey">
  <div class="well">
    <div class="serve reveal d1" style="max-width:760px">
      <div><h3>Investment and structure</h3>
        <p>Questions about investment, ownership or how the company is organised:
           <a class="cta" href="mailto:investors@oplocloud.com">investors@oplocloud.com</a></p></div>
      <div><h3>Everything else</h3>
        <p>Product, press, partnerships and general enquiries go through the main contact page, which
           reaches the same people.</p>
        <p class="cta-row" style="justify-content:flex-start;margin-top:14px">
          <a class="cta" href="../../contact/">Contact Oplo</a></p></div>
    </div>
  </div>
</section>
'''))

# ----------------------------------------------------------- Legal pages
DRAFT = ('<p><strong>This document is being prepared.</strong> Oplo has no shipping product and '
         'collects no personal data through this website, so there is nothing yet for a policy to '
         'govern. A reviewed document will be published here before that changes. Nothing on this '
         'page should be relied on as a legal agreement in the meantime.</p>')

PAGES.append(("legal/privacy-policy/index.html", doc_page(
    "legal/privacy-policy/", 2, "Privacy Policy — Oplo", "Oplo's privacy policy.",
    "Privacy Policy", "In preparation",
    DRAFT + '''<h2>What this site collects</h2>
<p>This website has no analytics, no advertising trackers and no cookies of its own. It loads a
webfont from Google Fonts, which means your browser makes a request to that service in order to
render the page. Nothing else leaves your device on our behalf.</p>
<h2>If you write to us</h2>
<p>Email sent to an address on this site reaches Oplo and is kept only so we can reply. We do not
add correspondents to a mailing list.</p>
<h2>Our position</h2>
<p>The reasoning behind how we intend to treat personal data is set out on our
<a href="../../privacy/">privacy page</a>. That page describes intent; this one will carry the
binding commitment once there is a product for it to cover.</p>''')))

PAGES.append(("legal/terms/index.html", doc_page(
    "legal/terms/", 2, "Terms of Use — Oplo", "Terms of use for oplocloud.com.",
    "Terms of Use", "In preparation",
    DRAFT + '''<h2>This website</h2>
<p>oplocloud.com is an informational site describing what Oplo is building. It does not sell
anything, create an account for you, or form an agreement between us.</p>
<h2>Forward-looking descriptions</h2>
<p>Pages here describe products in development. Descriptions of capability, availability and
behaviour are statements of intent and may change.</p>
<h2>Trademarks</h2>
<p>The Oplo name and mark are the property of Oplo, Inc.</p>''')))

PAGES.append(("legal/index.html", doc_page(
    "legal/", 1, "Legal — Oplo", "Legal documents and notices for Oplo.",
    "Legal", "Documents and notices",
    '''<p>Oplo is early, and its legal documents are being prepared rather than copied from a
template. Each is published here when it has been reviewed.</p>
<h2>Documents</h2>
<ul>
  <li><a href="privacy-policy/">Privacy Policy</a> — in preparation</li>
  <li><a href="terms/">Terms of Use</a> — in preparation</li>
</ul>
<h2>Company</h2>
<p>Oplo, Inc. Correspondence reaches us at <a href="mailto:hello@oplocloud.com">hello@oplocloud.com</a>.</p>
<h2>Trademarks</h2>
<p>The Oplo name and mark are the property of Oplo, Inc. Other names may be trademarks of their
respective owners.</p>''')))

# ==================================================================== Privacy
# Structured the way Apple structures privacy: a section with its own bar
# rather than one page. Overview, then the features, the controls, the labels
# and the transparency report, with the binding policy sitting in /legal/.
#
# Apple's page can compare its products against someone else's because it has
# products. Oplo does not, so the comparison table is replaced by a commitment
# beside the thing it rules out — which can be checked later, and is the only
# honest version of the same idea.

PRIVACY_NAV = [
    ("Overview", ""),
    ("Features", "features/"),
    ("Control", "control/"),
    ("Labels", "labels/"),
    ("Transparency Report", "transparency/"),
]

PRIVACY_NOTE = (
    "These pages state how Oplo intends to build and what it has committed to. They are not the binding "
    "document; the privacy policy is, and it is in preparation. Where a protection is not built yet, it "
    "is labelled as such rather than described in the present tense."
)


def privacy_links(depth):
    """Sibling links, plus the policy, which lives with the other legal documents."""
    up = "../" if depth == 2 else ""
    ls = [(label, (up + slug) if slug else (up or "./")) for label, slug in PRIVACY_NAV]
    ls.append(("Privacy Policy", ("../" * depth) + "legal/privacy-policy/"))
    return ls


def privacy_page(slug, depth, title, desc, body, notes=None):
    out = head(depth, title, desc, slug)
    out += nav(depth, "privacy/")
    out += chapter(depth, "Privacy", privacy_links(depth), "privacy/")
    out += '<main id="top">\n' + body + "</main>\n"
    return (slug + "index.html", out + footer(depth, (notes or []) + [PRIVACY_NOTE]))


def pledge(rows):
    body = "".join(
        f'        <tr><td class="c">{c}</td><td class="r">{r}</td></tr>\n' for c, r in rows)
    return f'''    <div class="pledge reveal d1">
      <table>
        <thead><tr>
          <th scope="col">What Oplo has committed to</th>
          <th scope="col">What that rules out</th>
        </tr></thead>
        <tbody>
{body}        </tbody>
      </table>
    </div>
'''


def minds(rows):
    return '    <div class="minds reveal d1">\n' + "".join(
        f'      <div><b>{k}</b><span>{v}</span></div>\n' for k, v in rows) + "    </div>\n"


def protect(rows):
    return '    <div class="protect reveal d1">\n' + "".join(
        f'      <div><h3>{h}</h3><p>{p}<span class="when">{w}</span></p></div>\n'
        for h, p, w in rows) + "    </div>\n"


def register(groups, cls=""):
    out = (f'    <div class="docs{cls} reveal d1"'
           ' style="text-align:left;max-width:640px;margin-inline:auto">\n')
    for title, items in groups:
        out += f"      <h3>{title}</h3>\n      <ul>\n"
        out += "".join(f'        <li><span>{a}</span><em>{b}</em></li>\n' for a, b in items)
        out += "      </ul>\n"
    return out + "    </div>\n"


# ----------------------------------------------------------------- Overview
_p_cards = "".join(
    f'      <a class="index-card" href="{slug}"><b>{label}</b><span>{blurb}</span></a>\n'
    for label, slug, blurb in [
        ("Features", "features/",
         "The protections themselves, each labelled with whether it exists yet."),
        ("Control", "control/",
         "What a setting has to do before it counts as a control, and what you can ask us for."),
        ("Labels", "labels/",
         "The disclosure every Oplo app publishes before it ships, in one fixed format."),
        ("Transparency Report", "transparency/",
         "Requests from governments for your data. The number so far is zero."),
        ("Privacy Policy", "../legal/privacy-policy/",
         "The binding document. In preparation, and dated when it is published."),
    ])

PAGES.append(privacy_page("privacy/", 1, "Privacy — Oplo",
    "Oplo's position on personal data: personal computing only means something if the personal part stays private.",
    f'''<section class="band">
  <div class="well">
    <p class="eyebrow reveal">Privacy</p>
    <h1 class="t-hero balance reveal" style="max-width:13ch;margin-inline:auto">Yours stays yours.</h1>
    <p class="t-sub muted balance reveal d1" style="max-width:32ch;margin-inline:auto">
      Personal computing only means something if the personal part stays private.
    </p>
    <p class="notice reveal d1" style="margin-inline:auto;text-align:left">
      <b>Oplo has not shipped a product yet</b> &mdash; which is the reason to publish this now. A privacy
      position written before there is anything to collect is a constraint on what gets built. Written
      afterwards, it is a press release.<sup>1</sup>
    </p>
  </div>
</section>

<section class="band grey" id="commitments">
  <div class="well">
    <p class="eyebrow reveal">The commitments</p>
    <h2 class="t-display balance reveal">Every promise costs something.</h2>
    <p class="t-lead muted balance reveal d1" style="max-width:56ch;margin:18px auto 0">
      A privacy claim is only worth reading if it closes a door the company would otherwise like to keep
      open.<span class="more"> Here is each one, next to what it gives up.</span>
    </p>
{pledge([
    ("Intelligence runs on your device.",
     "No copy of your files, messages and requests sitting on our servers." + mo(" Nothing to mine, "
     "nothing to subpoena, nothing to leak.")),
    ("No advertising business, ever.",
     "The most reliable way to make money from a personal device is closed to us." + mo(" Everything Oplo "
     "earns has to come from selling the product.")),
    ("Your content is never training data.",
     "The cheapest source of training data on earth is off the table." + mo(" There is no opt-out to bury "
     "in settings, because there is nothing to opt out of.")),
    ("A feature collects what it needs and nothing adjacent.",
     "No data kept for a use we have not thought of yet." + mo(" When a feature is removed, what it held "
     "goes with it.")),
    ("Nothing leaves the device silently.",
     "No quiet upload you would have to read a changelog to find out about." + mo(" If a request has to "
     "travel, you are told while it happens, not afterwards in a policy.")),
    ("What we cannot read, we cannot hand over.",
     "No support tool that can open your library, and no way for us to be helpful to anyone who demands "
     "it." + mo(" Including you, if you lose the key.")),
])}  </div>
</section>

<section class="band dark" id="on-device">
  <div class="well">
    <p class="eyebrow reveal">On-device intelligence</p>
    <h2 class="t-display balance reveal">The model comes to your data.</h2>
    <p class="t-lead muted balance reveal d1" style="max-width:58ch;margin:18px auto 0">
      Every assistant faces the same problem: to be useful it has to see your life, and seeing your life
      normally means copying it somewhere else. Running the model on the hardware you own removes the
      second half of that sentence.
    </p>
{minds([
    ("On the device",
     "Everything a local model can answer, it answers locally &mdash; which is most of it." + mo(" Your "
     "files, messages and calendar are read where they already are.")),
    ("Off the device",
     "Only when a request genuinely exceeds what the hardware can do, and only the part that has to "
     "travel." + mo(" Said plainly at the moment it happens, with the option to stop.")),
    ("Never",
     "Retained after the answer, attached to your account, sold, or used to train the next model."),
])}    <p class="cta-row reveal d2"><a class="cta" href="../intelligence/">How Oplo intelligence works</a></p>
  </div>
</section>

<section class="band phone-hide" id="more">
  <div class="well">
    <p class="eyebrow reveal">Read further</p>
    <h2 class="t-display balance reveal">The rest of it.</h2>
    <div class="index-cards reveal d1">
{_p_cards}    </div>
  </div>
</section>
'''))


# ----------------------------------------------------------------- Features
PAGES.append(privacy_page("privacy/features/", 2, "Privacy Features — Oplo",
    "The protections Oplo is building, each labelled with whether it exists yet.",
    f'''<section class="band">
  <div class="well">
    <h1 class="t-hero balance reveal">Built in, not switched on.</h1>
    <p class="t-sub muted balance reveal d1" style="margin-top:16px;max-width:36ch;margin-inline:auto">
      A protection that depends on you finding it is not a protection.
    </p>
  </div>
</section>

<section class="band grey" id="protections">
  <div class="well">
    <p class="eyebrow reveal">Protections</p>
    <h2 class="t-display balance reveal">What each one actually does.</h2>
    <p class="t-lead muted balance reveal d1" style="max-width:56ch;margin:18px auto 0">
      Each is marked with where it really stands.<span class="more"> Most of Oplo is in development, and a
      page that wrote all of this in the present tense would be describing a company that does not exist
      yet.</span><sup>1</sup>
    </p>
{protect([
    ("On-device intelligence",
     "The model that reads your messages, files and calendar runs on your hardware." + mo(" It has access "
     "because the device is yours &mdash; not because it uploaded anything to earn it."),
     "In development"),
    ("Minimum collection",
     "A feature asks for what it needs to work and nothing next to it." + mo(" Location for the map, not "
     "location for everything else that happens to be running."),
     "A design rule from the start"),
    ("No silent departures",
     "When something has to leave the device, the interface says so as it happens" + mo(" and the request "
     "can be refused without the feature pretending to be broken") + ".",
     "In development"),
    ("No advertising profile",
     "Oplo has no ad business, so there is no profile to assemble" + mo(" and no commercial reason to keep "
     "what you did last week") + ".",
     "In effect now"),
    ("Ephemeral by default",
     "Requests are answered and dropped." + mo(" A history exists because you asked for one, and deleting "
     "it deletes it rather than hiding it."),
     "In development"),
    ("Your content is not training data",
     "What you write, store and say to Oplo is not used to train models" + mo(" &mdash; not anonymised, "
     "not aggregated, not sampled") + ".",
     "In effect now"),
    ("Sign in without spreading out",
     "One account used to reach your own things" + mo(", rather than an identity handed to every site that "
     "would like to know who you are") + ".",
     "In development"),
    ("Encrypted sync and backup",
     "Content encrypted on the device before it syncs, with the keys staying on your hardware." + mo(" It "
     "is the reason we would be unable to read it, not merely unwilling."),
     "In development, an Oplo+ capability"),
])}  </div>
</section>

<section class="band" id="missing">
  <div class="well">
    <p class="eyebrow reveal">Not here yet</p>
    <h2 class="t-display balance reveal">The parts we cannot claim.</h2>
    <p class="t-lead muted balance reveal d1" style="max-width:56ch;margin:18px auto 0">
      These are the things that turn a stated intention into something you can verify.<span class="more">
      None of them exists today, and listing them is the only way to be held to them.</span>
    </p>
{minds([
    ("Independent audit",
     "No third party has reviewed any of this." + mo(" When one has, the report is published here whole, "
     "not summarised.")),
    ("Published threat model",
     "What Oplo defends against, and what it does not, written down. Not written yet."),
    ("Security bounty",
     "No programme, so no way for a researcher to be paid for finding us wrong. In preparation."),
    ("Shipping code",
     "Nearly everything above is a design decision rather than a running system. Ship dates are not set."),
])}    <p class="cta-row reveal d2"><a class="cta" href="../control/">How control is meant to work</a></p>
  </div>
</section>
'''))


# ------------------------------------------------------------------ Control
PAGES.append(privacy_page("privacy/control/", 2, "Privacy Control — Oplo",
    "What a setting has to do before it counts as a control, and what you can ask Oplo for.",
    f'''<section class="band">
  <div class="well">
    <h1 class="t-hero balance reveal">The default should be the private one.</h1>
    <p class="t-sub muted balance reveal d1" style="margin-top:16px;max-width:40ch;margin-inline:auto">
      A setting that protects you only if you find it is not protection. It is paperwork.
    </p>
  </div>
</section>

<section class="band grey" id="test">
  <div class="well">
    <p class="eyebrow reveal">The test</p>
    <h2 class="t-display balance reveal">Four things, or it is not a control.</h2>
{minds([
    ("Private first",
     "The state you get before touching anything is the protective one." + mo(" Convenience is the thing "
     "you opt into, not the thing you have to opt out of.")),
    ("Reversible",
     "What can be turned on can be turned off, and off means stopped" + mo(" rather than paused until the "
     "next update decides otherwise") + "."),
    ("Findable",
     "One place, in the words a person would actually use to look for it." + mo(" Not nested three screens "
     "down under a heading nobody would think to open.")),
    ("Complete",
     "Withdrawing a permission withdraws what it collected." + mo(" Deleting something deletes the copy as "
     "well as the original.")),
])}  </div>
</section>

<section class="band" id="rights">
  <div class="well">
    <p class="eyebrow reveal">What you can ask for</p>
    <h2 class="t-display balance reveal">Requests we intend to answer.</h2>
    <p class="t-lead muted balance reveal d1" style="max-width:56ch;margin:18px auto 0">
      There is no product and no account holding your data today, so none of this can be exercised
      yet.<span class="more"> Each is listed with when it becomes real.</span><sup>1</sup>
    </p>
{register([
    ("Your data", [
        ("See everything held about you", "At launch"),
        ("Export a copy in a format another program can read", "At launch"),
        ("Correct what is wrong", "At launch"),
        ("Delete your account and everything in it", "At launch"),
    ]),
    ("Permissions", [
        ("Withdraw a permission you granted", "At launch"),
        ("Refuse a request that would leave the device", "At launch"),
        ("Turn off history without turning off the feature", "In development"),
    ]),
])}  </div>
</section>

<section class="band grey" id="ask">
  <div class="well">
    <p class="eyebrow reveal">Ask us</p>
    <h2 class="t-display balance reveal">A person reads it.</h2>
    <p class="t-lead muted balance reveal d1" style="max-width:52ch;margin:18px auto 0">
      <span class="more">Oplo is small enough that privacy questions reach the people who decide these
      things. </span>Write to <a href="mailto:hello@oplocloud.com">hello@oplocloud.com</a> and say what you
      want to know.
    </p>
    <p class="cta-row reveal d2">
      <a class="cta" href="../../legal/privacy-policy/">Read the privacy policy</a>
      <a class="cta" href="../labels/">See the label format</a>
    </p>
  </div>
</section>
'''))


# ------------------------------------------------------------------- Labels
PAGES.append(privacy_page("privacy/labels/", 2, "Privacy Labels — Oplo",
    "The disclosure every Oplo app publishes before it ships, in one fixed format.",
    f'''<section class="band">
  <div class="well">
    <h1 class="t-hero balance reveal">Every app says what it takes.</h1>
    <p class="t-sub muted balance reveal d1" style="margin-top:16px;max-width:40ch;margin-inline:auto">
      Before you install it, in the same four categories, in the same words.
    </p>
  </div>
</section>

<section class="band grey" id="format">
  <div class="well">
    <p class="eyebrow reveal">The format</p>
    <h2 class="t-display balance reveal">Four categories, no prose.</h2>
    <p class="t-lead muted balance reveal d1" style="max-width:56ch;margin:18px auto 0">
      A label is not a policy. It is a short, comparable answer to one question &mdash; what does this
      program take from me.<span class="more"> It reads the same way on every Oplo app, so the differences
      between them are visible at a glance.</span>
    </p>
{minds([
    ("Used to track you",
     "Data shared with other companies to follow you across their apps and sites." + mo(" Oplo has "
     "committed that this category is empty on every one of its apps.")),
    ("Linked to you",
     "Data tied to your account or device." + mo(" Named individually rather than as a category, and each "
     "one has to justify itself against a feature.")),
    ("Not linked to you",
     "Data collected without a route back to you." + mo(" Listed anyway, because a claim of anonymity is "
     "worth checking rather than trusting.")),
    ("Not collected",
     "The categories the app does not touch at all." + mo(" Stated explicitly, since an absence is the "
     "part a reader cannot otherwise confirm.")),
])}  </div>
</section>

<section class="band" id="register">
  <div class="well">
    <p class="eyebrow reveal">The register</p>
    <h2 class="t-display balance reveal">Nothing has shipped, so nothing is labelled.</h2>
    <p class="t-lead muted balance reveal d1" style="max-width:56ch;margin:18px auto 0">
      This page is published empty on purpose. The label goes up with the app, not after someone asks
      for it.<span class="more"> The only way to keep that rule visible is to leave the shelf here, where
      the absence can be seen.</span><sup>1</sup>
    </p>
{register([
    ("In development", [
        ("Oplo intelligence", "Label published at ship"),
        ("Oplo Edu", "Label published at ship"),
        ("Oplo Learn", "Label published at ship"),
        ("Oplo account and sign-in", "Label published at ship"),
    ]),
    ("This site", [
        ("oplocloud.com", "No account required, no advertising, no cross-site tracking"),
    ]),
])}  </div>
</section>
'''))


# ------------------------------------------------------- Transparency Report
PAGES.append(privacy_page("privacy/transparency/", 2, "Transparency Report — Oplo",
    "Requests from governments and law enforcement for Oplo user data. The number so far is zero.",
    f'''<section class="band">
  <div class="well">
    <p class="eyebrow reveal">Transparency Report</p>
    <h1 class="t-hero balance reveal" style="max-width:15ch;margin-inline:auto">Zero is a number worth publishing.</h1>
    <p class="t-sub muted balance reveal d1" style="max-width:38ch;margin-inline:auto">
      Oplo has received no request from any government for anyone&rsquo;s data.
    </p>
  </div>
</section>

<section class="band grey" id="figures">
  <div class="well">
    <p class="eyebrow reveal">Period covered</p>
    <h2 class="t-display balance reveal">Since incorporation, to date.</h2>
    <p class="t-lead muted balance reveal d1" style="max-width:56ch;margin:18px auto 0">
      Oplo has no users and holds no personal data, which is why every figure below is zero.<span
      class="more"> Publishing it now sets the baseline: the first report that is not zero can be read
      against this one.</span><sup>1</sup>
    </p>
{register([
    ("Requests received", [
        ("Government requests for account data", "0"),
        ("Government requests for device data", "0"),
        ("Emergency requests", "0"),
        ("National security requests", "0"),
        ("Requests to remove content", "0"),
        ("Preservation requests", "0"),
    ]),
    ("Responses", [
        ("Accounts affected", "0"),
        ("Requests where data was produced", "0"),
        ("People notified", "0 &mdash; none to notify"),
    ]),
], " counts")}  </div>
</section>

<section class="band" id="how">
  <div class="well">
    <p class="eyebrow reveal">How a request would be handled</p>
    <h2 class="t-display balance reveal">Written down before the first one arrives.</h2>
    <p class="t-lead muted balance reveal d1" style="max-width:56ch;margin:18px auto 0">
      Deciding this in advance is easy.<span class="more"> Deciding it while a demand is on the desk is
      not, which is the reason to do it now.</span>
    </p>
{minds([
    ("Require legal process",
     "A valid order for the specific data sought." + mo(" A request by letter, phone call or relationship "
     "is refused.")),
    ("Narrow it",
     "Produce the least that answers the order" + mo(", and challenge one that reaches further than the "
     "law lets it") + "."),
    ("Tell you",
     "The person is notified before anything is produced, unless a court has forbidden it" + mo(" &mdash; "
     "and then as soon as that expires") + "."),
    ("Hand over what exists",
     "Content encrypted with keys held on your device cannot be produced." + mo(" That is a property of "
     "the design, not a position we could be argued out of.")),
    ("Count it here",
     "Every request appears in the next report, including the ones refused."),
])}  </div>
</section>

<section class="band grey" id="cadence">
  <div class="well">
    <p class="eyebrow reveal">Cadence</p>
    <h2 class="t-display balance reveal">Twice a year, and on the day it changes.</h2>
    <p class="t-lead muted balance reveal d1" style="max-width:54ch;margin:18px auto 0">
      This report is updated every six months once Oplo has users.<span class="more"> If a request
      arrives before then, this page changes when the report on it can lawfully be published, rather than
      waiting for a schedule.</span>
    </p>
    <p class="cta-row reveal d2">
      <a class="cta" href="../">Back to privacy</a>
      <a class="cta" href="../../legal/privacy-policy/">Read the privacy policy</a>
    </p>
  </div>
</section>
'''))


# ------------------------------------------------------------------ Emit
if __name__ == "__main__":
    for path, content in PAGES:
        full = os.path.join(ROOT, path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        io.open(full, "w", encoding="utf-8").write(content)
        print(f"  wrote {path:44s} {len(content):>6,} bytes")
    print(f"\n{len(PAGES)} pages built")
