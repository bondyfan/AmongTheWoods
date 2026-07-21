// Generate the PWA icons with no image deps — hand-rasterize an RGBA buffer
// (forest scene: green gradient sky, dark hills, a pine tree) and encode PNG.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const crcTable = (() => { const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t; })();
function crc32(buf) { let c = ~0; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return ~c >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function png(W, H, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit, RGBA
  const raw = Buffer.alloc(H * (W * 4 + 1));
  for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; rgba.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4); }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function draw(S, pad) {
  const buf = Buffer.alloc(S * S * 4);
  const set = (x, y, r, g, b, a = 255) => { if (x < 0 || y < 0 || x >= S || y >= S) return;
    const i = (y * S + x) * 4; buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = a; };
  const lerp = (a, b, t) => a + (b - a) * t;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    // rounded-square mask (safe zone) — outside stays transparent
    const m = pad; const inside = x >= m && y >= m && x < S - m && y < S - m;
    if (!inside) { set(x, y, 0, 0, 0, 0); continue; }
    const ty = (y - m) / (S - 2 * m);
    // sky gradient: teal-green top → deep forest green bottom
    let r = lerp(0x2e, 0x0f, ty), g = lerp(0x5a, 0x2e, ty), b = lerp(0x3a, 0x14, ty);
    set(x, y, r|0, g|0, b|0, 255);
  }
  // ground hills
  const horizon = S * 0.72;
  for (let y = Math.floor(horizon); y < S - pad; y++) for (let x = pad; x < S - pad; x++) {
    const i = (y * S + x) * 4; if (buf[i+3] === 0) continue;
    buf[i] = 0x1c; buf[i+1] = 0x36; buf[i+2] = 0x1a;
  }
  // a centered pine: stacked triangles + trunk
  const cx = S / 2;
  const trunkW = S * 0.05, trunkTop = S * 0.66, trunkBot = S * 0.74;
  for (let y = trunkTop; y < trunkBot; y++) for (let x = cx - trunkW/2; x < cx + trunkW/2; x++) set(x|0, y|0, 0x5c, 0x3f, 0x22);
  const tiers = [[0.20, 0.44, 0.30], [0.30, 0.58, 0.24], [0.40, 0.70, 0.16]];
  for (const [topY, botY, halfW] of tiers) {
    const t0 = S * topY, t1 = S * botY, hw = S * halfW;
    for (let y = t0; y < t1; y++) {
      const k = (y - t0) / (t1 - t0);
      const w = hw * k;
      for (let x = cx - w; x < cx + w; x++) {
        const shade = 0.8 + 0.2 * ((x - (cx - w)) / (2*w || 1));
        set(x|0, y|0, (0x2f*shade)|0, (0x7a*shade)|0, (0x33*shade)|0);
      }
    }
  }
  // a warm moon/sun top-right
  const mx = S * 0.72, my = S * 0.26, mr = S * 0.07;
  for (let y = my - mr; y < my + mr; y++) for (let x = mx - mr; x < mx + mr; x++) {
    if ((x-mx)**2 + (y-my)**2 < mr*mr) set(x|0, y|0, 0xff, 0xf0, 0xc0);
  }
  return buf;
}

for (const [S, pad, name] of [[512, 0, 'icon-512.png'], [192, 0, 'icon-192.png'], [180, 0, 'icon-180.png'], [512, 52, 'icon-maskable-512.png']]) {
  writeFileSync(`public/icons/${name}`, png(S, S, draw(S, pad)));
  console.log('wrote public/icons/' + name);
}
