/* ==========================================================================
   English (India) — the base pack. It has every key; any other language falls
   back to it, so a string is never blank. Sentence case, verb plus noun on
   buttons, no exclamation marks, no emoji. The words a school uses (Class,
   Section, Admission no.) are in `term` so a US school can say Grade and
   Homeroom without a second set of screens.
   ========================================================================== */
(function () {
  "use strict";
  window.OL = window.OL || {};
  OL.i18n.add("en-IN", {
    term: {
      class: "Class", classes: "Classes", section: "Section", sections: "Sections",
      admission_no: "Admission no.", roll_no: "Roll no.", academic_year: "Academic year",
      principal: "Principal", guardian: "Guardian", house: "House", term: "Term"
    },

    common: {
      add: "Add", all: "All", apply: "Apply", back: "Back", cancel: "Cancel", clear: "Clear", clear_filters: "Clear filters",
      close: "Close", confirm: "Confirm", delete: "Delete", dismiss: "Dismiss", done: "Done", edit: "Edit",
      load_failed: "Could not load this. Try again.", loading: "Loading…", more: "More", next: "Next", no: "No",
      none: "Not set", optional: "(optional)", previous: "Previous", remove_filter: "Remove filter {name}", reset: "Reset",
      retry: "Try again", save: "Save", search: "Search", undo: "Undo", yes: "Yes"
    },

    status: {
      draft: "Draft", declined: "Declined", withdrawn: "Withdrawn", cancelled: "Cancelled", not_invited: "Not invited",
      enquiry: "Enquiry", empty: "Empty", left: "Left", alumni: "Alumni", waived: "Waived",
      submitted: "Submitted", invited: "Invited", applied: "Applied", allotted: "Allotted", prepared: "Prepared",
      editing: "Editing", scheduled: "Scheduled",
      approved: "Approved", issued: "Issued", published: "Published", paid: "Paid", present: "Present", active: "Active",
      enrolled: "Enrolled", handed_over: "Handed over", complete: "Complete", sent: "Sent", cleared: "Cleared",
      pending: "Pending", waiting: "Waiting", late: "Late", leave: "Leave", at_risk: "At risk", waiting_list: "Waiting list",
      on_leave: "On leave", partly_paid: "Partly paid", no_role: "No role",
      overdue: "Overdue", absent: "Absent", failed: "Failed", blocked: "Blocked", struck_off: "Struck off",
      mismatch: "Mismatch", bounced: "Bounced", below_75: "Below 75%", needs_cover: "Needs cover"
    },

    breadcrumb: { label: "Breadcrumb" },

    select: {
      all_group: "Select all in {group}", clear: "Clear selection", clear_group: "Clear {group}", keep_typing: "{n} more. Keep typing to narrow the list.",
      n_selected: "{n} selected", none: "No matches", placeholder: "Select…", search: "Search"
    },

    classpicker: {
      all_of: "{name} (all {n})",
      n_sections: "{n, plural, one {# section} other {# sections}}",
      n_selected: "{n, plural, one {# section selected} other {# sections selected}}",
      none: "No class or section matches",
      placeholder: "Choose classes and sections",
      search: "Search, for example X-",
      stage: { pre_primary: "Pre-primary", primary: "Primary", middle: "Middle", secondary: "Secondary", senior_secondary: "Senior secondary" }
    },

    people: {
      add: "Add people", added: "{n, plural, one {# person added} other {# people added}}", chosen: "Chosen people",
      missing: "{n} not found: {list}", n_selected: "{n, plural, one {# person} other {# people}}", none: "No one matches",
      paste: "Paste admission numbers", paste_empty: "Paste at least one number.", paste_help: "One per line, or separated by commas or spaces.",
      paste_label: "Admission numbers",
      placeholder: { student: "Search by name, admission number or phone", staff: "Search staff by name or phone", guardian: "Search guardians by name or phone" }
    },

    date: {
      choose: "Choose date", choose_month: "Choose month", choose_time: "Choose time", from: "From",
      invalid: "Enter a date as {format}", invalid_time: "Enter a time such as 9:30 am", month_placeholder: "Choose a month",
      next_month: "Next month", next_year: "Next year", out_of_range: "Choose a date between {min} and {max}",
      presets: "Quick ranges", prev_month: "Previous month", prev_year: "Previous year",
      range_order: "The end date must be on or after the start date", this_month: "This month", this_week: "This week",
      time: "Time", to: "To", today: "Today"
    },

    datenav: {
      label: "Date", this_term: "This term",
      prev_day: "Previous day", next_day: "Next day", prev_week: "Previous week", next_week: "Next week",
      prev_month: "Previous month", next_month: "Next month", prev_term: "Previous term", next_term: "Next term"
    },

    table: {
      actions: "Actions", all_selected: "All {n} selected", ascending: "ascending", descending: "descending",
      clear_selection: "Clear selection", columns: "Columns", empty: "Nothing to show yet", expand: "Show details",
      n_selected: "{n} selected", page_n: "Page {n}", page_of: "Page {n} of {total}", pagination: "Pagination",
      range: "{from}–{to} of {total}", resize: "Resize column {name}", row_actions: "Row actions",
      select_all_matching: "Select all {n}", select_page: "Select all rows on this page", select_row: "Select row",
      sorted: "Sorted by {name}, {dir}", total: "Total"
    },

    grid: {
      shortcuts: "Keyboard shortcuts", not_a_number: "Enter a number", not_saved: "Not saved. Will try again.",
      over_max: "The maximum is {max}", redone: "Redone", saved: "Saved {time}", saving: "Saving…",
      too_long: "At most {max} characters", under_min: "The minimum is {min}", undone: "Undone", unsaved: "Unsaved changes",
      k: {
        arrows: "arrows", clear: "Clear the cell", clear_word: "clear", code: "Set {code}", edit: "Edit the cell",
        enter: "Commit and move down", esc: "Cancel the edit", fill: "Fill down", help: "Show this list",
        move: "Move between cells", redo: "Redo", save: "Save now", select: "Extend the selection",
        submit: "Submit the sheet", tab: "Next cell", undo: "Undo"
      }
    },

    drawer: {
      discard: "Discard changes", discard_text: "You have unsaved changes. If you close now they will be lost.",
      discard_title: "Discard changes?", next: "Next record", open_full: "Open full page", previous: "Previous record"
    },

    modal: { type_to_confirm: "Type {word} to confirm", type_to_enable: "Type {word} to enable this button" }
  });
})();
