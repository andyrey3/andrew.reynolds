// Gleam — makeup and face editor. Photos are mapped on this device with
// MediaPipe's face landmarker and edited in a canvas. Recent edits are kept
// in localStorage; nothing is uploaded.

const KEY = 'gleam-v1';
const MAX_PROJECTS = 6;
const MAX_SIDE = 1080;

// MediaPipe (Apache-2.0) and the face model are the copies bundled with
// Facet on this same site, so no third-party code runs here. See NOTICE.
const MP = new URL('../facet/vendor/mediapipe', location.href).href;
const MODEL = new URL('../facet/vendor/face_landmarker.task', location.href).href;

const BLANK = () => ({
  look: null, strength: 1,
  skin: { smooth: 0, bright: 0, even: 0, warmth: 0 },
  shape: { slim: 0, eyes: 0, nose: 0, lips: 0, chin: 0 },
  teeth: 0,
  lips: { color: null, amount: .7, finish: 'satin' },
  shadow: { color: null, amount: .6 },
  liner: { color: null, amount: .8, style: 'thin' },
  lashes: 0,
  contacts: { color: null, amount: .6 },
  brows: { color: null, amount: .5 },
  blush: { color: null, amount: .5 },
  contour: { amount: 0, highlight: 0 }
});

let S = load();
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.projects)) {
      s.projects = s.projects.filter(p => p && typeof p.id === 'string' && typeof p.orig === 'string' && p.orig.startsWith('data:image/jpeg') && Array.isArray(p.lm) && p.lm.length === 478 * 2);
      return s;
    }
  } catch { /* start fresh */ }
  return { projects: [] };
}
function save() {
  for (;;) {
    try { localStorage.setItem(KEY, JSON.stringify(S)); return true; }
    catch { if (!S.projects.length) return false; S.projects.shift(); }
  }
}

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));
const sv = (b, x = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${x}>${b}</svg>`;
const ICON = {
  logo: sv('<path d="M12 3c1.2 4.3 3.7 6.8 8 8-4.3 1.2-6.8 3.7-8 8-1.2-4.3-3.7-6.8-8-8 4.3-1.2 6.8-3.7 8-8z"/>', 'stroke-width="2.2"'),
  camera: sv('<path d="M20 7h-3l-2-3H9L7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z"/><circle cx="12" cy="13" r="3.5"/>'),
  image: sv('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>'),
  back: sv('<path d="m15 6-6 6 6 6"/>', 'stroke-width="2.4"'),
  x: sv('<path d="M6 6l12 12M18 6 6 18"/>', 'stroke-width="2.4"'),
  none: sv('<circle cx="12" cy="12" r="8"/><path d="m6.5 6.5 11 11"/>'),
  compare: sv('<path d="M12 3v18"/><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9v6" opacity=".5"/>'),
  reset: sv('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'),
  download: sv('<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>'),
  looks: sv('<path d="M12 3c1.2 4.3 3.7 6.8 8 8-4.3 1.2-6.8 3.7-8 8-1.2-4.3-3.7-6.8-8-8 4.3-1.2 6.8-3.7 8-8z"/>'),
  skin: sv('<path d="M12 3c4.5 0 7 3.2 7 7.5 0 5.5-3.5 10.5-7 10.5s-7-5-7-10.5C5 6.2 7.5 3 12 3z"/><path d="M9 9.5c.8-.6 1.8-.6 2.5 0"/>'),
  reshape: sv('<path d="M8 4C5 6 4.5 13 7 17c1.3 2 3 3 5 3s3.7-1 5-3c2.5-4 2-11-1-13"/><path d="m4 11 3 1M20 11l-3 1"/>'),
  lips: sv('<path d="M3 12c2.5-4 5-5 6.5-3.8L12 9.5l2.5-1.3C16 7 18.5 8 21 12c-3 4-6 5.5-9 5.5S6 16 3 12z"/><path d="M3 12h18"/>'),
  eyes: sv('<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  brows: sv('<path d="M3 13c3-4 7-5 10-4.5"/><path d="M14 9.5c2.5-.3 5 .5 7 2.5"/>', 'stroke-width="2.6"'),
  blush: sv('<circle cx="8" cy="13" r="4"/><circle cx="16" cy="13" r="4"/><path d="M6.5 13h3M14.5 13h3" opacity=".6"/>'),
  contour: sv('<path d="M12 3c4.5 0 7 3.2 7 7.5 0 5.5-3.5 10.5-7 10.5s-7-5-7-10.5C5 6.2 7.5 3 12 3z"/><path d="M6.5 13c1.5-1 3-1.2 4-1M17.5 13c-1.5-1-3-1.2-4-1M12 7v6"/>'),
  teeth: sv('<path d="M4 9c0-3 3-5 8-5s8 2 8 5c0 4-1.5 11-3.5 11-1.8 0-1.5-5-4.5-5s-2.7 5-4.5 5C5.5 20 4 13 4 9z"/>')
};

const CATS = [
  ['looks', 'Looks'], ['skin', 'Skin'], ['reshape', 'Reshape'], ['lips', 'Lips'], ['eyes', 'Eyes'],
  ['brows', 'Brows'], ['blush', 'Blush'], ['contour', 'Contour'], ['teeth', 'Teeth']
];

// ---------- Home ----------

function renderHome() {
  const feats = [['lips', 'Lipstick'], ['eyes', 'Eye looks'], ['skin', 'Retouch'], ['reshape', 'Reshape']];
  $('#home').innerHTML = `<div class="wrap">
    <div class="brand"><i>${ICON.logo}</i>Gleam</div>
    <div class="hero">
      <h1>Try on makeup in seconds</h1>
      <p>Take a selfie to try lipstick, eyeshadow, blush and full looks, smooth your skin and fine-tune your features.</p>
      <div class="row">
        <button class="btn primary" data-act="camera">${ICON.camera}Selfie</button>
        <button class="btn ghost" data-act="upload">${ICON.image}Photo</button>
      </div>
    </div>
    <div class="feats">${feats.map(([i, n]) => `<div class="feat">${ICON[i]}${n}</div>`).join('')}</div>
    ${S.projects.length ? `<h2 class="sec">Recent edits</h2><div class="recent">${[...S.projects].reverse().map(p => `
      <div class="item"><button data-act="open" data-id="${esc(p.id)}" aria-label="Open edit" style="display:block;width:100%;height:100%"><img src="${p.thumb}" alt=""></button>
      <button class="del" data-act="delete" data-id="${esc(p.id)}" aria-label="Delete edit">${ICON.x}</button></div>`).join('')}</div>` : ''}
    <p class="note">Photos are edited on your device and never uploaded.</p>
  </div>`;
}

// ---------- Camera ----------

let stream = null;
async function openCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return pickFile(true);
  const cam = $('#camera'), video = cam.querySelector('video');
  cam.classList.remove('hidden');
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false }); }
  catch { cam.classList.add('hidden'); return pickFile(true); }
  video.srcObject = stream;
  await video.play().catch(() => {});
  getLandmarker().catch(() => {});
}
function closeCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
  $('#camera').classList.add('hidden');
}
function shoot() {
  const video = $('#camera video');
  if (!video.videoWidth) return;
  const view = $('#camera .view'), sa = view.clientWidth / view.clientHeight, vw = video.videoWidth, vh = video.videoHeight;
  let cx = 0, cy = 0, cw = vw, ch = vh;
  if (vw / vh > sa) { cw = vh * sa; cx = (vw - cw) / 2; } else { ch = vw / sa; cy = (vh - ch) / 2; }
  const c = document.createElement('canvas');
  c.width = Math.round(cw); c.height = Math.round(ch);
  const ctx = c.getContext('2d');
  ctx.translate(c.width, 0); ctx.scale(-1, 1);
  ctx.drawImage(video, cx, cy, cw, ch, 0, 0, c.width, c.height);
  const flash = $('#camera .flash');
  flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
  setTimeout(() => { closeCamera(); startFromImage(c); }, 250);
}
function pickFile(useCamera) {
  const f = $('#file');
  if (useCamera) f.setAttribute('capture', 'user'); else f.removeAttribute('capture');
  f.value = ''; f.click();
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('bad image'));
    img.src = src;
  });
}

// ---------- Face model ----------

let LM = null;
function getLandmarker() {
  if (!LM) {
    LM = (async () => {
      const v = await import(`${MP}/vision_bundle.mjs`);
      const files = await v.FilesetResolver.forVisionTasks(`${MP}/wasm`);
      const make = delegate => v.FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'IMAGE', numFaces: 1 });
      try { return await make('GPU'); } catch { return await make('CPU'); }
    })();
    LM.catch(() => { LM = null; });
  }
  return LM;
}

function busy(html) { const b = $('#busy'); b.innerHTML = html; b.classList.remove('hidden'); }
function unbusy() { $('#busy').classList.add('hidden'); }
function fail(title, msg) {
  busy(`<h2>${title}</h2><p>${msg}</p><div class="row"><button class="btn primary sm" data-act="camera">${ICON.camera}Try again</button><button class="btn ghost sm" data-act="busy-close">Cancel</button></div>`);
}

async function startFromImage(src) {
  const sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
  const k = Math.min(1, MAX_SIDE / Math.max(sw, sh));
  const c = document.createElement('canvas');
  c.width = Math.round(sw * k); c.height = Math.round(sh * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);

  busy('<div class="spin"></div><h2>Loading face model</h2><p>About 4 MB the first time, then it works offline.</p>');
  let lmk;
  try { lmk = await getLandmarker(); }
  catch { return fail('Couldn’t load the face model', 'Check your internet connection and try again.'); }
  busy('<div class="spin"></div><h2>Finding your face</h2><p>Mapping 478 points so makeup lands in the right place.</p>');
  await wait(50);
  let res;
  try { res = lmk.detect(c); } catch { res = null; }
  const lm = res && res.faceLandmarks && res.faceLandmarks[0];
  if (!lm) return fail('No face found', 'Use a photo where your whole face is visible, well lit and facing the camera.');
  const pts = lm.map(p => ({ x: p.x * c.width, y: p.y * c.height }));
  unbusy();
  openEditor({ id: Date.now().toString(36), photo: c, pts, params: BLANK(), isNew: true });
}

// ---------- Editor ----------

let ED = null;   // { id, photo, pts, params, engine, cat, eyeSub, dirty }

function openEditor(e) {
  ED = { ...e, engine: GE.Editor(e.photo, e.pts), cat: 'looks', eyeSub: 'shadow', dirty: !!e.isNew };
  $('#editor').classList.remove('hidden');
  $('#home').classList.add('hidden');
  renderCats(); renderPanel(); draw(true);
}

async function closeEditor() {
  if (ED && ED.dirty) storeProject();
  ED = null;
  $('#editor').classList.add('hidden');
  $('#home').classList.remove('hidden');
  renderHome();
}

let drawQueued = false;
function draw(now) {
  if (!ED) return;
  if (drawQueued && !now) return;
  drawQueued = true;
  $('#working').classList.remove('hidden');
  // Let the spinner paint before the heavy work
  requestAnimationFrame(() => setTimeout(() => {
    drawQueued = false;
    if (!ED) return;
    ED.engine.render($('#view'), ED.params);
    $('#working').classList.add('hidden');
  }, 0));
}

function renderCats() {
  $('#cats').innerHTML = CATS.map(([id, n]) => `<button class="${ED.cat === id ? 'on' : ''}" data-act="cat" data-id="${id}">${ICON[id]}${n}</button>`).join('');
}

const pct = v => Math.round(v * 100);
function slider(path, label, min = 0, max = 1) {
  const v = getPath(path);
  const fill = (v - min) / (max - min) * 100;
  return `<label class="slider"><span>${label}</span><input type="range" min="${min}" max="${max}" step="0.01" value="${v}" data-path="${path}" style="--fill:${fill}%"><output>${min < 0 && v > 0 ? '+' : ''}${pct(v)}</output></label>`;
}
function swatches(path, list) {
  const cur = getPath(path);
  return `<div class="hscroll"><button class="sw none ${cur ? '' : 'on'}" data-act="swatch" data-path="${path}" data-v="" aria-label="None">${ICON.none}</button>${list.map(([c, n]) => `<button class="sw ${cur === c ? 'on' : ''}" style="background:${c}" data-act="swatch" data-path="${path}" data-v="${c}" aria-label="${esc(n)}" title="${esc(n)}"></button>`).join('')}</div>`;
}
function chips(path, opts) {
  const cur = getPath(path);
  return `<div class="chips">${opts.map(([v, n]) => `<button class="chip ${cur === v ? 'on' : ''}" data-act="opt" data-path="${path}" data-v="${v}">${n}</button>`).join('')}</div>`;
}
function head(label, resetKey) { return `<div class="panel-head"><span>${label}</span><button data-act="reset" data-k="${resetKey}">Reset</button></div>`; }

function lookDot(l) {
  const c = (l.lips || [])[0] || '#7a6a72', s = (l.shadow || [])[0] || (l.blush || [])[0] || '#d9c2b8', b = (l.blush || [])[0] || c;
  return `<div class="dot" style="background:linear-gradient(135deg, ${s} 0 45%, ${b} 45% 70%, ${c} 70%)"></div>`;
}

function renderPanel() {
  const p = ED.params;
  let h = '';
  switch (ED.cat) {
    case 'looks':
      h = head('Ready-made looks', 'looks') + `<div class="hscroll">
        <button class="look ${p.look ? '' : 'on'}" data-act="look" data-id=""><div class="dot sw none" style="width:58px;height:58px;border-radius:18px;display:grid;place-items:center">${ICON.none}</div>None</button>
        ${LOOKS.map(l => `<button class="look ${p.look === l.id ? 'on' : ''}" data-act="look" data-id="${l.id}">${lookDot(l)}${esc(l.name)}</button>`).join('')}</div>
        ${p.look ? slider('strength', 'Strength') : ''}`;
      break;
    case 'skin':
      h = head('Retouch', 'skin') + slider('skin.smooth', 'Smooth') + slider('skin.even', 'Even tone') + slider('skin.bright', 'Brighten') + slider('skin.warmth', 'Warmth', -1, 1);
      break;
    case 'reshape':
      h = head('Reshape', 'shape') + slider('shape.slim', 'Slim face') + slider('shape.eyes', 'Bigger eyes') + slider('shape.nose', 'Slim nose') + slider('shape.lips', 'Fuller lips') + slider('shape.chin', 'Chin', -1, 1);
      break;
    case 'lips':
      h = head('Lipstick', 'lips') + swatches('lips.color', PALETTE.lips) + chips('lips.finish', [['matte', 'Matte'], ['satin', 'Satin'], ['gloss', 'Gloss']]) + (p.lips.color ? slider('lips.amount', 'Intensity') : '');
      break;
    case 'eyes': {
      const sub = ED.eyeSub;
      h = `<div class="chips">${[['shadow', 'Eyeshadow'], ['liner', 'Eyeliner'], ['lashes', 'Lashes'], ['contacts', 'Eye color']].map(([k, n]) => `<button class="chip ${sub === k ? 'on' : ''}" data-act="eyesub" data-k="${k}">${n}</button>`).join('')}</div>`;
      if (sub === 'shadow') h += swatches('shadow.color', PALETTE.shadow) + (p.shadow.color ? slider('shadow.amount', 'Intensity') : '');
      if (sub === 'liner') h += swatches('liner.color', PALETTE.liner) + chips('liner.style', [['thin', 'Thin'], ['bold', 'Bold'], ['wing', 'Winged']]) + (p.liner.color ? slider('liner.amount', 'Intensity') : '');
      if (sub === 'lashes') h += slider('lashes', 'Volume');
      if (sub === 'contacts') h += swatches('contacts.color', PALETTE.contacts) + (p.contacts.color ? slider('contacts.amount', 'Intensity') : '');
      break;
    }
    case 'brows':
      h = head('Brow color', 'brows') + swatches('brows.color', PALETTE.brows) + (p.brows.color ? slider('brows.amount', 'Fill') : '');
      break;
    case 'blush':
      h = head('Blush', 'blush') + swatches('blush.color', PALETTE.blush) + (p.blush.color ? slider('blush.amount', 'Intensity') : '');
      break;
    case 'contour':
      h = head('Contour & highlight', 'contour') + slider('contour.amount', 'Contour') + slider('contour.highlight', 'Highlight');
      break;
    case 'teeth':
      h = head('Teeth', 'teeth') + slider('teeth', 'Whiten') + '<p class="small muted" style="padding:6px 16px">Works when your teeth show in the photo.</p>';
      break;
  }
  $('#panel').innerHTML = h;
}

function getPath(path) { return path.split('.').reduce((o, k) => o[k], ED.params); }
function setPath(path, v) {
  const keys = path.split('.'), last = keys.pop();
  keys.reduce((o, k) => o[k], ED.params)[last] = v;
}

function resetPart(k) {
  const b = BLANK();
  if (k === 'looks') ED.params = b;
  else if (k === 'shape') ED.params.shape = b.shape;
  else if (k === 'skin') ED.params.skin = b.skin;
  else ED.params[k] = b[k];
}

// ---------- Save ----------

function thumbOf(canvas) {
  const w = 240, h = Math.round(240 * canvas.height / canvas.width);
  const t = document.createElement('canvas'); t.width = w; t.height = h;
  t.getContext('2d').drawImage(canvas, 0, 0, w, h);
  return t.toDataURL('image/jpeg', .75);
}

function storeProject() {
  const lm = [];
  for (const p of ED.pts) lm.push(Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10);
  const rec = { id: ED.id, date: Date.now(), orig: ED.orig || (ED.orig = ED.photo.toDataURL('image/jpeg', .88)), lm, params: ED.params, thumb: thumbOf($('#view')) };
  S.projects = S.projects.filter(p => p.id !== ED.id);
  S.projects.push(rec);
  while (S.projects.length > MAX_PROJECTS) S.projects.shift();
  save();
  ED.dirty = false;
}

async function exportImage(btn) {
  const canvas = $('#view');
  storeProject();
  const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', .92));
  if (!blob) return;
  const name = `gleam-${new Date().toISOString().slice(0, 10)}.jpg`;
  const file = new File([blob], name, { type: 'image/jpeg' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); return; }
  } catch (err) { if (err && err.name === 'AbortError') return; }
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  btn.lastChild.textContent = 'Saved';
  setTimeout(() => { if (btn.isConnected) btn.lastChild.textContent = 'Save'; }, 1800);
}

async function openProject(id) {
  const p = S.projects.find(x => x.id === id);
  if (!p) return;
  try {
    const img = await loadImage(p.orig);
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    const pts = [];
    for (let i = 0; i < p.lm.length; i += 2) pts.push({ x: p.lm[i], y: p.lm[i + 1] });
    const params = Object.assign(BLANK(), p.params);
    openEditor({ id: p.id, photo: c, pts, params, orig: p.orig });
  } catch { alert('That edit couldn’t be opened.'); }
}

// ---------- Events ----------

document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'camera') { unbusy(); openCamera(); }
  else if (act === 'upload') { closeCamera(); pickFile(false); }
  else if (act === 'shoot') shoot();
  else if (act === 'cam-close') closeCamera();
  else if (act === 'busy-close') unbusy();
  else if (act === 'open') openProject(el.dataset.id);
  else if (act === 'delete') {
    if (!confirm('Delete this edit?')) return;
    S.projects = S.projects.filter(p => p.id !== el.dataset.id); save(); renderHome();
  }
  else if (!ED) return;
  else if (act === 'close-editor') closeEditor();
  else if (act === 'save') exportImage(el);
  else if (act === 'reset-all') { if (confirm('Remove all edits from this photo?')) { ED.params = BLANK(); ED.dirty = true; renderPanel(); draw(); } }
  else if (act === 'cat') { ED.cat = el.dataset.id; renderCats(); renderPanel(); }
  else if (act === 'eyesub') { ED.eyeSub = el.dataset.k; renderPanel(); }
  else if (act === 'reset') { resetPart(el.dataset.k); ED.dirty = true; renderPanel(); draw(); }
  else if (act === 'look') {
    const look = LOOKS.find(l => l.id === el.dataset.id);
    const keep = { shape: ED.params.shape, teeth: ED.params.teeth, contacts: ED.params.contacts };
    ED.params = look ? Object.assign(lookParams(look, ED.params.look ? ED.params.strength : .8, BLANK()), keep) : Object.assign(BLANK(), keep);
    ED.dirty = true; renderPanel(); draw();
  }
  else if (act === 'swatch') { setPath(el.dataset.path, el.dataset.v || null); ED.dirty = true; renderPanel(); draw(); }
  else if (act === 'opt') { setPath(el.dataset.path, el.dataset.v); ED.dirty = true; renderPanel(); draw(); }
});

document.addEventListener('input', e => {
  const el = e.target;
  if (!ED || !el.matches('input[type=range][data-path]')) return;
  const v = parseFloat(el.value), min = parseFloat(el.min), max = parseFloat(el.max);
  el.style.setProperty('--fill', `${(v - min) / (max - min) * 100}%`);
  el.nextElementSibling.textContent = `${min < 0 && v > 0 ? '+' : ''}${pct(v)}`;
  if (el.dataset.path === 'strength') {
    const look = LOOKS.find(l => l.id === ED.params.look);
    if (look) {
      const keep = { shape: ED.params.shape, teeth: ED.params.teeth, contacts: ED.params.contacts };
      ED.params = Object.assign(lookParams(look, v, BLANK()), keep);
    }
  } else setPath(el.dataset.path, v);
  ED.dirty = true;
  draw();
});

// Hold to see the original photo
const cmp = $('#compare');
const showOriginal = on => {
  if (!ED) return;
  $('#before').classList.toggle('hidden', !on);
  if (on) { const v = $('#view'); v.getContext('2d').drawImage(ED.photo, 0, 0); }
  else ED.engine.render($('#view'), ED.params);
};
cmp.addEventListener('pointerdown', e => { e.preventDefault(); showOriginal(true); });
for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) cmp.addEventListener(ev, () => { if (!$('#before').classList.contains('hidden')) showOriginal(false); });
cmp.addEventListener('contextmenu', e => e.preventDefault());

$('#file').addEventListener('change', async e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  try { const img = await loadImage(url); startFromImage(img); }
  catch { alert('That file couldn’t be opened as a photo.'); }
  finally { URL.revokeObjectURL(url); }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (stream) closeCamera(); if (ED && ED.dirty) storeProject(); }
});

// ---------- Start ----------

document.querySelector('[data-act="close-editor"]').innerHTML = ICON.back;
document.querySelector('[data-act="reset-all"]').innerHTML = ICON.reset;
cmp.innerHTML = ICON.compare;
document.querySelector('[data-act="save"]').innerHTML = `${ICON.download}<span>Save</span>`;
$('#camera .close').innerHTML = ICON.x;
$('#camera .controls .side').innerHTML = ICON.image;
renderHome();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
