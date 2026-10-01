/* Reads the storyboard at the top of ../index.html (the web preview) and writes
   film.json — every keyframe, caption and card, already worked out — for
   build-film.jsx to turn into an After Effects project. One storyboard, two
   outputs, so they cannot drift apart.

     node ae/export-film.js                                             */
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'shots', 'shots.json'), 'utf8'));
const start = html.indexOf('const BPM = 100;'), end = html.indexOf('/* ========================= the engine');
const fill = (keys, d) => { let p = { ...d }; return keys.map(k => { p = { ...p, ...k }; return { ...p, e: k.e || 'io' }; }); };
const S = new Function(html.slice(start, end) + '; return { BPM, BAR, B, END, BRAND, CAPTIONS, OUTRO, SCREENS, SHOW, fade, WIN, CAMERA, IRIS, buildCards };')();
const cards = S.buildCards(manifest).map(c => {
  const m = manifest[c.scr].cards[c.name];
  return { id: c.scr + '-' + c.name, file: m.file, x: m.x, y: m.y, w: m.w, h: m.h, r: m.r, keys: fill(c.keys, { dx: 0, dy: 0, s: 1, o: 0, lift: 0 }) };
});
const out = {
  fps: 30, end: S.END, bpm: S.BPM, brand: S.BRAND, win: { x: S.WIN.x, y: S.WIN.y, w: S.WIN.w },
  screens: S.SCREENS.map(id => ({ id, file: manifest[id].file, keys: fill(S.fade(S.SHOW[id]), { o: 0 }) })),
  winKeys: fill(S.WIN.keys, { y: 0, s: 1, o: 1, dim: 0, blur: 0 }),
  camera: fill(S.CAMERA, { s: 1, x: 640, y: 380 }),
  iris: fill(S.IRIS, { r: 150 }),
  cards, captions: S.CAPTIONS, outro: S.OUTRO,
  markPath: (html.match(/d: '(M 77\.929688[^']+)'/) || [])[1]
};
fs.writeFileSync(path.join(__dirname, 'film.json'), JSON.stringify(out, null, 1));
console.log('film.json:', cards.length, 'cards,', out.captions.length, 'captions,', S.END + 's, mark path', out.markPath ? 'ok' : 'MISSING');
