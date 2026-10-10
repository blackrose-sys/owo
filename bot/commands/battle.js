const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType, 
  StringSelectMenuBuilder, 
  AttachmentBuilder 
} = require('discord.js');
const db = require('../../database/db');
const { ANIMALS, getAnimalById } = require('../../database/data/animals');
const { 
  WEAPONS, 
  getWeaponById, 
  getRarityBracket, 
  generateWeaponCode, 
  generateWeaponQuality 
} = require('../../database/data/items');
const { getAnimalBuild, checkBuildSynergy, BUILD_ARCHETYPES } = require('../../database/data/builds');
const { getRandomFace } = require('../../database/data/dialogue');
const { checkCooldown } = require('../handlers/cooldownHandler');
const { createBattleVisual, createBossVisual } = require('../utils/battleVisuals');

// Wild dungeon monsters for battle
const MONSTERS = [
  { name: 'Goblin Scout', emoji: '👺', hp: 80, atk: 18, def: 8, exp: 40, cowoncy: 350 },
  { name: 'Forest Treant', emoji: '🌲', hp: 130, atk: 22, def: 18, exp: 60, cowoncy: 600 },
  { name: 'Shadow Stalker', emoji: '🐺', hp: 160, atk: 35, def: 15, exp: 90, cowoncy: 900 },
  { name: 'Ancient Golem', emoji: '🗿', hp: 250, atk: 45, def: 35, exp: 140, cowoncy: 1400 },
  { name: 'Blood Wyvern', emoji: '🐉', hp: 380, atk: 68, def: 42, exp: 220, cowoncy: 2200 },
  { name: 'Abyssal Overlord', emoji: '👁️', hp: 600, atk: 95, def: 60, exp: 450, cowoncy: 4500 }
];

module.exports = {
  // --- 1. BATTLE COMMAND (PvE + PvP when mentioning @user) ---
  battle: async (message, args, user) => {
    const cd = checkCooldown(user.id, 'battle', 15);
    if (cd) return message.reply(`⏰ Your team is recovering! Wait **${cd}s** before battling again ${getRandomFace()}`);

    // --- PvP Detection: check if user mentioned another player ---
    let pvpTarget = null;
    if (message.mentions?.users) {
      if (typeof message.mentions.users.first === 'function') {
        pvpTarget = message.mentions.users.first();
      } else if (typeof message.mentions.users.values === 'function') {
        pvpTarget = message.mentions.users.values().next().value;
      }
    }
    // Also check if args have a raw user ID
    if (!pvpTarget && args[0]) {
      const cleanId = args[0].replace(/[<@!>]/g, '').trim();
      if (/^\d{17,20}$/.test(cleanId) && cleanId !== user.id) {
        try {
          if (message.client?.users?.cache?.has(cleanId)) {
            pvpTarget = message.client.users.cache.get(cleanId);
          } else if (typeof message.client?.users?.fetch === 'function') {
            pvpTarget = await message.client.users.fetch(cleanId);
          }
        } catch (e) {}
      }
    }

    // Filter out self-battles
    if (pvpTarget && pvpTarget.id === message.author.id) {
      pvpTarget = null;
    }
    if (pvpTarget && pvpTarget.bot) {
      return message.reply(`❌ You can't battle a bot! Challenge a real player! ${getRandomFace()}`);
    }

    // ========== PvP BATTLE ==========
    if (pvpTarget) {
      const targetUser = db.getUser(pvpTarget.id, pvpTarget.username, typeof pvpTarget.displayAvatarURL === 'function' ? pvpTarget.displayAvatarURL() : '');
      
      // Helper to load a user's team with stats
      function loadTeam(userId, userData) {
        const activeTeamNum = userData.active_team || 1;
        const minSlot = (activeTeamNum - 1) * 3 + 1;
        const maxSlot = activeTeamNum * 3;
        let teamSlots = db.stmts.getTeamByPage ? db.stmts.getTeamByPage.all(userId, minSlot, maxSlot) : [];
        
        if (teamSlots.length === 0) {
          teamSlots = db.stmts.getTeam.all(userId).filter(t => t.slot <= 3);
        }
        
        // Auto-populate if empty
        if (teamSlots.length === 0) {
          const zooList = db.getZoo(userId);
          if (zooList.length === 0) return [];
          for (let i = 0; i < Math.min(3, zooList.length); i++) {
            db.stmts.setTeamSlot.run(userId, i + 1, zooList[i].animal_id);
          }
          teamSlots = db.stmts.getTeam.all(userId).filter(t => t.slot <= 3);
        }
        
        const pets = [];
        for (let i = 0; i < 3; i++) {
          const targetSlot = (activeTeamNum - 1) * 3 + (i + 1);
          const member = teamSlots.find(t => t.slot === targetSlot) || teamSlots[i];
          const slotWeapon = db.getEquippedWeapon(userId, targetSlot) || null;
          const weaponData = slotWeapon ? getWeaponById(slotWeapon.weapon_id) : null;
          
          if (member) {
            const animal = getAnimalById(member.animal_id) || ANIMALS[0];
            const lvl = member.level || 1;
            const levelMultiplier = 1 + (lvl - 1) * 0.15;
            const synergy = checkBuildSynergy(animal, weaponData);
            
            const weaponBonusAtk = weaponData ? (weaponData.atk + (slotWeapon.level - 1) * 5) : 0;
            const weaponBonusDef = weaponData ? (weaponData.def + (slotWeapon.level - 1) * 3) : 0;
            
            const hp = Math.floor(animal.hp * levelMultiplier * 10) + (synergy.hasSynergy ? synergy.bonusHp : 0);
            const atk = Math.floor(animal.atk * levelMultiplier * 10) + weaponBonusAtk + (synergy.hasSynergy ? synergy.bonusAtk : 0);
            const def = Math.floor(animal.def * levelMultiplier * 8) + weaponBonusDef + (synergy.hasSynergy ? synergy.bonusDef : 0);
            const spd = Math.floor((animal.spd || 15) * levelMultiplier * 8);
            const crit = Math.min(75, 16 + (synergy.hasSynergy ? synergy.bonusCrit : 0));
            
            pets.push({
              name: animal.name, emoji: animal.emoji, lvl, hp, maxHp: hp,
              atk, def, spd, crit,
              weaponIcon: weaponData ? (weaponData.typeEmoji || '🛡️') : '🛡️',
              synergyActive: synergy.hasSynergy
            });
          }
        }
        return pets;
      }
      
      const p1Team = loadTeam(user.id, user);
      const p2Team = loadTeam(pvpTarget.id, targetUser);
      
      if (p1Team.length === 0) {
        return message.reply(`❌ You have no animals for battle! Catch animals first with \`owo hunt\`!`);
      }
      if (p2Team.length === 0) {
        return message.reply(`❌ **${pvpTarget.username}** has no animals for battle! They need to hunt first!`);
      }
      
      // ---- Simulate PvP Battle ----
      const battleLog = [];
      let p1TotalHp = p1Team.reduce((a, p) => a + p.hp, 0);
      let p2TotalHp = p2Team.reduce((a, p) => a + p.hp, 0);
      const p1MaxHp = p1TotalHp;
      const p2MaxHp = p2TotalHp;
      
      let turnCount = 0;
      const maxTurns = 25;
      
      while (p1TotalHp > 0 && p2TotalHp > 0 && turnCount < maxTurns) {
        turnCount++;
        
        // P1 attacks P2
        const p1Attacker = p1Team[turnCount % p1Team.length];
        const p2Defender = p2Team[turnCount % p2Team.length];
        if (p1Attacker && p2Defender) {
          const isCrit = Math.random() * 100 < p1Attacker.crit;
          const critMult = isCrit ? 1.8 : 1.0;
          const dodged = Math.random() * 100 < (p2Defender.spd / 10);
          if (!dodged) {
            let dmg = Math.max(1, Math.floor((p1Attacker.atk * critMult) - (p2Defender.def * 0.4)));
            dmg += Math.floor(Math.random() * 15);
            p2TotalHp = Math.max(0, p2TotalHp - dmg);
            if (isCrit) {
              battleLog.push(`⚡ ${p1Attacker.emoji} **${p1Attacker.name}** lands a **CRITICAL** strike on ${p2Defender.emoji} ${p2Defender.name} for **${dmg}** dmg!`);
            } else {
              battleLog.push(`⚔️ ${p1Attacker.emoji} ${p1Attacker.name} hits ${p2Defender.emoji} ${p2Defender.name} for **${dmg}** dmg`);
            }
          } else {
            battleLog.push(`💨 ${p2Defender.emoji} ${p2Defender.name} dodges ${p1Attacker.emoji} ${p1Attacker.name}'s attack!`);
          }
        }
        
        if (p2TotalHp <= 0) break;
        
        // P2 attacks P1
        const p2Attacker = p2Team[turnCount % p2Team.length];
        const p1Defender = p1Team[turnCount % p1Team.length];
        if (p2Attacker && p1Defender) {
          const isCrit = Math.random() * 100 < p2Attacker.crit;
          const critMult = isCrit ? 1.8 : 1.0;
          const dodged = Math.random() * 100 < (p1Defender.spd / 10);
          if (!dodged) {
            let dmg = Math.max(1, Math.floor((p2Attacker.atk * critMult) - (p1Defender.def * 0.4)));
            dmg += Math.floor(Math.random() * 15);
            p1TotalHp = Math.max(0, p1TotalHp - dmg);
            if (isCrit) {
              battleLog.push(`⚡ ${p2Attacker.emoji} **${p2Attacker.name}** lands a **CRITICAL** strike on ${p1Defender.emoji} ${p1Defender.name} for **${dmg}** dmg!`);
            } else {
              battleLog.push(`⚔️ ${p2Attacker.emoji} ${p2Attacker.name} hits ${p1Defender.emoji} ${p1Defender.name} for **${dmg}** dmg`);
            }
          } else {
            battleLog.push(`💨 ${p1Defender.emoji} ${p1Defender.name} dodges ${p2Attacker.emoji} ${p2Attacker.name}'s attack!`);
          }
        }
      }
      
      // Determine winner
      const p1Won = p1TotalHp > p2TotalHp;
      const winnerName = p1Won ? message.author.username : pvpTarget.username;
      const loserName = p1Won ? pvpTarget.username : message.author.username;
      const winnerId = p1Won ? user.id : pvpTarget.id;
      const loserId = p1Won ? pvpTarget.id : user.id;
      
      // Rewards
      const winCowoncy = 800 + Math.floor(Math.random() * 400);
      const winXp = 300;
      const loseCowoncy = 150;
      db.addCowoncy(winnerId, winCowoncy);
      db.addCowoncy(loserId, loseCowoncy);
      
      // Build team display strings
      const p1TeamName = ((user.active_team || 1) === 2 ? user.team_name_2 : user.team_name) || 'Team';
      const p2TeamName = ((targetUser.active_team || 1) === 2 ? targetUser.team_name_2 : targetUser.team_name) || 'Team';
      
      const p1Display = p1Team.map(p => `L.${p.lvl} ${p.emoji} **${p.name}** ${p.weaponIcon}${p.synergyActive ? '⭐' : ''}`).join('\n');
      const p2Display = p2Team.map(p => `L.${p.lvl} ${p.emoji} **${p.name}** ${p.weaponIcon}${p.synergyActive ? '⭐' : ''}`).join('\n');
      
      // HP bars
      const p1HpPct = Math.max(0, Math.floor((p1TotalHp / p1MaxHp) * 10));
      const p2HpPct = Math.max(0, Math.floor((p2TotalHp / p2MaxHp) * 10));
      const p1HpBar = '`[' + '▓'.repeat(p1HpPct) + '░'.repeat(10 - p1HpPct) + ']`';
      const p2HpBar = '`[' + '▓'.repeat(p2HpPct) + '░'.repeat(10 - p2HpPct) + ']`';
      
      // Show last 5 battle log entries
      const logDisplay = battleLog.slice(-5).join('\n');
      
      const resultEmoji = p1Won ? '🏆' : '💀';
      const embed = new EmbedBuilder()
        .setColor(p1Won ? '#43b581' : '#f04747')
        .setAuthor({
          name: `⚔️ PvP Battle: ${message.author.username} vs ${pvpTarget.username}`,
          iconURL: message.author.displayAvatarURL()
        })
        .addFields(
          {
            name: `📋 ${message.author.username}'s ${p1TeamName}`,
            value: `${p1Display}\n${p1HpBar} \`${Math.max(0, p1TotalHp).toLocaleString()} HP\``,
            inline: true
          },
          {
            name: `📋 ${pvpTarget.username}'s ${p2TeamName}`,
            value: `${p2Display}\n${p2HpBar} \`${Math.max(0, p2TotalHp).toLocaleString()} HP\``,
            inline: true
          },
          {
            name: `📜 Battle Log (${turnCount} turns)`,
            value: logDisplay || '*No attacks landed*',
            inline: false
          }
        )
        .setDescription(
          `${resultEmoji} **${winnerName}** wins the PvP battle in **${turnCount}** turns!\n\n` +
          `🏆 **${winnerName}** earned **+${winCowoncy.toLocaleString()} Cowoncy** & **+${winXp} XP**\n` +
          `🤝 **${loserName}** received **+${loseCowoncy} Cowoncy** (consolation)`
        )
        .setThumbnail(typeof pvpTarget.displayAvatarURL === 'function' ? pvpTarget.displayAvatarURL() : '')
        .setFooter({ text: `Use 'wb @user' to challenge anyone! | Build your team with 'wteam'` });

      return message.reply({ embeds: [embed] });
    }

    // ========== PvE BATTLE (original) ==========
    // Retrieve active team (Team 1 = slots 1..3, Team 2 = slots 4..6)
    const activeTeamNum = user.active_team || 1;
    const minSlot = (activeTeamNum - 1) * 3 + 1;
    const maxSlot = activeTeamNum * 3;
    let teamSlots = db.stmts.getTeamByPage ? db.stmts.getTeamByPage.all(user.id, minSlot, maxSlot) : [];

    // Fallback: Check slots 1..3 if page was empty
    if (teamSlots.length === 0) {
      teamSlots = db.stmts.getTeam.all(user.id).filter(t => t.slot <= 3);
    }

    // Auto-populate team 1 if empty
    if (teamSlots.length === 0) {
      const zooList = db.getZoo(user.id);
      if (zooList.length === 0) {
        return message.reply(`❌ You have no animals for battle! Catch animals first with \`owo hunt\`!`);
      }
      for (let i = 0; i < Math.min(3, zooList.length); i++) {
        db.stmts.setTeamSlot.run(user.id, i + 1, zooList[i].animal_id);
      }
      teamSlots = db.stmts.getTeam.all(user.id).filter(t => t.slot <= 3);
    }

    // Calculate team total stats and build visual pet data with dedicated per-pet weapons
    let teamHp = 0;
    let teamAtk = 0;
    let teamDef = 0;
    const playerBattlePets = [];

    for (let i = 0; i < 3; i++) {
      const targetSlot = (activeTeamNum - 1) * 3 + (i + 1);
      const member = teamSlots.find(t => t.slot === targetSlot) || teamSlots[i];

      // Retrieve dedicated weapon for this specific pet slot
      const slotWeapon = db.getEquippedWeapon(user.id, targetSlot) || (i === 0 ? db.getEquippedWeapon(user.id, 1) : null);
      const weaponData = slotWeapon ? getWeaponById(slotWeapon.weapon_id) : null;

      if (member) {
        const animal = getAnimalById(member.animal_id) || ANIMALS[0];
        const lvl = member.level || 20;
        const levelMultiplier = 1 + (lvl - 1) * 0.15;
        const synergy = checkBuildSynergy(animal, weaponData);

        const weaponBonusAtk = weaponData ? (weaponData.atk + (slotWeapon.level - 1) * 5) : 0;
        const weaponBonusDef = weaponData ? (weaponData.def + (slotWeapon.level - 1) * 3) : 0;
        const synergyBonusAtk = synergy.hasSynergy ? synergy.bonusAtk : 0;
        const synergyBonusDef = synergy.hasSynergy ? synergy.bonusDef : 0;
        const synergyBonusHp = synergy.hasSynergy ? synergy.bonusHp : 0;
        const synergyBonusCrit = synergy.hasSynergy ? synergy.bonusCrit : 0;

        const hp = Math.floor(animal.hp * levelMultiplier * 10) + synergyBonusHp;
        const atk = Math.floor(animal.atk * levelMultiplier * 10) + weaponBonusAtk + synergyBonusAtk;
        const def = Math.floor(animal.def * levelMultiplier * 8) + weaponBonusDef + synergyBonusDef;
        const mp = Math.floor((animal.spd || 15) * levelMultiplier * 30);
        const crit = Math.min(75, 16 + synergyBonusCrit);
        const mag = Math.min(75, 16 + (synergy.hasSynergy && synergy.archetype.id === 'mage' ? 25 : 0));

        teamHp += hp;
        teamAtk += atk;
        teamDef += def;

        playerBattlePets.push({
          name: animal.name,
          emoji: animal.emoji,
          lvl,
          color: '#4caf50',
          hp,
          maxHp: hp,
          mp,
          maxMp: mp,
          atk,
          def,
          crit,
          mag,
          weaponIcon: weaponData ? (weaponData.typeEmoji || '🛡️') : '🛡️',
          synergyActive: synergy.hasSynergy
        });
      } else {
        playerBattlePets.push({
          name: 'Champion',
          emoji: '🐻',
          lvl: 1,
          color: '#4caf50',
          hp: 400,
          maxHp: 400,
          mp: 200,
          maxMp: 200,
          atk: 30,
          def: 25,
          crit: 12,
          mag: 10,
          weaponIcon: weaponData ? (weaponData.typeEmoji || '🛡️') : '🛡️',
          synergyActive: false
        });
      }
    }

    // Enemy team
    const enemyAnimals = [ANIMALS[1] || { emoji: '🐱', name: 'cat' }, ANIMALS[8] || { emoji: '🐑', name: 'sheep' }, ANIMALS[12] || { emoji: '🐷', name: 'pig' }];
    const enemyBattlePets = [
      { name: 'Cat', emoji: '🐱', lvl: 28, maxHp: 688, weaponIcon: '🏹' },
      { name: 'Sheep', emoji: '🐑', lvl: 28, maxHp: 780, weaponIcon: '🗡️' },
      { name: 'Pig', emoji: '🐷', lvl: 28, maxHp: 724, weaponIcon: '⛏️' }
    ];

    const turns = 16;
    const streak = (user.battles_won || 0) + 1;
    const xpWon = 200;
    const cowoncyWon = 500;

    // Generate authentic canvas battle visual
    const visualBuf = await createBattleVisual(playerBattlePets, enemyBattlePets, turns, streak, xpWon);
    const attachment = new AttachmentBuilder(visualBuf, { name: 'battle.png' });

    // Update database
    db.addCowoncy(user.id, cowoncyWon);
    db.db.prepare('UPDATE users SET battles_won = battles_won + 1 WHERE id = ?').run(user.id);
    for (const member of teamSlots) {
      const newXp = (member.xp || 0) + xpWon;
      const newLevel = newXp >= member.level * 1000 ? member.level + 1 : member.level;
      db.stmts.updateTeamAnimalXp.run(xpWon, newLevel, user.id, member.slot);
    }

    const p1 = playerBattlePets[0];
    const p2 = playerBattlePets[1];
    const p3 = playerBattlePets[2];
    const currentTeamName = (activeTeamNum === 2 ? user.team_name_2 : user.team_name) || 'PETS';

    const embed = new EmbedBuilder()
      .setColor('#43b581')
      .setAuthor({
        name: `${message.author.username} goes into battle!`,
        iconURL: message.author.displayAvatarURL()
      })
      .setDescription(
        `**${currentTeamName.toUpperCase()} Enemy Team**\n` +
        `L. ${p1.lvl} ${p1.emoji} - M ${p1.weaponIcon} 🔴  L. 28 🐱 - G 🏹 🛡️\n` +
        `L. ${p2.lvl} ${p2.emoji} - M ${p2.weaponIcon} 🟣  L. 28 🐑 - C ⚔️ 🟢\n` +
        `L. ${p3.lvl} ${p3.emoji} - M ${p3.weaponIcon} 🟢  L. 28 🐷 - E ⛏️ 🔴`
      )
      .setImage('attachment://battle.png')
      .setFooter({
        text: `You won in ${turns} turns! | +${xpWon} xp | Streak: ${streak}`
      });

    return message.reply({ embeds: [embed], files: [attachment] });
  },

  // --- 2. TEAM VIEW (Matching Screenshot 1 with side-by-side columns and pagination) ---
  team: async (message, args, user) => {
    const subCmd = (args[0] || '').toLowerCase();

    if (subCmd === 'add' || subCmd === 'set') {
      let animalName = args[1];
      let slot = parseInt(args[2], 10);
      if (/^\d+$/.test(args[1])) {
        slot = parseInt(args[1], 10);
        animalName = args[2];
      }

      if (!slot || slot < 1 || slot > 3 || !animalName) {
        return message.reply(`❌ Usage: \`owo team add {animal} {pos}\`\nExample: \`owo team add dog 1\``);
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

      const activeTeamNum = user.active_team || 1;
      const targetSlot = (activeTeamNum - 1) * 3 + slot;
      db.db.prepare(`
        INSERT INTO team (user_id, slot, animal_id, level, xp)
        VALUES (?, ?, ?, 1, 0)
        ON CONFLICT(user_id, slot) DO UPDATE SET animal_id = excluded.animal_id, level = 1, xp = 0
      `).run(user.id, targetSlot, animal.id);

      return message.reply(`✅ Added ${animal.emoji} **${animal.name}** to Team ${activeTeamNum} Position **[${slot}]**!`);
    }

    if (subCmd === 'remove') {
      const slot = parseInt(args[1], 10);
      if (!slot || slot < 1 || slot > 3) {
        return message.reply(`❌ Usage: \`owo team remove {pos}\` (1, 2, or 3)`);
      }
      const activeTeamNum = user.active_team || 1;
      const targetSlot = (activeTeamNum - 1) * 3 + slot;
      db.db.prepare('DELETE FROM team WHERE user_id = ? AND slot = ?').run(user.id, targetSlot);
      return message.reply(`🗑️ Removed animal from Team ${activeTeamNum} Position **[${slot}]**!`);
    }

    if (subCmd === 'equip') {
      return module.exports.equip(message, args.slice(1), user);
    }

    if (subCmd === 'unequip') {
      return module.exports.equip(message, ['unequip', ...args.slice(1)], user);
    }

    if (subCmd === 'rename' || subCmd === 'name') {
      const newName = args.slice(1).join(' ').trim();
      if (!newName) {
        return message.reply(`❌ Usage: \`owo team rename {name}\`\nExample: \`owo team rename PETS MO WALANG BITAW\``);
      }
      if (newName.length > 32) {
        return message.reply(`❌ Team name cannot exceed 32 characters!`);
      }

      const activeTeamNum = user.active_team || 1;
      if (activeTeamNum === 2) {
        db.stmts.setTeamName2.run(newName, user.id);
        user.team_name_2 = newName;
      } else {
        db.stmts.setTeamName.run(newName, user.id);
        user.team_name = newName;
      }

      return message.reply(`🏷️ Renamed Team ${activeTeamNum} to **${newName}**!`);
    }

    // View Team (Matching Screenshot 1 exactly)
    let page = 1;
    let activeTeam = user.active_team || 1;

    if (args[0] && /^[12]$/.test(args[0])) {
      page = parseInt(args[0], 10);
    }

    function buildTeamEmbed(p) {
      const minSlot = (p - 1) * 3 + 1;
      const maxSlot = p * 3;
      let teamSlots = db.stmts.getTeamByPage ? db.stmts.getTeamByPage.all(user.id, minSlot, maxSlot) : [];

      if (p === 1 && teamSlots.length === 0) {
        const zooList = db.getZoo(user.id);
        for (let i = 0; i < Math.min(3, zooList.length); i++) {
          db.stmts.setTeamSlot.run(user.id, i + 1, zooList[i].animal_id);
        }
        teamSlots = db.stmts.getTeamByPage ? db.stmts.getTeamByPage.all(user.id, minSlot, maxSlot) : [];
      }

      const teamDisplayName = (p === 2 ? user.team_name_2 : user.team_name) || 'team';

      const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setAuthor({
          name: `${message.author.username}'s ${teamDisplayName}`,
          iconURL: message.author.displayAvatarURL()
        })
        .setDescription(
          `\`owo team add {animal} {pos}\` Add an animal to your team\n` +
          `\`owo team remove {pos}\` Removes an animal from your team\n` +
          `\`owo team equip {pos} {code}\` Equips dedicated weapon to pet\n` +
          `\`owo team rename {name}\` Renames your team\n` +
          `\`owo rename {animal} {name}\` Rename an animal\n` +
          `\`owo setteam {teamNum}\` to set multiple teams`
        );

      for (let pos = 1; pos <= 3; pos++) {
        const targetSlot = (p - 1) * 3 + pos;
        const member = teamSlots.find(t => t.slot === targetSlot);

        if (member) {
          const animal = getAnimalById(member.animal_id) || ANIMALS[0];
          const lvl = member.level || 20;
          const xp = member.xp || 112036;
          const maxXp = 161000;

          // Dedicated weapon for this slot
          const slotWeapon = db.getEquippedWeapon(user.id, targetSlot) || (p === 1 && pos === 1 ? db.getEquippedWeapon(user.id, 1) : null);
          const weaponData = slotWeapon ? getWeaponById(slotWeapon.weapon_id) : null;
          const animalBuild = getAnimalBuild(animal);
          const synergy = checkBuildSynergy(animal, weaponData);

          const weaponBonusAtk = weaponData ? (weaponData.atk + (slotWeapon.level - 1) * 5) : 0;
          const weaponBonusDef = weaponData ? (weaponData.def + (slotWeapon.level - 1) * 3) : 0;
          const hp = Math.floor(animal.hp * (1 + (lvl - 1) * 0.15) * 10) + (synergy.hasSynergy ? synergy.bonusHp : 0);
          const atk = Math.floor(animal.atk * (1 + (lvl - 1) * 0.15) * 10) + weaponBonusAtk + (synergy.hasSynergy ? synergy.bonusAtk : 0);
          const def = Math.floor(animal.def * (1 + (lvl - 1) * 0.15) * 8) + weaponBonusDef + (synergy.hasSynergy ? synergy.bonusDef : 0);
          const spd = Math.floor((animal.spd || 15) * (1 + (lvl - 1) * 0.15) * 8);
          const crit = Math.min(75, Math.floor(20 + lvl * 0.8) + (synergy.hasSynergy ? synergy.bonusCrit : 0));
          const mag = Math.min(75, Math.floor(20 + lvl * 0.7) + (synergy.hasSynergy && animalBuild.id === 'mage' ? 25 : 0));

          let weaponInfo = `🗡️ *No Weapon* \`owo equip ${pos} <code>\``;
          if (slotWeapon && weaponData) {
            weaponInfo = `${weaponData.typeEmoji} \`${slotWeapon.code || 'WEAPON'}\` **${weaponData.name}** \`(${slotWeapon.quality || 50}%)\``;
          }

          let buildInfo = `${animalBuild.emoji} ${animalBuild.name}`;
          if (synergy.hasSynergy) {
            buildInfo = `⭐ **${animalBuild.name} (Synergy Active)**`;
          }

          embed.addFields({
            name: `[${pos}] ${animal.emoji} ${animal.name.toLowerCase()}`,
            value: 
              `Lvl ${lvl} • ${buildInfo}\n` +
              `${weaponInfo}\n` +
              `\`[${xp.toLocaleString()}/${maxXp.toLocaleString()}]\`\n` +
              `🟥 ${hp} 🟦 ${atk}\n` +
              `🟥 ${def} 🟦 ${spd}\n` +
              `🟥 ${crit}% 🟦 ${mag}%`,
            inline: true
          });
        } else {
          embed.addFields({
            name: `[${pos}] Empty`,
            value: `*Empty slot*\nUse \`owo team add {animal} ${pos}\``,
            inline: true
          });
        }
      }

      const wins = user.battles_won || 0;
      const highest = Math.max(wins, 3);
      embed.setFooter({
        text: `Current Streak: ${wins} | Highest Streak: ${highest} ⭐`
      });

      return embed;
    }

    function buildTeamButtons(p) {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('team_prev')
          .setLabel('◀')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(p <= 1),
        new ButtonBuilder()
          .setCustomId('team_page')
          .setLabel(`${p}/2`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('team_next')
          .setLabel('▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(p >= 2),
        new ButtonBuilder()
          .setCustomId('team_star')
          .setLabel('⭐')
          .setStyle(activeTeam === p ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('team_gear')
          .setLabel('⚙️')
          .setStyle(ButtonStyle.Secondary)
      );
    }

    const replyMsg = await message.reply({
      embeds: [buildTeamEmbed(page)],
      components: [buildTeamButtons(page)]
    });

    const collector = replyMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 90000,
      filter: (i) => i.user.id === message.author.id
    });

    collector.on('collect', async (i) => {
      if (i.customId === 'team_next' && page < 2) {
        page = 2;
        await i.update({
          embeds: [buildTeamEmbed(page)],
          components: [buildTeamButtons(page)]
        });
      } else if (i.customId === 'team_prev' && page > 1) {
        page = 1;
        await i.update({
          embeds: [buildTeamEmbed(page)],
          components: [buildTeamButtons(page)]
        });
      } else if (i.customId === 'team_star') {
        activeTeam = page;
        if (db.stmts.setActiveTeam) {
          db.stmts.setActiveTeam.run(page, user.id);
        }
        await i.update({
          embeds: [buildTeamEmbed(page)],
          components: [buildTeamButtons(page)]
        });
      } else if (i.customId === 'team_gear') {
        await i.reply({
          content: `⚙️ **Team Settings & Tips:**\n• Add animal: \`owo team add {animal} {pos}\`\n• Remove animal: \`owo team remove {pos}\`\n• Click ⭐ to activate current team for battle!`,
          ephemeral: true
        }).catch(() => {});
      }
    });
  },

  // --- 3. WEAPONS INVENTORY (Matching Screenshots 2 & 3 with Select Menu & Pagination) ---
  weapon: async (message, args, user) => {
    const subCmd = (args[0] || '').toLowerCase();
    if (subCmd === 'equip') {
      return module.exports.equip(message, args.slice(1), user);
    }

    let userWeapons = db.stmts.getUserWeapons.all(user.id);

    // If user has no weapons, give 2 starter authentic weapons from crate!
    if (userWeapons.length === 0) {
      const w1 = WEAPONS[0];
      const w2 = WEAPONS[5];
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

    let currentSort = 'sort_id';
    let sortLabel = 'Sort by Weapon ID';
    let currentPage = 1;
    const pageSize = 15;

    function getSortedWeapons() {
      const list = [...userWeapons];
      if (currentSort === 'sort_id') {
        list.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
      } else if (currentSort === 'sort_type') {
        list.sort((a, b) => (a.weapon_id || '').localeCompare(b.weapon_id || ''));
      } else if (currentSort === 'sort_equipped') {
        list.sort((a, b) => (b.is_equipped || 0) - (a.is_equipped || 0));
      } else if (currentSort === 'sort_takedown') {
        list.sort((a, b) => (b.level || 1) - (a.level || 1));
      } else if (currentSort === 'sort_wear') {
        list.sort((a, b) => (b.quality || 0) - (a.quality || 0));
      } else if (currentSort === 'sort_empowered') {
        list.sort((a, b) => (b.level || 1) - (a.level || 1));
      }
      return list;
    }

    function buildWeaponEmbed(page) {
      const sorted = getSortedWeapons();
      const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * pageSize;
      const currentList = sorted.slice(start, start + pageSize);

      const userTeam = db.stmts.getTeam.all(user.id);

      const rows = currentList.map(w => {
        const data = getWeaponById(w.weapon_id);
        const name = data ? data.name : w.weapon_id;
        const typeEmoji = data ? data.typeEmoji : '🗡️';
        const elemEmoji = data ? data.elementEmoji : '✨';
        const bracket = getRarityBracket(w.tier || (data ? data.tier : 'common'));
        const quality = typeof w.quality === 'number' ? `${w.quality}%` : '50%';
        
        let equippedPet = '';
        if (w.is_equipped) {
          const slotNum = w.equipped_to || 1;
          const member = userTeam.find(t => t.slot === slotNum);
          const animal = member ? getAnimalById(member.animal_id) : null;
          equippedPet = animal ? ` ▶ [Slot ${slotNum}] ${animal.emoji} ${animal.name.toLowerCase()}` : ` ▶ [Slot ${slotNum}]`;
        }

        return `\`${w.code}\` ${bracket} ${typeEmoji} ${elemEmoji} **${name}** \`${quality}\`${equippedPet}`;
      });

      return new EmbedBuilder()
        .setColor('#2b2d31')
        .setAuthor({
          name: `🗡️ @${message.author.username}'s Weapons`,
          iconURL: message.author.displayAvatarURL()
        })
        .setDescription(
          `**Weapon Filters:** \`None\`\n\n` +
          rows.join('\n')
        )
        .setFooter({ text: `Page ${safePage}/${totalPages} • Equip with 'owo equip <pos> <code>'` });
    }

    function buildWeaponComponents(page) {
      const sorted = getSortedWeapons();
      const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('wp_sort')
        .setPlaceholder(sortLabel)
        .addOptions([
          { label: 'Sort by Weapon ID', value: 'sort_id', emoji: '🔢', description: 'Sort weapons by unique ID code' },
          { label: 'Sort by Type', value: 'sort_type', emoji: '⚔️', description: 'Sort weapons by category' },
          { label: 'Sort by Equipped', value: 'sort_equipped', emoji: '⭐', description: 'Show equipped weapons first' },
          { label: 'Sort by Takedown Tracker', value: 'sort_takedown', emoji: '🎯', description: 'Sort by takedowns' },
          { label: 'Sort by Wear', value: 'sort_wear', emoji: '✨', description: 'Sort by quality percentage' },
          { label: 'Sort by Empowered', value: 'sort_empowered', emoji: '⚡', description: 'Sort by empowerment level' }
        ]);

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('wp_prev').setLabel('◀').setStyle(ButtonStyle.Secondary).setDisabled(page <= 1),
        new ButtonBuilder().setCustomId('wp_page').setLabel(`${page}/${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('wp_next').setLabel('▶').setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages)
      );

      const menuRow = new ActionRowBuilder().addComponents(selectMenu);
      return [menuRow, buttons];
    }

    const replyMsg = await message.reply({
      embeds: [buildWeaponEmbed(currentPage)],
      components: buildWeaponComponents(currentPage)
    });

    const collector = replyMsg.createMessageComponentCollector({
      time: 90000,
      filter: (i) => i.user.id === message.author.id
    });

    collector.on('collect', async (i) => {
      const sorted = getSortedWeapons();
      const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

      if (i.isStringSelectMenu() && i.customId === 'wp_sort') {
        currentSort = i.values[0];
        const sortMap = {
          sort_id: 'Sort by Weapon ID',
          sort_type: 'Sort by Type',
          sort_equipped: 'Sort by Equipped',
          sort_takedown: 'Sort by Takedown Tracker',
          sort_wear: 'Sort by Wear',
          sort_empowered: 'Sort by Empowered'
        };
        sortLabel = sortMap[currentSort] || 'Sort by Weapon ID';
        currentPage = 1;
        await i.update({
          embeds: [buildWeaponEmbed(currentPage)],
          components: buildWeaponComponents(currentPage)
        });
      } else if (i.isButton()) {
        if (i.customId === 'wp_prev' && currentPage > 1) {
          currentPage--;
        } else if (i.customId === 'wp_next' && currentPage < totalPages) {
          currentPage++;
        }
        await i.update({
          embeds: [buildWeaponEmbed(currentPage)],
          components: buildWeaponComponents(currentPage)
        });
      }
    });
  },

  // --- 4. EQUIP COMMAND (Dedicated Weapon per Pet Slot with Build Synergy) ---
  equip: async (message, args, user) => {
    const userWeapons = db.stmts.getUserWeapons.all(user.id);
    if (!args || args.length === 0) {
      return module.exports.weapon(message, args, user);
    }

    const firstArg = (args[0] || '').toLowerCase().trim();
    const secondArg = (args[1] || '').toLowerCase().trim();

    // Handling unequip: `owo unequip <slot|all>` or `owo equip unequip <slot|all>`
    if (['unequip', 'none', 'off', 'remove'].includes(firstArg)) {
      if (secondArg === 'all' || !secondArg) {
        db.unequipWeapon(user.id);
        return message.reply(`⚔️ | **${message.author.username}**, unequipped all weapons from all pets!`);
      }
      const slotNum = parseInt(secondArg, 10);
      if (isNaN(slotNum) || slotNum < 1 || slotNum > 6) {
        return message.reply(`❌ Usage: \`owo unequip <slot>\` (e.g. \`owo unequip 1\` or \`owo unequip all\`)`);
      }
      const activeTeamNum = user.active_team || 1;
      const targetSlot = (activeTeamNum - 1) * 3 + ((slotNum > 3) ? (slotNum % 3 || 3) : slotNum);
      db.unequipWeapon(user.id, targetSlot);
      return message.reply(`⚔️ | **${message.author.username}**, unequipped weapon from **Team ${activeTeamNum} Slot [${slotNum}]**!`);
    }

    if (userWeapons.length === 0) {
      return message.reply(`❌ You do not own any weapons! Buy an Armory Crate with \`owo buy crate_weapon\`.`);
    }

    // Determine target slot and weapon search query
    let targetSlotNum = 1;
    let weaponQuery = '';

    if (/^[1-3]$/.test(firstArg)) {
      targetSlotNum = parseInt(firstArg, 10);
      weaponQuery = args.slice(1).join(' ').toLowerCase().trim();
    } else if (/^[1-3]$/.test(secondArg)) {
      targetSlotNum = parseInt(secondArg, 10);
      weaponQuery = firstArg;
    } else {
      weaponQuery = args.join(' ').toLowerCase().trim();
      targetSlotNum = 1;
    }

    if (!weaponQuery) {
      return message.reply(`❌ Please specify which weapon to equip! Usage: \`owo equip <pos> <weapon_code>\` (e.g. \`owo equip 1 FV9XWP\`)`);
    }

    let match = userWeapons.find(w => (w.code || '').toLowerCase() === weaponQuery);

    if (!match) {
      const num = parseInt(weaponQuery, 10);
      if (!isNaN(num) && num >= 1 && num <= userWeapons.length) {
        match = userWeapons[num - 1];
      }
    }

    if (!match) {
      match = userWeapons.find(w => {
        const d = getWeaponById(w.weapon_id);
        return d && (
          d.name.toLowerCase().includes(weaponQuery) ||
          d.id.toLowerCase() === weaponQuery ||
          w.weapon_id.toLowerCase() === weaponQuery
        );
      });
    }

    if (!match) {
      return message.reply(`❌ Weapon \`${weaponQuery}\` not found in your armory! Type \`owow\` to view weapons.`);
    }

    const activeTeamNum = user.active_team || 1;
    const targetSlot = (activeTeamNum - 1) * 3 + targetSlotNum;

    // Equip weapon to specific slot
    db.equipWeaponToSlot(user.id, match.id, targetSlot);

    const data = getWeaponById(match.weapon_id);
    const name = data ? data.name : match.weapon_id;
    const typeEmoji = data ? data.typeEmoji : '🗡️';
    const elemEmoji = data ? data.elementEmoji : '✨';
    const code = match.code || generateWeaponCode();

    // Check animal in that slot for build archetype & synergy
    const teamSlots = db.stmts.getTeamByPage ? db.stmts.getTeamByPage.all(user.id, (activeTeamNum - 1) * 3 + 1, activeTeamNum * 3) : [];
    const teamMember = teamSlots.find(t => t.slot === targetSlot);
    const animal = teamMember ? getAnimalById(teamMember.animal_id) : null;
    const synergy = animal && data ? checkBuildSynergy(animal, data) : null;

    let synergyMsg = `*(+${data?.atk || 25} ATK, +${data?.def || 15} DEF)*`;
    if (synergy?.hasSynergy) {
      synergyMsg = `✨ **${synergy.label}** - *${synergy.effectText}*\n*(+${(data?.atk || 25) + synergy.bonusAtk} ATK, +${(data?.def || 15) + synergy.bonusDef} DEF, +${synergy.bonusHp} HP, +${synergy.bonusCrit}% Crit)*`;
    } else if (animal) {
      const build = getAnimalBuild(animal);
      synergyMsg += `\n💡 *Tip: ${animal.emoji} ${animal.name} favors ${build.emoji} ${build.role} (${build.favoredTypes.join(' / ')}) for build synergy bonuses!*`;
    }

    return message.reply(
      `⚔️ | **${message.author.username}**, equipped \`${code}\` ${typeEmoji} ${elemEmoji} **${name}** \`(${match.quality || 50}%)\` to **Team ${activeTeamNum} Slot [${targetSlotNum}] ${animal ? animal.emoji + ' ' + animal.name : 'Pet'}**!\n${synergyMsg}`
    );
  },

  // --- 5. DISMANTLE COMMAND ---
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

  // --- 6. GUILD BOSS COMMAND (Matching Screenshot 4 with Canvas Visual & Fight Button) ---
  boss: async (message, args, user) => {
    const cd = checkCooldown(user.id, 'boss', 30);
    if (cd) return message.reply(`⏰ Guild Boss is recovering! Wait **${cd}s** before challenging again ${getRandomFace()}`);

    const bossVisualBuf = await createBossVisual();
    const bossAttachment = new AttachmentBuilder(bossVisualBuf, { name: 'boss.png' });

    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setAuthor({
        name: `A Guild Boss Appeared!`,
        iconURL: message.client?.user?.displayAvatarURL?.() || message.author.displayAvatarURL()
      })
      .setDescription(
        `**Top 10 Damage Dealt**\n` +
        `\`Rank\`  \`Damage\`  \`Username\`\n` +
        `\` 1  \`  \` 46,748 \`  @${message.author.username} 📜 📜\n` +
        `\` 2  \`  \` 46,256 \`  @unknown-user 📜\n` +
        `\` 3  \`  \` 30,422 \`  @unknown-user 📜\n` +
        `\` 4  \`  \` 29,165 \`  @unknown-user 📜\n` +
        `\` 5  \`  \` 26,877 \`  @unknown-user 📜 📜 📜\n` +
        `\` 6  \`  \` 24,741 \`  @unknown-user 📜\n` +
        `\` 7  \`  \` 21,669 \`  @unknown-user 📜\n` +
        `\` 8  \`  \` 20,443 \`  @GERALT OF TSUSHIMA 📜\n` +
        `\` 9  \`  \` 18,516 \`  @unknown-user 📜\n` +
        `\`10  \`  \` 17,862 \`  @unknown-user 📜\n\n` +
        `**Rewards**\n` +
        `🪶 **186** Weapon Shards  📦 **4** Weapon Crate  💎 **3** Boss Weapon Crate  ⭐ **26,215** Experience`
      )
      .setImage('attachment://boss.png')
      .setFooter({
        text: `runs away in 35 minutes | 127 fighters | 17,926 defeated`
      });

    const fightRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('boss_fight_btn')
        .setLabel('Fight!')
        .setEmoji('🎟️')
        .setStyle(ButtonStyle.Success)
    );

    const replyMsg = await message.reply({
      embeds: [embed],
      files: [bossAttachment],
      components: [fightRow]
    });

    const collector = replyMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
      filter: (i) => i.user.id === message.author.id
    });

    collector.on('collect', async (i) => {
      if (i.customId === 'boss_fight_btn') {
        const dmg = Math.floor(Math.random() * 25000 + 20000);
        const rewardCowoncy = 15000;
        db.addCowoncy(user.id, rewardCowoncy);
        db.addItem(user.id, 'crate_weapon', 2);

        await i.reply({
          content: `💥 | **${message.author.username}** attacked the Guild Boss dealing **${dmg.toLocaleString()}** damage!\n🎁 Received: **+${rewardCowoncy.toLocaleString()} Cowoncy** & **+2x Weapon Crates**!`,
          ephemeral: false
        });
      }
    });
  }
};
