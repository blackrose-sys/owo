const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database/db');
const { ANIMALS, getAnimalById } = require('../../database/data/animals');
const { WEAPONS, getWeaponById } = require('../../database/data/items');
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
    const cd = checkCooldown(user.id, 'battle', 20);
    if (cd) return message.reply(`⏰ Your team is recovering! Wait **${cd}s** before battling again ${getRandomFace()}`);

    // Retrieve active team
    let teamSlots = db.stmts.getTeam.all(user.id);
    
    // Auto-populate team if empty
    if (teamSlots.length === 0) {
      const zooList = db.getZoo(user.id);
      if (zooList.length === 0) {
        return message.reply(`❌ You have no animals for battle! Catch animals first with \`owo hunt\`!`);
      }
      // Pick up to 3 animals from zoo
      for (let i = 0; i < Math.min(3, zooList.length); i++) {
        db.stmts.setTeamSlot.run(user.id, i + 1, zooList[i].animal_id);
      }
      teamSlots = db.stmts.getTeam.all(user.id);
    }

    // Retrieve weapon
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

    // Add weapon bonuses
    teamAtk += weaponBonusAtk;
    teamDef += weaponBonusDef;

    // Pick appropriate monster scale
    const monsterIdx = Math.min(MONSTERS.length - 1, Math.floor((teamHp + teamAtk) / 80));
    const baseMonster = MONSTERS[monsterIdx];
    let monsterHp = baseMonster.hp;
    const monsterAtk = baseMonster.atk;
    const monsterDef = baseMonster.def;

    let currentTeamHp = teamHp;
    const combatLogs = [];
    let isVictory = false;

    // Combat round simulation (up to 5 rounds)
    for (let round = 1; round <= 6; round++) {
      // Team attacks monster
      const isCrit = Math.random() * 100 < weaponCrit;
      let dmgToMonster = Math.max(5, Math.floor((teamAtk * (isCrit ? 1.7 : 1.0)) - monsterDef * 0.4));
      monsterHp = Math.max(0, monsterHp - dmgToMonster);
      combatLogs.push(`⚔️ **Team** hit ${baseMonster.name} for **${dmgToMonster} dmg**${isCrit ? ' 💥 *(CRIT!)*' : ''}!`);

      if (monsterHp <= 0) {
        isVictory = true;
        break;
      }

      // Monster attacks team
      let dmgToTeam = Math.max(4, Math.floor(monsterAtk - teamDef * 0.4));
      currentTeamHp = Math.max(0, currentTeamHp - dmgToTeam);
      combatLogs.push(`🩸 **${baseMonster.name}** attacked back for **${dmgToTeam} dmg**!`);

      if (currentTeamHp <= 0) {
        isVictory = false;
        break;
      }
    }

    if (currentTeamHp > 0 && monsterHp > 0) {
      isVictory = currentTeamHp >= monsterHp;
    }

    if (isVictory) {
      db.db.prepare('UPDATE users SET battles_won = battles_won + 1 WHERE id = ?').run(user.id);
      db.addCowoncy(user.id, baseMonster.cowoncy);

      // Distribute XP to team animals
      for (const member of teamSlots) {
        const newXp = member.xp + baseMonster.exp;
        const newLevel = member.xp + baseMonster.exp >= member.level * 100 ? member.level + 1 : member.level;
        db.stmts.updateTeamAnimalXp.run(baseMonster.exp, newLevel, user.id, member.slot);
      }

      // Loot drop chance (25%)
      let dropText = '';
      if (Math.random() < 0.25) {
        const randWeapon = WEAPONS[Math.floor(Math.random() * 5)]; // drop weapon
        db.stmts.addWeapon.run(user.id, randWeapon.id);
        dropText = `\n🎁 **Loot Drop:** Found ${randWeapon.emoji} **${randWeapon.name}**!`;
      }

      const embed = new EmbedBuilder()
        .setColor('#4caf50')
        .setTitle(`🏆 Dungeon Battle Victory! ${getRandomFace()}`)
        .setDescription(
          `**Your Team:** ${teamDesc.join(' | ')}\n` +
          `**Opponent:** ${baseMonster.emoji} **${baseMonster.name}**\n` +
          (weaponData ? `**Equipped Weapon:** ${weaponData.emoji} ${weaponData.name}\n` : '') +
          `\n📜 **Combat Log:**\n` + combatLogs.slice(-4).join('\n') + `\n\n` +
          `🎉 **Rewards:**\n` +
          `🪙 **+${baseMonster.cowoncy.toLocaleString()} Cowoncy**\n` +
          `⭐ **+${baseMonster.exp} Team EXP**` +
          dropText
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

  team: async (message, args, user) => {
    const subCmd = (args[0] || '').toLowerCase();

    if (subCmd === 'add' || subCmd === 'set') {
      const slot = parseInt(args[1], 10);
      const animalName = args[2];

      if (!slot || slot < 1 || slot > 3 || !animalName) {
        return message.reply(`❌ Usage: \`owo team set <slot 1-3> <animal_name>\`\nExample: \`owo team set 1 wolf\``);
      }

      const animal = getAnimalById(animalName);
      if (!animal) {
        return message.reply(`❌ Unknown animal \`${animalName}\`!`);
      }

      const zooList = db.getZoo(user.id);
      const owns = zooList.some(z => z.animal_id === animal.id && z.count > 0);
      if (!owns) {
        return message.reply(`❌ You do not own a ${animal.emoji} **${animal.name}** in your zoo! Catch one first.`);
      }

      db.stmts.setTeamSlot.run(user.id, slot, animal.id);
      return message.reply(`✅ Assigned ${animal.emoji} **${animal.name}** to Battle Team Slot **#${slot}**!`);
    }

    // View Team
    const teamSlots = db.stmts.getTeam.all(user.id);
    const embed = new EmbedBuilder()
      .setColor('#8a7ff8')
      .setTitle(`⚔️ ${message.author.username}'s Battle Team ${getRandomFace()}`)
      .setDescription(
        `Manage your 3 battle champions! Use \`owo team set <1-3> <animal>\` to assign animals.\n\n`
      );

    for (let slot = 1; slot <= 3; slot++) {
      const member = teamSlots.find(t => t.slot === slot);
      if (member) {
        const animal = getAnimalById(member.animal_id) || ANIMALS[0];
        const levelMultiplier = 1 + (member.level - 1) * 0.15;
        const hp = Math.floor(animal.hp * levelMultiplier);
        const atk = Math.floor(animal.atk * levelMultiplier);
        const def = Math.floor(animal.def * levelMultiplier);

        embed.addFields({
          name: `Slot ${slot}: ${animal.emoji} ${animal.name} (Lv. ${member.level})`,
          value: `❤️ HP: \`${hp}\` | ⚔️ ATK: \`${atk}\` | 🛡️ DEF: \`${def}\` | ⭐ EXP: \`${member.xp}/${member.level * 100}\``,
          inline: false
        });
      } else {
        embed.addFields({
          name: `Slot ${slot}: Empty`,
          value: `*Empty slot! Assign an animal with \`owo team set ${slot} <name>\`*`,
          inline: false
        });
      }
    }

    return message.reply({ embeds: [embed] });
  },

  equip: async (message, args, user) => {
    const userWeapons = db.stmts.getUserWeapons.all(user.id);
    const target = args.join(' ').toLowerCase().trim();

    // 1. If no argument provided: display equipped weapon & armory with equip instructions
    if (!target) {
      const equipped = userWeapons.find(w => w.is_equipped === 1);
      const equippedData = equipped ? getWeaponById(equipped.weapon_id) : null;

      const embed = new EmbedBuilder()
        .setColor('#8a7ff8')
        .setTitle(`⚔️ Weapon Equipment — ${message.author.username} ${getRandomFace()}`)
        .setDescription(
          `**Equipped Weapon:** ` +
          (equippedData 
            ? `${equippedData.emoji} **${equippedData.name}** (Lv.${equipped.level}) ` +
              `*(+${equippedData.atk + (equipped.level - 1) * 5} ATK, +${equippedData.def + (equipped.level - 1) * 3} DEF, +${equippedData.crit}% Crit)*`
            : '*None equipped!*') +
          `\n\n**Your Armory (${userWeapons.length} weapons):**`
        );

      if (userWeapons.length === 0) {
        embed.setDescription(
          embed.data.description + 
          `\n*You don't own any weapons yet! Buy an Armory Crate from \`owo shop\` or win battles to get weapons!*`
        );
      } else {
        const list = userWeapons.map((w, idx) => {
          const d = getWeaponById(w.weapon_id);
          return `\`${idx + 1}.\` ${w.is_equipped ? '✅ ' : '• '}${d ? d.emoji : '🗡️'} **${d ? d.name : w.weapon_id}** (Lv.${w.level}) ${w.is_equipped ? '`[EQUIPPED]`' : ''}`;
        });
        embed.addFields({ name: 'Available Weapons', value: list.slice(0, 15).join('\n') });
      }

      embed.setFooter({ text: `Usage: 'wequip <weapon>' or 'wequip <number>' to equip! (e.g. wequip 1)` });
      return message.reply({ embeds: [embed] });
    }

    // 2. Unequip handling
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
      return message.reply(
        `❌ | **${message.author.username}**, you do not own any weapons! Buy an Armory Crate with \`owo buy crate_weapon\` or win battles!`
      );
    }

    // 3. Match weapon by number (1-indexed list), row ID, or name/id
    let match = null;
    const num = parseInt(target, 10);
    if (!isNaN(num) && num >= 1 && num <= userWeapons.length) {
      match = userWeapons[num - 1];
    } else if (!isNaN(num)) {
      match = userWeapons.find(w => w.id === num);
    }

    if (!match) {
      match = userWeapons.find(w => {
        const data = getWeaponById(w.weapon_id);
        return data && (
          data.name.toLowerCase().includes(target) || 
          data.id.toLowerCase() === target ||
          w.weapon_id.toLowerCase() === target
        );
      });
    }

    if (!match) {
      return message.reply(
        `❌ | **${message.author.username}**, weapon \`${target}\` not found in your armory! Type \`wequip\` to view your weapons.`
      );
    }

    db.stmts.unequipAllWeapons.run(user.id);
    db.stmts.equipWeapon.run(user.id, match.id);

    const data = getWeaponById(match.weapon_id);
    const bonusAtk = data.atk + (match.level - 1) * 5;
    const bonusDef = data.def + (match.level - 1) * 3;

    return message.reply(
      `⚔️ | **${message.author.username}**, equipped ${data.emoji} **${data.name}** (Lv.${match.level})! *(+${bonusAtk} ATK, +${bonusDef} DEF, +${data.crit}% Crit)*`
    );
  },

  weapon: async (message, args, user) => {
    const subCmd = (args[0] || '').toLowerCase();
    if (subCmd === 'equip') {
      return module.exports.equip(message, args.slice(1), user);
    }
    return module.exports.equip(message, args, user);
  }
};
