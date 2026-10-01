/* Captures the REAL OEdu student screens for the product animation.

   Run against a LOCAL stack only, signed in as a made-up student (never a real
   one — the film is shown to the public):

     node capture.js <creds.json> <outDir>

   creds.json is {"email": "...", "password": "..."} for a demo student on the
   local API (http://localhost:8787); the static site is on http://localhost:8123.
   It writes, per screen, a full 2x screenshot and a crop of each named card,
   plus shots.json with every box, which index.html reads. Re-run it after the
   app's look changes and the film picks up the new screens.               */
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const [credsPath, outDir] = process.argv.slice(2);
const creds = JSON.parse(fs.readFileSync(credsPath));
fs.mkdirSync(outDir, { recursive: true });
const SITE = 'http://localhost:8123/learn/student/';

// the cards to lift out of each screen, found by a phrase inside them
const SCREENS = [
  { id: 'home',    go: '',                       cards: { standing: 'Your standing', week: 'This week', school: 'Set by your teachers' } },
  { id: 'school',  go: 'School',                 cards: { course: 'English Language Arts' } },
  { id: 'grades',  go: 'Grades',                 cards: { average: 'Average this year', classes: 'This year’s classes', todo: 'To do' } },
  { id: 'explore', go: 'Explore',                cards: { c1: 'Seeing numbers', c2: 'Algebra I', c3: '8th Grade Math' } },
  { id: 'unit',    go: 'Math/Geometry/u1',       cards: { mastery: 'Unit mastery', next: 'Up next for you' } },
  { id: 'lesson',  go: 'Math/Geometry/u1', click: 'Go', wait: 1800, cards: { step: 'A three-legged stool', side: 'Points, lines and planes', diagA: { sel: 'svg.lf-svg', nth: 0, r: 14 }, diagB: { sel: 'svg.lf-svg', nth: 1, r: 14 } } }
];

// or a box by selector, for things with no rounded card of their own (a figure)
async function boxBySel(page, spec) {
  return page.evaluate(({ sel, nth, r }) => {
    const e = document.querySelectorAll(sel)[nth]; if (!e) return null;
    const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, r };
  }, spec);
}

// the smallest rounded, filled box that contains the phrase
async function boxOf(page, phrase) {
  return page.evaluate(phrase => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n, best = null;
    while ((n = w.nextNode())) {
      if (!n.textContent.replace(/[’‘]/g, "'").includes(phrase.replace(/[’‘]/g, "'"))) continue;
      let e = n.parentElement;
      while (e && e !== document.body) {
        const cs = getComputedStyle(e), r = e.getBoundingClientRect();
        const rad = parseFloat(cs.borderTopLeftRadius) || 0;
        if (rad >= 10 && r.width >= 180 && r.height >= 60 && r.width < 1300) { best = { x: r.x, y: r.y, width: r.width, height: r.height, r: rad }; break; }
        e = e.parentElement;
      }
      if (best) break;
    }
    return best ? { x: best.x, y: best.y, w: best.width, h: best.height, r: best.r } : null;
  }, phrase);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const r = await ctx.request.post('http://localhost:8787/api/v1/auth/login', { data: creds });
  if (!r.ok()) throw new Error('sign-in failed: ' + r.status());
  const page = await ctx.newPage();
  const manifest = {};
  for (const s of SCREENS) {
    await page.goto(SITE + s.go, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    if (s.click) { await page.getByText(s.click, { exact: true }).first().click(); await page.waitForTimeout(s.wait || 1500); }
    await page.waitForTimeout(4500);                       // let any toast go
    await page.screenshot({ path: path.join(outDir, s.id + '.png') });
    const entry = { file: s.id + '.png', w: 1440, h: 900, cards: {} };
    await page.setViewportSize({ width: 1440, height: 1500 });   // crops only: nothing cut off by the screen's edge
    await page.waitForTimeout(700);
    for (const [name, phrase] of Object.entries(s.cards)) {
      const b = typeof phrase === 'string' ? await boxOf(page, phrase) : await boxBySel(page, phrase);
      if (!b) { console.log('  (no box for', s.id, name, ')'); continue; }
      const pad = 0;
      await page.screenshot({ path: path.join(outDir, `${s.id}-${name}.png`), clip: { x: b.x - pad, y: b.y - pad, width: b.w + pad * 2, height: b.h + pad * 2 } });
      entry.cards[name] = { file: `${s.id}-${name}.png`, x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.w), h: Math.round(b.h), r: Math.round(b.r) };
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    manifest[s.id] = entry;
    console.log(s.id, Object.keys(entry.cards).join(', '));
  }
  fs.writeFileSync(path.join(outDir, 'shots.json'), JSON.stringify(manifest, null, 1));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
