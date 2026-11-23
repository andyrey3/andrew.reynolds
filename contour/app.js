// Contour — face shape finder. Photos are measured on this device with
// MediaPipe's face landmarker; scans are kept in localStorage and nothing
// is uploaded.

const KEY = 'contour-v1';
const DEFAULTS = { onboarded: false, style: 'all', scans: [], current: null, tab: 'scan', guide: 'hair', lines: true };
let S = load();

function load() {
  const fresh = JSON.parse(JSON.stringify(DEFAULTS));
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && typeof saved === 'object') Object.assign(fresh, saved);
  } catch { /* start fresh */ }
  if (!Array.isArray(fresh.scans)) fresh.scans = [];
  fresh.scans = fresh.scans.filter(validScan);
  if (!['m', 'f', 'all'].includes(fresh.style)) fresh.style = 'all';
  return fresh;
}
function validScan(s) {
  return s && typeof s.id === 'string' && typeof s.img === 'string' && s.img.startsWith('data:image/jpeg') &&
    Array.isArray(s.pts) && s.result && SHAPES[s.result.shape] && Array.isArray(s.result.matches);
}
// Photos take most of the space; if storage fills up, drop the oldest scans
function save() {
  for (;;) {
    try { localStorage.setItem(KEY, JSON.stringify(S)); return true; }
    catch {
      if (S.scans.length <= 1) return false;
      S.scans.shift();
    }
  }
}

// MediaPipe (Apache-2.0) and the face model are the copies bundled with
// Facet on this same site, so no third-party code runs here. See NOTICE.
const MP = new URL('../facet/vendor/mediapipe', location.href).href;
const MODEL = new URL('../facet/vendor/face_landmarker.task', location.href).href;
const MAX_SCANS = 30;
const OUT_W = 480, OUT_H = 600;

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = t => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const wait = ms => new Promise(r => setTimeout(r, ms));

const sv = (body, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${body}</svg>`;
const ICON = {
  camera: sv('<path d="M20 7h-3l-2-3H9L7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z"/><circle cx="12" cy="13" r="3.5"/>'),
  image: sv('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>'),
  scan: sv('<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><ellipse cx="12" cy="12" rx="4.2" ry="5.2"/>'),
  face: sv('<path d="M12 3c4.5 0 7 3.2 7 7.5 0 5.5-3.5 10.5-7 10.5s-7-5-7-10.5C5 6.2 7.5 3 12 3z"/><path d="M9.5 10.5h.01M14.5 10.5h.01M10 15.5c1.2.8 2.8.8 4 0"/>'),
  grid: sv('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'),
  gear: sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  x: sv('<path d="M6 6l12 12M18 6 6 18"/>', 'stroke-width="2.4"'),
  check: sv('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 'stroke-width="2.6"'),
  ban: sv('<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>'),
  chev: sv('<path d="m9 6 6 6-6 6"/>'),
  ruler: sv('<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>'),
  scissors: sv('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>'),
  share: sv('<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
  trash: sv('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>')
};

// Colors for the measurement lines on the photo
const LINE = { forehead: '#5aa9e6', cheek: '#f5b942', jaw: '#e5677b', length: '#7ed0a6' };

function shapeSvg(id, cls = 'fillp') {
  return `<svg class="shape-svg" viewBox="-4 -4 108 128" aria-hidden="true"><path class="${cls}" d="${SHAPES[id].path}"/></svg>`;
}

// ---------- Tabs ----------

function showTab(t) {
  S.tab = t;
  for (const id of ['scan', 'result', 'shapes']) $(`#tab-${id}`).classList.toggle('hidden', id !== t);
  document.querySelectorAll('nav.bar button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  render();
  save();
}

function render() {
  if (S.tab === 'scan') renderScan();
  else if (S.tab === 'result') renderResult();
  else renderShapes();
}

function renderNav() {
  const labels = { scan: [ICON.scan, 'Scan'], result: [ICON.face, 'My shape'], shapes: [ICON.grid, 'Shapes'] };
  document.querySelectorAll('nav.bar button').forEach(b => {
    const [ico, name] = labels[b.dataset.tab];
    b.innerHTML = `${ico}<span>${name}</span>`;
  });
}

// ---------- Scan (home) ----------

function renderScan() {
  const strip = SHAPE_ORDER.map(id => shapeSvg(id, 'faintp')).join('');
  const hist = [...S.scans].reverse();
  $('#tab-scan').innerHTML = `<div class="wrap">
    <header class="top"><div><div class="eyebrow">Contour</div><h1>Face shape finder</h1></div>
      <button class="icon-btn" data-act="settings" aria-label="Settings">${ICON.gear}</button></header>
    <div class="card hero">
      <div class="shapes-strip" style="color:var(--faint)">${strip}</div>
      <h2>What’s your face shape?</h2>
      <p class="muted">Take a selfie and Contour maps 478 points on your face, measures it and matches it to the 7 face shapes.</p>
      <div class="row-btns">
        <button class="btn primary" data-act="camera">${ICON.camera}Selfie</button>
        <button class="btn ghost" data-act="upload">${ICON.image}Upload</button>
      </div>
    </div>
    <div class="card"><h3>${ICON.check}For an accurate result</h3>
      <ul class="tips">
        <li>${ICON.check}Pull your hair back off your forehead and face</li>
        <li>${ICON.check}Look straight at the camera, phone at eye level</li>
        <li>${ICON.check}Neutral expression, mouth closed</li>
        <li>${ICON.check}Even light, no glasses</li>
      </ul>
    </div>
    ${hist.length ? `<div class="card"><h3>${ICON.face}Your scans</h3><div class="history">${hist.map(s => `
      <button class="hist" data-act="open-scan" data-id="${esc(s.id)}">
        <img src="${s.img}" alt="">
        <div><b>${esc(SHAPES[s.result.shape].name)}</b><span class="muted small">${s.result.matches[0].pct}% match · ${fmtDate(s.date)}</span></div>
        <span class="chev">${ICON.chev}</span>
      </button>`).join('')}</div></div>` : ''}
    <p class="note">Your photos are measured on this device and never uploaded.</p>
  </div>`;
}

// ---------- Result ----------

function currentScan() {
  return S.scans.find(s => s.id === S.current) || S.scans[S.scans.length - 1] || null;
}

function overlay(scan) {
  const at = i => { const k = CS.KEEP.indexOf(i); return { x: scan.pts[k * 2], y: scan.pts[k * 2 + 1] }; };
  const P = CS.P;
  const outline = CS.OUTLINE.map((i, n) => { const p = at(i); return `${n ? 'L' : 'M'}${p.x} ${p.y}`; }).join(' ') + 'Z';
  const hline = (a, b, color, label, dy) => {
    const A = at(a), B = at(b), y = (A.y + B.y) / 2;
    return `<line class="mline" x1="${A.x}" y1="${y}" x2="${B.x}" y2="${y}" stroke="${color}"/>
      <circle class="mdot" cx="${A.x}" cy="${y}" r="4.5" fill="${color}"/><circle class="mdot" cx="${B.x}" cy="${y}" r="4.5" fill="${color}"/>
      <text x="${B.x + 8}" y="${y + dy}">${label}</text>`;
  };
  const T = at(P.top), C = at(P.chin), lx = (T.x + C.x) / 2;
  return `<svg class="ov ${S.lines ? '' : 'hidden'}" viewBox="0 0 ${scan.w} ${scan.h}" aria-hidden="true">
    <path class="outline" d="${outline}"/>
    <line class="mline" x1="${lx}" y1="${T.y}" x2="${lx}" y2="${C.y}" stroke="${LINE.length}" stroke-dasharray="7 6"/>
    ${hline(P.foreA, P.foreB, LINE.forehead, 'Forehead', 4)}
    ${hline(P.cheekA, P.cheekB, LINE.cheek, 'Cheeks', 4)}
    ${hline(P.jawA, P.jawB, LINE.jaw, 'Jaw', 4)}
  </svg>`;
}

function guideHtml(id) {
  const sh = SHAPES[id];
  const tabs = [['hair', 'Hair'], ['glasses', 'Glasses']];
  if (S.style !== 'f') tabs.push(['beard', 'Beard']);
  if (S.style !== 'm') tabs.push(['makeup', 'Makeup']);
  const cur = tabs.some(t => t[0] === S.guide) ? S.guide : 'hair';
  let body;
  if (cur === 'makeup') {
    body = `<div class="kv"><div><b>Contour</b>${esc(sh.makeup.contour)}</div><div><b>Highlight</b>${esc(sh.makeup.highlight)}</div><div><b>Brows</b>${esc(sh.makeup.brows)}</div></div>`;
  } else {
    const g = sh[cur];
    body = `<div class="do-dont">
      <div class="do"><b>${ICON.check}Best for you</b><ul>${g.best.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="dont"><b>${ICON.ban}Avoid</b><ul>${g.avoid.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    </div>`;
  }
  return `<div class="goal"><b>The goal:</b> ${esc(sh.goal)}</div>
    <div class="seg" role="tablist">${tabs.map(([k, n]) => `<button role="tab" aria-selected="${k === cur}" class="${k === cur ? 'on' : ''}" data-act="guide" data-k="${k}">${n}</button>`).join('')}</div>
    ${body}`;
}

function renderResult() {
  const scan = currentScan();
  if (!scan) {
    $('#tab-result').innerHTML = `<div class="wrap"><div class="empty">
      ${shapeSvg('oval', 'faintp')}
      <h2>No scan yet</h2><p class="muted">Take a selfie to find your face shape.</p>
      <div class="row-btns"><button class="btn primary" data-act="camera">${ICON.camera}Selfie</button><button class="btn ghost" data-act="upload">${ICON.image}Upload</button></div>
    </div></div>`;
    return;
  }
  const r = scan.result, sh = SHAPES[r.shape], m = r.m;
  const second = r.matches[1];
  const pctOf = v => `${Math.round(v * 100)}%`;
  $('#tab-result').innerHTML = `<div class="wrap">
    <header class="top"><div><div class="eyebrow">${fmtDate(scan.date)}</div><h1>Your face shape</h1></div>
      <button class="icon-btn" data-act="camera" aria-label="New scan">${ICON.camera}</button></header>

    ${r.warnings.length ? `<div class="card warn-card"><h3>Check your photo</h3>${r.warnings.map(w => `<p>${esc(w)}</p>`).join('')}<button class="btn ghost sm" data-act="camera">Retake</button></div>` : ''}

    <div class="photo">
      <img src="${scan.img}" alt="Your scanned photo">
      ${overlay(scan)}
      <button class="toggle" data-act="lines">${S.lines ? 'Hide' : 'Show'} lines</button>
    </div>

    <div class="card">
      <div class="verdict">
        <div class="shape-ico">${shapeSvg(r.shape)}</div>
        <div>
          <h2>${esc(sh.name)}</h2>
          <div><span class="pct">${r.matches[0].pct}% match</span> <span class="muted">· ${esc(sh.tagline)}</span></div>
          ${second.pct >= 20 ? `<div class="muted small">with some ${esc(SHAPES[second.id].name.toLowerCase())} traits (${second.pct}%)</div>` : ''}
        </div>
      </div>
      <p class="muted small" style="margin-top:12px">${esc(sh.d)}</p>
    </div>

    <div class="card"><h3>${ICON.face}All shapes</h3>
      <div class="bars">${r.matches.map((x, i) => `
        <button class="barrow ${i === 0 ? 'top' : ''}" data-act="shape" data-id="${x.id}">
          <span>${esc(SHAPES[x.id].name)}</span><span class="track"><span class="fill" style="width:${x.pct}%"></span></span><span>${x.pct}%</span>
        </button>`).join('')}</div>
    </div>

    <div class="card"><h3>${ICON.ruler}Your measurements</h3>
      <div class="metrics">
        <div class="metric"><div class="k"><i style="background:${LINE.forehead}"></i>Forehead</div><div class="v">${pctOf(m.forehead)}</div><div class="muted small">of cheek width</div></div>
        <div class="metric"><div class="k"><i style="background:${LINE.cheek}"></i>Cheekbones</div><div class="v">100%</div><div class="muted small">widest point</div></div>
        <div class="metric"><div class="k"><i style="background:${LINE.jaw}"></i>Jaw</div><div class="v">${pctOf(m.jaw)}</div><div class="muted small">of cheek width</div></div>
        <div class="metric"><div class="k"><i style="background:${LINE.length}"></i>Length</div><div class="v">${m.length.toFixed(2)}×</div><div class="muted small">the width</div></div>
        <div class="metric"><div class="k">Jaw angle</div><div class="v">${Math.round(m.jawAngle)}°</div><div class="muted small">${m.jawAngle <= 128 ? 'angular' : m.jawAngle >= 137 ? 'soft' : 'medium'}</div></div>
        <div class="metric"><div class="k">Chin</div><div class="v">${pctOf(m.chin)}</div><div class="muted small">of cheek width</div></div>
      </div>
      <ul class="reasons">${r.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>

    <div class="card"><h3>${ICON.scissors}Your style guide</h3>${guideHtml(r.shape)}</div>

    <div class="row-btns">
      <button class="btn ghost sm" data-act="share">${ICON.share}Share</button>
      <button class="btn ghost sm" data-act="delete-scan" data-id="${esc(scan.id)}">${ICON.trash}Delete</button>
    </div>
    <p class="note">Length is measured from the upper forehead, since the hairline isn’t mapped. Camera angle, lens and expression all change the numbers, so treat the result as a guide.</p>
  </div>`;
}

// ---------- Shapes library ----------

function renderShapes() {
  const mine = currentScan() && currentScan().result.shape;
  $('#tab-shapes').innerHTML = `<div class="wrap">
    <header class="top"><div><div class="eyebrow">Library</div><h1>The 7 face shapes</h1></div></header>
    <p class="muted small" style="margin-bottom:14px">Tap a shape to see what defines it and which hair, glasses and grooming suit it.</p>
    <div class="grid">${SHAPE_ORDER.map(id => `
      <button class="tile" data-act="shape" data-id="${id}">
        ${id === mine ? '<span class="badge">You</span>' : ''}
        ${shapeSvg(id)}
        <b>${esc(SHAPES[id].name)}</b><span>${esc(SHAPES[id].tagline)}</span>
      </button>`).join('')}</div>
  </div>`;
}

// ---------- Sheets ----------

let sheetShape = null;
function openSheet(html) {
  $('#sheet').innerHTML = `<div class="grab"></div>${html}`;
  $('#sheet-wrap').classList.remove('hidden');
  $('#sheet').scrollTop = 0;
}
function closeSheet() { $('#sheet-wrap').classList.add('hidden'); sheetShape = null; }

function shapeSheet(id) {
  sheetShape = id;
  const sh = SHAPES[id];
  openSheet(`
    <div class="verdict" style="margin-bottom:14px">
      <div class="shape-ico">${shapeSvg(id)}</div>
      <div><div class="eyebrow">Face shape</div><h2>${esc(sh.name)}</h2><div class="muted small">${esc(sh.tagline)}</div></div>
    </div>
    <div class="card"><p class="small">${esc(sh.d)}</p><ul class="reasons">${sh.traits.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
    <div class="card"><h3>${ICON.scissors}Style guide</h3>${guideHtml(id)}</div>
    <button class="btn ghost block" data-act="close-sheet">Close</button>`);
}

function settingsSheet() {
  openSheet(`<h2 style="margin-bottom:12px">Settings</h2>
    <div class="card"><h3>Style tips</h3>${styleChoice()}</div>
    <div class="card"><h3>Privacy</h3><p class="small muted">Photos are measured on this device with an offline face model. Scans are saved only in this browser and are never uploaded.</p></div>
    ${S.scans.length ? `<button class="btn ghost block" data-act="clear" style="margin-bottom:10px">${ICON.trash}Delete all ${S.scans.length} scans</button>` : ''}
    <button class="btn ghost block" data-act="close-sheet">Done</button>`);
}

function styleChoice() {
  const opts = [['m', 'Men’s tips', 'Hair, glasses and beard styles'], ['f', 'Women’s tips', 'Hair, glasses and makeup contouring'], ['all', 'Show everything', 'Every tip for every shape']];
  return `<div class="choice">${opts.map(([k, t, d]) => `<button class="${S.style === k ? 'on' : ''}" data-act="style" data-k="${k}">${t}<span>${d}</span></button>`).join('')}</div>`;
}

function renderOnboard() {
  const ob = $('#onboard');
  ob.innerHTML = `<div class="wrap">
    <div style="display:flex;gap:6px;color:var(--accent)">${['oval', 'heart', 'square'].map(id => `<div style="width:44px;height:53px">${shapeSvg(id)}</div>`).join('')}</div>
    <div><div class="eyebrow">Contour</div><h1>Find the face shape you actually have</h1></div>
    <p class="muted">One selfie, 478 measured points, and a match score for all 7 face shapes, with hair, glasses and grooming picked for your shape.</p>
    <div><p class="small" style="font-weight:700;margin-bottom:8px">Which tips do you want?</p>${styleChoice()}</div>
    <button class="btn primary block" data-act="start">Get started</button>
    <p class="note">Everything runs on your device. Nothing is uploaded.</p>
  </div>`;
  ob.classList.remove('hidden');
}

// ---------- Camera ----------

let stream = null, liveTimer = null, liveBusy = false;

async function openCamera() {
  closeSheet();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return pickFile(true);
  const cam = $('#camera'), video = cam.querySelector('video');
  setHint('Starting camera…', false);
  cam.classList.remove('hidden');
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
  } catch {
    cam.classList.add('hidden');
    return pickFile(true);
  }
  video.srcObject = stream;
  await video.play().catch(() => {});
  sizeGuide();
  setHint('Fit your face inside the oval', false);
  getLandmarker().catch(() => {});
  liveTimer = setInterval(liveCheck, 400);
}

function closeCamera() {
  clearInterval(liveTimer); liveTimer = null;
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
  $('#camera').classList.add('hidden');
  $('#camera').classList.remove('ok');
}

function setHint(text, ok) {
  $('#camera .hint span').textContent = text;
  $('#camera').classList.toggle('ok', ok);
}

// Draw the oval guide to fit whatever size the screen is
function sizeGuide() {
  const stage = $('#camera .stage'), W = stage.clientWidth, H = stage.clientHeight;
  if (!W || !H) return;
  const rx = Math.min(W * .36, H * .27), ry = rx * 1.3, cy = H * .48;
  const svg = $('#camera .guide');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.querySelector('rect').setAttribute('width', W); svg.querySelector('rect').setAttribute('height', H);
  svg.querySelector('rect.mask').setAttribute('width', W); svg.querySelector('rect.mask').setAttribute('height', H);
  for (const e of svg.querySelectorAll('ellipse')) {
    e.setAttribute('cx', W / 2); e.setAttribute('cy', cy); e.setAttribute('rx', rx); e.setAttribute('ry', ry);
  }
}

// The part of the video frame that's actually visible on screen
function visibleCrop(video) {
  const vw = video.videoWidth, vh = video.videoHeight, stage = $('#camera .stage');
  const sa = stage.clientWidth / stage.clientHeight, va = vw / vh;
  if (va > sa) { const w = vh * sa; return { x: (vw - w) / 2, y: 0, w, h: vh }; }
  const h = vw / sa; return { x: 0, y: (vh - h) / 2, w: vw, h };
}

async function liveCheck() {
  const video = $('#camera video');
  if (liveBusy || !LM_READY || !video.videoWidth) return;
  liveBusy = true;
  try {
    const crop = visibleCrop(video), k = 320 / crop.w;
    const c = document.createElement('canvas');
    c.width = 320; c.height = Math.round(crop.h * k);
    c.getContext('2d').drawImage(video, crop.x, crop.y, crop.w, crop.h, 0, 0, c.width, c.height);
    const res = LM_READY.detect(c);
    const lm = res && res.faceLandmarks && res.faceLandmarks[0];
    if (!lm) setHint('No face found — look at the camera', false);
    else { const f = CS.framing(lm); setHint(f.hint, f.ok); }
  } catch { /* keep the last hint */ }
  liveBusy = false;
}

function shoot() {
  const video = $('#camera video');
  if (!video.videoWidth) return;
  const crop = visibleCrop(video);
  const c = document.createElement('canvas');
  c.width = Math.round(crop.w); c.height = Math.round(crop.h);
  const ctx = c.getContext('2d');
  // Save it the way the preview looked (mirrored, like a mirror)
  ctx.translate(c.width, 0); ctx.scale(-1, 1);
  ctx.drawImage(video, crop.x, crop.y, crop.w, crop.h, 0, 0, c.width, c.height);
  const flash = $('#camera .flash');
  flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
  setTimeout(() => { closeCamera(); runScan(c); }, 250);
}

function pickFile(useCamera) {
  const f = $('#file');
  if (useCamera) f.setAttribute('capture', 'user'); else f.removeAttribute('capture');
  f.value = '';
  f.click();
}

function loadFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
    img.src = url;
  });
}

// ---------- Analysis ----------

let LM = null, LM_READY = null;
function getLandmarker() {
  if (!LM) {
    LM = (async () => {
      const v = await import(`${MP}/vision_bundle.mjs`);
      const files = await v.FilesetResolver.forVisionTasks(`${MP}/wasm`);
      const make = delegate => v.FaceLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'IMAGE', numFaces: 1
      });
      let lmk;
      try { lmk = await make('GPU'); } catch { lmk = await make('CPU'); }
      LM_READY = lmk;
      return lmk;
    })();
    LM.catch(() => { LM = null; });
  }
  return LM;
}

function busy(html) {
  const b = $('#busy');
  b.innerHTML = html;
  b.classList.remove('hidden');
}
const busyPhoto = (src, extra = '') => `<div class="busy-photo"><img src="${src}" alt="">${extra}</div>`;

async function runScan(src) {
  closeSheet();
  // Work on a copy no bigger than 1280px
  const sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
  const k = Math.min(1, 1280 / Math.max(sw, sh));
  const c = document.createElement('canvas');
  c.width = Math.round(sw * k); c.height = Math.round(sh * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  const preview = c.toDataURL('image/jpeg', .7);
  const scanline = '<div class="scanline"></div>';
  const fail = (title, msg) => busy(`${busyPhoto(preview)}<h2>${title}</h2><p>${msg}</p>
    <div class="row-btns"><button class="btn primary sm" data-act="camera">${ICON.camera}Try again</button><button class="btn ghost sm" data-act="busy-close">Cancel</button></div>`);

  busy(`${busyPhoto(preview, scanline)}<h2>Loading face model</h2><p>About 4 MB the first time, then it works offline.</p>`);
  let lmk;
  try { lmk = await getLandmarker(); }
  catch { return fail('Couldn’t load the face model', 'Check your internet connection and try again.'); }

  busy(`${busyPhoto(preview, scanline)}<h2>Mapping your face</h2><p>Finding 478 points on your photo.</p>`);
  await wait(60);
  let res;
  try { res = lmk.detect(c); } catch { res = null; }
  const lm = res && res.faceLandmarks && res.faceLandmarks[0];
  if (!lm) return fail('No face found', 'Make sure your whole face is in the photo, well lit and facing the camera.');

  const r = CS.analyze(lm, c.width, c.height);
  const dots = `<style>@keyframes fadein{to{opacity:.85}}</style><svg viewBox="0 0 ${c.width} ${c.height}" preserveAspectRatio="xMidYMid slice">${lm.filter((_, i) => i % 3 === 0).map((p, i) =>
    `<circle cx="${(p.x * c.width).toFixed(1)}" cy="${(p.y * c.height).toFixed(1)}" r="${(c.width / 240).toFixed(1)}" style="opacity:0;animation:fadein .3s ${i * 4}ms forwards"/>`).join('')}</svg>`;
  busy(`${busyPhoto(preview, dots + scanline)}<h2>Measuring</h2><p>Comparing your forehead, cheekbones, jaw and length.</p>`);

  const scan = buildScan(c, r);
  await wait(1300);
  S.scans.push(scan);
  if (S.scans.length > MAX_SCANS) S.scans.shift();
  S.current = scan.id;
  save();
  $('#busy').classList.add('hidden');
  showTab('result');
  $('#tab-result').scrollTop = 0;
}

// Crop a level, portrait photo around the face and keep the points that
// go with it, so the result can be redrawn later.
function buildScan(c, r) {
  const xs = r.pts.map(p => p.x), ys = r.pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const fw = maxX - minX, fh = maxY - minY;
  let x0 = minX - fw * .3, x1 = maxX + fw * .3, y0 = minY - fh * .38, y1 = maxY + fh * .14;
  const ratio = OUT_H / OUT_W, cw = x1 - x0, ch = y1 - y0;
  if (ch < cw * ratio) { const add = (cw * ratio - ch) / 2; y0 -= add; y1 += add; }
  else { const add = (ch / ratio - cw) / 2; x0 -= add; x1 += add; }
  const s = OUT_W / (x1 - x0);

  const out = document.createElement('canvas');
  out.width = OUT_W; out.height = OUT_H;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, OUT_W, OUT_H);
  ctx.scale(s, s);
  ctx.translate(-x0, -y0);
  ctx.translate(r.center.x, r.center.y);
  ctx.rotate(-r.angle);
  ctx.translate(-r.center.x, -r.center.y);
  ctx.drawImage(c, 0, 0);

  const pts = [];
  for (const i of CS.KEEP) pts.push(Math.round((r.pts[i].x - x0) * s * 10) / 10, Math.round((r.pts[i].y - y0) * s * 10) / 10);
  const m = {};
  for (const key of ['length', 'forehead', 'jaw', 'chin', 'jawAngle']) m[key] = Math.round(r.m[key] * 1000) / 1000;
  return {
    id: Date.now().toString(36), date: Date.now(), w: OUT_W, h: OUT_H,
    img: out.toDataURL('image/jpeg', .82), pts,
    result: { shape: r.shape, matches: r.matches, m, reasons: r.reasons, warnings: r.warnings }
  };
}

// ---------- Events ----------

document.addEventListener('click', async e => {
  const tabBtn = e.target.closest('nav.bar button');
  if (tabBtn) return showTab(tabBtn.dataset.tab);
  if (e.target.id === 'sheet-wrap') return closeSheet();
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;

  if (act === 'camera') { $('#busy').classList.add('hidden'); openCamera(); }
  else if (act === 'upload') { closeCamera(); pickFile(false); }
  else if (act === 'shoot') shoot();
  else if (act === 'cam-close') closeCamera();
  else if (act === 'busy-close') $('#busy').classList.add('hidden');
  else if (act === 'open-scan') { S.current = el.dataset.id; showTab('result'); $('#tab-result').scrollTop = 0; }
  else if (act === 'shape') shapeSheet(el.dataset.id);
  else if (act === 'close-sheet') closeSheet();
  else if (act === 'settings') settingsSheet();
  else if (act === 'lines') { S.lines = !S.lines; save(); renderResult(); }
  else if (act === 'guide') {
    S.guide = el.dataset.k; save();
    if (sheetShape) { const top = $('#sheet').scrollTop; shapeSheet(sheetShape); $('#sheet').scrollTop = top; }
    else { const tab = $('#tab-result'), top = tab.scrollTop; renderResult(); tab.scrollTop = top; }
  }
  else if (act === 'style') {
    S.style = el.dataset.k; save();
    el.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el));
    if (S.onboarded) render();
  }
  else if (act === 'start') { S.onboarded = true; save(); $('#onboard').classList.add('hidden'); render(); }
  else if (act === 'delete-scan') {
    if (!confirm('Delete this scan?')) return;
    S.scans = S.scans.filter(s => s.id !== el.dataset.id);
    S.current = null; save(); render();
  }
  else if (act === 'clear') {
    if (!confirm('Delete all your scans? This can’t be undone.')) return;
    S.scans = []; S.current = null; save(); closeSheet(); render();
  }
  else if (act === 'share') {
    const scan = currentScan(); if (!scan) return;
    const text = `My face shape is ${SHAPES[scan.result.shape].name} (${scan.result.matches[0].pct}% match), found with Contour.`;
    try {
      if (navigator.share) await navigator.share({ title: 'My face shape', text });
      else { await navigator.clipboard.writeText(text); el.lastChild.textContent = 'Copied'; }
    } catch { /* cancelled */ }
  }
});

$('#file').addEventListener('change', async e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  try { runScan(await loadFile(file)); }
  catch { alert('That file couldn’t be opened as a photo.'); }
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('#camera').classList.contains('hidden')) closeCamera();
  else closeSheet();
});
window.addEventListener('resize', () => { if (stream) sizeGuide(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && stream) closeCamera(); });

// ---------- Start ----------

$('#camera .close').innerHTML = ICON.x;
$('#camera .controls .side').innerHTML = ICON.image;
renderNav();
showTab(['scan', 'result', 'shapes'].includes(S.tab) ? S.tab : 'scan');
if (!S.onboarded) renderOnboard();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
