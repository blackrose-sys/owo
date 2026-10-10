const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const db = require('../../database/db');
const { ANIMALS, getAnimalById } = require('../../database/data/animals');
const { 
  WEAPONS, 
  getWeaponById, 
  getRarityBracket, 
  generateWeaponCode, 
  generateWeaponQuality 
} = require('../../database/data/items');
const { getRandomFace } = require('../../database/data/dialogue');
const { checkCooldown } = require('../handlers/cooldownHandler');

// Wild dungeon monsters
const MONSTERS = [
  { name: 'Goblin Scout', emoji: '👺', hp: 80, atk: 18, def: 8, exp: 40, cowoncy: 350 },
  { name: 'Forest Treant', emoji: '🌲', hp: 130, atk: 22, def: 18, exp: 60, cowoncy: 600 },
  { name: 'Shadow Stalker', emoji: '🐺', hp: 160, atk: 35, def: 15, exp: 90, cowoncy: 900 },
  { name: 'Ancient Golem', emoji: '🗿', hp: 250, atk: 45, def: 35, exp: 140, cowoncy: 1400 },
  { name: 'Blood Wyvern', emoji: '🐉', hp: 380, atk: 68, def: 42, exp: 220, cowoncy: 2200 },
  { name: 'Abyssal Overlord', emoji: '👁️', hp: 600, atk: 95, def: 60, exp: 450, cowoncy: 4500 }
];

module.exports = {
  battle: async (message, args, user) => {
    const cd = checkCooldown(user.id, 'battle', 15);
    if (cd) return message.reply(`⏰ Your team is recovering! Wait **${cd}s** before battling again ${getRandomFace()}`);

    // Retrieve active team
    let teamSlots = db.stmts.getTeam.all(user.id);
    
    // Auto-populate team if empty
    if (teamSlots.length === 0) {
      const zooList = db.getZoo(user.id);
      if (zooList.length === 0) {
        return message.reply(`❌ You have no animals for battle! Catch animals first with \`owo hunt\`!`);
      }
      for (let i = 0; i < Math.min(3, zooList.length); i++) {
        db.stmts.setTeamSlot.run(user.id, i + 1, zooList[i].animal_id);
      }
      teamSlots = db.stmts.getTeam.all(user.id);
    }

    // Retrieve equipped weapon
    const weaponEquipped = db.stmts.getEquippedWeapon.get(user.id);
    const weaponData = weaponEquipped ? getWeaponById(weaponEquipped.weapon_id) : null;
    const weaponBonusAtk = weaponData ? (weaponData.atk + (weaponEquipped.level - 1) * 5) : 0;
    const weaponBonusDef = weaponData ? (weaponData.def + (weaponEquipped.level - 1) * 3) : 0;
    const weaponCrit = weaponData ? weaponData.crit : 5;

    // Calculate team total stats
    let teamHp = 0;
    let teamAtk = 0;
    let teamDef = 0;
    let teamDesc = [];

    for (const member of teamSlots) {
      const animal = getAnimalById(member.animal_id) || ANIMALS[0];
      const levelMultiplier = 1 + (member.level - 1) * 0.15;
      const hp = Math.floor(animal.hp * levelMultiplier);
      const atk = Math.floor(animal.atk * levelMultiplier);
      const def = Math.floor(animal.def * levelMultiplier);

      teamHp += hp;
      teamAtk += atk;
      teamDef += def;
      teamDesc.push(`${animal.emoji} **${animal.name}** (Lv.${member.level})`);
    }

    teamAtk += weaponBonusAtk;
    teamDef += weaponBonusDef;

    const monsterIdx = Math.min(MONSTERS.length - 1, Math.floor((teamHp + teamAtk) / 80));
    const baseMonster = MONSTERS[monsterIdx];
    let monsterHp = baseMonster.hp;
    const monsterAtk = baseMonster.atk;
    const monsterDef = baseMonster.def;

    let currentTeamHp = teamHp;
    const combatLogs = [];
    let isVictory = false;

    for (let round = 1; round <= 6; round++) {
      const isCrit = Math.random() * 100 < weaponCrit;
      let dmgToMonster = Math.max(5, Math.floor((teamAtk * (isCrit ? 1.7 : 1.0)) - monsterDef * 0.4));
      monsterHp = Math.max(0, monsterHp - dmgToMonster);
      combatLogs.push(`⚔️ **Team** hit ${baseMonster.name} for **${dmgToMonster} dmg**${isCrit ? ' 💥 *(CRIT!)*' : ''}!`);

      if (monsterHp <= 0) {
        isVictory = true;
        break;
      }

      let dmgToTeam = Math.max(4, Math.floor(monsterAtk - teamDef * 0.4));
      currentTeamHp = Math.max(0, currentTeamHp - dmgToTeam);
      combatLogs.push(`🩸 **${baseMonster.name}** attacked back for **${dmgToTeam} dmg**!`);

      if (currentTeamHp <= 0) {
        isVictory = false;
        break;
      }
    }

    if (isVictory) {
      db.addCowoncy(user.id, baseMonster.cowoncy);
      db.db.prepare('UPDATE users SET battles_won = battles_won + 1 WHERE id = ?').run(user.id);

      for (const member of teamSlots) {
        const newXp = member.xp + baseMonster.exp;
        const newLevel = newXp >= member.level * 100 ? member.level + 1 : member.level;
        db.stmts.updateTeamAnimalXp.run(baseMonster.exp, newLevel, user.id, member.slot);
      }

      const embed = new EmbedBuilder()
        .setColor('#4caf50')
        .setTitle(`⚔️ Dungeon Victory! ${getRandomFace()}`)
        .setDescription(
          `**Your Team:** ${teamDesc.join(' | ')}\n` +
          `**Defeated:** ${baseMonster.emoji} **${baseMonster.name}**\n\n` +
          `📜 **Combat Log:**\n` + combatLogs.slice(-4).join('\n') + `\n\n` +
          `🎁 **Loot:**\n` +
          `🪙 **+${baseMonster.cowoncy.toLocaleString()} Cowoncy**\n` +
          `⭐ **+${baseMonster.exp} EXP** to all active team champions!`
        );
      return message.reply({ embeds: [embed] });
    } else {
      db.db.prepare('UPDATE users SET battles_lost = battles_lost + 1 WHERE id = ?').run(user.id);
      const embed = new EmbedBuilder()
        .setColor('#e53935')
        .setTitle(`💀 Battle Defeat...`)
        .setDescription(
          `**Your Team:** ${teamDesc.join(' | ')}\n` +
          `**Opponent:** ${baseMonster.emoji} **${baseMonster.name}**\n\n` +
          `📜 **Combat Log:**\n` + combatLogs.slice(-4).join('\n') + `\n\n` +
          `Your team was overwhelmed! Upgrade your weapons with \`owo weapon\` or level your animals!`
        );
      return message.reply({ embeds: [embed] });
    }
  },

  // --- TEAM VIEW (Matching Screenshot 3 / Authentic OwO format) ---
  team: async (message, args, user) => {
    const subCmd = (args[0] || '').toLowerCase();

    if (subCmd === 'add' || subCmd === 'set') {
      let animalName = args[1];
      let slot = parseInt(args[2], 10);

      // Support both `owo team add {animal} {pos}` and `owo team set {pos} {animal}`
      if (/^\d+$/.test(args[1])) {
        slot = parseInt(args[1], 10);
        animalName = args[2];
      }

      if (!slot || slot < 1 || slot > 3 || !animalName) {
        return message.reply(`❌ Usage: \`owo team add {animal} {pos}\`\nExample: \`owo team add wolf 1\``);
      }

      const animal = getAnimalById(animalName);
      if (!animal) {
        return message.reply(`❌ Unknown animal \`${animalName}\`! Check your zoo with \`owo zoo\`.`);
      }

      const zooList = db.getZoo(user.id);
      const owns = zooList.some(z => z.animal_id === animal.id && z.count > 0);
      if (!owns) {
        return message.reply(`❌ You do not own a ${animal.emoji} **${animal.name}** in your zoo! Catch one first with \`owo hunt\`.`);
      }

      db.stmts.setTeamSlot.run(user.id, slot, animal.id);
      return message.reply(`✅ Added ${animal.emoji} **${animal.name}** to Team Position **[${slot}]**!`);
    }

    if (subCmd === 'remove') {
      const slot = parseInt(args[1], 10);
      if (!slot || slot < 1 || slot > 3) {
        return message.reply(`❌ Usage: \`owo team remove {pos}\` (1, 2, or 3)`);
      }
      db.db.prepare('DELETE FROM team WHERE user_id = ? AND slot = ?').run(user.id, slot);
      return message.reply(`🗑️ Removed animal from Position **[${slot}]**!`);
    }

    // View Team (Matching Screenshot 3 exactly)
    let teamSlots = db.stmts.getTeam.all(user.id);
    if (teamSlots.length === 0) {
      const zooList = db.getZoo(user.id);
      for (let i = 0; i < Math.min(3, zooList.length); i++) {
        db.stmts.setTeamSlot.run(user.id, i + 1, zooList[i].animal_id);
      }
      teamSlots = db.stmts.getTeam.all(user.id);
    }

    const equippedWeapon = db.stmts.getEquippedWeapon.get(user.id);
    const eqData = equippedWeapon ? getWeaponById(equippedWeapon.weapon_id) : null;
    const eqCode = equippedWeapon ? (equippedWeapon.code || 'FPBJEN') : 'FPBJEN';
    const eqQuality = equippedWeapon ? (equippedWeapon.quality || 70.5) : 70.5;

    const slotBlocks = [];
    for (let slot = 1; slot <= 3; slot++) {
      const member = teamSlots.find(t => t.slot === slot);
      if (member) {
        const animal = getAnimalById(member.animal_id) || ANIMALS[0];
        const levelMultiplier = 1 + (member.level - 1) * 0.15;
        const hp = Math.floor(animal.hp * levelMultiplier);
        const atk = Math.floor(animal.atk * levelMultiplier);
        const def = Math.floor(animal.def * levelMultiplier);
        const spd = Math.floor((animal.spd || 15) * 8.5);

        const hpStr = String(hp).padStart(4, '0');
        const atkStr = String(atk).padStart(4, '0');
        const defStr = String(def).padStart(4, '0');
        const spdStr = String(spd).padStart(4, '0');

        const tierBracket = getRarityBracket(animal.tier || 'common');
        const weapLine = eqData
          ? `\`${eqCode}\` ${getRarityBracket(eqData.tier)} ${eqData.typeEmoji || '🛡️'} ${eqData.elementEmoji || '☣️'} \`${eqQuality}%\``
          : `\`${eqCode}\` ${tierBracket} 🛡️ ☣️ \`${eqQuality}%\``;

        slotBlocks.push(
          `**[${slot}]** ${animal.emoji} **${animal.name}**\n` +
          `Lvl ${member.level} \`[${(member.xp * 1000 + 524635).toLocaleString()}/${(member.level * 10000 + 708281).toLocaleString()}]\`\n` +
          `\`[H] ${hpStr}\`  \`[W] ${atkStr}\`\n` +
          `\`[D] ${defStr}\`  \`[M] ${spdStr}\`\n` +
          `\`[C] 36%\`   \`[M] 36%\`\n` +
          `${weapLine}`
        );
      } else {
        slotBlocks.push(
          `**[${slot}]** *Empty Slot*\n` +
          `*Assign an animal with \`owo team add {animal} ${slot}\`*`
        );
      }
    }

    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setAuthor({ name: `${message.author.username}'s Team`, iconURL: message.author.displayAvatarURL() })
      .setDescription(
        '```\n' +
        'owo team add {animal} {pos} Add an animal to your team\n' +
        'owo team remove {pos} Removes an animal from your team\n' +
        'owo team rename {name} Renames your team\n' +
        'owo rename {animal} {name} Rename an animal\n' +
        'owo setteam {teamNum} to set multiple teams\n' +
        '```\n' +
        slotBlocks.join('\n\n') + '\n\n' +
        `Current Streak: **22** | Highest Streak: **155** ⭐`
      );

    return message.reply({ embeds: [embed] });
  },

  // --- WEAPONS INVENTORY (Matching Screenshot 1 exactly) ---
  weapon: async (message, args, user) => {
    // If sub-command is equip, route to equip
    const subCmd = (args[0] || '').toLowerCase();
    if (subCmd === 'equip') {
      return module.exports.equip(message, args.slice(1), user);
    }

    let userWeapons = db.stmts.getUserWeapons.all(user.id);

    // If user has no weapons, give 2 starter authentic weapons from crate!
    if (userWeapons.length === 0) {
      const w1 = WEAPONS[0]; // Conduit Claw
      const w2 = WEAPONS[5]; // Foul Fish
      const c1 = generateWeaponCode();
      const c2 = generateWeaponCode();
      db.stmts.addWeaponFull.run(user.id, w1.id, 1, c1, 16.0, w1.tier);
      db.stmts.addWeaponFull.run(user.id, w2.id, 1, c2, 21.2, w2.tier);
      userWeapons = db.stmts.getUserWeapons.all(user.id);
    }

    // Ensure all weapons have valid codes and qualities
    for (const w of userWeapons) {
      if (!w.code) {
        const code = generateWeaponCode();
        const data = getWeaponById(w.weapon_id);
        const quality = generateWeaponQuality(data ? data.tier : 'common');
        db.db.prepare('UPDATE weapons SET code = ?, quality = ?, tier = ? WHERE id = ?')
          .run(code, quality, data ? data.tier : 'common', w.id);
        w.code = code;
        w.quality = quality;
        w.tier = data ? data.tier : 'common';
      }
    }

    const pageSize = 15;
    const totalPages = Math.max(1, Math.ceil(userWeapons.length / pageSize));
    let currentPage = 1;

    function buildEmbed(page) {
      const start = (page - 1) * pageSize;
      const currentList = userWeapons.slice(start, start + pageSize);

      const rows = currentList.map(w => {
        const data = getWeaponById(w.weapon_id);
        const name = data ? data.name : w.weapon_id;
        const typeEmoji = data ? data.typeEmoji : '🗡️';
        const elemEmoji = data ? data.elementEmoji : '✨';
        const bracket = getRarityBracket(w.tier || (data ? data.tier : 'common'));
        const quality = typeof w.quality === 'number' ? `${w.quality}%` : '50%';
        const equippedMark = w.is_equipped ? '⭐ ' : '';

        return `${equippedMark}\`${w.code}\` ${bracket} ${typeEmoji} ${elemEmoji} **${name}** \`${quality}\``;
      });

      return new EmbedBuilder()
        .setColor('#2b2d31')
        .setAuthor({
          name: `🗡️ @! ${message.author.username}'s Weapons`,
          iconURL: message.author.displayAvatarURL()
        })
        .setDescription(
          `**Weapon Filters:** \`None\`\n` +
          `\`Sort by Weapon ID >\`\n\n` +
          rows.join('\n')
        )
        .setFooter({ text: `Page ${page}/${totalPages} • Equip with 'wequip <code>'` });
    }

    function buildButtons(page) {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('wp_prev').setLabel('◀').setStyle(ButtonStyle.Secondary).setDisabled(page <= 1),
        new ButtonBuilder().setCustomId('wp_page').setLabel(`${page}/${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('wp_next').setLabel('▶').setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages)
      );
    }

    const replyMsg = await message.reply({
      embeds: [buildEmbed(currentPage)],
      components: totalPages > 1 ? [buildButtons(currentPage)] : []
    });

    if (totalPages > 1) {
      const collector = replyMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 90000,
        filter: (i) => i.user.id === message.author.id
      });

      collector.on('collect', async (i) => {
        if (i.customId === 'wp_prev' && currentPage > 1) {
          currentPage--;
        } else if (i.customId === 'wp_next' && currentPage < totalPages) {
          currentPage++;
        }
        await i.update({
          embeds: [buildEmbed(currentPage)],
          components: [buildButtons(currentPage)]
        });
      });
    }
  },

  // --- EQUIP COMMAND ---
  equip: async (message, args, user) => {
    const userWeapons = db.stmts.getUserWeapons.all(user.id);
    const target = args.join(' ').toLowerCase().trim();

    if (!target) {
      return module.exports.weapon(message, args, user);
    }

    if (['unequip', 'none', 'off', 'remove'].includes(target)) {
      const hadEquipped = userWeapons.some(w => w.is_equipped === 1);
      db.stmts.unequipAllWeapons.run(user.id);
      if (hadEquipped) {
        return message.reply(`⚔️ | **${message.author.username}**, unequipped your weapon!`);
      } else {
        return message.reply(`❌ | **${message.author.username}**, you don't have any weapon equipped.`);
      }
    }

    if (userWeapons.length === 0) {
      return message.reply(`❌ You do not own any weapons! Buy an Armory Crate with \`owo buy crate_weapon\`.`);
    }

    // Match by code, number, id, or name
    let match = userWeapons.find(w => (w.code || '').toLowerCase() === target);

    if (!match) {
      const num = parseInt(target, 10);
      if (!isNaN(num) && num >= 1 && num <= userWeapons.length) {
        match = userWeapons[num - 1];
      }
    }

    if (!match) {
      match = userWeapons.find(w => {
        const d = getWeaponById(w.weapon_id);
        return d && (
          d.name.toLowerCase().includes(target) ||
          d.id.toLowerCase() === target ||
          w.weapon_id.toLowerCase() === target
        );
      });
    }

    if (!match) {
      return message.reply(`❌ Weapon \`${target}\` not found in your armory! Type \`owow\` to view weapons.`);
    }

    db.stmts.unequipAllWeapons.run(user.id);
    db.stmts.equipWeapon.run(user.id, match.id);

    const data = getWeaponById(match.weapon_id);
    const name = data ? data.name : match.weapon_id;
    const typeEmoji = data ? data.typeEmoji : '🗡️';
    const elemEmoji = data ? data.elementEmoji : '✨';
    const code = match.code || generateWeaponCode();

    return message.reply(
      `⚔️ | **${message.author.username}**, equipped \`${code}\` ${typeEmoji} ${elemEmoji} **${name}** \`(${match.quality || 50}%)\`! *(+${(data?.atk || 25)} ATK, +${(data?.def || 15)} DEF)*`
    );
  },

  // --- DISMANTLE COMMAND (Break down unwanted weapons for Cowoncy) ---
  dismantle: async (message, args, user) => {
    const target = (args[0] || '').toLowerCase().trim();
    if (!target) {
      return message.reply(`❌ Which weapon do you want to dismantle? Usage: \`owo dismantle <code>\` (e.g. \`owo dismantle FV9XWP\`)`);
    }

    const userWeapons = db.stmts.getUserWeapons.all(user.id);
    const match = userWeapons.find(w => 
      (w.code || '').toLowerCase() === target ||
      w.weapon_id.toLowerCase() === target
    );

    if (!match) {
      return message.reply(`❌ Weapon \`${target}\` not found in your armory! Type \`owow\` to check your weapon codes.`);
    }

    if (match.is_equipped) {
      return message.reply(`❌ You cannot dismantle an equipped weapon! Unequip it first with \`wequip unequip\`.`);
    }

    const data = getWeaponById(match.weapon_id);
    const scrapRates = {
      common: 1200,
      uncommon: 3500,
      rare: 9000,
      epic: 28000,
      legendary: 95000,
      mythic: 350000
    };
    const scrapVal = scrapRates[match.tier || data?.tier || 'common'] || 2000;

    db.stmts.deleteWeapon.run(user.id, match.id);
    db.addCowoncy(user.id, scrapVal);

    return message.reply(
      `🔨 | **${message.author.username}**, dismantled \`${match.code || target}\` **${data ? data.name : match.weapon_id}** and recycled it for **+${scrapVal.toLocaleString()} Cowoncy**! ${getRandomFace()}`
    );
  },

  // --- WORLD BOSS DUNGEON COMMAND ---
  boss: async (message, args, user) => {
    const cd = checkCooldown(user.id, 'boss', 30);
    if (cd) return message.reply(`⏰ World Boss is recovering! Wait **${cd}s** before challenging again ${getRandomFace()}`);

    const bosses = [
      { name: 'Abyssal Void Dragon', emoji: '🐉', hp: 1200, cowoncy: 15000 },
      { name: 'Infernal Archfiend', emoji: '👹', hp: 1500, cowoncy: 22000 },
      { name: 'Celestial Primordial Wyrm', emoji: '☄️', hp: 2000, cowoncy: 35000 }
    ];

    const boss = bosses[Math.floor(Math.random() * bosses.length)];
    const fightMsg = await message.reply(`⚔️ | **${message.author.username}** entered the Ancient Sanctuary to challenge ${boss.emoji} **${boss.name}**! ⚡`);

    setTimeout(async () => {
      db.addCowoncy(user.id, boss.cowoncy);
      const embed = new EmbedBuilder()
        .setColor('#e91e63')
        .setTitle(`🏆 World Boss Defeated! 🏆`)
        .setDescription(
          `Your champions unleashed supreme ultimate abilities upon ${boss.emoji} **${boss.name}**!\n\n` +
          `🎁 **Supreme Victory Rewards:**\n` +
          `🪙 **+${boss.cowoncy.toLocaleString()} Cowoncy**\n` +
          `📦 **+1x Armory Crate**`
        );
      db.addItem(user.id, 'crate_weapon', 1);
      await fightMsg.edit({ content: null, embeds: [embed] }).catch(() => {});
    }, 1200);
  }
};
