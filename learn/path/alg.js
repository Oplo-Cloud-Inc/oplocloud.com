/* ==========================================================================
   Algebra Pathway — the course.

   Seventy topics in eight slices, from adding integers to rationalising a
   denominator. The topics themselves are in path/alg-a.js … alg-d.js (each
   one a question generator with its worked solution); this file is only the
   map: what the slices are, and — through each topic's `pre` — what rests on
   what. See lab/pathkit.js for what a map is for.
   ========================================================================== */
(function () {
  "use strict";
  var LAB = window.OPLO_LAB, P = LAB && LAB.PATH;
  if (!P || !P.parts || !P.parts.alg) return;
  P.define("alg", {
    title: "Algebra I",
    blurb: "From integers to the quadratic formula: seventy topics, and a check that finds the ones you're ready for.",
    cats: [
      { id: "num", name: "Numbers", short: "Numbers", hue: "#6b95ff", blurb: "Integers, fractions, decimals, percents, powers" },
      { id: "exp", name: "Expressions", short: "Expressions", hue: "#a78bfa", blurb: "Evaluating, combining, expanding" },
      { id: "eqn", name: "Equations & inequalities", short: "Equations", hue: "#2dd4bf", blurb: "One variable, in every form" },
      { id: "lin", name: "Lines & functions", short: "Lines", hue: "#3ddc84", blurb: "Slope, intercepts, equations of lines" },
      { id: "sys", name: "Systems", short: "Systems", hue: "#ffc53d", blurb: "Two equations, two unknowns" },
      { id: "pol", name: "Exponents & polynomials", short: "Polynomials", hue: "#ffa04a", blurb: "Powers, adding and multiplying polynomials" },
      { id: "fac", name: "Factoring & quadratics", short: "Factoring", hue: "#ff7a9c", blurb: "Factoring, solving, parabolas" },
      { id: "rad", name: "Radicals", short: "Radicals", hue: "#5ec8ff", blurb: "Square roots, simplified and rationalised" }
    ],
    topics: P.parts.alg
  });
})();
