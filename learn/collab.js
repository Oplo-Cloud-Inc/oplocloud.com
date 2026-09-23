/* ==========================================================================
   Oplo Rooms — reading together.

   Two people reading the same passage is the oldest teaching technology there
   is, and almost nothing on a screen reproduces it. What is missing is not
   video. It is the small things: knowing which paragraph the other person is
   looking at, seeing their pen land on the page, being able to point at a
   sentence and say "this one".

   So a room carries three things and no more:

     PRESENCE   who is here, and which section they are in
     MARKS      their annotations, arriving in your margin as they write them
     FOLLOW     your page moving because theirs did

   ------------------------------------------------------------------- Honesty

   oplocloud.com is static files. There is no server here to relay a message
   between two laptops, and no amount of client-side work invents one. What
   this file does instead is real within the boundary it can reach: a
   BroadcastChannel joins every tab of this site in this browser, and
   localStorage joins every tab that was not open at the same moment. Open the
   reader in two windows and the collaboration below is not a mock-up — marks
   cross, presence updates, follow works.

   Across two machines it needs a relay, and `Room.transport` is the seam that
   takes one. Everything above the transport — presence, merge, follow, the
   whole surface — is written against an interface of `send(msg)` and
   `onMessage(fn)`, so a WebSocket is a swap and not a rewrite. That is stated
   plainly in the invite panel too, because a feature that quietly does less
   than it looks like it does is worse than one that says what it is.
   ========================================================================== */
window.OPLO_ROOM = (function () {
  "use strict";

  var CHANNEL = "oplo.learn.room";
  var MAIL = "oplo.learn.room.mail";   // the localStorage fallback lane
  var ROSTER = "oplo.learn.room.roster";
  var GONE = 12000;                    // silent this long and you have left

  /* ------------------------------------------------------------- Transport
     Local by default. Everything above this speaks send/onMessage and knows
     nothing else about how a message travels. */
  function LocalTransport() {
    var self = this;
    this.handlers = [];
    try {
      this.bc = new BroadcastChannel(CHANNEL);
      this.bc.onmessage = function (e) { self.deliver(e.data); };
    } catch (e) { this.bc = null; }

    // Older engines, and any tab that missed the broadcast, pick it up here.
    window.addEventListener("storage", function (e) {
      if (e.key !== MAIL || !e.newValue) return;
      try { self.deliver(JSON.parse(e.newValue)); } catch (err) { /* torn write */ }
    });
  }
  LocalTransport.prototype.deliver = function (msg) {
    this.handlers.forEach(function (fn) { fn(msg); });
  };
  LocalTransport.prototype.send = function (msg) {
    if (this.bc) { try { this.bc.postMessage(msg); } catch (e) { /* closed */ } }
    try { localStorage.setItem(MAIL, JSON.stringify(msg)); } catch (e) { /* full */ }
  };
  LocalTransport.prototype.onMessage = function (fn) { this.handlers.push(fn); };
  LocalTransport.prototype.reach = "this browser";

  /* ------------------------------------------------------------------ Room */
  function Room(me) {
    var self = this;
    this.me = me;                    // { id, name, initials, hue, role }
    this.id = null;                  // which room, once opened
    this.peers = {};                 // id -> { who, sec, at, following }
    this.following = null;           // whose scroll is driving mine
    this.listeners = {};
    this.transport = new LocalTransport();
    this.tab = "t" + Math.random().toString(36).slice(2, 9);

    this.transport.onMessage(function (msg) { self.take(msg); });

    // A tab that closes without saying so would sit in the roster looking
    // present. Say goodbye on the way out, and sweep the stale ones anyway.
    window.addEventListener("pagehide", function () { self.leave(); });
    this.sweeper = setInterval(function () { self.sweep(); }, 4000);
  }

  Room.prototype.on = function (evt, fn) {
    (this.listeners[evt] = this.listeners[evt] || []).push(fn);
    return this;
  };
  Room.prototype.emit = function (evt, data) {
    (this.listeners[evt] || []).forEach(function (fn) { fn(data); });
  };

  Room.prototype.post = function (kind, data) {
    if (!this.id) return;
    var msg = { room: this.id, kind: kind, from: this.me.id, tab: this.tab,
                who: this.me, at: Date.now() };
    if (data) msg.data = data;
    this.transport.send(msg);
  };

  /* ------------------------------------------------------------ Membership */
  Room.prototype.open = function (roomId, invited) {
    this.id = roomId;
    this.invited = invited || [];
    this.post("hello");
    this.emit("change", this.roster());
    return this;
  };

  Room.prototype.leave = function () {
    if (!this.id) return;
    this.post("bye");
    this.id = null;
    this.peers = {};
    this.following = null;
    this.emit("change", this.roster());
  };

  Room.prototype.sweep = function () {
    var now = Date.now(), changed = false, self = this;
    Object.keys(this.peers).forEach(function (k) {
      if (now - self.peers[k].at > GONE) { delete self.peers[k]; changed = true; }
    });
    if (changed) {
      if (this.following && !this.peers[this.following]) {
        this.following = null;
        this.emit("follow", null);
      }
      this.emit("change", this.roster());
    }
    // A heartbeat, so the other side does not sweep us either.
    if (this.id) this.post("here", { sec: this.sec, y: this.y });
  };

  Room.prototype.roster = function () {
    var self = this;
    return Object.keys(this.peers).map(function (k) {
      var p = self.peers[k];
      return { id: k, who: p.who, sec: p.sec, following: p.following === self.me.id };
    });
  };
  Room.prototype.peerCount = function () { return Object.keys(this.peers).length; };

  /* --------------------------------------------------------------- Inbound */
  Room.prototype.take = function (msg) {
    if (!msg || !this.id || msg.room !== this.id) return;
    if (msg.tab === this.tab) return;              // our own voice coming back

    if (msg.kind === "bye") {
      delete this.peers[msg.from];
      if (this.following === msg.from) { this.following = null; this.emit("follow", null); }
      this.emit("change", this.roster());
      return;
    }

    var fresh = !this.peers[msg.from];
    var p = this.peers[msg.from] || (this.peers[msg.from] = { who: msg.who, at: 0 });
    p.who = msg.who || p.who;
    p.at = Date.now();

    if (msg.kind === "hello") {
      // Answer a newcomer directly so they see us without waiting for a beat.
      this.post("here", { sec: this.sec, y: this.y });
      this.emit("joined", p.who);
    }
    if (msg.kind === "here" && msg.data) {
      var moved = p.sec !== msg.data.sec;
      p.sec = msg.data.sec;
      p.y = msg.data.y;
      p.following = msg.data.following;
      if (this.following === msg.from) this.emit("lead", { sec: p.sec, y: p.y, moved: moved });
    }
    if (msg.kind === "mark") this.emit("mark", { by: msg.who, mark: msg.data });
    if (msg.kind === "unmark") this.emit("unmark", { by: msg.who, id: msg.data });
    if (msg.kind === "point") this.emit("point", { by: msg.who, at: msg.data });
    if (msg.kind === "say") this.emit("say", { by: msg.who, text: msg.data });
    if (msg.kind === "ask") this.post("here", { sec: this.sec, y: this.y });

    if (fresh) this.emit("change", this.roster());
    else this.emit("change", this.roster());
  };

  /* -------------------------------------------------------------- Outbound */
  Room.prototype.where = function (sec, y) {
    this.sec = sec;
    this.y = y;
    this.post("here", { sec: sec, y: y, following: this.following });
  };
  Room.prototype.share = function (mark) { this.post("mark", mark); };
  Room.prototype.retract = function (id) { this.post("unmark", id); };
  Room.prototype.point = function (anchor) { this.post("point", anchor); };
  Room.prototype.say = function (text) { this.post("say", text); };

  Room.prototype.follow = function (id) {
    this.following = id || null;
    this.post("here", { sec: this.sec, y: this.y, following: this.following });
    this.emit("follow", this.following);
    if (this.following) this.post("ask");   // pull their position immediately
  };

  return { Room: Room, LocalTransport: LocalTransport };
})();
