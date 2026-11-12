/* ==========================================================================
   The quiet surfaces: C-12 KPI tile, C-14 card, C-18 banner, C-19 empty
   state, C-20 skeleton, C-21 avatar.

   Each is small and each is the only one of its kind: one KPI tile for every
   screen (the audit found thin strips and parenthesis sub-counts), one empty
   state, one skeleton. They live together because they share nothing but their
   discipline — a hairline, no shadow, tokens only.
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };

  /* ---------------------------------------------------------------- C-12 KPI
     label (caption) · value (h1 size, tabular) · context ("of 1,801") · delta.
     The whole tile is the button: clicking it applies its filter. One size. */
  function kpi(p) {
    var inner = [
      h("span", { class: "ol-kpi__label", text: p.label }),
      h("span", { class: "ol-kpi__value", text: p.value == null ? "—" : String(p.value) }),
      p.context ? h("span", { class: "ol-kpi__ctx", text: p.context }) : null
    ];
    if (p.delta) {
      var up = p.delta.dir === "up";
      inner.push(h("span", { class: OL.cx("ol-kpi__delta", p.delta.good === true ? "is-good" : p.delta.good === false ? "is-bad" : "") },
        OL.icon(up ? "arrow-up" : "arrow-down", 16), h("span", { text: p.delta.text })));
    }
    var clickable = !!(p.onClick || p.href);
    var el = h(p.href ? "a" : clickable ? "button" : "div", {
      class: OL.cx("ol-kpi", clickable && "is-link", p.selected && "is-on", p.tone && "ol-kpi--" + p.tone),
      href: p.href || null, type: clickable && !p.href ? "button" : null, "aria-pressed": clickable && p.selected != null ? (p.selected ? "true" : "false") : null,
      on: p.onClick ? { click: p.onClick } : null
    }, inner);
    return el;
  }

  /* ---------------------------------------------------------------- C-14 Card
     title · one line on why it matters · content · footer link "See all (n) →".
     Plain, 1 px hairline, no shadow. */
  function card(p) {
    var id = OL.uid("c");
    var head = null, body = h("div", { class: "ol-card__body", id: id + "-b" });
    var toggle = null;
    if (p.title) {
      if (p.collapsible) {
        toggle = h("button", { type: "button", class: "ol-card__toggle", "aria-expanded": p.collapsed ? "false" : "true", "aria-controls": id + "-b",
          "aria-label": p.title }, OL.icon("chevron-down", 16));
      }
      head = h("div", { class: "ol-card__head" },
        h("div", { class: "ol-card__titles" },
          h(p.level ? "h" + p.level : "h2", { class: "ol-card__title", text: p.title }),
          p.why ? h("p", { class: "ol-card__why", text: p.why }) : null),
        h("div", { class: "ol-card__actions" }, p.actions || null, toggle));
    }
    if (p.body) OL.append(body, p.body);
    var el = h("section", { class: OL.cx("ol-card", p.class, p.collapsed && "is-collapsed", p.span && "ol-span-" + p.span), "aria-labelledby": null }, head, body);
    if (p.footer) {
      var f = p.footer;
      el.appendChild(h("div", { class: "ol-card__foot" },
        h(f.href ? "a" : "button", { class: "ol-link", href: f.href || null, type: f.href ? null : "button", on: f.onClick ? { click: f.onClick } : null }, f.label, " ", OL.icon("arrow-right", 16))));
    }
    if (toggle) toggle.addEventListener("click", function () {
      var open = el.classList.toggle("is-collapsed") === false;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    el.body = body;
    return el;
  }

  /* --------------------------------------------------------------- C-18 Banner
     Under the page header, dismissible unless it is blocking. tone: info ·
     warning · danger · success · offline. */
  var BANNER_ICON = { info: "info", warning: "alert-triangle", danger: "alert-circle", success: "check-circle", offline: "alert-triangle" };
  function banner(p) {
    var tone = p.tone || "info";
    var el = h("div", { class: OL.cx("ol-banner", "ol-banner--" + tone, p.class), role: tone === "danger" || tone === "offline" ? "alert" : "status" },
      OL.icon(BANNER_ICON[tone] || "info", 20),
      h("div", { class: "ol-banner__text" },
        p.title ? h("strong", { text: p.title + " " }) : null, h("span", { text: p.text || "" })),
      p.actions ? h("div", { class: "ol-banner__actions" }, p.actions) : null);
    if (p.dismissible && !p.blocking) {
      el.appendChild(h("button", { type: "button", class: "ol-banner__x", "aria-label": t("common.dismiss"),
        on: { click: function () { el.remove(); if (p.onDismiss) p.onDismiss(); } } }, OL.icon("x", 16)));
    }
    return el;
  }

  /* ---------------------------------------------------------- C-19 Empty state
     kind: first (nothing has ever been here: icon, a sentence, why, the one
     primary action and "Import from a file") · filtered (one line and "Clear
     filters") · denied (who to ask). No illustrations: an icon and words. */
  function empty(p) {
    var kind = p.kind || "first";
    var icon = p.icon || (kind === "denied" ? "lock" : kind === "filtered" ? "search" : "folder");
    var actions = [];
    if (p.primary) actions.push(OL.ui.button.render({ label: p.primary.label, variant: "primary", icon: p.primary.icon, href: p.primary.href, onClick: p.primary.onClick }));
    if (p.secondary) actions.push(OL.ui.button.render({ label: p.secondary.label, variant: "secondary", href: p.secondary.href, onClick: p.secondary.onClick }));
    if (kind === "filtered" && p.onClear) actions.push(OL.ui.button.render({ label: t("common.clear_filters"), variant: "secondary", onClick: p.onClear }));
    return h("div", { class: OL.cx("ol-empty", "ol-empty--" + kind, p.class) },
      OL.icon(icon, 24),
      p.title ? h("h3", { class: "ol-empty__title", text: p.title }) : null,
      p.text ? h("p", { class: "ol-empty__text", text: p.text }) : null,
      p.why ? h("p", { class: "ol-empty__why", text: p.why }) : null,
      actions.length ? h("div", { class: "ol-empty__actions" }, actions) : null);
  }

  /* ---------------------------------------------------------- C-20 Skeleton
     A grey shape of the thing that is coming, drawn only if it takes longer
     than 300 ms — before that the screen is simply still. */
  function skeleton(p) {
    p = p || {};
    var type = p.type || "rows", n = p.n || (type === "rows" ? 6 : type === "kpi" ? 4 : 1);
    var el = h("div", { class: OL.cx("ol-skel", "ol-skel--" + type), "aria-hidden": "true" });
    for (var i = 0; i < n; i++) {
      if (type === "rows") el.appendChild(h("div", { class: "ol-skel__row" }, h("i"), h("i"), h("i"), h("i")));
      else if (type === "kpi") el.appendChild(h("div", { class: "ol-skel__kpi" }, h("i"), h("i")));
      else if (type === "chart") el.appendChild(h("div", { class: "ol-skel__chart" }));
      else if (type === "lines") el.appendChild(h("i", { class: "ol-skel__line" }));
      else el.appendChild(h("div", { class: "ol-skel__card" }, h("i"), h("i"), h("i")));
    }
    return el;
  }
  /* Show a skeleton in `host` after `ms` (300); the returned function removes it,
     and does so whether or not it had appeared yet. */
  skeleton.later = function (host, p, ms) {
    var node = null, timer = setTimeout(function () { node = skeleton(p); host.appendChild(node); host.setAttribute("aria-busy", "true"); }, ms == null ? 300 : ms);
    return function () { clearTimeout(timer); if (node) node.remove(); host.removeAttribute("aria-busy"); };
  };

  /* ------------------------------------------------------------- C-21 Avatar
     Initials (two letters) on a colour that comes from the id, so the same
     person is the same colour everywhere. A photo only when the caller was
     allowed to have one (student photos are personal data). */
  function hashOf(s) { var x = 0; s = String(s || ""); for (var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) % 8; return x + 1; }
  function initials(name) {
    var w = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!w.length) return "?";
    return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
  }
  function avatar(p) {
    var size = p.size || 32;
    var el = h("span", { class: OL.cx("ol-avatar", "ol-avatar--" + size), "data-h": hashOf(p.id || p.name), role: "img", "aria-label": p.name || null });
    if (p.src) el.appendChild(h("img", { src: p.src, alt: "", loading: "lazy" }));
    else el.appendChild(h("span", { "aria-hidden": "true", text: initials(p.name) }));
    return el;
  }
  avatar.group = function (people, max) {
    max = max || 3;
    var g = h("span", { class: "ol-avatars" });
    people.slice(0, max).forEach(function (x) { g.appendChild(avatar({ name: x.name, id: x.id, src: x.src, size: 24 })); });
    if (people.length > max) g.appendChild(h("span", { class: "ol-avatar ol-avatar--24 ol-avatar--more", text: "+" + (people.length - max) }));
    return g;
  };
  avatar.initials = initials;

  OL.ui.kpi = { render: kpi, states: ["default", "link", "selected", "with-delta"] };
  OL.ui.card = { render: card, states: ["plain", "with-actions", "collapsible", "with-footer-link"] };
  OL.ui.banner = { render: banner, states: ["info", "warning", "danger", "success", "offline"] };
  OL.ui.empty = { render: empty, states: ["first-use", "filtered", "not-permitted"] };
  OL.ui.skeleton = { render: skeleton, later: skeleton.later, states: ["rows", "kpi", "card", "chart"] };
  OL.ui.avatar = { render: avatar, group: avatar.group, initials: initials, states: ["initials", "photo", "group"] };
})();
