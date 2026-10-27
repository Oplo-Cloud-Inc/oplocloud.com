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
    modal: { type_to_confirm: "पुष्टि के लिए {word} लिखें", type_to_enable: "इस बटन को चालू करने के लिए {word} लिखें" },
    nav: {
      today: "आज", students: "विद्यार्थी", attendance: "उपस्थिति", academics: "शैक्षणिक", exams: "परीक्षाएँ", fees: "शुल्क",
      wellbeing: "कल्याण", communicate: "संवाद", staff: "कर्मचारी", campus: "परिसर", insights: "विश्लेषण", admin: "प्रशासन"
    },
    tab: {
      today: { overview: "आज" },
      students: {
        directory: "निर्देशिका", admissions: "प्रवेश", classes: "कक्षाएँ", guardians: "अभिभावक", health: "स्वास्थ्य",
        documents: "दस्तावेज़", certificates: "प्रमाणपत्र", records: "अभिलेख", graduation: "उत्तीर्णता"
      },
      attendance: { registers: "रजिस्टर", watch: "निगरानी सूची", condonation: "उपस्थिति में छूट", "by-subject": "विषयवार", staff: "कर्मचारी उपस्थिति" },
      academics: {
        timetable: "समय-सारणी", subjects: "विषय", timings: "घंटी का समय", calendar: "कैलेंडर", "lesson-plans": "पाठ योजनाएँ",
        homework: "गृहकार्य", competencies: "दक्षताएँ", curriculum: "पाठ्यक्रम", "add-drop": "जोड़ें और हटाएँ"
      },
      exams: { plan: "परीक्षा योजना", mark: "अंक प्रविष्टि", results: "परिणाम", "report-cards": "रिपोर्ट कार्ड", scales: "ग्रेडिंग पैमाने", periods: "अंकन अवधियाँ" },
      wellbeing: {
        "needs-attention": "ध्यान चाहिए", "early-warning": "पूर्व चेतावनी", mentoring: "मार्गदर्शन", discipline: "अनुशासन",
        referrals: "संदर्भ", "learning-support": "सीखने में सहायता", accommodations: "सुविधाएँ", detention: "रोक"
      },
      communicate: { inbox: "इनबॉक्स", circulars: "परिपत्र", events: "कार्यक्रम", messages: "संदेश", outbox: "भेजे गए" },
      staff: { directory: "निर्देशिका", departments: "विभाग", leave: "अवकाश", cover: "स्थानापन्न", qualifications: "योग्यताएँ", access: "पहुँच", analytics: "विश्लेषण" },
      campus: { transport: "परिवहन", library: "पुस्तकालय", equipment: "उपकरण", facilities: "सुविधाएँ", menus: "भोजन", eligibility: "भोजन पात्रता", lockers: "लॉकर" },
      insights: { dashboards: "डैशबोर्ड", analytics: "विश्लेषण", reports: "रिपोर्ट", builder: "रिपोर्ट निर्माता" },
      admin: { settings: "सेटिंग", compliance: "अनुपालन", data: "डेटा", security: "सुरक्षा", "audit-log": "ऑडिट लॉग", "year-end": "वर्षांत" }
    },
    shell: {
      menu: "मुख्य मेनू", console: "विद्यालय कंसोल", collapse_menu: "मेनू छोटा करें", expand_menu: "मेनू बड़ा करें", top: "ऊपरी पट्टी",
      year_label: "शैक्षणिक वर्ष {year}", year_changed: "शैक्षणिक वर्ष {year}",
      notifications: "सूचनाएँ", notifications_n: "{n, plural, one {# अपठित सूचना} other {# अपठित सूचनाएँ}}",
      help: "सहायता और शॉर्टकट", help_title: "कीबोर्ड शॉर्टकट",
      account_menu: "{name} का खाता मेनू", my_account: "मेरा खाता",
      appearance: "रूप", theme: { light: "हल्का", dark: "गहरा", auto: "उपकरण के अनुसार", hc: "उच्च कंट्रास्ट" },
      language: "भाषा", language_changed: "भाषा बदली गई",
      sign_out: "साइन आउट", signing_out: "साइन आउट हो रहा है…",
      k: { search: "खोज खोलें", move: "परिणामों के बीच जाएँ", open: "चुना हुआ परिणाम खोलें", group: "अगले समूह पर जाएँ", close: "बंद करें" }
    },
    search: {
      label: "खोज", placeholder: "विद्यार्थी, कर्मचारी, कक्षाएँ, पृष्ठ और कार्य खोजें", placeholder_short: "विद्यार्थी, कर्मचारी, कक्षाएँ खोजें",
      results: "खोज परिणाम", recent: "हाल के", start: "नाम, प्रवेश क्रमांक, X-C जैसी कक्षा या कोई पृष्ठ लिखें।",
      searching: "खोज रहे हैं…", error: "खोज अभी काम नहीं कर रही।", forbidden: "लोगों को खोजना केवल विद्यालय कर्मचारियों के लिए है। पृष्ठ और कार्य अब भी काम करते हैं।",
      no_results: "“{q}” के लिए कोई परिणाम नहीं", no_results_hint: "वर्तनी जाँचें, या प्रवेश क्रमांक अथवा फ़ोन नंबर के अंतिम अंक आज़माएँ।",
      n_results: "{n, plural, =0 {कोई परिणाम नहीं} one {# परिणाम} other {# परिणाम}}",
      hint_move: "चलने के लिए", hint_open: "खोलने के लिए", hint_group: "अगला समूह",
      group: { student: "विद्यार्थी", staff: "कर्मचारी", class: "कक्षाएँ", subject: "विषय", circular: "परिपत्र", page: "पृष्ठ", action: "कार्य" },
      roll: "अनुक्रमांक {n}", due: "देय {date}", class_teacher: "कक्षा शिक्षक {name}",
      n_students: "{n, plural, =0 {कोई विद्यार्थी नहीं} one {# विद्यार्थी} other {# विद्यार्थी}}",
      role: { admin: "प्रशासक", teacher: "शिक्षक", principal: "प्रधानाचार्य", registrar: "पंजीयक", admissions: "प्रवेश", facilities: "सुविधाएँ", office: "कार्यालय" }
    },
    action: {
      take_register: "रजिस्टर भरें", new_circular: "परिपत्र भेजें", issue_certificate: "प्रमाणपत्र जारी करें",
      arrange_cover: "स्थानापन्न तय करें", admit_student: "विद्यार्थी का प्रवेश करें", raise_work_order: "कार्य आदेश बनाएँ"
    },

    /* हर पृष्ठ के साझा हिस्से (ui/page.js)। */
    page: { bulk: "चुनी गई पंक्तियों के लिए कार्य" },

    /* जो पृष्ठ बन नहीं सका (shell/pages.js)। */
    pages: {
      error_title: "यह पृष्ठ लोड नहीं हुआ",
      error_text: "हमारी ओर से कुछ गड़बड़ हो गई। फिर कोशिश करें, और बार-बार हो तो संदर्भ नंबर बताएँ।",
      error_ref: "संदर्भ {ref}"
    },

    /* विद्यार्थी — निर्देशिका, झलक, रिकॉर्ड और जोड़ने-संपादित करने का फ़ॉर्म (learn/students)। */
    students: {
      add: "विद्यार्थी जोड़ें", import: "फ़ाइल से आयात करें", export: "सूची निर्यात करें", exporting: "फ़ाइल तैयार हो रही है…",
      exported: "{n, plural, one {# विद्यार्थी निर्यात हुआ} other {# विद्यार्थी निर्यात हुए}}", export_failed: "सूची निर्यात नहीं हो सकी। फिर कोशिश करें।",
      edit: "संपादित करें", quick_look: "झलक", open_record: "पूरा रिकॉर्ड खोलें", peek_title: "विद्यार्थी", more_filters: "और फ़िल्टर", chips_label: "त्वरित फ़िल्टर",
      any: "कोई भी", choose: "चुनें", required: "यह ज़रूरी है।", save_failed: "सहेजा नहीं जा सका। फिर कोशिश करें।", loading: "विद्यार्थी लोड हो रहा है…",
      offline: "आप ऑफ़लाइन हैं। फिर से जुड़कर कोशिश करें।", caption: "विद्यार्थी",
      announce: "{n, plural, =0 {कोई विद्यार्थी नहीं मिला} one {# विद्यार्थी} other {# विद्यार्थी}}",
      subtitle: "{sections, plural, one {# अनुभाग} other {# अनुभागों}} में {n, plural, one {# विद्यार्थी} other {# विद्यार्थी}}",
      search: "नाम, प्रवेश क्रमांक, कक्षा या फ़ोन से खोजें", search_label: "विद्यार्थी खोजें",
      class_n: "कक्षा {name}", roll: "अनुक्रमांक {n}", adm: "प्रवेश क्र. {no}", n_to_fix: "{n} सुधारने हैं",
      denied: "आप निर्देशिका नहीं खोल सकते",
      denied_text: "निर्देशिका केवल कार्यालय के कर्मचारी, कक्षा शिक्षक और विद्यालय के प्रमुख देख सकते हैं। अपने विद्यालय के प्रशासक से पूछें।",
      none_match: "इन फ़िल्टरों से कोई विद्यार्थी नहीं मिला।", none_match_text: "फ़िल्टर कम करें, या कोई और नाम या नंबर खोजें।",
      first_title: "अभी कोई विद्यार्थी नहीं", first_text: "पहला विद्यार्थी जोड़ें, या फ़ाइल से अपनी सूची आयात करें।",
      not_found: "विद्यार्थी नहीं मिला", not_found_text: "यह विद्यार्थी आपके विद्यालय में नहीं है, या लिंक पुराना है।",
      message_family: "परिवार को संदेश भेजें", message_sent: "संदेश भेज दिया गया", issue_certificate: "प्रमाणपत्र जारी करें",
      side_label: "इस विद्यार्थी के बारे में", tabs_label: "विद्यार्थी रिकॉर्ड के भाग", back_to_record: "रिकॉर्ड पर वापस",
      new_title: "विद्यार्थी जोड़ें", edit_title: "{name} को संपादित करें", save_new: "विद्यार्थी जोड़ें", created: "{name} को जोड़ा गया", saved: "बदलाव सहेजे गए", no_changes: "कुछ बदला नहीं गया।",
      kpi: {
        label: "विद्यार्थी संख्याएँ", students: "विद्यार्थी", in_sections: "{n, plural, one {# अनुभाग में} other {# अनुभागों में}}",
        under75: "75% से कम", under75_ctx: "इस वर्ष की उपस्थिति", warning: "पूर्व चेतावनी", warning_ctx: "{n} अधिक जोखिम में",
        consent: "सहमति लंबित", consent_ctx: "अभिभावक की सहमति दर्ज नहीं", gaps: "सुधारने योग्य रिकॉर्ड", gaps_ctx: "बोर्ड की सूची इन्हें स्वीकार नहीं करेगी"
      },
      chip: { under75: "75% से कम", warning: "पूर्व चेतावनी", consent: "सहमति लंबित", gaps: "सुधारने योग्य रिकॉर्ड", new: "इस वर्ष के नए" },
      status: { enrolled: "नामांकित", left: "छोड़ चुके", all: "सभी" },
      filter: {
        gender: "लिंग", category: "श्रेणी", stream: "संकाय", transport: "परिवहन", blood: "रक्त समूह", language: "परिवार की भाषा",
        status: "स्थिति", apaar: "APAAR आईडी", pen: "PEN संख्या", admitted: "प्रवेश की अवधि", cwsn: "विशेष आवश्यकता वाला बच्चा"
      },
      token: {
        scope: "आपके अनुभाग: {sections}", from: "प्रवेश {date} से", to: "प्रवेश {date} तक", cwsn: "विशेष आवश्यकता",
        stream: "संकाय: {value}", transport: "परिवहन: {value}", blood: "रक्त समूह: {value}", language: "भाषा: {value}",
        status: "स्थिति: {value}", apaar: "APAAR आईडी: {value}", pen: "PEN संख्या: {value}"
      },
      gender: { M: "लड़का", F: "लड़की", O: "अन्य" },
      apaar: { generated: "बन चुकी", pending: "लंबित", refused: "अस्वीकृत", not_generated: "नहीं बनी" },
      pen: { on_file: "दर्ज है", missing: "दर्ज नहीं" },
      col: { name: "नाम", attendance: "उपस्थिति", contact: "मुख्य संपर्क", admitted: "प्रवेश", record: "रिकॉर्ड" },
      warn: { high: "अधिक जोखिम", medium: "ध्यान दें" },
      level: { high: "अधिक", medium: "मध्यम", low: "कम", none: "कोई नहीं" },
      consent: { verified: "सत्यापित", pending: "लंबित", withdrawn: "वापस ली गई" },
      consent_method: { signed_form: "हस्ताक्षरित फ़ॉर्म", digilocker: "डिजिलॉकर", other: "अन्य" },
      tab: { overview: "अवलोकन", attendance: "उपस्थिति", marks: "अंक", family: "परिवार", record: "सरकारी रिकॉर्ड", activity: "गतिविधि" },
      tile: {
        label: "मुख्य संख्याएँ", attendance: "उपस्थिति", days_marked: "{n, plural, one {# दिन दर्ज} other {# दिन दर्ज}}", not_marked: "अभी कोई दिन दर्ज नहीं",
        warning: "पूर्व चेतावनी", warning_ctx: "{n, plural, one {# संकेत} other {# संकेत}}", no_reading: "अभी पर्याप्त आँकड़े नहीं",
        result: "नवीनतम परिणाम", no_result: "अभी कोई परिणाम प्रकाशित नहीं"
      },
      alert: {
        attendance: "उपस्थिति {percent} है, जो बोर्ड की 75% की सीमा से कम है।",
        attendance_watch: "उपस्थिति {percent} है। 75% से नीचे जाने से पहले वे {n, plural, one {# दिन और} other {# दिन और}} अनुपस्थित रह सकते हैं।",
        consent: "अभिभावक की सहमति दर्ज नहीं है।", early_high: "पूर्व चेतावनी के संकेत अधिक हैं।", early_medium: "पूर्व चेतावनी के संकेतों पर नज़र रखें।",
        cwsn: "विशेष आवश्यकता वाला बच्चा। जाँचें कि सहायता की व्यवस्था है।"
      },
      fact: {
        dob: "जन्म तिथि", admitted: "प्रवेश की तिथि", class_teacher: "कक्षा शिक्षक", mother_tongue: "मातृभाषा", address: "पता",
        apaar: "APAAR आईडी", pen: "PEN संख्या", aadhaar: "आधार", board_roll: "बोर्ड अनुक्रमांक", previous_school: "पिछला विद्यालय",
        consent: "अभिभावक की सहमति", cwsn: "विशेष आवश्यकता", disability: "दिव्यांगता का प्रकार", udid: "दिव्यांगता आईडी (UDID)", migrant: "प्रवासी परिवार"
      },
      contact: {
        none: "परिवार का कोई संपर्क दर्ज नहीं", none_text: "अभिभावक का नाम और मोबाइल नंबर जोड़ें, ताकि विद्यालय परिवार से संपर्क कर सके।",
        unnamed: "नाम दर्ज नहीं", no_number: "कोई नंबर दर्ज नहीं", primary: "मुख्य संपर्क", show: "नंबर दिखाएँ",
        show_failed: "नंबर नहीं दिखाया जा सका। फिर कोशिश करें।", call: "कॉल करें", whatsapp: "व्हाट्सऐप",
        rel: { Father: "पिता", Mother: "माता", Guardian: "अभिभावक" }
      },
      gaps: { title: "{n, plural, one {# बात सुधारनी है} other {# बातें सुधारनी हैं}}" },
      gap: {
        pen: "PEN जोड़ें", dob: "जन्म तिथि जोड़ें", gender: "लिंग जोड़ें", category: "श्रेणी जोड़ें", apaar: "APAAR आईडी जोड़ें", fatherName: "माता या पिता का नाम जोड़ें",
        consentStatus: "अभिभावक की सहमति दर्ज करें", disability: "दिव्यांगता का प्रकार जोड़ें", guardianName: "अभिभावक का नाम जोड़ें"
      },
      side: {
        alerts: "ध्यान देने योग्य", fix: "सुधारने योग्य", guardians: "अभिभावक खाते", team: "कक्षा", family_open: "अभिभावक खोलें",
        family_linked: "{n, plural, one {# अभिभावक खाता जुड़ा है} other {# अभिभावक खाते जुड़े हैं}}, {active} सक्रिय।",
        family_none: "अभी कोई अभिभावक खाता नहीं जुड़ा।"
      },
      overview: { why: "पूर्व चेतावनी का कारण", about: "परिचय" },
      peek: { about: "परिचय", contacts: "परिवार" },
      cls: {
        subtitle: "{year} में {n, plural, one {# अनुभाग} other {# अनुभाग}}", announce: "{n, plural, =0 {कोई अनुभाग नहीं} one {# अनुभाग} other {# अनुभाग}}",
        add: "कक्षा जोड़ें", import: "फ़ाइल से आयात करें", edit: "अनुभाग संपादित करें", open: "खोलें", see_students: "निर्देशिका में विद्यार्थी देखें",
        search_label: "अनुभाग खोजें", search: "कक्षा, अनुभाग या शिक्षक से खोजें", stage_label: "स्तर", year_label: "शैक्षणिक वर्ष",
        first_title: "{year} में अभी कोई अनुभाग नहीं", first_text: "X-C जैसी कक्षा जोड़ें, या फ़ाइल से अपने विद्यालय की कक्षाएँ और बच्चे आयात करें।",
        none_match: "इन फ़िल्टरों से कोई अनुभाग नहीं मिला।", none_match_text: "कोई और खोज आज़माएँ, या फ़िल्टर हटाएँ।",
        denied: "आप कक्षाएँ नहीं खोल सकते", denied_text: "कक्षाएँ विद्यालय के प्रशासक, प्रधानाचार्य और पंजीयक देखते हैं। अपने विद्यालय के प्रशासक से पूछें।",
        caption: "अनुभाग", no_teacher: "कक्षा शिक्षक नहीं", strength_of: "{cap} में से {n}", loading: "अनुभाग लोड हो रहा है…",
        sub: "कक्षा {grade} · अनुभाग {section}", room_n: "कमरा {room}", not_found: "अनुभाग नहीं मिला",
        not_found_text: "यह अनुभाग आपके विद्यालय में नहीं है, या लिंक पुराना है।", tabs_label: "इस कक्षा के भाग",
        kpi: {
          label: "अनुभाग संख्याएँ", sections: "अनुभाग", students: "विद्यार्थी", of_seats: "{n} सीटों में से", no_seats: "क्षमता तय नहीं",
          no_teacher: "कक्षा शिक्षक नहीं", no_teacher_ctx: "बिना कक्षा शिक्षक के अनुभाग", over: "क्षमता से अधिक", over_ctx: "सीटों से अधिक बच्चे",
          under75_ctx: "इस वर्ष की उपस्थिति", gaps_ctx: "बोर्ड की सूची इन्हें स्वीकार नहीं करेगी", consent_ctx: "अभिभावक की सहमति दर्ज नहीं"
        },
        token: { "no-teacher": "बिना कक्षा शिक्षक", "over-capacity": "क्षमता से अधिक" },
        col: { section: "अनुभाग", programme: "कार्यक्रम", teacher: "कक्षा शिक्षक", room: "कमरा", strength: "संख्या" },
        tab: { overview: "अवलोकन", roster: "विद्यार्थी सूची", activity: "गतिविधि" },
        tile: { label: "मुख्य संख्याएँ", strength: "संख्या", seats: "अनुभाग की सीटें", under75: "75% से कम", gaps: "सुधारने योग्य रिकॉर्ड", consent: "सहमति लंबित" },
        facts: { title: "इस अनुभाग के बारे में", class: "कक्षा", section: "अनुभाग", programme: "कार्यक्रम", stream: "संकाय", teacher: "कक्षा शिक्षक", room: "कमरा", capacity: "क्षमता", year: "शैक्षणिक वर्ष" },
        roster_caption: "{label} के विद्यार्थी", roster_none: "इस अनुभाग में अभी कोई नहीं",
        roster_none_text: "विद्यालय के बच्चों को जोड़ें, फ़ाइल से आयात करें, या पिछले वर्ष की कक्षा को आगे बढ़ाएँ।",
        activity: { none: "अभी कुछ नहीं बदला", none_text: "इस अनुभाग के बदलाव, करने वाले के नाम के साथ, यहाँ दिखते हैं।" },
        number_rolls: "अनुक्रमांक वर्णानुक्रम में दें",
        number: { title: "{label} के अनुक्रमांक दें?", text: "हर बच्चे को नाम के वर्णानुक्रम में फिर से 1 से अनुक्रमांक मिलेगा।", go: "अनुक्रमांक दें",
          done: "{n, plural, one {# बच्चे को वर्णानुक्रम में अनुक्रमांक मिला} other {# बच्चों को वर्णानुक्रम में अनुक्रमांक मिले}}" },
        saved: "अनुभाग सहेजा गया", added: "{n, plural, one {# अनुभाग जोड़ा गया: {list}} other {# अनुभाग जोड़े गए: {list}}}",
        form: {
          add_title: "कक्षा जोड़ें", edit_title: "{label} संपादित करें", grade: "कक्षा", section: "अनुभाग", sections: "अनुभाग", sections_help: "एक अनुभाग, या कई: A, B, C",
          programme: "कार्यक्रम", programme_help: "CBSE, ICSE, ISC, राज्य बोर्ड…", stream: "संकाय", stream_help: "XI और XII के लिए: विज्ञान (PCM), वाणिज्य…",
          room: "कमरा", capacity: "क्षमता", teacher: "कक्षा शिक्षक", save_add: "कक्षा जोड़ें",
          error_grade: "कक्षा चुनें।", error_section: "अनुभाग लिखें, जैसे A।", error_capacity: "क्षमता 1 से 200 के बीच की संख्या है।",
          partial: "{done} जोड़े गए। {failed} नहीं जुड़ा: {message}"
        },
        seat: {
          add: "बच्चे जोड़ें", title: "{label} में बच्चे जोड़ें", sub: "विद्यालय के वे बच्चे जो अभी किसी अनुभाग में नहीं हैं।", search: "नाम से खोजें",
          none: "सभी बच्चे किसी अनुभाग में हैं", no_match: "इस नाम का कोई बच्चा नहीं", pick_one: "कम से कम एक बच्चा चुनें।",
          go: "{n, plural, =0 {बच्चे जोड़ें} one {# बच्चा जोड़ें} other {# बच्चे जोड़ें}}",
          done: "{n, plural, one {# बच्चा {label} में जोड़ा गया} other {# बच्चे {label} में जोड़े गए}}"
        },
        promote: {
          menu: "अगले वर्ष में आगे बढ़ाएँ…", title: "{label} को आगे बढ़ाएँ", sub: "{label} के सभी बच्चे {year} के किसी अनुभाग में जाएँगे। {label} हर बच्चे के रिकॉर्ड में पिछले वर्ष के अनुभाग के रूप में रहेगा।",
          to: "इन्हें यहाँ भेजें", choose: "अनुभाग चुनें", now: "अभी {n} बच्चे", none: "{year} में अभी कोई अनुभाग नहीं। पहले अगले वर्ष का अनुभाग जोड़ें।",
          rolls: "अनुक्रमांक", rolls_name: "फिर से A–Z में अनुक्रमांक दें", rolls_none: "बाद में अनुक्रमांक देने के लिए छोड़ें", go: "आगे बढ़ाएँ",
          need_target: "वह अनुभाग चुनें जहाँ वे जाएँगे।", done: "{n, plural, one {# बच्चा {to} में गया} other {# बच्चे {to} में गए}}"
        }
      },
      att: {
        none: "अभी उपस्थिति दर्ज नहीं", none_text: "इस कक्षा का रजिस्टर भरने के बाद उपस्थिति यहाँ दिखेगी।", open: "रजिस्टर खोलें",
        marked: "दर्ज दिन", present: "उपस्थित", leave: "अवकाश पर", absent: "अनुपस्थित", with_leave: "अवकाश गिनकर उपस्थिति",
        can_miss: "और कितने दिन अनुपस्थित रह सकते हैं", must_attend: "कितने दिन आना ज़रूरी है"
      },
      marks: {
        none: "अभी कोई परिणाम नहीं", none_text: "परीक्षा प्रकाशित होने पर अंक यहाँ दिखेंगे।", open: "परिणाम खोलें", exam: "नवीनतम परीक्षा",
        pass_line: "उत्तीर्ण अंक", state: "परिणाम", pass: "उत्तीर्ण", below: "उत्तीर्ण अंक से कम"
      },
      activity: {
        none: "अभी कुछ नहीं बदला", none_text: "बदलाव, निर्यात और दिखाए गए नंबर, करने वाले के नाम के साथ, यहाँ दिखते हैं।",
        denied: "आप यह लॉग नहीं देख सकते", denied_text: "गतिविधि लॉग विद्यालय के प्रशासकों और प्रधानाचार्य के लिए है।", system: "सिस्टम",
        verb: {
          created: "{field} जोड़ा", changed: "{field} बदला", deleted: "{field} हटाया", published: "{field} प्रकाशित किया", exported: "{field} निर्यात किया",
          revealed: "{field} दिखाया", signed_in: "साइन इन किया", sign_in_failed: "साइन इन विफल रहा", role_changed: "{field} की भूमिका बदली", restored: "{field} पुनर्स्थापित किया"
        },
        event: {
          created: "इस विद्यार्थी को जोड़ा", changed: "इस रिकॉर्ड में बदलाव किया", deleted: "इस रिकॉर्ड को हटाया", published: "इस रिकॉर्ड को प्रकाशित किया",
          exported: "सूची निर्यात की", revealed: "एक नंबर दिखाया", signed_in: "साइन इन किया", sign_in_failed: "साइन इन विफल रहा",
          role_changed: "एक भूमिका बदली", restored: "इस रिकॉर्ड को पुनर्स्थापित किया"
        },
        event_class: { created: "इस अनुभाग को जोड़ा", changed: "इस अनुभाग में बदलाव किया", deleted: "इस अनुभाग को हटाया", restored: "इस अनुभाग को पुनर्स्थापित किया" }
      },
      bulk: {
        message: "परिवारों को संदेश", house: "हाउस तय करें", house_help: "हाउस हटाने के लिए खाली छोड़ें।",
        house_go: "{n, plural, one {# विद्यार्थी का हाउस तय करें} other {# विद्यार्थियों का हाउस तय करें}}",
        house_done: "{n, plural, =0 {किसी का हाउस नहीं बदला: उनका यही था} one {# विद्यार्थी का हाउस तय हुआ} other {# विद्यार्थियों का हाउस तय हुआ}}",
        message_title: "{n, plural, one {# विद्यार्थी के परिवार को संदेश} other {# विद्यार्थियों के परिवारों को संदेश}}",
        subject: "विषय", text: "संदेश", send: "संदेश भेजें", word: "भेजें",
        sent: "{students, plural, one {# विद्यार्थी} other {# विद्यार्थियों}} और {families, plural, one {# अभिभावक} other {# अभिभावकों}} को भेजा गया"
      },
      section: { student: "विद्यार्थी", records: "सरकारी रिकॉर्ड", family: "परिवार", care: "देखभाल और सहायता", consent: "अभिभावक की सहमति" },
      field: {
        name: "पूरा नाम", email: "ईमेल", dob: "जन्म तिथि", gender: "लिंग", classId: "कक्षा और अनुभाग", rollNo: "अनुक्रमांक",
        admissionNo: "प्रवेश क्रमांक", admittedOn: "प्रवेश की तिथि", category: "श्रेणी", house: "हाउस", bloodGroup: "रक्त समूह",
        motherTongue: "मातृभाषा", secondLanguage: "द्वितीय भाषा", transport: "परिवहन", address: "पता",
        apaar: "APAAR आईडी", pen: "PEN संख्या", aadhaar: "आधार", boardRollNo: "बोर्ड अनुक्रमांक", previousSchool: "पिछला विद्यालय",
        fatherName: "पिता का नाम", fatherPhone: "पिता का मोबाइल", motherName: "माता का नाम", motherPhone: "माता का मोबाइल",
        primaryContact: "मुख्य संपर्क", language: "परिवार की भाषा", guardianName: "अभिभावक का नाम", guardianRelation: "अभिभावक से संबंध",
        guardianPhone: "अभिभावक का मोबाइल", guardianEmail: "परिवार का ईमेल", whatsapp: "व्हाट्सऐप का उपयोग करें", cwsn: "विशेष आवश्यकता वाला बच्चा",
        disability: "दिव्यांगता का प्रकार", udid: "दिव्यांगता आईडी (UDID)", migrant: "प्रवासी परिवार", consentStatus: "अभिभावक की सहमति",
        consentMethod: "सहमति किस रूप में दी", consentOn: "सहमति की तिथि", consentNote: "सहमति पर टिप्पणी", pin: "पिन कोड", district: "ज़िला", state: "राज्य",
        programme: "कार्यक्रम", stream: "संकाय", room: "कमरा", capacity: "क्षमता", classTeacher: "कक्षा शिक्षक"
      },
      help: {
        apaar: "12 अंक, या REFUSED या NOGEN लिखें।", pen: "11 अंक।", aadhaar: "12 अंक। केवल अंतिम चार अंक रखे जाते हैं।",
        aadhaar_set: "दर्ज है, अंत में {last4}। बदलने के लिए नया नंबर लिखें।",
        fatherPhone: "10 अंकों का मोबाइल नंबर, +91 के साथ या उसके बिना।", motherPhone: "10 अंकों का मोबाइल नंबर, +91 के साथ या उसके बिना।",
        guardianPhone: "10 अंकों का मोबाइल नंबर, +91 के साथ या उसके बिना।"
      },
      error: { name: "विद्यार्थी का पूरा नाम लिखें।", email: "सही ईमेल पता लिखें।" }
    }
  });
})();
