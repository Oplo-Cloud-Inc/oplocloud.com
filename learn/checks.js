/* ==========================================================================
   OEdu — checks beside the reading.

   At the places in a lesson that matter most, a small check sits in the
   margin, level with the passage it is about. It is simply there: it never
   pops up, never interrupts, and asks nothing of a student who would rather
   keep reading. This is learning, not measurement — the formative mode of
   docs/OEDU_ASSESSMENT_EXPERIENCE_SYSTEM.md (§24, §35, §58) — so an answer
   is marked at once, with the reason, and can be tried again.

   Content lives in learn/checks-<unit>.js, registered by reader and section.
   Each check is anchored to a phrase in the text rather than to a paragraph
   number, so a lesson can be rewritten around its checks without moving them;
   a check whose phrase is gone is left out rather than put in the wrong place.

   The margin belongs to the student's own notes first (app.js, drawMargin).
   Notes and checks are laid out together here: every card level with the
   line it belongs to, pushed clear of the one above, whichever kind it is,
   and a check joined to its passage by a hairline — so the column reads as
   one set of things beside the text rather than two stacks competing.

   Four kinds, chosen for what each shows about understanding (§9):
     choice    pick the one that is true
     sort      put each thing in its group
     order     put the steps or levels in sequence
     explain   say it in your own words, then compare with the lesson's
   ========================================================================== */
window.OPLO_CHECKS = (function () {
  "use strict";

  var API = window.OPLO_API;
  var DATA = window.OPLO_CHECKS_DATA = window.OPLO_CHECKS_DATA || {};
  var WIDE = "(min-width: 1221px)";    // below this the margin sits under the article (app.css)

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function icon(d) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  }
  var I = {
    spark: '<path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4"/><circle cx="12" cy="12" r="2.2"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    up:    '<path d="m7 14 5-5 5 5"/>',
    down:  '<path d="m7 10 5 5 5-5"/>',
    again: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4.5V9h4.5"/>'
  };

  /* ============================================================ Record
     Per account: { v, at, off, results: { id: { ok, first, firstAt, tries, at } } }.
     Kept on this device at once and on the account as the progress scope
     "checks", so what a student has checked follows them between devices and
     their teachers can see which ideas they had to try twice. */
  var ME = null, REC = null, BASE = null, pushT = null, pulled = {};

  function localKey(me) { return "oplo.checks." + (me ? me.id : "anon"); }
  function readLocal(me) {
    try { return JSON.parse(localStorage.getItem(localKey(me)) || "null"); } catch (e) { return null; }
  }
  function writeLocal() {
    try { localStorage.setItem(localKey(ME), JSON.stringify(REC)); } catch (e) { /* full or blocked */ }
  }
  function blank() { return { v: 1, at: 0, off: false, results: {} }; }

  function merge(a, b) {
    a = a || blank(); b = b || blank();
    var out = { v: 1, at: Math.max(a.at || 0, b.at || 0), results: {} };
    out.off = (a.at || 0) >= (b.at || 0) ? !!a.off : !!b.off;
    [a.results || {}, b.results || {}].forEach(function (rs) {
      Object.keys(rs).forEach(function (id) {
        var x = rs[id], y = out.results[id];
        if (!y) { out.results[id] = x; return; }
        var xf = x.firstAt || 0, yf = y.firstAt || 0;
        var xFirst = xf && (!yf || xf <= yf);
        out.results[id] = {
          ok: !!(x.ok || y.ok),
          first: xFirst ? !!x.first : !!y.first,
          firstAt: xFirst ? xf : yf,
          tries: Math.max(x.tries || 0, y.tries || 0),
          at: Math.max(x.at || 0, y.at || 0)
        };
      });
    });
    return out;
  }

  function useAccount(me) {
    if (ME && me && ME.id === me.id && REC) return;
    ME = me || null;
    REC = readLocal(ME) || blank();
    BASE = null;
    if (!ME || !API || pulled[ME.id]) return;
    pulled[ME.id] = true;
    API.progress.one("checks").then(function (row) {
      BASE = row ? row.updatedAt : 0;
      if (row && row.state) {
        var before = JSON.stringify(REC);
        REC = merge(REC, row.state);
        writeLocal();
        if (JSON.stringify(REC) !== before) { if (S) redraw(); }
        if (JSON.stringify(REC) !== JSON.stringify(row.state)) push();
      } else if (Object.keys(REC.results).length) {
        push();
      }
    }, function () { pulled[ME.id] = false; });
  }

  function changed() {
    REC.at = Date.now();
    writeLocal();
    clearTimeout(pushT);
    pushT = setTimeout(push, 1200);
  }
  function push(tries) {
    if (!ME || !API) return;
    tries = tries || 0;
    var send = function () {
      return API.progress.put("checks", REC, null, BASE).then(function (res) {
        BASE = res.updatedAt;
      }, function (e) {
        if (e && e.status === 409 && tries < 3) {
          return API.progress.one("checks").then(function (row) {
            BASE = row ? row.updatedAt : 0;
            if (row && row.state) { REC = merge(REC, row.state); writeLocal(); }
            push(tries + 1);
          });
        }
        // Offline or refused: it is on this device, and goes with the next change.
      });
    };
    if (BASE == null) {
      API.progress.one("checks").then(function (row) {
        BASE = row ? row.updatedAt : 0;
        if (row && row.state) { REC = merge(REC, row.state); writeLocal(); }
        send();
      }, function () { /* offline */ });
    } else {
      send();
    }
  }

  function result(id) { return (REC && REC.results[id]) || null; }
  function record(id, ok) {
    var r = REC.results[id] || { tries: 0 };
    var t = Date.now();
    if (!r.firstAt) { r.firstAt = t; r.first = !!ok; }
    r.tries = (r.tries || 0) + 1;
    r.ok = r.ok || !!ok;
    r.at = t;
    REC.results[id] = r;
    changed();
  }

  /* ========================================================= Anchoring */
  function norm(s) {
    return String(s || "").replace(/\s+/g, " ").replace(/[’‘]/g, "'").replace(/[“”]/g, '"').trim().toLowerCase();
  }
  function findBlock(body, phrase) {
    var want = norm(phrase);
    if (!want) return null;
    var kids = body.children;
    for (var i = 0; i < kids.length; i++) {
      if (kids[i].classList.contains("kc")) continue;
      if (norm(kids[i].textContent).indexOf(want) > -1) return kids[i];
    }
    return null;
  }

  /* A stable shuffle, so the order a student saw is the order they see again —
     and a real one: at most one item may start in its right place, or the
     question is half answered before it is asked. */
  function shuffled(list, seed) {
    var limit = Math.floor(list.length / 4);
    for (var attempt = 0; attempt < 40; attempt++) {
      var h = 2166136261;
      var key = seed + "#" + attempt;
      for (var i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
      var out = list.map(function (x, k) { return { x: x, k: k }; });
      for (var j = out.length - 1; j > 0; j--) {
        h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
        var r = h % (j + 1), tmp = out[j];
        out[j] = out[r];
        out[r] = tmp;
      }
      var fixed = out.filter(function (o, n) { return o.k === n; }).length;
      if (fixed <= limit) return out;
    }
    return list.map(function (x, k) { return { x: x, k: k }; }).reverse();
  }

  /* ============================================================= Cards */
  function card(c, fresh) {
    var box = el("section", "kc");
    box.dataset.id = c.id;
    box.setAttribute("aria-label", "Check yourself");
    // Not part of the text being read: marks are measured against the
    // lesson's own words (annotate.js skips anything carrying this), so a
    // check sitting inside the article never shifts a note.
    box.setAttribute("data-noread", "");
    var r = result(c.id);
    var top = el("header", "kc-top",
      '<span class="kc-k">' + icon(I.spark) + "<span>Check yourself</span></span>");
    box.appendChild(top);
    box.appendChild(el("p", "kc-q", c.q));
    var inner = el("div", "kc-in");
    box.appendChild(inner);
    var fb = el("div", "kc-fb");
    fb.setAttribute("aria-live", "polite");
    box.appendChild(fb);

    function done(ok, again) {
      box.classList.toggle("is-done", !!ok);
      top.querySelector(".kc-state") && top.querySelector(".kc-state").remove();
      if (ok) {
        var res = result(c.id);
        top.appendChild(el("span", "kc-state",
          icon(I.check) + "<span>" + (res && res.first ? "First try" : "Got there") + "</span>"));
      }
      if (again) layoutSoon();
    }
    function say(ok, text) {
      fb.className = "kc-fb on " + (ok ? "ok" : "no");
      fb.innerHTML = "<b>" + (ok ? "Right." : "Not quite.") + "</b> " + (text || "");
      layoutSoon();
    }
    function tryAgain() {
      var b = el("button", "kc-again", icon(I.again) + "<span>Try it again</span>");
      b.type = "button";
      b.addEventListener("click", function () {
        var again = card(c, true);
        box.replaceWith(again);
        if (S) S.cards[c.id] = again;
        var first = again.querySelector("button, textarea");
        if (first) first.focus();
        layoutSoon();
      });
      return b;
    }

    var kinds = { choice: choice, sort: sort, order: order, explain: explain };
    (kinds[c.type] || choice)(c, inner, say, function (ok) {
      record(c.id, ok);
      done(ok, true);
      paintHead();
    }, r);

    if (r && r.ok && !fresh) {
      /* Checked before. It stays as a record of what was understood, quiet,
         with the reason to hand — and can be taken again from scratch. */
      box.classList.add("is-done", "was-done");
      inner.hidden = true;
      fb.className = "kc-fb on ok";
      fb.innerHTML = "<b>" + (r.first ? "Right first time." : "You got there.") + "</b> " + (c.why || "");
      fb.appendChild(tryAgain());
      done(true);
    }

    box.addEventListener("mouseenter", function () { light(c.id, true); });
    box.addEventListener("mouseleave", function () { light(c.id, false); });
    box.addEventListener("focusin", function () { light(c.id, true); });
    box.addEventListener("focusout", function (e) { if (!box.contains(e.relatedTarget)) light(c.id, false); });
    return box;
  }

  /* ------------------------------------------------------------ choice */
  function choice(c, inner, say, finish) {
    var tried = false;
    c.options.forEach(function (opt, i) {
      var b = el("button", "kc-opt", "<span>" + opt + "</span>");
      b.type = "button";
      b.addEventListener("click", function () {
        if (b.disabled) return;
        var ok = i === c.answer;
        if (ok) {
          [].forEach.call(inner.querySelectorAll(".kc-opt"), function (x) { x.disabled = true; });
          b.classList.add("right");
          b.insertAdjacentHTML("beforeend", icon(I.check));
          say(true, c.why);
          finish(true);
        } else {
          b.classList.add("wrong");
          b.disabled = true;
          say(false, c.nudge || "Look back at the passage beside this, and try another.");
          if (!tried) { tried = true; record(c.id, false); }
        }
      });
      inner.appendChild(b);
    });
  }

  /* -------------------------------------------------------------- sort */
  function sort(c, inner, say, finish) {
    var picks = {}, tried = false;
    var rows = el("div", "kc-rows" + (c.bins.length > 2 ? " many" : ""));
    c.items.forEach(function (it, i) {
      var row = el("div", "kc-row");
      row.appendChild(el("span", "kc-item", it[0]));
      var seg = el("div", "kc-seg");
      seg.setAttribute("role", "radiogroup");
      seg.setAttribute("aria-label", it[0].replace(/<[^>]+>/g, ""));
      c.bins.forEach(function (bin, b) {
        var btn = el("button", "kc-bin", esc(bin));
        btn.type = "button";
        btn.setAttribute("role", "radio");
        btn.setAttribute("aria-checked", "false");
        btn.addEventListener("click", function () {
          picks[i] = b;
          [].forEach.call(seg.children, function (x) { x.setAttribute("aria-checked", "false"); });
          btn.setAttribute("aria-checked", "true");
          row.classList.remove("off");
          go.disabled = Object.keys(picks).length < c.items.length;
        });
        seg.appendChild(btn);
      });
      row.appendChild(seg);
      rows.appendChild(row);
    });
    inner.appendChild(rows);
    var go = el("button", "kc-go", "Check");
    go.type = "button";
    go.disabled = true;
    go.addEventListener("click", function () {
      var wrong = 0;
      c.items.forEach(function (it, i) {
        var bad = picks[i] !== it[1];
        rows.children[i].classList.toggle("off", bad);
        if (bad) wrong++;
      });
      if (!wrong) {
        [].forEach.call(inner.querySelectorAll("button"), function (x) { x.disabled = true; });
        say(true, c.why);
        finish(true);
      } else {
        say(false, (wrong === 1 ? "One is" : wrong + " are") + " in the wrong group — the marked " +
          (wrong === 1 ? "one" : "ones") + ". " + (c.nudge || ""));
        if (!tried) { tried = true; record(c.id, false); }
      }
    });
    inner.appendChild(go);
  }

  /* ------------------------------------------------------------- order */
  function order(c, inner, say, finish) {
    var seq = shuffled(c.items, c.id), tried = false;
    var list = el("ol", "kc-order");
    function paint() {
      list.innerHTML = "";
      seq.forEach(function (o, n) {
        var li = el("li", "kc-step");
        li.appendChild(el("span", "kc-n", String(n + 1)));
        li.appendChild(el("span", "kc-item", o.x));
        var up = el("button", "kc-mv", icon(I.up));
        up.type = "button";
        up.disabled = n === 0;
        up.setAttribute("aria-label", "Move up");
        up.addEventListener("click", function () { move(n, -1); });
        var dn = el("button", "kc-mv", icon(I.down));
        dn.type = "button";
        dn.disabled = n === seq.length - 1;
        dn.setAttribute("aria-label", "Move down");
        dn.addEventListener("click", function () { move(n, 1); });
        li.appendChild(up);
        li.appendChild(dn);
        list.appendChild(li);
      });
    }
    function move(n, d) {
      var t = seq[n];
      seq[n] = seq[n + d];
      seq[n + d] = t;
      [].forEach.call(list.children, function (x) { x.classList.remove("off"); });
      paint();
      var btn = list.children[n + d] && list.children[n + d].querySelectorAll(".kc-mv")[d < 0 ? 0 : 1];
      if (btn && !btn.disabled) btn.focus();
    }
    paint();
    inner.appendChild(list);
    var go = el("button", "kc-go", "Check the order");
    go.type = "button";
    go.addEventListener("click", function () {
      var right = 0;
      while (right < seq.length && seq[right].k === right) right++;
      if (right === seq.length) {
        [].forEach.call(inner.querySelectorAll("button"), function (x) { x.disabled = true; });
        say(true, c.why);
        finish(true);
      } else {
        list.children[right].classList.add("off");
        say(false, (right ? "The first " + (right === 1 ? "one is" : right + " are") + " right. " : "") +
          "Step " + (right + 1) + " is where it goes wrong. " + (c.nudge || ""));
        if (!tried) { tried = true; record(c.id, false); }
      }
    });
    inner.appendChild(go);
  }

  /* ----------------------------------------------------------- explain
     No machine marks a student's own words here. They write, then see the
     lesson's version beside theirs, and say honestly whether they had it —
     the comparison is the learning. */
  function explain(c, inner, say, finish) {
    var ta = el("textarea", "kc-ta");
    ta.rows = 3;
    ta.placeholder = "In your own words…";
    ta.setAttribute("aria-label", "Your answer");
    inner.appendChild(ta);
    var go = el("button", "kc-go", "Compare with the lesson");
    go.type = "button";
    go.addEventListener("click", function () {
      go.remove();
      ta.readOnly = true;
      var model = el("div", "kc-model", "<span>The lesson says</span><p>" + c.model + "</p>");
      inner.appendChild(model);
      var q = el("div", "kc-self", "<span>Did yours say that?</span>");
      var yes = el("button", "kc-bin", "I had it");
      var no = el("button", "kc-bin", "Not yet");
      yes.type = no.type = "button";
      yes.addEventListener("click", function () {
        q.remove();
        say(true, c.why || "");
        finish(true);
      });
      no.addEventListener("click", function () {
        q.remove();
        record(c.id, false);
        say(false, "That's what re-reading the passage is for. " + (c.nudge || ""));
        var again = el("button", "kc-go quiet", "Try again");
        again.type = "button";
        again.addEventListener("click", function () {
          model.remove();
          again.remove();
          ta.readOnly = false;
          ta.value = "";
          inner.appendChild(go);
          ta.focus();
          var fb = inner.parentNode.querySelector(".kc-fb");
          if (fb) { fb.className = "kc-fb"; fb.innerHTML = ""; }
          layoutSoon();
        });
        inner.appendChild(again);
      });
      q.appendChild(yes);
      q.appendChild(no);
      inner.appendChild(q);
      layoutSoon();
    });
    inner.appendChild(go);
  }

  /* ============================================================ Layout
     S is the section being read: its body, its margin, and each check with
     the passage it belongs to. */
  var S = null;

  function arm(opts) {
    disarm();
    useAccount(opts.me);
    var checks = ((DATA[opts.reader] || {})[opts.sec]) || [];
    S = {
      reader: opts.reader, sec: opts.sec, body: opts.body, art: opts.art, margin: opts.margin,
      list: [], cards: {}, obs: [], raf: 0
    };
    checks.forEach(function (c) {
      var block = findBlock(opts.body, c.at);
      if (block) S.list.push({ c: c, block: block });
    });
    if (!S.list.length) { S = null; return; }

    S.layer = el("div", "kc-layer");
    S.margin.appendChild(S.layer);
    S.list.forEach(function (x) {
      x.block.classList.add("kc-anchor");
      S.cards[x.c.id] = card(x.c);
    });

    var wrap = S.margin.querySelector(".mg-wrap"), head = S.margin.querySelector(".mg-head");
    var mo = new MutationObserver(function () { paintHead(); layoutSoon(); });
    if (wrap) mo.observe(wrap, { childList: true });
    if (head) mo.observe(head, { childList: true });
    S.obs.push(mo);
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { layoutSoon(); });
      ro.observe(S.body);
      S.obs.push(ro);
    }
    S.mq = window.matchMedia(WIDE);
    S.onMq = function () { layoutSoon(); };
    if (S.mq.addEventListener) S.mq.addEventListener("change", S.onMq);
    S.onScroll = function () { if (!S.raf) S.raf = requestAnimationFrame(near); };
    window.addEventListener("scroll", S.onScroll, { passive: true });
    window.addEventListener("resize", S.onScroll);

    paintHead();
    layout();
  }

  function disarm() {
    if (!S) return;
    S.obs.forEach(function (o) { o.disconnect(); });
    if (S.mq && S.mq.removeEventListener) S.mq.removeEventListener("change", S.onMq);
    window.removeEventListener("scroll", S.onScroll);
    window.removeEventListener("resize", S.onScroll);
    cancelAnimationFrame(S.raf);
    S = null;
  }

  function redraw() {
    if (!S) return;
    S.list.forEach(function (x) {
      var fresh = card(x.c), old = S.cards[x.c.id];
      if (old && old.parentNode) old.replaceWith(fresh);
      S.cards[x.c.id] = fresh;
    });
    paintHead();
    layoutSoon();
  }

  var soon = 0;
  function layoutSoon() {
    if (soon) return;
    soon = requestAnimationFrame(function () { soon = 0; layout(); });
  }

  function layout() {
    if (!S || !S.body.isConnected) { disarm(); return; }
    var off = !!(REC && REC.off);
    S.margin.classList.toggle("kc-off", off);
    var wide = window.matchMedia(WIDE).matches;
    S.list.forEach(function (x) {
      var cardEl = S.cards[x.c.id];
      if (wide) {
        if (cardEl.parentNode !== S.layer) S.layer.appendChild(cardEl);
        cardEl.classList.remove("inline");
      } else {
        cardEl.classList.add("inline");
        if (cardEl.previousElementSibling !== x.block) x.block.after(cardEl);
        // Inline, the card is already beside its passage; a line would point
        // at where the margin used to be.
        [].forEach.call(cardEl.querySelectorAll(".kc-link"), function (n) { n.remove(); });
      }
      cardEl.hidden = off;
    });
    if (wide) inMargin(off);
    else clearMargin();
    near();
  }

  function clearMargin() {
    var wrap = S.margin.querySelector(".mg-wrap");
    [].forEach.call(S.layer.querySelectorAll(".kc-link"), function (n) { n.remove(); });
    S.layer.style.height = "0px";
    if (wrap) wrap.style.minHeight = "";
  }

  /* Notes and checks in one pass: each at the line it belongs to, then
     pushed clear of the one above. The note cards are app.js's; only their
     `top` is changed, and only so that neither kind covers the other. */
  function inMargin(off) {
    var wrap = S.margin.querySelector(".mg-wrap");
    if (!wrap) return;
    S.layer.style.top = wrap.offsetTop + "px";
    var wrapTop = wrap.getBoundingClientRect().top;
    var items = [];
    var floor = 0;
    var empty = wrap.querySelector(".mg-empty");
    if (empty) floor = empty.offsetHeight + 16;

    [].forEach.call(wrap.querySelectorAll(".mg"), function (m) {
      var mark = m.dataset.for && S.body.querySelector('mark[data-id="' + m.dataset.for + '"]');
      var want = mark ? mark.getBoundingClientRect().top - wrapTop : (parseFloat(m.style.top) || 0);
      items.push({ node: m, want: want });
    });
    if (!off) {
      S.list.forEach(function (x) {
        var cardEl = S.cards[x.c.id];
        var want = x.block.getBoundingClientRect().top - wrapTop;
        items.push({ node: cardEl, want: want, check: x });
      });
    }
    items.sort(function (a, b) { return a.want - b.want; });

    var bodyRight = S.body.getBoundingClientRect().right;
    var layerLeft = S.layer.getBoundingClientRect().left;
    var gap = Math.max(0, layerLeft - bodyRight);
    items.forEach(function (it) {
      var top = Math.max(it.want, floor);
      it.node.style.top = Math.round(top) + "px";
      floor = top + it.node.offsetHeight + 12;
      if (it.check) link(it.node, it.want - top, gap);
    });
    S.layer.style.height = floor + "px";
    wrap.style.height = floor + "px";
  }

  /* The hairline from a check back to its passage. When the card had to be
     pushed below its line, the line bends up to meet the text where it
     should — the card moved; what it is about did not. */
  function link(cardEl, dy, gap) {
    var old = cardEl.querySelector(".kc-link");
    if (old) old.remove();
    if (gap < 12) return;
    var NS = "http://www.w3.org/2000/svg";
    var y0 = dy + 14, y1 = 20;
    var top = Math.min(y0, y1) - 6, h = Math.abs(y1 - y0) + 12;
    var s = document.createElementNS(NS, "svg");
    s.setAttribute("class", "kc-link");
    s.setAttribute("width", gap);
    s.setAttribute("height", h);
    s.setAttribute("aria-hidden", "true");
    s.style.left = -gap + "px";
    s.style.top = top + "px";
    var a = y0 - top, b = y1 - top, w = gap - 2;
    var p = document.createElementNS(NS, "path");
    p.setAttribute("d", "M4 " + a + " C" + (w * 0.55) + " " + a + " " + (w * 0.45) + " " + b + " " + w + " " + b);
    s.appendChild(p);
    var dot = document.createElementNS(NS, "circle");
    dot.setAttribute("cx", "4");
    dot.setAttribute("cy", a);
    dot.setAttribute("r", "2.6");
    s.appendChild(dot);
    cardEl.appendChild(s);
  }

  /* The check nearest the line being read is the one in full colour; the
     rest stay present but quieter, the way notes in a real margin do. */
  function near() {
    if (!S) return;
    S.raf = 0;
    var line = window.innerHeight * 0.42, best = null, bestD = Infinity;
    S.list.forEach(function (x) {
      var r = x.block.getBoundingClientRect();
      var d = r.top > line ? r.top - line : r.bottom < line ? line - r.bottom : 0;
      if (d < bestD) { bestD = d; best = x.c.id; }
    });
    S.list.forEach(function (x) {
      var c = S.cards[x.c.id];
      if (c) c.classList.toggle("near", x.c.id === best && bestD < window.innerHeight * 0.5);
    });
  }

  function light(id, on) {
    if (!S) return;
    S.list.forEach(function (x) {
      if (x.c.id === id) x.block.classList.toggle("kc-lit", on);
    });
    var c = S.cards[id];
    if (c) c.classList.toggle("lit", on);
  }

  /* ------------------------------------------------------------ The head
     How many of this section's checks are done, and the switch that puts
     them away. It lives in the margin's own head, which app.js redraws —
     so it is put back whenever that happens. */
  function paintHead() {
    if (!S) return;
    var head = S.margin.querySelector(".mg-head");
    if (!head) return;
    var btn = head.querySelector(".kc-toggle");
    if (!btn) {
      btn = el("button", "kc-toggle");
      btn.type = "button";
      btn.addEventListener("click", function () {
        REC.off = !REC.off;
        changed();
        paintHead();
        layout();
      });
      head.appendChild(btn);
    }
    var total = S.list.length;
    var n = S.list.filter(function (x) { var r = result(x.c.id); return r && r.ok; }).length;
    var off = !!REC.off;
    btn.setAttribute("aria-pressed", String(!off));
    btn.title = off ? "Show the checks beside the reading" : "Hide the checks — you can bring them back here";
    btn.innerHTML = icon(I.spark) + "<span>" + (off ? "Checks off" : "Checks " + n + "/" + total) + "</span>";
    btn.classList.toggle("off", off);
  }

  return {
    arm: arm,
    disarm: disarm,
    /* For authors: which of a section's checks found their passage. */
    audit: function (reader, sec, body) {
      return (((DATA[reader] || {})[sec]) || []).map(function (c) {
        return { id: c.id, found: !!findBlock(body, c.at) };
      });
    }
  };
})();
