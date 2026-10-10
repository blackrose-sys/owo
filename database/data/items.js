// Item catalogue, weapons, crates, and shop items
const SHOP_ITEMS = [
  {
    id: 'ring',
    name: 'Love Ring',
    emoji: '💍',
    price: 10000,
    category: 'social',
    description: 'A sparkling diamond ring required to marry your beloved companion in owo marry.'
  },
  {
    id: 'crate_common',
    name: 'Common Crate',
    emoji: '📦',
    price: 1000,
    category: 'crates',
    description: 'A wooden crate filled with basic goodies: Cowoncy, Common-Rare animals, or weapon shards.'
  },
  {
    id: 'crate_rare',
    name: 'Rare Crate',
    emoji: '🎁',
    price: 5000,
    category: 'crates',
    description: 'A gilded crate with higher chances of Rare, Epic, and Mythic animals plus bonus Cowoncy.'
  },
  {
    id: 'crate_weapon',
    name: 'Armory Crate',
    emoji: '🗡️',
    price: 8000,
    category: 'crates',
    description: 'Guaranteed to grant a battle weapon from Common to Legendary rank.'
  },
  {
    id: 'gem_luck',
    name: 'Luck Gem',
    emoji: '💎',
    price: 3000,
    category: 'gems',
    description: 'Shines with radiant fortune. Grants +50% higher animal rarity chances for 30 minutes.'
  },
  {
    id: 'bait',
    name: 'Golden Bait',
    emoji: '🥩',
    price: 4000,
    category: 'consumable',
    description: 'Irresistible treat that lures max (3) animals on your next 15 hunts!'
  },
  {
    id: 'elixir_exp',
    name: 'EXP Elixir',
    emoji: '🧪',
    price: 2500,
    category: 'battle',
    description: 'Instantly grants 500 battle experience points to your active battle team.'
  },
  {
    id: 'shield_aegis',
    name: 'Guardian Ward',
    emoji: '🛡️',
    price: 6000,
    category: 'battle',
    description: 'Shields your team in battle, increasing DEF by +25 for 5 battles.'
  }
];

// Authentic OwO Weapons matching user screenshot and official armory
const WEAPONS = [
  // --- COMMON [C] ---
  { id: 'conduit_claw', name: 'Conduit Claw', type: 'claw', typeEmoji: '🐾', element: 'biohazard', elementEmoji: '☣️', tier: 'common', atk: 22, def: 8, crit: 10, price: 800 },
  { id: 'staff_purity', name: 'Decent Staff of Purity', type: 'staff', typeEmoji: '🪄', element: 'lightning', elementEmoji: '⚡', tier: 'common', atk: 20, def: 15, crit: 8, price: 850 },
  { id: 'rusty_dagger', name: 'Rusty Dagger', type: 'dagger', typeEmoji: '🗡️', element: 'poison', elementEmoji: '🧪', tier: 'common', atk: 18, def: 4, crit: 12, price: 500 },
  { id: 'wooden_staff', name: 'Wooden Staff', type: 'staff', typeEmoji: '🦯', element: 'water', elementEmoji: '💧', tier: 'common', atk: 15, def: 10, crit: 6, price: 500 },
  { id: 'hunting_slingshot', name: 'Hunting Slingshot', type: 'bow', typeEmoji: '🪃', element: 'fist', elementEmoji: '👊', tier: 'common', atk: 17, def: 5, crit: 14, price: 600 },
  { id: 'buckler_shield', name: 'Wooden Buckler', type: 'shield', typeEmoji: '🛡️', element: 'earth', elementEmoji: '🛡️', tier: 'common', atk: 10, def: 25, crit: 4, price: 650 },

  // --- UNCOMMON [U] ---
  { id: 'foul_fish', name: 'Foul Fish', type: 'fish', typeEmoji: '🐟', element: 'water', elementEmoji: '💧', tier: 'uncommon', atk: 45, def: 18, crit: 15, price: 2400 },
  { id: 'spirit_staff', name: 'Spirit Staff', type: 'staff', typeEmoji: '🪄', element: 'water', elementEmoji: '💧', tier: 'uncommon', atk: 48, def: 24, crit: 16, price: 2600 },
  { id: 'iron_broadsword', name: 'Iron Broadsword', type: 'sword', typeEmoji: '⚔️', element: 'fist', elementEmoji: '👊', tier: 'uncommon', atk: 42, def: 20, crit: 14, price: 2200 },
  { id: 'oak_longbow', name: 'Oak Longbow', type: 'bow', typeEmoji: '🏹', element: 'portal', elementEmoji: '🌀', tier: 'uncommon', atk: 46, def: 14, crit: 22, price: 2500 },
  { id: 'apprentice_wand', name: 'Apprentice Wand', type: 'scepter', typeEmoji: '🦯', element: 'lightning', elementEmoji: '⚡', tier: 'uncommon', atk: 40, def: 22, crit: 18, price: 2300 },
  { id: 'reinforced_shield', name: 'Reinforced Kite Shield', type: 'shield', typeEmoji: '🛡️', element: 'ice', elementEmoji: '❄️', tier: 'uncommon', atk: 25, def: 55, crit: 8, price: 2500 },

  // --- RARE [R] ---
  { id: 'silver_rapier', name: 'Silver Rapier', type: 'sword', typeEmoji: '🤺', element: 'lightning', elementEmoji: '⚡', tier: 'rare', atk: 75, def: 25, crit: 25, price: 7000 },
  { id: 'crystal_blade', name: 'Crystal Blade', type: 'sword', typeEmoji: '💎', element: 'ice', elementEmoji: '❄️', tier: 'rare', atk: 82, def: 22, crit: 24, price: 7500 },
  { id: 'battle_axe', name: 'Viking Battleaxe', type: 'axe', typeEmoji: '🪓', element: 'blood', elementEmoji: '🩸', tier: 'rare', atk: 88, def: 18, crit: 20, price: 7200 },
  { id: 'ice_scepter', name: 'Glacial Scepter', type: 'scepter', typeEmoji: '🦯', element: 'ice', elementEmoji: '❄️', tier: 'rare', atk: 78, def: 32, crit: 22, price: 7400 },
  { id: 'culling_scythe', name: 'Culling Scythe', type: 'scythe', typeEmoji: '🌙', element: 'blood', elementEmoji: '🩸', tier: 'rare', atk: 90, def: 15, crit: 30, price: 7600 },
  { id: 'healing_staff', name: 'Healing Staff', type: 'staff', typeEmoji: '🪄', element: 'light', elementEmoji: '✨', tier: 'rare', atk: 65, def: 45, crit: 18, price: 7300 },

  // --- EPIC [E] ---
  { id: 'vanguards_banner', name: "Vanguard's Banner", type: 'shield', typeEmoji: '🛡️', element: 'toxic', elementEmoji: '🧪', tier: 'epic', atk: 120, def: 160, crit: 22, price: 22000 },
  { id: 'bleeding_gaze', name: 'Bleeding Gaze', type: 'relic', typeEmoji: '🔮', element: 'blood', elementEmoji: '🩸', tier: 'epic', atk: 145, def: 95, crit: 30, price: 24000 },
  { id: 'flame_staff', name: 'Flame Staff', type: 'staff', typeEmoji: '🔥', element: 'vampire', elementEmoji: '🧛', tier: 'epic', atk: 138, def: 88, crit: 28, price: 23000 },
  { id: 'shadow_scythe', name: 'Shadow Scythe', type: 'scythe', typeEmoji: '🌙', element: 'blood', elementEmoji: '🩸', tier: 'epic', atk: 150, def: 80, crit: 32, price: 25000 },
  { id: 'storm_hammer', name: 'Storm Hammer', type: 'hammer', typeEmoji: '⚡', element: 'lightning', elementEmoji: '⚡', tier: 'epic', atk: 155, def: 105, crit: 24, price: 26000 },
  { id: 'vampiric_staff', name: 'Vampiric Staff', type: 'staff', typeEmoji: '🪄', element: 'blood', elementEmoji: '🩸', tier: 'epic', atk: 142, def: 85, crit: 26, price: 24500 },
  { id: 'wand_absorption', name: 'Wand of Absorption', type: 'wand', typeEmoji: '🪄', element: 'radiation', elementEmoji: '☢️', tier: 'epic', atk: 135, def: 110, crit: 25, price: 23500 },
  { id: 'glacial_axe', name: 'Glacial Axe', type: 'axe', typeEmoji: '🪓', element: 'ice', elementEmoji: '❄️', tier: 'epic', atk: 152, def: 92, crit: 26, price: 25500 },

  // --- LEGENDARY [L] ---
  { id: 'resurrection_staff', name: 'Resurrection Staff', type: 'staff', typeEmoji: '🪄', element: 'radiation', elementEmoji: '☢️', tier: 'legendary', atk: 220, def: 140, crit: 34, price: 90000 },
  { id: 'defenders_aegis', name: "Defender's Aegis", type: 'shield', typeEmoji: '🛡️', element: 'biohazard', elementEmoji: '☣️', tier: 'legendary', atk: 130, def: 270, crit: 18, price: 95000 },
  { id: 'legendary_bow', name: 'Bow', type: 'bow', typeEmoji: '🏹', element: 'portal', elementEmoji: '🌀', tier: 'legendary', atk: 245, def: 90, crit: 44, price: 92000 },
  { id: 'arcane_scepter', name: 'Arcane Scepter', type: 'scepter', typeEmoji: '🦯', element: 'toxic', elementEmoji: '🧪', tier: 'legendary', atk: 235, def: 110, crit: 36, price: 94000 },
  { id: 'great_sword', name: 'Great Sword', type: 'sword', typeEmoji: '⚔️', element: 'fist', elementEmoji: '👊', tier: 'legendary', atk: 270, def: 95, crit: 38, price: 96000 },
  { id: 'vanguards_banner_0', name: "Vanguard's Banner [0]", type: 'shield', typeEmoji: '🛡️', element: 'ice', elementEmoji: '❄️', tier: 'legendary', atk: 150, def: 250, crit: 25, price: 98000 },
  { id: 'poison_dagger', name: 'Poison Dagger', type: 'dagger', typeEmoji: '🗡️', element: 'poison', elementEmoji: '🧪', tier: 'legendary', atk: 250, def: 85, crit: 48, price: 97000 },
  { id: 'wounding_crossbow', name: 'Wounding Crossbow', type: 'crossbow', typeEmoji: '🎯', element: 'blood', elementEmoji: '🩸', tier: 'legendary', atk: 265, def: 80, crit: 45, price: 99000 },
  { id: 'orb_potency', name: 'Orb of Potency', type: 'relic', typeEmoji: '🔮', element: 'radiation', elementEmoji: '☢️', tier: 'legendary', atk: 240, def: 120, crit: 40, price: 96000 },
  { id: 'rune_forgotten', name: 'Rune of the Forgotten', type: 'relic', typeEmoji: '💠', element: 'portal', elementEmoji: '🌀', tier: 'legendary', atk: 255, def: 115, crit: 42, price: 97500 },

  // --- MYTHIC [M] ---
  { id: 'abyssal_trident', name: 'Abyssal Trident', type: 'trident', typeEmoji: '🔱', element: 'water', elementEmoji: '💧', tier: 'mythic', atk: 350, def: 160, crit: 42, price: 250000 },
  { id: 'void_reaper', name: 'Void Reaper', type: 'scythe', typeEmoji: '🌌', element: 'portal', elementEmoji: '🌀', tier: 'mythic', atk: 380, def: 140, crit: 50, price: 280000 },
  { id: 'godslayer_blade', name: 'Godslayer Blade', type: 'sword', typeEmoji: '👑', element: 'radiation', elementEmoji: '☢️', tier: 'mythic', atk: 420, def: 180, crit: 48, price: 320000 },
  { id: 'aegis_immortal', name: 'Aegis of Immortality', type: 'shield', typeEmoji: '🛡️', element: 'light', elementEmoji: '✨', tier: 'mythic', atk: 210, def: 420, crit: 25, price: 310000 },
  { id: 'genesis_scepter', name: 'Genesis Scepter', type: 'staff', typeEmoji: '🪄', element: 'portal', elementEmoji: '🌀', tier: 'mythic', atk: 395, def: 175, crit: 46, price: 330000 }
];

// Helper to generate authentic 6-char alphanumeric weapon ID (like FV9XWP)
function generateWeaponCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate realistic quality percentage e.g. 42.0%, 75.0%, 47.3%
function generateWeaponQuality(tier = 'common') {
  let min = 15;
  let max = 65;
  if (tier === 'uncommon') { min = 20; max = 72; }
  else if (tier === 'rare') { min = 30; max = 80; }
  else if (tier === 'epic') { min = 45; max = 88; }
  else if (tier === 'legendary') { min = 40; max = 92; }
  else if (tier === 'mythic') { min = 60; max = 99; }

  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(1));
}

// Visual rarity brackets matching OwO: [L], [E], [R], [U], [C]
function getRarityBracket(tier = 'common') {
  switch (tier.toLowerCase()) {
    case 'legendary':
      return '`[L]`';
    case 'epic':
      return '`[E]`';
    case 'rare':
      return '`[R]`';
    case 'uncommon':
      return '`[U]`';
    case 'mythic':
      return '`[M]`';
    case 'fabled':
      return '`[F]`';
    case 'common':
    default:
      return '`[C]`';
  }
}

function getItemById(id) {
  if (!id) return null;
  const clean = id.toLowerCase().trim();
  return SHOP_ITEMS.find(i => i.id === clean || i.name.toLowerCase() === clean);
}

function getWeaponById(id) {
  if (!id) return null;
  const clean = id.toLowerCase().trim();
  return WEAPONS.find(w => w.id === clean || w.name.toLowerCase() === clean);
}

// Pick a random weapon weighted by tier
function getRandomWeapon() {
  const rand = Math.random() * 100;
  let chosenTier = 'common';
  if (rand < 1.0) chosenTier = 'mythic';
  else if (rand < 6.0) chosenTier = 'legendary';
  else if (rand < 18.0) chosenTier = 'epic';
  else if (rand < 40.0) chosenTier = 'rare';
  else if (rand < 70.0) chosenTier = 'uncommon';
  else chosenTier = 'common';

  const pool = WEAPONS.filter(w => w.tier === chosenTier);
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
}

module.exports = {
  SHOP_ITEMS,
  WEAPONS,
  getItemById,
  getWeaponById,
  getRandomWeapon,
  generateWeaponCode,
  generateWeaponQuality,
  getRarityBracket
};
