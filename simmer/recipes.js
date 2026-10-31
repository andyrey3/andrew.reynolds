// Starter recipes loaded on first run. Ingredients are [qty, unit, item, aisle].
// cost: 1 = $, 2 = $$, 3 = $$$. diet tags: veg, vegan, gf (gluten free), df (dairy free).
window.SEED_RECIPES = [
  {
    id: 's-traybake', title: 'Lemon Garlic Chicken Traybake', emoji: '🍋', color: '#f6d365',
    meal: 'dinner', time: 45, cost: 2, servings: 4, diet: ['gf', 'df'], cuisine: 'Mediterranean',
    ingredients: [
      [8, '', 'chicken thighs', 'Meat & Seafood'], [1.5, 'lb', 'baby potatoes', 'Produce'],
      [1, '', 'red onion', 'Produce'], [2, '', 'lemons', 'Produce'], [6, 'cloves', 'garlic', 'Produce'],
      [3, 'tbsp', 'olive oil', 'Pantry'], [2, 'tsp', 'dried oregano', 'Spices'], [1, 'tsp', 'salt', 'Spices']
    ],
    steps: [
      'Heat the oven to 425°F (220°C).',
      'Halve the potatoes and cut the onion into wedges. Spread them on a large tray with the whole garlic cloves.',
      'Toss the chicken with the oil, oregano, salt and the juice of one lemon, then nestle it on top of the vegetables.',
      'Slice the second lemon and tuck the slices around the tray.',
      'Roast for 35 minutes, until the chicken skin is golden and the potatoes are tender.',
      'Squeeze the roasted garlic over everything and serve straight from the tray.'
    ]
  },
  {
    id: 's-gnocchi', title: 'Creamy Tomato Gnocchi', emoji: '🍅', color: '#ff9a8b',
    meal: 'dinner', time: 25, cost: 1, servings: 3, diet: ['veg'], cuisine: 'Italian',
    ingredients: [
      [1, 'lb', 'potato gnocchi', 'Pantry'], [1, 'can', 'crushed tomatoes', 'Pantry'],
      [0.5, 'cup', 'heavy cream', 'Dairy & Eggs'], [3, 'cloves', 'garlic', 'Produce'],
      [2, 'cups', 'baby spinach', 'Produce'], [0.5, 'cup', 'grated parmesan', 'Dairy & Eggs'],
      [1, 'tbsp', 'olive oil', 'Pantry'], [0.5, 'tsp', 'chili flakes', 'Spices']
    ],
    steps: [
      'Warm the oil in a wide pan and cook the sliced garlic and chili flakes for 1 minute.',
      'Add the tomatoes and simmer for 8 minutes until slightly thickened.',
      'Meanwhile, boil the gnocchi until they float, about 3 minutes, then drain.',
      'Stir the cream into the sauce, then fold in the gnocchi and spinach until the spinach wilts.',
      'Finish with parmesan and black pepper.'
    ]
  },
  {
    id: 's-tacos', title: 'Smoky Black Bean Tacos', emoji: '🌮', color: '#a8e063',
    meal: 'dinner', time: 20, cost: 1, servings: 4, diet: ['veg', 'vegan', 'df'], cuisine: 'Mexican',
    ingredients: [
      [2, 'cans', 'black beans', 'Pantry'], [8, '', 'corn tortillas', 'Bakery'],
      [1, '', 'avocado', 'Produce'], [1, '', 'lime', 'Produce'], [0.25, '', 'red cabbage', 'Produce'],
      [1, 'tsp', 'smoked paprika', 'Spices'], [1, 'tsp', 'ground cumin', 'Spices'],
      [0.5, 'cup', 'salsa', 'Pantry'], [1, 'handful', 'cilantro', 'Produce']
    ],
    steps: [
      'Drain the beans and warm them in a pan with the paprika, cumin and a splash of water. Mash about half.',
      'Finely shred the cabbage and toss with half the lime juice and a pinch of salt.',
      'Char the tortillas over a flame or in a dry pan for 30 seconds a side.',
      'Fill each tortilla with beans, cabbage, sliced avocado, salsa and cilantro.',
      'Serve with lime wedges.'
    ]
  },
  {
    id: 's-oats', title: 'Berry Overnight Oats', emoji: '🫐', color: '#b8c6ff',
    meal: 'breakfast', time: 5, cost: 1, servings: 2, diet: ['veg'], cuisine: 'American',
    ingredients: [
      [1, 'cup', 'rolled oats', 'Pantry'], [1, 'cup', 'milk', 'Dairy & Eggs'],
      [0.5, 'cup', 'Greek yogurt', 'Dairy & Eggs'], [1, 'tbsp', 'chia seeds', 'Pantry'],
      [1, 'tbsp', 'maple syrup', 'Pantry'], [1, 'cup', 'mixed berries', 'Produce']
    ],
    steps: [
      'Stir the oats, milk, yogurt, chia seeds and maple syrup together in a jar or bowl.',
      'Cover and refrigerate overnight, or for at least 4 hours.',
      'In the morning, loosen with a splash of milk and top with berries.'
    ]
  },
  {
    id: 's-salmon', title: 'Sheet Pan Salmon & Greens', emoji: '🐟', color: '#ffb199',
    meal: 'dinner', time: 25, cost: 3, servings: 2, diet: ['gf', 'df'], cuisine: 'Modern',
    ingredients: [
      [2, '', 'salmon fillets', 'Meat & Seafood'], [1, 'bunch', 'asparagus', 'Produce'],
      [2, 'cups', 'broccoli florets', 'Produce'], [1, 'tbsp', 'honey', 'Pantry'],
      [1, 'tbsp', 'Dijon mustard', 'Pantry'], [2, 'tbsp', 'olive oil', 'Pantry'], [1, '', 'lemon', 'Produce']
    ],
    steps: [
      'Heat the oven to 400°F (200°C).',
      'Toss the asparagus and broccoli with half the oil and a pinch of salt on a sheet pan. Roast for 8 minutes.',
      'Whisk the honey, mustard and remaining oil, and brush it over the salmon.',
      'Push the vegetables aside, add the salmon and roast for 12 minutes more.',
      'Squeeze lemon over everything before serving.'
    ]
  },
  {
    id: 's-curry', title: 'Coconut Chickpea Curry', emoji: '🍛', color: '#fbc2eb',
    meal: 'dinner', time: 35, cost: 1, servings: 4, diet: ['veg', 'vegan', 'gf', 'df'], cuisine: 'Indian',
    ingredients: [
      [2, 'cans', 'chickpeas', 'Pantry'], [1, 'can', 'coconut milk', 'Pantry'],
      [1, 'can', 'diced tomatoes', 'Pantry'], [1, '', 'yellow onion', 'Produce'],
      [3, 'cloves', 'garlic', 'Produce'], [1, 'tbsp', 'fresh ginger', 'Produce'],
      [2, 'tbsp', 'curry powder', 'Spices'], [1.5, 'cups', 'basmati rice', 'Pantry'], [2, 'cups', 'baby spinach', 'Produce']
    ],
    steps: [
      'Start the rice according to the package.',
      'Soften the chopped onion in a little oil for 5 minutes, then add the garlic, ginger and curry powder for 1 minute.',
      'Add the tomatoes, coconut milk and drained chickpeas. Simmer for 15 minutes.',
      'Stir in the spinach until wilted and season with salt.',
      'Serve over the rice.'
    ]
  },
  {
    id: 's-stirfry', title: 'Ginger Beef & Broccoli', emoji: '🥦', color: '#96e6a1',
    meal: 'dinner', time: 25, cost: 2, servings: 4, diet: ['df'], cuisine: 'Chinese-inspired',
    ingredients: [
      [1, 'lb', 'flank steak', 'Meat & Seafood'], [4, 'cups', 'broccoli florets', 'Produce'],
      [0.25, 'cup', 'soy sauce', 'Pantry'], [1, 'tbsp', 'brown sugar', 'Pantry'],
      [1, 'tbsp', 'cornstarch', 'Pantry'], [1, 'tbsp', 'fresh ginger', 'Produce'],
      [3, 'cloves', 'garlic', 'Produce'], [2, 'tbsp', 'vegetable oil', 'Pantry'], [1.5, 'cups', 'jasmine rice', 'Pantry']
    ],
    steps: [
      'Cook the rice. Slice the steak thinly against the grain.',
      'Whisk the soy sauce, sugar, cornstarch and ½ cup water to make the sauce.',
      'Sear the beef in hot oil in batches for 2 minutes, then set aside.',
      'Stir-fry the broccoli with the garlic and ginger for 3 minutes, adding a splash of water to steam it.',
      'Return the beef, pour in the sauce and toss for 1 minute until glossy. Serve over rice.'
    ]
  },
  {
    id: 's-greek', title: 'Greek Chicken Salad Bowls', emoji: '🥗', color: '#c2e9fb',
    meal: 'lunch', time: 20, cost: 2, servings: 2, diet: ['gf'], cuisine: 'Greek',
    ingredients: [
      [2, '', 'chicken breasts', 'Meat & Seafood'], [1, '', 'cucumber', 'Produce'],
      [1, 'cup', 'cherry tomatoes', 'Produce'], [0.5, 'cup', 'kalamata olives', 'Pantry'],
      [0.5, 'cup', 'feta cheese', 'Dairy & Eggs'], [1, 'cup', 'cooked quinoa', 'Pantry'],
      [2, 'tbsp', 'olive oil', 'Pantry'], [1, 'tbsp', 'red wine vinegar', 'Pantry']
    ],
    steps: [
      'Season the chicken with salt, pepper and oregano and cook in a hot pan for 6 minutes a side.',
      'Chop the cucumber and halve the tomatoes.',
      'Whisk the oil and vinegar into a quick dressing.',
      'Divide the quinoa between bowls and top with vegetables, olives, feta and sliced chicken.',
      'Drizzle with the dressing.'
    ]
  },
  {
    id: 's-omelette', title: 'Spinach & Feta Omelette', emoji: '🍳', color: '#fddb92',
    meal: 'breakfast', time: 10, cost: 1, servings: 1, diet: ['veg', 'gf'], cuisine: 'Greek',
    ingredients: [
      [3, '', 'eggs', 'Dairy & Eggs'], [1, 'cup', 'baby spinach', 'Produce'],
      [2, 'tbsp', 'feta cheese', 'Dairy & Eggs'], [1, 'tsp', 'butter', 'Dairy & Eggs']
    ],
    steps: [
      'Beat the eggs with a pinch of salt and pepper.',
      'Melt the butter in a small nonstick pan and wilt the spinach for 30 seconds.',
      'Pour in the eggs and cook, pulling the edges in, until almost set, about 2 minutes.',
      'Scatter over the feta, fold in half and slide onto a plate.'
    ]
  },
  {
    id: 's-noodles', title: 'Sesame Peanut Noodles', emoji: '🥜', color: '#f3d9b1',
    meal: 'lunch', time: 15, cost: 1, servings: 2, diet: ['veg', 'vegan', 'df'], cuisine: 'Asian-inspired',
    ingredients: [
      [8, 'oz', 'spaghetti or noodles', 'Pantry'], [3, 'tbsp', 'peanut butter', 'Pantry'],
      [2, 'tbsp', 'soy sauce', 'Pantry'], [1, 'tbsp', 'rice vinegar', 'Pantry'],
      [1, 'tbsp', 'sesame oil', 'Pantry'], [1, '', 'cucumber', 'Produce'],
      [2, '', 'green onions', 'Produce'], [1, 'tbsp', 'sesame seeds', 'Spices']
    ],
    steps: [
      'Cook the noodles, then rinse under cold water and drain.',
      'Whisk the peanut butter, soy sauce, vinegar and sesame oil with 2–3 tbsp warm water until smooth.',
      'Cut the cucumber into matchsticks and slice the green onions.',
      'Toss the noodles in the sauce and top with cucumber, green onion and sesame seeds.'
    ]
  },
  {
    id: 's-risotto', title: 'Mushroom & Thyme Risotto', emoji: '🍄', color: '#d4c4a8',
    meal: 'dinner', time: 40, cost: 2, servings: 4, diet: ['veg', 'gf'], cuisine: 'Italian',
    ingredients: [
      [1.5, 'cups', 'arborio rice', 'Pantry'], [12, 'oz', 'cremini mushrooms', 'Produce'],
      [5, 'cups', 'vegetable stock', 'Pantry'], [1, '', 'shallot', 'Produce'],
      [2, 'cloves', 'garlic', 'Produce'], [0.5, 'cup', 'grated parmesan', 'Dairy & Eggs'],
      [2, 'tbsp', 'butter', 'Dairy & Eggs'], [4, 'sprigs', 'fresh thyme', 'Produce']
    ],
    steps: [
      'Keep the stock warm in a pot on the back of the stove.',
      'Brown the sliced mushrooms in half the butter for 6 minutes. Set aside.',
      'Soften the shallot and garlic, then add the rice and stir for 1 minute.',
      'Add the stock a ladle at a time, stirring until absorbed before adding more, for about 20 minutes.',
      'Stir in the mushrooms, thyme leaves, parmesan and remaining butter. Rest for 2 minutes and serve.'
    ]
  },
  {
    id: 's-pancakes', title: 'Fluffy Banana Pancakes', emoji: '🥞', color: '#ffe29f',
    meal: 'breakfast', time: 20, cost: 1, servings: 3, diet: ['veg'], cuisine: 'American',
    ingredients: [
      [2, '', 'ripe bananas', 'Produce'], [2, '', 'eggs', 'Dairy & Eggs'],
      [1, 'cup', 'all-purpose flour', 'Pantry'], [0.75, 'cup', 'milk', 'Dairy & Eggs'],
      [2, 'tsp', 'baking powder', 'Pantry'], [1, 'tbsp', 'butter', 'Dairy & Eggs'], [2, 'tbsp', 'maple syrup', 'Pantry']
    ],
    steps: [
      'Mash the bananas in a bowl, then whisk in the eggs and milk.',
      'Stir in the flour and baking powder until just combined.',
      'Heat a buttered pan over medium heat and pour in ¼ cup of batter per pancake.',
      'Flip when bubbles form, after about 2 minutes, and cook 1 minute more.',
      'Serve with maple syrup.'
    ]
  },
  {
    id: 's-chili', title: 'One-Pot Turkey Chili', emoji: '🌶️', color: '#f5576c',
    meal: 'dinner', time: 50, cost: 2, servings: 6, diet: ['gf', 'df'], cuisine: 'Tex-Mex',
    ingredients: [
      [1, 'lb', 'ground turkey', 'Meat & Seafood'], [1, '', 'yellow onion', 'Produce'],
      [1, '', 'red bell pepper', 'Produce'], [2, 'cans', 'kidney beans', 'Pantry'],
      [1, 'can', 'crushed tomatoes', 'Pantry'], [2, 'tbsp', 'chili powder', 'Spices'],
      [1, 'tsp', 'ground cumin', 'Spices'], [2, 'cups', 'chicken stock', 'Pantry']
    ],
    steps: [
      'Brown the turkey in a large pot, breaking it up, for 6 minutes.',
      'Add the chopped onion and pepper and cook for 5 minutes.',
      'Stir in the spices, then the beans, tomatoes and stock.',
      'Simmer, partly covered, for 30 minutes, stirring now and then.',
      'Season and serve with your favorite toppings.'
    ]
  },
  {
    id: 's-caprese', title: 'Pesto Caprese Sandwich', emoji: '🥪', color: '#d4fc79',
    meal: 'lunch', time: 10, cost: 1, servings: 2, diet: ['veg'], cuisine: 'Italian',
    ingredients: [
      [1, '', 'ciabatta loaf', 'Bakery'], [8, 'oz', 'fresh mozzarella', 'Dairy & Eggs'],
      [2, '', 'tomatoes', 'Produce'], [3, 'tbsp', 'basil pesto', 'Pantry'], [1, 'handful', 'arugula', 'Produce']
    ],
    steps: [
      'Split the ciabatta and toast it lightly.',
      'Spread both sides with pesto.',
      'Layer sliced mozzarella, tomatoes and arugula. Season with salt and pepper.',
      'Close, press gently and cut in half.'
    ]
  },
  {
    id: 's-friedrice', title: 'Garlic Shrimp Fried Rice', emoji: '🍤', color: '#ffc3a0',
    meal: 'dinner', time: 20, cost: 2, servings: 3, diet: ['df'], cuisine: 'Asian-inspired',
    ingredients: [
      [3, 'cups', 'cooked rice', 'Pantry'], [12, 'oz', 'shrimp', 'Meat & Seafood'],
      [2, '', 'eggs', 'Dairy & Eggs'], [1, 'cup', 'frozen peas and carrots', 'Frozen'],
      [3, 'cloves', 'garlic', 'Produce'], [3, 'tbsp', 'soy sauce', 'Pantry'],
      [2, '', 'green onions', 'Produce'], [2, 'tbsp', 'vegetable oil', 'Pantry']
    ],
    steps: [
      'Sear the shrimp in half the oil for 2 minutes until pink, then set aside.',
      'Scramble the eggs in the same pan and set aside with the shrimp.',
      'Fry the garlic and frozen vegetables in the remaining oil for 2 minutes.',
      'Add the rice and soy sauce and fry for 4 minutes, pressing it against the pan.',
      'Fold back in the shrimp and egg and finish with green onions.'
    ]
  },
  {
    id: 's-lentil', title: 'Hearty Lemony Lentil Soup', emoji: '🥣', color: '#e0c3fc',
    meal: 'lunch', time: 45, cost: 1, servings: 6, diet: ['veg', 'vegan', 'gf', 'df'], cuisine: 'Middle Eastern',
    ingredients: [
      [1.5, 'cups', 'red lentils', 'Pantry'], [1, '', 'yellow onion', 'Produce'],
      [2, '', 'carrots', 'Produce'], [2, '', 'celery stalks', 'Produce'],
      [6, 'cups', 'vegetable stock', 'Pantry'], [1, 'tsp', 'ground cumin', 'Spices'],
      [1, '', 'lemon', 'Produce'], [2, 'tbsp', 'olive oil', 'Pantry']
    ],
    steps: [
      'Soften the chopped onion, carrots and celery in the oil for 8 minutes.',
      'Add the cumin, then the rinsed lentils and stock.',
      'Simmer for 25 minutes until the lentils break down.',
      'Blend half the soup for a creamy texture, if you like.',
      'Season and stir in the lemon juice just before serving.'
    ]
  },
  {
    id: 's-pesto', title: 'Speedy Pesto Pasta with Peas', emoji: '🌿', color: '#84fab0',
    meal: 'dinner', time: 15, cost: 1, servings: 4, diet: ['veg'], cuisine: 'Italian',
    ingredients: [
      [1, 'lb', 'fusilli', 'Pantry'], [0.5, 'cup', 'basil pesto', 'Pantry'],
      [1.5, 'cups', 'frozen peas', 'Frozen'], [0.5, 'cup', 'grated parmesan', 'Dairy & Eggs'], [1, '', 'lemon', 'Produce']
    ],
    steps: [
      'Boil the pasta in well-salted water. Add the peas for the final 2 minutes.',
      'Save a cup of the cooking water, then drain.',
      'Toss the pasta with the pesto, parmesan, lemon zest and a splash of the water until glossy.'
    ]
  },
  {
    id: 's-parfait', title: 'Honey Yogurt Parfait', emoji: '🍯', color: '#fff1a8',
    meal: 'breakfast', time: 5, cost: 1, servings: 1, diet: ['veg', 'gf'], cuisine: 'American',
    ingredients: [
      [1, 'cup', 'Greek yogurt', 'Dairy & Eggs'], [0.5, 'cup', 'granola', 'Pantry'],
      [0.5, 'cup', 'strawberries', 'Produce'], [1, 'tbsp', 'honey', 'Pantry']
    ],
    steps: [
      'Spoon half the yogurt into a glass and add half the granola and berries.',
      'Repeat the layers and drizzle with honey.'
    ]
  },
  {
    id: 's-burrito', title: 'Sweet Potato Breakfast Burritos', emoji: '🌯', color: '#ffcf71',
    meal: 'breakfast', time: 30, cost: 1, servings: 4, diet: ['veg'], cuisine: 'Tex-Mex',
    ingredients: [
      [1, '', 'sweet potato', 'Produce'], [6, '', 'eggs', 'Dairy & Eggs'],
      [4, '', 'large flour tortillas', 'Bakery'], [1, 'cup', 'shredded cheddar', 'Dairy & Eggs'],
      [1, 'can', 'black beans', 'Pantry'], [0.5, 'cup', 'salsa', 'Pantry']
    ],
    steps: [
      'Dice the sweet potato and pan-fry it with a little oil, covered, for 10 minutes until tender.',
      'Add the drained beans to warm through.',
      'Scramble the eggs softly in a separate pan.',
      'Fill the tortillas with potato, beans, eggs, cheese and salsa, then roll up.',
      'Toast seam-side down in a dry pan for 1 minute.'
    ]
  },
  {
    id: 's-wraps', title: 'Crunchy Turkey Lettuce Wraps', emoji: '🥬', color: '#c1f0c1',
    meal: 'lunch', time: 15, cost: 2, servings: 3, diet: ['gf', 'df'], cuisine: 'Asian-inspired',
    ingredients: [
      [1, 'lb', 'ground turkey', 'Meat & Seafood'], [1, 'head', 'butter lettuce', 'Produce'],
      [1, 'can', 'water chestnuts', 'Pantry'], [3, 'tbsp', 'tamari', 'Pantry'],
      [1, 'tbsp', 'rice vinegar', 'Pantry'], [1, '', 'carrot', 'Produce'], [2, '', 'green onions', 'Produce']
    ],
    steps: [
      'Brown the turkey in a hot pan for 6 minutes.',
      'Add the chopped water chestnuts, tamari and vinegar and cook 2 minutes more.',
      'Spoon into lettuce cups and top with grated carrot and green onion.'
    ]
  }
];
