/* ==========================================================================
   Oplo Account — how every Oplo service signs somebody in.

   A service never asks for a password itself. It opens auth.oplocloud.com
   in a tab of its own; the person signs in there, or confirms the account
   already signed in; that tab tells this page it is done and closes. This
   page then shows a progress bar, refreshes, and finishes the bar once the
   service has found the session — which it does the way it always does, by
   asking the API who is signed in. The session is an HttpOnly cookie on
   api.oplocloud.com that neither page can read, so the refresh is how the
   service learns about it: from the server, not from a message.

   To use it, a service loads this file from the auth host

       <script src="https://auth.oplocloud.com/connect.js"></script>

   and calls

       OploSignIn.open(options)   from a click — a browser only opens a tab
                                  for one. Options, all optional:
                                    next    an address on this origin to land
                                            on afterwards (default: here)
                                    verify  a function returning a promise of
                                            true when a session exists; asked
                                            if the tab closes without saying
                                            it is done
       OploSignIn.done()          once the service has signed the person in
                                  after the refresh. Without it the bar
                                  finishes on its own a few seconds after
                                  the page loads.
       OploSignIn.pending         true while a sign-in is finishing across
                                  the refresh — a page can hold back a
                                  sign-in prompt of its own until done().

   If the browser will not open a tab, the page itself goes to the auth host
   and is sent back here afterwards.
   ========================================================================== */
window.OploSignIn = (function () {
  "use strict";

  var LOCAL = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname);
  /* Beside the API on :8787 in development, as auth/wrangler.toml runs it. */
  var AUTH = LOCAL ? "http://" + location.hostname + ":8788" : "https://auth.oplocloud.com";
  var KEY = "oplo.signin";          // sessionStorage: a sign-in finishing across the refresh
  var NAME = "oplo-account";        // the tab's name, so a second click reuses it

  var reduced = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  function store(v) {
    try {
      if (v) sessionStorage.setItem(KEY, JSON.stringify(v));
      else sessionStorage.removeItem(KEY);
    } catch (e) { /* private mode: the bar simply starts again after the refresh */ }
  }
  function stored() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }

  /* An address on this origin, or nothing. The auth tab sends back the
     address it was given, but nothing arriving in a message is trusted to
     move this page to another site. */
  function here(u) {
    if (!u) return null;
    try {
      var url = new URL(u, location.href);
      return url.origin === location.origin ? url.href : null;
    } catch (e) { return null; }
  }
  function noHash(u) { return String(u).split("#")[0]; }

  /* ------------------------------------------------------------ Styles */
  var styled = false;
  function style() {
    if (styled) return;
    styled = true;
    var css =
      ".oplo-si-bar{position:fixed;top:0;left:0;right:0;height:3px;z-index:2147483647;pointer-events:none;" +
        "opacity:1;transition:opacity .35s ease}" +
      ".oplo-si-bar i{display:block;height:100%;background:#0071e3;transform-origin:0 50%;transform:scaleX(0);" +
        "box-shadow:0 0 10px rgba(0,113,227,.55);transition:transform .55s cubic-bezier(.28,.11,.32,1)}" +
      ".oplo-si-bar.out{opacity:0}" +
      ".oplo-si-wait{position:fixed;left:50%;bottom:max(22px,env(safe-area-inset-bottom));z-index:2147483646;transform:translate(-50%,8px);opacity:0;" +
        "display:flex;align-items:center;gap:12px;max-width:calc(100vw - 28px);padding:9px 10px 9px 16px;" +
        "border-radius:999px;background:rgba(29,29,31,.88);color:#f5f5f7;" +
        "-webkit-backdrop-filter:saturate(180%) blur(20px);backdrop-filter:saturate(180%) blur(20px);" +
        "box-shadow:0 8px 28px rgba(0,0,0,.22);" +
        "font:500 13px/1.3 -apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',Helvetica,Arial,sans-serif;" +
        "letter-spacing:-.01em;transition:opacity .25s ease,transform .25s cubic-bezier(.28,.11,.32,1)}" +
      ".oplo-si-wait.on{opacity:1;transform:translate(-50%,0)}" +
      ".oplo-si-wait button{flex:none;border:0;border-radius:999px;padding:5px 11px;cursor:pointer;" +
        "font:inherit;background:rgba(255,255,255,.14);color:#fff}" +
      ".oplo-si-wait button:hover{background:rgba(255,255,255,.24)}" +
      ".oplo-si-wait button.x{padding:5px 8px;background:none;color:#a1a1a6}" +
      "@media (prefers-color-scheme:dark){.oplo-si-bar i{background:#2997ff;box-shadow:0 0 10px rgba(41,151,255,.55)}}" +
      "@media (prefers-reduced-motion:reduce){.oplo-si-bar i,.oplo-si-wait{transition:none}}";
    var s = document.createElement("style");
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  /* ------------------------------------------------------ Progress bar */
  var bar = (function () {
    var el = null, fill = null, at = 0, creep = null, gone = null;
    function mount() {
      if (el) return;
      style();
      el = document.createElement("div");
      el.className = "oplo-si-bar";
      el.setAttribute("role", "progressbar");
      el.setAttribute("aria-label", "Signing in");
      el.setAttribute("aria-valuemin", "0");
      el.setAttribute("aria-valuemax", "100");
      fill = document.createElement("i");
      el.appendChild(fill);
      document.documentElement.appendChild(el);
    }
    function set(p, instant) {
      mount();
      clearTimeout(gone);
      el.classList.remove("out");
      at = Math.max(at, Math.min(1, p));
      if (instant) {
        fill.style.transition = "none";
        fill.style.transform = "scaleX(" + at + ")";
        void fill.offsetWidth;
        fill.style.transition = "";
      } else {
        fill.style.transform = "scaleX(" + at + ")";
      }
      el.setAttribute("aria-valuenow", String(Math.round(at * 100)));
    }
    /* Never standing still while something is happening, never arriving
       before it has. */
    function trickle(ceiling) {
      clearInterval(creep);
      creep = setInterval(function () {
        if (at < ceiling) set(at + (ceiling - at) * 0.08);
      }, 280);
    }
    function to(p, ceiling) { set(p); if (ceiling) trickle(ceiling); }
    function from(p, ceiling) { set(p, true); if (ceiling) trickle(ceiling); }
    function finish() {
      if (!el) return;
      clearInterval(creep);
      set(1);
      gone = setTimeout(function () {
        el.classList.add("out");
        gone = setTimeout(function () {
          if (el && el.parentNode) el.parentNode.removeChild(el);
          el = null; fill = null; at = 0;
        }, 400);
      }, reduced ? 0 : 380);
    }
    return { to: to, from: from, finish: finish };
  })();

  /* --------------------------------------------------- Waiting for you
     Somebody who comes back to this tab before finishing is told where the
     sign-in is, and can bring it back or give up. */
  var pill = null;
  function waiting(on) {
    if (!on) {
      if (pill) {
        var p = pill;
        pill = null;
        p.classList.remove("on");
        setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 260);
      }
      return;
    }
    if (pill) return;
    style();
    pill = document.createElement("div");
    pill.className = "oplo-si-wait";
    pill.setAttribute("role", "status");
    var text = document.createElement("span");
    text.textContent = "Finish signing in on the Oplo Account tab.";
    var again = document.createElement("button");
    again.type = "button";
    again.textContent = "Show";
    again.addEventListener("click", function () {
      /* The tab is still there: bring it forward as it is, with whatever has
         been typed into it, rather than loading it again. */
      var open_ = false;
      try { open_ = !!(win && !win.closed); } catch (e) { open_ = false; }
      if (!open_) { open(opts); return; }
      try { win.focus(); window.open("", NAME); } catch (e) { open(opts); }
    });
    var x = document.createElement("button");
    x.type = "button";
    x.className = "x";
    x.setAttribute("aria-label", "Cancel sign-in");
    x.textContent = "✕";
    x.addEventListener("click", cancel);
    pill.appendChild(text);
    pill.appendChild(again);
    pill.appendChild(x);
    (document.body || document.documentElement).appendChild(pill);
    void pill.offsetWidth;
    pill.classList.add("on");
  }

  /* -------------------------------------------------------------- Open */
  var win = null, poll = null, told = false, opts = {}, back = null;

  function open(options) {
    opts = options || {};
    back = here(opts.next) || location.href;
    told = false;
    var url = AUTH + "/?return=" + encodeURIComponent(back);

    var w = null;
    try { w = window.open(url, NAME); } catch (e) { w = null; }
    if (!w) {
      /* No tab: this page goes to the auth host, which sends it back — and the
         bar picks up when it arrives, if it arrives soon enough to be the
         same sign-in. */
      store({ at: Date.now(), away: true });
      location.assign(url);
      return;
    }
    win = w;
    try { win.focus(); } catch (e) { /* the browser decides */ }
    waiting(true);

    clearInterval(poll);
    poll = setInterval(function () {
      var closed = true;
      try { closed = !win || win.closed; } catch (e) { closed = true; }
      if (!closed) return;
      clearInterval(poll);
      poll = null;
      win = null;
      if (told) return;
      waiting(false);
      /* Closed without a word: given up, or signed in with the message lost
         on the way. The service can ask the server which. */
      if (typeof opts.verify === "function") {
        Promise.resolve().then(opts.verify).then(function (ok) {
          if (ok && !told) follow({ next: back });
        }, function () { /* still signed out */ });
      }
    }, 400);
  }

  function cancel() {
    clearInterval(poll);
    poll = null;
    try { if (win && !win.closed) win.close(); } catch (e) { /* not ours to close */ }
    win = null;
    waiting(false);
  }

  /* --------------------------------------------------- The instruction
     The auth tab's message: signed in, go to <address>. Only the auth host's
     origin is listened to, and the address must be on this origin. */
  window.addEventListener("message", function (e) {
    if (e.origin !== AUTH) return;
    var d = e.data;
    if (!d || typeof d !== "object" || d.type !== "oplo:auth") return;
    if (d.action === "signed-in" && !told) {
      told = true;
      follow(d);
    }
  });

  /* Show the bar, and refresh once the person can see it happen: the auth tab
     closes itself a moment after sending, and this tab comes forward. */
  function follow(d) {
    told = true;
    waiting(false);
    var to = here(d && d.next) || back || location.href;
    bar.to(0.18, 0.4);
    whenSeen(function () {
      bar.to(0.55, 0.7);
      store({ at: Date.now() });
      setTimeout(function () {
        if (noHash(to) === noHash(location.href)) location.reload();
        else location.assign(to);
      }, reduced ? 60 : 480);
    });
  }

  function whenSeen(fn) {
    if (document.visibilityState !== "hidden") { setTimeout(fn, 200); return; }
    document.addEventListener("visibilitychange", function seen() {
      if (document.visibilityState === "hidden") return;
      document.removeEventListener("visibilitychange", seen);
      setTimeout(fn, 250);
    });
  }

  /* ------------------------------------------- After the refresh
     The bar picks up where it left off and waits for the service to say it
     has signed the person in. */
  var pending = false;
  (function resume() {
    var s = stored();
    store(null);
    if (!s || !s.at || Date.now() - s.at > (s.away ? 600000 : 60000)) return;
    pending = true;
    bar.from(0.62, 0.9);
    var fallback = function () { setTimeout(done, 6000); };
    if (document.readyState === "complete") fallback();
    else window.addEventListener("load", fallback);
  })();

  function done() {
    if (!pending) return;
    pending = false;
    api.pending = false;
    bar.finish();
  }

  var api = {
    open: open,
    done: done,
    cancel: cancel,
    pending: pending,
    auth: AUTH
  };
  return api;
})();
