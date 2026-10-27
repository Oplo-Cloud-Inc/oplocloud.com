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

    modal: { type_to_confirm: "Type {word} to confirm", type_to_enable: "Type {word} to enable this button" },

    /* The menu: eleven modules and Admin (Volume 01 §2.1), each with its tabs, a tab with at most one more row. */
    nav: {
      today: "Today", students: "Students", attendance: "Attendance", academics: "Academics", exams: "Exams", fees: "Fees",
      wellbeing: "Wellbeing", communicate: "Communicate", staff: "Staff", campus: "Campus", insights: "Insights", admin: "Admin"
    },
    tab: {
      today: { overview: "Today" },
      students: {
        directory: "Directory", admissions: "Admissions", classes: "Classes", guardians: "Guardians", health: "Health",
        documents: "Documents", certificates: "Certificates", records: "Records", graduation: "Graduation"
      },
      attendance: { registers: "Registers", watch: "Watchlist", condonation: "Condonation", "by-subject": "By subject", staff: "Staff attendance" },
      academics: {
        timetable: "Timetable", subjects: "Subjects", timings: "Bell timings", calendar: "Calendar", "lesson-plans": "Lesson plans",
        homework: "Homework", competencies: "Competencies", curriculum: "Curriculum", "add-drop": "Add and drop"
      },
      exams: { plan: "Exam plan", mark: "Mark entry", results: "Results", "report-cards": "Report cards", scales: "Grading scales", periods: "Marking periods" },
      wellbeing: {
        "needs-attention": "Needs attention", "early-warning": "Early warning", mentoring: "Mentoring", discipline: "Discipline",
        referrals: "Referrals", "learning-support": "Learning support", accommodations: "Accommodations", detention: "Detention"
      },
      communicate: { inbox: "Inbox", circulars: "Circulars", events: "Events", messages: "Messages", outbox: "Outbox" },
      staff: { directory: "Directory", departments: "Departments", leave: "Leave", cover: "Cover", qualifications: "Qualifications", access: "Access", analytics: "Analytics" },
      campus: { transport: "Transport", library: "Library", equipment: "Equipment", facilities: "Facilities", menus: "Meals", eligibility: "Meal eligibility", lockers: "Lockers" },
      insights: { dashboards: "Dashboards", analytics: "Analytics", reports: "Reports", builder: "Report builder" },
      admin: { settings: "Settings", compliance: "Compliance", data: "Data", security: "Security", "audit-log": "Audit log", "year-end": "Year-end" }
    },
    sub: {
      students: { classes: { sections: "Sections", lists: "Class lists" } },
      academics: { timetable: { published: "Published", draft: "Draft" }, curriculum: { courses: "Courses", map: "Curriculum map" } },
      exams: { mark: { "course-marks": "Course marks", assessments: "Assessments" }, results: { analysis: "Analysis", gpa: "GPA", transcripts: "Transcripts" } },
      campus: { facilities: { orders: "Work orders", spaces: "Spaces", assets: "Assets", routines: "Routines", bookings: "Bookings", vendors: "Vendors", documents: "Documents", reports: "Reports" } },
      insights: { analytics: { academic: "Academic", assessments: "Assessments", growth: "Growth", groups: "Groups", longitudinal: "Longitudinal", standards: "Standards" } },
      admin: { data: { exports: "Exports", imports: "Imports", integrations: "Integrations", api: "API", state: "State reporting", district: "District" } }
    },

    /* The frame around every page: rail, top bar, account menu. */
    shell: {
      menu: "Main menu", console: "School console", collapse_menu: "Collapse the menu", expand_menu: "Expand the menu", top: "Top bar",
      year_label: "Academic year {year}", year_changed: "Academic year {year}",
      notifications: "Notifications", notifications_n: "{n, plural, one {# unread notification} other {# unread notifications}}",
      help: "Help and shortcuts", help_title: "Keyboard shortcuts",
      account_menu: "Account menu for {name}", my_account: "My account",
      appearance: "Appearance", theme: { light: "Light", dark: "Dark", auto: "Match this device", hc: "High contrast" },
      language: "Language", language_changed: "Language changed",
      sign_out: "Sign out", signing_out: "Signing out…",
      k: { search: "Open search", move: "Move between results", open: "Open the selected result", group: "Jump to the next group", close: "Close" }
    },

    /* Search — records first, then pages and actions. */
    search: {
      label: "Search", placeholder: "Search students, staff, classes, pages and actions", placeholder_short: "Search students, staff, classes",
      results: "Search results", recent: "Recent", start: "Type a name, an admission number, a class like X-C or a page.",
      searching: "Searching…", error: "Search is not working right now.", forbidden: "Searching people is for school staff. Pages and actions still work.",
      no_results: "No results for “{q}”", no_results_hint: "Check the spelling, or try an admission number or the end of a phone number.",
      n_results: "{n, plural, =0 {No results} one {# result} other {# results}}",
      hint_move: "to move", hint_open: "to open", hint_group: "next group",
      group: { student: "Students", staff: "Staff", class: "Classes", subject: "Subjects", circular: "Circulars", page: "Pages", action: "Actions" },
      roll: "Roll {n}", apaar: "APAAR …{n}", due: "Due {date}", class_teacher: "Class teacher {name}",
      n_students: "{n, plural, =0 {No students} one {# student} other {# students}}",
      role: { admin: "Administrator", teacher: "Teacher", principal: "Principal", registrar: "Registrar", admissions: "Admissions", facilities: "Facilities", office: "Office" }
    },
    action: {
      take_register: "Take a register", new_circular: "Send a circular", issue_certificate: "Issue a certificate",
      arrange_cover: "Arrange cover", admit_student: "Admit a student", raise_work_order: "Raise a work order"
    },

    /* The parts every page shares (ui/page.js). */
    page: { bulk: "Actions for the selected rows" },

    /* A page that could not be drawn (shell/pages.js). */
    pages: {
      error_title: "This page did not load",
      error_text: "Something went wrong on our side. Try again, and if it keeps happening, quote the reference.",
      error_ref: "Reference {ref}"
    },

    /* Students — the Directory, the quick look, the record and the add and edit form (learn/students). */
    students: {
      add: "Add student", import: "Import from a file", export: "Export list", exporting: "Preparing the file…",
      exported: "{n, plural, one {# student exported} other {# students exported}}", export_failed: "The list could not be exported. Try again.",
      edit: "Edit", quick_look: "Quick look", open_record: "Open record", peek_title: "Student", more_filters: "More filters", chips_label: "Quick filters",
      any: "Any", choose: "Choose", required: "This is required.", save_failed: "Could not save. Try again.", loading: "Loading student…",
      offline: "You are offline. Reconnect and try again.", caption: "Students",
      announce: "{n, plural, =0 {No students match} one {# student} other {# students}}",
      subtitle: "{n, plural, one {# student} other {# students}} in {sections, plural, one {# section} other {# sections}}",
      search: "Search by name, admission number, class or phone", search_label: "Search students",
      class_n: "Class {name}", roll: "Roll {n}", adm: "Adm. {no}", n_to_fix: "{n} to fix",
      denied: "You can't open the Directory",
      denied_text: "Only office staff, class teachers and school leaders can see the Directory. Ask your school admin.",
      none_match: "No students match these filters.", none_match_text: "Try fewer filters, or search for a different name or number.",
      first_title: "No students yet", first_text: "Add the first student, or import your list from a file.",
      not_found: "Student not found", not_found_text: "This student is not in your school, or the link is old.",
      message_family: "Message family", message_sent: "Message sent", issue_certificate: "Issue certificate",
      side_label: "About this student", tabs_label: "Sections of the student record", back_to_record: "Back to record",
      new_title: "Add student", edit_title: "Edit {name}", save_new: "Add student", created: "{name} was added", saved: "Changes saved", no_changes: "Nothing was changed.",
      kpi: {
        label: "Student numbers", students: "Students", in_sections: "{n, plural, one {in # section} other {in # sections}}",
        under75: "Under 75%", under75_ctx: "attendance this year", warning: "Early warning", warning_ctx: "{n} at high risk",
        consent: "Consent pending", consent_ctx: "parental consent not recorded", gaps: "Records to fix", gaps_ctx: "a board list would refuse them"
      },
      chip: { under75: "Under 75%", warning: "Early warning", consent: "Consent pending", gaps: "Records to fix", new: "New this year" },
      status: { enrolled: "Enrolled", left: "Left", all: "All" },
      filter: {
        gender: "Gender", category: "Category", stream: "Stream", transport: "Transport", blood: "Blood group", language: "Family language",
        status: "Status", apaar: "APAAR ID", pen: "PEN", admitted: "Admitted between", cwsn: "Child with special needs"
      },
      token: {
        scope: "Your sections: {sections}", from: "Admitted from {date}", to: "Admitted until {date}", cwsn: "Special needs",
        stream: "Stream: {value}", transport: "Transport: {value}", blood: "Blood group: {value}", language: "Language: {value}",
        status: "Status: {value}", apaar: "APAAR: {value}", pen: "PEN: {value}"
      },
      gender: { M: "Male", F: "Female", O: "Other" },
      apaar: { generated: "Generated", pending: "Pending", refused: "Refused", not_generated: "Not generated" },
      pen: { on_file: "On file", missing: "Missing" },
      col: { name: "Name", attendance: "Attendance", contact: "Main contact", admitted: "Admitted", record: "Record" },
      warn: { high: "High risk", medium: "Watch" },
      level: { high: "High", medium: "Medium", low: "Low", none: "None" },
      consent: { verified: "Verified", pending: "Pending", withdrawn: "Withdrawn" },
      consent_method: { signed_form: "Signed form", digilocker: "DigiLocker", other: "Other" },
      tab: { overview: "Overview", attendance: "Attendance", marks: "Marks", family: "Family", record: "Government records", activity: "Activity" },
      tile: {
        label: "Key numbers", attendance: "Attendance", days_marked: "{n, plural, one {# day marked} other {# days marked}}", not_marked: "No days marked yet",
        warning: "Early warning", warning_ctx: "{n, plural, one {# signal} other {# signals}}", no_reading: "Not enough data yet",
        result: "Latest result", no_result: "No result published yet"
      },
      alert: {
        attendance: "Attendance is {percent}, below the 75% a board asks for.",
        attendance_watch: "Attendance is {percent}. They can miss {n, plural, one {# more day} other {# more days}} before it falls under 75%.",
        consent: "Parental consent is not recorded.", early_high: "The early-warning signals are high.", early_medium: "The early-warning signals need watching.",
        cwsn: "Child with special needs. Check that support is in place."
      },
      fact: {
        dob: "Date of birth", admitted: "Admitted on", class_teacher: "Class teacher", mother_tongue: "Mother tongue", address: "Address",
        apaar: "APAAR ID", pen: "PEN", aadhaar: "Aadhaar", board_roll: "Board roll number", previous_school: "Previous school",
        consent: "Parental consent", cwsn: "Special needs", disability: "Kind of disability", udid: "Disability ID (UDID)", migrant: "Migrant family"
      },
      contact: {
        none: "No family contact on file", none_text: "Add a parent's or guardian's name and mobile number so the school can reach the family.",
        unnamed: "Name not recorded", no_number: "No number on file", primary: "Main contact", show: "Show number",
        show_failed: "Could not show the number. Try again.", call: "Call", whatsapp: "WhatsApp",
        rel: { Father: "Father", Mother: "Mother", Guardian: "Guardian" }
      },
      gaps: { title: "{n, plural, one {# thing to fix} other {# things to fix}}" },
      gap: {
        pen: "Add PEN", dob: "Add date of birth", gender: "Add gender", category: "Add category", apaar: "Add APAAR ID", fatherName: "Add a parent's name",
        consentStatus: "Record parental consent", disability: "Add kind of disability", guardianName: "Add guardian's name"
      },
      side: {
        alerts: "Needs attention", fix: "To fix", guardians: "Guardian accounts", team: "Class", family_open: "Open Guardians",
        family_linked: "{n, plural, one {# guardian account is linked} other {# guardian accounts are linked}}, {active} active.",
        family_none: "No guardian account is linked yet."
      },
      overview: { why: "Why the early warning", about: "About" },
      peek: { about: "About", contacts: "Family" },
      att: {
        none: "No attendance marked yet", none_text: "Attendance appears here once a register is taken for this class.", open: "Open registers",
        marked: "Days marked", present: "Present", leave: "On leave", absent: "Absent", with_leave: "Attendance counting leave",
        can_miss: "Days they can still miss", must_attend: "Days they must attend"
      },
      marks: {
        none: "No result yet", none_text: "Marks appear here once an exam is published.", open: "Open results", exam: "Latest exam",
        pass_line: "Pass mark", state: "Result", pass: "Pass", below: "Below pass mark"
      },
      activity: {
        none: "Nothing has changed yet", none_text: "Changes, exports and numbers shown are listed here with who did them.",
        denied: "You can't see this log", denied_text: "The activity log is for school administrators and the principal.", system: "System",
        verb: {
          created: "added {field}", changed: "changed {field}", deleted: "removed {field}", published: "published {field}", exported: "exported {field}",
          revealed: "showed {field}", signed_in: "signed in", sign_in_failed: "failed to sign in", role_changed: "changed the role of {field}", restored: "restored {field}"
        },
        event: {
          created: "added this student", changed: "changed this record", deleted: "removed this record", published: "published this record",
          exported: "exported the list", revealed: "showed a number", signed_in: "signed in", sign_in_failed: "failed to sign in",
          role_changed: "changed a role", restored: "restored this record"
        }
      },
      bulk: {
        message: "Message families", house: "Set house", house_help: "Leave blank to clear the house.",
        house_go: "{n, plural, one {Set house for # student} other {Set house for # students}}",
        house_done: "{n, plural, =0 {No house changed: they already had it} one {House set for # student} other {House set for # students}}",
        message_title: "{n, plural, one {Message the family of # student} other {Message the families of # students}}",
        subject: "Subject", text: "Message", send: "Send message", word: "SEND",
        sent: "Sent to {students, plural, one {# student} other {# students}} and {families, plural, one {# guardian} other {# guardians}}"
      },
      section: { student: "Student", records: "Government records", family: "Family", care: "Care and support", consent: "Parental consent" },
      field: {
        name: "Full name", email: "Email", dob: "Date of birth", gender: "Gender", classId: "Class and section", rollNo: "Roll number",
        admissionNo: "Admission number", admittedOn: "Admitted on", category: "Category", house: "House", bloodGroup: "Blood group",
        motherTongue: "Mother tongue", secondLanguage: "Second language", transport: "Transport", address: "Address",
        apaar: "APAAR ID", pen: "PEN", aadhaar: "Aadhaar", boardRollNo: "Board roll number", previousSchool: "Previous school",
        fatherName: "Father's name", fatherPhone: "Father's mobile", motherName: "Mother's name", motherPhone: "Mother's mobile",
        primaryContact: "Main contact", language: "Family's language", guardianName: "Guardian's name", guardianRelation: "Guardian's relation",
        guardianPhone: "Guardian's mobile", guardianEmail: "Family email", whatsapp: "Use WhatsApp", cwsn: "Child with special needs",
        disability: "Kind of disability", udid: "Disability ID (UDID)", migrant: "Migrant family", consentStatus: "Parental consent",
        consentMethod: "Consent given by", consentOn: "Consent date", consentNote: "Consent note", pin: "PIN code", district: "District", state: "State"
      },
      help: {
        apaar: "12 digits, or write REFUSED or NOGEN.", pen: "11 digits.", aadhaar: "12 digits. Only the last four are kept.",
        aadhaar_set: "On file, ending {last4}. Type a new number to replace it.",
        fatherPhone: "A 10-digit mobile number, with or without +91.", motherPhone: "A 10-digit mobile number, with or without +91.",
        guardianPhone: "A 10-digit mobile number, with or without +91."
      },
      error: { name: "Enter the student's full name.", email: "Enter a valid email address." }
    }
  });
})();
