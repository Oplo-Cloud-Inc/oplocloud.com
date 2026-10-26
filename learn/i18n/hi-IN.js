/* ==========================================================================
   हिन्दी — the first set: the words every screen shares (buttons, statuses,
   pickers, dates, tables). A key not translated here shows its English, so a
   screen is never blank while the rest of the pack is written module by module.
   Plain, spoken Hindi; the school's own terms (कक्षा, अनुभाग, प्रवेश क्रमांक)
   are the ones an Indian school already uses.
   ========================================================================== */
(function () {
  "use strict";
  window.OL = window.OL || {};
  OL.i18n.add("hi-IN", {
    term: {
      class: "कक्षा", classes: "कक्षाएँ", section: "अनुभाग", sections: "अनुभाग",
      admission_no: "प्रवेश क्रमांक", roll_no: "अनुक्रमांक", academic_year: "शैक्षणिक वर्ष",
      principal: "प्रधानाचार्य", guardian: "अभिभावक", house: "हाउस", term: "सत्र"
    },
    common: {
      add: "जोड़ें", all: "सभी", apply: "लागू करें", back: "वापस", cancel: "रद्द करें", clear: "साफ़ करें", clear_filters: "फ़िल्टर हटाएँ",
      close: "बंद करें", confirm: "पुष्टि करें", delete: "हटाएँ", dismiss: "बंद करें", done: "हो गया", edit: "संपादित करें",
      load_failed: "यह लोड नहीं हो सका। फिर कोशिश करें।", loading: "लोड हो रहा है…", more: "और", next: "अगला", no: "नहीं",
      none: "तय नहीं", optional: "(वैकल्पिक)", previous: "पिछला", remove_filter: "फ़िल्टर {name} हटाएँ", reset: "रीसेट करें",
      retry: "फिर कोशिश करें", save: "सहेजें", search: "खोजें", undo: "पूर्ववत करें", yes: "हाँ"
    },
    status: {
      draft: "मसौदा", declined: "अस्वीकृत", withdrawn: "वापस लिया", cancelled: "रद्द", not_invited: "आमंत्रित नहीं",
      enquiry: "पूछताछ", empty: "खाली", left: "छोड़ चुके", alumni: "पूर्व छात्र", waived: "माफ़",
      submitted: "जमा किया", invited: "आमंत्रित", applied: "आवेदन किया", allotted: "आवंटित", prepared: "तैयार",
      editing: "संपादन में", scheduled: "निर्धारित",
      approved: "स्वीकृत", issued: "जारी", published: "प्रकाशित", paid: "भुगतान हुआ", present: "उपस्थित", active: "सक्रिय",
      enrolled: "नामांकित", handed_over: "सौंपा गया", complete: "पूर्ण", sent: "भेजा गया", cleared: "चुकता",
      pending: "लंबित", waiting: "प्रतीक्षा में", late: "देर से", leave: "अवकाश", at_risk: "जोखिम में", waiting_list: "प्रतीक्षा सूची",
      on_leave: "छुट्टी पर", partly_paid: "आंशिक भुगतान", no_role: "कोई भूमिका नहीं",
      overdue: "देय तिथि निकली", absent: "अनुपस्थित", failed: "विफल", blocked: "रोका गया", struck_off: "नाम काटा गया",
      mismatch: "मेल नहीं खाता", bounced: "लौटा", below_75: "75% से कम", needs_cover: "विकल्प शिक्षक चाहिए"
    },
    breadcrumb: { label: "पथ" },
    select: {
      all_group: "{group} में सभी चुनें", clear: "चयन हटाएँ", clear_group: "{group} हटाएँ", keep_typing: "{n} और। सूची छोटी करने के लिए टाइप करते रहें।",
      n_selected: "{n} चुने गए", none: "कोई मेल नहीं", placeholder: "चुनें…", search: "खोजें"
    },
    classpicker: {
      all_of: "{name} (सभी {n})", n_sections: "{n} अनुभाग", n_selected: "{n} अनुभाग चुने गए",
      none: "कोई कक्षा या अनुभाग मेल नहीं खाता", placeholder: "कक्षाएँ और अनुभाग चुनें", search: "खोजें, जैसे X-",
      stage: { pre_primary: "पूर्व-प्राथमिक", primary: "प्राथमिक", middle: "उच्च प्राथमिक", secondary: "माध्यमिक", senior_secondary: "वरिष्ठ माध्यमिक" }
    },
    people: {
      add: "लोग जोड़ें", added: "{n} लोग जोड़े गए", chosen: "चुने गए लोग", missing: "{n} नहीं मिले: {list}", n_selected: "{n} लोग",
      none: "कोई मेल नहीं", paste: "प्रवेश क्रमांक चिपकाएँ", paste_empty: "कम से कम एक क्रमांक चिपकाएँ।",
      paste_help: "हर पंक्ति में एक, या अल्पविराम या खाली जगह से अलग।", paste_label: "प्रवेश क्रमांक",
      placeholder: { student: "नाम, प्रवेश क्रमांक या फ़ोन से खोजें", staff: "नाम या फ़ोन से कर्मचारी खोजें", guardian: "नाम या फ़ोन से अभिभावक खोजें" }
    },
    date: {
      choose: "तारीख़ चुनें", choose_month: "महीना चुनें", choose_time: "समय चुनें", from: "से",
      invalid: "तारीख़ {format} में लिखें", invalid_time: "समय ऐसे लिखें: 9:30 am", month_placeholder: "महीना चुनें",
      next_month: "अगला महीना", next_year: "अगला वर्ष", out_of_range: "{min} और {max} के बीच की तारीख़ चुनें",
      presets: "त्वरित अवधि", prev_month: "पिछला महीना", prev_year: "पिछला वर्ष",
      range_order: "अंतिम तारीख़ शुरुआती तारीख़ के बाद या बराबर होनी चाहिए", this_month: "इस महीने", this_week: "इस सप्ताह",
      time: "समय", to: "तक", today: "आज"
    },
    datenav: {
      label: "तारीख़", this_term: "इस सत्र", prev_day: "पिछला दिन", next_day: "अगला दिन", prev_week: "पिछला सप्ताह", next_week: "अगला सप्ताह",
      prev_month: "पिछला महीना", next_month: "अगला महीना", prev_term: "पिछला सत्र", next_term: "अगला सत्र"
    },
    table: {
      actions: "कार्रवाइयाँ", all_selected: "सभी {n} चुने गए", ascending: "आरोही", descending: "अवरोही", clear_selection: "चयन हटाएँ",
      columns: "स्तंभ", empty: "अभी दिखाने के लिए कुछ नहीं", expand: "ब्योरा दिखाएँ", n_selected: "{n} चुने गए", page_n: "पृष्ठ {n}",
      page_of: "पृष्ठ {n} / {total}", pagination: "पृष्ठ क्रम", range: "{total} में से {from}–{to}", resize: "स्तंभ {name} का आकार बदलें",
      row_actions: "पंक्ति की कार्रवाइयाँ", select_all_matching: "सभी {n} चुनें", select_page: "इस पृष्ठ की सभी पंक्तियाँ चुनें",
      select_row: "पंक्ति चुनें", sorted: "{name} के अनुसार क्रमबद्ध, {dir}", total: "कुल"
    },
    grid: {
      shortcuts: "कीबोर्ड शॉर्टकट", not_a_number: "संख्या लिखें", not_saved: "सहेजा नहीं गया। फिर कोशिश होगी।", over_max: "अधिकतम {max} है",
      redone: "फिर से किया", saved: "{time} पर सहेजा गया", saving: "सहेजा जा रहा है…", too_long: "अधिकतम {max} अक्षर",
      under_min: "न्यूनतम {min} है", undone: "पूर्ववत किया", unsaved: "बिना सहेजे बदलाव"
    },
    drawer: {
      discard: "बदलाव छोड़ें", discard_text: "आपके बदलाव सहेजे नहीं गए हैं। अभी बंद करने पर वे खो जाएँगे।", discard_title: "बदलाव छोड़ें?",
      next: "अगला रिकॉर्ड", open_full: "पूरा पृष्ठ खोलें", previous: "पिछला रिकॉर्ड"
    },
    modal: { type_to_confirm: "पुष्टि के लिए {word} लिखें", type_to_enable: "इस बटन को चालू करने के लिए {word} लिखें" }
  });
})();
