const { EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const { SHOP_ITEMS, getItemById, WEAPONS } = require('../../database/data/items');
const { getRandomAnimals, getAnimalById } = require('../../database/data/animals');
const { getRandomFace } = require('../../database/data/dialogue');

module.exports = {
  shop: async (message, args, user) => {
    const embed = new EmbedBuilder()
      .setColor('#00e5ff')
      .setTitle(`🛍️ OwO Emporium & Shop ${getRandomFace()}`)
      .setDescription(
        `Welcome to the market! Buy crates, powerups, rings, and equipment with Cowoncy.\n` +
        `To purchase: \`owo buy <item_id> [quantity]\`\n\n`
      );

    for (const item of SHOP_ITEMS) {
      embed.addFields({
        name: `${item.emoji} ${item.name} — 🪙 ${item.price.toLocaleString()} Cowoncy`,
        value: `ID: \`${item.id}\` • ${item.description}`,
        inline: false
      });
    }

    embed.setFooter({ text: `Your Balance: ${user.cowoncy.toLocaleString()} Cowoncy` });

    return message.reply({ embeds: [embed] });
  },

  buy: async (message, args, user) => {
    const itemId = (args[0] || '').toLowerCase();
    const qty = Math.max(1, parseInt(args[1], 10) || 1);

    if (!itemId) {
      return message.reply(`❌ What would you like to buy? Check \`owo shop\` for the catalogue!`);
    }

    const item = getItemById(itemId);
    if (!item) {
      return message.reply(`❌ Item \`${itemId}\` not found in shop! Type \`owo shop\` to see available items.`);
    }

    const totalCost = item.price * qty;
    if (user.cowoncy < totalCost) {
      return message.reply(`❌ You cannot afford this! You need **${totalCost.toLocaleString()} Cowoncy** but only have **${user.cowoncy.toLocaleString()}**.`);
    }

    db.addCowoncy(user.id, -totalCost);
    db.addItem(user.id, item.id, qty);

    const embed = new EmbedBuilder()
      .setColor('#4caf50')
      .setDescription(
        `🛍️ Purchased **${qty}x** ${item.emoji} **${item.name}** for **${totalCost.toLocaleString()} Cowoncy**!\n` +
        `📦 Stored in your inventory! Use \`owo inv\` to view or \`owo use ${item.id}\` to use!`
      );

    return message.reply({ embeds: [embed] });
  },

  inventory: async (message, args, user) => {
    const targetUser = (message.mentions?.users && typeof message.mentions.users.first === 'function' ? message.mentions.users.first() : null) || message.author;
    const avatar = typeof targetUser.displayAvatarURL === 'function' ? targetUser.displayAvatarURL() : '';
    const targetData = db.getUser(targetUser.id, targetUser.username, avatar);
    const items = db.getInventory(targetUser.id);

    const embed = new EmbedBuilder()
      .setColor('#9c27b0')
      .setTitle(`🎒 ${targetData.username}'s Backpack & Inventory ${getRandomFace()}`)
      .setDescription(`View your items, crates, gems, and consumables.`);

    if (items.length === 0) {
      embed.setDescription(`🎒 Backpack is currently empty! Buy items at \`owo shop\` or find them while hunting.`);
    } else {
      const list = [];
      for (const inv of items) {
        if (inv.quantity <= 0) continue;
        const shopItem = getItemById(inv.item_id);
        const emoji = shopItem ? shopItem.emoji : (inv.item_id === 'essence' ? '🔮' : '📦');
        const name = shopItem ? shopItem.name : inv.item_id;
        list.push(`${emoji} **${name}**: \`x${inv.quantity.toLocaleString()}\` *(ID: \`${inv.item_id}\`)*`);
      }
      embed.addFields({ name: 'Items', value: list.join('\n') || 'Empty' });
    }

    embed.setFooter({ text: `Type 'owo use <item_id>' to open crates or activate buffs!` });

    return message.reply({ embeds: [embed] });
  },

  use: async (message, args, user) => {
    const itemId = (args[0] || '').toLowerCase();
    if (!itemId) {
      return message.reply(`❌ What item would you like to use? Example: \`owo use crate_common\``);
    }

    const currentCount = db.stmts.getItemCount.get(user.id, itemId);
    if (!currentCount || currentCount.quantity <= 0) {
      return message.reply(`❌ You do not have any \`${itemId}\` in your inventory! Check \`owo inv\`.`);
    }

    // Handle Crates
    if (itemId === 'crate_common' || itemId === 'crate_rare') {
      db.removeItem(user.id, itemId, 1);
      const isRare = itemId === 'crate_rare';

      const minCash = isRare ? 2500 : 500;
      const maxCash = isRare ? 10000 : 2500;
      const cowoncyReward = Math.floor(Math.random() * (maxCash - minCash + 1)) + minCash;
      db.addCowoncy(user.id, cowoncyReward);

      // Roll animals
      const animalCount = isRare ? 2 : 1;
      const animals = getRandomAnimals(animalCount, isRare ? 2.0 : 0.5);
      db.recordHunt(user.id, animals);

      const animalNames = animals.map(a => `${a.emoji} **${a.name}** *(${a.tier})*`).join(', ');

      const embed = new EmbedBuilder()
        .setColor('#ff9800')
        .setTitle(`✨ Opened ${isRare ? '🎁 Rare Crate' : '📦 Common Crate'}! ${getRandomFace()}`)
        .setDescription(
          `You cracked open the crate and found:\n\n` +
          `🪙 **+${cowoncyReward.toLocaleString()} Cowoncy**\n` +
          `🐾 **Animals:** ${animalNames}\n`
        );
      return message.reply({ embeds: [embed] });
    }

    // Handle Weapon Crate
    if (itemId === 'crate_weapon') {
      db.removeItem(user.id, itemId, 1);
      const randWeapon = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
      db.stmts.addWeapon.run(user.id, randWeapon.id);

      const embed = new EmbedBuilder()
        .setColor('#e91e63')
        .setTitle(`🗡️ Armory Crate Unboxed! ${getRandomFace()}`)
        .setDescription(
          `You opened the armory chest and retrieved:\n\n` +
          `${randWeapon.emoji} **${randWeapon.name}** *(${randWeapon.tier.toUpperCase()})*\n` +
          `⚔️ ATK: +${randWeapon.atk} | 🛡️ DEF: +${randWeapon.def} | 💥 Crit: +${randWeapon.crit}%\n\n` +
          `Equip it using \`owo weapon equip ${randWeapon.id}\`!`
        );
      return message.reply({ embeds: [embed] });
    }

    // Handle Luck Gem
    if (itemId === 'gem_luck') {
      db.removeItem(user.id, itemId, 1);
      const now = Math.floor(Date.now() / 1000);
      const newBoost = Math.max(user.luck_boost_until || 0, now) + 1800; // 30 minutes
      db.stmts.setLuckBoost.run(newBoost, user.id);

      return message.reply(`💎 **Luck Gem shattered!** You received **+50% Hunt Luck** for 30 minutes! ✨`);
    }

    // Handle Bait
    if (itemId === 'bait') {
      db.removeItem(user.id, itemId, 1);
      db.stmts.addBait.run(15, user.id);

      return message.reply(`🥩 **Golden Bait activated!** Your next **15 hunts** will lure max 3 animals each! 🐾`);
    }

    // Handle EXP Elixir
    if (itemId === 'elixir_exp') {
      db.removeItem(user.id, itemId, 1);
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
