// Gleam — the photo engine. Takes a photo and its 478 face-mesh points
// (in pixels) and draws reshaping, skin retouching and makeup onto a canvas.

const GE = (() => {
  // Landmark indices on the MediaPipe face mesh. Side 0 is the eye on the
  // left of the photo, side 1 the one on the right.
  const I = {
    oval: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
    lipsOuter: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146],
    lipsInner: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95],
    sides: [
      { up: [33, 246, 161, 160, 159, 158, 157, 173, 133], low: [133, 155, 154, 153, 145, 144, 163, 7, 33], browUp: [70, 63, 105, 66, 107], browLow: [46, 53, 52, 65, 55], iris: 468, cheek: 50, bone: 116, edge: 234, mouth: 61, jaw: 172, temple: 54, nostril: 98, alar: 129, slim: [132, 58, 172, 136, 150] },
      { up: [263, 466, 388, 387, 386, 385, 384, 398, 362], low: [362, 382, 381, 380, 374, 373, 390, 249, 263], browUp: [300, 293, 334, 296, 336], browLow: [276, 283, 282, 295, 285], iris: 473, cheek: 280, bone: 345, edge: 454, mouth: 291, jaw: 397, temple: 284, nostril: 327, alar: 358, slim: [361, 288, 397, 365, 379] }
    ]
  };

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const mid = (a, b) => lerp(a, b, .5);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  // Smooth closed or open path through points
  function smoothPath(ctx, pts, closed = true) {
    const n = pts.length;
    if (closed) {
      const s = mid(pts[n - 1], pts[0]);
      ctx.moveTo(s.x, s.y);
      for (let i = 0; i < n; i++) { const m = mid(pts[i], pts[(i + 1) % n]); ctx.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y); }
      ctx.closePath();
    } else {
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < n - 1; i++) { const m = mid(pts[i], pts[i + 1]); ctx.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y); }
      ctx.lineTo(pts[n - 1].x, pts[n - 1].y);
    }
  }

  // Blur: the canvas filter where the browser has it, otherwise scale down and up
  const HAS_FILTER = (() => { try { const t = makeCanvas(1, 1).getContext('2d'); t.filter = 'blur(2px)'; return t.filter === 'blur(2px)'; } catch { return false; } })();
  function blur(src, r) {
    if (r < .6) return src;
    const W = src.width, H = src.height, out = makeCanvas(W, H), o = out.getContext('2d');
    if (HAS_FILTER) { o.filter = `blur(${r.toFixed(1)}px)`; o.drawImage(src, 0, 0); return out; }
    let cur = src;
    for (const f of [r / 1.1, r / 2.2]) {
      if (f < 1.2) continue;
      const w = Math.max(1, Math.round(W / f)), h = Math.max(1, Math.round(H / f));
      const s = makeCanvas(w, h), sc = s.getContext('2d');
      sc.imageSmoothingQuality = 'high'; sc.drawImage(cur, 0, 0, w, h);
      const up = makeCanvas(W, H), uc = up.getContext('2d');
      uc.imageSmoothingQuality = 'high'; uc.drawImage(s, 0, 0, W, H);
      cur = up;
    }
    o.drawImage(cur, 0, 0);
    return out;
  }

  // ---------- Reshape ----------

  // Local warps. "push" slides pixels along v; "bulge" magnifies around c.
  function warpControls(pts, s, faceW) {
    const C = [];
    const midX = pts[1].x;
    if (s.slim) for (const side of I.sides) for (const i of side.slim) {
      const p = pts[i], dx = midX - p.x, len = Math.hypot(dx, Math.abs(dx) * .15) || 1;
      C.push({ t: 'push', c: p, R: faceW * .2, vx: dx / len, vy: -Math.abs(dx) * .15 / len, str: s.slim * faceW * .04 });
    }
    if (s.eyes) for (const side of I.sides) {
      const eyeW = dist(pts[side.up[0]], pts[side.up[side.up.length - 1]]);
      const c = pts[side.iris] || mid(pts[side.up[0]], pts[side.up[side.up.length - 1]]);
      C.push({ t: 'bulge', c, R: eyeW * 1.05, k: s.eyes * .2 });
    }
    if (s.nose) for (const side of I.sides) for (const i of [side.alar, side.nostril]) {
      const p = pts[i], dx = pts[4].x - p.x;
      C.push({ t: 'push', c: p, R: faceW * .085, vx: Math.sign(dx), vy: 0, str: s.nose * faceW * .022 });
    }
    if (s.lips) {
      const c = mid(pts[13], pts[14]);
      C.push({ t: 'bulge', c, R: dist(pts[61], pts[291]) * .75, k: s.lips * .13 });
    }
    if (s.chin) C.push({ t: 'push', c: pts[152], R: faceW * .3, vx: 0, vy: 1, str: s.chin * faceW * .05 });
    for (const c of C) c.R2 = c.R * c.R;
    return C;
  }

  function displace(C, x, y) {
    let dx = 0, dy = 0;
    for (const c of C) {
      const rx = x - c.c.x, ry = y - c.c.y, r2 = rx * rx + ry * ry;
      if (r2 >= c.R2) continue;
      const f = (1 - r2 / c.R2) ** 2;
      if (c.t === 'push') { dx += c.vx * c.str * f; dy += c.vy * c.str * f; }
      else { dx += rx * c.k * f; dy += ry * c.k * f; }
    }
    return [dx, dy];
  }

  function warp(src, pts, s, faceW) {
    const C = warpControls(pts, s, faceW);
    if (!C.length) return { canvas: src, pts };
    const W = src.width, H = src.height;
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (const c of C) { x0 = Math.min(x0, c.c.x - c.R); y0 = Math.min(y0, c.c.y - c.R); x1 = Math.max(x1, c.c.x + c.R); y1 = Math.max(y1, c.c.y + c.R); }
    x0 = clamp(Math.floor(x0), 0, W - 1); y0 = clamp(Math.floor(y0), 0, H - 1); x1 = clamp(Math.ceil(x1), 0, W - 1); y1 = clamp(Math.ceil(y1), 0, H - 1);

    const out = makeCanvas(W, H), o = out.getContext('2d');
    o.drawImage(src, 0, 0);
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const sd = src.getContext('2d').getImageData(0, 0, W, H).data;
    const od = o.getImageData(x0, y0, bw, bh);
    const d = od.data;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const [dx, dy] = displace(C, x, y);
        if (Math.abs(dx) < .05 && Math.abs(dy) < .05) continue;
        const sx = clamp(x - dx, 0, W - 1.001), sy = clamp(y - dy, 0, H - 1.001);
        const ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy;
        const i00 = (iy * W + ix) * 4, i10 = i00 + 4, i01 = i00 + W * 4, i11 = i01 + 4;
        const k = ((y - y0) * bw + (x - x0)) * 4;
        for (let ch = 0; ch < 3; ch++) {
          d[k + ch] = (sd[i00 + ch] * (1 - fx) + sd[i10 + ch] * fx) * (1 - fy) + (sd[i01 + ch] * (1 - fx) + sd[i11 + ch] * fx) * fy;
        }
      }
    }
    o.putImageData(od, x0, y0);
    // Move the face points along with the pixels
    const moved = pts.map(p => {
      let q = p;
      for (let n = 0; n < 2; n++) { const [dx, dy] = displace(C, q.x, q.y); q = { x: p.x + dx, y: p.y + dy }; }
      return q;
    });
    return { canvas: out, pts: moved };
  }

  // ---------- Masks ----------

  function mask(W, H, r, draw) {
    const c = makeCanvas(W, H), ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    draw(ctx);
    return blur(c, r);
  }
  const poly = (pts, idx) => idx.map(i => pts[i]);
  function fillPoly(ctx, p) { ctx.beginPath(); smoothPath(ctx, p); ctx.fill(); }
  function ellipse(ctx, c, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(c.x, c.y, rx, ry, rot, 0, Math.PI * 2); ctx.fill(); }
  function softEllipse(ctx, c, rx, ry, rot = 0) {
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(rot); ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.55, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  function cut(target, by) { const t = target.getContext('2d'); t.globalCompositeOperation = 'destination-out'; t.drawImage(by, 0, 0); t.globalCompositeOperation = 'source-over'; return target; }
  function keep(target, by) { const t = target.getContext('2d'); t.globalCompositeOperation = 'destination-in'; t.drawImage(by, 0, 0); t.globalCompositeOperation = 'source-over'; return target; }

  // Brow lower edge height at a given x, for eyeshadow
  function browYAt(pts, idx, x) {
    const b = idx.map(i => pts[i]).sort((a, c) => a.x - c.x);
    if (x <= b[0].x) return b[0].y;
    if (x >= b[b.length - 1].x) return b[b.length - 1].y;
    for (let i = 0; i < b.length - 1; i++) if (x <= b[i + 1].x) return b[i].y + (b[i + 1].y - b[i].y) * (x - b[i].x) / (b[i + 1].x - b[i].x);
    return b[0].y;
  }

  const MASKS = {
    skin(pts, W, H, fw) {
      const m = mask(W, H, fw * .02, ctx => fillPoly(ctx, poly(pts, I.oval)));
      const holes = mask(W, H, fw * .012, ctx => {
        ctx.lineWidth = fw * .035;
        for (const s of I.sides) {
          const eye = [...poly(pts, s.up), ...poly(pts, s.low).slice(1, -1)];
          fillPoly(ctx, eye); ctx.beginPath(); smoothPath(ctx, eye); ctx.stroke();
          const brow = [...poly(pts, s.browUp), ...poly(pts, s.browLow).reverse()];
          fillPoly(ctx, brow); ctx.beginPath(); smoothPath(ctx, brow); ctx.stroke();
          ellipse(ctx, pts[s.nostril], fw * .03, fw * .02);
        }
        ctx.lineWidth = fw * .02;
        const lips = poly(pts, I.lipsOuter);
        fillPoly(ctx, lips); ctx.beginPath(); smoothPath(ctx, lips); ctx.stroke();
      });
      return cut(m, holes);
    },
    teeth(pts, W, H, fw) { return mask(W, H, fw * .004, ctx => fillPoly(ctx, poly(pts, I.lipsInner))); },
    lips(pts, W, H, fw) {
      const m = mask(W, H, fw * .006, ctx => fillPoly(ctx, poly(pts, I.lipsOuter)));
      return cut(m, mask(W, H, fw * .004, ctx => fillPoly(ctx, poly(pts, I.lipsInner))));
    },
    gloss(pts, W, H, fw, get) {
      const mw = dist(pts[61], pts[291]), lh = dist(pts[14], pts[17]);
      const m = mask(W, H, fw * .01, ctx => {
        softEllipse(ctx, lerp(pts[14], pts[17], .4), mw * .2, lh * .3);
        softEllipse(ctx, lerp(pts[0], pts[13], .55), mw * .12, lh * .18);
      });
      return keep(m, get('lips'));
    },
    shadow(pts, W, H, fw) {
      return mask(W, H, fw * .02, ctx => {
        for (const s of I.sides) {
          const lid = poly(pts, s.up);
          const eyeW = dist(lid[0], lid[lid.length - 1]);
          const out = Math.sign(lid[0].x - lid[lid.length - 1].x);
          const top = lid.map((p, i) => {
            const q = { x: p.x, y: p.y + (browYAt(pts, s.browLow, p.x) - p.y) * .55 };
            if (i === 0) { q.x += out * eyeW * .15; q.y -= eyeW * .05; }
            return q;
          });
          fillPoly(ctx, [...lid, ...top.reverse()]);
        }
      });
    },
    liner(pts, W, H, fw, get, opt) {
      const lw = fw * (opt === 'bold' ? .009 : .005);
      return mask(W, H, lw * .25, ctx => {
        ctx.lineWidth = lw;
        for (const s of I.sides) {
          const lid = poly(pts, s.up).reverse().map(p => ({ x: p.x, y: p.y - lw * .35 }));
          const eyeW = dist(lid[0], lid[lid.length - 1]);
          const outer = lid[lid.length - 1], dir = Math.sign(outer.x - lid[0].x);
          ctx.beginPath(); smoothPath(ctx, lid, false);
          if (opt === 'wing') ctx.lineTo(outer.x + dir * eyeW * .28, outer.y - eyeW * .16);
          ctx.stroke();
          if (opt === 'wing') {
            ctx.beginPath(); ctx.moveTo(lerp(lid[lid.length - 3], outer, .5).x, lerp(lid[lid.length - 3], outer, .5).y);
            ctx.lineTo(outer.x + dir * eyeW * .28, outer.y - eyeW * .16); ctx.lineTo(outer.x, outer.y + lw * .3); ctx.closePath(); ctx.fill();
          }
        }
      });
    },
    lashes(pts, W, H, fw) {
      const lw = fw * .012;
      return mask(W, H, fw * .003, ctx => {
        ctx.lineWidth = lw;
        for (const s of I.sides) {
          const lid = poly(pts, s.up).slice(0, 7).map(p => ({ x: p.x, y: p.y - lw * .45 }));
          ctx.beginPath(); smoothPath(ctx, lid, false); ctx.stroke();
        }
      });
    },
    contacts(pts, W, H, fw) {
      if (!pts[473]) return makeCanvas(W, H);
      const ring = mask(W, H, fw * .003, ctx => {
        for (const s of I.sides) {
          const c = pts[s.iris], r = dist(c, pts[s.iris + 1]);
          ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.arc(c.x, c.y, r * .38, 0, Math.PI * 2, true); ctx.fill('evenodd');
        }
      });
      return keep(ring, mask(W, H, 0, ctx => { for (const s of I.sides) fillPoly(ctx, [...poly(pts, s.up), ...poly(pts, s.low).slice(1, -1)]); }));
    },
    brows(pts, W, H, fw) {
      return mask(W, H, fw * .006, ctx => { for (const s of I.sides) fillPoly(ctx, [...poly(pts, s.browUp), ...poly(pts, s.browLow).reverse()]); });
    },
    blush(pts, W, H, fw) {
      return mask(W, H, fw * .02, ctx => {
        for (const s of I.sides) softEllipse(ctx, lerp(pts[s.cheek], pts[s.edge], .18), fw * .13, fw * .09, Math.atan2(pts[s.mouth].y - pts[s.edge].y, pts[s.mouth].x - pts[s.edge].x) * .5);
      });
    },
    contour(pts, W, H, fw, get) {
      const m = mask(W, H, fw * .035, ctx => {
        for (const s of I.sides) {
          const a = pts[s.edge], b = pts[s.mouth], ang = Math.atan2(b.y - a.y, b.x - a.x);
          const c = lerp(a, b, .3); c.y += fw * .015;
          ellipse(ctx, c, fw * .15, fw * .03, ang);
          ellipse(ctx, pts[s.jaw], fw * .11, fw * .025, Math.atan2(pts[152].y - pts[s.jaw].y, pts[152].x - pts[s.jaw].x));
          ellipse(ctx, lerp(pts[s.temple], pts[s.edge], .25), fw * .04, fw * .08);
        }
      });
      return keep(m, get('skin'));
    },
    highlight(pts, W, H, fw) {
      return mask(W, H, fw * .025, ctx => {
        ctx.lineWidth = fw * .03;
        ctx.beginPath(); ctx.moveTo(pts[168].x, pts[168].y); ctx.lineTo(pts[5].x, pts[5].y); ctx.stroke();
        for (const s of I.sides) ellipse(ctx, lerp(pts[s.bone], pts[s.up[0]], .25), fw * .07, fw * .022, Math.atan2(pts[s.up[0]].y - pts[s.bone].y, pts[s.up[0]].x - pts[s.bone].x));
        ellipse(ctx, pts[151], fw * .06, fw * .04);
        ellipse(ctx, lerp(pts[17], pts[152], .55), fw * .04, fw * .022);
      });
    }
  };

  // ---------- Skin ----------

  function retouch(src, pts, p, fw, get) {
    const sk = p.skin, t = p.teeth;
    if (!sk.smooth && !sk.bright && !sk.even && !sk.warmth && !t) return src;
    const W = src.width, H = src.height;
    const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
    const pad = fw * .05;
    const x0 = clamp(Math.floor(Math.min(...xs) - pad), 0, W - 1), y0 = clamp(Math.floor(Math.min(...ys) - pad), 0, H - 1);
    const x1 = clamp(Math.ceil(Math.max(...xs) + pad), 0, W - 1), y1 = clamp(Math.ceil(Math.max(...ys) + pad), 0, H - 1);
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const read = c => c.getContext('2d').getImageData(x0, y0, bw, bh).data;

    const out = makeCanvas(W, H), o = out.getContext('2d');
    o.drawImage(src, 0, 0);
    const img = o.getImageData(x0, y0, bw, bh), d = img.data;
    const sm = read(get('skin'));
    const small = (sk.smooth || sk.even) ? read(blur(src, fw * .011)) : null;
    const big = sk.even ? read(blur(src, fw * .045)) : null;
    const tm = t ? read(get('teeth')) : null;

    for (let k = 0; k < d.length; k += 4) {
      let r = d[k], g = d[k + 1], b = d[k + 2];
      const m = sm[k + 3] / 255;
      if (m > .01) {
        if (sk.smooth) {
          const diff = (Math.abs(r - small[k]) + Math.abs(g - small[k + 1]) + Math.abs(b - small[k + 2])) / 3;
          const w = m * sk.smooth * Math.max(0, 1 - diff / 32) * .92;
          r += (small[k] - r) * w; g += (small[k + 1] - g) * w; b += (small[k + 2] - b) * w;
        }
        if (sk.even) {
          const w = m * sk.even * .7;
          r += (big[k] - small[k]) * w; g += (big[k + 1] - small[k + 1]) * w; b += (big[k + 2] - small[k + 2]) * w;
        }
        if (sk.bright) { const w = m * sk.bright * .22; r += (255 - r) * w; g += (255 - g) * w; b += (255 - b) * w; }
        if (sk.warmth) { const w = m * sk.warmth * 12; r += w; g += w * .3; b -= w; }
      }
      if (tm && tm[k + 3] > 3) {
        const lum = .299 * r + .587 * g + .114 * b;
        const w = tm[k + 3] / 255 * t * clamp((lum - 60) / 60, 0, 1);
        if (w > 0) {
          r += (lum - r) * .7 * w; g += (lum - g) * .7 * w; b += (lum - b) * .7 * w;
          r += (255 - r) * .25 * w; g += (255 - g) * .25 * w; b += (255 - b) * .25 * w;
        }
      }
      d[k] = r; d[k + 1] = g; d[k + 2] = b;
    }
    o.putImageData(img, x0, y0);
    return out;
  }

  // ---------- Editor ----------

  // One photo being edited. Reshaping and skin work are cached, so moving a
  // makeup slider only redraws the makeup.
  function Editor(photo, landmarks) {
    const W = photo.width, H = photo.height;
    const base = landmarks;
    const faceW = dist(base[234], base[454]);
    let geo = null, skin = null;
    const scratch = makeCanvas(W, H), sc = scratch.getContext('2d');

    function geometry(p) {
      const key = JSON.stringify(p.shape);
      if (!geo || geo.key !== key) {
        const w = warp(photo, base, p.shape, faceW);
        const masks = {};
        const get = (name, opt) => {
          const k = name + (opt || '');
          if (!masks[k]) masks[k] = MASKS[name](w.pts, W, H, faceW, get, opt);
          return masks[k];
        };
        geo = { key, canvas: w.canvas, pts: w.pts, get };
        skin = null;
      }
      return geo;
    }

    function tint(out, m, color, mode, alpha) {
      if (alpha <= 0) return;
      sc.globalCompositeOperation = 'copy'; sc.drawImage(m, 0, 0);
      sc.globalCompositeOperation = 'source-in'; sc.fillStyle = color; sc.fillRect(0, 0, W, H);
      sc.globalCompositeOperation = 'source-over';
      out.save(); out.globalCompositeOperation = mode; out.globalAlpha = Math.min(1, alpha); out.drawImage(scratch, 0, 0); out.restore();
    }

    function render(target, p) {
      const g = geometry(p);
      const skey = JSON.stringify([p.skin, p.teeth]);
      if (!skin || skin.key !== skey) skin = { key: skey, canvas: retouch(g.canvas, g.pts, p, faceW, g.get) };
      if (target.width !== W || target.height !== H) { target.width = W; target.height = H; }
      const o = target.getContext('2d');
      o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1;
      o.drawImage(skin.canvas, 0, 0);
      const get = g.get;

      if (p.contour.amount) tint(o, get('contour'), '#6e4a3a', 'multiply', p.contour.amount * .45);
      if (p.contour.highlight) tint(o, get('highlight'), '#fff6ea', 'screen', p.contour.highlight * .35);
      if (p.blush.color) { tint(o, get('blush'), p.blush.color, 'multiply', p.blush.amount * .4); tint(o, get('blush'), p.blush.color, 'soft-light', p.blush.amount * .35); }
      if (p.shadow.color) { tint(o, get('shadow'), p.shadow.color, 'multiply', p.shadow.amount * .55); tint(o, get('shadow'), p.shadow.color, 'soft-light', p.shadow.amount * .45); }
      if (p.lashes) tint(o, get('lashes'), '#141010', 'multiply', p.lashes * .7);
      if (p.liner.color) tint(o, get('liner', p.liner.style), p.liner.color, 'source-over', p.liner.amount * .85);
      if (p.contacts.color) { tint(o, get('contacts'), p.contacts.color, 'color', p.contacts.amount * .75); tint(o, get('contacts'), p.contacts.color, 'soft-light', p.contacts.amount * .4); }
      if (p.brows.color) { tint(o, get('brows'), p.brows.color, 'multiply', p.brows.amount * .5); tint(o, get('brows'), p.brows.color, 'color', p.brows.amount * .35); }
      if (p.lips.color) {
        const m = get('lips'), a = p.lips.amount;
        tint(o, m, p.lips.color, 'color', a * .6);
        tint(o, m, p.lips.color, 'multiply', a * .3);
        tint(o, m, p.lips.color, 'source-over', a * (p.lips.finish === 'matte' ? .35 : .2));
        if (p.lips.finish !== 'matte') tint(o, get('gloss'), '#ffffff', 'screen', a * (p.lips.finish === 'gloss' ? .5 : .2));
      }
    }

    return { render, W, H };
  }

  return { Editor };
})();
