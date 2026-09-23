/* ==========================================================================
   Where a person goes after signing in.

   OEdu has one sign-in page, at its root, for everybody: administrators,
   teachers, students and families. What a person is is already on their Oplo
   Account, as roles, so nobody is asked which door is theirs — this file turns
   those roles into an address.

     /admin/    a school administrator, or a platform administrator
     /teacher/  a teacher or an author
     /student/  a student
     /parent/   a parent or guardian

   An account can hold more than one role. Each person has one home, chosen in
   the order above, and may open any other address their roles allow: an
   administrator can open /teacher/ and see the console as a teacher sees it,
   or /parent/ to see what a family sees. Anything else sends them home.

   Nothing here is a permission. The API decides what every request may read;
   this only decides which page to show, and a page shown to the wrong person
   would still be refused every row it asked for.
   ========================================================================== */
(function (scope) {
  "use strict";

  var MODES = ["admin", "teacher", "student", "parent"];

  /* The addresses an account may open, home first. */
  function allowed(roles) {
    roles = roles || [];
    function has(product, role) {
      return roles.some(function (r) { return r.product === product && r.role === role; });
    }
    var admin = has("platform", "admin") || has("learn", "admin");
    var out = [];
    if (admin) out.push("admin");
    if (admin || has("learn", "teacher") || has("learn", "author")) out.push("teacher");
    if (has("learn", "student")) out.push("student");
    if (admin || has("learn", "guardian")) out.push("parent");
    // An account with no OEdu role at all is somebody signing in to learn,
    // which is what the app always assumed of them.
    if (!out.length) out.push("student");
    return out;
  }

  function home(roles) { return allowed(roles)[0]; }

  /* The address a path names, the root the app is served from, and the
     place inside it: "/admin/" is admin at "/"; "/learn/teacher/" is teacher
     at "/learn/"; "/student/Science/Biology/u1" is student at "/" with the
     place "/Science/Biology/u1". The first mode segment is the mode, so a
     place whose name happened to contain one cannot be mistaken for it. */
  function parse(pathname) {
    var p = pathname || "/";
    var m = /^(.*?\/)(admin|teacher|student|parent)(\/.*)?$/.exec(p);
    if (m) return { mode: m[2], root: m[1], rest: m[3] || "" };
    return { mode: null, root: p.replace(/[^/]*$/, ""), rest: "" };
  }

  function pathFor(root, mode) { return root + mode + "/"; }

  /* A `next` the sign-in page was given, if it is one of our own addresses.
     Anything on another origin, or outside the four, is ignored rather than
     followed: a sign-in page that redirects wherever it is told is a phishing
     page with a real certificate. */
  function nextFrom(next, root, origin) {
    if (!next) return null;
    try {
      var u = new URL(next, origin);
      if (u.origin !== origin) return null;
      var p = parse(u.pathname);
      if (!p.mode || p.root !== root) return null;
      return { mode: p.mode, href: u.pathname + u.search + u.hash };
    } catch (e) {
      return null;
    }
  }

  /* Where somebody belongs now that the server has said who they are.
     `stay` is true when the page they are on is already one of theirs. */
  function destination(roles, loc, next) {
    var here = parse(loc.pathname);
    var ok = allowed(roles);
    var asked = nextFrom(next, here.root, loc.origin);
    if (asked && ok.indexOf(asked.mode) > -1) {
      return { mode: asked.mode, href: asked.href, stay: false };
    }
    if (here.mode && ok.indexOf(here.mode) > -1) return { mode: here.mode, href: null, stay: true };
    return { mode: ok[0], href: pathFor(here.root, ok[0]), stay: false };
  }

  var api = { MODES: MODES, allowed: allowed, home: home, parse: parse, pathFor: pathFor, destination: destination };
  scope.OPLO_HOME = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
