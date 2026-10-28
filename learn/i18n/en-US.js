/* ==========================================================================
   English (United States) — only the words that differ for a US school. It is
   consulted before the language pack when the school's country is US, and
   everything it does not mention falls through to en-IN. Dates, money and
   numbers are not here: OL.fmt writes those from the school's profile.
   ========================================================================== */
(function () {
  "use strict";
  window.OL = window.OL || {};
  OL.i18n.add("en-US", {
    term: {
      class: "Grade", classes: "Grades", section: "Homeroom", sections: "Homerooms",
      admission_no: "Student ID", roll_no: "Seat no.", academic_year: "School year",
      principal: "Principal", guardian: "Parent or guardian", house: "House", term: "Semester"
    },
    classpicker: {
      n_sections: "{n, plural, one {# homeroom} other {# homerooms}}",
      n_selected: "{n, plural, one {# homeroom selected} other {# homerooms selected}}",
      none: "No grade or homeroom matches",
      placeholder: "Choose grades and homerooms",
      search: "Search, for example 9-",
      stage: { pre_primary: "Pre-K", primary: "Elementary", middle: "Middle school", secondary: "Grades 9–10", senior_secondary: "Grades 11–12" }
    },
    people: { paste: "Paste student IDs", paste_label: "Student IDs", placeholder: { student: "Search by name, student ID or phone" } }
  });
})();
