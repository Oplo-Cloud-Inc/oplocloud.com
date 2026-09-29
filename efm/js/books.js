/* ==========================================================================
   OC EFM — the real books.

   OploCloud's books are not stored as balances. They are stored as the list
   of things that were done to them — each command, by whom, when — and the
   books at any moment are what that list adds up to when the engine runs it
   from the start. Nothing is ever edited or removed from the list; a mistake
   is corrected by another command (a reversal), so the history is the record.

   This file is shared, unchanged, by the browser and by the API: the browser
   replays the list to show the books, and the server replays the same list
   before accepting a new command, so the server refuses exactly what the
   engine refuses and the two can never disagree about what the books are.

   Each command is chained to the one before it by a hash that covers its
   content, so a command that is changed or dropped after the fact breaks
   every hash that follows it.

   Nothing here touches the DOM.
   ========================================================================== */
(function (root) {
  "use strict";
  var EFM = root.EFM = root.EFM || {};
  var Engine = EFM.Engine;

  /* JSON with its keys in a fixed order, so the same command always hashes
     the same however it was assembled or stored. */
  function canon(v) {
    if (v === null || typeof v !== "object") return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
    return "{" + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ":" + canon(v[k]); }).join(",") + "}";
  }
  EFM.canon = canon;

  /* Where a book's chain starts, so no two books share a first hash. */
  EFM.genesis = function (bookId) { return Engine.prototype.sha256("efm-book:" + bookId); };

  /* The hash of a command, given the hash before it. `row` is
     { seq, type, payload, actor: { id, name, role }, at }. */
  EFM.commandHash = function (prev, row) {
    return Engine.prototype.sha256([prev, row.seq, row.type, canon(row.payload), row.actor.id, row.actor.name, row.actor.role, row.at].join("|"));
  };

  /* Checks a whole list against the hashes stored with it. Returns
     { ok: true, head } or { ok: false, at: seq }. */
  EFM.verifyCommands = function (bookId, rows) {
    var prev = EFM.genesis(bookId);
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.seq !== i + 1) return { ok: false, at: i + 1, why: "a command is missing" };
      if (r.prev !== prev) return { ok: false, at: r.seq, why: "it does not follow the command before it" };
      var h = EFM.commandHash(prev, r);
      if (h !== r.hash) return { ok: false, at: r.seq, why: "its contents no longer match its hash" };
      prev = h;
    }
    return { ok: true, head: prev, count: rows.length };
  };

  /* Blank books for a company. `cfg` is { id, name, fy, entities, today }:
     the fiscal year and the legal entities, both held with the book, and the
     day it is now (New York). Nothing else is assumed: no customers, no
     vendors, no bank accounts, no balances, no colleagues. */
  EFM.createBooks = function (cfg) {
    var E = new Engine({ asOf: cfg.today, fy: cfg.fy, live: true });
    cfg.entities.forEach(function (e) { E.addEntity(Object.assign({ taxRate: 0, vat: 0, legal: "", city: "" }, e)); });
    E.asOf = E.clampDate(cfg.today);
    E.bookId = cfg.id;
    E.bookName = cfg.name;
    E.dims.project = [];        // projects are set up by the people who run them
    return E;
  };

  /* Runs a list of commands onto books, as the people who made them, when
     they made them. Returns the ones that no longer apply — none, unless the
     engine has changed under a stored log, which is worth knowing loudly. */
  EFM.replayCommands = function (E, rows, today) {
    var failed = [];
    rows.forEach(function (r) {
      try { E.exec(r.type, r.payload, { id: r.actor.id, name: r.actor.name, role: r.actor.role }, { at: r.at, replay: true }); }
      catch (e) { failed.push({ seq: r.seq, type: r.type, error: e && e.message || String(e) }); }
    });
    if (today) E.asOf = E.clampDate(today);
    return failed;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = EFM;
})(typeof window !== "undefined" ? window : globalThis);
