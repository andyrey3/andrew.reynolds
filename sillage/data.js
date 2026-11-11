// Sillage data.
//
// Where it comes from:
// - Each bottle's family ("frag") is the olfactory family Fragrantica lists on
//   that bottle's page, e.g. "Woody Aromatic". FRAG_FAMILY places each
//   Fragrantica family on the 13-family wheel by its main accord family.
// - Notes are from each bottle's Fragrantica listing (shortened).
// - Dupes are community comparisons (Fragrantica reviews and dupe guides).
// - Price levels ($ to $$$$) are rough estimates, not quotes.
// - The family descriptions are general guidance written for this app.

const GROUPS = [
  { id: 'amber', name: 'Amber', color: '#D98A5F' },
  { id: 'floral', name: 'Floral', color: '#D45C8E' },
  { id: 'fresh', name: 'Fresh', color: '#3E6F9E' },
  { id: 'woody', name: 'Woody', color: '#8C7A5B' }
];

// Fragrantica family -> wheel family. Fragrantica has renamed "Oriental" to
// "Amber" on newer pages, so both spellings are listed.
const FRAG_FAMILY = {
  'Oriental Woody': 'woodyamber', 'Amber Woody': 'woodyamber',
  'Oriental': 'amber', 'Amber': 'amber', 'Oriental Spicy': 'amber', 'Amber Spicy': 'amber',
  'Oriental Vanilla': 'amber', 'Amber Vanilla': 'amber',
  'Oriental Floral': 'softamber', 'Amber Floral': 'softamber', 'Oriental Fougere': 'softamber', 'Amber Fougere': 'softamber',
  'Floral Fruity': 'fruity', 'Floral Fruity Gourmand': 'fruity',
  'Floral': 'floral', 'Floral Green': 'floral',
  'Floral Aldehyde': 'softfloral', 'Floral Woody Musk': 'softfloral',
  'Aromatic Aquatic': 'water', 'Woody Aquatic': 'water', 'Citrus Aquatic': 'water',
  'Aromatic': 'aromatic', 'Aromatic Fougere': 'aromatic', 'Aromatic Spicy': 'aromatic', 'Aromatic Fruity': 'aromatic',
  'Aromatic Green': 'green', 'Green': 'green',
  'Citrus': 'citrus', 'Citrus Aromatic': 'citrus', 'Citrus Gourmand': 'citrus',
  'Chypre': 'mossywoods', 'Chypre Fruity': 'mossywoods', 'Chypre Floral': 'mossywoods',
  'Woody': 'woods', 'Woody Aromatic': 'woods', 'Woody Spicy': 'woods', 'Woody Floral Musk': 'woods', 'Woody Chypre': 'woods',
  'Leather': 'drywoods'
};

// Clockwise around the wheel, starting just left of twelve o'clock.
// Every pick's "frag" places it in the family it is listed under.
const FAMILIES = [
  {
    id: 'woodyamber', name: 'Woody Amber', group: 'amber', color: '#EBAE8A',
    smells: 'Dry, glowing warmth: oud, ambergris, cedar, saffron and resins.',
    wear: 'Evenings and cold weather. Projects far, so go light.',
    picks: [
      { name: 'Oud Wood', brand: 'Tom Ford', frag: 'Oriental Woody', price: 4, notes: 'Oud, rosewood, cardamom, sandalwood, vanilla, vetiver, tonka',
        dupe: { name: 'Woody Oud', brand: 'Maison Alhambra', price: 1 } },
      { name: 'Oud for Glory', brand: 'Lattafa', frag: 'Oriental Woody', price: 1, notes: 'Saffron, nutmeg, lavender, oud, patchouli, musk',
        dupe: null, cheap: true }
    ]
  },
  {
    id: 'amber', name: 'Amber', group: 'amber', color: '#F2958A',
    smells: 'Rich and resinous: vanilla, tonka, labdanum, spice and boozy notes.',
    wear: 'Date nights and winter. The most "cozy sweater" family.',
    picks: [
      { name: 'Tobacco Vanille', brand: 'Tom Ford', frag: 'Oriental Spicy', price: 4, notes: 'Tobacco leaf, spices, vanilla, cacao, tonka, dried fruits',
        dupe: { name: 'Rich Warm Addictive', brand: 'Zara', price: 1 } },
      { name: "Angels' Share", brand: 'Kilian', frag: 'Oriental Vanilla', price: 4, notes: 'Cognac, cinnamon, tonka, oak, vanilla, praline, sandalwood',
        dupe: { name: 'Khamrah', brand: 'Lattafa', price: 1 } },
      { name: 'Black Opium', brand: 'Yves Saint Laurent', frag: 'Oriental Vanilla', price: 3, notes: 'Pear, pink pepper, coffee, jasmine, licorice, vanilla, patchouli',
        dupe: { name: 'Gardenia', brand: 'Zara', price: 1 } }
    ]
  },
  {
    id: 'softamber', name: 'Soft Amber', group: 'amber', color: '#F0A4A6',
    smells: 'Amber softened with flowers or lavender: orange blossom, vanilla, saffron, sweet woods.',
    wear: 'Everyday warmth. Sweet but easy to wear.',
    picks: [
      { name: 'Baccarat Rouge 540', brand: 'Maison Francis Kurkdjian', frag: 'Oriental Floral', price: 4, notes: 'Saffron, jasmine, amberwood, ambergris, fir resin, cedar',
        dupe: { name: 'Red Temptation', brand: 'Zara', price: 1 } },
      { name: 'Ultra Male', brand: 'Jean Paul Gaultier', frag: 'Oriental Fougere', price: 2, notes: 'Pear, lavender, mint, bergamot, black vanilla, amber, cedar',
        dupe: { name: '9pm', brand: 'Afnan', price: 1 } },
      { name: 'Libre', brand: 'Yves Saint Laurent', frag: 'Oriental Fougere', price: 3, notes: 'Lavender, mandarin, orange blossom, jasmine, vanilla, musk, cedar',
        dupe: { name: 'Floral Lavender', brand: 'Dossier', price: 1 } }
    ]
  },
  {
    id: 'fruity', name: 'Fruity', group: 'floral', color: '#D9687A',
    smells: 'Juicy and bright: berries, pear, peach and apple over soft flowers.',
    wear: 'Daytime, spring and summer. Playful and easy.',
    picks: [
      { name: 'Her', brand: 'Burberry', frag: 'Floral Fruity Gourmand', price: 3, notes: 'Berries, citrus, jasmine, musk, vanilla, woods',
        dupe: null },
      { name: "J'adore", brand: 'Dior', frag: 'Floral Fruity', price: 3, notes: 'Pear, melon, magnolia, peach, jasmine, tuberose, musk, vanilla',
        dupe: null },
      { name: 'Cloud', brand: 'Ariana Grande', frag: 'Floral Fruity Gourmand', price: 1, notes: 'Lavender, pear, bergamot, coconut cream, praline, musk',
        dupe: null, cheap: true }
    ]
  },
  {
    id: 'floral', name: 'Floral', group: 'floral', color: '#F79FC9',
    smells: 'A bouquet: rose, jasmine, tuberose and peony front and center.',
    wear: 'Any time. The classic "perfume" smell.',
    picks: [
      { name: 'Delina', brand: 'Parfums de Marly', frag: 'Floral', price: 4, notes: 'Lychee, rhubarb, Turkish rose, peony, vanilla, cashmeran, incense',
        dupe: { name: 'Thouq', brand: 'Lattafa', price: 1 } },
      { name: 'Bloom', brand: 'Gucci', frag: 'Floral', price: 3, notes: 'Jasmine, tuberose, Rangoon creeper',
        dupe: { name: 'Floral Bloom', brand: 'Maison Alhambra', price: 1 } }
    ]
  },
  {
    id: 'softfloral', name: 'Soft Floral', group: 'floral', color: '#C7A6D2',
    smells: 'Powdery and clean: aldehydes, iris, musk and the "skin scent" style.',
    wear: 'Office and close-up wear. Quiet and polished.',
    picks: [
      { name: 'No 5', brand: 'Chanel', frag: 'Floral Aldehyde', price: 4, notes: 'Aldehydes, ylang-ylang, jasmine, rose, iris, sandalwood, vanilla',
        dupe: null },
      { name: 'For Her', brand: 'Narciso Rodriguez', frag: 'Floral Woody Musk', price: 3, notes: 'Rose, peach, musk, amber, patchouli, sandalwood',
        dupe: null },
      { name: 'You', brand: 'Glossier', frag: 'Floral Woody Musk', price: 2, notes: 'Iris, pink pepper, ambroxan, ambrette',
        dupe: null }
    ]
  },
  {
    id: 'water', name: 'Water', group: 'fresh', color: '#2F5C8F',
    smells: 'Sea air and clean skin: marine notes, calone, mint and light woods.',
    wear: 'Hot weather, gym and daytime. Hard to overspray.',
    picks: [
      { name: 'Acqua di Giò', brand: 'Giorgio Armani', frag: 'Aromatic Aquatic', price: 3, notes: 'Lime, bergamot, sea notes, calone, rosemary, white musk, cedar',
        dupe: { name: 'Blue Homme', brand: 'Armaf', price: 1 } },
      { name: 'Invictus Aqua', brand: 'Rabanne', frag: 'Woody Aquatic', price: 2, notes: 'Yuzu, grapefruit, pink pepper, sea water, violet leaf, ambergris, guaiac wood',
        dupe: { name: 'Man Blue Spirit', brand: 'Zara', price: 1 } },
      { name: 'Cool Water', brand: 'Davidoff', frag: 'Aromatic Aquatic', price: 1, notes: 'Sea water, lavender, mint, rosemary, neroli, oakmoss, ambergris',
        dupe: null, cheap: true }
    ]
  },
  {
    id: 'aromatic', name: 'Aromatic', group: 'fresh', color: '#5B9DBA',
    smells: 'Herbs and spice: lavender, sage, pepper and rosemary. Home of the fougère.',
    wear: 'Daily signature. Versatile and crowd-pleasing.',
    picks: [
      { name: 'Sauvage Elixir', brand: 'Dior', frag: 'Aromatic', price: 4, notes: 'Grapefruit, nutmeg, cinnamon, cardamom, lavender',
        dupe: { name: 'Asad', brand: 'Lattafa', price: 1 } },
      { name: 'Silver Mountain Water', brand: 'Creed', frag: 'Aromatic', price: 4, notes: 'Bergamot, mandarin, green tea, black currant, musk, sandalwood',
        dupe: { name: 'Club de Nuit Sillage', brand: 'Armaf', price: 1 } },
      { name: 'Sauvage', brand: 'Dior', frag: 'Aromatic Fougere', price: 3, notes: 'Bergamot, Sichuan pepper, lavender, ambroxan',
        dupe: null }
    ]
  },
  {
    id: 'green', name: 'Green', group: 'fresh', color: '#7DABAF',
    smells: 'Snapped stems and cut grass: fig leaf, galbanum, violet leaf, tea.',
    wear: 'Spring and warm days. Crisp and outdoorsy.',
    picks: [
      { name: 'Philosykos', brand: 'Diptyque', frag: 'Aromatic Green', price: 3, notes: 'Fig, fig leaf, fig tree',
        dupe: null }
    ]
  },
  {
    id: 'citrus', name: 'Citrus', group: 'fresh', color: '#92B39A',
    smells: 'Zest and sunshine: bergamot, lemon, mandarin, neroli, grapefruit.',
    wear: 'Summer mornings. Fades fastest, so reapply.',
    picks: [
      { name: 'Light Blue Pour Homme', brand: 'Dolce & Gabbana', frag: 'Citrus Aromatic', price: 2, notes: 'Grapefruit, bergamot, mandarin, juniper, rosemary, musk, oakmoss',
        dupe: { name: 'Citrus Marine', brand: 'Dossier', price: 1 } },
      { name: 'Colonia', brand: 'Acqua di Parma', frag: 'Citrus', price: 3, notes: 'Sicilian citrus, lavender, lemon verbena, rosemary, rose, vetiver',
        dupe: { name: 'Original Eau de Cologne', brand: '4711', price: 1, style: true } },
      { name: 'Neroli Portofino', brand: 'Tom Ford', frag: 'Citrus Aromatic', price: 4, notes: 'Bergamot, mandarin, lemon, lavender, neroli, orange flower, amber',
        dupe: null }
    ]
  },
  {
    id: 'mossywoods', name: 'Mossy Woods', group: 'woody', color: '#B5C796',
    smells: 'The chypre: citrus and fruit over oakmoss and patchouli.',
    wear: 'Statement wear. Elegant in fall.',
    picks: [
      { name: 'Aventus', brand: 'Creed', frag: 'Chypre Fruity', price: 4, notes: 'Bergamot, blackcurrant, apple, pineapple, birch, oakmoss, musk',
        dupe: { name: 'Club de Nuit Intense Man', brand: 'Armaf', price: 1 } },
      { name: 'Mitsouko', brand: 'Guerlain', frag: 'Chypre Fruity', price: 3, notes: 'Peach, spices, jasmine, oakmoss, labdanum',
        dupe: null }
    ]
  },
  {
    id: 'woods', name: 'Woods', group: 'woody', color: '#D6D7A8',
    smells: 'Sandalwood, cedar, vetiver and incense. Creamy or dry, always grounded.',
    wear: 'Year-round. Calm, confident, office-safe.',
    picks: [
      { name: 'Santal 33', brand: 'Le Labo', frag: 'Woody Aromatic', price: 4, notes: 'Sandalwood, leather, papyrus, cedar, cardamom, violet, iris',
        dupe: { name: 'Woody Sandalwood', brand: 'Dossier', price: 1 } },
      { name: 'Bleu de Chanel', brand: 'Chanel', frag: 'Woody Aromatic', price: 3, notes: 'Grapefruit, lemon, mint, ginger, incense, cedar, sandalwood',
        dupe: { name: 'Club de Nuit Blue Iconic', brand: 'Armaf', price: 1 } },
      { name: 'Green Irish Tweed', brand: 'Creed', frag: 'Woody Floral Musk', price: 4, notes: 'Iris, lemon verbena, violet leaf, ambergris, sandalwood',
        dupe: { name: 'Cool Water', brand: 'Davidoff', price: 1 } }
    ]
  },
  {
    id: 'drywoods', name: 'Dry Woods', group: 'woody', color: '#DDC795',
    smells: 'Leather, smoke and tobacco: suede, birch tar, burnt woods.',
    wear: 'Cold nights. Moody and memorable.',
    picks: [
      { name: 'Tuscan Leather', brand: 'Tom Ford', frag: 'Leather', price: 4, notes: 'Raspberry, saffron, thyme, olibanum, leather, suede, amber',
        dupe: null },
      { name: 'Ombré Leather', brand: 'Tom Ford', frag: 'Leather', price: 4, notes: 'Cardamom, leather, jasmine sambac, amber, moss, patchouli',
        dupe: null },
      { name: 'Jazz Club', brand: 'Maison Margiela', frag: 'Leather', price: 3, notes: 'Pink pepper, neroli, rum, vetiver, tobacco leaf, vanilla, styrax',
        dupe: null }
    ]
  }
];

// More bottles with their Fragrantica family: [name, brand, Fragrantica family].
// Dupes are listed here only when Fragrantica's family for them was found.
const CATALOG_EXTRA = [
  ['Boss Bottled Unlimited', 'Hugo Boss', 'Aromatic Fougere'],
  ['Blue Jeans', 'Versace', 'Aromatic Fougere'],
  ['Uomo Born in Roma', 'Valentino', 'Woody Spicy'],
  ['Intense Oud', 'Gucci', 'Oriental'],
  ['Le Male', 'Jean Paul Gaultier', 'Oriental Fougere'],
  ['Bleu de Chanel Eau de Parfum', 'Chanel', 'Woody Aromatic'],
  ['Allure Homme Sport Eau Extrême', 'Chanel', 'Woody Aromatic'],
  ['Coco Mademoiselle', 'Chanel', 'Oriental Floral'],
  ['Lost Cherry', 'Tom Ford', 'Oriental Floral'],
  ['Layton', 'Parfums de Marly', 'Oriental Floral'],
  ['Tobacco Oud', 'Tom Ford', 'Woody Spicy'],
  ['Acqua di Giò Profumo', 'Giorgio Armani', 'Aromatic Aquatic'],
  ['Philosykos Eau de Parfum', 'Diptyque', 'Woody Aromatic'],
  ['Light Blue', 'Dolce & Gabbana', 'Floral Fruity'],
  ['Be Delicious', 'DKNY', 'Floral Fruity'],
  ['Un Jardin sur le Nil', 'Hermès', 'Floral Fruity'],
  ['Pour Homme', 'Azzaro', 'Aromatic Fougere'],
  ['Khamrah', 'Lattafa', 'Oriental Spicy'],
  ['Asad', 'Lattafa', 'Oriental'],
  ['9pm', 'Afnan', 'Oriental Vanilla'],
  ['Rich Warm Addictive', 'Zara', 'Amber Vanilla'],
  ['Gardenia', 'Zara', 'Floral Fruity Gourmand'],
  ['Floral Lavender', 'Dossier', 'Oriental Floral'],
  ['Thouq', 'Lattafa', 'Floral'],
  ['Floral Bloom', 'Maison Alhambra', 'Floral Woody Musk'],
  ['Blue Homme', 'Armaf', 'Aromatic Fougere'],
  ['Man Blue Spirit', 'Zara', 'Woody Aromatic'],
  ['Club de Nuit Sillage', 'Armaf', 'Floral Woody Musk'],
  ['Citrus Marine', 'Dossier', 'Aromatic Aquatic'],
  ['Original Eau de Cologne', '4711', 'Citrus Aromatic'],
  ['Club de Nuit Intense Man', 'Armaf', 'Woody Spicy'],
  ['Woody Sandalwood', 'Dossier', 'Woody']
];

const CATALOG = (() => {
  const seen = new Set();
  const list = [];
  const add = (name, brand, frag) => {
    const key = (brand + '|' + name).toLowerCase();
    if (seen.has(key) || !FRAG_FAMILY[frag]) return;
    seen.add(key);
    list.push({ name, brand, frag, family: FRAG_FAMILY[frag] });
  };
  for (const f of FAMILIES) for (const p of f.picks) add(p.name, p.brand, p.frag);
  for (const [name, brand, frag] of CATALOG_EXTRA) add(name, brand, frag);
  return list;
})();

// Fragrantica image IDs for bottle photos, keyed "brand|name". The photos are
// saved in img/<id>.jpg; bottles without one show a family-colored tile.
const PHOTO_IDS = {
  'Maison Francis Kurkdjian|Baccarat Rouge 540': 33519, 'Parfums de Marly|Layton': 39314,
  'Tom Ford|Tobacco Vanille': 1825, "Kilian|Angels' Share": 62615, 'Jean Paul Gaultier|Ultra Male': 30947,
  'Yves Saint Laurent|Libre': 56077, 'Yves Saint Laurent|Black Opium': 25324, 'Ariana Grande|Cloud': 50384,
  'Burberry|Her': 51694, 'Tom Ford|Lost Cherry': 51411, 'DKNY|Be Delicious': 498, 'Parfums de Marly|Delina': 43871,
  'Gucci|Bloom': 44894, "Dior|J'adore": 210, 'Chanel|No 5': 40069, 'Narciso Rodriguez|For Her': 14319, 'Glossier|You': 46885,
  'Giorgio Armani|Acqua di Giò': 410, 'Creed|Silver Mountain Water': 472, 'Rabanne|Invictus Aqua': 34506,
  'Dior|Sauvage Elixir': 68415, 'Dior|Sauvage': 31861, 'Azzaro|Pour Homme': 829, 'Creed|Green Irish Tweed': 474,
  'Diptyque|Philosykos': 72040, 'Diptyque|Philosykos Eau de Parfum': 3865, 'Hermès|Un Jardin sur le Nil': 18,
  'Dolce & Gabbana|Light Blue': 485, 'Acqua di Parma|Colonia': 1681, 'Tom Ford|Neroli Portofino': 12192,
  'Creed|Aventus': 9828, 'Chanel|Coco Mademoiselle': 611, 'Guerlain|Mitsouko': 25316, 'Le Labo|Santal 33': 12201,
  'Chanel|Bleu de Chanel': 9099, 'Tom Ford|Oud Wood': 1826, 'Maison Margiela|Jazz Club': 20541,
  'Tom Ford|Tuscan Leather': 1849, 'Tom Ford|Ombré Leather': 50239,
  'Zara|Red Temptation': 63264, 'Lattafa|Oud for Glory': 64948, 'Zara|Rich Warm Addictive': 40449, 'Lattafa|Khamrah': 75805,
  'Afnan|9pm': 65414, 'Dossier|Floral Lavender': 135429, 'Zara|Gardenia': 68682, 'Lattafa|Thouq': 82693,
  'Maison Alhambra|Floral Bloom': 95520, 'Armaf|Blue Homme': 27686, 'Armaf|Club de Nuit Sillage': 64105,
  'Zara|Man Blue Spirit': 43468, 'Lattafa|Asad': 72821, 'Davidoff|Cool Water': 507, 'Dossier|Citrus Marine': 107354,
  '4711|Original Eau de Cologne': 3256, 'Armaf|Club de Nuit Intense Man': 34696, 'Dossier|Woody Sandalwood': 73741,
  'Armaf|Club de Nuit Blue Iconic': 78475, 'Maison Alhambra|Woody Oud': 79940,
  'Hugo Boss|Boss Bottled Unlimited': 22528, 'Dolce & Gabbana|Light Blue Pour Homme': 1068, 'Versace|Blue Jeans': 637,
  'Valentino|Uomo Born in Roma': 55963, 'Gucci|Intense Oud': 32743, 'Jean Paul Gaultier|Le Male': 430,
  'Chanel|Bleu de Chanel Eau de Parfum': 25967, 'Chanel|Allure Homme Sport Eau Extrême': 14669,
  'Tom Ford|Tobacco Oud': 21402, 'Giorgio Armani|Acqua di Giò Profumo': 29727
};
