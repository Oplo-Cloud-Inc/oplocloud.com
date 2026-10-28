/* ==========================================================================
   Students — what the pages of this module share.

   The module is four screens (Directory, the quick look, the record, the add
   and edit form) drawn from the library in learn/ui and the one network seam,
   api.js. This file holds the small things more than one of them needs: how a
   student's line is written, how a status looks, where a record lives, how a
   file is downloaded.
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL, h = OL.h, t = function (k, p) { return OL.i18n.t(k, p); };
  var St = OL.students = OL.students || {};

  St.api = function () { return window.OPLO_API; };

  /* "X-C · Roll 14 · Adm. 2019/044" */
  St.sub = function (r) {
    var out = [];
    if (r.classLabel) out.push(r.classLabel);
    if (r.rollNo) out.push(t("students.roll", { n: OL.fmt.num(r.rollNo) }));
    if (r.admissionNo) out.push(t("students.adm", { no: r.admissionNo }));
    return out.join(" · ");
  };

  /* A student's address, with the tab only when it is not the first. */
  St.path = function (id, tab) { return "students/directory/" + encodeURIComponent(id) + (tab && tab !== "overview" ? "/" + tab : ""); };
  St.href = function (env, id, tab) { return env.base + St.path(id, tab); };
  /* Move the address to another tab of the open record without leaving the page. */
  St.setTab = function (env, id, tab) {
    try { history.replaceState(history.state, "", env.base + St.path(id, tab) + location.search + location.hash); } catch (e) { /* a sandboxed frame has no history */ }
  };

  /* The list the person came from, filters and all, so "Directory" in a record's header goes back to it. It is kept for
     the tab, so a refresh of the record does not lose it. */
  var LIST = "ol.students.list";
  St.lastList = "";
  try { St.lastList = sessionStorage.getItem(LIST) || ""; } catch (e) { /* storage is off: the list comes back unfiltered */ }
  St.setList = function (q) { St.lastList = q; try { sessionStorage.setItem(LIST, q); } catch (e) { /* as above */ } };
  St.listPath = function () { return "students/directory" + (St.lastList ? "?" + St.lastList : ""); };

  St.message = function (e, fallback) {
    if (!e) return fallback || t("common.load_failed");
    if (e.status === 403) return t("students.denied_text");
    if (e.code === "offline") return t("students.offline");
    return e.message || fallback || t("common.load_failed");
  };

  St.attendancePill = function (a) {
    if (!a) return null;
    if (a.status === "below") return OL.ui.pill.render({ status: "below_75" });
    if (a.status === "watch") return OL.ui.pill.render({ status: "at_risk" });
    return null;
  };
  St.attendanceCell = function (a) {
    if (!a) return null;
    var pill = St.attendancePill(a);
    return h("span", { class: "ol-students-att" }, h("span", { class: "ol-students-att__n", text: OL.fmt.pct(a.percent, 1) }), pill);
  };
  St.recordPill = function (r) {
    if (!r.gapCount) return OL.ui.pill.render({ status: "complete" });
    return OL.ui.pill.render({ label: t("students.n_to_fix", { n: r.gapCount }), tone: r.blocked ? "danger" : "warning" });
  };
  St.warnPill = function (level) {
    if (level !== "high" && level !== "medium") return null;
    return OL.ui.pill.render({ label: t("students.warn." + level), tone: level === "high" ? "danger" : "warning" });
  };
  St.genderLabel = function (g) { return g ? t("students.gender." + g) : null; };

  /* A file the browser saves: rows as CSV that a spreadsheet opens in the right encoding and does not run as a formula. */
  St.download = function (file, columns, rows) {
    var esc = function (v) {
      v = v == null ? "" : String(v);
      if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
      return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    };
    var csv = "﻿" + [columns].concat(rows).map(function (r) { return r.map(esc).join(","); }).join("\r\n");
    var url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    var a = h("a", { href: url, download: file });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  };

  St.when = function (env) { return env && env.region === "IN"; };
})();
