const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database/db');
const { ANIMALS, TIER_INFO, getAnimalById, getRandomAnimals } = require('../../database/data/animals');
const { getRandomFace } = require('../../database/data/dialogue');
const { checkCooldown } = require('../handlers/cooldownHandler');

module.exports = {
  hunt: async (message, args, user) => {
    const cd = checkCooldown(user.id, 'hunt', 15);
    if (cd) {
      return message.reply(`⏰ Slow down hunter! Please wait **${cd}s** before hunting again ${getRandomFace()}`);
    }

    const now = Math.floor(Date.now() / 1000);
    const hasLuck = (user.luck_boost_until || 0) > now;
    const luckBonus = hasLuck ? 1.5 : 0;

    // Number of animals caught
    let animalCount = 1;
    if (user.bait_charges > 0) {
      animalCount = 3;
    } else {
      const roll = Math.random();
      if (roll < 0.25) animalCount = 1;
      else if (roll < 0.80) animalCount = 2;
      else animalCount = 3;
    }

    const caught = getRandomAnimals(animalCount, luckBonus);
    
    // Check if new to user's zoo
    const existingZoo = db.getZoo(user.id);
    const existingMap = new Map(existingZoo.map(z => [z.animal_id, z.count]));

    const caughtDisplay = [];
    let gotEpicOrHigher = false;

    const tierBadges = {
      common: '`[C]`',
      uncommon: '`[U]`',
      rare: '`[R]`',
      epic: '`[E]`',
      legendary: '`[L]`',
      mythical: '`[M]`',
      fabled: '`[F]`',
      hidden: '`[H]`',
      gem: '`[G]`',
      bot: '`[B]`',
      distorted: '`[D]`',
      patreon: '`[P]`',
      special: '`[S]`'
    };

    for (const animal of caught) {
      const isNew = !existingMap.has(animal.id);
      const badge = tierBadges[animal.tier] || '`[C]`';
      let text = `${badge} ${animal.emoji} **${animal.name}**`;
      if (isNew) text += ' `[NEW!]`';
      if (['epic', 'legendary', 'mythical', 'fabled', 'hidden', 'gem', 'bot', 'distorted', 'patreon', 'special'].includes(animal.tier)) {
        text += ` ✨*(${animal.tier.toUpperCase()})*`;
        gotEpicOrHigher = true;
      }
      caughtDisplay.push(text);
    }

    // Save to database
    db.recordHunt(user.id, caught);
    db.updateQuestProgress(user.id, 'hunt');

    // Rare bonus drop (10% chance)
    let bonusDrop = null;
    if (Math.random() < 0.10) {
      if (Math.random() < 0.6) {
        db.addItem(user.id, 'crate_common', 1);
        bonusDrop = '📦 Found a **Common Crate** hidden in the bushes!';
      } else {
        db.addItem(user.id, 'crate_rare', 1);
        bonusDrop = '🎁 Found a **Rare Crate** buried in the earth!';
      }
    }

    // Check for level up
    const updatedUser = db.getUser(user.id);
    const xpNeeded = updatedUser.level * 100;
    let levelUpMsg = '';
    if (updatedUser.xp >= xpNeeded) {
      const newLevel = updatedUser.level + 1;
      const cowoncyReward = newLevel * 500;
      db.stmts.setLevel.run(newLevel, user.id);
      db.addCowoncy(user.id, cowoncyReward);
      levelUpMsg = `\n🎉 **LEVEL UP!** You reached **Level ${newLevel}**! Earned \`+${cowoncyReward.toLocaleString()} Cowoncy\`!`;
    }

    const textSummary = `🌿 | **${message.author.username}** went into the woods and found: ${caughtDisplay.join(', ')}!`;
    const bonusText = bonusDrop ? `\n✨ ${bonusDrop}` : '';
    const levelText = levelUpMsg ? `\n${levelUpMsg}` : '';

    return message.reply(`${textSummary}${bonusText}${levelText}`);
  },

  zoo: async (message, args, user) => {
    const targetUser = (message.mentions?.users && typeof message.mentions.users.first === 'function' ? message.mentions.users.first() : null) || message.author;
    const avatar = typeof targetUser.displayAvatarURL === 'function' ? targetUser.displayAvatarURL() : '';
    const targetData = db.getUser(targetUser.id, targetUser.username, avatar);
    const zooList = db.getZoo(targetUser.id);

    const zooMap = new Map(zooList.map(z => [z.animal_id, z.count]));
    const totalAnimals = zooList.reduce((acc, curr) => acc + curr.count, 0);
    const uniqueAnimals = zooList.length;

    // Tier display order (rarest first)
    const tierOrder = ['distorted', 'gem', 'patreon', 'bot', 'hidden', 'fabled', 'mythical', 'legendary', 'special', 'epic', 'rare', 'uncommon', 'common'];

    // Build pages — one page per tier that has animals
    const pages = [];
    for (const tier of tierOrder) {
      const tierAnimals = ANIMALS.filter(a => a.tier === tier);
      if (tierAnimals.length === 0) continue;

      const tierMeta = TIER_INFO[tier];
      const collected = tierAnimals.filter(a => zooMap.has(a.id));
      const tierProgress = `${collected.length}/${tierAnimals.length}`;

      // Build animal lines — show ALL animals, locked ones as ???
      const lines = tierAnimals.map(a => {
        const count = zooMap.get(a.id);
        if (count && count > 0) {
          return `${a.emoji} **${a.name}** \`x${count}\``;
        } else {
          return `❓ ~~???~~ \`locked\``;
        }
      });

      pages.push({
        tier,
        tierName: tierMeta.name,
        color: tierMeta.color,
        progress: tierProgress,
        lines,
        collectedCount: collected.length,
        totalCount: tierAnimals.length,
      });
    }

    // Build embed for a given page
    function buildZooPage(pageIdx) {
      const pg = pages[pageIdx];
      const pctNum = Math.floor((pg.collectedCount / pg.totalCount) * 100);
      const filled = Math.round(pctNum / 10);
      const bar = '▓'.repeat(filled) + '░'.repeat(10 - filled);

      const embed = new EmbedBuilder()
        .setColor(pg.color)
        .setTitle(`🐾 ${targetData.username}'s Zoo — ${pg.tierName}`)
        .setDescription(
          `🏆 **Overall:** \`${uniqueAnimals}/${ANIMALS.length}\` discovered (\`${((uniqueAnimals / ANIMALS.length) * 100).toFixed(1)}%\`)\n` +
          `📦 **Total:** \`${totalAnimals.toLocaleString()}\` animals\n` +
          `──────────────────────────\n\n` +
          `**${pg.tierName} Progress:** \`${pg.progress}\` (${pctNum}%)\n` +
          `\`[${bar}]\`\n\n` +
          pg.lines.join('\n') +
          `\n\nPage ${pageIdx + 1}/${pages.length}`
        )
        .setFooter({ text: `Use arrows to browse tiers • owo hunt to catch more!` });

      return embed;
    }

    function buildZooButtons(pageIdx) {
      const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`zoo_prev_${message.author.id}_${pageIdx}`)
          .setEmoji('◀️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pageIdx === 0),
        new ButtonBuilder()
          .setCustomId(`zoo_info_${message.author.id}_${pageIdx}`)
          .setLabel(`${pages[pageIdx].tierName} (${pageIdx + 1}/${pages.length})`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`zoo_next_${message.author.id}_${pageIdx}`)
          .setEmoji('▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pageIdx === pages.length - 1),
      );
    }

    if (pages.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#8a7ff8')
        .setTitle(`🐾 ${targetData.username}'s Zoo Collection ${getRandomFace()}`)
        .setDescription(`Your zoo is currently empty! Use \`owo hunt\` to catch your first animal! ${getRandomFace()}`);
      return message.reply({ embeds: [embed] });
    }

    // Start on common page (last page = easiest to collect first)
    let currentPage = pages.length - 1;

    // If user passes a tier name, jump to that page
    const tierArg = (args[0] || '').toLowerCase();
    if (tierArg && !message.mentions?.users?.first()) {
      const foundIdx = pages.findIndex(p => p.tier.startsWith(tierArg) || p.tierName.toLowerCase().startsWith(tierArg));
      if (foundIdx !== -1) currentPage = foundIdx;
    }

    const embed = buildZooPage(currentPage);
    const row = buildZooButtons(currentPage);
    const sentMsg = await message.reply({ embeds: [embed], components: [row] });

    const { ComponentType } = require('discord.js');
    const collector = sentMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: `This isn't your zoo! Use \`owo zoo\` to view yours.`, ephemeral: true });
      }

      const action = interaction.customId.split('_')[1];
      if (action === 'prev' && currentPage > 0) currentPage--;
      else if (action === 'next' && currentPage < pages.length - 1) currentPage++;

      await interaction.update({
        embeds: [buildZooPage(currentPage)],
        components: [buildZooButtons(currentPage)],
      });
    });

    collector.on('end', async () => {
      try {
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('zoo_prev_x').setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(true),
          new ButtonBuilder().setCustomId('zoo_info_x').setLabel(`${pages[currentPage].tierName}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
          new ButtonBuilder().setCustomId('zoo_next_x').setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(true),
        );
        await sentMsg.edit({ components: [disabledRow] });
      } catch (e) {}
    });
  },


  sell: async (message, args, user) => {
    const target = (args[0] || '').toLowerCase();
    if (!target) {
      return message.reply(
        `❌ What would you like to sell? Examples:\n` +
        `• \`owo sell all\` - Sells all duplicate animals (keeps 1 of each)\n` +
        `• \`owo sell common\` - Sells duplicate common animals\n` +
        `• \`owo sell dog\` - Sells 1 Dog\n` +
        `• \`owo sell dog 5\` - Sells 5 Dogs`
      );
    }

    const zooList = db.getZoo(user.id);
    if (!zooList || zooList.length === 0) {
      return message.reply(`You have no animals to sell! Go hunt first with \`owo hunt\` ${getRandomFace()}`);
    }

    let totalSold = 0;
    let cowoncyEarned = 0;

    if (target === 'all' || ['common', 'uncommon', 'rare', 'epic'].includes(target)) {
      for (const entry of zooList) {
        const animal = getAnimalById(entry.animal_id);
        if (!animal) continue;
        if (target !== 'all' && animal.tier !== target) continue;

        // Keep 1 copy, sell the rest
        if (entry.count > 1) {
          const toSell = entry.count - 1;
          const price = TIER_INFO[animal.tier]?.sellPrice || 10;
          db.removeZooAnimal(user.id, animal.id, toSell);
          totalSold += toSell;
          cowoncyEarned += toSell * price;
        }
      }

      if (totalSold === 0) {
        return message.reply(`No duplicate animals found to sell! (We always keep at least 1 of each in your zoo collection).`);
      }

      db.addCowoncy(user.id, cowoncyEarned);
      const embed = new EmbedBuilder()
        .setColor('#ffcc00')
        .setDescription(`💰 Sold **${totalSold.toLocaleString()}** duplicate animals for **+${cowoncyEarned.toLocaleString()} Cowoncy**! ${getRandomFace()}`);
      return message.reply({ embeds: [embed] });
    }

    // Specific animal
    const animal = getAnimalById(target);
    if (!animal) {
      return message.reply(`❌ Unknown animal \`${target}\`! Please check spelling or use \`owo zoo\`.`);
    }

    const currentEntry = zooList.find(z => z.animal_id === animal.id);
    if (!currentEntry || currentEntry.count <= 0) {
      return message.reply(`You don't own any ${animal.emoji} **${animal.name}**!`);
    }

    const countToSell = parseInt(args[1], 10) || 1;
    if (countToSell > currentEntry.count) {
      return message.reply(`You only have **${currentEntry.count}** ${animal.emoji} ${animal.name}!`);
    }

    const price = (TIER_INFO[animal.tier]?.sellPrice || 10) * countToSell;
    db.removeZooAnimal(user.id, animal.id, countToSell);
    db.addCowoncy(user.id, price);

    const embed = new EmbedBuilder()
      .setColor('#ffcc00')
      .setDescription(`💰 Sold **${countToSell}x** ${animal.emoji} **${animal.name}** for **+${price.toLocaleString()} Cowoncy**!`);
    return message.reply({ embeds: [embed] });
  },

  sacrifice: async (message, args, user) => {
    const target = (args[0] || '').toLowerCase();
    if (!target) {
      return message.reply(`❌ Usage: \`owo sacrifice all\` or \`owo sacrifice <animal>\` to convert animals into magical Essence 🔮!`);
    }

    const zooList = db.getZoo(user.id);
    let totalEssence = 0;
    let totalSacrificed = 0;

    if (target === 'all') {
      for (const entry of zooList) {
        const animal = getAnimalById(entry.animal_id);
        if (!animal) continue;
        if (entry.count > 1) {
          const toSacrifice = entry.count - 1;
          const essence = (TIER_INFO[animal.tier]?.sacrificeEssence || 1) * toSacrifice;
          db.removeZooAnimal(user.id, animal.id, toSacrifice);
          totalSacrificed += toSacrifice;
          totalEssence += essence;
        }
      }
      if (totalSacrificed === 0) {
        return message.reply(`You don't have any duplicate animals to sacrifice!`);
      }
    } else {
      const animal = getAnimalById(target);
      if (!animal) return message.reply(`❌ Animal not found!`);
      const entry = zooList.find(z => z.animal_id === animal.id);
      if (!entry || entry.count <= 1) {
        return message.reply(`You don't have duplicate copies of ${animal.emoji} ${animal.name} to sacrifice!`);
      }
      const toSacrifice = 1;
      totalEssence = TIER_INFO[animal.tier]?.sacrificeEssence || 1;
      totalSacrificed = 1;
      db.removeZooAnimal(user.id, animal.id, toSacrifice);
    }

    db.addItem(user.id, 'essence', totalEssence);

    const embed = new EmbedBuilder()
      .setColor('#9c27b0')
      .setDescription(`🔮 Sacrificed **${totalSacrificed}** animal(s) and received **${totalEssence.toLocaleString()} Magical Essence**! Use essence in \`owo weapon\` upgrades.`);
    return message.reply({ embeds: [embed] });
  },

  display: async (message, args, user) => {
    const animalName = args[0];
    if (!animalName) {
      return message.reply(`❌ Specify which animal you want as your mascot! e.g. \`owo display dragon\` or \`owo display 🦊\``);
    }

    const animal = getAnimalById(animalName);
    if (!animal) {
      return message.reply(`❌ Could not find animal \`${animalName}\`!`);
    }

    const zooList = db.getZoo(user.id);
    const hasAnimal = zooList.some(z => z.animal_id === animal.id && z.count > 0);
    if (!hasAnimal) {
      return message.reply(`You don't own a ${animal.emoji} **${animal.name}** in your zoo yet! Catch one first!`);
    }

    db.stmts.setDisplayAnimal.run(animal.emoji, user.id);
    return message.reply(`✨ Your display mascot is now set to ${animal.emoji} **${animal.name}**! It will appear on your profile!`);
  },

  // --- OWODEX (Compendium of all species) ---
  owodex: async (message, args, user) => {
    const zooList = db.getZoo(user.id);
    const zooMap = new Map(zooList.map(z => [z.animal_id, z.count]));

    const tiers = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical', 'fabled', 'hidden', 'gem', 'bot', 'distorted', 'patreon', 'special'];
    const tierSummaries = [];

    let totalCaughtSpecies = 0;

    for (const tier of tiers) {
      const allInTier = ANIMALS.filter(a => a.tier === tier);
      const caughtInTier = allInTier.filter(a => zooMap.has(a.id)).length;
      totalCaughtSpecies += caughtInTier;

      const pct = Math.floor((caughtInTier / allInTier.length) * 100);
      const filled = Math.round(pct / 10);
      const bar = '`[' + '▓'.repeat(filled) + '░'.repeat(10 - filled) + ']`';

      tierSummaries.push(
        `**${TIER_INFO[tier].name}:** \`${caughtInTier}/${allInTier.length}\` (${pct}%)\n${bar}`
      );
    }

    const overallPct = Math.floor((totalCaughtSpecies / ANIMALS.length) * 100);

    const embed = new EmbedBuilder()
      .setColor('#00e5ff')
      .setTitle(`📖 ${message.author.username}'s OwODex ${getRandomFace()}`)
      .setDescription(
        `**Overall Completion:** \`${totalCaughtSpecies}/${ANIMALS.length}\` species (**${overallPct}%**)\n\n` +
        tierSummaries.join('\n\n')
      )
      .setFooter({ text: `Catch more species using 'owo hunt' or opening crates!` });

    return message.reply({ embeds: [embed] });
  },

  // --- AUTOHUNT ---
  autohunt: async (message, args, user) => {
    const baitRemaining = user.bait_charges || 0;
    const now = Math.floor(Date.now() / 1000);
    const hasLuck = (user.luck_boost_until || 0) > now;

    const embed = new EmbedBuilder()
      .setColor('#8a7ff8')
      .setTitle(`🤖 AutoHunt Status & Hunter Lodge ${getRandomFace()}`)
      .setDescription(
        `⚡ **AutoHunt Mode:** \`Active\`\n` +
        `🥩 **Golden Bait Charges:** \`${baitRemaining} remaining\`\n` +
        `💎 **Fortune Gem Boost:** \`${hasLuck ? 'Active (+50% Luck)' : 'Inactive'}\`\n\n` +
        `*Buy Golden Bait with \`owo buy bait\` to lure 3 animals per hunt!*`
      );

    return message.reply({ embeds: [embed] });
  },

  // --- RENAME ---
  rename: async (message, args, user) => {
    const raw = args.join(' ');
    if (!raw) {
      return message.reply(`❌ Usage: \`owo rename <animal> <nickname>\` or \`owo team rename <name>\``);
    }

    const words = raw.split(/ +/);
    const target = words[0];
    const newName = words.slice(1).join(' ').trim();

    if (!newName) {
      return message.reply(`❌ Please provide a new nickname for ${target}!`);
    }

    if (target.toLowerCase() === 'team') {
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

    return message.reply(`✨ Successfully renamed **${target}** to **${newName}**! ${getRandomFace()}`);
  }
};
