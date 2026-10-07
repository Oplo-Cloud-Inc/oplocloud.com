/* ==========================================================================
   Grade 1 Math on Kern — the steps. See lab/k1kit.js.

   Each kind is an ordinary step to the lesson player: a factory that takes
   the step and returns { el, ready, check, reveal, destroy }.

     g1play    move things about freely; every word the picture can show is
               collected as it is found (an "explore" scene: no Check)
     g1put     put things where the words say, then Check
     g1pick    choose the word (or the picture) that is true; checks itself
     g1tap     tap the things that are, e.g., inside the basket
     g1count   tap to count, then choose how many
     g1sort    put things into boxes: by a rule given, or by any rule at all
     g1paint   pick a crayon, colour the right bogies
     g1seq     tap a bogie: everything before it and after it lights up
     g1story   a little play: things move, a line is read, the next one comes
   ========================================================================== */
(function () {
  "use strict";
  var K = window.OPLO_K1, CH = window.OPLO_CHALLENGE;
  if (!K || !CH || CH.kinds.g1put) return;
  var Scene = K.Scene, G = K.G, VOICE = K.VOICE, el = K.el, button = K.button, later = K.later, esc = K.esc, reduced = K.reduced;
  var REL = G.REL, WORDS = G.WORDS;
  var NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  function many(n) { return n === 1 ? "one" : NUM[n] || String(n); }

  /* A scene in a card, with a line under it that says what is true. */
  function frame(S, o) {
    o = o || {};
    var wrap = el("div", "k1-wrap" + (o.cls ? " " + o.cls : ""));
    var stage = el("div", "k1-stage");
    stage.appendChild(S.svg);
    wrap.appendChild(stage);
    var cap = el("p", "k1-cap");
    cap.setAttribute("aria-live", "polite");
    wrap.appendChild(cap);
    var t = null;
    function say(html, speak) {
      cap.innerHTML = html || "";
      cap.classList.toggle("on", !!html);
      if (html && speak) { clearTimeout(t); t = setTimeout(function () { VOICE.say(html); }, 260); }
    }
    return { wrap: wrap, stage: stage, say: say, cap: cap };
  }
  // What is true of a thing just now, beside one other thing.
  function where(S, T, ref, among, zone) {
    var R = S.id(ref), rel = G.which(T.g, R.g, among);
    if (rel) return G.sentence(T.label, rel, R.label);
    if (T.rest === S.ground) return G.sentence(T.label, "on", S.groundLabel);
    return "";
  }
  function relOK(S, t, id) { return REL[t.rel](S.id(id).g, S.id(t.ref).g, t.zone); }
  function hop(S, ids) {
    if (reduced()) return;
    ids.forEach(function (id) { var n = S.id(id).node.querySelector(".k1-in"); if (!n) return; n.classList.remove("k1-hop"); void n.getBoundingClientRect(); n.classList.add("k1-hop"); });
  }
  function shake(S, ids) {
    if (reduced()) return;
    ids.forEach(function (id) { var n = S.id(id).node.querySelector(".k1-in"); if (!n) return; n.classList.remove("k1-shake"); void n.getBoundingClientRect(); n.classList.add("k1-shake"); });
  }
  function chosen(api) { api.onChange && api.onChange(); }

  /* ================================================================ put */
  /* tasks: [ { item, rel, ref, zone? } | { group: [ids], count, rel, ref, zone? } ] */
  CH.addKind("g1put", function (s, seed, mode) {
    var S = Scene(s.scene), f = frame(S), api = { el: f.wrap, helpAt: 2 }, tasks = s.tasks || [], won = false, fails = 0;
    var among = s.among || null;
    function relOK(S2, t, id) { return REL[t.rel](S2.id(id).g, S2.id(t.ref).g, t.zone) && (!t.within || REL.within(S2.id(id).g, S2.id(t.ref).g, t.within)); }
    function taskOK(t) {
      if (t.group) {
        var n = t.group.filter(function (id) { return relOK(S, t, id); }).length;
        return t.atLeast ? n >= t.count : n === t.count;
      }
      return relOK(S, t, t.item);
    }
    function focusLine(T) {
      var t = tasks.filter(function (x) { return x.item === T.id || (x.group && x.group.indexOf(T.id) > -1); })[0];
      var ref = t ? t.ref : (tasks[0] && tasks[0].ref);
      return ref ? where(S, T, ref, t && t.zone ? null : among) : "";
    }
    S.on("drag", function (T) { f.say(focusLine(T)); });
    S.on("drop", function (T) { f.say(focusLine(T), true); chosen(api); });
    /* Where the things that are not yet right would have to go. */
    function plan() {
      var out = [], used = {};
      // Things that already do what a group task wants stay where they are.
      tasks.forEach(function (t) { if (t.group) t.group.forEach(function (id) { if (relOK(S, t, id)) used[id] = true; }); });
      tasks.forEach(function (t) {
        var R = S.id(t.ref), opts = { zone: t.zone, ground: S.ground, W: S.W };
        if (t.group) {
          var have = t.group.filter(function (id) { return relOK(S, t, id); }), rest = t.group.filter(function (id) { return !used[id]; });
          for (var i = 0; i < t.count - have.length && i < rest.length; i++) {
            opts.n = have.length + i; var p = G.solve(t.rel, S.id(rest[i]).g, R.g, opts); if (p) out.push({ id: rest[i], x: p.x, y: p.y });
            used[rest[i]] = true;
          }
          for (var j = t.count; j < have.length; j++) out.push({ id: have[j], x: S.id(have[j]).home.x, y: S.id(have[j]).home.y });
        } else if (!relOK(S, t, t.item)) {
          opts.n = t.n || 0; var q = G.solve(t.rel, S.id(t.item).g, R.g, opts); if (q) out.push({ id: t.item, x: q.x, y: q.y });
        }
      });
      return out;
    }
    api.solution = function () { return plan(); };
    api.scene = S;
    api.ready = function () { return Object.keys(S.moved).length > 0 && !won; };
    // For tests: the moves that solve it, and one move that is wrong.
    api.key = function () {
      var t = tasks[0], R = S.id(t.ref), id = t.item || t.group[0], T = S.id(id), opp = { on: "under", under: "on", inside: "outside", outside: "inside", above: "below", below: "above", top: "bottom", middle: "top", bottom: "top", near: "far", far: "near" }[t.rel];
      var bad = G.solve(opp, T.g, R.g, { zone: opp === "inside" || opp === "outside" ? undefined : undefined, ground: S.ground, W: S.W });
      return { kind: "put", moves: plan(), wrong: bad ? [{ id: id, x: bad.x, y: bad.y }] : [] };
    };
    function msg(t) {
      var R = S.id(t.ref), rl = t.refName || R.label;
      if (t.group) {
        var n = t.group.filter(function (id) { return relOK(S, t, id); }).length;
        return G.cap("put " + many(t.count) + " " + (t.noun || "things") + " " + G.phrase(t.rel, rl) + ". Now there " + (n === 1 ? "is " : "are ") + (n ? many(n) : "none") + ".");
      }
      var T = S.id(t.item), pl = !!T.spec.plural, it = T.label === "Moti" ? "Moti" : pl ? "them" : "it";
      var now = t.zone ? null : G.which(T.g, R.g, among);
      if (now && now !== t.rel) return G.sentence(T.label, now, rl, pl) + " Put " + it + " " + G.phrase(t.rel, rl) + ".";
      if (T.rest === S.ground && !now && !t.zone) return G.sentence(T.label, "on", S.groundLabel, pl) + " Put " + it + " " + G.phrase(t.rel, rl) + ".";
      return "Put " + (T.label === "Moti" ? "Moti" : pl ? "the " + String(T.label).replace(/^the /, "") : "the " + String(T.label).replace(/^the /, "")) + " " + G.phrase(t.rel, rl) + ".";
    }
    api.check = function () {
      var bad = tasks.filter(function (t) { return !taskOK(t); });
      if (!bad.length) {
        won = true; S.lock(true);
        var all = []; tasks.forEach(function (t) { all = all.concat(t.group || [t.item]); });
        hop(S, all); f.say("");
        return { ok: true };
      }
      fails++;
      var t = bad[0], ids = t.group || [t.item];
      shake(S, ids.filter(function (id) { return !relOK(S, t, id); }));
      if (fails >= 1 && t.rel !== "near" && t.rel !== "far") S.hint(t.ref, t.rel === "above" || t.rel === "below" ? null : (t.zone || (t.rel === "top" || t.rel === "middle" || t.rel === "bottom" ? t.rel : t.rel === "outside" ? "box" : t.rel)), 3000);
      return { ok: false, say: msg(t) };
    };
    api.reveal = function () {
      plan().forEach(function (p) { S.moveTo(p.id, p.x, p.y, { quiet: true }); });
      won = true; S.lock(true);
      hop(S, tasks.reduce(function (a, t) { return a.concat(t.group || [t.item]); }, []));
    };
    api.destroy = function () { S.destroy(); };
    return api;
  });

  /* =============================================================== play
     words: [ { rel, ref, zone?, item? } ]; found when any mover (or `item`) makes it true. */
  CH.addKind("g1play", function (s, seed, mode) {
    var S = Scene(s.scene, { gravity: !!s.toss }), f = frame(S), api = { el: f.wrap }, words = s.words || [], got = {}, tray = el("div", "k1-words");
    var tally = { IN: 0, OUT: 0 };
    words.forEach(function (w, i) {
      var key = w.key || (w.rel + ":" + w.ref);
      w.key = key;
      var chip = el("span", "k1-wd", '<i>' + G.icon(w.rel) + "</i><b>" + esc(w.label || w.rel) + "</b>" + (s.toss ? "<em>0</em>" : ""));
      chip.dataset.w = w.rel; chip.dataset.key = key;
      chip.style.setProperty("--wc", WORDS[w.rel].col);
      tray.appendChild(chip);
    });
    f.wrap.appendChild(tray);
    function mark(w) {
      var chip = tray.querySelector('[data-key="' + w.key + '"]');
      if (!got[w.key]) { got[w.key] = true; chip.classList.add("got"); chip.classList.remove("pop"); void chip.offsetWidth; chip.classList.add("pop"); return true; }
      return false;
    }
    function focusLine(T) {
      var ok = words.filter(function (w) { return (!w.item || w.item === T.id) && REL[w.rel](T.g, S.id(w.ref).g, w.zone); })[0];
      if (ok) return { w: ok, html: G.sentence(T.label, ok.rel, S.id(ok.ref).label) };
      var ref = words[0] && words[0].ref;
      return { w: null, html: ref ? where(S, T, ref, null) : "" };
    }
    function sweep(T, speak) {
      var fl = focusLine(T), fresh = false;
      words.forEach(function (w) {
        S.movers().forEach(function (M) { if ((!w.item || w.item === M.id) && REL[w.rel](M.g, S.id(w.ref).g, w.zone)) { if (mark(w)) fresh = true; } });
      });
      f.say(fl.html, speak);
      if (fresh) chosen(api);
    }
    if (!s.toss) {
      S.on("drag", function (T) { f.say(focusLine(T).html); });
      S.on("drop", function (T) { sweep(T, true); });
    } else {
      S.on("drop", function () { f.say(""); });
      S.on("landed", function (T, wh) {
        var inn = wh === "in", w = words.filter(function (x) { return x.rel === (inn ? "inside" : "outside"); })[0], key = inn ? "IN" : "OUT";
        tally[key]++;
        var chip = tray.querySelector('[data-w="' + (inn ? "inside" : "outside") + '"]');
        if (chip) { chip.querySelector("em").textContent = tally[key]; }
        var fresh = w && mark(w);
        f.say('<b class="k1w k1w-' + (inn ? "in" : "out") + ' big">' + key + "!</b>", false);
        VOICE.say(inn ? "In!" : "Out!");
        if (inn) hop(S, [T.id]); else shake(S, [T.id]);
        if (fresh) chosen(api);
        S.lock(true);
        later(function () { S.lock(false); S.moveTo(T, T.home.x, T.home.y, { quiet: true }); S.moved[T.id] = true; }, 1300);
      });
    }
    api.ready = function () { return words.every(function (w) { return got[w.key]; }); };
    api.key = function () {
      if (s.toss) return { kind: "toss", ballId: S.movers()[0].id };
      var moves = [], mv = S.movers();
      words.forEach(function (w, i) {
        var T = S.id(w.item || mv[0].id), R = S.id(w.ref), p = G.solve(w.rel, T.g, R.g, { zone: w.zone, ground: S.ground, W: S.W, n: 0 });
        if (p) moves.push({ id: T.id, x: p.x, y: p.y, word: w.key });
      });
      return { kind: "play", moves: moves };
    };
    api.scene = S; api.words = words;
    api.destroy = function () { S.destroy(); };
    return api;
  });

  // Small pictures for the ways things can be the same: size, shape.
  var GLYPH = {
    size: '<svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="19" cy="34" r="14" fill="#8d98b3"/><circle cx="43" cy="42" r="7" fill="#b8c1d6"/></svg>',
    shape: '<svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="17" cy="28" r="12" fill="#8d98b3"/><rect x="31" y="16" width="24" height="24" rx="4" fill="#b8c1d6"/></svg>'
  };
  /* ============================================================== pick
     options: [ "on" | { w: "on" } | { id, t: text, scene: spec } ], answer: id or word. */
  CH.addKind("g1pick", function (s, seed, mode) {
    var S = s.scene ? Scene(s.scene) : null, f = S ? frame(S) : null, api = { el: null, helpAt: 2 };
    var wrap = f ? f.wrap : el("div", "k1-wrap");
    api.el = wrap;
    var sent = null;
    if (s.sentence) { sent = el("p", "k1-sent"); wrap.appendChild(sent); }
    var box = el("div", "k1-tiles k1-n" + s.options.length), picked = null, tiles = {}, locked = false;
    var opts = s.options.map(function (o) { return typeof o === "string" ? { id: o, w: o } : Object.assign({ id: o.w }, o); });
    function paintSent() {
      if (!sent) return;
      var o = opts.filter(function (x) { return x.id === picked; })[0];
      var fill = o ? (o.w ? G.chip(o.w) : "<b>" + (o.t || "") + "</b>") : '<span class="k1-blank"></span>';
      sent.innerHTML = s.sentence.replace("{}", fill);
    }
    paintSent();
    opts.forEach(function (o) {
      var b = button("k1-tile" + (o.scene ? " pic" : ""), "");
      b.dataset.id = o.id;
      if (o.w) { b.style.setProperty("--wc", WORDS[o.w] ? WORDS[o.w].col : "#2f6df0"); b.innerHTML = "<i>" + (G.icon(o.w)) + "</i><b>" + esc(o.t || o.w) + "</b>"; }
      else if (o.swatch) { b.innerHTML = '<i class="sw" style="background:' + o.swatch + '"></i><b>' + esc(o.t || o.id) + "</b>"; }
      else if (o.glyph) { b.innerHTML = "<i>" + GLYPH[o.glyph] + "</i><b>" + esc(o.t || o.id) + "</b>"; }
      else if (o.scene) { var m = Scene(o.scene); m.svg.removeAttribute("tabindex"); b.appendChild(m.svg); b.insertAdjacentHTML("beforeend", o.t ? "<b>" + esc(o.t) + "</b>" : ""); b.setAttribute("aria-label", o.alt || o.t || o.id); }
      else b.innerHTML = "<b>" + (o.t || o.id) + "</b>";
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        if (locked || b.disabled) return;
        picked = o.id;
        Object.keys(tiles).forEach(function (k) { tiles[k].classList.toggle("on", k === picked); tiles[k].setAttribute("aria-pressed", String(k === picked)); });
        paintSent();
        if (o.w) VOICE.say(o.w);
        chosen(api);
        if (s.auto !== false) later(function () { if (picked === o.id && !locked && api.onEnter) api.onEnter(); }, 420);
      });
      tiles[o.id] = b; box.appendChild(b);
    });
    wrap.appendChild(box);
    api.ready = function () { return picked != null && !locked; };
    api.check = function () {
      var ok = picked === s.answer, b = tiles[picked];
      if (ok) { b.classList.add("yes"); locked = true; Object.keys(tiles).forEach(function (k) { tiles[k].disabled = true; }); return { ok: true }; }
      b.classList.add("no"); b.disabled = true; b.classList.remove("on");
      var o = opts.filter(function (x) { return x.id === picked; })[0], say = s.fb && s.fb[picked];
      picked = null; paintSent();
      if (say == null) say = o.w ? "That is not " + G.chip(o.w) + ". " + (s.look || "Look again.") : (s.look || "Look again.");
      return { ok: false, say: say };
    };
    api.reveal = function () {
      picked = s.answer; paintSent(); locked = true;
      Object.keys(tiles).forEach(function (k) { tiles[k].classList.toggle("yes", k === s.answer); tiles[k].disabled = true; });
    };
    api.pick = function (id) { tiles[id].click(); };
    api.key = function () { return { kind: "pick", answer: s.answer, wrong: opts.filter(function (o) { return o.id !== s.answer; }).map(function (o) { return o.id; }) }; };
    api.scene = S;
    api.destroy = function () { if (S) S.destroy(); };
    return api;
  });

  /* =============================================================== tap
     targets: ids to tap; what: html "inside the basket" for the feedback. */
  CH.addKind("g1tap", function (s, seed, mode) {
    var S = Scene(s.scene), f = frame(S), api = { el: f.wrap, helpAt: 2 }, on = {}, targets = s.targets || [], multi = s.multi != null ? s.multi : targets.length > 1, locked = false;
    function count() { return Object.keys(on).length; }
    S.on("tap", function (T) {
      if (locked) return;
      if (!multi) { Object.keys(on).forEach(function (id) { S.unmark(id); S.id(id).node.setAttribute("aria-pressed", "false"); delete on[id]; }); }
      if (on[T.id]) { delete on[T.id]; S.unmark(T, multi ? "tick" : "ring"); T.node.setAttribute("aria-pressed", "false"); }
      else { on[T.id] = true; S.mark(T, multi ? "tick" : "ring"); T.node.setAttribute("aria-pressed", "true"); if (!reduced()) { var n = T.node.querySelector(".k1-in"); n.classList.remove("k1-hop"); void n.getBoundingClientRect(); n.classList.add("k1-hop"); } }
      if (s.speakTap) VOICE.say(T.label);
      chosen(api);
      if (!multi && s.auto !== false) later(function () { if (on[T.id] && !locked && api.onEnter) api.onEnter(); }, 420);
    });
    api.ready = function () { return count() > 0 && !locked; };
    api.check = function () {
      var ids = Object.keys(on), extra = ids.filter(function (id) { return targets.indexOf(id) < 0; }), miss = s.any ? (ids.length ? [] : targets) : targets.filter(function (id) { return !on[id]; });
      if (!extra.length && !miss.length) { locked = true; S.lock(true); ids.forEach(function (id) { S.unmark(id); S.mark(id, "ok"); }); hop(S, ids); return { ok: true }; }
      var say;
      if (extra.length) {
        var e = extra[0]; say = (s.fb && s.fb[e]) || (multi ? "One of those is not " + (s.what || "right") + "." : "That is not the one. Look again.");
        extra.forEach(function (id) { S.unmark(id); S.mark(id, "no"); shake(S, [id]); });
        later(function () { if (locked) return; extra.forEach(function (id) { S.unmark(id); delete on[id]; S.id(id).node.setAttribute("aria-pressed", "false"); }); chosen(api); }, 1500);
      } else say = "You found " + (ids.length === 1 ? "one" : many(ids.length)) + ". There " + (targets.length - ids.length === 1 ? "is one more" : "are " + many(targets.length - ids.length) + " more") + (s.what ? " " + s.what : "") + ". Look again.";
      return { ok: false, say: say };
    };
    api.reveal = function () {
      Object.keys(on).forEach(function (id) { S.unmark(id); delete on[id]; });
      targets.forEach(function (id) { on[id] = true; S.mark(id, "ok"); });
      locked = true; S.lock(true); hop(S, targets);
    };
    api.tapIds = function () { return targets.slice(); };
    api.key = function () { return { kind: "tap", ids: s.any ? [targets[0]] : targets.slice(), wrong: S.list.filter(function (T) { return T.role === "tap" && targets.indexOf(T.id) < 0; }).map(function (T) { return T.id; }), single: !multi }; };
    api.scene = S;
    api.destroy = function () { S.destroy(); };
    return api;
  });

  /* ============================================================== count */
  CH.addKind("g1count", function (s, seed, mode) {
    var S = Scene(s.scene), f = frame(S), api = { el: f.wrap, helpAt: 2 }, order = [], picked = null, locked = false, max = s.max || 9;
    var row = el("div", "k1-tiles k1-nums");
    var tiles = {};
    for (var n = s.zero ? 0 : 1; n <= max; n++) {
      (function (n) {
        var b = button("k1-tile num", "<b>" + n + "</b>");
        b.setAttribute("aria-label", String(n));
        b.addEventListener("click", function () {
          if (locked || b.disabled) return;
          picked = n;
          Object.keys(tiles).forEach(function (k) { tiles[k].classList.toggle("on", +k === n); });
          VOICE.say(many(n));
          chosen(api);
          later(function () { if (picked === n && !locked && api.onEnter) api.onEnter(); }, 520);
        });
        tiles[n] = b; row.appendChild(b);
      })(n);
    }
    var again = button("k1-again", "↺ Count again");
    again.addEventListener("click", function () { if (locked) return; order.forEach(function (id) { S.unmark(id); }); order = []; f.say("Tap each one to count it."); });
    S.on("tap", function (T) {
      if (locked) return;
      if (order.indexOf(T.id) > -1) return;
      order.push(T.id); S.mark(T, "num", String(order.length));
      VOICE.say(many(order.length), { queue: false });
      f.say(order.map(function (x, i) { return G.cap(many(i + 1)); }).join(". ") + ".");
    });
    f.wrap.appendChild(again); f.wrap.appendChild(row);
    f.say("Tap each one to count it.");
    api.ready = function () { return picked != null && !locked; };
    api.check = function () {
      if (picked === s.answer) { locked = true; S.lock(true); tiles[picked].classList.add("yes"); Object.keys(tiles).forEach(function (k) { tiles[k].disabled = true; }); return { ok: true }; }
      var b = tiles[picked]; b.classList.add("no"); b.disabled = true; b.classList.remove("on"); picked = null;
      return { ok: false, say: order.length === 0 ? "Tap each one as you count: one, two, three." : order.length !== s.answer ? "You counted " + many(order.length) + (s.what ? " " + s.what : "") + ". Count again, one at a time." : "Count them again, one at a time. Tap each one." };
    };
    api.reveal = function () {
      order.forEach(function (id) { S.unmark(id); }); order = [];
      var ids = s.count || [], k = 0;
      ids.forEach(function (id) { if (k < s.answer) { S.mark(id, "num", String(++k)); order.push(id); } });
      picked = s.answer; locked = true; S.lock(true);
      Object.keys(tiles).forEach(function (k2) { tiles[k2].classList.toggle("yes", +k2 === s.answer); tiles[k2].disabled = true; });
    };
    api.pick = function (n) { tiles[n].click(); };
    api.key = function () { return { kind: "count", ids: s.count || [], n: s.answer, wrongN: s.answer > 1 ? s.answer - 1 : s.answer + 1 }; };
    api.scene = S;
    api.destroy = function () { S.destroy(); };
    return api;
  });

  /* ================================================================ sort
     scene things are movers with attrs { kind, colour, shape, size };
     bins: [ { id, x, y, w, h, label?, sample?: { art, args }, key?: { attr: value } } ];
     rule: "key" (each bin says what goes in it) or "any" (any one reason will do). */
  var ATTRS = ["kind", "colour", "shape", "size"], ATTRW = { kind: "what they are", colour: "colour", shape: "shape", size: "size" };
  CH.addKind("g1sort", function (s, seed, mode) {
    var spec = Object.assign({}, s.scene, { ground: 9999 });
    var S = Scene(spec), f = frame(S), api = { el: f.wrap, helpAt: 2 }, bins = s.bins || [], won = false, rule = s.rule || "key";
    var NS = "http://www.w3.org/2000/svg", binOf = {};
    bins.forEach(function (b) {
      var g = K.svgEl("g", { class: "k1-bin", "data-bin": b.id }, S.L.back);
      K.svgEl("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: 22, class: "k1-binbox" }, g);
      if (b.label) { var t = K.svgEl("text", { x: b.x + b.w / 2, y: b.y + b.h - 10, class: "k1-bintx", "text-anchor": "middle" }, g); t.textContent = b.label; }
      if (b.sample) { var sp = window.OPLO_K1ART.ART[b.sample.art](b.sample.args || {}); var h = K.svgEl("g", { transform: "translate(" + (b.x + b.w / 2 - sp.w * 0.45) + " " + (b.y + 12) + ") scale(.9)", opacity: ".6" }, g); h.innerHTML = sp.back; }
      binOf[b.id] = b;
    });
    function inBin(T) { var c = G.cx(T.g), m = T.g.y + T.g.h / 2; return bins.filter(function (b) { return c >= b.x && c <= b.x + b.w && m >= b.y && m <= b.y + b.h; })[0] || null; }
    function arrange(b) {
      if (!b) return;
      var items = S.movers().filter(function (T) { return T.bin === b.id; }), x = b.x + 14, y = b.y + (b.sample ? 62 : 14), rowH = 0;
      items.forEach(function (T) {
        if (x + T.g.w > b.x + b.w - 10) { x = b.x + 14; y += rowH + 8; rowH = 0; }
        S.set(T, x, y, true); x += T.g.w + 8; rowH = Math.max(rowH, T.g.h);
      });
    }
    S.on("drop", function (T) {
      var was = T.bin, nb = inBin(T);
      T.bin = nb ? nb.id : null;
      if (was && was !== T.bin) arrange(binOf[was]);
      if (nb) arrange(nb);
      f.say("");
      chosen(api);
    });
    var tapped = null;
    S.svg.addEventListener("pointerdown", function (e) {      // tap a thing, then tap a box
      if (S.locked || !S.sel) return;
      var p = S.pt(e), b = bins.filter(function (x) { return p.x >= x.x && p.x <= x.x + x.w && p.y >= x.y && p.y <= x.y + x.h; })[0];
      if (!b) return;
      e.stopPropagation();
      var T = S.sel; S.select(null);
      var was = T.bin; T.bin = b.id;
      if (was && was !== b.id) arrange(binOf[was]);
      arrange(b); S.moved[T.id] = true; chosen(api);
    }, true);
    function attrsOf(list) {
      var ok = [];
      ATTRS.forEach(function (a) {
        if (list.some(function (b) { return b.items.length === 0; })) return;
        var vals = {}, fine = true;
        list.forEach(function (b) {
          var v = b.items.map(function (T) { return T.attrs[a]; });
          if (v.some(function (x) { return x == null; }) || v.some(function (x) { return x !== v[0]; })) fine = false;
          else { if (vals[v[0]]) fine = false; vals[v[0]] = 1; }
        });
        if (fine) ok.push(a);
      });
      return ok;
    }
    api.ready = function () { return S.movers().some(function (T) { return T.bin; }) && !won; };
    api.check = function () {
      var all = S.movers(), loose = all.filter(function (T) { return !T.bin; });
      if (loose.length) { loose.forEach(function (T) { S.mark(T, "no"); setTimeout(function () { S.unmark(T, "no"); }, 1400); shake(S, [T.id]); }); return { ok: false, say: "Put every one in a box. " + (loose.length === 1 ? "One is" : G.cap(many(loose.length)) + " are") + " still on the mat." }; }
      if (rule === "key") {
        var wrong = all.filter(function (T) { var b = binOf[T.bin], k = b.key || {}; return Object.keys(k).some(function (a) { return T.attrs[a] !== k[a]; }); });
        if (!wrong.length) { won = true; S.lock(true); hop(S, all.map(function (T) { return T.id; })); return { ok: true }; }
        wrong.forEach(function (T) { S.mark(T, "no"); setTimeout(function () { S.unmark(T, "no"); }, 1800); });
        shake(S, wrong.map(function (T) { return T.id; }));
        return { ok: false, say: (s.fb && s.fb.wrong) || (wrong.length === 1 ? "One is in the wrong box." : many(wrong.length) + " are in the wrong box.") + " Look at the ones with a gold ring. " + (s.hintWord || "Do they match the others in their box?") };
      }
      // any rule at all
      var groups = bins.map(function (b) { return { b: b, items: all.filter(function (T) { return T.bin === b.id; }) }; }), used = groups.filter(function (g) { return g.items.length; });
      var fine = attrsOf(used);
      if (used.length < 2) return { ok: false, say: "Use at least two boxes. Put things that are the same in the same box." };
      var avoid = s.avoid || [], good = fine.filter(function (a) { return avoid.indexOf(a) < 0; });
      if (!fine.length) return { ok: false, say: "Look in each box. Are the things in it all the same in some way? And different from the things in the other boxes?" };
      if (!good.length) return { ok: false, say: "That is the same way as before: " + ATTRW[fine[0]] + ". Can you find a different way to sort them?" };
      won = true; S.lock(true); hop(S, all.map(function (T) { return T.id; }));
      api.way = good[0];
      return { ok: true, say: "You sorted by " + ATTRW[good[0]] + "." };
    };
    api.reveal = function () {
      var all = S.movers();
      if (rule === "key") all.forEach(function (T) { var b = bins.filter(function (x) { return Object.keys(x.key || {}).every(function (a) { return T.attrs[a] === x.key[a]; }); })[0]; if (b) T.bin = b.id; });
      else {
        var a = s.show || "colour", vals = []; all.forEach(function (T) { if (vals.indexOf(T.attrs[a]) < 0) vals.push(T.attrs[a]); });
        all.forEach(function (T) { T.bin = bins[Math.min(vals.indexOf(T.attrs[a]), bins.length - 1)].id; });
      }
      bins.forEach(arrange); won = true; S.lock(true);
    };
    api.key = function () {
      var all = S.movers(), assign = [], wrong = null, a = s.show || "shape";
      if (rule === "key") all.forEach(function (T) { var b = bins.filter(function (x) { return Object.keys(x.key || {}).every(function (q) { return T.attrs[q] === x.key[q]; }); })[0]; assign.push([T.id, b.id]); });
      else { var vals = []; all.forEach(function (T) { if (vals.indexOf(T.attrs[a]) < 0) vals.push(T.attrs[a]); }); all.forEach(function (T) { assign.push([T.id, bins[vals.indexOf(T.attrs[a])].id]); }); }
      // a wrong try: everything in the first box
      wrong = all.map(function (T) { return [T.id, bins[0].id]; });
      return { kind: "sort", assign: assign, wrong: wrong, any: rule === "any" };
    };
    api.scene = S; api.bins = bins; api.binOf = binOf;
    api.assign = function (id, binId) { S.id(id).bin = binId; S.moved[id] = true; arrange(binOf[binId]); chosen(api); };
    api.destroy = function () { S.destroy(); };
    return api;
  });

  /* =============================================================== paint
     goal: { id: "orange", … }; every other paintable thing stays plain. */
  var CRAYON = { blue: ["#4a8cff", "#2f67d1"], orange: ["#ff9244", "#d96d1f"], green: ["#47b872", "#2f8f55"], yellow: ["#ffd23f", "#e0a91d"], pink: ["#ff8fb7", "#d6568a"], red: ["#e8505b", "#bf3943"], purple: ["#8a63f0", "#6b46d1"] };
  var PLAIN = ["#eef1f8", "#c2cadc"];
  CH.addKind("g1paint", function (s, seed, mode) {
    var S = Scene(s.scene), f = frame(S), api = { el: f.wrap, helpAt: 2 }, goal = s.goal || {}, cur = null, paint = {}, locked = false;
    var pal = el("div", "k1-crayons");
    (s.crayons || ["blue", "orange"]).forEach(function (name) {
      var b = button("k1-crayon", "<i></i><b>" + name + "</b>");
      b.style.setProperty("--cc", CRAYON[name][0]); b.dataset.c = name; b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () {
        cur = name; [].forEach.call(pal.children, function (c) { c.classList.toggle("on", c === b); c.setAttribute("aria-pressed", String(c === b)); });
        VOICE.say(name);
      });
      pal.appendChild(b);
    });
    f.wrap.insertBefore(pal, f.wrap.firstChild);
    S.list.forEach(function (T) { if (T.role === "tap") { paint[T.id] = null; S.reart(T, { colour: PLAIN[0], dark: PLAIN[1] }); } });
    S.on("tap", function (T) {
      if (locked) return;
      if (!cur) { f.say("Pick a crayon first."); VOICE.say("Pick a crayon first."); pal.classList.remove("nudge"); void pal.offsetWidth; pal.classList.add("nudge"); return; }
      f.say("");
      if (paint[T.id] === cur) { paint[T.id] = null; S.reart(T, { colour: PLAIN[0], dark: PLAIN[1] }); }
      else { paint[T.id] = cur; S.reart(T, { colour: CRAYON[cur][0], dark: CRAYON[cur][1] }); }
      chosen(api);
    });
    api.ready = function () { return Object.keys(paint).some(function (k) { return paint[k]; }) && !locked; };
    api.check = function () {
      var bad = Object.keys(paint).filter(function (id) { return (paint[id] || null) !== (goal[id] || null); });
      if (!bad.length) { locked = true; S.lock(true); hop(S, Object.keys(goal)); return { ok: true }; }
      bad.forEach(function (id) { S.mark(id, "no"); setTimeout(function () { S.unmark(id, "no"); }, 1800); });
      var id = bad[0], want = goal[id];
      return { ok: false, say: (s.fb && s.fb[id]) || (paint[id] && !want ? "Look at the ringed " + (s.what || "one") + ". It should stay plain." : "Look at the ringed " + (s.what || "one") + (want ? ". It should be " + want + "." : ". It should stay plain.")) };
    };
    api.reveal = function () {
      Object.keys(paint).forEach(function (id) { var c = goal[id] || null; paint[id] = c; S.reart(id, c ? { colour: CRAYON[c][0], dark: CRAYON[c][1] } : { colour: PLAIN[0], dark: PLAIN[1] }); });
      locked = true; S.lock(true);
    };
    api.key = function () {
      var other = (s.crayons || ["blue", "orange"]).filter(function (c) { return c !== goal[Object.keys(goal)[0]]; })[0];
      return { kind: "paint", goal: goal, wrongId: Object.keys(goal)[0], wrongColour: other };
    };
    api.scene = S; api.pal = pal;
    api.destroy = function () { S.destroy(); };
    return api;
  });

  /* ================================================================= seq
     A row of things in order. Tap one: those before it light blue, those after it orange. */
  CH.addKind("g1seq", function (s, seed, mode) {
    var S = Scene(s.scene), f = frame(S), api = { el: f.wrap }, ids = s.ids, seen = {}, goal = s.goal || 3;
    var key = el("div", "k1-words");
    ["before", "after"].forEach(function (w) { var c = el("span", "k1-wd got", "<i>" + G.icon(w) + "</i><b>" + w + "</b>"); c.style.setProperty("--wc", WORDS[w].col); key.appendChild(c); });
    f.wrap.appendChild(key);
    function show(k) {
      S.clearMarks();
      ids.forEach(function (id, i) { S.mark(id, i < k ? "before" : i > k ? "after" : "me"); });
      var b = k, a = ids.length - 1 - k;
      f.say((s.noun || "Bogie") + " " + many(k + 1) + ". " + G.chip("before") + " it: " + (b ? many(b) : "none") + ". " + G.chip("after") + " it: " + (a ? many(a) : "none") + ".", true);
    }
    S.on("tap", function (T) { var k = ids.indexOf(T.id); if (k < 0) return; seen[k] = true; show(k); chosen(api); });
    api.ready = function () { return Object.keys(seen).length >= goal; };
    api.key = function () { return { kind: "seq", ids: ids.slice(0, goal) }; };
    api.scene = S;
    api.destroy = function () { S.destroy(); };
    return api;
  });

  /* ============================================================== story
     frames: [ { line, pos: { id: [x, y] | { rel, ref, n? } }, hold? } ] — played one after the other. */
  CH.addKind("g1story", function (s, seed, mode) {
    var S = Scene(s.scene), f = frame(S), api = { el: f.wrap }, frames = s.frames || [], played = false, running = false, tok = 0;
    var go = button("k1-play", K.spk + "<span>" + (s.playLabel || "Play") + "</span>");
    f.wrap.insertBefore(go, f.wrap.firstChild);
    function run() {
      if (running) return;
      running = true; var my = ++tok; go.disabled = true; S.reset();
      var i = 0;
      (function next() {
        if (my !== tok) return;
        if (i >= frames.length) { running = false; played = true; go.disabled = false; go.querySelector("span").textContent = "Play again"; chosen(api); return; }
        var fr = frames[i++];
        Object.keys(fr.pos || {}).forEach(function (id) {
          var p = fr.pos[id], T = S.id(id), q = Array.isArray(p) ? { x: p[0], y: p[1] } : G.solve(p.rel, T.g, S.id(p.ref).g, { zone: p.zone, ground: S.ground, W: S.W, n: p.n || 0 });
          S.moveTo(T, q.x, q.y, { quiet: true });
        });
        f.say(fr.line || "");
        var plain = G.plain(fr.line || ""), hold = fr.hold || Math.max(2000, plain.length * 85);
        if (VOICE.isOn() && VOICE.can && plain) {
          var finished = false, fin = function () { if (finished) return; finished = true; later(next, 500); };
          VOICE.say(plain, { done: fin });
          setTimeout(fin, hold + 2500);
        } else later(next, hold);
      })();
    }
    go.addEventListener("click", run);
    api.ready = function () { return played; };
    api.key = function () { return { kind: "story" }; };
    api.scene = S;
    api.play = run;
    api.destroy = function () { tok++; S.destroy(); };
    return api;
  });

  window.OPLO_K1.frame = frame; window.OPLO_K1.kinds = true; window.OPLO_K1.CRAYON = CRAYON; window.OPLO_K1.many = many;
})();
