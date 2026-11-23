// Contour — works out a face shape from MediaPipe's 478 face-mesh landmarks.
// Pure functions only (no DOM), so it can be checked outside the app.

const CS = (() => {
  // Landmark indices on the MediaPipe face mesh. "A" is the side on the left
  // of the photo, "B" the side on the right.
  const P = {
    top: 10, glabella: 9, noseTip: 1, chin: 152,
    eyeA: 33, eyeB: 263,
    foreA: 54, foreB: 284,       // upper forehead, at the temples
    cheekA: 234, cheekB: 454,    // cheekbones, the widest point
    jawA: 172, jawB: 397,        // jaw corners
    chinA: 150, chinB: 379       // lower jaw, either side of the chin
  };

  // Points around the edge of the face, used to draw the outline
  const OUTLINE = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];

  // Every point the result screen needs, saved with each scan
  const KEEP = [...new Set([...OUTLINE, ...Object.values(P)])].sort((a, b) => a - b);

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const deg = r => r * 180 / Math.PI;

  // Angle at b, in degrees, between the lines to a and to c
  function angleAt(a, b, c) {
    const v1 = { x: a.x - b.x, y: a.y - b.y }, v2 = { x: c.x - b.x, y: c.y - b.y };
    const cos = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y));
    return deg(Math.acos(Math.max(-1, Math.min(1, cos))));
  }

  // Turn normalized landmarks into pixels, rotated so the eyes are level.
  function level(lm, W, H) {
    const px = lm.map(p => ({ x: p.x * W, y: p.y * H }));
    const a = px[P.eyeA], b = px[P.eyeB];
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const cos = Math.cos(-angle), sin = Math.sin(-angle);
    const pts = px.map(p => {
      const dx = p.x - center.x, dy = p.y - center.y;
      return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
    });
    return { pts, angle, center };
  }

  // The five numbers the shape is judged on. Widths are compared with the
  // cheekbones; the mesh stops short of the hairline, so "length" is the
  // upper forehead to the chin.
  function measure(pts) {
    const p = i => pts[i];
    const cheek = dist(p(P.cheekA), p(P.cheekB));
    const length = dist(p(P.top), p(P.chin));
    const jawAngle = (angleAt(p(P.cheekA), p(P.jawA), p(P.chin)) + angleAt(p(P.cheekB), p(P.jawB), p(P.chin))) / 2;
    const mid = (p(P.cheekA).x + p(P.cheekB).x) / 2;
    return {
      length: length / cheek,
      forehead: dist(p(P.foreA), p(P.foreB)) / cheek,
      jaw: dist(p(P.jawA), p(P.jawB)) / cheek,
      chin: dist(p(P.chinA), p(P.chinB)) / cheek,
      jawAngle,
      cheekPx: cheek,
      yaw: (p(P.noseTip).x - mid) / cheek
    };
  }

  // What a typical face of each shape measures, and how much each number
  // may vary. Calibrated on the face mesh, not on a tape measure.
  const SPREAD = { length: .075, forehead: .045, jaw: .045, chin: .05, jawAngle: 6 };
  const WEIGHT = { length: 1.2, forehead: 1, jaw: 1, chin: .5, jawAngle: .6 };
  const PROTO = {
    oval:     { length: 1.30, forehead: .80, jaw: .845, chin: .60, jawAngle: 133 },
    round:    { length: 1.17, forehead: .80, jaw: .865, chin: .64, jawAngle: 137 },
    square:   { length: 1.19, forehead: .83, jaw: .925, chin: .70, jawAngle: 126 },
    oblong:   { length: 1.44, forehead: .81, jaw: .885, chin: .65, jawAngle: 128 },
    heart:    { length: 1.27, forehead: .87, jaw: .80, chin: .54, jawAngle: 135 },
    diamond:  { length: 1.31, forehead: .74, jaw: .80, chin: .56, jawAngle: 134 },
    triangle: { length: 1.24, forehead: .74, jaw: .93, chin: .70, jawAngle: 128 }
  };

  // Score every shape and turn the scores into match percentages
  function classify(m) {
    const raw = {};
    for (const [id, proto] of Object.entries(PROTO)) {
      let d2 = 0;
      for (const k in SPREAD) d2 += WEIGHT[k] * ((m[k] - proto[k]) / SPREAD[k]) ** 2;
      raw[id] = Math.exp(-d2 / 4);
    }
    const total = Object.values(raw).reduce((s, v) => s + v, 0) || 1;
    const matches = Object.entries(raw)
      .map(([id, v]) => ({ id, exact: v / total * 100 }))
      .sort((a, b) => b.exact - a.exact);
    // Round down, then hand the leftover points to the biggest remainders,
    // so the shown numbers add up to exactly 100
    matches.forEach(x => { x.pct = Math.floor(x.exact); });
    let left = 100 - matches.reduce((s, x) => s + x.pct, 0);
    [...matches].sort((a, b) => (b.exact - b.pct) - (a.exact - a.pct)).forEach(x => { if (left > 0) { x.pct++; left--; } });
    matches.forEach(x => { delete x.exact; });
    return matches;
  }

  // Plain-language reasons, comparing the face with an average one
  function reasons(m) {
    const r = [];
    if (m.length >= 1.38) r.push('Your face is noticeably longer than it is wide.');
    else if (m.length <= 1.21) r.push('Your face is nearly as wide as it is long.');
    else r.push('Your face is a little longer than it is wide.');
    if (m.forehead >= .85) r.push('Your forehead is almost as wide as your cheekbones.');
    else if (m.forehead <= .76) r.push('Your forehead is clearly narrower than your cheekbones.');
    if (m.jaw >= .9) r.push('Your jaw is wide, close to the width of your cheekbones.');
    else if (m.jaw <= .82) r.push('Your jaw narrows toward a slimmer chin.');
    else r.push('Your jaw is a medium width.');
    if (m.jawAngle <= 128) r.push('Your jaw corners are angular.');
    else if (m.jawAngle >= 137) r.push('Your jawline curves softly.');
    return r;
  }

  function quality(m) {
    const w = [];
    if (m.cheekPx < 140) w.push('Your face is small in the photo. Move closer or use a sharper photo.');
    if (Math.abs(m.yaw) > .06) w.push('Your head is turned to one side, which makes widths less accurate. Face the camera straight on.');
    return w;
  }

  // Main entry: normalized landmarks + image size → result
  function analyze(lm, W, H) {
    const lv = level(lm, W, H);
    const m = measure(lv.pts);
    const matches = classify(m);
    return { shape: matches[0].id, matches, m, reasons: reasons(m), warnings: quality(m), angle: lv.angle, center: lv.center, pts: lv.pts };
  }

  // Live camera hints, from landmarks of a single video frame
  function framing(lm) {
    const xs = lm.map(p => p.x), ys = lm.map(p => p.y);
    const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    const a = lm[P.eyeA], b = lm[P.eyeB];
    const tilt = Math.abs(deg(Math.atan2(b.y - a.y, b.x - a.x)));
    const mid = (lm[P.cheekA].x + lm[P.cheekB].x) / 2;
    const yaw = (lm[P.noseTip].x - mid) / Math.max(.01, Math.abs(lm[P.cheekB].x - lm[P.cheekA].x));
    if (Math.max(w, h * .75) < .28) return { ok: false, hint: 'Move closer' };
    if (h > .9) return { ok: false, hint: 'Move back a little' };
    if (Math.abs(cx - .5) > .14 || Math.abs(cy - .5) > .16) return { ok: false, hint: 'Center your face in the oval' };
    if (tilt > 7) return { ok: false, hint: 'Keep your head level' };
    if (Math.abs(yaw) > .07) return { ok: false, hint: 'Look straight at the camera' };
    return { ok: true, hint: 'Hold still — looks good' };
  }

  return { P, OUTLINE, KEEP, PROTO, analyze, measure, classify, framing };
})();

if (typeof module !== 'undefined') module.exports = CS;
