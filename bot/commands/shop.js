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
    const embed = new EmbedBuilder()
      .setColor('#00e5ff')
      .setTitle(`🛍️ OwO Emporium & Shop ${getRandomFace()}`)
      .setDescription(
        `Welcome to the market! Buy crates, powerups, rings, and equipment with Cowoncy.\n` +
        `To purchase: \`owo buy <item_id> [quantity]\`\n\n`
      );

    for (const item of SHOP_ITEMS) {
      embed.addFields({
        name: `${item.emoji} ${item.name} — ${cEmoji} ${item.price.toLocaleString()} Cowoncy`,
        value: `ID: \`${item.id}\` • ${item.description}`,
        inline: false
      });
    }

    embed.setFooter({ text: `Usage: 'owo buy crate_weapon 5' or 'owo use crate_weapon all'` });
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
      if (['crate_weapon', 'weapon_crate', 'weapons_crate', 'armory', 'armory_crate'].includes(target)) {
        item = getItemById('crate_weapon');
      } else if (['crate_rare', 'rare_crate', 'rare'].includes(target)) {
        item = getItemById('crate_rare');
      } else if (['crate_common', 'common_crate', 'crate', 'box', 'lootbox'].includes(target)) {
        item = getItemById('crate_common');
      }
    }

    if (!item) {
      return message.reply(`❌ Item \`${target}\` was not found in the shop! Type \`owo shop\` to view all items.`);
    }

    const totalCost = item.price * qty;
    if (user.cowoncy < totalCost) {
      return message.reply(
        `❌ You need **${totalCost.toLocaleString()} Cowoncy** to buy ${qty}x ${item.name}, but you only have **${user.cowoncy.toLocaleString()}**!`
      );
    }

    db.addCowoncy(user.id, -totalCost);
    db.addItem(user.id, item.id, qty);

    return message.reply(
      `🛒 | **${message.author.username}**, you bought **${qty.toLocaleString()}x ${item.emoji} ${item.name}** for **${totalCost.toLocaleString()} Cowoncy**! ${getRandomFace()}\n` +
      `*Use with \`owo use ${item.id} all\` or \`owo inv\`!*`
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

    return message.reply(`This item cannot be used directly!`);
  }
};
