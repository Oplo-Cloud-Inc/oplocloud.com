/* ==========================================================================
   Asking the same thing differently.

   A concept you got wrong should come back. If it comes back in the same
   words, with the same four options in the same order, a student learns the
   shape of the question rather than the idea behind it — and the second time
   round they are not retrieving anything, they are recognising a card they
   saw four minutes ago. The engine then records that as knowledge, and it is
   not knowledge, it is furniture.

   So a concept is never asked the same way twice in a row. The answer is
   always identical; everything around it moves:

     · the direction        term to definition, or definition to term
     · the framing          a definition, a case, a sentence with a hole in it
     · the option order     so position is never a cue
     · the distractors      drawn fresh from the set each time

   The variant is chosen from how many times this concept has been asked at
   this level, so it walks the list rather than rolling dice — a student who
   misses something four times gets four genuinely different attempts at it,
   not four coin flips that might all land on the same phrasing.

   What this is not: it is not a model rewriting questions. Everything here is
   authored, deterministic and offline, which is what makes it trustworthy —
   a generated question can be subtly wrong, and a subtly wrong question is
   worse than no question. When a model is available it should widen this
   file's supply of phrasings, never replace its guarantee that the answer is
   the one the concept actually has.
   ========================================================================== */
window.OPLO_ASK = (function () {
  "use strict";

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* An article that reads correctly in front of the term, because "a
     Ossicles" in a question stem makes the whole app look careless. */
  function art(w) {
    return /^[aeiou]/i.test(String(w)) ? "an" : "a";
  }
  function lower(w) {
    // Terms are capitalised as headwords. Mid-sentence they should not be,
    // unless they are a proper noun, which here means they stay capitalised
    // beyond the first letter.
    var s = String(w);
    return /[A-Z]/.test(s.slice(1)) ? s : s.charAt(0).toLowerCase() + s.slice(1);
  }

  /* The definition with its own term removed, if the term appears in it.
     Not every definition mentions its own term, so this returns null rather
     than a mangled sentence when it cannot be done cleanly. */
  function cloze(c) {
    var def = String(c.def || "");
    var re = new RegExp("\\b" + String(c.k).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
    if (!re.test(def)) return null;
    return def.replace(re, "———");
  }

  function pick(pool, c, field, n) {
    var others = pool.filter(function (o) { return o.k !== c.k; });
    return shuffle(others).slice(0, n).map(function (o) { return o[field]; });
  }

  /* ------------------------------------------------------------ Recognise
     Four ways to ask "can you pick it out", which between them stop a student
     from ever learning the position of an answer instead of the answer. */
  var RECOGNISE = [
    function (c, pool) {
      return { kind: "choice", label: "Definition", prompt: c.def,
               ask: "Which term is this?",
               opts: shuffle([c.k].concat(pick(pool, c, "k", 3))), right: c.k,
               why: "That is the definition of " + lower(c.k) + "." };
    },
    /* The other direction. Producing the definition from the term is a
       different retrieval, and a student solid one way is often not the other. */
    function (c, pool) {
      return { kind: "choice", label: c.k, prompt: "Which of these describes " + lower(c.k) + "?",
               ask: "Choose an answer",
               opts: shuffle([c.def].concat(pick(pool, c, "def", 3))), right: c.def,
               why: c.why || null, long: true };
    },
    /* The definition with its own word cut out of it. Harder than it looks,
       and it forces the sentence to be read rather than pattern-matched. */
    function (c, pool) {
      var gap = cloze(c);
      if (!gap) return null;
      return { kind: "choice", label: "Fill the gap", prompt: gap,
               ask: "What belongs in the gap?",
               opts: shuffle([c.k].concat(pick(pool, c, "k", 3))), right: c.k,
               why: "The sentence is the definition of " + lower(c.k) + "." };
    },
    /* Put it in somebody's mouth. A question that sounds like a person
       asking it is answered slightly differently from one that sounds like a
       form, and the variation is the point. */
    function (c, pool) {
      if (!c.eg) return null;
      return { kind: "choice", label: "In practice", prompt: c.eg,
               ask: "Which term is at work here?",
               opts: shuffle([c.k].concat(pick(pool, c, "k", 3))), right: c.k,
               why: c.why || ("That is " + art(c.k) + " " + lower(c.k) + ".") };
    }
  ];

  /* --------------------------------------------------------------- Recall
     Producing it from nothing. The variants change what the student is given
     to produce it from, which is the only lever there is at this level. */
  var RECALL = [
    function (c) {
      return { kind: "type", label: "Definition", prompt: c.def,
               ask: "Type the term", right: c.k,
               why: "The term is " + c.k + "." };
    },
    function (c) {
      var gap = cloze(c);
      if (!gap) return null;
      return { kind: "type", label: "Fill the gap", prompt: gap,
               ask: "Type the missing term", right: c.k,
               why: "The term is " + c.k + "." };
    },
    function (c) {
      if (!c.eg) return null;
      return { kind: "type", label: "In practice", prompt: c.eg + "\n\nWhat is being described?",
               ask: "Type the term", right: c.k,
               why: "That is " + c.k + "." };
    },
    function (c) {
      if (!c.say || c.say.length < 3) return null;
      return { kind: "type", label: "From the parts",
               prompt: "A good answer to this one would mention: " +
                       c.say.slice(0, 4).join(", ") + ".",
               ask: "Which term is it?", right: c.k,
               why: "Those are the parts of " + c.k + "." };
    }
  ];

  /* -------------------------------------------------------------- Explain
     The same request, asked from four angles. "Explain it" and "what breaks
     without it" pull genuinely different answers out of the same student, and
     the second is usually the more revealing of the two. */
  var EXPLAIN = [
    function (c) {
      return { kind: "free", label: c.k, prompt: "Explain it in your own words.",
               ask: "Two or three sentences", look: c.say };
    },
    function (c) {
      return { kind: "free", label: c.k,
               prompt: "Someone who has never heard the word asks you what it means. " +
                       "What do you say?",
               ask: "Two or three sentences, no jargon", look: c.say };
    },
    function (c) {
      return { kind: "free", label: c.k,
               prompt: "What would go wrong — or simply not work — if this did not exist?",
               ask: "Two or three sentences", look: c.say };
    },
    function (c) {
      if (!c.rel || !c.rel.length) return null;
      return { kind: "free", label: c.k,
               prompt: "How is this different from " + lower(c.rel[0]) + "? " +
                       "They are easy to confuse.",
               ask: "Two or three sentences", look: c.say };
    }
  ];

  /* --------------------------------------------------- Apply and transfer
     A concept carries one of each, so the stem cannot change without changing
     the question. What can change — and matters more than the wording — is
     the order of the options. Leaving the right answer at index 1 every time
     is the single easiest way to teach a student nothing at all. */
  function fromPair(c, src, label) {
    if (!src || !src.opts) return null;
    var right = src.opts[src.right];
    return { kind: "choice", label: label, prompt: src.ask,
             ask: "Choose an answer",
             opts: shuffle(src.opts), right: right, why: src.why, long: true };
  }

  var BUILDERS = {
    recognise: RECOGNISE,
    recall: RECALL,
    explain: EXPLAIN
  };

  /* ---------------------------------------------------------------- build
     `nth` is how many times this concept has already been asked at this
     level. Walking the list by it — rather than choosing at random — is what
     guarantees a student who keeps missing something keeps getting a new
     angle on it rather than the same one twice by chance.

     Every variant may decline by returning null (a concept with no example
     cannot be asked from its example), so this walks forward until one
     builds, and falls back to the first, which never declines. */
  function build(c, level, nth, pool) {
    nth = nth || 0;
    pool = pool || [];

    if (level === "apply")    return fromPair(c, c.apply, c.k + " · applied") || build(c, "recognise", nth, pool);
    if (level === "transfer") return fromPair(c, c.xfer,  c.k + " · transfer") || build(c, "recognise", nth, pool);

    var list = BUILDERS[level] || RECOGNISE;

    /* Which phrasings this particular concept can actually support. Building
       them first and then indexing by `nth` is the whole trick: walking the
       full list and skipping the ones that decline looks equivalent and is
       not — two consecutive asks would both fall through to the same
       replacement, which is exactly the repetition this file exists to stop. */
    var able = [];
    list.forEach(function (f, i) {
      var q = f(c, pool);
      if (q) { q.variant = i; able.push(q); }
    });
    if (!able.length) return list[0](c, pool);
    return able[nth % able.length];
  }

  /* How many distinct ways this concept can actually be asked at this level.
     The session report uses it to say something true about coverage rather
     than implying variety that a thin concept cannot supply. */
  function ways(c, level, pool) {
    var list = BUILDERS[level];
    if (!list) return 1;
    var n = 0;
    list.forEach(function (f) { if (f(c, pool || [])) n++; });
    return n || 1;
  }

  return { build: build, ways: ways, shuffle: shuffle };
})();
