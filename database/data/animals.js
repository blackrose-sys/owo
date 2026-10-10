// Database of animals across all OwO tiers with accurate rarities, emojis, and battle stats
const ANIMALS = [
  // --- COMMON (Tier 1) - Drop rate: ~55% ---
  { id: 'dog', name: 'Dog', emoji: '🐶', tier: 'common', points: 10, hp: 50, atk: 12, def: 8, spd: 10 },
  { id: 'cat', name: 'Cat', emoji: '🐱', tier: 'common', points: 10, hp: 45, atk: 14, def: 7, spd: 13 },
  { id: 'mouse', name: 'Mouse', emoji: '🐭', tier: 'common', points: 10, hp: 35, atk: 10, def: 5, spd: 16 },
  { id: 'hamster', name: 'Hamster', emoji: '🐹', tier: 'common', points: 10, hp: 40, atk: 11, def: 6, spd: 12 },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', tier: 'common', points: 10, hp: 42, atk: 13, def: 7, spd: 15 },
  { id: 'fox', name: 'Fox', emoji: '🦊', tier: 'common', points: 12, hp: 52, atk: 15, def: 9, spd: 14 },
  { id: 'bear', name: 'Bear', emoji: '🐻', tier: 'common', points: 15, hp: 70, atk: 18, def: 14, spd: 6 },
  { id: 'panda', name: 'Panda', emoji: '🐼', tier: 'common', points: 15, hp: 68, atk: 16, def: 13, spd: 7 },
  { id: 'koala', name: 'Koala', emoji: '🐨', tier: 'common', points: 12, hp: 48, atk: 11, def: 10, spd: 5 },
  { id: 'tiger', name: 'Tiger', emoji: '🐯', tier: 'common', points: 15, hp: 62, atk: 19, def: 11, spd: 12 },
  { id: 'lion', name: 'Lion', emoji: '🦁', tier: 'common', points: 15, hp: 65, atk: 20, def: 12, spd: 11 },
  { id: 'cow', name: 'Cow', emoji: '🐮', tier: 'common', points: 10, hp: 60, atk: 10, def: 12, spd: 6 },
  { id: 'pig', name: 'Pig', emoji: '🐷', tier: 'common', points: 10, hp: 55, atk: 12, def: 10, spd: 8 },
  { id: 'frog', name: 'Frog', emoji: '🐸', tier: 'common', points: 10, hp: 38, atk: 11, def: 7, spd: 14 },
  { id: 'monkey', name: 'Monkey', emoji: '🐵', tier: 'common', points: 12, hp: 46, atk: 14, def: 8, spd: 15 },
  { id: 'chicken', name: 'Chicken', emoji: '🐔', tier: 'common', points: 10, hp: 35, atk: 12, def: 6, spd: 11 },
  { id: 'penguin', name: 'Penguin', emoji: '🐧', tier: 'common', points: 12, hp: 45, atk: 13, def: 9, spd: 9 },
  { id: 'bird', name: 'Bird', emoji: '🐦', tier: 'common', points: 10, hp: 32, atk: 13, def: 5, spd: 16 },
  { id: 'duck', name: 'Duck', emoji: '🦆', tier: 'common', points: 10, hp: 36, atk: 11, def: 6, spd: 12 },
  { id: 'eagle', name: 'Eagle', emoji: '🦅', tier: 'common', points: 15, hp: 50, atk: 18, def: 10, spd: 16 },
  { id: 'owl', name: 'Owl', emoji: '🦉', tier: 'common', points: 14, hp: 45, atk: 16, def: 9, spd: 13 },
  { id: 'bat', name: 'Bat', emoji: '🦇', tier: 'common', points: 10, hp: 34, atk: 14, def: 5, spd: 17 },
  { id: 'wolf', name: 'Wolf', emoji: '🐺', tier: 'common', points: 15, hp: 58, atk: 18, def: 11, spd: 13 },
  { id: 'boar', name: 'Boar', emoji: '🐗', tier: 'common', points: 12, hp: 60, atk: 15, def: 12, spd: 9 },
  { id: 'horse', name: 'Horse', emoji: '🐴', tier: 'common', points: 14, hp: 62, atk: 15, def: 11, spd: 15 },
  { id: 'unicorn', name: 'Unicorn', emoji: '🦄', tier: 'common', points: 20, hp: 65, atk: 18, def: 13, spd: 16 },
  { id: 'bee', name: 'Bee', emoji: '🐝', tier: 'common', points: 10, hp: 28, atk: 15, def: 4, spd: 18 },
  { id: 'bug', name: 'Bug', emoji: '🐛', tier: 'common', points: 10, hp: 25, atk: 8, def: 5, spd: 4 },
  { id: 'butterfly', name: 'Butterfly', emoji: '🦋', tier: 'common', points: 10, hp: 30, atk: 10, def: 5, spd: 15 },
  { id: 'snail', name: 'Snail', emoji: '🐌', tier: 'common', points: 10, hp: 35, atk: 6, def: 18, spd: 2 },

  // --- UNCOMMON (Tier 2) - Drop rate: ~25% ---
  { id: 'raccoon', name: 'Raccoon', emoji: '🦝', tier: 'uncommon', points: 35, hp: 70, atk: 22, def: 14, spd: 18 },
  { id: 'skunk', name: 'Skunk', emoji: '🦨', tier: 'uncommon', points: 35, hp: 65, atk: 20, def: 15, spd: 12 },
  { id: 'badger', name: 'Badger', emoji: '🦡', tier: 'uncommon', points: 40, hp: 75, atk: 24, def: 18, spd: 14 },
  { id: 'hedgehog', name: 'Hedgehog', emoji: '🦔', tier: 'uncommon', points: 35, hp: 60, atk: 18, def: 22, spd: 11 },
  { id: 'otter', name: 'Otter', emoji: '🦦', tier: 'uncommon', points: 40, hp: 68, atk: 21, def: 15, spd: 17 },
  { id: 'sloth', name: 'Sloth', emoji: '🦥', tier: 'uncommon', points: 35, hp: 80, atk: 16, def: 20, spd: 4 },
  { id: 'kangaroo', name: 'Kangaroo', emoji: '🦘', tier: 'uncommon', points: 45, hp: 82, atk: 26, def: 16, spd: 19 },
  { id: 'llama', name: 'Llama', emoji: '🦙', tier: 'uncommon', points: 40, hp: 76, atk: 20, def: 17, spd: 13 },
  { id: 'giraffe', name: 'Giraffe', emoji: '🦒', tier: 'uncommon', points: 45, hp: 90, atk: 22, def: 18, spd: 15 },
  { id: 'elephant', name: 'Elephant', emoji: '🐘', tier: 'uncommon', points: 50, hp: 110, atk: 25, def: 25, spd: 8 },
  { id: 'rhino', name: 'Rhino', emoji: '🦏', tier: 'uncommon', points: 50, hp: 105, atk: 28, def: 24, spd: 10 },
  { id: 'hippo', name: 'Hippo', emoji: '🦛', tier: 'uncommon', points: 50, hp: 112, atk: 27, def: 22, spd: 9 },
  { id: 'camel', name: 'Camel', emoji: '🐪', tier: 'uncommon', points: 40, hp: 85, atk: 19, def: 18, spd: 11 },
  { id: 'zebra', name: 'Zebra', emoji: '🦓', tier: 'uncommon', points: 45, hp: 80, atk: 21, def: 16, spd: 19 },
  { id: 'leopard', name: 'Leopard', emoji: '🐆', tier: 'uncommon', points: 48, hp: 78, atk: 29, def: 15, spd: 22 },
  { id: 'deer', name: 'Deer', emoji: '🦌', tier: 'uncommon', points: 40, hp: 72, atk: 20, def: 14, spd: 20 },

  // --- RARE (Tier 3) - Drop rate: ~12% ---
  { id: 'octopus', name: 'Octopus', emoji: '🐙', tier: 'rare', points: 100, hp: 110, atk: 35, def: 24, spd: 18 },
  { id: 'squid', name: 'Squid', emoji: '🦑', tier: 'rare', points: 100, hp: 105, atk: 36, def: 22, spd: 20 },
  { id: 'shrimp', name: 'Shrimp', emoji: '🦐', tier: 'rare', points: 90, hp: 85, atk: 32, def: 20, spd: 22 },
  { id: 'lobster', name: 'Lobster', emoji: '🦞', tier: 'rare', points: 100, hp: 115, atk: 38, def: 28, spd: 15 },
  { id: 'crab', name: 'Crab', emoji: '🦀', tier: 'rare', points: 95, hp: 110, atk: 34, def: 32, spd: 14 },
  { id: 'pufferfish', name: 'Pufferfish', emoji: '🐡', tier: 'rare', points: 110, hp: 120, atk: 40, def: 26, spd: 16 },
  { id: 'dolphin', name: 'Dolphin', emoji: '🐬', tier: 'rare', points: 120, hp: 125, atk: 38, def: 25, spd: 26 },
  { id: 'whale', name: 'Whale', emoji: '🐳', tier: 'rare', points: 140, hp: 160, atk: 36, def: 32, spd: 14 },
  { id: 'shark', name: 'Shark', emoji: '🦈', tier: 'rare', points: 135, hp: 130, atk: 46, def: 26, spd: 24 },
  { id: 'crocodile', name: 'Crocodile', emoji: '🐊', tier: 'rare', points: 125, hp: 135, atk: 44, def: 30, spd: 17 },
  { id: 'turtle', name: 'Turtle', emoji: '🐢', tier: 'rare', points: 100, hp: 140, atk: 25, def: 45, spd: 8 },
  { id: 'snake', name: 'Snake', emoji: '🐍', tier: 'rare', points: 105, hp: 95, atk: 42, def: 20, spd: 23 },

  // --- EPIC (Tier 4) - Drop rate: ~5.5% ---
  { id: 'peacock', name: 'Peacock', emoji: '🦚', tier: 'epic', points: 300, hp: 150, atk: 52, def: 35, spd: 28 },
  { id: 'swan', name: 'Swan', emoji: '🦢', tier: 'epic', points: 300, hp: 155, atk: 50, def: 38, spd: 26 },
  { id: 'flamingo', name: 'Flamingo', emoji: '🦩', tier: 'epic', points: 290, hp: 145, atk: 53, def: 34, spd: 30 },
  { id: 'trex', name: 'T-Rex', emoji: '🦖', tier: 'epic', points: 400, hp: 200, atk: 68, def: 42, spd: 24 },
  { id: 'brachio', name: 'Brachiosaurus', emoji: '🦕', tier: 'epic', points: 380, hp: 230, atk: 55, def: 50, spd: 16 },
  { id: 'dragon', name: 'Dragon', emoji: '🐉', tier: 'epic', points: 450, hp: 210, atk: 72, def: 46, spd: 32 },

  // --- MYTHIC (Tier 5) - Drop rate: ~1.8% ---
  { id: 'thunderbeast', name: 'Thunder Beast', emoji: '⚡', tier: 'mythic', points: 1200, hp: 280, atk: 95, def: 58, spd: 45 },
  { id: 'kitsune', name: 'Frost Kitsune', emoji: '❄️', tier: 'mythic', points: 1300, hp: 260, atk: 98, def: 60, spd: 50 },
  { id: 'phoenix', name: 'Fire Phoenix', emoji: '🔥', tier: 'mythic', points: 1400, hp: 275, atk: 102, def: 56, spd: 48 },
  { id: 'shadowstalker', name: 'Shadow Stalker', emoji: '🌑', tier: 'mythic', points: 1350, hp: 270, atk: 105, def: 52, spd: 52 },
  { id: 'pegasus', name: 'Astral Pegasus', emoji: '🌟', tier: 'mythic', points: 1500, hp: 290, atk: 96, def: 64, spd: 46 },

  // --- LEGENDARY (Tier 6) - Drop rate: ~0.5% ---
  { id: 'chimera', name: 'Golden Chimera', emoji: '👑', tier: 'legendary', points: 4000, hp: 380, atk: 135, def: 85, spd: 58 },
  { id: 'leviathan', name: 'Void Leviathan', emoji: '🌌', tier: 'legendary', points: 4500, hp: 440, atk: 140, def: 95, spd: 52 },
  { id: 'celestial_dragon', name: 'Celestial Wyrm', emoji: '☄️', tier: 'legendary', points: 5000, hp: 410, atk: 148, def: 90, spd: 64 },

  // --- FABLED / GODLY (Tier 7) - Drop rate: ~0.15% ---
  { id: 'primordial', name: 'Primordial Behemoth', emoji: '⚜️', tier: 'fabled', points: 12000, hp: 600, atk: 195, def: 130, spd: 65 },
  { id: 'genesis_wyrm', name: 'Genesis Wyrm', emoji: '🌠', tier: 'fabled', points: 15000, hp: 650, atk: 210, def: 140, spd: 72 },

  // --- GEM / SPECIAL (Tier 8) - Special events or rare drop ~0.05% ---
  { id: 'ruby_fox', name: 'Ruby Fox', emoji: '💎', tier: 'gem', points: 20000, hp: 550, atk: 220, def: 125, spd: 80 },
  { id: 'sapphire_wolf', name: 'Sapphire Wolf', emoji: '💠', tier: 'gem', points: 22000, hp: 580, atk: 230, def: 135, spd: 82 },
  { id: 'emerald_owl', name: 'Emerald Owl', emoji: '🔮', tier: 'gem', points: 25000, hp: 600, atk: 240, def: 140, spd: 85 },
];

const TIER_INFO = {
  common: { name: 'Common', color: '#9e9e9e', weight: 55, sellPrice: 15, sacrificeEssence: 1 },
  uncommon: { name: 'Uncommon', color: '#4caf50', weight: 26, sellPrice: 40, sacrificeEssence: 3 },
  rare: { name: 'Rare', color: '#2196f3', weight: 12, sellPrice: 120, sacrificeEssence: 8 },
  epic: { name: 'Epic', color: '#9c27b0', weight: 5, sellPrice: 350, sacrificeEssence: 25 },
  mythic: { name: 'Mythic', color: '#e91e63', weight: 1.5, sellPrice: 1500, sacrificeEssence: 100 },
  legendary: { name: 'Legendary', color: '#ff9800', weight: 0.4, sellPrice: 5000, sacrificeEssence: 400 },
  fabled: { name: 'Fabled', color: '#ffeb3b', weight: 0.08, sellPrice: 15000, sacrificeEssence: 1200 },
  gem: { name: 'Gem / Special', color: '#00e5ff', weight: 0.02, sellPrice: 30000, sacrificeEssence: 3000 },
};

function getAnimalById(id) {
  if (!id) return null;
  const search = id.toLowerCase().trim();
  
  // 1. Exact ID match
  const exactId = ANIMALS.find(a => a.id.toLowerCase() === search);
  if (exactId) return exactId;
  
  // 2. Exact name match
  const exactName = ANIMALS.find(a => a.name.toLowerCase() === search);
  if (exactName) return exactName;
  
  // 3. Underscore/dash → space conversion (frost_kitsune → frost kitsune, fire-phoenix → fire phoenix)
  const spaced = search.replace(/[_\-]/g, ' ');
  const spacedMatch = ANIMALS.find(a => a.name.toLowerCase() === spaced || a.id.toLowerCase() === spaced);
  if (spacedMatch) return spacedMatch;
  
  // 4. Emoji match (e.g. searching by ⚡ or 🐺)
  const emojiMatch = ANIMALS.find(a => a.emoji === id);
  if (emojiMatch) return emojiMatch;
  
  // 5. Partial match - name starts with search (e.g. "frost" → "Frost Kitsune", "thunder" → "Thunder Beast")
  const startsWith = ANIMALS.find(a => a.name.toLowerCase().startsWith(search) || a.name.toLowerCase().startsWith(spaced));
  if (startsWith) return startsWith;
  
  // 6. Partial match - name contains search (e.g. "kitsune" → "Frost Kitsune", "phoenix" → "Fire Phoenix")
  const contains = ANIMALS.find(a => a.name.toLowerCase().includes(search) || a.name.toLowerCase().includes(spaced));
  if (contains) return contains;
  
  // 7. No spaces version (frostkitsune → frost kitsune)
  const noSpaces = ANIMALS.find(a => a.name.toLowerCase().replace(/\s+/g, '') === search.replace(/\s+/g, ''));
  if (noSpaces) return noSpaces;
  
  return null;
}

function getRandomAnimals(count = 1, luckBonus = 0) {
  const result = [];
  
  // Calculate adjusted weights based on luck bonus
  for (let i = 0; i < count; i++) {
    // Determine tier
    const rand = Math.random() * 100;
    let chosenTier = 'common';
    
    // Effective weights with luck bonus (shifts toward higher tiers)
    const gemThreshold = TIER_INFO.gem.weight * (1 + luckBonus * 0.5);
    const fabledThreshold = gemThreshold + TIER_INFO.fabled.weight * (1 + luckBonus * 0.4);
    const legendaryThreshold = fabledThreshold + TIER_INFO.legendary.weight * (1 + luckBonus * 0.3);
    const mythicThreshold = legendaryThreshold + TIER_INFO.mythic.weight * (1 + luckBonus * 0.25);
    const epicThreshold = mythicThreshold + TIER_INFO.epic.weight * (1 + luckBonus * 0.2);
    const rareThreshold = epicThreshold + TIER_INFO.rare.weight * (1 + luckBonus * 0.15);
    const uncommonThreshold = rareThreshold + TIER_INFO.uncommon.weight;

    if (rand < gemThreshold) chosenTier = 'gem';
    else if (rand < fabledThreshold) chosenTier = 'fabled';
    else if (rand < legendaryThreshold) chosenTier = 'legendary';
    else if (rand < mythicThreshold) chosenTier = 'mythic';
    else if (rand < epicThreshold) chosenTier = 'epic';
    else if (rand < rareThreshold) chosenTier = 'rare';
    else if (rand < uncommonThreshold) chosenTier = 'uncommon';
    else chosenTier = 'common';

    const pool = ANIMALS.filter(a => a.tier === chosenTier);
    const selected = pool[Math.floor(Math.random() * pool.length)];
    result.push(selected);
  }
  return result;
}

module.exports = {
  ANIMALS,
  TIER_INFO,
  getAnimalById,
  getRandomAnimals
};
