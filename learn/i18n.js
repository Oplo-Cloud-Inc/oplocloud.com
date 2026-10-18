/* ==========================================================================
   OEdu — the family page in Hindi and Punjabi.

   A parent reads the school's record of their child in the language they read
   in. This turns the names of the places, the groups, the states and the words
   of the pages for a school in India into हिन्दी or ਪੰਜਾਬੀ. What the school
   writes (a diary entry, a remark, a message) is shown as it was written; the
   rest of the page, outside the words listed here, is still in English.

   Says so plainly: this is a first set of the words a family meets most, written
   for a native reader to check, not a finished translation. Adding a word is
   adding a line to DICT; adding a language is adding a column.

   t(english) is the English back when there is no translation, so an
   untranslated word is never blank.
   ========================================================================== */
window.OPLO_I18N = (function () {
  "use strict";

  var LANGS = [["en", "English"], ["hi", "हिन्दी"], ["pa", "ਪੰਜਾਬੀ"]];
  var cur = "en";

  // english: [hindi, punjabi]
  var DICT = {
    "Overview": ["सारांश", "ਸੰਖੇਪ"],
    "Learning": ["सीखना", "ਸਿੱਖਣਾ"], "Milestones": ["पड़ाव", "ਪੜਾਅ"], "Support and wellbeing": ["सहायता और कल्याण", "ਸਹਾਇਤਾ ਅਤੇ ਭਲਾਈ"],
    "School life": ["स्कूल का जीवन", "ਸਕੂਲੀ ਜੀਵਨ"], "Family": ["परिवार", "ਪਰਿਵਾਰ"],
    "How the work is going, mark by mark.": ["काम कैसा चल रहा है, अंक दर अंक।", "ਕੰਮ ਕਿਵੇਂ ਚੱਲ ਰਿਹਾ ਹੈ, ਅੰਕ-ਦਰ-ਅੰਕ।"],
    "Where the record is heading.": ["रिकॉर्ड किस ओर जा रहा है।", "ਰਿਕਾਰਡ ਕਿਸ ਪਾਸੇ ਜਾ ਰਿਹਾ ਹੈ।"],
    "What is in place around the work.": ["पढ़ाई के आसपास क्या व्यवस्था है।", "ਪੜ੍ਹਾਈ ਦੇ ਆਲੇ-ਦੁਆਲੇ ਕੀ ਪ੍ਰਬੰਧ ਹਨ।"],
    "The day-to-day of being a student.": ["विद्यार्थी का रोज़ का जीवन।", "ਵਿਦਿਆਰਥੀ ਦਾ ਰੋਜ਼ਾਨਾ ਜੀਵਨ।"],
    "Who the student is, and who to call.": ["विद्यार्थी कौन है, और किसे बुलाना है।", "ਵਿਦਿਆਰਥੀ ਕੌਣ ਹੈ, ਅਤੇ ਕਿਸਨੂੰ ਫ਼ੋਨ ਕਰਨਾ ਹੈ।"],

    "Grades": ["ग्रेड", "ਗ੍ਰੇਡ"], "Assignments": ["कार्य", "ਕੰਮ"], "Attendance": ["उपस्थिति", "ਹਾਜ਼ਰੀ"], "Report cards": ["रिपोर्ट कार्ड", "ਰਿਪੋਰਟ ਕਾਰਡ"],
    "Parent meetings": ["अभिभावक बैठक", "ਮਾਪੇ ਮਿਲਣੀ"], "Diary": ["डायरी", "ਡਾਇਰੀ"], "Holistic Progress Card": ["समग्र प्रगति कार्ड", "ਸਮੁੱਚਾ ਪ੍ਰਗਤੀ ਕਾਰਡ"],
    "Schedule": ["समय-सारणी", "ਸਮਾਂ-ਸਾਰਣੀ"], "Messages": ["संदेश", "ਸੁਨੇਹੇ"], "Guardians": ["अभिभावक", "ਸਰਪ੍ਰਸਤ"], "Student": ["विद्यार्थी", "ਵਿਦਿਆਰਥੀ"],
    "Enrollment": ["नामांकन", "ਦਾਖ਼ਲਾ"], "Transportation": ["परिवहन", "ਆਵਾਜਾਈ"], "Emergency Contact": ["आपातकालीन संपर्क", "ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ"],
    "Student Documents": ["विद्यार्थी के दस्तावेज़", "ਵਿਦਿਆਰਥੀ ਦੇ ਦਸਤਾਵੇਜ਼"], "Promotion Tracker": ["अगली कक्षा की स्थिति", "ਅਗਲੀ ਜਮਾਤ ਦੀ ਸਥਿਤੀ"],
    "Assessments": ["मूल्यांकन", "ਮੁਲਾਂਕਣ"], "Student Wellness": ["विद्यार्थी का स्वास्थ्य", "ਵਿਦਿਆਰਥੀ ਦੀ ਸਿਹਤ"],

    "From the school": ["स्कूल की ओर से", "ਸਕੂਲ ਵੱਲੋਂ"], "From the record": ["रिकॉर्ड से", "ਰਿਕਾਰਡ ਤੋਂ"], "Not on file yet": ["अभी दर्ज नहीं", "ਅਜੇ ਦਰਜ ਨਹੀਂ"],
    "Nothing yet": ["अभी कुछ नहीं", "ਅਜੇ ਕੁਝ ਨਹੀਂ"], "Nothing yet.": ["अभी कुछ नहीं।", "ਅਜੇ ਕੁਝ ਨਹੀਂ।"], "Close": ["बंद करें", "ਬੰਦ ਕਰੋ"],

    "Subject": ["विषय", "ਵਿਸ਼ਾ"], "Marks": ["अंक", "ਅੰਕ"], "Grade": ["ग्रेड", "ਗ੍ਰੇਡ"], "Skill": ["कौशल", "ਹੁਨਰ"], "Term 1": ["सत्र 1", "ਟਰਮ 1"], "Term 2": ["सत्र 2", "ਟਰਮ 2"],
    "Total": ["कुल", "ਕੁੱਲ"], "Result": ["परिणाम", "ਨਤੀਜਾ"], "Co-scholastic": ["सह-शैक्षिक", "ਸਹਿ-ਵਿੱਦਿਅਕ"], "Class teacher’s remark": ["कक्षा अध्यापक की टिप्पणी", "ਜਮਾਤ ਅਧਿਆਪਕ ਦੀ ਟਿੱਪਣੀ"],
    "Promoted": ["अगली कक्षा में", "ਅਗਲੀ ਜਮਾਤ ਵਿੱਚ"], "Detained": ["उसी कक्षा में", "ਉਸੇ ਜਮਾਤ ਵਿੱਚ"], "Passed out": ["उत्तीर्ण होकर निकला", "ਪਾਸ ਹੋ ਕੇ ਨਿਕਲਿਆ"],
    "Absent": ["अनुपस्थित", "ਗ਼ੈਰ-ਹਾਜ਼ਰ"], "Below the pass mark": ["उत्तीर्ण अंकों से कम", "ਪਾਸ ਅੰਕਾਂ ਤੋਂ ਘੱਟ"],
    "Beginning": ["शुरुआती", "ਸ਼ੁਰੂਆਤੀ"], "Developing": ["विकासशील", "ਵਿਕਾਸਸ਼ੀਲ"], "Proficient": ["कुशल", "ਨਿਪੁੰਨ"], "Advanced": ["उन्नत", "ਉੱਨਤ"],
    "Homework": ["गृहकार्य", "ਘਰ ਦਾ ਕੰਮ"], "Circular": ["परिपत्र", "ਸਰਕੂਲਰ"], "Note": ["टिप्पणी", "ਨੋਟ"], "For": ["विषय", "ਲਈ"],
    "Teacher": ["अध्यापक", "ਅਧਿਆਪਕ"], "A classmate": ["सहपाठी", "ਸਹਿਪਾਠੀ"], "A parent": ["अभिभावक", "ਮਾਪੇ"],
    "In their own words, and others’": ["उनके अपने शब्दों में, और दूसरों के", "ਉਨ੍ਹਾਂ ਦੇ ਆਪਣੇ ਸ਼ਬਦਾਂ ਵਿੱਚ, ਅਤੇ ਹੋਰਾਂ ਦੇ"],
    "Add to the card": ["कार्ड में जोड़ें", "ਕਾਰਡ ਵਿੱਚ ਜੋੜੋ"], "Added to the card.": ["कार्ड में जोड़ दिया गया।", "ਕਾਰਡ ਵਿੱਚ ਜੋੜ ਦਿੱਤਾ ਗਿਆ।"],
    "Your time": ["आपका समय", "ਤੁਹਾਡਾ ਸਮਾਂ"], "Choose a time.": ["समय चुनें।", "ਸਮਾਂ ਚੁਣੋ।"], "You have no time yet.": ["अभी आपके लिए कोई समय तय नहीं है।", "ਅਜੇ ਤੁਹਾਡੇ ਲਈ ਕੋਈ ਸਮਾਂ ਤੈਅ ਨਹੀਂ ਹੈ।"],
    "Give this time back": ["यह समय वापस करें", "ਇਹ ਸਮਾਂ ਵਾਪਸ ਕਰੋ"], "Time given back.": ["समय वापस कर दिया गया।", "ਸਮਾਂ ਵਾਪਸ ਕਰ ਦਿੱਤਾ ਗਿਆ।"],
    "Nobody is linked to this student as family yet.": ["अभी इस विद्यार्थी से कोई अभिभावक जुड़ा नहीं है।", "ਅਜੇ ਇਸ ਵਿਦਿਆਰਥੀ ਨਾਲ ਕੋਈ ਮਾਪੇ ਜੁੜੇ ਨਹੀਂ ਹਨ।"],
    "Report cards appear here once the school has published the marks of an exam.": ["स्कूल द्वारा परीक्षा के अंक प्रकाशित करते ही रिपोर्ट कार्ड यहाँ दिखेंगे।", "ਸਕੂਲ ਵੱਲੋਂ ਪ੍ਰੀਖਿਆ ਦੇ ਅੰਕ ਪ੍ਰਕਾਸ਼ਿਤ ਕਰਨ ਤੇ ਰਿਪੋਰਟ ਕਾਰਡ ਇੱਥੇ ਦਿਖਣਗੇ।"],
    "Homework and notes from the class teacher appear here every day.": ["कक्षा अध्यापक का गृहकार्य और टिप्पणियाँ हर दिन यहाँ दिखेंगी।", "ਜਮਾਤ ਅਧਿਆਪਕ ਦਾ ਘਰ ਦਾ ਕੰਮ ਅਤੇ ਨੋਟ ਹਰ ਰੋਜ਼ ਇੱਥੇ ਦਿਖਣਗੇ।"],
    "Parent meetings appear here with your time, once the class teacher sets one.": ["कक्षा अध्यापक द्वारा बैठक तय करते ही आपके समय के साथ यहाँ दिखेगी।", "ਜਮਾਤ ਅਧਿਆਪਕ ਵੱਲੋਂ ਮਿਲਣੀ ਤੈਅ ਕਰਨ ਤੇ ਤੁਹਾਡੇ ਸਮੇਂ ਸਮੇਤ ਇੱਥੇ ਦਿਖੇਗੀ।"]
  };

  function lang() { return cur; }
  function use(code) { cur = LANGS.some(function (l) { return l[0] === code; }) ? code : "en"; try { document.documentElement.lang = cur; } catch (e) { /* no document */ } return cur; }
  function t(s) {
    if (cur === "en") return s;
    var row = DICT[s];
    return row ? row[cur === "hi" ? 0 : 1] || s : s;
  }
  function names() { return LANGS.slice(); }
  return { use: use, t: t, lang: lang, names: names, DICT: DICT };
})();
