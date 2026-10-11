/* ==========================================================================
   Kern — OEdu with the school taken out.

   kern.oplocloud.com is for learning on your own, by doing: courses you work
   through by solving. There is no classroom, nothing is set by anyone, and
   nothing is graded. app.js does the real work when window.OPLO_KERN is set
   (index.html); this file only gives the page its own name and the pads'
   drawings. The front door, before sign-in, is kern-front.js. It never
   touches the network.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.OPLO_KERN) return;

  /* ----------------------------------------------------------------------
     The pads of a path: a small flat drawing for each lesson and unit, in
     Kern's own colours. A glyph is the inside of a 64 × 64 SVG; its classes
     say how a shape is drawn (s? = a line in a colour, f? = filled, t? = a
     soft tint), so every glyph shares one palette (kern.css, .kp-pad).
       KERN_ART.pad(key, cls)  → the pad's markup (a disc with the glyph)
     A lesson or unit with no drawing of its own gets its number instead.
     ---------------------------------------------------------------------- */
  var G = {
    // Chapter 1 — Basics of Geometry
    pla: '<path class="tb sb" d="M9 45 19 20h36L45 45z"/><path class="sw" d="M12 44 54 22"/><circle class="fc" cx="22" cy="38.8" r="3.6"/><circle class="fc" cx="36" cy="31.4" r="3.6"/><circle class="fc" cx="47" cy="25.6" r="3.6"/>',
    seg: '<rect class="tb sb" x="8" y="34" width="48" height="16" rx="3"/><path class="sb" d="M16 34v6M24 34v9M32 34v6M40 34v9M48 34v6"/><path class="sc" d="M14 21H50"/><circle class="fc" cx="14" cy="21" r="3.8"/><circle class="fc" cx="50" cy="21" r="3.8"/>',
    ang: '<path class="tb sb" d="M7 48a25 25 0 0 1 50 0z"/><path class="sw" d="M32 48H58"/><path class="sc" d="M32 48 52 28"/><path class="sw" d="M43 48a11 11 0 0 0-3.3-7.8"/><circle class="fc" cx="32" cy="48" r="3.4"/>',
    sega: '<path class="sw" d="M8 40H56"/><path class="sc" d="M20 33v14M44 33v14"/><circle class="fa" cx="8" cy="40" r="3.8"/><circle class="fa" cx="56" cy="40" r="3.8"/><circle class="fc" cx="32" cy="40" r="3.8"/><path class="tb sb" d="M10 24 32 8v16z"/><path class="sw" d="M10 24H34M10 24 30 12"/>',
    pair: '<path class="sw" d="M8 16 56 48M8 48 56 16"/><path class="sc" d="M24 26a10 10 0 0 1 16 0"/><path class="sc" d="M24 38a10 10 0 0 0 16 0"/><path class="sb" d="M44 29a10 10 0 0 1 0 6M20 29a10 10 0 0 0 0 6"/>',
    tri: '<path class="tb sa" d="M32 9 57 51H7z"/><circle class="fc" cx="32" cy="9" r="3.8"/><circle class="fb" cx="57" cy="51" r="3.8"/><circle class="fb" cx="7" cy="51" r="3.8"/>',
    poly: '<path class="tb sb" d="M24 10h18l13 15-9 21H20L9 25z"/><path class="sc" d="M24 10 46 46M42 10 20 46"/>',
    solve: '<path class="tc sc" d="M32 7a15 15 0 0 0-9 27c2 2 3 4 3 7h12c0-3 1-5 3-7A15 15 0 0 0 32 7z"/><path class="sw" d="M26 48h12M28 54h8"/><path class="sw" d="M32 22v9M28 28l4 4 4-4"/>',
    // Chapter 2 — Reasoning and Proof
    ind: '<circle class="fc" cx="32" cy="14" r="4.4"/><circle class="fb" cx="24" cy="29" r="4.4"/><circle class="fb" cx="40" cy="29" r="4.4"/><circle class="fa" cx="16" cy="44" r="4.4"/><circle class="fa" cx="32" cy="44" r="4.4"/><circle class="fa" cx="48" cy="44" r="4.4"/><path class="sw" d="M54 52h4"/>',
    cond: '<rect class="tb sa" x="5" y="21" width="21" height="22" rx="7"/><rect class="tc sc" x="38" y="21" width="21" height="22" rx="7"/><path class="sw" d="M28 32h8M33 27l5 5-5 5"/><circle class="fa" cx="15.5" cy="32" r="3"/><circle class="fc" cx="48.5" cy="32" r="3"/>',
    ded: '<circle class="tb sb" cx="32" cy="32" r="23"/><circle class="tc sc" cx="32" cy="39" r="11"/><circle class="fw" cx="32" cy="39" r="3.4"/><path class="sw" d="M32 14v10"/>',
    alg: '<path class="sw" d="M32 10v38M21 52h22"/><path class="sa" d="M9 20 32 14l23 6"/><path class="tb sb" d="M9 20 3 34a8 8 0 0 0 12 0zM55 20l-6 14a8 8 0 0 0 12 0z"/>',
    diag: '<path class="tb sa" d="M10 52V13L54 52z"/><path class="sw" d="M10 43h9v9"/><path class="sc" d="M5 30h10M30 36l3.5-3.5"/><path class="sc" d="M36 34 40 31"/>',
    proof: '<rect class="tb sa" x="8" y="9" width="48" height="46" rx="7"/><path class="sa" d="M29 9v46M8 22h48"/><path class="sw" d="M14 31h10M14 40h10M14 49h10M35 31h15M35 40h15M35 49h15"/>',
    cong: '<path class="sw" d="M8 20h24M8 44h24"/><path class="sc" d="M20 14v12M20 38v12"/><path class="sb" d="M40 24c4-4 6 4 10 0s6 4 10 0M40 40c4-4 6 4 10 0s6 4 10 0M42 32h16"/>',
    ap: '<path class="sw" d="M8 44H56"/><path class="sa" d="M32 44 18 14"/><path class="sc" d="M42 44a10 10 0 0 0-8-9M26 44a10 10 0 0 1 4-8"/><path class="sg" d="M40 14l6 6 10-12"/>',
    // Chapter 3 — Parallel and Perpendicular Lines
    lines: '<path class="sb" d="M6 20H46M18 34H58"/><path class="sw" d="M32 6 24 58"/><path class="sc" d="M10 50 54 46"/>',
    trans: '<path class="sb" d="M6 20h52M6 44h52"/><path class="sw" d="M18 8 46 56"/><path class="sc" d="M31 20a7 7 0 0 1-3.5 6M44 44a7 7 0 0 1-3.5 6"/><path class="sa" d="M25 20a7 7 0 0 0 .5 5M38 44a7 7 0 0 0 .5 5"/>',
    proofpar: '<path class="sb" d="M6 18h52M6 38h52"/><path class="sc" d="M28 13l5 5-5 5M28 33l5 5-5 5"/><path class="sg" d="M26 52l6 6 12-14"/>',
    slope: '<path class="sw" d="M10 56V9M10 56H57"/><path class="sa" d="M14 51 54 14"/><path class="sc" d="M24 42h19V25"/><circle class="fb" cx="24" cy="42" r="3.2"/><circle class="fb" cx="43" cy="25" r="3.2"/>',
    eqn: '<path class="sw" d="M10 56V9M10 56H57"/><path class="sb" d="M10 44 56 14"/><circle class="fc" cx="10" cy="44" r="4"/><path class="sa" d="M26 34 26 56M26 34 10 34"/>',
    perp: '<path class="sw" d="M8 52H56"/><path class="sa" d="M26 54V8"/><path class="sc" d="M26 42h10v10"/>',
    perpt: '<path class="sb" d="M6 18h52M6 46h52"/><path class="sw" d="M32 6v52"/><path class="sc" d="M32 26h7v-8M32 54h7v-8"/>',
    noneu: '<circle class="tb sb" cx="32" cy="32" r="23"/><path class="sa" d="M9 32a23 8 0 0 0 46 0M32 9a8 23 0 0 0 0 46"/><path class="sc" d="M22 20 45 26 36 47z"/>',
    // Chapter 4 — Congruent Triangles
    sum: '<path class="tb sa" d="M32 12 55 50H9z"/><path class="sc" d="M26 24a8 8 0 0 0 12 0M15 42a8 8 0 0 0 3-6M49 42a8 8 0 0 1-3-6"/><path class="sw" d="M6 56H58"/>',
    cfig: '<path class="tb sa" d="M5 48 14 18 26 48z"/><path class="tb sb" d="M38 48 47 18 59 48z"/><path class="sc" d="M28 31h8M28 37h8"/>',
    sss: '<path class="tb sa" d="M32 9 57 51H7z"/><path class="sc" d="M15.6 28.6 22.4 32.6M48.4 28.6 41.6 32.6M45 28l-6.4 3.8"/><path class="sw" d="M28 46v10M32 46v10M36 46v10"/>',
    asa: '<path class="tb sa" d="M8 50 50 50 30 12z"/><path class="sc" d="M18 50a10 10 0 0 0-3-7M42 50a10 10 0 0 1 3-7"/><path class="sw" d="M29 45v10"/><circle class="fb" cx="30" cy="12" r="3.4"/>',
    sas: '<path class="tb sa" d="M9 52V13L55 52z"/><path class="sw" d="M9 43h9v9"/><path class="sc" d="M4 32h10M30 33l5-2.8M31 38l5-2.8"/>',
    cpctc: '<path class="tb sa" d="M5 46 11 16 25 46z"/><path class="tb sb" d="M39 46 53 16 59 46z"/><path class="sc dsh" d="M11 16 53 16M5 46 59 46M25 46 39 46"/>',
    iso: '<path class="tb sa" d="M32 8 55 52H9z"/><path class="sc" d="M17 28.6 23.4 32.2M46.6 28.6 40.2 32.2"/><path class="sw" d="M16 46a9 9 0 0 0 6-6M48 46a9 9 0 0 1-6-6"/>',
    ctr: '<path class="tb sa" d="M5 48 9 16 26 48z"/><path class="sw dsh" d="M32 8v48"/><path class="tb sb" d="M59 48 55 16 38 48z"/>',
    // Grade 1 Math — Where Is Moti?
    g1: '<path class="tb sw" d="M12 48C9 38 9 26 15 16l11 7a21 21 0 0 1 12 0l11-7c6 10 6 22 3 32z"/><circle class="fc" cx="24" cy="34" r="3"/><circle class="fc" cx="40" cy="34" r="3"/><path class="sc" d="M28 42q4 3 8 0"/><path class="sb" d="M8 38 17 40M8 45 17 44M56 38 47 40M56 45 47 44"/>',
    onunder: '<path class="sw" d="M9 30H55M17 30V51M47 30V51"/><circle class="fc" cx="32" cy="19" r="6"/><circle class="fa" cx="32" cy="43" r="5.5"/>',
    inout: '<path class="sw" d="M8 22V50H34V22"/><path class="sb" d="M8 22 4 16M34 22 38 16"/><circle class="fc" cx="21" cy="40" r="6"/><circle class="fa" cx="49" cy="43" r="6"/>',
    abovebelow: '<path class="sw" d="M9 32H55"/><circle class="fc" cx="32" cy="14" r="6"/><circle class="fa" cx="32" cy="50" r="6"/><path class="sb" d="M32 22V27M32 37V42"/>',
    topbottom: '<rect class="tc sc" x="12" y="8" width="40" height="13" rx="4"/><rect class="tb sw" x="12" y="25" width="40" height="13" rx="4"/><rect class="ta sa" x="12" y="42" width="40" height="13" rx="4"/>',
    train: '<path class="tb sw" d="M5 28H24V46H5z"/><path class="sw" d="M9 22H17V28"/><path class="tc sc" d="M27 32H58V46H27z"/><path class="sa" d="M33 32V46M43 32V46M52 32V46"/><circle class="fw" cx="12" cy="50" r="4"/><circle class="fw" cx="36" cy="50" r="4"/><circle class="fw" cx="50" cy="50" r="4"/><path class="sb" d="M12 14q2-4 5 0"/>',
    sort: '<circle class="fa" cx="16" cy="18" r="6"/><circle class="fa" cx="30" cy="22" r="6"/><circle class="fc" cx="16" cy="44" r="6"/><circle class="fc" cx="30" cy="48" r="6"/><circle class="fb" cx="48" cy="20" r="6"/><circle class="fb" cx="50" cy="42" r="6"/><path class="sw dsh" d="M8 32H56M40 8V56"/>',
    room: '<path class="sw" d="M6 46H58M6 30V52M58 40V52"/><rect class="tb sb" x="10" y="30" width="48" height="12" rx="4"/><circle class="fc" cx="46" cy="16" r="6"/><path class="sg" d="M20 20l5 5 9-10"/>',
    // Precalculus — the twelve units
    pcfx: '<path class="tb sa" d="M18 19h28v26H18z"/><path class="sw" d="M5 32h11M46 32h12M53 27l5 5-5 5"/><circle class="fc" cx="32" cy="32" r="4.2"/>',
    pcline: '<path class="sw" d="M10 54V10M10 54H56"/><path class="sa" d="M14 48 54 16"/><circle class="fc" cx="26" cy="38.4" r="3.6"/><circle class="fb" cx="42" cy="25.6" r="3.6"/>',
    pcpoly: '<path class="sw" d="M8 32H56"/><path class="sa" d="M9 50C23 58 25 10 35 30S49 8 56 16"/><circle class="fc" cx="35" cy="30" r="3.4"/>',
    pcexp: '<path class="sw" d="M10 54V10M10 54H56"/><path class="sb" d="M12 50C28 49 40 40 52 12"/><circle class="fc" cx="52" cy="12" r="3.6"/>',
    pcang: '<circle class="tb sb" cx="32" cy="32" r="22"/><path class="sw" d="M32 32H54"/><path class="sc" d="M32 32 47.5 16.5"/><path class="sa" d="M43 32a11 11 0 0 0-3.2-7.8"/>',
    pcwave: '<path class="sw" d="M6 32H58"/><path class="sa" d="M6 32C11 14 19 14 24 32S37 50 42 32 53 14 58 28"/>',
    pcid: '<path class="sw" d="M14 40h36M14 51h36"/><path class="sa" d="M9 24C15 8 22 8 28 24S40 40 46 24 52 13 56 16"/>',
    pcpolar: '<circle class="sa" cx="32" cy="32" r="22"/><circle class="sa dsh" cx="32" cy="32" r="11"/><path class="sw" d="M32 8V56M8 32H56"/><path class="sc" d="M32 32 47 17"/><circle class="fc" cx="47" cy="17" r="4"/>',
    pcsys: '<path class="sw" d="M10 54V10M10 54H56"/><path class="sa" d="M14 20 54 46"/><path class="sb" d="M14 46 54 18"/><circle class="fc" cx="34" cy="33" r="4.6"/>',
    pcconic: '<ellipse class="tb sb" cx="32" cy="32" rx="25" ry="15"/><circle class="fc" cx="20" cy="32" r="3.2"/><circle class="fc" cx="44" cy="32" r="3.2"/>',
    pcseq: '<circle class="fa" cx="12" cy="48" r="4"/><circle class="fa" cx="24" cy="42" r="4"/><circle class="fb" cx="36" cy="32" r="4"/><circle class="fc" cx="48" cy="18" r="4"/><path class="sw dsh" d="M10 52 52 14"/>',
    pclim: '<path class="sa" d="M8 52C20 50 28 36 30 28"/><path class="sa" d="M35 25C41 20 50 14 58 12"/><circle class="sc" cx="32.5" cy="26.5" r="3.6"/>',
    // Precalculus — Unit 1 lessons
    fxrel: '<ellipse class="tb sb" cx="17" cy="32" rx="8" ry="19"/><ellipse class="tc sc" cx="47" cy="32" rx="8" ry="19"/><path class="sw" d="M21 22 43 22M21 32 43 38M21 44 43 38"/>',
    fxread: '<path class="sw" d="M10 54V10M10 54H56"/><path class="sa" d="M12 46C24 46 28 22 54 16"/><path class="sc dsh" d="M34 54V28M10 28H34"/><circle class="fc" cx="34" cy="28" r="3.6"/>',
    fxline: '<path class="sa" d="M8 46C20 46 22 14 32 14S44 46 56 46"/><path class="sc" d="M14 28H50"/><path class="sw dsh" d="M20 8V56"/><circle class="fc" cx="22.6" cy="28" r="3.2"/><circle class="fc" cx="41.4" cy="28" r="3.2"/>',
    fxtool: '<path class="sa" d="M6 46C12 46 12 18 20 18S28 46 34 46"/><path class="sb" d="M32 50 58 14"/><path class="sc" d="M38 24 46 44 54 24"/>',
    fxint: '<path class="sw" d="M6 40H58"/><path class="sa" d="M20 40H44"/><path class="sc" d="M20 28v24M20 28h6M20 52h6"/><circle class="sb" cx="46" cy="40" r="4.2"/>',
    fxdom: '<path class="sw" d="M12 32h40"/><circle class="fa" cx="32" cy="19" r="4.4"/><circle class="fc" cx="32" cy="45" r="4.4"/><path class="sc" d="M22 52 42 12"/>',
    fxdr: '<path class="sw" d="M10 54V10M10 54H56"/><path class="sa" d="M16 44C24 20 40 20 50 36"/><path class="sb" d="M16 58H50"/><path class="sc" d="M5 20V44"/>',
    fxpw: '<path class="sw" d="M8 56V10M8 56H58"/><path class="sa" d="M12 44 32 24"/><path class="sa" d="M32 18 54 40"/><circle class="sa" cx="32" cy="24" r="3.4"/><circle class="fc" cx="32" cy="18" r="3.4"/>',
    fxarc: '<path class="sw" d="M10 54V10M10 54H56"/><path class="sa" d="M12 50C26 50 34 30 52 14"/><path class="sc" d="M20 54 56 18"/><circle class="fb" cx="26" cy="44" r="3.4"/><circle class="fb" cx="46" cy="22" r="3.4"/>',
    fxinc: '<path class="sw" d="M6 54H58"/><path class="sa" d="M8 48C16 18 22 12 30 26S42 52 50 40 56 24 58 20"/><circle class="fc" cx="19" cy="17" r="3.4"/><circle class="fb" cx="40" cy="46" r="3.4"/>',
    fxcomb: '<path class="sa" d="M8 20C16 40 24 40 30 20"/><path class="sw" d="M32 31h6M35 28v6"/><path class="sb" d="M38 44H58"/><path class="sc" d="M12 52H52"/>',
    fxcomp: '<path class="tb sa" d="M6 20h18v24H6z"/><path class="tc sc" d="M38 20h18v24H38z"/><path class="sw" d="M24 32h14M34 27l5 5-5 5"/>',
    fxtab: '<rect class="tb sa" x="8" y="12" width="48" height="40" rx="6"/><path class="sa" d="M8 26H56M28 12V52"/><path class="sw" d="M14 19h8M34 19h16M14 38h8M34 38h16"/>',
    fxdec: '<rect class="tc sc" x="6" y="8" width="52" height="48" rx="8"/><rect class="tb sa" x="18" y="20" width="28" height="24" rx="6"/><circle class="fw" cx="32" cy="32" r="4"/>',
    fxshift: '<path class="sa dsh" d="M8 46C14 46 14 24 22 24S30 46 36 46"/><path class="sb" d="M28 34C34 34 34 12 42 12S50 34 56 34"/><path class="sw" d="M24 52l14-14M38 44v-6h-6"/>',
    fxref: '<path class="sw dsh" d="M6 32H58"/><path class="sa" d="M10 28C20 28 26 16 40 10"/><path class="sc" d="M10 36C20 36 26 48 40 54"/>',
    fxstr: '<path class="sa dsh" d="M10 52C20 52 22 36 32 36S44 52 54 52"/><path class="sb" d="M10 52C18 52 20 14 32 14S46 52 54 52"/><path class="sw" d="M32 40V20M28 24l4-5 4 5"/>',
    fxeo: '<path class="sw dsh" d="M32 6V58"/><path class="sa" d="M32 46C26 46 20 40 12 12"/><path class="sa" d="M32 46C38 46 44 40 52 12"/><circle class="fc" cx="18" cy="26" r="3.2"/><circle class="fc" cx="46" cy="26" r="3.2"/>',
    fxabs: '<path class="sw" d="M10 54V10M10 54H56"/><path class="sa" d="M14 14 32 46 50 14"/><circle class="fc" cx="32" cy="46" r="3.8"/>',
    fxabsq: '<path class="sw" d="M6 44H58"/><path class="sa" d="M14 14 32 44 50 14"/><path class="sc dsh" d="M10 28H54"/><circle class="fc" cx="23" cy="28" r="3.2"/><circle class="fc" cx="41" cy="28" r="3.2"/>',
    fxinv: '<path class="sw dsh" d="M8 56 56 8"/><path class="sa" d="M10 50C26 50 38 40 54 12"/><path class="sc" d="M50 10C40 26 30 38 12 54"/>',
    // Ways of ending a unit
    quiz: '<circle class="sb" cx="32" cy="32" r="23"/><circle class="sa" cx="32" cy="32" r="14"/><circle class="fc" cx="32" cy="32" r="5.2"/>',
    test: '<path class="tc sc" d="M20 9h24v15a12 12 0 0 1-24 0z"/><path class="sc" d="M20 14h-8c0 9 4 13 10 14M44 14h8c0 9-4 13-10 14M32 36v10M22 55h20"/>',
    ready: '<rect class="tb sa" x="12" y="7" width="40" height="50" rx="9"/><path class="sg" d="M20 22l4 4 8-9M20 40l4 4 8-9"/><path class="sw" d="M39 24h6M39 42h6"/>'
  };
  window.KERN_ART = {
    has: function (k) { return !!G[k]; },
    svg: function (k) { return '<svg viewBox="0 0 64 64" aria-hidden="true">' + G[k] + "</svg>"; },
    pad: function (k, n) {
      return '<span class="kp-pad' + (G[k] ? "" : " plain") + '">' + (G[k] ? window.KERN_ART.svg(k) : "<b>" + (n == null ? "" : n) + "</b>") + "</span>";
    },
    keys: Object.keys(G)
  };

  document.title = "Kern — learn by doing";
  var meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", "Kern — courses you work through by solving. No classroom, no grades.");
  var name = document.querySelector(".lx-name");
  if (name) name.textContent = "Kern";

  // The welcome page, before sign-in, is kern-front.js.
})();
