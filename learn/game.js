/* ==========================================================================
   The game layer.

   Every study app eventually bolts on points, and most of them make the
   product worse. The reason is always the same: the reward gets attached to
   activity rather than to learning, so the fastest way to win is to answer
   easy questions quickly, and a student optimising for the meter stops
   optimising for the subject.

   So there is one rule here, and everything else follows from it:

       POINTS ARE PAID FOR DIFFICULTY SURVIVED, NOT FOR ACTIVITY DONE.

   Which means, concretely:

     · A transfer question is worth four times a recognition question,
       because it is four times harder to fake.
     · Hints cut the award, in the same proportion the learning engine cuts
       the mastery. The two numbers never tell different stories.
     · Answering something you already have at mastery pays almost nothing.
       Farming an easy set is not a strategy, it is a waste of an afternoon.
     · Saying "I don't know" pays more than a wrong guess. It is the more
       honest act and the more useful signal, and it should not cost.
     · A streak counts days on which something was actually learned. Opening
       the app is not a day.

   And one rule about where it is allowed to appear. The question card stays
   clean — no meter, no timer, no confetti over a student who is thinking.
   Points are shown between questions and after sessions, on the home screen,
   and nowhere else.
   ========================================================================== */
window.OPLO_GAME = (function () {
  "use strict";

  /* --------------------------------------------------------------- Ranks
     A ladder long enough that the next rung is always visible and never
     close enough to be trivial. The names describe a way of working rather
     than a score, because "Apprentice" tells a student something about
     themselves and "Level 7" does not. */
  var RANKS = [
    { at: 0,     name: "Beginner",    say: "Everything is new. That is the best part of it." },
    { at: 250,   name: "Student",     say: "You have put in real hours." },
    { at: 700,   name: "Apprentice",  say: "You can be left alone with a new topic." },
    { at: 1500,  name: "Journeyman",  say: "You can use what you know, not just repeat it." },
    { at: 3000,  name: "Practitioner",say: "You bring things back after a gap. That is the hard one." },
    { at: 5500,  name: "Scholar",     say: "You can explain it to somebody else." },
    { at: 9000,  name: "Adept",       say: "You reason about cases the book never covered." },
    { at: 14000, name: "Master",      say: "There is not much of this subject left to hand you." }
  ];

  function rank(xp) {
    var out = RANKS[0], next = null;
    for (var i = 0; i < RANKS.length; i++) {
      if (xp >= RANKS[i].at) { out = RANKS[i]; next = RANKS[i + 1] || null; }
    }
    var span = next ? next.at - out.at : 1;
    return { name: out.name, say: out.say, at: out.at, next: next, n: RANKS.indexOf(out) + 1,
             of: RANKS.length,
             pct: next ? Math.min(100, Math.round((xp - out.at) / span * 100)) : 100,
             toGo: next ? next.at - xp : 0 };
  }

  /* ------------------------------------------------------------- Awards
     What one answer is worth. The level is the base, everything else is a
     multiplier, and the multipliers are all downward except the two that
     should not be — being right first time, and being right after a gap. */
  var BASE = { recognise: 6, recall: 10, explain: 16, apply: 20, transfer: 26 };

  function forAnswer(o) {
    var base = BASE[o.level] || 6;

    if (!o.right) {
      // Wrong costs nothing, and an honest "I don't know" is worth a little,
      // because the alternative is teaching students to guess.
      return { xp: o.skipped ? 2 : 0,
               why: o.skipped ? "Said you did not know" : null };
    }

    var xp = base, why = [];
    why.push(o.level.charAt(0).toUpperCase() + o.level.slice(1));

    // Hints cut the award in the same proportion the engine cuts the mastery.
    if (o.hints >= 3)      { xp *= 0.2;  why.push("three hints"); }
    else if (o.hints === 2){ xp *= 0.35; why.push("two hints"); }
    else if (o.hints === 1){ xp *= 0.6;  why.push("a hint"); }

    // Already known: the meter should not reward re-proving it. This is the
    // clause that makes farming pointless.
    if (o.mastery >= 0.9)      { xp *= 0.15; why.push("already mastered"); }
    else if (o.mastery >= 0.72){ xp *= 0.5;  why.push("already strong"); }

    // Right after a real gap is the only thing in this file that proves
    // retention rather than performance, so it is the only real bonus.
    if (o.gapDays >= 1) { xp *= 1.5; why.push("held after " +
      (o.gapDays >= 2 ? Math.round(o.gapDays) + " days" : "a day")); }

    // A confident right answer is worth a touch more than a lucky one.
    if (o.confidence != null && o.confidence >= 2) xp *= 1.1;

    return { xp: Math.max(1, Math.round(xp)), why: why.join(" · ") };
  }

  /* Whole activities, awarded once at the end rather than per item, so that
     the games cannot outpay the learning. A perfect Match run is worth about
     four apply questions, which is roughly the honest exchange rate. */
  function forRun(kind, o) {
    o = o || {};
    var acc = o.total ? o.right / o.total : 0;
    if (kind === "match")   return Math.round(30 + Math.max(0, 60 - (o.seconds || 60)) * 0.8);
    if (kind === "hunt")    return Math.round(20 + (o.found || 0) * 6);
    if (kind === "hangman") return Math.round(o.won ? 14 + (o.lives || 0) * 4 : 3);
    if (kind === "cardmatch") return Math.round(25 + acc * 45);
    if (kind === "test")    return Math.round(20 + acc * 70);
    if (kind === "cards")   return Math.round(6 + (o.known || 0) * 2);
    return 0;
  }

  /* -------------------------------------------------------------- Badges
     Each one names something a student actually did that is hard to do by
     accident. Nothing here is awarded for turning up, and nothing is awarded
     for a number that can be reached by grinding an easy set. */
  var BADGES = [
    { k: "first",     name: "First light",      say: "Finished your first Learn session." },
    { k: "week",      name: "Seven days",       say: "A seven-day streak of days you actually learned something." },
    { k: "month",     name: "Thirty days",      say: "A thirty-day streak. Very few people get here." },
    { k: "nohint",    name: "Unassisted",       say: "A full session at eighty per cent with no hints taken." },
    { k: "transfer",  name: "Beyond the book",  say: "Answered a transfer question correctly — a case the text never covered." },
    { k: "explain",   name: "In your own words",say: "Passed a teach-it-back." },
    { k: "held",      name: "It held",          say: "Got something right a week after last seeing it." },
    { k: "honest",    name: "Honest",           say: "Said “I don't know” ten times rather than guessing." },
    { k: "fixed",     name: "Changed your mind",say: "Turned a confident wrong answer into a mastered concept." },
    { k: "swept",     name: "Clean sweep",      say: "Took every concept in a set to mastered." },
    { k: "quick",     name: "Under thirty",     say: "A Match run in under thirty seconds." },
    { k: "hunter",    name: "Word hunter",      say: "Found every term in a Word Hunt grid." }
  ];
  var BY_K = {};
  BADGES.forEach(function (b) { BY_K[b.k] = b; });
  function badge(k) { return BY_K[k] || null; }

  /* --------------------------------------------------------------- Streak
     Read-only helpers over what the record already holds. The streak itself
     is advanced in store.js, because the day ledger and the streak must never
     be able to disagree, and the only way to guarantee that is one writer. */
  function week(rec, ST) {
    var out = [], now = Date.now();
    for (var i = 6; i >= 0; i--) {
      var key = ST.today(now - i * 864e5);
      out.push({ day: key, xp: rec.d.game.days[key] || 0,
                 label: new Date(now - i * 864e5).toLocaleDateString(undefined, { weekday: "narrow" }) });
    }
    return out;
  }

  function goalPct(rec) {
    var g = rec.d.game;
    return Math.min(100, Math.round(g.today / Math.max(1, g.goal) * 100));
  }

  return {
    RANKS: RANKS, BADGES: BADGES, BASE: BASE,
    rank: rank, badge: badge, forAnswer: forAnswer, forRun: forRun,
    week: week, goalPct: goalPct
  };
})();
