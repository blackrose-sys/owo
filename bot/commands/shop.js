const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
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

// Shop page definitions (ordered)
const SHOP_PAGES = [
  { title: 'OwO Shop: Rings', filter: 'rings', desc: 'Purchase a ring to propose to someone!\nAll rings are the same. Different tiers are available\nto show off your love!\n\n• `owo buy {id}` to buy an item\n• `owo sell {id}` to sell an item for 75% of its original price\n• `owo marry @user {id}` to use the ring' },
  { title: 'OwO Shop: Crates & Lootboxes', filter: ['crates', 'lootbox'], desc: 'Open crates for animals, weapons, and loot!\n\n• `owo buy {id}` to buy a crate\n• `owo use {id} all` to open all crates at once' },
  { title: 'OwO Shop: Gems & Consumables', filter: ['gems', 'consumable', 'battle'], desc: 'Power up your hunts, battles, and more!\n\n• `owo buy {id}` to buy an item\n• `owo use {id}` to activate the item' },
  { title: 'OwO Shop: Wallpapers (1/2)', filter: 'wallpaper', desc: 'Customize your profile background!\nOnce purchased, wallpapers cannot be sold back.\n\n• `owo buy {id}` to buy a wallpaper\n• `owo wallpaper set {id}` to equip it', subPage: 0 },
  { title: 'OwO Shop: Wallpapers (2/2)', filter: 'wallpaper', desc: 'More wallpapers for your profile!\n\n• `owo buy {id}` to buy a wallpaper\n• `owo wallpaper set {id}` to equip it', subPage: 1 },
];

const TOTAL_PAGES = SHOP_PAGES.length;

// Format price nicely (10 → 10, 1000 → 1K, 1000000 → 1M, 10000000 → 10M)
function formatPrice(price) {
  if (price >= 10000000) return `${(price / 1000000)}M`;
  if (price >= 1000000) return `${(price / 1000000)}M`;
  if (price >= 1000) return `${(price / 1000)}K`;
  return price.toString();
}

function buildShopEmbed(pageIndex, user, client) {
  const page = SHOP_PAGES[pageIndex];
  const filterArray = Array.isArray(page.filter) ? page.filter : [page.filter];
  let items = SHOP_ITEMS.filter(i => filterArray.includes(i.category));

  // Handle wallpaper sub-pages (9 items per page)
  if (page.subPage !== undefined) {
    const perPage = 9;
    items = items.slice(page.subPage * perPage, (page.subPage + 1) * perPage);
  }

  // Build OwO-style item list with dashed lines
  let itemList = '';
  items.forEach((item, idx) => {
    const num = page.subPage !== undefined ? (page.subPage * 9) + idx + 1 : idx + 1;
    const priceStr = formatPrice(item.price);
    const nameLen = item.name.length;
    // Create dashed separator to align prices (target ~45 chars total width)
    const dashCount = Math.max(3, 30 - nameLen - priceStr.length);
    const dashes = '─'.repeat(dashCount);
    itemList += `\`${num}\` ${item.emoji} ${item.name} ${dashes} ${priceStr}\n`;
  });

  const embed = new EmbedBuilder()
    .setColor('#2b2d31')
    .setTitle(`🛍️ ${page.title}`)
    .setDescription(`${page.desc}\n\n──────────────────────────\n\n${itemList}\nPage ${pageIndex + 1}/${TOTAL_PAGES}`)
    .setFooter({ text: `Use the arrows to navigate pages • owo buy <id> [qty]` });

  return embed;
}

function buildShopButtons(pageIndex, userId) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`shop_prev_${userId}_${pageIndex}`)
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(pageIndex === 0),
    new ButtonBuilder()
      .setCustomId(`shop_page_${userId}_${pageIndex}`)
      .setLabel(`${pageIndex + 1}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`shop_next_${userId}_${pageIndex}`)
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(pageIndex === TOTAL_PAGES - 1),
  );
  return row;
}

module.exports = {
  shop: async (message, args, user) => {
    // Determine starting page from args
    let startPage = 0;
    const pageArg = (args[0] || '').toLowerCase();

    const pageMap = {
      '1': 0, 'rings': 0, 'ring': 0,
      '2': 1, 'crates': 1, 'crate': 1, 'lootbox': 1,
      '3': 2, 'gems': 2, 'items': 2, 'consumable': 2, 'consumables': 2,
      '4': 3, 'wp': 3, 'wallpaper': 3, 'wallpapers': 3,
      '5': 4,
    };

    if (pageMap[pageArg] !== undefined) {
      startPage = pageMap[pageArg];
    }

    let currentPage = startPage;
    const embed = buildShopEmbed(currentPage, user, message.client);
    const row = buildShopButtons(currentPage, message.author.id);

    const sentMsg = await message.reply({ embeds: [embed], components: [row] });

    // Collect button interactions for 60 seconds
    const collector = sentMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    });

    collector.on('collect', async (interaction) => {
      // Only the original user can interact
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: `This shop menu isn't yours! Open your own with \`owo shop\``, ephemeral: true });
      }

      const parts = interaction.customId.split('_');
      const action = parts[1]; // prev or next

      if (action === 'prev' && currentPage > 0) {
        currentPage--;
      } else if (action === 'next' && currentPage < TOTAL_PAGES - 1) {
        currentPage++;
      }

      const newEmbed = buildShopEmbed(currentPage, user, message.client);
      const newRow = buildShopButtons(currentPage, message.author.id);

      await interaction.update({ embeds: [newEmbed], components: [newRow] });
    });

    collector.on('end', async () => {
      // Disable buttons after timeout
      try {
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('shop_prev_disabled')
            .setEmoji('◀️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('shop_page_disabled')
            .setLabel(`${currentPage + 1}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('shop_next_disabled')
            .setEmoji('▶️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        );
        await sentMsg.edit({ components: [disabledRow] });
      } catch (e) {}
    });
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

    // --- 2. HANDLE COMMON & RARE CRATES (Animals only, NO Cowoncy) ---
    if (targetId === 'crate_common' || targetId === 'crate_rare') {
      db.removeItem(user.id, targetId, qty);
      const isRare = targetId === 'crate_rare';

      const allAnimals = [];

      for (let i = 0; i < qty; i++) {
        const animalCount = isRare ? 2 : 1;
        const rolled = getRandomAnimals(animalCount, isRare ? 2.0 : 0.5);
        allAnimals.push(...rolled);
      }

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

    // --- 4. EPIC & MYTHICAL CRATES (Animals only, NO Cowoncy) ---
    if (targetId === 'crate_epic' || targetId === 'crate_mythical') {
      db.removeItem(user.id, targetId, qty);
      const isMythical = targetId === 'crate_mythical';

      const allAnimals = [];

      for (let i = 0; i < qty; i++) {
        const rolled = getRandomAnimals(isMythical ? 3 : 2, isMythical ? 5.0 : 3.0);
        allAnimals.push(...rolled);
      }

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
            `🐾 **Animals (${allAnimals.length}):**\n` +
            `${animalLines.join('\n')}\n`
          );
        return openMsg.edit({ content: null, embeds: [embed] }).catch(() => {});
      }, 650);
      return;
    }

    // --- 5. LOOTBOXES (NO Cowoncy — only gems, animals, weapons) ---
    if (targetId === 'lootbox_basic' || targetId === 'lootbox_premium') {
      db.removeItem(user.id, targetId, qty);
      const isPremium = targetId === 'lootbox_premium';

      const rewards = [];

      for (let i = 0; i < qty; i++) {
        const roll = Math.random();
        if (isPremium) {
          if (roll < 0.4) {
            // Gem
            const gems = ['gem_luck', 'gem_xp', 'gem_cowoncy'];
            const gem = gems[Math.floor(Math.random() * gems.length)];
            const gemItem = getItemById(gem);
            db.addItem(user.id, gem, 1);
            rewards.push(`${gemItem.emoji} **${gemItem.name}** x1`);
          } else if (roll < 0.75) {
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
