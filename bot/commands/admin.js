const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../database/db');
const { getRandomFace } = require('../../database/data/dialogue');
const { ANIMALS, TIER_INFO } = require('../../database/data/animals');
const { WEAPONS, generateWeaponCode } = require('../../database/data/items');

module.exports = {
  prefix: async (message, args, user) => {
    if (!message.guild) {
      return message.reply(`Prefix can only be customized inside a server!`);
    }

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return message.reply(`❌ You need **Manage Server** permissions to change the prefix!`);
    }

    const newPrefix = args[0];
    if (!newPrefix) {
      const current = db.getGuildPrefix(message.guild.id);
      return message.reply(`Current prefix for this server is: \`${current}\`\nUsage: \`owo prefix <new_prefix>\``);
    }

    if (newPrefix.length > 5) {
      return message.reply(`❌ Prefix cannot be longer than 5 characters!`);
    }

    db.setGuildPrefix(message.guild.id, newPrefix.endsWith(' ') ? newPrefix : newPrefix + ' ');
    return message.reply(`✅ Server prefix updated to \`${newPrefix}\`! ${getRandomFace()}`);
  },

  ping: async (message) => {
    const sent = await message.reply('🏓 Pong! Calculating latency...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    const apiPing = Math.round(message.client.ws.ping);

    const embed = new EmbedBuilder()
      .setColor('#00e5ff')
      .setDescription(`🏓 **Pong!** ${getRandomFace()}\n⏱️ **Roundtrip Latency:** \`${latency}ms\`\n💓 **WebSocket Ping:** \`${apiPing}ms\``);

    return sent.edit({ content: null, embeds: [embed] });
  },

  stats: async (message) => {
    const totalUsers = message.client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
    const totalGuilds = message.client.guilds.cache.size;
    const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const uptime = Math.floor(process.uptime());
    const uptimeStr = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`;

    const embed = new EmbedBuilder()
      .setColor('#8a7ff8')
      .setTitle(`📊 OwO Bot System Statistics`)
      .setDescription(
        `🤖 **Servers:** \`${totalGuilds}\`\n` +
        `👥 **Users Cached:** \`${totalUsers.toLocaleString()}\`\n` +
        `⚡ **Memory Usage:** \`${memory} MB\`\n` +
        `⏳ **Uptime:** \`${uptimeStr}\`\n` +
        `⚙️ **Node.js:** \`${process.version}\`\n` +
        `📦 **Discord.js:** \`v14.16.3\``
      )
      .setFooter({ text: 'OwO Bot • 100000x Better, Smooth, 100% Reliable' });

    return message.reply({ embeds: [embed] });
  },

  // === SETUPKING: Give a user the ultimate undefeatable team ===
  setupking: async (message, args, user) => {
    // Only bot owner or admin can run this
    const OWNER_IDS = [message.guild?.ownerId, process.env.OWNER_ID].filter(Boolean);
    if (!OWNER_IDS.includes(message.author.id) && !message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply(`❌ Only the server owner or admins can use this command!`);
    }

    const targetUser = message.mentions?.users?.first();
    if (!targetUser) {
      return message.reply(`❌ Please mention a user! Usage: \`owo setupking @user\``);
    }

    const avatar = typeof targetUser.displayAvatarURL === 'function' ? targetUser.displayAvatarURL() : '';
    const target = db.getUser(targetUser.id, targetUser.username, avatar);

    const statusMsg = await message.reply(`⚡ Setting up **${targetUser.username}** as the ultimate champion... 👑`);

    // ══════════════════════════════════════════
    // 1. SET LEVEL TO 100 & MASSIVE COWONCY
    // ══════════════════════════════════════════
    db.stmts.setLevel.run(100, target.id);
    db.stmts.setCowoncy.run(10000000, target.id); // 10M Cowoncy
    db.stmts.setTitle.run('👑 Undefeated Champion', target.id);

    // ══════════════════════════════════════════
    // 2. GIVE ALL RAREST ANIMALS TO ZOO (ALL TIERS)
    // ══════════════════════════════════════════
    const rareTiers = ['distorted', 'gem', 'hidden', 'fabled', 'mythical', 'legendary', 'special', 'bot', 'patreon'];
    for (const tier of rareTiers) {
      const tierAnimals = ANIMALS.filter(a => a.tier === tier);
      for (const animal of tierAnimals) {
        db.stmts.addZooAnimal.run(target.id, animal.id, 99);
      }
    }
    // Also give some epic/rare ones
    for (const animal of ANIMALS.filter(a => ['epic', 'rare'].includes(a.tier))) {
      db.stmts.addZooAnimal.run(target.id, animal.id, 50);
    }
    // Common/uncommon too for full collection
    for (const animal of ANIMALS.filter(a => ['common', 'uncommon'].includes(a.tier))) {
      db.stmts.addZooAnimal.run(target.id, animal.id, 25);
    }

    // ══════════════════════════════════════════
    // 3. SET THE ULTIMATE BATTLE TEAM (3 slots)
    //    Slot 1: Saitama (Fabled) - One Punch God
    //    Slot 2: Gojo Satoru (Fabled) - Infinity defense
    //    Slot 3: Ryomen Sukuna (Fabled) - King of Curses
    // ══════════════════════════════════════════
    const teamComposition = [
      { slot: 1, id: 'saitama', level: 100, xp: 99999 },
      { slot: 2, id: 'gojo', level: 100, xp: 99999 },
      { slot: 3, id: 'sukuna', level: 100, xp: 99999 },
    ];

    // Clear existing team
    db.db.prepare('DELETE FROM team WHERE user_id = ?').run(target.id);

    for (const member of teamComposition) {
      db.db.prepare(`
        INSERT INTO team (user_id, slot, animal_id, level, xp)
        VALUES (?, ?, ?, ?, ?)
      `).run(target.id, member.slot, member.id, member.level, member.xp);
    }

    // Set team name
    db.stmts.setTeamName.run('⚡ Godslayer Squad', target.id);

    // ══════════════════════════════════════════
    // 4. GIVE THE BEST WEAPONS (ALL MYTHIC, 99% QUALITY)
    // ══════════════════════════════════════════
    const mythicWeapons = WEAPONS.filter(w => w.tier === 'mythic');
    const legendaryWeapons = WEAPONS.filter(w => w.tier === 'legendary');

    // Clear existing weapons
    db.db.prepare('DELETE FROM weapons WHERE user_id = ?').run(target.id);

    // Give all mythic weapons at 99% quality
    for (const weapon of mythicWeapons) {
      const code = generateWeaponCode();
      db.stmts.addWeaponFull.run(target.id, weapon.id, 10, code, 99.0, 'mythic');
    }

    // Give all legendary weapons at 95% quality
    for (const weapon of legendaryWeapons) {
      const code = generateWeaponCode();
      db.stmts.addWeaponFull.run(target.id, weapon.id, 8, code, 95.0, 'legendary');
    }

    // Equip the best mythic weapon (Godslayer Blade) to slot 1
    const godslayer = db.db.prepare('SELECT id FROM weapons WHERE user_id = ? AND weapon_id = ?').get(target.id, 'godslayer_blade');
    if (godslayer) {
      db.stmts.equipWeaponToSlot.run(1, target.id, godslayer.id);
    }

    // Equip Void Reaper to slot 2
    const voidReaper = db.db.prepare('SELECT id FROM weapons WHERE user_id = ? AND weapon_id = ?').get(target.id, 'void_reaper');
    if (voidReaper) {
      db.stmts.equipWeaponToSlot.run(2, target.id, voidReaper.id);
    }

    // Equip Abyssal Trident to slot 3
    const trident = db.db.prepare('SELECT id FROM weapons WHERE user_id = ? AND weapon_id = ?').get(target.id, 'abyssal_trident');
    if (trident) {
      db.stmts.equipWeaponToSlot.run(3, target.id, trident.id);
    }

    // ══════════════════════════════════════════
    // 5. GIVE STACKED INVENTORY
    // ══════════════════════════════════════════
    db.addItem(target.id, 'crate_mythical', 50);
    db.addItem(target.id, 'crate_epic', 100);
    db.addItem(target.id, 'crate_weapon', 200);
    db.addItem(target.id, 'crate_rare', 500);
    db.addItem(target.id, 'gem_luck', 99);
    db.addItem(target.id, 'gem_xp', 99);
    db.addItem(target.id, 'gem_cowoncy', 99);
    db.addItem(target.id, 'lootbox_premium', 100);
    db.addItem(target.id, 'ring_fabled', 1);
    db.addItem(target.id, 'essence', 500000);

    // Set display animal to Saitama emoji
    db.stmts.setDisplayAnimal.run('👊', target.id);

    // ══════════════════════════════════════════
    // 6. BUILD THE RESULT EMBED
    // ══════════════════════════════════════════
    const embed = new EmbedBuilder()
      .setColor('#ffd700')
      .setTitle(`👑 ULTIMATE KING SETUP COMPLETE 👑`)
      .setThumbnail(avatar)
      .setDescription(
        `**${targetUser.username}** has been crowned the **Undefeated Champion**!\n\n` +
        `⚡ **Level:** \`100\` (MAX)\n` +
        `💰 **Cowoncy:** \`10,000,000\` (10M)\n` +
        `🏷️ **Title:** 👑 Undefeated Champion\n\n` +
        `──────────────────────────\n\n` +
        `🐾 **Battle Team: ⚡ Godslayer Squad**\n` +
        `> **Slot 1:** 👊 Saitama (Lv.100) + 👑 Godslayer Blade \`99%\`\n` +
        `> **Slot 2:** 💜 Gojo Satoru (Lv.100) + 🌌 Void Reaper \`99%\`\n` +
        `> **Slot 3:** 👁️ Ryomen Sukuna (Lv.100) + 🔱 Abyssal Trident \`99%\`\n\n` +
        `──────────────────────────\n\n` +
        `🗡️ **Weapons:** ${mythicWeapons.length} Mythic (99%) + ${legendaryWeapons.length} Legendary (95%)\n` +
        `🐾 **Zoo:** ALL ${ANIMALS.length} animals unlocked!\n` +
        `📦 **Crates:** 50 Mythical, 100 Epic, 200 Weapon, 500 Rare\n` +
        `💎 **Gems:** 99x Luck, 99x XP, 99x Cowoncy\n` +
        `💍 **Ring:** Fabled Ring (10M)\n` +
        `🔮 **Essence:** 500,000\n\n` +
        `*This player is now UNDEFEATABLE.* 💀⚡`
      )
      .setFooter({ text: `Setup by ${message.author.username} • OwO Ultimate King` });

    return statusMsg.edit({ content: null, embeds: [embed] });
  }
};
