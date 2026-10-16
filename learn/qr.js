/* ==========================================================================
   OEdu — a QR code, made here.

   A label on a door that says "scan to report a problem" needs a code that
   reads on any phone, and the school's pages should not call another site to
   draw one: the address of a room is the school's business. So the encoder is
   this file — byte mode, error correction L or M, any size up to version 40 —
   and it draws SVG, so a printed label is sharp at any size.

   OPLO_QR.svg("https://…", { px: 160, level: "M" })  → an <svg> string
   OPLO_QR.matrix("https://…", "M")                   → rows of true/false
   ========================================================================== */
(function (root) {
  "use strict";

  /* Per version 1..40: error-correction codewords in each block, and how many
     blocks there are. The standard's table, level L then M. */
  var PER_BLOCK = {
    L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28]
  };
  var BLOCKS = {
    L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49]
  };
  var LEVEL_BITS = { L: 1, M: 0 };

  function rawModules(v) {
    var r = (16 * v + 128) * v + 64;
    if (v >= 2) {
      var n = Math.floor(v / 7) + 2;
      r -= (25 * n - 10) * n - 55;
      if (v >= 7) r -= 36;
    }
    return r;
  }
  function dataWords(v, lv) {
    return Math.floor(rawModules(v) / 8) - PER_BLOCK[lv][v] * BLOCKS[lv][v];
  }

  /* ---- Reed–Solomon over GF(256), polynomial x^8+x^4+x^3+x^2+1 */
  function gmul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xff;
  }
  function divisor(degree) {
    var r = [], i, j;
    for (i = 0; i < degree - 1; i++) r.push(0);
    r.push(1);
    var root = 1;
    for (i = 0; i < degree; i++) {
      for (j = 0; j < r.length; j++) {
        r[j] = gmul(r[j], root);
        if (j + 1 < r.length) r[j] ^= r[j + 1];
      }
      root = gmul(root, 2);
    }
    return r;
  }
  function remainder(data, div) {
    var r = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ r.shift();
      r.push(0);
      div.forEach(function (c, i) { r[i] ^= gmul(c, f); });
    });
    return r;
  }

  function utf8(s) {
    var u = unescape(encodeURIComponent(String(s))), out = [];
    for (var i = 0; i < u.length; i++) out.push(u.charCodeAt(i));
    return out;
  }

  /* Text → the codewords of a symbol: header, data, padding, then each block
     with its error correction, interleaved. */
  function codewords(text, lv) {
    var bytes = utf8(text), v, cc;
    for (v = 1; v <= 40; v++) {
      cc = v <= 9 ? 8 : 16;
      if (bytes.length < (1 << cc) && 4 + cc + bytes.length * 8 <= dataWords(v, lv) * 8) break;
    }
    if (v > 40) throw new Error("That is too long for a QR code.");
    var bits = [];
    function put(val, n) { for (var i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4); put(bytes.length, cc);
    bytes.forEach(function (b) { put(b, 8); });
    var cap = dataWords(v, lv) * 8;
    put(0, Math.min(4, cap - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
    var data = [];
    for (var i = 0; i < bits.length; i += 8) {
      var b = 0;
      for (var k = 0; k < 8; k++) b = (b << 1) | bits[i + k];
      data.push(b);
    }

    var nb = BLOCKS[lv][v], ecw = PER_BLOCK[lv][v], raw = Math.floor(rawModules(v) / 8);
    var shortN = nb - raw % nb, shortLen = Math.floor(raw / nb), div = divisor(ecw), blocks = [], pos = 0;
    for (i = 0; i < nb; i++) {
      var len = shortLen - ecw + (i < shortN ? 0 : 1);
      var dat = data.slice(pos, pos + len);
      pos += len;
      var e = remainder(dat, div);
      if (i < shortN) dat.push(0);
      blocks.push(dat.concat(e));
    }
    var out = [];
    for (i = 0; i < blocks[0].length; i++) {
      for (var j = 0; j < blocks.length; j++) {
        if (i !== shortLen - ecw || j >= shortN) out.push(blocks[j][i]);
      }
    }
    return { version: v, words: out };
  }

  function alignAt(v) {
    if (v === 1) return [];
    var n = Math.floor(v / 7) + 2, size = v * 4 + 17;
    var step = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2;
    var r = [6];
    for (var p = size - 7; r.length < n; p -= step) r.splice(1, 0, p);
    return r;
  }

  var MASKS = [
    function (x, y) { return (x + y) % 2 === 0; },
    function (x, y) { return y % 2 === 0; },
    function (x, y) { return x % 3 === 0; },
    function (x, y) { return (x + y) % 3 === 0; },
    function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
    function (x, y) { return x * y % 2 + x * y % 3 === 0; },
    function (x, y) { return (x * y % 2 + x * y % 3) % 2 === 0; },
    function (x, y) { return ((x + y) % 2 + x * y % 3) % 2 === 0; }
  ];

  function draw(v, words, lv, mask) {
    var size = v * 4 + 17, m = [], fn = [], x, y, i;
    for (y = 0; y < size; y++) { m.push([]); fn.push([]); for (x = 0; x < size; x++) { m[y].push(false); fn[y].push(false); } }
    function set(px, py, dark) { m[py][px] = dark; fn[py][px] = true; }
    function bit(n, k) { return ((n >>> k) & 1) !== 0; }

    for (i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = cx + dx, yy = cy + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) set(xx, yy, d !== 2 && d !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var al = alignAt(v), n = al.length;
    for (i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) set(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    // format information, twice, with the dark module
    var data = (LEVEL_BITS[lv] << 3) | mask, rem = data;
    for (i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    var fb = ((data << 10) | rem) ^ 0x5412;
    for (i = 0; i <= 5; i++) set(8, i, bit(fb, i));
    set(8, 7, bit(fb, 6)); set(8, 8, bit(fb, 7)); set(7, 8, bit(fb, 8));
    for (i = 9; i < 15; i++) set(14 - i, 8, bit(fb, i));
    for (i = 0; i < 8; i++) set(size - 1 - i, 8, bit(fb, i));
    for (i = 8; i < 15; i++) set(8, size - 15 + i, bit(fb, i));
    set(8, size - 8, true);
    if (v >= 7) {
      rem = v;
      for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
      var vb = (v << 12) | rem;
      for (i = 0; i < 18; i++) {
        var a = size - 11 + i % 3, b = Math.floor(i / 3);
        set(a, b, bit(vb, i)); set(b, a, bit(vb, i));
      }
    }
    // the data, in the two-column zigzag the standard describes
    var k = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var jj = 0; jj < 2; jj++) {
          var xx = right - jj, up = ((right + 1) & 2) === 0, yy = up ? size - 1 - vert : vert;
          if (!fn[yy][xx] && k < words.length * 8) { m[yy][xx] = bit(words[k >>> 3], 7 - (k & 7)); k++; }
        }
      }
    }
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (!fn[y][x] && MASKS[mask](x, y)) m[y][x] = !m[y][x];
    return m;
  }

  /* How badly a pattern is likely to confuse a reader: long runs, blocks,
     things that look like a finder, and an unbalanced mix. The lowest wins. */
  function penalty(m) {
    var size = m.length, score = 0, x, y, run, dark = 0;
    function line(get) {
      var s = 0, r = 1, i, bitsStr = "";
      for (i = 0; i < size; i++) {
        bitsStr += get(i) ? "1" : "0";
        if (i > 0 && get(i) === get(i - 1)) { r++; if (r === 5) s += 3; else if (r > 5) s++; } else r = 1;
      }
      var p = bitsStr, k = 0, a;
      while ((a = p.indexOf("10111010000", k)) !== -1) { s += 40; k = a + 1; }
      k = 0;
      while ((a = p.indexOf("00001011101", k)) !== -1) { s += 40; k = a + 1; }
      return s;
    }
    for (y = 0; y < size; y++) { score += line(function (i) { return m[y][i]; }); }
    for (x = 0; x < size; x++) { score += line(function (i) { return m[i][x]; }); }
    for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) {
      if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) score += 3;
    }
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (m[y][x]) dark++;
    run = Math.ceil(Math.abs(dark * 20 - size * size * 10) / (size * size)) - 1;
    return score + run * 10;
  }

  function matrix(text, level) {
    var lv = level === "L" ? "L" : "M";
    var c = codewords(text, lv), best = null;
    for (var mask = 0; mask < 8; mask++) {
      var m = draw(c.version, c.words, lv, mask), p = penalty(m);
      if (!best || p < best.p) best = { m: m, p: p };
    }
    return best.m;
  }

  /* An <svg> string: dark modules as one path, a four-module quiet zone. */
  function svg(text, o) {
    o = o || {};
    var m = matrix(text, o.level), size = m.length, q = 4, d = [], x, y;
    for (y = 0; y < size; y++) {
      for (x = 0; x < size; x++) {
        if (!m[y][x]) continue;
        var s = x;
        while (x + 1 < size && m[y][x + 1]) x++;
        d.push("M" + (s + q) + "," + (y + q) + "h" + (x - s + 1) + "v1h-" + (x - s + 1) + "z");
      }
    }
    var t = size + q * 2, px = o.px || 160;
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + t + " " + t + "' width='" + px + "' height='" + px +
      "' shape-rendering='crispEdges' role='img' aria-label='QR code'><rect width='" + t + "' height='" + t + "' fill='#fff'/><path d='" +
      d.join("") + "' fill='#000'/></svg>";
  }

  root.OPLO_QR = { svg: svg, matrix: matrix };
})(typeof window !== "undefined" ? window : globalThis);
