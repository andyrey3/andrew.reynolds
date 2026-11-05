// Kernel: a vertical feed of one-minute ideas from great books.
// Swipe up for the next idea, double-tap to like, save the best ones into
// stashes, and hit a small daily reading goal. Everything is stored in
// localStorage on this device; nothing is sent anywhere.

const KEY = 'kernel-v1';
const GOALS = [3, 5, 10];
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const USER_ID_RE = /^u-[a-z0-9]{4,24}$/;
const STASH_ID_RE = /^(later|s-[a-z0-9]{4,24})$/;
const MAX = { title: 90, body: 700, src: 80, author: 60, stash: 40 };

const TOPIC = Object.fromEntries(TOPICS.map(t => [t.id, t]));
const SOURCE = Object.fromEntries(SOURCES.map(s => [s.id, s]));
const IDEA = Object.fromEntries(IDEAS.map(i => [i.id, i]));
const BY_SOURCE = {};
for (const i of IDEAS) (BY_SOURCE[i.src] ||= []).push(i);

const ICON = {
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/></svg>',
  heartFill: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  saveFill: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3.5 5 5.5 5 11a5 5 0 0 1-10 0c0-2.4 1-4 2.3-5.2.2 1.7 1 2.9 2.2 3.4C11 8.6 11.2 5 12 2z"/></svg>'
};

// ---------- Helpers ----------
const $ = s => document.querySelector(s);
const str = (v, max) => typeof v === 'string' ? v.slice(0, max) : '';
const clean = (v, max) => str(v, max).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim();
const pad = n => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const uid = p => p + '-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'hue') el.style.setProperty('--h', String(Number(v) || 0));
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
  return el;
}
// Icons are fixed strings from ICON above, never user data
function icon(name) {
  const t = document.createElement('template');
  t.innerHTML = ICON[name];
  return t.content.firstElementChild;
}
function hashStr(s) {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
  return x >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------- State ----------
function fresh() {
  return {
    onboarded: false, topics: [], goal: 5,
    read: {}, liked: [], seen: { date: '', ids: [] }, days: {},
    stashes: [{ id: 'later', name: 'Read later', ideas: [], created: Date.now() }],
    mine: [], daily: { date: '', ids: [] }
  };
}
let S = fresh();

function sanitize(raw) {
  const out = fresh();
  if (!raw || typeof raw !== 'object') return out;
  out.onboarded = raw.onboarded === true;
  out.topics = Array.isArray(raw.topics) ? [...new Set(raw.topics.filter(t => TOPIC[t]))] : [];
  out.goal = GOALS.includes(raw.goal) ? raw.goal : 5;

  const mine = Array.isArray(raw.mine) ? raw.mine.slice(0, 500) : [];
  const seenIds = new Set();
  for (const m of mine) {
    if (!m || typeof m !== 'object' || !USER_ID_RE.test(m.id) || seenIds.has(m.id)) continue;
    const title = clean(m.title, MAX.title), body = clean(m.body, MAX.body);
    if (!title || !body) continue;
    seenIds.add(m.id);
    out.mine.push({
      id: m.id, title, body, mine: true,
      topic: TOPIC[m.topic] ? m.topic : 'thinking',
      srcTitle: clean(m.srcTitle, MAX.src), srcAuthor: clean(m.srcAuthor, MAX.author),
      created: Number.isFinite(m.created) ? m.created : Date.now()
    });
  }
  const valid = id => typeof id === 'string' && (IDEA[id] || seenIds.has(id));
  const ids = (a, n = 5000) => Array.isArray(a) ? [...new Set(a.filter(valid))].slice(0, n) : [];

  if (raw.read && typeof raw.read === 'object') {
    for (const [id, t] of Object.entries(raw.read)) if (valid(id) && Number.isFinite(t)) out.read[id] = t;
  }
  out.liked = ids(raw.liked);
  if (raw.seen && DAY_RE.test(raw.seen.date)) out.seen = { date: raw.seen.date, ids: ids(raw.seen.ids, 1000) };
  if (raw.daily && DAY_RE.test(raw.daily.date)) out.daily = { date: raw.daily.date, ids: ids(raw.daily.ids, 10) };
  if (raw.days && typeof raw.days === 'object') {
    const keys = Object.keys(raw.days).filter(k => DAY_RE.test(k)).sort().slice(-400);
    for (const k of keys) { const n = Number(raw.days[k]); if (Number.isInteger(n) && n > 0 && n < 100000) out.days[k] = n; }
  }
  if (Array.isArray(raw.stashes)) {
    const st = [], sids = new Set();
    for (const s of raw.stashes.slice(0, 100)) {
      if (!s || typeof s !== 'object' || !STASH_ID_RE.test(s.id) || sids.has(s.id)) continue;
      const name = clean(s.name, MAX.stash) || 'Untitled';
      sids.add(s.id);
      st.push({ id: s.id, name, ideas: ids(s.ideas), created: Number.isFinite(s.created) ? s.created : Date.now() });
    }
    if (!sids.has('later')) st.unshift(out.stashes[0]);
    out.stashes = st;
  }
  return out;
}
function load() {
  try { S = sanitize(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch { S = fresh(); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast('Couldn’t save — storage is full or blocked'); }
}

const getIdea = id => IDEA[id] || S.mine.find(m => m.id === id) || null;
const allIdeas = () => [...IDEAS, ...S.mine];
const isLiked = id => S.liked.includes(id);
const isSaved = id => S.stashes.some(s => s.ideas.includes(id));
const todayCount = () => S.seen.date === dayKey() ? S.seen.ids.length : 0;
const srcLine = i => i.mine ? (i.srcTitle ? i.srcTitle + (i.srcAuthor ? ' · ' + i.srcAuthor : '') : 'Your idea') : SOURCE[i.src].title + ' · ' + SOURCE[i.src].author;

function streak() {
  const d = new Date();
  if ((S.days[dayKey(d)] || 0) < S.goal) d.setDate(d.getDate() - 1);
  let n = 0;
  while ((S.days[dayKey(d)] || 0) >= S.goal) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function bestStreak() {
  const keys = Object.keys(S.days).filter(k => S.days[k] >= S.goal).sort();
  let best = 0, run = 0, prev = null;
  for (const k of keys) {
    const d = new Date(k + 'T12:00:00');
    run = prev && Math.round((d - prev) / 864e5) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = d;
  }
  return best;
}

// Counts an idea toward today's goal the first time it's on screen for a moment today
function markSeen(id) {
  const today = dayKey();
  if (S.seen.date !== today) S.seen = { date: today, ids: [] };
  if (!S.read[id]) S.read[id] = Date.now();
  if (S.seen.ids.includes(id)) return;
  S.seen.ids.push(id);
  S.days[today] = S.seen.ids.length;
  save();
  updateGoalPill();
  if (S.seen.ids.length === S.goal) {
    const n = streak();
    toast(`🔥 Daily goal done! ${plural(n, 'day')} streak`);
  }
}

// ---------- Feed ordering ----------
let feedSeed = Date.now() >>> 0;
function declump(list) {
  // Avoid showing ideas from the same book back to back when there's another choice
  const out = [], rest = list.slice();
  while (rest.length) {
    const last = out[out.length - 1];
    let k = 0;
    if (last) { const j = rest.slice(0, 6).findIndex(i => (i.src || i.id) !== (last.src || last.id)); if (j > 0) k = j; }
    out.push(rest.splice(k, 1)[0]);
  }
  return out;
}
function forYou() {
  const r = rng(feedSeed);
  const fav = new Set(S.topics);
  const scored = allIdeas().map(i => ({ i, s: r() + (fav.has(i.topic) ? .8 : 0) - (S.read[i.id] ? 3 : 0) - (i.mine ? .4 : 0) }));
  scored.sort((a, b) => b.s - a.s);
  return declump(scored.map(x => x.i));
}
function dailyIdeas() {
  const today = dayKey();
  if (S.daily.date !== today || S.daily.ids.length !== S.goal) {
    const r = rng(hashStr(today + S.goal));
    const fav = new Set(S.topics.length ? S.topics : TOPICS.map(t => t.id));
    const scored = IDEAS.map(i => ({ id: i.id, s: r() + (fav.has(i.topic) ? 1 : 0) + (S.read[i.id] ? 0 : 1.2) }));
    scored.sort((a, b) => b.s - a.s);
    const picked = [], srcs = new Set();
    for (const x of scored) { if (picked.length >= S.goal) break; if (srcs.has(IDEA[x.id].src)) continue; srcs.add(IDEA[x.id].src); picked.push(x.id); }
    S.daily = { date: today, ids: picked };
    save();
  }
  return S.daily.ids.map(getIdea).filter(Boolean);
}
const topicIdeas = t => allIdeas().filter(i => i.topic === t);

// ---------- UI state ----------
const UI = { tab: 'home', mode: 'foryou', q: '', editId: null };
const stack = [];
let ignorePop = false;
let homeEl = null, homeScroll = 0;

// ---------- Cards ----------
function goalRing(n, goal, size = 26) {
  const r = 10, c = 2 * Math.PI * r, p = Math.min(1, n / goal);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', size); svg.setAttribute('height', size);
  const mk = (stroke, dash) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    el.setAttribute('cx', 12); el.setAttribute('cy', 12); el.setAttribute('r', r);
    el.setAttribute('fill', 'none'); el.setAttribute('stroke', stroke); el.setAttribute('stroke-width', 3.2);
    if (dash != null) { el.setAttribute('stroke-dasharray', `${dash} ${c}`); el.setAttribute('stroke-linecap', 'round'); el.setAttribute('transform', 'rotate(-90 12 12)'); }
    return el;
  };
  svg.append(mk('var(--surface-2)'), mk('var(--accent)', c * p));
  return svg;
}
function cover(src, size = '') {
  return h('div', { class: 'cover ' + size, hue: TOPIC[src.topic].hue + (hashStr(src.id) % 40) - 20, 'aria-hidden': 'true' }, size === 'sm' ? '' : src.title);
}

function railBtn(cls, ic, label, onclick) {
  return h('button', { class: cls, 'aria-label': label, onclick }, h('span', { class: 'ring' }, icon(ic)), label);
}
function syncCard(card, id) {
  const lb = card.querySelector('[data-act="like"]'), sb = card.querySelector('[data-act="save"]');
  const liked = isLiked(id), saved = isSaved(id);
  lb.classList.toggle('liked', liked); lb.querySelector('.ring').replaceChildren(icon(liked ? 'heartFill' : 'heart'));
  lb.setAttribute('aria-pressed', liked);
  sb.classList.toggle('saved', saved); sb.querySelector('.ring').replaceChildren(icon(saved ? 'saveFill' : 'save'));
  sb.lastChild.textContent = saved ? 'Saved' : 'Save';
}
function syncAll(id) {
  const roots = [document];
  if (homeEl && !homeEl.isConnected) roots.push(homeEl);
  for (const root of roots) for (const c of root.querySelectorAll('.card[data-id]')) if (c.dataset.id === id) syncCard(c, id);
}

function toggleLike(id, force) {
  const on = force ?? !isLiked(id);
  S.liked = S.liked.filter(x => x !== id);
  if (on) S.liked.unshift(id);
  save(); syncAll(id);
}

function card(idea, pos) {
  const t = TOPIC[idea.topic];
  const src = idea.mine ? null : SOURCE[idea.src];
  const n = src ? BY_SOURCE[src.id].indexOf(idea) + 1 : 0;
  const el = h('article', { class: 'card', hue: t.hue, 'data-id': idea.id, 'aria-label': idea.title },
    S.read[idea.id] ? h('div', { class: 'readmark' }, icon('check'), 'Read') : null,
    h('div', { class: 'card-in' },
      h('button', { class: 'pill', onclick: () => openTopic(t.id) }, t.emoji + ' ' + t.name),
      h('h2', { class: 'title' }, idea.title),
      h('p', { class: 'body' }, idea.body),
      h('div', { class: 'meta' }, ['1 min read', pos || (src ? `Idea ${n} of ${BY_SOURCE[src.id].length}` : 'Written by you')].join(' · ')),
      src
        ? h('button', { class: 'srcbtn', onclick: () => pushPage({ type: 'source', id: src.id }) }, cover(src, 'sm'), h('div', null, h('div', { class: 't' }, src.title), h('div', { class: 'a' }, src.author)), icon('chev'))
        : h('div', { class: 'srcbtn' }, h('div', null, h('div', { class: 't' }, idea.srcTitle || 'Your idea'), idea.srcAuthor ? h('div', { class: 'a' }, idea.srcAuthor) : null))
    ),
    h('div', { class: 'rail' },
      railBtn('', 'heart', 'Like', () => toggleLike(idea.id)),
      railBtn('', 'save', 'Save', () => openSaveSheet(idea.id)),
      railBtn('', 'share', 'Share', () => shareIdea(idea)),
      railBtn('', 'more', 'More', () => openMoreSheet(idea))
    )
  );
  const [lb, sb] = el.querySelectorAll('.rail button');
  lb.dataset.act = 'like'; sb.dataset.act = 'save';
  syncCard(el, idea.id);

  // Double-tap anywhere that isn't a button to like
  let lastTap = 0;
  el.addEventListener('pointerup', e => {
    if (e.target.closest('button') || e.pointerType === 'mouse') return;
    const now = Date.now();
    if (now - lastTap < 300) { lastTap = 0; likeBurst(el, idea.id, e); } else lastTap = now;
  });
  el.addEventListener('dblclick', e => { if (!e.target.closest('button')) { window.getSelection()?.removeAllRanges(); likeBurst(el, idea.id, e); } });
  return el;
}
function likeBurst(el, id, e) {
  toggleLike(id, true);
  const b = icon('heartFill'); b.classList.add('burst');
  const r = el.getBoundingClientRect();
  if (e && e.clientX) { b.style.left = (e.clientX - r.left) + 'px'; b.style.top = (e.clientY - r.top) + 'px'; }
  el.append(b);
  setTimeout(() => b.remove(), 800);
}

function endCard(emoji, title, text, buttons) {
  return h('article', { class: 'card endcard', hue: 38 },
    h('div', { class: 'big' }, emoji), h('h2', null, title), h('p', null, text),
    h('div', { class: 'row' }, buttons));
}

// Builds a snapping feed; ideas count toward your goal after ~1.2s on screen
function feed(ideas, { start = 0, end, top, numbered } = {}) {
  const wrap = h('div', { class: 'feedwrap' });
  const sc = h('div', { class: 'feed', tabindex: '-1' });
  ideas.forEach((i, k) => sc.append(card(i, numbered ? `${k + 1}/${ideas.length}` : '')));
  if (end) sc.append(end);
  const timers = new Map();
  const io = new IntersectionObserver(entries => {
    for (const en of entries) {
      const id = en.target.dataset.id;
      if (!id) continue;
      if (en.isIntersecting) { if (!timers.has(id)) timers.set(id, setTimeout(() => { timers.delete(id); if (en.target.isConnected) markSeen(id); }, 1200)); }
      else { clearTimeout(timers.get(id)); timers.delete(id); }
    }
  }, { root: sc, threshold: .65 });
  sc.querySelectorAll('.card[data-id]').forEach(c => io.observe(c));
  wrap.append(sc);
  if (top) wrap.append(top);
  if (start) requestAnimationFrame(() => { sc.scrollTop = sc.clientHeight * start; });
  return wrap;
}

// ---------- Home ----------
function goalPill() {
  const n = todayCount();
  return h('button', { class: 'goalpill', 'aria-label': `${n} of ${S.goal} ideas today. Open progress.`, onclick: () => setTab('you') },
    goalRing(n, S.goal), h('span', { class: 'gp-n' }, `${Math.min(n, S.goal)}/${S.goal}`),
    h('span', { class: 'gp-s', 'aria-hidden': 'true' }, '🔥' + streak()));
}
function updateGoalPill() {
  const roots = [document]; if (homeEl && !homeEl.isConnected) roots.push(homeEl);
  for (const r of roots) for (const p of r.querySelectorAll('.goalpill')) p.replaceWith(goalPill());
}
function buildHome() {
  const top = h('div', { class: 'feedtop' },
    h('div', { class: 'seg', role: 'tablist' },
      h('button', { class: UI.mode === 'foryou' ? 'on' : '', role: 'tab', 'aria-selected': UI.mode === 'foryou', onclick: () => setMode('foryou') }, 'For you'),
      h('button', { class: UI.mode === 'daily' ? 'on' : '', role: 'tab', 'aria-selected': UI.mode === 'daily', onclick: () => setMode('daily') }, 'Daily ' + S.goal)),
    goalPill());
  let ideas, end;
  if (UI.mode === 'daily') {
    ideas = dailyIdeas();
    end = endCard('✅', 'That’s today’s set', `Come back tomorrow for ${S.goal} fresh ideas. Your streak: ${plural(streak(), 'day')}.`,
      [h('button', { class: 'btn', onclick: () => setMode('foryou') }, 'Keep reading'), h('button', { class: 'btn ghost', onclick: () => setTab('you') }, 'See progress')]);
  } else {
    ideas = forYou();
    end = endCard('🎉', 'You’ve seen it all', 'That’s every idea in the library. Shuffle for a second pass, or write one of your own.',
      [h('button', { class: 'btn', onclick: () => { feedSeed = (feedSeed * 31 + 7) >>> 0; refreshHome(); } }, 'Shuffle again'), h('button', { class: 'btn ghost', onclick: () => setTab('create') }, 'Write an idea')]);
  }
  homeEl = feed(ideas, { top, end, numbered: UI.mode === 'daily' });
  homeScroll = 0;
}
function setMode(m) { UI.mode = m; refreshHome(); }
function refreshHome() { buildHome(); if (UI.tab === 'home') renderMain(); }

// ---------- Explore ----------
function bookTile(src) {
  return h('button', { class: 'book', onclick: () => pushPage({ type: 'source', id: src.id }) }, cover(src, 'lg'), h('div', { class: 't' }, src.title), h('div', { class: 'a' }, src.author));
}
function ideaRow(idea, onclick, extra) {
  return h('div', { class: 'row' },
    h('div', { class: 'bar', hue: TOPIC[idea.topic].hue }),
    h('button', { class: 'grow', onclick }, h('div', { class: 't' }, idea.title), h('div', { class: 's' }, srcLine(idea))),
    extra || icon('chev'));
}
function searchIdeas(q) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  return allIdeas().filter(i => {
    const hay = (i.title + ' ' + i.body + ' ' + srcLine(i) + ' ' + TOPIC[i.topic].name).toLowerCase();
    return words.every(w => hay.includes(w));
  });
}
function renderExplore() {
  const results = h('div');
  const body = h('div');
  const showResults = () => {
    const q = UI.q.trim();
    body.classList.toggle('hidden', !!q);
    results.replaceChildren();
    if (!q) return;
    const ideas = searchIdeas(q);
    const books = SOURCES.filter(s => (s.title + ' ' + s.author).toLowerCase().includes(q.toLowerCase()));
    if (books.length) results.append(h('div', { class: 'section' }, h('h2', null, 'Books')), h('div', { class: 'shelf' }, books.map(bookTile)));
    results.append(h('div', { class: 'section' }, h('h2', null, plural(ideas.length, 'idea'))));
    results.append(ideas.length
      ? h('div', { class: 'list' }, ideas.slice(0, 60).map((i, k) => ideaRow(i, () => openReader('“' + q + '”', ideas, k))))
      : h('div', { class: 'empty' }, h('div', { class: 'big' }, '🔍'), 'No ideas match that. Try another word.'));
  };
  const input = h('input', { type: 'search', placeholder: 'Search ideas, books, authors', value: UI.q, 'aria-label': 'Search', enterkeyhint: 'search' });
  input.addEventListener('input', () => { UI.q = input.value; showResults(); });

  const fav = new Set(S.topics);
  const forYouBooks = SOURCES.filter(s => fav.has(s.topic));
  body.append(
    h('div', { class: 'section' }, h('h2', null, 'Topics')),
    h('div', { class: 'topicgrid' }, [...TOPICS].sort((a, b) => fav.has(b.id) - fav.has(a.id)).map(t =>
      h('button', { class: 'topic', hue: t.hue, onclick: () => openTopic(t.id) }, h('span', { class: 'e' }, t.emoji), h('div', null, h('b', null, t.name), h('br'), h('small', null, plural(topicIdeas(t.id).length, 'idea')))))),
    forYouBooks.length ? [h('div', { class: 'section' }, h('h2', null, 'Books for you')), h('div', { class: 'shelf' }, forYouBooks.map(bookTile))] : null,
    h('div', { class: 'section' }, h('h2', null, 'All books'), h('span', { class: 'muted small' }, SOURCES.length)),
    h('div', { class: 'list' }, [...SOURCES].sort((a, b) => a.title.localeCompare(b.title)).map(s => {
      const done = BY_SOURCE[s.id].filter(i => S.read[i.id]).length;
      return h('button', { class: 'row', onclick: () => pushPage({ type: 'source', id: s.id }) }, cover(s, 'sm'),
        h('div', { class: 'grow' }, h('div', { class: 't' }, s.title), h('div', { class: 's' }, `${s.author} · ${done}/${BY_SOURCE[s.id].length} read`)), icon('chev'));
    }))
  );
  const page = h('div', { class: 'wrap' }, h('div', { class: 'head' }, h('h1', null, 'Explore')),
    h('label', { class: 'search' }, icon('search'), input), results, body);
  showResults();
  return page;
}
function openTopic(id) {
  const t = TOPIC[id];
  const ideas = topicIdeas(id).sort((a, b) => (!!S.read[a.id] - !!S.read[b.id]));
  openReader(t.emoji + ' ' + t.name, ideas, 0);
}
function openReader(title, ideas, start = 0) { pushPage({ type: 'reader', title, ids: ideas.map(i => i.id), start }); }

// ---------- Library ----------
function renderLibrary() {
  const quick = h('div', { class: 'list' },
    h('button', { class: 'row', onclick: () => pushPage({ type: 'list', which: 'liked' }) }, h('span', { class: 'ico' }, '❤️'), h('div', { class: 'grow' }, h('div', { class: 't' }, 'Liked')), h('span', { class: 'n' }, S.liked.length), icon('chev')),
    h('button', { class: 'row', onclick: () => pushPage({ type: 'list', which: 'mine' }) }, h('span', { class: 'ico' }, '✍️'), h('div', { class: 'grow' }, h('div', { class: 't' }, 'My ideas')), h('span', { class: 'n' }, S.mine.length), icon('chev')),
    h('button', { class: 'row', onclick: () => pushPage({ type: 'list', which: 'history' }) }, h('span', { class: 'ico' }, '🕒'), h('div', { class: 'grow' }, h('div', { class: 't' }, 'History')), h('span', { class: 'n' }, Object.keys(S.read).length), icon('chev')));
  const stashes = h('div', { class: 'list' }, S.stashes.map(s =>
    h('button', { class: 'row', onclick: () => pushPage({ type: 'stash', id: s.id }) }, h('span', { class: 'ico' }, s.id === 'later' ? '📌' : '🗂️'),
      h('div', { class: 'grow' }, h('div', { class: 't' }, s.name), h('div', { class: 's' }, s.ideas.length ? getIdea(s.ideas[0])?.title || '' : 'Empty')), h('span', { class: 'n' }, s.ideas.length), icon('chev'))));
  return h('div', { class: 'wrap' },
    h('div', { class: 'head' }, h('h1', null, 'Library')),
    quick,
    h('div', { class: 'section' }, h('h2', null, 'Stashes'), h('button', { class: 'linkbtn', onclick: () => newStashSheet() }, '+ New stash')),
    stashes,
    h('p', { class: 'muted small', style: 'margin-top:14px' }, 'Stashes are collections of ideas. Tap the bookmark on any idea to save it to one.'));
}

function listPage(title, sub, ideas, { empty, rowExtra, actions } = {}) {
  return h('div', { class: 'wrap' },
    backbar(),
    h('div', { class: 'head' }, h('div', null, h('h1', null, title), sub ? h('p', { class: 'muted', style: 'margin-top:4px' }, sub) : null)),
    actions || null,
    ideas.length
      ? h('div', { class: 'list', style: 'margin-top:14px' }, ideas.map((i, k) => ideaRow(i, () => openReader(title, ideas, k), rowExtra && rowExtra(i))))
      : h('div', { class: 'empty' }, h('div', { class: 'big' }, empty[0]), empty[1]));
}
function backbar(extra) {
  return h('div', { class: 'backbar' }, h('button', { class: 'iconbtn', 'aria-label': 'Back', onclick: popPage }, icon('back')), h('div', { style: 'flex:1' }), extra || null);
}

function renderStash(id) {
  const s = S.stashes.find(x => x.id === id);
  if (!s) return h('div', { class: 'wrap' }, backbar(), h('div', { class: 'empty' }, 'This stash no longer exists.'));
  const ideas = s.ideas.map(getIdea).filter(Boolean);
  const remove = i => { s.ideas = s.ideas.filter(x => x !== i.id); save(); syncAll(i.id); renderLayer(); toast('Removed'); };
  const page = listPage(s.name, plural(ideas.length, 'idea'), ideas, {
    empty: ['\ud83d\udccc', 'Nothing here yet. Tap Save on an idea to add it.'],
    rowExtra: i => h('button', { class: 'iconbtn', 'aria-label': 'Remove from stash', onclick: () => remove(i) }, icon('close')),
    actions: ideas.length ? h('button', { class: 'btn', onclick: () => openReader(s.name, ideas, 0) }, 'Read all') : null
  });
  page.querySelector('.backbar').append(h('button', { class: 'iconbtn', 'aria-label': 'Stash options', onclick: () => stashMenu(s) }, icon('more')));
  return page;
}
function stashMenu(s) {
  const name = h('input', { value: s.name, maxlength: MAX.stash, 'aria-label': 'Stash name' });
  openSheet('Stash options', h('div', null,
    h('label', { class: 'field' }, h('span', null, 'Name'), name),
    h('button', { class: 'btn block', onclick: () => { const v = clean(name.value, MAX.stash); if (!v) return; s.name = v; save(); closeSheet(); renderLayer(); toast('Renamed'); } }, 'Save name'),
    s.id === 'later' ? null : h('button', { class: 'btn danger block', style: 'margin-top:10px', onclick: () => {
      if (!confirm(`Delete “${s.name}”? The ideas stay in the library.`)) return;
      const ids = s.ideas; S.stashes = S.stashes.filter(x => x !== s); save(); closeSheet(); ids.forEach(syncAll); popPage(); toast('Stash deleted');
    } }, icon('trash'), 'Delete stash')));
}

function renderList(which) {
  if (which === 'liked') {
    return listPage('Liked', 'Ideas you’ve hearted', S.liked.map(getIdea).filter(Boolean), { empty: ['❤️', 'Double-tap an idea to like it.'] });
  }
  if (which === 'history') {
    const ideas = Object.entries(S.read).sort((a, b) => b[1] - a[1]).map(([id]) => getIdea(id)).filter(Boolean);
    return listPage('History', 'Most recent first', ideas, { empty: ['🕒', 'Ideas you read will show up here.'] });
  }
  const ideas = [...S.mine].sort((a, b) => b.created - a.created);
  return listPage('My ideas', 'Notes and takeaways you’ve written', ideas, {
    empty: ['✍️', 'Write down an idea from something you read, watched or heard.'],
    rowExtra: i => h('button', { class: 'iconbtn', 'aria-label': 'Edit', onclick: () => editIdea(i.id) }, icon('edit')),
    actions: h('button', { class: 'btn', onclick: () => setTab('create') }, icon('plus'), 'New idea')
  });
}

function renderSource(id) {
  const s = SOURCE[id];
  const ideas = BY_SOURCE[id];
  const done = ideas.filter(i => S.read[i.id]).length;
  const t = TOPIC[s.topic];
  return h('div', { class: 'wrap' },
    backbar(),
    h('div', { class: 'srchead' }, cover(s, 'lg'),
      h('div', null, h('button', { class: 'chip', onclick: () => openTopic(t.id) }, t.emoji + ' ' + t.name),
        h('h1', { style: 'margin-top:10px' }, s.title), h('p', { class: 'muted' }, `${s.author} · ${s.year < 1000 ? 'c. ' + s.year + ' AD' : s.year}`))),
    h('p', null, s.blurb),
    h('div', { style: 'display:flex;gap:10px;margin-top:16px;align-items:center;flex-wrap:wrap' },
      h('button', { class: 'btn', onclick: () => openReader(s.title, ideas, Math.max(0, ideas.findIndex(i => !S.read[i.id]))) }, icon('book'), `Read ${plural(ideas.length, 'idea')}`),
      h('span', { class: 'muted small' }, `${done} of ${ideas.length} read · about ${ideas.length} min`)),
    h('div', { class: 'section' }, h('h2', null, 'Key ideas')),
    h('div', { class: 'list' }, ideas.map((i, k) => h('div', { class: 'row' },
      h('span', { class: 'ico', style: 'font-size:.9rem;font-weight:800' }, S.read[i.id] ? icon('check') : String(k + 1)),
      h('button', { class: 'grow', onclick: () => openReader(s.title, ideas, k) }, h('div', { class: 't' }, i.title), h('div', { class: 's' }, i.body)),
      icon('chev')))),
    h('p', { class: 'muted small', style: 'margin-top:16px' }, 'Summaries are written in our own words. Pick up the book for the full story.'));
}

// ---------- Create / edit ----------
function editIdea(id) { UI.editId = id; setTab('create'); }
function renderCreate() {
  const editing = UI.editId ? S.mine.find(m => m.id === UI.editId) : null;
  const f = editing || { title: '', body: '', topic: S.topics[0] || 'thinking', srcTitle: '', srcAuthor: '' };
  const counter = (el, max) => { const c = h('span', { class: 'count' }, `${el.value.length}/${max}`); el.addEventListener('input', () => { c.textContent = `${el.value.length}/${max}`; check(); }); return c; };
  const title = h('input', { maxlength: MAX.title, value: f.title, placeholder: 'e.g. Write drunk, edit sober' });
  const body = h('textarea', { maxlength: MAX.body, placeholder: 'Explain the idea in your own words, in a few sentences.' });
  body.value = f.body;
  const topic = h('select', null, TOPICS.map(t => h('option', { value: t.id, selected: t.id === f.topic }, t.emoji + ' ' + t.name)));
  const srcT = h('input', { maxlength: MAX.src, value: f.srcTitle, placeholder: 'Book, podcast, article… (optional)' });
  const srcA = h('input', { maxlength: MAX.author, value: f.srcAuthor, placeholder: 'Author (optional)' });
  const stash = h('select', null, h('option', { value: '' }, 'Don’t add to a stash'), S.stashes.map(s => h('option', { value: s.id }, s.name)));
  const go = h('button', { class: 'btn block' }, editing ? 'Save changes' : 'Publish to my feed');
  const check = () => { go.disabled = !clean(title.value, MAX.title) || clean(body.value, MAX.body).length < 20; };
  go.addEventListener('click', () => {
    const data = { title: clean(title.value, MAX.title), body: clean(body.value, MAX.body), topic: TOPIC[topic.value] ? topic.value : 'thinking', srcTitle: clean(srcT.value, MAX.src), srcAuthor: clean(srcA.value, MAX.author) };
    if (!data.title || data.body.length < 20) return;
    let id;
    if (editing) { Object.assign(editing, data); id = editing.id; }
    else { id = uid('u'); S.mine.push({ id, ...data, mine: true, created: Date.now() }); }
    const st = S.stashes.find(s => s.id === stash.value);
    if (st && !st.ideas.includes(id)) st.ideas.unshift(id);
    save(); UI.editId = null; homeEl = null;
    toast(editing ? 'Idea updated' : 'Idea published ✨');
    setTab('library'); pushPage({ type: 'list', which: 'mine' });
  });
  check();
  return h('div', { class: 'wrap' },
    h('div', { class: 'head' }, h('h1', null, editing ? 'Edit idea' : 'Write an idea'),
      editing ? h('button', { class: 'linkbtn', onclick: () => { UI.editId = null; renderMain(); } }, 'Cancel') : null),
    h('p', { class: 'muted', style: 'margin:-6px 0 18px' }, 'Capture a takeaway so it shows up in your feed alongside the library.'),
    h('label', { class: 'field' }, h('span', null, 'Title', counter(title, MAX.title)), title),
    h('label', { class: 'field' }, h('span', null, 'The idea', counter(body, MAX.body)), body),
    h('label', { class: 'field' }, h('span', null, 'Topic'), topic),
    h('label', { class: 'field' }, h('span', null, 'Where it’s from'), srcT),
    h('label', { class: 'field' }, srcA),
    editing ? null : h('label', { class: 'field' }, h('span', null, 'Also save to'), stash),
    go,
    editing ? h('button', { class: 'btn danger block', style: 'margin-top:10px', onclick: () => deleteMine(editing.id) }, icon('trash'), 'Delete idea') : null);
}
function deleteMine(id) {
  if (!confirm('Delete this idea? This can’t be undone.')) return;
  S.mine = S.mine.filter(m => m.id !== id);
  S.liked = S.liked.filter(x => x !== id);
  delete S.read[id];
  S.stashes.forEach(s => { s.ideas = s.ideas.filter(x => x !== id); });
  save(); UI.editId = null; homeEl = null;
  document.querySelectorAll('.card[data-id]').forEach(c => { if (c.dataset.id === id) c.remove(); });
  toast('Idea deleted');
  if (UI.tab === 'create') { setTab('library'); pushPage({ type: 'list', which: 'mine' }); } else renderLayer();
}

// ---------- You ----------
function renderYou() {
  const n = todayCount();
  const days = [];
  const d = new Date(); d.setDate(d.getDate() - 6);
  for (let k = 0; k < 7; k++) {
    const key = dayKey(d), c = S.days[key] || 0;
    days.push(h('div', null, h('div', { class: 'd' }, d.toLocaleDateString(undefined, { weekday: 'narrow' })),
      h('div', { class: 'dot ' + (c >= S.goal ? 'full' : c ? 'part' : '') + (k === 6 ? ' today' : ''), title: `${key}: ${c}` }, c >= S.goal ? icon('check') : c || '')));
    d.setDate(d.getDate() + 1);
  }
  const saved = new Set(S.stashes.flatMap(s => s.ideas)).size;
  const fav = new Set(S.topics);
  const chips = h('div', { class: 'chips' }, TOPICS.map(t => h('button', {
    class: 'chip' + (fav.has(t.id) ? ' on' : ''), 'aria-pressed': fav.has(t.id),
    onclick: () => { S.topics = fav.has(t.id) ? S.topics.filter(x => x !== t.id) : [...S.topics, t.id]; S.daily.date = ''; save(); homeEl = null; renderMain(); }
  }, t.emoji + ' ' + t.name)));
  const goals = h('div', { class: 'goals' }, GOALS.map(g => h('button', { class: g === S.goal ? 'on' : '', onclick: () => { S.goal = g; S.daily.date = ''; save(); homeEl = null; renderMain(); } }, h('b', null, g), h('span', null, g === 3 ? 'Casual' : g === 5 ? 'Regular' : 'Serious'))));

  const file = h('input', { type: 'file', accept: 'application/json,.json', class: 'hidden' });
  file.addEventListener('change', () => importData(file.files[0]));

  return h('div', { class: 'wrap' },
    h('div', { class: 'head' }, h('h1', null, 'Your progress')),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('b', null, '🔥 ' + streak()), h('span', null, 'Day streak')),
      h('div', { class: 'stat', style: 'display:flex;align-items:center;gap:12px' }, goalRing(n, S.goal, 44), h('div', null, h('b', null, `${Math.min(n, S.goal)}/${S.goal}`), h('span', null, 'Today'))),
      h('div', { class: 'stat' }, h('b', null, Object.keys(S.read).length), h('span', null, `of ${allIdeas().length} ideas read`)),
      h('div', { class: 'stat' }, h('b', null, bestStreak()), h('span', null, 'Best streak')),
      h('div', { class: 'stat' }, h('b', null, S.liked.length), h('span', null, 'Liked')),
      h('div', { class: 'stat' }, h('b', null, saved), h('span', null, 'Saved'))),
    h('div', { class: 'section' }, h('h2', null, 'This week')),
    h('div', { class: 'week' }, days),
    h('div', { class: 'section' }, h('h2', null, 'Daily goal')),
    goals,
    h('p', { class: 'muted small', style: 'margin-top:8px' }, 'Read this many ideas a day to keep your streak alive. About a minute each.'),
    h('div', { class: 'section' }, h('h2', null, 'Your interests')),
    chips,
    h('p', { class: 'muted small', style: 'margin-top:8px' }, 'Your feed and daily set lean toward these topics.'),
    h('div', { class: 'section' }, h('h2', null, 'Your data')),
    h('div', { class: 'list' },
      h('button', { class: 'row', onclick: exportData }, h('span', { class: 'ico' }, '⬇️'), h('div', { class: 'grow' }, h('div', { class: 't' }, 'Export backup'), h('div', { class: 's' }, 'Download your stashes, ideas and progress'))),
      h('button', { class: 'row', onclick: () => file.click() }, h('span', { class: 'ico' }, '⬆️'), h('div', { class: 'grow' }, h('div', { class: 't' }, 'Import backup'), h('div', { class: 's' }, 'Replace this device’s data with a backup file'))),
      h('button', { class: 'row', onclick: resetAll }, h('span', { class: 'ico' }, '🗑️'), h('div', { class: 'grow' }, h('div', { class: 't' }, 'Reset everything'), h('div', { class: 's' }, 'Start over from scratch')))),
    file,
    h('p', { class: 'muted small', style: 'margin-top:18px' }, `Kernel has ${IDEAS.length} ideas from ${SOURCES.length} books. Each is a short summary in our own words, credited to its author. Your data stays on this device.`));
}
function exportData() {
  const blob = new Blob([JSON.stringify({ app: 'kernel', version: 1, exported: new Date().toISOString(), data: S }, null, 2)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `kernel-backup-${dayKey()}.json` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Backup downloaded');
}
function importData(f) {
  if (!f) return;
  if (f.size > 5e6) { toast('That file is too big to be a Kernel backup'); return; }
  f.text().then(txt => {
    const raw = JSON.parse(txt);
    if (!raw || raw.app !== 'kernel' || typeof raw.data !== 'object') throw new Error('not kernel');
    if (!confirm('Replace everything on this device with this backup?')) return;
    S = sanitize(raw.data); S.onboarded = true; save(); homeEl = null; renderMain(); toast('Backup restored');
  }).catch(() => toast('That doesn’t look like a Kernel backup'));
}
function resetAll() {
  if (!confirm('Erase your stashes, ideas, likes and streak? This can’t be undone.')) return;
  S = fresh(); save(); homeEl = null; stack.length = 0; renderLayer(); showOnboarding();
}

// ---------- Sheets ----------
function openSheet(title, content) {
  const sh = $('#sheet');
  sh.replaceChildren(h('div', { class: 'grab' }), h('h2', null, title), content);
  sh.classList.add('show'); $('#scrim').classList.add('show');
  sh.setAttribute('aria-label', title);
  setTimeout(() => sh.querySelector('button, input')?.focus({ preventScroll: true }), 50);
}
function closeSheet() { $('#sheet').classList.remove('show'); $('#scrim').classList.remove('show'); }

function openSaveSheet(id) {
  const draw = () => {
    const list = h('div', { class: 'list' }, S.stashes.map(s => {
      const on = s.ideas.includes(id);
      return h('button', { class: 'row', 'aria-pressed': on, onclick: () => {
        if (on) s.ideas = s.ideas.filter(x => x !== id); else s.ideas.unshift(id);
        save(); syncAll(id); draw(); toast(on ? `Removed from ${s.name}` : `Saved to ${s.name}`);
      } }, h('span', { class: 'check' + (on ? ' on' : '') }, on ? icon('check') : ''), h('div', { class: 'grow' }, h('div', { class: 't' }, s.name), h('div', { class: 's' }, plural(s.ideas.length, 'idea'))));
    }));
    const input = h('input', { placeholder: 'New stash name', maxlength: MAX.stash, 'aria-label': 'New stash name', enterkeyhint: 'done' });
    const add = () => {
      const name = clean(input.value, MAX.stash); if (!name) return;
      S.stashes.push({ id: uid('s'), name, ideas: [id], created: Date.now() }); save(); syncAll(id); draw(); toast(`Saved to ${name}`);
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
    openSheet('Save to a stash', h('div', null, list,
      h('div', { class: 'newstash' }, input, h('button', { class: 'btn', onclick: add }, 'Create')),
      h('button', { class: 'btn ghost block', style: 'margin-top:12px', onclick: closeSheet }, 'Done')));
  };
  draw();
}
function newStashSheet() {
  const input = h('input', { placeholder: 'e.g. Ideas for work', maxlength: MAX.stash, 'aria-label': 'Stash name', enterkeyhint: 'done' });
  const add = () => {
    const name = clean(input.value, MAX.stash); if (!name) return;
    S.stashes.push({ id: uid('s'), name, ideas: [], created: Date.now() }); save(); closeSheet(); renderMain(); toast('Stash created');
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
  openSheet('New stash', h('div', null, h('label', { class: 'field' }, h('span', null, 'Name'), input), h('button', { class: 'btn block', onclick: add }, 'Create stash')));
}
function openMoreSheet(idea) {
  const row = (ic, t, fn) => h('button', { class: 'row', onclick: () => { closeSheet(); fn(); } }, h('span', { class: 'ico' }, icon(ic)), h('div', { class: 'grow' }, h('div', { class: 't' }, t)));
  const t = TOPIC[idea.topic];
  openSheet(idea.title, h('div', { class: 'list' },
    idea.mine ? row('edit', 'Edit idea', () => { clearStack(); editIdea(idea.id); }) : row('book', 'About ' + SOURCE[idea.src].title, () => pushPage({ type: 'source', id: idea.src })),
    row('search', 'More on ' + t.name, () => openTopic(t.id)),
    row('copy', 'Copy text', () => copyText(ideaText(idea))),
    idea.mine ? row('trash', 'Delete idea', () => deleteMine(idea.id)) : null));
}

const ideaText = i => `${i.title}\n\n${i.body}\n\n— ${srcLine(i).replace(' · ', ', ')}`;
function copyText(text) {
  (navigator.clipboard?.writeText(text) || Promise.reject()).then(() => toast('Copied to clipboard'), () => toast('Couldn’t copy on this device'));
}
function shareIdea(i) {
  if (navigator.share) navigator.share({ title: i.title, text: ideaText(i) }).catch(e => { if (e?.name !== 'AbortError') copyText(ideaText(i)); });
  else copyText(ideaText(i));
}

let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- Navigation ----------
function setTab(tab) {
  if (tab !== 'create') UI.editId = null;
  clearStack();
  UI.tab = tab;
  renderMain();
}
function clearStack() {
  if (!stack.length) return;
  const n = stack.length; stack.length = 0;
  ignorePop = true; history.go(-n);
  renderLayer();
}
function pushPage(p) {
  closeSheet();
  stack.push(p);
  history.pushState({ kernel: stack.length }, '');
  renderLayer();
}
function popPage() { if (stack.length) history.back(); }
window.addEventListener('popstate', () => {
  if (ignorePop) { ignorePop = false; return; }
  if ($('#sheet').classList.contains('show')) closeSheet();
  if (stack.length) { stack.pop(); renderLayer(); }
});

function renderLayer() {
  const layer = $('#layer');
  const p = stack[stack.length - 1];
  if (!p) { layer.classList.add('hidden'); layer.replaceChildren(); $('#main').removeAttribute('inert'); return; }
  let el;
  if (p.type === 'reader') {
    const ideas = p.ids.map(getIdea).filter(Boolean);
    const top = h('div', { class: 'feedtop' }, h('div', { class: 'feedtitle' }, h('button', { class: 'iconbtn', 'aria-label': 'Back', onclick: popPage }, icon('back')), h('span', null, p.title)), goalPill());
    const end = endCard('📚', 'All done here', `You’ve reached the end of ${plural(ideas.length, 'idea')}.`, [h('button', { class: 'btn', onclick: popPage }, 'Back'), h('button', { class: 'btn ghost', onclick: () => setTab('explore') }, 'Explore more')]);
    el = feed(ideas, { start: p.start, top, end, numbered: true });
    p.start = 0;
  } else if (p.type === 'source') el = renderSource(p.id);
  else if (p.type === 'stash') el = renderStash(p.id);
  else el = renderList(p.which);
  layer.replaceChildren(el);
  layer.scrollTop = 0;
  layer.classList.remove('hidden');
  $('#main').setAttribute('inert', '');
}

function renderMain() {
  const main = $('#main');
  if (homeEl && homeEl.isConnected) homeScroll = homeEl.querySelector('.feed').scrollTop;
  document.querySelectorAll('nav.tabs button').forEach(b => { b.classList.toggle('on', b.dataset.tab === UI.tab); b.setAttribute('aria-current', b.dataset.tab === UI.tab ? 'page' : 'false'); });
  main.style.overflowY = UI.tab === 'home' ? 'hidden' : 'auto';
  if (UI.tab === 'home') {
    if (!homeEl) buildHome();
    main.replaceChildren(homeEl);
    const sc = homeEl.querySelector('.feed');
    sc.scrollTop = homeScroll;
    updateGoalPill();
  } else {
    const el = UI.tab === 'explore' ? renderExplore() : UI.tab === 'library' ? renderLibrary() : UI.tab === 'create' ? renderCreate() : renderYou();
    main.replaceChildren(el);
    main.scrollTop = 0;
  }
}

// ---------- Onboarding ----------
function showOnboarding() {
  const ob = $('#onboard');
  const picked = new Set(S.topics);
  let step = 0;
  const draw = () => {
    let content, ready, label;
    if (step === 0) {
      ready = picked.size >= 3;
      label = ready ? 'Continue' : `Pick ${3 - picked.size} more`;
      content = [
        h('img', { class: 'logo', src: 'icon-192.png', alt: '' }),
        h('h1', null, 'Get smarter, one minute at a time'),
        h('p', { class: 'muted', style: 'margin:10px 0 24px' }, 'Kernel turns great books into bite-sized ideas you can swipe through. Pick at least 3 topics you’re curious about.'),
        h('div', { class: 'topicgrid' }, TOPICS.map(t => h('button', {
          class: 'topic' + (picked.has(t.id) ? ' on' : ''), hue: t.hue, 'aria-pressed': picked.has(t.id),
          onclick: () => { picked.has(t.id) ? picked.delete(t.id) : picked.add(t.id); draw(); }
        }, picked.has(t.id) ? h('span', { class: 'tick' }, icon('check')) : null, h('span', { class: 'e' }, t.emoji), h('b', null, t.name))))
      ];
    } else {
      ready = true; label = 'Start reading';
      content = [
        h('h1', null, 'Set a daily goal'),
        h('p', { class: 'muted', style: 'margin:10px 0 24px' }, 'Each idea takes about a minute. Hit your goal every day to build a streak.'),
        h('div', { class: 'goals' }, GOALS.map(g => h('button', { class: g === S.goal ? 'on' : '', onclick: () => { S.goal = g; draw(); } }, h('b', null, g), h('span', null, `${g} min a day`))))
      ];
    }
    const go = h('button', { class: 'btn block', disabled: !ready, onclick: () => {
      if (step === 0) { step = 1; draw(); return; }
      S.topics = [...picked]; S.onboarded = true; S.daily.date = ''; save();
      ob.classList.add('hidden'); homeEl = null; UI.tab = 'home'; renderMain();
    } }, label);
    ob.replaceChildren(h('div', { class: 'wrap' }, step ? h('button', { class: 'iconbtn', 'aria-label': 'Back', onclick: () => { step = 0; draw(); }, style: 'margin-bottom:12px' }, icon('back')) : null, content), h('div', { class: 'foot' }, go));
    ob.scrollTop = 0;
  };
  ob.classList.remove('hidden');
  draw();
}

// ---------- Boot ----------
document.querySelectorAll('nav.tabs button').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.tab === UI.tab && !stack.length && UI.tab === 'home') { homeEl?.querySelector('.feed')?.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  setTab(b.dataset.tab);
}));
$('#scrim').addEventListener('click', closeSheet);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#sheet').classList.contains('show')) { closeSheet(); return; }
  if (e.target.closest('input, textarea, select') || $('#sheet').classList.contains('show') || !$('#onboard').classList.contains('hidden')) return;
  const top = stack[stack.length - 1];
  const sc = top ? (top.type === 'reader' ? $('#layer .feed') : null) : UI.tab === 'home' ? $('#main .feed') : null;
  if (!sc) { if (e.key === 'Escape' && stack.length) popPage(); return; }
  if (['ArrowDown', 'j', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); sc.scrollBy({ top: sc.clientHeight, behavior: 'smooth' }); }
  else if (['ArrowUp', 'k', 'PageUp'].includes(e.key)) { e.preventDefault(); sc.scrollBy({ top: -sc.clientHeight, behavior: 'smooth' }); }
  else if (e.key === 'Escape' && stack.length) popPage();
});

load();
renderMain();
if (!S.onboarded) showOnboarding();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
