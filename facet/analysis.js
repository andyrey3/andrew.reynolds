// Facet — turns the 478 face-mesh landmarks into measurements, scores and
// advice. Pure functions only: no DOM, so it can be checked outside the app.

const FA = (() => {
  // Landmark indices on the MediaPipe face mesh. "A" is the eye on the left
  // of the photo, "B" the one on the right.
  const P = {
    top: 10, glabella: 9, nasion: 168, subnasale: 2, noseTip: 1, chin: 152,
    lipTop: 0, lipUpperIn: 13, lipLowerIn: 14, lipBottom: 17,
    mouthA: 61, mouthB: 291, alarA: 129, alarB: 358,
    cheekA: 234, cheekB: 454, jawA: 172, jawB: 397,
    eyeOutA: 33, eyeInA: 133, eyeTopA: 159, eyeBotA: 145,
    eyeOutB: 263, eyeInB: 362, eyeTopB: 386, eyeBotB: 374,
    irisA: 468, irisB: 473, browA: 105, browB: 334
  };
  // Mirror-image pairs used for symmetry
  const PAIRS = [
    [33, 263], [133, 362], [159, 386], [145, 374], [105, 334], [70, 300], [107, 336],
    [129, 358], [64, 294], [61, 291], [234, 454], [93, 323], [132, 361],
    [58, 288], [172, 397], [136, 365], [149, 378], [50, 280], [116, 345]
  ];
  // Outline points used to draw features on the photo
  const OUTLINE = {
    face: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10],
    eyeA: [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33],
    eyeB: [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249, 263],
    browA: [70, 63, 105, 66, 107],
    browB: [300, 293, 334, 296, 336],
    lips: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61],
    lipLine: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308],
    nose: [168, 6, 197, 195, 5, 4, 1],
    noseBase: [129, 64, 98, 97, 2, 326, 327, 294, 358],
    jaw: [234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454]
  };

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const deg = r => r * 180 / Math.PI;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const avg = a => a.reduce((s, x) => s + x, 0) / a.length;

  // Score one measurement against its ideal range: 90–100 inside it, then
  // falling off smoothly; `tol` is how far outside counts as a big miss.
  function rate(v, lo, hi, tol) {
    if (v >= lo && v <= hi) {
      const half = (hi - lo) / 2 || 1;
      return 90 + 10 * (1 - Math.abs(v - (lo + hi) / 2) / half);
    }
    const off = v < lo ? lo - v : v - hi;
    return 35 + 55 * Math.exp(-0.5 * (off / tol) ** 2);
  }

  // Ideal ranges. Sex only changes the jaw. Sources are the usual
  // neoclassical canons and attractiveness studies; treat them as guides.
  function ideals(sex) {
    const jaw = sex === 'f' ? [.80, .88] : sex === 'm' ? [.86, .94] : [.83, .91];
    return {
      tilt: { lo: 3, hi: 8, tol: 4, unit: '°', dp: 1 },
      spacing: { lo: 1, hi: 1.15, tol: .12, unit: '×', dp: 2 },
      openness: { lo: .26, hi: .36, tol: .07, unit: '', dp: 2 },
      jaw: { lo: jaw[0], hi: jaw[1], tol: .06, unit: '×', dp: 2 },
      chin: { lo: 1.9, hi: 2.4, tol: .35, unit: '×', dp: 2 },
      thirds: { lo: .92, hi: 1.06, tol: .1, unit: '×', dp: 2 },
      fifths: { lo: 4.7, hi: 5.3, tol: .35, unit: '×', dp: 2 },
      midface: { lo: .95, hi: 1.08, tol: .1, unit: '×', dp: 2 },
      fwhr: { lo: 1.85, hi: 2.15, tol: .18, unit: '', dp: 2 },
      nose: { lo: 1, hi: 1.2, tol: .14, unit: '×', dp: 2 },
      mouth: { lo: 1.45, hi: 1.7, tol: .15, unit: '×', dp: 2 },
      lips: { lo: 1.3, hi: 1.9, tol: .35, unit: '×', dp: 2 },
      symmetry: { lo: 0, hi: 1.6, tol: 1.6, unit: '%', dp: 1 }
    };
  }

  const METRIC_INFO = {
    tilt: { name: 'Canthal tilt', what: 'Angle from the inner to the outer corner of each eye. A slight upward tilt reads as alert and youthful.' },
    spacing: { name: 'Eye spacing', what: 'Gap between the eyes divided by the width of one eye. The classic ideal is one eye width apart.' },
    openness: { name: 'Eye shape', what: 'Eye height divided by eye width. Lower values look more almond shaped; tiredness and puffiness lower it.' },
    jaw: { name: 'Jaw width', what: 'Jaw width at the angles divided by cheek width. A wider jaw gives a stronger lower face.' },
    chin: { name: 'Chin to philtrum', what: 'Chin height divided by the gap between nose and upper lip. Around 2 to 1 looks balanced.' },
    thirds: { name: 'Facial thirds', what: 'Brow to nose base compared with nose base to chin. Equal thirds is the classic ideal.' },
    fifths: { name: 'Facial fifths', what: 'Face width measured in eye widths. Five eye widths across is the classic ideal.' },
    midface: { name: 'Midface ratio', what: 'Distance between pupils divided by pupil-to-lip height. A compact midface sits near 1.' },
    fwhr: { name: 'Width to height', what: 'Cheek width divided by eyelid-to-lip height. Higher values read as wider and stronger.' },
    nose: { name: 'Nose width', what: 'Width of the nose at the nostrils divided by the gap between the eyes. Close to 1 is balanced.' },
    mouth: { name: 'Mouth width', what: 'Mouth width divided by nose width. About 1.5 to 1.6 looks balanced.' },
    lips: { name: 'Lip ratio', what: 'Lower lip height divided by upper lip height. A lower lip about 1.6 times fuller is the ideal.' },
    symmetry: { name: 'Asymmetry', what: 'Average gap between matching points on each side after mirroring, as a share of face width. Lower is better.' }
  };

  const FEATURES = [
    { id: 'eyes', name: 'Eyes', weight: .2, metrics: { tilt: 2, spacing: 1.5, openness: 1 } },
    { id: 'jaw', name: 'Jawline', weight: .15, metrics: { jaw: 2, chin: 1 } },
    { id: 'symmetry', name: 'Symmetry', weight: .2, metrics: { symmetry: 1 } },
    { id: 'harmony', name: 'Harmony', weight: .25, metrics: { thirds: 1.5, fifths: 1, midface: 1, fwhr: 1 } },
    { id: 'nose', name: 'Nose', weight: .1, metrics: { nose: 1 } },
    { id: 'lips', name: 'Lips', weight: .1, metrics: { lips: 1, mouth: 1 } }
  ];

  // Rotate every point so the pupils sit level, then measure in that frame.
  function level(lm, W, H) {
    const pts = lm.map(p => ({ x: p.x * W, y: p.y * H }));
    let a = pts[P.irisA], b = pts[P.irisB];
    if (a.x > b.x) [a, b] = [b, a];
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const c = mid(a, b), cos = Math.cos(-angle), sin = Math.sin(-angle);
    const out = pts.map(p => {
      const dx = p.x - c.x, dy = p.y - c.y;
      return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
    });
    return { pts: out, angle, center: c };
  }

  function measure(pts) {
    const p = i => pts[i];
    const eyeWA = dist(p(P.eyeOutA), p(P.eyeInA)), eyeWB = dist(p(P.eyeOutB), p(P.eyeInB));
    const eyeW = (eyeWA + eyeWB) / 2;
    const faceW = dist(p(P.cheekA), p(P.cheekB));
    const icd = dist(p(P.eyeInA), p(P.eyeInB));
    const ipd = dist(p(P.irisA), p(P.irisB));
    const pupilY = (p(P.irisA).y + p(P.irisB).y) / 2;
    const noseW = dist(p(P.alarA), p(P.alarB));
    const mouthW = dist(p(P.mouthA), p(P.mouthB));

    // Positive tilt = outer corner higher than inner (y grows downward)
    const tiltA = deg(Math.atan2(p(P.eyeInA).y - p(P.eyeOutA).y, Math.abs(p(P.eyeInA).x - p(P.eyeOutA).x)));
    const tiltB = deg(Math.atan2(p(P.eyeInB).y - p(P.eyeOutB).y, Math.abs(p(P.eyeOutB).x - p(P.eyeInB).x)));
    const openA = dist(p(P.eyeTopA), p(P.eyeBotA)) / eyeWA, openB = dist(p(P.eyeTopB), p(P.eyeBotB)) / eyeWB;

    const midThird = p(P.subnasale).y - p(P.glabella).y;
    const lowThird = p(P.chin).y - p(P.subnasale).y;
    const upperLip = p(P.lipUpperIn).y - p(P.lipTop).y;
    const lowerLip = p(P.lipBottom).y - p(P.lipLowerIn).y;
    const lidY = Math.min(p(P.eyeTopA).y, p(P.eyeTopB).y);

    // Symmetry: mirror each pair across the midline fitted through the
    // pairs' midpoints (x = a·y + b), as a share of face width.
    const mids = PAIRS.map(([i, j]) => mid(p(i), p(j)));
    const my = avg(mids.map(m => m.y)), mx = avg(mids.map(m => m.x));
    const sxy = mids.reduce((s, m) => s + (m.y - my) * (m.x - mx), 0);
    const syy = mids.reduce((s, m) => s + (m.y - my) ** 2, 0) || 1;
    const slope = sxy / syy, icpt = mx - slope * my;
    const reflect = q => {
      // Reflect across the line x - slope·y - icpt = 0
      const d = (q.x - slope * q.y - icpt) / (1 + slope * slope);
      return { x: q.x - 2 * d, y: q.y + 2 * d * slope };
    };
    const asym = avg(PAIRS.map(([i, j]) => dist(reflect(p(i)), p(j)))) / faceW * 100;

    return {
      values: {
        tilt: (tiltA + tiltB) / 2,
        spacing: icd / eyeW,
        openness: (openA + openB) / 2,
        jaw: dist(p(P.jawA), p(P.jawB)) / faceW,
        chin: (p(P.chin).y - p(P.lipBottom).y) / Math.max(1, p(P.lipTop).y - p(P.subnasale).y),
        thirds: midThird / lowThird,
        fifths: faceW / eyeW,
        midface: ipd / Math.max(1, p(P.lipTop).y - pupilY),
        fwhr: faceW / Math.max(1, p(P.lipTop).y - lidY),
        nose: noseW / icd,
        mouth: mouthW / noseW,
        lips: lowerLip / Math.max(.5, upperLip),
        symmetry: asym
      },
      extra: {
        tiltA, tiltB, faceW, forehead: dist(p(54), p(284)) / faceW, faceH: p(P.chin).y - p(P.top).y,
        lengthRatio: (p(P.chin).y - p(P.top).y) / faceW,
        mouthGap: (p(P.lipLowerIn).y - p(P.lipUpperIn).y) / mouthW,
        yaw: (p(P.noseTip).x - p(P.cheekA).x) / faceW - .5,
        openMin: Math.min(openA, openB)
      }
    };
  }

  // Rough shape from length, jaw and forehead width (the mesh stops short
  // of the hairline, so lengths run shorter than a tape measure would)
  function faceShape(v, x) {
    const L = x.lengthRatio, J = v.jaw;
    if (L >= 1.36) return 'oblong';
    if (J >= .9) return 'square';
    if (J < .82) return x.forehead >= .84 ? 'heart' : 'diamond';
    if (L < 1.2) return 'round';
    return 'oval';
  }

  function quality(x) {
    const w = [];
    if (x.faceW < 140) w.push('Your face is small in the photo. Move closer or use a higher-resolution photo.');
    if (Math.abs(x.yaw) > .07) w.push('Your head is turned to one side. Face the camera straight on for accurate symmetry and widths.');
    if (x.mouthGap > .08) w.push('Your mouth is open or smiling. Lip and chin measurements are most accurate with lips gently closed.');
    if (x.openMin < .15) w.push('Your eyes look partly closed, which lowers the eye scores. Look straight into the lens.');
    return w;
  }

  // Main entry: landmarks (normalized) + image size → full report.
  function analyze(lm, W, H, sex) {
    const lv = level(lm, W, H);
    const { values, extra } = measure(lv.pts);
    const ideal = ideals(sex);
    const metrics = {};
    for (const k in values) {
      const r = ideal[k];
      metrics[k] = { value: values[k], score: Math.round(rate(values[k], r.lo, r.hi, r.tol)), lo: r.lo, hi: r.hi, unit: r.unit, dp: r.dp, dir: values[k] < r.lo ? 'low' : values[k] > r.hi ? 'high' : 'ok' };
    }
    const features = FEATURES.map(f => {
      const ws = Object.entries(f.metrics);
      const score = Math.round(ws.reduce((s, [k, w]) => s + metrics[k].score * w, 0) / ws.reduce((s, [, w]) => s + w, 0));
      return { id: f.id, name: f.name, score, metrics: ws.map(([k]) => k) };
    });
    const overall = Math.round(features.reduce((s, f) => s + f.score * FEATURES.find(x => x.id === f.id).weight, 0));
    return { overall, features, metrics, shape: faceShape(values, extra), warnings: quality(extra), extra, angle: lv.angle, center: lv.center, pts: lv.pts };
  }

  // Lifestyle answers → points the plan can add to how your face reads in
  // photos (skin, leanness, grooming and hair change appearance a lot).
  const QUIZ = [
    { id: 'skin', q: 'What does your skincare look like?', opts: [['none', 'Nothing really', 5], ['some', 'Wash my face, sometimes moisturize', 3], ['full', 'Cleanser, moisturizer and SPF most days', 1]] },
    { id: 'sleep', q: 'How much do you usually sleep?', opts: [['low', 'Under 6 hours', 3], ['mid', '6 to 7 hours', 1.5], ['good', '7 hours or more', 0]] },
    { id: 'fit', q: 'How would you describe your body fat?', opts: [['high', 'Higher than I want', 6], ['mid', 'About average', 3], ['lean', 'Lean', .5]] },
    { id: 'groom', q: 'Haircut, brows and facial hair:', opts: [['none', 'I don’t really think about it', 4], ['some', 'I get regular haircuts', 2], ['dialed', 'All dialed in for my face shape', .5]] }
  ];
  function potential(overall, answers) {
    const gain = QUIZ.reduce((s, q) => {
      const o = q.opts.find(o => o[0] === answers[q.id]);
      return s + (o ? o[2] : 2);
    }, 0);
    return Math.min(97, Math.max(overall + 2, Math.round(overall + gain * (100 - overall) / 40)));
  }

  // Advice for each measurement outside its range. `m` = only shown to men,
  // `f` = only shown to women. Structural notes keep things honest: bone
  // structure doesn't change with exercises, but how it reads in photos can.
  const TIPS = {
    tilt: {
      low: [
        { t: 'Shape the tail of your brows', d: 'A brow tail that ends slightly higher than the head lifts the whole eye area. Get them shaped once, then maintain with tweezers.' },
        { t: 'Cut down under-eye puffiness', d: 'Less salt and alcohol at night, 7+ hours of sleep and a cold spoon or eye patches in the morning make the outer corners sit higher.' },
        { t: 'Tightline or wing the outer corner', d: 'A thin line that angles up at the outer corner makes a neutral tilt read as positive.', sex: 'f' },
        { t: 'It’s structural', d: 'Tilt is set by bone and tendon. A neutral or slightly negative tilt is very common and only one small part of attractiveness.', soft: false }
      ],
      high: [{ t: 'Soften the brow arch', d: 'A flatter brow balances very upturned eyes.' }]
    },
    spacing: {
      high: [
        { t: 'Fill in the inner brows', d: 'Brows that start a little closer to the nose make wide-set eyes look more balanced.' },
        { t: 'Pick frames with a dark bridge', d: 'A keyhole or dark bridge on glasses visually pulls the eyes together.' }
      ],
      low: [
        { t: 'Clean up between the brows', d: 'Keeping the space between your brows clear opens the center of the face.' },
        { t: 'Choose frames with a clear bridge', d: 'A thin or clear bridge widens the look of close-set eyes.' }
      ]
    },
    openness: {
      low: [
        { t: 'Rest and hydrate', d: 'Tired eyes read narrower. Sleep, water and allergy control (if you have them) make the biggest difference.' },
        { t: 'Look into the lens, not the screen', d: 'Relaxed lids and a slight forward lean of the head give a more open, confident eye in photos.' }
      ],
      high: [{ t: 'Relax your eyes in photos', d: 'Wide-eyed photos look surprised. A slight squint from the lower lid reads calmer and more confident.' }]
    },
    jaw: {
      low: [
        { t: 'Get leaner', d: 'Fat under the jaw and in the cheeks hides the jaw angle more than anything else. Losing a few percent body fat is the single biggest jawline upgrade.' },
        { t: 'Grow a short boxed beard', d: 'Keep it fuller at the jaw angles and tight on the cheeks to widen and square the lower face.', sex: 'm' },
        { t: 'Fix your posture', d: 'Forward head posture softens the jaw-neck angle. Keep your ears over your shoulders and your tongue resting on the roof of your mouth.' },
        { t: 'Contour along the jaw', d: 'A little bronzer just under the jawline adds definition in photos.', sex: 'f' }
      ],
      high: [
        { t: 'Soften the angles', d: 'Longer, textured hair around the jaw and avoiding very boxy beards balances a wide jaw.' }
      ]
    },
    chin: {
      low: [
        { t: 'Add length at the chin', d: 'A goatee or a beard that’s slightly longer at the chin adds the missing height.', sex: 'm' },
        { t: 'Shoot from slightly above', d: 'A camera just above eye level with your chin pushed a little forward lengthens the chin in photos.' },
        { t: 'Check your bite', d: 'If your chin also looks set back from the side, an orthodontist can tell you whether your bite plays a part.', soft: false }
      ],
      high: [
        { t: 'Keep the chin beard short', d: 'If you have facial hair, keep it tight at the chin so it doesn’t add more length.', sex: 'm' },
        { t: 'Add volume at the sides', d: 'Hair with width at the sides balances a long lower face.' }
      ]
    },
    thirds: {
      low: [
        { t: 'Add height on top', d: 'A long lower face is balanced by some volume on top of your hair and a shorter beard at the chin.' }
      ],
      high: [
        { t: 'Try a fringe or textured front', d: 'A long midface is balanced by hair that comes forward onto the forehead.' }
      ]
    },
    fifths: {
      high: [{ t: 'Add height, not width', d: 'Wide faces look best with volume on top and shorter, tighter sides.' }],
      low: [{ t: 'Add width at the sides', d: 'A narrow face benefits from hair with fullness at the sides rather than height on top.' }]
    },
    midface: {
      high: [{ t: 'Keep the upper lip area clean', d: 'A wide, short midface looks best with a clean shave or very short stubble above the lip.', sex: 'm' }],
      low: [
        { t: 'Grow a mustache or stubble', d: 'Facial hair above the lip visually shortens a long midface.', sex: 'm' },
        { t: 'Bring hair forward', d: 'A fringe or textured front visually shortens a long midface.' }
      ]
    },
    fwhr: {
      low: [
        { t: 'Build width at the cheeks', d: 'Getting leaner shows the cheekbones; a beard kept full at the sides widens the lower face.' },
        { t: 'Avoid very tall hairstyles', d: 'Lots of height on top makes a narrow face look even longer.' }
      ],
      high: []
    },
    nose: {
      high: [
        { t: 'Contour the sides of the nose', d: 'Two soft lines a shade darker down the sides of the nose narrow it in photos.', sex: 'f' },
        { t: 'Balance with your hair and brows', d: 'Fuller brows and some volume in the hair make the nose a smaller part of the overall picture.' },
        { t: 'Use a longer lens', d: 'Phone wide-angle lenses at arm’s length make noses look wider. Use the 2× lens or stand farther back.' }
      ],
      low: []
    },
    mouth: {
      low: [{ t: 'Practice a wider smile', d: 'A relaxed smile that shows the upper teeth widens the mouth and lifts the whole face.' }],
      high: []
    },
    lips: {
      low: [
        { t: 'Hydrate your lips', d: 'Lip balm with SPF and a gentle scrub once a week keep lips full and defined.' },
        { t: 'Define the lip line', d: 'A liner just on the natural edge adds visible fullness to the lower lip.', sex: 'f' }
      ],
      high: [
        { t: 'Keep lips moisturized', d: 'Balanced lips just need care: balm with SPF and water.' }
      ]
    },
    symmetry: {
      high: [
        { t: 'Shoot at eye level', d: 'Phones held below or to the side exaggerate asymmetry. Use even, front-facing light.' },
        { t: 'Find your better side', d: 'Almost everyone has one. Part your hair toward it and favor it in photos.' },
        { t: 'Chew on both sides and sleep on your back', d: 'One-sided chewing and always sleeping on the same cheek add to soft-tissue asymmetry over time.' }
      ],
      low: []
    }
  };

  // Advice for each face shape: hair, glasses and facial hair
  const SHAPES = {
    oval: { d: 'Balanced length and width with a softly rounded jaw. Most styles work.', hair: 'Almost anything works. Keep the forehead partly visible.', glasses: 'Most frames. Go for width that matches your cheekbones.', beard: 'Short boxed beard or stubble.' },
    round: { d: 'Width and length are close, with soft angles.', hair: 'Height on top with shorter sides adds length.', glasses: 'Rectangular or angular frames add structure.', beard: 'Keep it longer at the chin and shorter at the cheeks to lengthen the face.' },
    square: { d: 'Strong, wide jaw with a face about as wide as it is long.', hair: 'Textured cuts or soft layers balance the strong angles.', glasses: 'Round or oval frames soften the jaw.', beard: 'Stubble or a short rounded beard.' },
    oblong: { d: 'Noticeably longer than it is wide.', hair: 'Avoid big height on top. A fringe and some width at the sides look best.', glasses: 'Deep frames with strong top lines break up the length.', beard: 'Fuller at the sides, short at the chin.' },
    heart: { d: 'Wider forehead and cheeks with a narrower chin.', hair: 'Medium length with some fullness around the jaw; side parts work well.', glasses: 'Frames heavier at the bottom or rimless styles.', beard: 'A fuller beard adds width to the jaw.' },
    diamond: { d: 'Widest at the cheekbones with a narrower forehead and jaw.', hair: 'Fringes and fullness at the forehead and jaw balance the cheekbones.', glasses: 'Oval or rimless frames, or ones with strong browlines.', beard: 'A full beard adds width at the jaw.' }
  };

  // Habits that change how any face reads. `need` ties each to a quiz answer.
  const HABITS = [
    { id: 'spf', t: 'SPF every morning', d: 'Sun causes most visible skin aging, uneven tone and dark spots. Use SPF 30+ daily, even when it’s cloudy.', need: { skin: ['none', 'some'] }, cat: 'Skin' },
    { id: 'cleanse', t: 'Cleanse and moisturize twice a day', d: 'A gentle cleanser and a plain moisturizer, morning and night. Simple products beat a 10-step routine.', need: { skin: ['none'] }, cat: 'Skin' },
    { id: 'retinoid', t: 'Add a retinoid at night', d: 'Adapalene or a retinol 2–3 nights a week, building up. Best-proven product for acne, texture and fine lines.', need: { skin: ['some', 'full'] }, cat: 'Skin' },
    { id: 'sleep', t: 'Sleep 7–9 hours', d: 'Short sleep shows up as puffier eyes, duller skin and droopier lids within days.', need: { sleep: ['low', 'mid'] }, cat: 'Lifestyle' },
    { id: 'lean', t: 'Get leaner', d: 'Lower body fat reveals the jaw, cheekbones and eye area. Aim for a small calorie deficit, protein at every meal and 3 strength sessions a week.', need: { fit: ['high', 'mid'] }, cat: 'Body' },
    { id: 'water', t: 'Drink water, go easy on salt and alcohol', d: 'Salt and alcohol make the face puffy, especially the eyes and jaw, for a day or two.', need: {}, cat: 'Lifestyle' },
    { id: 'haircut', t: 'Get a haircut for your face shape', d: 'A barber or stylist who knows your face shape is the fastest visible change there is. See your face shape tips.', need: { groom: ['none', 'some'] }, cat: 'Grooming' },
    { id: 'brows', t: 'Clean up your brows', d: 'Remove the stray hairs between and under the brows. Keep the shape natural.', need: { groom: ['none', 'some'] }, cat: 'Grooming' },
    { id: 'posture', t: 'Fix forward head posture', d: 'Ears over shoulders, chin slightly tucked, tongue on the roof of the mouth. Sharpens the jaw-neck line in every photo.', need: {}, cat: 'Body' },
    { id: 'teeth', t: 'Look after your smile', d: 'Whitening strips, regular cleanings and flossing. A bright smile lifts every score.', need: {}, cat: 'Grooming' }
  ];

  function tipsFor(report, sex) {
    const out = [];
    for (const k in report.metrics) {
      const m = report.metrics[k];
      if (m.dir === 'ok' || !TIPS[k] || !TIPS[k][m.dir]) continue;
      for (const tip of TIPS[k][m.dir]) {
        if (tip.sex && sex && tip.sex !== sex) continue;
        out.push({ ...tip, metric: k, gap: 100 - m.score });
      }
    }
    return out.sort((a, b) => b.gap - a.gap);
  }

  function habitsFor(answers) {
    const need = h => Object.entries(h.need).every(([k, v]) => !answers[k] || v.includes(answers[k]));
    return HABITS.filter(h => Object.keys(h.need).length && need(h)).concat(HABITS.filter(h => !Object.keys(h.need).length));
  }

  return { P, OUTLINE, FEATURES, METRIC_INFO, QUIZ, SHAPES, HABITS, analyze, potential, ideals, tipsFor, habitsFor };
})();

if (typeof module !== 'undefined') module.exports = FA;
