/* Reads the redesign's storyboard (the top of ../v2/index.html) and writes film2.json —
   every keyframe, card, caption and label worked out — for build-film2.jsx.
     node ae/export-film2.js                                                          */
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'v2', 'index.html'), 'utf8');
const M = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'shots', 'shots.json'), 'utf8'));
const a = html.indexOf('const BPM = 120'), b = html.indexOf('/* ================================ the engine');
const fill = (keys, d) => { let p = { ...d }; return keys.map(k => { p = { ...p, ...k }; return { ...p, e: k.e || 'io' }; }); };
const S = new Function(html.slice(a, b) + '; return { BPM, BEAT, BAR, B, END, PANES, HOLD, CAMERA, PANE_KEYS, FALL, CARDS, GHOSTS, LABELS, TYPE, CHAPTERS, ORB, TAPS, OUTRO };')();
const out = {
  fps: 30, end: S.END, bpm: S.BPM, hold: S.HOLD,
  panes: S.PANES.map((p, i) => ({ ...p, file: M[p.id].file, ghost: S.GHOSTS[i][0],
    keys: fill((S.PANE_KEYS[p.id] || []).concat(S.FALL(i)), { o: 1, s: 1, dz: 0, rz: 0, bl: 0 }) })),
  cards: S.CARDS.map(c => { const m = M[c.scr].cards[c.name];
    return { id: c.id, pane: c.pane, file: m.file, x: m.x, y: m.y, w: m.w, h: m.h, r: m.r, keys: fill(c.keys, { dz: 0, dx: 0, dy: 0, s: 1, ry: 0, rz: 0 }) }; }),
  camera: fill(S.CAMERA, { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 }),
  labels: S.LABELS, type: S.TYPE, chapters: S.CHAPTERS, orb: S.ORB, taps: S.TAPS, outro: S.OUTRO,
  markPath: (html.match(/d: '(M 77\.929688[^']+)'/) || [])[1]
};
fs.writeFileSync(path.join(__dirname, 'film2.json'), JSON.stringify(out, null, 1));
console.log('film2.json:', out.panes.length, 'panes,', out.cards.length, 'cards,', out.labels.length, 'labels,', out.type.length, 'type blocks,', S.END + 's');
