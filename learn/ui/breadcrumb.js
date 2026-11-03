/* ==========================================================================
   C-22 Breadcrumb.

   Module › Tab › Record › Record tab. Every crumb is a link except the last,
   which is the page itself (aria-current="page"). When a record was opened from
   a filtered list, the first crumb reads "‹ Directory (X-C, Absent)" and goes
   back with the filters, scroll and page intact — the caller passes that as
   `back`, and it replaces the leading crumbs.

   On a phone the trail is truncated in the middle ("Students › … › Asha Verma"),
   because the first and last crumbs are the ones a person needs.

   OL.ui.breadcrumb.render({ items: [{ label, href, onClick }], back: { label,
     href, onClick } }) → <nav>
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };

  function render(p) {
    var items = p.items || [], ol = h("ol", { class: "ol-crumbs" });
    if (p.back) {
      ol.appendChild(h("li", { class: "ol-crumb ol-crumb--back" },
        h("a", { class: "ol-crumb__a", href: p.back.href || "#", on: { click: function (e) { if (p.back.onClick) { e.preventDefault(); p.back.onClick(e); } } } }, OL.icon("chevron-left", 16), p.back.label)));
    }
    items.forEach(function (it, i) {
      var last = i === items.length - 1;
      if (p.back && !last) return;                              // the back link stands in for the trail above the record
      var li = h("li", { class: OL.cx("ol-crumb", !last && i > 0 && i < items.length - 1 && "is-mid") });
      if (last) li.appendChild(h("span", { class: "ol-crumb__here", "aria-current": "page", text: it.label }));
      else li.appendChild(h("a", { class: "ol-crumb__a", href: it.href || "#", on: { click: function (e) { if (it.onClick) { e.preventDefault(); it.onClick(e); } } }, text: it.label }));
      if (!last) li.appendChild(OL.icon("chevron-right", 16));
      ol.appendChild(li);
    });
    return h("nav", { class: OL.cx("ol-breadcrumb", p.class), "aria-label": t("breadcrumb.label") }, ol);
  }

  OL.ui.breadcrumb = { render: render, states: ["trail", "from-filtered-list"] };
})();
