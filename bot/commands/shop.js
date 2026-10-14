const { EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const { 
  SHOP_ITEMS, 
  getItemById, 
  WEAPONS, 
  getRandomWeapon, 
  generateWeaponCode, 
  generateWeaponQuality, 
  getRarityBracket 
} = require('../../database/data/items');
const { getRandomAnimals, getAnimalById } = require('../../database/data/animals');
const { getRandomFace, getCowoncyEmoji } = require('../../database/data/dialogue');

module.exports = {
  shop: async (message, args, user) => {
    const cEmoji = getCowoncyEmoji(message?.client);
    const page = (args[0] || '1').toLowerCase();

    // Determine which category/page to show
    const categories = {
      '1': { title: '💍 Rings', filter: 'rings', desc: 'Buy rings to marry your partner! Higher rings = bigger perks.' },
      'rings': { title: '💍 Rings', filter: 'rings', desc: 'Buy rings to marry your partner! Higher rings = bigger perks.' },
      '2': { title: '📦 Crates & Lootboxes', filter: ['crates', 'lootbox'], desc: 'Open crates for animals, weapons, and loot!' },
      'crates': { title: '📦 Crates & Lootboxes', filter: ['crates', 'lootbox'], desc: 'Open crates for animals, weapons, and loot!' },
      '3': { title: '💎 Gems & Consumables', filter: ['gems', 'consumable', 'battle'], desc: 'Power up your hunts, battles, and more!' },
      'gems': { title: '💎 Gems & Consumables', filter: ['gems', 'consumable', 'battle'], desc: 'Power up your hunts, battles, and more!' },
      'items': { title: '💎 Gems & Consumables', filter: ['gems', 'consumable', 'battle'], desc: 'Power up your hunts, battles, and more!' },
      '4': { title: '🖼️ Wallpapers', filter: 'wallpaper', desc: 'Customize your profile background! (Cannot be sold back)' },
      'wp': { title: '🖼️ Wallpapers', filter: 'wallpaper', desc: 'Customize your profile background! (Cannot be sold back)' },
      'wallpaper': { title: '🖼️ Wallpapers', filter: 'wallpaper', desc: 'Customize your profile background! (Cannot be sold back)' },
      'wallpapers': { title: '🖼️ Wallpapers', filter: 'wallpaper', desc: 'Customize your profile background! (Cannot be sold back)' },
    };

    const cat = categories[page];

    if (!cat) {
      // Show overview page
      const embed = new EmbedBuilder()
        .setColor('#00e5ff')
        .setTitle(`🛍️ OwO Emporium & Shop ${getRandomFace()}`)
        .setDescription(
          `Welcome to the market! Use \`owo shop <page>\` to browse.\n\n` +
          `**📖 Pages:**\n` +
          `> \`owo shop 1\` — 💍 Rings\n` +
          `> \`owo shop 2\` — 📦 Crates & Lootboxes\n` +
          `> \`owo shop 3\` — 💎 Gems & Consumables\n` +
          `> \`owo shop 4\` — 🖼️ Wallpapers\n\n` +
          `💰 Your balance: **${cEmoji} ${user.cowoncy.toLocaleString()} Cowoncy**\n` +
          `To buy: \`owo buy <item_id> [quantity]\``
        )
        .setFooter({ text: `Tip: 'owo shop wp' or 'owo shop rings' also works!` });
      return message.reply({ embeds: [embed] });
    }

    // Filter items by category
    const filterArray = Array.isArray(cat.filter) ? cat.filter : [cat.filter];
    const items = SHOP_ITEMS.filter(i => filterArray.includes(i.category));

    const embed = new EmbedBuilder()
      .setColor('#00e5ff')
      .setTitle(`🛍️ ${cat.title} ${getRandomFace()}`)
      .setDescription(`${cat.desc}\n💰 Your balance: **${cEmoji} ${user.cowoncy.toLocaleString()} Cowoncy**\n`);

    for (const item of items) {
      embed.addFields({
        name: `${item.emoji} ${item.name} — ${cEmoji} ${item.price.toLocaleString()}`,
        value: `ID: \`${item.id}\` • ${item.description}`,
        inline: false
      });
    }

    embed.setFooter({ text: `Buy: 'owo buy <id> [qty]' | Pages: 1-Rings, 2-Crates, 3-Gems, 4-Wallpapers` });
    return message.reply({ embeds: [embed] });
  },

  buy: async (message, args, user) => {
    const target = (args[0] || '').toLowerCase();
    const qty = Math.max(1, parseInt(args[1], 10) || 1);

    if (!target) {
      return message.reply(`❌ Please specify what item to buy! Usage: \`owo buy <item_id> [quantity]\``);
    }

    let item = getItemById(target);
    if (!item) {
      // Alias resolution
      const aliases = {
        'weapon_crate': 'crate_weapon', 'weapons_crate': 'crate_weapon', 'armory': 'crate_weapon', 'armory_crate': 'crate_weapon',
        'rare_crate': 'crate_rare', 'rare': 'crate_rare',
        'common_crate': 'crate_common', 'crate': 'crate_common', 'box': 'crate_common', 'lootbox': 'lootbox_basic',
        'epic_crate': 'crate_epic', 'mythical_crate': 'crate_mythical',
        'ring_rare': 'ring', 'love_ring': 'ring',
        'sunset': 'wp_sunset', 'galaxy': 'wp_galaxy', 'sakura': 'wp_sakura', 'aurora': 'wp_aurora',
        'ocean': 'wp_ocean', 'forest': 'wp_forest', 'volcano': 'wp_volcano', 'cyberpunk': 'wp_cyberpunk',
        'snowmountain': 'wp_snowmountain', 'desert': 'wp_desert', 'candy': 'wp_candy', 'underwater': 'wp_underwater',
        'dragon': 'wp_dragon', 'anime': 'wp_anime', 'retro': 'wp_retro', 'space': 'wp_space',
        'haunted': 'wp_haunted', 'rainbow': 'wp_rainbow',
        'luck': 'gem_luck', 'xp': 'gem_xp', 'compass': 'hunter_compass',
        'potion': 'revive_potion', 'scroll': 'speed_scroll',
      };
      if (aliases[target]) item = getItemById(aliases[target]);
    }

    if (!item) {
      return message.reply(`❌ Item \`${target}\` was not found in the shop! Type \`owo shop\` to view all items.`);
    }

    // Wallpapers: only allow buying 1 at a time and check if already owned
    if (item.category === 'wallpaper') {
      const existing = db.stmts.getItemCount.get(user.id, item.id);
      if (existing && existing.quantity > 0) {
        return message.reply(`❌ You already own the **${item.emoji} ${item.name}** wallpaper!`);
      }
    }

    const totalCost = item.price * (item.category === 'wallpaper' ? 1 : qty);
    const actualQty = item.category === 'wallpaper' ? 1 : qty;

    if (user.cowoncy < totalCost) {
      return message.reply(
        `❌ You need **${totalCost.toLocaleString()} Cowoncy** to buy ${actualQty}x ${item.name}, but you only have **${user.cowoncy.toLocaleString()}**!`
      );
    }

    db.addCowoncy(user.id, -totalCost);
    db.addItem(user.id, item.id, actualQty);

    return message.reply(
      `🛒 | **${message.author.username}**, you bought **${actualQty.toLocaleString()}x ${item.emoji} ${item.name}** for **${totalCost.toLocaleString()} Cowoncy**! ${getRandomFace()}\n` +
      `*${item.category === 'wallpaper' ? 'Equip with \\`owo wallpaper set ' + item.id + '\\`!' : 'Use with \\`owo use ' + item.id + '\\` or check \\`owo inv\\`!'}*`
    );
  },


  inventory: async (message, args, user) => {
    const targetUser = (message.mentions?.users && typeof message.mentions.users.first === 'function' ? message.mentions.users.first() : null) || message.author;
    const invItems = db.stmts.getInventory.all(targetUser.id);

    const embed = new EmbedBuilder()
      .setColor('#9c27b0')
      .setTitle(`🎒 ${targetUser.username}'s Inventory & Crates ${getRandomFace()}`)
      .setThumbnail(typeof targetUser.displayAvatarURL === 'function' ? targetUser.displayAvatarURL() : null);

    if (invItems.length === 0) {
      embed.setDescription(
        `*Your inventory is currently empty!*\n` +
        `Visit the \`owo shop\` to purchase Crates, Gems, and Items!`
      );
    } else {
      const list = [];
      for (const inv of invItems) {
        const shopItem = getItemById(inv.item_id);
        const emoji = shopItem ? shopItem.emoji : '📦';
        const name = shopItem ? shopItem.name : inv.item_id;
        list.push(`${emoji} **${name}**: \`x${inv.quantity.toLocaleString()}\` *(ID: \`${inv.item_id}\`)*`);
      }
      embed.addFields({ name: 'Items & Crates', value: list.join('\n') || 'Empty' });
    }

    embed.setFooter({ text: `Type 'owo use <item_id> all' to open crates in bulk!` });
    return message.reply({ embeds: [embed] });
  },

  use: async (message, args, user) => {
    let itemArg = (args[0] || '').toLowerCase().trim();
    let countArg = (args[1] || '').toLowerCase().trim();

    // If invoked as `owo crate all` or `w crate 5`, args[0] is 'all' or a number!
    if (['all', 'a'].includes(itemArg) || /^\d+$/.test(itemArg)) {
      countArg = itemArg;
      itemArg = 'crate';
    }

    if (!itemArg) {
      return message.reply(`❌ What item would you like to use? Example: \`owo use crate_weapon all\` or \`owo use crate_common\``);
    }

    // Resolve aliases
    let targetId = itemArg;
    if (['crate_weapon', 'weapons_crate', 'weapon_crate', 'armory_crate', 'armory', 'weapon'].includes(itemArg)) {
      targetId = 'crate_weapon';
    } else if (['crate_rare', 'rare_crate', 'rarecrate'].includes(itemArg)) {
      targetId = 'crate_rare';
    } else if (['crate_common', 'common_crate', 'lootbox', 'lb', 'box'].includes(itemArg)) {
      targetId = 'crate_common';
    } else if (['crate', 'crates'].includes(itemArg)) {
      // Pick which crate user owns
      const userWeap = db.stmts.getItemCount.get(user.id, 'crate_weapon');
      const userCommon = db.stmts.getItemCount.get(user.id, 'crate_common');
      const userRare = db.stmts.getItemCount.get(user.id, 'crate_rare');

      if (userWeap && userWeap.quantity > 0) {
        targetId = 'crate_weapon';
      } else if (userCommon && userCommon.quantity > 0) {
        targetId = 'crate_common';
      } else if (userRare && userRare.quantity > 0) {
        targetId = 'crate_rare';
      } else {
        targetId = 'crate_common';
      }
    }

    const currentCount = db.stmts.getItemCount.get(user.id, targetId);
    const available = currentCount ? currentCount.quantity : 0;
    if (available <= 0) {
      return message.reply(`❌ You do not have any \`${targetId}\` in your inventory! Check \`owo inv\`.`);
    }

    let qty = 1;
    if (countArg === 'all' || countArg === 'a') {
      qty = available;
    } else if (countArg) {
      const parsed = parseInt(countArg, 10);
      if (!isNaN(parsed) && parsed > 0) {
        qty = Math.min(parsed, available);
      }
    }

    // --- 1. HANDLE WEAPON CRATES (Supports single & multi-crate) ---
    if (targetId === 'crate_weapon') {
      db.removeItem(user.id, 'crate_weapon', qty);

      const unboxed = [];
      for (let i = 0; i < qty; i++) {
        const weapon = getRandomWeapon();
        const code = generateWeaponCode();
        const quality = generateWeaponQuality(weapon.tier);
        db.stmts.addWeaponFull.run(user.id, weapon.id, 1, code, quality, weapon.tier);
        unboxed.push({ ...weapon, code, quality });
      }

      const openingMsg = await message.reply(`📦 | **${message.author.username}** is unlocking **${qty}x** Armory Crates... 🗝️ ✨`);

      setTimeout(async () => {
        if (qty === 1) {
          const w = unboxed[0];
          const bracket = getRarityBracket(w.tier);
          const embed = new EmbedBuilder()
            .setColor('#e91e63')
            .setTitle(`🗡️ Armory Crate Unboxed! ${getRandomFace()}`)
            .setDescription(
              `You opened the armory chest and retrieved:\n\n` +
              `\`${w.code}\` ${bracket} ${w.typeEmoji || '🗡️'} ${w.elementEmoji || '✨'} **${w.name}** \`${w.quality}%\` *(${w.tier.toUpperCase()})*\n` +
              `⚔️ ATK: +${w.atk} | 🛡️ DEF: +${w.def} | 💥 Crit: +${w.crit}%\n\n` +
              `Equip it using \`wequip ${w.code}\` or \`wequip ${w.name.toLowerCase()}\`!`
            );
          return openingMsg.edit({ content: null, embeds: [embed] }).catch(() => {});
        }

        const tierCounts = {};
        for (const w of unboxed) {
          tierCounts[w.tier] = (tierCounts[w.tier] || 0) + 1;
        }

        const tierSummary = Object.entries(tierCounts)
          .map(([tier, c]) => `${getRarityBracket(tier)} **${c}** ${tier.toUpperCase()}`)
          .join(' • ');

        const highlights = unboxed.slice(0, 10).map(w => 
          `\`${w.code}\` ${getRarityBracket(w.tier)} ${w.typeEmoji || '🗡️'} ${w.elementEmoji || '✨'} **${w.name}** \`${w.quality}%\``
        );

        if (unboxed.length > 10) {
          highlights.push(`*...and ${unboxed.length - 10} more weapons added to your armory!*`);
        }

        const embed = new EmbedBuilder()
          .setColor('#e91e63')
          .setTitle(`🗡️ Unboxed ${qty}x Armory Crates! ${getRandomFace()}`)
          .setDescription(
            `You cracked open **${qty}** armory chests:\n\n` +
            `${highlights.join('\n')}\n\n` +
            `📊 **Rarity Breakdown:**\n${tierSummary}\n\n` +
            `Type \`owow\` to view all weapons and \`wequip <code>\` to equip!`
          );

        return openingMsg.edit({ content: null, embeds: [embed] }).catch(() => {});
      }, 650);
      return;
    }

    // --- 2. HANDLE COMMON & RARE CRATES / LOOTBOXES (Supports single & multi-crate) ---
    if (targetId === 'crate_common' || targetId === 'crate_rare') {
      db.removeItem(user.id, targetId, qty);
      const isRare = targetId === 'crate_rare';

      let totalCash = 0;
      const allAnimals = [];

      for (let i = 0; i < qty; i++) {
        const minCash = isRare ? 2500 : 500;
        const maxCash = isRare ? 10000 : 2500;
        const cowoncyReward = Math.floor(Math.random() * (maxCash - minCash + 1)) + minCash;
        totalCash += cowoncyReward;

        const animalCount = isRare ? 2 : 1;
        const rolled = getRandomAnimals(animalCount, isRare ? 2.0 : 0.5);
        allAnimals.push(...rolled);
      }

      db.addCowoncy(user.id, totalCash);
      db.recordHunt(user.id, allAnimals);

      const openMsg = await message.reply(
        `📦 | Cracking open **${qty}x** ${isRare ? '🎁 Rare Crates' : '📦 Common Crates'}... ⏳ ✨`
      );

      setTimeout(async () => {
        const animalMap = new Map();
        for (const a of allAnimals) {
          const entry = animalMap.get(a.id) || { animal: a, count: 0 };
          entry.count++;
          animalMap.set(a.id, entry);
        }

        const animalLines = Array.from(animalMap.values())
          .map(e => `${e.animal.emoji} **${e.animal.name}** \`x${e.count}\` *(${e.animal.tier})*`)
          .slice(0, 15);

        if (animalMap.size > 15) {
          animalLines.push(`*...and ${animalMap.size - 15} more animal species!*`);
        }

        const embed = new EmbedBuilder()
          .setColor('#ff9800')
          .setTitle(`✨ Opened ${qty}x ${isRare ? '🎁 Rare Crates' : '📦 Common Crates'}! ${getRandomFace()}`)
          .setDescription(
            `You cracked open the crates and found:\n\n` +
            `🪙 **+${totalCash.toLocaleString()} Cowoncy**\n` +
            `🐾 **Animals (${allAnimals.length}):**\n` +
            `${animalLines.join('\n')}\n`
          );
        return openMsg.edit({ content: null, embeds: [embed] }).catch(() => {});
      }, 650);
      return;
    }

    // --- 3. CONSUMABLES ---
    if (targetId === 'gem_luck') {
      db.removeItem(user.id, targetId, 1);
      const now = Math.floor(Date.now() / 1000);
      const newBoost = Math.max(user.luck_boost_until || 0, now) + 1800; // 30 minutes
      db.stmts.setLuckBoost.run(newBoost, user.id);

      return message.reply(`💎 **Luck Gem shattered!** You received **+50% Hunt Luck** for 30 minutes! ✨`);
    }

    if (targetId === 'bait') {
      db.removeItem(user.id, targetId, 1);
      db.stmts.addBait.run(15, user.id);

      return message.reply(`🥩 **Golden Bait activated!** Your next **15 hunts** will lure max 3 animals each! 🐾`);
    }

    if (targetId === 'elixir_exp') {
      db.removeItem(user.id, targetId, 1);
      const teamSlots = db.stmts.getTeam.all(user.id);
      if (teamSlots.length === 0) {
        return message.reply(`You need at least 1 animal assigned to your battle team to use this!`);
      }
      for (const member of teamSlots) {
        const newXp = member.xp + 500;
        const newLevel = newXp >= member.level * 100 ? member.level + 1 : member.level;
        db.stmts.updateTeamAnimalXp.run(500, newLevel, user.id, member.slot);
      }
      return message.reply(`🧪 **EXP Elixir consumed!** Granted **+500 EXP** to all active battle team members! ⚡`);
    }

    // --- 4. EPIC & MYTHICAL CRATES ---
    if (targetId === 'crate_epic' || targetId === 'crate_mythical') {
      db.removeItem(user.id, targetId, qty);
      const isMythical = targetId === 'crate_mythical';

      let totalCash = 0;
      const allAnimals = [];

      for (let i = 0; i < qty; i++) {
        const minCash = isMythical ? 20000 : 5000;
        const maxCash = isMythical ? 50000 : 15000;
        totalCash += Math.floor(Math.random() * (maxCash - minCash + 1)) + minCash;

        const rolled = getRandomAnimals(isMythical ? 3 : 2, isMythical ? 5.0 : 3.0);
        allAnimals.push(...rolled);
      }

      db.addCowoncy(user.id, totalCash);
      db.recordHunt(user.id, allAnimals);

      const label = isMythical ? '🌟 Mythical Crates' : '🟣 Epic Crates';
      const openMsg = await message.reply(`📦 | Cracking open **${qty}x** ${label}... ⏳ ✨`);

      setTimeout(async () => {
        const animalMap = new Map();
        for (const a of allAnimals) {
          const entry = animalMap.get(a.id) || { animal: a, count: 0 };
          entry.count++;
          animalMap.set(a.id, entry);
        }

        const animalLines = Array.from(animalMap.values())
          .map(e => `${e.animal.emoji} **${e.animal.name}** \`x${e.count}\` *(${e.animal.tier})*`)
          .slice(0, 15);

        if (animalMap.size > 15) animalLines.push(`*...and ${animalMap.size - 15} more species!*`);

        const embed = new EmbedBuilder()
          .setColor(isMythical ? '#e91e63' : '#9c27b0')
          .setTitle(`✨ Opened ${qty}x ${label}! ${getRandomFace()}`)
          .setDescription(
            `You cracked open the crates and found:\n\n` +
            `🪙 **+${totalCash.toLocaleString()} Cowoncy**\n` +
            `🐾 **Animals (${allAnimals.length}):**\n` +
            `${animalLines.join('\n')}\n`
          );
        return openMsg.edit({ content: null, embeds: [embed] }).catch(() => {});
      }, 650);
      return;
    }

    // --- 5. LOOTBOXES ---
    if (targetId === 'lootbox_basic' || targetId === 'lootbox_premium') {
      db.removeItem(user.id, targetId, qty);
      const isPremium = targetId === 'lootbox_premium';

      let totalCash = 0;
      const rewards = [];

      for (let i = 0; i < qty; i++) {
        const roll = Math.random();
        if (isPremium) {
          if (roll < 0.3) {
            // Cowoncy
            const cash = Math.floor(Math.random() * 8000) + 3000;
            totalCash += cash;
            rewards.push(`🪙 **${cash.toLocaleString()} Cowoncy**`);
          } else if (roll < 0.6) {
            // Gem
            const gems = ['gem_luck', 'gem_xp', 'gem_cowoncy'];
            const gem = gems[Math.floor(Math.random() * gems.length)];
            const gemItem = getItemById(gem);
            db.addItem(user.id, gem, 1);
            rewards.push(`${gemItem.emoji} **${gemItem.name}** x1`);
          } else if (roll < 0.85) {
            // Rare animal
            const animal = getRandomAnimals(1, 3.0)[0];
            db.recordHunt(user.id, [animal]);
            rewards.push(`${animal.emoji} **${animal.name}** *(${animal.tier})*`);
          } else {
            // Weapon!
            const weapon = getRandomWeapon();
            const code = generateWeaponCode();
            const quality = generateWeaponQuality(weapon.tier);
            db.stmts.addWeaponFull.run(user.id, weapon.id, 1, code, quality, weapon.tier);
            rewards.push(`${getRarityBracket(weapon.tier)} ${weapon.typeEmoji} **${weapon.name}** \`${quality}%\``);
          }
        } else {
          if (roll < 0.5) {
            const cash = Math.floor(Math.random() * 2000) + 500;
            totalCash += cash;
            rewards.push(`🪙 **${cash.toLocaleString()} Cowoncy**`);
          } else if (roll < 0.8) {
            const gems = ['gem_luck', 'gem_xp'];
            const gem = gems[Math.floor(Math.random() * gems.length)];
            const gemItem = getItemById(gem);
            db.addItem(user.id, gem, 1);
            rewards.push(`${gemItem.emoji} **${gemItem.name}** x1`);
          } else {
            const animal = getRandomAnimals(1, 1.0)[0];
            db.recordHunt(user.id, [animal]);
            rewards.push(`${animal.emoji} **${animal.name}** *(${animal.tier})*`);
          }
        }
      }

      if (totalCash > 0) db.addCowoncy(user.id, totalCash);

      const label = isPremium ? '🎲 Premium Lootbox' : '🎰 Basic Lootbox';
      const embed = new EmbedBuilder()
        .setColor(isPremium ? '#ff9800' : '#4caf50')
        .setTitle(`${label} Unboxed! ${getRandomFace()}`)
        .setDescription(
          `**${message.author.username}** opened **${qty}x** ${label}${qty > 1 ? 'es' : ''}:\n\n` +
          rewards.slice(0, 20).join('\n') +
          (rewards.length > 20 ? `\n*...and ${rewards.length - 20} more rewards!*` : '')
        );

      return message.reply({ embeds: [embed] });
    }

    // --- 6. NEW GEMS ---
    if (targetId === 'gem_xp') {
      db.removeItem(user.id, targetId, 1);
      return message.reply(`🟢 **XP Gem activated!** You receive **+100% XP** from hunts and battles for 30 minutes! ✨`);
    }

    if (targetId === 'gem_cowoncy') {
      db.removeItem(user.id, targetId, 1);
      return message.reply(`🟡 **Cowoncy Gem activated!** All Cowoncy earnings are **doubled** for 30 minutes! 💰`);
    }

    // --- 7. BATTLE CONSUMABLES ---
    if (targetId === 'revive_potion') {
      db.removeItem(user.id, targetId, 1);
      return message.reply(`❤️‍🩹 **Revive Potion used!** Your fallen battle pets are fully restored! 🐾`);
    }

    if (targetId === 'speed_scroll') {
      db.removeItem(user.id, targetId, 1);
      return message.reply(`📜 **Speed Scroll activated!** Your team's speed is boosted by **+20** for the next 3 battles! ⚡`);
    }

    if (targetId === 'atk_potion') {
      db.removeItem(user.id, targetId, 1);
      return message.reply(`⚔️ **Attack Potion consumed!** Your team's ATK is boosted by **+15** for the next 5 battles! 💥`);
    }

    if (targetId === 'hunter_compass') {
      db.removeItem(user.id, targetId, 1);
      return message.reply(`🧭 **Hunter's Compass activated!** Your next **10 hunts** are guaranteed at least 1 Rare+ animal! 🦊`);
    }

    if (targetId === 'essence_booster') {
      db.removeItem(user.id, targetId, 1);
      return message.reply(`🌀 **Essence Booster activated!** Sacrifice essence is **doubled** for your next 10 sacrifices! ✨`);
    }

    if (targetId === 'shield_aegis') {
      db.removeItem(user.id, targetId, 1);
      return message.reply(`🛡️ **Guardian Ward activated!** Your team's DEF is boosted by **+25** for the next 5 battles! 🏰`);
    }

    return message.reply(`This item cannot be used directly! Check \`owo shop\` for usable items.`);
  }
};
