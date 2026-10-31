// Simmer — recipes, meal planning and groceries. Everything (recipes, photos,
// plans and lists) is stored in localStorage on this device; nothing is uploaded.

const KEY = 'simmer-v1';
const MEALS = ['breakfast', 'lunch', 'dinner'];
const AISLES = ['Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Bakery', 'Pantry', 'Spices', 'Frozen', 'Other'];
const DIETS = { veg: 'Vegetarian', vegan: 'Vegan', gf: 'Gluten-free', df: 'Dairy-free' };
const COLORS = ['#f6d365', '#ff9a8b', '#a8e063', '#b8c6ff', '#fbc2eb', '#96e6a1', '#c2e9fb', '#fddb92', '#e0c3fc', '#ffc3a0', '#d4fc79', '#ffe29f'];
const EMOJIS = ['🍲', '🥘', '🍝', '🥗', '🍜', '🍛', '🥙', '🍕', '🍔', '🌮', '🥞', '🍳', '🍰', '🍪', '🥧', '🍗', '🐟', '🥦', '🍋', '🍓'];
const COST = ['', '$', '$$', '$$$'];

// ---------- Helpers ----------
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const clampInt = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
const str = (v, max) => typeof v === 'string' ? v.slice(0, max) : '';
const uid = () => 'r-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const ID_RE = /^[\w-]{1,40}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PHOTO_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function weekDays(offset) {
  const d = new Date(); d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setDate(d.getDate() + i); return x; });
}
const fmtDay = (d, o) => d.toLocaleDateString(undefined, o);

function safeUrl(u) {
  try { const x = new URL(String(u).trim()); return /^https?:$/.test(x.protocol) ? x.href.slice(0, 600) : ''; }
  catch { return ''; }
}
const safePhoto = p => typeof p === 'string' && p.length < 1.5e6 && (PHOTO_RE.test(p) || (p.startsWith('https://') && safeUrl(p) === p)) ? p : '';

// ---------- Quantities & units ----------
const UNIT_ALIASES = {
  tbsp: ['tbsp', 'tbsps', 'tbs', 'tbl', 'tablespoon', 'tablespoons'], tsp: ['tsp', 'tsps', 'teaspoon', 'teaspoons'],
  cup: ['cup', 'cups', 'c'], oz: ['oz', 'ounce', 'ounces'], lb: ['lb', 'lbs', 'pound', 'pounds'],
  g: ['g', 'gram', 'grams', 'gr'], kg: ['kg', 'kilogram', 'kilograms'], ml: ['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'],
  l: ['l', 'liter', 'liters', 'litre', 'litres'], clove: ['clove', 'cloves'], can: ['can', 'cans', 'tin', 'tins'],
  pinch: ['pinch', 'pinches'], handful: ['handful', 'handfuls'], slice: ['slice', 'slices'], bunch: ['bunch', 'bunches'],
  head: ['head', 'heads'], sprig: ['sprig', 'sprigs'], stalk: ['stalk', 'stalks'], package: ['package', 'packages', 'pkg', 'pack', 'packs'],
  jar: ['jar', 'jars'], dash: ['dash', 'dashes'], qt: ['qt', 'quart', 'quarts'], pt: ['pt', 'pint', 'pints'], stick: ['stick', 'sticks']
};
const UNIT_OF = {};
for (const [u, list] of Object.entries(UNIT_ALIASES)) list.forEach(a => { UNIT_OF[a] = u; });
const PLURAL = { cup: 'cups', clove: 'cloves', can: 'cans', pinch: 'pinches', handful: 'handfuls', slice: 'slices', bunch: 'bunches', head: 'heads', sprig: 'sprigs', stalk: 'stalks', package: 'packages', jar: 'jars', dash: 'dashes', stick: 'sticks' };
function normUnit(u) {
  if (!u) return '';
  if (u === 'T') return 'tbsp';
  if (u === 't') return 'tsp';
  const k = u.toLowerCase().replace(/\.$/, '');
  return UNIT_OF[k] || '';
}
const showUnit = (u, q) => (q != null && q > 1 && PLURAL[u]) || u;

const UNI = { '½': .5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': .25, '¾': .75, '⅛': .125, '⅜': .375, '⅝': .625, '⅞': .875 };
function parseQty(s) {
  if (!s) return null;
  s = s.trim().replace(/([\d])([½⅓⅔¼¾⅛⅜⅝⅞])/, '$1 $2');
  let total = 0, any = false;
  for (const part of s.split(/\s+/)) {
    if (UNI[part] != null) { total += UNI[part]; any = true; }
    else if (/^\d+\/\d+$/.test(part)) { const [a, b] = part.split('/').map(Number); if (b) { total += a / b; any = true; } }
    else if (/^\d+(\.\d+)?$/.test(part)) { total += parseFloat(part); any = true; }
  }
  return any ? total : null;
}
const FRACS = [[0, ''], [.125, '⅛'], [.25, '¼'], [1 / 3, '⅓'], [.5, '½'], [2 / 3, '⅔'], [.75, '¾'], [1, '']];
function fmtQty(n) {
  if (n == null || !Number.isFinite(n)) return '';
  if (n >= 20) return String(Math.round(n));
  let whole = Math.floor(n), frac = n - whole, best = FRACS[0];
  for (const f of FRACS) if (Math.abs(f[0] - frac) < Math.abs(best[0] - frac)) best = f;
  if (best[0] === 1) { whole += 1; best = FRACS[0]; }
  if (!whole && !best[1]) return n > 0 ? '⅛' : '0';
  return whole ? (best[1] ? `${whole} ${best[1]}` : String(whole)) : best[1];
}

const AISLE_RULES = [
  ['Frozen', /\bfrozen\b|ice cream/],
  ['Pantry', /coconut milk|peanut butter|almond butter|\bstock\b|broth|\bcan(ned)?\b|crushed tomato|diced tomato|tomato (paste|sauce|puree)|bouillon|water chestnut|chickpea|lentil|kidney bean|black bean|cannellini|pinto|baking powder|baking soda/],
  ['Meat & Seafood', /chicken|beef|steak|pork|bacon|sausage|turkey|lamb|\bham\b|shrimp|prawn|salmon|tuna|\bfish\b|\bcod\b|tilapia|mince|chorizo|prosciutto|anchov/],
  ['Dairy & Eggs', /milk|cream|butter|cheese|cheddar|mozzarella|parmesan|feta|yogh?urt|\beggs?\b|ricotta|ghee/],
  ['Bakery', /bread|tortilla|\bbuns?\b|bagel|ciabatta|baguette|pita|naan|\bwraps?\b|brioche|rolls?\b/],
  ['Spices', /\bsalt\b|black pepper|white pepper|peppercorn|^pepper$|paprika|cumin|oregano|cinnamon|nutmeg|chili powder|chili flakes|pepper flakes|curry powder|turmeric|\bdried\b|seasoning|bay lea|sesame seeds|garam masala|cayenne|allspice|\bground (ginger|coriander|cloves)|vanilla|\bpowder\b/],
  ['Produce', /onion|garlic|ginger|lemon|lime|orange|apple|banana|berr|tomato|potato|carrot|celery|spinach|kale|lettuce|arugula|rocket|cabbage|broccoli|cauliflower|zucchini|courgette|squash|pepper|cucumber|avocado|mushroom|herb|basil|cilantro|coriander|parsley|mint|thyme|rosemary|scallion|shallot|leek|asparagus|\bcorn\b|\bpeas?\b|sprouts|fruit|grape|mango|pineapple|peach|\bpears?\b|jalape|chile|chilli|eggplant|aubergine|beet|radish|greens|green beans/]
];
const guessAisle = name => { const n = name.toLowerCase(); for (const [a, re] of AISLE_RULES) if (re.test(n)) return a; return 'Pantry'; };

const QTY_RE = /^((?:\d+\s+\d+\/\d+)|(?:\d+\/\d+)|(?:\d+(?:\.\d+)?\s*[½⅓⅔¼¾⅛⅜⅝⅞]?)|[½⅓⅔¼¾⅛⅜⅝⅞])(?:\s*(?:-|–|to)\s*[\d.\/½¼¾⅓⅔]+)?\s*/;
function parseIngredient(line) {
  let s = line.replace(/^\s*(?:[-•*▢◻□✓▪·]|\d+[.)]\s)\s*/, '').trim();
  if (!s) return null;
  let qty = null, unit = '';
  const m = s.match(QTY_RE);
  if (m && (m[0].length < s.length)) { qty = parseQty(m[1]); s = s.slice(m[0].length); }
  let paren = '';
  const p = s.match(/^\(([^)]{1,30})\)\s*/);
  if (p) { paren = p[1]; s = s.slice(p[0].length); }
  const w = s.match(/^([A-Za-z]+\.?)\s+/);
  if (w && normUnit(w[1])) { unit = normUnit(w[1]); s = s.slice(w[0].length); }
  s = s.replace(/^of\s+/i, '').trim();
  if (paren) s = `${s} (${paren})`;
  if (!s) return null;
  return [qty, unit, s.slice(0, 120), guessAisle(s)];
}
const ingLine = (i, scale = 1) => [fmtQty(i[0] == null ? null : i[0] * scale), showUnit(i[1], i[0] == null ? null : i[0] * scale), i[2]].filter(Boolean).join(' ');

// ---------- State ----------
function cleanRecipe(r, i = 0) {
  if (!r || typeof r !== 'object') return null;
  const title = str(r.title, 120).trim();
  if (!title) return null;
  const ingredients = (Array.isArray(r.ingredients) ? r.ingredients : []).slice(0, 80).map(x => {
    if (!Array.isArray(x)) return null;
    const name = str(x[2], 120).trim();
    if (!name) return null;
    const q = typeof x[0] === 'number' && Number.isFinite(x[0]) && x[0] >= 0 && x[0] < 1e5 ? x[0] : null;
    return [q, normUnit(str(x[1], 20)), name, AISLES.includes(x[3]) ? x[3] : guessAisle(name)];
  }).filter(Boolean);
  return {
    id: typeof r.id === 'string' && ID_RE.test(r.id) ? r.id : uid() + i,
    title,
    emoji: str(r.emoji, 8) || '🍲',
    color: /^#[0-9a-f]{6}$/i.test(r.color) ? r.color : COLORS[i % COLORS.length],
    meal: MEALS.includes(r.meal) ? r.meal : 'dinner',
    time: clampInt(r.time, 0, 1440, 30),
    cost: clampInt(r.cost, 1, 3, 2),
    servings: clampInt(r.servings, 1, 50, 4),
    diet: (Array.isArray(r.diet) ? r.diet : []).filter(d => d in DIETS),
    cuisine: str(r.cuisine, 40),
    ingredients,
    steps: (Array.isArray(r.steps) ? r.steps : []).map(s => str(s, 1500).trim()).filter(Boolean).slice(0, 60),
    notes: str(r.notes, 3000),
    source: safeUrl(r.source || ''),
    photo: safePhoto(r.photo),
    fav: r.fav === true,
    created: clampInt(r.created, 0, 1e14, Date.now())
  };
}

function cleanState(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const recipes = [];
  const seen = new Set();
  (Array.isArray(o.recipes) ? o.recipes : []).slice(0, 2000).forEach((r, i) => {
    const c = cleanRecipe(r, i);
    if (c && !seen.has(c.id)) { seen.add(c.id); recipes.push(c); }
  });
  const plan = {};
  if (o.plan && typeof o.plan === 'object') {
    for (const [k, v] of Object.entries(o.plan)) {
      if (!DATE_RE.test(k) || !v || typeof v !== 'object') continue;
      const day = {};
      for (const m of MEALS) {
        day[m] = (Array.isArray(v[m]) ? v[m] : []).filter(e => e && seen.has(e.id)).slice(0, 6)
          .map(e => ({ id: e.id, servings: clampInt(e.servings, 1, 50, 2) }));
      }
      if (MEALS.some(m => day[m].length)) plan[k] = day;
    }
  }
  const groceries = (Array.isArray(o.groceries) ? o.groceries : []).slice(0, 500).map(g => {
    if (!g || typeof g !== 'object') return null;
    const name = str(g.name, 120).trim();
    if (!name) return null;
    const unit = normUnit(str(g.unit, 20));
    return {
      k: name.toLowerCase() + '|' + unit, name, unit,
      qty: typeof g.qty === 'number' && Number.isFinite(g.qty) && g.qty >= 0 ? g.qty : null,
      aisle: AISLES.includes(g.aisle) ? g.aisle : guessAisle(name),
      done: g.done === true,
      from: (Array.isArray(g.from) ? g.from : []).map(f => str(f, 120)).filter(Boolean).slice(0, 10)
    };
  }).filter(Boolean);
  const collections = (Array.isArray(o.collections) ? o.collections : []).slice(0, 100).map(c => {
    if (!c || typeof c !== 'object' || !ID_RE.test(c.id || '')) return null;
    const name = str(c.name, 60).trim();
    return name ? { id: c.id, name, ids: (Array.isArray(c.ids) ? c.ids : []).filter(id => seen.has(id)) } : null;
  }).filter(Boolean);
  const p = o.prefs && typeof o.prefs === 'object' ? o.prefs : {};
  return {
    seeded: o.seeded === true,
    recipes, plan, groceries, collections,
    cooked: clampInt(o.cooked, 0, 1e6, 0),
    tab: ['book', 'plan', 'list', 'me'].includes(o.tab) ? o.tab : 'book',
    prefs: {
      name: str(p.name, 40),
      servings: clampInt(p.servings, 1, 12, 2),
      diet: (Array.isArray(p.diet) ? p.diet : []).filter(d => d in DIETS),
      time: [20, 30, 45, 0].includes(p.time) ? p.time : 0,
      budget: clampInt(p.budget, 1, 3, 3),
      meals: (Array.isArray(p.meals) ? p.meals : ['dinner']).filter(m => MEALS.includes(m))
    }
  };
}

function load() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY)); } catch {}
  const s = cleanState(raw);
  if (!s.seeded) {
    s.recipes = (window.SEED_RECIPES || []).map((r, i) => cleanRecipe({ ...r, created: Date.now() - i * 1000 }, i)).filter(Boolean);
    s.seeded = true;
  }
  if (!s.prefs.meals.length) s.prefs.meals = ['dinner'];
  return s;
}
let S = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); return true; }
  catch { toast('Storage is full. Remove some recipe photos.'); return false; }
}
const byId = id => S.recipes.find(r => r.id === id);

// Ephemeral UI state
const U = { q: '', filter: 'all', coll: null, week: 0, seg: 'ing', scale: {}, full: [], sheet: null, editor: null, magic: null };

// ---------- Icons ----------
const sv = (d, f = 'none') => `<svg viewBox="0 0 24 24" fill="${f}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  book: sv('<path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2v-1.5zM4 19.5A2 2 0 0 0 6 21h13"/><path d="M9 7h6"/>'),
  cal: sv('<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>'),
  plus: sv('<path d="M12 5v14M5 12h14"/>'),
  cart: sv('<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L22 7H6"/>'),
  user: sv('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  search: sv('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  heart: sv('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>'),
  heartF: sv('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>', 'currentColor'),
  back: sv('<path d="m15 18-6-6 6-6"/>'),
  next: sv('<path d="m9 18 6-6-6-6"/>'),
  more: sv('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'),
  check: sv('<path d="M20 6 9 17l-5-5"/>'),
  x: sv('<path d="M18 6 6 18M6 6l12 12"/>'),
  link: sv('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
  paste: sv('<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>'),
  pen: sv('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  spark: sv('<path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z"/><path d="M19 3v4M17 5h4"/>'),
  play: sv('<path d="M6 4l14 8-14 8z"/>', 'currentColor'),
  share: sv('<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4M12 2v13"/>'),
  timer: sv('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>'),
  list: sv('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  trash: sv('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
  camera: sv('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
  folder: sv('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>')
};

// ---------- Small renderers ----------
const thumbInner = r => r.photo ? `<img src="${esc(r.photo)}" alt="" loading="lazy">` : esc(r.emoji);
const thumbStyle = r => `background:${r.photo ? 'var(--surface-2)' : `linear-gradient(145deg, ${r.color}, ${r.color}99)`}`;
const metaLine = r => `${r.time ? `${r.time} min · ` : ''}${COST[r.cost]}${r.diet.includes('vegan') ? ' · Vegan' : r.diet.includes('veg') ? ' · Veg' : ''}`;
const card = r => `
  <button class="card" data-act="open" data-id="${esc(r.id)}">
    <div class="thumb" style="${thumbStyle(r)}">${thumbInner(r)}${r.fav ? `<span class="fav">${I.heartF}</span>` : ''}</div>
    <b>${esc(r.title)}</b><small>${esc(metaLine(r))}</small>
  </button>`;
const pickRow = (r, act, extra = '') => `
  <button class="pick" data-act="${act}" data-id="${esc(r.id)}" ${extra}>
    <span class="t" style="${thumbStyle(r)}">${thumbInner(r)}</span>
    <span><b>${esc(r.title)}</b><small>${esc(cap(r.meal))} · ${esc(metaLine(r))}</small></span>
  </button>`;

function promo() {
  return `
  <button class="promo" data-act="magic">
    <div class="pills" aria-hidden="true">
      <span class="pill" style="left:2%;top:4px;background:#a9c8ff;transform:rotate(6deg)">Cook time</span>
      <span class="pill" style="left:40%;top:10px;background:#f4c04e;transform:rotate(-28deg)">Budget</span>
      <span class="pill" style="left:62%;top:2px;background:#f2a7bd;transform:rotate(4deg)">Dietaries 🍎</span>
      <span class="pill" style="left:8%;top:58px;background:#c7e3a4;transform:rotate(10deg)">Pantry 🥦</span>
      <span class="pill" style="left:52%;top:62px;background:#f08a3c;transform:rotate(-4deg)">Serving size</span>
    </div>
    <small>${I.spark.replace('<svg', '<svg style="width:12px;height:12px;vertical-align:-1px"')} SMART PLANNER</small>
    <b>Magic Meal Plan</b>
    <span>A week of recipes from your cookbook, tailored to you.</span>
  </button>`;
}

// ---------- Tabs ----------
function renderTabs() {
  const t = (id, label, icon) => `<button class="${S.tab === id ? 'on' : ''}" data-act="tab" data-tab="${id}" aria-label="${label}">${icon}<span>${label}</span></button>`;
  $('#tabs').innerHTML = t('book', 'Cookbook', I.book) + t('plan', 'Plan', I.cal)
    + `<button class="add" data-act="add" aria-label="Add recipe">${I.plus}</button>`
    + t('list', 'Groceries', I.cart) + t('me', 'Profile', I.user);
}

function render() {
  renderTabs();
  const m = $('#main');
  m.innerHTML = `<div class="wrap">${({ book: renderBook, plan: renderPlan, list: renderList, me: renderMe })[S.tab]()}</div>`;
  if (S.tab === 'book') renderGrid();
}

const FILTERS = [
  ['all', 'All'], ['fav', '♥ Favorites'], ['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'],
  ['quick', 'Under 30 min'], ['budget', 'Budget'], ['veg', 'Vegetarian'], ['vegan', 'Vegan'], ['gf', 'Gluten-free'], ['df', 'Dairy-free']
];
function filtered() {
  const q = U.q.trim().toLowerCase();
  let list = S.recipes;
  if (U.coll) { const c = S.collections.find(c => c.id === U.coll); list = c ? list.filter(r => c.ids.includes(r.id)) : []; }
  const f = U.filter;
  if (f === 'fav') list = list.filter(r => r.fav);
  else if (MEALS.includes(f)) list = list.filter(r => r.meal === f);
  else if (f === 'quick') list = list.filter(r => r.time && r.time <= 30);
  else if (f === 'budget') list = list.filter(r => r.cost === 1);
  else if (f in DIETS) list = list.filter(r => r.diet.includes(f));
  if (q) list = list.filter(r => (r.title + ' ' + r.cuisine + ' ' + r.ingredients.map(i => i[2]).join(' ')).toLowerCase().includes(q));
  return [...list].sort((a, b) => b.created - a.created);
}

function renderBook() {
  const coll = U.coll && S.collections.find(c => c.id === U.coll);
  if (U.coll && !coll) U.coll = null;
  const head = coll
    ? `<div class="head"><div style="display:flex;gap:12px;align-items:center"><button class="icon-btn" data-act="coll-close" aria-label="Back">${I.back}</button><div><h1>${esc(coll.name)}</h1><p class="muted small">${coll.ids.length} recipe${coll.ids.length === 1 ? '' : 's'}</p></div></div><button class="icon-btn" data-act="coll-menu" aria-label="Collection options">${I.more}</button></div>`
    : `<div class="head"><div><h1>Cookbook</h1><p class="muted small">${S.recipes.length} saved recipe${S.recipes.length === 1 ? '' : 's'}</p></div><button class="btn sm" data-act="add">${I.plus} Add</button></div>`;
  const favs = S.recipes.filter(r => r.fav);
  const stack = list => `<div class="stack">${[0, 1, 2, 3].map(i => list[i] ? `<span style="background:${list[i].color}">${esc(list[i].emoji)}</span>` : '<span></span>').join('')}</div>`;
  const colls = coll ? '' : `
    <div class="section-title"><h2>Collections</h2></div>
    <div class="collections">
      <button class="coll" data-act="filter" data-f="fav">${stack(favs)}<b>Favorites</b><small>${favs.length} recipe${favs.length === 1 ? '' : 's'}</small></button>
      ${S.collections.map(c => `<button class="coll" data-act="coll-open" data-id="${esc(c.id)}">${stack(c.ids.map(byId).filter(Boolean))}<b>${esc(c.name)}</b><small>${c.ids.length} recipe${c.ids.length === 1 ? '' : 's'}</small></button>`).join('')}
      <button class="coll" data-act="coll-new"><div class="stack new">${I.plus.replace('<svg', '<svg style="width:28px;height:28px"')}</div><b>New collection</b><small>Group recipes</small></button>
    </div>`;
  return `${head}
    ${coll ? '' : promo()}
    <label class="search">${I.search}<input id="q" type="search" placeholder="Search recipes or ingredients" value="${esc(U.q)}" autocomplete="off" aria-label="Search recipes"></label>
    <div class="chips">${FILTERS.map(([k, l]) => `<button class="chip ${U.filter === k ? 'on' : ''}" data-act="filter" data-f="${k}">${l}</button>`).join('')}</div>
    ${colls}
    <div class="section-title"><h2>${coll ? 'Recipes' : 'All recipes'}</h2></div>
    <div id="grid"></div>`;
}
function renderGrid() {
  const g = $('#grid');
  if (!g) return;
  const list = filtered();
  g.className = list.length ? 'grid' : '';
  g.innerHTML = list.length ? list.map(card).join('') : `
    <div class="empty"><div class="big">🍽️</div><b>No recipes here yet</b>
    <p class="small">${U.coll ? 'Open a recipe and choose “Add to collection”.' : 'Try another search, or add one with the + button.'}</p></div>`;
}

function planEntries(days) {
  const out = [];
  for (const d of days) { const p = S.plan[dayKey(d)]; if (p) for (const m of MEALS) for (const e of p[m]) { const r = byId(e.id); if (r) out.push({ d, m, e, r }); } }
  return out;
}
function renderPlan() {
  const days = weekDays(U.week);
  const today = dayKey(new Date());
  const entries = planEntries(days);
  const range = `${fmtDay(days[0], { month: 'short', day: 'numeric' })} – ${fmtDay(days[6], { month: 'short', day: 'numeric' })}`;
  const mins = entries.reduce((a, x) => a + x.r.time, 0);
  return `
    <div class="head"><div><h1>Meal Plan</h1><p class="muted small">${U.week === 0 ? 'This week' : U.week === 1 ? 'Next week' : U.week === -1 ? 'Last week' : 'Week of ' + range}</p></div></div>
    <div class="weekbar">
      <button class="icon-btn" data-act="week" data-d="-1" aria-label="Previous week">${I.back}</button>
      <b>${range}</b>
      <button class="icon-btn" data-act="week" data-d="1" aria-label="Next week">${I.next}</button>
    </div>
    <div class="stats">
      <div class="stat"><b>${entries.length}</b><small>meals planned</small></div>
      <div class="stat"><b>${new Set(entries.map(x => x.r.id)).size}</b><small>recipes</small></div>
      <div class="stat"><b>${mins >= 60 ? Math.round(mins / 6) / 10 + 'h' : mins + 'm'}</b><small>cook time</small></div>
    </div>
    ${promo()}
    <div class="row" style="margin-bottom:16px">
      <button class="btn green sm" data-act="plan-to-list" ${entries.length ? '' : 'disabled style="opacity:.5"'}>${I.cart} Add to groceries</button>
      <button class="btn ghost sm" data-act="plan-clear" ${entries.length ? '' : 'disabled style="opacity:.5"'}>${I.trash} Clear week</button>
    </div>
    ${days.map(d => {
      const k = dayKey(d), p = S.plan[k] || {};
      return `<section class="day ${k === today ? 'today' : ''}">
        <header><b>${fmtDay(d, { weekday: 'long' })}</b><small>${k === today ? 'Today · ' : ''}${fmtDay(d, { month: 'short', day: 'numeric' })}</small></header>
        ${MEALS.map(m => `<div class="slot"><span class="lbl">${m}</span><div class="items">
          ${(p[m] || []).map((e, i) => { const r = byId(e.id); return r ? `<div class="meal"><button class="t" style="${thumbStyle(r)}" data-act="open" data-id="${esc(r.id)}" aria-label="Open ${esc(r.title)}">${thumbInner(r)}</button><span data-act="open" data-id="${esc(r.id)}" role="button" tabindex="0">${esc(r.title)} <small class="muted">· ${e.servings}</small></span><button class="x" data-act="plan-rm" data-k="${k}" data-m="${m}" data-i="${i}" aria-label="Remove">${I.x}</button></div>` : ''; }).join('')}
          <button class="addslot" data-act="slot-add" data-k="${k}" data-m="${m}">+ Add</button>
        </div></div>`).join('')}
      </section>`;
    }).join('')}`;
}

function renderList() {
  const left = S.groceries.filter(g => !g.done).length;
  const groups = AISLES.map(a => [a, S.groceries.filter(g => g.aisle === a).sort((x, y) => x.done - y.done)]).filter(([, l]) => l.length);
  return `
    <div class="head"><div><h1>Groceries</h1><p class="muted small">${S.groceries.length ? `${left} of ${S.groceries.length} left to buy` : 'Your shopping list'}</p></div>
      ${S.groceries.length ? `<button class="icon-btn" data-act="list-menu" aria-label="List options">${I.more}</button>` : ''}</div>
    <form class="addbar" data-form="list-add"><input id="gi" placeholder="Add an item, e.g. 2 lb apples" autocomplete="off" aria-label="Add grocery item"><button class="btn sm" type="submit">${I.plus}</button></form>
    <button class="list-btn" data-act="plan-to-list" style="margin:0 0 18px"><span class="ic">${I.cal}</span><span><b>Add this week's meal plan</b><small>Ingredients are combined and sorted by aisle</small></span></button>
    ${groups.length ? groups.map(([a, l]) => `<div class="aisle"><h3>${a}</h3>${l.map(g => `
      <div class="gi ${g.done ? 'done' : ''}">
        <button class="box" data-act="g-toggle" data-k="${esc(g.k)}" aria-label="${g.done ? 'Uncheck' : 'Check'} ${esc(g.name)}">${I.check}</button>
        <button class="nm" data-act="g-toggle" data-k="${esc(g.k)}">${esc(g.name)}${g.from.length ? `<small>${esc(g.from.join(', '))}</small>` : ''}</button>
        <span class="qt">${esc([fmtQty(g.qty), showUnit(g.unit, g.qty)].filter(Boolean).join(' '))}</span>
        <button class="icon-btn" style="width:30px;height:30px;background:none" data-act="g-rm" data-k="${esc(g.k)}" aria-label="Remove ${esc(g.name)}">${I.x}</button>
      </div>`).join('')}</div>`).join('') : `<div class="empty"><div class="big">🛒</div><b>Your list is empty</b><p class="small">Add items above, plan some meals, or add a recipe's ingredients from its page.</p></div>`}`;
}

function renderMe() {
  const name = S.prefs.name || 'Home cook';
  const week = planEntries(weekDays(0)).length;
  return `
    <div class="head"><h1>Profile</h1></div>
    <div class="profile-card"><div class="avatar">${esc(name.charAt(0).toUpperCase())}</div><div style="flex:1"><b>${esc(name)}</b><p class="muted small">${S.prefs.diet.length ? S.prefs.diet.map(d => DIETS[d]).join(', ') : 'No dietary preferences'} · serves ${S.prefs.servings}</p></div><button class="icon-btn" data-act="prefs" aria-label="Edit preferences">${I.pen}</button></div>
    <div class="stats">
      <div class="stat"><b>${S.recipes.length}</b><small>recipes</small></div>
      <div class="stat"><b>${week}</b><small>meals this week</small></div>
      <div class="stat"><b>${S.cooked}</b><small>times cooked</small></div>
    </div>
    <div class="menu">
      <button data-act="prefs"><span>Food preferences</span><small>${I.next.replace('<svg', '<svg style="width:18px;height:18px"')}</small></button>
      <button data-act="magic"><span>Magic Meal Plan</span><small>${I.next.replace('<svg', '<svg style="width:18px;height:18px"')}</small></button>
      <button data-act="add"><span>Import a recipe</span><small>${I.next.replace('<svg', '<svg style="width:18px;height:18px"')}</small></button>
    </div>
    <div class="menu">
      <button data-act="export"><span>Back up my data</span><small>Download a file</small></button>
      <label class="mi"><span>Restore from backup</span><small>Choose a file</small><input type="file" accept="application/json,.json" id="restore" hidden></label>
      <button data-act="reset" style="color:#d33"><span>Erase everything</span><small></small></button>
    </div>
    <p class="muted small" style="text-align:center">Simmer keeps your recipes, plans and lists on this device only.<br>Add it to your Home Screen for the full app experience.</p>`;
}

// ---------- Full-screen pages ----------
function openFull(view) { U.full.push(view); history.pushState({ layer: 'full' }, ''); renderFull(); }
function renderFull() {
  const f = $('#full');
  const v = U.full[U.full.length - 1];
  if (!v) { f.classList.add('hidden'); f.innerHTML = ''; releaseWake(); return; }
  const r = byId(v.id);
  if (!r) { U.full.pop(); renderFull(); return; }
  f.classList.remove('hidden');
  f.innerHTML = v.type === 'cook' ? renderCook(r, v) : renderRecipe(r);
  if (v.type !== 'cook') { releaseWake(); if (v.fresh) { f.scrollTop = 0; v.fresh = false; } }
}

function renderRecipe(r) {
  const sv = U.scale[r.id] || r.servings, scale = sv / r.servings;
  return `
    <div class="hero" style="${thumbStyle(r)}">${thumbInner(r)}
      <div class="bar"><button class="icon-btn" data-act="back" aria-label="Back">${I.back}</button>
        <div class="r"><button class="icon-btn" data-act="fav" data-id="${esc(r.id)}" aria-label="${r.fav ? 'Remove from favorites' : 'Add to favorites'}" style="color:var(--accent)">${r.fav ? I.heartF : I.heart}</button>
        <button class="icon-btn" data-act="recipe-menu" data-id="${esc(r.id)}" aria-label="More options">${I.more}</button></div></div>
    </div>
    <div class="detail"><div class="wrap">
      <h1>${esc(r.title)}</h1>
      <div class="tags">
        ${r.cuisine ? `<span class="tag">${esc(r.cuisine)}</span>` : ''}
        ${r.diet.map(d => `<span class="tag">${DIETS[d]}</span>`).join('')}
        ${r.source ? `<a class="tag src" href="${esc(r.source)}" target="_blank" rel="noopener noreferrer">${I.link.replace('<svg', '<svg style="width:11px;height:11px;vertical-align:-1px"')} ${esc(new URL(r.source).hostname.replace(/^www\./, ''))}</a>` : ''}
      </div>
      <div class="meta">
        <div><small>Time</small><b>${r.time ? r.time + 'm' : '—'}</b></div>
        <div><small>Serves</small><b>${r.servings}</b></div>
        <div><small>Cost</small><b>${COST[r.cost]}</b></div>
        <div><small>Meal</small><b style="font-size:.95rem;padding-top:3px">${cap(r.meal)}</b></div>
      </div>
      <div class="seg" role="tablist">
        <button class="${U.seg === 'ing' ? 'on' : ''}" data-act="seg" data-s="ing">Ingredients</button>
        <button class="${U.seg === 'steps' ? 'on' : ''}" data-act="seg" data-s="steps">Method</button>
      </div>
      ${U.seg === 'ing' ? `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <b>${r.ingredients.length} ingredients</b>
          <div class="stepper"><button data-act="scale" data-id="${esc(r.id)}" data-d="-1" aria-label="Fewer servings">−</button><b>${sv}</b><button data-act="scale" data-id="${esc(r.id)}" data-d="1" aria-label="More servings">+</button><small class="muted">servings</small></div>
        </div>
        ${r.ingredients.map(i => `<div class="ing"><span class="q">${esc([fmtQty(i[0] == null ? null : i[0] * scale), showUnit(i[1], i[0] == null ? null : i[0] * scale)].filter(Boolean).join(' '))}</span><span>${esc(i[2])}</span></div>`).join('') || '<p class="muted">No ingredients listed.</p>'}
        <button class="btn ghost" style="margin-top:16px" data-act="r-to-list" data-id="${esc(r.id)}">${I.cart} Add ingredients to groceries</button>`
      : (r.steps.map((s, i) => `<div class="step"><span class="n">${i + 1}</span><p>${esc(s)}</p></div>`).join('') || '<p class="muted">No steps listed.</p>')}
      ${r.notes ? `<h3 style="margin-top:22px">Notes</h3><p class="muted" style="white-space:pre-wrap;margin-top:6px">${esc(r.notes)}</p>` : ''}
    </div></div>
    <div class="dock"><div class="row">
      <button class="btn ghost" data-act="to-plan" data-id="${esc(r.id)}">${I.cal} Add to plan</button>
      <button class="btn" data-act="cook" data-id="${esc(r.id)}" ${r.steps.length ? '' : 'disabled style="opacity:.5"'}>${I.play} Start cooking</button>
    </div></div>`;
}

// Cook mode
let wake = null;
async function holdWake() { try { if (!wake && navigator.wakeLock) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch {} }
function releaseWake() { if (wake) { wake.release().catch(() => {}); wake = null; } }
const T = { end: 0, int: null, label: '', done: false };
function stepTimer(text) {
  const m = text.match(/(\d+)(?:\s*(?:–|-|to)\s*(\d+))?\s*(minutes?|mins?|hours?|hrs?)\b/i);
  if (!m) return 0;
  const n = Number(m[2] || m[1]);
  return /^h/i.test(m[3]) ? n * 3600 : n * 60;
}
const fmtSecs = s => { s = Math.max(0, Math.ceil(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };

function renderCook(r, v) {
  holdWake();
  const n = r.steps.length, i = Math.min(v.i, n - 1), text = r.steps[i];
  const secs = stepTimer(text);
  const running = T.end && T.label === r.id + ':' + i;
  return `<div class="cook">
    <div class="top"><button class="icon-btn" data-act="back" aria-label="Exit cook mode">${I.x}</button><b style="flex:1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.title)}</b><button class="icon-btn" data-act="cook-ing" data-id="${esc(r.id)}" aria-label="Show ingredients">${I.list}</button></div>
    <div class="progress"><i style="width:${(i + 1) / n * 100}%"></i></div>
    <div class="label">STEP ${i + 1} OF ${n}</div>
    <p class="text">${esc(text)}</p>
    ${secs ? `<div><button class="timer ${T.done && running ? 'ring' : ''}" data-act="timer" data-s="${secs}" data-l="${esc(r.id + ':' + i)}" id="timer">${I.timer}<span id="tleft">${running ? (T.done ? "Time's up!" : fmtSecs((T.end - Date.now()) / 1000)) : 'Start ' + fmtSecs(secs) + ' timer'}</span></button></div>` : ''}
    ${T.end && !running ? `<p class="small muted" style="margin-bottom:8px">Timer running from another step: <b id="tleft2">${fmtSecs((T.end - Date.now()) / 1000)}</b></p>` : ''}
    <div class="row" style="margin-top:20px">
      <button class="btn ghost" data-act="cook-step" data-d="-1" ${i === 0 ? 'disabled style="opacity:.4"' : ''}>${I.back} Back</button>
      ${i === n - 1 ? `<button class="btn green" data-act="cook-done" data-id="${esc(r.id)}">${I.check} Done</button>` : `<button class="btn" data-act="cook-step" data-d="1">Next ${I.next}</button>`}
    </div>
  </div>`;
}
let audioCtx = null;
function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    [0, .35, .7].forEach(t => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(.25, audioCtx.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + t + .3);
      o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + .3);
    });
  } catch {}
  navigator.vibrate?.([300, 150, 300]);
}
function tick() {
  const left = (T.end - Date.now()) / 1000;
  if (left <= 0 && !T.done) { T.done = true; beep(); toast("Time's up!"); clearInterval(T.int); T.int = null; renderFull(); return; }
  const a = $('#tleft'), b = $('#tleft2');
  if (a && $('#timer')?.dataset.l === T.label && !T.done) a.textContent = fmtSecs(left);
  if (b) b.textContent = fmtSecs(left);
}

// ---------- Sheets ----------
function openSheet(html, key) {
  const sh = $('#sheet'), bg = $('#sheet-bg');
  const wasOpen = !!U.sheet;
  U.sheet = key || 'sheet';
  sh.innerHTML = `<div class="grab"></div>${html}`;
  sh.classList.remove('hidden'); bg.classList.remove('hidden');
  if (!wasOpen) {
    history.pushState({ layer: 'sheet' }, '');
    requestAnimationFrame(() => { sh.classList.add('show'); bg.classList.add('show'); });
    sh.scrollTop = 0;
  }
}
function hideSheet() {
  const sh = $('#sheet'), bg = $('#sheet-bg');
  U.sheet = null; U.editor = null;
  sh.classList.remove('show'); bg.classList.remove('show');
  setTimeout(() => { if (!U.sheet) { sh.classList.add('hidden'); bg.classList.add('hidden'); sh.innerHTML = ''; } }, 220);
}
// Closing from the UI goes through history so the phone's back button stays in sync
// fn runs once the layer has actually closed, so a follow-up pushState lands after the pop
const closeTop = fn => { U.afterPop = fn || null; history.back(); };
window.addEventListener('popstate', () => {
  if (U.sheet) hideSheet();
  else if (U.full.length) { U.full.pop(); renderFull(); }
  const fn = U.afterPop; U.afterPop = null;
  if (fn) fn();
});

function sheetAdd(prefill = '') {
  openSheet(`
    <h2>Add a recipe</h2>
    <p class="muted small">Save recipes from websites, social posts, cookbooks or your own head.</p>
    <form data-form="import-url" style="margin-top:14px">
      <label class="field"><span>Recipe link</span><input id="url" type="url" inputmode="url" placeholder="https://…" value="${esc(prefill)}" autocomplete="off"></label>
      <button class="btn" type="submit">${I.link} Import from link</button>
    </form>
    <div id="import-msg"></div>
    <button class="list-btn" data-act="paste"><span class="ic">${I.paste}</span><span><b>Paste recipe text</b><small>From a caption, video description, note or email</small></span></button>
    <button class="list-btn" data-act="new"><span class="ic">${I.pen}</span><span><b>Write it myself</b><small>Type it in or snap a photo of the dish</small></span></button>`, 'add');
}

function sheetPaste(text = '', source = '') {
  openSheet(`
    <h2>Paste recipe text</h2>
    <p class="muted small">Copy a recipe from anywhere — an Instagram or TikTok caption, a YouTube description, a blog post — and paste it here. Simmer will pick out the title, ingredients and steps for you to check.</p>
    <form data-form="paste">
      <label class="field"><span>Recipe text</span><textarea id="paste" style="min-height:220px" placeholder="Garlic Butter Pasta&#10;&#10;Ingredients&#10;200 g spaghetti&#10;3 cloves garlic&#10;…&#10;&#10;Method&#10;1. Boil the pasta…">${esc(text)}</textarea></label>
      <input type="hidden" id="paste-src" value="${esc(source)}">
      <button class="btn" type="submit">Continue</button>
    </form>`, 'paste');
  setTimeout(() => $('#paste')?.focus(), 250);
}

function parseRecipeText(text, source = '') {
  const lines = text.replace(/\r/g, '').split('\n').map(l => l.trim());
  const nonEmpty = lines.filter(Boolean);
  const isIngHead = l => /^(ingredients?|you(?:'|’)ll need|what you need|shopping list)\b:?/i.test(l);
  const isStepHead = l => /^(instructions?|directions?|method|steps?|preparation|how to make( it)?)\b:?\s*$/i.test(l);
  const url = source || (text.match(/https?:\/\/[^\s)]+/) || [])[0] || '';
  let title = (nonEmpty.find(l => !isIngHead(l) && !isStepHead(l) && !/^https?:/.test(l)) || 'Untitled recipe').replace(/^[#*\s]+|[*\s]+$/g, '').slice(0, 120);
  let ing = [], steps = [], mode = null;
  const hasHeads = lines.some(isIngHead);
  for (const raw of lines) {
    if (/^#[^\s#]/.test(raw) && raw.split(/\s+/).every(w => w.startsWith('#'))) continue; // hashtag lines
    const l = raw.replace(/^#+\s*/, '');
    if (!l) continue;
    if (isIngHead(l)) { mode = 'ing'; const rest = l.replace(/^[^:]*:\s*/, ''); if (rest !== l && rest) ing.push(rest); continue; }
    if (isStepHead(l)) { mode = 'steps'; continue; }
    if (l === title || /^https?:/.test(l) || /^#\w/.test(l)) continue;
    if (hasHeads) {
      if (mode === 'ing') ing.push(l);
      else if (mode === 'steps') steps.push(l);
    } else {
      // No headings: short lines starting with an amount are ingredients, numbered or long lines are steps
      if (/^(step\s*\d+|\d+[.)])\s*/i.test(l) || l.length > 70) steps.push(l);
      else if (QTY_RE.test(l.replace(/^[-•*▢]\s*/, '')) || /^[-•*▢]/.test(l)) ing.push(l);
    }
  }
  steps = steps.map(s => s.replace(/^(step\s*\d+[:.)]?|\d+[.)])\s*/i, '').trim()).filter(Boolean);
  const all = text.toLowerCase();
  const serv = all.match(/(?:serves|servings?|yield|makes)\s*:?\s*(\d+)/);
  let time = 0;
  const tm = all.match(/(?:total|ready in|cook(?:ing)? time|time)\s*:?\s*(?:(\d+)\s*(?:h|hr|hrs|hours?))?\s*(?:(\d+)\s*(?:m|min|mins|minutes))?/);
  if (tm && (tm[1] || tm[2])) time = (Number(tm[1] || 0) * 60) + Number(tm[2] || 0);
  return {
    title, source: safeUrl(url), servings: serv ? Number(serv[1]) : 4, time: time || 30,
    ingredients: ing.map(parseIngredient).filter(Boolean), steps
  };
}

// Try to read a recipe page's structured data. Many sites block this from
// the browser, so the fallback is pasting the text.
async function importUrl(url) {
  const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
  if (!res.ok) throw new Error('http');
  const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
  let found = null;
  const walk = n => {
    if (!n || found) return;
    if (Array.isArray(n)) return n.forEach(walk);
    if (typeof n !== 'object') return;
    const t = n['@type'];
    if (t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))) { found = n; return; }
    if (n['@graph']) walk(n['@graph']);
  };
  doc.querySelectorAll('script[type="application/ld+json"]').forEach(s => { try { walk(JSON.parse(s.textContent)); } catch {} });
  if (!found) throw new Error('none');
  const txt = v => typeof v === 'string' ? new DOMParser().parseFromString(v, 'text/html').body.textContent.trim() : '';
  const steps = [];
  const addSteps = x => {
    if (!x) return;
    if (typeof x === 'string') return x.split(/\n+/).forEach(s => s.trim() && steps.push(txt(s)));
    if (Array.isArray(x)) return x.forEach(addSteps);
    if (x.itemListElement) return addSteps(x.itemListElement);
    if (x.text) steps.push(txt(x.text));
  };
  addSteps(found.recipeInstructions);
  const dur = d => { const m = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(d || ''); return m ? Number(m[1] || 0) * 60 + Number(m[2] || 0) : 0; };
  let img = found.image;
  if (Array.isArray(img)) img = img[0];
  if (img && typeof img === 'object') img = img.url;
  const y = String(Array.isArray(found.recipeYield) ? found.recipeYield[0] : found.recipeYield || '').match(/\d+/);
  return {
    title: txt(found.name) || 'Imported recipe', source: url,
    servings: y ? Number(y[0]) : 4,
    time: dur(found.totalTime) || dur(found.cookTime) + dur(found.prepTime) || 30,
    ingredients: (Array.isArray(found.recipeIngredient) ? found.recipeIngredient : []).map(x => parseIngredient(txt(x))).filter(Boolean),
    steps, photo: typeof img === 'string' && img.startsWith('https://') ? img : '',
    cuisine: txt(Array.isArray(found.recipeCuisine) ? found.recipeCuisine[0] : found.recipeCuisine)
  };
}

function sheetEditor(r) {
  const isNew = !r || !r.id;
  r = { emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)], color: COLORS[Math.floor(Math.random() * COLORS.length)], meal: 'dinner', time: 30, cost: 2, servings: 4, diet: [], cuisine: '', ingredients: [], steps: [], notes: '', source: '', photo: '', ...r };
  // Imported data hasn't been through cleanRecipe yet, so coerce anything rendered unescaped
  r.time = clampInt(r.time, 0, 1440, 30); r.servings = clampInt(r.servings, 1, 50, 4); r.cost = clampInt(r.cost, 1, 3, 2);
  if (!MEALS.includes(r.meal)) r.meal = 'dinner';
  if (!/^#[0-9a-f]{6}$/i.test(r.color)) r.color = COLORS[0];
  r.photo = safePhoto(r.photo); r.source = safeUrl(r.source || '');
  r.diet = (Array.isArray(r.diet) ? r.diet : []).filter(d => d in DIETS);
  const lines = r.ingredients.map(i => ingLine(i));
  U.editor = { id: isNew ? null : r.id, photo: r.photo, diet: [...r.diet], aisles: Object.fromEntries(r.ingredients.map((i, n) => [lines[n], i[3]])), emoji: r.emoji, color: r.color };
  openSheet(`
    <h2>${isNew ? 'New recipe' : 'Edit recipe'}</h2>
    <form data-form="editor">
      <div style="display:flex;gap:12px;align-items:center;margin-top:12px">
        <label id="ed-thumb" class="thumb" style="width:96px;aspect-ratio:1;flex:none;cursor:pointer;font-size:2.6rem;${thumbStyle(r)}" aria-label="Add photo">${thumbInner(r)}<input type="file" accept="image/*" id="photo" hidden></label>
        <div style="flex:1">
          <label class="btn ghost sm" for="photo" style="margin-bottom:8px">${I.camera} ${r.photo ? 'Change photo' : 'Add photo'}</label>
          ${r.photo ? `<button type="button" class="link small" data-act="ed-nophoto">Remove photo</button>` : `<p class="muted small">Or pick an emoji below</p>`}
        </div>
      </div>
      <div class="chips" style="margin-top:12px">${EMOJIS.map(e => `<button type="button" class="chip ${e === r.emoji ? 'on' : ''}" data-act="ed-emoji" data-e="${e}">${e}</button>`).join('')}</div>
      <label class="field"><span>Title</span><input id="ed-title" required maxlength="120" value="${esc(r.title || '')}" placeholder="e.g. Grandma's lasagna"></label>
      <div class="grid3">
        <label class="field"><span>Meal</span><select id="ed-meal">${MEALS.map(m => `<option value="${m}" ${r.meal === m ? 'selected' : ''}>${cap(m)}</option>`).join('')}</select></label>
        <label class="field"><span>Minutes</span><input id="ed-time" type="number" min="0" max="1440" inputmode="numeric" value="${r.time}"></label>
        <label class="field"><span>Serves</span><input id="ed-serv" type="number" min="1" max="50" inputmode="numeric" value="${r.servings}"></label>
      </div>
      <div class="grid3">
        <label class="field"><span>Cost</span><select id="ed-cost">${[1, 2, 3].map(c => `<option value="${c}" ${r.cost === c ? 'selected' : ''}>${COST[c]}</option>`).join('')}</select></label>
        <label class="field" style="grid-column:span 2"><span>Cuisine</span><input id="ed-cuisine" maxlength="40" value="${esc(r.cuisine)}" placeholder="e.g. Italian"></label>
      </div>
      <div class="field"><span>Dietary</span><div class="chips wrap-chips">${Object.entries(DIETS).map(([k, l]) => `<button type="button" class="chip ${r.diet.includes(k) ? 'on' : ''}" data-act="ed-diet" data-d="${k}">${l}</button>`).join('')}</div></div>
      <label class="field"><span>Ingredients — one per line</span><textarea id="ed-ing" placeholder="2 cups flour&#10;1 tsp salt&#10;3 eggs">${esc(lines.join('\n'))}</textarea></label>
      <label class="field"><span>Steps — one per line</span><textarea id="ed-steps" style="min-height:160px" placeholder="Heat the oven to 350°F.&#10;Mix everything together.">${esc(r.steps.join('\n'))}</textarea></label>
      <label class="field"><span>Notes</span><textarea id="ed-notes" style="min-height:70px" placeholder="Tips, swaps, who loved it…">${esc(r.notes)}</textarea></label>
      <label class="field"><span>Source link</span><input id="ed-src" type="url" value="${esc(r.source)}" placeholder="https://…"></label>
      <button class="btn" type="submit">${I.check} Save recipe</button>
    </form>`, 'editor');
}
function refreshEditorThumb() {
  const t = $('#ed-thumb'), e = U.editor;
  if (!t || !e) return;
  const fake = { photo: e.photo, emoji: e.emoji, color: e.color };
  t.style.background = thumbStyle(fake).slice(11);
  t.innerHTML = thumbInner(fake) + '<input type="file" accept="image/*" id="photo" hidden>';
}

function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 720, k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', .72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img')); };
    img.src = url;
  });
}

function saveEditor() {
  const e = U.editor;
  const title = $('#ed-title').value.trim();
  if (!title) { toast('Give your recipe a title'); return; }
  const ingredients = $('#ed-ing').value.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const p = parseIngredient(l);
    if (p && e.aisles[l]) p[3] = e.aisles[l];
    return p;
  }).filter(Boolean);
  const old = e.id ? byId(e.id) : null;
  const r = cleanRecipe({
    ...(old || {}), id: e.id || uid(), title, emoji: e.emoji, color: e.color, photo: e.photo,
    meal: $('#ed-meal').value, time: $('#ed-time').value, servings: $('#ed-serv').value, cost: $('#ed-cost').value,
    cuisine: $('#ed-cuisine').value, diet: e.diet, ingredients,
    steps: $('#ed-steps').value.split('\n').map(s => s.replace(/^(step\s*\d+[:.)]?|\d+[.)])\s*/i, '')),
    notes: $('#ed-notes').value, source: $('#ed-src').value, created: old ? old.created : Date.now()
  });
  if (old) Object.assign(old, r); else S.recipes.unshift(r);
  delete U.scale[r.id];
  if (!save()) return;
  closeTop(() => {
    render();
    if (old) { renderFull(); toast('Recipe updated'); }
    else { U.seg = 'ing'; openFull({ type: 'recipe', id: r.id, fresh: true }); toast('Recipe saved'); }
  });
}

function sheetToPlan(id, week = U.week, sel = null, meal = null, servings = null) {
  const r = byId(id);
  const days = weekDays(week);
  const today = dayKey(new Date());
  sel = sel || [days.find(d => dayKey(d) >= today) ? dayKey(days.find(d => dayKey(d) >= today)) : dayKey(days[0])];
  meal = meal || r.meal;
  servings = servings || S.prefs.servings || r.servings;
  U.toPlan = { id, week, sel, meal, servings };
  openSheet(`
    <h2>Add to meal plan</h2>
    <p class="muted small">${esc(r.title)}</p>
    <div class="weekbar" style="margin:14px 0 4px"><button class="icon-btn" data-act="tp-week" data-d="-1" aria-label="Previous week">${I.back}</button><b class="small">${fmtDay(days[0], { month: 'short', day: 'numeric' })} – ${fmtDay(days[6], { month: 'short', day: 'numeric' })}</b><button class="icon-btn" data-act="tp-week" data-d="1" aria-label="Next week">${I.next}</button></div>
    <div class="daygrid">${days.map(d => `<button class="${sel.includes(dayKey(d)) ? 'on' : ''}" data-act="tp-day" data-k="${dayKey(d)}">${fmtDay(d, { weekday: 'narrow' })}<b>${d.getDate()}</b></button>`).join('')}</div>
    <div class="seg">${MEALS.map(m => `<button class="${meal === m ? 'on' : ''}" data-act="tp-meal" data-m="${m}">${cap(m)}</button>`).join('')}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px"><b>Servings</b><div class="stepper"><button data-act="tp-serv" data-d="-1" aria-label="Fewer">−</button><b>${servings}</b><button data-act="tp-serv" data-d="1" aria-label="More">+</button></div></div>
    <button class="btn" data-act="tp-save" ${sel.length ? '' : 'disabled style="opacity:.5"'}>${I.cal} Add to ${sel.length} day${sel.length === 1 ? '' : 's'}</button>`, 'toplan');
}

function sheetSlot(k, m, q = '') {
  U.slot = { k, m };
  const ql = q.toLowerCase();
  const list = S.recipes.filter(r => !ql || r.title.toLowerCase().includes(ql)).sort((a, b) => (b.meal === m) - (a.meal === m) || b.fav - a.fav);
  const d = new Date(k + 'T12:00');
  openSheet(`
    <h2>${cap(m)} · ${fmtDay(d, { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
    <label class="search" style="margin-top:12px">${I.search}<input id="slot-q" type="search" placeholder="Search your cookbook" value="${esc(q)}" autocomplete="off" aria-label="Search recipes"></label>
    <div id="slot-list">${list.map(r => pickRow(r, 'slot-pick')).join('') || '<p class="muted small" style="padding:12px">No matches.</p>'}</div>`, 'slot');
}

function sheetCollections(id) {
  const r = byId(id);
  openSheet(`
    <h2>Add to collection</h2><p class="muted small">${esc(r.title)}</p>
    <div style="margin:12px 0">${S.collections.map(c => `<button class="list-btn" data-act="coll-toggle" data-id="${esc(id)}" data-c="${esc(c.id)}"><span class="ic">${c.ids.includes(id) ? I.check : I.folder}</span><span style="flex:1"><b>${esc(c.name)}</b><small>${c.ids.length} recipes</small></span></button>`).join('') || '<p class="muted small">No collections yet. Create your first one below.</p>'}</div>
    <form data-form="coll-create" data-id="${esc(id)}" class="addbar"><input id="coll-name" maxlength="60" placeholder="New collection, e.g. Weeknight dinners" aria-label="Collection name"><button class="btn sm" type="submit">${I.plus}</button></form>`, 'coll');
}

function sheetMagic() {
  const m = U.magic || (U.magic = { time: S.prefs.time, budget: S.prefs.budget, diet: [...S.prefs.diet], servings: S.prefs.servings, meals: [...S.prefs.meals], keep: false, list: true });
  const opt = (act, val, cur, label) => `<button class="chip ${cur ? 'on' : ''}" data-act="${act}" data-v="${val}">${label}</button>`;
  const pool = n => S.recipes.filter(r => r.meal === n && matchMagic(r, m)).length;
  const days = weekDays(U.week);
  openSheet(`
    <h2>${I.spark.replace('<svg', '<svg style="width:22px;height:22px;vertical-align:-3px;color:var(--accent)"')} Magic Meal Plan</h2>
    <p class="muted small">Fill ${fmtDay(days[0], { month: 'short', day: 'numeric' })} – ${fmtDay(days[6], { month: 'short', day: 'numeric' })} with recipes from your cookbook that fit how you cook.</p>
    <div class="field"><span>Cook time</span><div class="chips wrap-chips">${[[20, '≤ 20 min'], [30, '≤ 30 min'], [45, '≤ 45 min'], [0, 'Any']].map(([v, l]) => opt('mg-time', v, m.time === v, l)).join('')}</div></div>
    <div class="field"><span>Budget</span><div class="chips wrap-chips">${[[1, '$ Thrifty'], [2, '$$ Moderate'], [3, '$$$ Anything']].map(([v, l]) => opt('mg-budget', v, m.budget === v, l)).join('')}</div></div>
    <div class="field"><span>Dietaries</span><div class="chips wrap-chips">${Object.entries(DIETS).map(([k, l]) => opt('mg-diet', k, m.diet.includes(k), l)).join('')}</div></div>
    <div class="field"><span>Meals</span><div class="chips wrap-chips">${MEALS.map(k => opt('mg-meal', k, m.meals.includes(k), `${cap(k)} <small style="opacity:.7">(${pool(k)})</small>`)).join('')}</div></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin:14px 0"><b>Serving size</b><div class="stepper"><button data-act="mg-serv" data-d="-1" aria-label="Fewer">−</button><b>${m.servings}</b><button data-act="mg-serv" data-d="1" aria-label="More">+</button></div></div>
    <div class="chips wrap-chips" style="margin-bottom:16px">
      ${opt('mg-keep', 1, m.keep, 'Keep meals already planned')}
      ${opt('mg-list', 1, m.list, 'Build grocery list')}
    </div>
    <button class="btn" data-act="mg-go">${I.spark} Create my plan</button>`, 'magic');
}
const matchMagic = (r, m) => (!m.time || (r.time && r.time <= m.time)) && r.cost <= m.budget && m.diet.every(d => r.diet.includes(d) || (d === 'veg' && r.diet.includes('vegan')));

function runMagic() {
  const m = U.magic;
  if (!m.meals.length) { toast('Pick at least one meal'); return; }
  const days = weekDays(U.week).map(dayKey);
  let added = 0; const missing = [];
  for (const meal of m.meals) {
    const pool = S.recipes.filter(r => r.meal === meal && matchMagic(r, m));
    if (!pool.length) { missing.push(meal); continue; }
    // Favorites appear twice in the draw so they come up more often
    let bag = [];
    const refill = () => { bag = shuffle([...pool, ...pool.filter(r => r.fav)]); };
    let last = null;
    for (const k of days) {
      const day = S.plan[k] || (S.plan[k] = { breakfast: [], lunch: [], dinner: [] });
      if (m.keep && day[meal].length) continue;
      if (!bag.length) refill();
      let i = bag.findIndex(r => r.id !== last);
      if (i < 0) i = 0;
      const r = bag.splice(i, 1)[0];
      bag = bag.filter(x => x.id !== r.id || pool.length < 3);
      day[meal] = [{ id: r.id, servings: m.servings }];
      last = r.id; added++;
    }
  }
  Object.assign(S.prefs, { time: m.time, budget: m.budget, diet: [...m.diet], servings: m.servings, meals: [...m.meals] });
  if (m.list && added) planToList(false);
  S.tab = 'plan';
  save();
  const go = () => {
    render(); $('#main').scrollTop = 0;
    toast(added ? `Planned ${added} meals${missing.length ? ` · no ${missing.join('/')} recipes matched` : ''}` : 'No recipes matched — try loosening your filters');
  };
  // Leave any open recipe page too, so the new plan is what you see
  closeTop(() => { if (U.full.length) { U.full = []; renderFull(); } go(); });
}

function sheetPrefs() {
  const p = S.prefs;
  openSheet(`
    <h2>Food preferences</h2><p class="muted small">Used as the starting point for your Magic Meal Plan and new plans.</p>
    <form data-form="prefs">
      <label class="field"><span>Your name</span><input id="pf-name" maxlength="40" value="${esc(p.name)}" placeholder="Home cook"></label>
      <div class="field"><span>Dietaries</span><div class="chips wrap-chips">${Object.entries(DIETS).map(([k, l]) => `<button type="button" class="chip ${p.diet.includes(k) ? 'on' : ''}" data-act="pf-diet" data-d="${k}">${l}</button>`).join('')}</div></div>
      <label class="field"><span>Usually cooking for</span><select id="pf-serv">${[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => `<option ${p.servings === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <button class="btn" type="submit">Save</button>
    </form>`, 'prefs');
}

// ---------- Actions ----------
function toggleFav(id) { const r = byId(id); if (!r) return; r.fav = !r.fav; save(); renderFull(); render(); toast(r.fav ? 'Added to favorites' : 'Removed from favorites'); }

function addToList(items, from) {
  for (const [qty, unit, name, aisle] of items) {
    if (/^water$/i.test(name)) continue;
    const k = name.toLowerCase() + '|' + unit;
    let g = S.groceries.find(x => x.k === k);
    if (!g) { g = { k, name, unit, qty: null, aisle, done: false, from: [] }; S.groceries.push(g); }
    if (qty != null) g.qty = (g.qty || 0) + qty;
    g.done = false;
    if (from && !g.from.includes(from)) g.from.push(from);
  }
}
function planToList(notify = true) {
  const entries = planEntries(weekDays(U.week));
  if (!entries.length) { toast('Nothing planned this week yet'); return; }
  // Rebuild items that came only from these recipes so adding the week twice doesn't double up;
  // anything already checked off stays checked
  const titles = new Set(entries.map(x => x.r.title));
  const fromPlan = g => g.from.length && g.from.every(f => titles.has(f));
  const doneKeys = new Set(S.groceries.filter(g => g.done && fromPlan(g)).map(g => g.k));
  S.groceries = S.groceries.filter(g => !fromPlan(g));
  for (const x of entries) addToList(x.r.ingredients.map(i => [i[0] == null ? null : i[0] * x.e.servings / x.r.servings, i[1], i[2], i[3]]), x.r.title);
  S.groceries.forEach(g => { if (doneKeys.has(g.k) && fromPlan(g)) g.done = true; });
  save();
  if (notify) { toast(`Groceries updated from ${entries.length} meals`); render(); }
}

function shareText(title, text) {
  if (navigator.share) navigator.share({ title, text }).catch(() => {});
  else navigator.clipboard?.writeText(text).then(() => toast('Copied to clipboard'), () => toast('Could not copy'));
}

let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
}

document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const a = el.dataset.act, id = el.dataset.id;
  switch (a) {
    case 'tab': S.tab = el.dataset.tab; U.coll = null; save(); render(); $('#main').scrollTop = 0; break;
    case 'add': sheetAdd(); break;
    case 'close-sheet': closeTop(); break;
    case 'back': closeTop(); break;
    case 'filter': U.filter = U.filter === el.dataset.f && el.dataset.f !== 'all' ? 'all' : el.dataset.f; if (el.classList.contains('coll')) U.coll = null; render(); break;
    case 'open': U.seg = 'ing'; openFull({ type: 'recipe', id, fresh: true }); break;
    case 'fav': toggleFav(id); break;
    case 'seg': U.seg = el.dataset.s; renderFull(); break;
    case 'scale': { const r = byId(id); U.scale[id] = Math.max(1, Math.min(50, (U.scale[id] || r.servings) + Number(el.dataset.d))); renderFull(); break; }
    case 'r-to-list': { const r = byId(id), k = (U.scale[id] || r.servings) / r.servings; addToList(r.ingredients.map(i => [i[0] == null ? null : i[0] * k, i[1], i[2], i[3]]), r.title); save(); toast(`${r.ingredients.length} items added to groceries`); break; }
    case 'recipe-menu': {
      const r = byId(id);
      openSheet(`<h2>${esc(r.title)}</h2>
        <button class="list-btn" data-act="edit" data-id="${esc(id)}"><span class="ic">${I.pen}</span><span><b>Edit recipe</b></span></button>
        <button class="list-btn" data-act="coll-add" data-id="${esc(id)}"><span class="ic">${I.folder}</span><span><b>Add to collection</b></span></button>
        <button class="list-btn" data-act="share" data-id="${esc(id)}"><span class="ic">${I.share}</span><span><b>Share recipe</b></span></button>
        <button class="list-btn" data-act="del" data-id="${esc(id)}"><span class="ic" style="color:#d33;background:rgba(220,50,50,.1)">${I.trash}</span><span><b style="color:#d33">Delete recipe</b></span></button>`, 'rmenu');
      break;
    }
    case 'edit': sheetEditor(byId(id)); break;
    case 'coll-add': sheetCollections(id); break;
    case 'share': {
      const r = byId(id);
      shareText(r.title, `${r.title}\nServes ${r.servings}${r.time ? ` · ${r.time} min` : ''}\n\nIngredients\n${r.ingredients.map(i => '• ' + ingLine(i)).join('\n')}\n\nMethod\n${r.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}${r.source ? `\n\nSource: ${r.source}` : ''}`);
      break;
    }
    case 'del': {
      const r = byId(id);
      if (!confirm(`Delete “${r.title}”? This can't be undone.`)) break;
      S.recipes = S.recipes.filter(x => x.id !== id);
      S.collections.forEach(c => { c.ids = c.ids.filter(x => x !== id); });
      for (const k in S.plan) for (const m of MEALS) S.plan[k][m] = S.plan[k][m].filter(x => x.id !== id);
      save(); closeTop(() => closeTop(() => { render(); toast('Recipe deleted'); }));
      break;
    }
    case 'cook': { const v = { type: 'cook', id, i: 0 }; openFull(v); break; }
    case 'cook-step': { const v = U.full[U.full.length - 1]; v.i = Math.max(0, v.i + Number(el.dataset.d)); renderFull(); $('#full').scrollTop = 0; break; }
    case 'cook-ing': {
      const r = byId(id), k = (U.scale[id] || r.servings) / r.servings;
      openSheet(`<h2>Ingredients</h2><p class="muted small">For ${U.scale[id] || r.servings} servings</p>${r.ingredients.map(i => `<div class="ing"><span class="q">${esc([fmtQty(i[0] == null ? null : i[0] * k), showUnit(i[1], i[0] == null ? null : i[0] * k)].filter(Boolean).join(' '))}</span><span>${esc(i[2])}</span></div>`).join('')}`, 'cooking');
      break;
    }
    case 'cook-done': S.cooked++; T.end = 0; clearInterval(T.int); T.int = null; save(); closeTop(); toast('Nice cooking! 🍽️'); break;
    case 'timer': {
      if (T.end && T.label === el.dataset.l) { T.end = 0; T.done = false; clearInterval(T.int); T.int = null; renderFull(); break; }
      clearInterval(T.int);
      T.end = Date.now() + Number(el.dataset.s) * 1000; T.label = el.dataset.l; T.done = false;
      T.int = setInterval(tick, 500);
      try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch {}
      renderFull();
      break;
    }

    case 'paste': sheetPaste('', $('#url')?.value || ''); break;
    case 'new': sheetEditor(null); break;
    case 'ed-emoji': U.editor.emoji = el.dataset.e; U.editor.photo = ''; el.parentNode.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === el)); refreshEditorThumb(); break;
    case 'ed-diet': { const d = el.dataset.d, l = U.editor.diet; const i = l.indexOf(d); i < 0 ? l.push(d) : l.splice(i, 1); el.classList.toggle('on'); break; }
    case 'ed-nophoto': U.editor.photo = ''; el.remove(); refreshEditorThumb(); break;

    case 'to-plan': sheetToPlan(id); break;
    case 'tp-week': { const t = U.toPlan; sheetToPlan(t.id, t.week + Number(el.dataset.d), [], t.meal, t.servings); break; }
    case 'tp-day': { const t = U.toPlan, k = el.dataset.k; const sel = t.sel.includes(k) ? t.sel.filter(x => x !== k) : [...t.sel, k]; sheetToPlan(t.id, t.week, sel.length ? sel : [], t.meal, t.servings); break; }
    case 'tp-meal': { const t = U.toPlan; sheetToPlan(t.id, t.week, t.sel, el.dataset.m, t.servings); break; }
    case 'tp-serv': { const t = U.toPlan; sheetToPlan(t.id, t.week, t.sel, t.meal, Math.max(1, Math.min(50, t.servings + Number(el.dataset.d)))); break; }
    case 'tp-save': {
      const t = U.toPlan;
      if (!t.sel.length) break;
      for (const k of t.sel) { const d = S.plan[k] || (S.plan[k] = { breakfast: [], lunch: [], dinner: [] }); if (d[t.meal].length < 6) d[t.meal].push({ id: t.id, servings: t.servings }); }
      save(); closeTop(); render();
      toast(`Added to ${t.sel.length} day${t.sel.length === 1 ? '' : 's'}`);
      break;
    }

    case 'week': U.week += Number(el.dataset.d); render(); break;
    case 'slot-add': sheetSlot(el.dataset.k, el.dataset.m); break;
    case 'slot-pick': {
      const { k, m } = U.slot, r = byId(id);
      const d = S.plan[k] || (S.plan[k] = { breakfast: [], lunch: [], dinner: [] });
      if (d[m].length < 6) d[m].push({ id, servings: S.prefs.servings || r.servings });
      save(); closeTop(); render();
      break;
    }
    case 'plan-rm': { const d = S.plan[el.dataset.k]; if (d) { d[el.dataset.m].splice(Number(el.dataset.i), 1); if (!MEALS.some(m => d[m].length)) delete S.plan[el.dataset.k]; } save(); render(); break; }
    case 'plan-clear':
      if (!confirm('Remove every meal from this week?')) break;
      weekDays(U.week).forEach(d => delete S.plan[dayKey(d)]); save(); render(); break;
    case 'plan-to-list': planToList(); if (S.tab !== 'list') { S.tab = 'list'; save(); render(); } break;

    case 'magic': sheetMagic(); break;
    case 'mg-time': U.magic.time = Number(el.dataset.v); sheetMagic(); break;
    case 'mg-budget': U.magic.budget = Number(el.dataset.v); sheetMagic(); break;
    case 'mg-diet': { const l = U.magic.diet, v = el.dataset.v, i = l.indexOf(v); i < 0 ? l.push(v) : l.splice(i, 1); sheetMagic(); break; }
    case 'mg-meal': { const l = U.magic.meals, v = el.dataset.v, i = l.indexOf(v); i < 0 ? l.push(v) : l.splice(i, 1); sheetMagic(); break; }
    case 'mg-serv': U.magic.servings = Math.max(1, Math.min(12, U.magic.servings + Number(el.dataset.d))); sheetMagic(); break;
    case 'mg-keep': U.magic.keep = !U.magic.keep; sheetMagic(); break;
    case 'mg-list': U.magic.list = !U.magic.list; sheetMagic(); break;
    case 'mg-go': runMagic(); break;

    case 'g-toggle': { const g = S.groceries.find(x => x.k === el.dataset.k); if (g) { g.done = !g.done; save(); render(); } break; }
    case 'g-rm': S.groceries = S.groceries.filter(x => x.k !== el.dataset.k); save(); render(); break;
    case 'list-menu':
      openSheet(`<h2>Grocery list</h2>
        <button class="list-btn" data-act="g-share"><span class="ic">${I.share}</span><span><b>Share list</b><small>Send it by text, email or notes</small></span></button>
        <button class="list-btn" data-act="g-clear-done"><span class="ic">${I.check}</span><span><b>Clear checked items</b></span></button>
        <button class="list-btn" data-act="g-clear"><span class="ic">${I.trash}</span><span><b>Clear entire list</b></span></button>`, 'gmenu');
      break;
    case 'g-share': {
      const txt = AISLES.map(a => { const l = S.groceries.filter(g => g.aisle === a && !g.done); return l.length ? `${a}\n${l.map(g => `☐ ${[fmtQty(g.qty), showUnit(g.unit, g.qty), g.name].filter(Boolean).join(' ')}`).join('\n')}` : ''; }).filter(Boolean).join('\n\n');
      shareText('Grocery list', txt || 'Everything is checked off!');
      break;
    }
    case 'g-clear-done': S.groceries = S.groceries.filter(g => !g.done); save(); closeTop(); render(); break;
    case 'g-clear': if (confirm('Clear the whole grocery list?')) { S.groceries = []; save(); closeTop(); render(); } break;

    case 'coll-new': openSheet(`<h2>New collection</h2><p class="muted small">Group recipes like “Weeknight dinners” or “Meal prep”.</p><form data-form="coll-create" class="addbar" style="margin-top:14px"><input id="coll-name" maxlength="60" placeholder="Collection name" aria-label="Collection name"><button class="btn sm" type="submit">${I.plus}</button></form>`, 'cnew'); setTimeout(() => $('#coll-name')?.focus(), 250); break;
    case 'coll-open': U.coll = id; U.filter = 'all'; render(); $('#main').scrollTop = 0; break;
    case 'coll-close': U.coll = null; render(); break;
    case 'coll-toggle': {
      const c = S.collections.find(x => x.id === el.dataset.c);
      if (c) { c.ids.includes(id) ? (c.ids = c.ids.filter(x => x !== id)) : c.ids.push(id); save(); sheetCollections(id); render(); }
      break;
    }
    case 'coll-menu': {
      const c = S.collections.find(x => x.id === U.coll);
      openSheet(`<h2>${esc(c.name)}</h2>
        <form data-form="coll-rename" class="addbar" style="margin-top:12px"><input id="coll-rename" maxlength="60" value="${esc(c.name)}" aria-label="Rename collection"><button class="btn sm" type="submit">Rename</button></form>
        <button class="list-btn" data-act="coll-del"><span class="ic" style="color:#d33;background:rgba(220,50,50,.1)">${I.trash}</span><span><b style="color:#d33">Delete collection</b><small>Recipes stay in your cookbook</small></span></button>`, 'cmenu');
      break;
    }
    case 'coll-del': S.collections = S.collections.filter(c => c.id !== U.coll); U.coll = null; save(); closeTop(); render(); break;

    case 'prefs': sheetPrefs(); break;
    case 'pf-diet': el.classList.toggle('on'); break;
    case 'export': {
      const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
      const a2 = document.createElement('a');
      a2.href = URL.createObjectURL(blob); a2.download = `simmer-backup-${dayKey(new Date())}.json`;
      document.body.appendChild(a2); a2.click(); a2.remove();
      setTimeout(() => URL.revokeObjectURL(a2.href), 1000);
      break;
    }
    case 'reset':
      if (!confirm('Erase all recipes, plans and lists and start over with the starter recipes?')) break;
      try { localStorage.removeItem(KEY); } catch {}
      S = load(); U.week = 0; U.coll = null; U.magic = null; save(); render(); toast('Started fresh');
      break;
  }
});

document.addEventListener('submit', async e => {
  const f = e.target.closest('[data-form]');
  if (!f) return;
  e.preventDefault();
  switch (f.dataset.form) {
    case 'import-url': {
      const raw = $('#url').value.trim();
      const url = safeUrl(raw.match(/https?:\/\/\S+/)?.[0] || raw);
      const msg = $('#import-msg');
      if (!url) { msg.innerHTML = '<p class="note warn">Paste a full link that starts with https://</p>'; break; }
      msg.innerHTML = '<p class="note">Looking for the recipe…</p>';
      try {
        const r = await importUrl(url);
        sheetEditor(r);
        toast('Recipe found — check it and save');
      } catch {
        const social = /instagram|tiktok|facebook|youtube|youtu\.be|pinterest|threads|x\.com|twitter/.test(url);
        msg.innerHTML = `<p class="note warn">${social
          ? 'Social apps don\'t let other apps read their posts directly. Open the post, copy its caption or description, and paste it below.'
          : 'This site doesn\'t allow recipes to be read directly from the browser. Copy the recipe from the page and paste it below — Simmer will sort it into ingredients and steps.'}</p>
          <button class="btn" data-act="paste">${I.paste} Paste recipe text</button>`;
      }
      break;
    }
    case 'paste': {
      const text = $('#paste').value.trim();
      if (!text) { toast('Paste some recipe text first'); break; }
      const r = parseRecipeText(text, $('#paste-src').value);
      sheetEditor(r);
      toast(`Found ${r.ingredients.length} ingredients and ${r.steps.length} steps`);
      break;
    }
    case 'editor': saveEditor(); break;
    case 'list-add': {
      const v = $('#gi').value.trim();
      if (!v) break;
      const p = parseIngredient(v);
      if (p) { addToList([p]); save(); render(); setTimeout(() => $('#gi')?.focus(), 0); }
      break;
    }
    case 'coll-create': {
      const name = $('#coll-name').value.trim();
      if (!name) break;
      const c = { id: 'c-' + Date.now().toString(36), name: name.slice(0, 60), ids: f.dataset.id ? [f.dataset.id] : [] };
      S.collections.push(c); save(); render();
      if (f.dataset.id) sheetCollections(f.dataset.id); else closeTop();
      toast(`Created “${c.name}”`);
      break;
    }
    case 'coll-rename': {
      const c = S.collections.find(x => x.id === U.coll), name = $('#coll-rename').value.trim();
      if (c && name) { c.name = name.slice(0, 60); save(); closeTop(); render(); }
      break;
    }
    case 'prefs': {
      S.prefs.name = $('#pf-name').value.trim().slice(0, 40);
      S.prefs.servings = clampInt($('#pf-serv').value, 1, 12, 2);
      S.prefs.diet = [...f.querySelectorAll('[data-act="pf-diet"].on')].map(b => b.dataset.d);
      U.magic = null; save(); closeTop(); render(); toast('Preferences saved');
      break;
    }
  }
});

document.addEventListener('input', e => {
  if (e.target.id === 'q') { U.q = e.target.value; renderGrid(); }
  if (e.target.id === 'slot-q') {
    const q = e.target.value.toLowerCase(), m = U.slot.m;
    const list = S.recipes.filter(r => !q || r.title.toLowerCase().includes(q)).sort((a, b) => (b.meal === m) - (a.meal === m) || b.fav - a.fav);
    $('#slot-list').innerHTML = list.map(r => pickRow(r, 'slot-pick')).join('') || '<p class="muted small" style="padding:12px">No matches.</p>';
  }
});

document.addEventListener('change', async e => {
  if (e.target.id === 'photo' && e.target.files[0]) {
    try { U.editor.photo = await readPhoto(e.target.files[0]); refreshEditorThumb(); }
    catch { toast("Couldn't read that photo"); }
  }
  if (e.target.id === 'restore' && e.target.files[0]) {
    try {
      const data = JSON.parse(await e.target.files[0].text());
      if (!data || !Array.isArray(data.recipes)) throw new Error('bad');
      if (!confirm(`Replace everything on this device with the backup (${data.recipes.length} recipes)?`)) return;
      const next = cleanState({ ...data, seeded: true });
      S = next; U.coll = null; U.magic = null; save(); render(); toast('Backup restored');
    } catch { toast("That file isn't a Simmer backup"); }
    e.target.value = '';
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('[role="button"][data-act]')) e.target.click();
  if (e.key === 'Escape' && (U.sheet || U.full.length)) closeTop();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && U.full[U.full.length - 1]?.type === 'cook') holdWake();
});

// ---------- Start ----------
render();

// Opened from the phone's share sheet (see share_target in manifest.json)
(() => {
  const p = new URLSearchParams(location.search);
  const url = p.get('url'), text = p.get('text'), title = p.get('title');
  if (!url && !text) return;
  history.replaceState(null, '', location.pathname);
  const link = safeUrl(url || (text || '').match(/https?:\/\/\S+/)?.[0] || '');
  const body = [title, text].filter(Boolean).join('\n');
  if (body.split('\n').length > 4) sheetPaste(body, link);
  else sheetAdd(link);
})();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {}));
}
