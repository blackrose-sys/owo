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
    description: 'Guaranteed to grant a battle weapon from Rare to Legendary rank.'
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

const WEAPONS = [
  // Common
  { id: 'rusty_dagger', name: 'Rusty Dagger', emoji: '🗡️', tier: 'common', atk: 15, def: 2, crit: 5, price: 500 },
  { id: 'wooden_staff', name: 'Wooden Staff', emoji: '🦯', tier: 'common', atk: 12, def: 5, crit: 3, price: 500 },
  { id: 'hunting_slingshot', name: 'Hunting Slingshot', emoji: '🪃', tier: 'common', atk: 14, def: 3, crit: 8, price: 600 },

  // Uncommon
  { id: 'iron_broadsword', name: 'Iron Broadsword', emoji: '⚔️', tier: 'uncommon', atk: 30, def: 10, crit: 8, price: 2000 },
  { id: 'oak_longbow', name: 'Oak Longbow', emoji: '🏹', tier: 'uncommon', atk: 32, def: 6, crit: 14, price: 2200 },
  { id: 'apprentice_wand', name: 'Apprentice Wand', emoji: '🪄', tier: 'uncommon', atk: 28, def: 12, crit: 10, price: 2100 },

  // Rare
  { id: 'silver_rapier', name: 'Silver Rapier', emoji: '🤺', tier: 'rare', atk: 55, def: 18, crit: 20, price: 6500 },
  { id: 'crystal_blade', name: 'Crystal Blade', emoji: '💎', tier: 'rare', atk: 62, def: 15, crit: 18, price: 7000 },
  { id: 'battle_axe', name: 'Viking Battleaxe', emoji: '🪓', tier: 'rare', atk: 70, def: 12, crit: 12, price: 6800 },

  // Epic
  { id: 'shadow_scythe', name: 'Shadow Scythe', emoji: '🌙', tier: 'epic', atk: 110, def: 25, crit: 25, price: 18000 },
  { id: 'flame_katana', name: 'Flame Katana', emoji: '🔥', tier: 'epic', atk: 118, def: 20, crit: 28, price: 20000 },
  { id: 'storm_hammer', name: 'Storm Hammer', emoji: '⚡', tier: 'epic', atk: 125, def: 35, crit: 15, price: 22000 },

  // Mythic
  { id: 'abyssal_trident', name: 'Abyssal Trident', emoji: '🔱', tier: 'mythic', atk: 210, def: 60, crit: 30, price: 50000 },
  { id: 'celestial_staff', name: 'Celestial Staff', emoji: '✨', tier: 'mythic', atk: 225, def: 65, crit: 32, price: 55000 },

  // Legendary
  { id: 'godslayer_blade', name: 'Godslayer Blade', emoji: '👑', tier: 'legendary', atk: 380, def: 110, crit: 40, price: 150000 },
  { id: 'void_reaper', name: 'Void Reaper', emoji: '🌌', tier: 'legendary', atk: 420, def: 95, crit: 45, price: 180000 },
];

function getItemById(id) {
  const clean = id.toLowerCase().trim();
  return SHOP_ITEMS.find(i => i.id === clean || i.name.toLowerCase() === clean);
}

function getWeaponById(id) {
  const clean = id.toLowerCase().trim();
  return WEAPONS.find(w => w.id === clean || w.name.toLowerCase() === clean);
}

module.exports = {
  SHOP_ITEMS,
  WEAPONS,
  getItemById,
  getWeaponById
};
