// Morsel: snap a photo of your food and get calories, protein, carbs and fat.
// Your log lives in localStorage and meal photos in IndexedDB on this device.
// Photo analysis calls the Claude API directly from the browser with your own key.
'use strict';

const KEY = 'morsel-v1';
const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-5-5';
const OFF = 'https://world.openfoodfacts.org';
const FOODS = (window.MORSEL_FOODS || []).map(([name, serving, cal, protein, carbs, fat, fiber, sugar, sodium]) =>
  ({ name, serving, per: { cal, protein, carbs, fat, fiber, sugar, sodium } }));

/* ---------------- helpers ---------------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const rnd = (n, d = 0) => { const m = 10 ** d; return Math.round(num(n) * m) / m; };
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const pad = n => String(n).padStart(2, '0');
const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return dkey(d); };
const today = () => dkey();
const fmtTime = ts => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const fmtDate = (k, opts = { weekday: 'long', month: 'short', day: 'numeric' }) => fromKey(k).toLocaleDateString([], opts);
const MACRO = {
  cal: { label: 'Calories', unit: '', color: 'var(--ink)', icon: '🔥' },
  protein: { label: 'Protein', unit: 'g', color: 'var(--protein)', icon: '🥩' },
  carbs: { label: 'Carbs', unit: 'g', color: 'var(--carbs)', icon: '🌾' },
  fat: { label: 'Fat', unit: 'g', color: 'var(--fat)', icon: '🥑' },
  fiber: { label: 'Fiber', unit: 'g', color: 'var(--fiber)', icon: '🥦' },
  sugar: { label: 'Sugar', unit: 'g', color: 'var(--sugar)', icon: '🍬' },
  sodium: { label: 'Sodium', unit: 'mg', color: 'var(--sodium)', icon: '🧂' },
};
const NUTRIENTS = ['cal', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'];
const zeroPer = () => ({ cal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 });

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function emojiFor(name = '') {
  const n = name.toLowerCase();
  const map = [['salad', '🥗'], ['pizza', '🍕'], ['burger', '🍔'], ['fries', '🍟'], ['egg', '🍳'], ['coffee', '☕'], ['latte', '☕'], ['cappuccino', '☕'],
    ['rice', '🍚'], ['sushi', '🍣'], ['nigiri', '🍣'], ['poke', '🍣'], ['salmon', '🐟'], ['fish', '🐟'], ['tuna', '🐟'], ['shrimp', '🍤'], ['chicken', '🍗'], ['wing', '🍗'],
    ['steak', '🥩'], ['beef', '🥩'], ['pork', '🥩'], ['bacon', '🥓'], ['apple', '🍎'], ['banana', '🍌'], ['orange', '🍊'], ['berr', '🫐'], ['grape', '🍇'],
    ['watermelon', '🍉'], ['mango', '🥭'], ['pineapple', '🍍'], ['avocado', '🥑'], ['broccoli', '🥦'], ['carrot', '🥕'], ['potato', '🥔'], ['corn', '🌽'],
    ['sandwich', '🥪'], ['wrap', '🌯'], ['burrito', '🌯'], ['taco', '🌮'], ['pasta', '🍝'], ['spaghetti', '🍝'], ['lasagna', '🍝'], ['mac', '🧀'], ['cheese', '🧀'],
    ['ramen', '🍜'], ['pad thai', '🍜'], ['noodle', '🍜'], ['soup', '🍲'], ['chili', '🍲'], ['curry', '🍛'], ['ice cream', '🍨'], ['cookie', '🍪'], ['brownie', '🍫'],
    ['chocolate', '🍫'], ['donut', '🍩'], ['muffin', '🧁'], ['cake', '🍰'], ['pie', '🥧'], ['pancake', '🥞'], ['waffle', '🧇'], ['bagel', '🥯'], ['croissant', '🥐'],
    ['bread', '🍞'], ['toast', '🍞'], ['tortilla', '🫓'], ['yogurt', '🥣'], ['oat', '🥣'], ['granola', '🥣'], ['cereal', '🥣'], ['bowl', '🥣'], ['milk', '🥛'],
    ['shake', '🥤'], ['smoothie', '🥤'], ['soda', '🥤'], ['cola', '🥤'], ['juice', '🧃'], ['beer', '🍺'], ['wine', '🍷'], ['nut', '🥜'], ['almond', '🥜'],
    ['peanut', '🥜'], ['bar', '🍫'], ['chips', '🥔'], ['popcorn', '🍿'], ['hot dog', '🌭'], ['bean', '🫘'], ['tofu', '🫘'], ['hummus', '🫘'], ['water', '💧']];
  for (const [k, e] of map) if (n.includes(k)) return e;
  return '🍽️';
}

/* ---------------- state ---------------- */
function defaults() {
  return {
    v: 1, onboarded: false,
    profile: { sex: 'male', birth: '1996-06-15', heightCm: 178, weightKg: 80, goalKg: 74, goal: 'lose', paceKg: 0.5, workouts: '3-5', units: 'imperial' },
    goals: { cal: 2200, protein: 150, carbs: 240, fat: 68, fiber: 30, sugar: 50, sodium: 2300, water: 2500 },
    settings: { apiKey: '', addBurned: false, rollover: false },
    entries: [], exercise: [], water: {}, weights: [], saved: [],
  };
}
let S = defaults();

// Rebuild saved or imported data field by field with the expected types, so a
// tampered backup file can't slip markup into the page or odd values into the math.
const arr = v => (Array.isArray(v) ? v : []);
const str = (v, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '');
const pos = (v, max) => clamp(num(v), 0, max);
const oneOf = (v, list, d) => (list.includes(v) ? v : d);
const isId = v => typeof v === 'string' && /^[a-z0-9]{1,40}$/i.test(v);
const isDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(fromKey(v));
const cleanTs = v => (Number.isFinite(+v) && +v > 0 && +v < 8.64e15 ? +v : Date.now());
function cleanPer(p) { const o = zeroPer(); NUTRIENTS.forEach(k => { o[k] = pos(p?.[k], 100000); }); return o; }
function cleanIngredients(list) {
  return arr(list).slice(0, 30).map(i => ({
    id: isId(i?.id) ? i.id : uid(), name: str(i?.name, 80), amount: str(i?.amount, 60),
    cal: pos(i?.cal, 100000), protein: pos(i?.protein, 10000), carbs: pos(i?.carbs, 10000), fat: pos(i?.fat, 10000),
  }));
}
function sanitizeState(d) {
  const b = defaults();
  const p = d?.profile || {};
  const g = d?.goals || {};
  const goals = {};
  Object.keys(b.goals).forEach(k => { goals[k] = Math.round(clamp(num(g[k]) || b.goals[k], 1, 100000)); });
  const water = {};
  Object.entries(d?.water || {}).forEach(([k, v]) => { if (isDate(k)) water[k] = pos(v, 10000); });
  return {
    v: 1,
    onboarded: !!d?.onboarded,
    profile: {
      sex: oneOf(p.sex, ['male', 'female', 'other'], b.profile.sex),
      birth: isDate(p.birth) ? p.birth : b.profile.birth,
      heightCm: clamp(num(p.heightCm) || b.profile.heightCm, 80, 260),
      weightKg: clamp(num(p.weightKg) || b.profile.weightKg, 20, 400),
      goalKg: clamp(num(p.goalKg) || b.profile.goalKg, 20, 400),
      goal: oneOf(p.goal, ['lose', 'maintain', 'gain'], b.profile.goal),
      paceKg: clamp(num(p.paceKg) || b.profile.paceKg, 0.1, 1),
      workouts: oneOf(p.workouts, ['0-2', '3-5', '6+'], b.profile.workouts),
      units: oneOf(p.units, ['imperial', 'metric'], b.profile.units),
    },
    goals,
    settings: { apiKey: str(d?.settings?.apiKey, 300), addBurned: !!d?.settings?.addBurned, rollover: !!d?.settings?.rollover },
    entries: arr(d?.entries).slice(0, 20000).map(e => ({
      id: isId(e?.id) ? e.id : uid(), ts: cleanTs(e?.ts), date: isDate(e?.date) ? e.date : today(), kind: 'food',
      name: str(e?.name, 80), serving: str(e?.serving, 80), servings: clamp(num(e?.servings) || 1, 0.25, 20),
      per: cleanPer(e?.per), ingredients: cleanIngredients(e?.ingredients), health: Math.round(clamp(num(e?.health), 0, 10)),
      source: oneOf(e?.source, ['food', 'label', 'barcode', 'gallery', 'describe', 'db', 'manual'], 'manual'),
      desc: str(e?.desc, 1000), hasImg: !!e?.hasImg, notes: str(e?.notes, 300), error: str(e?.error, 300),
      // An analysis cannot survive a reload, so mark any leftovers as failed and offer a retry
      status: e?.status === 'analyzing' ? 'error' : oneOf(e?.status, ['done', 'error'], 'done'),
      ...(e?.status === 'analyzing' ? { error: 'Analysis was interrupted. Tap Retry.' } : {}),
    })),
    exercise: arr(d?.exercise).slice(0, 20000).map(x => ({
      id: isId(x?.id) ? x.id : uid(), ts: cleanTs(x?.ts), date: isDate(x?.date) ? x.date : today(),
      name: str(x?.name, 80) || 'Workout', icon: oneOf(x?.icon, ['🏃', '🏋️', '💪', '🔥'], '🔥'),
      minutes: pos(x?.minutes, 1440), cal: pos(x?.cal, 20000), intensity: oneOf(x?.intensity, ['', 'Low', 'Medium', 'High'], ''),
    })),
    water,
    weights: arr(d?.weights).filter(w => isDate(w?.date) && num(w?.kg) >= 20 && num(w?.kg) <= 400).map(w => ({ date: w.date, kg: num(w.kg) })),
    saved: arr(d?.saved).slice(0, 2000).map(s => ({
      id: isId(s?.id) ? s.id : uid(), from: isId(s?.from) ? s.from : null, name: str(s?.name, 80) || 'Food', serving: str(s?.serving, 80),
      per: cleanPer(s?.per), ingredients: cleanIngredients(s?.ingredients), health: Math.round(clamp(num(s?.health) || 5, 1, 10)),
      imgId: isId(s?.imgId) ? s.imgId : null,
    })),
  };
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) S = sanitizeState(JSON.parse(raw));
  } catch { /* start fresh */ }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast('Could not save. Storage may be full.'); }
}

/* ---------------- photo storage (IndexedDB) ---------------- */
const IDB = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      const r = indexedDB.open('morsel-photos', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('img');
      r.onsuccess = () => { this.db = r.result; res(this.db); };
      r.onerror = () => rej(r.error);
    });
  },
  async tx(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction('img', mode);
      const req = fn(t.objectStore('img'));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
    });
  },
  put(id, data) { imgCache.set(id, data); return this.tx('readwrite', s => s.put(data, id)).catch(() => {}); },
  async get(id) {
    if (imgCache.has(id)) return imgCache.get(id);
    try { const d = await this.tx('readonly', s => s.get(id)); if (d) imgCache.set(id, d); return d; } catch { return null; }
  },
  del(id) { imgCache.delete(id); return this.tx('readwrite', s => s.delete(id)).catch(() => {}); },
};
const imgCache = new Map();
function hydrateImages(root = document) {
  root.querySelectorAll('[data-img]').forEach(async el => {
    const data = await IDB.get(el.dataset.img);
    if (data) { el.style.backgroundImage = `url("${data}")`; const e = el.querySelector('.emo'); if (e) e.remove(); }
  });
}

/* ---------------- units ---------------- */
const imperial = () => S.profile.units === 'imperial';
const kgToLb = kg => kg * 2.20462;
const lbToKg = lb => lb / 2.20462;
const wUnit = () => (imperial() ? 'lb' : 'kg');
const wVal = kg => rnd(imperial() ? kgToLb(kg) : kg, 1);
const wFromInput = v => (imperial() ? lbToKg(num(v)) : num(v));
function hText(cm) {
  if (!imperial()) return `${Math.round(cm)} cm`;
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

/* ---------------- plan math ---------------- */
function ageOf(birth) {
  const b = new Date(birth); const n = new Date();
  if (isNaN(b)) return 30;
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return clamp(a, 10, 100);
}
function computePlan(p) {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * ageOf(p.birth) + (p.sex === 'male' ? 5 : p.sex === 'female' ? -161 : -78);
  const activity = { '0-2': 1.375, '3-5': 1.55, '6+': 1.725 }[p.workouts] || 1.45;
  let cal = bmr * activity;
  const daily = (p.paceKg * 7700) / 7;
  if (p.goal === 'lose') cal -= daily;
  if (p.goal === 'gain') cal += daily;
  cal = Math.max(p.sex === 'female' ? 1200 : 1400, Math.round(cal / 10) * 10);
  const protein = Math.round(clamp((p.goal === 'maintain' ? 1.6 : 1.8) * Math.min(p.weightKg, 130), 60, 240));
  const fat = Math.round((cal * 0.28) / 9);
  const carbs = Math.max(50, Math.round((cal - protein * 4 - fat * 9) / 4));
  return { cal, protein, carbs, fat, fiber: Math.round((cal / 1000) * 14), sugar: 50, sodium: 2300, water: S.goals.water || 2500 };
}
function goalDateText(p) {
  if (p.goal === 'maintain' || !p.paceKg) return '';
  const weeks = Math.abs(p.weightKg - p.goalKg) / p.paceKg;
  const d = new Date(); d.setDate(d.getDate() + Math.ceil(weeks * 7));
  return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

/* ---------------- daily numbers ---------------- */
const foodsOn = k => S.entries.filter(e => e.date === k);
const exerciseOn = k => S.exercise.filter(e => e.date === k);
function entryTotals(e) {
  const s = num(e.servings) || 1;
  const t = zeroPer();
  if (e.status && e.status !== 'done') return t;
  NUTRIENTS.forEach(n => { t[n] = num(e.per?.[n]) * s; });
  return t;
}
function dayTotals(k) {
  const t = zeroPer();
  foodsOn(k).forEach(e => { const x = entryTotals(e); NUTRIENTS.forEach(n => { t[n] += x[n]; }); });
  return t;
}
const burnedOn = k => exerciseOn(k).reduce((a, e) => a + num(e.cal), 0);
function dayGoal(k) {
  let g = S.goals.cal;
  if (S.settings.addBurned) g += burnedOn(k);
  if (S.settings.rollover) {
    const y = addDays(k, -1);
    if (foodsOn(y).some(e => e.status === 'done')) g += clamp(S.goals.cal - dayTotals(y).cal, 0, 200);
  }
  return Math.round(g);
}
function rolloverOn(k) {
  if (!S.settings.rollover) return 0;
  const y = addDays(k, -1);
  return foodsOn(y).some(e => e.status === 'done') ? Math.round(clamp(S.goals.cal - dayTotals(y).cal, 0, 200)) : 0;
}
const loggedOn = k => foodsOn(k).some(e => e.status === 'done');
function streak() {
  let k = today();
  if (!loggedOn(k)) k = addDays(k, -1);
  let n = 0;
  while (loggedOn(k)) { n++; k = addDays(k, -1); }
  return n;
}
function healthOn(k) {
  let w = 0, s = 0;
  foodsOn(k).forEach(e => { if (e.status === 'done' && e.health) { const c = Math.max(entryTotals(e).cal, 1); w += c; s += e.health * c; } });
  return w ? s / w : 0;
}
function latestWeightKg() {
  const w = [...S.weights].sort((a, b) => a.date.localeCompare(b.date));
  return w.length ? w[w.length - 1].kg : S.profile.weightKg;
}

/* ---------------- UI primitives ---------------- */
function ring(size, sw, pct, color, center = '') {
  const r = (size - sw) / 2, c = 2 * Math.PI * r, p = clamp(pct || 0, 0, 1), h = size / 2;
  return `<div class="ringwrap" style="width:${size}px;height:${size}px"><svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="var(--ring-track)" stroke-width="${sw}"/>
    <circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 ${h} ${h})"/>
  </svg><div class="center">${center}</div></div>`;
}
const backIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
const closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const trashIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>';
const bookmarkIcon = on => `<svg viewBox="0 0 24 24" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>`;

/* Layers: bottom sheets and full screens stacked over the main view */
const layers = [];
function openLayer({ type = 'sheet', build, mount, onClose, live = false }) {
  const host = $('#layer');
  const L = { type, build, mount, onClose, live };
  if (type === 'sheet') {
    L.scrim = document.createElement('div');
    L.scrim.className = 'scrim';
    L.scrim.addEventListener('click', () => closeLayer(L));
    host.appendChild(L.scrim);
  }
  L.el = document.createElement('div');
  L.el.className = type;
  if (type === 'sheet') { L.el.setAttribute('role', 'dialog'); L.el.setAttribute('aria-modal', 'true'); }
  host.appendChild(L.el);
  layers.push(L);
  drawLayer(L);
  requestAnimationFrame(() => { L.scrim?.classList.add('show'); L.el.classList.add('show'); });
  return L;
}
function drawLayer(L) {
  const scroll = L.el.scrollTop;
  L.el.innerHTML = (L.type === 'sheet' ? '<div class="grab"></div>' : '') + L.build();
  L.el.scrollTop = scroll;
  hydrateImages(L.el);
  L.mount?.(L.el, L);
}
function closeLayer(L = layers[layers.length - 1]) {
  if (!L) return;
  const i = layers.indexOf(L);
  if (i < 0) return;
  layers.splice(i, 1);
  L.onClose?.();
  if (L.type === 'sheet') {
    L.el.classList.remove('show'); L.scrim.classList.remove('show');
    setTimeout(() => { L.el.remove(); L.scrim.remove(); }, 250);
  } else L.el.remove();
}
function closeAllLayers() { while (layers.length) closeLayer(); }
function refresh() {
  render();
  layers.forEach(L => { if (L.live) drawLayer(L); });
}
function confirmSheet(title, body, okLabel, onOk, danger = true) {
  const L = openLayer({
    build: () => `<h2>${esc(title)}</h2><p class="muted" style="margin-bottom:18px">${esc(body)}</p>
      <div class="btnrow"><button class="btn ghost" data-x="no">Cancel</button><button class="btn" data-x="ok" ${danger ? 'style="background:var(--danger);color:#fff"' : ''}>${esc(okLabel)}</button></div>`,
    mount: el => {
      el.querySelector('[data-x=no]').onclick = () => closeLayer(L);
      el.querySelector('[data-x=ok]').onclick = () => { closeLayer(L); onOk(); };
    },
  });
}

/* ---------------- app shell ---------------- */
let view = 'home';
let sel = today();
let weekOffset = 0;
let showEaten = false;
let pagerIdx = 0;
let wRange = '90';
let calWeek = 0;

function render() {
  const main = $('#main');
  if (!S.onboarded) { $('#nav').classList.add('hidden'); main.innerHTML = ''; renderOnboarding(); return; }
  $('#onb')?.remove();
  $('#nav').classList.remove('hidden');
  document.querySelectorAll('#nav .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === view));
  const keepScroll = main.scrollTop;
  main.innerHTML = view === 'home' ? homeHTML() : view === 'progress' ? progressHTML() : settingsHTML();
  main.scrollTop = keepScroll;
  hydrateImages(main);
  const pager = main.querySelector('.pager');
  if (pager) {
    pager.scrollLeft = pagerIdx * pager.clientWidth;
    pager.addEventListener('scroll', () => {
      const i = Math.round(pager.scrollLeft / Math.max(pager.clientWidth, 1));
      if (i !== pagerIdx) { pagerIdx = i; main.querySelectorAll('.dots i').forEach((d, j) => d.classList.toggle('on', j === i)); }
    }, { passive: true });
  }
  tickProgress();
}

/* ---------------- Home ---------------- */
function weekDays() {
  const t = fromKey(today());
  const start = new Date(t); start.setDate(t.getDate() - t.getDay() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return dkey(d); });
}
function homeHTML() {
  const t = dayTotals(sel);
  const goal = dayGoal(sel);
  const left = goal - t.cal;
  const over = left < 0;
  const days = weekDays();
  const tk = today();
  const strip = days.map(k => {
    const future = k > tk;
    let cls = 'day';
    if (k === sel) cls += ' sel';
    if (future) cls += ' future';
    if (loggedOn(k)) {
      const c = dayTotals(k).cal, g = dayGoal(k);
      cls += c > g * 1.1 ? ' over' : c >= g * 0.85 ? ' good' : ' logged';
    }
    const d = fromKey(k);
    return `<button class="${cls}" data-act="day" data-k="${k}" ${future ? 'disabled' : ''} aria-label="${fmtDate(k)}">
      <span class="dn">${d.toLocaleDateString([], { weekday: 'short' })}</span><span class="dc">${d.getDate()}</span></button>`;
  }).join('');

  const macro = (n, goalV) => {
    const eaten = t[n];
    const val = showEaten ? `${Math.round(eaten)}<small>/${Math.round(goalV)}${MACRO[n].unit}</small>` : `${Math.abs(Math.round(goalV - eaten))}${MACRO[n].unit}`;
    const lbl = showEaten ? `${MACRO[n].label} eaten` : goalV - eaten < 0 ? `${MACRO[n].label} over` : `${MACRO[n].label} left`;
    return `<button class="card mini" data-act="toggleEaten"><div><div class="v num">${val}</div><div class="l">${lbl}</div></div>
      ${ring(72, 7, eaten / Math.max(goalV, 1), MACRO[n].color, `<span class="icon">${MACRO[n].icon}</span>`)}</button>`;
  };
  const hs = healthOn(sel);
  const waterMl = S.water[sel] || 0;
  const glasses = Math.ceil(S.goals.water / 250);
  const burned = burnedOn(sel);
  const roll = rolloverOn(sel);

  const bigVal = showEaten ? `${Math.round(t.cal)}<small>/${goal}</small>` : `${Math.abs(Math.round(left))}`;
  const bigLbl = showEaten ? 'Calories eaten' : over ? 'Calories over' : 'Calories left';

  const pages = `
    <div class="page">
      <button class="card big" data-act="toggleEaten">
        <div><div class="v num">${bigVal}</div><div class="l">${bigLbl}</div>
          ${roll || (S.settings.addBurned && burned) ? `<div class="tiny muted" style="margin-top:6px">${roll ? `+${roll} rollover` : ''}${roll && S.settings.addBurned && burned ? ' · ' : ''}${S.settings.addBurned && burned ? `+${Math.round(burned)} burned` : ''}</div>` : ''}
        </div>
        ${ring(120, 10, t.cal / Math.max(goal, 1), over ? 'var(--danger)' : 'var(--ink)', '<span style="font-size:1.6rem">🔥</span>')}
      </button>
      <div class="trio">${macro('protein', S.goals.protein)}${macro('carbs', S.goals.carbs)}${macro('fat', S.goals.fat)}</div>
    </div>
    <div class="page">
      <div class="trio">${macro('fiber', S.goals.fiber)}${macro('sugar', S.goals.sugar)}${macro('sodium', S.goals.sodium)}</div>
      <div class="card health">
        <div style="display:flex;justify-content:space-between;align-items:center"><h3>Health score</h3><b class="num">${hs ? rnd(hs, 0) : '–'}/10</b></div>
        <div class="bar"><i style="width:${hs * 10}%;background:${hs >= 7 ? 'var(--accent)' : hs >= 4 ? 'var(--warn)' : 'var(--danger)'}"></i></div>
        <p class="small muted" style="margin-top:10px">${hs ? healthText(hs, t) : 'Log a meal to see how balanced your day is.'}</p>
      </div>
    </div>
    <div class="page">
      <div class="card">
        <div class="waterrow">
          <div><h3>💧 Water</h3><div class="num" style="font-size:1.5rem;font-weight:800;margin-top:4px">${waterText(waterMl)}<small class="muted" style="font-size:.85rem;font-weight:600"> / ${waterText(S.goals.water)}</small></div></div>
          <div style="display:flex;gap:8px"><button class="roundbtn" data-act="water" data-d="-250" aria-label="Remove a glass">−</button><button class="roundbtn ink" data-act="water" data-d="250" aria-label="Add a glass">+</button></div>
        </div>
        <div class="glasses">${Array.from({ length: glasses }, (_, i) => `<i class="${i < waterMl / 250 ? 'f' : ''}"></i>`).join('')}</div>
      </div>
      <button class="card" data-act="exercise" style="width:100%;text-align:left">
        <div class="waterrow"><div><h3>🔥 Calories burned</h3><div class="num" style="font-size:1.5rem;font-weight:800;margin-top:4px">${Math.round(burned)}</div>
        <div class="small muted">${exerciseOn(sel).length ? `${exerciseOn(sel).length} workout${exerciseOn(sel).length > 1 ? 's' : ''} logged` : 'Tap to log a workout'}</div></div>
        <span class="roundbtn ink">+</span></div>
      </button>
    </div>`;

  const items = [
    ...foodsOn(sel).map(e => ({ ts: e.ts, html: foodCard(e) })),
    ...exerciseOn(sel).map(e => ({ ts: e.ts, html: exerciseCard(e) })),
  ].sort((a, b) => b.ts - a.ts);

  return `<div class="wrap">
    <div class="top"><div class="brand"><img src="icon-192.png" alt="">Morsel</div>
      <span class="pill" title="Day streak">🔥 <span class="num">${streak()}</span></span></div>
    <div style="display:flex;align-items:center;gap:6px">
      <button class="iconbtn" style="width:30px;height:30px;box-shadow:none;background:transparent" data-act="week" data-d="-1" aria-label="Previous week">${backIcon}</button>
      <div class="week" style="flex:1;margin:0">${strip}</div>
      <button class="iconbtn" style="width:30px;height:30px;box-shadow:none;background:transparent;transform:scaleX(-1)" data-act="week" data-d="1" aria-label="Next week" ${weekOffset >= 0 ? 'disabled' : ''}>${backIcon}</button>
    </div>
    <div style="height:12px"></div>
    <div class="pager">${pages}</div>
    <div class="dots">${[0, 1, 2].map(i => `<i class="${i === pagerIdx ? 'on' : ''}"></i>`).join('')}</div>
    <div class="section-title"><h2>${sel === today() ? 'Recently logged' : esc(fmtDate(sel))}</h2></div>
    ${items.length ? items.map(i => i.html).join('') : `<div class="empty"><b>Nothing logged ${sel === today() ? 'yet today' : 'this day'}</b>Tap <b style="display:inline">+</b> to snap a photo of your meal and Morsel will count it for you.</div>`}
  </div>`;
}
function waterText(ml) { return imperial() ? `${Math.round(ml / 29.574)} fl oz` : `${(ml / 1000).toFixed(ml % 1000 ? 2 : 0).replace(/0$/, '')} L`; }
function healthText(hs, t) {
  const tips = [];
  if (t.protein < S.goals.protein * 0.5) tips.push('add more protein');
  if (t.fiber < S.goals.fiber * 0.4) tips.push('eat more fiber');
  if (t.sugar > S.goals.sugar) tips.push('cut back on sugar');
  if (t.sodium > S.goals.sodium) tips.push('watch the sodium');
  if (hs >= 7) return tips.length ? `Nice work. To push higher, ${tips.join(' and ')}.` : 'Great choices today: balanced and nutrient-dense.';
  return tips.length ? `Try to ${tips.join(', ')}.` : 'Swap processed foods for whole foods to raise your score.';
}
function foodCard(e) {
  const ph = e.hasImg ? `data-img="${e.id}"` : '';
  if (e.status === 'analyzing') {
    return `<button class="entry" data-act="open" data-id="${e.id}"><div class="ph" ${ph}><span class="emo">🍽️</span><span class="pct" data-start="${e.startTs || e.ts}">0%</span></div>
      <div class="bd"><div class="nm">Analyzing food…</div><div class="shimmer" style="width:80%"></div><div class="shimmer" style="width:55%"></div><div class="tiny muted">We'll let you know when done</div></div></button>`;
  }
  if (e.status === 'error') {
    return `<button class="entry" data-act="open" data-id="${e.id}"><div class="ph" ${ph}><span class="emo">⚠️</span></div>
      <div class="bd"><div class="row1"><span class="nm">${esc(e.name || "Couldn't analyze")}</span><span class="tm">${fmtTime(e.ts)}</span></div>
      <div class="small" style="color:var(--danger)">${esc(e.error || 'Something went wrong.')}</div><div class="tiny muted">Tap to retry or edit</div></div></button>`;
  }
  const t = entryTotals(e);
  return `<button class="entry" data-act="open" data-id="${e.id}"><div class="ph" ${ph}><span class="emo">${emojiFor(e.name)}</span></div>
    <div class="bd"><div class="row1"><span class="nm">${esc(e.name)}</span><span class="tm">${fmtTime(e.ts)}</span></div>
    <div class="kc num">🔥 ${Math.round(t.cal)} calories${num(e.servings) !== 1 ? ` <span class="tiny muted">· ${rnd(e.servings, 2)}×</span>` : ''}</div>
    <div class="macros num"><span class="dotp">${Math.round(t.protein)}g</span><span class="dotc">${Math.round(t.carbs)}g</span><span class="dotf">${Math.round(t.fat)}g</span></div></div></button>`;
}
function exerciseCard(e) {
  return `<button class="entry" data-act="openEx" data-id="${e.id}"><div class="ph"><span class="emo">${e.icon || '🏃'}</span></div>
    <div class="bd"><div class="row1"><span class="nm">${esc(e.name)}</span><span class="tm">${fmtTime(e.ts)}</span></div>
    <div class="kc num">🔥 ${Math.round(e.cal)} calories burned</div>
    <div class="small muted">${e.minutes ? `${Math.round(e.minutes)} min` : ''}${e.intensity ? ` · ${esc(e.intensity)} intensity` : ''}</div></div></button>`;
}

let progressTimer = null;
function tickProgress() {
  clearInterval(progressTimer);
  if (!S.entries.some(e => e.status === 'analyzing')) return;
  progressTimer = setInterval(() => {
    const els = document.querySelectorAll('.pct[data-start]');
    if (!els.length) { clearInterval(progressTimer); return; }
    els.forEach(el => {
      const s = (Date.now() - num(el.dataset.start)) / 1000;
      el.textContent = `${Math.min(97, Math.round(100 * (1 - Math.exp(-s / 9))))}%`;
    });
  }, 250);
}

/* ---------------- Add menu ---------------- */
function openAddMenu() {
  const L = openLayer({
    build: () => `<h2>Log something</h2>
      <div class="tiles">
        <button class="tile" data-x="scan"><span class="ico">📸</span>Scan food</button>
        <button class="tile" data-x="db"><span class="ico">🔎</span>Food database</button>
        <button class="tile" data-x="describe"><span class="ico">✍️</span>Describe a meal</button>
        <button class="tile" data-x="saved"><span class="ico">🔖</span>Saved foods</button>
        <button class="tile" data-x="exercise"><span class="ico">🏋️</span>Log exercise</button>
        <button class="tile" data-x="quick"><span class="ico">⚡️</span>Quick add</button>
      </div>`,
    mount: el => el.querySelectorAll('[data-x]').forEach(b => b.onclick = () => {
      closeLayer(L);
      ({ scan: () => openScanner('food'), db: () => openDatabase('all'), describe: openDescribe, saved: () => openDatabase('saved'), exercise: openExercise, quick: () => openQuickAdd() })[b.dataset.x]();
    }),
  });
}

/* ---------------- Claude API ---------------- */
const FOOD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['is_food', 'name', 'serving_description', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sodium_mg', 'health_score', 'barcode', 'ingredients', 'notes'],
  properties: {
    is_food: { type: 'boolean', description: 'False if the input shows no food or drink' },
    name: { type: 'string', description: 'Short, natural meal name, e.g. "Grilled Salmon with Rice"' },
    serving_description: { type: 'string', description: 'What one serving is, e.g. "1 plate (about 450 g)"' },
    calories: { type: 'number' },
    protein_g: { type: 'number' },
    carbs_g: { type: 'number' },
    fat_g: { type: 'number' },
    fiber_g: { type: 'number' },
    sugar_g: { type: 'number' },
    sodium_mg: { type: 'number' },
    health_score: { type: 'integer', description: '1 (very unhealthy) to 10 (very healthy)' },
    barcode: { type: 'string', description: 'Barcode digits if clearly readable, otherwise empty string' },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'amount', 'calories', 'protein_g', 'carbs_g', 'fat_g'],
        properties: {
          name: { type: 'string' }, amount: { type: 'string' },
          calories: { type: 'number' }, protein_g: { type: 'number' }, carbs_g: { type: 'number' }, fat_g: { type: 'number' },
        },
      },
    },
    notes: { type: 'string', description: 'One short sentence about the estimate or the meal' },
  },
};
const FOOD_SYSTEM = `You are the nutrition engine inside Morsel, a calorie tracking app. You get a photo of food (or a written description) and return a realistic nutrition estimate for what is shown.

How to estimate:
- Judge portion size from visual cues: plate and bowl size, utensils, hands, packaging. Assume typical home or restaurant portions when unsure.
- Count calories people forget: cooking oil, butter, dressings, sauces, cheese, sugar in drinks.
- Break the meal into its main components in "ingredients" (usually 2 to 8), each with an amount and its own calories and macros. The ingredient values should add up to the totals.
- Totals describe everything visible as one serving. If several people's food is shown, estimate one person's plate.
- Nutrition label photos: read the printed values for one serving exactly; serving_description is the label's serving size.
- Packaged products: identify the product and brand if you can, use typical label values, and put the barcode digits in "barcode" only if they are clearly readable.
- health_score: 1 to 10, weighing protein, fiber, whole foods and vegetables against added sugar, refined carbs, saturated fat, sodium and how processed it is.
- If there is no food or drink, set is_food to false, use zeros and explain in notes.
Keep names short and title-cased. Never refuse to estimate because of uncertainty; give your best estimate.`;

async function callClaude({ system, content, schema }) {
  const key = (S.settings.apiKey || '').trim();
  if (!key) throw new Error('Add your Claude API key in Profile to use AI scanning.');
  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'server-side-fallback-2026-07-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 16000,
        system,
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema } },
        messages: [{ role: 'user', content }],
      }),
    });
  } catch {
    throw new Error('No connection. Check your internet and try again.');
  }
  if (!res.ok) {
    let msg = '';
    try { msg = (await res.json()).error?.message || ''; } catch { /* no body */ }
    if (res.status === 401) throw new Error('Your API key was rejected. Check it in Profile.');
    if (res.status === 403) throw new Error('Your API key does not have access. Check it in Profile.');
    if (res.status === 429) throw new Error('Too many requests right now. Wait a moment and retry.');
    if (res.status >= 500) throw new Error('Claude is busy right now. Try again in a moment.');
    throw new Error(msg || `Request failed (${res.status}).`);
  }
  const data = await res.json();
  if (data.stop_reason === 'refusal') throw new Error("Claude couldn't analyze this one. Try another photo.");
  if (data.stop_reason === 'max_tokens') throw new Error('The answer was cut off. Try again.');
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  try { return JSON.parse(text); } catch { throw new Error('Got an unexpected answer. Try again.'); }
}

function imageBlock(dataUrl) {
  return { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: dataUrl.split(',')[1] } };
}
const MODE_PROMPT = {
  food: 'Analyze this meal photo and estimate its nutrition.',
  label: 'This is a photo of a nutrition facts label. Read it and report the values for one serving.',
  barcode: 'This is a packaged food or drink product. Identify it, read the barcode digits if they are clearly visible, and estimate the nutrition for one serving.',
  gallery: 'Analyze this food photo and estimate its nutrition.',
};

async function analyzeEntry(id, { image, text, correction } = {}) {
  const cur = () => S.entries.find(x => x.id === id);
  let e = cur();
  if (!e) return;
  const prev = e.status === 'done' ? { name: e.name, serving: e.serving, per: e.per, ingredients: e.ingredients } : null;
  e.status = 'analyzing'; e.error = ''; e.startTs = Date.now();
  save(); refresh();
  try {
    if (!image && e.hasImg) image = await IDB.get(e.id);
    if (!text && e.desc) text = e.desc;
    const content = [];
    if (image) content.push(imageBlock(image));
    let prompt = image ? (MODE_PROMPT[e.source] || MODE_PROMPT.food) : `The user describes what they ate: "${text}". Estimate the nutrition for exactly this.`;
    if (image && text) prompt += ` The user added: "${text}".`;
    if (correction && prev) {
      prompt += `\n\nYour previous estimate was:\n${JSON.stringify(prev)}\n\nThe user says this needs fixing: "${correction}". Return a corrected full estimate that takes their correction into account.`;
    }
    content.push({ type: 'text', text: prompt });
    const r = await callClaude({ system: FOOD_SYSTEM, content, schema: FOOD_SCHEMA });
    e = cur();
    if (!e) return;
    if (!r.is_food) {
      e.status = 'error';
      e.error = r.notes || "We couldn't find any food. Try again closer up.";
    } else {
      applyResult(e, r);
      if (e.source === 'barcode' && r.barcode) {
        const p = await offProduct(r.barcode).catch(() => null);
        if (p && cur()) { e.name = p.name; e.serving = p.serving; e.per = p.per; e.notes = 'Nutrition from the product database (Open Food Facts).'; }
      }
      e.status = 'done';
      if (!correction) toast(`Logged ${e.name}: ${Math.round(entryTotals(e).cal)} cal`);
    }
  } catch (err) {
    e = cur();
    if (!e) return;
    e.status = 'error';
    e.error = err.message;
  }
  save(); refresh();
}
function applyResult(e, r) {
  e.name = String(r.name || 'Meal').slice(0, 80);
  e.serving = r.serving_description || '';
  e.per = {
    cal: Math.max(0, rnd(r.calories)), protein: Math.max(0, rnd(r.protein_g, 1)), carbs: Math.max(0, rnd(r.carbs_g, 1)), fat: Math.max(0, rnd(r.fat_g, 1)),
    fiber: Math.max(0, rnd(r.fiber_g, 1)), sugar: Math.max(0, rnd(r.sugar_g, 1)), sodium: Math.max(0, rnd(r.sodium_mg)),
  };
  e.health = clamp(Math.round(num(r.health_score)) || 5, 1, 10);
  e.ingredients = (r.ingredients || []).slice(0, 20).map(i => ({
    id: uid(), name: String(i.name || ''), amount: String(i.amount || ''),
    cal: Math.max(0, rnd(i.calories)), protein: Math.max(0, rnd(i.protein_g, 1)), carbs: Math.max(0, rnd(i.carbs_g, 1)), fat: Math.max(0, rnd(i.fat_g, 1)),
  }));
  e.notes = r.notes || '';
}

/* ---------------- Open Food Facts ---------------- */
function offToFood(p) {
  const n = p.nutriments || {};
  const sq = num(p.serving_quantity);
  const perServing = n['energy-kcal_serving'] != null || sq > 0;
  const get = k => {
    if (n[`${k}_serving`] != null) return num(n[`${k}_serving`]);
    if (n[`${k}_100g`] == null) return 0;
    return sq > 0 ? (num(n[`${k}_100g`]) * sq) / 100 : num(n[`${k}_100g`]);
  };
  let cal = get('energy-kcal');
  if (!cal) cal = get('energy') / 4.184;
  const grade = String(p.nutriscore_grade || '').toLowerCase();
  const brand = String(p.brands || '').split(',')[0].trim();
  return {
    name: [p.product_name, brand].filter(Boolean).join(' · ') || 'Product',
    serving: perServing ? p.serving_size || `${sq} g` : '100 g',
    per: { cal: rnd(cal), protein: rnd(get('proteins'), 1), carbs: rnd(get('carbohydrates'), 1), fat: rnd(get('fat'), 1), fiber: rnd(get('fiber'), 1), sugar: rnd(get('sugars'), 1), sodium: rnd(get('sodium') * 1000) },
    health: { a: 9, b: 7, c: 5, d: 3, e: 2 }[grade] || 5,
    code: p.code,
  };
}
const OFF_FIELDS = 'code,product_name,brands,nutriments,serving_size,serving_quantity,nutriscore_grade';
async function offProduct(code) {
  const r = await fetch(`${OFF}/api/v2/product/${encodeURIComponent(code)}.json?fields=${OFF_FIELDS}`);
  if (!r.ok) return null;
  const j = await r.json();
  return j.status === 1 && j.product ? offToFood({ ...j.product, code }) : null;
}
async function offSearch(q) {
  const r = await fetch(`${OFF}/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=25&fields=${OFF_FIELDS}`);
  if (!r.ok) throw new Error('Search failed');
  const j = await r.json();
  return (j.products || []).filter(p => p.product_name && p.nutriments).map(offToFood).filter(f => f.per.cal > 0);
}

/* ---------------- Images ---------------- */
async function loadImage(file) {
  if (window.createImageBitmap) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* fall back */ }
  }
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Could not read that image.')); };
    img.src = url;
  });
}
function toJpeg(src, w, h, max = 1024, q = 0.82) {
  const s = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * s); c.height = Math.round(h * s);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', q);
}
async function logPhoto(dataUrl, source) {
  const now = new Date();
  const ts = sel === today() ? now.getTime() : fromKey(sel).setHours(now.getHours(), now.getMinutes());
  const e = { id: uid(), ts, date: sel, kind: 'food', name: '', serving: '', servings: 1, per: zeroPer(), ingredients: [], health: 0, source, hasImg: true, status: 'analyzing', startTs: Date.now() };
  S.entries.push(e);
  await IDB.put(e.id, dataUrl);
  save();
  view = 'home';
  pagerIdx = 0;
  $('#main').scrollTop = 0;
  render();
  analyzeEntry(e.id, { image: dataUrl });
}

/* ---------------- Scanner ---------------- */
const scan = { stream: null, mode: 'food', torch: false, timer: null, busy: false, el: null };
let pendingPickMode = 'food';

function needKey(then) {
  if ((S.settings.apiKey || '').trim()) return false;
  openKeySheet(then);
  return true;
}
function openScanner(mode = 'food') {
  if (mode !== 'barcode' && needKey(() => openScanner(mode))) return;
  scan.mode = mode;
  scan.busy = false;
  const el = document.createElement('div');
  el.id = 'scanner';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Food scanner');
  document.body.appendChild(el);
  scan.el = el;
  drawScanner();
  startCamera();
}
function drawScanner(message) {
  const el = scan.el;
  if (!el) return;
  const hasDetector = 'BarcodeDetector' in window;
  const hints = {
    food: 'Fit your whole meal in the frame',
    barcode: hasDetector ? 'Point at the barcode. It scans by itself.' : 'Snap the product so the barcode and name are visible',
    label: 'Fit the nutrition facts label in the frame',
  };
  const modes = [['food', '🍽️', 'Scan food'], ['barcode', '▥', 'Barcode'], ['label', '📄', 'Food label'], ['gallery', '🖼️', 'Library']];
  el.innerHTML = `
    <video playsinline muted autoplay></video>
    <div class="frame ${scan.mode === 'barcode' ? 'wide' : scan.mode === 'label' ? 'tall' : ''}"><i></i><i></i><i></i><i></i></div>
    <div class="stop"><button class="iconbtn" data-s="close" aria-label="Close">${closeIcon}</button>
      <b style="text-shadow:0 1px 6px rgba(0,0,0,.6)">Morsel</b><span style="width:42px"></span></div>
    <div class="hint">${esc(message || hints[scan.mode])}</div>
    <div class="nocam hidden"><div><div style="font-size:3rem">📷</div><h2>Camera not available</h2>
      <p>Allow camera access, or take a photo with your phone's camera instead.</p>
      <div style="display:grid;gap:10px"><button class="btn" data-s="snap">Take a photo</button><button class="btn ghost" data-s="pick" style="background:rgba(255,255,255,.15);color:#fff">Choose from library</button></div></div></div>
    <div class="bottom">
      <div class="modes">${modes.map(([m, i, l]) => `<button class="mode ${scan.mode === m ? 'on' : ''}" data-s="mode" data-m="${m}"><span class="ico">${i}</span>${l}</button>`).join('')}</div>
      <div class="shutter-row">
        <button class="side ${scan.torch ? 'on' : ''} ${scan.torchOk ? '' : 'hidden'}" data-s="torch" aria-label="Flash">ϟ</button>${scan.torchOk ? '' : '<span style="width:48px"></span>'}
        <button class="shutter" data-s="shoot" aria-label="Take photo" ${scan.busy ? 'disabled' : ''}></button>
        <span style="width:48px"></span>
      </div>
    </div>`;
  if (scan.stream) { const v = el.querySelector('video'); v.srcObject = scan.stream; v.play().catch(() => {}); }
  el.onclick = onScannerClick;
}
async function startCamera() {
  stopCamera(false);
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('no camera');
    scan.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
    if (!scan.el) { stopCamera(); return; }
    const track = scan.stream.getVideoTracks()[0];
    scan.torchOk = !!track?.getCapabilities?.().torch;
    drawScanner();
    startBarcodeLoop();
  } catch {
    scan.el?.querySelector('.nocam')?.classList.remove('hidden');
    scan.el?.querySelector('.frame')?.classList.add('hidden');
    scan.el?.querySelector('.hint')?.classList.add('hidden');
    scan.el?.querySelector('.shutter-row')?.classList.add('hidden');
  }
}
function stopCamera(all = true) {
  clearInterval(scan.timer);
  scan.timer = null;
  if (scan.stream) scan.stream.getTracks().forEach(t => t.stop());
  scan.stream = null;
  if (all) { scan.el?.remove(); scan.el = null; scan.torch = false; }
}
function startBarcodeLoop() {
  clearInterval(scan.timer);
  if (scan.mode !== 'barcode' || !('BarcodeDetector' in window) || !scan.stream) return;
  let detector;
  try { detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] }); } catch { return; }
  scan.timer = setInterval(async () => {
    const v = scan.el?.querySelector('video');
    if (!v || v.readyState < 2 || scan.busy) return;
    try {
      const codes = await detector.detect(v);
      if (codes.length) { scan.busy = true; clearInterval(scan.timer); lookupBarcode(codes[0].rawValue); }
    } catch { /* keep trying */ }
  }, 450);
}
async function lookupBarcode(code) {
  drawScanner(`Looking up ${code}…`);
  const p = await offProduct(code).catch(() => null);
  if (!p) {
    scan.busy = false;
    drawScanner("We couldn't find that product. Snap it to estimate with AI instead.");
    startBarcodeLoop();
    return;
  }
  stopCamera();
  openFoodSheet({ ...p, source: 'barcode' });
}
function onScannerClick(ev) {
  const b = ev.target.closest('[data-s]');
  if (!b) return;
  const a = b.dataset.s;
  if (a === 'close') stopCamera();
  else if (a === 'mode') {
    const m = b.dataset.m;
    if (m === 'gallery') { pendingPickMode = scan.mode === 'barcode' ? 'food' : scan.mode; if (needKey(() => $('#pick').click())) return; $('#pick').click(); return; }
    scan.mode = m;
    scan.busy = false;
    drawScanner();
    startBarcodeLoop();
  } else if (a === 'torch') {
    const track = scan.stream?.getVideoTracks()[0];
    scan.torch = !scan.torch;
    track?.applyConstraints({ advanced: [{ torch: scan.torch }] }).catch(() => {});
    b.classList.toggle('on', scan.torch);
  } else if (a === 'shoot') {
    if (scan.mode === 'barcode' && needKey(() => {})) return;
    const v = scan.el.querySelector('video');
    if (!v || !v.videoWidth) { toast('Camera is still starting…'); return; }
    const data = toJpeg(v, v.videoWidth, v.videoHeight);
    const mode = scan.mode;
    stopCamera();
    logPhoto(data, mode);
  } else if (a === 'snap') { pendingPickMode = scan.mode === 'barcode' ? 'barcode' : scan.mode; $('#snap').click(); }
  else if (a === 'pick') { pendingPickMode = scan.mode === 'barcode' ? 'barcode' : scan.mode; $('#pick').click(); }
}
async function onPickedFile(input) {
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    const img = await loadImage(file);
    const data = toJpeg(img, img.width, img.height);
    stopCamera();
    logPhoto(data, pendingPickMode === 'gallery' ? 'food' : pendingPickMode);
  } catch (err) { toast(err.message || 'Could not read that image.'); }
}

/* ---------------- Food detail ---------------- */
function openDetail(id) {
  const L = openLayer({
    type: 'screen', live: true,
    build: () => detailHTML(id),
    mount: (el) => {
      if (!S.entries.find(x => x.id === id)) { closeLayer(L); return; }
      el.onclick = ev => onDetailClick(ev, id, L);
    },
  });
}
function detailHTML(id) {
  const e = S.entries.find(x => x.id === id);
  if (!e) return '';
  const t = entryTotals(e);
  const isSaved = S.saved.some(s => s.from === e.id || (s.name === e.name && s.per?.cal === e.per?.cal));
  const heroAttr = e.hasImg ? `data-img="${e.id}"` : '';
  const topbar = `<div class="bar-top"><button class="iconbtn" data-d="close" aria-label="Back">${backIcon}</button>
    <span style="font-weight:700;color:${e.hasImg ? '#fff' : 'inherit'};text-shadow:${e.hasImg ? '0 1px 6px rgba(0,0,0,.5)' : 'none'}">Nutrition</span>
    <div style="display:flex;gap:8px">${e.status === 'done' ? `<button class="iconbtn" data-d="bookmark" aria-label="Save food">${bookmarkIcon(isSaved)}</button>` : ''}<button class="iconbtn" data-d="delete" aria-label="Delete">${trashIcon}</button></div></div>`;
  let body;
  if (e.status === 'analyzing') {
    body = `<div style="text-align:center;padding:40px 0"><span class="spin"></span><h2 style="margin-top:14px">Analyzing your food…</h2><p class="muted small">This usually takes a few seconds.</p></div>`;
  } else if (e.status === 'error') {
    body = `<div class="warnbox" style="margin:10px 0 16px">${esc(e.error || 'Something went wrong.')}</div>
      <div style="display:grid;gap:10px"><button class="btn" data-d="retry">Retry analysis</button><button class="btn ghost" data-d="manual">Enter nutrition manually</button></div>`;
  } else {
    const mac = n => `<button class="card mac" data-d="editNut"><div class="t"><span>${MACRO[n].icon}</span>${MACRO[n].label}</div><div class="v num">${rnd(t[n], n === 'sodium' ? 0 : 0)}${MACRO[n].unit}</div></button>`;
    body = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin:6px 0 4px">
        <div style="min-width:0"><span class="chip" style="padding:4px 10px;font-size:.75rem">${fmtTime(e.ts)}</span>
          <button data-d="rename" style="display:block;margin-top:8px"><h1 style="font-size:1.6rem">${esc(e.name)}</h1></button>
          ${e.serving ? `<div class="small muted" style="margin-top:4px">1 serving = ${esc(e.serving)}</div>` : ''}</div>
        <div class="stepper"><button data-d="serv" data-v="-0.25" aria-label="Fewer servings">−</button><span class="num">${rnd(e.servings, 2)}</span><button data-d="serv" data-v="0.25" aria-label="More servings">+</button></div>
      </div>
      <button class="card kv" data-d="editNut" style="width:100%;margin-top:14px"><div class="ic">🔥</div><div><div class="small muted">Calories</div><div class="v num">${Math.round(t.cal)}</div></div></button>
      <div class="grid3" style="margin-top:10px">${mac('protein')}${mac('carbs')}${mac('fat')}</div>
      <div class="grid3" style="margin-top:10px">${mac('fiber')}${mac('sugar')}${mac('sodium')}</div>
      <div class="card health" style="margin-top:10px">
        <div style="display:flex;justify-content:space-between;align-items:center"><h3>❤️ Health score</h3><b class="num">${e.health || '–'}/10</b></div>
        <div class="bar"><i style="width:${(e.health || 0) * 10}%;background:${e.health >= 7 ? 'var(--accent)' : e.health >= 4 ? 'var(--warn)' : 'var(--danger)'}"></i></div>
        ${e.notes ? `<p class="small muted" style="margin-top:10px">${esc(e.notes)}</p>` : ''}
      </div>
      <div class="section-title"><h2>Ingredients</h2><button class="chip" data-d="addIng">+ Add</button></div>
      ${(e.ingredients || []).length ? e.ingredients.map(i => `<button class="ing" data-d="editIng" data-i="${i.id}">
          <div style="min-width:0"><div style="font-weight:600">${esc(i.name)}</div><div class="a">${esc(i.amount)}</div></div>
          <div style="text-align:right;flex:none"><div class="num" style="font-weight:700">${Math.round(i.cal * (e.servings || 1))} cal</div>
          <div class="a num">P ${rnd(i.protein * (e.servings || 1), 0)} · C ${rnd(i.carbs * (e.servings || 1), 0)} · F ${rnd(i.fat * (e.servings || 1), 0)}</div></div></button>`).join('')
        : '<p class="small muted">No ingredients listed. Add them to fine-tune the totals.</p>'}
      <p class="tiny muted" style="margin-top:16px">Values are estimates. Tap any number to correct it.</p>`;
  }
  const footer = e.status === 'done'
    ? `<div class="footer-bar"><div class="in btnrow"><button class="btn line" data-d="fix">✨ Fix results</button><button class="btn" data-d="close">Done</button></div></div>`
    : '';
  return `<div class="hero" ${heroAttr} style="${e.hasImg ? '' : 'height:200px'}"><span class="emo">${e.status === 'done' ? emojiFor(e.name) : '🍽️'}</span>${topbar}</div>
    <div class="sheet-body"><div class="wrap" style="padding-top:18px">${body}</div></div>${footer}`;
}
function onDetailClick(ev, id, L) {
  const b = ev.target.closest('[data-d]');
  if (!b) return;
  const e = S.entries.find(x => x.id === id);
  if (!e) { closeLayer(L); return; }
  const a = b.dataset.d;
  if (a === 'close') closeLayer(L);
  else if (a === 'delete') confirmSheet('Delete this food?', `${e.name || 'This entry'} will be removed from your log.`, 'Delete', () => { deleteEntry(id); closeLayer(L); });
  else if (a === 'serv') { e.servings = clamp(rnd(num(e.servings) + num(b.dataset.v), 2), 0.25, 20); save(); refresh(); }
  else if (a === 'bookmark') toggleSaved(e);
  else if (a === 'retry') { if (e.hasImg || e.desc) analyzeEntry(id); else openNutritionSheet(e); }
  else if (a === 'manual' || a === 'editNut') openNutritionSheet(e);
  else if (a === 'rename') openTextSheet('Rename food', e.name, v => { e.name = v || e.name; save(); refresh(); });
  else if (a === 'fix') openFixSheet(e, L);
  else if (a === 'addIng') openIngredientSheet(e, null);
  else if (a === 'editIng') openIngredientSheet(e, b.dataset.i);
}
function deleteEntry(id) {
  const e = S.entries.find(x => x.id === id);
  S.entries = S.entries.filter(x => x.id !== id);
  if (e?.hasImg && !S.saved.some(s => s.imgId === id) && !S.entries.some(x => x.imgId === id)) IDB.del(id);
  save(); refresh();
  toast('Deleted');
}
function toggleSaved(e) {
  const i = S.saved.findIndex(s => s.from === e.id || (s.name === e.name && s.per?.cal === e.per?.cal));
  if (i >= 0) { S.saved.splice(i, 1); toast('Removed from saved foods'); }
  else {
    S.saved.unshift({ id: uid(), from: e.id, name: e.name, serving: e.serving, per: { ...e.per }, ingredients: e.ingredients, health: e.health, imgId: e.hasImg ? (e.imgId || e.id) : null });
    toast('Saved. Find it under Saved foods.');
  }
  save(); refresh();
}
function recomputeFromIngredients(e) {
  const ings = e.ingredients || [];
  if (!ings.length) return;
  const oldCal = e.per.cal || 1;
  const sum = k => rnd(ings.reduce((a, i) => a + num(i[k]), 0), 1);
  e.per.cal = Math.round(sum('cal'));
  e.per.protein = sum('protein'); e.per.carbs = sum('carbs'); e.per.fat = sum('fat');
  const r = e.per.cal / oldCal;
  e.per.fiber = rnd(e.per.fiber * r, 1); e.per.sugar = rnd(e.per.sugar * r, 1); e.per.sodium = Math.round(e.per.sodium * r);
}
function openIngredientSheet(e, ingId) {
  const ing = (e.ingredients || []).find(i => i.id === ingId) || { name: '', amount: '', cal: 0, protein: 0, carbs: 0, fat: 0 };
  const L = openLayer({
    build: () => `<h2>${ingId ? 'Edit ingredient' : 'Add ingredient'}</h2>
      <label class="f">Name</label><input class="inp" name="name" value="${esc(ing.name)}" placeholder="e.g. Olive oil">
      <label class="f">Amount</label><input class="inp" name="amount" value="${esc(ing.amount)}" placeholder="e.g. 1 tbsp">
      <div class="grid2"><div><label class="f">Calories</label><input class="inp" name="cal" type="number" inputmode="decimal" value="${ing.cal}"></div>
      <div><label class="f">Protein (g)</label><input class="inp" name="protein" type="number" inputmode="decimal" value="${ing.protein}"></div>
      <div><label class="f">Carbs (g)</label><input class="inp" name="carbs" type="number" inputmode="decimal" value="${ing.carbs}"></div>
      <div><label class="f">Fat (g)</label><input class="inp" name="fat" type="number" inputmode="decimal" value="${ing.fat}"></div></div>
      <p class="tiny muted" style="margin-top:8px">Values are for one serving. The meal totals update from the ingredients.</p>
      <div class="btnrow" style="margin-top:16px">${ingId ? '<button class="btn danger" data-x="del">Remove</button>' : ''}<button class="btn" data-x="ok">Save</button></div>`,
    mount: el => {
      el.querySelector('[data-x=ok]').onclick = () => {
        const v = n => el.querySelector(`[name=${n}]`).value;
        const name = v('name').trim();
        if (!name) { toast('Give the ingredient a name'); return; }
        const next = { id: ingId || uid(), name, amount: v('amount').trim(), cal: Math.max(0, num(v('cal'))), protein: Math.max(0, num(v('protein'))), carbs: Math.max(0, num(v('carbs'))), fat: Math.max(0, num(v('fat'))) };
        e.ingredients = e.ingredients || [];
        const i = e.ingredients.findIndex(x => x.id === ingId);
        if (i >= 0) e.ingredients[i] = next; else e.ingredients.push(next);
        recomputeFromIngredients(e);
        save(); closeLayer(L); refresh();
      };
      el.querySelector('[data-x=del]')?.addEventListener('click', () => {
        e.ingredients = e.ingredients.filter(x => x.id !== ingId);
        recomputeFromIngredients(e);
        save(); closeLayer(L); refresh();
      });
    },
  });
}
function openNutritionSheet(e) {
  const p = e.per || zeroPer();
  const L = openLayer({
    build: () => `<h2>Edit nutrition</h2><p class="small muted">Per serving${e.serving ? ` (${esc(e.serving)})` : ''}.</p>
      <label class="f">Name</label><input class="inp" name="name" value="${esc(e.name)}" placeholder="Food name">
      <div class="grid2">${NUTRIENTS.map(n => `<div><label class="f">${MACRO[n].label}${MACRO[n].unit ? ` (${MACRO[n].unit})` : ''}</label><input class="inp" name="${n}" type="number" inputmode="decimal" value="${rnd(p[n], 1)}"></div>`).join('')}
      <div><label class="f">Health score (1–10)</label><input class="inp" name="health" type="number" inputmode="numeric" min="1" max="10" value="${e.health || 5}"></div></div>
      <button class="btn" data-x="ok" style="margin-top:18px">Save</button>`,
    mount: el => el.querySelector('[data-x=ok]').onclick = () => {
      const v = n => el.querySelector(`[name=${n}]`).value;
      e.name = v('name').trim() || e.name || 'Food';
      e.per = {};
      NUTRIENTS.forEach(n => { e.per[n] = Math.max(0, num(v(n))); });
      e.health = clamp(Math.round(num(v('health'))) || 5, 1, 10);
      e.status = 'done'; e.error = '';
      save(); closeLayer(L); refresh();
    },
  });
}
function openTextSheet(title, value, onOk) {
  const L = openLayer({
    build: () => `<h2>${esc(title)}</h2><input class="inp" name="v" value="${esc(value)}"><button class="btn" data-x="ok" style="margin-top:14px">Save</button>`,
    mount: el => {
      const i = el.querySelector('input'); setTimeout(() => i.focus(), 260);
      el.querySelector('[data-x=ok]').onclick = () => { closeLayer(L); onOk(i.value.trim()); };
    },
  });
}
function openFixSheet(e, detailLayer) {
  if (needKey(() => openFixSheet(e, detailLayer))) return;
  const L = openLayer({
    build: () => `<h2>✨ Fix results</h2><p class="small muted" style="margin-bottom:12px">Tell Morsel what's off and it will redo the estimate.</p>
      <textarea class="inp" name="fix" placeholder="e.g. That was brown rice, not white, and only half the portion. No dressing."></textarea>
      <div class="chips" style="margin-top:10px">${['Smaller portion', 'Bigger portion', 'It was cooked in oil', 'No sauce or dressing', 'Low-fat version'].map(c => `<button class="chip" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <button class="btn" data-x="ok" style="margin-top:16px">Update</button>`,
    mount: el => {
      const ta = el.querySelector('textarea');
      el.querySelectorAll('[data-c]').forEach(c => c.onclick = () => { ta.value = ta.value ? `${ta.value.replace(/\s+$/, '')}. ${c.dataset.c}` : c.dataset.c; });
      el.querySelector('[data-x=ok]').onclick = () => {
        const fix = ta.value.trim();
        if (!fix) { toast('Describe what to fix'); return; }
        closeLayer(L);
        analyzeEntry(e.id, { correction: fix });
      };
    },
  });
}

/* ---------------- Food sheet (database, barcode, saved) ---------------- */
function openFoodSheet(food) {
  let servings = 1;
  const L = openLayer({
    build: () => {
      const t = {}; NUTRIENTS.forEach(n => { t[n] = num(food.per[n]) * servings; });
      return `<div style="display:flex;gap:14px;align-items:center;margin-bottom:6px">
          <div class="ph" ${food.imgId ? `data-img="${food.imgId}"` : ''} style="width:64px;height:64px;border-radius:16px;background:var(--surface-2) center/cover;display:grid;place-items:center;font-size:2rem;flex:none"><span class="emo">${emojiFor(food.name)}</span></div>
          <div style="min-width:0"><h2 style="margin:0">${esc(food.name)}</h2><div class="small muted">${esc(food.serving || '1 serving')}</div></div></div>
        <div class="card kv" style="margin-top:12px"><div class="ic">🔥</div><div><div class="small muted">Calories</div><div class="v num">${Math.round(t.cal)}</div></div>
          <div style="margin-left:auto" class="stepper"><button data-x="m" aria-label="Fewer servings">−</button><span class="num">${servings}</span><button data-x="p" aria-label="More servings">+</button></div></div>
        <div class="grid3" style="margin-top:10px">${['protein', 'carbs', 'fat'].map(n => `<div class="card mac"><div class="t">${MACRO[n].icon} ${MACRO[n].label}</div><div class="v num">${rnd(t[n], 1)}g</div></div>`).join('')}</div>
        <p class="small muted" style="margin-top:10px">Fiber ${rnd(t.fiber, 1)}g · Sugar ${rnd(t.sugar, 1)}g · Sodium ${Math.round(t.sodium)}mg</p>
        <div class="btnrow" style="margin-top:16px">
          ${food.savedId ? '<button class="btn ghost" data-x="unsave">Remove</button>' : '<button class="btn ghost" data-x="save">🔖 Save</button>'}
          <button class="btn" data-x="log">Log ${fmtShortDay(sel)}</button></div>`;
    },
    mount: el => {
      el.querySelector('[data-x=m]').onclick = () => { servings = Math.max(0.25, rnd(servings - 0.25, 2)); drawLayer(L); };
      el.querySelector('[data-x=p]').onclick = () => { servings = Math.min(20, rnd(servings + 0.25, 2)); drawLayer(L); };
      el.querySelector('[data-x=save]')?.addEventListener('click', () => {
        S.saved.unshift({ id: uid(), name: food.name, serving: food.serving, per: { ...food.per }, ingredients: food.ingredients || [], health: food.health || 5, imgId: food.imgId || null });
        save(); toast('Saved'); closeLayer(L); refresh();
      });
      el.querySelector('[data-x=unsave]')?.addEventListener('click', () => {
        S.saved = S.saved.filter(s => s.id !== food.savedId); save(); toast('Removed'); closeLayer(L); refresh();
      });
      el.querySelector('[data-x=log]').onclick = () => {
        logFood({ name: food.name, serving: food.serving, per: food.per, ingredients: food.ingredients, health: food.health, servings, source: food.source || 'db', imgId: food.imgId });
        closeLayer(L);
        closeAllLayers();
      };
    },
  });
}
const fmtShortDay = k => (k === today() ? 'today' : k === addDays(today(), -1) ? 'yesterday' : fromKey(k).toLocaleDateString([], { weekday: 'short' }));
async function logFood({ name, serving, per, ingredients, health, servings = 1, source = 'manual', imgId = null, notes = '' }) {
  const now = new Date();
  const ts = sel === today() ? now.getTime() : fromKey(sel).setHours(now.getHours(), now.getMinutes());
  const e = {
    id: uid(), ts, date: sel, kind: 'food', name: name || 'Food', serving: serving || '', servings,
    per: { ...zeroPer(), ...per }, ingredients: (ingredients || []).map(i => ({ ...i, id: i.id || uid() })), health: health || 5, source, status: 'done', notes,
    hasImg: false,
  };
  if (imgId) {
    const data = await IDB.get(imgId);
    if (data) { e.hasImg = true; await IDB.put(e.id, data); }
  }
  S.entries.push(e);
  save();
  view = 'home';
  refresh();
  toast(`Logged ${e.name}`);
}

/* ---------------- Database screen ---------------- */
function openDatabase(tab = 'all') {
  let q = '';
  let online = null;
  let loading = false;
  const rowWith = (f, attr) => `<button class="ing" ${attr}>
    <div style="display:flex;gap:12px;align-items:center;min-width:0">
      <span style="font-size:1.6rem">${emojiFor(f.name)}</span>
      <div style="min-width:0"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.name)}</div>
      <div class="a">🔥 ${Math.round(f.per.cal)} cal · ${esc(f.serving || '')}</div></div></div>
    <span class="roundbtn" style="width:32px;height:32px;font-size:1.1rem">+</span></button>`;
  function rowsHTML() {
    if (tab === 'saved') {
      const list = S.saved.filter(s => !q || s.name.toLowerCase().includes(q.toLowerCase()));
      if (!list.length) return `<div class="empty"><b>No saved foods${q ? ' match' : ' yet'}</b>Tap the bookmark on any logged food to save it for one-tap logging.</div>`;
      return list.map(s => rowWith(s, `data-sv="${s.id}"`)).join('');
    }
    const ql = q.toLowerCase();
    const local = ql ? FOODS.filter(f => f.name.toLowerCase().includes(ql)) : FOODS.slice(0, 30);
    let html = local.map(f => rowWith(f, `data-lf="${FOODS.indexOf(f)}"`)).join('');
    if (!local.length) html = `<p class="muted small" style="margin-bottom:8px">No matches in the built-in list.</p>`;
    if (ql.length >= 2) {
      html += `<div class="section-title"><h3>Packaged & branded</h3></div>`;
      if (loading) html += '<p class="muted small"><span class="spin" style="width:14px;height:14px;border-width:2px;vertical-align:-2px"></span> Searching Open Food Facts…</p>';
      else if (online) html += online.length ? online.map((f, i) => rowWith(f, `data-on="${i}"`)).join('') : '<p class="muted small">No packaged products found.</p>';
      else html += '<button class="chip" data-x="online">Search packaged foods online</button>';
      html += `<div class="section-title"><h3>Can't find it?</h3></div>
        <button class="opt" data-x="describe"><span class="ico">✍️</span><span>Describe it to AI<span class="sub">"${esc(q)}" → instant estimate</span></span></button>`;
    }
    return html;
  }
  const L = openLayer({
    type: 'screen', live: true,
    build: () => `<div class="bar-top"><button class="iconbtn" data-x="close" aria-label="Back">${backIcon}</button><h2>Food database</h2><span style="width:42px"></span></div>
      <div class="wrap" style="padding-top:4px">
        <input class="inp" id="dbq" type="search" placeholder="Search foods (e.g. banana, latte)" value="${esc(q)}" autocomplete="off">
        <div class="seg" style="margin:12px 0 14px"><button class="${tab === 'all' ? 'on' : ''}" data-x="tab" data-t="all">All</button><button class="${tab === 'saved' ? 'on' : ''}" data-x="tab" data-t="saved">Saved</button></div>
        <div class="btnrow" style="margin-bottom:14px"><button class="btn line sm" data-x="quick">⚡️ Quick add</button><button class="btn line sm" data-x="barcode">▥ Scan barcode</button></div>
        <div id="dbres">${rowsHTML()}</div>
      </div>`,
    mount: el => {
      const input = el.querySelector('#dbq');
      const res = el.querySelector('#dbres');
      input.oninput = () => { q = input.value.trim(); online = null; res.innerHTML = rowsHTML(); };
      el.onclick = async ev => {
        const b = ev.target.closest('[data-x],[data-lf],[data-on],[data-sv]');
        if (!b) return;
        if (b.dataset.lf != null) return openFoodSheet({ ...FOODS[+b.dataset.lf], health: undefined });
        if (b.dataset.on != null) return openFoodSheet({ ...online[+b.dataset.on], source: 'db' });
        if (b.dataset.sv != null) { const s = S.saved.find(x => x.id === b.dataset.sv); if (s) openFoodSheet({ ...s, savedId: s.id }); return; }
        const x = b.dataset.x;
        if (x === 'close') closeLayer(L);
        else if (x === 'tab') { tab = b.dataset.t; drawLayer(L); }
        else if (x === 'quick') openQuickAdd(q);
        else if (x === 'barcode') { closeLayer(L); openScanner('barcode'); }
        else if (x === 'describe') { closeLayer(L); openDescribe(q); }
        else if (x === 'online') {
          loading = true; res.innerHTML = rowsHTML();
          try { online = await offSearch(q); } catch { online = null; toast('Online search failed. Check your connection.'); }
          loading = false; res.innerHTML = rowsHTML();
        }
      };
    },
  });
}

/* ---------------- Describe and quick add ---------------- */
function openDescribe(prefill = '') {
  if (needKey(() => openDescribe(prefill))) return;
  const L = openLayer({
    build: () => `<h2>✍️ Describe a meal</h2><p class="small muted" style="margin-bottom:12px">Write what you ate, with amounts if you know them.</p>
      <textarea class="inp" name="d" placeholder="e.g. 2 scrambled eggs, a slice of sourdough with butter and a large oat milk latte">${esc(prefill)}</textarea>
      <button class="btn" data-x="ok" style="margin-top:14px">Estimate nutrition</button>`,
    mount: el => {
      const ta = el.querySelector('textarea'); setTimeout(() => ta.focus(), 260);
      el.querySelector('[data-x=ok]').onclick = () => {
        const d = ta.value.trim();
        if (!d) { toast('Describe your meal first'); return; }
        closeLayer(L);
        const now = new Date();
        const ts = sel === today() ? now.getTime() : fromKey(sel).setHours(now.getHours(), now.getMinutes());
        const e = { id: uid(), ts, date: sel, kind: 'food', name: '', serving: '', servings: 1, per: zeroPer(), ingredients: [], health: 0, source: 'describe', desc: d, hasImg: false, status: 'analyzing', startTs: Date.now() };
        S.entries.push(e); save();
        view = 'home'; closeAllLayers(); render();
        analyzeEntry(e.id, { text: d });
      };
    },
  });
}
function openQuickAdd(name = '') {
  const L = openLayer({
    build: () => `<h2>⚡️ Quick add</h2>
      <label class="f">Name</label><input class="inp" name="name" value="${esc(name)}" placeholder="e.g. Protein shake">
      <div class="grid2"><div><label class="f">Calories</label><input class="inp" name="cal" type="number" inputmode="decimal" placeholder="0"></div>
      <div><label class="f">Protein (g)</label><input class="inp" name="protein" type="number" inputmode="decimal" placeholder="0"></div>
      <div><label class="f">Carbs (g)</label><input class="inp" name="carbs" type="number" inputmode="decimal" placeholder="0"></div>
      <div><label class="f">Fat (g)</label><input class="inp" name="fat" type="number" inputmode="decimal" placeholder="0"></div></div>
      <button class="btn" data-x="ok" style="margin-top:18px">Log ${fmtShortDay(sel)}</button>`,
    mount: el => el.querySelector('[data-x=ok]').onclick = () => {
      const v = n => el.querySelector(`[name=${n}]`).value;
      if (!num(v('cal')) && !num(v('protein')) && !num(v('carbs')) && !num(v('fat'))) { toast('Enter at least the calories'); return; }
      let cal = num(v('cal'));
      if (!cal) cal = num(v('protein')) * 4 + num(v('carbs')) * 4 + num(v('fat')) * 9;
      closeLayer(L);
      closeAllLayers();
      logFood({ name: v('name').trim() || 'Quick add', per: { cal: Math.round(cal), protein: num(v('protein')), carbs: num(v('carbs')), fat: num(v('fat')) }, health: 5, source: 'manual' });
    },
  });
}

/* ---------------- Exercise ---------------- */
const MET = { run: { Low: 6, Medium: 9.8, High: 11.5 }, lift: { Low: 3.5, Medium: 5, High: 6 } };
const EX_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['name', 'minutes', 'calories_burned', 'intensity'],
  properties: { name: { type: 'string' }, minutes: { type: 'number' }, calories_burned: { type: 'number' }, intensity: { type: 'string', enum: ['Low', 'Medium', 'High'] } },
};
function openExercise() {
  let kind = null;
  let intensity = 'Medium';
  let minutes = 30;
  let busy = false;
  const L = openLayer({
    build: () => {
      if (!kind) {
        return `<h2>Log exercise</h2>
          <button class="opt" data-x="kind" data-k="run"><span class="ico">🏃</span><span>Run<span class="sub">Running, jogging, sprinting</span></span></button>
          <button class="opt" data-x="kind" data-k="lift"><span class="ico">🏋️</span><span>Weight lifting<span class="sub">Machines, free weights</span></span></button>
          <button class="opt" data-x="kind" data-k="describe"><span class="ico">✍️</span><span>Describe<span class="sub">Write your workout in words</span></span></button>
          <button class="opt" data-x="kind" data-k="manual"><span class="ico">🔥</span><span>Manual<span class="sub">Enter exactly how many calories you burned</span></span></button>`;
      }
      if (kind === 'run' || kind === 'lift') {
        const cal = Math.round(MET[kind][intensity] * latestWeightKg() * (minutes / 60));
        return `<h2>${kind === 'run' ? '🏃 Run' : '🏋️ Weight lifting'}</h2>
          <label class="f">Intensity</label>
          <div style="display:grid;gap:8px">${['High', 'Medium', 'Low'].map(i => `<button class="opt ${intensity === i ? 'on' : ''}" style="margin:0;padding:14px" data-x="int" data-i="${i}"><span>${i}<span class="sub">${{
            run: { High: 'Sprinting, about 14 mph (4 min miles)', Medium: 'Jogging, about 6 mph (10 min miles)', Low: 'Chill walk, about 3 mph (20 min miles)' },
            lift: { High: 'Training to failure, breathing heavily', Medium: 'Sweating a lot, many reps', Low: 'Not breaking a sweat, giving little effort' },
          }[kind][i]}</span></span></button>`).join('')}</div>
          <label class="f">Duration</label>
          <div class="chips">${[15, 30, 60, 90].map(m => `<button class="chip ${minutes === m ? 'on' : ''}" data-x="min" data-m="${m}">${m} min</button>`).join('')}</div>
          <input class="inp" name="min" type="number" inputmode="numeric" value="${minutes}" style="margin-top:10px" aria-label="Minutes">
          <div class="card kv" style="margin-top:14px"><div class="ic">🔥</div><div><div class="small muted">Estimated burn</div><div class="v num">${cal} cal</div></div></div>
          <button class="btn" data-x="logex" style="margin-top:14px">Log exercise</button>`;
      }
      if (kind === 'describe') {
        return `<h2>✍️ Describe exercise</h2><textarea class="inp" name="d" placeholder="e.g. 45 minute spin class, pretty intense" ${busy ? 'disabled' : ''}></textarea>
          <button class="btn" data-x="ai" style="margin-top:14px" ${busy ? 'disabled' : ''}>${busy ? '<span class="spin"></span> Estimating…' : 'Estimate burn'}</button>`;
      }
      return `<h2>🔥 Manual entry</h2>
        <label class="f">Workout</label><input class="inp" name="n" placeholder="e.g. Tennis">
        <div class="grid2"><div><label class="f">Calories burned</label><input class="inp" name="c" type="number" inputmode="numeric"></div>
        <div><label class="f">Minutes (optional)</label><input class="inp" name="m" type="number" inputmode="numeric"></div></div>
        <button class="btn" data-x="logman" style="margin-top:16px">Log exercise</button>`;
    },
    mount: el => {
      const mi = el.querySelector('[name=min]');
      if (mi) mi.onchange = () => { minutes = clamp(Math.round(num(mi.value)), 1, 600); drawLayer(L); };
      el.onclick = async ev => {
        const b = ev.target.closest('[data-x]');
        if (!b) return;
        const x = b.dataset.x;
        if (x === 'kind') {
          kind = b.dataset.k;
          if (kind === 'describe' && needKey(() => {})) { kind = null; return; }
          drawLayer(L);
        } else if (x === 'int') { intensity = b.dataset.i; drawLayer(L); }
        else if (x === 'min') { minutes = +b.dataset.m; drawLayer(L); }
        else if (x === 'logex') {
          if (mi) minutes = clamp(Math.round(num(mi.value)), 1, 600);
          const cal = Math.round(MET[kind][intensity] * latestWeightKg() * (minutes / 60));
          addExercise({ name: kind === 'run' ? 'Run' : 'Weight lifting', icon: kind === 'run' ? '🏃' : '🏋️', minutes, cal, intensity });
          closeLayer(L);
        } else if (x === 'logman') {
          const c = num(el.querySelector('[name=c]').value);
          if (!c) { toast('Enter the calories burned'); return; }
          addExercise({ name: el.querySelector('[name=n]').value.trim() || 'Workout', icon: '🔥', minutes: num(el.querySelector('[name=m]').value), cal: Math.round(c), intensity: '' });
          closeLayer(L);
        } else if (x === 'ai') {
          const d = el.querySelector('[name=d]').value.trim();
          if (!d) { toast('Describe your workout'); return; }
          busy = true; drawLayer(L);
          try {
            const r = await callClaude({
              system: 'You estimate calories burned during exercise for a fitness tracking app. Use standard MET values and the person\'s body weight. Give a realistic, not optimistic, estimate. Name should be short and title-cased.',
              content: [{ type: 'text', text: `Body weight: ${rnd(latestWeightKg(), 1)} kg. Workout: "${d}". If no duration is given, assume a typical one.` }],
              schema: EX_SCHEMA,
            });
            addExercise({ name: r.name || 'Workout', icon: '💪', minutes: Math.round(num(r.minutes)), cal: Math.round(Math.max(0, num(r.calories_burned))), intensity: r.intensity || '' });
            closeLayer(L);
          } catch (err) {
            busy = false; drawLayer(L); toast(err.message);
          }
        }
      };
    },
  });
}
function addExercise(x) {
  const now = new Date();
  const ts = sel === today() ? now.getTime() : fromKey(sel).setHours(now.getHours(), now.getMinutes());
  S.exercise.push({ id: uid(), ts, date: sel, ...x });
  save(); view = 'home'; refresh();
  toast(`Logged ${x.name}: ${x.cal} cal burned`);
}
function openExerciseEntry(id) {
  const x = S.exercise.find(e => e.id === id);
  if (!x) return;
  const L = openLayer({
    build: () => `<h2>${x.icon || '🔥'} ${esc(x.name)}</h2><p class="muted">${fmtTime(x.ts)}${x.minutes ? ` · ${Math.round(x.minutes)} min` : ''}${x.intensity ? ` · ${esc(x.intensity)}` : ''}</p>
      <label class="f">Calories burned</label><input class="inp" name="c" type="number" inputmode="numeric" value="${Math.round(x.cal)}">
      <div class="btnrow" style="margin-top:16px"><button class="btn danger" data-x="del">Delete</button><button class="btn" data-x="ok">Save</button></div>`,
    mount: el => {
      el.querySelector('[data-x=ok]').onclick = () => { x.cal = Math.max(0, Math.round(num(el.querySelector('[name=c]').value))); save(); closeLayer(L); refresh(); };
      el.querySelector('[data-x=del]').onclick = () => { S.exercise = S.exercise.filter(e => e.id !== id); save(); closeLayer(L); refresh(); toast('Deleted'); };
    },
  });
}

/* ---------------- Progress ---------------- */
function progressHTML() {
  const p = S.profile;
  const cur = latestWeightKg();
  const ws = [...S.weights].sort((a, b) => a.date.localeCompare(b.date));
  const start = ws.length ? ws[0].kg : cur;
  const span = start - p.goalKg;
  const pct = p.goal === 'maintain' || !span ? (Math.abs(cur - p.goalKg) < 1 ? 1 : 0) : clamp((start - cur) / span, 0, 1);
  const st = streak();
  const wk = weekDays();
  const bmi = cur / ((p.heightCm / 100) ** 2);
  const bmiCat = bmi < 18.5 ? ['Underweight', 'var(--fat)'] : bmi < 25 ? ['Healthy', 'var(--accent)'] : bmi < 30 ? ['Overweight', 'var(--warn)'] : ['Obese', 'var(--danger)'];
  const bmiPos = clamp(((bmi - 15) / (40 - 15)) * 100, 0, 100);
  return `<div class="wrap">
    <div class="top"><h1>Progress</h1></div>
    <div class="stat2">
      <div class="card"><div class="small muted">Current weight</div>
        <div class="num" style="font-size:1.8rem;font-weight:800;letter-spacing:-.03em">${wVal(cur)} <small style="font-size:.9rem" class="muted">${wUnit()}</small></div>
        <div class="tiny muted" style="margin:2px 0 12px">Goal ${wVal(p.goalKg)} ${wUnit()}</div>
        <button class="btn sm" style="width:100%" data-act="logWeight">Log weight</button></div>
      <div class="card" style="text-align:center"><div style="font-size:2.2rem">🔥</div>
        <div class="num" style="font-size:1.6rem;font-weight:800">${st}</div><div class="small muted">Day streak</div>
        <div style="display:flex;justify-content:center;gap:4px;margin-top:10px">${wk.map(k => `<span title="${fmtDate(k)}" style="width:14px;height:14px;border-radius:50%;background:${loggedOn(k) ? 'var(--burn)' : 'var(--ring-track)'}"></span>`).join('')}</div></div>
    </div>

    <div class="card" style="margin-top:12px">
      <div style="display:flex;justify-content:space-between;align-items:center"><h3>Goal progress</h3><span class="chip" style="padding:4px 10px">${Math.round(pct * 100)}% of goal</span></div>
      <div class="seg" style="margin:12px 0">${[['90', '90D'], ['180', '6M'], ['365', '1Y'], ['all', 'All']].map(([v, l]) => `<button class="${wRange === v ? 'on' : ''}" data-act="wRange" data-v="${v}">${l}</button>`).join('')}</div>
      <div class="chart">${weightChart()}</div>
    </div>

    <div class="card" style="margin-top:12px">
      <h3>Daily calories</h3>
      <div class="seg" style="margin:12px 0">${['This wk', 'Last wk', '2 wks', '3 wks'].map((l, i) => `<button class="${calWeek === i ? 'on' : ''}" data-act="calWeek" data-v="${i}">${l}</button>`).join('')}</div>
      ${calorieChart()}
    </div>

    <div class="card" style="margin-top:12px">
      <div style="display:flex;justify-content:space-between;align-items:baseline"><h3>Your BMI</h3><span class="chip" style="padding:4px 10px;color:${bmiCat[1]}">${bmiCat[0]}</span></div>
      <div class="num" style="font-size:1.8rem;font-weight:800;margin-top:6px">${rnd(bmi, 1)}</div>
      <div class="bmi-scale"><i style="left:${bmiPos}%"></i></div>
      <div class="legend"><span style="--c:var(--fat)">Under 18.5</span><span style="--c:var(--accent)">18.5–24.9</span><span style="--c:var(--warn)">25–29.9</span><span style="--c:var(--danger)">30+</span></div>
      <p class="tiny muted" style="margin-top:10px">BMI is a rough screening number. It doesn't account for muscle mass.</p>
    </div>
  </div>`;
}
function weightChart() {
  let ws = [...S.weights].sort((a, b) => a.date.localeCompare(b.date));
  if (wRange !== 'all') { const cut = addDays(today(), -num(wRange)); ws = ws.filter(w => w.date >= cut); }
  if (ws.length < 2) return `<div class="empty" style="padding:22px">${ws.length ? 'Log another weigh-in to see your trend.' : 'Log your weight to see your trend here.'}</div>`;
  const W = 320, H = 150, P = { l: 34, r: 8, t: 10, b: 20 };
  const vals = ws.map(w => wVal(w.kg));
  const goal = wVal(S.profile.goalKg);
  let lo = Math.min(...vals, goal), hi = Math.max(...vals, goal);
  if (hi - lo < 2) { hi += 1; lo -= 1; }
  const t0 = fromKey(ws[0].date).getTime(), t1 = fromKey(ws[ws.length - 1].date).getTime();
  const x = d => P.l + ((fromKey(d).getTime() - t0) / Math.max(t1 - t0, 1)) * (W - P.l - P.r);
  const y = v => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
  const path = ws.map((w, i) => `${i ? 'L' : 'M'}${x(w.date).toFixed(1)},${y(vals[i]).toFixed(1)}`).join('');
  const grid = [0, 0.5, 1].map(f => { const v = lo + (hi - lo) * f; return `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--border)"/><text x="${P.l - 6}" y="${y(v) + 3}" text-anchor="end">${rnd(v, 0)}</text>`; }).join('');
  const lbl = d => fromKey(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight over time">
    ${grid}
    <line x1="${P.l}" x2="${W - P.r}" y1="${y(goal)}" y2="${y(goal)}" stroke="var(--accent)" stroke-dasharray="4 4"/>
    <text x="${W - P.r}" y="${y(goal) - 4}" text-anchor="end" style="fill:var(--accent)">Goal</text>
    <path d="${path}" fill="none" stroke="var(--text)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${ws.map((w, i) => `<circle cx="${x(w.date)}" cy="${y(vals[i])}" r="3.5" fill="var(--surface)" stroke="var(--text)" stroke-width="2"/>`).join('')}
    <text x="${P.l}" y="${H - 4}">${lbl(ws[0].date)}</text><text x="${W - P.r}" y="${H - 4}" text-anchor="end">${lbl(ws[ws.length - 1].date)}</text>
  </svg>`;
}
function calorieChart() {
  const t = fromKey(today());
  const start = new Date(t); start.setDate(t.getDate() - t.getDay() - calWeek * 7);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return dkey(d); });
  const tots = days.map(dayTotals);
  const goal = S.goals.cal;
  const max = Math.max(goal * 1.15, ...tots.map(x => x.cal)) || 1;
  const W = 320, H = 160, P = { l: 8, r: 8, t: 10, b: 22 };
  const bw = (W - P.l - P.r) / 7;
  const y = v => P.t + (1 - v / max) * (H - P.t - P.b);
  const logged = tots.filter(x => x.cal > 0);
  const avg = logged.length ? logged.reduce((a, x) => a + x.cal, 0) / logged.length : 0;
  const bars = tots.map((x, i) => {
    const pk = x.protein * 4, ck = x.carbs * 4, fk = x.fat * 9;
    const sum = pk + ck + fk || 1;
    const scale = x.cal / sum;
    let base = H - P.b;
    const seg = (v, c) => { const h = (v * scale / max) * (H - P.t - P.b); base -= h; return h > 0 ? `<rect x="${P.l + i * bw + bw * 0.22}" y="${base}" width="${bw * 0.56}" height="${h}" fill="${c}" rx="2"/>` : ''; };
    const d = fromKey(days[i]);
    return seg(pk, 'var(--protein)') + seg(ck, 'var(--carbs)') + seg(fk, 'var(--fat)') +
      `<text x="${P.l + i * bw + bw / 2}" y="${H - 6}" text-anchor="middle">${d.toLocaleDateString([], { weekday: 'narrow' })}</text>`;
  }).join('');
  return `<div style="display:flex;gap:18px;margin-bottom:8px"><div><div class="num" style="font-weight:800;font-size:1.3rem">${Math.round(avg)}</div><div class="tiny muted">Avg calories/day</div></div>
      <div><div class="num" style="font-weight:800;font-size:1.3rem">${goal}</div><div class="tiny muted">Daily goal</div></div></div>
    <div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Calories per day">
      <line x1="${P.l}" x2="${W - P.r}" y1="${y(goal)}" y2="${y(goal)}" stroke="var(--muted)" stroke-dasharray="4 4"/>
      ${bars}</svg></div>
    <div class="legend" style="margin-top:6px"><span style="--c:var(--protein)">Protein</span><span style="--c:var(--carbs)">Carbs</span><span style="--c:var(--fat)">Fat</span><span style="--c:var(--muted)">- - Goal</span></div>`;
}
function openWeightSheet() {
  const L = openLayer({
    build: () => `<h2>Log weight</h2>
      <label class="f">Weight (${wUnit()})</label><input class="inp" name="w" type="number" inputmode="decimal" step="0.1" value="${wVal(latestWeightKg())}">
      <label class="f">Date</label><input class="inp" name="d" type="date" value="${today()}" max="${today()}">
      <button class="btn" data-x="ok" style="margin-top:16px">Save</button>
      ${S.weights.length ? `<div class="section-title"><h3>History</h3></div><div class="list">${[...S.weights].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12).map(w => `<div class="li"><span>${fmtDate(w.date, { month: 'short', day: 'numeric', year: 'numeric' })}</span><span class="r num">${wVal(w.kg)} ${wUnit()} <button class="chip" style="padding:4px 10px" data-del="${w.date}" aria-label="Delete">✕</button></span></div>`).join('')}</div>` : ''}`,
    mount: el => {
      el.querySelector('[data-x=ok]').onclick = () => {
        const kg = wFromInput(el.querySelector('[name=w]').value);
        const d = el.querySelector('[name=d]').value || today();
        if (kg < 20 || kg > 400) { toast('Enter a valid weight'); return; }
        S.weights = S.weights.filter(w => w.date !== d);
        S.weights.push({ date: d, kg: rnd(kg, 2) });
        S.profile.weightKg = latestWeightKg();
        save(); closeLayer(L); refresh(); toast('Weight logged');
      };
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { S.weights = S.weights.filter(w => w.date !== b.dataset.del); save(); drawLayer(L); refresh(); });
    },
  });
}

/* ---------------- Settings ---------------- */
function settingsHTML() {
  const p = S.profile;
  const hasKey = !!(S.settings.apiKey || '').trim();
  const sw = (k, on) => `<button class="li" data-act="toggle" data-k="${k}"><span>${{ addBurned: 'Add burned calories to daily goal', rollover: 'Roll over leftover calories (up to 200)' }[k]}</span><span class="switch ${on ? 'on' : ''}" role="switch" aria-checked="${on}"></span></button>`;
  return `<div class="wrap">
    <div class="top"><h1>Profile</h1></div>
    <div class="card" style="display:flex;align-items:center;gap:14px">
      <div style="width:56px;height:56px;border-radius:50%;background:var(--ink);color:var(--on-ink);display:grid;place-items:center;font-size:1.6rem">${p.sex === 'female' ? '👩' : p.sex === 'male' ? '👨' : '🙂'}</div>
      <div><div style="font-weight:700">${ageOf(p.birth)} years · ${hText(p.heightCm)}</div><div class="small muted">${wVal(latestWeightKg())} ${wUnit()} now · goal ${wVal(p.goalKg)} ${wUnit()}</div></div>
    </div>

    <div class="card list" style="margin-top:12px;padding:4px 16px">
      <button class="li" data-act="details"><span>👤 Personal details</span><span class="r">›</span></button>
      <button class="li" data-act="goals"><span>🎯 Adjust goals</span><span class="r num">${S.goals.cal} cal ›</span></button>
      <button class="li" data-act="logWeight"><span>⚖️ Log weight</span><span class="r">›</span></button>
    </div>

    <div class="section-title"><h3>AI food scanning</h3></div>
    <div class="card list" style="padding:4px 16px">
      <button class="li" data-act="apikey"><span>✨ Claude API key</span><span class="r" style="color:${hasKey ? 'var(--accent)' : 'var(--danger)'}">${hasKey ? 'Connected' : 'Not set'} ›</span></button>
    </div>
    <p class="tiny muted" style="margin:8px 4px 0">Photos and descriptions are sent to Anthropic's Claude API with your key to estimate nutrition. Everything else stays on this device.</p>

    <div class="section-title"><h3>Preferences</h3></div>
    <div class="card list" style="padding:4px 16px">
      <div class="li"><span>Units</span><div class="seg" style="width:180px"><button class="${imperial() ? 'on' : ''}" data-act="units" data-v="imperial">lb / ft</button><button class="${imperial() ? '' : 'on'}" data-act="units" data-v="metric">kg / cm</button></div></div>
      ${sw('addBurned', S.settings.addBurned)}
      ${sw('rollover', S.settings.rollover)}
    </div>

    <div class="section-title"><h3>Your data</h3></div>
    <div class="card list" style="padding:4px 16px">
      <button class="li" data-act="export"><span>⬇️ Export backup</span><span class="r">›</span></button>
      <button class="li" data-act="import"><span>⬆️ Import backup</span><span class="r">›</span></button>
      <button class="li" data-act="reset"><span style="color:var(--danger)">Delete all data</span><span class="r">›</span></button>
    </div>
    <p class="tiny muted" style="margin:18px 4px 0">Morsel gives estimates, not medical advice. Talk to a doctor or dietitian before big changes to your diet.</p>
  </div>`;
}
function openDetailsSheet() {
  const p = { ...S.profile };
  const L = openLayer({
    build: () => `<h2>Personal details</h2>
      <label class="f">Sex</label><div class="seg">${['male', 'female', 'other'].map(s => `<button class="${p.sex === s ? 'on' : ''}" data-x="sex" data-v="${s}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}</div>
      <label class="f">Birthday</label><input class="inp" name="birth" type="date" value="${esc(p.birth)}" max="${today()}">
      ${heightInputs(p)}
      <div class="grid2"><div><label class="f">Current weight (${wUnit()})</label><input class="inp" name="w" type="number" inputmode="decimal" value="${wVal(p.weightKg)}"></div>
      <div><label class="f">Goal weight (${wUnit()})</label><input class="inp" name="gw" type="number" inputmode="decimal" value="${wVal(p.goalKg)}"></div></div>
      <label class="f">Workouts per week</label><div class="seg">${['0-2', '3-5', '6+'].map(s => `<button class="${p.workouts === s ? 'on' : ''}" data-x="wo" data-v="${s}">${s}</button>`).join('')}</div>
      <label class="f">Goal</label><div class="seg">${[['lose', 'Lose'], ['maintain', 'Maintain'], ['gain', 'Gain']].map(([v, l]) => `<button class="${p.goal === v ? 'on' : ''}" data-x="goal" data-v="${v}">${l}</button>`).join('')}</div>
      ${p.goal === 'maintain' ? '' : `<label class="f">Pace: ${paceText(p.paceKg)} per week</label><input type="range" name="pace" min="0.1" max="1" step="0.05" value="${p.paceKg}">`}
      <button class="btn" data-x="ok" style="margin-top:18px">Save</button>`,
    mount: el => {
      const keep = () => readHeight(el, p);
      el.querySelectorAll('[data-x=sex],[data-x=wo],[data-x=goal]').forEach(b => b.onclick = () => {
        keep(); readCommon();
        p[{ sex: 'sex', wo: 'workouts', goal: 'goal' }[b.dataset.x]] = b.dataset.v; drawLayer(L);
      });
      const pace = el.querySelector('[name=pace]');
      if (pace) pace.oninput = () => { p.paceKg = num(pace.value); pace.previousElementSibling.textContent = `Pace: ${paceText(p.paceKg)} per week`; };
      function readCommon() {
        p.birth = el.querySelector('[name=birth]').value || p.birth;
        const w = wFromInput(el.querySelector('[name=w]').value); if (w > 20) p.weightKg = w;
        const g = wFromInput(el.querySelector('[name=gw]').value); if (g > 20) p.goalKg = g;
      }
      el.querySelector('[data-x=ok]').onclick = () => {
        keep(); readCommon();
        const weightChanged = Math.abs(p.weightKg - latestWeightKg()) > 0.05;
        S.profile = p;
        if (weightChanged) { S.weights = S.weights.filter(w => w.date !== today()); S.weights.push({ date: today(), kg: rnd(p.weightKg, 2) }); }
        save(); closeLayer(L); refresh();
        confirmSheet('Update your goals?', 'Recalculate your daily calories and macros from your new details.', 'Update goals', () => {
          S.goals = computePlan(S.profile); save(); refresh(); toast('Goals updated');
        }, false);
      };
    },
  });
}
const paceText = kg => (imperial() ? `${rnd(kgToLb(kg), 1)} lb` : `${rnd(kg, 2)} kg`);
function heightInputs(p) {
  if (imperial()) {
    const inches = Math.round(p.heightCm / 2.54);
    return `<label class="f">Height</label><div class="grid2">
      <select class="inp" name="ft" aria-label="Feet">${[4, 5, 6, 7].map(f => `<option value="${f}" ${Math.floor(inches / 12) === f ? 'selected' : ''}>${f} ft</option>`).join('')}</select>
      <select class="inp" name="in" aria-label="Inches">${Array.from({ length: 12 }, (_, i) => `<option value="${i}" ${inches % 12 === i ? 'selected' : ''}>${i} in</option>`).join('')}</select></div>`;
  }
  return `<label class="f">Height (cm)</label><input class="inp" name="cm" type="number" inputmode="numeric" value="${Math.round(p.heightCm)}">`;
}
function readHeight(el, p) {
  const ft = el.querySelector('[name=ft]'), inch = el.querySelector('[name=in]'), cm = el.querySelector('[name=cm]');
  if (ft && inch) p.heightCm = (num(ft.value) * 12 + num(inch.value)) * 2.54;
  else if (cm && num(cm.value) > 80) p.heightCm = num(cm.value);
}
function openGoalsSheet() {
  const g = { ...S.goals };
  const L = openLayer({
    build: () => `<h2>Adjust goals</h2>
      <div style="display:grid;gap:10px;margin-top:6px">${[...NUTRIENTS, 'water'].map(n => {
        const meta = n === 'water' ? { label: 'Water', unit: 'ml', color: 'var(--water)', icon: '💧' } : MACRO[n];
        const pct = n === 'cal' || n === 'water' ? 1 : n === 'protein' || n === 'carbs' ? (g[n] * 4) / g.cal : n === 'fat' ? (g[n] * 9) / g.cal : 0.5;
        return `<div class="card" style="display:flex;align-items:center;gap:14px;padding:12px 14px">
          ${ring(48, 5, pct, meta.color, `<span style="font-size:.95rem">${meta.icon}</span>`)}
          <div style="flex:1"><label class="small muted" for="g_${n}">${meta.label}${n === 'cal' ? ' goal' : ''}${meta.unit ? ` (${meta.unit})` : ''}</label>
          <input class="inp" id="g_${n}" name="${n}" type="number" inputmode="numeric" value="${Math.round(g[n])}" style="padding:8px 10px;margin-top:4px"></div></div>`;
      }).join('')}</div>
      <div class="btnrow" style="margin-top:16px"><button class="btn line" data-x="auto">✨ Auto-generate</button><button class="btn" data-x="ok">Save</button></div>`,
    mount: el => {
      el.querySelector('[data-x=auto]').onclick = () => { Object.assign(g, computePlan(S.profile)); drawLayer(L); toast('Goals calculated from your details'); };
      el.querySelector('[data-x=ok]').onclick = () => {
        [...NUTRIENTS, 'water'].forEach(n => { const v = Math.round(num(el.querySelector(`[name=${n}]`).value)); if (v > 0) g[n] = v; });
        if (g.cal < 800) { toast('Calories should be at least 800'); return; }
        S.goals = g; save(); closeLayer(L); refresh(); toast('Goals saved');
      };
    },
  });
}
function openKeySheet(after) {
  const L = openLayer({
    build: () => `<h2>✨ Connect Claude</h2>
      <p class="small muted" style="margin-bottom:10px">Morsel uses Claude to recognize food in your photos and estimate nutrition. Paste an API key from <b>console.anthropic.com</b> → API keys. Usage is billed to your Anthropic account; each scan costs a few cents.</p>
      <input class="inp" name="k" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-…" value="${esc(S.settings.apiKey)}">
      <div class="note" style="margin-top:10px">Your key is stored only on this device and sent only to api.anthropic.com. Other apps on this site share the same browser storage.</div>
      <div class="btnrow" style="margin-top:16px">${S.settings.apiKey ? '<button class="btn danger" data-x="rm">Remove key</button>' : '<button class="btn ghost" data-x="no">Not now</button>'}<button class="btn" data-x="ok">Save</button></div>`,
    mount: el => {
      el.querySelector('[data-x=ok]').onclick = () => {
        const k = el.querySelector('[name=k]').value.trim();
        if (!/^sk-ant-/.test(k)) { toast('That doesn\'t look like a Claude API key (sk-ant-…)'); return; }
        S.settings.apiKey = k; save(); closeLayer(L); refresh(); toast('Claude connected');
        if (after) after();
      };
      el.querySelector('[data-x=no]')?.addEventListener('click', () => closeLayer(L));
      el.querySelector('[data-x=rm]')?.addEventListener('click', () => { S.settings.apiKey = ''; save(); closeLayer(L); refresh(); toast('Key removed'); });
    },
  });
}
function exportData() {
  const data = { ...S, settings: { ...S.settings, apiKey: '' } };
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `morsel-backup-${today()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Backup downloaded (photos not included)');
}
async function importData(input) {
  const f = input.files?.[0];
  input.value = '';
  if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (!d || !Array.isArray(d.entries) || !d.profile || !d.goals) throw new Error();
    // Keep this device's API key: a backup file never gets to set which key Morsel uses
    const key = S.settings.apiKey;
    S = sanitizeState({ ...d, onboarded: true, settings: { ...d.settings, apiKey: key } });
    save(); closeAllLayers(); refresh(); toast('Backup restored');
  } catch { toast("That file isn't a Morsel backup"); }
}

/* ---------------- Onboarding ---------------- */
let ob = null;
function obSteps() {
  const s = ['welcome', 'sex', 'workouts', 'body', 'birth', 'goal'];
  if (ob.p.goal !== 'maintain') s.push('target', 'pace');
  s.push('plan', 'key');
  return s;
}
function renderOnboarding() {
  if (!ob) ob = { i: 0, p: { ...S.profile } };
  let el = $('#onb');
  if (!el) { el = document.createElement('div'); el.id = 'onb'; document.body.appendChild(el); el.onclick = onObClick; el.oninput = onObInput; }
  const steps = obSteps();
  ob.i = clamp(ob.i, 0, steps.length - 1);
  const step = steps[ob.i];
  const p = ob.p;
  const opt = (field, v, ico, label, sub = '') => `<button class="opt ${p[field] === v ? 'on' : ''}" data-o="set" data-f="${field}" data-v="${v}"><span class="ico">${ico}</span><span>${label}${sub ? `<span class="sub">${sub}</span>` : ''}</span></button>`;
  let body = '', cta = 'Continue', ok = true;
  if (step === 'welcome') {
    body = `<div class="welcome-art"><img src="icon-512.png" alt="" width="132" height="132" style="border-radius:32px;box-shadow:var(--shadow)"></div>
      <h1 style="text-align:center">Calorie tracking<br>made effortless</h1>
      <p class="muted" style="text-align:center;margin-top:10px">Snap a photo of your meal and Morsel works out the calories, protein, carbs and fat for you.</p>
      <div style="display:grid;gap:10px;margin-top:26px">
        <div class="card" style="display:flex;gap:12px;align-items:center;padding:14px"><span style="font-size:1.5rem">📸</span><span class="small"><b>Snap, don't type.</b> AI recognizes your food and portion size.</span></div>
        <div class="card" style="display:flex;gap:12px;align-items:center;padding:14px"><span style="font-size:1.5rem">🎯</span><span class="small"><b>A plan built for you.</b> Daily calorie and macro goals from your body and goal.</span></div>
        <div class="card" style="display:flex;gap:12px;align-items:center;padding:14px"><span style="font-size:1.5rem">📈</span><span class="small"><b>See your progress.</b> Streaks, weight trend and weekly charts.</span></div>
      </div>`;
    cta = 'Get started';
  } else if (step === 'sex') {
    body = `<h1>Choose your gender</h1><p class="muted">This is used to calibrate your custom plan.</p>
      ${opt('sex', 'male', '👨', 'Male')}${opt('sex', 'female', '👩', 'Female')}${opt('sex', 'other', '🙂', 'Other')}`;
  } else if (step === 'workouts') {
    body = `<h1>How many workouts do you do per week?</h1><p class="muted">This is used to calibrate your custom plan.</p>
      ${opt('workouts', '0-2', '•', '0–2', 'Workouts now and then')}${opt('workouts', '3-5', '••', '3–5', 'A few workouts per week')}${opt('workouts', '6+', '•••', '6+', 'Dedicated athlete')}`;
  } else if (step === 'body') {
    body = `<h1>Height & weight</h1><p class="muted">This is used to calibrate your custom plan.</p>
      <div class="seg" style="margin-bottom:6px"><button class="${p.units === 'imperial' ? 'on' : ''}" data-o="units" data-v="imperial">Imperial</button><button class="${p.units === 'metric' ? 'on' : ''}" data-o="units" data-v="metric">Metric</button></div>
      ${heightInputs(p)}
      <label class="f">Weight (${wUnit()})</label><input class="inp" name="w" type="number" inputmode="decimal" value="${wVal(p.weightKg)}">`;
  } else if (step === 'birth') {
    body = `<h1>When were you born?</h1><p class="muted">This is used to calibrate your custom plan.</p>
      <input class="inp" name="birth" type="date" value="${esc(p.birth)}" max="${today()}" style="font-size:1.2rem;padding:18px">`;
  } else if (step === 'goal') {
    body = `<h1>What is your goal?</h1><p class="muted">This helps us generate a plan for your calorie intake.</p>
      ${opt('goal', 'lose', '📉', 'Lose weight')}${opt('goal', 'maintain', '⚖️', 'Maintain')}${opt('goal', 'gain', '📈', 'Gain weight')}`;
  } else if (step === 'target') {
    const lo = p.goal === 'lose' ? p.weightKg * 0.6 : p.weightKg;
    const hi = p.goal === 'lose' ? p.weightKg : p.weightKg * 1.4;
    if (p.goal === 'lose' && p.goalKg >= p.weightKg) p.goalKg = rnd(p.weightKg * 0.92, 1);
    if (p.goal === 'gain' && p.goalKg <= p.weightKg) p.goalKg = rnd(p.weightKg * 1.08, 1);
    body = `<h1>What is your desired weight?</h1><p class="muted">${p.goal === 'lose' ? 'Lose' : 'Gain'} weight</p>
      <div class="bignum num" id="gwv">${wVal(p.goalKg)} <small class="muted" style="font-size:1.2rem">${wUnit()}</small></div>
      <input type="range" name="gw" min="${lo}" max="${hi}" step="${imperial() ? 0.2268 : 0.1}" value="${p.goalKg}" aria-label="Desired weight">
      <p class="muted small" style="text-align:center;margin-top:10px" id="gwd">${goalDiffText(p)}</p>`;
  } else if (step === 'pace') {
    body = `<h1>How fast do you want to reach your goal?</h1><p class="muted">${p.goal === 'lose' ? 'Loss' : 'Gain'} speed per week</p>
      <div class="bignum num" id="pv">${paceText(p.paceKg)}</div>
      <div style="display:flex;justify-content:space-between;font-size:1.8rem;margin:10px 4px 4px"><span>🐢</span><span>🐇</span><span>🐆</span></div>
      <input type="range" name="pace" min="0.1" max="1" step="0.05" value="${p.paceKg}" aria-label="Pace">
      <div class="note" style="margin-top:16px;text-align:center" id="pn">${paceNote(p.paceKg)}</div>`;
  } else if (step === 'plan') {
    const g = computePlan(p);
    const when = goalDateText(p);
    body = `<div style="text-align:center"><div style="font-size:2.4rem">🎉</div><h1>Your custom plan is ready!</h1>
      ${when ? `<p class="muted" style="margin-top:8px">You should ${p.goal === 'lose' ? 'lose' : 'gain'} <b style="color:var(--text)">${rnd(Math.abs(wVal(p.weightKg) - wVal(p.goalKg)), 1)} ${wUnit()}</b> by <b style="color:var(--text)">${esc(when)}</b></p>` : '<p class="muted" style="margin-top:8px">Here is your daily plan to maintain your weight.</p>'}</div>
      <div class="planrings">
        <div class="card">${ring(90, 8, 0.72, 'var(--ink)', `<b class="num">${g.cal}</b>`)}<span class="small">🔥 Calories</span></div>
        <div class="card">${ring(90, 8, (g.carbs * 4) / g.cal, 'var(--carbs)', `<b class="num">${g.carbs}g</b>`)}<span class="small">🌾 Carbs</span></div>
        <div class="card">${ring(90, 8, (g.protein * 4) / g.cal, 'var(--protein)', `<b class="num">${g.protein}g</b>`)}<span class="small">🥩 Protein</span></div>
        <div class="card">${ring(90, 8, (g.fat * 9) / g.cal, 'var(--fat)', `<b class="num">${g.fat}g</b>`)}<span class="small">🥑 Fats</span></div>
      </div>
      <div class="card"><h3 style="margin-bottom:8px">How to reach your goals</h3>
        <p class="small" style="margin-bottom:6px">📸 Log every meal. Snapping a photo takes seconds.</p>
        <p class="small" style="margin-bottom:6px">🔥 Stay near your calorie goal each day.</p>
        <p class="small" style="margin-bottom:6px">🥩 Hit your protein to keep muscle.</p>
        <p class="small">⚖️ Weigh in weekly to see your trend.</p></div>
      <p class="tiny muted" style="margin-top:12px">You can change these any time in Profile → Adjust goals.</p>`;
    cta = "Let's get started";
  } else if (step === 'key') {
    body = `<h1>Turn on AI food scanning</h1><p class="muted">Morsel uses Claude to recognize food in your photos.</p>
      <div class="card" style="margin-bottom:14px"><p class="small">1. Go to <b>console.anthropic.com</b> and sign in.<br>2. Open <b>API keys</b> and create a key.<br>3. Paste it below.</p></div>
      <input class="inp" name="k" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-…" value="${esc(ob.key || '')}">
      <p class="tiny muted" style="margin-top:10px">The key stays on this device and is only sent to api.anthropic.com. Scans are billed to your Anthropic account. You can still log food by search, description and quick add without it.</p>`;
    cta = 'Finish';
  }
  el.innerHTML = `<div class="ohead">${ob.i > 0 ? `<button class="iconbtn" data-o="back" aria-label="Back">${backIcon}</button>` : '<span style="width:42px"></span>'}
      <div class="prog"><i style="width:${(ob.i / (steps.length - 1)) * 100}%"></i></div></div>
    <div class="obody">${body}</div>
    <div class="ofoot">${step === 'key' ? '<button class="btn ghost" data-o="skip" style="margin-bottom:10px">Skip for now</button>' : ''}<button class="btn" data-o="next" ${ok ? '' : 'disabled'}>${cta}</button></div>`;
}
function goalDiffText(p) {
  const d = Math.abs(wVal(p.goalKg) - wVal(p.weightKg));
  return `That's ${rnd(d, 1)} ${wUnit()} ${p.goal === 'lose' ? 'less' : 'more'} than now`;
}
function paceNote(kg) {
  if (kg <= 0.3) return 'Slow and steady: the easiest pace to stick with.';
  if (kg <= 0.6) return '✅ Recommended: a balanced pace for most people.';
  return 'Fast: you may feel hungry and low on energy.';
}
function onObInput(ev) {
  const t = ev.target;
  const p = ob.p;
  if (t.name === 'gw') { p.goalKg = rnd(num(t.value), 2); $('#gwv').innerHTML = `${wVal(p.goalKg)} <small class="muted" style="font-size:1.2rem">${wUnit()}</small>`; $('#gwd').textContent = goalDiffText(p); }
  if (t.name === 'pace') { p.paceKg = num(t.value); $('#pv').textContent = paceText(p.paceKg); $('#pn').textContent = paceNote(p.paceKg); }
  if (t.name === 'k') ob.key = t.value;
}
function readObFields() {
  const el = $('#onb');
  const p = ob.p;
  readHeight(el, p);
  const w = el.querySelector('[name=w]');
  if (w) { const kg = wFromInput(w.value); if (kg > 20 && kg < 400) p.weightKg = kg; }
  const b = el.querySelector('[name=birth]');
  if (b && b.value) p.birth = b.value;
}
function onObClick(ev) {
  const b = ev.target.closest('[data-o]');
  if (!b) return;
  const a = b.dataset.o;
  const p = ob.p;
  if (a === 'set') { p[b.dataset.f] = b.dataset.v; renderOnboarding(); setTimeout(() => { ob.i++; renderOnboarding(); }, 160); return; }
  if (a === 'units') { readObFields(); p.units = b.dataset.v; S.profile.units = p.units; renderOnboarding(); return; }
  if (a === 'back') { readObFields(); ob.i--; renderOnboarding(); return; }
  if (a === 'next' || a === 'skip') {
    readObFields();
    const step = obSteps()[ob.i];
    if (step === 'birth') { const age = ageOf(p.birth); if (age < 13) { toast('Morsel is for ages 13 and up'); return; } }
    if (step === 'key' && a === 'next') {
      const k = (ob.key || '').trim();
      if (k && !/^sk-ant-/.test(k)) { toast("That doesn't look like a Claude API key (sk-ant-…)"); return; }
      S.settings.apiKey = k;
    }
    if (step === 'key') {
      if (p.goal === 'maintain') p.goalKg = p.weightKg;
      S.profile = p;
      S.goals = computePlan(p);
      S.weights = [{ date: today(), kg: rnd(p.weightKg, 2) }];
      S.onboarded = true;
      save();
      $('#onb')?.remove();
      ob = null;
      render();
      toast('Welcome to Morsel! Tap + to log your first meal.');
      return;
    }
    ob.i++;
    renderOnboarding();
    $('#onb .obody').scrollTop = 0;
  }
}

/* ---------------- global events ---------------- */
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const a = b.dataset.act;
  switch (a) {
    case 'tab': view = b.dataset.tab; $('#main').scrollTop = 0; render(); break;
    case 'add': openAddMenu(); break;
    case 'day': sel = b.dataset.k; render(); break;
    case 'week': weekOffset = Math.min(0, weekOffset + num(b.dataset.d)); { const d = weekDays(); sel = d.includes(today()) ? today() : d[6]; } render(); break;
    case 'toggleEaten': showEaten = !showEaten; render(); break;
    case 'water': S.water[sel] = clamp((S.water[sel] || 0) + num(b.dataset.d), 0, 10000); save(); render(); break;
    case 'exercise': openExercise(); break;
    case 'open': openDetail(b.dataset.id); break;
    case 'openEx': openExerciseEntry(b.dataset.id); break;
    case 'logWeight': openWeightSheet(); break;
    case 'wRange': wRange = b.dataset.v; render(); break;
    case 'calWeek': calWeek = +b.dataset.v; render(); break;
    case 'details': openDetailsSheet(); break;
    case 'goals': openGoalsSheet(); break;
    case 'apikey': openKeySheet(); break;
    case 'units': S.profile.units = b.dataset.v; save(); render(); break;
    case 'toggle': S.settings[b.dataset.k] = !S.settings[b.dataset.k]; save(); render(); break;
    case 'export': exportData(); break;
    case 'import': $('#importFile').click(); break;
    case 'reset':
      confirmSheet('Delete all data?', 'This erases your log, weights, saved foods, goals and API key from this device. It cannot be undone.', 'Delete everything', () => {
        indexedDB.deleteDatabase('morsel-photos');
        IDB.db = null; imgCache.clear();
        localStorage.removeItem(KEY);
        S = defaults(); view = 'home'; sel = today(); ob = null;
        closeAllLayers(); render();
      });
      break;
  }
});
$('#pick').addEventListener('change', e => onPickedFile(e.target));
$('#snap').addEventListener('change', e => onPickedFile(e.target));
$('#importFile').addEventListener('change', e => importData(e.target));
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (scan.el) stopCamera(); else closeLayer();
});
document.addEventListener('visibilitychange', () => {
  // New day while the app sat in the background: jump to today
  if (!document.hidden && S.onboarded && weekOffset === 0 && sel !== today() && sel === addDays(today(), -1)) { sel = today(); render(); }
});

load();
render();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {}));
}
