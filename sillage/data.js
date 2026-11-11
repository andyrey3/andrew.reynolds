// Sillage data: the 13 families on the fragrance wheel, the best bottles in
// each with their best-known dupe, and a catalog used to sort your bottles.
// Family placement follows the Michael Edwards wheel as closely as a single
// family per bottle allows. Dupes are community comparisons, not lab matches.

const GROUPS = [
  { id: 'amber', name: 'Amber', color: '#D98A5F' },
  { id: 'floral', name: 'Floral', color: '#D45C8E' },
  { id: 'fresh', name: 'Fresh', color: '#3E6F9E' },
  { id: 'woody', name: 'Woody', color: '#8C7A5B' }
];

// Clockwise around the wheel, starting just left of twelve o'clock.
const FAMILIES = [
  {
    id: 'woodyamber', name: 'Woody Amber', group: 'amber', color: '#EBAE8A',
    smells: 'Dry, glowing warmth: ambergris, cedar, oud, saffron and resins.',
    wear: 'Evenings and cold weather. Projects far, so go light.',
    picks: [
      { name: 'Baccarat Rouge 540', brand: 'Maison Francis Kurkdjian', price: 4, notes: 'Saffron, jasmine, ambergris, cedar',
        dupe: { name: 'Red Temptation', brand: 'Zara', price: 1 } },
      { name: 'Oud for Greatness', brand: 'Initio', price: 4, notes: 'Saffron, nutmeg, lavender, oud, patchouli',
        dupe: { name: 'Oud for Glory', brand: 'Lattafa', price: 1 } },
      { name: 'Layton', brand: 'Parfums de Marly', price: 4, notes: 'Apple, lavender, vanilla, cardamom, guaiac wood',
        dupe: null }
    ]
  },
  {
    id: 'amber', name: 'Amber', group: 'amber', color: '#F2958A',
    smells: 'Rich and resinous: vanilla, tonka, labdanum, spice and boozy notes.',
    wear: 'Date nights and winter. The most "cozy sweater" family.',
    picks: [
      { name: 'Tobacco Vanille', brand: 'Tom Ford', price: 4, notes: 'Tobacco leaf, vanilla, tonka, cocoa, dried fruit',
        dupe: { name: 'Rich Warm Addictive', brand: 'Zara', price: 1 } },
      { name: "Angels' Share", brand: 'Kilian', price: 4, notes: 'Cognac, cinnamon, tonka, praline, oak',
        dupe: { name: 'Khamrah', brand: 'Lattafa', price: 1 } },
      { name: 'Ultra Male', brand: 'Jean Paul Gaultier', price: 2, notes: 'Pear, lavender, cinnamon, vanilla',
        dupe: { name: '9pm', brand: 'Afnan', price: 1 } }
    ]
  },
  {
    id: 'softamber', name: 'Soft Amber', group: 'amber', color: '#F0A4A6',
    smells: 'Amber softened with flowers or sugar: incense, vanilla, orange blossom, praline.',
    wear: 'Everyday warmth. Sweet but easy to wear.',
    picks: [
      { name: 'Libre', brand: 'Yves Saint Laurent', price: 3, notes: 'Lavender, orange blossom, vanilla, musk',
        dupe: { name: 'Floral Lavender', brand: 'Dossier', price: 1 } },
      { name: 'Black Opium', brand: 'Yves Saint Laurent', price: 3, notes: 'Coffee, vanilla, white flowers, pear',
        dupe: { name: 'Gardenia', brand: 'Zara', price: 1 } },
      { name: 'Cloud', brand: 'Ariana Grande', price: 1, notes: 'Lavender, pear, coconut, praline, musk',
        dupe: null, cheap: true }
    ]
  },
  {
    id: 'fruity', name: 'Fruity', group: 'floral', color: '#D9687A',
    smells: 'Juicy and bright: berries, peach, pear, apple and cherry over soft flowers.',
    wear: 'Daytime, spring and summer. Playful and easy.',
    picks: [
      { name: 'Her', brand: 'Burberry', price: 3, notes: 'Strawberry, raspberry, blackberry, jasmine, musk',
        dupe: { name: 'Rave Now', brand: 'Lattafa', price: 1 } },
      { name: 'Lost Cherry', brand: 'Tom Ford', price: 4, notes: 'Black cherry, almond, liqueur, tonka',
        dupe: null },
      { name: 'Be Delicious', brand: 'DKNY', price: 2, notes: 'Green apple, cucumber, magnolia, sandalwood',
        dupe: null, cheap: true }
    ]
  },
  {
    id: 'floral', name: 'Floral', group: 'floral', color: '#F79FC9',
    smells: 'A bouquet: rose, jasmine, tuberose, peony and gardenia front and center.',
    wear: 'Any time. The classic "perfume" smell.',
    picks: [
      { name: 'Delina', brand: 'Parfums de Marly', price: 4, notes: 'Turkish rose, lychee, rhubarb, vanilla, musk',
        dupe: { name: 'Thouq', brand: 'Lattafa', price: 1 } },
      { name: 'Bloom', brand: 'Gucci', price: 3, notes: 'Tuberose, jasmine, Rangoon creeper',
        dupe: { name: 'Floral Bloom', brand: 'Maison Alhambra', price: 1 } },
      { name: "J'adore", brand: 'Dior', price: 3, notes: 'Ylang-ylang, rose, jasmine, pear',
        dupe: null }
    ]
  },
  {
    id: 'softfloral', name: 'Soft Floral', group: 'floral', color: '#C7A6D2',
    smells: 'Powdery and clean: iris, aldehydes, musk, the "fresh laundry" and skin scents.',
    wear: 'Office and close-up wear. Quiet and polished.',
    picks: [
      { name: 'No 5', brand: 'Chanel', price: 4, notes: 'Aldehydes, rose, jasmine, iris, vanilla',
        dupe: null },
      { name: 'For Her', brand: 'Narciso Rodriguez', price: 3, notes: 'Musk, rose, peach, amber',
        dupe: null },
      { name: 'You', brand: 'Glossier', price: 2, notes: 'Pink pepper, iris root, ambrette, musk',
        dupe: null }
    ]
  },
  {
    id: 'water', name: 'Water', group: 'fresh', color: '#2F5C8F',
    smells: 'Sea air and clean skin: marine notes, calone, mint and light woods.',
    wear: 'Hot weather, gym and daytime. Hard to overspray.',
    picks: [
      { name: 'Acqua di Giò', brand: 'Giorgio Armani', price: 3, notes: 'Sea notes, bergamot, jasmine, rosemary, patchouli',
        dupe: { name: 'Blue Homme', brand: 'Armaf', price: 1 } },
      { name: 'Silver Mountain Water', brand: 'Creed', price: 4, notes: 'Bergamot, green tea, blackcurrant, musk',
        dupe: { name: 'Club de Nuit Sillage', brand: 'Armaf', price: 1 } },
      { name: 'Invictus Aqua', brand: 'Rabanne', price: 2, notes: 'Grapefruit, sea notes, ginger, guaiac wood',
        dupe: { name: 'Man Blue Spirit', brand: 'Zara', price: 1 } }
    ]
  },
  {
    id: 'aromatic', name: 'Aromatic', group: 'fresh', color: '#5B9DBA',
    smells: 'Herbs and spice: lavender, sage, pepper, rosemary. Home of the fougère.',
    wear: 'Daily signature. Versatile and crowd-pleasing.',
    picks: [
      { name: 'Sauvage Elixir', brand: 'Dior', price: 4, notes: 'Grapefruit, cinnamon, lavender, licorice, amber',
        dupe: { name: 'Asad', brand: 'Lattafa', price: 1 } },
      { name: 'Sauvage', brand: 'Dior', price: 3, notes: 'Bergamot, Sichuan pepper, lavender, ambroxan',
        dupe: null },
      { name: 'Pour Homme', brand: 'Azzaro', price: 1, notes: 'Lavender, anise, basil, vetiver, oakmoss',
        dupe: null, cheap: true }
    ]
  },
  {
    id: 'green', name: 'Green', group: 'fresh', color: '#7DABAF',
    smells: 'Snapped stems and cut grass: galbanum, fig leaf, violet leaf, tea.',
    wear: 'Spring and warm days. Crisp and outdoorsy.',
    picks: [
      { name: 'Green Irish Tweed', brand: 'Creed', price: 4, notes: 'Lemon verbena, violet leaf, iris, sandalwood',
        dupe: { name: 'Cool Water', brand: 'Davidoff', price: 1 } },
      { name: 'Philosykos', brand: 'Diptyque', price: 3, notes: 'Fig leaf, fig tree, coconut, cedar',
        dupe: null },
      { name: 'Un Jardin sur le Nil', brand: 'Hermès', price: 3, notes: 'Green mango, lotus, grapefruit, incense',
        dupe: null }
    ]
  },
  {
    id: 'citrus', name: 'Citrus', group: 'fresh', color: '#92B39A',
    smells: 'Zest and sunshine: bergamot, lemon, orange, neroli, grapefruit.',
    wear: 'Summer mornings. Fades fastest, so reapply.',
    picks: [
      { name: 'Light Blue', brand: 'Dolce & Gabbana', price: 3, notes: 'Sicilian lemon, apple, bamboo, cedar',
        dupe: { name: 'Citrus Marine', brand: 'Dossier', price: 1 } },
      { name: 'Colonia', brand: 'Acqua di Parma', price: 3, notes: 'Lemon, lavender, rosemary, rose',
        dupe: { name: 'Original Eau de Cologne', brand: '4711', price: 1, style: true } },
      { name: 'Neroli Portofino', brand: 'Tom Ford', price: 4, notes: 'Neroli, bergamot, lemon, amber',
        dupe: null }
    ]
  },
  {
    id: 'mossywoods', name: 'Mossy Woods', group: 'woody', color: '#B5C796',
    smells: 'The chypre: citrus over oakmoss and patchouli. Earthy and sophisticated.',
    wear: 'Statement wear. Elegant in fall.',
    picks: [
      { name: 'Aventus', brand: 'Creed', price: 4, notes: 'Pineapple, birch, blackcurrant, oakmoss, musk',
        dupe: { name: 'Club de Nuit Intense Man', brand: 'Armaf', price: 1 } },
      { name: 'Coco Mademoiselle', brand: 'Chanel', price: 4, notes: 'Orange, rose, patchouli, vetiver',
        dupe: null },
      { name: 'Mitsouko', brand: 'Guerlain', price: 3, notes: 'Peach, oakmoss, jasmine, spices',
        dupe: null }
    ]
  },
  {
    id: 'woods', name: 'Woods', group: 'woody', color: '#D6D7A8',
    smells: 'Sandalwood, cedar and vetiver. Creamy or dry, always grounded.',
    wear: 'Year-round. Calm, confident, office-safe.',
    picks: [
      { name: 'Santal 33', brand: 'Le Labo', price: 4, notes: 'Sandalwood, cardamom, iris, leather',
        dupe: { name: 'Woody Sandalwood', brand: 'Dossier', price: 1 } },
      { name: 'Bleu de Chanel', brand: 'Chanel', price: 3, notes: 'Grapefruit, incense, ginger, cedar, sandalwood',
        dupe: { name: 'Club de Nuit Blue Iconic', brand: 'Armaf', price: 1 } },
      { name: 'Oud Wood', brand: 'Tom Ford', price: 4, notes: 'Oud, rosewood, cardamom, vetiver, tonka',
        dupe: { name: 'Woody Oud', brand: 'Dossier', price: 1 } }
    ]
  },
  {
    id: 'drywoods', name: 'Dry Woods', group: 'woody', color: '#DDC795',
    smells: 'Smoke, leather and tobacco: birch tar, burnt woods, suede.',
    wear: 'Cold nights. Moody and memorable.',
    picks: [
      { name: 'Jazz Club', brand: 'Maison Margiela', price: 3, notes: 'Rum, tobacco leaf, vanilla, pink pepper',
        dupe: { name: 'Intense Dark Exclusive', brand: 'Zara', price: 1 } },
      { name: 'Tuscan Leather', brand: 'Tom Ford', price: 4, notes: 'Leather, raspberry, saffron, thyme',
        dupe: null },
      { name: 'Ombré Leather', brand: 'Tom Ford', price: 4, notes: 'Leather, cardamom, jasmine, patchouli',
        dupe: null }
    ]
  }
];

// Popular bottles and which family they sit in: [name, brand, familyId].
// Picks and dupes above are added to this list automatically.
const CATALOG_EXTRA = [
  ['Ambre Nuit', 'Dior', 'woodyamber'], ['La Nuit de L\'Homme', 'Yves Saint Laurent', 'woodyamber'],
  ['Ambery Saffron', 'Dossier', 'woodyamber'], ['Not a Perfume', 'Juliette Has a Gun', 'woodyamber'],
  ['Erba Pura', 'Xerjoff', 'woodyamber'], ['Hacivat', 'Nishane', 'mossywoods'],
  ['Le Male', 'Jean Paul Gaultier', 'amber'], ['Spicebomb', 'Viktor & Rolf', 'amber'],
  ['Shalimar', 'Guerlain', 'amber'], ['Opium', 'Yves Saint Laurent', 'amber'],
  ['Hypnotic Poison', 'Dior', 'amber'], ['Vanilla 28', 'Kayali', 'amber'],
  ['Angel', 'Mugler', 'amber'], ['Code Profumo', 'Giorgio Armani', 'amber'],
  ['Eros', 'Versace', 'aromatic'], ['Le Male Elixir', 'Jean Paul Gaultier', 'amber'],
  ['Stronger With You', 'Emporio Armani', 'amber'], ['Uomo Born in Roma', 'Valentino', 'woods'],
  ['La Vie est Belle', 'Lancôme', 'softamber'], ['Flowerbomb', 'Viktor & Rolf', 'softamber'],
  ['Good Girl', 'Carolina Herrera', 'softamber'], ['Candy', 'Prada', 'softamber'],
  ['Cheirosa 62', 'Sol de Janeiro', 'softamber'], ['Yara', 'Lattafa', 'softamber'],
  ['Mon Paris', 'Yves Saint Laurent', 'fruity'], ['Daisy Love', 'Marc Jacobs', 'fruity'],
  ['Viva la Juicy', 'Juicy Couture', 'fruity'], ['Chance Eau Tendre', 'Chanel', 'fruity'],
  ['Sweet Like Candy', 'Ariana Grande', 'fruity'], ['Bright Crystal', 'Versace', 'fruity'],
  ['Daisy', 'Marc Jacobs', 'floral'], ['Miss Dior Blooming Bouquet', 'Dior', 'floral'],
  ['Flora Gorgeous Gardenia', 'Gucci', 'floral'], ['Idôle', 'Lancôme', 'floral'],
  ['Gabrielle', 'Chanel', 'floral'], ['Rose 31', 'Le Labo', 'floral'],
  ['Lazy Sunday Morning', 'Maison Margiela', 'softfloral'], ['Another 13', 'Le Labo', 'softfloral'],
  ['Pure Musc', 'Narciso Rodriguez', 'softfloral'], ['Dior Homme Intense', 'Dior', 'softfloral'],
  ['Infusion d\'Iris', 'Prada', 'softfloral'], ['Clean Reserve Skin', 'Clean', 'softfloral'],
  ['Cool Water', 'Davidoff', 'water'], ['L\'Eau d\'Issey', 'Issey Miyake', 'water'],
  ['Aqva Pour Homme', 'Bvlgari', 'water'], ['Nautica Voyage', 'Nautica', 'water'],
  ['Acqua di Giò Profumo', 'Giorgio Armani', 'water'], ['Aquatic Mind', 'Zara', 'water'],
  ['Wood Sage & Sea Salt', 'Jo Malone', 'water'], ['Allure Homme Sport', 'Chanel', 'water'],
  ['Y Eau de Parfum', 'Yves Saint Laurent', 'aromatic'], ['Luna Rossa Carbon', 'Prada', 'aromatic'],
  ['Invictus', 'Rabanne', 'aromatic'], ['Dylan Blue', 'Versace', 'aromatic'],
  ['Explorer', 'Montblanc', 'mossywoods'], ['Legend', 'Montblanc', 'aromatic'],
  ['Gypsy Water', 'Byredo', 'woods'], ['Terre d\'Hermès', 'Hermès', 'woods'],
  ['Tam Dao', 'Diptyque', 'woods'], ['Wood Sage', 'Zara', 'woods'],
  ['Encre Noire', 'Lalique', 'woods'], ['Hwyl', 'Aesop', 'woods'],
  ['Chanel No 19', 'Chanel', 'green'], ['Vert Malachite', 'Tom Ford', 'green'],
  ['Eau de Campagne', 'Sisley', 'green'], ['English Pear & Freesia', 'Jo Malone', 'fruity'],
  ['Lime Basil & Mandarin', 'Jo Malone', 'citrus'], ['Eau Sauvage', 'Dior', 'citrus'],
  ['Orange Sanguine', 'Atelier Cologne', 'citrus'], ['CK One', 'Calvin Klein', 'citrus'],
  ['Virgin Island Water', 'Creed', 'citrus'], ['Mandarino di Amalfi', 'Tom Ford', 'citrus'],
  ['Miss Dior (Eau de Parfum)', 'Dior', 'mossywoods'], ['Pour Monsieur', 'Chanel', 'mossywoods'],
  ['Club de Nuit Intense Man', 'Armaf', 'mossywoods'], ['Vibrant Leather', 'Zara', 'mossywoods'],
  ['Portrait of a Lady', 'Frédéric Malle', 'mossywoods'], ['Grand Soir', 'Maison Francis Kurkdjian', 'amber'],
  ['By the Fireplace', 'Maison Margiela', 'drywoods'], ['Fahrenheit', 'Dior', 'drywoods'],
  ['Bal d\'Afrique', 'Byredo', 'woods'], ['Tobacco Oud', 'Tom Ford', 'drywoods'],
  ['Oud Ispahan', 'Dior', 'drywoods'], ['Tuscan Leather Intense', 'Tom Ford', 'drywoods'],
  ['Boss Bottled Unlimited', 'Hugo Boss', 'aromatic'], ['Boss Bottled', 'Hugo Boss', 'aromatic'],
  ['Light Blue Pour Homme', 'Dolce & Gabbana', 'citrus'], ['Blue Jeans', 'Versace', 'aromatic'],
  ['Intense Oud', 'Gucci', 'woodyamber'], ['Bleu de Chanel Eau de Parfum', 'Chanel', 'woods'],
  ['Allure Homme Sport Eau Extrême', 'Chanel', 'aromatic'], ['Uomo Born in Roma Intense', 'Valentino', 'amber']
];

const CATALOG = (() => {
  const seen = new Set();
  const list = [];
  const add = (name, brand, family) => {
    const key = (brand + '|' + name).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    list.push({ name, brand, family });
  };
  // Picks first, then the catalog, then dupes, so a dupe that belongs to a
  // different family than its original (Cool Water) keeps its own family.
  for (const f of FAMILIES) for (const p of f.picks) add(p.name, p.brand, f.id);
  for (const [name, brand, family] of CATALOG_EXTRA) add(name, brand, family);
  for (const f of FAMILIES) {
    for (const p of f.picks) if (p.dupe && !p.dupe.style) add(p.dupe.name, p.dupe.brand, f.id);
  }
  return list;
})();
