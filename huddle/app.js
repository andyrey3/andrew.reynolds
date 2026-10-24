// Huddle — fantasy football rankings, start/sit, trade analyzer, mock
// drafts and lineup help. Settings, your roster and drafts are stored in
// localStorage on this device; nothing is sent anywhere.

const KEY = 'huddle-v1';
const DEFAULTS = {
  fmt: 'half', teams: 12, tab: 'rank', rankPos: 'ALL',
  team: [], out: [], ss: [], ssAdj: {}, ssNeed: 'balanced',
  give: [], get: [], draft: null, setup: { teams: 12, slot: 0 },
  rankMode: 'season', availOnly: false, league: null
};
let S = load();

function load() {
  const fresh = JSON.parse(JSON.stringify(DEFAULTS));
  try { return Object.assign(fresh, JSON.parse(localStorage.getItem(KEY)) || {}); }
  catch { return fresh; }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const f1 = n => n.toFixed(1);
const sum = a => a.reduce((s, x) => s + x, 0);
const X_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>';

const FMT = { ppr: 'PPR', half: 'Half PPR', std: 'Standard' };
const POS = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
const FLEX = ['RB', 'WR', 'TE'];
const SLOTS = ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DST'];
// Week-to-week spread by position, as a share of the projection
const CV = { QB: .28, RB: .42, WR: .48, TE: .52, K: .38, DST: .55 };
// Replacement level = the Nth best player at the position, N = teams × this
const REPL = { QB: 1, RB: 2.5, WR: 3, TE: 1.1, K: 1, DST: 1 };
// Most leagues draft QBs and TEs a little later than their raw value
const MARKET = { QB: .62, RB: 1.05, WR: 1, TE: .85, K: .02, DST: .03 };
const ROUNDS = 15;
const CAP = { QB: 2, RB: 6, WR: 7, TE: 2, K: 1, DST: 1 };

const DATE_WEEK = (() => {
  const days = Math.floor((Date.now() - new Date(2026, 8, 8)) / 864e5);
  return days < 0 ? 0 : Math.min(18, Math.floor(days / 7) + 1);
})();
const hasLive = () => !!(LIVE && LIVE.rows && LIVE.rows.length);
const weekLabel = () => {
  const w = hasLive() ? LIVE.week : DATE_WEEK;
  return w ? `Week ${w}` : 'Preseason';
};

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const norm = s => s.toLowerCase().replace(/[^a-z ]/g, '').replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '').replace(/\s+/g, ' ').trim();
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
}

/* ---------- Live data (Sleeper) ---------- */

// Sleeper's public API. Weekly projections, injuries, trending adds and
// league rosters are cached in localStorage; data.js stays the fallback.
const API = 'https://api.sleeper.app';
const LIVE_KEY = 'huddle-live';
const LIVE_MAX_AGE = 3 * 36e5;
const OUT_STATUS = ['Out', 'IR', 'PUP', 'Sus', 'NA'];
const INJ_SHORT = { Questionable: 'Q', Doubtful: 'D', Out: 'Out', IR: 'IR', PUP: 'PUP', Sus: 'Susp', NA: 'NA' };
let LIVE = null;      // { at, season, week, rows, trending, notes }
let LIVE_BUSY = false, LIVE_ERR = '';
let LEAGUES = null;   // league picker results while connecting
let PLAYERS = [], BY_ID = {}, SID = {}, PLAYING = new Set();

try { LIVE = JSON.parse(localStorage.getItem(LIVE_KEY)); } catch {}
function saveLive() { try { localStorage.setItem(LIVE_KEY, JSON.stringify(LIVE)); } catch {} }

async function getJSON(path) {
  const res = await fetch(API + path);
  if (!res.ok) throw new Error(`Sleeper returned ${res.status}`);
  return res.json();
}

// Row: [sleeperId, name, pos, team, ppr, half, std, opponent, injury]
function parseProjections(list) {
  const rows = [];
  const r1 = n => Math.round((+n || 0) * 10) / 10;
  for (const it of Array.isArray(list) ? list : []) {
    const pl = it.player || {}, st = it.stats || {};
    let pos = pl.position || (pl.fantasy_positions || [])[0];
    if (pos === 'DEF') pos = 'DST';
    if (!POS.includes(pos) || st.pts_ppr == null) continue;
    const name = pos === 'DST' ? `${pl.last_name || it.player_id} D/ST` : `${pl.first_name || ''} ${pl.last_name || ''}`.trim();
    rows.push([String(it.player_id), name, pos, it.team || pl.team || '', r1(st.pts_ppr), r1(st.pts_half_ppr ?? st.pts_ppr), r1(st.pts_std ?? st.pts_ppr), it.opponent || '', pl.injury_status || '']);
  }
  return rows;
}

// Rebuild the player list from data.js, then layer live data on top: new
// teams, injuries, weekly projections, and players data.js doesn't have
function applyLive() {
  PLAYERS = RAW.map(r => {
    const [name, pos, team, ppr, rec] = r.split('|');
    return { id: slug(name + '-' + pos), name, pos, team, ppr: +ppr, rec: +rec || 0 };
  });
  SID = {};
  PLAYING = new Set();
  M = null;
  const index = {};
  for (const p of PLAYERS) index[p.pos === 'DST' ? 'DST|' + p.team : norm(p.name) + '|' + p.pos] = p;
  const keep = new Set(S.league ? S.league.mine : []);
  const rows = (LIVE && LIVE.rows || []).concat(S.league && S.league.names || []);

  for (const [sid, name, pos, team, ppr, half, std, opp, inj] of rows) {
    if (SID[sid]) continue;
    let p = index[pos === 'DST' ? 'DST|' + sid : norm(name) + '|' + pos];
    if (!p) {
      if (!(ppr >= 3) && !keep.has(sid)) continue;
      const id = slug(name + '-' + pos);
      if (index['id|' + id]) continue;
      p = { id, name, pos, team, ppr: (ppr || 0) * 17, rec: Math.max(0, (ppr || 0) - (std || 0)) * 17, est: true };
      PLAYERS.push(p);
      index['id|' + id] = p;
    }
    p.sid = sid;
    if (team) p.team = team;
    p.inj = inj || '';
    if (ppr != null) { p.live = { ppr, half, std, opp }; PLAYING.add(p.team); }
    SID[sid] = p;
  }
  BY_ID = Object.fromEntries(PLAYERS.map(p => [p.id, p]));
}

async function fetchRosters() {
  const L = S.league;
  const rosters = await getJSON(`/v1/league/${L.id}/rosters`) || [];
  const mine = rosters.find(r => r.owner_id === L.userId || (r.co_owners || []).includes(L.userId));
  L.mine = (mine && mine.players || []).map(String);
  L.rostered = rosters.flatMap(r => r.players || []).map(String);

  // Players without a projection this week (injured, on bye) still need a
  // name. Sleeper's full player list is large, so keep names for every
  // rostered player and only fetch it again when new players show up.
  const known = new Set((LIVE && LIVE.rows || []).map(r => r[0]).concat((L.names || []).map(r => r[0])));
  if (L.rostered.some(sid => !known.has(sid)) && Date.now() - (L.namesAt || 0) > 36e5) {
    const all = await getJSON('/v1/players/nfl');
    const names = [];
    for (const sid of L.rostered) {
      const pl = all[sid];
      if (!pl) continue;
      const pos = pl.position === 'DEF' ? 'DST' : pl.position;
      if (!POS.includes(pos)) continue;
      const name = pos === 'DST' ? `${pl.last_name || sid} D/ST` : pl.full_name || `${pl.first_name || ''} ${pl.last_name || ''}`.trim();
      names.push([sid, name, pos, pl.team || '', null, null, null, '', pl.injury_status || '']);
    }
    L.names = names;
    L.namesAt = Date.now();
  }
}

// Make My Team match your Sleeper roster
function applyLeagueTeam() {
  const L = S.league;
  const ids = L.mine.map(sid => SID[sid] && SID[sid].id).filter(Boolean);
  L.missing = L.mine.length - ids.length;
  S.team = ids;
  S.out = S.out.filter(id => ids.includes(id));
}

async function refreshLive() {
  if (LIVE_BUSY) return;
  LIVE_BUSY = true; LIVE_ERR = '';
  refreshMenu();
  const next = { at: Date.now(), season: '', week: 0, rows: [], trending: [], notes: [] };
  try {
    const state = await getJSON('/v1/state/nfl');
    next.season = String(state.season || new Date().getFullYear());
    next.week = state.season_type === 'regular' ? +(state.week || state.display_week) || 0 : 0;
    if (next.week) {
      try {
        const q = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].map(p => 'position[]=' + p).join('&');
        next.rows = parseProjections(await getJSON(`/projections/nfl/${next.season}/${next.week}?season_type=regular&${q}`));
      } catch { next.notes.push('weekly projections'); }
    }
    try {
      const t = await getJSON('/v1/players/nfl/trending/add?lookback_hours=24&limit=50');
      next.trending = (t || []).map(x => [String(x.player_id), +x.count || 0]);
    } catch { next.notes.push('trending players'); }
    LIVE = next;
    saveLive();
    if (S.league) {
      try { await fetchRosters(); } catch { LIVE.notes.push('league rosters'); }
    }
    applyLive();
    if (S.league) applyLeagueTeam();
    cleanIds();
    save();
  } catch (e) {
    LIVE_ERR = e instanceof TypeError ? "Couldn't reach Sleeper. Check your connection." : e.message;
  }
  LIVE_BUSY = false;
  render();
  refreshMenu();
}

async function findLeagues(username) {
  const user = await getJSON('/v1/user/' + encodeURIComponent(username.trim()));
  if (!user || !user.user_id) throw new Error(`No Sleeper user named "${username.trim()}".`);
  const season = LIVE && LIVE.season || String(new Date().getFullYear());
  const leagues = await getJSON(`/v1/user/${user.user_id}/leagues/nfl/${season}`) || [];
  if (!leagues.length) throw new Error(`${user.display_name || username} has no ${season} leagues.`);
  LEAGUES = { userId: user.user_id, season, leagues };
}

async function connectLeague(lg) {
  const rec = lg.scoring_settings && lg.scoring_settings.rec || 0;
  S.league = { id: lg.league_id, name: lg.name, userId: LEAGUES.userId, teams: lg.total_rosters || 12, mine: [], rostered: [], names: [], namesAt: 0 };
  await fetchRosters();
  S.fmt = rec >= 1 ? 'ppr' : rec >= .5 ? 'half' : 'std';
  S.teams = S.league.teams;
  LEAGUES = null;
  applyLive();
  applyLeagueTeam();
  cleanIds();
  save();
}

// Drop saved ids for players that no longer exist
function cleanIds() {
  for (const k of ['team', 'out', 'ss', 'give', 'get']) S[k] = S[k].filter(id => BY_ID[id]);
}

/* ---------- Model ---------- */

let M = null, MKEY = '';

// A new tier starts where the drop to the next player is much bigger than
// the drops around it (elite players are spread out more than depth players)
function tierize(arr, key, out, maxSize) {
  const gap = i => arr[i - 1][key] - arr[i][key];
  let t = 1, size = 0;
  arr.forEach((x, i) => {
    if (i) {
      let s = 0, c = 0;
      for (let j = Math.max(1, i - 6); j <= Math.min(arr.length - 1, i + 6); j++) if (j !== i) { s += gap(j); c++; }
      const local = Math.max(.5, s / Math.max(1, c));
      const g = gap(i);
      if ((g > local * 2 && (size >= 2 || g > local * 4)) || size >= maxSize) { t++; size = 0; }
    }
    x[out] = t; size++;
  });
}

function model() {
  const key = S.fmt + S.teams + '|' + (LIVE && LIVE.at);
  if (M && MKEY === key) return M;
  const T = S.teams;
  const pts = p => S.fmt === 'ppr' ? p.ppr : S.fmt === 'half' ? p.ppr - p.rec / 2 : p.ppr - p.rec;
  const info = {}, byPos = {};

  for (const pos of POS) {
    const list = PLAYERS.filter(p => p.pos === pos).sort((a, b) => pts(b) - pts(a));
    const repl = pts(list[Math.min(list.length - 1, Math.round(T * REPL[pos]) - 1)]);
    list.forEach((p, i) => {
      const v = pts(p) - repl;
      const bye = hasLive() && !PLAYING.has(p.team);
      const wk = OUT_STATUS.includes(p.inj) ? 0 : p.live ? p.live[S.fmt] : bye ? 0 : pts(p) / 17;
      info[p.id] = { pts: pts(p), wk, avgWk: pts(p) / 17, bye, opp: p.live ? p.live.opp : '', posRank: i + 1, vor: v, ovr: pos === 'K' || pos === 'DST' ? v * .3 : v };
    });
    tierize(list.map(p => info[p.id]), 'pts', 'tier', 10);
    byPos[pos] = list;
  }

  const overall = PLAYERS.slice().sort((a, b) => info[b.id].ovr - info[a.id].ovr || info[b.id].pts - info[a.id].pts);
  overall.forEach((p, i) => { info[p.id].rank = i + 1; });
  tierize(overall.map(p => info[p.id]), 'ovr', 'otier', 16);

  const top = info[overall[0].id].ovr;
  for (const p of PLAYERS) {
    const v = info[p.id].ovr;
    info[p.id].value = v > 0 ? Math.max(1, Math.round(100 * Math.pow(v / top, 1.15))) : 1;
  }

  const market = p => (info[p.id].vor + 60) * MARKET[p.pos] * (.92 + hash(p.id) * .16);
  const adpOrder = PLAYERS.slice().sort((a, b) => market(b) - market(a));
  adpOrder.forEach((p, i) => { info[p.id].adp = i + 1; });

  // An average starter at each lineup slot in a league this size
  const mean = a => a.length ? sum(a) / a.length : 0;
  const topPts = (pos, n) => byPos[pos].slice(0, n).map(p => info[p.id].pts);
  const flexPool = [...byPos.RB.slice(2 * T), ...byPos.WR.slice(2 * T), ...byPos.TE.slice(T)]
    .map(p => info[p.id].pts).sort((a, b) => b - a).slice(0, T);
  const avg = {
    QB: mean(topPts('QB', T)), RB: mean(topPts('RB', 2 * T)), WR: mean(topPts('WR', 2 * T)),
    TE: mean(topPts('TE', T)), FLEX: mean(flexPool), K: mean(topPts('K', T)), DST: mean(topPts('DST', T))
  };
  const avgTotal = sum(SLOTS.map(s => avg[s]));

  M = { info, byPos, overall, adpOrder, avg, avgTotal };
  MKEY = key;
  return M;
}

const I = p => model().info[p.id];

const isQ = p => { const a = S.ssAdj[p.id] || {}; return a.q ?? ['Questionable', 'Doubtful'].includes(p.inj); };

function range(p, adj = {}) {
  const m = I(p);
  if (OUT_STATUS.includes(p.inj) || m.bye) return { proj: 0, floor: 0, ceil: 0 };
  adj = Object.assign({}, adj, { q: adj.q ?? ['Questionable', 'Doubtful'].includes(p.inj) });
  const f = adj.m === 'tough' ? .87 : adj.m === 'great' ? 1.13 : 1;
  const proj = m.wk * f * (adj.q ? .9 : 1);
  let floor = proj * (1 - CV[p.pos]);
  if (adj.q) floor *= .5;
  return { proj, floor, ceil: proj * (1 + CV[p.pos] * 1.25) };
}

// Best legal starting lineup; greedy is optimal because FLEX comes last
function lineup(ids, val) {
  const pool = ids.map(id => BY_ID[id]).filter(Boolean).sort((a, b) => val(b) - val(a));
  const used = new Set();
  const slots = SLOTS.map(slot => {
    const ok = slot === 'FLEX' ? FLEX : [slot];
    const p = pool.find(x => !used.has(x.id) && ok.includes(x.pos));
    if (p) used.add(p.id);
    return { slot, p };
  });
  return { slots, bench: pool.filter(p => !used.has(p.id)), total: sum(slots.map(s => s.p ? val(s.p) : 0)) };
}

const cantPlay = p => S.out.includes(p.id) || OUT_STATUS.includes(p.inj) || I(p).bye;
const weekVal = p => cantPlay(p) ? 0 : I(p).wk;
const seasonVal = p => I(p).avgWk;

function letter(r) {
  return r >= 1.15 ? 'A+' : r >= 1.08 ? 'A' : r >= 1.03 ? 'B+' : r >= .98 ? 'B' : r >= .93 ? 'C+' : r >= .88 ? 'C' : 'D';
}

/* ---------- Shared bits ---------- */

function pageTop(title, sub) {
  return `<div class="top"><div><div class="eyebrow">${esc(sub)}</div><h1>${esc(title)}</h1></div>
    <button class="pill" data-act="menu">${GEAR}${FMT[S.fmt]} · ${S.teams}T</button></div>`;
}

function who(p, extra = '') {
  const m = I(p);
  const tags = [p.team];
  if (m.bye) tags.push('<span class="out">Bye</span>');
  else if (m.opp) tags.push('v ' + esc(m.opp));
  if (p.inj && INJ_SHORT[p.inj]) tags.push(`<span class="${p.inj === 'Questionable' ? 'q' : 'out'}">${INJ_SHORT[p.inj]}</span>`);
  if (S.tab !== 'team' && S.team.includes(p.id)) tags.push('<span class="mine">My team</span>');
  if (S.out.includes(p.id)) tags.push('<span class="out">Out</span>');
  return `<span class="pos ${p.pos}">${p.pos}${m.posRank}</span><span><b>${esc(p.name)}</b><small>${tags.join(' · ')}${extra}</small></span>`;
}

function show(el, on) {
  clearTimeout(el._t);
  if (on) {
    el.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('open')));
  } else {
    el.classList.remove('open');
    el._t = setTimeout(() => el.classList.add('hidden'), 220);
  }
}

function render() {
  document.querySelectorAll('.nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('hidden', t.id !== 'tab-' + S.tab));
  ({ rank: renderRank, ss: renderSS, trade: renderTrade, draft: renderDraft, team: renderTeam })[S.tab]();
}

/* ---------- Rankings ---------- */

let RQ = '';

const rankWeek = () => S.rankMode === 'week' && hasLive();
const rankPos = () => {
  if (S.rankPos === 'HOT' && !(LIVE && LIVE.trending && LIVE.trending.length)) return 'ALL';
  return rankWeek() && S.rankPos === 'ALL' ? 'FLEX' : S.rankPos;
};
const fmtCount = n => n >= 1000 ? f1(n / 1000) + 'k' : String(n);

function renderRank() {
  const week = rankWeek(), pos = rankPos();
  const opts = (week ? [] : ['ALL']).concat(['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST'], LIVE && LIVE.trending && LIVE.trending.length ? ['HOT'] : []);
  const chips = opts.map(p => `<button class="chip ${pos === p ? 'on' : ''}" data-rpos="${p}">${p === 'ALL' ? 'Overall' : p === 'HOT' ? '🔥 Trending' : p}</button>`).join('')
    + (S.league ? `<button class="chip ${S.availOnly ? 'on' : ''}" data-act="avail">Available</button>` : '');
  const seg = hasLive() ? `<div class="seg" style="margin-bottom:10px"><button class="${week ? '' : 'on'}" data-rmode="season">Season</button><button class="${week ? 'on' : ''}" data-rmode="week">${weekLabel()}</button></div>` : '';
  const sub = pos === 'HOT' ? 'Most added on Sleeper · 24h' : week ? weekLabel() + ' · live from Sleeper' : weekLabel() + ' · season projections';
  $('#tab-rank').innerHTML = `<div class="wrap">
    ${pageTop('Rankings', sub)}
    ${seg}
    <input class="search" id="rank-q" type="search" placeholder="Search players or teams" value="${esc(RQ)}" autocomplete="off">
    <div class="chips">${chips}</div>
    <div class="thead"><span>#</span><span>Player</span><span>${week ? 'Week' : 'Proj'}</span><span>${pos === 'HOT' ? 'Adds' : 'Value'}</span></div>
    <div class="list" id="rank-list"></div>
    <p class="note">${S.availOnly && S.league ? `Showing players not on a roster in ${esc(S.league.name)}. ` : ''}Value is a 0–100 trade value. Tap any player for details.</p>
  </div>`;
  rankList();
}

function rankList() {
  const { overall, byPos } = model();
  const week = rankWeek(), pos = rankPos();
  const adds = {};
  let list;
  if (pos === 'HOT') {
    list = LIVE.trending.filter(([sid]) => SID[sid]).map(([sid, n]) => { adds[SID[sid].id] = n; return SID[sid]; });
  } else {
    list = pos === 'ALL' ? overall : pos === 'FLEX' ? overall.filter(p => FLEX.includes(p.pos)) : byPos[pos];
    if (week) list = list.slice().sort((a, b) => I(b).wk - I(a).wk);
  }
  if (S.availOnly && S.league) {
    const taken = new Set(S.league.rostered);
    list = list.filter(p => p.sid && !taken.has(p.sid));
  }
  // Tiers only make sense for a full, unfiltered list
  const tiers = pos !== 'HOT' && !(S.availOnly && S.league);
  let tierOf = p => I(p)[POS.includes(pos) ? 'tier' : 'otier'];
  if (week && tiers) {
    const t = list.map(p => ({ id: p.id, v: I(p).wk }));
    tierize(t, 'v', 'tier', POS.includes(pos) ? 10 : 16);
    const by = Object.fromEntries(t.map(x => [x.id, x.tier]));
    tierOf = p => by[p.id];
  }
  const q = RQ.trim().toLowerCase();
  let html = '', last = 0;
  list.forEach((p, i) => {
    const m = I(p);
    if (q && !p.name.toLowerCase().includes(q) && p.team.toLowerCase() !== q) return;
    if (!q && tiers && tierOf(p) !== last) { last = tierOf(p); html += `<div class="tier">Tier ${last}</div>`; }
    const proj = week ? f1(m.wk) : `${m.pts.toFixed(0)}<small>${f1(m.wk)}/wk</small>`;
    html += `<button class="prow" data-pid="${p.id}"><span class="rk">${i + 1}</span><span class="who">${who(p)}</span>
      <span class="num">${proj}</span><span class="num">${pos === 'HOT' ? '+' + fmtCount(adds[p.id]) : m.value}</span></button>`;
  });
  $('#rank-list').innerHTML = html || '<p class="empty">No players match.</p>';
}

/* ---------- Start / Sit ---------- */

const NEEDS = { safe: 'Safe floor', balanced: 'Balanced', upside: 'Need upside' };

function ssScore(p) {
  const r = range(p, S.ssAdj[p.id]);
  r.score = S.ssNeed === 'safe' ? (r.proj + r.floor) / 2 : S.ssNeed === 'upside' ? (r.proj + r.ceil) / 2 : r.proj;
  return r;
}

function renderSS() {
  const players = S.ss.map(id => BY_ID[id]);
  const scored = players.map(p => ({ p, r: ssScore(p) })).sort((a, b) => b.r.score - a.r.score);
  const maxCeil = Math.max(1, ...scored.map(x => x.r.ceil));
  let verdict = '';
  if (scored.length >= 2) {
    const [a, b] = scored;
    const margin = (a.r.score - b.r.score) / Math.max(.1, a.r.score);
    const conf = Math.round(Math.min(95, Math.max(51, 50 + margin * 220)));
    const why = S.ssNeed === 'safe' ? 'the steadier floor' : S.ssNeed === 'upside' ? 'the bigger ceiling' : 'the higher projection';
    verdict = `<div class="hero"><div class="eyebrow">${weekLabel()} verdict</div><h2>Start ${esc(a.p.name)}</h2>
      <p>${conf}% confident over ${esc(b.p.name)} — ${why} with your settings.${conf < 60 ? ' This one is close to a coin flip.' : ''}</p></div>`;
  }
  const cards = scored.map(({ p, r }, i) => {
    const adj = S.ssAdj[p.id] || {};
    const pct = v => (v / maxCeil * 100).toFixed(1) + '%';
    const seg = ['tough', 'neutral', 'great'].map(m =>
      `<button class="${(adj.m || 'neutral') === m ? 'on' : ''}" data-ssm="${p.id}:${m}">${m === 'tough' ? 'Tough' : m === 'great' ? 'Great' : 'Neutral'}</button>`).join('');
    return `<div class="ss ${i === 0 && scored.length > 1 ? 'best' : ''}">
      <div class="ss-head"><button class="who" data-pid="${p.id}">${who(p)}</button>
        ${scored.length > 1 ? `<span class="badge ${i === 0 ? 'start' : ''}">${i === 0 ? 'Start' : 'Sit'}</span>` : ''}
        <button class="x" data-ssrm="${p.id}" aria-label="Remove">${X_ICON}</button></div>
      <div class="nums"><div><b>${f1(r.floor)}</b><span>Floor</span></div><div><b>${f1(r.proj)}</b><span>Projected</span></div><div><b>${f1(r.ceil)}</b><span>Ceiling</span></div></div>
      <div class="range"><span style="left:${pct(r.floor)};right:calc(100% - ${pct(r.ceil)})"></span><i style="left:${pct(r.proj)}"></i></div>
      <div class="ss-opts"><div class="seg mini" aria-label="Matchup">${seg}</div>
        <button class="toggle ${isQ(p) ? 'on' : ''}" data-ssq="${p.id}">Questionable</button></div>
    </div>`;
  }).join('');
  const needSeg = Object.entries(NEEDS).map(([k, v]) => `<button class="${S.ssNeed === k ? 'on' : ''}" data-ssneed="${k}">${v}</button>`).join('');

  $('#tab-ss').innerHTML = `<div class="wrap">
    ${pageTop('Start / Sit', weekLabel() + ' · who should you play?')}
    ${verdict}
    <div class="card"><h3>This week I need…</h3><div class="seg">${needSeg}</div>
      <p class="muted small" style="margin:10px 0 0">Favored to win? Play it safe. Big underdog? Chase upside. ${hasLive() ? 'Projections are live from Sleeper and already account for the opponent, so only change a matchup if you know something extra.' : "Set each player's matchup below."}</p></div>
    ${cards || '<p class="empty">Add two to four players you\'re choosing between.</p>'}
    ${S.ss.length < 4 ? '<button class="btn dashed" data-act="add-ss">+ Add a player</button>' : ''}
    ${S.ss.length ? '<div class="row-btns"><button class="btn ghost sm" data-act="ss-clear">Clear all</button></div>' : ''}
  </div>`;
}

/* ---------- Trade analyzer ---------- */

// Two good players are rarely worth one great one: each extra piece counts less
function sideValue(ids) {
  const vals = ids.map(id => I(BY_ID[id]).value).sort((a, b) => b - a);
  return sum(vals.map((v, i) => v * Math.pow(.78, i)));
}

function renderTrade() {
  const side = (key, title) => {
    const rows = S[key].map(id => {
      const p = BY_ID[id];
      return `<div class="prow simple"><button class="who" data-pid="${p.id}">${who(p)}</button>
        <span style="display:flex;align-items:center;gap:6px"><span class="num">${I(p).value}</span><button class="x" data-trm="${key}:${p.id}" aria-label="Remove">${X_ICON}</button></span></div>`;
    }).join('');
    return `<div class="side-head"><h3>${title}</h3><b>${S[key].length ? Math.round(sideValue(S[key])) : ''}</b></div>
      ${rows ? `<div class="list">${rows}</div>` : ''}
      <button class="btn dashed" data-act="add-${key}" style="margin-bottom:18px">+ Add player</button>`;
  };

  let verdict = '';
  if (S.give.length && S.get.length) {
    const g = sideValue(S.give), r = sideValue(S.get);
    const pct = (r - g) / Math.max(g, r);
    const [head, msg] =
      pct > .25 ? ['Big win for you', 'You get a lot more value than you give. Accept before they change their mind.'] :
      pct > .08 ? ['Slight edge to you', 'You come out a little ahead on value.'] :
      pct >= -.08 ? ['Fair trade', 'Values are close. Decide on roster fit and your positional needs.'] :
      pct >= -.25 ? ['Slightly favors them', 'You give up a bit more value. Worth it only if it fills a real hole.'] :
      ['Decline', 'You give up far more value than you get back.'];
    verdict = `<div class="hero"><div class="eyebrow">Verdict</div><h2>${head}</h2><p>${msg}</p>
      <div class="split"><span style="width:${(g / (g + r) * 100).toFixed(1)}%"></span></div>
      <div class="split-labels"><span>You give ${Math.round(g)}</span><span>You get ${Math.round(r)}</span></div></div>`;
    if (S.team.length) {
      const after = S.team.filter(id => !S.give.includes(id)).concat(S.get.filter(id => !S.team.includes(id)));
      const d = lineup(after, seasonVal).total - lineup(S.team, seasonVal).total;
      const missing = S.give.filter(id => !S.team.includes(id)).length;
      verdict += `<div class="card"><div class="impact"><div><h3 style="margin:0">Your starting lineup</h3>
        <span class="muted small">Projected points per week after the trade${missing ? ` (${missing} given player${missing > 1 ? 's aren\'t' : ' isn\'t'} on My Team)` : ''}</span></div>
        <b class="${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '+' : ''}${f1(d)}</b></div></div>`;
    }
  }

  $('#tab-trade').innerHTML = `<div class="wrap">
    ${pageTop('Trade Analyzer', 'Is it a fair deal?')}
    ${verdict}
    ${side('give', 'You give')}
    ${side('get', 'You get')}
    ${S.give.length || S.get.length ? '<button class="btn ghost sm" data-act="trade-clear">Clear trade</button>' : ''}
    <p class="note">Values are based on ${FMT[S.fmt]} scoring in a ${S.teams}-team league.</p>
  </div>`;
}

/* ---------- Mock draft ---------- */

let cpuTimer = null;
let DPOS = 'ALL', DQ = '';

const teamAt = (d, n) => { const r = Math.floor(n / d.teams), i = n % d.teams; return r % 2 === 0 ? i : d.teams - 1 - i; };
const teamPicks = (d, t) => d.picks.filter((_, n) => teamAt(d, n) === t);
const teamName = (d, t) => t === d.slot ? 'You' : 'Team ' + (t + 1);
const pickLabel = (d, n) => `${Math.floor(n / d.teams) + 1}.${String(n % d.teams + 1).padStart(2, '0')}`;
function counts(ids) {
  const c = {};
  for (const id of ids) c[BY_ID[id].pos] = (c[BY_ID[id].pos] || 0) + 1;
  return c;
}

// Players a team can sensibly take now: no K/DST early, no position over
// its cap, and leave room to fill K and DST before the last pick
function eligible(d, t) {
  const taken = new Set(d.picks);
  const cnt = counts(teamPicks(d, t));
  const round = Math.floor(d.picks.length / d.teams);
  const left = d.rounds - round;
  const needKD = ['K', 'DST'].filter(p => !cnt[p]);
  let avail = model().adpOrder.filter(p => !taken.has(p.id) && (cnt[p.pos] || 0) < CAP[p.pos]);
  if (left <= needKD.length) avail = avail.filter(p => needKD.includes(p.pos));
  else if (round < d.rounds - 3) avail = avail.filter(p => p.pos !== 'K' && p.pos !== 'DST');
  return avail.length ? avail : model().adpOrder.filter(p => !taken.has(p.id));
}

function cpuPick(d, t) {
  const pool = eligible(d, t).slice(0, 6);
  let r = Math.random() * sum(pool.map((_, i) => Math.pow(.5, i)));
  for (let i = 0; i < pool.length; i++) { r -= Math.pow(.5, i); if (r <= 0) return pool[i].id; }
  return pool[0].id;
}

function recommend(d) {
  const cnt = counts(teamPicks(d, d.slot));
  const need = p => {
    const have = cnt[p.pos] || 0;
    const starters = p.pos === 'RB' || p.pos === 'WR' ? 2 : 1;
    return have < starters ? 1.12 : have >= starters + 2 || (p.pos === 'QB' || p.pos === 'TE') ? .8 : 1;
  };
  return eligible(d, d.slot).slice(0, 30)
    .map(p => ({ p, s: (I(p).ovr + 40) * need(p) }))
    .sort((a, b) => b.s - a.s).slice(0, 3).map(x => x.p);
}

function advance() {
  const d = S.draft;
  if (!d || d.done || cpuTimer) return;
  if (d.picks.length >= d.teams * d.rounds) { d.done = true; save(); if (S.tab === 'draft') renderDraft(); return; }
  if (teamAt(d, d.picks.length) === d.slot) return;
  cpuTimer = setTimeout(() => {
    cpuTimer = null;
    if (S.draft !== d) return;
    d.picks.push(cpuPick(d, teamAt(d, d.picks.length)));
    save();
    if (S.tab === 'draft') renderDraft();
    advance();
  }, 280);
}

function renderDraft() {
  const d = S.draft;
  const el = $('#tab-draft');
  if (!d) {
    const st = S.setup;
    const seg = [8, 10, 12].map(n => `<button class="${st.teams === n ? 'on' : ''}" data-dsteams="${n}">${n} teams</button>`).join('');
    const opts = ['<option value="-1">Random</option>']
      .concat(Array.from({ length: st.teams }, (_, i) => `<option value="${i}" ${st.slot === i ? 'selected' : ''}>Pick ${i + 1}</option>`)).join('');
    el.innerHTML = `<div class="wrap">${pageTop('Mock Draft', 'Practice against the computer')}
      <div class="card">
        <div class="field"><span>League size</span><div class="seg">${seg}</div></div>
        <label class="field"><span>Your draft slot</span><select id="ds-slot">${opts}</select></label>
        <p class="muted small">${ROUNDS} rounds, snake order, ${FMT[S.fmt]} scoring. Lineup: QB, 2 RB, 2 WR, TE, FLEX, K, DST and a bench.</p>
        <button class="btn grad" data-act="draft-start">Start draft</button>
      </div>
      <div class="card"><h3>How it works</h3><p class="muted small" style="margin:0">The other teams draft by average draft position with a little randomness and real roster needs. When you're on the clock you get three recommendations based on value and what your roster still needs.</p></div>
    </div>`;
    return;
  }

  if (d.done) { renderDraftResults(d); return; }

  const n = d.picks.length;
  const t = teamAt(d, n);
  const mine = t === d.slot;
  const my = teamPicks(d, d.slot);
  const cnt = counts(my);
  const untilMe = (() => { for (let k = n; k < d.teams * d.rounds; k++) if (teamAt(d, k) === d.slot) return k - n; return -1; })();

  const recent = d.picks.slice(-8).map((id, i, a) => {
    const k = n - a.length + i, p = BY_ID[id];
    return `<div class="${teamAt(d, k) === d.slot ? 'me' : ''}"><span class="muted">${pickLabel(d, k)} · ${teamName(d, teamAt(d, k))}</span><b>${esc(p.name)}</b>${p.pos}</div>`;
  }).reverse().join('');

  const recs = mine ? recommend(d).map(p => `<div class="rec"><span class="pos ${p.pos}">${p.pos}${I(p).posRank}</span>
    <b>${esc(p.name)}</b><small>${p.team} · ADP ${I(p).adp}</small><button class="draft-btn" data-draftpick="${p.id}">Draft</button></div>`).join('') : '';

  const taken = new Set(d.picks);
  const q = DQ.trim().toLowerCase();
  const avail = model().adpOrder.filter(p => !taken.has(p.id) && (DPOS === 'ALL' || p.pos === DPOS) && (!q || p.name.toLowerCase().includes(q))).slice(0, 60);
  const rows = avail.map(p => `<div class="prow drow"><span class="rk">${I(p).adp}</span><button class="who" data-pid="${p.id}">${who(p)}</button>
    <span class="num">${I(p).value}</span><button class="draft-btn" data-draftpick="${p.id}" ${mine ? '' : 'disabled'}>Draft</button></div>`).join('');
  const chips = ['ALL', ...POS].map(p => `<button class="chip ${DPOS === p ? 'on' : ''}" data-dpos="${p}">${p === 'ALL' ? 'All' : p}</button>`).join('');

  el.innerHTML = `<div class="wrap">${pageTop('Mock Draft', `Round ${Math.floor(n / d.teams) + 1} of ${d.rounds} · Pick ${pickLabel(d, n)}`)}
    <div class="hero"><div class="clock"><div><div class="eyebrow">On the clock</div>
      <h2>${mine ? "You're up!" : esc(teamName(d, t))}</h2>
      <p>${mine ? 'Pick a recommendation or anyone below.' : untilMe > 0 ? `Your pick is in ${untilMe} pick${untilMe > 1 ? 's' : ''}.` : 'Drafting…'}</p></div>
      <button class="pill" data-act="draft-board" style="color:var(--text)">Board</button></div>
      <div class="counts">${POS.map(p => `<span>${p} ${cnt[p] || 0}</span>`).join('')}</div></div>
    ${recs ? `<h3>Recommended for you</h3><div class="recs">${recs}</div>` : ''}
    ${recent ? `<div class="recent">${recent}</div>` : ''}
    <input class="search" id="draft-q" type="search" placeholder="Search available players" value="${esc(DQ)}" autocomplete="off">
    <div class="chips">${chips}</div>
    <div class="thead"><span>ADP</span><span>Available</span><span>Value</span><span></span></div>
    <div class="list">${rows || '<p class="empty">No players match.</p>'}</div>
    <div class="row-btns"><button class="btn ghost sm" data-act="draft-quit">Quit draft</button></div>
  </div>`;
  advance();
}

function renderDraftResults(d) {
  const val = seasonVal;
  const totals = Array.from({ length: d.teams }, (_, t) => ({ t, total: lineup(teamPicks(d, t), val).total }))
    .sort((a, b) => b.total - a.total);
  const place = totals.findIndex(x => x.t === d.slot) + 1;
  const pctile = 1 - (place - 1) / Math.max(1, d.teams - 1);
  const grade = pctile >= .95 ? 'A+' : pctile >= .8 ? 'A' : pctile >= .65 ? 'B+' : pctile >= .5 ? 'B' : pctile >= .35 ? 'C+' : pctile >= .2 ? 'C' : 'D';
  const lu = lineup(teamPicks(d, d.slot), val);
  const stand = totals.map((x, i) => `<div class="stand ${x.t === d.slot ? 'me' : ''}"><span>${i + 1}</span><span>${teamName(d, x.t)}</span><b>${f1(x.total)}</b></div>`).join('');

  $('#tab-draft').innerHTML = `<div class="wrap">${pageTop('Draft Results', `${d.teams}-team mock · pick ${d.slot + 1}`)}
    <div class="hero"><div class="grade">${grade}</div><div class="eyebrow">Your draft grade</div>
      <h2>${place === 1 ? 'Best team in the league' : `Ranked ${place} of ${d.teams}`}</h2>
      <p>${f1(lu.total)} projected starter points per week.</p></div>
    <h3>Your starters</h3>${lineupList(lu, val)}
    <h3>Bench</h3><div class="list">${lu.bench.map(p => `<button class="prow simple" data-pid="${p.id}"><span class="who">${who(p)}</span><span class="num">${f1(val(p))}</span></button>`).join('')}</div>
    <div class="card"><h3>Projected standings</h3>${stand}</div>
    <div class="actions"><button class="btn grad" data-act="draft-save">Use as My Team</button>
      <button class="btn ghost" data-act="draft-board">View draft board</button>
      <button class="btn ghost" data-act="draft-quit">New draft</button></div>
  </div>`;
}

function openBoard() {
  const d = S.draft;
  let html = '';
  d.picks.forEach((id, n) => {
    if (n % d.teams === 0) html += `<div class="board-round">Round ${n / d.teams + 1}</div>`;
    const p = BY_ID[id], t = teamAt(d, n);
    html += `<div class="board-pick ${t === d.slot ? 'me' : ''}"><span>${pickLabel(d, n)}</span><span>${teamName(d, t)}</span><span><span class="pos ${p.pos}">${p.pos}</span> ${esc(p.name)}</span></div>`;
  });
  openSheet(`<div class="sheet-top"><h2>Draft board</h2><button class="icon-btn" data-act="sheet-close" aria-label="Close">${X_ICON}</button></div>${html || '<p class="empty">No picks yet.</p>'}`);
}

/* ---------- My team ---------- */

function lineupList(lu, val) {
  return `<div class="list">${lu.slots.map(({ slot, p }) => p
    ? `<button class="prow slot" data-pid="${p.id}"><span class="pos ${slot === 'FLEX' ? 'FLEX' : p.pos}">${slot}</span><span class="who">${who(p)}</span><span class="num">${f1(val(p))}</span></button>`
    : `<div class="prow slot"><span class="pos empty">${slot}</span><span class="muted small">Empty</span><span></span></div>`).join('')}</div>`;
}

function renderTeam() {
  const el = $('#tab-team');
  if (!S.team.length) {
    el.innerHTML = `<div class="wrap">${pageTop('My Team', 'Lineups and team strength')}
      <div class="card" style="text-align:center"><h3>Build your roster</h3>
        <p class="muted small">Add your players, or connect your Sleeper league in settings, to get an optimal weekly lineup, a team grade and trade impact.</p>
        <div class="actions"><button class="btn grad" data-act="add-team">Add players</button>
        <button class="btn ghost" data-tab="draft">Draft one in a mock draft</button></div></div></div>`;
    return;
  }
  const M = model();
  const lu = lineup(S.team, weekVal);
  const ratio = lu.total / (M.avgTotal / 17);
  const bars = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST'].map(pos => {
    const filled = lu.slots.filter(s => s.slot === pos);
    const r = sum(filled.map(s => s.p ? weekVal(s.p) : 0)) / (M.avg[pos] / 17 * filled.length);
    return `<div class="bar-row"><span class="pos ${pos}">${pos}</span><div class="meter"><span class="${r < .95 ? 'lo' : ''}" style="width:${Math.min(100, r * 70).toFixed(0)}%"></span></div><b>${Math.round(r * 100)}%</b></div>`;
  }).join('');
  const weak = lu.slots.filter(s => !s.p).length;

  const synced = S.league ? `<p class="small muted" style="margin:-4px 0 12px">Synced from ${esc(S.league.name)} on Sleeper${S.league.missing ? ` · ${S.league.missing} player${S.league.missing > 1 ? 's' : ''} couldn't be matched` : ''}.</p>` : '';
  el.innerHTML = `<div class="wrap">${pageTop('My Team', weekLabel() + ' lineup')}${synced}
    <div class="hero"><div class="grade">${letter(ratio)}</div><div class="eyebrow">Team strength</div>
      <h2>${f1(lu.total)} pts / week</h2>
      <p>${Math.round(ratio * 100)}% of an average ${S.teams}-team starting lineup.${weak ? ` ${weak} empty slot${weak > 1 ? 's' : ''}.` : ''}</p></div>
    <h3>Optimal lineup</h3>${lineupList(lu, weekVal)}
    ${lu.bench.length ? `<h3>Bench</h3><div class="list">${lu.bench.map(p => `<button class="prow simple" data-pid="${p.id}"><span class="who">${who(p)}</span><span class="num">${f1(weekVal(p))}</span></button>`).join('')}</div>` : ''}
    <div class="card"><h3>Strength by slot</h3><p class="muted small">Compared with an average starter. 100% is league average.</p>${bars}</div>
    <div class="actions"><button class="btn dashed" data-act="add-team">+ Add player</button></div>
    <p class="note">${hasLive() ? 'Byes and injuries come from Sleeper. ' : ''}Tap a player to mark them out this week or drop them.</p>
  </div>`;
}

/* ---------- Sheets ---------- */

let PICK = null; // { key, title, pos, q }

function openSheet(html) {
  $('#sheet-body').innerHTML = html;
  $('#sheet-body').scrollTop = 0;
  show($('#sheet'), true);
}
function closeSheet() { PICK = null; show($('#sheet'), false); }

function openPlayer(id) {
  const p = BY_ID[id], m = I(p), r = range(p);
  const onTeam = S.team.includes(id);
  const d = S.draft;
  const canDraft = d && !d.done && S.tab === 'draft' && teamAt(d, d.picks.length) === d.slot && !d.picks.includes(id);
  openSheet(`<div class="sheet-top"><span></span><button class="icon-btn" data-act="sheet-close" aria-label="Close">${X_ICON}</button></div>
    <div class="p-head"><span class="pos ${p.pos}">${p.pos}${m.posRank}</span><div><h2>${esc(p.name)}</h2><span class="muted">${who(p).split('<small>')[1].split('</small>')[0]} · Tier ${m.tier} ${p.pos}</span></div></div>
    ${S.league && p.sid ? `<p class="small ${S.league.rostered.includes(p.sid) ? 'muted' : 'mine'}" style="margin:-8px 0 14px">${S.league.mine.includes(p.sid) ? 'On your Sleeper roster' : S.league.rostered.includes(p.sid) ? 'Rostered in ' + esc(S.league.name) : 'Available in ' + esc(S.league.name)}</p>` : ''}
    <div class="stats">
      <div><b>${m.rank}</b><span>Overall</span></div><div><b>${p.pos}${m.posRank}</b><span>Position</span></div><div><b>${m.adp}</b><span>ADP</span></div>
      <div><b>${m.pts.toFixed(0)}</b><span>Season pts</span></div><div><b>${f1(m.wk)}</b><span>${p.live || m.bye ? 'This week' : 'Per week'}</span></div><div><b>${m.value}</b><span>Trade value</span></div>
      <div><b>${f1(r.floor)}</b><span>Weekly floor</span></div><div><b>${f1(r.ceil)}</b><span>Weekly ceiling</span></div><div><b>${p.rec ? p.rec : '—'}</b><span>Receptions</span></div>
    </div>
    <div class="actions">
      ${canDraft ? `<button class="btn grad" data-draftpick="${id}">Draft ${esc(p.name)}</button>` : ''}
      <button class="btn ${onTeam ? 'ghost' : canDraft ? 'ghost' : 'grad'}" data-sa="team:${id}">${onTeam ? 'Drop from My Team' : 'Add to My Team'}</button>
      ${onTeam ? `<button class="btn ghost" data-sa="out:${id}">${S.out.includes(id) ? 'Mark active this week' : 'Mark out this week'}</button>` : ''}
      <button class="btn ghost" data-sa="ss:${id}">${S.ss.includes(id) ? 'View in Start/Sit' : 'Compare in Start/Sit'}</button>
      <div class="row-btns" style="margin:0"><button class="btn ghost" data-sa="give:${id}">Trade away</button><button class="btn ghost" data-sa="get:${id}">Trade for</button></div>
    </div>
    ${p.est ? '<p class="note">Not in the built-in projections. Season numbers are estimated from this week\'s Sleeper projection.</p>' : ''}`);
}

const PICK_TITLES = { team: 'Add to My Team', ss: 'Add to Start/Sit', give: 'You give', get: 'You get' };

function openPicker(key) {
  PICK = { key, pos: key !== 'team' && S.team.length ? 'MINE' : 'ALL', q: '' };
  openSheet(`<div class="sheet-top"><h2>${PICK_TITLES[key]}</h2><button class="icon-btn" data-act="sheet-close" aria-label="Close">${X_ICON}</button></div>
    <input class="search" id="pick-q" type="search" placeholder="Search players" autocomplete="off">
    <div class="chips" id="pick-chips"></div><div class="list" id="pick-list"></div>`);
  pickList();
}

function pickList() {
  if (!PICK) return;
  const chipsFor = ['ALL', ...(S.team.length && PICK.key !== 'team' ? ['MINE'] : []), ...POS];
  $('#pick-chips').innerHTML = chipsFor.map(p => `<button class="chip ${PICK.pos === p ? 'on' : ''}" data-ppos="${p}">${p === 'ALL' ? 'All' : p === 'MINE' ? 'My team' : p}</button>`).join('');
  const exclude = new Set(PICK.key === 'give' || PICK.key === 'get' ? [...S.give, ...S.get] : S[PICK.key]);
  const q = PICK.q.trim().toLowerCase();
  const list = model().overall.filter(p => !exclude.has(p.id)
    && (PICK.pos === 'ALL' || (PICK.pos === 'MINE' ? S.team.includes(p.id) : p.pos === PICK.pos))
    && (!q || p.name.toLowerCase().includes(q) || p.team.toLowerCase() === q)).slice(0, 80);
  $('#pick-list').innerHTML = list.map(p => `<button class="prow simple" data-pick="${p.id}"><span class="who">${who(p)}</span><span class="num">${I(p).value}</span></button>`).join('')
    || '<p class="empty">No players match.</p>';
}

function addTo(key, id) {
  if (S[key].includes(id)) return;
  if (key === 'ss' && S.ss.length >= 4) return;
  if (key === 'give') S.get = S.get.filter(x => x !== id);
  if (key === 'get') S.give = S.give.filter(x => x !== id);
  S[key].push(id);
}

let SL_USER = '', LEAGUE_BUSY = false, LEAGUE_ERR = '';

function ago(t) {
  const m = Math.round((Date.now() - t) / 6e4);
  return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago';
}

function liveStatus() {
  if (LIVE_BUSY) return 'Updating from Sleeper…';
  if (LIVE_ERR) return `<span class="out">${esc(LIVE_ERR)}</span> Using built-in projections.`;
  if (!LIVE) return 'Not loaded yet.';
  let t = `Updated ${ago(LIVE.at)}. `;
  t += hasLive() ? `Week ${LIVE.week} projections for ${LIVE.rows.length} players, plus injuries and byes.` : 'No weekly projections right now (preseason or offseason), so rankings use built-in projections.';
  if (LIVE.notes && LIVE.notes.length) t += ` <span class="out">Couldn't load ${esc(LIVE.notes.join(', '))}.</span>`;
  return t;
}

function leagueSection() {
  const L = S.league;
  const err = LEAGUE_ERR ? `<p class="small out" style="margin:8px 0 0">${esc(LEAGUE_ERR)}</p>` : '';
  if (L) return `<div class="card"><b>${esc(L.name)}</b><p class="muted small" style="margin:2px 0 12px">${L.teams} teams · ${L.mine.length} players on your roster${L.missing ? ` (${L.missing} not matched)` : ''}</p>
    <div class="row-btns" style="margin:0"><button class="btn ghost sm" data-act="live-refresh" ${LIVE_BUSY ? 'disabled' : ''}>Sync roster</button><button class="btn ghost sm danger" data-act="league-off">Disconnect</button></div>${err}</div>`;
  if (LEAGUES) return `<div class="card"><p class="muted small">Pick your ${esc(LEAGUES.season)} league:</p><div class="actions">
    ${LEAGUES.leagues.map((lg, i) => `<button class="btn ghost sm" data-league="${i}" ${LEAGUE_BUSY ? 'disabled' : ''}>${esc(lg.name)} · ${lg.total_rosters || '?'} teams</button>`).join('')}
    <button class="btn sm" data-act="league-cancel" style="background:transparent;color:var(--muted)">Cancel</button></div>${err}</div>`;
  return `<div class="card"><p class="muted small">Sync My Team, scoring and league size, and see who's available on waivers.</p>
    <div style="display:flex;gap:8px"><input class="search" id="sl-user" placeholder="Sleeper username" value="${esc(SL_USER)}" autocomplete="off" autocapitalize="off" style="margin:0">
    <button class="btn grad sm" data-act="find-leagues" style="width:auto" ${LEAGUE_BUSY ? 'disabled' : ''}>${LEAGUE_BUSY ? '…' : 'Connect'}</button></div>${err}</div>`;
}

function openMenu() {
  const seg = (attr, opts, cur) => `<div class="seg">${opts.map(([v, l]) => `<button class="${cur === v ? 'on' : ''}" data-${attr}="${v}">${l}</button>`).join('')}</div>`;
  $('#menu-body').innerHTML = `<div class="sheet-top"><h2>League settings</h2><button class="icon-btn" data-act="menu-close" aria-label="Close">${X_ICON}</button></div>
    <div class="menu-sec"><span>Scoring</span>${seg('fmt', Object.entries(FMT), S.fmt)}</div>
    <div class="menu-sec"><span>League size</span>${seg('teams', [8, 10, 12, 14].map(n => [n, n + ' teams']), S.teams)}</div>
    <div class="menu-sec"><span>Sleeper league</span>${leagueSection()}</div>
    <div class="menu-sec"><span>Live data from Sleeper</span><div class="card"><p class="small muted">${liveStatus()}</p>
      <button class="btn ghost sm" data-act="live-refresh" ${LIVE_BUSY ? 'disabled' : ''}>Refresh now</button></div></div>
    <p class="muted small" style="margin-bottom:16px">Season rankings, tiers and trade values use built-in ${new Date().getFullYear()} projections from <b>data.js</b>, with teams and injuries kept current from Sleeper.</p>
    <button class="btn ghost danger" data-act="reset">Erase all data</button>`;
  show($('#menu'), true);
}

function refreshMenu() { if (!$('#menu').classList.contains('hidden')) openMenu(); }

async function findLeaguesFromInput() {
  if (!SL_USER.trim() || LEAGUE_BUSY) return;
  LEAGUE_BUSY = true; LEAGUE_ERR = ''; refreshMenu();
  try { await findLeagues(SL_USER); }
  catch (e) { LEAGUE_ERR = e instanceof TypeError ? "Couldn't reach Sleeper. Check your connection." : e.message; }
  LEAGUE_BUSY = false; refreshMenu();
}

/* ---------- Events ---------- */

document.addEventListener('click', e => {
  const t = e.target.closest('button, [data-act]');
  if (!t) return;
  const ds = t.dataset;

  if (ds.tab) { S.tab = ds.tab; save(); closeSheet(); render(); $('#tab-' + S.tab).scrollTop = 0; return; }
  if (ds.pick) {
    addTo(PICK.key, ds.pick); save(); render();
    if (PICK.key === 'team') pickList(); else closeSheet();
    return;
  }
  if (ds.draftpick) {
    const d = S.draft;
    if (d && !d.done && teamAt(d, d.picks.length) === d.slot && !d.picks.includes(ds.draftpick)) {
      d.picks.push(ds.draftpick); DQ = ''; save(); closeSheet(); renderDraft();
    }
    return;
  }
  if (ds.pid) { openPlayer(ds.pid); return; }
  if (ds.sa) {
    const [k, id] = ds.sa.split(':');
    if (k === 'team') {
      if (S.team.includes(id)) { S.team = S.team.filter(x => x !== id); S.out = S.out.filter(x => x !== id); } else S.team.push(id);
      save(); render(); openPlayer(id); return;
    }
    if (k === 'out') {
      S.out = S.out.includes(id) ? S.out.filter(x => x !== id) : [...S.out, id];
      save(); render(); openPlayer(id); return;
    }
    addTo(k, id); S.tab = k === 'ss' ? 'ss' : 'trade'; save(); closeSheet(); render(); return;
  }
  if (ds.rpos) { S.rankPos = ds.rpos; save(); renderRank(); return; }
  if (ds.rmode) { S.rankMode = ds.rmode; save(); renderRank(); return; }
  if (ds.league) {
    const lg = LEAGUES && LEAGUES.leagues[+ds.league];
    if (!lg || LEAGUE_BUSY) return;
    LEAGUE_BUSY = true; LEAGUE_ERR = ''; refreshMenu();
    connectLeague(lg)
      .catch(err => { S.league = null; LEAGUE_ERR = err instanceof TypeError ? "Couldn't reach Sleeper. Check your connection." : err.message; })
      .finally(() => { LEAGUE_BUSY = false; render(); refreshMenu(); });
    return;
  }
  if (ds.ppos) { PICK.pos = ds.ppos; pickList(); return; }
  if (ds.dpos) { DPOS = ds.dpos; renderDraft(); return; }
  if (ds.ssneed) { S.ssNeed = ds.ssneed; save(); renderSS(); return; }
  if (ds.ssm) { const [id, m] = ds.ssm.split(':'); S.ssAdj[id] = Object.assign({}, S.ssAdj[id], { m }); save(); renderSS(); return; }
  if (ds.ssq) { const q = !isQ(BY_ID[ds.ssq]); S.ssAdj[ds.ssq] = Object.assign({}, S.ssAdj[ds.ssq], { q }); save(); renderSS(); return; }
  if (ds.ssrm) { S.ss = S.ss.filter(x => x !== ds.ssrm); delete S.ssAdj[ds.ssrm]; save(); renderSS(); return; }
  if (ds.trm) { const [k, id] = ds.trm.split(':'); S[k] = S[k].filter(x => x !== id); save(); renderTrade(); return; }
  if (ds.dsteams) { S.setup = { teams: +ds.dsteams, slot: Math.min(S.setup.slot, +ds.dsteams - 1) }; save(); renderDraft(); return; }
  if (ds.fmt) { S.fmt = ds.fmt; save(); openMenu(); render(); return; }
  if (ds.teams) { S.teams = +ds.teams; save(); openMenu(); render(); return; }

  switch (ds.act) {
    case 'menu': openMenu(); break;
    case 'live-refresh': refreshLive(); break;
    case 'find-leagues': findLeaguesFromInput(); break;
    case 'league-cancel': LEAGUES = null; LEAGUE_ERR = ''; refreshMenu(); break;
    case 'league-off':
      if (confirm('Disconnect your Sleeper league? My Team stays as it is.')) {
        S.league = null; S.availOnly = false; applyLive(); cleanIds(); save(); render(); refreshMenu();
      }
      break;
    case 'avail': S.availOnly = !S.availOnly; save(); renderRank(); break;
    case 'menu-close': show($('#menu'), false); break;
    case 'sheet-close': closeSheet(); break;
    case 'add-team': case 'add-ss': case 'add-give': case 'add-get': openPicker(ds.act.slice(4)); break;
    case 'ss-clear': S.ss = []; S.ssAdj = {}; save(); renderSS(); break;
    case 'trade-clear': S.give = []; S.get = []; save(); renderTrade(); break;
    case 'draft-start': {
      const st = S.setup;
      S.draft = { teams: st.teams, rounds: ROUNDS, slot: st.slot < 0 ? Math.floor(Math.random() * st.teams) : st.slot, picks: [], done: false };
      DPOS = 'ALL'; DQ = '';
      save(); renderDraft(); $('#tab-draft').scrollTop = 0; break;
    }
    case 'draft-board': openBoard(); break;
    case 'draft-quit':
      if (S.draft.done || confirm('Quit this draft? Your picks will be lost.')) { clearTimeout(cpuTimer); cpuTimer = null; S.draft = null; save(); renderDraft(); }
      break;
    case 'draft-save':
      S.team = teamPicks(S.draft, S.draft.slot); S.out = []; S.tab = 'team'; save(); render(); break;
    case 'reset':
      if (confirm('Erase your team, drafts and settings?')) {
        clearTimeout(cpuTimer); cpuTimer = null;
        try { localStorage.removeItem(KEY); } catch {}
        LEAGUES = null; LEAGUE_ERR = '';
        S = load(); applyLive(); show($('#menu'), false); render();
      }
      break;
  }
});

document.addEventListener('input', e => {
  if (e.target.id === 'rank-q') { RQ = e.target.value; rankList(); }
  else if (e.target.id === 'pick-q' && PICK) { PICK.q = e.target.value; pickList(); }
  else if (e.target.id === 'sl-user') SL_USER = e.target.value;
  else if (e.target.id === 'draft-q') {
    DQ = e.target.value;
    const pos = e.target.selectionStart;
    renderDraft();
    const el = $('#draft-q'); el.focus(); el.setSelectionRange(pos, pos);
  }
});

document.addEventListener('change', e => {
  if (e.target.id === 'ds-slot') { S.setup.slot = +e.target.value; save(); }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'sl-user') { findLeaguesFromInput(); return; }
  if (e.key !== 'Escape') return;
  if (!$('#menu').classList.contains('hidden')) show($('#menu'), false);
  else if (!$('#sheet').classList.contains('hidden')) closeSheet();
});

applyLive();
cleanIds();
render();
if (Date.now() - (LIVE && LIVE.at || 0) > LIVE_MAX_AGE) refreshLive();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && Date.now() - (LIVE && LIVE.at || 0) > LIVE_MAX_AGE) refreshLive();
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {}));
}
