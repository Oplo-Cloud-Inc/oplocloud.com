/* ==========================================================================
   Signing in and signing out, as one thing a person lives through.

   Sign in   goes to the Oplo Account page in THIS tab and comes straight back:
             no second tab, nothing for a blocked pop-up to break, no page left
             waiting for a message from another window. The password is still
             typed only on auth.oplocloud.com, and the session is still a cookie
             this page cannot read. The address handed over is the one the person
             is on, so a link into the console is still where they land; app.js
             reads their roles and sends them to their own home.

   Signed out   a screen of its own that says so and offers the way back in. It is
             not the welcome page: somebody who has just chosen Sign out, or whose
             session ended, is not a visitor being told what OEdu is.

   OL.session.leaving(what)         the thin bar along the top, while the browser goes elsewhere
   OL.session.signIn()              leave for the Oplo Account page, in this tab
   OL.session.signInUrl(back)       the address it leaves for
   OL.session.showSignedOut(why)    why: "manual" (chose to), "idle" (left alone too
                                    long) or "ended" (the server ended the session)
   OL.session.hideSignedOut()
   OL.session.signedOutShown()
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };
  var S = OL.session = OL.session || {};

  var LOCAL = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname);

  /* The Oplo Account page. Beside the API on :8788 in development, as auth/wrangler.toml runs it. */
  S.authBase = function () { return LOCAL ? "http://" + location.hostname + ":8788" : "https://auth.oplocloud.com"; };

  /* Where the person is, without the part that only said they were signed out. The account page sends them back to
     exactly this, and refuses any address that is not an Oplo one. */
  function here() { return location.origin + location.pathname + location.search; }

  S.signInUrl = function (back) { return S.authBase() + "/?return=" + encodeURIComponent(back || here()); };

  /* A thin bar runs along the top while the browser makes the trip, so a click is never met with nothing. */
  S.leaving = function (what) {
    if (!document.querySelector(".ol-leaving")) document.body.appendChild(h("div", { class: "ol-leaving", role: "progressbar", aria: { label: what || t("session.going") } }));
  };

  S.signIn = function () {
    S.leaving();
    location.assign(S.signInUrl());
  };

  /* ----------------------------------------------------------- Signed out */
  var node = null;

  function root() {
    var H = window.OPLO_HOME;
    return H && H.parse ? H.parse(location.pathname).root : "/";
  }

  S.signedOutShown = function () { return !!node; };

  S.hideSignedOut = function () {
    if (!node) return;
    if (node.parentNode) node.parentNode.removeChild(node);
    node = null;
  };

  S.showSignedOut = function (why) {
    S.hideSignedOut();
    var text = t(why === "idle" ? "session.signed_out_idle" : why === "ended" ? "session.signed_out_ended" : "session.signed_out_manual");
    var again = OL.ui.button.render({
      label: t("session.sign_in_again"), variant: "primary", size: "lg",
      onClick: function () { again.setLoading(true); S.signIn(); }
    });
    var title = h("h1", { class: "ol-signedout__title", id: "ol-signedout-title", tabindex: "-1", text: t("session.signed_out_title") });
    node = h("main", { class: "ol-signedout", id: "olSignedOut", aria: { labelledby: "ol-signedout-title" } },
      h("div", { class: "ol-signedout__card" },
        h("span", { class: "ol-signedout__mark", aria: { hidden: true } }, OL.icon("log-out", 28)),
        title,
        h("p", { class: "ol-signedout__text", text: text }),
        again,
        h("a", { class: "ol-signedout__link", href: root(), text: t("session.about_oedu") })));
    document.body.appendChild(node);
    document.title = t("session.signed_out_title") + " · OEdu";
    OL.announce(t("session.signed_out_title"));
    setTimeout(function () { if (node) title.focus(); }, 30);
  };
})();
