/* ==========================================================================
   C-01 Button.

   variant   primary · secondary · ghost · danger · link
   size      sm · md · lg (md is the control height of the density in force)
   states    loading (a spinner that keeps the button's width), disabled (stays
             focusable and says why, because a dead button with no reason is a
             dead end), icon-only (allowed in toolbars; needs aria-label)

   Rules the component enforces so a page cannot forget them: one label, verb
   plus noun in sentence case; an icon-only button without a name throws in
   development; a link-styled button that navigates is an <a>.

   OL.ui.button.render({ label, variant, size, icon, iconAfter, iconOnly,
     ariaLabel, loading, disabled, disabledReason, href, type, onClick, tip })
   returns the element, which also has .setLoading(bool) and
   .setDisabled(bool, reason).
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h;

  function render(p) {
    p = p || {};
    var href = p.href && !p.disabled && !p.loading;
    var el = h(href ? "a" : "button", {
      class: OL.cx("ol-btn", "ol-btn--" + (p.variant || "secondary"), p.size && p.size !== "md" && "ol-btn--" + p.size, p.iconOnly && "ol-btn--icon"),
      href: href ? p.href : null,
      type: href ? null : (p.type || "button"),
      "aria-label": p.iconOnly ? (p.ariaLabel || p.label) : p.ariaLabel,
      "data-tip": p.iconOnly ? (p.tip || p.ariaLabel || p.label) : p.tip
    });
    if (p.iconOnly && !el.getAttribute("aria-label") && window.console) console.warn("OL.ui.button: an icon-only button needs an aria-label");
    var spin = h("span", { class: "ol-btn__spin", "aria-hidden": "true" });
    if (p.icon) el.appendChild(OL.icon(p.icon, 16));
    if (!p.iconOnly) el.appendChild(h("span", { class: "ol-btn__label", text: p.label }));
    if (p.iconAfter) el.appendChild(OL.icon(p.iconAfter, 16));
    el.appendChild(spin);

    var reason = p.disabledReason || "";
    el.setDisabled = function (on, why) {
      reason = why != null ? why : reason;
      if (on) {
        el.setAttribute("aria-disabled", "true");
        if (reason) el.setAttribute("data-tip", reason);
      } else {
        el.removeAttribute("aria-disabled");
        if (reason && !p.iconOnly) el.removeAttribute("data-tip");
      }
    };
    el.setLoading = function (on) {
      if (on && !el.classList.contains("is-loading")) el.style.setProperty("--w", el.offsetWidth + "px");
      el.classList.toggle("is-loading", !!on);
      if (on) el.setAttribute("aria-busy", "true"); else el.removeAttribute("aria-busy");
      if (!on) el.style.removeProperty("--w");
    };
    if (p.disabled) el.setDisabled(true);
    if (p.loading) el.setLoading(true);

    /* aria-disabled and loading swallow the click; the handler never runs twice either. */
    el.addEventListener("click", function (e) {
      if (el.getAttribute("aria-disabled") === "true" || el.classList.contains("is-loading")) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (p.onClick) p.onClick(e, el);
    });
    return el;
  }

  OL.ui.button = { render: render, states: ["default", "hover", "focus", "loading", "disabled"] };
})();
