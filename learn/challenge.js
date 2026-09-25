/* ==========================================================================
   OEdu — challenges. Learning by solving.

   The reading is where an idea is met; the challenge is where it is used. A
   challenge path is a short run of steps, one per screen, most of them
   problems that are solved by doing something — building Freytag's pyramid,
   crewing a production, lining a cut up with its music — rather than by
   recalling a sentence. It is formative (docs/OEDU_ASSESSMENT_EXPERIENCE_
   SYSTEM.md §24): every answer is marked at once, and the mark is the start
   of the learning rather than the end of it.

   What it borrows, and from where:

     Brilliant        a problem first, the explanation after; interaction that
                      is the thinking, not decoration; one step per screen
     teachers         feedback aimed at the misconception a wrong answer shows,
                      not "incorrect"; hints that step down rather than give up
     strong students  explain it back (self-explanation); mix the lessons up
                      (interleaving); come back to what you missed (spacing);
                      a worked answer when stuck, then the same idea again

   Step types — all driven by learn/challenges-<unit>.js:

     learn     a short idea card between problems
     choice    one answer; each wrong option carries its own feedback
     multi     every answer that applies
     sort      each card into its group
     order     put things in sequence
     slots     place cards onto a diagram, or against labels (matching)
     spot      tap the part of a passage that does something
     number    a number, with a tolerance
     explain   say it in your own words, then compare with a model

   Every card can be dragged or tapped then placed; every control is a button,
   so the keyboard does everything the pointer does.
   ========================================================================== */
window.OPLO_CHALLENGE = (function () {
  "use strict";

  var API = window.OPLO_API;
  var DATA = window.OPLO_CHALLENGE_DATA = window.OPLO_CHALLENGE_DATA || {};

  /* ------------------------------------------------------------- Helpers */
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
  function button(cls, html) {
    var b = el("button", cls, html);
    b.type = "button";
    return b;
  }
  function icon(d) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  }
  var I = {
    bulb:  '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    up:    '<path d="m7 14 5-5 5 5"/>',
    down:  '<path d="m7 10 5 5 5-5"/>',
    grip:  '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/>',
    right: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    left:  '<path d="m14.5 6-6 6 6 6"/>',
    fwd:   '<path d="m9.5 6 6 6-6 6"/>',
    again: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4.5V9h4.5"/>',
    spark: '<path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4"/><circle cx="12" cy="12" r="2.2"/>',
    eye:   '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>'
  };
  function reduced() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  /* A stable shuffle: the order a student saw is the order they see again,
     and never already solved. */
  function shuffled(list, seed) {
    for (var attempt = 0; attempt < 40; attempt++) {
      var h = 2166136261, key = seed + "#" + attempt;
      for (var i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
      var out = list.map(function (x, k) { return { x: x, k: k }; });
      for (var j = out.length - 1; j > 0; j--) {
        h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
        var r = h % (j + 1), t = out[j];
        out[j] = out[r];
        out[r] = t;
      }
      var fixed = out.filter(function (o, n) { return o.k === n; }).length;
      if (fixed <= Math.floor(list.length / 4)) return out;
    }
    return list.map(function (x, k) { return { x: x, k: k }; }).reverse();
  }

  /* ============================================================== Record
     { v, at, results: { stepId: { solved, first, firstAt, last, tries, hints, shown, seen, at } } }
     On the device at once, and on the account as the progress scope
     "challenges", so it follows the student between devices. `first` is the
     first attempt ever made; `last` whether the latest solve was clean. */
  var ME = null, REC = null, BASE = null, pushT = null, pulled = {};
  function localKey() { return "oplo.challenges." + (ME ? ME.id : "anon"); }
  function blank() { return { v: 1, at: 0, results: {} }; }
  function readLocal() {
    try { return JSON.parse(localStorage.getItem(localKey()) || "null"); } catch (e) { return null; }
  }
  function writeLocal() {
    try { localStorage.setItem(localKey(), JSON.stringify(REC)); } catch (e) { /* full or blocked */ }
  }
  function merge(a, b) {
    a = a || blank(); b = b || blank();
    var out = { v: 1, at: Math.max(a.at || 0, b.at || 0), results: {} };
    [a.results || {}, b.results || {}].forEach(function (rs) {
      Object.keys(rs).forEach(function (id) {
        var x = rs[id], y = out.results[id];
        if (!y) { out.results[id] = x; return; }
        var xf = x.firstAt || 0, yf = y.firstAt || 0, xFirst = xf && (!yf || xf <= yf);
        var newer = (x.at || 0) >= (y.at || 0) ? x : y;
        out.results[id] = {
          solved: !!(x.solved || y.solved),
          first: xFirst ? !!x.first : !!y.first,
          firstAt: xFirst ? xf : yf,
          last: !!newer.last,
          seen: !!(x.seen || y.seen),
          tries: Math.max(x.tries || 0, y.tries || 0),
          hints: Math.max(x.hints || 0, y.hints || 0),
          shown: !!(x.shown || y.shown),
          at: Math.max(x.at || 0, y.at || 0)
        };
      });
    });
    return out;
  }
  function useAccount(me) {
    if (REC && ((ME && me && ME.id === me.id) || (!ME && !me))) return;
    ME = me || null;
    REC = readLocal() || blank();
    BASE = null;
    if (!ME || !API || pulled[ME.id]) return;
    pulled[ME.id] = true;
    API.progress.one("challenges").then(function (row) {
      BASE = row ? row.updatedAt : 0;
      if (row && row.state) {
        REC = merge(REC, row.state);
        writeLocal();
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
    pushT = setTimeout(push, 1500);
  }
  function push(tries) {
    if (!ME || !API) return;
    tries = tries || 0;
    function send() {
      API.progress.put("challenges", REC, null, BASE).then(function (res) { BASE = res.updatedAt; }, function (e) {
        if (e && e.status === 409 && tries < 3) {
          API.progress.one("challenges").then(function (row) {
            BASE = row ? row.updatedAt : 0;
            if (row && row.state) { REC = merge(REC, row.state); writeLocal(); }
            push(tries + 1);
          });
        }
      });
    }
    if (BASE == null) {
      API.progress.one("challenges").then(function (row) {
        BASE = row ? row.updatedAt : 0;
        if (row && row.state) { REC = merge(REC, row.state); writeLocal(); }
        send();
      }, function () { /* offline: kept on the device */ });
    } else send();
  }
  // A page that closes inside the push delay still gets its last answers home.
  window.addEventListener("pagehide", function () {
    if (!pushT || !ME || !API || !API.progress.beacon) return;
    clearTimeout(pushT);
    pushT = null;
    API.progress.beacon("challenges", REC, BASE);
  });
  function result(id) { return (REC && REC.results[id]) || null; }
  /* Needs another look: never solved, or solved only with help and not yet
     solved cleanly since. */
  function shaky(id) {
    var r = result(id);
    return !(r && r.solved && (r.first || r.last));
  }
  function note(id, patch) {
    // A path made on the spot (practice, a test) is recorded by whoever made
    // it; its steps have no lasting ids to keep a record against.
    if (P && P.opts && P.opts.record === false) return patch;
    var r = REC.results[id] || { tries: 0, hints: 0 };
    Object.keys(patch).forEach(function (k) { r[k] = patch[k]; });
    r.at = Date.now();
    REC.results[id] = r;
    changed();
    return r;
  }

  /* =============================================================== Paths */
  function isProblem(s) { return s.type !== "learn"; }
  function lessonPath(reader, sec) {
    var d = DATA[reader] && DATA[reader][sec];
    return d ? { reader: reader, sec: sec, title: d.title, blurb: d.blurb, steps: d.steps } : null;
  }
  /* The unit review is not written; it is drawn from the lessons. Problems
     the student needed help with come first, then the rest, and the lessons
     are interleaved rather than taken in order — mixing ideas is harder in
     the moment and sticks better afterwards. */
  function reviewPath(reader) {
    var d = DATA[reader];
    if (!d) return null;
    var helped = [], unseen = [], solid = [];
    Object.keys(d).sort().forEach(function (sec) {
      d[sec].steps.filter(function (s) { return isProblem(s) && !s.noReview && (s.type !== "explain" || shaky(s.id)); })
        .forEach(function (s) {
          var r = result(s.id), o = { s: s, sec: sec };
          (!r || !r.firstAt ? unseen : shaky(s.id) ? helped : solid).push(o);
        });
    });
    // Needed help, then not yet tried, then already solid — ten in all.
    var day = new Date().toISOString().slice(0, 10), pick = [];
    [helped, unseen, solid].forEach(function (list, n) {
      shuffled(list, reader + day + n).forEach(function (o) { if (pick.length < (n ? 10 : 7)) pick.push(o.x); });
    });
    // Interleave: never two from the same lesson in a row where it can be helped.
    var out = [];
    while (pick.length) {
      var last = out.length ? out[out.length - 1].sec : null;
      var k = pick.findIndex(function (o) { return o.sec !== last; });
      out.push(pick.splice(k < 0 ? 0 : k, 1)[0]);
    }
    return {
      reader: reader, sec: "review", title: "Unit review",
      blurb: "Mixed from every lesson — the ones you needed help with first.",
      steps: out.map(function (o) { return o.s; }), review: true
    };
  }
  function progressOf(path) {
    var probs = path.steps.filter(isProblem);
    var solved = 0, first = 0;
    probs.forEach(function (s) {
      var r = result(s.id);
      if (r && r.solved) solved++;
      if (r && r.first) first++;
    });
    return { total: probs.length, solved: solved, first: first };
  }

  /* ========================================================= Drag & drop
     One helper for every card that can be moved. A drag that ends over a
     [data-drop] calls `drop`; a press that doesn't move is a tap, left to the
     card's own click handler. */
  function draggable(card, drop) {
    var start = null, ghost = null, moved = false;
    card.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || card.disabled) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      moved = false;
    });
    card.addEventListener("pointermove", function (e) {
      if (!start || e.pointerId !== start.id) return;
      if (!moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 7) return;
      if (!moved) {
        moved = true;
        try { card.setPointerCapture(e.pointerId); } catch (x) { /* older browsers */ }
        var r = card.getBoundingClientRect();
        ghost = card.cloneNode(true);
        ghost.className += " ch-ghost";
        ghost.style.width = r.width + "px";
        ghost.style.left = r.left + "px";
        ghost.style.top = r.top + "px";
        ghost.dataset.dx = String(start.x - r.left);
        ghost.dataset.dy = String(start.y - r.top);
        document.body.appendChild(ghost);
        card.classList.add("ch-lifted");
      }
      ghost.style.left = (e.clientX - +ghost.dataset.dx) + "px";
      ghost.style.top = (e.clientY - +ghost.dataset.dy) + "px";
      var over = hit(e.clientX, e.clientY);
      [].forEach.call(document.querySelectorAll(".ch-over"), function (n) { if (n !== over) n.classList.remove("ch-over"); });
      if (over) over.classList.add("ch-over");
    });
    function end(e) {
      if (!start) return;
      var was = moved;
      start = null;
      if (!was) return;
      var target = hit(e.clientX, e.clientY);
      if (ghost) ghost.remove();
      ghost = null;
      card.classList.remove("ch-lifted");
      [].forEach.call(document.querySelectorAll(".ch-over"), function (n) { n.classList.remove("ch-over"); });
      card.dataset.dragged = "1";
      setTimeout(function () { delete card.dataset.dragged; }, 0);
      if (target) drop(target);
    }
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", end);
    function hit(x, y) {
      var n = document.elementFromPoint(x, y);
      return n && n.closest ? n.closest("[data-drop]") : null;
    }
  }

  /* ========================================================= Interactions
     Each returns { el, ready(), check() → { ok, say }, reveal(), onChange }.
     `check` also marks what is wrong on screen; `reveal` shows the answer. */
  var KINDS = {};

  KINDS.choice = function (s, seed) {
    var box = el("div", "ch-options"), picked = null, api = {};
    var order = s.keep ? s.options.map(function (x, k) { return { x: x, k: k }; }) : shuffled(s.options, seed);
    order.forEach(function (o) {
      var b = button("ch-opt", '<span class="ch-mark" aria-hidden="true"></span><span>' + o.x.t + "</span>");
      b.dataset.k = o.k;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        if (b.disabled) return;
        picked = o.k;
        [].forEach.call(box.children, function (c) { c.setAttribute("aria-pressed", String(c === b)); c.classList.toggle("on", c === b); });
        api.onChange();
      });
      box.appendChild(b);
    });
    api.el = box;
    api.ready = function () { return picked != null; };
    api.check = function () {
      var ok = picked === s.answer;
      var b = box.querySelector('[data-k="' + picked + '"]');
      if (ok) { b.classList.add("yes"); lock(); }
      else { b.classList.add("no"); b.disabled = true; b.classList.remove("on"); picked = null; }
      return { ok: ok, say: ok ? null : (s.options[+b.dataset.k].fb || null) };
    };
    api.reveal = function () {
      [].forEach.call(box.children, function (c) {
        c.classList.remove("on");
        if (+c.dataset.k === s.answer) c.classList.add("yes");
      });
      lock();
    };
    function lock() { [].forEach.call(box.children, function (c) { c.disabled = true; }); }
    return api;
  };

  KINDS.multi = function (s, seed) {
    var box = el("div", "ch-options multi"), on = {}, api = {};
    shuffled(s.options, seed).forEach(function (o) {
      var b = button("ch-opt", '<span class="ch-box" aria-hidden="true"></span><span>' + o.x.t + "</span>");
      b.dataset.k = o.k;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        if (b.disabled) return;
        on[o.k] = !on[o.k];
        b.classList.toggle("on", !!on[o.k]);
        b.classList.remove("no");
        b.setAttribute("aria-pressed", String(!!on[o.k]));
        api.onChange();
      });
      box.appendChild(b);
    });
    api.el = box;
    api.ready = function () { return Object.keys(on).some(function (k) { return on[k]; }); };
    api.check = function () {
      var wrongPick = null, missing = 0, bad = 0;
      s.options.forEach(function (o, k) {
        var b = box.querySelector('[data-k="' + k + '"]');
        if (on[k] && !o.ok) { bad++; b.classList.add("no"); if (!wrongPick) wrongPick = o; }
        if (!on[k] && o.ok) missing++;
      });
      var ok = !bad && !missing;
      if (ok) { [].forEach.call(box.children, function (c) { if (on[c.dataset.k]) c.classList.add("yes"); c.disabled = true; }); }
      var say = ok ? null : wrongPick && wrongPick.fb ? wrongPick.fb
        : missing ? (missing === 1 ? "Everything you picked is right — but one more belongs." :
                     "Everything you picked is right — but " + missing + " more belong.") : null;
      if (!ok && wrongPick && missing) say += " (And " + (missing === 1 ? "one more belongs." : missing + " more belong.") + ")";
      return { ok: ok, say: say };
    };
    api.reveal = function () {
      [].forEach.call(box.children, function (c) {
        var o = s.options[+c.dataset.k];
        c.classList.remove("no", "on");
        if (o.ok) c.classList.add("yes");
        c.disabled = true;
      });
    };
    return api;
  };

  /* Cards that go somewhere: sort (into bins) and slots (onto a diagram or
     against labels). A slot holds one card; a bin holds any number. */
  function placer(s, seed, opts) {
    var api = {}, where = {}, selected = null;
    var root = el("div", "ch-place " + (opts.kind === "slots" ? "is-slots " + (s.board ? "is-board" : "is-rows") : "is-sort"));
    var tray = el("div", "ch-tray");
    tray.dataset.drop = "tray";
    tray.setAttribute("aria-label", "Cards to place");
    var cards = {};
    shuffled(s.cards, seed).forEach(function (o) {
      var c = button("ch-cardlet", o.x.t);
      c.dataset.k = o.k;
      c.setAttribute("aria-pressed", "false");
      c.addEventListener("click", function () {
        if (c.dataset.dragged || c.disabled) return;
        // Another card is in hand and this one is already placed: the one in
        // hand goes where this one is (a slot swaps it out; a bin just adds).
        if (selected != null && selected !== o.k && where[o.k] != null) { put(selected, where[o.k]); return; }
        select(selected === o.k ? null : o.k);
      });
      c.addEventListener("keydown", function (e) {
        if ((e.key === "Backspace" || e.key === "Delete") && where[o.k] != null && !c.disabled) {
          e.preventDefault();
          put(o.k, "tray");
          c.focus();
        }
        if (e.key === "Escape" && selected != null) select(null);
      });
      draggable(c, function (target) { put(o.k, target.dataset.drop); });
      cards[o.k] = c;
      tray.appendChild(c);
    });
    var targets = {};
    function select(k) {
      selected = k;
      Object.keys(cards).forEach(function (id) {
        cards[id].classList.toggle("sel", +id === k);
        cards[id].setAttribute("aria-pressed", String(+id === k));
      });
      root.classList.toggle("picking", k != null);
    }
    function put(k, dest) {
      if (dest == null) return;
      var c = cards[k];
      c.classList.remove("no");
      if (dest === "tray") { tray.appendChild(c); delete where[k]; }
      else {
        if (opts.single) {
          // A slot holds one card: whatever was there goes back to the tray.
          Object.keys(where).forEach(function (other) {
            if (where[other] === dest && +other !== k) { tray.appendChild(cards[other]); delete where[other]; }
          });
        }
        targets[dest].holder.appendChild(c);
        where[k] = dest;
      }
      select(null);
      refresh();
      api.onChange();
    }
    function refresh() {
      tray.classList.toggle("empty", !tray.querySelector(".ch-cardlet"));
      Object.keys(targets).forEach(function (id) {
        var t = targets[id], full = !!t.holder.querySelector(".ch-cardlet");
        t.el.classList.toggle("filled", full);
        if (t.slot) t.slot.hidden = full;
      });
    }
    /* A bin's name is its button. A slot shows an empty, labelled place to
       press until a card fills it; after that, pressing the card in it swaps. */
    function target(id, labelHtml, extraCls, aria) {
      var t = el("div", "ch-target " + (extraCls || ""));
      t.dataset.drop = id;
      var holder = el("div", "ch-holder"), slot = null;
      var name = aria || String(labelHtml || "").replace(/<[^>]+>/g, "");
      if (opts.single) {
        if (labelHtml) t.appendChild(el("div", "ch-target-label", labelHtml));
        slot = button("ch-slot", '<span aria-hidden="true">' + (s.board ? "" : "Drop a card here") + "</span>");
        slot.setAttribute("aria-label", "Place the chosen card at " + name);
        slot.addEventListener("click", function () {
          if (selected != null) put(selected, id);
          else { var first = tray.querySelector(".ch-cardlet"); if (first) first.focus(); }
        });
        holder.appendChild(slot);
      } else {
        var head = button("ch-target-head", labelHtml);
        head.setAttribute("aria-label", "Put the chosen card in " + name);
        head.addEventListener("click", function () { if (selected != null) put(selected, id); });
        t.appendChild(head);
      }
      t.appendChild(holder);
      t.addEventListener("click", function (e) {
        if (selected != null && (e.target === t || e.target === holder || e.target.classList.contains("ch-target-label"))) put(selected, id);
      });
      targets[id] = { el: t, holder: holder, slot: slot };
      return t;
    }
    if (opts.kind === "sort") {
      var bins = el("div", "ch-bins");
      bins.style.setProperty("--n", s.bins.length);
      s.bins.forEach(function (b, i) { bins.appendChild(target(String(i), esc(b))); });
      root.appendChild(bins);
    } else if (s.board) {
      var board = el("div", "ch-board");
      board.innerHTML = s.board.svg;
      board.style.aspectRatio = s.board.ratio || "2 / 1";
      s.slots.forEach(function (sl) {
        var t = target(sl.id, sl.label || "", "on-board", sl.aria);
        t.style.left = sl.x + "%";
        t.style.top = sl.y + "%";
        if (sl.w) t.style.width = sl.w + "%";
        board.appendChild(t);
      });
      root.appendChild(board);
    } else {
      var rows = el("div", "ch-rows");
      s.slots.forEach(function (sl) { rows.appendChild(target(sl.id, sl.label, "row", sl.aria)); });
      root.appendChild(rows);
    }
    root.appendChild(tray);
    tray.addEventListener("click", function (e) {
      if (e.target === tray && selected != null) put(selected, "tray");
    });

    function goal(k) {
      var o = s.cards[k];
      return opts.kind === "sort" ? String(o.bin) : o.slot == null ? null : String(o.slot);
    }
    api.el = root;
    api.ready = function () {
      if (opts.kind === "sort") return Object.keys(where).length === s.cards.length;
      // Every slot filled (distractor cards may stay in the tray).
      return s.slots.every(function (sl) {
        return Object.keys(where).some(function (k) { return where[k] === sl.id; });
      });
    };
    api.check = function () {
      var wrong = [];
      Object.keys(cards).forEach(function (k) {
        var placed = where[k] || null, want = goal(+k);
        var bad = opts.kind === "sort" ? placed !== want : placed != null && placed !== want;
        cards[k].classList.toggle("no", bad);
        if (bad) wrong.push(+k);
      });
      var ok = !wrong.length && api.ready();
      if (ok) lock();
      var fb = wrong.map(function (k) { return s.cards[k].fb; }).filter(Boolean)[0];
      var count = wrong.length === 1 ? "One card is in the wrong place — it's marked." :
        wrong.length + " cards are in the wrong place — they're marked.";
      return {
        ok: ok,
        say: ok ? null : !wrong.length ? "Every card you placed is right — but a place is still empty." :
          fb ? (wrong.length > 1 ? count + " " : "") + fb : count
      };
    };
    api.reveal = function () {
      Object.keys(cards).forEach(function (k) {
        var want = goal(+k);
        if (want != null) put(+k, want); else put(+k, "tray");
        cards[k].classList.remove("no");
      });
      lock();
    };
    function lock() { Object.keys(cards).forEach(function (k) { cards[k].disabled = true; cards[k].classList.add("ok"); }); }
    return api;
  }
  KINDS.sort = function (s, seed) { return placer(s, seed, { kind: "sort" }); };
  KINDS.slots = function (s, seed) { return placer(s, seed, { kind: "slots", single: true }); };

  KINDS.order = function (s, seed) {
    var api = {}, seq = shuffled(s.items, seed);
    var list = el("ol", "ch-order");
    function paint(focusK, dir) {
      list.innerHTML = "";
      seq.forEach(function (o, n) {
        var li = el("li", "ch-step");
        li.dataset.k = o.k;
        var grip = el("span", "ch-grip", icon(I.grip));
        li.appendChild(grip);
        li.appendChild(el("span", "ch-n", String(n + 1)));
        li.appendChild(el("span", "ch-item", o.x));
        var up = button("ch-mv", icon(I.up));
        up.disabled = n === 0;
        up.setAttribute("aria-label", "Move up");
        up.addEventListener("click", function () { move(n, -1); });
        var dn = button("ch-mv", icon(I.down));
        dn.disabled = n === seq.length - 1;
        dn.setAttribute("aria-label", "Move down");
        dn.addEventListener("click", function () { move(n, 1); });
        li.appendChild(up);
        li.appendChild(dn);
        dragRow(li, grip);
        list.appendChild(li);
      });
      if (focusK != null) {
        var row = list.querySelector('[data-k="' + focusK + '"]');
        var b = row && row.querySelectorAll(".ch-mv")[dir < 0 ? 0 : 1];
        if (b && !b.disabled) b.focus(); else if (row) row.querySelector(".ch-mv:not(:disabled)").focus();
      }
    }
    function move(n, d) {
      var t = seq[n];
      seq[n] = seq[n + d];
      seq[n + d] = t;
      paint(t.k, d);
      api.onChange();
    }
    // Drag a row by its grip: it follows the pointer and the list reorders
    // under it as it passes each row's middle.
    function dragRow(li, grip) {
      var active = false;
      grip.addEventListener("pointerdown", function (e) {
        if (list.classList.contains("done")) return;
        active = true;
        try { grip.setPointerCapture(e.pointerId); } catch (x) { /* older browsers */ }
        li.classList.add("dragging");
        e.preventDefault();
      });
      grip.addEventListener("pointermove", function (e) {
        if (!active) return;
        var rows = [].slice.call(list.children);
        var from = rows.indexOf(li), to = from;
        rows.forEach(function (r, i) {
          var b = r.getBoundingClientRect(), mid = b.top + b.height / 2;
          if (i < from && e.clientY < mid) to = Math.min(to, i);
          if (i > from && e.clientY > mid) to = Math.max(to, i);
        });
        if (to !== from) {
          var item = seq.splice(from, 1)[0];
          seq.splice(to, 0, item);
          if (to > from) list.insertBefore(li, rows[to].nextSibling); else list.insertBefore(li, rows[to]);
          [].forEach.call(list.children, function (r, i) { r.querySelector(".ch-n").textContent = String(i + 1); });
        }
      });
      function stop() {
        if (!active) return;
        active = false;
        li.classList.remove("dragging");
        paint();
        api.onChange();
      }
      grip.addEventListener("pointerup", stop);
      grip.addEventListener("pointercancel", stop);
    }
    paint();
    api.el = list;
    api.ready = function () { return true; };
    api.check = function () {
      var right = 0;
      while (right < seq.length && seq[right].k === right) right++;
      [].forEach.call(list.children, function (r) { r.classList.remove("no"); });
      if (right === seq.length) { lock(); return { ok: true }; }
      list.children[right].classList.add("no");
      return { ok: false, say: (right ? "The first " + (right === 1 ? "one is" : right + " are") + " right. " : "") +
        "Position " + (right + 1) + " is where it goes wrong." + (s.nudge ? " " + s.nudge : "") };
    };
    api.reveal = function () {
      seq = s.items.map(function (x, k) { return { x: x, k: k }; });
      paint();
      lock();
    };
    function lock() {
      list.classList.add("done");
      [].forEach.call(list.querySelectorAll(".ch-mv"), function (b) { b.disabled = true; });
    }
    return api;
  };

  KINDS.spot = function (s) {
    var api = {}, on = {};
    var box = el("div", "ch-spot");
    s.parts.forEach(function (t, k) {
      var b = button("ch-seg", t);
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        if (b.disabled) return;
        if (!s.many) Object.keys(on).forEach(function (x) { on[x] = false; });
        on[k] = !on[k];
        [].forEach.call(box.children, function (c, i) {
          c.classList.toggle("on", !!on[i]);
          c.classList.remove("no");
          c.setAttribute("aria-pressed", String(!!on[i]));
        });
        api.onChange();
      });
      box.appendChild(b);
      box.appendChild(document.createTextNode(" "));
    });
    var segs = function () { return [].slice.call(box.querySelectorAll(".ch-seg")); };
    api.el = box;
    api.ready = function () { return Object.keys(on).some(function (k) { return on[k]; }); };
    api.check = function () {
      var want = s.answer, badK = null, ok = true;
      segs().forEach(function (c, k) {
        var should = want.indexOf(k) > -1;
        if (!!on[k] !== should) { ok = false; if (on[k]) { c.classList.add("no"); if (badK == null) badK = k; } }
      });
      if (ok) segs().forEach(function (c, k) { c.disabled = true; if (on[k]) c.classList.add("yes"); });
      var fb = badK != null && s.fb && s.fb[badK];
      return { ok: ok, say: ok ? null : fb || (badK == null ? "Close — there's more to find." : null) };
    };
    api.reveal = function () {
      segs().forEach(function (c, k) { c.disabled = true; c.classList.remove("no", "on"); if (s.answer.indexOf(k) > -1) c.classList.add("yes"); });
    };
    return api;
  };

  /* A number as a person types it: 12, -3.5, 3/4, -1 1/2, 2,5. */
  function readNum(t) {
    t = String(t || "").trim().replace(/\u2212/g, "-").replace(/\s+/g, " ");
    if (!t) return NaN;
    var m = /^(-?)(\d+) (\d+)\/(\d+)$/.exec(t);
    if (m) return (m[1] ? -1 : 1) * (+m[2] + +m[3] / +m[4]);
    m = /^(-?\d*\.?\d+)\s*\/\s*(-?\d*\.?\d+)$/.exec(t);
    if (m) return +m[2] === 0 ? NaN : +m[1] / +m[2];
    if (/^-?\d+,\d+$/.test(t)) t = t.replace(",", ".");
    return /^-?(\d+\.?\d*|\.\d+)$/.test(t) ? parseFloat(t) : NaN;
  }

  KINDS.number = function (s) {
    var api = {};
    var wrap = el("label", "ch-num");
    var inp = el("input");
    inp.type = "text";
    inp.inputMode = "decimal";
    inp.autocomplete = "off";
    inp.setAttribute("aria-label", s.label || "Your answer");
    wrap.appendChild(inp);
    if (s.unit) wrap.appendChild(el("span", "ch-unit", esc(s.unit)));
    inp.addEventListener("input", function () { wrap.classList.remove("no"); api.onChange(); });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && api.ready()) api.onEnter(); });
    api.el = wrap;
    api.ready = function () { return isFinite(readNum(inp.value)); };
    api.check = function () {
      var v = readNum(inp.value);
      var ok = Math.abs(v - s.answer) <= (s.tol || 1e-9);
      wrap.classList.toggle("no", !ok);
      if (ok) { wrap.classList.add("yes"); inp.disabled = true; }
      var near = (s.near || []).filter(function (n) { return Math.abs(v - n.v) <= (n.tol || 0); })[0];
      return { ok: ok, say: ok ? null : near ? near.fb : null };
    };
    api.reveal = function () { inp.value = s.shown || String(s.answer); inp.disabled = true; wrap.classList.remove("no"); wrap.classList.add("yes"); };
    api.focus = function () { inp.focus(); };
    return api;
  };

  KINDS.explain = function (s) {
    var api = {}, stage = "write";
    var box = el("div", "ch-explain");
    var ta = el("textarea", "ch-ta");
    ta.rows = 4;
    ta.placeholder = s.placeholder || "In your own words…";
    ta.setAttribute("aria-label", "Your explanation");
    ta.addEventListener("input", function () { api.onChange(); });
    box.appendChild(ta);
    api.el = box;
    api.checkLabel = "Compare";
    api.ready = function () { return ta.value.trim().split(/\s+/).length >= 4; };
    api.check = function () {
      // No machine marks a student's own words. They see a model answer and
      // say honestly whether theirs had it — the comparison is the learning.
      ta.readOnly = true;
      stage = "rate";
      return { rate: true, model: s.model };
    };
    api.reveal = function () { ta.readOnly = true; };
    api.focus = function () { ta.focus(); };
    return api;
  };

  /* =============================================================== Player */
  var P = null;   // the path being played

  function play(host, opts) {
    useAccount(opts.me);
    var path = opts.path ? Object.assign({}, opts.path, { steps: opts.path.steps.slice() })
      : opts.sec === "review" ? reviewPath(opts.reader) : lessonPath(opts.reader, opts.sec);
    dispose();
    host.innerHTML = "";
    if (!path || !path.steps.length) {
      host.appendChild(el("div", "ch-none", "<b>No challenge here yet.</b><p>This lesson's challenge is still being written.</p>"));
      return;
    }
    if (opts.only) path.steps = path.steps.filter(function (s) { return opts.only.indexOf(s.id) > -1; });

    var root = el("div", "ch");
    var top = el("header", "ch-top");
    top.innerHTML = '<div class="ch-title"><span class="ch-eyebrow">' + icon(I.spark) +
      "<span>" + (path.eyebrow ? esc(path.eyebrow) : path.review ? "Unit review" : "Challenge · " + esc(path.sec)) + "</span></span>" +
      "<b>" + esc(path.title) + "</b></div>";
    var bar = el("div", "ch-prog");
    bar.setAttribute("aria-hidden", "true");
    path.steps.forEach(function () { bar.appendChild(el("i")); });
    top.appendChild(bar);
    root.appendChild(top);
    var stage = el("div", "ch-stage");
    root.appendChild(stage);
    var live = el("div", "sr");
    live.setAttribute("aria-live", "polite");
    root.appendChild(live);
    host.appendChild(root);

    P = { path: path, opts: opts, root: root, stage: stage, bar: bar, live: live, ix: 0, session: {}, order: [], slip: {} };

    // Start at the first step not yet done, unless it has all been done —
    // then it is a fresh run.
    var firstOpen = path.steps.findIndex(function (s) {
      var r = result(s.id);
      return !(r && (r.solved || (s.type === "learn" && r.seen)));
    });
    // A review or a retry is always a fresh run from the top.
    P.fresh = !!(path.review || opts.only || opts.fresh || opts.record === false || firstOpen < 0);
    P.ix = P.fresh ? 0 : firstOpen;
    /* With `nav`, a lesson can be walked back and forth: any step already
       reached, and the one after a step just finished — never past the
       first step not yet done, so a lesson is still finished by doing it.
       A retry of a few of its problems is a plain path of its own. `at`
       opens it on a step already reached. */
    P.nav = !!opts.nav && !opts.only;
    P.reach = firstOpen < 0 ? path.steps.length - 1 : P.ix;
    if (P.nav && opts.at != null) P.ix = Math.max(0, Math.min(opts.at, P.reach));
    paintBar();
    step();
  }

  function isDone(s) {
    var r = P.session[s.id] || result(s.id);
    return !!(r && (r.solved || (s.type === "learn" && r.seen)));
  }
  function paintBar() {
    [].forEach.call(P.bar.children, function (seg, i) {
      var s = P.path.steps[i], r = P.session[s.id] || (!P.fresh && result(s.id));
      seg.className = (i === P.ix ? "cur " : "") +
        (r && (r.solved || r.seen) ? (s.type === "learn" ? "seen" : r.first ? "first" : "helped") : "");
    });
    if (P.pager) {
      var last = P.path.steps.length - 1;
      P.pager.back.disabled = P.ix <= 0;
      P.pager.fwd.disabled = P.ix >= last || P.ix + 1 > P.reach;
      P.pager.back.title = P.ix > 0 ? "Back to " + stepName(P.ix - 1) : "This is the first step";
      P.pager.fwd.title = P.ix >= last ? "This is the last step" : P.ix + 1 > P.reach ? "Finish this step to go on" : "On to " + stepName(P.ix + 1);
    }
    if (P.nav && P.opts.onStep) P.opts.onStep({ ix: P.ix, reach: P.reach, done: P.path.steps.map(isDone) });
  }
  // What each step is called, the kicker shortened: a lesson step by its
  // heading, a problem by its number.
  function names(steps) {
    var n = 0;
    return steps.map(function (s) { return isProblem(s) ? "Problem " + (++n) : s.kicker || "The idea"; });
  }
  function stepName(i) { return names(P.path.steps)[i]; }
  // The step after one just finished can be reached without the Continue.
  function opened() { P.reach = Math.max(P.reach, Math.min(P.ix + 1, P.path.steps.length - 1)); }
  // False when the path being played can't be walked (a retry round).
  function goTo(i) {
    if (!P || !P.nav) return false;
    if (i < 0 || i > P.reach || i === P.ix) return true;
    P.ix = i;
    step();
    toTop();
    return true;
  }
  /* Back and forward, top right of the card: Mail's arrows between
     messages. The step count is the kicker's to say. */
  function pager(card) {
    if (!P.nav) { P.pager = null; return; }
    var box = el("nav", "ch-pager");
    box.setAttribute("aria-label", "Steps");
    var back = button("ch-pg", icon(I.left)), fwd = button("ch-pg", icon(I.fwd));
    // Not "Next step": a worked example's own button already says that.
    back.setAttribute("aria-label", "Go back a step");
    fwd.setAttribute("aria-label", "Go forward a step");
    // From the keyboard, focus stays on the arrows so they can be pressed
    // again; a click leaves it where the step puts it, so Enter still checks.
    function move(d, e) {
      goTo(P.ix + d);
      if (e.detail === 0 && P.pager) focusSoon(d < 0 && !P.pager.back.disabled ? P.pager.back : P.pager.fwd.disabled ? P.pager.back : P.pager.fwd);
    }
    back.addEventListener("click", function (e) { move(-1, e); });
    fwd.addEventListener("click", function (e) { move(1, e); });
    box.appendChild(back);
    box.appendChild(fwd);
    card.classList.add("paged");
    card.appendChild(box);
    P.pager = { back: back, fwd: fwd };
  }

  /* A step's interactive piece may hold on to things (timers, listeners on
     the window); they are let go when the step is left. */
  var DISPOSE = [];
  function dispose() {
    DISPOSE.splice(0).forEach(function (f) { try { f(); } catch (e) { /* already gone */ } });
  }
  function build(type, spec, seed, mode) {
    var ui = KINDS[type](spec, seed, mode || {});
    if (ui.destroy) DISPOSE.push(ui.destroy);
    return ui;
  }

  function step() {
    var s = P.path.steps[P.ix];
    if (!s) { summary(); return; }
    dispose();
    P.stage.innerHTML = "";
    var card = el("article", "ch-card" + (reduced() ? "" : " in"));
    var probs = P.path.steps.filter(isProblem), n = probs.indexOf(s) + 1;
    var kicker = s.kicker || (s.type === "learn" ? "The idea" : "Problem " + n + " of " + probs.length);
    card.appendChild(el("p", "ch-kind", kicker + (s.skill && s.type !== "learn" ? ' <span>· ' + esc(s.skill) + "</span>" : "")));
    pager(card);
    paintBar();
    var prompt = el("div", "ch-prompt", s.prompt || s.t || "");
    prompt.tabIndex = -1;
    card.appendChild(prompt);

    var foot = el("footer", "ch-foot");
    if (s.type === "learn") {
      if (s.art) card.appendChild(el("div", "ch-art", s.art));
      // A scene to play with: the idea is met by moving something, and a
      // gated scene holds Continue until the move that shows it is made.
      var sc = s.scene && KINDS[s.scene.type] ? build(s.scene.type, Object.assign({ gate: s.gateKind || !!s.gate }, s.scene), s.id, { explore: true }) : null;
      if (sc) card.appendChild(el("div", "ch-work")).appendChild(sc.el);
      if (s.after) card.appendChild(el("div", "ch-after", s.after));
      var go = button("ch-btn primary", (P.ix === P.path.steps.length - 1 ? "Finish" : "Continue") + icon(I.right));
      if (sc && s.gate) {
        go.disabled = !sc.ready();
        sc.onChange = function () {
          var was = go.disabled;
          go.disabled = !sc.ready();
          if (was && !go.disabled && s.then) {
            var t = card.querySelector(".ch-then");
            if (!t) card.insertBefore(el("div", "ch-then" + (reduced() ? "" : " in"), s.then), foot);
          }
        };
      } else if (sc) sc.onChange = function () {};
      go.addEventListener("click", function () {
        note(s.id, { seen: true });
        P.session[s.id] = { seen: true };
        P.order.push({ step: s, seen: true });
        next();
      });
      foot.appendChild(go);
      card.appendChild(foot);
      P.stage.appendChild(card);
      focusSoon(go);
      P.enter = function () { go.click(); };
      return;
    }

    if (s.art) card.appendChild(el("div", "ch-art", s.art));
    // A problem can stand on a scene too: the graph or the balance it is
    // about, live, above the answer.
    if (s.scene && KINDS[s.scene.type]) {
      var scn = build(s.scene.type, s.scene, s.id + "s", { explore: true });
      scn.onChange = function () {};
      card.appendChild(el("div", "ch-work ch-scene")).appendChild(scn.el);
    }
    var ui = build(s.type, s, s.id + (P.path.review ? "r" : "") + (P.opts.round ? "~" + P.opts.round : ""));
    card.appendChild(el("div", "ch-work")).appendChild(ui.el);

    var hints = el("div", "ch-hints");
    card.appendChild(hints);
    var sheet = el("div", "ch-sheet");
    sheet.setAttribute("role", "status");
    card.appendChild(sheet);

    var hintBtn = button("ch-btn ghost ch-hint", icon(I.bulb) + "<span>Hint</span>");
    var showBtn = button("ch-btn ghost ch-show", icon(I.eye) + "<span>Show me</span>");
    showBtn.hidden = true;
    var check = button("ch-btn primary", ui.checkLabel || "Check");
    check.disabled = !ui.ready();
    var left = el("div", "ch-foot-l");
    left.appendChild(hintBtn);
    left.appendChild(showBtn);
    foot.appendChild(left);
    foot.appendChild(check);
    card.appendChild(foot);
    P.stage.appendChild(card);

    var st = { tries: 0, hints: 0, done: false };
    hintBtn.hidden = !(s.hints && s.hints.length);
    ui.onChange = function () { check.disabled = !ui.ready(); clearSheet(); };
    ui.onEnter = function () { if (!check.disabled) check.click(); };

    hintBtn.addEventListener("click", function () {
      if (st.hints >= s.hints.length) return;
      var h = el("p", "ch-hintline" + (reduced() ? "" : " in"),
        '<b>Hint ' + (st.hints + 1) + (s.hints.length > 1 ? " of " + s.hints.length : "") + ".</b> " + s.hints[st.hints]);
      hints.appendChild(h);
      st.hints++;
      P.slip[s.id] = true;
      hintBtn.querySelector("span").textContent = st.hints < s.hints.length ? "Another hint" : "No more hints";
      hintBtn.disabled = st.hints >= s.hints.length;
      // Out of hints on a puzzle that only lets you check a solved state:
      // the worked answer is the next help there is.
      if (st.hints >= s.hints.length && check.disabled) showBtn.hidden = false;
      note(s.id, { hints: Math.max((result(s.id) || {}).hints || 0, st.hints) });
      P.live.textContent = h.textContent;
    });

    showBtn.addEventListener("click", function () {
      ui.reveal();
      st.done = true;
      record(false, true);
      done(false);
    });

    check.addEventListener("click", function () {
      if (st.done) { next(); return; }
      var r = ui.check();
      if (r.rate) { rate(r.model); return; }
      st.tries++;
      // A piece that was solved with slips along the way (a wrong tap on the
      // order-of-operations board) is right, but not right first time.
      if (r.ok && r.helped) st.hints = Math.max(st.hints, 1);
      tried(r.ok && !r.helped);
      if (r.ok) {
        st.done = true;
        record(true);
        done(true);
      } else {
        say("no", "<b>Not quite.</b> " + (r.say || s.nudge || "Look again — and try a hint if you're stuck."));
        check.disabled = !ui.ready();
        if (st.tries >= 2) showBtn.hidden = false;
      }
    });

    /* The first attempt ever made at a problem is kept apart from the rest:
       it is the honest measure of what the reading taught. `last` says
       whether the latest solve was clean, so the review can let go of a
       problem once it has been solved without help. */
    function tried(ok) {
      // A slip or a hint stays with the problem for the sitting, even when
      // it is left and come back to: coming back is not a first try.
      if (!ok) P.slip[s.id] = true;
      var prev = result(s.id) || {};
      var patch = { tries: (prev.tries || 0) + 1 };
      if (!prev.firstAt) { patch.firstAt = Date.now(); patch.first = ok && st.hints === 0; }
      note(s.id, patch);
    }
    function record(ok, shown) {
      var clean = ok && !shown && st.tries === 1 && st.hints === 0 && !P.slip[s.id];
      var prev = result(s.id) || {};
      note(s.id, { solved: true, last: clean, shown: !!(prev.shown || shown), firstAt: prev.firstAt || Date.now(),
                   first: prev.firstAt ? !!prev.first : clean });
      /* In a lesson walked back and forth, a problem is summed up by where
         it stands — solved cleanly the first time, or cleanly since — so
         going back to one is review, and a slip then takes nothing away. */
      P.session[s.id] = { solved: true, first: P.nav ? !shaky(s.id) : clean, shown: !!shown };
      P.order.push({ step: s, ok: !!ok, first: clean, shown: !!shown, tries: st.tries, hints: st.hints });
      if (P.opts.onResult) P.opts.onResult(s, P.session[s.id]);
      opened();
      paintBar();
    }
    function done(ok) {
      hintBtn.hidden = true;
      showBtn.hidden = true;
      var why = s.why ? '<p class="ch-why">' + s.why + "</p>" : "";
      say(ok ? "ok" : "shown",
        (ok ? "<b>" + (st.tries === 1 && !st.hints ? "Right." : "Right — you got there.") + "</b>"
            : "<b>Here's the answer.</b> " + (P.opts.shownNote || (P.opts.path ? "Read it through, then keep going." :
              "It will come back in the unit review."))) + why);
      armNext();
    }
    function armNext() {
      check.hidden = false;
      check.disabled = false;
      check.innerHTML = (P.ix === P.path.steps.length - 1 ? "Finish" : "Continue") + icon(I.right);
      focusSoon(check);
    }
    // No machine marks a student's own words. They see a model answer and
    // say honestly whether theirs had it — the comparison is the learning.
    function rate(model) {
      say("model", '<span class="ch-lbl">One strong answer</span><p>' + model + "</p>" +
        '<p class="ch-rateq">Did yours say that?</p>');
      check.hidden = true;
      hintBtn.hidden = true;
      var row = el("div", "ch-rate");
      ["I had it", "Partly", "Not yet"].forEach(function (label, i) {
        var b = button("ch-btn", label);
        b.addEventListener("click", function () {
          st.tries = 1;
          st.done = true;
          tried(i === 0);
          record(i === 0);
          row.remove();
          sheet.querySelector(".ch-rateq").textContent =
            i === 0 ? "You said yours had it." :
            i === 1 ? "Add the part you missed to your notes — this one comes back in the unit review." :
                      "That's what the review is for — this one will come back.";
          armNext();
        });
        row.appendChild(b);
      });
      sheet.appendChild(row);
      focusSoon(row.firstChild);
    }
    function say(kind, html) {
      sheet.className = "ch-sheet on " + kind + (reduced() ? "" : " in");
      sheet.innerHTML = html;
      P.live.textContent = sheet.textContent;
    }
    function clearSheet() {
      if (st.done) return;
      if (sheet.classList.contains("no")) { sheet.className = "ch-sheet"; sheet.innerHTML = ""; }
    }
    P.enter = function () {
      if (!check.hidden && !check.disabled) check.click();
    };
    focusSoon(ui.focus ? { focus: ui.focus } : prompt);
  }

  function next() {
    opened();
    P.ix++;
    if (P.ix >= P.path.steps.length) { summary(); return; }
    step();
    toTop();
  }
  function toTop() {
    var y = P.root.getBoundingClientRect().top + window.scrollY - 80;
    if (window.scrollY > y) window.scrollTo({ top: y, behavior: reduced() ? "auto" : "smooth" });
  }

  function focusSoon(target) {
    requestAnimationFrame(function () { if (target && target.focus) target.focus({ preventScroll: true }); });
  }

  /* §43, §45, §46: a completion that says what was shown and what to look at
     again — honest, specific, and no confetti. */
  function summary() {
    P.ix = P.path.steps.length;
    P.pager = null;
    paintBar();
    dispose();
    if (P.opts.onFinish) P.opts.onFinish(P.order, P.path);
    if (P.opts.summary) {
      P.stage.innerHTML = "";
      var own = el("article", "ch-card ch-end" + (reduced() ? "" : " in"));
      P.opts.summary(own, P.order, P.path);
      P.stage.appendChild(own);
      P.live.textContent = own.textContent;
      P.enter = null;
      focusSoon(own.querySelector(".primary") || own.querySelector("button"));
      return;
    }
    var steps = P.path.steps.filter(isProblem);
    var clean = [], helped = [];
    steps.forEach(function (s) {
      // Solved in an earlier sitting of the same path: that sitting counts —
      // in a lesson walked back and forth too, where steps can be skipped past.
      var r = P.session[s.id], old = (!P.fresh || P.nav) && !P.opts.only && result(s.id);
      if (!r && old && old.solved) r = { first: !shaky(s.id) };
      if (!r) return;
      (r.first ? clean : helped).push(s);
    });
    var skills = function (list) {
      var seen = {};
      return list.map(function (s) { return s.skill; }).filter(function (k) {
        if (!k || seen[k]) return false;
        seen[k] = true;
        return true;
      });
    };
    P.stage.innerHTML = "";
    var card = el("article", "ch-card ch-end" + (reduced() ? "" : " in"));
    card.appendChild(el("div", "ch-endmark", '<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"/>' +
      '<path d="m16 27 7 7 13-15"/></svg>'));
    pager(card);
    paintBar();
    card.appendChild(el("h2", "ch-endh", P.path.endTitle || (P.path.review ? "Review done." : "Challenge complete.")));
    card.appendChild(el("p", "ch-endsum", clean.length + " of " + steps.length + " solved first try, without a hint."));
    var two = el("div", "ch-endcols");
    var a = skills(clean), b = skills(helped);
    if (a.length) two.appendChild(el("section", "ch-endcol good", "<h3>You showed you can</h3><ul>" +
      a.map(function (k) { return "<li>" + icon(I.check) + "<span>" + esc(k) + "</span></li>"; }).join("") + "</ul>"));
    if (b.length) two.appendChild(el("section", "ch-endcol again", "<h3>Worth another look</h3><ul>" +
      b.map(function (k) { return "<li>" + icon(I.again) + "<span>" + esc(k) + "</span></li>"; }).join("") + "</ul>"));
    card.appendChild(two);
    var acts = el("div", "ch-endacts");
    if (helped.length) {
      var again = button("ch-btn", icon(I.again) + "<span>Try those " + helped.length + " again</span>");
      again.addEventListener("click", function () {
        var only = helped.map(function (s) { return s.id; });
        play(P.opts.host, Object.assign({}, P.opts, { only: only, round: (P.opts.round || 0) + 1 }));
      });
      acts.appendChild(again);
    }
    (P.opts.after || []).forEach(function (x, i) {
      var go = button("ch-btn" + (i === 0 ? " primary" : ""), "<span>" + esc(x.label) + "</span>" + icon(I.right));
      go.addEventListener("click", x.go);
      acts.appendChild(go);
    });
    card.appendChild(acts);
    P.stage.appendChild(card);
    P.live.textContent = card.textContent;
    P.enter = null;
    var first = acts.querySelector(".primary") || acts.querySelector("button");
    focusSoon(first);
  }

  // Enter moves on when nothing else wants it — never from inside a text box.
  document.addEventListener("keydown", function (e) {
    // A path left on another screen is still in the page, just hidden.
    if (!P || !P.root.getClientRects().length || e.key !== "Enter" || e.metaKey || e.ctrlKey || e.altKey) return;
    var a = document.activeElement;
    // A focused control handles its own Enter; the number box has its own.
    if (a && /^(TEXTAREA|INPUT|BUTTON|SELECT|A)$/.test(a.tagName)) return;
    if (P.enter) { e.preventDefault(); P.enter(); }
  });

  return {
    has: function (reader, sec) { return !!(DATA[reader] && (sec === "review" ? Object.keys(DATA[reader]).length : DATA[reader][sec])); },
    lessons: function (reader) { return DATA[reader] ? Object.keys(DATA[reader]).sort() : []; },
    progress: function (reader, sec, me) {
      useAccount(me);
      var p = sec === "review" ? null : lessonPath(reader, sec);
      return p ? progressOf(p) : null;
    },
    title: function (reader, sec) { var p = lessonPath(reader, sec); return p ? p.title : null; },
    blurb: function (reader, sec) { var p = lessonPath(reader, sec); return p ? p.blurb : null; },
    play: function (host, opts) { opts.host = host; play(host, opts); },
    // Jump to a step of the path being played, if it has been reached.
    go: function (i) { goTo(i); },
    names: names,
    /* Step types from outside — the math lab's balance, number line and
       plane are ordinary steps to the player. A factory takes the step and a
       seed, and returns { el, ready, check, reveal, focus?, destroy? }. */
    addKind: function (name, factory) { KINDS[name] = factory; },
    readNum: readNum,
    kinds: KINDS,
    stop: function () { dispose(); },
    _merge: merge
  };
})();
