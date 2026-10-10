/**
 * Dedicated Animal Combat Archetypes and Weapon Build Synergies for OwO Bot
 */

const BUILD_ARCHETYPES = {
  tank: {
    id: 'tank',
    name: 'Iron Fortress',
    role: 'Tank / Guardian',
    emoji: '🛡️',
    favoredTypes: ['shield', 'armor'],
    typeEmojis: ['🛡️', '🔰'],
    bonusText: '+30% HP & DEF, Taunt Protection',
    description: 'Impenetrable vanguard. Draws enemy aggression and shields allies from fatal damage.',
    buffs: {
      hpMultiplier: 1.30,
      defMultiplier: 1.35,
      atkMultiplier: 1.0,
      critBonus: 0,
      magMultiplier: 1.0,
      special: 'Taunt & 30% Damage Mitigation'
    }
  },
  assassin: {
    id: 'assassin',
    name: 'Shadow Striker',
    role: 'Assassin / Infiltrator',
    emoji: '🗡️',
    favoredTypes: ['dagger', 'claw', 'scythe'],
    typeEmojis: ['🗡️', '🐾', '🌙'],
    bonusText: '+35% Crit Rate, +25% SPD & Bleed',
    description: 'Strikes from the blind spot with unmatched speed and lethal precision.',
    buffs: {
      hpMultiplier: 1.0,
      defMultiplier: 1.0,
      atkMultiplier: 1.25,
      critBonus: 35,
      spdMultiplier: 1.25,
      magMultiplier: 1.0,
      special: 'Bleed Effect (Ignores 25% Armor)'
    }
  },
  sniper: {
    id: 'sniper',
    name: 'Hawkeye Ranger',
    role: 'Sniper / Marksman',
    emoji: '🏹',
    favoredTypes: ['bow', 'crossbow', 'slingshot'],
    typeEmojis: ['🏹', '🎯', '🪃'],
    bonusText: '+40% Crit DMG & 50% Armor Pierce',
    description: 'Precision long-range devastation. Punches cleanly through reinforced defenses.',
    buffs: {
      hpMultiplier: 1.0,
      defMultiplier: 1.0,
      atkMultiplier: 1.30,
      critBonus: 20,
      critDmgMultiplier: 1.40,
      magMultiplier: 1.0,
      special: 'Armor Pierce (Bypasses 50% Opponent DEF)'
    }
  },
  mage: {
    id: 'mage',
    name: 'Arcane Mystic',
    role: 'Mage / Spellcaster',
    emoji: '🪄',
    favoredTypes: ['staff', 'wand', 'scepter', 'relic', 'orb'],
    typeEmojis: ['🪄', '🦯', '🔮', '🔱'],
    bonusText: '+50% Magic DMG & +30 Mana Regen',
    description: 'Channels primordial elements and cosmic energy to obliterate opposing forces.',
    buffs: {
      hpMultiplier: 1.05,
      defMultiplier: 1.10,
      atkMultiplier: 1.15,
      critBonus: 10,
      magMultiplier: 1.50,
      manaRegen: 30,
      special: 'Arcane Surge (+50% Spell Damage)'
    }
  },
  brawler: {
    id: 'brawler',
    name: 'Berserker Cleaver',
    role: 'Brawler / Heavy Striker',
    emoji: '⚔️',
    favoredTypes: ['sword', 'axe', 'hammer', 'trident', 'flame', 'broadsword'],
    typeEmojis: ['⚔️', '🪓', '⚡', '🔥'],
    bonusText: '+35% Physical ATK & Cleave Splash',
    description: 'Raw unstoppable brute force. Slices through multiple opponents with devastating swings.',
    buffs: {
      hpMultiplier: 1.15,
      defMultiplier: 1.15,
      atkMultiplier: 1.35,
      critBonus: 15,
      magMultiplier: 1.0,
      special: 'Cleave Strike (Deals splash damage)'
    }
  }
};

// Explicit mapping for all OwO species
const SPECIES_ARCHETYPE_MAP = {
  // Tanks
  bear: 'tank',
  elephant: 'tank',
  hippo: 'tank',
  rhino: 'tank',
  boar: 'tank',
  panda: 'tank',
  cow: 'tank',
  turtle: 'tank',
  whale: 'tank',
  brachio: 'tank',
  primordial: 'tank',
  koala: 'tank',
  pig: 'tank',
  snail: 'tank',
  sloth: 'tank',

  // Assassins
  wolf: 'assassin',
  leopard: 'assassin',
  tiger: 'assassin',
  fox: 'assassin',
  cheetah: 'assassin',
  snake: 'assassin',
  bat: 'assassin',
  raccoon: 'assassin',
  shadowstalker: 'assassin',
  skunk: 'assassin',
  badger: 'assassin',
  hedgehog: 'assassin',
  otter: 'assassin',
  ruby_fox: 'assassin',
  sapphire_wolf: 'assassin',

  // Snipers / Rangers
  eagle: 'sniper',
  owl: 'sniper',
  falcon: 'sniper',
  hawk: 'sniper',
  rabbit: 'sniper',
  duck: 'sniper',
  penguin: 'sniper',
  bird: 'sniper',
  giraffe: 'sniper',
  deer: 'sniper',
  kangaroo: 'sniper',
  emerald_owl: 'sniper',
  llama: 'sniper',

  // Mages / Mystics
  unicorn: 'mage',
  dragon: 'mage',
  squid: 'mage',
  octopus: 'mage',
  phoenix: 'mage',
  kitsune: 'mage',
  pegasus: 'mage',
  celestial_dragon: 'mage',
  jellyfish: 'mage',
  butterfly: 'mage',
  frog: 'mage',
  bee: 'mage',
  bug: 'mage',
  swan: 'mage',
  flamingo: 'mage',
  peacock: 'mage',

  // Brawlers
  lion: 'brawler',
  gorilla: 'brawler',
  crocodile: 'brawler',
  crab: 'brawler',
  lobster: 'brawler',
  shrimp: 'brawler',
  pufferfish: 'brawler',
  dolphin: 'brawler',
  shark: 'brawler',
  trex: 'brawler',
  thunderbeast: 'brawler',
  chimera: 'brawler',
  leviathan: 'brawler',
  genesis_wyrm: 'brawler',
  dog: 'brawler',
  horse: 'brawler',
  monkey: 'brawler',
  chicken: 'brawler',
  camel: 'brawler',
  zebra: 'brawler'
};

/**
 * Get the dedicated build archetype for a given animal ID or animal object
 */
function getAnimalBuild(animalOrId) {
  const id = typeof animalOrId === 'string' ? animalOrId.toLowerCase() : (animalOrId?.id || '').toLowerCase();
  const archetypeKey = SPECIES_ARCHETYPE_MAP[id];
  if (archetypeKey && BUILD_ARCHETYPES[archetypeKey]) {
    return BUILD_ARCHETYPES[archetypeKey];
  }

  // Fallback heuristic based on stats
  if (animalOrId && typeof animalOrId === 'object') {
    if ((animalOrId.def || 0) >= 15 || (animalOrId.hp || 0) >= 80) return BUILD_ARCHETYPES.tank;
    if ((animalOrId.spd || 0) >= 16) return BUILD_ARCHETYPES.assassin;
    if ((animalOrId.atk || 0) >= 18) return BUILD_ARCHETYPES.brawler;
    if (['rare', 'epic', 'mythic', 'legendary'].includes(animalOrId.tier)) return BUILD_ARCHETYPES.mage;
  }

  return BUILD_ARCHETYPES.brawler;
}

/**
 * Check if a weapon matches an animal's dedicated build archetype
 * and compute all synergy bonuses
 */
function checkBuildSynergy(animal, weapon) {
  if (!animal || !weapon) {
    return {
      hasSynergy: false,
      archetype: BUILD_ARCHETYPES.brawler,
      bonusAtk: 0,
      bonusDef: 0,
      bonusHp: 0,
      bonusCrit: 0,
      label: 'Standard Loadout',
      effectText: 'Equip matching weapon type for Build Synergy bonus!'
    };
  }

  const build = getAnimalBuild(animal);
  const weaponType = (weapon.type || '').toLowerCase();
  const isDedicated = build.favoredTypes.includes(weaponType);

  if (!isDedicated) {
    return {
      hasSynergy: false,
      archetype: build,
      bonusAtk: 0,
      bonusDef: 0,
      bonusHp: 0,
      bonusCrit: 0,
      label: `${build.emoji} ${build.name} (Non-synergy)`,
      effectText: `Recommended: ${build.favoredTypes.join(' / ').toUpperCase()} for synergy!`
    };
  }

  // Compute synergy bonus based on weapon's base stats and quality
  const qualityMult = (weapon.quality || 50) / 100;
  const baseAtk = weapon.atk || 30;
  const baseDef = weapon.def || 20;

  const bonusAtk = Math.round(baseAtk * (build.buffs.atkMultiplier - 1.0) * qualityMult + 15);
  const bonusDef = Math.round(baseDef * (build.buffs.defMultiplier - 1.0) * qualityMult + 15);
  const bonusHp = Math.round(150 * (build.buffs.hpMultiplier - 1.0) * qualityMult + 50);
  const bonusCrit = build.buffs.critBonus || 15;

  return {
    hasSynergy: true,
    archetype: build,
    bonusAtk,
    bonusDef,
    bonusHp,
    bonusCrit,
    label: `⭐ ${build.name} Synergy Active!`,
    effectText: `${build.emoji} ${build.bonusText}`
  };
}

module.exports = {
  BUILD_ARCHETYPES,
  SPECIES_ARCHETYPE_MAP,
  getAnimalBuild,
  checkBuildSynergy
};
