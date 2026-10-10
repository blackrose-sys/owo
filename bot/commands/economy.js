const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database/db');
const { getRandomFace, owoify, getCowoncyEmoji } = require('../../database/data/dialogue');
const { checkCooldown } = require('../handlers/cooldownHandler');

function getMentionedUser(message) {
  if (message.mentions?.users) {
    if (typeof message.mentions.users.first === 'function') {
      const u = message.mentions.users.first();
      if (u) return u;
    }
    if (typeof message.mentions.users.values === 'function') {
      const u = message.mentions.users.values().next().value;
      if (u) return u;
    }
  }
  return null;
}

module.exports = {
  daily: async (message, args, user) => {
    const cd = checkCooldown(user.id, 'daily', 86400); // 24 hours
    const now = Math.floor(Date.now() / 1000);

    // Also check database timestamp for daily
    const hoursSinceLast = (now - (user.last_daily || 0)) / 3600;
    if (hoursSinceLast < 24) {
      const remainingHours = (24 - hoursSinceLast).toFixed(1);
      return message.reply(`⏰ Nuuu! You must wait **${remainingHours} hours** before claiming your next daily reward ${getRandomFace()}`);
    }

    let streak = user.daily_streak || 0;
    if (hoursSinceLast < 48) {
      streak += 1;
    } else {
      streak = 1;
    }

    const baseReward = 1500;
    const streakBonus = Math.min(streak * 100, 3000);
    const totalCowoncy = baseReward + streakBonus;

    // Bonus loot chance
    const bonusLoot = [];
    const roll = Math.random();
    if (roll < 0.40) {
      db.addItem(user.id, 'crate_common', 1);
      bonusLoot.push('📦 Common Crate x1');
    } else if (roll < 0.60) {
      db.addItem(user.id, 'crate_rare', 1);
      bonusLoot.push('🎁 Rare Crate x1');
    }
    if (Math.random() < 0.20) {
      db.addItem(user.id, 'gem_luck', 1);
      bonusLoot.push('💎 Luck Gem x1');
    }

    db.stmts.updateDaily.run(now, streak, totalCowoncy, user.id);
    db.stmts.addXp.run(50, user.id);

    const embed = new EmbedBuilder()
      .setColor('#ff66b2')
      .setTitle(`✨ Daily Reward Claimed! ${getRandomFace()}`)
      .setDescription(
        `**${message.author.username}**, here is your daily cowoncy allowance!\n\n` +
        `${getCowoncyEmoji(message?.client)} **+${totalCowoncy.toLocaleString()} Cowoncy**\n` +
        `🔥 **Daily Streak:** \`${streak} days\` *(+${streakBonus} streak bonus)*\n` +
        `⭐ **EXP:** \`+50 EXP\`\n` +
        (bonusLoot.length > 0 ? `\n🎉 **Bonus Loot:**\n${bonusLoot.join('\n')}` : '')
      )
      .setFooter({ text: 'Come back tomorrow for an even bigger streak bonus!' });

    return message.reply({ embeds: [embed] });
  },

  balance: async (message, args, user) => {
    const targetUser = getMentionedUser(message) || message.author;
    const targetData = db.getUser(targetUser.id, targetUser.username);
    const cEmoji = getCowoncyEmoji(message?.client);

    return message.reply(`${cEmoji} | **${targetData.username}**, you currently have __**${(targetData.cowoncy || 0).toLocaleString()}**__ **cowoncy**!`);
  },

  give: async (message, args, user) => {
    let target = getMentionedUser(message);
    let rawAmount = null;

    for (let i = 0; i < args.length; i++) {
      const a = args[i].trim();
      if (!a) continue;

      // 1. Check if argument is Discord mention <@123456789> or <@!123456789>
      const mentionMatch = a.match(/^<@!?(\d+)>$/);
      if (mentionMatch) {
        if (!target) {
          const id = mentionMatch[1];
          if (message.client?.users?.cache?.has(id)) {
            target = message.client.users.cache.get(id);
          } else {
            const dbU = db.stmts.getUser.get(id);
            if (dbU) {
              target = { id: dbU.id, username: dbU.username, displayAvatarURL: () => dbU.avatar };
            } else {
              target = { id, username: 'Adventurer' };
            }
          }
        }
        continue;
      }

      // 2. Check if argument is an explicit Discord Snowflake ID (17-20 digits)
      if (!target && /^\d{17,20}$/.test(a)) {
        if (message.client?.users?.cache?.has(a)) {
          target = message.client.users.cache.get(a);
        } else {
          const dbU = db.stmts.getUser.get(a);
          if (dbU) {
            target = { id: dbU.id, username: dbU.username, displayAvatarURL: () => dbU.avatar };
          } else {
            target = { id: a, username: 'Adventurer' };
          }
        }
        continue;
      }

      // 3. Check if amount token (supports numbers with commas like 1,000, 250,000, 50k, 1m, all, half)
      const cleanAmtToken = a.replace(/,/g, '');
      const isAmountToken = /^\d+[km]?$/i.test(cleanAmtToken) || ['all', 'half', 'a', 'h'].includes(cleanAmtToken.toLowerCase());
      if (isAmountToken && !rawAmount) {
        rawAmount = cleanAmtToken;
        continue;
      }

      // 4. Otherwise, if target not found yet, treat as username (e.g. @Azrawr or Azrawr)
      if (!target) {
        const cleanName = a.replace(/^@/, '');
        // 1. Try Discord guild members cache if available
        if (message.guild?.members?.cache) {
          const gm = message.guild.members.cache.find(m => 
            m.user.username.toLowerCase() === cleanName.toLowerCase() ||
            (m.nickname && m.nickname.toLowerCase() === cleanName.toLowerCase())
          );
          if (gm) {
            target = gm.user;
            continue;
          }
        }

        // 2. Try database users
        const dbU = db.db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1').get(cleanName);
        if (dbU) {
          target = { id: dbU.id, username: dbU.username, displayAvatarURL: () => dbU.avatar };
        } else {
          target = { id: 'user_' + cleanName.toLowerCase(), username: cleanName };
        }
        continue;
      }
    }

    if (!target) {
      return message.reply(`❌ Who do you want to give cowoncy to? Usage: \`owo give @user <amount>\``);
    }
    if (target.id === message.author.id) {
      return message.reply(`Silly you! You cannot give cowoncy to yourself ${getRandomFace()}`);
    }
    if (target.bot) {
      return message.reply(`Bots don't need cowoncy, silly! ${getRandomFace()}`);
    }

    let amount = 0;
    if (rawAmount) {
      const cleanRaw = rawAmount.replace(/,/g, '');
      const low = cleanRaw.toLowerCase();
      if (low === 'all' || low === 'a') {
        amount = user.cowoncy || 0;
      } else if (low === 'half' || low === 'h') {
        amount = Math.floor((user.cowoncy || 0) / 2);
      } else if (low.endsWith('k')) {
        amount = Math.floor(parseFloat(low) * 1000);
      } else if (low.endsWith('m')) {
        amount = Math.floor(parseFloat(low) * 1000000);
      } else {
        amount = parseInt(cleanRaw, 10);
      }
    }

    if (isNaN(amount) || amount <= 0) {
      return message.reply(`❌ Please specify a valid amount of cowoncy to send! Usage: \`owo give @user <amount>\``);
    }

    if (user.cowoncy < amount) {
      return message.reply(`❌ Nuuu! You only have **${user.cowoncy.toLocaleString()} Cowoncy**! You need **${(amount - user.cowoncy).toLocaleString()}** more.`);
    }

    // Ensure recipient exists in db
    db.getUser(target.id, target.username, typeof target.displayAvatarURL === 'function' ? target.displayAvatarURL() : '');

    const avatarUrl = typeof message.author.displayAvatarURL === 'function'
      ? message.author.displayAvatarURL({ dynamic: true })
      : (message.author.avatar || undefined);

    const senderMention = /^\d{17,20}$/.test(message.author.id) ? `<@${message.author.id}>` : `@${message.author.username}`;
    const targetMention = /^\d{17,20}$/.test(target.id) ? `<@${target.id}>` : `@${target.username}`;

    // Create 100% authentic OwO prompt embed matching the official screenshot
    const embed = new EmbedBuilder()
      .setColor('#00a8fc')
      .setAuthor({
        name: `${message.author.username}, you are about to give cowoncy to ${target.username}`,
        iconURL: avatarUrl || undefined
      })
      .setDescription(
        `To confirm this transaction, click ✅ Confirm.\n` +
        `To cancel this transaction, click ❎ Cancel.\n\n` +
        `⚠️ *It is against our rules to trade cowoncy for anything of monetary value. This includes real money, crypto, nitro, or anything similar. You will be **banned** for doing so.*\n\n` +
        `${senderMention} **will give** ${targetMention}:\n` +
        `\`\`\`\n${amount.toLocaleString()}  cowoncy\n\`\`\``
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`give_confirm_${message.author.id}_${target.id}_${amount}_${Date.now()}`)
        .setLabel('Confirm')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`give_cancel_${message.author.id}_${target.id}_${amount}_${Date.now()}`)
        .setLabel('Cancel')
        .setEmoji('❎')
        .setStyle(ButtonStyle.Danger)
    );

    const replyMsg = await message.reply({ embeds: [embed], components: [row] });
    if (!replyMsg || typeof replyMsg.createMessageComponentCollector !== 'function') return;

    const collector = replyMsg.createMessageComponentCollector({
      time: 60000
    });

    collector.on('collect', async (interaction) => {
      try {
        if (interaction.user.id !== message.author.id) {
          return await interaction.reply({
            content: `❌ Only <@${message.author.id}> can confirm or cancel this transaction!`,
            ephemeral: true
          }).catch(() => {});
        }

        collector.stop('handled');

        if (interaction.customId.startsWith('give_confirm_')) {
          const freshSender = db.getUser(message.author.id);
          if (freshSender.cowoncy < amount) {
            return await interaction.update({
              content: `❌ **${message.author.username}**, you do not have enough Cowoncy anymore! (Current balance: **${freshSender.cowoncy.toLocaleString()}**)`,
              embeds: [],
              components: []
            }).catch(() => {});
          }

          const success = db.transferCowoncy(message.author.id, target.id, amount);
          if (!success) {
            return await interaction.update({
              content: `❌ Transaction failed. Please try again!`,
              embeds: [],
              components: []
            }).catch(() => {});
          }

          const successEmbed = new EmbedBuilder()
            .setColor('#00a8fc')
            .setAuthor({
              name: `${message.author.username} sent cowoncy to ${target.username}`,
              iconURL: avatarUrl || undefined
            })
            .setDescription(
              `💸 | **${senderMention}** transferred **${amount.toLocaleString()} Cowoncy** to **${targetMention}**!\n\n` +
              `\`\`\`\n+${amount.toLocaleString()}  cowoncy -> ${target.username}\n\`\`\``
            )
            .setTimestamp();

          return await interaction.update({
            embeds: [successEmbed],
            components: []
          }).catch(() => {});
        } else {
          const cancelEmbed = new EmbedBuilder()
            .setColor('#00a8fc')
            .setAuthor({
              name: `Transaction Cancelled`,
              iconURL: avatarUrl || undefined
            })
            .setDescription(`❎ | The transaction of **${amount.toLocaleString()} Cowoncy** to **${target.username}** was cancelled.`)
            .setTimestamp();

          return await interaction.update({
            embeds: [cancelEmbed],
            components: []
          }).catch(() => {});
        }
      } catch (err) {
        console.error('[OwO Bot] Collector interaction error:', err);
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        replyMsg.edit({ components: [] }).catch(() => {});
      }
    });
  },

  quest: async (message, args, user) => {
    const quest = db.getDailyQuest(user.id);
    const huntDone = Math.min(quest.hunts_done, 5);
    const slotsDone = Math.min(quest.slots_done, 3);
    const cfDone = Math.min(quest.cf_done, 3);

    const isAllDone = huntDone >= 5 && slotsDone >= 3 && cfDone >= 3;
    const isClaimed = quest.claimed === 1;

    const embed = new EmbedBuilder()
      .setColor('#8a7ff8')
      .setTitle(`📜 Daily Checklist & Quests ${getRandomFace()}`)
      .setDescription(
        `Complete your daily tasks to claim **3,000 Cowoncy** and a **🎁 Rare Crate**!\n\n` +
        `${huntDone >= 5 ? '✅' : '⬜'} **Hunt 5 times:** \`${huntDone}/5\`\n` +
        `${slotsDone >= 3 ? '✅' : '⬜'} **Play Slots 3 times:** \`${slotsDone}/3\`\n` +
        `${cfDone >= 3 ? '✅' : '⬜'} **Play Coinflip 3 times:** \`${cfDone}/3\`\n\n` +
        (isClaimed 
          ? '🎉 **You have already claimed today\'s quest reward!**' 
          : isAllDone 
            ? '✨ **All quests completed! Click the button below to claim!**' 
            : '⏳ Keep playing to complete all daily tasks!')
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`claim_quest_${user.id}`)
        .setLabel(isClaimed ? 'Claimed' : 'Claim 3,000 Cowoncy + Rare Crate')
        .setStyle(isClaimed ? ButtonStyle.Secondary : isAllDone ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(isClaimed || !isAllDone)
        .setEmoji('🎁')
    );

    return message.reply({ embeds: [embed], components: [row] });
  },

  pray: async (message, args, user) => {
    const cd = checkCooldown(user.id, 'pray', 300); // 5 min cooldown
    if (cd) {
      return message.reply(`⏳ You must wait **${cd}s** before praying again ${getRandomFace()}`);
    }

    const target = getMentionedUser(message) || message.author;
    const isSelf = target.id === message.author.id;
    const targetData = db.getUser(target.id, target.username);

    // Add 15 mins of luck boost
    const now = Math.floor(Date.now() / 1000);
    const boostUntil = Math.max(targetData.luck_boost_until || 0, now) + 900;
    db.stmts.setLuckBoost.run(boostUntil, target.id);

    const embed = new EmbedBuilder()
      .setColor('#00e5ff')
      .setDescription(
        isSelf 
          ? `🙏 **${message.author.username}** prayed to the RNG Gods and gained **+20% Luck Boost** for 15 minutes! ✨` 
          : `🙏 **${message.author.username}** prayed for **${target.username}**! They received **+20% Luck Boost** for 15 minutes! ✨`
      );

    return message.reply({ embeds: [embed] });
  },

  curse: async (message, args, user) => {
    const cd = checkCooldown(user.id, 'curse', 300); // 5 min cooldown
    if (cd) {
      return message.reply(`⏳ You must wait **${cd}s** before cursing again ${getRandomFace()}`);
    }

    const target = getMentionedUser(message);
    if (!target) {
      return message.reply(`❌ Mention who you want to curse! Usage: \`owo curse @user\``);
    }
    if (target.id === message.author.id) {
      return message.reply(`Why would you curse yourself?! Silly! ${getRandomFace()}`);
    }

    const embed = new EmbedBuilder()
      .setColor('#9c27b0')
      .setDescription(`👿 **${message.author.username}** cursed **${target.username}** with misfortune! Bwahahaha! 🔮`);

    return message.reply({ embeds: [embed] });
  },

  cookie: async (message, args, user) => {
    const cd = checkCooldown(user.id, 'cookie', 30);
    if (cd) return message.reply(`⏳ You must wait **${cd}s** before sending another cookie!`);

    const target = getMentionedUser(message);
    if (!target) {
      return message.reply(`🍪 Who would you like to give a cookie to? Usage: \`owo cookie @user\` or \`wcookie @user\``);
    }
    if (target.id === message.author.id) {
      return message.reply(`You can't give yourself a cookie, but here's a virtual hug! 🤗`);
    }

    db.getUser(target.id, target.username);
    db.addItem(target.id, 'cookie', 1);

    const count = db.stmts.getItemCount.get(target.id, 'cookie')?.quantity || 1;
    return message.reply(`🍪 | **${message.author.username}** gave a cookie to **${target.username}**! They now have **${count}** cookies! ${getRandomFace()}`);
  },

  vote: async (message, args, user) => {
    const cd = checkCooldown(user.id, 'vote', 43200); // 12 hours cooldown
    if (cd) {
      const hours = (cd / 3600).toFixed(1);
      return message.reply(`⏰ You have already voted recently! You can vote again in **${hours} hours**.`);
    }

    const rewardCowoncy = 2500;
    db.addCowoncy(user.id, rewardCowoncy);
    db.addItem(user.id, 'crate_rare', 1);

    const embed = new EmbedBuilder()
      .setColor('#00e676')
      .setTitle(`🗳️ Thank you for voting! ${getRandomFace()}`)
      .setDescription(
        `**${message.author.username}**, you received your vote reward!\n\n` +
        `${getCowoncyEmoji(message?.client)} **+${rewardCowoncy.toLocaleString()} Cowoncy**\n` +
        `🎁 **+1x Rare Crate**\n\n` +
        `*You can vote again in 12 hours for more Cowoncy!*`
      );

    return message.reply({ embeds: [embed] });
  },

  lottery: async (message, args, user) => {
    const ticketCost = 100;
    const count = parseInt(args[0], 10);

    if (args.length === 0 || isNaN(count)) {
      const jackpot = 500000 + (Math.floor(Date.now() / 60000) % 5000) * 150;
      const embed = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle(`🎰 OwO Global Lottery ${getRandomFace()}`)
        .setDescription(
          `💰 **Current Jackpot:** **${jackpot.toLocaleString()} Cowoncy**!\n` +
          `🎟️ **Ticket Price:** \`100 Cowoncy\` each\n\n` +
          `To buy tickets, type: \`owo lottery <amount>\` (e.g. \`owo lottery 5\`)`
        );
      return message.reply({ embeds: [embed] });
    }

    if (count <= 0) {
      return message.reply(`❌ Please specify a positive number of tickets!`);
    }

    const totalCost = count * ticketCost;
    if (user.cowoncy < totalCost) {
      return message.reply(`❌ You need **${totalCost.toLocaleString()} Cowoncy** for ${count} tickets, but you only have **${user.cowoncy.toLocaleString()}**!`);
    }

    db.addCowoncy(user.id, -totalCost);

    const winRoll = Math.random();
    const jackpot = 500000 + (Math.floor(Date.now() / 60000) % 5000) * 150;

    if (winRoll < (0.002 * count)) {
      db.addCowoncy(user.id, jackpot);
      return message.reply(`🎉🎊 **JACKPOT WINNER!** **${message.author.username}** won the lottery jackpot of **+${jackpot.toLocaleString()} Cowoncy**! 🏆`);
    } else if (Math.random() < 0.25) {
      const smallWin = Math.floor(totalCost * (1.2 + Math.random()));
      db.addCowoncy(user.id, smallWin);
      return message.reply(`🎟️ You bought **${count}** lottery tickets and won a prize of **+${smallWin.toLocaleString()} Cowoncy**!`);
    } else {
      return message.reply(`🎟️ | **${message.author.username}**, you purchased **${count}** lottery tickets for **${totalCost.toLocaleString()} Cowoncy**! Better luck on the next drawing! ${getRandomFace()}`);
    }
  }
};
