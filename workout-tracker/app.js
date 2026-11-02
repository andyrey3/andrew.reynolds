// ========== PROGRAM ==========
const TOP_BACKOFF = [{ label: 'Top', target: '6-10' }, { label: 'Back-off', target: '12-20' }];
const TOP_BACKOFF_HI = [{ label: 'Top', target: '8-12' }, { label: 'Back-off', target: '15-25' }];

const PROGRAM = {
  upper: [
    { id: 'u1', name: 'Strive Chest press', sets: TOP_BACKOFF },
    { id: 'u2', name: 'High Incline DB shoulder press', sets: TOP_BACKOFF },
    { id: 'u3', name: 'Narrow Grip Smith press', sets: TOP_BACKOFF },
    { id: 'u4', name: 'Cable lateral', sets: TOP_BACKOFF },
    { id: 'u5', name: 'Unilateral HS front pulldown', sets: TOP_BACKOFF },
    { id: 'u6', name: 'Seated cable row', sets: TOP_BACKOFF },
    { id: 'u7', name: 'Cross body Tricep cable', sets: TOP_BACKOFF_HI },
    { id: 'u8', name: 'Hs preacher – unilateral', sets: TOP_BACKOFF_HI },
    { id: 'u9', name: 'Rope crunch', sets: TOP_BACKOFF_HI }
  ],
  lower: [
    { id: 'l1', name: 'Lying Hamstring curl', sets: TOP_BACKOFF, notes: 'CYBEX machine' },
    { id: 'l2', name: 'Super Seated Leg press (bodymasters)', sets: TOP_BACKOFF },
    { id: 'l3', name: 'Unilateral split squat (Bulgarian)', sets: [{ label: 'Set 1', target: '15-25' }] },
    { id: 'l4', name: 'leg ext – strive', sets: TOP_BACKOFF },
    { id: 'l5', name: 'Calf raises – Standing (Slant)', sets: TOP_BACKOFF },
    { id: 'l6', name: 'Hanging leg raises', bodyweight: true,
      sets: [{ label: 'Set 1', target: 'failure' }, { label: 'Set 2', target: 'failure' }] }
  ],
  upper2: [
    { id: 'ua1', name: 'HS Press Fly', sets: TOP_BACKOFF, notes: 'Banded' },
    { id: 'ua2', name: 'Smith Shoulder press', sets: TOP_BACKOFF },
    { id: 'ua3', name: 'Dip machine flex leverage', sets: TOP_BACKOFF },
    { id: 'ua4', name: 'Icarian standing lateral', sets: TOP_BACKOFF },
    { id: 'ua5', name: 'HS High Row', sets: TOP_BACKOFF },
    { id: 'ua6', name: 'Chest Supported Row', sets: TOP_BACKOFF },
    { id: 'ua7', name: 'Preacher machine – Strive', sets: TOP_BACKOFF_HI },
    { id: 'ua8', name: 'Overhead Tri Ext – Seated cable', sets: TOP_BACKOFF_HI },
    { id: 'ua9', name: 'Nautilus Crunch machine', sets: TOP_BACKOFF_HI }
  ],
  lower2: [
    { id: 'la1', name: 'HS Seated Hamstring', sets: TOP_BACKOFF },
    { id: 'la2', name: 'Hip Press', sets: TOP_BACKOFF },
    { id: 'la3', name: 'SLDL', sets: TOP_BACKOFF, notes: 'Superset with hyperextensions' },
    { id: 'la4', name: 'Hyperextensions', sets: TOP_BACKOFF, bodyweight: true },
    { id: 'la5', name: 'HS Leg Ext', sets: TOP_BACKOFF },
    { id: 'la6', name: 'Calves – Donkey', sets: TOP_BACKOFF },
    { id: 'la7', name: 'Torso Twister', bodyweight: true,
      sets: [{ label: 'Set 1', target: 'failure' }, { label: 'Set 2', target: 'failure' }] }
  ]
};
// Lookup tables have no prototype, so keys read from saved data or a
// backup file ("constructor", "__proto__", …) never match built-ins
const lookup = o => Object.assign(Object.create(null), o);
Object.setPrototypeOf(PROGRAM, null);
const ALL_EXERCISES = Object.values(PROGRAM).flat();
const EX_BY_ID = lookup(Object.fromEntries(ALL_EXERCISES.map(e => [e.id, e])));

// The cycle: Upper → Lower → Rest → Upper 2 → Lower 2 → Rest → repeat
const DAY_ORDER = ['upper', 'lower', 'rest', 'upper2', 'lower2', 'rest2'];
const WORKOUT_DAYS = DAY_ORDER.filter(d => PROGRAM[d]);
const DAY_LABEL = lookup({ upper: 'Upper', lower: 'Lower', rest: 'Rest', upper2: 'Upper 2', lower2: 'Lower 2', rest2: 'Rest' });
const NEXT_DAY = lookup(Object.fromEntries(DAY_ORDER.map((d, i) => [d, DAY_ORDER[(i + 1) % DAY_ORDER.length]])));
const dayLabel = d => DAY_LABEL[d] || String(d || '');
// Colour class: Upper 2 shares Upper's colour, and so on
const dayClass = d => (DAY_LABEL[d] ? d.replace(/2$/, '') : '');

// ========== RANKS ==========
// Liftoff-style ranking: each lift gets a 1–1000 score from its best
// estimated 1RM (Epley, reps capped at 30) relative to bodyweight.
// Muscles average the lifts that train them; the overall rank averages
// the muscles.
const RANKS = [
  { name: 'Wood',     min: 0,   c1: '#c08a5a', c2: '#6b4226' },
  { name: 'Bronze',   min: 200, c1: '#e3a066', c2: '#8a4b1f' },
  { name: 'Silver',   min: 300, c1: '#e2e8f0', c2: '#7c8798' },
  { name: 'Gold',     min: 400, c1: '#fde047', c2: '#b7791f' },
  { name: 'Platinum', min: 500, c1: '#99f6e4', c2: '#0f9488' },
  { name: 'Diamond',  min: 600, c1: '#93c5fd', c2: '#2563eb' },
  { name: 'Champion', min: 700, c1: '#d8b4fe', c2: '#7e22ce' },
  { name: 'Titan',    min: 800, c1: '#fca5a5', c2: '#b91c1c' },
  { name: 'Olympian', min: 900, c1: '#fde68a', c2: '#db2777' }
];

// std = estimated 1RM ÷ bodyweight of an intermediate (Gold) male lifter.
// These are ballpark figures — machines differ from gym to gym.
const RANK_STD = lookup({
  u1: { std: 1.0,  region: 'upper', muscles: { chest: 1, triceps: 0.3, shoulders: 0.3 } },
  u2: { std: 0.3,  region: 'upper', muscles: { shoulders: 1, triceps: 0.3 }, hint: 'Log the weight of one dumbbell' },
  u3: { std: 0.9,  region: 'upper', muscles: { chest: 1, triceps: 1 } },
  u4: { std: 0.12, region: 'upper', muscles: { shoulders: 1 } },
  u5: { std: 0.55, region: 'upper', muscles: { back: 1, biceps: 0.3 } },
  u6: { std: 0.9,  region: 'upper', muscles: { back: 1, biceps: 0.3 } },
  u7: { std: 0.18, region: 'upper', muscles: { triceps: 1 } },
  u8: { std: 0.3,  region: 'upper', muscles: { biceps: 1 } },
  u9: { std: 0.8,  region: 'core',  muscles: { abs: 1 } },
  l1: { std: 0.6,  region: 'lower', muscles: { hamstrings: 1 } },
  l2: { std: 1.8,  region: 'lower', muscles: { quads: 1, glutes: 0.5 } },
  l3: { std: 1.2,  region: 'lower', muscles: { quads: 1, glutes: 1 }, bwLoad: 0.6, hint: 'Log the total dumbbell weight (0 for bodyweight)' },
  l4: { std: 1.0,  region: 'lower', muscles: { quads: 1 } },
  l5: { std: 1.4,  region: 'lower', muscles: { calves: 1 } },
  l6: { std: 15,   region: 'core',  muscles: { abs: 1 }, repsBased: true },
  ua1: { std: 0.8,  region: 'upper', muscles: { chest: 1 } },
  ua2: { std: 0.65, region: 'upper', muscles: { shoulders: 1, triceps: 0.3 } },
  ua3: { std: 1.0,  region: 'upper', muscles: { triceps: 1, chest: 0.5 } },
  ua4: { std: 0.2,  region: 'upper', muscles: { shoulders: 1 } },
  ua5: { std: 1.0,  region: 'upper', muscles: { back: 1, biceps: 0.3 } },
  ua6: { std: 1.0,  region: 'upper', muscles: { back: 1, biceps: 0.3 } },
  ua7: { std: 0.6,  region: 'upper', muscles: { biceps: 1 } },
  ua8: { std: 0.35, region: 'upper', muscles: { triceps: 1 } },
  ua9: { std: 1.1,  region: 'core',  muscles: { abs: 1 } },
  la1: { std: 0.8,  region: 'lower', muscles: { hamstrings: 1 } },
  la2: { std: 0.7,  region: 'lower', muscles: { glutes: 1, hamstrings: 0.3 } },
  la3: { std: 1.2,  region: 'lower', muscles: { hamstrings: 1, glutes: 0.5 } },
  la4: { std: 20,   region: 'lower', muscles: { glutes: 1, hamstrings: 0.5 }, repsBased: true },
  la5: { std: 1.2,  region: 'lower', muscles: { quads: 1 } },
  la6: { std: 1.4,  region: 'lower', muscles: { calves: 1 } },
  la7: { std: 30,   region: 'core',  muscles: { abs: 1 }, repsBased: true }
});

const MUSCLES = [
  ['chest', 'Chest'], ['shoulders', 'Shoulders'], ['back', 'Back'], ['biceps', 'Biceps'],
  ['triceps', 'Triceps'], ['abs', 'Abs'], ['quads', 'Quads'], ['hamstrings', 'Hamstrings'],
  ['glutes', 'Glutes'], ['calves', 'Calves']
];
const MUSCLE_NAME = Object.fromEntries(MUSCLES);

// Strength relative to an intermediate lifter → score
const ANCHORS = [[0, 0], [0.25, 50], [0.5, 200], [0.75, 300], [1, 400], [1.2, 500],
                 [1.4, 600], [1.6, 700], [1.8, 800], [2, 900], [2.4, 1000]];
const SEX_FACTOR = {
  male: { upper: 1, lower: 1, core: 1 },
  female: { upper: 0.6, lower: 0.75, core: 0.85 }
};

// ========== STORAGE ==========
// Everything lives in localStorage on this device. v1 data under the
// old key is migrated once and left in place as a backup.
const STORE_KEY = 'ul-tracker-v2';
const LEGACY_KEY = 'ul-tracker';

const defaultState = () => ({
  version: 2,
  dayType: 'upper',
  sessions: [],   // { id, date, type, startedAt, finishedAt, ex: { [exId]: { sets:[{w,r}], note, legacy? } }, prs:[] }
  drafts: {},     // { upper|lower|upper2|lower2: { date, startedAt, ex: { [exId]: { sets:[{w,r,done}], note } } } }
  settings: { unit: 'lb', rest: 120, bw: null, sex: 'male' }
});

let state = defaultState();
let saveFailed = false;

function loadState() {
  let saved = null;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) saved = JSON.parse(raw);
  } catch (e) {}

  if (!saved) {
    saved = defaultState();
    try {
      const old = localStorage.getItem(LEGACY_KEY);
      if (old) migrateLegacy(JSON.parse(old), saved);
    } catch (e) {}
  }
  state = normalize(saved);
  saveState();
}

// Saved data and backup files can come from anyone, so fields that end
// up in the page as markup or attributes only keep known-safe values
// Keep only well-formed { sets: [ {..}, … ], note } entries
function cleanEntries(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  Object.keys(raw).forEach(id => {
    const e = raw[id];
    if (!e || typeof e !== 'object') return;
    out[id] = {
      ...e,
      sets: Array.isArray(e.sets) ? e.sets.filter(x => x && typeof x === 'object') : [],
      note: typeof e.note === 'string' ? e.note : ''
    };
  });
  return out;
}

function normalize(s) {
  const d = defaultState();
  const set = { ...d.settings, ...(s.settings && typeof s.settings === 'object' ? s.settings : {}) };
  const settings = {
    unit: set.unit === 'kg' ? 'kg' : 'lb',
    rest: Number.isFinite(+set.rest) && +set.rest > 0 ? +set.rest : d.settings.rest,
    bw: Number.isFinite(+set.bw) && +set.bw > 0 ? +set.bw : null,
    sex: set.sex === 'female' ? 'female' : 'male'
  };
  const sessions = (Array.isArray(s.sessions) ? s.sessions : [])
    .filter(x => x && typeof x === 'object')
    .map(x => ({
      ...x,
      id: typeof x.id === 'string' && /^[a-z0-9]{1,40}$/i.test(x.id) ? x.id : uid(),
      type: WORKOUT_DAYS.includes(x.type) ? x.type : 'other',
      ex: cleanEntries(x.ex),
      prs: Array.isArray(x.prs) ? x.prs : []
    }));
  const drafts = {};
  const rawDrafts = s.drafts && typeof s.drafts === 'object' ? s.drafts : {};
  WORKOUT_DAYS.forEach(t => {
    const dr = Object.prototype.hasOwnProperty.call(rawDrafts, t) ? rawDrafts[t] : null;
    if (dr && typeof dr === 'object') {
      drafts[t] = {
        ...dr,
        date: typeof dr.date === 'string' ? dr.date : localDate(),
        ex: cleanEntries(dr.ex)
      };
    }
  });
  return {
    ...d,
    ...s,
    version: 2,
    dayType: DAY_ORDER.includes(s.dayType) ? s.dayType : d.dayType,
    sessions,
    drafts,
    settings
  };
}

// v1 stored one free-text result per exercise; keep it as a text note
function migrateLegacy(old, target) {
  if (DAY_ORDER.includes(old.dayType)) target.dayType = old.dayType;
  (old.history || []).forEach(h => {
    const ex = {};
    (h.exercises || []).forEach(e => {
      if (e.result) ex[e.id] = { sets: [], note: '', legacy: e.result };
    });
    if (Object.keys(ex).length) {
      target.sessions.push({ id: uid(), date: h.date, type: h.type, ex, prs: [] });
    }
  });
}

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    saveFailed = false;
  } catch (e) {
    if (!saveFailed) showToast('Could not save — phone storage is full or blocked', true);
    saveFailed = true;
  }
}

function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => {});
  }
}

// ========== HELPERS ==========
const $ = id => document.getElementById(id);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Local calendar date (the old version used UTC, which logged evening
// workouts under tomorrow's date)
function localDate(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatDate(iso, opts) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString(undefined, opts || { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function shortDate(iso) {
  const sameYear = iso.slice(0, 4) === localDate().slice(0, 4);
  return formatDate(iso, sameYear ? { weekday: 'short', month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysAgo(iso) {
  const diff = Math.round((new Date(localDate() + 'T12:00:00') - new Date(iso + 'T12:00:00')) / 86400000);
  if (diff <= 0) return 'today';
  if (diff === 1) return 'yesterday';
  return diff + ' days ago';
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function parseRange(t) {
  const m = /^(\d+)-(\d+)$/.exec(t || '');
  return m ? [Number(m[1]), Number(m[2])] : null;
}

function num(v) {
  if (v === '' || v == null) return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

const unit = () => state.settings.unit;

function fmtSet(s, ex) {
  if (s.w == null || s.w === '') return ex && ex.bodyweight ? `BW × ${s.r}` : `${s.r} reps`;
  return ex && ex.bodyweight ? `BW+${s.w} × ${s.r}` : `${s.w} × ${s.r}`;
}

function fmtEntry(entry, ex) {
  if (entry.sets && entry.sets.length) return entry.sets.map(s => fmtSet(s, ex)).join(' · ');
  return entry.legacy || '';
}

// Epley estimated 1RM; reps alone for bodyweight work
function score(s, ex) {
  if (ex.bodyweight) return s.r || 0;
  if (!s.w || !s.r) return 0;
  return s.w * (1 + s.r / 30);
}

function bestScore(entry, ex) {
  return Math.max(0, ...(entry.sets || []).map(s => score(s, ex)));
}

// ---------- Rank math ----------
const refBW = () => (unit() === 'kg' ? 82 : 180);
const hasBodyweight = () => num(state.settings.bw) > 0;
const bodyweight = () => (hasBodyweight() ? num(state.settings.bw) : refBW());

function relToScore(rel) {
  if (!(rel > 0)) return 0;
  for (let i = 1; i < ANCHORS.length; i++) {
    const [x0, y0] = ANCHORS[i - 1], [x1, y1] = ANCHORS[i];
    if (rel <= x1) return Math.max(1, Math.round(y0 + (rel - x0) / (x1 - x0) * (y1 - y0)));
  }
  return 1000;
}

function scoreToRel(sc) {
  for (let i = 1; i < ANCHORS.length; i++) {
    const [x0, y0] = ANCHORS[i - 1], [x1, y1] = ANCHORS[i];
    if (sc <= y1) return x0 + (sc - y0) / (y1 - y0) * (x1 - x0);
  }
  return ANCHORS[ANCHORS.length - 1][0];
}

function stdFor(id) {
  const r = RANK_STD[id];
  return r.std * SEX_FACTOR[state.settings.sex === 'female' ? 'female' : 'male'][r.region];
}

const epley = (load, reps) => (reps === 1 ? load : load * (1 + Math.min(reps, 30) / 30));

// How strong one set is compared with an intermediate lifter (1 = Gold).
// Bodyweight is scaled allometrically (^2/3) so heavier lifters aren't favored.
function setRel(id, s) {
  const r = RANK_STD[id];
  if (!r || !s.r) return 0;
  const bw = bodyweight();
  if (r.repsBased) return s.r * (1 + (s.w || 0) / bw) / stdFor(id);
  const load = (s.w || 0) + (r.bwLoad || 0) * bw;
  if (load <= 0) return 0;
  return epley(load, s.r) / bw * Math.cbrt(bw / refBW()) / stdFor(id);
}

const setScore = (id, s) => relToScore(setRel(id, s));

function computeRanks(sessions) {
  const ex = {};
  sessions.forEach(sess => Object.entries(sess.ex || {}).forEach(([id, e]) => {
    (e.sets || []).forEach(s => {
      const sc = setScore(id, s);
      if (sc > (ex[id] || 0)) ex[id] = sc;
    });
  }));
  const muscle = {};
  MUSCLES.forEach(([m]) => {
    let sum = 0, wsum = 0;
    Object.entries(ex).forEach(([id, sc]) => {
      const w = RANK_STD[id] && RANK_STD[id].muscles[m];
      if (w) { sum += sc * w; wsum += w; }
    });
    if (wsum) muscle[m] = Math.round(sum / wsum);
  });
  const ms = Object.values(muscle);
  const overall = ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : 0;
  return { ex, muscle, overall, muscleCount: ms.length };
}

function rankIndex(sc) {
  if (!sc) return -1;
  let idx = 0;
  RANKS.forEach((r, k) => { if (sc >= r.min) idx = k; });
  return idx;
}
const rankOf = sc => RANKS[rankIndex(sc)] || null;
const rankName = sc => (rankOf(sc) ? rankOf(sc).name : 'Unranked');

function tierProgress(sc) {
  const i = rankIndex(sc);
  if (i < 0) return 0;
  const lo = RANKS[i].min, hi = RANKS[i + 1] ? RANKS[i + 1].min : 1000;
  return Math.min(1, (sc - lo) / (hi - lo));
}

// Weight (or reps) needed at a given rep count to reach the next rank
function nextTarget(id, sc, reps) {
  const i = rankIndex(sc);
  const next = RANKS[i + 1];
  const r = RANK_STD[id];
  if (i < 0 || !next || !r) return null;
  const rel = scoreToRel(next.min);
  const bw = bodyweight();
  if (r.repsBased) return { rank: next, text: `${Math.ceil(rel * stdFor(id))} reps` };
  const e1 = rel * stdFor(id) * bw / Math.cbrt(bw / refBW());
  const load = reps === 1 ? e1 : e1 / (1 + Math.min(reps, 30) / 30);
  const step = unit() === 'kg' ? 2.5 : 5;
  const w = Math.ceil((load - (r.bwLoad || 0) * bw) / step) * step;
  return { rank: next, text: w > 0 ? `${w} × ${reps}` : `BW × ${reps}` };
}

function targetReps(ex) {
  const last = lastFor(ex.id);
  const top = last && last.entry.sets && last.entry.sets[0];
  if (top && top.r) return top.r;
  const range = parseRange(ex.sets[0].target);
  return range ? range[0] : 10;
}

let badgeSeq = 0;
const HEX = 'M20 2 L36 11 V29 L20 38 L4 29 V11 Z';
function badgeSVG(sc, size) {
  const r = rankOf(sc);
  if (!r) {
    return `<svg class="badge" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true">
      <path d="${HEX}" fill="#172033" stroke="#475569" stroke-width="1.5" stroke-dasharray="3 2"/>
      <text x="20" y="25" text-anchor="middle" font-size="13" font-weight="800" fill="#64748b">?</text></svg>`;
  }
  const gid = 'rg' + (++badgeSeq);
  return `<svg class="badge" width="${size}" height="${size}" viewBox="0 0 40 40" role="img" aria-label="${r.name}">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${r.c1}"/><stop offset="1" stop-color="${r.c2}"/>
    </linearGradient></defs>
    <path d="${HEX}" fill="url(#${gid})" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>
    <path d="M20 7 L31 13.5 V17" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" stroke-linecap="round"/>
    <text x="20" y="25.5" text-anchor="middle" font-size="14" font-weight="800" fill="#fff"
          stroke="rgba(15,23,42,0.55)" stroke-width="2.5" paint-order="stroke">${r.name[0]}</text></svg>`;
}

function rankLabel(sc) {
  const r = rankOf(sc);
  return r ? `<b style="color:${r.c1}">${r.name}</b>` : '<b>Unranked</b>';
}

function tierBar(sc) {
  const r = rankOf(sc);
  return `<div class="tier-bar"><span style="width:${Math.round(tierProgress(sc) * 100)}%;background:${r ? r.c2 : 'transparent'}"></span></div>`;
}

// ---------- XP, level, streak ----------
function xpForSession(s) {
  const sets = Object.values(s.ex || {}).reduce((n, e) => n + (e.sets ? e.sets.length : 0), 0);
  return 25 + sets * 10 + (s.prs ? s.prs.length : 0) * 50 + (s.rankUps || 0) * 100;
}

function levelInfo() {
  const xp = state.sessions.reduce((n, s) => n + xpForSession(s), 0);
  let lvl = 1;
  while (xp >= 50 * lvl * (lvl + 1)) lvl++;
  const base = 50 * (lvl - 1) * lvl, next = 50 * lvl * (lvl + 1);
  return { xp, lvl, into: xp - base, span: next - base };
}

function weekKey(iso) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() - (d.getDay() + 6) % 7);
  return localDate(d);
}

// Weeks in a row with at least one workout (this week counts once you train)
function weekStreak() {
  const weeks = new Set(state.sessions.map(s => weekKey(s.date)));
  const d = new Date(weekKey(localDate()) + 'T12:00:00');
  if (!weeks.has(localDate(d))) d.setDate(d.getDate() - 7);
  let n = 0;
  while (weeks.has(localDate(d))) { n++; d.setDate(d.getDate() - 7); }
  return n;
}

function sortedSessions() {
  return [...state.sessions].sort((a, b) =>
    (a.date + (a.finishedAt || '')).localeCompare(b.date + (b.finishedAt || '')));
}

function hasData(entry) {
  return entry && (entry.legacy || (entry.sets && entry.sets.length));
}

function lastFor(exId) {
  const ss = sortedSessions();
  for (let i = ss.length - 1; i >= 0; i--) {
    const e = ss[i].ex && ss[i].ex[exId];
    if (hasData(e)) return { session: ss[i], entry: e };
  }
  return null;
}

function historyFor(exId) {
  return sortedSessions()
    .filter(s => s.ex && hasData(s.ex[exId]))
    .map(s => ({ session: s, entry: s.ex[exId] }));
}

// ========== DRAFT (in-progress workout, autosaved) ==========
function getDraft(type, create) {
  let d = state.drafts[type];
  if (!d && create) {
    d = state.drafts[type] = { date: localDate(), startedAt: new Date().toISOString(), ex: {} };
  }
  return d;
}

function blankEntry(ex) {
  return { sets: ex.sets.map(() => ({ w: '', r: '', done: false })), note: '' };
}

function draftEntry(ex, create) {
  const d = getDraft(state.dayType, create);
  if (!d) return blankEntry(ex);
  if (!d.ex[ex.id]) {
    if (!create) return blankEntry(ex);
    d.ex[ex.id] = blankEntry(ex);
  }
  return d.ex[ex.id];
}

// ========== RENDER: TODAY ==========
let currentRanks = { ex: {}, muscle: {}, overall: 0, muscleCount: 0 };

function exRankLine(ex) {
  const sc = currentRanks.ex[ex.id] || 0;
  const hint = RANK_STD[ex.id] && RANK_STD[ex.id].hint ? ` · ${esc(RANK_STD[ex.id].hint)}` : '';
  if (!sc) return `${rankLabel(0)} · log a set to get ranked${hint}`;
  const t = nextTarget(ex.id, sc, targetReps(ex));
  return `${rankLabel(sc)} ${sc}` +
    (t ? ` · Next: <b style="color:${t.rank.c1}">${t.rank.name}</b> at ${esc(t.text)}` : ' · Top rank!') + hint;
}

function renderToday() {
  $('date-label').textContent = formatDate(localDate());
  document.querySelectorAll('#day-switch button').forEach(b =>
    b.classList.toggle('active', b.dataset.day === state.dayType));

  if (!PROGRAM[state.dayType]) {
    $('rest-next').textContent = $('rest-next-btn').textContent = dayLabel(NEXT_DAY[state.dayType]);
    $('rest-view').style.display = 'block';
    $('workout-view').style.display = 'none';
    return;
  }
  $('rest-view').style.display = 'none';
  $('workout-view').style.display = 'block';

  const draft = getDraft(state.dayType, false);
  const banner = $('draft-banner');
  if (draft && draft.date !== localDate()) {
    banner.innerHTML = `<div class="banner">Unfinished workout from ${esc(shortDate(draft.date))}. Pick up where you left off, or discard it below.</div>`;
  } else {
    banner.innerHTML = '';
  }

  currentRanks = computeRanks(state.sessions);
  $('exercise-list').innerHTML = PROGRAM[state.dayType].map(cardHTML).join('');
  updateProgress();
}

function cardHTML(ex) {
  const entry = draftEntry(ex, false);
  const last = lastFor(ex.id);
  const lastSets = last && last.entry.sets ? last.entry.sets : [];
  const allDone = entry.sets.length > 0 && entry.sets.every(s => s.done);
  const targetText = ex.sets.map(s => s.target === 'failure' ? 'to failure' : s.target).join(', ');

  let lastHTML;
  if (last) {
    lastHTML = `Last · ${esc(shortDate(last.session.date))} (${daysAgo(last.session.date)}): <b>${esc(fmtEntry(last.entry, ex))}</b>` +
      (last.entry.note ? `<span class="last-note">“${esc(last.entry.note)}”</span>` : '');
  } else {
    lastHTML = 'First time logging this — set your baseline.';
  }

  const rows = entry.sets.map((s, i) => {
    const tmpl = ex.sets[i] || { label: 'Set ' + (i + 1), target: '' };
    const prev = lastSets[i];
    const range = parseRange(tmpl.target);
    const hint = !ex.bodyweight && prev && range && prev.r >= range[1] ? '<span class="chip">▲ GO UP</span>' : '';
    const wPh = prev && prev.w != null ? prev.w : (ex.bodyweight ? 'BW' : unit());
    const rPh = prev ? prev.r : (tmpl.target === 'failure' ? 'max' : tmpl.target || 'reps');
    return `
      <div class="set-label">${esc(tmpl.label)}${tmpl.target ? `<small>${esc(tmpl.target === 'failure' ? 'to failure' : tmpl.target + ' reps')}</small>` : ''}${hint}</div>
      <input class="${s.done ? 'is-done' : ''}" data-field="w" data-i="${i}" inputmode="decimal" enterkeyhint="next" autocomplete="off"
             aria-label="${esc(tmpl.label)} weight" placeholder="${esc(wPh)}" value="${esc(s.w)}">
      <input class="${s.done ? 'is-done' : ''}" data-field="r" data-i="${i}" inputmode="numeric" enterkeyhint="done" autocomplete="off"
             aria-label="${esc(tmpl.label)} reps" placeholder="${esc(rPh)}" value="${esc(s.r)}">
      <button class="set-check ${s.done ? 'done' : ''}" data-action="toggle-set" data-i="${i}" aria-label="Mark ${esc(tmpl.label)} done">✓</button>`;
  }).join('');

  const showNote = !!entry.note || entry.noteOpen;

  return `
    <div class="card ex-card ${allDone ? 'completed' : ''}" data-ex="${ex.id}">
      <div class="exercise-header">
        <div>
          <div class="name-row">${badgeSVG(currentRanks.ex[ex.id] || 0, 26)}<div class="exercise-name">${esc(ex.name)}</div></div>
          <div class="targets">${entry.sets.length} set${entry.sets.length === 1 ? '' : 's'} · ${esc(targetText)} reps</div>
          ${ex.notes ? `<div class="notes">${esc(ex.notes)}</div>` : ''}
        </div>
        <button class="icon-btn" data-action="ex-history" aria-label="${esc(ex.name)} history">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>
        </button>
      </div>
      <div class="last-box">${lastHTML}</div>
      <div class="rank-line">${exRankLine(ex)}</div>
      <div class="set-grid set-head"><span>Set</span><span>${ex.bodyweight ? '+' + unit() : unit()}</span><span>Reps</span><span></span></div>
      <div class="set-grid sets">${rows}</div>
      <div class="card-actions">
        <button class="link-btn" data-action="add-set">+ Add set</button>
        ${entry.sets.length > 1 ? '<button class="link-btn muted" data-action="remove-set">− Remove set</button>' : ''}
        ${showNote ? '' : '<button class="link-btn muted right" data-action="open-note">+ Note</button>'}
      </div>
      ${showNote ? `<textarea class="ex-note" data-field="note" rows="1" placeholder="Note for next time (seat height, how it felt…)">${esc(entry.note)}</textarea>` : ''}
    </div>`;
}

function rerenderCard(exId, focusSel) {
  const card = document.querySelector(`.ex-card[data-ex="${exId}"]`);
  if (!card) return;
  card.outerHTML = cardHTML(EX_BY_ID[exId]);
  if (focusSel) {
    const el = document.querySelector(`.ex-card[data-ex="${exId}"] ${focusSel}`);
    if (el) el.focus();
  }
  updateProgress();
}

function updateProgress() {
  if (!PROGRAM[state.dayType]) return;
  const exs = PROGRAM[state.dayType];
  let total = 0, done = 0;
  exs.forEach(ex => {
    const e = draftEntry(ex, false);
    total += e.sets.length;
    done += e.sets.filter(s => s.done).length;
  });
  $('progress-label').textContent = `${done} / ${total} sets done`;
  $('progress-fill').style.width = total ? (done / total * 100) + '%' : '0';
  updateElapsed();
}

function updateElapsed() {
  const d = getDraft(state.dayType, false);
  const el = $('elapsed-label');
  if (!d || !PROGRAM[state.dayType]) { el.textContent = ''; return; }
  const mins = Math.floor((Date.now() - new Date(d.startedAt)) / 60000);
  el.textContent = mins < 600 ? `${mins} min` : '';
}

// ========== TODAY: EVENTS ==========
$('exercise-list').addEventListener('input', e => {
  const t = e.target;
  const card = t.closest('.ex-card');
  if (!card) return;
  const ex = EX_BY_ID[card.dataset.ex];
  const entry = draftEntry(ex, true);
  if (t.dataset.field === 'note') {
    entry.note = t.value;
  } else {
    const i = Number(t.dataset.i);
    entry.sets[i][t.dataset.field] = t.value.trim();
  }
  saveState();
});

$('exercise-list').addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const card = btn.closest('.ex-card');
  const ex = EX_BY_ID[card.dataset.ex];
  const action = btn.dataset.action;

  if (action === 'ex-history') { openExercise(ex.id); return; }

  const entry = draftEntry(ex, true);
  const last = lastFor(ex.id);
  const lastSets = last && last.entry.sets ? last.entry.sets : [];

  if (action === 'toggle-set') {
    const i = Number(btn.dataset.i);
    const s = entry.sets[i];
    if (!s.done) {
      // Empty boxes mean "same as last time"
      const prev = lastSets[i];
      if (s.w === '' && prev && prev.w != null) s.w = String(prev.w);
      if (s.r === '' && prev && prev.r != null) s.r = String(prev.r);
      if (s.r === '') {
        saveState();
        rerenderCard(ex.id, `input[data-field="r"][data-i="${i}"]`);
        showToast('Enter your reps first', true);
        return;
      }
      s.done = true;
      startRest();
      const setSc = setScore(ex.id, { w: num(s.w), r: Math.round(num(s.r)) || 0 });
      const cur = currentRanks.ex[ex.id] || 0;
      if (rankIndex(setSc) > rankIndex(cur)) {
        showToast(`🔥 ${rankName(setSc)}-level set! Finish the workout to rank up`);
      }
    } else {
      s.done = false;
    }
  } else if (action === 'add-set') {
    const prevSet = entry.sets[entry.sets.length - 1];
    entry.sets.push({ w: prevSet ? prevSet.w : '', r: '', done: false });
  } else if (action === 'remove-set') {
    if (entry.sets.length > 1) entry.sets.pop();
  } else if (action === 'open-note') {
    entry.noteOpen = true;
    saveState();
    rerenderCard(ex.id, 'textarea');
    return;
  }
  saveState();
  rerenderCard(ex.id);
});

$('day-switch').addEventListener('click', e => {
  const b = e.target.closest('button[data-day]');
  if (!b || b.dataset.day === state.dayType) return;
  state.dayType = b.dataset.day;
  saveState();
  renderToday();
  window.scrollTo(0, 0);
});

$('rest-done-btn').addEventListener('click', () => {
  state.dayType = NEXT_DAY[state.dayType] || 'upper';
  saveState();
  renderToday();
});

$('finish-btn').addEventListener('click', finishWorkout);
$('discard-btn').addEventListener('click', async () => {
  if (!getDraft(state.dayType, false)) { showToast('Nothing to discard'); return; }
  if (!(await askConfirm('Discard everything entered for this workout?', 'Discard', true))) return;
  delete state.drafts[state.dayType];
  saveState();
  stopRest();
  renderToday();
  showToast('Workout discarded');
});

async function finishWorkout() {
  const type = state.dayType;
  const draft = getDraft(type, false);
  const ex = {};
  let summary = null;

  if (draft) {
    Object.entries(draft.ex).forEach(([id, e]) => {
      const sets = e.sets
        .filter(s => num(s.r) != null)
        .map(s => ({ w: num(s.w), r: Math.round(num(s.r)) }));
      const note = (e.note || '').trim();
      if (sets.length || note) ex[id] = { sets, note };
    });
  }

  if (!Object.values(ex).some(e => e.sets.length)) {
    if (!(await askConfirm(`No sets logged. Skip this ${dayLabel(type)} workout and move on to ${dayLabel(NEXT_DAY[type])}?`, 'Skip'))) return;
    delete state.drafts[type];
  } else {
    // PRs: best estimated 1RM beats every previous session
    const prs = [];
    Object.entries(ex).forEach(([id, e]) => {
      const def = EX_BY_ID[id];
      const prevBest = Math.max(0, ...historyFor(id).map(h => bestScore(h.entry, def)));
      if (prevBest > 0 && bestScore(e, def) > prevBest) prs.push(id);
    });
    const before = computeRanks(state.sessions);
    const levelBefore = levelInfo().lvl;
    const session = {
      id: uid(),
      date: localDate(),
      type,
      startedAt: draft.startedAt,
      finishedAt: new Date().toISOString(),
      ex,
      prs
    };
    state.sessions.push(session);
    const after = computeRanks(state.sessions);
    const changes = rankChanges(before, after);
    session.rankUps = changes.filter(c => c.kind === 'ex' && c.from > 0).length;
    delete state.drafts[type];
    summary = { session, before, after, changes, levelBefore };
  }

  state.dayType = NEXT_DAY[type];
  saveState();
  stopRest();
  renderToday();
  window.scrollTo(0, 0);
  if (summary) showSummary(summary);
}

function rankChanges(before, after) {
  const out = [];
  if (rankIndex(after.overall) > rankIndex(before.overall)) {
    out.push({ kind: 'overall', name: 'Overall', from: before.overall, to: after.overall });
  }
  MUSCLES.forEach(([m, label]) => {
    if (rankIndex(after.muscle[m]) > rankIndex(before.muscle[m])) {
      out.push({ kind: 'muscle', name: label, from: before.muscle[m] || 0, to: after.muscle[m] });
    }
  });
  Object.keys(after.ex).forEach(id => {
    if (rankIndex(after.ex[id]) > rankIndex(before.ex[id])) {
      out.push({ kind: 'ex', name: EX_BY_ID[id].name, from: before.ex[id] || 0, to: after.ex[id] });
    }
  });
  return out;
}

function showSummary({ session, before, after, changes, levelBefore }) {
  const lv = levelInfo();
  const xp = xpForSession(session);
  const overallUp = changes.find(c => c.kind === 'overall');
  // First-time lift ranks are summed up in one line; real rank-ups get a row each
  const ups = changes.filter(c => c.kind !== 'overall' && !(c.kind === 'ex' && !c.from));
  const firstRanked = changes.filter(c => c.kind === 'ex' && !c.from).length;
  const prs = session.prs.length;
  const title = overallUp ? 'Rank up!' : ups.length ? 'New ranks!' : 'Workout complete';
  $('rankup-body').innerHTML = `
    <div class="big-badge">${badgeSVG(after.overall, 84)}</div>
    <h2 id="rankup-title">${title}</h2>
    <div class="rank-sub">${overallUp
      ? `Overall: ${esc(rankName(overallUp.from))} → ${rankLabel(overallUp.to)}`
      : `Overall ${rankLabel(after.overall)} · ${after.overall} / 1000`}</div>
    <div class="xp-gain">+${xp} XP</div>
    <div class="rank-sub">Level ${lv.lvl}${lv.lvl > levelBefore ? ' — level up! ⬆️' : ''} · ${lv.into} / ${lv.span} XP</div>
    <div class="tier-bar"><span style="width:${Math.round(lv.into / lv.span * 100)}%;background:var(--warn)"></span></div>
    ${prs ? `<div class="rank-sub" style="margin-top:8px">🏆 ${prs} new PR${prs > 1 ? 's' : ''}</div>` : ''}
    <div style="margin-top:12px">
      ${ups.map(c => `
        <div class="change-row">
          ${badgeSVG(c.from, 26)}<span class="arrow">→</span>${badgeSVG(c.to, 30)}
          <div class="grow">
            <div style="font-weight:600">${esc(c.name)}</div>
            <div class="rank-sub">${c.from ? esc(rankName(c.from)) + ' → ' : 'New: '}${rankLabel(c.to)}</div>
          </div>
        </div>`).join('')}
      ${firstRanked ? `<div class="change-row"><div class="grow rank-sub">${firstRanked} lift${firstRanked > 1 ? 's' : ''} ranked for the first time — see the Ranks tab</div></div>` : ''}
    </div>`;
  $('rankup').classList.add('show');
  $('rankup-ok').focus();
}

$('rankup-ok').addEventListener('click', () => $('rankup').classList.remove('show'));
$('rankup').addEventListener('click', e => { if (e.target.id === 'rankup') $('rankup').classList.remove('show'); });

// ========== REST TIMER ==========
let restEnd = 0;
let restTick = null;

function startRest() {
  const sec = Number(state.settings.rest);
  if (!sec) return;
  restEnd = Date.now() + sec * 1000;
  $('timer').classList.add('show');
  clearInterval(restTick);
  restTick = setInterval(tickRest, 250);
  tickRest();
}

function tickRest() {
  const left = Math.ceil((restEnd - Date.now()) / 1000);
  if (left <= 0) {
    stopRest();
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    showToast('Rest over — next set 💪');
    return;
  }
  $('timer-time').textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
}

function stopRest() {
  clearInterval(restTick);
  restTick = null;
  $('timer').classList.remove('show');
}

$('timer').addEventListener('click', e => {
  const b = e.target.closest('button[data-timer]');
  if (!b) return;
  if (b.dataset.timer === 'stop') { stopRest(); return; }
  restEnd += Number(b.dataset.timer) * 1000;
  tickRest();
});

// ========== HISTORY ==========
let historyTab = 'workouts';
const openSessions = new Set();

$('history-tabs').addEventListener('click', e => {
  const b = e.target.closest('button[data-tab]');
  if (!b) return;
  historyTab = b.dataset.tab;
  renderHistory();
});

function renderHistory() {
  document.querySelectorAll('#history-tabs button').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === historyTab));
  const list = $('history-list');

  if (!state.sessions.length) {
    list.innerHTML = '<div class="empty">No workouts logged yet.<br>Finish a session and it will show up here.</div>';
    return;
  }

  if (historyTab === 'exercises') {
    list.innerHTML = WORKOUT_DAYS.map(type => `
      <div class="group-title">${dayLabel(type)}</div>
      <div class="card" style="padding:0 14px">
        ${PROGRAM[type].map(ex => {
          const h = historyFor(ex.id);
          const last = h[h.length - 1];
          return `
            <div class="ex-row" data-ex="${ex.id}">
              <div>
                <div>${esc(ex.name)}</div>
                <div class="sub">${last ? `${esc(fmtEntry(last.entry, ex))} · ${esc(shortDate(last.session.date))}` : 'Not logged yet'}</div>
              </div>
              <span class="chev">›</span>
            </div>`;
        }).join('')}
      </div>`).join('');
    return;
  }

  const sessions = sortedSessions().reverse();
  list.innerHTML = sessions.map(s => {
    const ids = Object.keys(s.ex || {});
    const setCount = ids.reduce((n, id) => n + (s.ex[id].sets ? s.ex[id].sets.length : 0), 0);
    const mins = s.startedAt && s.finishedAt ? Math.round((new Date(s.finishedAt) - new Date(s.startedAt)) / 60000) : null;
    const meta = [
      `${ids.length} exercise${ids.length === 1 ? '' : 's'}`,
      setCount ? `${setCount} sets` : null,
      mins != null && mins < 600 ? `${mins} min` : null,
      s.prs && s.prs.length ? `🏆 ${s.prs.length} PR${s.prs.length > 1 ? 's' : ''}` : null
    ].filter(Boolean).join(' · ');
    const open = openSessions.has(s.id);
    const order = PROGRAM[s.type] ? PROGRAM[s.type].map(e => e.id) : [];
    const sortedIds = ids.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return `
      <div class="card history-item" data-session="${s.id}">
        <div class="history-top">
          <div class="history-date">${esc(formatDate(s.date))}</div>
          <span class="tag ${esc(dayClass(s.type))}">${esc(dayLabel(s.type))}</span>
        </div>
        <div class="history-meta">${meta}</div>
        ${open ? `
          <div class="history-detail">
            ${sortedIds.map(id => {
              const def = EX_BY_ID[id] || { name: id };
              const e = s.ex[id];
              return `<div class="history-ex">
                <div class="name">${esc(def.name)}${s.prs && s.prs.includes(id) ? '<span class="pr">PR</span>' : ''}</div>
                <div class="sets">${esc(fmtEntry(e, def)) || '—'}</div>
                ${e.note ? `<div class="notes">${esc(e.note)}</div>` : ''}
              </div>`;
            }).join('')}
            <button class="btn btn-danger" data-delete="${s.id}" style="margin-top:10px;padding:10px">Delete this workout</button>
          </div>` : ''}
      </div>`;
  }).join('');
}

$('history-list').addEventListener('click', async e => {
  const del = e.target.closest('[data-delete]');
  if (del) {
    if (await askConfirm('Delete this workout from your history?', 'Delete', true)) {
      state.sessions = state.sessions.filter(s => s.id !== del.dataset.delete);
      saveState();
      renderHistory();
      showToast('Workout deleted');
    }
    return;
  }
  const row = e.target.closest('.ex-row');
  if (row) { openExercise(row.dataset.ex); return; }
  const item = e.target.closest('.history-item');
  if (item) {
    const id = item.dataset.session;
    openSessions.has(id) ? openSessions.delete(id) : openSessions.add(id);
    renderHistory();
  }
});

// ========== EXERCISE DETAIL SHEET ==========
function rankBannerHTML(ex) {
  const sc = computeRanks(state.sessions).ex[ex.id] || 0;
  const t = sc ? nextTarget(ex.id, sc, targetReps(ex)) : null;
  return `
    <div class="rank-banner">
      ${badgeSVG(sc, 44)}
      <div>
        <div class="t">${rankLabel(sc)}${sc ? ` · ${sc} / 1000` : ''}</div>
        <div class="s">${sc
          ? (t ? `Next: <b style="color:${t.rank.c1}">${t.rank.name}</b> at ${esc(t.text)}` : 'Top rank reached')
          : 'Log a set to get ranked'}</div>
      </div>
    </div>`;
}

function openExercise(exId) {
  const ex = EX_BY_ID[exId];
  const h = historyFor(exId);
  const scored = h.filter(x => x.entry.sets && x.entry.sets.length)
    .map(x => ({ date: x.session.date, v: bestScore(x.entry, ex), entry: x.entry }));

  let statsHTML = '';
  if (scored.length) {
    const best = scored.reduce((a, b) => (b.v > a.v ? b : a));
    const bestSet = best.entry.sets.reduce((a, b) => (score(b, ex) > score(a, ex) ? b : a));
    statsHTML = `
      <div class="stats">
        <div class="stat"><div class="k">Sessions</div><div class="v">${h.length}</div></div>
        <div class="stat"><div class="k">Best set</div><div class="v">${esc(fmtSet(bestSet, ex))}</div></div>
        <div class="stat"><div class="k">${ex.bodyweight ? 'Max reps' : 'Est. 1RM'}</div><div class="v">${Math.round(best.v)}${ex.bodyweight ? '' : ' ' + unit()}</div></div>
      </div>`;
  }

  const chartHTML = scored.length >= 2 ? `
    <div class="card chart-card">
      <div class="chart-title">${ex.bodyweight ? 'Best set reps' : `Estimated 1RM (${unit()})`} per session</div>
      <div class="chart-readout" id="chart-readout">Tap a point for details</div>
      <div class="chart" id="chart">${chartSVG(scored, ex)}</div>
    </div>` : '';

  const rows = h.slice().reverse().map(x => `
    <div class="history-ex" style="border-bottom:1px solid var(--card-border);padding:8px 0">
      <div class="name">${esc(formatDate(x.session.date))}${x.session.prs && x.session.prs.includes(exId) ? '<span class="pr">PR</span>' : ''}</div>
      <div class="sets">${esc(fmtEntry(x.entry, ex))}</div>
      ${x.entry.note ? `<div class="notes">${esc(x.entry.note)}</div>` : ''}
    </div>`).join('');

  $('sheet-body').innerHTML = `
    <div class="sheet-head">
      <div>
        <h2>${esc(ex.name)}</h2>
        <div class="targets">${ex.sets.map(s => `${esc(s.label)}: ${esc(s.target === 'failure' ? 'to failure' : s.target)}`).join(' · ')}</div>
      </div>
      <button class="icon-btn" id="sheet-close" aria-label="Close">✕</button>
    </div>
    ${rankBannerHTML(ex)}
    ${statsHTML}
    ${chartHTML}
    ${h.length ? `<div class="card" style="padding:4px 14px">${rows}</div>` : '<div class="empty">No history yet for this exercise.</div>'}`;
  $('sheet').classList.add('show');
  document.body.style.overflow = 'hidden';

  const chart = $('chart');
  if (chart) {
    chart.addEventListener('click', ev => {
      const p = ev.target.closest('[data-pt]');
      if (!p) return;
      const pt = scored[Number(p.dataset.pt)];
      chart.querySelectorAll('.pt').forEach(c => c.setAttribute('r', 5));
      chart.querySelector(`.pt[data-idx="${p.dataset.pt}"]`).setAttribute('r', 7);
      const bestSet = pt.entry.sets.reduce((a, b) => (score(b, ex) > score(a, ex) ? b : a));
      $('chart-readout').innerHTML = `<b>${esc(shortDate(pt.date))}</b> · ${esc(fmtSet(bestSet, ex))} → ${Math.round(pt.v)}${ex.bodyweight ? ' reps' : ' ' + unit()}`;
    });
  }
}

function chartSVG(points, ex) {
  const W = 320, H = 150, padL = 34, padR = 10, padT = 10, padB = 22;
  const vals = points.map(p => p.v);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (max - min < 1) { min -= 1; max += 1; }
  const span = max - min;
  min -= span * 0.1; max += span * 0.1;
  const x = i => padL + (points.length === 1 ? 0 : i * (W - padL - padR) / (points.length - 1));
  const y = v => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const gridVals = [min + (max - min) * 0.15, (min + max) / 2, max - (max - min) * 0.15];
  const grid = gridVals.map(v => `
    <line x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}" stroke="#334155" stroke-width="1"/>
    <text x="${padL - 6}" y="${y(v) + 3}" fill="#94a3b8" font-size="10" text-anchor="end">${Math.round(v)}</text>`).join('');
  const firstLbl = `<text x="${padL}" y="${H - 6}" fill="#94a3b8" font-size="10">${esc(shortDate(points[0].date))}</text>`;
  const lastLbl = `<text x="${W - padR}" y="${H - 6}" fill="#94a3b8" font-size="10" text-anchor="end">${esc(shortDate(points[points.length - 1].date))}</text>`;
  const dots = points.map((p, i) => `
    <g data-pt="${i}" style="cursor:pointer">
      <circle cx="${x(i)}" cy="${y(p.v)}" r="14" fill="transparent"/>
      <circle class="pt" data-idx="${i}" cx="${x(i)}" cy="${y(p.v)}" r="5" fill="#3b82f6" stroke="#0f172a" stroke-width="2"/>
    </g>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ex.name)} progress chart">
    ${grid}
    <polyline points="${line}" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}${firstLbl}${lastLbl}
  </svg>`;
}

function closeSheet() {
  $('sheet').classList.remove('show');
  document.body.style.overflow = '';
}

$('sheet').addEventListener('click', e => {
  if (e.target.id === 'sheet' || e.target.closest('#sheet-close')) closeSheet();
});

// ========== RANKS VIEW ==========
function renderRanks() {
  const R = computeRanks(state.sessions);
  const lv = levelInfo();
  const streak = weekStreak();
  const top = rankOf(R.overall);
  const nextR = RANKS[rankIndex(R.overall) + 1];

  const profileHTML = hasBodyweight() ? '' : `
    <div class="card">
      <div class="exercise-name">Set up your profile</div>
      <p class="rank-sub">Ranks compare your lifts to your bodyweight. Until you add it, ranks assume ${refBW()} ${unit()}.</p>
      <div class="profile-grid">
        <input class="text-input" id="rp-bw" inputmode="decimal" autocomplete="off" placeholder="Bodyweight (${unit()})" aria-label="Bodyweight">
        <div class="segmented" id="rp-sex">
          <button data-sex="male" class="plain ${state.settings.sex !== 'female' ? 'active' : ''}">Male</button>
          <button data-sex="female" class="plain ${state.settings.sex === 'female' ? 'active' : ''}">Female</button>
        </div>
      </div>
      <button class="btn btn-primary" id="rp-save">Save profile</button>
    </div>`;

  const hero = `
    <div class="card rank-hero">
      ${badgeSVG(R.overall, 92)}
      <div class="rank-hero-name" style="color:${top ? top.c1 : 'var(--muted)'}">${top ? top.name : 'Unranked'}</div>
      <div class="rank-sub">${R.overall
        ? `Overall ${R.overall} / 1000 · ${R.muscleCount} of ${MUSCLES.length} muscles ranked`
        : 'Finish a workout to get your first rank'}</div>
      ${R.overall ? tierBar(R.overall) : ''}
      ${R.overall ? `<div class="tier-next">${nextR ? `${nextR.min - R.overall} points to <b style="color:${nextR.c1}">${nextR.name}</b>` : 'Highest rank reached'}</div>` : ''}
    </div>
    <div class="stats">
      <div class="stat"><div class="k">Level</div><div class="v">${lv.lvl}</div>
        <div class="tier-bar" style="height:4px;margin-top:6px"><span style="width:${Math.round(lv.into / lv.span * 100)}%;background:var(--warn)"></span></div></div>
      <div class="stat"><div class="k">Total XP</div><div class="v">${lv.xp.toLocaleString()}</div></div>
      <div class="stat"><div class="k">Week streak</div><div class="v">${streak}${streak ? ' 🔥' : ''}</div></div>
    </div>`;

  const muscles = `
    <div class="group-title">Muscles</div>
    <div class="card" style="padding:4px 14px">
      ${MUSCLES.map(([m, label]) => {
        const sc = R.muscle[m] || 0;
        return `
          <div class="rank-row">
            ${badgeSVG(sc, 32)}
            <div class="grow">
              <div class="title">${label}</div>
              <div class="sub">${rankLabel(sc)}${sc ? ` · ${sc}` : ''}</div>
              ${sc ? tierBar(sc) : ''}
            </div>
          </div>`;
      }).join('')}
    </div>`;

  const lifts = WORKOUT_DAYS.map(type => `
    <div class="group-title">${dayLabel(type)} lifts</div>
    <div class="card" style="padding:4px 14px">
      ${PROGRAM[type].map(ex => {
        const sc = R.ex[ex.id] || 0;
        const t = sc ? nextTarget(ex.id, sc, targetReps(ex)) : null;
        return `
          <div class="rank-row" data-ex="${ex.id}">
            ${badgeSVG(sc, 32)}
            <div class="grow">
              <div class="title">${esc(ex.name)}</div>
              <div class="sub">${rankLabel(sc)}${sc ? ` · ${sc}` : ''}${t ? ` · Next: ${esc(t.text)}` : ''}</div>
            </div>
            <span class="chev">›</span>
          </div>`;
      }).join('')}
    </div>`).join('');

  const ladder = `
    <div class="group-title">How ranks work</div>
    <div class="card">
      <p class="rank-sub" style="line-height:1.5">
        Every set is turned into an estimated one-rep max and scored from 1 to 1000 against your
        bodyweight. Your best set sets each lift's rank. Muscle ranks average the lifts that train
        them, and your overall rank averages your muscles. Ranks never go down.
      </p>
      <div class="ladder">
        ${RANKS.map(r => `<div>${badgeSVG(r.min || 1, 30)}<b style="color:${r.c1}">${r.name}</b>${r.min || 1}+</div>`).join('')}
      </div>
      <p class="rank-sub" style="margin-top:10px">
        XP: 25 per workout, 10 per set, 50 per PR, 100 per lift rank-up.
      </p>
    </div>`;

  $('ranks-body').innerHTML = profileHTML + hero + muscles + lifts + ladder;
}

$('ranks-body').addEventListener('click', e => {
  const sexBtn = e.target.closest('#rp-sex button');
  if (sexBtn) {
    document.querySelectorAll('#rp-sex button').forEach(b => b.classList.toggle('active', b === sexBtn));
    return;
  }
  if (e.target.closest('#rp-save')) {
    const bw = num($('rp-bw').value);
    if (!(bw > 0)) { showToast('Enter your bodyweight', true); $('rp-bw').focus(); return; }
    const active = document.querySelector('#rp-sex button.active');
    state.settings.bw = bw;
    state.settings.sex = active ? active.dataset.sex : 'male';
    saveState();
    renderRanks();
    showToast('Profile saved ✓');
    return;
  }
  const row = e.target.closest('.rank-row[data-ex]');
  if (row) openExercise(row.dataset.ex);
});

// ========== SETTINGS ==========
function renderSettings() {
  document.querySelectorAll('#unit-switch button').forEach(b =>
    b.classList.toggle('active', b.dataset.unit === state.settings.unit));
  document.querySelectorAll('#rest-switch button').forEach(b =>
    b.classList.toggle('active', Number(b.dataset.rest) === Number(state.settings.rest)));
  document.querySelectorAll('#sex-switch button').forEach(b =>
    b.classList.toggle('active', b.dataset.sex === (state.settings.sex || 'male')));
  const bwInput = $('bw-input');
  bwInput.placeholder = `Bodyweight (${unit()})`;
  if (document.activeElement !== bwInput) bwInput.value = state.settings.bw || '';

  const n = state.sessions.length;
  const info = $('storage-info');
  info.textContent = `${n} workout${n === 1 ? '' : 's'} saved on this phone.`;
  if (navigator.storage && navigator.storage.persisted) {
    navigator.storage.persisted().then(p => {
      info.textContent += p
        ? ' Storage is protected from automatic cleanup.'
        : ' Tip: add this app to your Home Screen so your phone keeps the data.';
    }).catch(() => {});
  }
}

$('bw-input').addEventListener('input', e => {
  const bw = num(e.target.value);
  state.settings.bw = bw > 0 ? bw : null;
  saveState();
});

$('sex-switch').addEventListener('click', e => {
  const b = e.target.closest('button[data-sex]');
  if (!b) return;
  state.settings.sex = b.dataset.sex;
  saveState();
  renderSettings();
});

$('unit-switch').addEventListener('click', e => {
  const b = e.target.closest('button[data-unit]');
  if (!b) return;
  state.settings.unit = b.dataset.unit;
  saveState();
  renderSettings();
});

$('rest-switch').addEventListener('click', e => {
  const b = e.target.closest('button[data-rest]');
  if (!b) return;
  state.settings.rest = Number(b.dataset.rest);
  saveState();
  renderSettings();
});

$('export-btn').addEventListener('click', () => {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ul-tracker-backup-' + localDate() + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

$('import-btn').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  file.text().then(async text => {
    const data = JSON.parse(text);
    let next;
    if (data && data.version === 2) {
      next = normalize(data);
    } else if (data && Array.isArray(data.history)) {
      next = defaultState();
      migrateLegacy(data, next);
      next = normalize(next);
    } else {
      throw new Error('bad file');
    }
    if (!(await askConfirm(`Replace your current data with this backup (${next.sessions.length} workouts)?`, 'Replace', true))) return;
    state = next;
    saveState();
    renderSettings();
    renderToday();
    showToast('Backup restored ✓');
  }).catch(() => showToast('That file is not a UL Tracker backup', true));
});

$('clear-btn').addEventListener('click', async () => {
  if (!(await askConfirm('Delete ALL workouts and history? Export a backup first if you might want it. This cannot be undone.', 'Delete all', true))) return;
  const settings = state.settings;
  state = defaultState();
  state.settings = settings;
  saveState();
  renderSettings();
  showToast('All data cleared');
});

// ========== NAV / TOAST ==========
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $('view-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.view === name));
  if (name === 'history') renderHistory();
  if (name === 'settings') renderSettings();
  if (name === 'ranks') renderRanks();
  if (name === 'today') renderToday();
  window.scrollTo(0, 0);
}

document.querySelector('.bottom-nav').addEventListener('click', e => {
  const b = e.target.closest('.nav-item');
  if (b) showView(b.dataset.view);
});

let dialogResolve = null;
function askConfirm(message, okLabel, danger) {
  if (dialogResolve) dialogResolve(false);
  $('dialog-msg').textContent = message;
  const ok = $('dialog-ok');
  ok.textContent = okLabel || 'OK';
  ok.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');
  $('dialog').classList.add('show');
  ok.focus();
  return new Promise(resolve => { dialogResolve = resolve; });
}
function closeDialog(result) {
  $('dialog').classList.remove('show');
  if (dialogResolve) { dialogResolve(result); dialogResolve = null; }
}
$('dialog-ok').addEventListener('click', () => closeDialog(true));
$('dialog-cancel').addEventListener('click', () => closeDialog(false));
$('dialog').addEventListener('click', e => { if (e.target.id === 'dialog') closeDialog(false); });

let toastTimer = null;
function showToast(msg, isError) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.toggle('error', !!isError);
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

// Another tab/window changed the data → reload it
window.addEventListener('storage', e => {
  if (e.key !== STORE_KEY) return;
  loadState();
  renderToday();
});

// ========== INIT ==========
loadState();
renderToday();
requestPersistentStorage();
setInterval(updateElapsed, 30000);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
