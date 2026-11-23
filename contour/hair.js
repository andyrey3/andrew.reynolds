// Contour — hairstyle catalog, ranking and drawings.
// Drawings use a 200 × 280 template head: hairline at y 52, landmark 10
// (upper forehead) at y 66, cheekbones at x 48–152 (y 110), chin at y 204.

const HS = (() => {
  const T = { cx: 100, top: 66, chin: 204, cheekW: 104 };

  // fit: 2 great, 1 good, 0 can work, -1 not ideal — per face shape
  const F = (oval, round, square, oblong, heart, diamond, triangle) => ({ oval, round, square, oblong, heart, diamond, triangle });
  const ALL = ['straight', 'wavy', 'curly', 'coily'];

  const STYLES = [
    // ----- Men's -----
    { id: 'buzz', name: 'Buzz cut', who: 'm', len: 'short', tex: ALL, maint: 1, fit: F(2, -1, 2, 0, 0, 0, -1),
      why: 'Even and close all over, so it shows off your natural bone structure.',
      ask: 'Clippers all over with a #2 to #4 guard, neckline cleaned up.',
      tip: 'Nothing to style. Touch it up every 2–3 weeks.',
      draw: { pts: [[50, 102], [47, 80], [52, 52], [68, 32], [100, 27]], cap: true } },
    { id: 'crew', name: 'Crew cut', who: 'm', len: 'short', tex: ['straight', 'wavy', 'curly'], maint: 1, fit: F(2, 1, 2, 1, 1, 1, 0),
      why: 'A little length on top and short sides keep things balanced without adding width.',
      ask: 'Short tapered sides, about an inch on top, a touch longer at the front.',
      tip: 'A small amount of matte paste, pushed up at the front.',
      draw: { pts: [[50, 100], [47, 78], [51, 48], [66, 26], [100, 19]], cap: true } },
    { id: 'crop', name: 'Textured crop', who: 'm', len: 'short', tex: ['straight', 'wavy'], maint: 1, fit: F(2, 1, 2, 2, 1, 2, 2),
      why: 'A choppy fringe softens strong angles and covers a high or narrow forehead.',
      ask: 'Low or skin fade on the sides, 2–3 inches of point-cut texture on top, fringe cut short and choppy.',
      tip: 'Rough-dry with sea salt spray, then a little clay pushed forward.',
      draw: { pts: [[50, 98], [47, 78], [51, 46], [64, 22], [100, 15]], cap: true, fringe: ['textured'] } },
    { id: 'quiff', name: 'Quiff', who: 'm', len: 'short', tex: ['straight', 'wavy'], maint: 3, fit: F(2, 2, 1, -1, -1, 0, 2),
      why: 'Height at the front makes the face look longer and balances a wider jaw.',
      ask: 'Short tapered sides, 3–4 inches on top, longest at the front for lift.',
      tip: 'Blow-dry up and back over a round brush, then set with pomade.',
      draw: { pts: [[51, 96], [48, 78], [52, 50], [58, 24], [74, 4], [100, 0]], cap: true } },
    { id: 'sidepart', name: 'Side part', who: 'm', len: 'short', tex: ['straight', 'wavy'], maint: 2, fit: F(2, 2, 2, 1, 1, 2, 1),
      why: 'The off-centre line adds structure to soft features and suits most shapes.',
      ask: 'Scissor-cut sides with a clean side part, 2–3 inches on top.',
      tip: 'Comb to the side while damp and finish with a light cream or pomade.',
      draw: { pts: [[50, 100], [46, 78], [50, 44], [66, 20], [100, 14]], cap: true, fringe: ['sweep'], part: 'side' } },
    { id: 'slick', name: 'Slick back', who: 'm', len: 'short', tex: ['straight', 'wavy'], maint: 2, fit: F(2, 0, 1, -1, -1, -1, 1),
      why: 'It shows your whole face, so it works best on balanced shapes.',
      ask: '4–5 inches on top, short to medium sides blended in.',
      tip: 'Comb straight back with a water-based pomade while damp.',
      draw: { pts: [[50, 100], [46, 80], [49, 48], [64, 22], [100, 14]], cap: true } },
    { id: 'undercut', name: 'Undercut', who: 'm', len: 'short', tex: ['straight', 'wavy'], maint: 2, fit: F(2, 2, 1, -1, 0, 0, 2),
      why: 'Very short sides with length on top make the face look longer and slimmer.',
      ask: 'Sides and back clipped short with no blend, 4–6 inches left on top.',
      tip: 'Wear it swept back or to one side with a medium-hold product.',
      draw: { pts: [[53, 92], [51, 72], [55, 46], [60, 18], [78, 6], [100, 4]], cap: true } },
    { id: 'curlytop', name: 'Curly top & fade', who: 'm', len: 'short', tex: ['wavy', 'curly', 'coily'], maint: 1, fit: F(2, 2, 2, 0, 1, 1, 2),
      why: 'Natural volume on top adds height while tight sides keep the face slim.',
      ask: 'Mid or high fade, 2–3 inches of curl left on top, shaped rather than thinned.',
      tip: 'Curl cream on damp hair, scrunch and let it air-dry.',
      draw: { pts: [[51, 98], [48, 80], [50, 48], [58, 20], [80, 6], [100, 4]], cap: true, edge: 'curly', amp: 4 } },
    { id: 'messy', name: 'Messy fringe', who: 'm', len: 'short', tex: ['straight', 'wavy'], maint: 1, fit: F(2, 0, 2, 2, 2, 2, 1),
      why: 'A fringe shortens a long face and softens a wide forehead or strong jaw.',
      ask: 'Medium taper on the sides, about 3 inches on top, textured and pushed forward.',
      tip: 'Sea salt spray, rough-dry forward, then a pinch of matte clay.',
      draw: { pts: [[48, 104], [45, 80], [49, 44], [64, 20], [100, 14]], cap: true, fringe: ['textured-long'] } },
    { id: 'flow', name: 'Medium flow', who: 'm', len: 'medium', tex: ['straight', 'wavy', 'curly'], maint: 2, fit: F(2, 0, 2, 1, 2, 2, 0),
      why: 'Length around the ears and jaw adds width low down and softens angles.',
      ask: 'Grown to ear or neck length, layered so it falls back naturally.',
      tip: 'A light cream, then push back with your fingers or tuck behind the ears.',
      draw: { pts: [[60, 156], [48, 134], [44, 96], [48, 50], [64, 22], [100, 16]], edge: 'wavy', amp: 2 } },
    { id: 'manbun', name: 'Man bun', who: 'm', len: 'long', tex: ['straight', 'wavy', 'curly'], maint: 2, fit: F(2, 1, 1, -1, 0, 1, 1),
      why: 'Pulled back, it opens up the face and adds a little height.',
      ask: 'Keep the length even so it all reaches the bun, and tidy the neckline.',
      tip: 'Gather at the crown and tie loosely; a little messy looks best.',
      draw: { pts: [[50, 100], [47, 80], [51, 48], [66, 26], [100, 22]], cap: true, extra: 'bun-small' } },
    { id: 'longm', name: 'Long layers', who: 'm', len: 'long', tex: ['straight', 'wavy', 'curly'], maint: 2, fit: F(2, 0, 2, -1, 2, 2, 0),
      why: 'Length past the jaw softens a square face and fills out a narrow chin.',
      ask: 'Shoulder length with long layers and a centre or side part.',
      tip: 'Leave-in conditioner and air-dry, with a little oil on the ends.',
      draw: { pts: [[64, 234], [52, 204], [46, 150], [43, 100], [47, 52], [64, 22], [100, 16]], edge: 'wavy', amp: 2, part: 'center' } },

    // ----- Women's -----
    { id: 'pixie', name: 'Pixie cut', who: 'f', len: 'short', tex: ['straight', 'wavy'], maint: 2, fit: F(2, 1, 0, 0, 2, 2, 2),
      why: 'Short and soft with a sweeping fringe, it puts your eyes and cheekbones first.',
      ask: 'Short at the back and sides, a longer side-swept fringe and texture on top.',
      tip: 'Texturizing spray, then sweep the fringe to the side with your fingers.',
      draw: { pts: [[50, 106], [46, 82], [49, 48], [64, 22], [100, 16]], cap: true, fringe: ['side'] } },
    { id: 'bob', name: 'Classic bob', who: 'f', len: 'medium', tex: ['straight', 'wavy'], maint: 2, fit: F(2, -1, -1, 2, 2, 1, -1),
      why: 'Volume at chin level adds width low on the face, balancing a narrow chin or long face.',
      ask: 'Blunt cut at chin length, angled slightly longer toward the front.',
      tip: 'Blow-dry with a round brush, turning the ends under.',
      draw: { pts: [[60, 190], [46, 166], [41, 112], [45, 54], [64, 24], [100, 18]], part: 'side' } },
    { id: 'bangbob', name: 'Bob with bangs', who: 'f', len: 'medium', tex: ['straight', 'wavy'], maint: 2, fit: F(2, -1, 0, 2, 1, 2, -1),
      why: 'Bangs shorten a long face and hide a narrow or high forehead.',
      ask: 'Chin-length bob with full bangs that reach the eyebrows.',
      tip: 'Dry the bangs first with a flat brush, side to side, so they lie flat.',
      draw: { pts: [[60, 190], [46, 166], [41, 112], [45, 54], [64, 24], [100, 18]], fringe: ['blunt'] } },
    { id: 'lob', name: 'Lob', who: 'f', len: 'medium', tex: ['straight', 'wavy', 'curly'], maint: 1, fit: F(2, 2, 2, 1, 2, 2, 1),
      why: 'Ending past the chin, it lengthens a round face and softens a square jaw.',
      ask: 'Collarbone length with soft, hidden layers.',
      tip: 'Loose bends with a flat iron, or a quick rough-dry and a round brush at the ends.',
      draw: { pts: [[62, 236], [48, 214], [43, 160], [42, 112], [46, 54], [64, 24], [100, 18]], part: 'side', fringe: ['frame'] } },
    { id: 'layers', name: 'Long layers', who: 'f', len: 'long', tex: ['straight', 'wavy', 'curly'], maint: 1, fit: F(2, 2, 2, 0, 1, 1, 1),
      why: 'Layers starting below the chin draw the eye down and slim a round or square face.',
      ask: 'Long layers starting at the chin, with face-framing pieces at the front.',
      tip: 'Blow-dry with a round brush, flicking the front pieces away from your face.',
      draw: { pts: [[70, 272], [52, 256], [45, 210], [42, 140], [45, 56], [64, 24], [100, 18]], edge: 'layered', amp: 3, part: 'center', fringe: ['frame'] } },
    { id: 'curtain', name: 'Curtain bangs', who: 'f', len: 'long', tex: ['straight', 'wavy'], maint: 2, fit: F(2, 1, 2, 2, 2, 2, 2),
      why: 'Centre-parted bangs frame the cheekbones and soften a wide forehead or strong jaw.',
      ask: 'Centre-parted bangs, shortest between the brows and sweeping out to the cheekbones.',
      tip: 'Blow-dry the bangs over a round brush, away from your face.',
      draw: { pts: [[70, 270], [52, 254], [45, 210], [42, 140], [45, 56], [64, 24], [100, 18]], edge: 'layered', amp: 2, fringe: ['curtain'] } },
    { id: 'bluntbangs', name: 'Long with blunt bangs', who: 'f', len: 'long', tex: ['straight'], maint: 2, fit: F(2, -1, 0, 2, 1, 1, 0),
      why: 'Straight bangs shorten a long face and draw attention to your eyes.',
      ask: 'Long, one-length hair with full blunt bangs at brow length.',
      tip: 'Smooth the bangs with a flat iron and trim them every 3–4 weeks.',
      draw: { pts: [[66, 270], [50, 262], [44, 200], [42, 120], [45, 56], [64, 24], [100, 18]], fringe: ['blunt'] } },
    { id: 'waves', name: 'Long waves', who: 'f', len: 'long', tex: ['wavy', 'curly', 'straight'], maint: 2, fit: F(2, 1, 2, 2, 2, 2, 1),
      why: 'Width and movement at the sides balance a long face and soften angles.',
      ask: 'Long layers so the waves stay bouncy, with a side part.',
      tip: 'Curl cream or mousse, scrunch, then diffuse or air-dry.',
      draw: { pts: [[66, 268], [46, 250], [37, 190], [37, 120], [44, 56], [64, 24], [100, 18]], edge: 'wavy', amp: 4, part: 'side' } },
    { id: 'shag', name: 'Shag', who: 'f', len: 'medium', tex: ['wavy', 'curly', 'straight'], maint: 1, fit: F(2, 0, 2, 2, 1, 2, 2),
      why: 'Choppy volume at the crown and soft bangs widen the top and soften the jaw.',
      ask: 'Lots of short layers at the crown, longer at the ends, with wispy curtain bangs.',
      tip: 'Texturizing spray and scrunch; it should look a little undone.',
      draw: { pts: [[60, 226], [42, 204], [36, 150], [36, 100], [42, 48], [62, 16], [100, 10]], edge: 'layered', amp: 5, fringe: ['curtain'] } },
    { id: 'sideswept', name: 'Deep side part', who: 'f', len: 'long', tex: ['straight', 'wavy'], maint: 2, fit: F(2, 2, 2, 1, 2, 1, 1),
      why: 'The diagonal line breaks up width and adds height on one side.',
      ask: 'Long layers with a deep side part and a long, sweeping front.',
      tip: 'Flip your part to the other side while drying for lift at the root.',
      draw: { pts: [[68, 268], [52, 250], [45, 200], [42, 130], [45, 56], [64, 24], [100, 16]], asym: .08, fringe: ['side-long'], part: 'deep' } },
    { id: 'curls', name: 'Big curls', who: 'f', len: 'long', tex: ['curly', 'coily'], maint: 2, fit: F(2, -1, 1, 2, 2, 2, 0),
      why: 'Rounded volume adds width, which balances a long or narrow face.',
      ask: 'A curly cut done dry, curl by curl, with long layers so it doesn’t turn triangular.',
      tip: 'Leave-in and gel on soaking-wet hair, then diffuse. Don’t brush it dry.',
      draw: { pts: [[60, 236], [34, 212], [24, 150], [26, 90], [36, 40], [62, 10], [100, 4]], edge: 'curly', amp: 6 } },
    { id: 'pony', name: 'High ponytail', who: 'f', len: 'long', tex: ALL, maint: 1, fit: F(2, 2, 1, -1, 0, 0, 1),
      why: 'Pulling your hair up and back lifts the face and adds height.',
      ask: 'Any long cut; ask for even length so it all reaches the crown.',
      tip: 'Brush up smooth, tie at the crown and wrap a strand around the band.',
      draw: { pts: [[50, 100], [47, 80], [50, 48], [66, 26], [100, 20]], cap: true, extra: 'pony' } },
    { id: 'topknot', name: 'Top knot', who: 'f', len: 'long', tex: ALL, maint: 1, fit: F(2, 2, 1, -1, -1, 0, 2),
      why: 'Volume on top adds height and draws the eye upward.',
      ask: 'Any long cut; keep face-framing pieces long if you like leaving some out.',
      tip: 'Twist into a loose bun at the crown and pull a few pieces out at the front.',
      draw: { pts: [[50, 100], [47, 80], [50, 48], [66, 26], [100, 20]], cap: true, extra: 'bun' } }
  ];

  // ---------- Ranking ----------

  const MATCH = { 2: 'Great match', 1: 'Good match', 0: 'Can work', '-1': 'Not ideal' };
  function rank(shape, prefs) {
    return STYLES
      .filter(s => prefs.who === 'all' || s.who === prefs.who)
      .map(s => {
        const fit = s.fit[shape] ?? 0;
        let score = fit * 3;
        const texOk = !prefs.type || s.tex.includes(prefs.type);
        if (!texOk) score -= 4;
        const lenOk = !prefs.length || prefs.length === 'any' || s.len === prefs.length;
        if (!lenOk) score -= 5;
        if (prefs.effort === 'low' && s.maint === 3) score -= 2;
        return { s, fit, score, texOk, lenOk, label: MATCH[fit] };
      })
      .sort((a, b) => b.score - a.score || b.fit - a.fit);
  }

  // ---------- Drawing ----------

  // Catmull-Rom through points → dense polyline
  function sample(P, steps = 8) {
    const out = [];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(P[P.length - 1]);
    return out;
  }

  // Ripple the edge for waves, curls and choppy layers
  function texture(pts, edge, amp) {
    if (!edge || !amp) return pts;
    return pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let nx = b[1] - a[1], ny = -(b[0] - a[0]);
      const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
      // Point the normal away from the face
      if ((p[0] - 100) * nx + (p[1] - 120) * ny < 0) { nx = -nx; ny = -ny; }
      let o = 0;
      if (edge === 'wavy') o = p[1] > 70 ? amp * Math.sin(i * .55) * Math.min(1, (p[1] - 70) / 30) : 0;
      else if (edge === 'curly') o = amp * Math.abs(Math.sin(i * .7)) - amp * .3;
      else if (edge === 'layered') o = p[1] > 140 ? amp * (i % 4 < 2 ? 1 : -.6) : 0;
      return [p[0] + nx * o, p[1] + ny * o];
    });
  }

  const INNER = [[142, 86], [136, 64], [118, 54], [100, 52], [82, 54], [64, 64], [58, 86]];

  function outline(d) {
    const asym = d.asym || 0;
    const left = d.pts.map(([x, y]) => [100 + (x - 100) * (1 - asym * .5), y]);
    const right = d.pts.slice(0, -1).reverse().map(([x, y]) => [100 + (100 - x) * (1 + asym), y]);
    let pts = texture(sample([...left, ...right]), d.edge, d.amp);
    if (d.cap) pts = pts.concat(INNER);
    return 'M' + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L') + 'Z';
  }

  const mirror = path => { let n = 0; return path.replace(/-?\d+(\.\d+)?/g, v => (n++ % 2 === 0 ? String(200 - parseFloat(v)) : v)); };
  const FRINGE = {
    textured: ['M52 70 C54 40 74 26 100 26 C126 26 146 40 148 70 L140 66 L134 74 L126 66 L118 76 L110 68 L102 78 L94 68 L86 76 L78 66 L70 74 L62 66Z'],
    'textured-long': ['M50 78 C52 40 74 24 100 24 C126 24 148 40 150 78 L142 72 L135 84 L127 74 L119 88 L110 76 L102 90 L94 78 L86 88 L78 74 L70 84 L62 72Z'],
    sweep: ['M60 62 C74 40 112 30 148 56 C130 48 104 50 84 58 C74 62 66 64 60 66Z'],
    side: ['M52 88 C52 52 72 28 104 27 C128 27 144 40 148 62 C132 52 112 54 96 64 C80 74 64 84 52 96Z'],
    'side-long': ['M46 128 C42 80 60 34 104 26 C130 24 146 38 150 58 C128 48 104 54 86 70 C68 86 56 104 46 128Z'],
    blunt: ['M50 70 C52 40 74 26 100 26 C126 26 148 40 150 70 L150 92 C130 95 70 95 50 92Z'],
    curtain: (() => { const l = 'M100 36 C82 36 64 46 56 66 C50 84 50 104 52 122 C58 100 68 80 84 66 C92 58 98 50 100 44Z'; return [l, mirror(l)]; })(),
    frame: (() => { const l = 'M60 58 C48 82 46 130 51 182 C53 150 55 110 66 72Z'; return [l, mirror(l)]; })()
  };
  const EXTRA = {
    bun: 'M100 -18 C114 -18 124 -8 124 4 C124 16 114 26 100 26 C86 26 76 16 76 4 C76 -8 86 -18 100 -18Z',
    'bun-small': 'M100 -8 C110 -8 117 -1 117 8 C117 17 110 24 100 24 C90 24 83 17 83 8 C83 -1 90 -8 100 -8Z',
    pony: 'M108 8 C150 -6 172 40 166 110 C162 150 154 178 140 190 C150 140 148 80 116 34Z'
  };
  const PART = { side: 'M74 22 C72 32 70 44 70 54', center: 'M100 18 L100 50', deep: 'M64 26 C62 36 60 46 58 56' };

  function layers(id) {
    const s = STYLES.find(x => x.id === id), d = s.draw;
    return {
      back: [outline(d), ...(d.extra ? [EXTRA[d.extra]] : [])],
      front: (d.fringe || []).flatMap(f => FRINGE[f]),
      part: d.part ? PART[d.part] : null
    };
  }

  // Template head with the style, for cards and the detail view
  function headSvg(id, color, cls = '') {
    const L = layers(id);
    const shade = 'rgba(0,0,0,.18)';
    return `<svg class="hair-art ${cls}" viewBox="0 -24 200 304" aria-hidden="true">
      <g fill="${color}">${L.back.map(p => `<path d="${p}"/>`).join('')}</g>
      <path class="hair-body" d="M80 186 L80 230 C60 236 28 246 16 280 L184 280 C172 246 140 236 120 230 L120 186Z"/>
      <ellipse class="hair-skin" cx="46" cy="120" rx="7" ry="14"/><ellipse class="hair-skin" cx="154" cy="120" rx="7" ry="14"/>
      <path class="hair-skin" d="M100 52 C134 52 152 74 152 110 C152 150 132 196 100 204 C68 196 48 150 48 110 C48 74 66 52 100 52Z"/>
      <g class="hair-face"><path d="M68 98 C74 94 82 94 88 97M112 97 C118 94 126 94 132 98"/><path d="M72 112 h12M116 112 h12"/><path d="M100 118 C98 132 96 140 102 144"/><path d="M88 166 C96 170 104 170 112 166"/></g>
      ${L.front.length ? `<g fill="${color}">${L.front.map(p => `<path d="${p}"/>`).join('')}</g>` : ''}
      ${L.part ? `<path d="${L.part}" fill="none" stroke="${shade}" stroke-width="2.5" stroke-linecap="round"/>` : ''}
    </svg>`;
  }

  // Map the template onto a scanned photo using its face points
  function photoTransform(top, cheekA, cheekB, chin) {
    const sx = Math.hypot(cheekB.x - cheekA.x, cheekB.y - cheekA.y) / T.cheekW;
    const sy = (chin.y - top.y) / (T.chin - T.top);
    const cx = (cheekA.x + cheekB.x) / 2;
    return { sx, sy, tx: cx - T.cx * sx, ty: top.y - T.top * sy };
  }

  return { STYLES, rank, layers, headSvg, photoTransform };
})();
