// Database of animals across all OwO tiers — accurate to the official OwO Bot wiki
// Plus unique character collectibles (anime, pop culture, etc.)
const ANIMALS = [
  // ═══════════════════════════════════════════════════════════════
  // COMMON (Tier 1) - Drop rate: ~50%
  // Based on the real OwO: Bee, Bug, Snail, Beetle, Butterfly
  // ═══════════════════════════════════════════════════════════════
  { id: 'bee', name: 'Bee', emoji: '🐝', tier: 'common', points: 5, hp: 28, atk: 15, def: 4, spd: 18 },
  { id: 'bug', name: 'Bug', emoji: '🐛', tier: 'common', points: 5, hp: 25, atk: 8, def: 5, spd: 4 },
  { id: 'snail', name: 'Snail', emoji: '🐌', tier: 'common', points: 5, hp: 35, atk: 6, def: 18, spd: 2 },
  { id: 'beetle', name: 'Beetle', emoji: '🪲', tier: 'common', points: 5, hp: 30, atk: 10, def: 12, spd: 6 },
  { id: 'butterfly', name: 'Butterfly', emoji: '🦋', tier: 'common', points: 5, hp: 30, atk: 10, def: 5, spd: 15 },
  { id: 'ant', name: 'Ant', emoji: '🐜', tier: 'common', points: 5, hp: 22, atk: 8, def: 6, spd: 10 },
  { id: 'worm', name: 'Worm', emoji: '🪱', tier: 'common', points: 5, hp: 20, atk: 5, def: 3, spd: 3 },
  { id: 'cricket', name: 'Cricket', emoji: '🦗', tier: 'common', points: 5, hp: 26, atk: 9, def: 5, spd: 14 },
  { id: 'mosquito', name: 'Mosquito', emoji: '🦟', tier: 'common', points: 5, hp: 18, atk: 12, def: 2, spd: 20 },
  { id: 'fly', name: 'Fly', emoji: '🪰', tier: 'common', points: 5, hp: 16, atk: 6, def: 2, spd: 22 },
  { id: 'cockroach', name: 'Cockroach', emoji: '🪳', tier: 'common', points: 5, hp: 32, atk: 7, def: 14, spd: 12 },
  { id: 'caterpillar', name: 'Caterpillar', emoji: '🐛', tier: 'common', points: 5, hp: 24, atk: 6, def: 8, spd: 3 },
  { id: 'ladybug', name: 'Ladybug', emoji: '🐞', tier: 'common', points: 5, hp: 27, atk: 11, def: 7, spd: 13 },
  { id: 'spider', name: 'Spider', emoji: '🕷️', tier: 'common', points: 5, hp: 29, atk: 14, def: 6, spd: 16 },
  { id: 'scorpion', name: 'Scorpion', emoji: '🦂', tier: 'common', points: 5, hp: 33, atk: 16, def: 10, spd: 8 },

  // ═══════════════════════════════════════════════════════════════
  // UNCOMMON (Tier 2) - Drop rate: ~30%
  // Based on the real OwO: Chick, Mouse, Chicken, Rabbit, Chipmunk
  // ═══════════════════════════════════════════════════════════════
  { id: 'chick', name: 'Chick', emoji: '🐤', tier: 'uncommon', points: 15, hp: 35, atk: 14, def: 8, spd: 12 },
  { id: 'mouse', name: 'Mouse', emoji: '🐭', tier: 'uncommon', points: 15, hp: 35, atk: 10, def: 5, spd: 16 },
  { id: 'chicken', name: 'Chicken', emoji: '🐔', tier: 'uncommon', points: 15, hp: 38, atk: 12, def: 6, spd: 11 },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', tier: 'uncommon', points: 15, hp: 42, atk: 13, def: 7, spd: 15 },
  { id: 'chipmunk', name: 'Chipmunk', emoji: '🐿️', tier: 'uncommon', points: 15, hp: 34, atk: 11, def: 6, spd: 18 },
  { id: 'hamster', name: 'Hamster', emoji: '🐹', tier: 'uncommon', points: 15, hp: 40, atk: 11, def: 6, spd: 12 },
  { id: 'duck', name: 'Duck', emoji: '🦆', tier: 'uncommon', points: 15, hp: 36, atk: 11, def: 6, spd: 12 },
  { id: 'bird', name: 'Bird', emoji: '🐦', tier: 'uncommon', points: 15, hp: 32, atk: 13, def: 5, spd: 16 },
  { id: 'parrot', name: 'Parrot', emoji: '🦜', tier: 'uncommon', points: 15, hp: 38, atk: 14, def: 7, spd: 14 },
  { id: 'turtle', name: 'Turtle', emoji: '🐢', tier: 'uncommon', points: 15, hp: 50, atk: 8, def: 22, spd: 4 },
  { id: 'rooster', name: 'Rooster', emoji: '🐓', tier: 'uncommon', points: 15, hp: 36, atk: 15, def: 7, spd: 13 },
  { id: 'penguin', name: 'Penguin', emoji: '🐧', tier: 'uncommon', points: 15, hp: 45, atk: 13, def: 9, spd: 9 },
  { id: 'bat', name: 'Bat', emoji: '🦇', tier: 'uncommon', points: 15, hp: 34, atk: 14, def: 5, spd: 17 },
  { id: 'swan', name: 'Swan', emoji: '🦢', tier: 'uncommon', points: 15, hp: 42, atk: 12, def: 8, spd: 11 },
  { id: 'dove', name: 'Dove', emoji: '🕊️', tier: 'uncommon', points: 15, hp: 30, atk: 10, def: 6, spd: 18 },

  // ═══════════════════════════════════════════════════════════════
  // RARE (Tier 3) - Drop rate: ~10%
  // Based on the real OwO: Sheep, Pig, Cow, Dog, Cat
  // ═══════════════════════════════════════════════════════════════
  { id: 'sheep', name: 'Sheep', emoji: '🐑', tier: 'rare', points: 50, hp: 55, atk: 16, def: 15, spd: 10 },
  { id: 'pig', name: 'Pig', emoji: '🐷', tier: 'rare', points: 50, hp: 55, atk: 18, def: 14, spd: 8 },
  { id: 'cow', name: 'Cow', emoji: '🐮', tier: 'rare', points: 50, hp: 60, atk: 15, def: 18, spd: 6 },
  { id: 'dog', name: 'Dog', emoji: '🐶', tier: 'rare', points: 50, hp: 50, atk: 20, def: 12, spd: 14 },
  { id: 'cat', name: 'Cat', emoji: '🐱', tier: 'rare', points: 50, hp: 45, atk: 22, def: 10, spd: 18 },
  { id: 'horse', name: 'Horse', emoji: '🐴', tier: 'rare', points: 50, hp: 62, atk: 18, def: 14, spd: 15 },
  { id: 'goat', name: 'Goat', emoji: '🐐', tier: 'rare', points: 50, hp: 52, atk: 17, def: 16, spd: 12 },
  { id: 'ram', name: 'Ram', emoji: '🐏', tier: 'rare', points: 50, hp: 58, atk: 21, def: 18, spd: 10 },
  { id: 'donkey', name: 'Donkey', emoji: '🫏', tier: 'rare', points: 50, hp: 60, atk: 16, def: 17, spd: 9 },
  { id: 'llama', name: 'Llama', emoji: '🦙', tier: 'rare', points: 50, hp: 56, atk: 15, def: 16, spd: 11 },
  { id: 'deer', name: 'Deer', emoji: '🦌', tier: 'rare', points: 50, hp: 48, atk: 19, def: 12, spd: 16 },
  { id: 'hedgehog', name: 'Hedgehog', emoji: '🦔', tier: 'rare', points: 50, hp: 42, atk: 14, def: 22, spd: 8 },
  { id: 'otter', name: 'Otter', emoji: '🦦', tier: 'rare', points: 50, hp: 46, atk: 18, def: 13, spd: 15 },

  // ═══════════════════════════════════════════════════════════════
  // EPIC (Tier 4) - Drop rate: ~5%
  // Based on the real OwO: Crocodile, Tiger, Penguin, Elephant, Whale
  // ═══════════════════════════════════════════════════════════════
  { id: 'crocodile', name: 'Crocodile', emoji: '🐊', tier: 'epic', points: 250, hp: 120, atk: 38, def: 30, spd: 12 },
  { id: 'tiger', name: 'Tiger', emoji: '🐯', tier: 'epic', points: 250, hp: 110, atk: 42, def: 25, spd: 18 },
  { id: 'elephant', name: 'Elephant', emoji: '🐘', tier: 'epic', points: 250, hp: 150, atk: 32, def: 38, spd: 8 },
  { id: 'whale', name: 'Whale', emoji: '🐳', tier: 'epic', points: 250, hp: 160, atk: 35, def: 36, spd: 10 },
  { id: 'bear', name: 'Bear', emoji: '🐻', tier: 'epic', points: 250, hp: 130, atk: 36, def: 32, spd: 10 },
  { id: 'panda', name: 'Panda', emoji: '🐼', tier: 'epic', points: 250, hp: 125, atk: 30, def: 30, spd: 12 },
  { id: 'rhino', name: 'Rhino', emoji: '🦏', tier: 'epic', points: 250, hp: 140, atk: 40, def: 35, spd: 8 },
  { id: 'hippo', name: 'Hippo', emoji: '🦛', tier: 'epic', points: 250, hp: 145, atk: 38, def: 34, spd: 7 },
  { id: 'shark', name: 'Shark', emoji: '🦈', tier: 'epic', points: 250, hp: 115, atk: 45, def: 26, spd: 20 },
  { id: 'dolphin', name: 'Dolphin', emoji: '🐬', tier: 'epic', points: 250, hp: 105, atk: 34, def: 24, spd: 22 },
  { id: 'gorilla', name: 'Gorilla', emoji: '🦍', tier: 'epic', points: 250, hp: 135, atk: 42, def: 30, spd: 9 },
  { id: 'polar_bear', name: 'Polar Bear', emoji: '🐻‍❄️', tier: 'epic', points: 250, hp: 135, atk: 37, def: 33, spd: 11 },

  // ═══════════════════════════════════════════════════════════════
  // LEGENDARY (Tier 5) - Drop rate: ~3%
  // Based on the real OwO: Deer, Fox, Lion, Owl, Squid
  // ═══════════════════════════════════════════════════════════════
  { id: 'fox', name: 'Fox', emoji: '🦊', tier: 'legendary', points: 800, hp: 95, atk: 52, def: 28, spd: 28 },
  { id: 'lion', name: 'Lion', emoji: '🦁', tier: 'legendary', points: 800, hp: 130, atk: 55, def: 35, spd: 22 },
  { id: 'owl', name: 'Owl', emoji: '🦉', tier: 'legendary', points: 800, hp: 100, atk: 48, def: 30, spd: 26 },
  { id: 'squid', name: 'Squid', emoji: '🦑', tier: 'legendary', points: 800, hp: 110, atk: 50, def: 32, spd: 24 },
  { id: 'wolf', name: 'Wolf', emoji: '🐺', tier: 'legendary', points: 800, hp: 115, atk: 54, def: 30, spd: 25 },
  { id: 'eagle', name: 'Eagle', emoji: '🦅', tier: 'legendary', points: 800, hp: 100, atk: 52, def: 26, spd: 30 },
  { id: 'leopard', name: 'Leopard', emoji: '🐆', tier: 'legendary', points: 800, hp: 105, atk: 56, def: 28, spd: 28 },
  { id: 'flamingo', name: 'Flamingo', emoji: '🦩', tier: 'legendary', points: 800, hp: 95, atk: 46, def: 24, spd: 26 },
  { id: 'peacock', name: 'Peacock', emoji: '🦚', tier: 'legendary', points: 800, hp: 100, atk: 48, def: 28, spd: 25 },
  { id: 'octopus', name: 'Octopus', emoji: '🐙', tier: 'legendary', points: 800, hp: 108, atk: 50, def: 30, spd: 22 },

  // ═══════════════════════════════════════════════════════════════
  // MYTHICAL (Tier 6) - Drop rate: ~1.2%
  // Based on the real OwO: Dragon, Unicorn, Snowman, Ghost, Dove
  // ═══════════════════════════════════════════════════════════════
  { id: 'dragon', name: 'Dragon', emoji: '🐉', tier: 'mythical', points: 3000, hp: 220, atk: 85, def: 55, spd: 40 },
  { id: 'unicorn', name: 'Unicorn', emoji: '🦄', tier: 'mythical', points: 3000, hp: 200, atk: 78, def: 50, spd: 45 },
  { id: 'snowman', name: 'Snowman', emoji: '⛄', tier: 'mythical', points: 3000, hp: 210, atk: 72, def: 60, spd: 35 },
  { id: 'ghost', name: 'Ghost', emoji: '👻', tier: 'mythical', points: 3000, hp: 180, atk: 80, def: 40, spd: 55 },
  { id: 'phoenix', name: 'Phoenix', emoji: '🔥', tier: 'mythical', points: 3000, hp: 205, atk: 88, def: 48, spd: 42 },
  { id: 'trex', name: 'T-Rex', emoji: '🦖', tier: 'mythical', points: 3000, hp: 250, atk: 92, def: 58, spd: 30 },
  { id: 'brachio', name: 'Brachiosaurus', emoji: '🦕', tier: 'mythical', points: 3000, hp: 280, atk: 68, def: 72, spd: 22 },
  { id: 'alien', name: 'Alien', emoji: '👽', tier: 'mythical', points: 3000, hp: 190, atk: 82, def: 45, spd: 50 },
  { id: 'robot', name: 'Robot', emoji: '🤖', tier: 'mythical', points: 3000, hp: 230, atk: 76, def: 65, spd: 38 },

  // ═══════════════════════════════════════════════════════════════
  // FABLED (Tier 7) - Drop rate: ~0.5%
  // Based on the real OwO: Boar, Eagle, Frog, Gorilla, Wolf
  // ═══════════════════════════════════════════════════════════════
  { id: 'fabled_boar', name: 'Fabled Boar', emoji: '🐗', tier: 'fabled', points: 8000, hp: 320, atk: 110, def: 80, spd: 45 },
  { id: 'fabled_frog', name: 'Fabled Frog', emoji: '🐸', tier: 'fabled', points: 8000, hp: 290, atk: 100, def: 70, spd: 55 },
  { id: 'kitsune', name: 'Frost Kitsune', emoji: '❄️', tier: 'fabled', points: 8000, hp: 300, atk: 115, def: 75, spd: 52 },
  { id: 'thunderbeast', name: 'Thunder Beast', emoji: '⚡', tier: 'fabled', points: 8000, hp: 310, atk: 120, def: 78, spd: 48 },
  { id: 'shadowstalker', name: 'Shadow Stalker', emoji: '🌑', tier: 'fabled', points: 8000, hp: 305, atk: 118, def: 72, spd: 54 },
  { id: 'pegasus', name: 'Astral Pegasus', emoji: '🌟', tier: 'fabled', points: 8000, hp: 295, atk: 108, def: 82, spd: 50 },

  // ═══════════════════════════════════════════════════════════════
  // HIDDEN (Tier 8) - Drop rate: ~0.3%
  // Based on the real OwO: Koala, Lizard, Monkey, Snake, Octopus
  // ═══════════════════════════════════════════════════════════════
  { id: 'hidden_koala', name: 'Hidden Koala', emoji: '🐨', tier: 'hidden', points: 12000, hp: 350, atk: 125, def: 95, spd: 42 },
  { id: 'hidden_lizard', name: 'Hidden Lizard', emoji: '🦎', tier: 'hidden', points: 12000, hp: 340, atk: 130, def: 88, spd: 48 },
  { id: 'hidden_monkey', name: 'Hidden Monkey', emoji: '🐵', tier: 'hidden', points: 12000, hp: 330, atk: 128, def: 85, spd: 52 },
  { id: 'hidden_snake', name: 'Hidden Snake', emoji: '🐍', tier: 'hidden', points: 12000, hp: 320, atk: 140, def: 80, spd: 55 },
  { id: 'hidden_octopus', name: 'Hidden Octopus', emoji: '🐙', tier: 'hidden', points: 12000, hp: 360, atk: 132, def: 92, spd: 44 },

  // ═══════════════════════════════════════════════════════════════
  // GEM (Tier 9) - Drop rate: ~0.1%
  // Based on the real OwO: Camel, Fish, Panda, Shrimp, Spider
  // ═══════════════════════════════════════════════════════════════
  { id: 'gem_camel', name: 'Gem Camel', emoji: '🐪', tier: 'gem', points: 20000, hp: 400, atk: 150, def: 110, spd: 50 },
  { id: 'gem_fish', name: 'Gem Fish', emoji: '🐠', tier: 'gem', points: 20000, hp: 380, atk: 155, def: 105, spd: 55 },
  { id: 'gem_panda', name: 'Gem Panda', emoji: '🐼', tier: 'gem', points: 20000, hp: 420, atk: 148, def: 115, spd: 48 },
  { id: 'gem_shrimp', name: 'Gem Shrimp', emoji: '🦐', tier: 'gem', points: 20000, hp: 370, atk: 160, def: 100, spd: 60 },
  { id: 'gem_spider', name: 'Gem Spider', emoji: '🕷️', tier: 'gem', points: 20000, hp: 360, atk: 165, def: 95, spd: 62 },
  { id: 'ruby_fox', name: 'Ruby Fox', emoji: '💎', tier: 'gem', points: 22000, hp: 410, atk: 170, def: 108, spd: 58 },
  { id: 'sapphire_wolf', name: 'Sapphire Wolf', emoji: '💠', tier: 'gem', points: 22000, hp: 430, atk: 168, def: 112, spd: 56 },
  { id: 'emerald_owl', name: 'Emerald Owl', emoji: '🔮', tier: 'gem', points: 25000, hp: 440, atk: 175, def: 118, spd: 54 },

  // ═══════════════════════════════════════════════════════════════
  // BOT TIER (Tier 10) - Obtained via auto-hunting (Huntbot)
  // Based on the real OwO: DinoBot, GiraffBot, SlothBot, HedgeBot, LobBot
  // ═══════════════════════════════════════════════════════════════
  { id: 'dinobot', name: 'DinoBot', emoji: '🦖', tier: 'bot', points: 15000, hp: 380, atk: 145, def: 105, spd: 42 },
  { id: 'giraffbot', name: 'GiraffBot', emoji: '🦒', tier: 'bot', points: 15000, hp: 400, atk: 140, def: 110, spd: 38 },
  { id: 'slothbot', name: 'SlothBot', emoji: '🦥', tier: 'bot', points: 15000, hp: 420, atk: 130, def: 120, spd: 20 },
  { id: 'hedgebot', name: 'HedgeBot', emoji: '🦔', tier: 'bot', points: 15000, hp: 360, atk: 135, def: 115, spd: 35 },
  { id: 'lobbot', name: 'LobBot', emoji: '🦞', tier: 'bot', points: 15000, hp: 390, atk: 148, def: 108, spd: 40 },

  // ═══════════════════════════════════════════════════════════════
  // DISTORTED / GLITCH (Tier 11) - Special rare drops ~0.05%
  // Based on the real OwO: Glitchparrot, Glitchotter, Glitchraccoon, Glitchflamingo, GlitchZebra
  // ═══════════════════════════════════════════════════════════════
  { id: 'glitch_parrot', name: 'Glitch Parrot', emoji: '🦜', tier: 'distorted', points: 30000, hp: 450, atk: 180, def: 120, spd: 65 },
  { id: 'glitch_otter', name: 'Glitch Otter', emoji: '🦦', tier: 'distorted', points: 30000, hp: 440, atk: 185, def: 115, spd: 68 },
  { id: 'glitch_raccoon', name: 'Glitch Raccoon', emoji: '🦝', tier: 'distorted', points: 30000, hp: 430, atk: 188, def: 118, spd: 62 },
  { id: 'glitch_flamingo', name: 'Glitch Flamingo', emoji: '🦩', tier: 'distorted', points: 30000, hp: 420, atk: 178, def: 112, spd: 72 },
  { id: 'glitch_zebra', name: 'Glitch Zebra', emoji: '🦓', tier: 'distorted', points: 30000, hp: 460, atk: 182, def: 125, spd: 60 },

  // ═══════════════════════════════════════════════════════════════
  // PATREON (Tier 12) - Special supporter exclusives
  // Based on the real OwO: Pbird, Pdolphin, Pogre, Pscorpion, Ptiger
  // ═══════════════════════════════════════════════════════════════
  { id: 'pbird', name: 'Patreon Bird', emoji: '🐦', tier: 'patreon', points: 18000, hp: 400, atk: 160, def: 110, spd: 55 },
  { id: 'pdolphin', name: 'Patreon Dolphin', emoji: '🐬', tier: 'patreon', points: 18000, hp: 390, atk: 155, def: 108, spd: 58 },
  { id: 'pogre', name: 'Patreon Ogre', emoji: '👹', tier: 'patreon', points: 18000, hp: 450, atk: 170, def: 125, spd: 35 },
  { id: 'pscorpion', name: 'Patreon Scorpion', emoji: '🦂', tier: 'patreon', points: 18000, hp: 380, atk: 175, def: 100, spd: 52 },
  { id: 'ptiger', name: 'Patreon Tiger', emoji: '🐯', tier: 'patreon', points: 18000, hp: 420, atk: 168, def: 115, spd: 48 },

  // ═══════════════════════════════════════════════════════════════
  // SPECIAL / EVENT (Tier 13) - Limited-time seasonal animals
  // ═══════════════════════════════════════════════════════════════
  { id: 'pumpkin_cat', name: 'Pumpkin Cat', emoji: '🎃', tier: 'special', points: 10000, hp: 280, atk: 110, def: 80, spd: 50 },
  { id: 'candy_bat', name: 'Candy Bat', emoji: '🍬', tier: 'special', points: 10000, hp: 270, atk: 115, def: 75, spd: 55 },
  { id: 'frost_reindeer', name: 'Frost Reindeer', emoji: '🎄', tier: 'special', points: 10000, hp: 290, atk: 108, def: 85, spd: 48 },
  { id: 'cupid_bunny', name: 'Cupid Bunny', emoji: '💘', tier: 'special', points: 10000, hp: 260, atk: 105, def: 78, spd: 52 },
  { id: 'lucky_clover', name: 'Lucky Clover Cat', emoji: '🍀', tier: 'special', points: 10000, hp: 275, atk: 112, def: 82, spd: 46 },
  { id: 'sakura_fox', name: 'Sakura Fox', emoji: '🌸', tier: 'special', points: 10000, hp: 285, atk: 118, def: 76, spd: 54 },
  { id: 'firework_eagle', name: 'Firework Eagle', emoji: '🎆', tier: 'special', points: 10000, hp: 295, atk: 120, def: 80, spd: 50 },
  { id: 'golden_dragon', name: 'Golden Dragon', emoji: '🏮', tier: 'special', points: 10000, hp: 310, atk: 125, def: 88, spd: 45 },
  { id: 'easter_chick', name: 'Easter Chick', emoji: '🥚', tier: 'special', points: 10000, hp: 265, atk: 102, def: 72, spd: 56 },
  { id: 'haunted_wolf', name: 'Haunted Wolf', emoji: '🌕', tier: 'special', points: 10000, hp: 300, atk: 122, def: 84, spd: 48 },

  // ═══════════════════════════════════════════════════════════════
  // ANIME & CHARACTER COLLECTIBLES — Unique to this bot!
  // ═══════════════════════════════════════════════════════════════

  // --- Naruto ---
  { id: 'naruto', name: 'Naruto Uzumaki', emoji: '🍥', tier: 'legendary', points: 1200, hp: 140, atk: 60, def: 35, spd: 35 },
  { id: 'sasuke', name: 'Sasuke Uchiha', emoji: '⚡', tier: 'legendary', points: 1200, hp: 135, atk: 65, def: 32, spd: 38 },
  { id: 'kakashi', name: 'Kakashi Hatake', emoji: '📖', tier: 'mythical', points: 3500, hp: 200, atk: 82, def: 50, spd: 48 },
  { id: 'itachi', name: 'Itachi Uchiha', emoji: '🌀', tier: 'mythical', points: 3500, hp: 195, atk: 88, def: 45, spd: 50 },
  { id: 'madara', name: 'Madara Uchiha', emoji: '🔴', tier: 'fabled', points: 9000, hp: 340, atk: 130, def: 85, spd: 50 },

  // --- Dragon Ball ---
  { id: 'goku', name: 'Son Goku', emoji: '🟠', tier: 'mythical', points: 3500, hp: 250, atk: 95, def: 55, spd: 48 },
  { id: 'vegeta', name: 'Vegeta', emoji: '💙', tier: 'mythical', points: 3500, hp: 235, atk: 92, def: 58, spd: 45 },
  { id: 'frieza', name: 'Frieza', emoji: '🟣', tier: 'fabled', points: 9000, hp: 320, atk: 128, def: 82, spd: 55 },

  // --- One Piece ---
  { id: 'luffy', name: 'Monkey D. Luffy', emoji: '🏴‍☠️', tier: 'legendary', points: 1200, hp: 145, atk: 58, def: 38, spd: 32 },
  { id: 'zoro', name: 'Roronoa Zoro', emoji: '🗡️', tier: 'legendary', points: 1200, hp: 140, atk: 62, def: 35, spd: 30 },
  { id: 'shanks', name: 'Red Hair Shanks', emoji: '🔴', tier: 'fabled', points: 9000, hp: 330, atk: 135, def: 88, spd: 48 },

  // --- Demon Slayer ---
  { id: 'tanjiro', name: 'Tanjiro Kamado', emoji: '🔥', tier: 'legendary', points: 1200, hp: 130, atk: 56, def: 34, spd: 34 },
  { id: 'nezuko', name: 'Nezuko Kamado', emoji: '🎀', tier: 'legendary', points: 1200, hp: 125, atk: 52, def: 30, spd: 38 },
  { id: 'muzan', name: 'Muzan Kibutsuji', emoji: '🌑', tier: 'fabled', points: 9000, hp: 350, atk: 138, def: 90, spd: 52 },

  // --- Jujutsu Kaisen ---
  { id: 'gojo', name: 'Gojo Satoru', emoji: '💜', tier: 'fabled', points: 9000, hp: 300, atk: 145, def: 80, spd: 60 },
  { id: 'yuji', name: 'Yuji Itadori', emoji: '🩷', tier: 'legendary', points: 1200, hp: 135, atk: 58, def: 32, spd: 36 },
  { id: 'sukuna', name: 'Ryomen Sukuna', emoji: '👁️', tier: 'fabled', points: 10000, hp: 360, atk: 150, def: 85, spd: 55 },

  // --- Attack on Titan ---
  { id: 'eren', name: 'Eren Yeager', emoji: '⚔️', tier: 'legendary', points: 1200, hp: 138, atk: 60, def: 36, spd: 30 },
  { id: 'levi', name: 'Levi Ackerman', emoji: '🧣', tier: 'mythical', points: 3500, hp: 185, atk: 92, def: 42, spd: 56 },
  { id: 'mikasa', name: 'Mikasa Ackerman', emoji: '🧣', tier: 'legendary', points: 1200, hp: 132, atk: 58, def: 34, spd: 35 },

  // --- My Hero Academia ---
  { id: 'deku', name: 'Izuku Midoriya', emoji: '💚', tier: 'legendary', points: 1200, hp: 128, atk: 55, def: 32, spd: 35 },
  { id: 'allmight', name: 'All Might', emoji: '💪', tier: 'mythical', points: 3500, hp: 260, atk: 95, def: 60, spd: 40 },
  { id: 'todoroki', name: 'Shoto Todoroki', emoji: '🔥', tier: 'legendary', points: 1200, hp: 130, atk: 58, def: 35, spd: 32 },

  // --- Pokemon characters ---
  { id: 'pikachu', name: 'Pikachu', emoji: '⚡', tier: 'legendary', points: 1000, hp: 110, atk: 55, def: 25, spd: 40 },
  { id: 'charizard', name: 'Charizard', emoji: '🔥', tier: 'mythical', points: 3500, hp: 200, atk: 84, def: 48, spd: 42 },
  { id: 'mewtwo', name: 'Mewtwo', emoji: '🟣', tier: 'fabled', points: 9000, hp: 310, atk: 140, def: 75, spd: 58 },
  { id: 'eevee', name: 'Eevee', emoji: '🤎', tier: 'legendary', points: 1000, hp: 105, atk: 48, def: 30, spd: 35 },
  { id: 'gengar', name: 'Gengar', emoji: '👻', tier: 'mythical', points: 3500, hp: 180, atk: 86, def: 42, spd: 50 },
  { id: 'snorlax', name: 'Snorlax', emoji: '😴', tier: 'legendary', points: 1000, hp: 160, atk: 42, def: 50, spd: 10 },
  { id: 'lucario', name: 'Lucario', emoji: '💙', tier: 'mythical', points: 3500, hp: 195, atk: 88, def: 48, spd: 45 },

  // --- Studio Ghibli ---
  { id: 'totoro', name: 'Totoro', emoji: '🌿', tier: 'mythical', points: 3500, hp: 240, atk: 65, def: 70, spd: 30 },
  { id: 'noface', name: 'No-Face', emoji: '🎭', tier: 'mythical', points: 3500, hp: 220, atk: 78, def: 55, spd: 38 },

  // --- Disney / Pop Culture ---
  { id: 'stitch', name: 'Stitch', emoji: '💙', tier: 'legendary', points: 1200, hp: 120, atk: 55, def: 35, spd: 35 },
  { id: 'toothless', name: 'Toothless', emoji: '🖤', tier: 'mythical', points: 3500, hp: 210, atk: 80, def: 52, spd: 48 },
  { id: 'baymax', name: 'Baymax', emoji: '🤍', tier: 'legendary', points: 1200, hp: 180, atk: 35, def: 55, spd: 20 },

  // --- Misc Anime ---
  { id: 'saitama', name: 'Saitama', emoji: '👊', tier: 'fabled', points: 12000, hp: 400, atk: 200, def: 60, spd: 55 },
  { id: 'gon', name: 'Gon Freecss', emoji: '💚', tier: 'legendary', points: 1200, hp: 125, atk: 55, def: 30, spd: 38 },
  { id: 'killua', name: 'Killua Zoldyck', emoji: '⚡', tier: 'legendary', points: 1200, hp: 120, atk: 58, def: 28, spd: 42 },
  { id: 'edward_elric', name: 'Edward Elric', emoji: '⚙️', tier: 'legendary', points: 1200, hp: 128, atk: 56, def: 34, spd: 34 },
  { id: 'rem', name: 'Rem', emoji: '💙', tier: 'legendary', points: 1200, hp: 115, atk: 50, def: 30, spd: 35 },
  { id: 'zerotwo', name: 'Zero Two', emoji: '🌸', tier: 'legendary', points: 1200, hp: 130, atk: 54, def: 32, spd: 36 },
  { id: 'megumin', name: 'Megumin', emoji: '💥', tier: 'mythical', points: 3500, hp: 150, atk: 100, def: 25, spd: 42 },
  { id: 'ainz', name: 'Ainz Ooal Gown', emoji: '💀', tier: 'fabled', points: 9000, hp: 350, atk: 140, def: 90, spd: 45 },
  { id: 'kaneki', name: 'Ken Kaneki', emoji: '🖤', tier: 'mythical', points: 3500, hp: 200, atk: 85, def: 50, spd: 45 },
  { id: 'anya', name: 'Anya Forger', emoji: '🥜', tier: 'legendary', points: 1000, hp: 100, atk: 40, def: 25, spd: 30 },
  { id: 'denji', name: 'Denji', emoji: '🪚', tier: 'legendary', points: 1200, hp: 135, atk: 60, def: 30, spd: 34 },
  { id: 'power', name: 'Power', emoji: '🩸', tier: 'legendary', points: 1200, hp: 125, atk: 62, def: 28, spd: 36 },
  { id: 'makima', name: 'Makima', emoji: '🔗', tier: 'fabled', points: 9000, hp: 300, atk: 135, def: 85, spd: 52 },

  // --- Video Game Characters ---
  { id: 'kirby', name: 'Kirby', emoji: '🩷', tier: 'legendary', points: 1000, hp: 150, atk: 45, def: 40, spd: 30 },
  { id: 'link', name: 'Link', emoji: '🗡️', tier: 'mythical', points: 3500, hp: 200, atk: 80, def: 52, spd: 42 },
  { id: 'mario', name: 'Mario', emoji: '🍄', tier: 'legendary', points: 1000, hp: 130, atk: 50, def: 38, spd: 32 },
  { id: 'sonic', name: 'Sonic', emoji: '💙', tier: 'legendary', points: 1000, hp: 110, atk: 48, def: 25, spd: 55 },
  { id: 'steve', name: 'Steve', emoji: '⛏️', tier: 'legendary', points: 1000, hp: 140, atk: 45, def: 42, spd: 28 },
  { id: 'creeper', name: 'Creeper', emoji: '💚', tier: 'epic', points: 300, hp: 80, atk: 60, def: 10, spd: 15 },
  { id: 'among_us', name: 'Impostor', emoji: '🔴', tier: 'legendary', points: 1000, hp: 100, atk: 55, def: 20, spd: 40 },
];

const TIER_INFO = {
  common:    { name: 'Common',    color: '#9e9e9e', weight: 50,    sellPrice: 5,     sacrificeEssence: 1 },
  uncommon:  { name: 'Uncommon',  color: '#4caf50', weight: 30,    sellPrice: 20,    sacrificeEssence: 3 },
  rare:      { name: 'Rare',      color: '#2196f3', weight: 10,    sellPrice: 100,   sacrificeEssence: 8 },
  epic:      { name: 'Epic',      color: '#9c27b0', weight: 5,     sellPrice: 500,   sacrificeEssence: 25 },
  legendary: { name: 'Legendary', color: '#ff9800', weight: 3,     sellPrice: 2000,  sacrificeEssence: 100 },
  mythical:  { name: 'Mythical',  color: '#e91e63', weight: 1.2,   sellPrice: 5000,  sacrificeEssence: 400 },
  fabled:    { name: 'Fabled',    color: '#ffeb3b', weight: 0.5,   sellPrice: 15000, sacrificeEssence: 1200 },
  hidden:    { name: 'Hidden',    color: '#607d8b', weight: 0.15,  sellPrice: 20000, sacrificeEssence: 2000 },
  gem:       { name: 'Gem',       color: '#00e5ff', weight: 0.08,  sellPrice: 30000, sacrificeEssence: 3000 },
  bot:       { name: 'Bot',       color: '#795548', weight: 0,     sellPrice: 25000, sacrificeEssence: 2500 },
  distorted: { name: 'Distorted', color: '#f44336', weight: 0.03,  sellPrice: 50000, sacrificeEssence: 5000 },
  patreon:   { name: 'Patreon',   color: '#ff6f00', weight: 0,     sellPrice: 35000, sacrificeEssence: 3500 },
  special:   { name: 'Special',   color: '#e040fb', weight: 0.04,  sellPrice: 18000, sacrificeEssence: 1800 },
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
  
  // Huntable tiers only (bot, patreon excluded from normal hunts)
  const huntableTiers = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical', 'fabled', 'hidden', 'gem', 'distorted', 'special'];
  
  for (let i = 0; i < count; i++) {
    const rand = Math.random() * 100;
    let chosenTier = 'common';
    
    // Effective weights with luck bonus (shifts toward higher tiers)
    const distortedThreshold = TIER_INFO.distorted.weight * (1 + luckBonus * 0.5);
    const specialThreshold = distortedThreshold + TIER_INFO.special.weight * (1 + luckBonus * 0.5);
    const gemThreshold = specialThreshold + TIER_INFO.gem.weight * (1 + luckBonus * 0.5);
    const hiddenThreshold = gemThreshold + TIER_INFO.hidden.weight * (1 + luckBonus * 0.4);
    const fabledThreshold = hiddenThreshold + TIER_INFO.fabled.weight * (1 + luckBonus * 0.4);
    const mythicalThreshold = fabledThreshold + TIER_INFO.mythical.weight * (1 + luckBonus * 0.3);
    const legendaryThreshold = mythicalThreshold + TIER_INFO.legendary.weight * (1 + luckBonus * 0.25);
    const epicThreshold = legendaryThreshold + TIER_INFO.epic.weight * (1 + luckBonus * 0.2);
    const rareThreshold = epicThreshold + TIER_INFO.rare.weight * (1 + luckBonus * 0.15);
    const uncommonThreshold = rareThreshold + TIER_INFO.uncommon.weight;

    if (rand < distortedThreshold) chosenTier = 'distorted';
    else if (rand < specialThreshold) chosenTier = 'special';
    else if (rand < gemThreshold) chosenTier = 'gem';
    else if (rand < hiddenThreshold) chosenTier = 'hidden';
    else if (rand < fabledThreshold) chosenTier = 'fabled';
    else if (rand < mythicalThreshold) chosenTier = 'mythical';
    else if (rand < legendaryThreshold) chosenTier = 'legendary';
    else if (rand < epicThreshold) chosenTier = 'epic';
    else if (rand < rareThreshold) chosenTier = 'rare';
    else if (rand < uncommonThreshold) chosenTier = 'uncommon';
    else chosenTier = 'common';

    const pool = ANIMALS.filter(a => a.tier === chosenTier);
    if (pool.length > 0) {
      const selected = pool[Math.floor(Math.random() * pool.length)];
      result.push(selected);
    } else {
      // Fallback to common if tier pool empty
      const commonPool = ANIMALS.filter(a => a.tier === 'common');
      result.push(commonPool[Math.floor(Math.random() * commonPool.length)]);
    }
  }
  return result;
}

// Get random bot-tier animal (for autohunt / huntbot)
function getRandomBotAnimal() {
  const pool = ANIMALS.filter(a => a.tier === 'bot');
  if (pool.length === 0) return getRandomAnimals(1)[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = {
  ANIMALS,
  TIER_INFO,
  getAnimalById,
  getRandomAnimals,
  getRandomBotAnimal
};
