// Contour — what each face shape looks like and what suits it.
// Outlines are drawn in a 100 × 120 box.

const SHAPES = {
  oval: {
    name: 'Oval',
    tagline: 'Balanced and versatile',
    d: 'Your face is a little longer than it is wide, with a forehead slightly wider than a softly rounded jaw. It’s the shape most styles are designed around.',
    traits: ['Length about 1.5× the width', 'Forehead a touch wider than the jaw', 'Gently rounded jawline'],
    goal: 'Keep the natural balance. Avoid anything that hides your whole forehead or adds a lot of height.',
    path: 'M50 8 C78 8 88 36 86 60 C84 90 68 112 50 112 C32 112 16 90 14 60 C12 36 22 8 50 8Z',
    hair: { best: ['Textured crop or quiff', 'Long layers or a lob', 'Side part, slicked back or curtains', 'Almost any length'], avoid: ['Heavy, blunt fringes that cover the forehead', 'Lots of extra height on top'] },
    glasses: { best: ['Wayfarer and square frames', 'Aviators', 'Frames as wide as your cheekbones'], avoid: ['Frames much wider than your face', 'Very narrow, small lenses'] },
    beard: { best: ['Stubble', 'Short boxed beard', 'Clean shaven'], avoid: ['Very long beards that make the face look longer'] },
    makeup: { contour: 'Contour lightly under the cheekbones and along the hairline.', highlight: 'Highlight the tops of the cheekbones, the bridge of the nose and the chin.', brows: 'Softly angled brows with a gentle arch.' }
  },
  round: {
    name: 'Round',
    tagline: 'Soft lines and full cheeks',
    d: 'Your face is about as wide as it is long, with full cheeks and a softly curved jaw. Styles that add height and angles work best.',
    traits: ['Length close to the width', 'Widest across the cheeks', 'Soft, rounded jaw corners'],
    goal: 'Add length and angles: height on top, shorter sides, straight lines.',
    path: 'M50 14 C80 14 90 40 90 62 C90 90 72 108 50 108 C28 108 10 90 10 62 C10 40 20 14 50 14Z',
    hair: { best: ['Pompadour or quiff with short sides', 'Side-swept fringe', 'Long layers that fall below the chin', 'Deep side part'], avoid: ['Chin-length bobs', 'Blunt fringes cut straight across', 'Volume at the sides'] },
    glasses: { best: ['Rectangular frames', 'Square or angular frames', 'Browline frames'], avoid: ['Round frames', 'Small frames'] },
    beard: { best: ['Goatee or anchor', 'Beard that’s longer at the chin, short at the cheeks', 'Short boxed beard with sharp edges'], avoid: ['Full, round beards with bulky sides'] },
    makeup: { contour: 'Contour from the ears down toward the corners of the mouth and along the sides of the forehead.', highlight: 'Highlight down the centre: forehead, bridge of the nose and chin.', brows: 'A higher, defined arch to add length.' }
  },
  square: {
    name: 'Square',
    tagline: 'Strong jaw, bold angles',
    d: 'Your face is about as wide as it is long, with a broad forehead and a strong, angular jaw that’s close to the width of your cheekbones.',
    traits: ['Length close to the width', 'Jaw almost as wide as the cheekbones', 'Angular jaw corners'],
    goal: 'Soften the angles a little, or lean into them with clean, sharp styles.',
    path: 'M24 12 H76 C84 12 88 18 88 26 V80 C88 94 80 104 66 106 H34 C20 104 12 94 12 80 V26 C12 18 16 12 24 12Z',
    hair: { best: ['Textured crop or messy fringe', 'Side part with soft volume', 'Soft layers and waves', 'Buzz cut, if you want to show off the jaw'], avoid: ['Blunt, one-length cuts ending at the jaw', 'Severe centre parts'] },
    glasses: { best: ['Round or oval frames', 'Thin-rimmed frames', 'Cat-eye frames'], avoid: ['Boxy, angular frames'] },
    beard: { best: ['Stubble', 'Short, rounded beard', 'Circle beard'], avoid: ['Square, boxy beards that make the jaw wider'] },
    makeup: { contour: 'Contour the corners of the jaw and the sides of the forehead to round them off.', highlight: 'Highlight the centre of the forehead and the chin.', brows: 'Soft, curved brows rather than sharp angles.' }
  },
  oblong: {
    name: 'Oblong',
    tagline: 'Long and elegant',
    d: 'Your face is clearly longer than it is wide, with forehead, cheekbones and jaw at similar widths. Styles that add width work best.',
    traits: ['Length well over 1.5× the width', 'Similar widths top to bottom', 'Straight sides'],
    goal: 'Add width and break up the length: volume at the sides, fringes, no extra height.',
    path: 'M28 4 H72 C80 4 84 10 84 18 V90 C84 104 74 116 60 116 H40 C26 116 16 104 16 90 V18 C16 10 20 4 28 4Z',
    hair: { best: ['Fringe or bangs', 'Side-swept styles with volume at the sides', 'Chin-length bob or waves', 'Medium-length cuts'], avoid: ['High pompadours and top knots', 'Very long, straight hair'] },
    glasses: { best: ['Deep, tall frames', 'Frames with strong top lines', 'Round or decorative frames'], avoid: ['Narrow, small frames'] },
    beard: { best: ['Fuller sides, shorter chin', 'Mutton chops or a short full beard'], avoid: ['Long goatees that add length'] },
    makeup: { contour: 'Contour the top of the forehead and under the chin to shorten the face.', highlight: 'Highlight across the cheekbones, out toward the ears.', brows: 'Flat, straight brows to widen the face.' }
  },
  heart: {
    name: 'Heart',
    tagline: 'Wide forehead, narrow chin',
    d: 'Your forehead and cheekbones are wide and your face narrows to a slim, sometimes pointed chin.',
    traits: ['Forehead about as wide as the cheekbones', 'Narrow jaw', 'Slim or pointed chin'],
    goal: 'Balance the wider top with fullness around the jaw.',
    path: 'M50 8 C80 8 92 26 90 48 C88 76 64 106 50 112 C36 106 12 76 10 48 C8 26 20 8 50 8Z',
    hair: { best: ['Side-swept fringe', 'Chin-length or lob with volume at the jaw', 'Longer textured cuts', 'Side part'], avoid: ['Lots of volume at the crown', 'Tight, slicked-back styles'] },
    glasses: { best: ['Frames heavier at the bottom', 'Rimless or light frames', 'Oval and aviator frames'], avoid: ['Heavy browline or top-heavy frames'] },
    beard: { best: ['Full beard to add width at the jaw', 'Short boxed beard'], avoid: ['Goatee only'] },
    makeup: { contour: 'Contour the sides of the forehead and the tip of the chin.', highlight: 'Highlight along the jaw and the centre of the forehead.', brows: 'Rounded brows with a low arch.' }
  },
  diamond: {
    name: 'Diamond',
    tagline: 'Striking cheekbones',
    d: 'Your cheekbones are the widest part of your face, with a narrower forehead and jaw and a defined chin.',
    traits: ['Widest at the cheekbones', 'Narrow forehead', 'Narrow, defined chin'],
    goal: 'Add width at the forehead and jaw to balance the cheekbones.',
    path: 'M50 6 C62 6 70 20 84 48 C92 62 76 98 50 112 C24 98 8 62 16 48 C30 20 38 6 50 6Z',
    hair: { best: ['Fringe or side-swept bangs', 'Textured top with some fullness', 'Chin-length styles with volume', 'Tucked behind the ears'], avoid: ['Volume at the cheekbones', 'Tight centre parts'] },
    glasses: { best: ['Oval and cat-eye frames', 'Rimless frames', 'Frames with strong browlines'], avoid: ['Narrow frames that sit at the cheekbones'] },
    beard: { best: ['Full beard to widen the jaw', 'Chin strap or short boxed beard'], avoid: ['Pointed goatees'] },
    makeup: { contour: 'Contour just under the cheekbones and on the tip of the chin.', highlight: 'Highlight the centre of the forehead and the chin.', brows: 'Curved brows that add width at the forehead.' }
  },
  triangle: {
    name: 'Triangle',
    tagline: 'Narrow forehead, wide jaw',
    d: 'Also called a pear shape: your jaw is the widest part of your face, with a narrower forehead.',
    traits: ['Jaw as wide as the cheekbones or wider', 'Narrow forehead', 'Strong jawline'],
    goal: 'Add width at the top and soften the jaw.',
    path: 'M50 10 C66 10 74 20 78 38 C84 62 92 86 80 102 C72 110 60 112 50 112 C40 112 28 110 20 102 C8 86 16 62 22 38 C26 20 34 10 50 10Z',
    hair: { best: ['Volume and texture on top', 'Fringe or curtain bangs', 'Layers that start at the cheekbones'], avoid: ['Short, flat tops', 'Cuts that end at the jaw'] },
    glasses: { best: ['Browline and cat-eye frames', 'Frames wider at the top', 'Bold top rims'], avoid: ['Narrow or bottom-heavy frames'] },
    beard: { best: ['Stubble', 'Short beard kept tight at the jaw'], avoid: ['Full, wide beards'] },
    makeup: { contour: 'Contour along the jaw corners.', highlight: 'Highlight the forehead and the tops of the cheekbones.', brows: 'Fuller, slightly longer brows to widen the top.' }
  }
};

const SHAPE_ORDER = ['oval', 'round', 'square', 'oblong', 'heart', 'diamond', 'triangle'];
