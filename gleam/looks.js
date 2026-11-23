// Gleam — color palettes and ready-made looks.

const PALETTE = {
  lips: [['#c0505c', 'Rosewood'], ['#c8323a', 'Classic red'], ['#9a1c34', 'Berry'], ['#d97a6c', 'Peach'], ['#e48c7c', 'Coral'], ['#c2697d', 'Mauve'], ['#b0705f', 'Nude'], ['#e3577e', 'Pink'], ['#7a2440', 'Plum'], ['#5e1b26', 'Wine']],
  shadow: [['#8c6a5a', 'Taupe'], ['#b58a6c', 'Bronze'], ['#5e3f31', 'Espresso'], ['#d0a679', 'Champagne'], ['#8a6f9e', 'Lilac'], ['#4e6487', 'Denim'], ['#a35d6c', 'Rose'], ['#c3864f', 'Copper'], ['#3b3331', 'Smoke'], ['#6f8a5a', 'Olive']],
  liner: [['#141010', 'Black'], ['#4a2f22', 'Brown'], ['#1f2d55', 'Navy'], ['#4b2547', 'Plum']],
  brows: [['#2d211b', 'Dark brown'], ['#4f3a2e', 'Brown'], ['#76583f', 'Light brown'], ['#262626', 'Soft black'], ['#9a7a5a', 'Blonde']],
  blush: [['#e8848a', 'Rose'], ['#f39a86', 'Peach'], ['#d76a78', 'Berry'], ['#ea9070', 'Apricot'], ['#c86c80', 'Mauve'], ['#f4a0b4', 'Baby pink']],
  contacts: [['#5d8ab8', 'Blue'], ['#6f9c5f', 'Green'], ['#a0723f', 'Hazel'], ['#8b939e', 'Grey'], ['#6b55a0', 'Violet'], ['#3f9f9c', 'Aqua']]
};

// Each look sets makeup (and a little skin work). Anything left out is off.
const LOOKS = [
  { id: 'fresh', name: 'Fresh', lips: ['#d97a6c', .45, 'gloss'], blush: ['#f39a86', .45], brows: ['#4f3a2e', .3], lashes: .35, skin: { smooth: .35, bright: .2 } },
  { id: 'everyday', name: 'Everyday', lips: ['#c0505c', .55, 'satin'], shadow: ['#8c6a5a', .4], liner: ['#4a2f22', .5, 'thin'], blush: ['#e8848a', .4], brows: ['#4f3a2e', .4], lashes: .5, contour: [.3, .3], skin: { smooth: .4 } },
  { id: 'rosy', name: 'Rosy', lips: ['#e3577e', .55, 'gloss'], shadow: ['#a35d6c', .45], blush: ['#f4a0b4', .6], brows: ['#4f3a2e', .35], lashes: .45, skin: { smooth: .4, bright: .25 } },
  { id: 'bronzed', name: 'Bronzed', lips: ['#b0705f', .55, 'satin'], shadow: ['#c3864f', .55], liner: ['#4a2f22', .6, 'thin'], blush: ['#ea9070', .45], brows: ['#4f3a2e', .45], lashes: .55, contour: [.55, .45], skin: { smooth: .35, warmth: .5 } },
  { id: 'red', name: 'Red lip', lips: ['#c8323a', .8, 'matte'], liner: ['#141010', .85, 'wing'], blush: ['#d76a78', .3], brows: ['#2d211b', .5], lashes: .7, contour: [.35, .35], skin: { smooth: .45, even: .3 } },
  { id: 'smoky', name: 'Smoky', lips: ['#b0705f', .45, 'matte'], shadow: ['#3b3331', .75], liner: ['#141010', .85, 'bold'], brows: ['#2d211b', .5], lashes: .8, contour: [.45, .3], skin: { smooth: .45 } },
  { id: 'berry', name: 'Berry', lips: ['#9a1c34', .7, 'satin'], shadow: ['#8a6f9e', .45], liner: ['#4b2547', .6, 'thin'], blush: ['#c86c80', .4], brows: ['#4f3a2e', .45], lashes: .6, skin: { smooth: .4 } },
  { id: 'gold', name: 'Golden', lips: ['#e48c7c', .55, 'gloss'], shadow: ['#d0a679', .6], liner: ['#4a2f22', .7, 'wing'], blush: ['#ea9070', .4], brows: ['#76583f', .4], lashes: .6, contour: [.3, .55], skin: { smooth: .4, bright: .2, warmth: .3 } },
  { id: 'night', name: 'Night out', lips: ['#7a2440', .75, 'matte'], shadow: ['#5e3f31', .65], liner: ['#141010', .9, 'wing'], blush: ['#d76a78', .35], brows: ['#2d211b', .55], lashes: .9, contour: [.55, .45], skin: { smooth: .5, even: .35 } }
];

// Turn a look into editor settings, scaled by strength (0–1)
function lookParams(look, k, base) {
  const p = JSON.parse(JSON.stringify(base));
  const s = look.skin || {};
  p.skin = { smooth: (s.smooth || 0) * k, bright: (s.bright || 0) * k, even: (s.even || 0) * k, warmth: (s.warmth || 0) * k };
  p.lips = look.lips ? { color: look.lips[0], amount: look.lips[1] * k, finish: look.lips[2] } : { ...p.lips, color: null };
  p.shadow = look.shadow ? { color: look.shadow[0], amount: look.shadow[1] * k } : { ...p.shadow, color: null };
  p.liner = look.liner ? { color: look.liner[0], amount: look.liner[1] * k, style: look.liner[2] } : { ...p.liner, color: null };
  p.blush = look.blush ? { color: look.blush[0], amount: look.blush[1] * k } : { ...p.blush, color: null };
  p.brows = look.brows ? { color: look.brows[0], amount: look.brows[1] * k } : { ...p.brows, color: null };
  p.lashes = (look.lashes || 0) * k;
  p.contour = look.contour ? { amount: look.contour[0] * k, highlight: look.contour[1] * k } : { amount: 0, highlight: 0 };
  p.look = look.id; p.strength = k;
  return p;
}
