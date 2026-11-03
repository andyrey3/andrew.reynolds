// Barback: tell it what's in your bar and it shows which cocktails you can make,
// with step-by-step instructions. Everything lives in localStorage on this device.

const KEY = 'barback-v1';
const GLASSES = ['coupe', 'martini', 'rocks', 'highball', 'collins', 'wine', 'flute', 'hurricane', 'irish', 'mug', 'julep'];
const GLASS_NAMES = { coupe: 'Coupe', martini: 'Martini glass', rocks: 'Rocks glass', highball: 'Highball', collins: 'Collins glass', wine: 'Wine glass', flute: 'Flute', hurricane: 'Hurricane glass', irish: 'Irish coffee glass', mug: 'Copper mug', julep: 'Julep cup' };
const METHODS = { shake: 'Shaken', stir: 'Stirred', build: 'Built in glass', muddle: 'Muddled', blend: 'Blended' };
const DILUTION = { shake: .25, stir: .2, build: .1, muddle: .15, blend: .35 };
const TAGS = ['refreshing', 'sour', 'sweet', 'bitter', 'strong', 'fruity', 'herbal', 'creamy', 'spicy', 'smoky', 'zero-proof'];
const UNITS = ['part', 'dash', 'leaf', 'piece', 'wedge', 'slice', 'tsp', 'barspoon', 'pinch', 'rinse', 'rim', 'top', 'garnish'];
const GARNISHES = ['none', 'lime', 'lemon', 'orange', 'cherry', 'olive', 'mint', 'berry', 'celery'];
const COLORS = ['#eef2c6', '#f3f1d9', '#e3efc8', '#f6d6cc', '#f9b23f', '#f2742b', '#e8607a', '#c0262c', '#8f3a1f', '#c57a30', '#e2a94a', '#3b2416', '#d9c3a5', '#cfcbe8', '#7a1d4a', '#a8d8a0'];
const SPIRIT_TILES = ['rum', 'vodka', 'tequila', 'brandy', 'whiskey', 'gin', 'other'];
const BASES = [['rum', 'Rum'], ['vodka', 'Vodka'], ['gin', 'Gin'], ['tequila', 'Tequila'], ['whiskey', 'Whiskey'], ['brandy', 'Brandy'], ['zero', 'Zero-proof']];

// If you don't have the exact ingredient, these stand in (when substitutes are on)
const SUBS = {
  simple_syrup: ['demerara_syrup', 'sugar'], demerara_syrup: ['simple_syrup', 'sugar'], sugar: ['simple_syrup', 'demerara_syrup'],
  lime_juice: ['lime'], lemon_juice: ['lemon'], orange_juice: ['orange'],
  champagne: ['prosecco'], prosecco: ['champagne'],
  white_rum: ['gold_rum'], gold_rum: ['white_rum', 'aged_rum'], aged_rum: ['gold_rum', 'dark_rum'], dark_rum: ['aged_rum'],
  bourbon: ['rye'], rye: ['bourbon'], citrus_vodka: ['vodka'], vodka: ['citrus_vodka'],
  blanco_tequila: ['reposado_tequila'], reposado_tequila: ['blanco_tequila'],
  ginger_beer: ['ginger_ale'], ginger_ale: ['ginger_beer'], scotch: ['irish_whiskey', 'japanese_whisky'],
  japanese_whisky: ['scotch', 'irish_whiskey'], irish_whiskey: ['scotch', 'japanese_whisky'], gin: ['old_tom_gin'],
  egg_white: [], lime: ['lime_juice'], lemon: ['lemon_juice'], orange: ['orange_juice']
};

// ---------- Helpers ----------
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const str = (v, max) => typeof v === 'string' ? v.slice(0, max) : '';
const HEX_RE = /^#[0-9a-f]{6}$/i;
const ING_ID_RE = /^[a-z0-9_]{1,30}$/;
const CUSTOM_ID_RE = /^u-[a-z0-9]{1,30}$/;

const INGREDIENTS = {};
for (const [id, name, tile, abv] of INGREDIENT_ROWS) INGREDIENTS[id] = { id, name, tile, abv };
const ingName = id => INGREDIENTS[id]?.name || id;

const ICON = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  heartFill: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>'
};

// ---------- State ----------
const S = {
  bar: new Set(), favs: new Set(), shop: [], made: {}, notes: {}, rating: {}, custom: [],
  units: 'oz', subs: true
};
const UI = {
  tab: 'cocktails', barSeg: 'ingredients', q: '', barQ: '', base: '', taste: '', readyOnly: false, sort: 'az',
  layers: [], servings: 1, shopQ: ''
};

function sanitizeCocktail(c) {
  if (!c || typeof c !== 'object' || !CUSTOM_ID_RE.test(c.id)) return null;
  const n = str(c.n, 60).trim();
  if (!n) return null;
  const i = (Array.isArray(c.i) ? c.i : []).slice(0, 20).map(r => {
    if (!Array.isArray(r) || !INGREDIENTS[r[0]]) return null;
    const amt = Number(r[1]);
    const unit = UNITS.includes(r[2]) ? r[2] : 'part';
    return [r[0], Number.isFinite(amt) && amt > 0 && amt <= 64 ? Math.round(amt * 1000) / 1000 : 1, unit, r[3] === true];
  }).filter(Boolean);
  if (!i.length) return null;
  return {
    id: c.id, n, d: str(c.d, 200), custom: true,
    g: GLASSES.includes(c.g) ? c.g : 'rocks',
    c: HEX_RE.test(c.c) ? c.c : '#e2a94a',
    gar: GARNISHES.includes(c.gar) ? c.gar : 'none',
    m: METHODS[c.m] ? c.m : 'build',
    t: (Array.isArray(c.t) ? c.t : []).filter(t => TAGS.includes(t)).slice(0, 6),
    i,
    s: (Array.isArray(c.s) ? c.s : []).map(x => str(x, 400).trim()).filter(Boolean).slice(0, 20)
  };
}

function applyData(d) {
  if (!d || typeof d !== 'object') return;
  const custom = (Array.isArray(d.custom) ? d.custom : []).slice(0, 200).map(sanitizeCocktail).filter(Boolean);
  const ids = new Set([...COCKTAILS.map(c => c.id), ...custom.map(c => c.id)]);
  S.custom = custom;
  S.bar = new Set((Array.isArray(d.bar) ? d.bar : []).filter(id => INGREDIENTS[id]));
  S.favs = new Set((Array.isArray(d.favs) ? d.favs : []).filter(id => ids.has(id)));
  const seen = new Set();
  S.shop = (Array.isArray(d.shop) ? d.shop : []).filter(x => x && INGREDIENTS[x.id] && !seen.has(x.id) && seen.add(x.id)).map(x => ({ id: x.id, done: x.done === true }));
  S.made = {}; S.notes = {}; S.rating = {};
  if (d.made && typeof d.made === 'object') for (const [k, v] of Object.entries(d.made)) {
    if (ids.has(k) && v && Number.isFinite(v.n) && v.n > 0) S.made[k] = { n: Math.min(9999, Math.floor(v.n)), last: Number.isFinite(v.last) ? v.last : 0 };
  }
  if (d.notes && typeof d.notes === 'object') for (const [k, v] of Object.entries(d.notes)) if (ids.has(k) && typeof v === 'string' && v.trim()) S.notes[k] = v.slice(0, 1000);
  if (d.rating && typeof d.rating === 'object') for (const [k, v] of Object.entries(d.rating)) if (ids.has(k) && [1, 2, 3, 4, 5].includes(v)) S.rating[k] = v;
  S.units = ['oz', 'ml', 'parts'].includes(d.units) ? d.units : 'oz';
  S.subs = d.subs !== false;
}

function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) applyData(JSON.parse(raw)); } catch { /* start fresh */ }
}
function exportData() {
  return { app: 'barback', v: 1, bar: [...S.bar], favs: [...S.favs], shop: S.shop, made: S.made, notes: S.notes, rating: S.rating, custom: S.custom.map(({ custom, ...c }) => c), units: S.units, subs: S.subs };
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(exportData())); } catch { toast('Could not save. Storage may be full.'); }
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- Cocktail logic ----------
const allCocktails = () => [...COCKTAILS, ...S.custom];
const byId = id => allCocktails().find(c => c.id === id);
const isOptional = r => r[3] === true || r[2] === 'garnish';
const required = c => c.i.filter(r => !isOptional(r));

// How you'd cover an ingredient: 'have', a substitute id, or null
function cover(id) {
  if (S.bar.has(id)) return { ok: true, via: id };
  if (S.subs) for (const s of SUBS[id] || []) if (S.bar.has(s)) return { ok: true, via: s };
  return { ok: false };
}
function missing(c) { return required(c).filter(r => !cover(r[0]).ok).map(r => r[0]); }
const canMake = c => missing(c).length === 0;

function baseOf(c) {
  if (c.t.includes('zero-proof')) return 'zero';
  let best = null, amt = 0;
  for (const [id, a, u] of c.i) {
    const ing = INGREDIENTS[id];
    if (ing && SPIRIT_TILES.includes(ing.tile) && (u || 'part') === 'part' && a > amt && ing.abv >= 35) { best = ing.tile; amt = a; }
  }
  return best === 'other' ? null : best;
}

function abv(c) {
  let alc = 0, vol = 0;
  for (const [id, a, u = 'part'] of c.i) {
    if (u !== 'part' && u !== 'top') continue;
    vol += a; alc += a * (INGREDIENTS[id]?.abv || 0) / 100;
  }
  if (!vol) return 0;
  return Math.round(alc / (vol * (1 + (DILUTION[c.m] || .15))) * 100);
}
const strength = p => p === 0 ? 'Alcohol-free' : p < 9 ? 'Light' : p < 18 ? 'Medium' : 'Strong';

const usedIn = id => allCocktails().filter(c => c.i.some(r => r[0] === id));

// ---------- Amount formatting ----------
const FRAC = [[0, ''], [.125, '⅛'], [.25, '¼'], [1 / 3, '⅓'], [.375, '⅜'], [.5, '½'], [.625, '⅝'], [2 / 3, '⅔'], [.75, '¾'], [.875, '⅞'], [1, '']];
function frac(x) {
  let whole = Math.floor(x), rest = x - whole, best = FRAC[0];
  for (const f of FRAC) if (Math.abs(f[0] - rest) < Math.abs(best[0] - rest)) best = f;
  if (best[0] === 1) { whole += 1; best = FRAC[0]; }
  return whole ? `${whole}${best[1]}` : (best[1] || '0');
}
const plural = (n, one, many) => n === 1 ? one : many;
function fmtAmount(r, mult = 1) {
  const [id, a0, unit = 'part'] = r;
  const a = a0 * mult;
  const n = Math.max(1, Math.round(a * 2) / 2);
  const cnt = Number.isInteger(n) ? n : frac(n);
  switch (unit) {
    case 'part': case 'top': {
      const pre = unit === 'top' ? 'top · ' : '';
      if (S.units === 'ml') return pre + Math.max(5, Math.round(a * 30 / 5) * 5) + ' ml';
      if (S.units === 'parts') return pre + frac(a) + ' ' + plural(a, 'part', 'parts');
      return pre + frac(a) + ' oz';
    }
    case 'dash': return `${cnt} ${plural(n, 'dash', 'dashes')}`;
    case 'leaf': return `${cnt} ${plural(n, 'leaf', 'leaves')}`;
    case 'piece': return id === 'egg_white' ? `${cnt}` : `${cnt} ${plural(n, 'piece', 'pieces')}`;
    case 'wedge': return `${cnt} ${plural(n, 'wedge', 'wedges')}`;
    case 'slice': return `${cnt} ${plural(n, 'slice', 'slices')}`;
    case 'tsp': return `${frac(a)} tsp`;
    case 'barspoon': return `${cnt} bar ${plural(n, 'spoon', 'spoons')}`;
    case 'pinch': return `${cnt} ${plural(n, 'pinch', 'pinches')}`;
    case 'rinse': return 'rinse';
    case 'rim': return 'for the rim';
    case 'garnish': return 'garnish';
    default: return frac(a);
  }
}
const chipLabel = (r, mult) => {
  const a = fmtAmount(r, mult);
  if (['garnish', 'rim', 'rinse'].includes(r[2])) return ingName(r[0]).toLowerCase();
  return `${a.replace(/^top · /, '')} ${ingName(r[0]).toLowerCase()}`;
};

// Turn "Add {gin} and {campari}" into text with ingredient chips
function renderStep(c, text, mult) {
  return text.split(/(\{[a-z0-9_]+\})/).map(part => {
    const m = part.match(/^\{([a-z0-9_]+)\}$/);
    if (!m) return esc(part);
    const r = c.i.find(x => x[0] === m[1]);
    if (!r) return esc(ingName(m[1]).toLowerCase());
    const cv = cover(r[0]);
    const cls = cv.ok ? (cv.via !== r[0] ? 'ichip sub' : 'ichip') : 'ichip miss';
    const title = cv.ok && cv.via !== r[0] ? ` title="Using ${esc(ingName(cv.via))}"` : '';
    return `<span class="${cls}"${title}>${esc(chipLabel(r, mult))}</span>`;
  }).join('');
}

// ---------- Glass illustrations ----------
const GLASS = {
  coupe: { bowl: 'M16 34 H84 Q82 66 50 68 Q18 66 16 34 Z', fill: 40, stem: 'M48 67 H52 V102 H48 Z', base: [50, 104, 20, 4], rim: [80, 34] },
  martini: { bowl: 'M12 28 H88 L50 70 Z', fill: 34, stem: 'M48 68 H52 V102 H48 Z', base: [50, 104, 20, 4], rim: [84, 28] },
  rocks: { bowl: 'M22 48 H78 L75 104 Q50 109 25 104 Z', fill: 58, ice: [[32, 62], [52, 68]], rim: [74, 48] },
  highball: { bowl: 'M30 18 H70 L67 106 Q50 110 33 106 Z', fill: 28, ice: [[36, 36], [50, 52], [38, 70]], rim: [68, 18] },
  collins: { bowl: 'M34 12 H66 L64 106 Q50 110 36 106 Z', fill: 22, ice: [[38, 30], [48, 50], [38, 72]], rim: [64, 12] },
  wine: { bowl: 'M28 20 Q24 62 50 68 Q76 62 72 20 Z', fill: 36, stem: 'M48 67 H52 V102 H48 Z', base: [50, 104, 18, 4], ice: [[36, 42]], rim: [72, 22] },
  flute: { bowl: 'M39 10 H61 L58 66 Q50 72 42 66 Z', fill: 18, stem: 'M48 70 H52 V102 H48 Z', base: [50, 104, 14, 4], bubbles: true, rim: [61, 10] },
  hurricane: { bowl: 'M33 12 Q26 40 38 58 Q30 78 41 92 H59 Q70 78 62 58 Q74 40 67 12 Z', fill: 20, stem: 'M47 92 H53 V102 H47 Z', base: [50, 104, 16, 4], rim: [66, 12] },
  irish: { bowl: 'M28 26 H72 L68 84 Q50 90 32 84 Z', fill: 30, stem: 'M48 87 H52 V102 H48 Z', base: [50, 104, 16, 4], handle: 'M71 38 Q86 40 84 56 Q82 70 69 70', rim: [70, 26] },
  mug: { bowl: 'M24 34 H72 L70 104 Q48 108 26 104 Z', fill: 38, metal: '#c47a45', handle: 'M71 46 Q90 48 88 66 Q86 86 70 86', rim: [68, 34] },
  julep: { bowl: 'M26 36 H74 L70 104 Q50 108 30 104 Z', fill: 40, metal: '#c3c7cd', rim: [70, 36] }
};
let svgId = 0;
function wheel(x, y, fill, stroke) {
  let s = `<circle cx="${x}" cy="${y}" r="10" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="6.5" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1"/>`;
  for (let a = 0; a < 6; a++) {
    const t = a * Math.PI / 3;
    s += `<line x1="${x}" y1="${y}" x2="${(x + Math.cos(t) * 7).toFixed(1)}" y2="${(y + Math.sin(t) * 7).toFixed(1)}" stroke="#fff" stroke-opacity=".7" stroke-width="1"/>`;
  }
  return s;
}
function garnishSVG(kind, [x, y]) {
  switch (kind) {
    case 'lime': return wheel(x, y, '#a6d36a', '#5e9a2e');
    case 'lemon': return wheel(x, y, '#f7e26b', '#cfae1c');
    case 'orange': return wheel(x, y, '#f9a33a', '#d6740f');
    case 'cherry': return `<path d="M${x - 4} ${y + 2} Q${x} ${y - 14} ${x + 8} ${y - 18}" fill="none" stroke="#5a7a2a" stroke-width="2"/><circle cx="${x - 4}" cy="${y + 4}" r="6.5" fill="#b3122e"/><circle cx="${x - 6}" cy="${y + 2}" r="1.8" fill="#fff" fill-opacity=".6"/>`;
    case 'olive': return `<line x1="${x + 8}" y1="${y - 16}" x2="${x - 22}" y2="${y + 22}" stroke="#8a6a3a" stroke-width="2"/><ellipse cx="${x - 9}" cy="${y + 6}" rx="7" ry="5.5" fill="#7d9a3a" transform="rotate(-50 ${x - 9} ${y + 6})"/><circle cx="${x - 9}" cy="${y + 6}" r="2" fill="#c0392b"/>`;
    case 'mint': return `<ellipse cx="${x - 6}" cy="${y - 8}" rx="5" ry="10" fill="#3f9d4f" transform="rotate(-25 ${x - 6} ${y - 8})"/><ellipse cx="${x + 4}" cy="${y - 10}" rx="5" ry="10" fill="#58b865" transform="rotate(20 ${x + 4} ${y - 10})"/><ellipse cx="${x - 1}" cy="${y - 16}" rx="4" ry="8" fill="#4caf5b"/>`;
    case 'berry': return `<circle cx="${x - 4}" cy="${y - 2}" r="5" fill="#5b1440"/><circle cx="${x + 3}" cy="${y - 4}" r="5" fill="#6d1a4f"/><circle cx="${x}" cy="${y - 9}" r="5" fill="#7c2059"/>`;
    case 'celery': return `<rect x="${x - 6}" y="${y - 22}" width="8" height="60" rx="4" fill="#9ccc65"/><path d="M${x - 2} ${y - 22} q-8 -10 -2 -16 q4 6 2 16" fill="#7cb342"/>`;
    default: return '';
  }
}
function glassSVG(c, cls = 'glass') {
  const g = GLASS[c.g] || GLASS.rocks;
  const id = 'g' + (++svgId);
  const top = HEX_RE.test(c.c) ? c.c : '#e2a94a';
  const bot = HEX_RE.test(c.c2 || '') ? c.c2 : top;
  let s = `<svg class="${cls}" viewBox="0 0 100 120" aria-hidden="true"><defs><clipPath id="${id}c"><path d="${g.bowl}"/></clipPath>`
    + `<linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="35%" stop-color="${top}"/><stop offset="100%" stop-color="${bot}"/></linearGradient></defs>`;
  if (g.handle) s += `<path d="${g.handle}" fill="none" stroke="${g.metal || 'var(--glass-stroke)'}" stroke-width="${g.metal ? 6 : 2.5}" stroke-linecap="round"/>`;
  if (g.metal) {
    s += `<path d="${g.bowl}" fill="${g.metal}"/>`
      + `<rect x="${parseInt(g.bowl.split(' ')[0].slice(1), 10) + 6}" y="${g.fill}" width="5" height="60" rx="2.5" fill="#fff" opacity=".35"/>`;
    if (c.g === 'julep') s += `<path d="M24 38 Q30 22 40 30 Q48 18 58 28 Q68 20 76 38 Z" fill="#eef4f6" stroke="var(--glass-stroke)" stroke-width="1.2"/>`;
  } else {
    s += `<g clip-path="url(#${id}c)"><rect x="0" y="${g.fill}" width="100" height="${120 - g.fill}" fill="url(#${id}l)"/>`;
    if (HEX_RE.test(c.top || '')) s += `<rect x="0" y="${g.fill}" width="100" height="7" fill="${c.top}"/>`;
    for (const [x, y] of g.ice || []) s += `<rect x="${x}" y="${y}" width="16" height="16" rx="3" fill="#fff" opacity=".32" transform="rotate(12 ${x + 8} ${y + 8})"/>`;
    if (g.bubbles) for (const [x, y, r] of [[46, 30, 1.6], [53, 40, 1.2], [48, 52, 1.4], [52, 24, 1]]) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".7"/>`;
    s += `<rect x="0" y="${g.fill}" width="100" height="1.5" fill="#fff" opacity=".45"/></g>`;
    s += `<path class="g-out" d="${g.bowl}"/>`;
  }
  if (g.stem) s += `<path class="g-solid" d="${g.stem}"/>`;
  if (g.base) s += `<ellipse class="g-out" cx="${g.base[0]}" cy="${g.base[1]}" rx="${g.base[2]}" ry="${g.base[3]}"/>`;
  s += garnishSVG(c.gar, g.rim);
  return s + '</svg>';
}
function tint(hex, amt = .78) {
  if (!HEX_RE.test(hex)) return '#eee';
  const n = parseInt(hex.slice(1), 16);
  const mix = v => Math.round(v + (255 - v) * amt);
  return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

// ---------- Shared components ----------
function card(c) {
  const miss = missing(c);
  const fav = S.favs.has(c.id);
  const badge = miss.length === 0 ? '<span class="badge ok">Ready</span>' : `<span class="badge">Missing ${miss.length}</span>`;
  return `<button class="card" data-open="${esc(c.id)}">
    <div class="thumb" style="background:${tint(c.c)}">${glassSVG(c)}${badge}
      ${fav ? `<span class="fav">${ICON.heartFill}</span>` : ''}</div>
    <b>${esc(c.n)}</b><small>${esc(cap(strength(abv(c))))} · ${esc(METHODS[c.m])}</small></button>`;
}
function cocktailRow(c, sub) {
  const miss = missing(c);
  const line = sub ?? (miss.length ? `Missing: ${miss.map(ingName).join(', ')}` : required(c).map(r => ingName(r[0])).join(', '));
  return `<button class="item" data-open="${esc(c.id)}">
    <span class="mini" style="background:${tint(c.c)}">${glassSVG(c)}</span>
    <span class="grow"><b>${esc(c.n)}${S.favs.has(c.id) ? ' <span style="color:var(--accent)">♥</span>' : ''}</b><small>${esc(line)}</small></span>${ICON.chev}</button>`;
}
function searchBox(id, val, ph) {
  return `<label class="search">${ICON.search}<input id="${id}" type="search" value="${esc(val)}" placeholder="${esc(ph)}" autocomplete="off"></label>`;
}

// ---------- Tabs ----------
function render() {
  document.querySelectorAll('nav.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === UI.tab));
  const shopBtn = document.querySelector('nav.tabs [data-tab="shop"]');
  const open = S.shop.filter(x => !x.done).length;
  shopBtn.querySelector('.dot')?.remove();
  if (open) shopBtn.insertAdjacentHTML('beforeend', `<span class="dot">${open}</span>`);
  const main = $('#main');
  const html = { cocktails: viewCocktails, bar: viewBar, shop: viewShop, saved: viewSaved }[UI.tab]();
  main.innerHTML = `<div class="wrap">${html}</div>`;
}

function filteredCocktails() {
  const q = UI.q.trim().toLowerCase();
  let list = allCocktails().filter(c => {
    if (UI.base && baseOf(c) !== UI.base) return false;
    if (UI.taste && !c.t.includes(UI.taste)) return false;
    if (UI.readyOnly && !canMake(c)) return false;
    if (!q) return true;
    return c.n.toLowerCase().includes(q) || c.i.some(r => ingName(r[0]).toLowerCase().includes(q)) || c.t.some(t => t.includes(q));
  });
  const name = (a, b) => a.n.localeCompare(b.n);
  if (UI.sort === 'ready') list.sort((a, b) => missing(a).length - missing(b).length || name(a, b));
  else if (UI.sort === 'strong') list.sort((a, b) => abv(b) - abv(a) || name(a, b));
  else if (UI.sort === 'light') list.sort((a, b) => abv(a) - abv(b) || name(a, b));
  else list.sort(name);
  return list;
}

function viewCocktails() {
  const list = filteredCocktails();
  const ready = allCocktails().filter(canMake).length;
  const chip = (attr, val, cur, label) => `<button class="chip${cur === val ? ' on' : ''}" ${attr}="${esc(val)}">${esc(label)}</button>`;
  return `<div class="head"><div><h1>Cocktails</h1><p class="muted small">${allCocktails().length} recipes · ${ready} ready to mix</p></div>
      <button class="icon-btn" data-act="settings" aria-label="Settings">${ICON.gear}</button></div>
    ${searchBox('q', UI.q, 'Search cocktails or ingredients')}
    <div class="chips">
      <button class="chip${UI.readyOnly ? ' on' : ''}" data-act="ready">✓ Ready to mix</button>
      ${chip('data-base', '', UI.base, 'All spirits')}${BASES.map(([v, l]) => chip('data-base', v, UI.base, l)).join('')}
    </div>
    <div class="chips">
      ${chip('data-taste', '', UI.taste, 'Any taste')}${TAGS.filter(t => t !== 'zero-proof').map(t => chip('data-taste', t, UI.taste, cap(t))).join('')}
    </div>
    <div class="section-title"><span class="muted small">${list.length} ${plural(list.length, 'cocktail', 'cocktails')}</span>
      <div class="pill-seg">${[['az', 'A–Z'], ['ready', 'Ready'], ['strong', 'Strong'], ['light', 'Light']].map(([v, l]) => `<button class="${UI.sort === v ? 'on' : ''}" data-sort="${v}">${l}</button>`).join('')}</div></div>
    ${list.length ? `<div class="grid">${list.map(card).join('')}</div>`
      : `<div class="empty"><div class="big">🍸</div><p>No cocktails match.${UI.readyOnly ? ' Add more ingredients in My Bar to unlock more.' : ''}</p></div>`}`;
}

function viewBar() {
  const ready = allCocktails().filter(canMake);
  const seg = `<div class="seg">
      <button class="${UI.barSeg === 'ingredients' ? 'on' : ''}" data-seg="ingredients">Ingredients <span class="count">${S.bar.size}</span></button>
      <button class="${UI.barSeg === 'cocktails' ? 'on' : ''}" data-seg="cocktails">Cocktails <span class="count">${ready.length}</span></button></div>`;
  return `<div class="head"><h1>My Bar</h1></div>${seg}${UI.barSeg === 'ingredients' ? barIngredients() : barCocktails(ready)}`;
}

function ingRow(id, extra = '') {
  const on = S.bar.has(id);
  const n = usedIn(id).length;
  return `<div class="item"><button class="check${on ? ' on' : ''}" data-toggle="${id}" aria-label="${on ? 'Remove' : 'Add'} ${esc(ingName(id))}">${ICON.check}</button>
    <button class="grow" data-ing="${id}"><b>${esc(ingName(id))}</b><small>${extra || `In ${n} ${plural(n, 'cocktail', 'cocktails')}`}</small></button>
    <button data-ing="${id}" aria-label="Details">${ICON.chev}</button></div>`;
}

function barIngredients() {
  const q = UI.barQ.trim().toLowerCase();
  let out = searchBox('barQ', UI.barQ, 'Search ingredients');
  if (q) {
    const hits = INGREDIENT_ROWS.filter(r => r[1].toLowerCase().includes(q)).map(r => r[0]);
    return out + (hits.length ? `<div class="list">${hits.map(id => ingRow(id, TILES[INGREDIENTS[id].tile].name)).join('')}</div>` : '<div class="empty">No ingredients found.</div>');
  }
  if (!S.bar.size) {
    out += `<div class="panel"><h3>Your bar is empty</h3><p class="muted small" style="margin:4px 0 12px">Tap a shelf below to tick off what you have, or start with a basic home bar and adjust from there.</p>
      <button class="btn sm" data-act="starter">Add the basics (${STARTER.length})</button></div>`;
  }
  for (const sec of SECTIONS) {
    out += `<div class="section-title"><h3>${esc(sec.name)}</h3></div><div class="tiles">`;
    for (const t of sec.tiles) {
      const n = INGREDIENT_ROWS.filter(r => r[2] === t && S.bar.has(r[0])).length;
      out += `<button class="tile" data-tile="${t}"><span class="ico" style="background:${TILES[t].hue}">${TILES[t].icon}</span><span>${esc(TILES[t].name)}</span>${n ? `<span class="n">${n}</span>` : ''}</button>`;
    }
    out += '</div>';
  }
  return out;
}

function barCocktails(ready) {
  const one = [], two = [];
  for (const c of allCocktails()) {
    const m = missing(c);
    if (m.length === 1) one.push(c); else if (m.length === 2) two.push(c);
  }
  const by = (a, b) => a.n.localeCompare(b.n);
  let out = '';
  out += `<div class="section-title"><h3>Ready to mix</h3><span class="muted small">${ready.length}</span></div>`;
  out += ready.length ? `<div class="list">${ready.sort(by).map(c => cocktailRow(c)).join('')}</div>`
    : `<div class="empty"><div class="big">🧊</div><p>Nothing yet. Add ingredients to see what you can make.</p></div>`;
  if (one.length) {
    out += `<div class="section-title"><h3>One ingredient away</h3><span class="muted small">${one.length}</span></div><div class="list">`;
    out += one.sort(by).map(c => {
      const m = missing(c)[0];
      return `<div class="item"><button class="mini" data-open="${c.id}" style="background:${tint(c.c)}">${glassSVG(c)}</button>
        <button class="grow" data-open="${c.id}"><b>${esc(c.n)}</b><small>Need ${esc(ingName(m))}</small></button>
        <button class="add-mini" data-toggle="${m}">I have it</button></div>`;
    }).join('') + '</div>';
  }
  if (two.length) out += `<div class="section-title"><h3>Two ingredients away</h3><span class="muted small">${two.length}</span></div><div class="list">${two.sort(by).map(c => cocktailRow(c)).join('')}</div>`;
  return out;
}

// Which missing ingredient would unlock the most cocktails?
function smartPicks() {
  const score = {};
  for (const c of allCocktails()) {
    const m = missing(c);
    if (m.length === 1) (score[m[0]] ||= { unlock: [], near: 0 }).unlock.push(c);
    else if (m.length === 2) m.forEach(id => { (score[id] ||= { unlock: [], near: 0 }).near++; });
  }
  return Object.entries(score).map(([id, v]) => ({ id, ...v }))
    .filter(x => x.unlock.length || x.near)
    .sort((a, b) => b.unlock.length - a.unlock.length || b.near - a.near || ingName(a.id).localeCompare(ingName(b.id)))
    .slice(0, 8);
}

function viewShop() {
  const picks = smartPicks();
  const open = S.shop.filter(x => !x.done), done = S.shop.filter(x => x.done);
  const q = UI.shopQ.trim().toLowerCase();
  let out = `<div class="head"><div><h1>Shopping</h1><p class="muted small">What to buy next for the most new drinks</p></div></div>`;
  out += `<div class="section-title"><h3>Smart picks</h3></div>`;
  if (picks.length) {
    out += '<div class="list">' + picks.map(p => {
      const onList = S.shop.some(x => x.id === p.id);
      const sub = p.unlock.length ? `Unlocks ${p.unlock.length}: ${p.unlock.slice(0, 3).map(c => c.n).join(', ')}${p.unlock.length > 3 ? '…' : ''}` : `Gets you closer to ${p.near} more`;
      return `<div class="item"><span class="mini" style="background:${TILES[INGREDIENTS[p.id].tile].hue};font-size:1.4rem">${TILES[INGREDIENTS[p.id].tile].icon}</span>
        <button class="grow" data-ing="${p.id}"><b>${esc(ingName(p.id))}</b><small>${esc(sub)}</small></button>
        ${onList ? '<span class="tag">On list</span>' : `<button class="add-mini" data-addshop="${p.id}">+ List</button>`}</div>`;
    }).join('') + '</div>';
  } else {
    out += `<div class="panel muted small">${S.bar.size ? 'You can already make nearly everything. Nice bar!' : 'Add a few ingredients in My Bar and we\'ll suggest what to buy next.'}</div>`;
  }
  out += `<div class="section-title"><h3>Shopping list</h3>${done.length ? `<button class="btn sm ghost" data-act="stock">Move ${done.length} to My Bar</button>` : ''}</div>`;
  out += searchBox('shopQ', UI.shopQ, 'Add an ingredient to your list');
  if (q) {
    const hits = INGREDIENT_ROWS.filter(r => r[1].toLowerCase().includes(q) && !S.shop.some(x => x.id === r[0])).slice(0, 8);
    out += hits.length ? `<div class="list">${hits.map(r => `<button class="item" data-addshop="${r[0]}"><span class="grow"><b>${esc(r[1])}</b><small>${S.bar.has(r[0]) ? 'Already in your bar' : esc(TILES[r[2]].name)}</small></span><span class="add-mini">+ Add</span></button>`).join('')}</div>` : '<p class="muted small" style="margin-bottom:12px">No matches.</p>';
  }
  if (!S.shop.length) out += `<div class="empty"><div class="big">🛒</div><p>Your list is empty. Add missing ingredients from any cocktail or from the picks above.</p></div>`;
  else {
    const row = x => `<div class="item"><button class="check${x.done ? ' on' : ''}" data-shopdone="${x.id}" aria-label="Got it">${ICON.check}</button>
      <button class="grow" data-ing="${x.id}"><b style="${x.done ? 'text-decoration:line-through;color:var(--muted)' : ''}">${esc(ingName(x.id))}</b><small>${esc(TILES[INGREDIENTS[x.id].tile].name)}</small></button>
      <button class="icon-btn" data-shopdel="${x.id}" aria-label="Remove">${ICON.close}</button></div>`;
    out += `<div class="list">${[...open, ...done].map(row).join('')}</div>`;
  }
  return out;
}

function viewSaved() {
  const favs = allCocktails().filter(c => S.favs.has(c.id)).sort((a, b) => a.n.localeCompare(b.n));
  const made = Object.entries(S.made).map(([id, v]) => ({ c: byId(id), ...v })).filter(x => x.c).sort((a, b) => b.last - a.last).slice(0, 10);
  let out = `<div class="head"><div><h1>Saved</h1><p class="muted small">Favorites, your own recipes and history</p></div></div>`;
  out += `<div class="section-title"><h3>Favorites</h3><span class="muted small">${favs.length}</span></div>`;
  out += favs.length ? `<div class="grid">${favs.map(card).join('')}</div>` : `<div class="panel muted small">Tap the heart on any cocktail to save it here.</div>`;
  out += `<div class="section-title"><h3>My recipes</h3><button class="btn sm" data-act="new">${ICON.plus} New</button></div>`;
  out += S.custom.length ? `<div class="list">${S.custom.map(c => cocktailRow(c)).join('')}</div>` : `<div class="panel muted small">Create your own cocktails. They work with My Bar just like the built-in ones.</div>`;
  if (made.length) {
    out += `<div class="section-title"><h3>Recently made</h3></div><div class="list">`;
    out += made.map(x => cocktailRow(x.c, `Made ${x.n}× · last ${new Date(x.last).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`)).join('') + '</div>';
  }
  return out;
}

// ---------- Layers (full-screen pages) ----------
function openLayer(layer) {
  UI.layers.push(layer);
  history.pushState({ depth: UI.layers.length }, '');
  renderLayers(true);
}
function closeLayer() { history.back(); }
window.addEventListener('popstate', () => {
  const depth = history.state?.depth || 0;
  if (UI.layers.length > depth) {
    UI.layers.length = depth;
    renderLayers();
    render();
  }
});
function renderLayers(fresh) {
  const root = $('#layers');
  const top = UI.layers[UI.layers.length - 1];
  if (!top) { root.innerHTML = ''; return; }
  const prev = root.firstElementChild;
  const keepScroll = !fresh && prev ? prev.scrollTop : 0;
  const body = { cocktail: layerCocktail, tile: layerTile, ing: layerIngredient, mix: layerMix, editor: layerEditor, settings: layerSettings }[top.type](top);
  root.innerHTML = `<div class="layer"${fresh ? '' : ' style="animation:none"'}>${body}</div>`;
  root.firstElementChild.scrollTop = keepScroll;
}
const topbar = (title, right = '<span class="sp"></span>') => `<div class="topbar"><button class="icon-btn" data-act="back" aria-label="Back">${ICON.back}</button><h2>${esc(title)}</h2>${right}</div>`;
const refresh = () => { renderLayers(); render(); };

function layerCocktail({ id }) {
  const c = byId(id);
  if (!c) return topbar('Not found') + '<div class="empty">This cocktail no longer exists.</div>';
  const mult = UI.servings;
  const miss = missing(c);
  const p = abv(c);
  const fav = S.favs.has(c.id);
  const made = S.made[c.id];
  const status = miss.length === 0
    ? `<div class="status ok"><span style="font-size:1.4rem">✓</span><div class="grow"><b>You can make this</b>Everything you need is in your bar.</div></div>`
    : `<div class="status no"><span style="font-size:1.4rem">!</span><div class="grow"><b>Missing ${miss.length}</b>${esc(miss.map(ingName).join(', '))}</div>
        <button class="btn sm" data-act="shopmissing">+ List</button></div>`;
  const ings = c.i.map(r => {
    const cv = cover(r[0]);
    const opt = isOptional(r);
    const note = cv.ok && cv.via !== r[0] ? `Using ${ingName(cv.via)} instead` : opt ? 'Optional' : !cv.ok ? 'Not in your bar' : '';
    return `<div class="ing"><button class="check${S.bar.has(r[0]) ? ' on' : ''}" data-toggle="${r[0]}" aria-label="Toggle ${esc(ingName(r[0]))} in my bar">${ICON.check}</button>
      <span class="amt">${esc(fmtAmount(r, mult))}</span>
      <button class="grow" data-ing="${r[0]}"><span>${esc(ingName(r[0]))}</span>${note ? `<small>${esc(note)}</small>` : ''}</button></div>`;
  }).join('');
  const steps = c.s.length ? c.s.map((s, k) => `<div class="step"><div class="k">Step #${k + 1}/${c.s.length}</div><p>${renderStep(c, s, mult)}</p></div>`).join('')
    : '<div class="panel muted small">No steps written yet.</div>';
  const similar = allCocktails().filter(x => x.id !== c.id).map(x => {
    const a = new Set(required(c).map(r => r[0]));
    return { x, n: required(x).filter(r => a.has(r[0])).length + (x.g === c.g ? .5 : 0) + (baseOf(x) === baseOf(c) ? 1 : 0) };
  }).filter(o => o.n >= 2).sort((a, b) => b.n - a.n).slice(0, 4).map(o => o.x);
  const rating = S.rating[c.id] || 0;
  return `<div class="hero" style="background:${tint(c.c, .7)}">
      <div class="tl"><button class="icon-btn" data-act="back" aria-label="Back">${ICON.back}</button></div>
      <div class="tr"><button class="icon-btn" data-act="share" aria-label="Share">${ICON.share}</button>
        <button class="icon-btn${fav ? ' on' : ''}" data-act="fav" aria-label="${fav ? 'Remove from' : 'Add to'} favorites">${fav ? ICON.heartFill : ICON.heart}</button></div>
      ${glassSVG(c)}</div>
    <div class="detail-body">
      <h1>${esc(c.n)}</h1>
      ${c.d ? `<p class="muted" style="margin-top:6px">${esc(c.d)}</p>` : ''}
      <div class="meta"><span>🍸 <b>${esc(GLASS_NAMES[c.g])}</b></span><span>🥄 <b>${esc(METHODS[c.m])}</b></span><span>🔥 <b>${p ? `~${p}% ABV` : '0%'}</b> · ${esc(strength(p))}</span>${made ? `<span>✓ Made <b>${made.n}×</b></span>` : ''}</div>
      ${c.t.length ? `<div class="chips wrapped">${c.t.map(t => `<span class="tag">${esc(cap(t))}</span>`).join('')}</div>` : ''}
      ${status}
      <div class="panel">
        <div class="ing-head"><h2>Ingredients</h2>
          <div class="row" style="flex:none;gap:8px;align-items:center">
            <div class="stepper"><button data-serv="-1" aria-label="Fewer">−</button><span>${mult} ${plural(mult, 'drink', 'drinks')}</span><button data-serv="1" aria-label="More">+</button></div>
          </div></div>
        <div class="pill-seg" style="margin-bottom:6px">${['oz', 'ml', 'parts'].map(u => `<button class="${S.units === u ? 'on' : ''}" data-units="${u}">${u}</button>`).join('')}</div>
        ${ings}
      </div>
      <div class="section-title"><h2>How to mix</h2></div>
      ${steps}
      ${c.s.length ? `<button class="btn" data-act="mix" style="margin:14px 0 6px">Start step-by-step</button>` : ''}
      <div class="panel" style="margin-top:16px">
        <div class="ing-head"><h3>Your notes</h3><div class="stars">${[1, 2, 3, 4, 5].map(n => `<button class="${n <= rating ? 'on' : ''}" data-rate="${n}" aria-label="${n} stars">★</button>`).join('')}</div></div>
        <textarea class="note" id="note" placeholder="Tweaks, brands you liked, who loved it…" maxlength="1000">${esc(S.notes[c.id] || '')}</textarea>
        <button class="btn ghost" data-act="made" style="margin-top:10px">✓ I made this${made ? ` (${made.n})` : ''}</button>
      </div>
      ${c.custom ? `<div class="row" style="margin-top:6px"><button class="btn ghost" data-act="edit">${ICON.edit} Edit</button><button class="btn danger" data-act="delete">${ICON.trash} Delete</button></div>` : ''}
      ${similar.length ? `<div class="section-title"><h2>You might also like</h2></div><div class="list">${similar.map(x => cocktailRow(x)).join('')}</div>` : ''}
    </div>`;
}

function layerTile({ tile }) {
  const rows = INGREDIENT_ROWS.filter(r => r[2] === tile);
  const n = rows.filter(r => S.bar.has(r[0])).length;
  return topbar(TILES[tile].name) + `<div class="lwrap">
    <div class="section-title" style="margin-top:4px"><span class="muted small">${n} of ${rows.length} in your bar</span>
      <button class="btn sm ghost" data-tileall="${tile}">${n === rows.length ? 'Clear all' : 'Select all'}</button></div>
    <div class="list">${rows.map(r => ingRow(r[0])).join('')}</div></div>`;
}

function layerIngredient({ id }) {
  const ing = INGREDIENTS[id];
  const uses = usedIn(id).sort((a, b) => a.n.localeCompare(b.n));
  const onShop = S.shop.some(x => x.id === id);
  const subs = (SUBS[id] || []).map(ingName);
  const unlock = uses.filter(c => { const m = missing(c); return m.length === 1 && m[0] === id; });
  return topbar(ing.name) + `<div class="lwrap">
    <div class="panel" style="display:flex;gap:14px;align-items:center">
      <span class="mini" style="width:60px;height:60px;border-radius:16px;display:grid;place-items:center;font-size:2rem;background:${TILES[ing.tile].hue}">${TILES[ing.tile].icon}</span>
      <div style="flex:1"><h2>${esc(ing.name)}</h2><p class="muted small">${esc(TILES[ing.tile].name)}${ing.abv ? ` · ${ing.abv}% ABV` : ''}</p></div></div>
    <div class="row" style="margin-bottom:14px">
      <button class="btn ${S.bar.has(id) ? 'green' : ''}" data-toggle="${id}">${S.bar.has(id) ? '✓ In my bar' : '+ Add to my bar'}</button>
      <button class="btn ghost" data-${onShop ? 'shopdel' : 'addshop'}="${id}">${onShop ? 'Remove from list' : '+ Shopping list'}</button></div>
    ${!S.bar.has(id) && unlock.length ? `<div class="status no"><div class="grow"><b>Unlocks ${unlock.length} ${plural(unlock.length, 'cocktail', 'cocktails')}</b>${esc(unlock.map(c => c.n).join(', '))}</div></div>` : ''}
    ${subs.length ? `<p class="muted small" style="margin-bottom:14px">Can stand in for or be replaced by: ${esc(subs.join(', '))}</p>` : ''}
    <div class="section-title"><h3>Used in ${uses.length} ${plural(uses.length, 'cocktail', 'cocktails')}</h3></div>
    ${uses.length ? `<div class="list">${uses.map(c => cocktailRow(c)).join('')}</div>` : '<div class="panel muted small">Not used in any recipes yet.</div>'}
  </div>`;
}

function layerMix({ id, k }) {
  const c = byId(id);
  if (!c) return topbar('Not found');
  const n = c.s.length;
  const text = c.s[k];
  const refs = [...text.matchAll(/\{([a-z0-9_]+)\}/g)].map(m => c.i.find(r => r[0] === m[1])).filter(Boolean);
  const last = k === n - 1;
  return `<div class="mixmode">${topbar(c.n)}<div class="lwrap mixmode" style="flex:1;width:100%">
    <div class="progress"><div style="width:${((k + 1) / n) * 100}%"></div></div>
    <p class="muted" style="font-weight:700;margin-bottom:10px">Step ${k + 1} of ${n}</p>
    <p class="big">${renderStep(c, text, UI.servings)}</p>
    ${refs.length ? `<div class="list" style="margin-top:22px">${refs.map(r => `<div class="item"><span class="amt" style="min-width:86px;font-weight:700">${esc(fmtAmount(r, UI.servings))}</span><span class="grow">${esc(ingName(r[0]))}</span>${cover(r[0]).ok ? '' : '<span class="tag miss">Missing</span>'}</div>`).join('')}</div>` : ''}
    <div class="foot"><div class="row">
      <button class="btn ghost" data-mix="-1" ${k === 0 ? 'disabled style="opacity:.4"' : ''}>Back</button>
      <button class="btn${last ? ' green' : ''}" data-mix="1">${last ? '✓ Done – I made it' : 'Next step'}</button></div></div>
  </div></div>`;
}

function layerSettings() {
  return topbar('Settings') + `<div class="lwrap">
    <div class="panel">
      <div class="setting"><div><b>Units</b><p class="muted small">How amounts are shown</p></div>
        <div class="pill-seg">${['oz', 'ml', 'parts'].map(u => `<button class="${S.units === u ? 'on' : ''}" data-units="${u}">${u}</button>`).join('')}</div></div>
      <div class="setting"><div><b>Allow substitutes</b><p class="muted small">E.g. count lemons for lemon juice, prosecco for champagne</p></div>
        <button class="switch${S.subs ? ' on' : ''}" data-act="subs" aria-label="Allow substitutes" aria-pressed="${S.subs}"></button></div>
    </div>
    <div class="panel">
      <h3>Backup</h3><p class="muted small" style="margin:4px 0 12px">Your bar, favorites and recipes are stored only on this device.</p>
      <div class="row"><button class="btn ghost" data-act="export">Export</button><button class="btn ghost" data-act="import">Import</button></div>
    </div>
    <div class="panel">
      <h3>Start over</h3><p class="muted small" style="margin:4px 0 12px">Clears your bar, favorites, shopping list and your own recipes.</p>
      <button class="btn danger" data-act="reset">Reset everything</button>
    </div>
    <p class="muted small" style="text-align:center;margin-top:20px">Barback · ${COCKTAILS.length} built-in recipes · Please drink responsibly.</p>
  </div>`;
}

// ---------- Editor ----------
function blankDraft() { return { id: '', n: '', d: '', g: 'rocks', c: '#e2a94a', gar: 'none', m: 'shake', t: [], i: [['', 1, 'part', false]], s: '' }; }
function draftFrom(c) {
  const steps = c.s.map(s => s.replace(/\{([a-z0-9_]+)\}/g, (_, id) => ingName(id).toLowerCase())).join('\n');
  return { id: c.id, n: c.n, d: c.d, g: c.g, c: c.c, gar: c.gar, m: c.m, t: [...c.t], i: c.i.map(r => [r[0], r[1], r[2] || 'part', r[3] === true]), s: steps };
}
const ingOptions = sel => SECTIONS.flatMap(s => s.tiles).map(t => `<optgroup label="${esc(TILES[t].name)}">${INGREDIENT_ROWS.filter(r => r[2] === t).map(r => `<option value="${r[0]}"${r[0] === sel ? ' selected' : ''}>${esc(r[1])}</option>`).join('')}</optgroup>`).join('');

function layerEditor({ draft }) {
  const preview = { ...draft, c2: null, top: null };
  return topbar(draft.id ? 'Edit cocktail' : 'New cocktail', `<button class="btn sm" data-act="saveedit">Save</button>`) + `<div class="lwrap">
    <div style="display:grid;place-items:center;height:150px;border-radius:20px;margin-bottom:16px;background:${tint(draft.c, .7)}">${glassSVG(preview).replace('class="glass"', 'class="glass" style="height:130px;width:110px"')}</div>
    <label class="field"><span>Name</span><input id="e-n" value="${esc(draft.n)}" maxlength="60" placeholder="My signature sour"></label>
    <label class="field"><span>Short description</span><input id="e-d" value="${esc(draft.d)}" maxlength="200" placeholder="What makes it good?"></label>
    <div class="row">
      <label class="field"><span>Glass</span><select id="e-g">${GLASSES.map(g => `<option value="${g}"${g === draft.g ? ' selected' : ''}>${esc(GLASS_NAMES[g])}</option>`).join('')}</select></label>
      <label class="field"><span>Method</span><select id="e-m">${Object.entries(METHODS).map(([k, v]) => `<option value="${k}"${k === draft.m ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
    </div>
    <label class="field"><span>Garnish</span><select id="e-gar">${GARNISHES.map(g => `<option value="${g}"${g === draft.gar ? ' selected' : ''}>${esc(cap(g))}</option>`).join('')}</select></label>
    <div class="field"><span>Color</span><div class="colors">${COLORS.map(col => `<button style="background:${col}" class="${col === draft.c ? 'on' : ''}" data-color="${col}" aria-label="Color ${col}"></button>`).join('')}</div></div>
    <div class="field"><span>Taste</span><div class="chips wrapped">${TAGS.map(t => `<button class="chip${draft.t.includes(t) ? ' on' : ''}" data-etag="${t}">${esc(cap(t))}</button>`).join('')}</div></div>
    <div class="field"><span>Ingredients (amounts in oz/parts for liquids)</span>
      ${draft.i.map((r, k) => `<div class="erow">
        <select data-erow="${k}" data-f="0"><option value="">Choose…</option>${ingOptions(r[0])}</select>
        <input data-erow="${k}" data-f="1" type="number" inputmode="decimal" min="0" max="64" step="0.25" value="${esc(r[1])}" aria-label="Amount">
        <select data-erow="${k}" data-f="2" aria-label="Unit">${UNITS.map(u => `<option value="${u}"${u === r[2] ? ' selected' : ''}>${u}</option>`).join('')}</select>
        <button class="icon-btn" data-edel="${k}" aria-label="Remove ingredient" style="width:36px;height:36px">${ICON.close}</button></div>`).join('')}
      <button class="btn sm ghost" data-act="eadd">${ICON.plus} Add ingredient</button></div>
    <label class="field"><span>Steps (one per line; ingredient names become chips)</span>
      <textarea id="e-s" placeholder="Add gin, lemon juice and simple syrup to a shaker.&#10;Shake with ice.&#10;Strain into a chilled coupe.">${esc(draft.s)}</textarea></label>
  </div>`;
}
function readEditor(d) {
  const v = id => $(id)?.value ?? '';
  d.n = v('#e-n'); d.d = v('#e-d'); d.g = v('#e-g'); d.m = v('#e-m'); d.gar = v('#e-gar'); d.s = v('#e-s');
  document.querySelectorAll('[data-erow]').forEach(el => {
    const r = d.i[+el.dataset.erow];
    if (!r) return;
    const f = +el.dataset.f;
    r[f] = f === 1 ? Number(el.value) : el.value;
  });
}
function saveEditor(d) {
  readEditor(d);
  const rows = d.i.filter(r => INGREDIENTS[r[0]]);
  if (!d.n.trim()) return toast('Give your cocktail a name');
  if (!rows.length) return toast('Add at least one ingredient');
  // Link ingredient names in steps to chips, longest names first
  const names = rows.map(r => [r[0], ingName(r[0])]).sort((a, b) => b[1].length - a[1].length);
  const steps = d.s.split('\n').map(line => {
    let out = line.trim();
    if (!out) return '';
    for (const [id, name] of names) {
      if (out.includes(`{${id}}`)) continue;
      const re = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if (re.test(out)) out = out.replace(re, `{${id}}`);
    }
    return out;
  }).filter(Boolean);
  const id = d.id || 'u-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const c = sanitizeCocktail({ ...d, id, i: rows, s: steps });
  if (!c) return toast('Something is off with this recipe');
  const at = S.custom.findIndex(x => x.id === id);
  if (at >= 0) S.custom[at] = c; else S.custom.push(c);
  save();
  toast('Saved');
  UI.layers.pop();
  UI.layers.push({ type: 'cocktail', id });
  history.replaceState({ depth: UI.layers.length }, '');
  UI.servings = 1;
  renderLayers(true); render();
}

// ---------- Actions ----------
function toggleBar(id) {
  if (!INGREDIENTS[id]) return;
  const before = allCocktails().filter(canMake).length;
  if (S.bar.has(id)) S.bar.delete(id); else S.bar.add(id);
  save();
  const after = allCocktails().filter(canMake).length;
  if (after > before) toast(`+${after - before} ${plural(after - before, 'cocktail', 'cocktails')} unlocked`);
  refresh();
}
function addShop(id) {
  if (!INGREDIENTS[id] || S.shop.some(x => x.id === id)) return;
  S.shop.push({ id, done: false });
  save();
}
function shareText(c) {
  return `${c.n}\n\n${c.i.map(r => `• ${fmtAmount(r, 1)} ${ingName(r[0])}`).join('\n')}\n\n${c.s.map((s, k) => `${k + 1}. ${s.replace(/\{([a-z0-9_]+)\}/g, (_, id) => ingName(id).toLowerCase())}`).join('\n')}`;
}
function markMade(id) {
  const m = S.made[id] || { n: 0, last: 0 };
  S.made[id] = { n: m.n + 1, last: Date.now() };
  save();
  toast('Cheers! 🥂');
}

document.addEventListener('click', e => {
  const t = e.target.closest('button, [data-open]');
  if (!t) return;
  const d = t.dataset;
  const top = UI.layers[UI.layers.length - 1];

  if (d.tab) { UI.tab = d.tab; while (UI.layers.length) { UI.layers.pop(); } renderLayers(); render(); $('#main').scrollTop = 0; return; }
  if (d.open) { UI.servings = 1; openLayer({ type: 'cocktail', id: d.open }); return; }
  if (d.toggle) { toggleBar(d.toggle); return; }
  if (d.ing) { openLayer({ type: 'ing', id: d.ing }); return; }
  if (d.tile) { openLayer({ type: 'tile', tile: d.tile }); return; }
  if (d.seg) { UI.barSeg = d.seg; render(); return; }
  if (d.base !== undefined) { UI.base = d.base; render(); return; }
  if (d.taste !== undefined) { UI.taste = d.taste; render(); return; }
  if (d.sort) { UI.sort = d.sort; render(); return; }
  if (d.units) { S.units = d.units; save(); refresh(); return; }
  if (d.serv) { UI.servings = Math.max(1, Math.min(12, UI.servings + +d.serv)); renderLayers(); return; }
  if (d.rate && top?.type === 'cocktail') { const n = +d.rate; if (S.rating[top.id] === n) delete S.rating[top.id]; else S.rating[top.id] = n; save(); renderLayers(); return; }
  if (d.addshop) { addShop(d.addshop); UI.shopQ = ''; toast(`${ingName(d.addshop)} added to list`); refresh(); return; }
  if (d.shopdel) { S.shop = S.shop.filter(x => x.id !== d.shopdel); save(); refresh(); return; }
  if (d.shopdone) { const x = S.shop.find(s => s.id === d.shopdone); if (x) x.done = !x.done; save(); refresh(); return; }
  if (d.tileall) {
    const rows = INGREDIENT_ROWS.filter(r => r[2] === d.tileall).map(r => r[0]);
    const all = rows.every(id => S.bar.has(id));
    rows.forEach(id => all ? S.bar.delete(id) : S.bar.add(id));
    save(); refresh(); return;
  }
  if (d.mix && top?.type === 'mix') {
    const c = byId(top.id);
    const k = top.k + +d.mix;
    if (k >= c.s.length) { markMade(c.id); closeLayer(); return; }
    top.k = Math.max(0, k); renderLayers(true); return;
  }
  if (top?.type === 'editor') {
    const dr = top.draft;
    if (d.color) { readEditor(dr); dr.c = d.color; renderLayers(); return; }
    if (d.etag) { readEditor(dr); dr.t = dr.t.includes(d.etag) ? dr.t.filter(x => x !== d.etag) : [...dr.t, d.etag]; renderLayers(); return; }
    if (d.edel !== undefined) { readEditor(dr); dr.i.splice(+d.edel, 1); if (!dr.i.length) dr.i.push(['', 1, 'part', false]); renderLayers(); return; }
  }

  switch (d.act) {
    case 'back': closeLayer(); break;
    case 'settings': openLayer({ type: 'settings' }); break;
    case 'ready': UI.readyOnly = !UI.readyOnly; render(); break;
    case 'starter': STARTER.forEach(id => S.bar.add(id)); save(); toast(`Added ${STARTER.length} basics`); render(); break;
    case 'stock': {
      const done = S.shop.filter(x => x.done);
      done.forEach(x => S.bar.add(x.id));
      S.shop = S.shop.filter(x => !x.done);
      save(); toast(`${done.length} moved to My Bar`); render(); break;
    }
    case 'fav': if (top) { S.favs.has(top.id) ? S.favs.delete(top.id) : S.favs.add(top.id); save(); refresh(); } break;
    case 'shopmissing': if (top) { const m = missing(byId(top.id)); m.forEach(addShop); toast(`${m.length} added to shopping list`); refresh(); } break;
    case 'made': if (top) { markMade(top.id); refresh(); } break;
    case 'mix': if (top) openLayer({ type: 'mix', id: top.id, k: 0 }); break;
    case 'share': if (top) {
      const txt = shareText(byId(top.id));
      if (navigator.share) navigator.share({ title: byId(top.id).n, text: txt }).catch(() => {});
      else navigator.clipboard?.writeText(txt).then(() => toast('Recipe copied'), () => toast('Could not copy'));
    } break;
    case 'new': openLayer({ type: 'editor', draft: blankDraft() }); break;
    case 'edit': if (top) openLayer({ type: 'editor', draft: draftFrom(byId(top.id)) }); break;
    case 'delete': if (top && confirm('Delete this cocktail?')) {
      S.custom = S.custom.filter(c => c.id !== top.id); S.favs.delete(top.id); delete S.made[top.id]; delete S.notes[top.id]; delete S.rating[top.id];
      save(); closeLayer(); toast('Deleted');
    } break;
    case 'eadd': readEditor(top.draft); top.draft.i.push(['', 1, 'part', false]); renderLayers(); break;
    case 'saveedit': saveEditor(top.draft); break;
    case 'subs': S.subs = !S.subs; save(); refresh(); break;
    case 'export': {
      const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `barback-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      break;
    }
    case 'import': $('#importFile').click(); break;
    case 'reset': if (confirm('Reset everything? This cannot be undone.')) { applyData({}); save(); closeLayer(); toast('Reset'); } break;
  }
});

document.addEventListener('input', e => {
  const t = e.target;
  const keep = id => { render(); const el = $('#' + id); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } };
  if (t.id === 'q') { UI.q = t.value; keep('q'); }
  else if (t.id === 'barQ') { UI.barQ = t.value; keep('barQ'); }
  else if (t.id === 'shopQ') { UI.shopQ = t.value; keep('shopQ'); }
  else if (t.id === 'note') {
    const top = UI.layers[UI.layers.length - 1];
    if (top?.type === 'cocktail') { const v = t.value.slice(0, 1000); if (v.trim()) S.notes[top.id] = v; else delete S.notes[top.id]; save(); }
  }
});
document.addEventListener('change', e => {
  const top = UI.layers[UI.layers.length - 1];
  if (top?.type === 'editor' && e.target.dataset.erow !== undefined) { readEditor(top.draft); }
});

$('#importFile').addEventListener('change', async e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  if (f.size > 2e6) return toast('That file is too big');
  try {
    const d = JSON.parse(await f.text());
    if (d?.app !== 'barback') throw new Error('not a backup');
    applyData(d); save(); refresh(); toast('Backup restored');
  } catch { toast('That is not a Barback backup'); }
});

load();
history.replaceState({ depth: 0 }, '');
render();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {}));
}
