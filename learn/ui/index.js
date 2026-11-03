/* ==========================================================================
   The component catalogue — which component is which C-number, and where its
   states are listed. The gallery (/admin/_ui) reads this to draw every state of
   every component, and the tests read it to be sure none was left out.

   Components C-23 onward are built in the step that first needs them:
   C-23 command palette with the shell, C-24 stepper with Admissions, C-25 chart
   wrapper with Insights, C-26 phone preview and C-27 file uploader with
   Communicate and the forms, C-28 timeline with the record pages, C-29 print
   layout with certificates and report cards.
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL;
  OL.ui.catalog = [
    { id: "C-01", name: "Button", key: "button" },
    { id: "C-02", name: "Input and textarea", key: "input" },
    { id: "C-03", name: "Select", key: "select" },
    { id: "C-04", name: "Class and section picker", key: "classpicker" },
    { id: "C-05", name: "People picker", key: "people" },
    { id: "C-06", name: "Date and time", key: "date" },
    { id: "C-07", name: "Chips", key: "chips" },
    { id: "C-07", name: "Segmented control", key: "segmented" },
    { id: "C-08", name: "Date navigator", key: "datenav" },
    { id: "C-09", name: "Tabs", key: "tabs" },
    { id: "C-10", name: "Data table", key: "table" },
    { id: "C-11", name: "Grid editor", key: "grid" },
    { id: "C-12", name: "KPI tile", key: "kpi" },
    { id: "C-13", name: "Status pill", key: "pill" },
    { id: "C-14", name: "Card", key: "card" },
    { id: "C-15", name: "Drawer", key: "drawer" },
    { id: "C-16", name: "Modal dialog", key: "modal" },
    { id: "C-17", name: "Toast", key: "toast" },
    { id: "C-18", name: "Banner", key: "banner" },
    { id: "C-19", name: "Empty state", key: "empty" },
    { id: "C-20", name: "Skeleton", key: "skeleton" },
    { id: "C-21", name: "Avatar", key: "avatar" },
    { id: "C-22", name: "Breadcrumb", key: "breadcrumb" },
    { id: "—", name: "Checkbox, radio, switch", key: "check" },
    { id: "—", name: "Menu", key: "menu" }
  ];
  OL.ui.ready = true;
})();
