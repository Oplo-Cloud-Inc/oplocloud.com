/* ==========================================================================
   Oplo Annotate.

   Highlighting is not annotation. A yellow streak across a sentence records
   that you were looking at it, which is the least interesting thing about a
   reader. What a serious reader leaves behind is an argument: this is the
   claim, this is what it rests on, here is where I stopped believing it, and
   here is the other passage it collides with. That is the difference between
   a marked-up page and a page you can write an essay from, and it is the
   difference this file exists to make.

   Three things are load-bearing.

   1. THE TAXONOMY. Six passes, not a colour picker. Marking a definition is a
      different intellectual act from marking a claim, and marking an
      objection is a different act again — the one most students never learn
      to make. Naming them separately is what turns a re-read into a review.

   2. THE ANCHOR. A mark is stored as a quotation with its surroundings, not
      as a pointer into a DOM that will not exist after the next render. So a
      mark survives a reload, a re-render, and — within reason — an edit to
      the text around it. This is the W3C text-quote idea: exact, prefix,
      suffix, plus a remembered offset used only as a tie-breaker.

   3. THE CITATION. A quotation you cannot attribute is a quotation you cannot
      use. Every mark carries its section, and can be rendered in MLA, APA or
      Chicago on the way to the clipboard.

   No network in this file. Marks live in localStorage under the reader's own
   id, so two people on one machine do not read each other's notebook by
   accident, and a reader with no connection loses nothing.

   A `remote` may be attached from outside — `Store.connect()` — and then the
   local copy is a cache in front of it: every write is saved locally first
   and pushed afterwards, so the reading never waits for a request and a
   failed request never costs a mark. Which server, and whether there is one
   at all, is not this file's business; it knows only `pull`, `push` and
   `drop`.
   ========================================================================== */
window.OPLO_ANNOTATE = (function () {
  "use strict";

  /* ------------------------------------------------------------- Taxonomy
     The order is the order a close reading actually happens in: you learn the
     vocabulary, you find the argument, you test what holds it up, you notice
     what you did not follow, you push back, and then you see what it touches.

     `weight` is what a pass is worth when the notebook scores how hard a
     reading was. Underlining a definition is honest work; writing an
     objection is harder work, and the numbers say so. */
  var PASSES = [
    { n: 1, key: "term", name: "Term", short: "Term", k: "1",
      hue: "#f2c200", wash: "rgba(255,214,10,.34)", ink: "#5c4400",
      what: "A word this unit will test you on.",
      ask: "Say it back without looking.", weight: 1 },
    { n: 2, key: "claim", name: "Claim", short: "Claim", k: "2",
      hue: "#8f5cff", wash: "rgba(143,92,255,.24)", ink: "#3d1d80",
      what: "Something the text is asserting is true.",
      ask: "What is being asserted, in your words?", weight: 2 },
    { n: 3, key: "evidence", name: "Evidence", short: "Evid.", k: "3",
      hue: "#34c759", wash: "rgba(52,199,89,.26)", ink: "#0b4a24",
      what: "A fact, figure or example holding a claim up.",
      ask: "Which claim does this support?", weight: 2 },
    { n: 4, key: "question", name: "Question", short: "Q", k: "4",
      hue: "#4da3ff", wash: "rgba(77,163,255,.26)", ink: "#0a3a6b",
      what: "You did not follow this.",
      ask: "What exactly is unclear?", weight: 2 },
    { n: 5, key: "objection", name: "Objection", short: "Obj.", k: "5",
      hue: "#ff453a", wash: "rgba(255,69,58,.22)", ink: "#7a0d06",
      what: "You are not convinced.",
      ask: "What would have to be true for this to hold?", weight: 3 },
    { n: 6, key: "connection", name: "Connection", short: "Conn.", k: "6",
      hue: "#ff9f0a", wash: "rgba(255,159,10,.26)", ink: "#6b3b00",
      what: "This meets something else you have read.",
      ask: "What does it meet, and does it agree?", weight: 3 }
  ];

  var BY_N = {};
  PASSES.forEach(function (p) { BY_N[p.n] = p; });
  function pass(n) { return BY_N[n] || PASSES[0]; }

  /* ------------------------------------------------------------- Anchoring
     Everything below works in one coordinate system: the offset of a
     character in the root element's visible text, counting only the text
     nodes a reader can actually see. Ranges go in, offsets come out, offsets
     go back in, ranges come out. */

  function walker(root) {
    return document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        // A mark's own text still counts as text — otherwise the second
        // annotation on a paragraph would be measured against a shorter
        // document than the first one was.
        var p = n.parentNode;
        while (p && p !== root) {
          var tag = p.nodeName;
          if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
          p = p.parentNode;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
  }

  function textOf(root) {
    var w = walker(root), s = "", n;
    while ((n = w.nextNode())) s += n.nodeValue;
    return s;
  }

  /* Offset -> a concrete place in the DOM. Returns null past the end. */
  function place(root, offset) {
    var w = walker(root), seen = 0, n;
    while ((n = w.nextNode())) {
      var len = n.nodeValue.length;
      if (seen + len >= offset) return { node: n, offset: offset - seen };
      seen += len;
    }
    return null;
  }

  function offsetOf(root, node, nodeOffset) {
    var w = walker(root), seen = 0, n;
    while ((n = w.nextNode())) {
      if (n === node) return seen + nodeOffset;
      seen += n.nodeValue.length;
    }
    return -1;
  }

  var CONTEXT = 40;

  /* A range becomes a quotation that knows where it was standing. */
  function anchor(root, range) {
    var start = offsetOf(root, range.startContainer, range.startOffset);
    var end = offsetOf(root, range.endContainer, range.endOffset);
    if (start < 0 || end < 0 || end <= start) return null;
    var all = textOf(root);
    return {
      exact: all.slice(start, end),
      prefix: all.slice(Math.max(0, start - CONTEXT), start),
      suffix: all.slice(end, end + CONTEXT),
      start: start
    };
  }

  /* And a quotation finds its way home.

     Three attempts, in descending order of trust: the remembered offset if
     the text there still matches; then the occurrence whose neighbours look
     most like the remembered neighbours; then, if the quotation appears
     exactly once, that one. If none of those hold, the mark is orphaned —
     which the notebook says out loud rather than quietly dropping it. */
  function locate(root, a) {
    if (!a || !a.exact) return null;
    var all = textOf(root), exact = a.exact, at = -1;

    if (a.start != null && all.substr(a.start, exact.length) === exact) {
      at = a.start;
    } else {
      var hits = [], i = all.indexOf(exact);
      while (i > -1 && hits.length < 64) { hits.push(i); i = all.indexOf(exact, i + 1); }
      if (hits.length === 1) at = hits[0];
      else if (hits.length > 1) {
        var best = -1, score = -1;
        hits.forEach(function (h) {
          var p = all.slice(Math.max(0, h - CONTEXT), h);
          var s = all.slice(h + exact.length, h + exact.length + CONTEXT);
          var v = tail(p, a.prefix || "") + head(s, a.suffix || "");
          if (v > score) { score = v; best = h; }
        });
        at = best;
      }
    }
    if (at < 0) return null;

    var from = place(root, at), to = place(root, at + exact.length);
    if (!from || !to) return null;
    var r = document.createRange();
    r.setStart(from.node, from.offset);
    r.setEnd(to.node, to.offset);
    return r;
  }

  // How many characters two strings share at the join.
  function tail(a, b) {
    var n = Math.min(a.length, b.length), i = 0;
    while (i < n && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
    return i;
  }
  function head(a, b) {
    var n = Math.min(a.length, b.length), i = 0;
    while (i < n && a[i] === b[i]) i++;
    return i;
  }

  /* ---------------------------------------------------------------- Paint
     Wrapping the Range itself breaks the moment a selection crosses an
     element boundary, which in a real article is most of the time. So the
     text nodes inside the range are collected first and wrapped one at a
     time — that survives paragraphs, definitions and lists alike.

     Marks may also overlap, and overlapping marks are the interesting ones:
     the sentence that is both a claim and the thing you object to. A nested
     <mark> handles that without any bookkeeping, and the CSS blends them. */
  function paint(root, range, m) {
    var nodes = [], w = walker(root), n;
    while ((n = w.nextNode())) if (range.intersectsNode(n) && n.nodeValue.length) nodes.push(n);
    if (!nodes.length) return false;

    var made = 0;
    nodes.forEach(function (node) {
      var from = (node === range.startContainer) ? range.startOffset : 0;
      var to = (node === range.endContainer) ? range.endOffset : node.nodeValue.length;
      if (to <= from) return;
      var mid = node;
      if (to < node.nodeValue.length) mid.splitText(to);
      if (from > 0) mid = mid.splitText(from);
      var el = document.createElement("mark");
      el.className = className(m);
      el.dataset.id = m.id;
      el.dataset.pass = m.pass;
      if (m.by) el.dataset.by = m.by;
      mid.parentNode.replaceChild(el, mid);
      el.appendChild(mid);
      made++;
    });
    return made > 0;
  }

  function className(m) {
    return "hl p" + m.pass + (m.note ? " noted" : "") + (m.by ? " theirs" : "");
  }

  function unpaint(root, id) {
    var live = (root || document).querySelectorAll('mark[data-id="' + id + '"]');
    [].forEach.call(live, function (n) {
      var parent = n.parentNode;
      while (n.firstChild) parent.insertBefore(n.firstChild, n);
      parent.removeChild(n);
      parent.normalize();
    });
  }

  /* Re-hang every mark for a section onto freshly rendered text. Painted
     longest-first so a short mark inside a long one nests rather than
     colliding with a node that has already been split. */
  function restore(root, marks) {
    var ok = [], lost = [];
    marks.slice().sort(function (a, b) {
      return (b.anchor.exact || "").length - (a.anchor.exact || "").length;
    }).forEach(function (m) {
      var r = locate(root, m.anchor);
      if (r && paint(root, r, m)) ok.push(m.id); else lost.push(m.id);
    });
    return { placed: ok, orphaned: lost };
  }

  /* -------------------------------------------------------------- Citation
     Three styles, because a student is asked for different ones by different
     teachers and retyping a citation is how a quotation gets misattributed.
     `src` carries the work: title, container, author, year, publisher. */
  function cite(m, src, style) {
    var s = src || {};
    var where = m.sec ? " " + m.sec : "";
    if (style === "apa") {
      return (s.author || s.publisher || "OEdu") + " (" + (s.year || "n.d.") + "). " +
             (s.title || "Untitled") + ". " + (s.container || "") +
             (where ? " (§" + m.sec + ")" : "") + ".";
    }
    if (style === "chicago") {
      return (s.author || s.publisher || "OEdu") + ", “" + (s.title || "Untitled") +
             ",” " + (s.container || "") + ", " + (s.year || "n.d.") +
             (where ? ", §" + m.sec : "") + ".";
    }
    // MLA by default: the style most of these students are marked against.
    return (s.author || s.publisher || "OEdu") + ". “" + (s.title || "Untitled") +
           ".” " + (s.container || "") + ", " + (s.year || "n.d.") +
           (where ? ", sec. " + m.sec : "") + ".";
  }

  function quoted(m, src, style) {
    return "“" + m.text + "”\n— " + cite(m, src, style);
  }

  /* ----------------------------------------------------------------- Store
     One key per reader. Writes are debounced because a student dragging
     through a paragraph generates a lot of them, and localStorage is
     synchronous.

     `docId` is the thing being read — a unit. `sec` is the section inside it.
     Keeping both means the notebook can show a whole unit at once while a
     section still knows which marks are its own. */
  function Store(personId, docId) {
    this.key = "oplo.annot." + (personId || "anon") + "." + (docId || "doc");
    this.marks = [];
    this.subs = [];
    this.load();
  }

  Store.prototype.load = function () {
    try {
      var raw = localStorage.getItem(this.key);
      this.marks = raw ? JSON.parse(raw) : [];
    } catch (e) { this.marks = []; }
    if (!Array.isArray(this.marks)) this.marks = [];
    // Anything without an anchor is from a build that could not survive a
    // reload. Drop it rather than render something that cannot be found.
    this.marks = this.marks.filter(function (m) { return m && m.anchor && m.anchor.exact; });
  };

  Store.prototype.save = function () {
    var self = this;
    clearTimeout(this._t);
    this._t = setTimeout(function () {
      try { localStorage.setItem(self.key, JSON.stringify(self.marks)); }
      catch (e) { /* full or private; the session still works, it just forgets */ }
    }, 120);
    this.subs.forEach(function (fn) { fn(self.marks); });
  };

  /* --------------------------------------------------------- The remote
     Attach a server and the store becomes the near half of a pair. The order
     matters and is the whole design: local write, then push. A student who
     marks a sentence on a train has marked it — the sync is the app's
     problem, not theirs, and a rejected push leaves the mark exactly where
     they put it.

     `remote` is { pull(scope), push(mark), drop(id) }, each returning a
     promise. Nothing here inspects what it talks to. */
  Store.prototype.connect = function (remote, scope) {
    var self = this;
    this.remote = remote;
    this.scope = scope;
    if (!remote || !remote.pull) return Promise.resolve(this.marks);
    return remote.pull(scope).then(function (rows) {
      // Anything the server has that we do not is merged in; anything we have
      // that it does not is pushed. A mark is only ever added or edited by
      // the one person who owns it, so newest-wins needs no tie-break beyond
      // the timestamp the writer stamped on it.
      var seen = {};
      (rows || []).forEach(function (m) {
        if (!m || !m.anchor || !m.anchor.exact) return;
        seen[m.id] = true;
        self.receive(m);
      });
      self.marks.forEach(function (m) { if (!seen[m.id]) self.push(m); });
      self.save();
      return self.marks;
    }).catch(function () {
      // Offline, signed out, or the server is down. The reading continues on
      // the local copy, which is the whole reason it is written first.
      return self.marks;
    });
  };

  Store.prototype.push = function (m) {
    if (!this.remote || !this.remote.push) return;
    var body = {
      id: m.id, scope: this.scope, sec: m.sec, pass: m.pass,
      text: m.text, anchor: m.anchor, note: m.note || "",
      at: m.at, courseId: this.courseId || null
    };
    try { this.remote.push(body).catch(function () {}); } catch (e) { /* offline */ }
  };

  Store.prototype.subscribe = function (fn) { this.subs.push(fn); };
  Store.prototype.all = function () { return this.marks; };
  Store.prototype.inSection = function (sec) {
    return this.marks.filter(function (m) { return m.sec === sec; });
  };
  Store.prototype.byId = function (id) {
    return this.marks.filter(function (m) { return m.id === id; })[0] || null;
  };

  Store.prototype.add = function (m) {
    m.id = m.id || "m" + Date.now().toString(36) + Math.floor(Math.random() * 1e5).toString(36);
    m.at = m.at || Date.now();
    m.note = m.note || "";
    m.tags = m.tags || [];
    m.links = m.links || [];
    this.marks.push(m);
    this.save();
    if (!this._quiet) this.push(m);
    return m;
  };

  Store.prototype.update = function (id, patch) {
    var m = this.byId(id);
    if (!m) return null;
    for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) m[k] = patch[k];
    if (!this._quiet) m.edited = Date.now();
    this.save();
    if (!this._quiet) this.push(m);
    return m;
  };

  Store.prototype.remove = function (id) {
    this.marks = this.marks.filter(function (m) { return m.id !== id; });
    // A link pointing at a mark that no longer exists is a dead end, so the
    // links go with it.
    this.marks.forEach(function (m) {
      if (m.links && m.links.length) {
        m.links = m.links.filter(function (l) { return l !== id; });
      }
    });
    this.save();
    if (!this._quiet && this.remote && this.remote.drop) {
      try { this.remote.drop(id).catch(function () {}); } catch (e) { /* offline */ }
    }
  };

  /* Merge a mark that arrived from someone else's browser. Theirs wins on
     content; ours wins on nothing, because we did not write it. */
  Store.prototype.receive = function (m) {
    // Quiet, because a mark that arrived from somewhere else must not be sent
    // straight back to it, and must not have its timestamp rewritten on the
    // way in — newest-wins needs the writer's stamp, not the receiver's.
    this._quiet = true;
    try {
      var mine = this.byId(m.id);
      if (mine) {
        if ((m.edited || m.at || 0) >= (mine.edited || mine.at || 0)) this.update(m.id, m);
        return mine;
      }
      return this.add(m);
    } finally { this._quiet = false; }
  };

  /* --------------------------------------------------------------- Reading
     What the marks say about how this was read. Not a score out of ten —
     a shape. Six terms and nothing else is a vocabulary pass. Four objections
     and a connection is a seminar.

     `depth` is the weighted count normalised against a reading that made a
     couple of marks of every kind. It says how far past underlining you got. */
  function profile(marks) {
    var count = {}, weight = 0, noted = 0, tags = {};
    PASSES.forEach(function (p) { count[p.key] = 0; });
    marks.forEach(function (m) {
      var p = pass(m.pass);
      count[p.key]++;
      weight += p.weight;
      if (m.note) { noted++; weight += 1; }
      (m.tags || []).forEach(function (t) { tags[t] = (tags[t] || 0) + 1; });
    });
    var full = PASSES.reduce(function (a, p) { return a + p.weight * 2; }, 0);
    return {
      total: marks.length,
      count: count,
      noted: noted,
      weight: weight,
      depth: Math.min(100, Math.round(weight / full * 100)),
      tags: Object.keys(tags).sort(function (a, b) { return tags[b] - tags[a]; }),
      tagCount: tags,
      shape: shape(count, noted, marks.length)
    };
  }

  /* One honest sentence about the reading, which is worth more than a chart.
     The order of these tests is the order of the diagnosis: say the thing
     that is most worth hearing, and say only that. */
  function shape(c, noted, total) {
    if (!total) return "Nothing marked yet.";
    if (c.objection >= 2 && c.evidence >= 2) return "A reading that argues back. This is the good one.";
    if (c.term && !c.claim && !c.evidence && !c.objection) return "A vocabulary pass. Come back for the argument.";
    if (c.claim && !c.evidence) return "You found the claims but not what holds them up.";
    if (c.evidence && !c.claim) return "You marked the evidence without marking what it is evidence for.";
    if (c.question >= 3 && !noted) return "Plenty of questions and no notes. Write down what is unclear.";
    if (!noted && total >= 5) return "All highlight, no writing. The notes are where the learning is.";
    if (c.connection) return "You are reading this against something else. Keep doing that.";
    return "A careful pass. Try marking one thing you do not believe.";
  }

  /* ------------------------------------------------------------- Threads
     Claims with the evidence and objections attached to them. This is the
     view an essay actually comes out of: not a list of highlights in page
     order, but the argument reassembled with its supports and its holes.

     A link is explicit — the student said these two go together — so nothing
     here is inferred, which means nothing here is wrong. */
  function threads(marks) {
    var by = {};
    marks.forEach(function (m) { by[m.id] = m; });

    var claims = marks.filter(function (m) { return m.pass === 2; });
    var used = {};
    var out = claims.map(function (c) {
      var kids = (c.links || []).map(function (id) { return by[id]; }).filter(Boolean);
      // Links run both ways: something that points at this claim belongs to it.
      marks.forEach(function (m) {
        if (m.id !== c.id && (m.links || []).indexOf(c.id) > -1 && kids.indexOf(m) < 0) kids.push(m);
      });
      kids.forEach(function (k) { used[k.id] = 1; });
      used[c.id] = 1;
      return {
        claim: c,
        evidence: kids.filter(function (k) { return k.pass === 3; }),
        objections: kids.filter(function (k) { return k.pass === 5; }),
        questions: kids.filter(function (k) { return k.pass === 4; }),
        other: kids.filter(function (k) { return [3, 4, 5].indexOf(k.pass) < 0; })
      };
    });
    return { threads: out, loose: marks.filter(function (m) { return !used[m.id]; }) };
  }

  return {
    PASSES: PASSES, pass: pass,
    anchor: anchor, locate: locate, paint: paint, unpaint: unpaint, restore: restore,
    className: className, textOf: textOf,
    cite: cite, quoted: quoted,
    Store: Store, profile: profile, threads: threads
  };
})();
