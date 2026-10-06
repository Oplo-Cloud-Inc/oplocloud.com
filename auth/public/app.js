/* ==========================================================================
   Oplo Account — the sign-in page.

   A service sends somebody here in a tab of its own (connect.js), with
   ?return=<the address they were on>. This page:

     1. asks the API who is signed in in this browser;
     2. if nobody, asks for the email, then the password, and signs in;
        if somebody, shows the account and asks them to confirm it;
     3. tells the service that opened this tab — a postMessage to that
        service's origin and no other — and closes the tab. The service shows
        its progress bar, refreshes, and finds the session itself.

   Opened without an opener (a link, or a browser that would not open a tab),
   it sends the tab back to the return address instead. Opened with no
   return address at all, it is the account's own page: who is signed in,
   and a way out.

   The page talks to api.oplocloud.com directly, with credentials, so the
   session cookie the API sets is the API's own — the same cookie every
   service already sends. Nothing about the session is readable here or sent
   in the message: the message says only "signed in, go to <address>".
   ========================================================================== */
(function () {
  "use strict";

  var LOCAL = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname);

  /* The API, found the way learn/api.js finds it: the same host on :8787 in
     development, api.oplocloud.com otherwise. */
  var API = LOCAL ? location.protocol + "//" + location.hostname + ":8787/api/v1"
                  : "https://api.oplocloud.com/api/v1";

  /* What each service is called on this page. The name comes from this list,
     never from the URL, so a link cannot make the page say "Continue to"
     anything that was not written down here. */
  var NAMES = {
    "edu.oplocloud.com": "OEdu",
    "kern.oplocloud.com": "Kern",
    "dev.oplocloud.com": "Oplo Developer",
    "roxan.oplocloud.com": "Roxan",
    "efm.oplocloud.com": "OC EFM",
    "oplocloud.com": "Oplo",
    "www.oplocloud.com": "Oplo"
  };

  /* Where to go afterwards, if anywhere. Only an https Oplo address (or, when
     this page is itself on localhost, a localhost one) is honoured; anything
     else is dropped, which makes the page the account page rather than an
     open redirect or a messenger for somebody else's window. */
  function readReturn() {
    var raw = new URLSearchParams(location.search).get("return");
    if (!raw) return null;
    var u;
    try { u = new URL(raw); } catch (e) { return null; }
    if (u.username || u.password) return null;
    var oplo = u.protocol === "https:" &&
               /^([a-z0-9-]+\.)?oplocloud\.com$/.test(u.hostname) &&
               u.hostname !== "auth.oplocloud.com";
    var local = LOCAL && /^https?:$/.test(u.protocol) &&
                /^(localhost|127\.0\.0\.1)$/.test(u.hostname) && u.origin !== location.origin;
    if (!oplo && !local) return null;
    return {
      origin: u.origin,
      href: u.href,
      name: NAMES[u.hostname] || (local && /^\/learn\//.test(u.pathname) ? "OEdu" : "Oplo")
    };
  }
  var RET = readReturn();

  /* ---------------------------------------------------------------- DOM */
  var main = document.getElementById("au");

  /* Elements are built, never parsed from strings with somebody's name or
     address in them. */
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "text") n.textContent = v;
      else if (k === "on") Object.keys(v).forEach(function (ev) { n.addEventListener(ev, v[ev]); });
      else n.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (c) {
      if (c == null || c === false) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }
  function show(view) {
    main.textContent = "";
    main.appendChild(view);
    var first = view.querySelector("[data-first]");
    if (first) setTimeout(function () { first.focus(); }, 30);
  }
  function svg(markup) {
    var t = document.createElement("template");
    t.innerHTML = markup;           // constant markup only
    return t.content.firstChild;
  }

  function forLine() {
    if (!RET) return null;
    return h("p", { class: "au-for" }, ["Continue to ", h("b", { text: RET.name })]);
  }

  function field(id, label, type, autocomplete, value) {
    var input = h("input", {
      id: id, name: id, type: type, placeholder: " ", autocomplete: autocomplete,
      autocapitalize: "none", spellcheck: "false", required: true
    });
    if (value) input.value = value;
    return { wrap: h("div", { class: "au-field" }, [input, h("label", { for: id, text: label })]), input: input };
  }

  function face(account, small) {
    var f = h("span", { class: "au-face", "aria-hidden": "true",
      text: account.initials || (account.name || account.email || "?").charAt(0).toUpperCase() });
    if (account.hue && /^#[0-9a-f]{3,8}$/i.test(account.hue)) f.style.background = account.hue;
    return f;
  }

  /* ---------------------------------------------------------------- API */
  function call(method, path, body, timeout) {
    var init = { method: method, credentials: "include", headers: {} };
    if (body !== undefined) {
      init.headers["content-type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = null;
    if (ctrl) { init.signal = ctrl.signal; timer = setTimeout(function () { ctrl.abort(); }, timeout || 12000); }
    return fetch(API + path, init).then(function (res) {
      if (timer) clearTimeout(timer);
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
        if (!res.ok) {
          var er = (data && data.error) || {};
          var x = new Error(er.message || "That did not work.");
          x.status = res.status; x.code = er.code || "http_" + res.status; x.field = er.field;
          throw x;
        }
        return data;
      });
    }, function () {
      if (timer) clearTimeout(timer);
      var x = new Error("Oplo can't be reached right now. Check your connection and try again.");
      x.code = "offline";
      throw x;
    });
  }

  /* ------------------------------------------------------------- Views */
  function waitView() {
    show(h("div", { class: "au-wait", "aria-label": "Loading" }, [h("span", { class: "au-spin" })]));
  }

  function emailView(prefill, message) {
    var email = field("email", "Email", "email", "username", prefill);
    var err = h("p", { class: "au-err", role: "alert", text: message || "" });
    email.input.setAttribute("data-first", "");
    var form = h("form", { class: "au-form", novalidate: true, on: { submit: function (e) {
      e.preventDefault();
      var v = email.input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        err.textContent = v ? "That doesn't look like an email address." : "Enter your email to continue.";
        email.input.classList.add("bad");
        email.input.focus();
        return;
      }
      passwordView(v);
    } } }, [
      email.wrap,
      h("button", { class: "au-btn", type: "submit", text: "Continue" }),
      err
    ]);
    email.input.addEventListener("input", function () { email.input.classList.remove("bad"); err.textContent = ""; });
    show(h("section", { class: "au-view" }, [
      forLine(),
      h("h1", { text: "Sign in" }),
      h("p", { class: "au-sub", text: "Use your Oplo Account." }),
      form,
      h("p", { class: "au-links" }, [
        h("a", { href: "/recovery" + location.search, text: "Forgot password?" }),
        h("a", { href: "/register" + location.search, text: "Don't have an account?" })
      ])
    ]));
  }

  function passwordView(email) {
    var user = field("username", "Email", "email", "username", email);
    user.wrap.classList.add("au-quiet");
    user.input.tabIndex = -1;
    var pw = field("password", "Password", "password", "current-password");
    pw.input.setAttribute("data-first", "");
    var btn = h("button", { class: "au-btn", type: "submit", text: "Sign in" });
    var err = h("p", { class: "au-err", role: "alert" });

    var form = h("form", { class: "au-form", novalidate: true, on: { submit: function (e) {
      e.preventDefault();
      if (!pw.input.value) { err.textContent = "Enter your password."; pw.input.focus(); return; }
      btn.disabled = true;
      btn.textContent = "Signing in…";
      err.textContent = "";
      /* No limiter here: the API limits attempts per address and per client,
         where it means something. */
      call("POST", "/auth/login", { email: email, password: pw.input.value }, 20000)
        .then(function (r) { finish(r && r.account); })
        .catch(function (x) {
          btn.disabled = false;
          btn.textContent = "Sign in";
          pw.input.value = "";
          pw.input.classList.add("bad");
          pw.input.focus();
          err.textContent = x.code === "offline" ? x.message
            : (x.message || "That email and password don't match an Oplo Account.");
        });
    } } }, [
      user.wrap,
      pw.wrap,
      btn,
      err
    ]);
    pw.input.addEventListener("input", function () { pw.input.classList.remove("bad"); err.textContent = ""; });

    show(h("section", { class: "au-view" }, [
      forLine(),
      h("h1", { text: "Enter your password" }),
      h("div", { class: "au-who au-small" }, [
        face({ email: email }, true),
        h("span", { class: "au-id" }, [h("span", { class: "au-mail", text: email })]),
        h("button", { class: "au-change", type: "button", text: "Change",
          on: { click: function () { emailView(email); } } })
      ]),
      form,
      h("p", { class: "au-links" }, [
        h("a", { href: "/recovery" + location.search, text: "Forgot password?" })
      ])
    ]));
  }

  /* A session is already open in this browser. With somewhere to go, the
     person confirms it is the account they mean; without, this is their
     account page. */
  function confirmView(account) {
    var go = h("button", { class: "au-btn", type: "button", "data-first": true, text: "Continue",
      on: { click: function () { go.disabled = true; finish(account); } } });
    show(h("section", { class: "au-view" }, [
      forLine(),
      h("h1", { text: "Continue as " + (account.firstName || account.name || account.email) + "?" }),
      h("div", { class: "au-who" }, [
        face(account),
        h("span", { class: "au-id" }, [
          h("span", { class: "au-name", text: account.name || account.email }),
          h("span", { class: "au-mail", text: account.email })
        ])
      ]),
      go,
      h("button", { class: "au-btn au-plain", type: "button", text: "Use a different account",
        on: { click: switchAccount } })
    ]));
  }

  function accountView(account) {
    show(h("section", { class: "au-view" }, [
      h("h1", { text: "You're signed in" }),
      h("p", { class: "au-sub", text: "One Oplo Account signs you in to every Oplo service." }),
      h("div", { class: "au-who" }, [
        face(account),
        h("span", { class: "au-id" }, [
          h("span", { class: "au-name", text: account.name || account.email }),
          h("span", { class: "au-mail", text: account.email })
        ])
      ]),
      h("div", { class: "au-apps" }, [
        h("a", { class: "au-app", href: "https://edu.oplocloud.com/" }, ["OEdu", h("span", { text: "›" })])
      ]),
      h("button", { class: "au-btn au-plain", type: "button", "data-first": true, text: "Sign out",
        on: { click: switchAccount } })
    ]));
  }

  function switchAccount() {
    waitView();
    call("POST", "/auth/logout", {}).catch(function () { /* already gone */ })
      .then(function () { emailView(); });
  }

  /* Honest pages for the two links under the form: there is no self-service
     account creation or reset — accounts are made, and passwords set, by
     whoever runs the organisation the account belongs to. */
  function helpView(kind) {
    var reset = kind === "recovery";
    show(h("section", { class: "au-view" }, [
      h("h1", { text: reset ? "Forgot your password?" : "Getting an Oplo Account" }),
      h("p", { class: "au-sub", text: reset
        ? "Your school or organization's administrator can set a new password for you. Ask them, then sign in with it here."
        : "Oplo Accounts are created by your school or organization. Ask your administrator for yours, then sign in here." }),
      h("p", { class: "au-links" }, [
        h("a", { href: "/" + location.search, "data-first": true, text: "Back to sign in" })
      ])
    ]));
  }

  function offlineView(message) {
    show(h("section", { class: "au-view" }, [
      forLine(),
      h("h1", { text: "Can't reach Oplo" }),
      h("p", { class: "au-sub", text: message }),
      h("div", { class: "au-form" }, [
        h("button", { class: "au-btn", type: "button", "data-first": true, text: "Try again",
          on: { click: start } })
      ])
    ]));
  }

  /* --------------------------------------------------------- Handing back
     Signed in. Tell the service that opened this tab, then close it; the
     browser brings the person back to that tab, where connect.js shows the
     progress bar and refreshes. */
  function finish(account) {
    if (!RET) { if (account) accountView(account); else start(); return; }

    var tick = svg('<svg class="au-tick" viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="28" cy="28" r="26"/><path d="M17 29l7 7 15-16"/></svg>');
    var note = h("p", { class: "au-sub", text: "Taking you back to " + RET.name + "…" });
    show(h("section", { class: "au-view" }, [
      tick,
      h("h1", { text: "You're signed in" }),
      note
    ]));

    var opener = null;
    try { opener = window.opener && !window.opener.closed ? window.opener : null; } catch (e) { opener = null; }

    if (!opener) {
      /* Nobody is waiting for this tab: it goes back to the service itself. */
      setTimeout(function () { location.replace(RET.href); }, 700);
      return;
    }

    /* The message goes to the service's origin and nowhere else. If that tab
       has since moved to another site, the browser drops it — and the
       service, seeing this tab close without a word, asks the API itself. */
    try {
      opener.postMessage({ type: "oplo:auth", action: "signed-in", next: RET.href }, RET.origin);
    } catch (e) { /* the service will ask when the tab closes */ }

    setTimeout(function () {
      try { opener.focus(); } catch (e) { /* the browser decides */ }
      window.close();
      /* Still open: this browser will not let a page close a tab. Say so, and
         offer the way back rather than leaving a second copy of the service. */
      setTimeout(function () {
        note.textContent = "";
        note.appendChild(document.createTextNode("You can close this tab. "));
        note.appendChild(h("a", { href: RET.href, text: "Go to " + RET.name }));
      }, 500);
    }, 650);
  }

  /* --------------------------------------------------------------- Start */
  function start() {
    var path = location.pathname.replace(/\/+$/, "") || "/";
    if (path === "/recovery" || path === "/register") { helpView(path.slice(1)); return; }

    waitView();
    call("GET", "/me").then(function (r) {
      var account = r && r.account;
      if (!account) { emailView(); return; }
      if (RET) confirmView(account); else accountView(account);
    }).catch(function (x) {
      if (x.code === "offline") { offlineView(x.message); return; }
      emailView();                   // 401: nobody is signed in
    });
  }

  if (RET) document.title = "Sign in to " + RET.name + " — Oplo Account";
  start();
})();
