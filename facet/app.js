// Facet — face analysis. Photos are measured on the device with MediaPipe's
// face landmarker; scans, answers and your daily plan are stored in
// localStorage on this device and nothing is uploaded.

const KEY = 'facet-v1';
const DEFAULTS = {
  onboarded: false, sex: null, answers: {}, scans: [], current: null,
  checks: {}, tab: 'scan', view: 'features'
};
let S = load();

function load() {
  const fresh = JSON.parse(JSON.stringify(DEFAULTS));
  try { return Object.assign(fresh, JSON.parse(localStorage.getItem(KEY)) || {}); }
  catch { return fresh; }
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

const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const MAX_SCANS = 40;
const OUT_W = 480, OUT_H = 600;

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmtDate = t => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const wait = ms => new Promise(r => setTimeout(r, ms));

const ICON = {
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7h-3l-2-3H9L7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
  face: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5c-4 0-7 3.2-7 8 0 5.3 3.4 10 7 10s7-4.7 7-10c0-4.8-3-8-7-8z"/><path d="M8.5 10.5h2M13.5 10.5h2M12 11v3.5l-1 .8M10 17.2c1.3.8 2.7.8 4 0"/></svg>',
  ruler: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>'
};

const FEATURE_INFO = {
  eyes: 'How your eyes are shaped, tilted and spaced.',
  jaw: 'Jaw width against your cheekbones and how your chin balances your upper lip.',
  symmetry: 'How closely the two sides of your face mirror each other.',
  harmony: 'How your facial thirds, fifths and overall width and height fit together.',
  nose: 'Nose width compared with the space between your eyes.',
  lips: 'Lip fullness and mouth width compared with your nose.'
};

// ---------- Scores ----------

const tierClass = v => v >= 85 ? 's-good' : v >= 70 ? 's-ok' : v >= 55 ? 's-warn' : 's-bad';
const tierName = v => v >= 90 ? 'Exceptional' : v >= 80 ? 'Great' : v >= 70 ? 'Good' : v >= 60 ? 'Average' : 'Room to grow';
function ring(v, cls = '') {
  const c = 2 * Math.PI * 26;
  return `<svg class="ring ${cls}" viewBox="0 0 60 60" aria-hidden="true"><circle class="bg" cx="30" cy="30" r="26"/><circle class="fg" cx="30" cy="30" r="26" stroke-dasharray="${(c * v / 100).toFixed(1)} ${c.toFixed(1)}"/></svg>`;
}

// Scores are recomputed from the saved points, so they always use the
// current sex setting and ideal ranges.
const reportCache = new Map();
function report(scan) {
  const k = scan.id + S.sex;
  if (!reportCache.has(k)) {
    const lm = [];
    for (let i = 0; i < scan.pts.length; i += 2) lm.push({ x: scan.pts[i] / scan.w, y: scan.pts[i + 1] / scan.h });
    reportCache.set(k, FA.analyze(lm, scan.w, scan.h, S.sex));
  }
  return reportCache.get(k);
}
const ptsOf = scan => {
  const out = [];
  for (let i = 0; i < scan.pts.length; i += 2) out.push({ x: scan.pts[i], y: scan.pts[i + 1] });
  return out;
};
const curScan = () => S.scans.find(s => s.id === S.current) || S.scans[S.scans.length - 1] || null;

function fmtMetric(k, m, v = m.value) {
  if (k === 'tilt') return `${v >= 0 ? '+' : ''}${v.toFixed(1)}°`;
  if (k === 'symmetry') return `${v.toFixed(1)}%`;
  return v.toFixed(m.dp) + m.unit;
}
function idealText(k, m) {
  if (k === 'symmetry') return `under ${m.hi}%`;
  if (k === 'tilt') return `+${m.lo}° to +${m.hi}°`;
  return `${m.lo}–${m.hi}${m.unit}`;
}

// ---------- Overlays ----------

function overlay(scan, view) {
  const p = ptsOf(scan), P = FA.P, O = FA.OUTLINE;
  const fs = scan.w / 26;
  const poly = (ids, cls = '') => `<polyline class="o ${cls}" points="${ids.map(i => `${p[i].x.toFixed(1)},${p[i].y.toFixed(1)}`).join(' ')}"/>`;
  const line = (a, b, cls = '') => `<line class="o ${cls}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"/>`;
  const hline = (y, x0, x1, cls) => line({ x: x0, y }, { x: x1, y }, cls);
  const label = (x, y, t, anchor = 'start') => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${fs.toFixed(1)}" text-anchor="${anchor}">${esc(t)}</text>`;
  const r = report(scan), m = r.metrics;
  const left = p[P.cheekA].x - scan.w * .04, right = p[P.cheekB].x + scan.w * .04;
  const ext = (a, b, k) => ({ x: a.x + (a.x - b.x) * k, y: a.y + (a.y - b.y) * k });
  const midline = () => {
    const top = p[P.top], bot = p[P.chin];
    return line(ext(top, bot, .15), ext(bot, top, .08), 'g');
  };

  const parts = {
    features: () => [O.face, O.eyeA, O.eyeB, O.browA, O.browB, O.lips, O.nose, O.noseBase].map(ids => poly(ids)).join(''),
    mesh: () => p.map(q => `<circle class="dot" cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="${(scan.w / 360).toFixed(2)}"/>`).join(''),
    ratios: () => {
      const ys = [p[P.glabella].y, p[P.subnasale].y, p[P.chin].y];
      const eyeY = (p[P.eyeOutA].y + p[P.eyeOutB].y) / 2, h = scan.w * .07;
      const xs = [P.cheekA, P.eyeOutA, P.eyeInA, P.eyeInB, P.eyeOutB, P.cheekB].map(i => p[i].x);
      return ys.map(y => hline(y, left, right, 'g')).join('') +
        xs.map(x => line({ x, y: eyeY - h }, { x, y: eyeY + h }, 'h')).join('') +
        label(right - 4, (ys[0] + ys[1]) / 2, 'Mid', 'end') + label(right - 4, (ys[1] + ys[2]) / 2, 'Lower', 'end');
    },
    eyes: () => poly(O.eyeA) + poly(O.eyeB) +
      line(ext(p[P.eyeInA], p[P.eyeOutA], .2), ext(p[P.eyeOutA], p[P.eyeInA], .35), 'h') +
      line(ext(p[P.eyeInB], p[P.eyeOutB], .2), ext(p[P.eyeOutB], p[P.eyeInB], .35), 'h') +
      hline(p[P.irisA].y, p[P.eyeOutA].x - scan.w * .05, p[P.eyeOutB].x + scan.w * .05, 'g') +
      label(p[P.eyeOutA].x, p[P.eyeTopA].y - fs * .8, fmtMetric('tilt', m.tilt, r.extra.tiltA)) +
      label(p[P.eyeOutB].x, p[P.eyeTopB].y - fs * .8, fmtMetric('tilt', m.tilt, r.extra.tiltB), 'end'),
    jaw: () => poly(O.jaw) + line(p[P.jawA], p[P.jawB], 'h') + line(p[P.cheekA], p[P.cheekB], 'g') +
      hline(p[P.lipBottom].y, p[P.mouthA].x, p[P.mouthB].x, 'g') + hline(p[P.subnasale].y, p[P.alarA].x, p[P.alarB].x, 'g') +
      label((p[P.jawA].x + p[P.jawB].x) / 2, p[P.jawA].y - fs * .5, fmtMetric('jaw', m.jaw), 'middle'),
    symmetry: () => midline() + poly(O.face) +
      [[33, 263], [133, 362], [105, 334], [129, 358], [61, 291], [172, 397], [234, 454]].map(([a, b]) => line(p[a], p[b], 'h')).join(''),
    harmony: () => parts.ratios(),
    nose: () => poly(O.noseBase) + poly(O.nose) + line(p[P.alarA], p[P.alarB], 'h') + line(p[P.eyeInA], p[P.eyeInB], 'g') +
      label((p[P.alarA].x + p[P.alarB].x) / 2, p[P.alarA].y + fs * 1.6, fmtMetric('nose', m.nose), 'middle'),
    lips: () => poly(O.lips) + poly(O.lipLine) + line(p[P.mouthA], p[P.mouthB], 'h') + line(p[P.alarA], p[P.alarB], 'g'),
    off: () => ''
  };
  return `<svg viewBox="0 0 ${scan.w} ${scan.h}" aria-hidden="true">${(parts[view] || parts.features)()}</svg>`;
}
const photo = (scan, view) => `<div class="photo"><img src="${scan.img}" alt="Your scan" width="${scan.w}" height="${scan.h}">${overlay(scan, view)}</div>`;

// ---------- Onboarding ----------

let OB = null;
function startOnboarding(step = 0) {
  OB = { step, sex: S.sex, answers: { ...S.answers } };
  $('#main').classList.add('hidden');
  $('#onboard').classList.remove('hidden');
  renderOnboarding();
}
function renderOnboarding() {
  const quiz = FA.QUIZ, total = 2 + quiz.length;
  const dots = `<div class="dots">${Array.from({ length: total }, (_, i) => `<i class="${i === OB.step ? 'on' : ''}"></i>`).join('')}</div>`;
  let body;
  if (OB.step === 0) {
    body = `
      <img class="ob-art" src="icon-512.png" alt="">
      <h1>Know your face</h1>
      <p class="lead">Take a selfie and get scored on your eyes, jawline, symmetry and proportions, plus a plan to look your best.</p>
      <div class="features-list">
        <div><i>${ICON.ruler}</i><span><b>13 facial measurements</b>Canthal tilt, facial thirds, jaw ratio and more</span></div>
        <div><i>${ICON.spark}</i><span><b>A plan made for your face</b>Grooming, skin and style tips ranked by impact</span></div>
        <div><i>${ICON.chart}</i><span><b>Track your progress</b>Rescan and compare over time</span></div>
        <div><i>${ICON.lock}</i><span><b>Private by design</b>Photos are analyzed on your phone and never uploaded</span></div>
      </div>
      <div class="grow"></div>
      <button class="btn grad" data-act="ob-next">Get started</button>`;
  } else if (OB.step === 1) {
    body = `
      <h1>A little about you</h1>
      <p class="lead">Ideal jaw proportions and some tips differ by sex.</p>
      ${[['m', 'Male'], ['f', 'Female'], ['x', 'Rather not say']].map(([v, t]) => `<button class="opt ${OB.sex === v ? 'on' : ''}" data-act="ob-sex" data-v="${v}">${t}</button>`).join('')}
      <div class="grow"></div>
      <button class="btn grad" data-act="ob-next" ${OB.sex ? '' : 'disabled style="opacity:.4"'}>Continue</button>`;
  } else {
    const q = quiz[OB.step - 2];
    body = `
      <h1>${esc(q.q)}</h1>
      <p class="lead">This sets your potential score and builds your plan.</p>
      ${q.opts.map(([v, t]) => `<button class="opt ${OB.answers[q.id] === v ? 'on' : ''}" data-act="ob-ans" data-q="${q.id}" data-v="${v}">${esc(t)}</button>`).join('')}
      <div class="grow"></div>
      <button class="btn ghost" data-act="ob-back">Back</button>`;
  }
  $('#onboard').innerHTML = `<div class="ob"><div class="wrap">${OB.step ? dots : ''}${body}</div></div>`;
}
function finishOnboarding() {
  S.sex = OB.sex; S.answers = OB.answers; S.onboarded = true;
  reportCache.clear(); save(); OB = null;
  $('#onboard').classList.add('hidden');
  $('#main').classList.remove('hidden');
  showTab(S.tab);
}

// ---------- Tabs ----------

function showTab(t) {
  S.tab = t; save();
  document.querySelectorAll('.tab').forEach(el => el.classList.toggle('hidden', el.id !== 'tab-' + t));
  document.querySelectorAll('.nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  ({ scan: renderScan, results: renderResults, plan: renderPlan, progress: renderProgress })[t]();
}

const header = (eyebrow, title, right = '') => `<div class="top"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1></div>${right}</div>`;
const gearBtn = `<button class="icon-btn" data-act="settings" aria-label="Settings">${ICON.gear}</button>`;

function renderScan() {
  const last = S.scans[S.scans.length - 1];
  let lastCard = '';
  if (last) {
    const r = report(last);
    lastCard = `
      <div class="card"><button class="scan-row" data-act="open-scan" data-id="${last.id}">
        <img src="${last.img}" alt="">
        <span><b>Latest scan</b><small>${fmtDate(last.date)} · ${esc(tierName(r.overall))}</small></span>
        <span class="num ${tierClass(r.overall)}"><span class="tc">${r.overall}</span><small class="muted">overall</small></span>
      </button></div>`;
  }
  $('#tab-scan').innerHTML = `<div class="wrap">
    ${header('Facet', 'Face analysis', gearBtn)}
    <div class="hero">
      <div class="eyebrow">${last ? 'New scan' : 'Start here'}</div>
      <h2>Rate your face</h2>
      <p>Scores for your eyes, jawline, symmetry and proportions, plus what you can improve.</p>
      <div class="row-btns" style="margin-top:16px">
        <button class="btn white" data-act="camera">${ICON.camera}Selfie</button>
        <button class="btn glass" data-act="upload">${ICON.image}Upload</button>
      </div>
    </div>
    ${lastCard}
    <div class="card">
      <h3>For the most accurate scan</h3>
      <ul class="checks">
        <li>Face the camera straight on, phone at eye level</li>
        <li>Neutral face with lips gently closed</li>
        <li>Even, front-facing light. Avoid harsh shadows</li>
        <li>Hair off your forehead, glasses off</li>
        <li>Use the same setup each time to track progress</li>
      </ul>
    </div>
    <p class="note">Photos are analyzed on your phone and never uploaded. Scores compare your proportions with common ideals. They aren’t a measure of your worth.</p>
  </div>`;
}

function renderResults() {
  const scan = curScan(), el = $('#tab-results');
  if (!scan) {
    el.innerHTML = `<div class="wrap">${header('Results', 'Your results')}
      <div class="card empty">${ICON.face}<p>No scans yet. Take a selfie to see your scores.</p>
      <div class="row-btns"><button class="btn grad sm" data-act="camera">${ICON.camera}Selfie</button><button class="btn ghost sm" data-act="upload">${ICON.image}Upload</button></div></div></div>`;
    return;
  }
  const r = report(scan), pot = FA.potential(r.overall, S.answers);
  const views = [['features', 'Features'], ['ratios', 'Ratios'], ['mesh', 'Mesh'], ['off', 'Photo']];
  const sorted = [...r.features].sort((a, b) => b.score - a.score);
  const strengths = sorted.filter(f => f.score >= 80).slice(0, 3);
  const focus = sorted.filter(f => f.score < 80).reverse().slice(0, 3);
  const tips = FA.tipsFor(r, S.sex).filter(t => t.soft !== false).slice(0, 3);
  const habits = FA.habitsFor(S.answers).slice(0, Math.max(2, 5 - tips.length));
  const shape = FA.SHAPES[r.shape];
  const warns = scan.warn || [];

  el.innerHTML = `<div class="wrap">
    ${header(fmtDate(scan.date), 'Your results', `<button class="icon-btn" data-act="camera" aria-label="New scan">${ICON.camera}</button>`)}
    ${photo(scan, S.view)}
    <div class="seg">${views.map(([v, t]) => `<button class="${S.view === v ? 'on' : ''}" data-act="view" data-v="${v}">${t}</button>`).join('')}</div>
    <div class="summary">
      <div class="big main">${ring(r.overall)}<div><span>Overall</span><b>${r.overall}</b><small>${tierName(r.overall)}</small></div></div>
      <div class="big s-good">${ring(pot)}<div><span>Potential</span><b>${pot}</b><small>with your plan</small></div></div>
    </div>
    ${warns.length ? `<div class="card warn-card"><h3>Scan quality</h3>${warns.map(w => `<p>${esc(w)}</p>`).join('')}<button class="btn ghost sm" data-act="camera">Retake</button></div>` : ''}
    <h3>Feature scores</h3>
    <div class="feats">${r.features.map(f => `
      <button class="feat ${tierClass(f.score)}" data-act="feature" data-id="${f.id}">
        <div class="feat-top"><span>${f.name}</span><b class="tc">${f.score}</b></div>
        <div class="meter"><span style="width:${f.score}%"></span></div>
        <small>${tierName(f.score)}</small>
      </button>`).join('')}
    </div>
    <div class="card">
      <h3>Strengths</h3>
      <div class="tags" style="margin-bottom:14px">${strengths.length ? strengths.map(f => `<span class="tag good">${f.name} · ${f.score}</span>`).join('') : '<span class="tag">Keep scanning — your best features will show up here</span>'}</div>
      <h3>Focus areas</h3>
      <div class="tags">${focus.length ? focus.map(f => `<span class="tag warn">${f.name} · ${f.score}</span>`).join('') : '<span class="tag good">Everything scores 80 or higher</span>'}</div>
    </div>
    <div class="card">
      <div class="eyebrow">Face shape</div>
      <h2 style="margin:2px 0 6px">${cap(r.shape)}</h2>
      <p class="muted small">${esc(shape.d)}</p>
      <div class="kv">
        <div><b>Hair</b>${esc(shape.hair)}</div>
        <div><b>Glasses</b>${esc(shape.glasses)}</div>
        ${S.sex === 'f' ? '' : `<div><b>Facial hair</b>${esc(shape.beard)}</div>`}
      </div>
    </div>
    <div class="card">
      <h3>Top things to work on</h3>
      ${tips.map((t, i) => tipRow(t, i + 1)).join('')}
      ${habits.map((h, i) => tipRow({ t: h.t, d: h.d, cat: h.cat }, tips.length + i + 1)).join('')}
      <button class="btn grad sm" style="margin-top:12px" data-act="tab" data-v="plan">Open my plan</button>
    </div>
    <button class="btn ghost sm danger" data-act="delete-scan" data-id="${scan.id}">Delete this scan</button>
    <p class="note">Measurements come from 478 points mapped on your photo and are compared with common proportion ideals. Camera angle, lens and expression all move the numbers. Use them as a guide.</p>
  </div>`;
}

function tipRow(t, n) {
  const structural = t.soft === false;
  const tag = t.metric ? FA.METRIC_INFO[t.metric].name : t.cat;
  return `<div class="tip"><span class="n ${structural ? 's' : ''}">${structural ? 'i' : n}</span><div><b>${esc(t.t)}</b><p>${esc(t.d)}</p>${tag ? `<small>${esc(structural ? 'Good to know' : tag)}</small>` : ''}</div></div>`;
}

function featureSheet(id) {
  const scan = curScan(), r = report(scan), f = r.features.find(x => x.id === id);
  const tips = FA.tipsFor(r, S.sex).filter(t => f.metrics.includes(t.metric));
  const metricRows = f.metrics.map(k => {
    const m = r.metrics[k], info = FA.METRIC_INFO[k], tol = FA.ideals(S.sex)[k].tol;
    const min = k === 'symmetry' ? 0 : m.lo - 2.5 * tol, max = m.hi + 2.5 * tol;
    const pos = v => clamp((v - min) / (max - min) * 100, 0, 100);
    return `<div class="metric ${tierClass(m.score)}">
      <div class="metric-top"><span>${info.name}</span><b class="tc">${fmtMetric(k, m)}</b></div>
      <div class="scale"><span style="left:${pos(m.lo)}%;right:${100 - pos(m.hi)}%"></span><i style="left:${pos(m.value)}%"></i></div>
      <div class="scale-labels"><span>Ideal ${idealText(k, m)}</span><span>${m.score}/100</span></div>
      <p>${esc(info.what)}</p>
    </div>`;
  }).join('');
  let n = 0;
  openSheet(`
    <div class="sheet-top">
      <div class="${tierClass(f.score)}"><div class="ring-wrap">${ring(f.score)}<b>${f.score}</b></div><div><h2>${f.name}</h2><span class="muted small">${tierName(f.score)}</span></div></div>
      <button class="icon-btn" data-act="sheet-close" aria-label="Close">${ICON.x}</button>
    </div>
    <p class="muted small" style="margin-bottom:12px">${FEATURE_INFO[id]}</p>
    ${photo(scan, id)}
    <div class="card" style="margin-top:14px">${metricRows}</div>
    <div class="card">
      <h3>${tips.length ? 'How to improve' : 'Looking good'}</h3>
      ${tips.length ? tips.map(t => tipRow(t, t.soft === false ? 0 : ++n)).join('') : '<p class="muted small" style="margin:0">Every measurement here is inside the ideal range. Keep up your routine.</p>'}
    </div>`);
}

// ---------- Plan ----------

function planHabits() { return FA.habitsFor(S.answers); }
function doneOn(day) { return S.checks[day] || []; }
function dayGoal() { return Math.ceil(planHabits().length / 2); }
function streak() {
  const goal = dayGoal(), d = new Date();
  let n = 0;
  if (doneOn(dayKey(d)).length < goal) d.setDate(d.getDate() - 1);
  while (doneOn(dayKey(d)).length >= goal) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function renderPlan() {
  const habits = planHabits(), today = dayKey(), done = doneOn(today), goal = dayGoal();
  const scan = S.scans[S.scans.length - 1], r = scan && report(scan);
  const fixes = r ? FA.tipsFor(r, S.sex) : [];
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d; });
  const st = streak();
  let n = 0;
  const lastAge = scan ? Math.floor((Date.now() - scan.date) / 864e5) : null;

  $('#tab-plan').innerHTML = `<div class="wrap">
    ${header('Daily plan', 'Your glow-up', gearBtn)}
    <div class="hero">
      <div class="eyebrow">Today</div>
      <h2>${done.length} of ${habits.length} done</h2>
      <p>${st ? `${st}-day streak. ` : ''}${done.length >= goal ? 'Today counts toward your streak.' : `Finish ${goal - done.length} more to count today.`}</p>
      <div class="progress-line"><span style="width:${done.length / habits.length * 100}%"></span></div>
      <div class="week">${days.map(d => `<div><i class="${doneOn(dayKey(d)).length >= goal ? 'on' : ''} ${dayKey(d) === today ? 'today' : ''}"></i>${d.toLocaleDateString(undefined, { weekday: 'narrow' })}</div>`).join('')}</div>
    </div>
    <div class="card">
      <h3>Daily habits</h3>
      ${habits.map(h => `<button class="habit ${done.includes(h.id) ? 'done' : ''}" data-act="habit" data-id="${h.id}"><span class="box">${ICON.check}</span><span><small>${h.cat}</small><b>${esc(h.t)}</b><p>${esc(h.d)}</p></span></button>`).join('')}
    </div>
    <div class="card">
      <h3>Fixes for your face</h3>
      ${!r ? `<p class="muted small">Scan your face to get fixes for your features.</p><button class="btn grad sm" data-act="camera">${ICON.camera}Scan now</button>`
        : fixes.length ? fixes.map(t => tipRow(t, t.soft === false ? 0 : ++n)).join('')
        : '<p class="muted small" style="margin:0">All your measurements are inside the ideal ranges. Focus on the daily habits.</p>'}
    </div>
    ${r ? `<div class="card">
      <div class="eyebrow">Your face shape</div>
      <h2 style="margin:2px 0 10px">${cap(r.shape)}</h2>
      <div class="kv">
        <div><b>Hair</b>${esc(FA.SHAPES[r.shape].hair)}</div>
        <div><b>Glasses</b>${esc(FA.SHAPES[r.shape].glasses)}</div>
        ${S.sex === 'f' ? '' : `<div><b>Facial hair</b>${esc(FA.SHAPES[r.shape].beard)}</div>`}
      </div>
    </div>
    <div class="card">
      <h3>Rescan every 2 weeks</h3>
      <p class="muted small">${lastAge === 0 ? 'Your last scan was today.' : `Your last scan was ${lastAge} day${lastAge === 1 ? '' : 's'} ago.`} Same light, same distance, same expression, so the changes you see are real.</p>
      <button class="btn ghost sm" data-act="camera">${ICON.camera}New scan</button>
    </div>` : ''}
  </div>`;
}

// ---------- Progress ----------

function renderProgress() {
  const scans = S.scans, el = $('#tab-progress');
  if (!scans.length) {
    el.innerHTML = `<div class="wrap">${header('Progress', 'Your progress')}
      <div class="card empty">${ICON.chart}<p>Your scans will show up here so you can see how you change over time.</p>
      <button class="btn grad sm" data-act="camera">${ICON.camera}First scan</button></div></div>`;
    return;
  }
  const rs = scans.map(report);
  const first = rs[0], last = rs[rs.length - 1], delta = last.overall - first.overall;
  let chart = '';
  if (scans.length > 1) {
    const vals = rs.map(r => r.overall), lo = Math.max(0, Math.min(...vals) - 8), hi = Math.min(100, Math.max(...vals) + 8);
    const W = 300, H = 150, x = i => i / (vals.length - 1) * W, y = v => H - (v - lo) / (hi - lo || 1) * H;
    const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    chart = `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:baseline"><h3>Overall score</h3><b class="${delta > 0 ? 'up' : delta < 0 ? 'down' : 'muted'}">${delta > 0 ? '+' : ''}${delta}</b></div>
      <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="Overall score over time">
        ${[.25, .5, .75].map(f => `<line class="gl" x1="0" x2="${W}" y1="${H * f}" y2="${H * f}"/>`).join('')}
        <polygon class="ar" points="0,${H} ${pts} ${W},${H}"/><polyline class="ln" points="${pts}"/>
      </svg>
      <div class="chart-labels"><span>${fmtDate(scans[0].date)}</span><span>${fmtDate(scans[scans.length - 1].date)}</span></div>
    </div>
    <div class="card">
      <h3>First vs latest</h3>
      <div class="cmp">
        <span class="h">Feature</span><span class="h r">First</span><span class="h r">Now</span><span class="h r">Change</span>
        ${[{ name: 'Overall', a: first.overall, b: last.overall }].concat(first.features.map((f, i) => ({ name: f.name, a: f.score, b: last.features[i].score }))).map(o => {
          const d = o.b - o.a;
          return `<span>${o.name}</span><span class="r muted">${o.a}</span><span class="r">${o.b}</span><span class="r ${d > 0 ? 'up' : d < 0 ? 'down' : 'muted'}">${d > 0 ? '+' : ''}${d}</span>`;
        }).join('')}
      </div>
    </div>`;
  }
  el.innerHTML = `<div class="wrap">
    ${header('Progress', 'Your progress')}
    ${chart || '<div class="card"><p class="muted small" style="margin:0">Scan again in a couple of weeks to see your trend and compare features.</p></div>'}
    <div class="card">
      <h3>All scans</h3>
      ${scans.map((s, i) => ({ s, r: rs[i], prev: rs[i - 1] })).reverse().map(({ s, r, prev }) => {
        const d = prev ? r.overall - prev.overall : null;
        return `<button class="scan-row" data-act="open-scan" data-id="${s.id}">
          <img src="${s.img}" alt="">
          <span><b>${fmtDate(s.date)}</b><small>${cap(r.shape)} face · ${tierName(r.overall)}</small></span>
          <span class="num ${tierClass(r.overall)}"><span class="tc">${r.overall}</span>${d === null ? '<small class="muted">first</small>' : `<small class="${d > 0 ? 'up' : d < 0 ? 'down' : 'muted'}">${d > 0 ? '+' : ''}${d}</small>`}</span>
        </button>`;
      }).join('')}
    </div>
  </div>`;
}

// ---------- Sheet + settings ----------

function openSheet(html) {
  const l = $('#sheet');
  $('#sheet-body').innerHTML = html;
  $('#sheet-body').scrollTop = 0;
  l.classList.remove('hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => l.classList.add('open')));
}
function closeSheet() {
  const l = $('#sheet');
  l.classList.remove('open');
  setTimeout(() => l.classList.add('hidden'), 220);
}
function settingsSheet() {
  openSheet(`
    <div class="sheet-top"><h2>Settings</h2><button class="icon-btn" data-act="sheet-close" aria-label="Close">${ICON.x}</button></div>
    <div class="menu-sec"><span>Sex (sets jaw ideals and tips)</span>
      <div class="seg plain">${[['m', 'Male'], ['f', 'Female'], ['x', 'Not set']].map(([v, t]) => `<button class="${S.sex === v ? 'on' : ''}" data-act="set-sex" data-v="${v}">${t}</button>`).join('')}</div>
    </div>
    <div class="menu-sec"><span>Your answers</span><button class="btn ghost sm" data-act="redo-quiz">Retake the questions</button></div>
    <div class="menu-sec"><span>Data</span><button class="btn ghost sm danger" data-act="reset">Delete all scans and data</button></div>
    <p class="note">Everything is stored on this device only. ${S.scans.length} scan${S.scans.length === 1 ? '' : 's'} saved.</p>`);
}

// ---------- Camera ----------

let stream = null, facing = 'user';
async function openCamera() {
  closeSheet();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { $('#file').click(); return; }
  $('#cam').classList.remove('hidden');
  $('#cam-err').classList.add('hidden');
  getLandmarker().catch(() => {});
  try {
    stopStream();
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
    const v = $('#video');
    v.srcObject = stream;
    v.style.transform = facing === 'user' ? '' : 'none';
    await v.play().catch(() => {});
  } catch (e) {
    const err = $('#cam-err');
    err.innerHTML = `<div><p>${e && e.name === 'NotAllowedError' ? 'Camera access is blocked. Allow it in your browser settings, or upload a photo.' : 'Couldn’t open the camera. You can upload a photo instead.'}</p><button class="btn white sm" data-act="upload">${ICON.image}Upload a photo</button></div>`;
    err.classList.remove('hidden');
  }
}
function stopStream() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
}
function closeCamera() {
  stopStream();
  $('#video').srcObject = null;
  $('#cam').classList.add('hidden');
}
function snap() {
  const v = $('#video');
  if (!v.videoWidth) return;
  const c = document.createElement('canvas');
  c.width = v.videoWidth; c.height = v.videoHeight;
  const ctx = c.getContext('2d');
  // Keep selfies mirrored like the preview
  if (facing === 'user') { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(v, 0, 0);
  closeCamera();
  runScan(c);
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

let LM = null;
function getLandmarker() {
  if (!LM) {
    LM = (async () => {
      const v = await import(`${MP}/vision_bundle.mjs`);
      const files = await v.FilesetResolver.forVisionTasks(`${MP}/wasm`);
      const make = delegate => v.FaceLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'IMAGE', numFaces: 1
      });
      try { return await make('GPU'); } catch { return await make('CPU'); }
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
    <button class="btn white" data-act="camera">${ICON.camera}Try again</button><button class="btn glass" data-act="busy-close">Cancel</button>`);

  busy(`${busyPhoto(preview, scanline)}<h2>Loading face model</h2><p>About 4 MB the first time, then it’s saved for next time.</p>`);
  let lmk;
  try { lmk = await getLandmarker(); }
  catch { return fail('Couldn’t load the face model', 'Check your internet connection and try again. After the first scan it works offline.'); }

  busy(`${busyPhoto(preview, scanline)}<h2>Mapping your face</h2><p>Finding 478 points on your photo.</p>`);
  await wait(60);
  let res;
  try { res = lmk.detect(c); } catch { res = null; }
  const lm = res && res.faceLandmarks && res.faceLandmarks[0];
  if (!lm) return fail('No face found', 'Make sure your whole face is visible, well lit and facing the camera.');

  const r = FA.analyze(lm, c.width, c.height, S.sex);
  const dots = `<svg viewBox="0 0 ${c.width} ${c.height}">${lm.filter((_, i) => i % 2 === 0).map((p, i) =>
    `<circle cx="${(p.x * c.width).toFixed(1)}" cy="${(p.y * c.height).toFixed(1)}" r="${(c.width / 260).toFixed(1)}" style="opacity:0;animation:fadein .3s ${(i * 3)}ms forwards"/>`).join('')}</svg>`;
  busy(`<style>@keyframes fadein{to{opacity:.85}}</style>${busyPhoto(preview, dots + scanline)}<h2>Measuring</h2><p>Checking your thirds, symmetry, canthal tilt and 10 more ratios.</p>`);

  const scan = buildScan(c, r);
  await wait(1100);
  S.scans.push(scan);
  if (S.scans.length > MAX_SCANS) S.scans.shift();
  S.current = scan.id; S.view = 'features';
  save();
  $('#busy').classList.add('hidden');
  showTab('results');
  $('#tab-results').scrollTop = 0;
}

// Crop a level, portrait photo around the face and keep the points that
// go with it, so the scan can be redrawn and re-scored later.
function buildScan(c, r) {
  const xs = r.pts.map(p => p.x), ys = r.pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const fw = maxX - minX, fh = maxY - minY;
  let x0 = minX - fw * .32, x1 = maxX + fw * .32, y0 = minY - fh * .42, y1 = maxY + fh * .16;
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
  for (const p of r.pts) pts.push(Math.round((p.x - x0) * s * 10) / 10, Math.round((p.y - y0) * s * 10) / 10);
  return {
    id: Date.now().toString(36), date: Date.now(), w: OUT_W, h: OUT_H,
    img: out.toDataURL('image/jpeg', .82), pts, warn: r.warnings
  };
}

// ---------- Events ----------

document.addEventListener('click', e => {
  const nav = e.target.closest('.nav button');
  if (nav) { showTab(nav.dataset.tab); return; }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const { act, v, id, q } = el.dataset;
  switch (act) {
    case 'ob-next':
      if (OB.step === 1 && !OB.sex) return;
      OB.step++; renderOnboarding(); break;
    case 'ob-back': OB.step--; renderOnboarding(); break;
    case 'ob-sex': OB.sex = v; renderOnboarding(); break;
    case 'ob-ans':
      OB.answers[q] = v;
      if (OB.step - 2 >= FA.QUIZ.length - 1) finishOnboarding();
      else { OB.step++; renderOnboarding(); }
      break;
    case 'tab': showTab(v); $('#tab-' + v).scrollTop = 0; break;
    case 'camera': $('#busy').classList.add('hidden'); openCamera(); break;
    case 'upload': $('#file').click(); break;
    case 'cam-close': closeCamera(); break;
    case 'snap': snap(); break;
    case 'flip': facing = facing === 'user' ? 'environment' : 'user'; openCamera(); break;
    case 'busy-close': $('#busy').classList.add('hidden'); break;
    case 'view': S.view = v; save(); renderResults(); break;
    case 'feature': featureSheet(id); break;
    case 'open-scan': S.current = id; save(); showTab('results'); $('#tab-results').scrollTop = 0; break;
    case 'delete-scan':
      if (!confirm('Delete this scan? This can’t be undone.')) return;
      S.scans = S.scans.filter(s => s.id !== id);
      S.current = S.scans.length ? S.scans[S.scans.length - 1].id : null;
      save(); renderResults(); break;
    case 'habit': {
      const day = dayKey(), list = doneOn(day);
      S.checks[day] = list.includes(id) ? list.filter(x => x !== id) : list.concat(id);
      // Only the last two months matter for the streak
      const cutoff = dayKey(new Date(Date.now() - 60 * 864e5));
      for (const k in S.checks) if (k < cutoff) delete S.checks[k];
      save(); renderPlan(); break;
    }
    case 'settings': settingsSheet(); break;
    case 'sheet-close': closeSheet(); break;
    case 'set-sex': S.sex = v; save(); settingsSheet(); showTab(S.tab); break;
    case 'redo-quiz': closeSheet(); startOnboarding(1); break;
    case 'reset':
      if (!confirm('Delete all scans, answers and plan progress from this device?')) return;
      try { localStorage.removeItem(KEY); } catch {}
      S = load(); reportCache.clear(); closeSheet(); startOnboarding(0); break;
  }
});

$('#file').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!f) return;
  closeCamera();
  try { runScan(await loadFile(f)); }
  catch { alert('That file couldn’t be opened as a photo. Try a JPG or PNG.'); }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && stream) closeCamera();
});

if (S.onboarded) { $('#main').classList.remove('hidden'); showTab(S.tab); }
else startOnboarding(0);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {}));
}
