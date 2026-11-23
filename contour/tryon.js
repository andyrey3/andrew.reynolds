// Contour — live haircut try-on. The camera feed is mapped every frame with
// MediaPipe's face landmarker; the hair segmenter finds your real hair so it
// can be tinted, and the chosen cut is drawn over your head and follows it.
// Everything runs on this device; no frames leave it.

const TRY = (() => {
  const HAIR_MODEL = new URL('vendor/hair_segmenter.tflite', location.href).href;
  const PROC_W = 640;   // width the frames are processed at
  const SEG_W = 256;    // width the hair segmenter sees

  let models = null;
  let stream = null, raf = 0, running = false;
  let style = null, tint = true, frame = 0;
  let smooth = null;
  const proc = document.createElement('canvas'), pc = proc.getContext('2d');
  const small = document.createElement('canvas'), sc = small.getContext('2d', { willReadFrequently: true });
  const maskC = document.createElement('canvas'), mc = maskC.getContext('2d');
  const layer = document.createElement('canvas'), lc = layer.getContext('2d');
  const tintC = document.createElement('canvas'), tc = tintC.getContext('2d');
  let haveMask = false;

  const HAS_FILTER = (() => { try { const t = document.createElement('canvas').getContext('2d'); t.filter = 'blur(1px)'; return t.filter === 'blur(1px)'; } catch { return false; } })();

  // ---------- Models ----------

  function loadModels() {
    if (!models) {
      models = (async () => {
        const v = await import(`${MP}/vision_bundle.mjs`);
        const files = await v.FilesetResolver.forVisionTasks(`${MP}/wasm`);
        const face = async delegate => v.FaceLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'VIDEO', numFaces: 1
        });
        let lm;
        try { lm = await face('GPU'); } catch { lm = await face('CPU'); }
        let seg = null;
        try {
          seg = await v.ImageSegmenter.createFromOptions(files, {
            baseOptions: { modelAssetPath: HAIR_MODEL, delegate: 'CPU' }, runningMode: 'VIDEO',
            outputCategoryMask: true, outputConfidenceMasks: false
          });
        } catch { seg = null; }   // Try-on still works without hair tinting
        return { lm, seg };
      })();
      models.catch(() => { models = null; });
    }
    return models;
  }

  // ---------- Hair texture ----------

  // Strands and shading in template space, drawn over the flat hair shape
  const texture = (() => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 608;
    const x = c.getContext('2d');
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    x.translate(0, 48); x.scale(2, 2);   // template units, y from -24
    for (let i = 0; i < 1400; i++) {
      const sx = rnd() * 200, sy = -20 + rnd() * 260, len = 12 + rnd() * 40;
      const lean = (sx - 100) * .12 + (rnd() - .5) * 6;
      x.strokeStyle = rnd() < .5 ? `rgba(255,255,255,${.05 + rnd() * .08})` : `rgba(0,0,0,${.08 + rnd() * .12})`;
      x.lineWidth = .4 + rnd() * .8;
      x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + lean * .4, sy + len * .5, sx + lean, sy + len); x.stroke();
    }
    const g = x.createRadialGradient(100, 30, 10, 100, 60, 140);
    g.addColorStop(0, 'rgba(255,255,255,.16)'); g.addColorStop(.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.3)');
    x.fillStyle = g; x.fillRect(-10, -30, 220, 320);
    return c;
  })();

  // ---------- Camera ----------

  async function open(id) {
    const pr = hairPrefs();
    style = id || (pr.shape ? HS.rank(pr.shape, pr)[0].s.id : HS.STYLES.find(s => pr.who === 'all' || s.who === pr.who).id);
    renderUI();
    $('#tryon').classList.remove('hidden');
    setStatus('Starting camera…');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setStatus('This browser can’t use the camera.'); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
    } catch {
      setStatus('Camera access was blocked. Allow it in your browser settings to try on haircuts.');
      return;
    }
    const video = $('#tryon video');
    video.srcObject = stream;
    await video.play().catch(() => {});
    setStatus('Loading the face and hair models…');
    let m;
    try { m = await loadModels(); }
    catch { setStatus('Couldn’t load the face model. Check your connection and try again.'); return; }
    if (!stream) return;
    setStatus(m.seg ? '' : 'Hair tinting isn’t available on this device, but you can still try on cuts.');
    smooth = null; haveMask = false; frame = 0;
    running = true;
    loop();
  }

  function close() {
    running = false;
    cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
    $('#tryon').classList.add('hidden');
  }

  function setStatus(t) {
    const el = $('#tryon .status');
    el.textContent = t;
    el.classList.toggle('hidden', !t);
  }

  // ---------- Frame loop ----------

  function loop() {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const video = $('#tryon video');
    if (!video.videoWidth || video.readyState < 2 || !models) return;
    models.then(m => drawFrame(video, m)).catch(() => {});
  }

  let busy = false;
  function drawFrame(video, m) {
    if (busy || !running) return;
    busy = true;
    try {
      // Crop the video to the screen's shape, at processing size
      const view = $('#tryon canvas.view');
      const stage = $('#tryon .stage');
      const sa = stage.clientWidth / stage.clientHeight || .75;
      const vw = video.videoWidth, vh = video.videoHeight;
      let cx = 0, cy = 0, cw = vw, ch = vh;
      if (vw / vh > sa) { cw = vh * sa; cx = (vw - cw) / 2; } else { ch = vw / sa; cy = (vh - ch) / 2; }
      const W = PROC_W, H = Math.round(PROC_W / sa);
      for (const c of [proc, layer, tintC]) if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
      if (view.width !== W || view.height !== H) { view.width = W; view.height = H; }
      pc.drawImage(video, cx, cy, cw, ch, 0, 0, W, H);

      const ts = performance.now();
      let lm = null;
      try { const r = m.lm.detectForVideo(proc, ts); lm = r && r.faceLandmarks && r.faceLandmarks[0]; } catch { lm = null; }

      // Hair mask every other frame
      if (m.seg && tint && frame++ % 2 === 0) segment(m.seg, ts + .5, W, H);

      const out = view.getContext('2d');
      out.drawImage(proc, 0, 0);
      if (tint && haveMask) tintHair(out, W, H);
      if (lm) drawStyle(out, lm, W, H);
      $('#tryon .hint').classList.toggle('hidden', !!lm);
    } finally { busy = false; }
  }

  function segment(seg, ts, W, H) {
    const sh = Math.round(SEG_W * H / W);
    if (small.width !== SEG_W || small.height !== sh) { small.width = SEG_W; small.height = sh; maskC.width = SEG_W; maskC.height = sh; }
    sc.drawImage(proc, 0, 0, SEG_W, sh);
    try {
      seg.segmentForVideo(small, ts, res => {
        const mk = res && res.categoryMask;
        if (!mk) return;
        const a = mk.getAsUint8Array();
        const img = mc.createImageData(SEG_W, sh);
        for (let i = 0; i < a.length; i++) { img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 255; img.data[i * 4 + 3] = a[i] > 0 ? 255 : 0; }
        mc.putImageData(img, 0, 0);
        haveMask = true;
      });
    } catch { /* skip this frame */ }
  }

  // Recolor your real hair toward the chosen color, so the parts the new
  // cut doesn't cover blend in instead of standing out
  function tintHair(out, W, H) {
    tc.globalCompositeOperation = 'copy';
    tc.imageSmoothingQuality = 'high';
    if (HAS_FILTER) tc.filter = 'blur(2px)';
    tc.drawImage(maskC, 0, 0, W, H);
    tc.filter = 'none';
    tc.globalCompositeOperation = 'source-in';
    tc.fillStyle = S.hairColor; tc.fillRect(0, 0, W, H);
    tc.globalCompositeOperation = 'source-over';
    out.save();
    out.globalCompositeOperation = 'color'; out.globalAlpha = .75; out.drawImage(tintC, 0, 0);
    out.globalCompositeOperation = 'multiply'; out.globalAlpha = .35; out.drawImage(tintC, 0, 0);
    out.restore();
  }

  function drawStyle(out, lm, W, H) {
    const P = i => ({ x: lm[i].x * W, y: lm[i].y * H });
    const top = P(CS.P.top), chin = P(CS.P.chin), ca = P(CS.P.cheekA), cb = P(CS.P.cheekB), ea = P(CS.P.eyeA), eb = P(CS.P.eyeB);
    const cur = {
      x: top.x, y: top.y,
      a: Math.atan2(eb.y - ea.y, eb.x - ea.x),
      sx: Math.hypot(cb.x - ca.x, cb.y - ca.y) / 104,
      sy: Math.hypot(chin.x - top.x, chin.y - top.y) / 138
    };
    // Smooth out jitter between frames
    if (!smooth) smooth = cur;
    else for (const k in cur) smooth[k] += (cur[k] - smooth[k]) * .45;
    const t = smooth;
    const L = HS.layers(style);
    const apply = ctx => { ctx.translate(t.x, t.y); ctx.rotate(t.a); ctx.scale(t.sx, t.sy); ctx.translate(-100, -66); };

    const paint = (paths, cutFace) => {
      if (!paths.length) return;
      lc.setTransform(1, 0, 0, 1, 0, 0);
      lc.globalCompositeOperation = 'source-over';
      lc.clearRect(0, 0, W, H);
      lc.save(); apply(lc);
      lc.fillStyle = S.hairColor;
      for (const d of paths) lc.fill(new Path2D(d));
      lc.globalCompositeOperation = 'source-atop';
      lc.drawImage(texture, 0, -24, 200, 304);
      lc.restore();
      if (cutFace) {
        lc.globalCompositeOperation = 'destination-out';
        lc.beginPath();
        CS.OUTLINE.forEach((i, n) => { const p = P(i); n ? lc.lineTo(p.x, p.y) : lc.moveTo(p.x, p.y); });
        lc.closePath(); lc.fill();
        lc.globalCompositeOperation = 'source-over';
      }
      out.save();
      out.globalAlpha = .94;
      if (HAS_FILTER) out.filter = 'blur(.8px)';
      out.drawImage(layer, 0, 0);
      out.restore();
    };
    paint(L.back, true);
    paint(L.front, false);
  }

  // ---------- Snapshot ----------

  async function snap(btn) {
    const view = $('#tryon canvas.view');
    if (!view.width) return;
    // Save it the way it looked on screen (mirrored)
    const c = document.createElement('canvas'); c.width = view.width; c.height = view.height;
    const x = c.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(view, 0, 0);
    const flash = $('#tryon .flash'); flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .92));
    if (!blob) return;
    const name = `contour-${style}.jpg`;
    const file = new File([blob], name, { type: 'image/jpeg' });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); return; } }
    catch (err) { if (err && err.name === 'AbortError') return; }
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // ---------- Controls ----------

  function renderUI() {
    const pr = hairPrefs();
    const list = pr.shape ? HS.rank(pr.shape, pr) : HS.STYLES.filter(s => pr.who === 'all' || s.who === pr.who).map(s => ({ s, fit: null }));
    const cur = HS.STYLES.find(s => s.id === style);
    $('#tryon .name').innerHTML = `<b>${esc(cur.name)}</b>${pr.shape ? (() => { const r = list.find(x => x.s.id === style); return r ? ` <span class="tag ${FIT_CLASS[r.fit]}">${r.label}</span>` : ''; })() : ''}`;
    $('#tryon .styles').innerHTML = list.map(x => `<button class="tstyle ${x.s.id === style ? 'on' : ''}" data-act="try-style" data-id="${x.s.id}" aria-label="${esc(x.s.name)}">
      <span class="thumb">${HS.headSvg(x.s.id, S.hairColor)}</span><span>${esc(x.s.name)}</span></button>`).join('');
    $('#tryon .colors').innerHTML = HAIR_COLORS.map(([c, n]) => `<button class="sw ${S.hairColor === c ? 'on' : ''}" style="background:${c}" data-act="try-color" data-v="${c}" aria-label="${n}" title="${n}"></button>`).join('') +
      `<button class="chip ${tint ? 'on' : ''}" data-act="try-tint">${tint ? 'Tint my hair: on' : 'Tint my hair: off'}</button>`;
  }

  function setStyle(id) {
    style = id;
    const strip = $('#tryon .styles'), sl = strip.scrollLeft;
    renderUI();
    strip.scrollLeft = sl;
  }
  function setColor(c) { S.hairColor = c; save(); setStyle(style); }
  function toggleTint() { tint = !tint; if (!tint) haveMask = false; setStyle(style); }

  return { open, close, snap, setStyle, setColor, toggleTint };
})();
