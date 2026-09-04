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
       ("Privacy", "privacy/"), ("Company", "company/"), ("Support", "support/")]

FOOTER = [
    ("Hardware", [("Overview", "hardware/"), ("Silicon", "hardware/#silicon"),
                  ("Devices", "hardware/#devices"), ("Accessories", "hardware/#accessories")]),
    ("Software", [("Overview", "software/"), ("Apps", "software/#apps"),
                  ("Updates", "software/#updates"), ("Downloads", "software/#downloads")]),
    ("Intelligence", [("Overview", "intelligence/"), ("On-device AI", "intelligence/#on-device"),
                      ("Privacy", "privacy/"), ("Research", "intelligence/#research")]),
    ("Developers", [("Documentation", "developers/#docs"), ("SDKs", "developers/#sdks"),
                    ("Design resources", "developers/#design"), ("Support", "developers/#support")]),
    ("Company", [("About Oplo", "company/"), ("Newsroom", "newsroom/"),
                 ("Careers", "careers/"), ("Contact", "contact/")]),
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
    <div class="nav-end"><a href="{rel(depth, "sign-in/")}">Sign in</a></div>
    <button class="nav-toggle" id="navToggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="navLinks">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>
'''


def chapter(depth, name, links, home):
    ls = "".join(f'<a href="{l[1]}">{l[0]}</a>' for l in links)
    return f'''<div class="chapter">
  <div class="chapter-in">
    <a class="chapter-name" href="{rel(depth, home)}">{name}</a>
    <nav class="chapter-links" aria-label="{name} sections">{ls}</nav>
  </div>
</div>
'''


def footer(depth, notes=None):
    note_html = ""
    if notes:
        note_html = "<div class=\"notes\"><ol>" + "".join(f"<li>{n}</li>" for n in notes) + "</ol></div>"
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

PAGES.append(("privacy/index.html", section_page(
    "privacy/", 1, "Privacy — Oplo",
    "Oplo's position on personal data: personal computing only means something if the personal part stays private.",
    "Privacy", "Yours stays yours.",
    "Personal computing only means something if the personal part stays private.",
    [("dark", "control", "Control", "The default should be the private one.",
      "A setting that protects you only if you find it is not protection, it is paperwork. What is private should be private before anyone touches a switch.",
      None),
     ("", "data", "Your data", "Kept where it is useful, which is with you.",
      "Running intelligence on the device rather than in a data centre means most of what you do never has to leave it. Where something does need to leave, we intend to say so plainly and let you decline.",
      [("How on-device models work", "intelligence/"), ("Read the privacy policy", "legal/privacy-policy/")])],
    ["This page describes Oplo's design position. The binding document is the privacy policy."])))

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
  .aurora {
    position: absolute; inset: -25%; z-index: 0; pointer-events: none;
    background:
      radial-gradient(38% 44% at 22% 30%, rgba(41,151,255,.34), transparent 62%),
      radial-gradient(34% 40% at 76% 24%, rgba(126,92,255,.26), transparent 62%),
      radial-gradient(44% 48% at 60% 78%, rgba(20,180,190,.20), transparent 64%);
    filter: blur(46px);
    animation: aurora 30s ease-in-out infinite alternate;
  }
  @keyframes aurora {
    from { transform: translate3d(-3%,-2%,0) scale(1.02); }
    to   { transform: translate3d(3%,3%,0)  scale(1.12); }
  }

  /* Status label. Every capability on this page carries one, because none of
     them have shipped and a page that hides that is a lie. */
  .chip {
    display: inline-block; align-self: flex-start;
    font-size: 11px; letter-spacing: .05em; text-transform: uppercase;
    padding: 4px 10px; border-radius: 100px; color: var(--ink-lt-2);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.24);
  }
  .band:not(.dark) .chip { color: var(--ink-2); box-shadow: inset 0 0 0 1px var(--rule); }

  /* Highlights gallery: a scroll-snapped rail, the way a feature tour reads
     on a phone without becoming a wall of stacked cards. */
  .gallery {
    display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory;
    scrollbar-width: none; -webkit-overflow-scrolling: touch;
    margin-top: 34px; padding: 4px max(var(--gutter), calc((100vw - 1000px) / 2)) 10px;
  }
  .gallery::-webkit-scrollbar { display: none; }
  .gcard {
    flex: none; width: min(80vw, 320px); scroll-snap-align: center;
    display: flex; flex-direction: column; gap: 9px;
    min-height: 306px; padding: 26px 24px 28px; border-radius: 20px;
    text-align: left;
    background: rgba(255,255,255,.055);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.10);
  }
  .gcard .gnum { font-size: 12px; letter-spacing: .06em; color: var(--ink-lt-2); }
  .gcard h3 { font-family: var(--font); font-size: 23px; font-weight: 600; letter-spacing: -.01em; }
  .gcard p { font-size: 14px; line-height: 1.5; color: var(--ink-lt-2); flex: 1; }

  /* The round trip: the page's argument, drawn. */
  .trip { width: min(100%, 720px); margin: 32px auto 0; display: grid; gap: 14px; }
  .lane {
    position: relative; display: flex; align-items: center; gap: 14px;
    padding: 0 18px; height: 76px; border-radius: 16px;
    background: rgba(255,255,255,.045);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.10);
  }
  .lane-tag {
    position: absolute; top: -9px; left: 18px; padding: 0 8px; background: #000;
    font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-lt-2);
  }
  .node { flex: none; display: grid; place-items: center; color: var(--ink-lt-2); }
  .node svg { width: 26px; height: 26px; }
  .node.far { opacity: .75; }
  .wire { position: relative; flex: 1; height: 2px; border-radius: 2px; background: rgba(255,255,255,.14); }
  .dot {
    position: absolute; top: 50%; left: 0; width: 11px; height: 11px;
    margin: -5.5px 0 0 -5.5px; border-radius: 50%; background: #2997ff;
    box-shadow: 0 0 16px 4px rgba(41,151,255,.65);
  }
  .lane.remote .dot { animation: trip 2.6s cubic-bezier(.5,0,.5,1) infinite; }
  .lane.local  .dot { animation: here 2.6s ease-in-out infinite; }
  @keyframes trip { 0% { left: 0 } 44% { left: 100% } 56% { left: 100% } 100% { left: 0 } }
  @keyframes here { 0%,100% { opacity: .35; transform: scale(.9) } 8%,40% { opacity: 1; transform: scale(1.15) } }
  .lane-note { flex: none; font-size: 12px; color: var(--ink-lt-2); min-width: 8ch; text-align: right; }

  .fact { display: block; margin: 32px auto 0; text-align: center; }
  .fact b {
    display: block; font-family: var(--font); font-weight: 600;
    font-size: clamp(52px, 11vw, 108px); line-height: 1; letter-spacing: -.03em; color: var(--ink-lt);
  }
  .fact span { display: block; margin-top: 12px; font-size: 14px; color: var(--ink-lt-2); }

  /* Three guarantees, stated so they can be checked rather than admired. */
  .guarantees {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
    width: min(100%, 940px); margin: 32px auto 0;
  }
  .guarantees div {
    padding: 26px 22px; border-radius: 16px; text-align: left;
    background: rgba(255,255,255,.05); box-shadow: inset 0 0 0 1px rgba(255,255,255,.09);
  }
  .guarantees h3 { font-family: var(--font); font-size: 17px; font-weight: 600; margin-bottom: 6px; }
  .guarantees p { font-size: 14px; line-height: 1.5; color: var(--ink-lt-2); }

  /* Open problems, listed the way a research index lists papers. */
  .rlist { width: min(100%, 940px); margin: 30px auto 0; text-align: left; }
  .rrow {
    display: grid; grid-template-columns: 168px 1fr; gap: 22px;
    padding: 22px 2px; border-top: 1px solid rgba(255,255,255,.15);
  }
  .rrow:last-child { border-bottom: 1px solid rgba(255,255,255,.15); }
  .rrow .cat { font-size: 12px; color: var(--ink-lt-2); padding-top: 4px; }
  .rrow h3 { font-family: var(--font); font-size: 19px; font-weight: 600; letter-spacing: -.01em; margin-bottom: 5px; }
  .rrow p { font-size: 14px; line-height: 1.5; color: var(--ink-lt-2); }

  @media (prefers-reduced-motion: reduce) {
    .aurora, .lane .dot { animation: none; }
    .lane.remote .dot { left: 50%; }
  }
  @media (max-width: 734px) {
    .lane { height: 68px; padding: 0 14px; gap: 10px; }
    .lane-note { display: none; }
    .guarantees { grid-template-columns: 1fr; }
    .rrow { grid-template-columns: 1fr; gap: 6px; }
    .gcard { min-height: 280px; }
  }
</style>'''

DEVICE_SVG = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" '
              'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
              '<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 5.6h3"/></svg>')
RACK_SVG = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            '<rect x="3" y="4" width="18" height="5" rx="1.5"/><rect x="3" y="11" width="18" height="5" rx="1.5"/>'
            '<rect x="3" y="18" width="18" height="3.4" rx="1.2"/><path d="M6.4 6.5h.01M6.4 13.5h.01"/></svg>')

HIGHLIGHTS = [
    ("Reasoning, locally", "Work through a problem with a model that runs on the machine in front of you, with no request leaving it."),
    ("Your context", "Answers grounded in your own mail, notes and files — read on the device, not uploaded to be read."),
    ("Voice", "Speech understood on the device, so being understood does not cost you a recording."),
    ("What's on screen", "Ask about whatever you are looking at, without shipping a screenshot to a server."),
    ("Writing", "Draft and revise in your own voice, with the model close enough to keep up with typing."),
    ("Actions", "Ask for something to be done across your apps, and have it done rather than described."),
]

OPEN_PROBLEMS = [
    ("Efficiency", "Capable models that fit in a pocket",
     "Compressing a model until it runs on a handheld device is easy. Doing it without hollowing out what made it worth running is the actual problem."),
    ("Silicon", "Designing the chip around the model",
     "General-purpose parts force general-purpose software. We are working on what changes when the silicon is shaped to the thing it has to run."),
    ("Privacy", "Personal context without collection",
     "Grounding answers in someone's own material, while ensuring that material never becomes a dataset — including ours."),
    ("Evaluation", "Measuring usefulness, not benchmark scores",
     "A model that tops a leaderboard and irritates the person using it has failed. We are more interested in the second measurement."),
]


def intelligence_page():
    depth = 1
    links = [("Highlights", "#highlights"), ("On device", "#on-device"), ("Speed", "#speed"),
             ("Privacy", "#privacy"), ("Research", "#research"), ("Build", "#build")]
    out = head(depth, "Intelligence — Oplo",
               "Oplo Intelligence: models that run on your device rather than in a data centre.",
               "intelligence/", INTEL_CSS)
    out += nav(depth, "intelligence/")
    out += chapter(depth, "Intelligence", links, "intelligence/")
    out += "<main>\n"

    out += '''<section class="band dark opening">
  <span class="aurora" aria-hidden="true"></span>
  <div class="well">
    <p class="eyebrow reveal">Oplo Intelligence</p>
    <h1 class="t-mega balance reveal">Intelligence,<br class="br-wide">where you are.</h1>
    <p class="t-sub muted balance reveal d1">A model that runs on your device, knows your context, and keeps both to itself.</p>
    <p class="t-fine muted reveal d2" style="margin-top:20px">In development. Nothing on this page has shipped.<sup>1</sup></p>
  </div>
</section>
'''

    cards = "".join(
        f'''    <article class="gcard" id="highlight-{i+1}">
      <span class="gnum">{i+1:02d}</span>
      <h3>{t}</h3>
      <p>{d}</p>
      <span class="chip">In development</span>
    </article>
''' for i, (t, d) in enumerate(HIGHLIGHTS))
    out += f'''<section class="band dark" id="highlights">
  <div class="well">
    <p class="eyebrow reveal">Highlights</p>
    <h2 class="t-hero balance reveal">What we are building it to do.</h2>
    <p class="t-lead muted balance reveal d1">Six things a personal model should be good at. Each is a statement of intent, and each is labelled as one.</p>
  </div>
  <div class="gallery reveal d1">
{cards}  </div>
</section>
'''

    out += '''<section class="band dark" id="on-device">
  <div class="well">
    <p class="eyebrow reveal">On device</p>
    <h2 class="t-hero balance reveal">Where the model runs<br class="br-wide">changes everything about it.</h2>
    <p class="t-lead muted balance reveal d1">Speed, privacy, and whether it works at all on a train are not three features. They are one decision, made once, about which building the thinking happens in.</p>
  </div>
</section>
'''

    out += f'''<section class="band dark" id="speed">
  <div class="well">
    <p class="eyebrow reveal">Speed</p>
    <h2 class="t-hero balance reveal">The fastest network<br class="br-wide">is no network.</h2>
    <p class="t-lead muted balance reveal d1">A question sent to a data centre has to physically get there and back before the answer can begin. That trip has a floor set by physics, not by engineering.</p>
    <div class="trip reveal d1">
      <div class="lane local">
        <span class="lane-tag">On device</span>
        <span class="node">{DEVICE_SVG}</span>
        <span class="wire"><span class="dot"></span></span>
        <span class="lane-note">no trip</span>
      </div>
      <div class="lane remote">
        <span class="lane-tag">Round trip</span>
        <span class="node">{DEVICE_SVG}</span>
        <span class="wire"><span class="dot"></span></span>
        <span class="node far">{RACK_SVG}</span>
        <span class="lane-note">there and back</span>
      </div>
    </div>
    <p class="fact reveal d2">
      <b>186,000</b>
      <span>miles per second — the speed of light, and the hard ceiling on how fast any answer can return from somewhere else.<sup>2</sup></span>
    </p>
  </div>
</section>
'''

    out += '''<section class="band dark" id="privacy">
  <span class="bloom" aria-hidden="true"></span>
  <div class="well">
    <p class="eyebrow reveal">Privacy</p>
    <h2 class="t-hero balance reveal">What never leaves<br class="br-wide">cannot be collected.</h2>
    <p class="t-lead muted balance reveal d1">Running locally settles the privacy question as a side effect of settling the speed one. These are the three commitments that follow, written so you can hold us to them.</p>
    <div class="guarantees reveal d1">
      <div><h3>Processed on your device</h3><p>Personal context is read where it already lives. Being understood should not require uploading yourself first.</p></div>
      <div><h3>Not kept, not trained on</h3><p>What you ask is not retained to improve a model. If that ever needs an exception, it will be asked for, not assumed.</p></div>
      <div><h3>Told when it leaves</h3><p>If a request genuinely cannot be answered on the device, you will be told before it goes anywhere — and able to decline.</p></div>
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
    <p class="eyebrow reveal">Research</p>
    <h2 class="t-hero balance reveal">The open problems.</h2>
    <p class="t-lead muted balance reveal d1">We have published nothing yet, so this is not a list of papers. It is what we are actually stuck on, which is the more useful thing to say.</p>
    <div class="rlist reveal d1">
{rows}    </div>
  </div>
</section>
'''

    out += '''<section class="band" id="build">
  <div class="well">
    <p class="eyebrow reveal">Developers</p>
    <h2 class="t-hero balance reveal">Build on it.</h2>
    <p class="t-lead muted balance reveal d1">One surface across the hardware, the software and the models — learned once, rather than once per device. A model that runs on the device means features that work offline and cost nothing per request.</p>
    <p class="cta-row reveal d2">
      <a class="cta" href="../developers/">Developer resources</a>
      <a class="cta" href="../contact/">Talk to us</a>
    </p>
  </div>
</section>
</main>
'''
    notes = [
        "Oplo Intelligence is in development. Every capability described on this page is an "
        "intention rather than a shipping feature, and each is labelled as such. Availability, "
        "capability and on-device performance are not final and will vary by device.",
        "Light travels 186,282 miles per second in a vacuum, and slower through glass fibre. The "
        "figure is quoted as the physical limit on a network round trip, not as a measurement of "
        "any Oplo product.",
        "The privacy commitments describe how Oplo intends to build. The binding document is the "
        "privacy policy, which is in preparation.",
    ]
    return ("intelligence/index.html", out + footer(depth, notes))

PAGES.append(intelligence_page())

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

PAGES.append(simple("sign-in/", 1, "Sign in — Oplo", "Oplo accounts are not open yet.",
    "Account", "Accounts aren't open yet.",
    "There is no Oplo account to sign in to at this stage. When accounts open, this is where you will do it.",
    '<div class="rows">\n' +
    row("", "when", "In the meantime", "Nothing is being collected.",
        "We are not running a waitlist or gathering addresses on this page. When there is something to sign in to, we will say so plainly.",
        [("What we're building", "company/")], 1) + '</div>\n'))

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

# ------------------------------------------------------------------ Emit
if __name__ == "__main__":
    for path, content in PAGES:
        full = os.path.join(ROOT, path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        io.open(full, "w", encoding="utf-8").write(content)
        print(f"  wrote {path:44s} {len(content):>6,} bytes")
    print(f"\n{len(PAGES)} pages built")
