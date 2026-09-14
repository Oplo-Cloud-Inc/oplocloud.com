/* ==========================================================================
   Oplo — search in the bar.

   The magnifier at the end of every page's bar opens a panel under it: a
   field, and Quick Links until something is typed. Typing searches every page
   on oplocloud.com, from assets/search-index.json, which tools/build.py writes
   from the same pages it builds — so the index cannot list a page that is not
   there, or miss one that is.

   It works anywhere the bar is: on this site, where the page scrolls the body,
   and on OEdu's welcome page at edu.oplocloud.com, where the page scrolls
   inside #gate. Where the site lives is read from the bar's own home link, so
   the index and every result resolve against oplocloud.com from either host,
   and from a checkout opened straight off disk.

   Dependency-free; safe to load twice.
   ========================================================================== */
(function () {
  "use strict";
  if (window.OploSearch) return;

  var nav, panel, btn, input, list, label, scrim, clear, holder, root;
  var quickHtml = "", quickLabel = "Quick Links";
  var index = null, pending = null, failed = false;
  var shown = [], active = -1, open = false, held = 0, returnFocus = true;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function load() {
    if (index || failed) return Promise.resolve(index);
    if (pending) return pending;
    pending = fetch(new URL("assets/search-index.json", root).href, { credentials: "omit" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) { index = (data && data.pages) || []; return index; })
      .catch(function () { failed = true; return null; });
    return pending;
  }

  /* Every word typed has to appear somewhere in the page's title or summary.
     A title that starts with the query ranks above one that merely contains
     it, and both rank above a match only in the summary. */
  function search(q) {
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length || !index) return [];
    var whole = words.join(" ");
    return index.map(function (p) {
      var t = String(p.t || "").toLowerCase(), d = String(p.d || "").toLowerCase(), k = String(p.k || "").toLowerCase();
      var hay = t + " " + d + " " + k;
      if (!words.every(function (w) { return hay.indexOf(w) > -1; })) return null;
      var score = t.indexOf(whole) === 0 ? 4 : t.indexOf(whole) > -1 ? 3 :
                  words.every(function (w) { return t.indexOf(w) > -1; }) ? 2 : 1;
      return { p: p, score: score };
    }).filter(Boolean).sort(function (a, b) {
      return (b.score - a.score) || (a.p.t.length - b.p.t.length);
    }).slice(0, 8).map(function (x) { return x.p; });
  }

  function href(u) { return /^https?:/.test(u) ? u : new URL(u, root).href; }

  function paint() {
    var q = input.value.trim();
    clear.hidden = !input.value;
    active = -1;
    input.removeAttribute("aria-activedescendant");
    if (!q) {
      label.textContent = quickLabel;
      list.innerHTML = quickHtml;
      shown = [].slice.call(list.querySelectorAll("a"));
      return;
    }
    load().then(function () {
      if (input.value.trim() !== q) return;
      if (!index) {
        label.textContent = "Search isn’t available right now";
        list.innerHTML = quickHtml;
        shown = [].slice.call(list.querySelectorAll("a"));
        return;
      }
      var found = search(q);
      label.textContent = found.length ? "Pages" : "No pages match “" + q + "”";
      list.innerHTML = found.map(function (p, i) {
        return "<li role='presentation'><a id='navFindOpt" + i + "' role='option' href='" + esc(href(p.u)) + "'>" +
          "<span class='t'>" + esc(p.t) + "</span>" + (p.d ? "<span class='d'>" + esc(p.d) + "</span>" : "") + "</a></li>";
      }).join("") || quickHtml;
      shown = [].slice.call(list.querySelectorAll("a"));
    });
  }

  function mark(i) {
    shown.forEach(function (a, n) { a.classList.toggle("on", n === i); a.setAttribute("aria-selected", String(n === i)); });
    active = i;
    if (i > -1 && shown[i]) {
      if (!shown[i].id) shown[i].id = "navFindQuick" + i;
      input.setAttribute("aria-activedescendant", shown[i].id);
      shown[i].scrollIntoView({ block: "nearest" });
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  }

  function lock(on) {
    if (holder) {
      if (on) holder.classList.add("ld-locked");
      else holder.classList.remove("ld-locked");
      return;
    }
    var body = document.body;
    if (on) {
      if (body.classList.contains("locked")) return;
      held = window.scrollY;
      body.style.top = (-held) + "px";
      body.classList.add("locked");
    } else if (body.classList.contains("locked")) {
      body.classList.remove("locked");
      body.style.top = "";
      window.scrollTo(0, held);
    }
  }

  function show() {
    if (open) return;
    // The phone menu and the search panel take the same space; one at a time.
    var links = $("navLinks"), toggle = $("navToggle");
    if (links && toggle && links.classList.contains("open")) toggle.click();
    open = true;
    returnFocus = true;
    nav.classList.add("searching");
    panel.hidden = false;
    scrim.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "Close search");
    lock(true);
    paint();
    load();
    requestAnimationFrame(function () { input.focus(); });
    document.dispatchEvent(new CustomEvent("oplo:search", { detail: { open: true } }));
  }

  function hide() {
    if (!open) return;
    open = false;
    nav.classList.remove("searching");
    panel.hidden = true;
    scrim.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Search oplocloud.com");
    lock(false);
    if (returnFocus) btn.focus();
    document.dispatchEvent(new CustomEvent("oplo:search", { detail: { open: false } }));
  }

  function start() {
    nav = $("nav");
    panel = $("navFind");
    btn = $("navSearch");
    if (!nav || !panel || !btn) return;
    input = $("navFindInput");
    list = $("navFindList");
    label = $("navFindLabel");
    scrim = $("navScrim");
    clear = panel.querySelector(".nav-find-clear");
    holder = nav.closest(".ld");
    var brand = nav.querySelector(".nav-brand");
    root = new URL(".", brand ? brand.href : location.href).href;
    quickHtml = list.innerHTML;
    quickLabel = label.textContent;

    btn.addEventListener("click", function () { if (open) hide(); else show(); });
    scrim.addEventListener("click", hide);
    clear.addEventListener("click", function () { input.value = ""; paint(); input.focus(); });
    input.addEventListener("input", paint);
    panel.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      var go = shown[active > -1 ? active : 0];
      if (go) { returnFocus = false; location.href = go.href; }
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!shown.length) return;
        e.preventDefault();
        var n = e.key === "ArrowDown" ? active + 1 : active - 1;
        mark(n < 0 ? shown.length - 1 : n >= shown.length ? 0 : n);
      }
    });
    list.addEventListener("click", function (e) {
      if (e.target.closest("a")) { returnFocus = false; hide(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) { e.stopPropagation(); hide(); }
    }, true);
  }

  window.OploSearch = { open: show, close: hide, isOpen: function () { return open; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
