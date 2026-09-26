/* ==========================================================================
   OEdu Lab — interactive math courses. The core.

   A math course here is taught the way Brilliant teaches and practised the
   way Khan Academy practises:

     lessons    short interactive paths. The idea is met by moving something —
                weights on a balance, a point on a line, a slider under a
                graph — and named only after it has been seen. Problems come
                before explanations, and every wrong answer has its own reply.
     practice   one skill at a time, five fresh problems generated for every
                sitting, each with hints and a worked solution. Four of five
                right lifts the skill a level.
     tests      a unit test draws one problem from every skill in the unit; the
                course challenge draws from every unit. Right answers lift a
                skill towards Mastered, wrong ones take it down a level.

   Mastery levels (Khan's four, plus nothing):
     0 Not started · 1 Attempted · 2 Familiar · 3 Proficient · 4 Mastered

   This file holds what every math course needs: a small math typesetter
   (`$\frac{3}{4}x$` in any text), an expression engine that can tell whether
   two expressions are the same function, answer types built on it, the
   record, the lazy loader for course files, and the unit page. The
   manipulatives are in lab/widgets.js; the courses in their own folders
   (learn/alg/ for Algebra I). All three are loaded only when a student opens
   a lab course.
   ========================================================================== */
window.OPLO_LAB = (function () {
  "use strict";

  var API = window.OPLO_API;
  var CH = window.OPLO_CHALLENGE;

  /* Files loaded on demand, with the stamp that busts their cache. Kept up to
     date by tools/lab_stamps.py. */
  var FILES = {
    "lab/widgets.js": "ed7a4947",
    "lab/bizkit.js": "186a8759",
    "alg/u01.js": "36485330",
    "alg/u02.js": "e1ae3453",
    "g8/u01.js": "3c0c775e",
    "geo/u01.js": "637e74c0",
    "biz/u01.js": "5c45e6c8"
  };

  /* ------------------------------------------------------------ Helpers */
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
  function button(cls, html) { var b = el("button", cls, html); b.type = "button"; return b; }

  /* ================================================================ Math
     A small TeX: enough for a school algebra course, set in the page's own
     type so it sits in a sentence instead of floating above it.

       \frac{a}{b}  \sqrt{x}  \sqrt[3]{x}  x^{2}  x_1  \le \ge \ne \pm \cdot
       \times \div \pi \infty \to \approx \text{words}  \,  \left( \right)

     Letters are variables (italic); digits and words in \text are upright; a
     minus is a real minus, with space round it when it joins two terms and
     none when it makes a number negative. */
  var SYM = {
    le: "≤", ge: "≥", ne: "≠", pm: "±", mp: "∓", cdot: "·", times: "×", div: "÷", pi: "π",
    infty: "∞", to: "→", approx: "≈", lt: "<", gt: ">", theta: "θ", alpha: "α", beta: "β",
    Delta: "Δ", delta: "δ", circ: "°", deg: "°", ldots: "…", cdots: "⋯", neq: "≠", leq: "≤", geq: "≥",
    in: "∈", sqrt: "√", checkmark: "✓", cancel: "", quad: " ", qquad: "  ",
    Rightarrow: "⇒", implies: "⇒", iff: "⇔", perp: "⊥", parallel: "∥", angle: "∠", triangle: "△",
    emptyset: "∅", cup: "∪", cap: "∩", mid: "∣", star: "⋆", bullet: "•", square: "□", Box: "□",
    cong: "≅", sim: "∼", prime: "′", odot: "⊙"
  };
  var REL = { "=": 1, "<": 1, ">": 1, "≤": 1, "≥": 1, "≠": 1, "≈": 1, "→": 1, "⇒": 1, "⇔": 1, "∈": 1, "≅": 1, "∼": 1 };
  var BIN = { "+": 1, "−": 1, "±": 1, "∓": 1, "·": 1, "×": 1, "÷": 1 };

  function mathHTML(src) {
    var i = 0, s = String(src);
    function group() {            // {…} or one token
      while (s[i] === " ") i++;
      if (s[i] === "{") {
        var depth = 1, j = i + 1;
        while (j < s.length && depth) { if (s[j] === "{") depth++; else if (s[j] === "}") depth--; j++; }
        var inner = s.slice(i + 1, j - 1);
        i = j;
        return inner;
      }
      if (s[i] === "\\") {
        var m = /^\\([a-zA-Z]+)/.exec(s.slice(i));
        if (m) { i += m[0].length; return "\\" + m[1]; }
      }
      return s[i++] || "";
    }
    var out = [], prev = "start";   // kind of the last thing emitted: start | op | rel | open | val
    function push(html, kind) { out.push(html); prev = kind; }
    function op(ch) {
      if ((ch === "−" || ch === "+" || ch === "±") && (prev === "start" || prev === "op" || prev === "rel" || prev === "open")) {
        push('<span class="mu">' + ch + "</span>", "op");     // a sign, not an operation
      } else if (REL[ch]) push('<span class="mrel">' + ch + "</span>", "rel");
      else push('<span class="mo">' + ch + "</span>", "op");
    }
    while (i < s.length) {
      var c = s[i];
      if (c === "\\") {
        var m = /^\\([a-zA-Z]+|[,;! ])/.exec(s.slice(i));
        if (!m) { i++; continue; }
        var cmd = m[1];
        i += m[0].length;
        if (cmd === "frac" || cmd === "dfrac" || cmd === "tfrac") {
          var a = group(), b = group();
          push('<span class="mf"><span class="mf-n">' + mathHTML(a) + '</span><span class="mf-d">' + mathHTML(b) + "</span></span>", "val");
        } else if (cmd === "sqrt") {
          var idx = "";
          if (s[i] === "[") { var k = s.indexOf("]", i); idx = s.slice(i + 1, k); i = k + 1; }
          var body = group();
          push('<span class="mr">' + (idx ? '<span class="mr-i">' + mathHTML(idx) + "</span>" : "") +
               '<span class="mr-s">√</span><span class="mr-b">' + mathHTML(body) + "</span></span>", "val");
        } else if (cmd === "overline" || cmd === "bar") {
          // The bar over a repeating decimal: 0.\overline{27} — and over a
          // segment's two letters: \overline{AB}.
          push('<span class="mov">' + mathHTML(group()) + "</span>", "val");
        } else if (cmd === "overrightarrow" || cmd === "overleftrightarrow") {
          // A ray, \overrightarrow{AB}: one arrowhead. A line,
          // \overleftrightarrow{AB}: one at each end.
          push('<span class="mray' + (cmd === "overleftrightarrow" ? " both" : "") + '"><span class="mrh" aria-hidden="true"></span>' +
               mathHTML(group()) + "</span>", "val");
        } else if (cmd === "xrightarrow") {
          push('<span class="marr"><span class="marr-l">' + mathHTML(group()) + "</span><span>⟶</span></span>", "rel");
        } else if (cmd === "text" || cmd === "mathrm" || cmd === "textrm") {
          push('<span class="mt">' + esc(group()) + "</span>", "val");
        } else if (cmd === "mathbf" || cmd === "boldsymbol") {
          push("<b>" + mathHTML(group()) + "</b>", "val");
        } else if (cmd === "overline") {
          push('<span class="mol">' + mathHTML(group()) + "</span>", "val");
        } else if (cmd === "cancel") {
          push('<span class="mcx">' + mathHTML(group()) + "</span>", "val");
        } else if (cmd === "color") {
          var col = group(), what = group();
          push('<span class="mc-' + esc(col) + '">' + mathHTML(what) + "</span>", "val");
        } else if (cmd === "left" || cmd === "right" || cmd === "big" || cmd === "Big") {
          /* size hints: the brackets that follow are enough */
        } else if (cmd === "," || cmd === ";" || cmd === " ") {
          push('<span class="msp"></span>', prev);
        } else if (cmd === "!") {
          /* negative space: ignored */
        } else if (cmd === "sin" || cmd === "cos" || cmd === "tan" || cmd === "log" || cmd === "ln" || cmd === "max" || cmd === "min") {
          push('<span class="mt">' + cmd + "</span>", "val");
        } else if (SYM[cmd] != null) {
          var ch = SYM[cmd];
          if (REL[ch] || BIN[ch]) op(ch); else push(ch, "val");
        } else push(esc(cmd), "val");
        continue;
      }
      if (c === "^" || c === "_") {
        i++;
        var g = group();
        push("<" + (c === "^" ? "sup" : "sub") + ">" + mathHTML(g) + "</" + (c === "^" ? "sup" : "sub") + ">", "val");
        continue;
      }
      if (c === " ") { i++; continue; }
      if (c === "'") { i++; push("′", "val"); continue; }     // A' — a prime, not an apostrophe
      if (c === "\u0001") { i++; push("$", "val"); continue; }
      if (c === "-" || c === "−") { i++; op("−"); continue; }
      if (c === "+") { i++; op("+"); continue; }
      if (c === "*") { i++; op("·"); continue; }
      if (c === "<" && s[i + 1] === "=") { i += 2; op("≤"); continue; }
      if (c === ">" && s[i + 1] === "=") { i += 2; op("≥"); continue; }
      if (c === "=" || c === "<" || c === ">" || c === "≤" || c === "≥" || c === "≠" || c === "≈") { i++; op(c === "<" ? "&lt;" : c === ">" ? "&gt;" : c); if (c === "<" || c === ">") out[out.length - 1] = '<span class="mrel">' + (c === "<" ? "&lt;" : "&gt;") + "</span>"; continue; }
      if (c === "(" || c === "[") { i++; push(c, "open"); continue; }
      if (c === ")" || c === "]") { i++; push(c, "val"); continue; }
      if (c === "{" || c === "}") { i++; continue; }
      if (c === ",") { i++; push(",<span class='msp'></span>", "open"); continue; }
      if (c === "|") { i++; push('<span class="mbar">|</span>', prev === "val" ? "val" : "open"); continue; }
      if (/[0-9.]/.test(c)) {
        var mm = /^[0-9]*\.?[0-9]+|^[0-9]+/.exec(s.slice(i));
        // A point with no digits after it — "0.\overline{3}" — is just a point.
        if (!mm) { i++; push('<span class="mn">' + c + "</span>", "val"); continue; }
        i += mm[0].length;
        push('<span class="mn">' + mm[0] + "</span>", "val");
        continue;
      }
      if (/[a-zA-Z]/.test(c)) { i++; push('<i class="mv">' + c + "</i>", "val"); continue; }
      i++;
      push(esc(c), "val");
    }
    return out.join("");
  }
  function m(src) { return '<span class="m">' + mathHTML(src) + "</span>"; }
  /* Text with math in it: $…$ inline, $$…$$ on its own line. */
  function fmt(text) {
    if (text == null || typeof text !== "string") return text;
    if (text.indexOf("$") < 0 && text.indexOf("*") < 0) return text;
    // \$ is a dollar sign, not a delimiter — in the words or in the math.
    text = text.replace(/\\\$/g, "\u0001");
    // Math first; *emphasis* and **bold** only in the words between.
    var parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/);
    return parts.map(function (p) {
      if (/^\$\$[^$]+\$\$$/.test(p)) return '<span class="m md">' + mathHTML(p.slice(2, -2)) + "</span>";
      if (/^\$[^$]+\$$/.test(p)) return m(p.slice(1, -1));
      return p.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/(^|[^\w*])\*([^*\s][^*]*?)\*(?![\w*])/g, "$1<em>$2</em>");
    }).join("").replace(/\u0001/g, "$");
  }
  /* One thought to a line. Two or three sentences run together are hard to
     hold on to, so an explanation, a question and a worked reason are each
     set with their sentences apart — the way a teacher writes them on a
     board, not the way a paragraph is printed. Anything that already carries
     its own blocks (a list, a line break, a quote) is left as it is, and a
     single sentence is left alone. */
  function paras(html, tag) {
    if (typeof html !== "string" || /<(p|ul|ol|li|div|blockquote|h[1-6])\b/i.test(html)) return html;
    // A written-in break already separates two thoughts; sentences inside
    // each of them are separated too.
    var blocks = html.split(/(?:<br\s*\/?>\s*){2,}/);
    var parts = [];
    blocks.forEach(function (b) {
      b.replace(/([.!?])\s+(?=[A-Z“"(<])/g, "$1\u0001").split("\u0001").forEach(function (t) {
        if (t.trim()) parts.push(t.trim());
      });
    });
    if (parts.length < 2) return html;
    return parts.map(function (t) {
      return tag === "p" ? "<p>" + t + "</p>" : '<span class="ch-ln">' + t + "</span>";
    }).join("");
  }
  var PARA_KEYS = { prompt: "p", then: "p", after: "p", why: "span" };

  // Every text field of a step, formatted once, before it is played.
  var TEXT_KEYS = ["prompt", "t", "fb", "why", "nudge", "label", "after", "then", "say", "caption", "placeholderHtml", "right"];
  function fmtStep(x) {
    if (Array.isArray(x)) return x.map(fmtStep);
    if (!x || typeof x !== "object" || x.nodeType) return x;
    var out = {};
    Object.keys(x).forEach(function (k) {
      var v = x[k];
      if (typeof v === "string" && (TEXT_KEYS.indexOf(k) > -1)) out[k] = PARA_KEYS[k] ? paras(fmt(v), PARA_KEYS[k]) : fmt(v);
      else if (k === "hints" && Array.isArray(v)) out[k] = v.map(fmt);
      else if (k === "items" && Array.isArray(v) && typeof v[0] === "string") out[k] = v.map(fmt);
      else if (k === "parts" && Array.isArray(v) && typeof v[0] === "string") out[k] = v.map(fmt);
      else if (k === "bins" && Array.isArray(v)) out[k] = v;
      else if (v && typeof v === "object" && !(v instanceof RegExp) && typeof v !== "function") out[k] = fmtStep(v);
      else out[k] = v;
    });
    return out;
  }

  /* ========================================================== Expressions
     Parse what a student types — 3x+2, 2(x−1)^2, (x+1)/(x−2), |x−3|, √x,
     y = 2x − 5, −2 < x ≤ 5 — into a tree that can be evaluated. Two
     expressions are the same when they agree everywhere they are both
     defined; that is tested at several awkward points, the way a teacher
     checks by substituting. */
  var FUNCS = { sqrt: Math.sqrt, abs: Math.abs, cbrt: Math.cbrt, sin: Math.sin, cos: Math.cos, tan: Math.tan,
                ln: Math.log, log: Math.log10, exp: Math.exp };
  function tokenize(src) {
    var s = String(src).replace(/−|–/g, "-").replace(/[×·]/g, "*").replace(/÷/g, "/")
      .replace(/≤/g, "<=").replace(/≥/g, ">=").replace(/≠/g, "!=").replace(/π/g, "pi").replace(/√/g, "sqrt")
      .replace(/²/g, "^2").replace(/³/g, "^3").replace(/\\cdot|\\times/g, "*").replace(/\\le/g, "<=")
      .replace(/\\ge/g, ">=").replace(/\\pi/g, "pi");
    var out = [], i = 0;
    while (i < s.length) {
      var c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      var num = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (num) { out.push({ k: "num", v: parseFloat(num[1]) }); i += num[1].length; continue; }
      var id = /^[a-zA-Z]+/.exec(s.slice(i));
      if (id) {
        var w = id[0];
        i += w.length;
        // A known word is a function or a constant; anything else is a row
        // of one-letter variables multiplied together: xy is x·y.
        var lw = w.toLowerCase();
        var fnMatch = null;
        Object.keys(FUNCS).concat(["pi"]).forEach(function (f) { if (lw.indexOf(f) === 0 && (!fnMatch || f.length > fnMatch.length)) fnMatch = f; });
        if (fnMatch) {
          out.push(fnMatch === "pi" ? { k: "num", v: Math.PI, pi: true } : { k: "fn", v: fnMatch });
          w = w.slice(fnMatch.length);
        }
        for (var j = 0; j < w.length; j++) out.push({ k: "var", v: w[j] });
        continue;
      }
      var two = s.slice(i, i + 2);
      if (two === "<=" || two === ">=" || two === "!=" || two === "==") { out.push({ k: "rel", v: two === "==" ? "=" : two }); i += 2; continue; }
      if (c === "<" || c === ">" || c === "=") { out.push({ k: "rel", v: c }); i++; continue; }
      if ("+-*/^(),|[]{}".indexOf(c) > -1) {
        var cc = c === "[" || c === "{" ? "(" : c === "]" || c === "}" ? ")" : c;
        out.push({ k: "op", v: cc }); i++; continue;
      }
      throw new Error("I don't know the symbol “" + c + "”.");
    }
    return out;
  }
  function parseExpr(src) {
    var T = typeof src === "string" ? tokenize(src) : src, i = 0, absDepth = 0;
    function peek() { return T[i]; }
    function eat(k, v) { var t = T[i]; if (t && t.k === k && (v == null || t.v === v)) { i++; return t; } return null; }
    function expect(k, v) { var t = eat(k, v); if (!t) throw new Error(v ? "Expected “" + v + "”." : "Something is missing."); return t; }
    function sum() {
      var a = term();
      for (;;) {
        if (eat("op", "+")) a = { t: "add", a: a, b: term() };
        else if (eat("op", "-")) a = { t: "sub", a: a, b: term() };
        else return a;
      }
    }
    function startsFactor(t) {
      if (!t) return false;
      if (t.k === "num" || t.k === "var" || t.k === "fn") return true;
      if (t.k === "op" && t.v === "(") return true;
      if (t.k === "op" && t.v === "|" && absDepth === 0) return true;
      return false;
    }
    function term() {
      var a = unary();
      for (;;) {
        if (eat("op", "*")) a = { t: "mul", a: a, b: unary() };
        else if (eat("op", "/")) a = { t: "div", a: a, b: unary() };
        else if (startsFactor(peek())) a = { t: "mul", a: a, b: power(), imp: true };
        else return a;
      }
    }
    function unary() {
      if (eat("op", "-")) return { t: "neg", a: unary() };
      if (eat("op", "+")) return unary();
      return power();
    }
    function power() {
      var a = primary();
      if (eat("op", "^")) return { t: "pow", a: a, b: unary() };
      return a;
    }
    function primary() {
      var t = peek();
      if (!t) throw new Error("The expression stops too early.");
      if (eat("num")) return { t: "num", v: t.v, pi: !!t.pi };
      if (eat("var")) return { t: "var", n: t.v };
      if (eat("fn")) {
        var f = t.v, arg;
        if (eat("op", "(")) { arg = sum(); expect("op", ")"); }
        else arg = power();
        return { t: "fn", f: f, a: arg };
      }
      if (eat("op", "(")) { var e = sum(); expect("op", ")"); return { t: "par", a: e }; }
      if (eat("op", "|")) { absDepth++; var ab = sum(); absDepth--; expect("op", "|"); return { t: "fn", f: "abs", a: ab }; }
      throw new Error("Unexpected “" + (t.v != null ? t.v : t.k) + "”.");
    }
    var tree = sum();
    return { tree: tree, rest: T.slice(i) };
  }
  function parse(src) {
    var r = parseExpr(src);
    if (r.rest.length) throw new Error("Unexpected “" + (r.rest[0].v) + "”.");
    return r.tree;
  }
  /* A relation: a = b, a < b, or a chain like −2 < x ≤ 5. */
  function parseRel(src) {
    var T = tokenize(src), sides = [], rels = [], cur = [];
    T.forEach(function (t) {
      if (t.k === "rel") { sides.push(cur); rels.push(t.v); cur = []; }
      else cur.push(t);
    });
    sides.push(cur);
    return { sides: sides.map(function (x) { var r = parseExpr(x); if (r.rest.length) throw new Error("Unexpected “" + r.rest[0].v + "”."); return r.tree; }), rels: rels };
  }
  function evalTree(n, env) {
    switch (n.t) {
      case "num": return n.v;
      case "var": return env[n.n] != null ? env[n.n] : NaN;
      case "par": return evalTree(n.a, env);
      case "neg": return -evalTree(n.a, env);
      case "add": return evalTree(n.a, env) + evalTree(n.b, env);
      case "sub": return evalTree(n.a, env) - evalTree(n.b, env);
      case "mul": return evalTree(n.a, env) * evalTree(n.b, env);
      case "div": var d = evalTree(n.b, env); return Math.abs(d) < 1e-12 ? NaN : evalTree(n.a, env) / d;
      case "pow":
        var b = evalTree(n.a, env), e = evalTree(n.b, env);
        if (b < 0 && Math.abs(e - Math.round(e)) > 1e-9) {
          var q = 1 / e;                                        // odd roots of negatives are real
          if (Math.abs(q - Math.round(q)) < 1e-9 && Math.round(q) % 2) return -Math.pow(-b, e);
          return NaN;
        }
        return Math.pow(b, e);
      case "fn": var v = evalTree(n.a, env); var r = FUNCS[n.f](v); return r;
    }
    return NaN;
  }
  function varsOf(n, acc) {
    acc = acc || {};
    if (!n) return acc;
    if (n.t === "var") acc[n.n] = true;
    ["a", "b"].forEach(function (k) { if (n[k]) varsOf(n[k], acc); });
    return acc;
  }
  function compile(src) {
    var tree = typeof src === "string" ? parse(src) : src;
    return function (env) { return evalTree(tree, env); };
  }
  var SAMPLES = [1.37, -2.11, 0.71, 3.3, -0.53, 2.47, -3.83, 1.91, -1.29, 4.13];
  function samplesFor(names, k) {
    var env = {};
    names.forEach(function (n, j) { env[n] = SAMPLES[(k * 3 + j * 7) % SAMPLES.length] + j * 0.173 + k * 0.011; });
    return env;
  }
  function same(a, b, tol) {
    return Math.abs(a - b) <= (tol || 1e-7) * Math.max(1, Math.abs(a), Math.abs(b));
  }
  /* Same function? Agree at every sample where both are defined, with at
     least four such samples. */
  function equivalent(t1, t2, extraVars) {
    var names = Object.keys(Object.assign(varsOf(t1), varsOf(t2), extraVars || {}));
    var good = 0;
    for (var k = 0; k < 10; k++) {
      var env = samplesFor(names, k);
      var a = evalTree(t1, env), b = evalTree(t2, env);
      if (!isFinite(a) && !isFinite(b)) continue;
      if (!isFinite(a) || !isFinite(b)) return false;
      if (!same(a, b)) return false;
      good++;
    }
    return good >= 4;
  }
  /* Two equations with the same solutions: one side minus the other of each
     is a constant multiple of the other's. */
  function sameEquation(e1, e2) {
    var d1 = { t: "sub", a: e1.sides[0], b: e1.sides[1] }, d2 = { t: "sub", a: e2.sides[0], b: e2.sides[1] };
    var names = Object.keys(Object.assign(varsOf(d1), varsOf(d2)));
    var ratio = null, good = 0;
    for (var k = 0; k < 10; k++) {
      var env = samplesFor(names, k);
      var a = evalTree(d1, env), b = evalTree(d2, env);
      if (!isFinite(a) || !isFinite(b)) continue;
      if (Math.abs(b) < 1e-9) { if (Math.abs(a) > 1e-7) return false; continue; }
      var r = a / b;
      if (ratio == null) ratio = r;
      else if (!same(r, ratio, 1e-6)) return false;
      good++;
    }
    return good >= 4 && Math.abs(ratio) > 1e-9;
  }
  /* The set a one-variable relation describes, read off a fine grid. */
  function truthOf(rel, name, lo, hi) {
    var out = [];
    for (var x = lo; x <= hi + 1e-9; x += 0.25) {
      [x - 0.001, x, x + 0.001].forEach(function (v) {
        var env = {}; env[name] = v;
        var vals = rel.sides.map(function (s) { return evalTree(s, env); });
        var ok = true;
        rel.rels.forEach(function (r, i) {
          var a = vals[i], b = vals[i + 1];
          var t = r === "<" ? a < b - 1e-9 : r === "<=" ? a <= b + 1e-9 : r === ">" ? a > b + 1e-9 :
                  r === ">=" ? a >= b - 1e-9 : r === "=" ? Math.abs(a - b) < 1e-9 : r === "!=" ? Math.abs(a - b) > 1e-9 : false;
          if (!t) ok = false;
        });
        out.push(ok ? 1 : 0);
      });
    }
    return out.join("");
  }
  function sameRelation(r1, r2, name) {
    return truthOf(r1, name, -30, 30) === truthOf(r2, name, -30, 30);
  }
  /* The shape of an expression, for answers that have to be in a form. */
  function flatTerms(n, sign, out) {
    out = out || []; sign = sign == null ? 1 : sign;
    if (n.t === "add") { flatTerms(n.a, sign, out); flatTerms(n.b, sign, out); }
    else if (n.t === "sub") { flatTerms(n.a, sign, out); flatTerms(n.b, -sign, out); }
    else if (n.t === "par" && false) flatTerms(n.a, sign, out);
    else out.push({ sign: sign, n: n });
    return out;
  }
  function hasSumInside(n) {
    if (!n) return false;
    if (n.t === "add" || n.t === "sub") return true;
    if (n.t === "par") return hasSumInside(n.a);
    return hasSumInside(n.a) || hasSumInside(n.b);
  }
  function signature(n) {                 // which variables, to which powers
    var env1 = {}, names = Object.keys(varsOf(n)).sort();
    // A monomial's shape: probe how it scales with each variable.
    return names.map(function (v) {
      var e1 = {}, e2 = {};
      names.forEach(function (w) { e1[w] = 1.3; e2[w] = 1.3; });
      e2[v] = 2.6;
      var a = evalTree(n, e1), b = evalTree(n, e2);
      var deg = Math.round(Math.log(Math.abs(b / a)) / Math.log(2) * 100) / 100;
      return v + deg;
    }).join(",") || "const";
  }
  /* Simplified: a sum of terms with no brackets left to multiply out and no
     two terms alike. */
  function isSimplified(tree) {
    var terms = flatTerms(tree);
    var sigs = {};
    for (var k = 0; k < terms.length; k++) {
      var t = terms[k].n;
      if (hasSumInside(t)) return false;
      var sg = signature(t);
      if (sigs[sg]) return false;
      sigs[sg] = true;
    }
    return true;
  }
  /* Factored: a product at the top, with at least one bracketed sum in it. */
  function isFactored(tree) {
    var n = tree;
    while (n.t === "par") n = n.a;
    if (n.t === "neg") n = n.a;
    if (n.t !== "mul" && n.t !== "pow") return false;
    return hasSumInside(n);
  }
  function termCount(tree) { return flatTerms(tree).length; }

  /* ================================================================ Random
     Seeded, so a problem can be shown again exactly as it was. */
  function rng(seed) {
    var a = 0;
    String(seed).split("").forEach(function (ch) { a = (a * 31 + ch.charCodeAt(0)) | 0; });
    a = a || 0x9e3779b9;
    function next() {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    var R = {
      next: next,
      int: function (lo, hi) { return lo + Math.floor(next() * (hi - lo + 1)); },
      nz: function (lo, hi) { var v; do { v = R.int(lo, hi); } while (v === 0); return v; },
      pick: function (arr) { return arr[Math.floor(next() * arr.length)]; },
      sign: function () { return next() < 0.5 ? -1 : 1; },
      chance: function (p) { return next() < p; },
      shuffle: function (arr) {
        var a2 = arr.slice();
        for (var i = a2.length - 1; i > 0; i--) { var j = Math.floor(next() * (i + 1)); var t = a2[i]; a2[i] = a2[j]; a2[j] = t; }
        return a2;
      },
      distinct: function (n, lo, hi, avoid) {
        var out = [], guard = 0;
        while (out.length < n && guard++ < 500) {
          var v = R.int(lo, hi);
          if (out.indexOf(v) < 0 && (!avoid || avoid.indexOf(v) < 0)) out.push(v);
        }
        return out;
      }
    };
    return R;
  }

  /* =========================================================== Writing math
     For generators: turn numbers into the text of an expression, the way a
     person would write it — 1x is x, +−3 is −3, 0x disappears. */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function frac(n, d) {            // "\frac{3}{4}" or "−\frac{3}{4}" or "2"
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d); n /= g; d /= g;
    if (d === 1) return String(n);
    return (n < 0 ? "-" : "") + "\\frac{" + Math.abs(n) + "}{" + d + "}";
  }
  function fracText(n, d) {        // "3/4" for an input box
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d); n /= g; d /= g;
    return d === 1 ? String(n) : n + "/" + d;
  }
  function num(v) {               // a decimal, printed without float noise
    var r = Math.round(v * 1e6) / 1e6;
    return String(r);
  }
  /* Terms [[coef, "x"], [coef, ""]] as "3x − 2". */
  function poly(terms, opts) {
    opts = opts || {};
    var out = "";
    terms.forEach(function (t) {
      var c = t[0], v = t[1] || "";
      if (c === 0 && !opts.keepZero) return;
      var mag = Math.abs(c), sgn = c < 0 ? "-" : "+";
      var body = v ? (mag === 1 ? "" : num(mag)) + v : num(mag);
      if (!out) out = (c < 0 ? "-" : "") + body;
      else out += " " + sgn + " " + body;
    });
    return out || "0";
  }
  function lin(a, b, v) { return poly([[a, v || "x"], [b, ""]]); }   // ax + b
  /* Put values into TeX the way a person writes the working: 5(3) − 1,
     −4(−2)², (3 + 11) — brackets where they are needed and nowhere else. */
  function subst(tex, vals) {
    var out = "", i = 0, s = String(tex);
    while (i < s.length) {
      var c = s[i];
      if (c === "\\") {                                   // a command: copy it whole
        var mm = /^\\[a-zA-Z]+/.exec(s.slice(i));
        if (mm) { out += mm[0]; i += mm[0].length; continue; }
      }
      if (/[a-zA-Z]/.test(c) && vals[c] != null) {
        var v = vals[c], prev = out.replace(/\s+$/, "").slice(-1), nextC = s[i + 1] || "";
        var needs = v < 0 || /[0-9a-zA-Z)]/.test(prev) || (nextC === "^" && v < 0) || /[0-9a-zA-Z(]/.test(nextC);
        var txt = typeof v === "string" ? v : num(v);
        out += needs ? "(" + txt + ")" : txt;
        i++;
        continue;
      }
      out += c;
      i++;
    }
    return out;
  }
  function signed(c) { return c < 0 ? "- " + Math.abs(c) : "+ " + c; }

  /* A multiple-choice step from a right answer and wrong ones that each
     carry their own reply. Duplicate texts are dropped; order is shuffled
     with the problem's own random source. */
  function mc(R, o) {
    var seen = {}, opts = [];
    [{ t: o.right }].concat(o.wrong || []).forEach(function (x) {
      var k = String(x.t);
      if (seen[k]) return;
      seen[k] = true;
      opts.push(x);
    });
    var order = o.keep ? opts : R.shuffle(opts);
    var step = { type: "choice", options: order, answer: order.indexOf(opts[0]), keep: true };
    Object.keys(o).forEach(function (k) { if (["right", "wrong", "keep"].indexOf(k) < 0) step[k] = o[k]; });
    return step;
  }

  /* ============================================================ Answers
     Steps the player does not know about, built on the expression engine. */
  function answerBox(s, cfg) {
    var api = {};
    var wrap = el("div", "lb-ans");
    var row = el("div", "lb-ans-row");
    if (s.pre) row.appendChild(el("span", "lb-pre", fmt(s.pre)));
    var inp = el("input", "lb-in");
    inp.type = "text";
    inp.autocomplete = "off";
    inp.spellcheck = false;
    inp.setAttribute("aria-label", s.label ? String(s.label).replace(/<[^>]+>|\$/g, "") : "Your answer");
    inp.placeholder = s.placeholder || cfg.placeholder || "";
    row.appendChild(inp);
    if (s.post) row.appendChild(el("span", "lb-post", fmt(s.post)));
    wrap.appendChild(row);
    var prev = el("div", "lb-preview");
    wrap.appendChild(prev);
    if (cfg.keys) wrap.appendChild(keypad(inp, cfg.keys, function () { update(); }));
    function update() {
      var t = inp.value.trim();
      wrap.classList.remove("no");
      prev.classList.remove("bad");
      if (!t) { prev.innerHTML = ""; api.onChange && api.onChange(); return; }
      try {
        cfg.parse(t);
        prev.innerHTML = cfg.preview ? cfg.preview(t) : m(toTex(t));
      } catch (e) {
        prev.innerHTML = '<span class="lb-err">' + esc(e.message) + "</span>";
        prev.classList.add("bad");
      }
      api.onChange && api.onChange();
    }
    inp.addEventListener("input", update);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && api.ready()) api.onEnter(); });
    api.el = wrap;
    api.ready = function () {
      var t = inp.value.trim();
      if (!t) return false;
      try { cfg.parse(t); return true; } catch (e) { return false; }
    };
    api.check = function () {
      var r = cfg.check(inp.value.trim());
      wrap.classList.toggle("no", !r.ok);
      if (r.ok) { wrap.classList.add("yes"); inp.disabled = true; }
      return r;
    };
    api.reveal = function () {
      inp.value = s.shown || cfg.shown || "";
      update();
      inp.disabled = true;
      wrap.classList.remove("no"); wrap.classList.add("yes");
    };
    api.focus = function () { inp.focus(); };
    return api;
  }
  // What a student typed, as TeX, for the live preview.
  function toTex(t) {
    return String(t).replace(/sqrt\s*\(([^()]*)\)/g, "\\sqrt{$1}")
      .replace(/\^\(([^()]*)\)/g, "^{$1}")
      .replace(/<=/g, "\\le ").replace(/>=/g, "\\ge ").replace(/!=/g, "\\ne ")
      .replace(/\*/g, "\\cdot ").replace(/pi/g, "\\pi ");
  }
  function keypad(inp, keys, after) {
    var k = el("div", "lb-keys");
    keys.forEach(function (key) {
      var b = button("lb-key", fmt(key[0]));
      b.addEventListener("mousedown", function (e) { e.preventDefault(); });
      b.addEventListener("click", function () {
        var ins = key[1], p = inp.selectionStart || inp.value.length, q = inp.selectionEnd || p;
        inp.value = inp.value.slice(0, p) + ins + inp.value.slice(q);
        var caret = p + ins.length + (key[2] || 0);
        inp.focus();
        inp.setSelectionRange(caret, caret);
        after();
      });
      k.appendChild(b);
    });
    return k;
  }
  var KEYS_EXPR = [["$x$", "x"], ["$x^2$", "^2"], ["$\\sqrt{\\,}$", "sqrt()", -1], ["$($", "("], ["$)$", ")"], ["$-$", "-"], ["$\\frac{a}{b}$", "/"]];
  var KEYS_REL = [["$x$", "x"], ["$<$", "<"], ["$\\le$", "<="], ["$>$", ">"], ["$\\ge$", ">="], ["$-$", "-"], ["$\\frac{a}{b}$", "/"]];

  /* expr: any expression equivalent to `answer` (in the step's variables),
     optionally in a required form. */
  function kindExpr(s) {
    var target = parse(s.answer);
    return answerBox(s, {
      placeholder: s.placeholder || "Type an expression",
      keys: s.keys === false ? null : s.keys || KEYS_EXPR,
      shown: s.shown || s.answer,
      parse: parse,
      check: function (t) {
        var tree;
        try { tree = parse(t); } catch (e) { return { ok: false, say: e.message }; }
        var eq = equivalent(tree, target);
        var near = (s.near || []).filter(function (n) { try { return equivalent(tree, parse(n.v)); } catch (e) { return false; } })[0];
        if (!eq) return { ok: false, say: near ? near.fb : null };
        if (s.form === "simplified" && !isSimplified(tree)) return { ok: false, say: s.formFb || "That's equal — now finish simplifying: combine like terms and clear the brackets." };
        if (s.form === "factored" && !isFactored(tree)) return { ok: false, say: s.formFb || "That's equal, but it isn't factored. Write it as a product." };
        if (s.maxTerms && termCount(tree) > s.maxTerms) return { ok: false, say: s.formFb || "That's equal — can it be written with fewer terms?" };
        return { ok: true };
      }
    });
  }
  /* equation: any equation with the same solutions (2x + 3y = 6 and
     y = −⅔x + 2 are the same line), optionally with y alone on the left. */
  function kindEquation(s) {
    var target = parseRel(s.answer);
    return answerBox(s, {
      placeholder: s.placeholder || "y = …",
      keys: s.keys === false ? null : s.keys || [["$x$", "x"], ["$y$", "y"], ["$=$", "="], ["$-$", "-"], ["$($", "("], ["$)$", ")"], ["$\\frac{a}{b}$", "/"]],
      shown: s.shown || s.answer,
      parse: function (t) { var r = parseRel(t); if (r.rels.length !== 1 || r.rels[0] !== "=") throw new Error("Write it as an equation, with one “=”."); return r; },
      check: function (t) {
        var r;
        try { r = parseRel(t); } catch (e) { return { ok: false, say: e.message }; }
        if (r.rels.length !== 1 || r.rels[0] !== "=") return { ok: false, say: "Write it as an equation, with one “=”." };
        var ok = sameEquation(r, target);
        var near = (s.near || []).filter(function (n) { try { return sameEquation(r, parseRel(n.v)); } catch (e) { return false; } })[0];
        if (!ok) return { ok: false, say: near ? near.fb : null };
        if (s.form === "slope-intercept") {
          var lhs = r.sides[0];
          if (!(lhs.t === "var" && lhs.n === "y") || varsOf(r.sides[1]).y) return { ok: false, say: "Same line — now write it as $y = mx + b$, with $y$ on its own." };
        }
        return { ok: true };
      }
    });
  }
  /* inequality: a relation in one variable with the same solution set. */
  function kindIneq(s) {
    var target = parseRel(s.answer), v = s.variable || "x";
    return answerBox(s, {
      placeholder: s.placeholder || "x < …",
      keys: s.keys === false ? null : s.keys || KEYS_REL,
      shown: s.shown || s.answer,
      parse: function (t) { var r = parseRel(t); if (!r.rels.length) throw new Error("Use <, >, ≤ or ≥."); return r; },
      check: function (t) {
        var r;
        try { r = parseRel(t); } catch (e) { return { ok: false, say: e.message }; }
        var ok = sameRelation(r, target, v);
        var near = (s.near || []).filter(function (n) { try { return sameRelation(r, parseRel(n.v), v); } catch (e) { return false; } })[0];
        return { ok: ok, say: ok ? null : near ? near.fb : null };
      }
    });
  }
  /* pair: an ordered pair (x, y). near: [{ v: [x, y], fb }] answers a known slip. */
  function kindPair(s) {
    function read(t) {
      var mm = /^\(?\s*([^,()]+)\s*,\s*([^,()]+)\s*\)?$/.exec(t);
      if (!mm) throw new Error("Write it as (x, y).");
      var a = CH.readNum(mm[1]), b = CH.readNum(mm[2]);
      if (!isFinite(a) || !isFinite(b)) throw new Error("Both coordinates need to be numbers.");
      return [a, b];
    }
    return answerBox(s, {
      placeholder: "(x, y)", keys: false, shown: s.shown || "(" + s.answer[0] + ", " + s.answer[1] + ")",
      parse: read,
      preview: function (t) { var p = read(t); return m("(" + num(p[0]) + ", " + num(p[1]) + ")"); },
      check: function (t) {
        var p = read(t);
        var ok = Math.abs(p[0] - s.answer[0]) < 1e-6 && Math.abs(p[1] - s.answer[1]) < 1e-6;
        var swapped = Math.abs(p[1] - s.answer[0]) < 1e-6 && Math.abs(p[0] - s.answer[1]) < 1e-6;
        // A known slip gets its own reply: near: [{ v: [x, y], fb }].
        var near = !ok && (s.near || []).filter(function (n) { return Math.abs(p[0] - n.v[0]) < 1e-6 && Math.abs(p[1] - n.v[1]) < 1e-6; })[0];
        return { ok: ok, say: ok ? null : near ? near.fb : swapped ? fmt("Those are the right numbers in the wrong order — $x$ comes first.") : null };
      }
    });
  }
  /* numbers: a set of numbers in any order, like the solutions of x² = 9. */
  function kindNumbers(s) {
    function read(t) {
      if (/^(none|no solution|∅)$/i.test(t.trim())) return [];
      var parts = t.split(/[,;]| and | or /).map(function (x) { return x.trim(); }).filter(Boolean);
      var vals = parts.map(function (x) {
        var r = CH.readNum(x.replace(/^x\s*=\s*/i, ""));
        if (!isFinite(r)) {
          try { var tr = parse(x.replace(/^x\s*=\s*/i, "")); if (Object.keys(varsOf(tr)).length) throw 0; r = evalTree(tr, {}); }
          catch (e) { throw new Error("“" + x + "” isn't a number."); }
        }
        return r;
      });
      return vals;
    }
    var shown = s.shown || (s.answer.length ? s.answer.map(num).join(", ") : "no solution");
    return answerBox(s, {
      placeholder: s.placeholder || "e.g. −3, 3", keys: false, shown: shown,
      parse: read,
      preview: function (t) { var v = read(t); return v.length ? m(v.map(num).join(", ")) : "No solution"; },
      check: function (t) {
        var v = read(t);
        var want = s.answer.slice().sort(function (a, b) { return a - b; });
        var got = v.slice().sort(function (a, b) { return a - b; });
        var ok = want.length === got.length && want.every(function (w, i) { return Math.abs(w - got[i]) < 1e-6; });
        var some = !ok && got.length && got.every(function (g) { return want.some(function (w) { return Math.abs(w - g) < 1e-6; }); });
        return { ok: ok, say: ok ? null : some ? "Every number you gave is right — but there's another." : null };
      }
    });
  }

  function register() {
    CH.addKind("expr", kindExpr);
    CH.addKind("equation", kindEquation);
    CH.addKind("ineq", kindIneq);
    CH.addKind("pair", kindPair);
    CH.addKind("numbers", kindNumbers);
    // A number with math in its label, and fractions accepted.
    var base = CH.kinds.number;
    CH.addKind("num", function (s, seed) {
      var x = base(Object.assign({}, s, { label: s.label ? String(s.label).replace(/<[^>]+>|\$/g, "") : null }), seed);
      if (s.pre || s.post) {
        var row = el("div", "lb-ans-row");
        if (s.pre) row.appendChild(el("span", "lb-pre", fmt(s.pre)));
        row.appendChild(x.el);
        if (s.post) row.appendChild(el("span", "lb-post", fmt(s.post)));
        var wrap = el("div", "lb-ans");
        wrap.appendChild(row);
        x.el = wrap;
      }
      return x;
    });
  }

  /* ============================================================== Record
     { v, at, skills: { id: { lv, n, at } }, lessons: { id: { done, at } },
       tests: { unitKey: { best, at } } }   — progress scope "lab". */
  var ME = null, REC = null, BASE = null, pushT = null, pulled = {};
  function blank() { return { v: 1, at: 0, skills: {}, lessons: {}, tests: {} }; }
  function localKey() { return "oplo.lab." + (ME ? ME.id : "anon"); }
  function readLocal() { try { return JSON.parse(localStorage.getItem(localKey()) || "null"); } catch (e) { return null; } }
  function writeLocal() { try { localStorage.setItem(localKey(), JSON.stringify(REC)); } catch (e) { /* full or blocked */ } }
  // The newer entry wins, item by item: a level can go down after a test.
  function merge(a, b) {
    a = a || blank(); b = b || blank();
    var out = blank();
    out.at = Math.max(a.at || 0, b.at || 0);
    ["skills", "lessons", "tests"].forEach(function (k) {
      [a[k] || {}, b[k] || {}].forEach(function (src) {
        Object.keys(src).forEach(function (id) {
          var x = src[id], y = out[k][id];
          if (!y || (x.at || 0) > (y.at || 0)) out[k][id] = x;
          if (k === "tests" && y && x) out[k][id] = { best: Math.max(x.best || 0, y.best || 0), at: Math.max(x.at || 0, y.at || 0) };
          if (k === "lessons" && y && x) out[k][id] = { done: !!(x.done || y.done), at: Math.max(x.at || 0, y.at || 0) };
        });
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
    API.progress.one("lab").then(function (row) {
      BASE = row ? row.updatedAt : 0;
      if (row && row.state) {
        REC = merge(REC, row.state);
        writeLocal();
        if (JSON.stringify(REC) !== JSON.stringify(row.state)) push();
        if (LIVE.refresh) LIVE.refresh();
      } else if (Object.keys(REC.skills).length || Object.keys(REC.lessons).length) push();
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
    function send() {
      API.progress.put("lab", REC, null, BASE).then(function (res) { BASE = res.updatedAt; }, function (e) {
        if (e && e.status === 409 && tries < 3) {
          API.progress.one("lab").then(function (row) {
            BASE = row ? row.updatedAt : 0;
            if (row && row.state) { REC = merge(REC, row.state); writeLocal(); }
            push(tries + 1);
          });
        }
      });
    }
    if (BASE == null) {
      API.progress.one("lab").then(function (row) {
        BASE = row ? row.updatedAt : 0;
        if (row && row.state) { REC = merge(REC, row.state); writeLocal(); }
        send();
      }, function () { /* offline: kept on the device */ });
    } else send();
  }
  window.addEventListener("pagehide", function () {
    if (!pushT || !ME || !API || !API.progress.beacon) return;
    clearTimeout(pushT); pushT = null;
    API.progress.beacon("lab", REC, BASE);
  });
  function level(id) { return (REC && REC.skills[id] && REC.skills[id].lv) || 0; }
  function setLevel(id, lv) {
    var cur = REC.skills[id] || { lv: 0, n: 0 };
    REC.skills[id] = { lv: Math.max(0, Math.min(4, lv)), n: (cur.n || 0) + 1, at: Date.now() };
    changed();
  }
  var LEVELS = ["Not started", "Attempted", "Familiar", "Proficient", "Mastered"];

  /* ============================================================= Courses
     A course file registers its units; a unit is lessons and skills. */
  var COURSES = {}, UNITS = {}, LIVE = {};
  function course(id, def) { COURSES[id] = Object.assign({ id: id, units: {} }, def); }
  function unit(courseId, n, def) {
    var key = courseId + ":" + n;
    def.key = key; def.course = courseId; def.n = n;
    def.lessons = (def.lessons || []).map(function (l, i) { l.k = i + 1; l.unit = key; return l; });
    def.skills = (def.skills || []).map(function (sk) { sk.unit = key; return sk; });
    def.quizzes = (def.quizzes || []).map(function (q, i) { q.k = i + 1; q.unit = key; return q; });
    UNITS[key] = def;
  }
  function fileFor(courseId, n) { return courseId + "/u" + (n < 10 ? "0" + n : n) + ".js"; }
  var loading = {};
  function script(path) {
    if (loading[path]) return loading[path];
    loading[path] = new Promise(function (ok, fail) {
      var s = document.createElement("script");
      s.src = path + "?v=" + (FILES[path] || "dev");
      s.onload = ok;
      s.onerror = function () { delete loading[path]; fail(new Error("Couldn't load " + path)); };
      document.head.appendChild(s);
    });
    return loading[path];
  }
  /* A course may bring a kit of its own, loaded after the manipulatives and
     before any of its units: Introduction to Business keeps its scenes (a
     stand you run, a market, the circular flow, the business cycle…) in
     lab/bizkit.js, which no math course needs to download. */
  var COURSE_KIT = { biz: "lab/bizkit.js" };
  function kitFor(courseId) {
    return script("lab/widgets.js").then(function () {
      return COURSE_KIT[courseId] ? script(COURSE_KIT[courseId]) : null;
    });
  }
  function load(courseId, n) {
    var key = courseId + ":" + n;
    if (UNITS[key]) return kitFor(courseId).then(function () { return UNITS[key]; });
    return kitFor(courseId).then(function () { return script(fileFor(courseId, n)); })
      .then(function () {
        if (!UNITS[key]) throw new Error("That unit isn't written yet.");
        return UNITS[key];
      });
  }
  function has(courseId, n) { return !!FILES[fileFor(courseId, n)]; }

  /* ------------------------------------------------------ Unit measures */
  function unitDims(u) {
    var lessons = u.lessons.length ? u.lessons.filter(function (l) { return lessonDone(l); }).length / u.lessons.length : 0;
    var sk = u.skills.length ? u.skills.reduce(function (a, s) { return a + level(s.id); }, 0) / (u.skills.length * 4) : 0;
    var test = (REC.tests[u.key] || {}).best || 0;
    return { u: Math.round(lessons * 100), p: Math.round(sk * 100), a: Math.round(test * 100) };
  }
  /* A lesson's key in the record. A lesson that is rewritten carries a
     version (v: 2), so the old record — which steps were seen, whether it
     was finished — does not carry over onto different steps. */
  function lessonKey(l) { return l.unit + ":" + l.k + (l.v ? "~" + l.v : ""); }
  function lessonDone(l) { return !!(REC.lessons[lessonKey(l)] || {}).done; }
  function unitMastery(u) {
    if (!u.skills.length) return 0;
    return Math.round(u.skills.reduce(function (a, s) { return a + level(s.id); }, 0) / (u.skills.length * 4) * 100);
  }

  /* =========================================================== Unit page
     Lessons as a path you walk, practice as skills you level up, and the
     unit test at the end. Khan's list of skills, Brilliant's lessons. */
  var ICON = {
    play: '<path d="M8 5.5 18 12 8 18.5z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    bolt: '<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    sidebar: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M9.5 4.5v15"/><path d="M6 8.5h1.2M6 11h1.2M6 13.5h1.2"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 4.5 4.5"/>',
    x: '<path d="m7.5 7.5 9 9M16.5 7.5l-9 9"/>',
    down: '<path d="m6 9.5 6 6 6-6"/>',
    doc: '<path d="M7 3.5h6.5l5 5V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z"/><path d="M13.5 3.5v5h5"/>',
    test: '<rect x="5" y="4.5" width="14" height="16" rx="2.5"/><path d="M9 3.5h6"/><path d="m8.5 12.5 2.2 2.2 4.8-5"/>',
    done: '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.8 2.8L16.2 9.6"/>'
  };
  function svg(d, fill) {
    return '<svg viewBox="0 0 24 24" fill="' + (fill ? "currentColor" : "none") + '" stroke="' + (fill ? "none" : "currentColor") +
      '" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  }
  function pips(lv) {
    var h = '<span class="lb-pips" aria-label="' + LEVELS[lv] + '">';
    for (var i = 1; i <= 4; i++) h += '<i class="' + (i <= lv ? "on l" + lv : "") + '"></i>';
    return h + "</span>";
  }

  function renderUnit(host, ctx) {
    useAccount(ctx.me);
    host.innerHTML = "";
    var wrap = el("div", "lb-unit");
    host.appendChild(wrap);
    var head = el("header", "lb-uhead");
    head.innerHTML = '<p class="lx-eyebrow">' + esc(ctx.courseTitle) + " · Unit " + ctx.n + "</p>" +
      '<h1 class="lx-h1">' + esc(ctx.title) + "</h1>" + (ctx.desc ? '<p class="lx-lede">' + esc(ctx.desc) + "</p>" : "");
    wrap.appendChild(head);
    var body = el("div", "lb-loading", "<span></span><span></span><span></span>");
    wrap.appendChild(body);
    load(ctx.course, ctx.n).then(function (u) {
      body.remove();
      paintUnit(wrap, u, ctx);
      LIVE.refresh = function () { if (wrap.isConnected) { wrap.querySelectorAll(".lb-block,.lb-ubar").forEach(function (x) { x.remove(); }); paintUnit(wrap, u, ctx); } };
    }, function (e) {
      body.className = "lb-none";
      body.innerHTML = "<b>This unit is still being written.</b><p>" + esc(e.message) + "</p>";
    });
  }
  function paintUnit(wrap, u, ctx) {
    // Mastery across the unit's skills, one square each.
    var bar = el("div", "lb-ubar");
    var pct = unitMastery(u);
    bar.innerHTML = '<div class="lb-ubar-t"><b>Unit mastery</b><span>' + pct + "%</span></div>" +
      '<div class="lb-ubar-sq">' + u.skills.map(function (s) {
        return '<i class="l' + level(s.id) + '" title="' + esc(s.title) + " — " + LEVELS[level(s.id)] + '"></i>';
      }).join("") + "</div>" +
      '<div class="lb-legend">' + LEVELS.slice(1).map(function (n, i) { return '<span><i class="l' + (i + 1) + '"></i>' + n + "</span>"; }).join("") + "</div>";
    wrap.appendChild(bar);

    // Up next: the first lesson not done, then a quiz not yet taken, then
    // the weakest skill, then the unit test.
    var nextLesson = u.lessons.filter(function (l) { return !lessonDone(l); })[0];
    var weakest = u.skills.slice().sort(function (a, b) { return level(a.id) - level(b.id); })[0];
    var openQuiz = u.quizzes.filter(function (q) { return !REC.tests[q.unit + ":q" + q.k] && u.lessons.slice(0, q.after).every(lessonDone); })[0];
    var next = nextLesson ? { k: "Lesson " + nextLesson.k, t: nextLesson.title, d: nextLesson.blurb, go: function () { ctx.go.lesson(nextLesson.k); } }
      : openQuiz ? { k: openQuiz.title, t: "Check what's stuck so far", d: openQuiz.skills.length + " skills, " + openQuiz.skills.length * (openQuiz.per || 2) + " questions.", go: function () { ctx.go.quiz(openQuiz.k); } }
      : weakest && level(weakest.id) < 3 ? { k: "Practice", t: stripMath(weakest.title), d: "Your weakest skill in this unit — " + LEVELS[level(weakest.id)].toLowerCase() + ".", go: function () { ctx.go.practice(weakest.id); } }
      : { k: "Unit test", t: "Show what you know", d: "One problem from every skill. Right answers take skills to Mastered.", go: function () { ctx.go.test(); } };
    var nb = button("lb-next", '<span class="lb-ntxt"><span class="lb-nk">Up next for you · ' + esc(next.k) + "</span><b>" + fmt(next.t) + '</b><span class="lb-nd">' + fmt(next.d || "") + "</span></span>" +
      '<span class="lb-go">Go' + svg(ICON.arrow) + "</span>");
    nb.addEventListener("click", next.go);
    wrap.appendChild(nb);

    var lb = el("section", "lb-block");
    lb.appendChild(el("h2", "lb-h2", "Lessons"));
    var path = el("ol", "lb-path");
    u.lessons.forEach(function (l, i) {
      var done = lessonDone(l), cur = l === nextLesson;
      var li = el("li", "lb-node" + (done ? " done" : "") + (cur ? " cur" : ""));
      var b = button("lb-lesson",
        '<span class="lb-dot">' + (done ? svg(ICON.check) : '<span>' + (i + 1) + "</span>") + "</span>" +
        '<span class="lb-ltxt"><b>' + esc(l.title) + "</b><span>" + esc(l.blurb || "") + "</span>" +
        '<em>' + (l.steps.length) + " steps · about " + (l.mins || Math.max(4, Math.round(l.steps.length * 0.9))) + " min" +
        (done ? " · done" : "") + "</em></span>" +
        (cur ? '<span class="lb-go">' + (hasStarted(l) ? "Continue" : "Start") + svg(ICON.arrow) + "</span>" : ""));
      b.addEventListener("click", function () { ctx.go.lesson(l.k); });
      li.appendChild(b);
      path.appendChild(li);
      u.quizzes.filter(function (q) { return q.after === l.k; }).forEach(function (q) {
        var best = REC.tests[q.unit + ":q" + q.k];
        var qi = el("li", "lb-node quiz" + (best ? " done" : ""));
        var qb = button("lb-lesson",
          '<span class="lb-dot">' + svg(ICON.target) + "</span>" +
          '<span class="lb-ltxt"><b>' + esc(q.title) + "</b><span>" + fmt(q.blurb || "A short check on the skills so far.") + "</span>" +
          "<em>" + q.skills.length * (q.per || 2) + " questions" + (best ? " · best " + Math.round(best.best * 100) + "%" : "") + "</em></span>");
        qb.addEventListener("click", function () { ctx.go.quiz(q.k); });
        qi.appendChild(qb);
        path.appendChild(qi);
      });
    });
    lb.appendChild(path);
    wrap.appendChild(lb);

    var pb = el("section", "lb-block");
    pb.appendChild(el("h2", "lb-h2", "Practice"));
    pb.appendChild(el("p", "lb-sub", "Five fresh problems each time. Get four right to level a skill up; the unit test takes it the rest of the way."));
    var list = el("div", "lb-skills");
    u.skills.forEach(function (s) {
      var lv = level(s.id);
      var b = button("lb-skill" + (s === weakest && !nextLesson ? " next" : ""),
        '<span class="lb-sico">' + svg(ICON.bolt, true) + "</span>" +
        '<span class="lb-stxt"><b>' + fmt(s.title) + "</b><span>" + LEVELS[lv] + "</span></span>" + pips(lv));
      b.addEventListener("click", function () { ctx.go.practice(s.id); });
      list.appendChild(b);
    });
    pb.appendChild(list);
    wrap.appendChild(pb);

    var tb = el("section", "lb-block");
    var best = (REC.tests[u.key] || {}).best;
    var t = button("lb-test",
      '<span class="lb-tico">' + svg(ICON.target) + "</span>" +
      '<span class="lb-ttxt"><b>Unit test</b><span>One problem from every skill — ' + u.skills.length + " questions, about " +
      Math.round(u.skills.length * 1.3) + " minutes." + (best != null ? " Best so far: " + Math.round(best * 100) + "%." : "") +
      "</span></span>" + '<span class="lb-go">' + (best != null ? "Take it again" : "Start") + svg(ICON.arrow) + "</span>");
    t.addEventListener("click", function () { ctx.go.test(); });
    tb.appendChild(t);
    wrap.appendChild(tb);
  }
  function hasStarted(l) {
    return false;
  }


  /* ============================================================ The shell
     Around a lesson, a quiz, a skill's practice or the unit test, the way a
     Mac app is laid out (Apple's HIG: sidebars, search fields): a sidebar
     at the leading edge with the whole unit in it, so any lesson is one
     click away — lessons and quizzes in the order they are taken, then the
     unit test, then the skills to practise. Two sections that fold, the one
     you are in as a filled pill, a check on what is done, a search field
     that filters as you type. The lesson being played opens out into its
     steps — "Start here", "Problem 1", "Problem 2" — so a student can go
     back to any of them and forward again as far as they have been. It can
     be hidden, and remembers that; it is never hidden to begin with. On a
     narrow window it floats over the page instead.

     The sidebar says where you are, so the work has no header of its own:
     the player's title and progress bar are kept for screen readers only.
     A lesson has the player's step bar instead: back, forward, and a
     segment for each step. */
  var SIDE = { q: "", folded: {}, scroll: null, stepsFolded: false };
  var NARROW = "(max-width: 1099px)";
  function sideHidden() { try { return localStorage.getItem("oplo.lab.side") === "hidden"; } catch (e) { return false; } }
  function setSideHidden(v) {
    try { if (v) localStorage.setItem("oplo.lab.side", "hidden"); else localStorage.removeItem("oplo.lab.side"); } catch (e) { /* private window */ }
  }
  // The unit in the order it is taken: lessons, each quiz after its lesson,
  // then the unit test.
  function unitSeq(u) {
    var seq = [];
    u.lessons.forEach(function (l) {
      seq.push({ kind: "lesson", k: l.k, title: l.title, label: u.n + "." + l.k, done: lessonDone(l) });
      u.quizzes.filter(function (q) { return q.after === l.k; }).forEach(function (q) {
        seq.push({ kind: "quiz", k: q.k, title: q.title, label: q.title, done: !!REC.tests[q.unit + ":q" + q.k] });
      });
    });
    seq.push({ kind: "test", title: "Unit test", label: "Unit test", done: !!REC.tests[u.key] });
    return seq;
  }
  function skillSeq(u) {
    return u.skills.map(function (sk) { return { kind: "skill", id: sk.id, title: stripMath(sk.title), label: "Practice", lv: level(sk.id) }; });
  }
  function isHere(it, here) { return it.kind === here.kind && (it.k === here.k || (it.id != null && it.id === here.id) || it.kind === "test"); }
  function goItem(ctx, it) {
    if (it.kind === "lesson") ctx.go.lesson(it.k);
    else if (it.kind === "quiz") ctx.go.quiz(it.k);
    else if (it.kind === "test") ctx.go.test();
    else if (it.kind === "skill") ctx.go.practice(it.id);
  }

  function frame(host, ctx, u, here) {
    host.innerHTML = "";
    var shell = el("div", "lb-shell" + (sideHidden() ? " side-off" : ""));
    function toggle() {
      if (window.matchMedia && window.matchMedia(NARROW).matches) { shell.classList.toggle("peek"); return; }
      var off = !shell.classList.contains("side-off");
      shell.classList.toggle("side-off", off);
      setSideHidden(off);
      (off ? show : hide).focus();
    }

    var side = el("aside", "lb-side");
    side.setAttribute("aria-label", "Unit " + u.n + " contents");
    var top = el("div", "lb-side-top");
    top.innerHTML = '<div class="lb-side-unit"><span>' + esc(ctx.courseTitle || "") + " · Unit " + u.n + "</span><b>" + fmt(u.title) + "</b></div>";
    var hide = button("lb-side-btn", svg(ICON.sidebar));
    hide.setAttribute("aria-label", "Hide sidebar");
    hide.title = "Hide sidebar";
    hide.addEventListener("click", toggle);
    top.appendChild(hide);
    side.appendChild(top);

    // Search: filters as you type; Escape clears it, Enter opens the first match.
    var search = el("label", "lb-search");
    search.innerHTML = svg(ICON.search);
    var inp = el("input");
    inp.type = "search";
    inp.placeholder = "Search this unit";
    inp.setAttribute("aria-label", "Search lessons, quizzes and skills in this unit");
    inp.value = SIDE.q;
    var clear = button("lb-search-x", svg(ICON.x));
    clear.setAttribute("aria-label", "Clear search");
    search.appendChild(inp);
    search.appendChild(clear);
    side.appendChild(search);

    var list = el("div", "lb-side-list");
    var none = el("p", "lb-side-none");
    // The lesson being played lists its own steps under its row, so a
    // student can go back to a problem, and forward again. Clicking the
    // lesson itself folds them away.
    var stepsEl = null;
    function section(key, name, items) {
      var sec = el("section", "lb-sec" + (SIDE.folded[key] ? " folded" : ""));
      var h = button("lb-sec-h", "<span>" + name + "</span>" + svg(ICON.down));
      h.setAttribute("aria-expanded", String(!SIDE.folded[key]));
      h.addEventListener("click", function () {
        SIDE.folded[key] = !SIDE.folded[key];
        sec.classList.toggle("folded", SIDE.folded[key]);
        h.setAttribute("aria-expanded", String(!SIDE.folded[key]));
      });
      sec.appendChild(h);
      var ul = el("ul", "lb-rows");
      items.forEach(function (it) {
        var li = el("li");
        var cur = isHere(it, here);
        var open = cur && it.kind === "lesson";
        var ico = it.kind === "quiz" ? ICON.target : it.kind === "test" ? ICON.test : it.kind === "skill" ? ICON.bolt : ICON.doc;
        var end = it.kind === "skill" ? pips(it.lv) : it.done ? '<span class="lb-row-done" aria-label="Done">' + svg(ICON.done) + "</span>" : "";
        var b = button("lb-row k-" + it.kind + (it.done ? " done" : ""),
          '<span class="lb-row-ico">' + svg(ico, it.kind === "skill") + "</span>" +
          '<span class="lb-row-t">' + (it.kind === "lesson" ? '<i>' + it.label + "</i>" : "") + esc(stripMath(it.title)) + "</span>" + end +
          (open ? '<span class="lb-row-fold" aria-hidden="true">' + svg(ICON.down) + "</span>" : ""));
        if (cur) b.setAttribute("aria-current", "page");
        b.title = (it.kind === "lesson" ? it.label + ": " : "") + stripMath(it.title);
        b.addEventListener("click", function () {
          if (open) { foldSteps(li, b, !SIDE.stepsFolded); return; }
          SIDE.scroll = list.scrollTop;
          shell.classList.remove("peek");
          if (!cur) goItem(ctx, it);
        });
        li.dataset.text = (it.label + " " + stripMath(it.title)).toLowerCase();
        li.appendChild(b);
        if (open) {
          li.classList.add("lb-open");
          stepsEl = el("ol", "lb-steps");
          stepsEl.setAttribute("aria-label", "Steps in this lesson");
          li.appendChild(stepsEl);
          foldSteps(li, b, SIDE.stepsFolded);
        }
        ul.appendChild(li);
      });
      sec.appendChild(ul);
      list.appendChild(sec);
    }
    function foldSteps(li, b, folded) {
      SIDE.stepsFolded = folded;
      li.classList.toggle("folded", folded);
      b.setAttribute("aria-expanded", String(!folded));
    }
    // The header already names the course and the unit, so the list is just
    // what is in it: the lessons (with the quizzes and the test in their
    // places), then practice.
    section("unit", "Lessons", unitSeq(u));
    section("skills", "Practice", skillSeq(u));
    list.appendChild(none);
    side.appendChild(list);

    function filter() {
      var q = SIDE.q = inp.value.trim().toLowerCase(), any = false;
      search.classList.toggle("has", !!q);
      [].forEach.call(list.querySelectorAll(".lb-sec"), function (sec) {
        var shown = 0;
        [].forEach.call(sec.querySelectorAll(".lb-rows > li"), function (li) {
          var ok = !q || li.dataset.text.indexOf(q) > -1;
          li.hidden = !ok;
          if (ok) shown++;
        });
        sec.hidden = !shown;
        sec.classList.toggle("searching", !!q);
        if (shown) any = true;
      });
      none.hidden = any;
      none.textContent = any ? "" : "Nothing in this unit matches “" + inp.value.trim() + "”.";
    }
    inp.addEventListener("input", filter);
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && inp.value) { e.preventDefault(); inp.value = ""; filter(); }
      else if (e.key === "Enter") {
        var first = list.querySelector("li:not([hidden]) .lb-row");
        if (first) { e.preventDefault(); first.click(); }
      }
    });
    clear.addEventListener("click", function (e) { e.preventDefault(); inp.value = ""; filter(); inp.focus(); });
    filter();

    var show = button("lb-side-show", svg(ICON.sidebar));
    show.setAttribute("aria-label", "Show sidebar");
    show.title = "Show sidebar";
    show.addEventListener("click", toggle);
    var scrim = el("div", "lb-side-scrim");
    scrim.addEventListener("click", function () { shell.classList.remove("peek"); });
    side.addEventListener("keydown", function (e) { if (e.key === "Escape" && shell.classList.contains("peek")) { shell.classList.remove("peek"); show.focus(); } });

    var main = el("div", "lb-work");
    // The player reports each step as it is shown or answered (see
    // runLesson); the lesson's step list redraws to match.
    main.paintSteps = function (info, ix) {
      if (!stepsEl) return;
      stepsEl.innerHTML = "";
      info.forEach(function (st) {
        var li = el("li");
        var b = button("lb-step" + (st.current ? " cur" : "") + (st.state ? " " + st.state : ""),
          '<span class="lb-step-dot" aria-hidden="true"></span><span class="lb-step-t">' + esc(st.label) + "</span>");
        b.disabled = !st.open;
        if (st.current) b.setAttribute("aria-current", "step");
        b.title = st.open ? st.label : st.label + " — not reached yet";
        b.setAttribute("aria-label", st.label + (st.state ? ", done" : "") + (st.open ? "" : ", not reached yet"));
        b.addEventListener("click", function () {
          shell.classList.remove("peek");
          // In a retry of a few problems, the whole lesson opens on that step.
          if (!CH.go(st.i)) runLesson(host, ctx, here.k, st.i);
        });
        li.appendChild(b);
        stepsEl.appendChild(li);
      });
      // On a step, the step has the highlight; on the summary, the lesson.
      var open = stepsEl.parentNode;
      open.classList.toggle("on-step", ix < info.length);
      /* The lesson and the step you are on stay in sight when the step
         changes — scrolling the list, never the page, and not while you are
         only answering (the list may have been scrolled to look at something). */
      if (stepsEl.dataset.ix === String(ix)) return;
      stepsEl.dataset.ix = ix;
      afterSlide(host, function () {
        var at = stepsEl.children[ix] || open;
        if (!at.offsetParent) return;
        var box = list.getBoundingClientRect(), a = open.getBoundingClientRect(), c = at.getBoundingClientRect();
        if (a.top >= box.top && c.bottom <= box.bottom) return;
        list.scrollTop += c.bottom - a.top <= list.clientHeight - 16 ? a.top - box.top - 8 : c.top - box.top - list.clientHeight / 3;
      });
    };
    shell.appendChild(side);
    shell.appendChild(scrim);
    shell.appendChild(show);
    shell.appendChild(main);
    host.appendChild(shell);

    // Keep the list where it was; otherwise bring the current row into view.
    if (SIDE.scroll != null) { list.scrollTop = SIDE.scroll; SIDE.scroll = null; }
    else afterSlide(host, function () {
      var at = list.querySelector('[aria-current="page"]');
      // Scrolled only if it would be out of sight — and only the list, never the page.
      if (at && at.offsetTop + at.offsetHeight > list.clientHeight) list.scrollTop = at.offsetTop - list.clientHeight / 3;
    });
    return main;
  }
  /* A view slides in on a transform, and until it has, the sidebar — fixed
     to the window — is laid out against the view instead, a few pixels
     tall. Anything that measures the sidebar waits for the slide. */
  function afterSlide(host, fn) {
    var view = host.closest(".lx-view"), a = view && view.getAnimations ? view.getAnimations() : [];
    if (!a.length) { fn(); return; }
    Promise.all(a.map(function (x) { return x.finished; })).then(fn, fn);
  }


  /* ============================================================ Running */
  function lessonPath(u, k) {
    var l = u.lessons[k - 1];
    if (!l) return null;
    return {
      eyebrow: "Lesson " + k + " · Unit " + u.n,
      title: l.title,
      endTitle: "Lesson complete.",
      steps: l.steps.map(function (s, i) {
        var x = fmtStep(s);
        x.id = x.id || (lessonKey(l) + ":" + i);
        return x;
      })
    };
  }
  function runLesson(host, ctx, k, at) {
    useAccount(ctx.me);
    host.innerHTML = '<div class="lb-loading"><span></span><span></span><span></span></div>';
    return load(ctx.course, ctx.n).then(function (u) {
      var path = lessonPath(u, k);
      if (!path) throw new Error("There's no lesson " + k + " in this unit.");
      var after = [];
      var nx = u.lessons[k];
      if (nx) after.push({ label: "Next: " + nx.title, go: function () { ctx.go.lesson(k + 1); } });
      var sk = u.skills.filter(function (s) { return s.lesson === k; })[0] || u.skills[0];
      if (sk) after.push({ label: "Practise: " + stripMath(sk.title), go: function () { ctx.go.practice(sk.id); } });
      after.push({ label: "Unit " + u.n + ": " + u.title, go: function () { ctx.go.unit(); } });
      var here = { kind: "lesson", k: k }, work = frame(host, ctx, u, here);
      CH.play(work, {
        path: path, me: ctx.me, after: after, stepNav: true, at: at, onStep: work.paintSteps,
        onFinish: function () {
          REC.lessons[lessonKey(u.lessons[k - 1])] = { done: true, at: Date.now() };
          changed();
          // The sidebar was drawn before the lesson was finished.
          var row = host.querySelector('.lb-row[aria-current="page"]');
          if (row && !row.querySelector(".lb-row-done")) {
            row.classList.add("done");
            row.querySelector(".lb-row-t").insertAdjacentHTML("afterend", '<span class="lb-row-done" aria-label="Done">' + svg(ICON.done) + "</span>");
          }
          if (ctx.onProgress) ctx.onProgress(unitDims(u));
        }
      });
      return u;
    }, function (e) { failed(host, e); });
  }
  function stripMath(t) { return String(t).replace(/\$([^$]+)\$/g, "$1").replace(/\\[a-z]+/g, "").replace(/[{}]/g, ""); }

  // One skill: five fresh problems.
  function genStep(sk, seed, i) {
    var R = rng(seed + ":" + i);
    var st = sk.gen(R, i);
    st = fmtStep(st);
    st.id = sk.id + "~" + seed + "~" + i;
    st.skill = stripMath(sk.title);
    st.skillId = sk.id;
    return st;
  }
  function runPractice(host, ctx, skillId) {
    useAccount(ctx.me);
    host.innerHTML = '<div class="lb-loading"><span></span><span></span><span></span></div>';
    return load(ctx.course, ctx.n).then(function (u) {
      var sk = u.skills.filter(function (s) { return s.id === skillId; })[0];
      if (!sk) throw new Error("There's no skill called that in this unit.");
      var seed = Date.now().toString(36);
      var steps = [];
      for (var i = 0; i < 5; i++) steps.push(genStep(sk, seed, i));
      var before = level(sk.id);
      var here = { kind: "skill", id: sk.id }, work = frame(host, ctx, u, here);
      CH.play(work, {
        path: { eyebrow: "Practice · Unit " + u.n, title: stripMath(sk.title), steps: steps },
        me: ctx.me, record: false, fresh: true,
        shownNote: "Read the working, then try the next one.",
        summary: function (card, order) {
          var right = order.filter(function (r) { return r.first; }).length;
          var lv = before;
          if (right >= 4) lv = before < 2 ? 2 : before === 2 && right === 5 ? 3 : before;
          else lv = Math.max(before, 1);
          setLevel(sk.id, lv);
          if (ctx.onProgress) ctx.onProgress(unitDims(u));
          endCard(card, {
            title: right >= 4 ? "Nicely done." : right >= 2 ? "Getting there." : "Keep at it.",
            line: right + " of 5 right first time, without a hint.",
            changes: [{ t: sk.title, from: before, to: lv }],
            again: function () { runPractice(host, ctx, skillId); },
            next: nextSkill(u, sk, ctx),
            unit: function () { ctx.go.unit(); }, unitLabel: "Unit " + u.n + ": " + u.title
          });
        }
      });
    }, function (e) { failed(host, e); });
  }
  function nextSkill(u, sk, ctx) {
    var i = u.skills.indexOf(sk);
    var nx = u.skills.slice(i + 1).concat(u.skills.slice(0, i)).filter(function (s) { return level(s.id) < 3; })[0];
    return nx ? { label: "Next skill: " + stripMath(nx.title), go: function () { ctx.go.practice(nx.id); } } : null;
  }
  // A test: one problem per skill, levels move both ways.
  function runTest(host, ctx, scope) {
    useAccount(ctx.me);
    host.innerHTML = '<div class="lb-loading"><span></span><span></span><span></span></div>';
    var units = scope === "course" ? ctx.units : [ctx.n];
    return Promise.all(units.filter(function (n) { return has(ctx.course, n); }).map(function (n) { return load(ctx.course, n); }))
      .then(function (us) {
        var seed = Date.now().toString(36), steps = [];
        us.forEach(function (u) {
          var pool = u.skills.slice();
          if (scope === "course") pool = rng(seed + u.key).shuffle(pool).slice(0, 2);
          pool.forEach(function (sk, i) { steps.push(genStep(sk, seed + "t", i)); });
        });
        steps = rng(seed).shuffle(steps);
        var title = scope === "course" ? "Course challenge" : "Unit " + us[0].n + " test";
        var before = {};
        steps.forEach(function (s) { before[s.skillId] = level(s.skillId); });
        // The unit test sits in the unit's frame; the course challenge spans
        // every unit, so it has none.
        var here = { kind: "test" }, work = scope === "course" ? host : frame(host, ctx, us[0], here);
        CH.play(work, {
          path: { eyebrow: scope === "course" ? ctx.courseTitle : "Unit " + us[0].n + " · " + us[0].title, title: title, steps: steps },
          me: ctx.me, record: false, fresh: true,
          shownNote: "Read the working — this one will count against the skill.",
          summary: function (card, order) {
            var right = 0, changes = [];
            order.forEach(function (r) {
              if (!r.step.skillId) return;
              var id = r.step.skillId, b = level(id), lv;
              if (r.first) { right++; lv = b >= 3 ? 4 : b === 2 ? 3 : 2; }
              else lv = Math.max(1, b - 1);
              setLevel(id, lv);
              changes.push({ t: r.step.skill, from: before[id], to: lv });
            });
            var pct = order.length ? right / order.length : 0;
            us.forEach(function (u) {
              if (scope !== "course") {
                var prev = REC.tests[u.key] || {};
                REC.tests[u.key] = { best: Math.max(prev.best || 0, pct), at: Date.now() };
              }
              if (ctx.onProgress) ctx.onProgress(unitDims(u), u.n);
            });
            changed();
            endCard(card, {
              title: pct >= 0.9 ? "Excellent." : pct >= 0.7 ? "Strong work." : pct >= 0.4 ? "A good start." : "Worth another pass.",
              line: right + " of " + order.length + " right first time — " + Math.round(pct * 100) + "%.",
              changes: changes,
              again: function () { runTest(host, ctx, scope); },
              unit: scope === "course" ? null : function () { ctx.go.unit(); },
              unitLabel: scope === "course" ? null : "Unit " + us[0].n + ": " + us[0].title
            });
          }
        });
      }, function (e) { failed(host, e); });
  }
  /* A quiz: two problems from each of a few skills. It can lift a skill as
     far as Proficient; Mastered is for the unit test and the course
     challenge. */
  function runQuiz(host, ctx, k) {
    useAccount(ctx.me);
    host.innerHTML = '<div class="lb-loading"><span></span><span></span><span></span></div>';
    return load(ctx.course, ctx.n).then(function (u) {
      var q = u.quizzes[k - 1];
      if (!q) throw new Error("There's no quiz " + k + " in this unit.");
      var seed = Date.now().toString(36), steps = [];
      q.skills.forEach(function (id) {
        var sk = u.skills.filter(function (s) { return s.id === id; })[0];
        for (var i = 0; i < (q.per || 2); i++) steps.push(genStep(sk, seed + "q", i));
      });
      steps = rng(seed).shuffle(steps);
      var before = {};
      steps.forEach(function (s) { before[s.skillId] = level(s.skillId); });
      var here = { kind: "quiz", k: k }, work = frame(host, ctx, u, here);
      CH.play(work, {
        path: { eyebrow: q.title + " · Unit " + u.n, title: q.name || u.title, steps: steps },
        me: ctx.me, record: false, fresh: true,
        shownNote: "Read the working — the quiz counts this one as missed.",
        summary: function (card, order) {
          var right = 0, per = {};
          order.forEach(function (r) {
            if (!r.step.skillId) return;
            var p = per[r.step.skillId] || (per[r.step.skillId] = { n: 0, ok: 0, t: r.step.skill });
            p.n++; if (r.first) { p.ok++; right++; }
          });
          var changes = [];
          Object.keys(per).forEach(function (id) {
            var b = before[id], p = per[id], lv;
            if (p.ok === p.n) lv = Math.min(3, Math.max(2, b + 1));
            else if (p.ok === 0) lv = Math.max(1, b - 1);
            else lv = Math.max(1, b);
            setLevel(id, lv);
            changes.push({ t: p.t, from: b, to: lv });
          });
          var pct = order.length ? right / order.length : 0;
          var key = u.key + ":q" + q.k, prev = REC.tests[key] || {};
          REC.tests[key] = { best: Math.max(prev.best || 0, pct), at: Date.now() };
          changed();
          if (ctx.onProgress) ctx.onProgress(unitDims(u));
          var nextL = u.lessons[q.after];
          endCard(card, {
            title: pct >= 0.85 ? "Solid." : pct >= 0.6 ? "Good — a couple to revisit." : "Worth another look.",
            line: right + " of " + order.length + " right first time — " + Math.round(pct * 100) + "%.",
            changes: changes,
            again: function () { runQuiz(host, ctx, k); },
            next: nextL ? { label: "Next lesson: " + nextL.title, go: function () { ctx.go.lesson(nextL.k); } } : null,
            unit: function () { ctx.go.unit(); }, unitLabel: "Unit " + u.n + ": " + u.title
          });
        }
      });
    }, function (e) { failed(host, e); });
  }

  function endCard(card, o) {
    card.appendChild(el("div", "ch-endmark", '<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"/><path d="m16 27 7 7 13-15"/></svg>'));
    card.appendChild(el("h2", "ch-endh", esc(o.title)));
    card.appendChild(el("p", "ch-endsum", esc(o.line)));
    if (o.changes && o.changes.length) {
      var list = el("div", "lb-changes");
      o.changes.forEach(function (c) {
        var up = c.to > c.from, down = c.to < c.from;
        list.appendChild(el("div", "lb-change" + (up ? " up" : down ? " down" : ""),
          "<b>" + fmt(c.t) + "</b>" + pips(c.to) + "<span>" + (up ? LEVELS[c.from] + " → " + LEVELS[c.to] : down ? LEVELS[c.from] + " → " + LEVELS[c.to] : LEVELS[c.to]) + "</span>"));
      });
      card.appendChild(list);
    }
    var acts = el("div", "ch-endacts");
    var again = button("ch-btn", "<span>Another set</span>");
    again.addEventListener("click", o.again);
    acts.appendChild(again);
    if (o.next) {
      var nx = button("ch-btn primary", "<span>" + fmt(o.next.label) + "</span>" + svg(ICON.arrow));
      nx.addEventListener("click", o.next.go);
      acts.appendChild(nx);
    }
    if (o.unit) {
      var u = button("ch-btn" + (o.next ? "" : " primary"), "<span>" + esc(o.unitLabel) + "</span>" + svg(ICON.arrow));
      u.addEventListener("click", o.unit);
      acts.appendChild(u);
    }
    card.appendChild(acts);
  }
  function failed(host, e) {
    host.innerHTML = "";
    host.appendChild(el("div", "lb-none", "<b>This isn't ready yet.</b><p>" + esc(e && e.message || "Something went wrong.") + "</p>"));
  }

  /* ============================================================= Widgets
     lab/widgets.js adds itself here, and to the player. */
  var W = {};

  register();

  return {
    // content
    course: course, unit: unit, units: UNITS, has: has, load: load,
    // math
    m: m, fmt: fmt, mathHTML: mathHTML, parse: parse, parseRel: parseRel, evalTree: evalTree, compile: compile,
    equivalent: equivalent, sameEquation: sameEquation, sameRelation: sameRelation, varsOf: varsOf,
    isSimplified: isSimplified, isFactored: isFactored,
    // writing math
    rng: rng, mc: mc, gcd: gcd, frac: frac, fracText: fracText, num: num, poly: poly, lin: lin, signed: signed, sub: subst,
    // pages
    renderUnit: renderUnit, runLesson: runLesson, runPractice: runPractice, runTest: runTest, runQuiz: runQuiz,
    dims: function (courseId, n) { var u = UNITS[courseId + ":" + n]; useAccount(ME); return u ? unitDims(u) : null; },
    level: level, levels: LEVELS, useAccount: useAccount,
    _lessonPath: lessonPath, _genStep: genStep,
    // widgets
    W: W, el: el, esc: esc, button: button, svg: svg
  };
})();
