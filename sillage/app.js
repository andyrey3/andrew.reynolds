// Sillage: sort your bottles onto the fragrance wheel, see the families you're
// missing, and find the best bottle and its best dupe in each one.
// Your shelf lives in localStorage on this device only.

(() => {
  const STORE = 'sillage-shelf-v1';
  const FAMILY_BY_ID = Object.fromEntries(FAMILIES.map(f => [f.id, f]));
  const GROUP_BY_ID = Object.fromEntries(GROUPS.map(g => [g.id, g]));
  const SVG = 'http://www.w3.org/2000/svg';

  // ---------- helpers ----------
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  function s(tag, attrs) {
    const el = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
    return el;
  }
  const norm = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').trim();
  const keyOf = (name, brand) => norm(brand + ' ' + name);
  const price = n => '$'.repeat(n);
  const priceLabel = n => ['', 'Budget', 'Mid-range', 'Designer', 'Niche or luxury'][n];

  // Text on light family colors is ink; on the dark blue Water segment it's white.
  function inkOn(hex) {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(c => {
      c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.22 ? '#231F2B' : '#FFFFFF';
  }

  // ---------- state ----------
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.filter(b => b && typeof b.name === 'string' && typeof b.brand === 'string' &&
        b.name.length > 0 && b.name.length <= 120 && b.brand.length <= 80 && FAMILY_BY_ID[b.family])
        .map(b => ({ name: b.name, brand: b.brand, family: b.family }));
    } catch { return []; }
  }
  let shelf = load();
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(shelf)); } catch { /* private mode: keep in memory */ }
  }
  const owned = (name, brand) => shelf.some(b => keyOf(b.name, b.brand) === keyOf(name, brand));
  const inFamily = id => shelf.filter(b => b.family === id);

  function addBottle(name, brand, family) {
    if (owned(name, brand)) return;
    shelf.push({ name, brand, family });
    save();
    lastAdded = family;
    render();
    announce(`Added ${name}. ${FAMILY_BY_ID[family].name} is on your wheel.`);
  }
  function removeBottle(i) {
    const b = shelf[i];
    shelf.splice(i, 1);
    save();
    render();
    announce(`Removed ${b.name}.`);
  }
  function moveBottle(i, family) {
    shelf[i].family = family;
    save();
    lastAdded = family;
    render();
  }

  // ---------- wheel ----------
  const wheelEl = document.getElementById('wheel');
  const N = FAMILIES.length;
  const STEP = 360 / N;
  const START = -90 - STEP * 1.5; // first segment sits just left of twelve o'clock
  const R = { outer: 194, ring: 124, inner: 120, hub: 70 };
  let selected = null;
  let lastAdded = null;

  const pt = (r, deg) => {
    const a = deg * Math.PI / 180;
    return [+(r * Math.cos(a)).toFixed(2), +(r * Math.sin(a)).toFixed(2)];
  };
  function arc(r0, r1, a0, a1) {
    const [x0, y0] = pt(r1, a0), [x1, y1] = pt(r1, a1);
    const [x2, y2] = pt(r0, a1), [x3, y3] = pt(r0, a0);
    const big = a1 - a0 > 180 ? 1 : 0;
    return `M${x0} ${y0}A${r1} ${r1} 0 ${big} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${big} 0 ${x3} ${y3}Z`;
  }
  // Text centered at a radius and angle, rotated to read along the ring and
  // flipped on the lower half so it is never upside down.
  function ringText(lines, r, deg, cls, fill) {
    const [x, y] = pt(r, deg);
    let rot = deg + 90;
    if (deg > 0 && deg < 180) rot -= 180;
    const t = s('text', { x, y, class: cls, fill, transform: `rotate(${rot.toFixed(2)} ${x} ${y})`, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
    const lh = 1.15;
    lines.forEach((line, i) => {
      const sp = s('tspan', { x, dy: i === 0 ? `${-(lines.length - 1) * lh / 2}em` : `${lh}em` });
      sp.textContent = line;
      t.append(sp);
    });
    return t;
  }

  function drawWheel() {
    wheelEl.replaceChildren();
    const defs = s('defs');
    const pat = s('pattern', { id: 'hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
    pat.append(s('line', { x1: 0, y1: 0, x2: 0, y2: 6, class: 'hatch-line' }));
    defs.append(pat);
    wheelEl.append(defs);

    // Inner ring: the four big families.
    let i = 0;
    for (const g of GROUPS) {
      const members = FAMILIES.filter(f => f.group === g.id);
      const a0 = START + i * STEP, a1 = a0 + members.length * STEP;
      const have = members.filter(f => inFamily(f.id).length).length;
      const p = s('path', { d: arc(R.hub, R.inner, a0 + 0.6, a1 - 0.6), fill: g.color, class: 'group', 'fill-opacity': have ? 0.9 : 0.22 });
      wheelEl.append(p);
      wheelEl.append(ringText([g.name], (R.hub + R.inner) / 2, (a0 + a1) / 2, 'group-label', have ? '#FFFFFF' : g.color));
      i += members.length;
    }

    // Outer ring: the 13 families you can collect.
    FAMILIES.forEach((f, idx) => {
      const a0 = START + idx * STEP, a1 = a0 + STEP, mid = (a0 + a1) / 2;
      const count = inFamily(f.id).length;
      const g = s('g', {
        class: 'seg' + (count ? ' have' : ' miss') + (selected === f.id ? ' sel' : '') + (lastAdded === f.id ? ' pop' : ''),
        role: 'button', tabindex: 0,
        'aria-label': `${f.name}: ${count ? count + (count === 1 ? ' bottle' : ' bottles') : 'missing'}. Open recommendations.`
      });
      const [dx, dy] = pt(8, mid);
      g.style.setProperty('--dx', dx + 'px');
      g.style.setProperty('--dy', dy + 'px');
      const d = arc(R.ring, R.outer, a0 + 0.35, a1 - 0.35);
      if (count) {
        g.append(s('path', { d, fill: f.color, class: 'seg-fill' }));
      } else {
        g.append(s('path', { d, class: 'seg-empty' }));
        g.append(s('path', { d, fill: 'url(#hatch)', class: 'seg-hatch', style: `color:${f.color}` }));
        g.append(s('path', { d: arc(R.ring + 1.5, R.outer - 1.5, a0 + 0.9, a1 - 0.9), fill: 'none', stroke: f.color, 'stroke-width': 2, 'stroke-dasharray': '3 4' }));
      }
      const words = f.name.split(' ');
      const textFill = count ? inkOn(f.color) : 'var(--muted)';
      g.append(ringText(words, 158, mid, 'seg-label', textFill));
      // One dot per bottle, up to five, along the outer edge.
      const dots = Math.min(count, 5);
      for (let k = 0; k < dots; k++) {
        const [cx, cy] = pt(183, mid + (k - (dots - 1) / 2) * 3.6);
        g.append(s('circle', { cx, cy, r: 2.6, fill: textFill, class: 'dot' }));
      }
      g.addEventListener('click', () => openFamily(f.id));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFamily(f.id); } });
      wheelEl.append(g);
    });

    // Hub.
    const covered = FAMILIES.filter(f => inFamily(f.id).length).length;
    wheelEl.append(s('circle', { r: R.hub - 3, class: 'hub' }));
    const big = s('text', { y: -6, class: 'hub-num', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
    big.textContent = covered;
    const small = s('text', { y: 24, class: 'hub-sub', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
    small.textContent = `of ${N} families`;
    wheelEl.append(big, small);
    lastAdded = null;
  }

  // ---------- missing list ----------
  function drawMissing() {
    const box = document.getElementById('missing');
    const missing = FAMILIES.filter(f => !inFamily(f.id).length);
    const title = document.getElementById('missing-title');
    if (!shelf.length) {
      title.textContent = 'Every family is open';
      box.replaceChildren(h('p', { class: 'hint' }, 'Add the bottles you own below and they will fill in the wheel. Tap any family to see the best bottles and their dupes.'));
      return;
    }
    if (!missing.length) {
      title.textContent = 'No gaps left';
      box.replaceChildren(h('p', { class: 'hint' }, 'Your collection covers the whole wheel. Tap any family to compare your bottles with the best in it.'));
      return;
    }
    title.textContent = missing.length === 1 ? 'One family missing' : `${missing.length} families missing`;
    box.replaceChildren(h('ul', { class: 'gaps' }, missing.map(f => {
      const top = f.picks[0];
      return h('li', {}, h('button', { class: 'gap', type: 'button', onclick: () => openFamily(f.id) },
        h('span', { class: 'swatch', style: `background:${f.color}` }),
        h('span', { class: 'gap-text' },
          h('strong', {}, f.name),
          h('span', {}, `Start with ${top.name}` + (top.dupe && !top.dupe.style ? `, or ${top.dupe.brand} ${top.dupe.name} for less` : ''))
        )
      ));
    })));
  }

  // ---------- shelf ----------
  function familySelect(value, onchange, label) {
    const sel = h('select', { 'aria-label': label, onchange: e => onchange(e.target.value) },
      GROUPS.map(g => h('optgroup', { label: g.name },
        FAMILIES.filter(f => f.group === g.id).map(f => h('option', { value: f.id, selected: f.id === value }, f.name)))));
    return sel;
  }

  function drawShelf() {
    const list = document.getElementById('shelf');
    document.getElementById('shelf-count').textContent = shelf.length ? `${shelf.length} ${shelf.length === 1 ? 'bottle' : 'bottles'}` : '';
    if (!shelf.length) {
      list.replaceChildren(h('p', { class: 'hint' }, 'Nothing here yet. Search for a bottle you own to place it on the wheel.'));
      return;
    }
    const rows = [];
    for (const f of FAMILIES) {
      shelf.forEach((b, i) => {
        if (b.family !== f.id) return;
        rows.push(h('li', { class: 'bottle', style: `--fam:${f.color}` },
          h('span', { class: 'bottle-name' }, h('strong', {}, b.name), b.brand ? h('span', {}, b.brand) : null),
          h('label', { class: 'fam-pick' }, h('span', { class: 'swatch', style: `background:${f.color}` }),
            familySelect(b.family, v => moveBottle(i, v), `Family for ${b.name}`)),
          h('button', { class: 'remove', type: 'button', 'aria-label': `Remove ${b.name}`, onclick: () => removeBottle(i) }, '×')
        ));
      });
    }
    list.replaceChildren(h('ul', { class: 'bottles' }, rows));
  }

  // ---------- add search ----------
  const addInput = document.getElementById('add');
  const results = document.getElementById('add-results');
  let pendingCustom = null;

  function matches(q, pool) {
    const words = norm(q).split(' ').filter(Boolean);
    if (!words.length) return [];
    return pool.filter(c => {
      const hay = norm(c.brand + ' ' + c.name);
      return words.every(w => hay.includes(w));
    });
  }

  function drawResults() {
    const q = addInput.value.trim();
    if (pendingCustom) {
      results.replaceChildren(h('div', { class: 'custom' },
        h('p', {}, `Which family does ${pendingCustom} smell closest to?`),
        h('div', { class: 'fam-grid' }, FAMILIES.map(f => h('button', {
          type: 'button', class: 'fam-chip', style: `--fam:${f.color}`,
          onclick: () => { addBottle(pendingCustom, '', f.id); pendingCustom = null; addInput.value = ''; drawResults(); addInput.focus(); }
        }, h('span', { class: 'swatch', style: `background:${f.color}` }), f.name))),
        h('button', { type: 'button', class: 'text-btn', onclick: () => { pendingCustom = null; drawResults(); addInput.focus(); } }, 'Cancel')
      ));
      results.hidden = false;
      return;
    }
    if (!q) { results.replaceChildren(); results.hidden = true; return; }
    const found = matches(q, CATALOG).slice(0, 7);
    const items = found.map(c => {
      const f = FAMILY_BY_ID[c.family];
      const have = owned(c.name, c.brand);
      return h('li', {}, h('button', {
        type: 'button', class: 'result', disabled: have,
        onclick: () => { addBottle(c.name, c.brand, c.family); addInput.value = ''; drawResults(); addInput.focus(); }
      },
        h('span', { class: 'result-name' }, h('strong', {}, c.name), h('span', {}, c.brand)),
        h('span', { class: 'result-fam' }, h('span', { class: 'swatch', style: `background:${f.color}` }), have ? 'On your shelf' : f.name)
      ));
    });
    items.push(h('li', {}, h('button', {
      type: 'button', class: 'result custom-row',
      onclick: () => { pendingCustom = q; drawResults(); }
    }, `Add “${q}” and choose its family`)));
    results.replaceChildren(h('ul', {}, items));
    results.hidden = false;
  }
  addInput.addEventListener('input', () => { pendingCustom = null; drawResults(); });
  addInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); results.querySelector('button:not([disabled])')?.click(); }
    if (e.key === 'Escape') { addInput.value = ''; pendingCustom = null; drawResults(); }
  });

  // ---------- family sheet ----------
  const sheet = document.getElementById('sheet');
  const sheetBody = document.getElementById('sheet-body');

  function pickRow(p) {
    const have = owned(p.name, p.brand);
    let dupeLine;
    if (p.dupe && p.dupe.style) {
      dupeLine = h('p', { class: 'dupe' }, h('span', { class: 'dupe-tag' }, 'Similar style for less'),
        h('span', {}, `${p.dupe.brand} ${p.dupe.name}`), h('span', { class: 'price', title: priceLabel(p.dupe.price) }, price(p.dupe.price)));
    } else if (p.dupe) {
      const dHave = owned(p.dupe.name, p.dupe.brand);
      dupeLine = h('p', { class: 'dupe' }, h('span', { class: 'dupe-tag' }, 'Best dupe'),
        h('span', {}, `${p.dupe.brand} ${p.dupe.name}`), h('span', { class: 'price', title: priceLabel(p.dupe.price) }, price(p.dupe.price)),
        addBtn(p.dupe.name, p.dupe.brand, dHave));
    } else if (p.cheap) {
      dupeLine = h('p', { class: 'dupe quiet' }, 'Already affordable, so there is no need for a dupe.');
    } else {
      dupeLine = h('p', { class: 'dupe quiet' }, 'No close dupe yet. Buy a sample before a full bottle.');
    }
    return h('li', { class: 'pick' },
      h('div', { class: 'pick-head' },
        h('div', {}, h('strong', {}, p.name), h('span', { class: 'brand' }, p.brand)),
        h('span', { class: 'price', title: priceLabel(p.price) }, price(p.price)),
        addBtn(p.name, p.brand, have)),
      h('p', { class: 'notes' }, p.notes),
      dupeLine);
  }
  function addBtn(name, brand, have) {
    return h('button', {
      type: 'button', class: 'add-btn' + (have ? ' done' : ''), disabled: have,
      'aria-label': have ? `${name} is on your shelf` : `Add ${name} to your shelf`,
      onclick: () => {
        const c = CATALOG.find(x => keyOf(x.name, x.brand) === keyOf(name, brand));
        addBottle(name, brand, c ? c.family : currentFamily);
        renderSheet();
      }
    }, have ? 'Owned' : 'Add');
  }

  let currentFamily = null;
  let sheetQuery = '';
  function renderSheet() {
    const f = FAMILY_BY_ID[currentFamily];
    const g = GROUP_BY_ID[f.group];
    const mine = inFamily(f.id);
    sheet.style.setProperty('--fam', f.color);
    sheet.style.setProperty('--fam-ink', inkOn(f.color));

    const pool = CATALOG.filter(c => c.family === f.id);
    const searchList = h('ul', { class: 'catalog' });
    const fillSearch = () => {
      const q = sheetQuery.trim();
      const list = q ? matches(q, pool) : pool;
      searchList.replaceChildren(...(list.length ? list.map(c => h('li', {},
        h('span', { class: 'result-name' }, h('strong', {}, c.name), h('span', {}, c.brand)),
        addBtn(c.name, c.brand, owned(c.name, c.brand))))
        : [h('li', { class: 'hint' }, `No ${f.name.toLowerCase()} bottles match “${q}”. Add it from Your shelf to choose its family yourself.`)]));
    };
    fillSearch();
    const search = h('input', {
      type: 'search', value: sheetQuery, placeholder: `Search ${f.name.toLowerCase()} fragrances`,
      'aria-label': `Search ${f.name} fragrances`, autocomplete: 'off',
      oninput: e => { sheetQuery = e.target.value; fillSearch(); }
    });

    sheetBody.replaceChildren(
      h('header', { class: 'sheet-head' },
        h('p', { class: 'sheet-group' }, `${g.name} side of the wheel`),
        h('h2', { id: 'sheet-title' }, f.name),
        h('p', { class: 'sheet-status' }, mine.length ? `You own ${mine.length}: ${mine.map(b => b.name).join(', ')}` : 'Missing from your collection')),
      h('div', { class: 'sheet-content' },
        h('p', { class: 'smells' }, f.smells),
        h('p', { class: 'wear' }, f.wear),
        h('h3', {}, `Best ${f.name.toLowerCase()} fragrances`),
        h('ul', { class: 'picks' }, f.picks.map(pickRow)),
        h('h3', {}, `More ${f.name.toLowerCase()} bottles`),
        search,
        searchList,
        h('p', { class: 'fine' }, 'Dupes come from community comparisons and vary by batch. Prices: $ budget to $$$$ niche.')
      )
    );
  }

  function openFamily(id) {
    if (currentFamily !== id) sheetQuery = '';
    currentFamily = id;
    selected = id;
    drawWheel();
    renderSheet();
    if (!sheet.open) sheet.showModal();
    sheet.querySelector('.sheet-content').scrollTop = 0;
    sheet.scrollTop = 0;
  }
  sheet.addEventListener('close', () => {
    selected = null;
    drawWheel();
    const seg = wheelEl.querySelectorAll('.seg')[FAMILIES.findIndex(f => f.id === currentFamily)];
    seg?.focus({ preventScroll: true });
  });
  document.getElementById('sheet-close').addEventListener('click', () => sheet.close());
  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });

  // ---------- misc ----------
  const live = document.getElementById('live');
  function announce(msg) { live.textContent = ''; requestAnimationFrame(() => { live.textContent = msg; }); }

  function render() {
    drawWheel();
    drawMissing();
    drawShelf();
    if (sheet.open) renderSheet();
  }
  render();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
