/* ==========================================================================
   Oplo Learn — the icon set.

   One set, outline, 1.5 px stroke, on a 24 px grid, drawn at 16, 20 or 24.
   They are written once into a hidden SVG sprite and used by reference, so a
   screen with two hundred icons carries each shape once. No emoji in the UI.

   OL.icon("search", 16) → <svg class="ol-icon"><use href="#ol-i-search"/></svg>
   Icons are decorative (aria-hidden); a button that has only an icon gets its
   name from aria-label, which the button component insists on.
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL = window.OL || {};

  var P = function (d) { return '<path d="' + d + '"/>'; };
  var C = function (x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '"/>'; };
  var R = function (x, y, w, h, r) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r || 0) + '"/>'; };

  var SET = {
    "chevron-down": P("m6 9 6 6 6-6"),
    "chevron-up": P("m18 15-6-6-6 6"),
    "chevron-left": P("m15 18-6-6 6-6"),
    "chevron-right": P("m9 18 6-6-6-6"),
    "chevrons-left": P("m11 17-5-5 5-5") + P("m18 17-5-5 5-5"),
    "x": P("M18 6 6 18") + P("m6 6 12 12"),
    "check": P("M20 6 9 17l-5-5"),
    "plus": P("M5 12h14") + P("M12 5v14"),
    "minus": P("M5 12h14"),
    "search": C(11, 11, 8) + P("m21 21-4.3-4.3"),
    "more": C(12, 12, 1) + C(19, 12, 1) + C(5, 12, 1),
    "arrow-left": P("m12 19-7-7 7-7") + P("M19 12H5"),
    "arrow-right": P("M5 12h14") + P("m12 5 7 7-7 7"),
    "arrow-up": P("m5 12 7-7 7 7") + P("M12 19V5"),
    "arrow-down": P("M12 5v14") + P("m19 12-7 7-7-7"),
    "sort": P("m7 15 5 5 5-5") + P("m7 9 5-5 5 5"),
    "info": C(12, 12, 10) + P("M12 16v-4") + P("M12 8h.01"),
    "alert-circle": C(12, 12, 10) + P("M12 8v4") + P("M12 16h.01"),
    "alert-triangle": P("m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3") + P("M12 9v4") + P("M12 17h.01"),
    "check-circle": C(12, 12, 10) + P("m9 12 2 2 4-4"),
    "x-circle": C(12, 12, 10) + P("m15 9-6 6") + P("m9 9 6 6"),
    "circle": C(12, 12, 10),
    "dot": C(12, 12, 4),
    "minus-circle": C(12, 12, 10) + P("M8 12h8"),
    "clock": C(12, 12, 10) + P("M12 6v6l4 2"),
    "calendar": R(3, 4, 18, 18, 2) + P("M16 2v4") + P("M8 2v4") + P("M3 10h18"),
    "calendar-check": R(3, 4, 18, 18, 2) + P("M16 2v4") + P("M8 2v4") + P("M3 10h18") + P("m9 16 2 2 4-4"),
    "user": P("M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2") + C(12, 7, 4),
    "users": P("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2") + C(9, 7, 4) + P("M22 21v-2a4 4 0 0 0-3-3.87") + P("M16 3.13a4 4 0 0 1 0 7.75"),
    "school": P("m4 6 8-4 8 4") + P("m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2") + P("M14 22v-4a2 2 0 0 0-4 0v4") + P("M18 5v17") + P("M6 5v17") + C(12, 9, 2),
    "graduation": P("M22 10 12 5 2 10l10 5z") + P("M6 12v5c3 3 9 3 12 0v-5") + P("M22 10v6"),
    "book": P("M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z") + P("M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"),
    "clipboard-check": R(8, 2, 8, 4, 1) + P("M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2") + P("m9 14 2 2 4-4"),
    "file": P("M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z") + P("M14 2v4a2 2 0 0 0 2 2h4"),
    "file-text": P("M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z") + P("M14 2v4a2 2 0 0 0 2 2h4") + P("M10 9H8") + P("M16 13H8") + P("M16 17H8"),
    "folder": P("M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"),
    "heart-pulse": P("M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z") + P("M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"),
    "megaphone": P("m3 11 18-5v12L3 14v-3z") + P("M11.6 16.8a3 3 0 1 1-5.8-1.6"),
    "mail": R(2, 4, 20, 16, 2) + P("m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"),
    "message": P("M7.9 20A9 9 0 1 0 4 16.1L2 22z"),
    "building": P("M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18z") + P("M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2") + P("M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2") + P("M10 6h4") + P("M10 10h4") + P("M10 14h4") + P("M10 18h4"),
    "bar-chart": P("M3 3v18h18") + P("M18 17V9") + P("M13 17V5") + P("M8 17v-3"),
    "settings": P("M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z") + C(12, 12, 3),
    "bell": P("M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9") + P("M10.3 21a1.94 1.94 0 0 0 3.4 0"),
    "help": C(12, 12, 10) + P("M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3") + P("M12 17h.01"),
    "filter": P("M22 3H2l8 9.46V19l4 2v-8.54z"),
    "sliders": P("M21 4h-7") + P("M10 4H3") + P("M21 12h-9") + P("M8 12H3") + P("M21 20h-5") + P("M12 20H3") + P("M14 2v4") + P("M8 10v4") + P("M16 18v4"),
    "download": P("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4") + P("m7 10 5 5 5-5") + P("M12 15V3"),
    "upload": P("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4") + P("m17 8-5-5-5 5") + P("M12 3v12"),
    "printer": P("M6 9V2h12v7") + P("M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2") + R(6, 14, 12, 8),
    "pencil": P("M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z") + P("m15 5 4 4"),
    "trash": P("M3 6h18") + P("M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6") + P("M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2") + P("M10 11v6") + P("M14 11v6"),
    "eye": P("M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z") + C(12, 12, 3),
    "panel-left": R(3, 3, 18, 18, 2) + P("M9 3v18"),
    "menu": P("M4 12h16") + P("M4 6h16") + P("M4 18h16"),
    "log-out": P("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4") + P("m16 17 5-5-5-5") + P("M21 12H9"),
    "sun": C(12, 12, 4) + P("M12 2v2") + P("M12 20v2") + P("m4.93 4.93 1.41 1.41") + P("m17.66 17.66 1.41 1.41") + P("M2 12h2") + P("M20 12h2") + P("m6.34 17.66-1.41 1.41") + P("m19.07 4.93-1.41 1.41"),
    "moon": P("M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"),
    "contrast": C(12, 12, 10) + P("M12 18a6 6 0 0 0 0-12v12z"),
    "languages": P("m5 8 6 6") + P("m4 14 6-6 2-3") + P("M2 5h12") + P("M7 2h1") + P("m22 22-5-10-5 10") + P("M14 18h6"),
    "keyboard": R(2, 4, 20, 16, 2) + P("M6 8h.01") + P("M10 8h.01") + P("M14 8h.01") + P("M18 8h.01") + P("M8 12h.01") + P("M12 12h.01") + P("M16 12h.01") + P("M7 16h10"),
    "phone": P("M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"),
    "bolt": P("M13 2 3 14h9l-1 8 10-12h-9z"),
    "lock": R(3, 11, 18, 11, 2) + P("M7 11V7a5 5 0 0 1 10 0v4"),
    "link": P("M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71") + P("M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"),
    "external": P("M15 3h6v6") + P("M10 14 21 3") + P("M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"),
    "undo": P("M9 14 4 9l5-5") + P("M4 9h10.5a5.5 5.5 0 0 1 0 11H11"),
    "refresh": P("M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8") + P("M21 3v5h-5") + P("M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16") + P("M8 16H3v5"),
    "dashboard": R(3, 3, 7, 9, 1) + R(14, 3, 7, 5, 1) + R(14, 12, 7, 9, 1) + R(3, 16, 7, 5, 1),
    "bus": P("M8 6v6") + P("M15 6v6") + P("M2 12h19.6") + P("M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3") + C(7, 18, 2) + P("M9 18h5") + C(16, 18, 2),
    "library": P("m16 6 4 14") + P("M12 6v14") + P("M8 8v12") + P("M4 4v16"),
    "wrench": P("M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"),
    "shield": P("M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z") + P("m9 12 2 2 4-4"),
    "list": P("M8 6h13") + P("M8 12h13") + P("M8 18h13") + P("M3 6h.01") + P("M3 12h.01") + P("M3 18h.01"),
    "columns": R(3, 3, 18, 18, 2) + P("M9 3v18") + P("M15 3v18"),
    "rows": R(3, 3, 18, 18, 2) + P("M3 9h18") + P("M3 15h18"),
    "home": P("m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z") + P("M9 22V12h6v10"),
    "target": C(12, 12, 10) + C(12, 12, 6) + C(12, 12, 2),
    "wallet": P("M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1") + P("M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"),
    "star": P("M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"),
    "image": R(3, 3, 18, 18, 2) + C(9, 9, 2) + P("m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"),
    "camera": P("M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z") + C(12, 13, 3),
    "paperclip": P("m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"),
    "send": P("m22 2-7 20-4-9-9-4z") + P("M22 2 11 13"),
    "whatsapp": P("M3 21l1.65-4.8A9 9 0 1 1 8 19.4z") + P("M9 10a1 1 0 0 0 1 1 4 4 0 0 0 3 3 1 1 0 0 0 1-1v-.5a.5.5 0 0 0-.4-.5l-1.2-.4a.5.5 0 0 0-.6.2l-.3.4a3 3 0 0 1-1.7-1.7l.4-.3a.5.5 0 0 0 .2-.6L10.1 8a.5.5 0 0 0-.5-.4H9"),
    "map-pin": P("M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z") + C(12, 10, 3),
    "copy": R(8, 8, 14, 14, 2) + P("M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"),
    "grip": C(9, 6, 1) + C(9, 12, 1) + C(9, 18, 1) + C(15, 6, 1) + C(15, 12, 1) + C(15, 18, 1),
    "type": P("M4 7V4h16v3") + P("M9 20h6") + P("M12 4v16"),
    "flag": P("M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z") + P("M4 22v-7"),
    "check-square": P("m9 11 3 3L22 4") + P("M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"),
    "tag": P("M12.59 2.59a2 2 0 0 0-1.42-.59H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l9.41 9.41a2 2 0 0 0 2.82 0l7.17-7.17a2 2 0 0 0 0-2.82z") + P("M7 7h.01"),
    "key": P("m21 2-9.6 9.6") + P("m15.5 7.5 3 3L22 7l-3-3") + C(7.5, 15.5, 5.5)
  };

  var NS = "http://www.w3.org/2000/svg";
  OL.icons = SET;

  /* The sprite goes in once, as soon as there is a body to put it in. */
  function sprite() {
    if (document.getElementById("ol-sprite")) return;
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("id", "ol-sprite");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("class", "ol-sprite");
    svg.innerHTML = Object.keys(SET).map(function (k) {
      return '<symbol id="ol-i-' + k + '" viewBox="0 0 24 24">' + SET[k] + "</symbol>";
    }).join("");
    document.body.insertBefore(svg, document.body.firstChild);
  }
  if (document.body) sprite();
  else document.addEventListener("DOMContentLoaded", sprite);

  OL.icon = function (name, size) {
    var s = size || 16;
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "ol-icon");
    svg.setAttribute("width", s);
    svg.setAttribute("height", s);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var use = document.createElementNS(NS, "use");
    use.setAttribute("href", "#ol-i-" + (SET[name] ? name : "circle"));
    svg.appendChild(use);
    return svg;
  };
})();
