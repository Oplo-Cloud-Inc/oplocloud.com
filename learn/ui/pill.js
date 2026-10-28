/* ==========================================================================
   C-13 Status pill, and the status dictionary.

   The same word means the same thing and wears the same colour on every
   screen (DS §7.3 and §10.3). A status is never colour alone: the pill always
   carries its word and a small icon. Pages pass a status key — "absent",
   "handed_over" — and the label comes from the pack ("status.absent"), so the
   word is translated and the colour cannot drift.

     neutral   Draft · Declined · Withdrawn · Cancelled · Not invited · Enquiry ·
               Empty · Left · Alumni · Waived
     info      Submitted · Invited · Applied · Allotted · Prepared · Editing · Scheduled
     success   Approved · Issued · Published · Paid · Present · Active · Enrolled ·
               Handed over · Complete · Sent · Cleared
     warning   Pending · Waiting · Late · Leave · At risk · Waiting list · On leave ·
               Partly paid · No role
     danger    Overdue · Absent · Failed · Blocked · Struck off · Mismatch · Bounced ·
               Below 75% · Needs cover

   OL.ui.pill.render({ status })  or  ({ label, tone })
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h;

  var TONES = {
    neutral: ["draft", "declined", "withdrawn", "cancelled", "not_invited", "enquiry", "empty", "left", "alumni", "waived"],
    info: ["submitted", "invited", "applied", "allotted", "prepared", "editing", "scheduled"],
    success: ["approved", "issued", "published", "paid", "present", "active", "enrolled", "handed_over", "complete", "sent", "cleared"],
    warning: ["pending", "waiting", "late", "leave", "at_risk", "waiting_list", "on_leave", "partly_paid", "no_role"],
    danger: ["overdue", "absent", "failed", "blocked", "struck_off", "mismatch", "bounced", "below_75", "needs_cover"]
  };
  var TONE_OF = {};
  Object.keys(TONES).forEach(function (tone) { TONES[tone].forEach(function (s) { TONE_OF[s] = tone; }); });
  var ICON = { neutral: "dot", info: "info", success: "check-circle", warning: "alert-triangle", danger: "alert-circle" };

  function render(p) {
    p = p || {};
    var tone = p.tone || TONE_OF[p.status] || "neutral";
    var label = p.label || (p.status ? OL.i18n.t("status." + p.status) : "");
    return h("span", { class: OL.cx("ol-pill", "ol-pill--" + tone, p.class), "data-status": p.status },
      OL.icon(ICON[tone], 16), h("span", { text: label }));
  }

  OL.ui.pill = { render: render, TONES: TONES, toneOf: function (s) { return TONE_OF[s] || "neutral"; },
    states: ["neutral", "info", "success", "warning", "danger"] };
})();
