/* ==========================================================================
   Oplo Learn — words.

   Every string a person reads comes from a pack, keyed in dotted English
   ("button.save"), so a screen can be Hindi without being rewritten and a
   school in the United States can say Grade where an Indian school says Class.
   A page never holds a sentence of its own; a lint (api/scripts/check-i18n.mjs)
   fails the build if one does.

   Packs, in the order they are asked:
     the language   hi-IN, when the person chose it
     the country    en-US overrides a handful of words (Class → Grade), and is
                    only consulted for a US school; en-IN is the default
     the base       en-IN, which has every key. An untranslated key falls back
                    to it, so a string is never blank.

   Messages are ICU MessageFormat, the subset a school's screens need:
     "{name}"                                       a value
     "{n, plural, =0 {No students} one {# student} other {# students}}"
     "{who, select, parent {Your child} other {The student}}"
   Plurals use Intl.PluralRules for the language, so Hindi's "0 and 1 are one"
   is right without a table here.

   Packs are scripts (i18n/en-IN.js …), not JSON fetched at run time: api.js is
   the only file that may use the network, and a script tag needs no fetch.
   Hindi is added when it is chosen.
   ========================================================================== */
(function () {
  "use strict";
  var OL = window.OL = window.OL || {};

  var packs = {};            // locale → flat { key: message }
  var cur = "en-IN";         // the language in force
  var country = "IN";        // the school's country: IN or US
  var listeners = [];
  var BASE = "en-IN";

  function flatten(obj, prefix, out) {
    Object.keys(obj).forEach(function (k) {
      var v = obj[k], key = prefix ? prefix + "." + k : k;
      if (v && typeof v === "object") flatten(v, key, out);
      else out[key] = String(v);
    });
    return out;
  }

  /* ------------------------------------------------------ ICU, the subset */
  /* Find the "}" that closes the "{" at i, counting nesting. */
  function close(s, i) {
    var depth = 0;
    for (var j = i; j < s.length; j++) {
      if (s[j] === "{") depth++;
      else if (s[j] === "}" && --depth === 0) return j;
    }
    return -1;
  }

  /* "=0 {No students} one {# student} other {# students}" → { "=0": "No students", one: "# student", … } */
  function cases(body) {
    var out = {}, i = 0;
    while (i < body.length) {
      while (i < body.length && /\s/.test(body[i])) i++;
      var j = i;
      while (j < body.length && !/[\s{]/.test(body[j])) j++;
      var sel = body.slice(i, j);
      while (j < body.length && /\s/.test(body[j])) j++;
      if (!sel || body[j] !== "{") break;
      var end = close(body, j);
      if (end < 0) break;
      out[sel] = body.slice(j + 1, end);
      i = end + 1;
    }
    return out;
  }

  function pluralCategory(n, locale) {
    try { return new Intl.PluralRules(locale).select(n); } catch (e) { return n === 1 ? "one" : "other"; }
  }

  function format(msg, params, locale) {
    params = params || {};
    var out = "", i = 0;
    while (i < msg.length) {
      var open = msg.indexOf("{", i);
      if (open < 0) { out += msg.slice(i); break; }
      out += msg.slice(i, open);
      var end = close(msg, open);
      if (end < 0) { out += msg.slice(open); break; }
      var inner = msg.slice(open + 1, end);
      var comma = inner.indexOf(",");
      if (comma < 0) {
        var v = params[inner.trim()];
        out += v == null ? "" : String(v);
      } else {
        var name = inner.slice(0, comma).trim(), rest = inner.slice(comma + 1).trim();
        var c2 = rest.indexOf(","), kind = rest.slice(0, c2).trim(), body = rest.slice(c2 + 1);
        var val = params[name], table = cases(body), pick;
        if (kind === "plural") {
          var n = Number(val);
          pick = table["=" + n] != null ? table["=" + n] : table[pluralCategory(n, locale)] != null ? table[pluralCategory(n, locale)] : table.other;
          if (pick != null) pick = pick.replace(/#/g, OL.fmt ? OL.fmt.num(n) : String(n));
        } else {
          pick = table[String(val)] != null ? table[String(val)] : table.other;
        }
        out += pick == null ? "" : format(pick, params, locale);
      }
      i = end + 1;
    }
    return out;
  }

  /* ------------------------------------------------------------ The API */
  function lookup(key) {
    var chain = [cur];
    if (country === "US") chain.unshift("en-US");        // a US school's words win over the language's
    chain.push(BASE);
    for (var i = 0; i < chain.length; i++) {
      var p = packs[chain[i]];
      if (p && p[key] != null) return { msg: p[key], locale: chain[i] };
    }
    return null;
  }

  OL.i18n = {
    BASE: BASE,
    add: function (locale, pack) {
      packs[locale] = Object.assign(packs[locale] || {}, flatten(pack, "", {}));
    },
    packs: function () { return packs; },
    has: function (key) { return !!lookup(key); },
    t: function (key, params) {
      var hit = lookup(key);
      if (!hit) return key;                       // a missing key shows itself, loudly enough to be fixed
      return hit.msg.indexOf("{") < 0 ? hit.msg : format(hit.msg, params, hit.locale === "en-US" ? "en-IN" : hit.locale);
    },
    /* The school's own word for a concept: term("class") is Class, or Grade for a US school. */
    term: function (concept, params) { return OL.i18n.t("term." + concept, params); },
    locale: function () { return cur; },
    country: function () { return country; },
    /* Choose the language. A pack that is not loaded yet is fetched as a script and the
       change is announced when it arrives; until then the base language shows. */
    use: function (locale, then) {
      locale = locale || BASE;
      function go() {
        cur = packs[locale] ? locale : BASE;
        document.documentElement.setAttribute("lang", cur);
        listeners.forEach(function (fn) { fn(cur); });
        if (then) then(cur);
      }
      if (packs[locale] || locale === BASE) { go(); return; }
      var s = document.createElement("script");
      s.src = "i18n/" + locale + ".js";
      s.onload = go;
      s.onerror = function () { go(); };
      document.head.appendChild(s);
    },
    setCountry: function (c) { country = c === "US" ? "US" : "IN"; listeners.forEach(function (fn) { fn(cur); }); },
    onChange: function (fn) { listeners.push(fn); },
    /* The languages a person can choose, with their own names. */
    languages: [{ code: "en-IN", name: "English (India)" }, { code: "hi-IN", name: "हिन्दी" }]
  };
  OL.t = OL.i18n.t;
})();
