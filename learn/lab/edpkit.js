/* ==========================================================================
   OEdu Lab — the watch · read · write kit. See lab/core.js (COURSE_KIT).

   The way a Humanities, Social Studies, Science or English lesson is taught:
   take something in, stop and think about it, then say it yourself. Each is
   a step kind like the math ones, run on an idea card ("learn" step), so a
   lesson stays one path with the same sidebar and step list.

     watch   a film with questions that arrive where the thinking should
             happen. It pauses, the panel beside it asks and answers back,
             and you can rewatch that part. Chapters and question rings sit
             on the timeline.
     doc     a reading (the history kit's reading page, so tap-to-define
             words and pictures still work) with questions inside the text,
             a "n of N" ring, and Listen.
     write   a response in your own words: frames to start from, then a
             model answer and a short list to check yourself against, and
             one chance to revise.

   Nothing here locks anything: a question can be skipped, any chapter can
   be opened, and Continue is always there. The film is a YouTube embed of
   the course's own upload, played as it was made; nothing is drawn over it
   (YouTube's rules), so its controls are under it and the questions beside it.

   Design: the content is the interface. One clean frame for the film, a
   quiet panel for what to think about, choices as one grouped list, motion
   a short spring, and a keyboard path for everything.
   ========================================================================== */
(function () {
  "use strict";
  var LAB = window.OPLO_LAB, CH = window.OPLO_CHALLENGE;
  if (!LAB || !CH || !CH.kinds || !CH.kinds.page) return;   // needs the history kit's reading page
  var el = LAB.el, esc = LAB.esc, button = LAB.button, fmt = LAB.fmt;

  /* ------------------------------------------------------------------ Parts */
  function reduced() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function clock(t) { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ":" + ("0" + (t % 60)).slice(-2); }
  function words(s) { return (String(s).trim().match(/\S+/g) || []).length; }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  // What a learner said or answered, kept for this browser tab only (a shared computer must not carry it to the next person).
  var M = {};
  function mem(k, v) {
    var key = "oplo.edp." + k;
    if (v === undefined) { try { var s = sessionStorage.getItem(key); if (s != null) return JSON.parse(s); } catch (e) { /* storage off */ } return M[k]; }
    M[k] = v;
    try { sessionStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* storage off */ }
  }
  // The same order every time for one question, so nothing is "always the first one".
  function order(n, key) {
    var a = [], s = 2166136261, i, j, t;
    for (i = 0; i < n; i++) a.push(i);
    for (i = 0; i < key.length; i++) s = Math.imul(s ^ key.charCodeAt(i), 16777619) >>> 0;
    for (i = n - 1; i > 0; i--) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; j = s % (i + 1); t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function svg(p, fill) {
    return '<svg viewBox="0 0 24 24" fill="' + (fill ? "currentColor" : "none") + '" stroke="' + (fill ? "none" : "currentColor") +
      '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>";
  }
  var IC = {
    play: svg('<path d="M8 5.6v12.8l10.4-6.4z"/>', 1),
    pause: svg('<rect x="6.6" y="5" width="3.7" height="14" rx="1.2"/><rect x="13.7" y="5" width="3.7" height="14" rx="1.2"/>', 1),
    back: svg('<path d="M4.6 12a7.6 7.6 0 1 0 2.4-5.6"/><path d="M4.4 4.6v4h4"/><text x="12.2" y="15" font-size="7.2" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none">10</text>'),
    full: svg('<path d="M4.5 9V4.5H9M19.5 9V4.5H15M4.5 15v4.5H9M19.5 15v4.5H15"/>'),
    listen: svg('<path d="M4.2 9.6v4.8h3.6l4.6 3.8V5.8L7.8 9.6z"/><path d="M15.6 9.2a4.2 4.2 0 0 1 0 5.6"/><path d="M18 7a7.4 7.4 0 0 1 0 10"/>'),
    stop: svg('<rect x="6.6" y="6.6" width="10.8" height="10.8" rx="2.6"/>', 1),
    again: svg('<path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5"/><path d="M4.4 4.5v4h4"/>')
  };

  /* ================================================================ A question
     One question, drawn the same way over the film and inside a reading.
       kind  "mc" one right answer: tap it, and it answers back at once
             "multi" pick all that apply, then Check
             "open" write, then see a model answer and say whether yours had it
             "reflect" write, nothing marked (a guess before, a view after)
     o: { label, rewatch(), skip(), next(), done(result) } — next() makes a
     Continue button; with no next() the card just settles when answered. */
  function ask(q, o) {
    o = o || {};
    var kind = q.kind || "mc", tries = 0, done = false, saved = mem("a:" + q.id);
    var root = el("div", "ed-q ed-q-" + kind), main = el("div", "ed-q-main");
    main.appendChild(el("p", "ed-q-k", o.label || "Pause and think"));
    main.appendChild(el("h3", "ed-q-t", fmt(q.q)));
    var body = el("div", "ed-q-body"), say = el("div", "ed-q-say"), bar = el("div", "ed-q-bar");
    say.setAttribute("role", "status");
    main.appendChild(body); main.appendChild(say);
    root.appendChild(main); root.appendChild(bar);   // the bar stays put when the question is tall

    var primary = button("ed-btn pri", "Check"), skip = o.skip ? button("ed-btn ghost", "Skip") : null, again = o.rewatch ? button("ed-btn ghost", IC.again + "<span>Rewatch this part</span>") : null, show = null;
    if (again) bar.appendChild(again);
    if (skip) bar.appendChild(skip);
    bar.appendChild(el("span", "sp"));
    bar.appendChild(primary);
    primary.hidden = kind === "mc";

    function tell(k, msg, why, label) {
      say.className = "ed-q-say" + (k ? " " + k : "");
      // Bring the reply into view inside the card only (scrollIntoView would move the whole page).
      if (k) setTimeout(function () { var m = say.parentNode, over = say.getBoundingClientRect().bottom - m.getBoundingClientRect().bottom + 12; if (over > 0) m.scrollBy({ top: over, behavior: reduced() ? "auto" : "smooth" }); }, 60);
      say.innerHTML = k ? "<b>" + (label || (k === "ok" ? "Right." : "Not quite.")) + "</b> " + fmt(msg || "") + (why && q.why ? " " + fmt(q.why) : "") : "";
    }
    function finish(ok, shown) {
      done = true; root.classList.add("done");
      mem("a:" + q.id, { ok: !!ok, shown: !!shown });
      if (show) show.remove();
      if (skip) skip.remove();
      if (again && kind !== "reflect") again.remove();
      primary.disabled = false; primary.textContent = "Continue"; primary.hidden = !o.next;
      if (o.done) o.done({ ok: !!ok });
    }
    function offerShow() {
      if (show || done) return;
      show = button("ed-btn ghost", "Show me");
      bar.insertBefore(show, primary);
      show.addEventListener("click", function () { reveal(); tell("ok", "Here it is.", true, "Take a look."); finish(false, true); });
    }
    function reveal() {
      rows.forEach(function (r) { r.disabled = true; r.classList.remove("sel", "no"); r.classList.toggle("ok", !!r._op.ok); r.classList.toggle("dim", !r._op.ok); });
    }

    var rows = [], ta = null;
    if (kind === "mc" || kind === "multi") {
      var opts = el("div", "ed-opts");
      opts.setAttribute("role", kind === "mc" ? "radiogroup" : "group");
      order(q.options.length, q.id).forEach(function (i) {
        var op = q.options[i], b = button("ed-opt", '<span class="ed-mark"></span><span class="ed-ot">' + fmt(op.t) + "</span>");
        b._op = op; b.setAttribute("role", kind === "mc" ? "radio" : "checkbox"); b.setAttribute("aria-checked", "false");
        b.addEventListener("click", function () {
          if (done) return;
          if (kind === "mc") {
            tries++;
            if (op.ok) { reveal(); b.classList.add("ok"); b.classList.remove("dim"); tell("ok", op.fb, true); finish(true); }
            else { b.classList.add("no"); b.disabled = true; tell("no", op.fb || "Look at the choices again."); if (tries >= 2) offerShow(); }
          } else {
            b.classList.toggle("sel"); b.classList.remove("no");
            b.setAttribute("aria-checked", String(b.classList.contains("sel")));
            primary.disabled = !rows.some(function (r) { return r.classList.contains("sel"); });
            tell();
          }
        });
        rows.push(b); opts.appendChild(b);
      });
      body.appendChild(opts);
      if (kind === "multi") primary.disabled = true;
    } else {
      ta = el("textarea", "ed-ta");
      ta.rows = 3; ta.placeholder = q.placeholder || "In your own words…"; ta.setAttribute("aria-label", "Your answer");
      ta.addEventListener("input", function () { primary.disabled = words(ta.value) < (kind === "open" ? 4 : 1); });
      body.appendChild(ta);
      primary.disabled = true; primary.textContent = kind === "open" ? "Check" : "Done";
    }

    primary.addEventListener("click", function () {
      if (done) { if (o.next) o.next(); return; }
      if (kind === "multi") {
        tries++;
        var wrong = rows.filter(function (r) { return r.classList.contains("sel") && !r._op.ok; });
        var miss = rows.filter(function (r) { return !r.classList.contains("sel") && r._op.ok; });
        if (!wrong.length && !miss.length) { reveal(); tell("ok", "", true); finish(true); return; }
        wrong.forEach(function (r) { r.classList.add("no"); });
        tell("no", wrong.length ? (wrong[0]._op.fb || "One of those doesn't belong.") : "One more belongs. Look again.");
        if (tries >= 2) offerShow();
      } else if (kind === "open") {
        ta.readOnly = true; primary.hidden = true;
        body.appendChild(el("div", "ed-model", "<b>A model answer</b><p>" + fmt(q.model) + "</p>"));
        var rate = el("div", "ed-rate", "<span>Did yours say that?</span>"), yes = button("ed-btn", "I had it"), no = button("ed-btn", "Not yet");
        rate.appendChild(yes); rate.appendChild(no); body.appendChild(rate);
        yes.addEventListener("click", function () { rate.remove(); tell("ok", "", true, "Good."); finish(true); });
        no.addEventListener("click", function () { rate.remove(); tell("no", "Read the model once more, then carry on.", false, "That's fine."); finish(false); });
      } else {
        mem("r:" + q.id, ta.value.trim()); ta.readOnly = true; finish(true);
        if (o.next) o.next();   // nothing to read back: Done is the way on
      }
    });
    if (skip) skip.addEventListener("click", function () { o.skip(); });
    if (again) again.addEventListener("click", function () { o.rewatch(); });

    // Answered earlier in this sitting: shown settled, not asked again.
    if (saved) {
      if (rows.length) { reveal(); tell("ok", "", true, "Answered."); }
      if (ta) { ta.value = mem("r:" + q.id) || ""; ta.readOnly = true; if (kind === "open") body.appendChild(el("div", "ed-model", "<b>A model answer</b><p>" + fmt(q.model) + "</p>")); }
      done = true; root.classList.add("done"); primary.hidden = !o.next; if (o.next) { primary.disabled = false; primary.textContent = "Continue"; } if (skip) skip.remove(); if (again) again.remove();
    }
    return { el: root, done: function () { return done; }, focus: function () { var f = ta || rows[0] || primary; if (f && f.focus) f.focus({ preventScroll: true }); } };
  }

  /* ==================================================================== Watch
     spec: { id, youtube, duration, title, chapters:[{t, n}], stops:[{id, at, from, kind, q, options, why, model}] }
     The film is a YouTube embed. YouTube's rules forbid drawing anything in
     front of an embedded player, so the film sits clean in its own frame:
     the controls are under it, and the chapters and the questions are in a
     panel beside it (a question takes the panel while the film is paused).
     The timeline is one segment per chapter with a ring per question.
     Space plays, arrows seek, F is full screen. */
  var ytLoad = null;
  function ytApi() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (!ytLoad) ytLoad = new Promise(function (ok, fail) {
      var was = window.onYouTubeIframeAPIReady, s = document.createElement("script");
      window.onYouTubeIframeAPIReady = function () { if (was) was(); ok(window.YT); };
      s.src = "https://www.youtube.com/iframe_api";
      s.onerror = function () { ytLoad = null; fail(new Error("YouTube did not load")); };
      document.head.appendChild(s);
    });
    return ytLoad;
  }

  CH.addKind("watch", function (spec, seed) {
    var api = {}, tkey = "t:" + (spec.id || seed), chapters = spec.chapters || [{ t: 0, n: "Film" }];
    var stops = (spec.stops || []).map(function (s) { return Object.assign({}, s, { done: !!mem("a:" + s.id) }); }).sort(function (a, b) { return a.at - b.at; });
    var dur = spec.duration || 1, raf = 0, prev = 0, asking = null, playing = false, ready = false, gone = false, yt = null, rates = [1, 1.25, 1.5, 2, 0.75], ri = 0, saveAt = 0, segs = [];

    var box = el("div", "ed-watch"), main = el("div", "ed-main"), stage = el("div", "ed-stage"), host = document.createElement("div"), ctl = el("div", "ed-ctl wait"), side = el("aside", "ed-side");
    stage.appendChild(host); main.appendChild(stage); main.appendChild(ctl); box.appendChild(main); box.appendChild(side);

    var pp = button("ed-ib", IC.play), back = button("ed-ib", IC.back), scrub = el("div", "ed-scrub"), tip = el("span", "ed-tip"),
        time = el("span", "ed-time"), rate = button("ed-ib ed-rate", "1×"), fs = button("ed-ib", IC.full);
    pp.setAttribute("aria-label", "Play"); back.setAttribute("aria-label", "Back 10 seconds"); rate.setAttribute("aria-label", "Speed"); fs.setAttribute("aria-label", "Full screen");
    scrub.setAttribute("role", "slider"); scrub.setAttribute("aria-label", "Position"); scrub.tabIndex = 0;
    [pp, back, scrub, time, rate, fs].forEach(function (n) { ctl.appendChild(n); });

    // The panel beside the film: its chapters and how many questions are answered; a question replaces it while the film is stopped.
    var idle = el("div", "ed-idle"), head = el("div", "ed-side-h"), meta = el("span", "ed-meta"), list = el("div", "ed-chs"), foot = el("div", "ed-side-f"), resume = el("span", "ed-resume");
    head.appendChild(el("h3", "", fmt(spec.title || ""))); head.appendChild(meta);
    var rows = chapters.map(function (c) {
      var b = button("ed-ch", "<span>" + esc(c.n) + "</span><i>" + clock(c.t) + "</i>");
      b._c = c; b.addEventListener("click", function () { seek(c.t); play(); }); list.appendChild(b); return b;
    });
    var link = el("a", "ed-yt", "Watch on YouTube ↗"); link.href = "https://youtu.be/" + spec.youtube; link.target = "_blank"; link.rel = "noopener";
    foot.appendChild(resume); foot.appendChild(link);
    [head, list, foot].forEach(function (n) { idle.appendChild(n); }); side.appendChild(idle);

    // The timeline: a segment per chapter, a ring per question.
    function build() {
      scrub.innerHTML = ""; segs = [];
      chapters.forEach(function (c, i) {
        var t1 = i + 1 < chapters.length ? chapters[i + 1].t : dur, seg = el("i", "ed-seg", '<b class="ed-fill"></b>');
        seg.style.flexGrow = String(Math.max(1, t1 - c.t)); scrub.appendChild(seg); segs.push({ t0: c.t, t1: t1, el: seg });
      });
      stops.forEach(function (s) { var p = el("i", "ed-pin" + (s.done ? " done" : "")); p.style.left = (s.at / dur * 100) + "%"; s._pin = p; scrub.appendChild(p); });
      scrub.appendChild(tip);
    }
    build();

    function now() { return ready ? yt.getCurrentTime() : 0; }
    function chapterAt(t) { var c = null; chapters.forEach(function (x) { if (t >= x.t) c = x; }); return c; }
    function paint(t) {
      segs.forEach(function (s) { s.el.firstChild.style.transform = "scaleX(" + clamp((t - s.t0) / Math.max(0.01, s.t1 - s.t0), 0, 1) + ")"; });
      time.textContent = clock(t) + " / " + clock(dur);
      scrub.setAttribute("aria-valuenow", String(Math.floor(t))); scrub.setAttribute("aria-valuemax", String(Math.floor(dur))); scrub.setAttribute("aria-valuetext", clock(t) + " of " + clock(dur));
      var c = chapterAt(t); rows.forEach(function (b) { b.classList.toggle("cur", b._c === c); });
      if (playing && t > saveAt + 4) { saveAt = t; mem(tkey, Math.floor(t)); }
    }
    function status() {
      var n = stops.filter(function (s) { return s.done; }).length, f = stops.length ? n / stops.length : 0;
      meta.hidden = !stops.length;
      meta.innerHTML = '<i class="ed-ring" style="--p:' + f + '"></i>' + n + " of " + stops.length + " questions";
      stops.forEach(function (s) { s._pin.classList.toggle("done", s.done); });
      var c = box.closest && box.closest(".ch-card");
      if (c) c.classList.toggle("ed-ready", !stops.length || n === stops.length);
    }
    function seek(t) { if (!ready) return; t = clamp(t, 0, dur); yt.seekTo(t, true); prev = t; paint(t); }
    function play() { if (ready) yt.playVideo(); }
    function pause() { if (ready) yt.pauseVideo(); }
    function toggle() { if (asking) return; if (playing) pause(); else play(); }

    function tick() {
      var t = now();
      paint(t);
      if (!asking) for (var i = 0; i < stops.length; i++) { var s = stops[i]; if (!s.done && prev < s.at && t >= s.at) { openStop(s); break; } }
      prev = t;
      if (playing) raf = requestAnimationFrame(tick);
    }
    function openStop(s) {
      pause();
      var q = ask(s, {
        label: s.kind === "reflect" ? "Before we begin" : "Pause and think · " + (stops.indexOf(s) + 1) + " of " + stops.length,
        rewatch: s.kind === "reflect" ? null : function () { close(); seek(s.from != null ? s.from : s.at - 25); play(); },
        skip: function () { close(); play(); },
        next: function () { close(); play(); },
        done: function () { s.done = true; status(); }
      });
      asking = q; side.classList.add("asking"); side.appendChild(q.el);
      requestAnimationFrame(function () { q.focus(); });
    }
    function close() { if (!asking) return; asking.el.remove(); asking = null; side.classList.remove("asking"); pp.focus({ preventScroll: true }); }

    // The film carries its own captions. YouTube loads its auto-captions only once play starts, so they are switched off then, every time.
    function noCaptions() { try { yt.unloadModule("captions"); } catch (e) { /* not loaded */ } }
    function onState(e) {
      var s = e.data;
      if (s === 1) noCaptions();
      playing = s === 1 || s === 3;                       // 3 is buffering: still on its way
      if (s === 0) mem(tkey, 0);
      pp.innerHTML = playing ? IC.pause : IC.play; pp.setAttribute("aria-label", playing ? "Pause" : "Play");
      cancelAnimationFrame(raf);
      if (playing) raf = requestAnimationFrame(tick); else paint(now());
      // A click on the film puts focus inside YouTube's frame, where Space and arrows can't reach us; bring it back.
      if (document.activeElement && document.activeElement.tagName === "IFRAME") pp.focus({ preventScroll: true });
    }
    function failed() {
      stage.innerHTML = '<div class="ed-missing"><b>The film couldn\'t load.</b><span>Check the connection, or <a href="https://youtu.be/' + esc(spec.youtube) + '" target="_blank" rel="noopener">watch it on YouTube</a>.</span></div>';
      ctl.hidden = true;
    }
    function onReady() {
      ready = true; ctl.classList.remove("wait");
      var d = yt.getDuration();
      if (d > 1 && Math.abs(d - dur) > 1) { dur = d; build(); status(); }
      var t = mem(tkey);
      if (t > 3 && t < dur - 6) {
        yt.seekTo(t, true); prev = t;
        resume.textContent = "Picked up at " + clock(t) + " · ";
        var again = button("ed-link", "Start over"); again.addEventListener("click", function () { seek(0); resume.textContent = ""; });
        resume.appendChild(again);
      }
      paint(now());
    }
    ytApi().then(function (YT) {
      if (gone) return;
      yt = new YT.Player(host, { host: "https://www.youtube-nocookie.com", videoId: spec.youtube, width: "100%", height: "100%",
        playerVars: { controls: 0, disablekb: 1, fs: 0, rel: 0, playsinline: 1, iv_load_policy: 3, cc_load_policy: 0, origin: location.origin },
        events: { onReady: onReady, onStateChange: onState, onError: failed } });
    }, failed);

    pp.addEventListener("click", toggle);
    back.addEventListener("click", function () { seek(now() - 10); });
    rate.addEventListener("click", function () { ri = (ri + 1) % rates.length; if (ready) yt.setPlaybackRate(rates[ri]); rate.textContent = rates[ri] + "×"; });
    fs.addEventListener("click", function () { if (document.fullscreenElement) document.exitFullscreen(); else if (box.requestFullscreen) box.requestFullscreen(); });
    box.addEventListener("keydown", function (e) {
      if (asking || /^(INPUT|TEXTAREA)$/.test(e.target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      var onButton = /^(BUTTON|A)$/.test(e.target.tagName);   // a focused button already answers Space and Enter itself
      if ((e.key === " " || e.key === "Enter") && !onButton || e.key === "k") { e.preventDefault(); e.stopPropagation(); toggle(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); seek(now() - 5); }
      else if (e.key === "ArrowRight") { e.preventDefault(); seek(now() + 5); }
      else if (e.key === "f") { e.preventDefault(); fs.click(); }
    });

    // Scrub: press and drag anywhere on the timeline; hover names the chapter.
    var drag = false;
    function at(e) { var r = scrub.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width, 0, 1) * dur; }
    function hover(e) {
      var t = at(e), c = chapterAt(t), r = scrub.getBoundingClientRect();
      tip.textContent = clock(t) + (c && c.n ? " · " + c.n : ""); tip.style.left = clamp(e.clientX - r.left, 60, r.width - 60) + "px";
    }
    scrub.addEventListener("pointerdown", function (e) { drag = true; scrub.classList.add("drag"); scrub.setPointerCapture(e.pointerId); seek(at(e)); hover(e); });
    scrub.addEventListener("pointermove", function (e) { hover(e); if (drag) seek(at(e)); });
    scrub.addEventListener("pointerup", function () { drag = false; scrub.classList.remove("drag"); });
    scrub.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); seek(now() - 5); }
      else if (e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); seek(now() + 5); }
    });

    status(); paint(0);
    // The player puts focus on Continue a frame after it draws a step; the film's play button needs it so Space plays.
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (box.isConnected && !asking) pp.focus({ preventScroll: true }); status(); }); });
    api.el = box;
    api.ready = function () { return stops.every(function (s) { return s.done; }); };
    api.check = function () { return { ok: true }; };
    api.reveal = function () {};
    api.p = { time: now, paused: function () { return !playing; }, play: play, pause: pause, seek: seek, loaded: function () { return ready; } };   // for tests
    api.destroy = function () {
      gone = true; cancelAnimationFrame(raf);
      if (ready) { if (playing) mem(tkey, Math.floor(now())); try { yt.destroy(); } catch (e) { /* already gone */ } }
      if (document.fullscreenElement === box) document.exitFullscreen();
    };
    return api;
  });

  /* ===================================================================== Read
     spec: { blocks, meta } — the history kit's blocks, plus ["q", question]
     placed where it should be asked. */
  CH.addKind("doc", function (spec, seed, mode) {
    var qs = [], real = [], api = {};
    (spec.blocks || []).forEach(function (b) { if (Array.isArray(b) && b[0] === "q") qs.push({ at: real.length, q: b[1] }); else real.push(b); });
    var pg = CH.kinds.page(Object.assign({}, spec, { blocks: real, gate: false }), seed, mode);
    var box = el("div", "ed-doc"), top = el("div", "ed-doc-top"), meta = el("span", "ed-doc-meta"), listen = button("ed-btn ghost ed-listen", IC.listen + "<span>Listen</span>");
    top.appendChild(meta); if (window.speechSynthesis) top.appendChild(listen);
    box.appendChild(top); box.appendChild(pg.el);

    function status() {
      var n = qs.filter(function (x) { return x.card.done(); }).length;
      meta.innerHTML = (spec.meta ? esc(spec.meta) + (qs.length ? " · " : "") : "") + (qs.length ? '<i class="ed-ring" style="--p:' + n / qs.length + '"></i>' + n + " of " + qs.length + " answered" : "");
    }
    var kids = [].slice.call(pg.el.children).filter(function (c) { return !/\bhk-(tip|page-read)\b/.test(c.className); });
    qs.forEach(function (x, i) {
      x.card = ask(x.q, { label: "Question " + (i + 1) + " of " + qs.length, done: status });
      var anchor = kids[x.at - 1];
      if (anchor) anchor.parentNode.insertBefore(x.card.el, anchor.nextSibling); else pg.el.appendChild(x.card.el);
    });
    status();

    listen.addEventListener("click", function () {
      var ss = window.speechSynthesis;
      if (ss.speaking) { ss.cancel(); return; }
      var text = [].map.call(pg.el.querySelectorAll(".hk-p, .hk-h, .hk-note"), function (n) { return n.textContent; }).join(" ");
      var u = new SpeechSynthesisUtterance(text);
      function rest() { listen.classList.remove("on"); listen.lastChild.textContent = "Listen"; listen.firstChild.outerHTML = IC.listen; }
      u.onend = u.onerror = rest;
      listen.classList.add("on"); listen.lastChild.textContent = "Stop"; listen.firstChild.outerHTML = IC.stop;
      ss.speak(u);
    });
    api.el = box; api.ready = pg.ready; api.check = pg.check; api.reveal = pg.reveal;
    api.destroy = function () { if (window.speechSynthesis) window.speechSynthesis.cancel(); };
    return api;
  });

  /* ==================================================================== Write
     spec: { id, placeholder, frames:[…], min, model, rubric:[…], recall } — recall
     is the id of an earlier "reflect" question, shown back to the learner. */
  CH.addKind("write", function (spec, seed) {
    var api = {}, key = "w:" + (spec.id || seed), min = spec.min || 8, box = el("div", "ed-write"), guess = spec.recall && mem("r:" + spec.recall), extra = [];
    if (guess) box.appendChild(el("p", "ed-recall", "Before the film, you wrote <q>" + esc(guess) + "</q>"));
    var ta = el("textarea", "ed-wta"); ta.rows = 5; ta.placeholder = spec.placeholder || "Write here…"; ta.setAttribute("aria-label", "Your answer");
    ta.value = mem(key) || "";
    var frames = el("div", "ed-frames");
    (spec.frames || []).forEach(function (f) {
      var b = button("ed-frame", esc(f));
      b.addEventListener("click", function () { if (ta.readOnly) return; ta.value += (ta.value && !/\s$/.test(ta.value) ? " " : "") + f + " "; ta.focus(); sync(); });
      frames.appendChild(b);
    });
    var wc = el("span", "ed-wc"), go = button("ed-btn pri", "Compare"), row = el("div", "ed-wrow");
    row.appendChild(wc); row.appendChild(go);
    box.appendChild(ta); box.appendChild(frames); box.appendChild(row);

    function sync() {
      ta.style.height = "auto"; ta.style.height = Math.min(360, Math.max(140, ta.scrollHeight)) + "px";
      var n = words(ta.value); wc.textContent = n + (n === 1 ? " word" : " words"); go.disabled = n < min; mem(key, ta.value);
    }
    ta.addEventListener("input", sync);
    go.addEventListener("click", function () {
      ta.readOnly = true; row.hidden = true; frames.hidden = true;
      var model = el("div", "ed-model", "<b>A model answer</b><p>" + fmt(spec.model) + "</p>");
      var rub = el("div", "ed-rub"), sum = el("p", "ed-rub-s"), rows = [];
      rub.appendChild(el("b", "", "Check yours"));
      (spec.rubric || []).forEach(function (r) {
        var b = button("ed-rrow", '<span class="ed-mark"></span><span class="ed-ot">' + fmt(r) + "</span>");
        b.setAttribute("role", "checkbox"); b.setAttribute("aria-checked", "false");
        b.addEventListener("click", function () { b.classList.toggle("sel"); b.setAttribute("aria-checked", String(b.classList.contains("sel"))); count(); });
        rows.push(b); rub.appendChild(b);
      });
      function count() {
        var n = rows.filter(function (r) { return r.classList.contains("sel"); }).length;
        sum.textContent = n === rows.length ? "All of it. Nicely said." : n ? n + " of " + rows.length + ". One more pass could close the gap." : "Tick what yours already does.";
      }
      var revise = button("ed-btn ghost", "Revise my answer");
      revise.addEventListener("click", function () { [model, rub, sum, revise].forEach(function (n) { n.remove(); }); ta.readOnly = false; row.hidden = false; frames.hidden = false; ta.focus(); });
      count();
      [model, rub, sum, revise].forEach(function (n) { box.appendChild(n); extra.push(n); });
    });
    sync();
    api.el = box; api.ready = function () { return words(ta.value) >= min; }; api.check = function () { return { ok: true }; }; api.reveal = function () {};
    return api;
  });

  /* ------------------------------------------------------------------ Style */
  var st = document.getElementById("edpkit-css");
  if (st) st.parentNode.removeChild(st);
  st = document.createElement("style");
  st.id = "edpkit-css";
  st.appendChild(document.createTextNode([
    ".ed-watch, .ed-doc, .ed-write, .ed-q { --ed-ease: cubic-bezier(.32,.72,0,1); --ed-acc: var(--kern, #5468ff); --ed-ok: var(--kern-ok, #35c97b); --ed-no: var(--kern-no, #e8b64c); }",
    /* The film sits clean in its own frame (YouTube forbids drawing over an embedded player): controls under it, chapters and questions beside it.
       Its width follows the window's height (392px is everything above and below it), so the controls never slip under Continue. */
    "html.kern .ch:has(.ed-watch) { max-width: min(1400px, 100%); }",
    "html.kern .ch-card:has(.ed-watch) .ch-prompt:empty { display: none; } html.kern .ch-card:has(.ed-watch) .ch-work { margin-top: 14px; }",
    /* Continue stays quiet until the film's questions are done, so the film is the one loud thing (it is never disabled) */
    "html.kern .ch-card:has(.ed-watch):not(.ed-ready) .ch-foot .ch-btn.primary { background: rgba(255,255,255,.1); color: var(--ink-2, #c9c9d1); box-shadow: none; }",
    ".ed-watch { display: grid; grid-template-columns: minmax(0, 1fr) 372px; gap: 26px; align-items: stretch; text-align: left; }",
    ".ed-main { min-width: 0; width: min(100%, calc((100vh - 392px) * 1.7778)); }",
    ".ed-stage { position: relative; aspect-ratio: 16 / 9; border-radius: 20px; overflow: hidden; background: #0b0b0c; box-shadow: 0 0 0 1px rgba(255,255,255,.07), 0 50px 100px -50px rgba(0,0,0,.95); }",
    ".ed-stage iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; display: block; }",
    ".ed-missing { position: absolute; inset: 0; display: grid; place-content: center; gap: 6px; text-align: center; padding: 24px; color: #fff; }",
    ".ed-missing span { color: rgba(255,255,255,.62); font-size: 14px; } .ed-missing a { color: #aab4ff; }",
    ".ed-ctl { display: flex; align-items: center; gap: 4px; padding: 12px 0 0; color: var(--ink, #fff); transition: opacity .3s; } .ed-ctl.wait { opacity: .4; pointer-events: none; }",
    ".ed-ib { flex: none; width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: none; border: 0; color: inherit; opacity: .94; transition: background .2s, transform .15s; }",
    ".ed-ib:hover { background: rgba(255,255,255,.12); } .ed-ib:active { transform: scale(.9); } .ed-ib:focus-visible { outline: 2px solid var(--ed-acc); outline-offset: 1px; }",
    ".ed-ib svg { width: 22px; height: 22px; }",
    ".ed-rate { width: auto; min-width: 40px; padding: 0 10px; border-radius: 99px; font: 600 13px/1 var(--text); font-variant-numeric: tabular-nums; }",
    ".ed-time { flex: none; min-width: 84px; text-align: right; font: 500 13px/1 var(--text); font-variant-numeric: tabular-nums; color: var(--ink-2, #c9c9d1); }",
    ".ed-scrub { position: relative; flex: 1; height: 30px; margin: 0 8px; display: flex; align-items: center; gap: 3px; cursor: pointer; touch-action: none; outline: none; }",
    ".ed-seg { position: relative; display: block; height: 4px; border-radius: 3px; overflow: hidden; background: rgba(255,255,255,.18); transition: height .25s var(--ed-ease); }",
    ".ed-scrub:hover .ed-seg, .ed-scrub.drag .ed-seg, .ed-scrub:focus-visible .ed-seg { height: 8px; }",
    ".ed-fill { position: absolute; inset: 0; background: #fff; transform-origin: left; transform: scaleX(0); }",
    ".ed-pin { position: absolute; top: 50%; width: 11px; height: 11px; margin: -5.5px 0 0 -5.5px; border-radius: 50%; background: #17171a; box-shadow: 0 0 0 2px rgba(255,255,255,.9); pointer-events: none; transition: background .3s, transform .3s var(--ed-ease); }",
    ".ed-pin.done { background: var(--ed-ok); }",
    ".ed-scrub:hover .ed-pin { transform: scale(1.2); }",
    ".ed-tip { position: absolute; bottom: 30px; transform: translateX(-50%); padding: 6px 11px; border-radius: 10px; white-space: nowrap; pointer-events: none; opacity: 0;",
    "  font: 600 12px/1 var(--text); color: #fff; background: rgba(40,40,44,.92); transition: opacity .15s; }",
    ".ed-scrub:hover .ed-tip { opacity: 1; }",
    /* the panel beside the film */
    ".ed-side { container-type: size; position: relative; min-height: 0; display: flex; flex-direction: column; overflow: hidden; border-radius: 22px; background: rgba(255,255,255,.035); box-shadow: inset 0 0 0 1px rgba(255,255,255,.07); }",
    ".ed-side.asking .ed-idle { display: none; }",
    ".ed-idle { flex: 1; min-height: 0; overflow: auto; box-sizing: border-box; display: flex; flex-direction: column; gap: 18px; padding: 24px 20px 18px; }",
    ".ed-side-h h3 { margin: 0 0 12px; padding: 0 4px; font: 600 21px/1.25 var(--font); letter-spacing: -.02em; color: var(--ink, #fff); }",
    ".ed-meta { display: flex; align-items: center; gap: 8px; padding: 0 4px; font: 500 13.5px/1 var(--text); color: var(--ink-3, #9a9aa6); font-variant-numeric: tabular-nums; } .ed-meta[hidden] { display: none; }",
    ".ed-ring { width: 16px; height: 16px; border-radius: 50%; display: inline-block; vertical-align: -3px;",
    "  background: conic-gradient(var(--ed-ok) calc(var(--p, 0) * 360deg), rgba(255,255,255,.2) 0); -webkit-mask: radial-gradient(circle 5.4px, transparent 98%, #000); mask: radial-gradient(circle 5.4px, transparent 98%, #000); }",
    ".ed-doc-meta .ed-ring { margin: 0 8px 0 10px; }",
    ".ed-chs { display: grid; gap: 2px; }",
    ".ed-ch { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 11px 12px; border-radius: 12px; border: 0; background: none; text-align: left; color: var(--ink-3, #9a9aa6); font: 500 15.5px/1.3 var(--text); letter-spacing: -.008em; transition: color .2s, background .2s; }",
    ".ed-ch i { font-style: normal; font-size: 12.5px; font-variant-numeric: tabular-nums; opacity: .7; }",
    ".ed-ch:hover { color: var(--ink, #fff); } .ed-ch.cur { color: var(--ink, #fff); background: rgba(255,255,255,.08); } .ed-ch:focus-visible { outline: 2px solid var(--ed-acc); outline-offset: -2px; }",
    ".ed-side-f { margin-top: auto; padding: 0 4px; display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 12px; font: 500 13px/1.4 var(--text); color: var(--ink-3, #9a9aa6); }",
    ".ed-yt { margin-left: auto; color: var(--ink-3, #9a9aa6); text-decoration: none; } .ed-yt:hover { color: var(--ink, #fff); }",
    ".ed-link { background: none; border: 0; padding: 0; font: inherit; color: #aab4ff; } .ed-link:hover { text-decoration: underline; }",
    ".ed-side > .ed-q { flex: 1; width: 100%; max-height: none; min-height: 0; border-radius: 0; background: none; box-shadow: none; animation: ed-in .5s var(--ed-ease); }",
    "@keyframes ed-in { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }",
    ".ed-watch:fullscreen { padding: 28px; background: #0b0b0c; align-content: center; grid-template-columns: minmax(0, 1fr) 400px; }",
    ".ed-watch:fullscreen .ed-main { width: min(100%, calc((100vh - 130px) * 1.7778)); }",
    /* a question: a card in the panel, a quiet card in the reading */
    ".ed-q { width: 100%; max-height: 100%; display: flex; flex-direction: column; box-sizing: border-box; overflow: hidden; border-radius: 28px; text-align: left; color: #fff; }",
    ".ed-q-main { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 26px 30px 6px; overscroll-behavior: contain; }",
    ".ed-q-k { margin: 0 0 12px; font: 700 11.5px/1 var(--text); letter-spacing: .13em; text-transform: uppercase; color: var(--ed-acc); }",
    ".ed-q-t { margin: 0 0 20px; font: 600 22px/1.3 var(--font); letter-spacing: -.022em; color: inherit; }",
    ".ed-q-t .ch-ln + .ch-ln { margin-left: .28em; }",
    ".ed-opts { display: grid; border-radius: 17px; overflow: hidden; background: rgba(255,255,255,.07); }",
    ".ed-opt, .ed-rrow { display: flex; align-items: center; gap: 14px; width: 100%; min-height: 52px; padding: 12px 18px; text-align: left; background: none; border: 0; border-top: 1px solid rgba(255,255,255,.09);",
    "  color: #f2f2f5; font: 500 16.5px/1.38 var(--text); letter-spacing: -.008em; transition: background .2s, opacity .3s; }",
    ".ed-opt:first-child, .ed-rrow:first-of-type { border-top: 0; }",
    ".ed-opt:hover:not(:disabled), .ed-rrow:hover { background: rgba(255,255,255,.07); }",
    ".ed-opt:focus-visible, .ed-rrow:focus-visible { outline: 2px solid var(--ed-acc); outline-offset: -2px; }",
    ".ed-mark { flex: none; position: relative; width: 22px; height: 22px; border-radius: 50%; box-shadow: inset 0 0 0 1.8px rgba(255,255,255,.36); transition: background .25s, box-shadow .25s; }",
    ".ed-q-multi .ed-mark, .ed-rrow .ed-mark { border-radius: 7px; }",
    ".ed-mark::after { content: ''; position: absolute; left: 6.2px; top: 6.4px; width: 10px; height: 5.4px; border-left: 2.3px solid #fff; border-bottom: 2.3px solid #fff; transform: rotate(-45deg) scale(0); transition: transform .35s var(--ed-ease); }",
    ".ed-opt.sel .ed-mark, .ed-rrow.sel .ed-mark { background: var(--ed-acc); box-shadow: none; }",
    ".ed-opt.sel .ed-mark::after, .ed-rrow.sel .ed-mark::after, .ed-opt.ok .ed-mark::after { transform: rotate(-45deg) scale(1); }",
    ".ed-opt.ok { background: color-mix(in srgb, var(--ed-ok) 17%, transparent); } .ed-opt.ok .ed-mark { background: var(--ed-ok); box-shadow: none; }",
    ".ed-opt.ok .ed-mark::after { border-color: #05230f; }",
    ".ed-opt.no { background: color-mix(in srgb, var(--ed-no) 14%, transparent); } .ed-opt.no .ed-mark { background: var(--ed-no); box-shadow: none; }",
    ".ed-opt.no .ed-mark::after { left: 5.6px; top: 9.4px; width: 10.6px; height: 0; border-left: 0; border-bottom: 2.3px solid #2b1f06; transform: scale(1); }",
    ".ed-opt.dim { opacity: .42; } .ed-opt:disabled { cursor: default; }",
    ".ed-q-say { margin-top: 16px; font: 400 15.5px/1.55 var(--text); color: rgba(255,255,255,.82); }",
    ".ed-q-say:empty { display: none; } .ed-q-say b { font-weight: 650; } .ed-q-say.ok > b:first-child { color: var(--ed-ok); } .ed-q-say.no > b:first-child { color: var(--ed-no); }",
    ".ed-q-say .ch-ln, .ed-model .ch-ln { display: block; } .ed-q-say .ch-ln + .ch-ln, .ed-model .ch-ln + .ch-ln { margin-top: 5px; }",
    ".ed-q-bar { flex: none; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; padding: 14px 22px 18px 24px; } .ed-q-bar .sp { flex: 1; }",
    ".ed-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 46px; padding: 0 24px; border-radius: 99px; border: 0; font: 600 15.5px/1 var(--text); letter-spacing: -.01em;",
    "  color: #fff; background: rgba(255,255,255,.11); transition: transform .15s, background .2s, filter .2s, opacity .2s; }",
    ".ed-btn:hover:not(:disabled) { background: rgba(255,255,255,.17); } .ed-btn:active:not(:disabled) { transform: scale(.97); }",
    ".ed-btn.pri { background: var(--ed-acc); } .ed-btn.pri:hover:not(:disabled) { background: var(--ed-acc); filter: brightness(1.12); }",
    ".ed-btn:disabled { opacity: .38; } .ed-btn svg { width: 17px; height: 17px; }",
    ".ed-btn.ghost { background: none; color: rgba(255,255,255,.62); padding: 0 14px; } .ed-btn.ghost:hover:not(:disabled) { color: #fff; background: rgba(255,255,255,.09); }",
    ".ed-ta, .ed-wta { display: block; width: 100%; box-sizing: border-box; resize: none; border: 0; outline: 0; border-radius: 17px; padding: 17px 19px; color: inherit; background: rgba(255,255,255,.07);",
    "  font: 400 17px/1.58 var(--text); letter-spacing: -.008em; box-shadow: inset 0 0 0 1.5px transparent; transition: box-shadow .25s; }",
    ".ed-ta:focus, .ed-wta:focus { box-shadow: inset 0 0 0 1.5px var(--ed-acc); } .ed-ta[readonly], .ed-wta[readonly] { box-shadow: none; } .ed-ta::placeholder, .ed-wta::placeholder { color: rgba(255,255,255,.34); }",
    ".ed-model { margin-top: 14px; padding: 16px 19px; border-radius: 17px; background: rgba(255,255,255,.06); font: 400 15.5px/1.6 var(--text); color: rgba(255,255,255,.86); }",
    ".ed-model b { display: block; margin-bottom: 4px; font: 700 11px/1 var(--text); letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.5); } .ed-model p { margin: 0; }",
    ".ed-rate { display: flex; align-items: center; gap: 8px; margin-top: 14px; } .ed-rate span { flex: 1; font: 500 15px/1 var(--text); color: rgba(255,255,255,.7); }",
    /* the reading */
    ".ed-doc { max-width: 640px; margin: 0 auto; text-align: left; }",
    ".ed-doc-top { display: flex; align-items: center; justify-content: space-between; min-height: 40px; margin-bottom: 18px; }",
    ".ed-doc-meta { display: flex; align-items: center; font: 500 13.5px/1 var(--text); color: var(--ink-3, #9a9aa6); font-variant-numeric: tabular-nums; }",
    ".ed-listen { color: var(--ink-2, #c9c9d1); height: 38px; padding: 0 14px; } .ed-listen.on { color: var(--ed-acc); }",
    ".ed-doc .hk-page { gap: 0; }",
    ".ed-doc .hk-p { margin: 0 0 1.1em; font: 400 19px/1.72 var(--text); letter-spacing: -.006em; color: var(--prose, #ececf0); }",
    ".ed-doc .hk-figw { margin: 4px 0 28px; } .ed-doc .hk-figw img { border-radius: 20px; }",
    ".ed-doc .hk-note { margin: 4px 0 24px; padding: 16px 20px; border-radius: 18px; background: rgba(255,255,255,.05); color: var(--ink-2, #c9c9d1); font-size: 16.5px; }",
    ".ed-doc .hk-note > b { color: var(--ink-3, #9a9aa6); }",
    ".ed-doc .hk-ask { margin: 8px 0 8px; padding: 2px 0 2px 18px; border-radius: 0; background: none; box-shadow: inset 2px 0 0 var(--ed-acc); font-size: 18px; }",
    ".ed-doc .hk-ask .hk-ic { display: none; }",
    ".ed-doc .ed-q { display: block; width: 100%; margin: 6px 0 30px; padding: 24px 26px 20px; overflow: visible; background: var(--sunk, #232326); box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); }",
    ".ed-doc .ed-q-main { padding: 0; overflow: visible; } .ed-doc .ed-q-bar { padding: 18px 0 0; }",
    ".ed-doc .ed-q.done { background: transparent; padding-top: 16px; padding-bottom: 12px; }",
    ".ed-doc .ed-q.done .ed-q-t { font-size: 18px; color: var(--ink-2, #c9c9d1); }",
    ".ed-doc .ed-q-t { font-size: 20px; }",
    /* the writing */
    ".ed-write { max-width: 640px; margin: 0 auto; text-align: left; display: flex; flex-direction: column; gap: 14px; color: var(--ink, #fff); }",
    ".ed-recall { margin: 0; padding: 14px 18px; border-radius: 16px; background: rgba(255,255,255,.04); font: 400 15px/1.55 var(--text); color: var(--ink-3, #9a9aa6); }",
    ".ed-recall q { color: var(--ink-2, #c9c9d1); font-style: italic; } .ed-recall q::before { content: '\\201C'; } .ed-recall q::after { content: '\\201D'; }",
    ".ed-wta { min-height: 140px; font-size: 18px; padding: 20px 22px; }",
    ".ed-frames { display: flex; flex-wrap: wrap; gap: 8px; }",
    ".ed-frame { padding: 9px 15px; border-radius: 99px; border: 0; background: rgba(255,255,255,.07); color: var(--ink-2, #c9c9d1); font: 500 14.5px/1 var(--text); transition: background .2s, color .2s, transform .15s; }",
    ".ed-frame:hover { background: rgba(255,255,255,.13); color: #fff; } .ed-frame:active { transform: scale(.96); }",
    ".ed-wrow { display: flex; align-items: center; justify-content: space-between; } .ed-wrow[hidden], .ed-frames[hidden] { display: none; }",
    ".ed-wc { font: 500 13.5px/1 var(--text); color: var(--ink-3, #9a9aa6); font-variant-numeric: tabular-nums; }",
    ".ed-rub { display: grid; border-radius: 17px; overflow: hidden; background: rgba(255,255,255,.06); }",
    ".ed-rub > b { padding: 14px 18px 8px; font: 700 11px/1 var(--text); letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.5); }",
    ".ed-rrow { border-top: 0; min-height: 52px; font-size: 16px; }",
    ".ed-rub-s { margin: 0; font: 500 15px/1.5 var(--text); color: var(--ink-2, #c9c9d1); }",
    ".ed-write .ed-model, .ed-write .ed-rub { margin-top: 0; }",
    /* a short panel (a small window) is denser, so a question still fits in it */
    "@container (max-height: 560px) { .ed-q-main { padding: 16px 20px 2px; } .ed-q-k { margin-bottom: 7px; } .ed-q-t { font-size: 18.5px; margin-bottom: 11px; }",
    "  .ed-opt { min-height: 40px; padding: 6px 13px; font-size: 15px; gap: 12px; } .ed-mark { width: 20px; height: 20px; } .ed-q-say { margin-top: 9px; font-size: 14px; line-height: 1.45; } .ed-q-bar { padding: 8px 14px 12px; }",
    "  .ed-btn { height: 40px; padding: 0 18px; font-size: 14.5px; } .ed-ta { font-size: 15.5px; padding: 11px 14px; min-height: 0; } }",
    "@container (max-height: 430px) { .ed-q-k { display: none; } .ed-q-main { padding-top: 14px; } }",
    "@media (prefers-reduced-motion: reduce) { .ed-watch *, .ed-doc *, .ed-write * { transition: none !important; animation: none !important; } }"
  ].join("\n")));
  document.head.appendChild(st);
})();
