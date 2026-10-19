/* ==========================================================================
   OEdu — a letter, drawn as the page it is.

   The school's letters (acknowledgement, call for assessment, offer, regret ...) are
   written and kept on the server as { refNo, date, school, to, subject, salutation,
   blocks, closing } (api/src/services/letters.js). This turns one into markup, in one
   place, for the three people who look at it: the office that prepares it, the office
   that reprints it, and the family that reads it in the app.

   Nothing here decides what a letter says.
   ========================================================================== */
window.OPLO_LETTER = (function () {
  "use strict";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function longDate(ymd) {
    var p = String(ymd || "").split("-");
    return p.length === 3 ? (+p[2]) + " " + MONTHS[+p[1] - 1] + " " + p[0] : ymd;
  }

  /* The letter: letterhead, reference, addressee, subject, body, signature. */
  function html(d) {
    var sch = d.school || {};
    var blocks = (d.blocks || []).map(function (b) {
      if (b.t === "p") return "<p>" + esc(b.text) + "</p>";
      if (b.t === "list") return "<ul>" + b.items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
      if (b.t === "table") return "<table><thead><tr>" + b.head.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        b.rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
      return "";
    }).join("");
    return "<div class='lt-head'><h1>" + esc(sch.name || "") + "</h1>" + (sch.address ? "<p>" + esc(sch.address) + "</p>" : "") + (sch.contact ? "<p>" + esc(sch.contact) + "</p>" : "") + "</div>" +
      "<div class='lt-ref'><span>Ref: <b>" + esc(d.refNo) + "</b></span><span>" + esc((sch.place ? sch.place + ", " : "") + longDate(d.date)) + "</span></div>" +
      "<div class='lt-to'>" + (d.to || []).map(function (l) { return "<div>" + esc(l) + "</div>"; }).join("") + "</div>" +
      "<p class='lt-sub'><b>Subject: " + esc(d.subject) + "</b></p><p>" + esc(d.salutation) + "</p>" + blocks +
      "<div class='lt-close'>" + (d.closing || []).map(function (l, i) { return "<div" + (i === 1 ? " class='lt-sign'" : "") + ">" + esc(l) + "</div>"; }).join("") + "</div>";
  }

  /* What a printed page needs; the screens style the same class names themselves. */
  var PRINT_CSS = "<style>body{font-family:Georgia,'Times New Roman',serif;font-size:13.5px;line-height:1.55;color:#111}" +
    ".lt-head{text-align:center;border-bottom:1.5px solid #111;padding-bottom:10px;margin-bottom:18px}.lt-head h1{font-size:22px;margin:0 0 4px;font-weight:600}.lt-head p{margin:0;font-size:12px;color:#444}" +
    ".lt-ref{display:flex;justify-content:space-between;margin-bottom:14px}.lt-to div{margin:0}.lt-sub{margin:16px 0 10px}p{margin:0 0 10px}ul{margin:0 0 10px 20px;padding:0}li{margin:2px 0}" +
    "table{border-collapse:collapse;width:100%;margin:6px 0 12px}th,td{border:1px solid #888;padding:5px 8px;text-align:left;font-size:12.5px}th{background:#f2f2f2}" +
    ".lt-close{margin-top:22px}.lt-sign{margin-top:46px}</style>";

  /* A page of its own, printed. Pop-ups blocked: returns false and the caller says so. */
  function print(d) {
    var page = "<!doctype html><html lang='en'><head><meta charset='utf-8'><title>" + esc(d.subject) + "</title>" + PRINT_CSS +
      "</head><body><div style='max-width:680px;margin:0 auto'>" + html(d) + "</div><script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body></html>";
    var url = URL.createObjectURL(new Blob([page], { type: "text/html" }));
    var w = window.open(url, "_blank");
    setTimeout(function () { URL.revokeObjectURL(url); }, 120000);
    return !!w;
  }

  return { html: html, print: print, PRINT_CSS: PRINT_CSS, longDate: longDate };
})();
