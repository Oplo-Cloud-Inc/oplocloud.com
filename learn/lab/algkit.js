/* ==========================================================================
   Algebra I — the concept builder.

   Every lesson in Algebra I names one idea. Reading the name is passive; this
   makes it something the student builds. A sentence or a formula is shown
   with gaps, and a tray of pieces (words or maths) sits under it. Drag a
   piece into a gap, or tap it and it drops into the next empty one; tap a
   filled gap to take its piece back. Check marks the wrong pieces and says
   why, and a finished build lights up as a concept card.

   Each unit's page then shows the concepts built so far, one card per
   lesson, so the unit is something the student assembles, not only reads.
   Nothing is locked: a card not yet built opens its lesson.

     step: { type: "build", name: "Solution of a system",
             frame: "A pair that makes [[every]] equation true. On a graph: where the lines [[cross]].",
             chips: ["one", "meet"],            extra pieces that don't belong
             fb: { "one": "One isn't enough: ..." }   a reply for a wrong piece
             hints, why }
     A gap is [[answer]]; [[a|b]] accepts either. Text and pieces may hold $maths$.
     In LAB.addConcepts, keep: true builds after the lesson's "Name it" card
     instead of replacing it.

   Loaded only for Algebra I, after the manipulatives (lab/core.js COURSE_KIT).
   ========================================================================== */
(function () {
  "use strict";
  var LAB = window.OPLO_LAB, CH = window.OPLO_CHALLENGE;
  if (!LAB || !CH || CH.kinds.build) return;
  var el = LAB.el, fmt = LAB.fmt, esc = LAB.esc;

  var CSS = [
    ".ab-build{display:grid;gap:18px}",
    ".ab-card{position:relative;padding:20px 24px 22px;border-radius:18px;background:var(--paper);box-shadow:inset 0 0 0 1px var(--rule);font-size:20px;line-height:2.15;color:var(--ink);transition:box-shadow .35s var(--ease,ease),transform .35s var(--ease,ease)}",
    ".ab-name{display:flex;align-items:center;gap:8px;margin:0 0 6px;font-size:12px;line-height:1.4;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}",
    ".ab-name i{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--sunk,rgba(127,127,127,.15));font-style:normal;font-size:12px}",
    ".ab-gap{display:inline-flex;align-items:center;justify-content:center;min-width:4.4em;min-height:1.8em;margin:0 .12em;padding:0 .6em;border-radius:10px;border:1.5px dashed var(--ink-3);background:transparent;color:var(--ink);font:inherit;font-size:.92em;line-height:1.5;vertical-align:baseline;cursor:pointer;transition:background-color .2s,border-color .2s,box-shadow .2s,transform .2s}",
    ".ab-gap:hover{border-color:var(--ink-2)}",
    ".ab-gap.sel,.ab-gap.over{border-color:var(--blue);box-shadow:0 0 0 3px rgba(10,132,255,.25)}",
    ".ab-gap.full{border-style:solid;border-color:transparent;background:rgba(10,132,255,.14)}",
    ".ab-gap.no{border-color:var(--red,#ff453a);background:rgba(255,69,58,.14);animation:ab-shake .38s}",
    ".ab-tray{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;min-height:46px}",
    ".ab-chip{padding:8px 16px;border:0;border-radius:12px;background:var(--paper);box-shadow:inset 0 0 0 1px var(--rule),0 1px 2px rgba(0,0,0,.12);color:var(--ink);font:inherit;font-size:18px;line-height:1.4;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;transition:transform .15s,box-shadow .15s,opacity .2s}",
    ".ab-chip:hover{transform:translateY(-2px);box-shadow:inset 0 0 0 1px var(--ink-3),0 4px 10px rgba(0,0,0,.16)}",
    ".ab-chip.used{display:none}",
    ".ab-chip.lift{opacity:.35}",
    ".ab-ghost{position:fixed;z-index:9999;pointer-events:none;padding:8px 16px;border-radius:12px;background:var(--paper);color:var(--ink);font-size:18px;line-height:1.4;box-shadow:0 12px 30px rgba(0,0,0,.35),inset 0 0 0 1.5px var(--blue);transform:translate(-50%,-60%) rotate(-2deg)}",
    ".ab-build.built .ab-card{box-shadow:inset 0 0 0 2px var(--green),0 12px 34px rgba(48,209,88,.16);transform:translateY(-2px)}",
    ".ab-build.built .ab-gap{border-style:solid;border-color:transparent;background:rgba(48,209,88,.16);cursor:default}",
    ".ab-build.built .ab-name{color:var(--green)}",
    ".ab-build.built .ab-name i{background:var(--green);color:#fff}",
    ".ab-build.built .ab-tray{display:none}",
    "@keyframes ab-shake{20%{transform:translateX(-4px)}40%{transform:translateX(4px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}",
    "@keyframes ab-pop{0%{transform:scale(.96)}60%{transform:scale(1.02)}100%{transform:scale(1)}}",
    ".ab-build.built .ab-card{animation:ab-pop .45s var(--ease,ease)}",
    "@media (prefers-reduced-motion:reduce){.ab-gap.no,.ab-build.built .ab-card{animation:none}.ab-card,.ab-chip{transition:none}}",
    /* The unit page: concepts built so far. */
    ".ab-binder{margin:28px 0 8px}",
    ".ab-binder h2{display:flex;align-items:baseline;gap:10px;margin:0 0 4px;font-size:21px}",
    ".ab-binder h2 span{font-size:14px;font-weight:500;color:var(--ink-3)}",
    ".ab-binder>p{margin:0 0 14px;color:var(--ink-2);font-size:14px}",
    ".ab-bar{height:6px;border-radius:3px;background:var(--sunk,rgba(127,127,127,.18));overflow:hidden;margin:0 0 16px}",
    ".ab-bar i{display:block;height:100%;border-radius:3px;background:var(--green);transition:width .6s var(--ease,ease)}",
    ".ab-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}",
    ".ab-mini{display:flex;flex-direction:column;justify-content:flex-start;width:100%;text-align:left;padding:14px 16px;border:0;border-radius:14px;background:var(--paper);box-shadow:inset 0 0 0 1px var(--rule);color:var(--ink);font:inherit;cursor:pointer;transition:transform .2s,box-shadow .2s}",
    ".ab-mini:hover{transform:translateY(-2px);box-shadow:inset 0 0 0 1px var(--ink-3),0 6px 16px rgba(0,0,0,.14)}",
    ".ab-mini>b{display:block;font-size:15px;margin:0 0 4px}",
    ".ab-mini>span{display:block;font-size:13.5px;line-height:1.5;color:var(--ink-2)}",
    ".ab-mini>em{display:block;margin-top:auto;padding-top:8px;font-style:normal;font-size:12px;letter-spacing:.04em;color:var(--ink-3)}",
    ".ab-mini.done{box-shadow:inset 0 0 0 1.5px var(--green)}",
    ".ab-mini.done>em{color:var(--green)}",
    ".ab-mini:not(.done)>span{opacity:.55}"
  ].join("\n");
  function addCss() {
    if (document.getElementById("ab-css")) return;
    var st = document.createElement("style");
    st.id = "ab-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // "text [[a]] text [[b|c]]" → pieces of text and gaps.
  function parse(frame) {
    var out = [], re = /\[\[([^\]]+)\]\]/g, last = 0, m;
    while ((m = re.exec(frame))) {
      if (m.index > last) out.push({ t: frame.slice(last, m.index) });
      var alts = m[1].split("|");
      out.push({ a: alts[0], ok: alts });
      last = re.lastIndex;
    }
    if (last < frame.length) out.push({ t: frame.slice(last) });
    return out;
  }
  // The finished sentence, as text, for the unit page.
  function filled(frame) { return frame.replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, "$1"); }

  CH.addKind("build", function (spec, seed) {
    addCss();
    var api = {}, parts = parse(spec.frame), gaps = [], chips = [], sel = null, done = false;
    var box = el("div", "ab-build");
    var card = el("div", "ab-card");
    card.appendChild(el("p", "ab-name", "<i>✦</i>" + esc(spec.name ? "Build the concept · " + spec.name : "Build the concept")));
    var line = el("div", "ab-line");
    parts.forEach(function (p) {
      if (p.t != null) { line.appendChild(el("span", "", fmt(p.t))); return; }
      var g = LAB.button("ab-gap", "");
      g.setAttribute("aria-label", "Empty gap");
      var gap = { el: g, want: p.ok, chip: null };
      g.addEventListener("click", function () {
        if (done) return;
        if (gap.chip) { unplace(gap); select(gap); }
        else select(sel === gap ? null : gap);
      });
      gaps.push(gap);
      line.appendChild(g);
    });
    card.appendChild(line);
    box.appendChild(card);

    var tray = el("div", "ab-tray");
    tray.setAttribute("aria-label", "Pieces to place");
    var texts = parts.filter(function (p) { return p.a != null; }).map(function (p) { return p.a; }).concat(spec.chips || []);
    LAB.rng("build:" + seed).shuffle(texts).forEach(function (t) {
      var c = LAB.button("ab-chip", fmt(t));
      var chip = { el: c, t: t, gap: null };
      c.addEventListener("click", function () {
        if (done || c.dataset.dragged) { delete c.dataset.dragged; return; }
        var target = sel && !sel.chip ? sel : gaps.filter(function (g) { return !g.chip; })[0];
        if (target) place(chip, target);
      });
      drag(chip);
      chips.push(chip);
      tray.appendChild(c);
    });
    box.appendChild(tray);

    function select(g) {
      sel = g;
      gaps.forEach(function (x) { x.el.classList.toggle("sel", x === g); });
    }
    function place(chip, gap) {
      if (gap.chip) unplace(gap);
      if (chip.gap) unplace(chip.gap);
      gap.chip = chip; chip.gap = gap;
      gap.el.innerHTML = fmt(chip.t);
      gap.el.classList.add("full"); gap.el.classList.remove("no");
      gap.el.setAttribute("aria-label", "Gap holding " + String(chip.t).replace(/\$/g, "") + ". Press to take it back.");
      chip.el.classList.add("used");
      select(null);
      api.onChange && api.onChange();
    }
    function unplace(gap) {
      var chip = gap.chip;
      if (!chip) return;
      gap.chip = null; chip.gap = null;
      gap.el.innerHTML = ""; gap.el.classList.remove("full", "no");
      gap.el.setAttribute("aria-label", "Empty gap");
      chip.el.classList.remove("used");
      api.onChange && api.onChange();
    }
    // Drag a piece onto a gap. A small move is still a tap.
    function drag(chip) {
      var c = chip.el;
      c.addEventListener("pointerdown", function (e) {
        if (done || e.button > 0) return;
        var x0 = e.clientX, y0 = e.clientY, ghost = null, over = null;
        function gapAt(x, y) {
          var hit = document.elementFromPoint(x, y);
          var gEl = hit && hit.closest && hit.closest(".ab-gap");
          return gEl ? gaps.filter(function (g) { return g.el === gEl; })[0] : null;
        }
        function move(ev) {
          if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 7) return;
          if (!ghost) { ghost = el("div", "ab-ghost", fmt(chip.t)); document.body.appendChild(ghost); c.classList.add("lift"); }
          ghost.style.left = ev.clientX + "px"; ghost.style.top = ev.clientY + "px";
          var g = gapAt(ev.clientX, ev.clientY);
          if (g !== over) { if (over) over.el.classList.remove("over"); over = g; if (g) g.el.classList.add("over"); }
        }
        function up(ev) {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          window.removeEventListener("pointercancel", up);
          if (!ghost) return;
          ghost.remove(); c.classList.remove("lift");
          if (over) over.el.classList.remove("over");
          c.dataset.dragged = "1";
          setTimeout(function () { delete c.dataset.dragged; }, 50);
          var g = ev.type === "pointerup" ? gapAt(ev.clientX, ev.clientY) : null;
          if (g) place(chip, g);
        }
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", up);
      });
    }
    function finish() {
      done = true;
      box.classList.add("built");
      card.querySelector(".ab-name").innerHTML = "<i>✓</i>" + esc("Concept built" + (spec.name ? " · " + spec.name : ""));
      gaps.forEach(function (g) { g.el.disabled = true; });
      chips.forEach(function (c) { c.el.disabled = true; });
    }

    api.el = box;
    api.ready = function () { return gaps.every(function (g) { return !!g.chip; }); };
    api.check = function () {
      var wrong = gaps.filter(function (g) { return !g.chip || g.want.indexOf(g.chip.t) < 0; });
      gaps.forEach(function (g) { g.el.classList.toggle("no", wrong.indexOf(g) > -1); });
      if (!wrong.length) { finish(); return { ok: true }; }
      var fb = spec.fb && wrong.map(function (g) { return g.chip && spec.fb[g.chip.t]; }).filter(Boolean)[0];
      var n = wrong.length === 1 ? "One piece is in the wrong place — it's marked." : wrong.length + " pieces are in the wrong place — they're marked.";
      return { ok: false, say: fb ? fmt(fb) : n };
    };
    api.reveal = function () {
      gaps.forEach(function (g) { if (g.chip) unplace(g); });
      gaps.forEach(function (g) {
        var c = chips.filter(function (x) { return !x.gap && g.want.indexOf(x.t) > -1; })[0];
        if (c) place(c, g);
      });
      finish();
    };
    return api;
  });

  /* The unit page: one card per lesson that builds a concept. */
  LAB.conceptBinder = function (wrap, u, ctx) {
    addCss();
    var me = ctx && ctx.me;
    var list = [];
    u.lessons.forEach(function (l) {
      l.steps.forEach(function (s) { if (s.type === "build") list.push({ l: l, s: s }); });
    });
    if (!list.length) return;
    var built = list.filter(function (x) { var r = x.s.id && CH.result(x.s.id, me); return r && r.solved; });
    var sec = el("section", "ab-binder");
    sec.appendChild(el("h2", "", "Concepts you've built <span>" + built.length + " of " + list.length + "</span>"));
    sec.appendChild(el("p", "", "Each lesson ends its big idea by building it. Every card you build lands here."));
    var bar = el("div", "ab-bar", "<i></i>");
    sec.appendChild(bar);
    var grid = el("div", "ab-grid");
    var no = 0;
    list.forEach(function (x) {
      if (!x.l.tag) no = u.lessons.filter(function (o, i) { return i <= u.lessons.indexOf(x.l) && !o.tag; }).length;
      var ok = built.indexOf(x) > -1, where = x.l.tag || "Lesson " + u.n + "." + no;
      var b = LAB.button("ab-mini" + (ok ? " done" : ""),
        "<b>" + esc(x.s.name || x.l.title) + "</b><span>" + fmt(filled(x.s.frame)) + "</span><em>" + (ok ? "✓ Built in " : "Build it in ") + esc(where) + "</em>");
      b.addEventListener("click", function () { if (ctx && ctx.go) ctx.go.lesson(x.l.k); });
      grid.appendChild(b);
    });
    sec.appendChild(grid);
    wrap.appendChild(sec);
    requestAnimationFrame(function () { bar.firstChild.style.width = Math.round(100 * built.length / list.length) + "%"; });
  };

  /* A unit file adds its concept builders here, once registered: each one
     replaces the lesson's "Name it" card if it has one, or else follows the
     first scene that names the idea. Every step that was there keeps the id
     it had, so a student's record stays where it was. */
  LAB.addConcepts = function (key, map) {
    var u = LAB.units[key];
    if (!u) return;
    Object.keys(map).forEach(function (k) {
      var l = u.lessons[+k - 1];
      if (!l) return;
      var lk = l.unit + ":" + l.k + (l.v ? "~" + l.v : "");
      l.steps.forEach(function (s, i) { if (!s.id) s.id = lk + ":" + i; });
      var step = Object.assign({ type: "build", kicker: "Build it", id: lk + ":concept", skill: "Concepts" }, map[k]);
      if (!step.prompt) step.prompt = "Put the pieces where they belong to build this lesson's big idea.";
      if (!step.hints) step.hints = ["Read the sentence aloud with a piece in place. Does it say what you saw in this lesson?"];
      if (!step.why) step.why = "That's this lesson's big idea, built. It is saved under **Concepts you've built** on the unit page.";
      if (step.at != null) { l.steps.splice(step.at, 0, step); return; }   // at: n puts it before step n
      var at = -1;
      l.steps.forEach(function (s, i) { if (at < 0 && s.type === "learn" && !s.scene && /Name it/.test(s.kicker || "")) at = i; });
      // keep: true leaves the card in place and builds right after it.
      if (at > -1) { if (step.keep) l.steps.splice(at + 1, 0, step); else l.steps.splice(at, 1, step); return; }
      l.steps.forEach(function (s, i) { if (at < 0 && s.type === "learn" && s.scene && s.then) at = i; });
      l.steps.splice(at > -1 ? at + 1 : Math.min(2, l.steps.length), 0, step);
    });
    var page = u.page;
    u.page = function (wrap, ctx) { if (page) page.call(this, wrap, ctx); LAB.conceptBinder(wrap, u, ctx); };
  };
})();
