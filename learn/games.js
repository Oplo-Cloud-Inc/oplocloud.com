/* ==========================================================================
   Games.

   A game in a study app is usually a bribe: do the boring thing and you get
   the fun thing. That framing concedes the argument before it starts, and
   students can tell.

   These three are not bribes. Each one is a different retrieval, chosen
   because it is genuinely hard to do without knowing the material:

     CARD MATCH   definition first, term second — the direction flashcards
                  are worst at, because a deck read front-to-back trains
                  recognition of the term and nothing about the meaning.

     WORD HUNT    the shape of a word before its meaning. Weak as a test and
                  excellent as an introduction: a student who has hunted for
                  "tympanic" for ninety seconds has looked at those letters
                  more carefully than any amount of reading would have made
                  them, which is exactly what a hard new word needs.

     HANGMAN      production under partial information — the closest thing to
                  the moment in an exam where you can nearly remember a term.
                  It is the only one of the three that cannot be won by
                  recognition at all.

   All three feed the same student model the rest of the app runs on. A game
   that keeps its own private score is a game that wastes the evidence it
   collects — if a student can produce "cochlea" from four letters, the model
   should know that, and Learn should stop asking them to pick it out of four.

   This file decides; app.js draws. The split is the same one learn.js and
   app.js already use, and for the same reason: a grid-packing algorithm and
   a hangman state machine are worth reading on their own, and neither of them
   should be buried in markup.
   ========================================================================== */
window.OPLO_GAMES = (function () {
  "use strict";

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ==================================================== Card match
     Definition on the card, terms to choose from. Deliberately the reverse of
     a flashcard deck: producing the meaning from the term is the easy
     direction and the one every deck drills, and it is not the direction an
     exam asks in.

     Rounds are built weakest-first from the model, so the game spends its
     time where the student actually needs it rather than reshuffling the ten
     terms they already have cold. */
  function cardRounds(cards, weakest, n) {
    n = Math.min(n || 10, cards.length);
    var order = weakest && weakest.length ? weakest : cards.map(function (_, i) { return i; });
    var chosen = order.slice(0, n);
    return shuffle(chosen).map(function (ix) {
      var pool = cards.map(function (_, i) { return i; })
                      .filter(function (i) { return i !== ix; });
      var wrong = shuffle(pool).slice(0, Math.min(3, pool.length));
      return {
        ix: ix,
        def: cards[ix][1],
        right: cards[ix][0],
        opts: shuffle([ix].concat(wrong)).map(function (i) { return cards[i][0]; })
      };
    });
  }

  /* ======================================================== Word hunt
     Placing words in a grid is a packing problem, and the naive version — put
     each word somewhere it fits — produces grids where the long words are all
     in the corners and the whole thing is solved in twenty seconds.

     So: longest first (they are the constrained ones), every direction
     allowed including backwards, and overlaps actively preferred. Overlaps
     are what make a grid hard, because a letter that belongs to two words
     stops the eye from tracking one word at a time. */
  var DIRS = [
    [0, 1], [1, 0], [1, 1], [1, -1],
    [0, -1], [-1, 0], [-1, -1], [-1, 1]
  ];
  var ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  function clean(w) {
    return String(w).toUpperCase().replace(/[^A-Z]/g, "");
  }

  function huntGrid(terms, size) {
    /* Only the words that can fit, longest first. A term longer than the grid
       is dropped rather than truncated: half a word in a word search is a bug
       a student will spend five minutes failing to find. */
    var words = terms.map(function (t) { return { show: t, w: clean(t) }; })
      .filter(function (x) { return x.w.length >= 3 && x.w.length <= size; })
      .sort(function (a, b) { return b.w.length - a.w.length; })
      .slice(0, 12);

    var grid = [], r, c;
    for (r = 0; r < size; r++) {
      grid[r] = [];
      for (c = 0; c < size; c++) grid[r][c] = "";
    }

    var placed = [];

    function fits(w, r0, c0, dr, dc) {
      var over = 0;
      for (var i = 0; i < w.length; i++) {
        var r1 = r0 + dr * i, c1 = c0 + dc * i;
        if (r1 < 0 || c1 < 0 || r1 >= size || c1 >= size) return -1;
        var at = grid[r1][c1];
        if (at && at !== w[i]) return -1;
        if (at === w[i]) over++;
      }
      return over;
    }

    function put(w, r0, c0, dr, dc) {
      for (var i = 0; i < w.length; i++) grid[r0 + dr * i][c0 + dc * i] = w[i];
    }

    words.forEach(function (x) {
      /* Every legal placement is scored, and the best is taken. Scoring by
         overlap is the whole difficulty knob: a grid built greedily without
         it falls apart in seconds. */
      var best = null, bestScore = -1;
      shuffle(DIRS).forEach(function (d) {
        for (var r0 = 0; r0 < size; r0++) {
          for (var c0 = 0; c0 < size; c0++) {
            var over = fits(x.w, r0, c0, d[0], d[1]);
            if (over < 0) continue;
            var score = over * 10 + Math.random() * 3;
            if (score > bestScore) {
              bestScore = score;
              best = { r: r0, c: c0, dr: d[0], dc: d[1] };
            }
          }
        }
      });
      if (!best) return;
      put(x.w, best.r, best.c, best.dr, best.dc);
      placed.push({ show: x.show, w: x.w, r: best.r, c: best.c,
                    dr: best.dr, dc: best.dc, found: false });
    });

    /* Filler drawn from the letters the words themselves use, not from a flat
       alphabet. A grid padded with Q, X and Z makes every real word glow. */
    var bag = "";
    placed.forEach(function (p) { bag += p.w; });
    if (bag.length < 20) bag += ALPHA;
    for (r = 0; r < size; r++) {
      for (c = 0; c < size; c++) {
        if (!grid[r][c]) grid[r][c] = bag[Math.floor(Math.random() * bag.length)];
      }
    }

    return { grid: grid, size: size, words: placed };
  }

  /* Whether a dragged line matches a placed word, in either direction. A
     student who traces a word backwards has still found it. */
  function huntCheck(hunt, r0, c0, r1, c1) {
    var dr = Math.sign(r1 - r0), dc = Math.sign(c1 - c0);
    var len = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0)) + 1;
    // Only straight lines: rows, columns, and true diagonals.
    if (Math.abs(r1 - r0) !== Math.abs(c1 - c0) && r1 !== r0 && c1 !== c0) return null;

    var hit = null;
    hunt.words.forEach(function (p) {
      if (p.found || p.w.length !== len) return;
      var head = p.r === r0 && p.c === c0 && p.dr === dr && p.dc === dc;
      var tail = p.r === r1 && p.c === c1 && p.dr === -dr && p.dc === -dc;
      if (head || tail) hit = p;
    });
    return hit;
  }

  function huntCells(p) {
    var out = [];
    for (var i = 0; i < p.w.length; i++) out.push([p.r + p.dr * i, p.c + p.dc * i]);
    return out;
  }

  /* ========================================================== Hangman
     Production under partial information. The only one of the three that
     cannot be passed by recognising anything.

     No gallows is drawn. A cartoon of a person being executed is a strange
     thing to put in front of a fifteen-year-old who has just got a word
     wrong, and the tension of a dwindling count works perfectly well without
     it — what is at stake is the word, not the figure. */
  var LIVES = 7;

  function hangman(term, def) {
    var answer = String(term).toUpperCase();
    return {
      answer: answer,
      def: def,
      /* Anything that is not a letter is given away from the start: nobody
         learns anything from guessing a hyphen. */
      shown: answer.split("").map(function (ch) { return /[A-Z]/.test(ch) ? "" : ch; }),
      guessed: {},
      wrong: [],
      lives: LIVES,
      done: false,
      won: false
    };
  }

  function guess(h, letter) {
    letter = String(letter).toUpperCase();
    if (h.done || !/^[A-Z]$/.test(letter) || h.guessed[letter]) return h;
    h.guessed[letter] = true;

    var hit = false;
    for (var i = 0; i < h.answer.length; i++) {
      if (h.answer[i] === letter) { h.shown[i] = letter; hit = true; }
    }
    if (!hit) {
      h.wrong.push(letter);
      h.lives--;
      if (h.lives <= 0) { h.done = true; h.won = false; }
    } else if (h.shown.join("") === h.answer) {
      h.done = true; h.won = true;
    }
    return h;
  }

  /* One letter, chosen to be worth something: the rarest unrevealed letter in
     the word, because revealing another E teaches nothing. It costs a life,
     which is what stops it being free. */
  function reveal(h) {
    if (h.done) return null;
    var counts = {};
    h.answer.split("").forEach(function (ch) {
      if (/[A-Z]/.test(ch) && !h.guessed[ch]) counts[ch] = (counts[ch] || 0) + 1;
    });
    var best = null;
    for (var k in counts) if (!best || counts[k] < counts[best]) best = k;
    if (!best) return null;
    h.lives--;
    guess(h, best);
    if (h.lives <= 0 && !h.won) { h.done = true; h.won = false; }
    return best;
  }

  return {
    LIVES: LIVES, shuffle: shuffle, clean: clean,
    cardRounds: cardRounds,
    huntGrid: huntGrid, huntCheck: huntCheck, huntCells: huntCells,
    hangman: hangman, guess: guess, reveal: reveal
  };
})();
