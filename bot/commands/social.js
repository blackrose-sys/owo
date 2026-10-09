const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const db = require('../../database/db');
const { getRandomFace, owoify, getActionGif } = require('../../database/data/dialogue');

module.exports = {
  marry: async (message, args, user) => {
    const target = (message.mentions?.users && typeof message.mentions.users.first === 'function' ? message.mentions.users.first() : null);
    if (!target) {
      return message.reply(`❌ Who would you like to marry? Usage: \`owo marry @user\``);
    }
    if (target.id === message.author.id) {
      return message.reply(`You cannot marry yourself, silly! ${getRandomFace()}`);
    }
    if (target.bot) {
      return message.reply(`You cannot marry a bot! ${getRandomFace()}`);
    }

    if (user.married_to) {
      return message.reply(`❌ You are already married to **${user.married_name || 'someone'}**! Use \`owo divorce\` first if you wish to separate.`);
    }

    const targetData = db.getUser(target.id, target.username, typeof target.displayAvatarURL === 'function' ? target.displayAvatarURL() : '');
    if (targetData.married_to) {
      return message.reply(`❌ **${target.username}** is already married to someone else!`);
    }

    // Check if proposer has a Love Ring
    const rings = db.stmts.getItemCount.get(user.id, 'ring');
    if (!rings || rings.quantity <= 0) {
      return message.reply(`💍 You need a **Love Ring** to propose! Buy one from \`owo shop buy ring\` for **10,000 Cowoncy**.`);
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('marry_accept').setLabel('💍 Yes, I do!').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('marry_decline').setLabel('💔 No, sorry').setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setColor('#ff66b2')
      .setTitle(`💖 Romantic Marriage Proposal! 💖`)
      .setDescription(
        `**${message.author.username}** got down on one knee and presented a sparkling diamond ring to **${target.username}**!\n\n` +
        `*"Will you marry me and be my beloved companion?"*\n\n` +
        `**${target.username}**, please click a button below to answer!`
      );

    const replyMsg = await message.reply({ content: `<@${target.id}>`, embeds: [embed], components: [row] });

    if (typeof replyMsg?.createMessageComponentCollector !== 'function') return;

    const collector = replyMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
      filter: (i) => i.user.id === target.id
    });

    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'marry_accept') {
        collector.stop('accepted');
        // Deduct ring
        db.removeItem(user.id, 'ring', 1);

        const now = Math.floor(Date.now() / 1000);
        db.stmts.marry.run(target.id, target.username, now, user.id);
        db.stmts.marry.run(user.id, message.author.username, now, target.id);

        const marriedEmbed = new EmbedBuilder()
          .setColor('#ff4081')
          .setTitle(`🎉 Just Married! 💍 ${getRandomFace()}`)
          .setDescription(
            `🔔 **Ding Dong!** The bells are ringing!\n\n` +
            `**${message.author.username}** and **${target.username}** are now officially married!\n` +
            `May your journey together be filled with endless Cowoncy and legendary animals!`
          );

        return interaction.update({ embeds: [marriedEmbed], components: [] });
      } else {
        collector.stop('declined');
        const declineEmbed = new EmbedBuilder()
          .setColor('#9e9e9e')
          .setDescription(`💔 **${target.username}** gently declined the proposal... ${getRandomFace()}`);
        return interaction.update({ embeds: [declineEmbed], components: [] });
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        replyMsg.edit({ components: [] }).catch(() => {});
      }
    });
  },

  divorce: async (message, args, user) => {
    if (!user.married_to) {
      return message.reply(`You are not married to anyone! ${getRandomFace()}`);
    }

    const partnerId = user.married_to;
    const partnerName = user.married_name || 'your partner';

    db.stmts.divorce.run(user.id);
    db.stmts.divorce.run(partnerId);

    const embed = new EmbedBuilder()
      .setColor('#78909c')
      .setDescription(`💔 **${message.author.username}** has divorced **${partnerName}**. Both are now single again.`);

    return message.reply({ embeds: [embed] });
  },

  avatar: async (message, args) => {
    let target = null;
    if (message.mentions?.users) {
      if (typeof message.mentions.users.first === 'function') {
        target = message.mentions.users.first();
      } else if (typeof message.mentions.users.values === 'function') {
        target = message.mentions.users.values().next().value;
      }
    }
    
    if (!target && args[0]) {
      const cleanArg = args[0].replace(/[^0-9]/g, '');
      if (cleanArg) {
        try {
          if (message.client?.users?.cache?.has(cleanArg)) {
            target = message.client.users.cache.get(cleanArg);
          } else if (typeof message.client?.users?.fetch === 'function') {
            target = await message.client.users.fetch(cleanArg);
          }
        } catch (e) {}
      }
    }

    if (!target) {
      target = message.author;
    }

    const avatarUrl = typeof target.displayAvatarURL === 'function' 
      ? target.displayAvatarURL({ size: 1024, dynamic: true, extension: 'png' })
      : (target.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png');

    const embed = new EmbedBuilder()
      .setColor('#8a7ff8')
      .setTitle(`🖼️ Avatar — ${target.username} ${getRandomFace()}`)
      .setImage(avatarUrl)
      .setDescription(`[Click here for original image](${avatarUrl})`)
      .setFooter({ text: `Requested by ${message.author.username}` });

    return message.reply({ embeds: [embed] });
  },

  action: async (message, actionName, args) => {
    let target = null;
    if (message.mentions?.users) {
      if (typeof message.mentions.users.first === 'function') {
        target = message.mentions.users.first();
      } else if (typeof message.mentions.users.values === 'function') {
        target = message.mentions.users.values().next().value;
      }
    }

    if (!target && args.length > 0) {
      const cleanTarget = args.join(' ').replace(/^<@!?/, '').replace(/>$/, '').trim();
      if (cleanTarget) {
        target = { username: cleanTarget };
      }
    }

    const authorAvatar = typeof message.author.displayAvatarURL === 'function'
      ? message.author.displayAvatarURL({ dynamic: true })
      : '';

    const gif = getActionGif(actionName);
    const embed = new EmbedBuilder().setColor('#00a8fc');
    if (gif) embed.setImage(gif);

    // Solo emotes / expressions
    const SOLO_ACTIONS = [
      'blush', 'cry', 'dance', 'smile', 'pout', 'shrug', 'sleepy', 'smug', 
      'thumbsup', 'thumbs', 'wag', 'thinking', 'thonking', 'triggered', 
      'teehee', 'deredere', 'scoff', 'happy', 'grin', 'lewd'
    ];

    if (!target && SOLO_ACTIONS.includes(actionName)) {
      const soloPhrases = {
        blush: `${message.author.username} is blushing furiously! (⁄ ⁄•⁄ω⁄•⁄ ⁄)`,
        cry: `${message.author.username} is crying uncontrollably... ;;w;;`,
        dance: `${message.author.username} is busting some sweet dance moves! ヾ(⌐■_■)ノ♪`,
        smile: `${message.author.username} smiles brightly! ^w^`,
        pout: `${message.author.username} pouts cutely! Hmph!`,
        shrug: `${message.author.username} shrugs nonchalantly! ¯\\_(ツ)_/¯`,
        sleepy: `${message.author.username} is feeling sleepy... zzz (˘ω˘)`,
        smug: `${message.author.username} smirks smugly! Hehe~`,
        thumbsup: `${message.author.username} gives a thumbs up!`,
        thumbs: `${message.author.username} gives a thumbs up!`,
        wag: `${message.author.username} wags their tail! *swish*`,
        thinking: `${message.author.username} is thinking deeply...`,
        thonking: `${message.author.username} is thonking...`,
        triggered: `${message.author.username} is TRIGGERED! (╯°□°）╯︵ ┻━┻`,
        teehee: `${message.author.username} giggles softly... teehee~`,
        deredere: `${message.author.username} is love-struck! 💕`,
        scoff: `${message.author.username} scoffed! As if!`,
        happy: `${message.author.username} is super happy! ヽ(>∀<☆)ノ`,
        grin: `${message.author.username} grins mischievously! (¬‿¬)`,
        lewd: `${message.author.username} thinks that is WAY TOO LEWD! (*/ω＼*)`
      };
      embed.setAuthor({
        name: soloPhrases[actionName] || `${message.author.username} is ${actionName}ing!`,
        iconURL: authorAvatar
      });
      return message.reply({ embeds: [embed] });
    }

    // Inter-personal target actions (matching screenshot: "skat gives Pix a bite! Yumm~")
    const tName = target ? target.username : 'the air';
    const actionAuthorPhrases = {
      bite: `${message.author.username} gives ${tName} a bite! Yumm~`,
      punch: target ? `${message.author.username} punches ${tName}! Ouch!` : `${message.author.username} punches the air! *whoosh*`,
      sex: target ? `${message.author.username} gets all spicy with ${tName}! (*/ω＼*) 💕` : `${message.author.username} is feeling spicy! (*/ω＼*)`,
      dogstyle: target ? `${message.author.username} got behind ${tName} for some doggystyle! (*/ω＼*) 💕` : `${message.author.username} is getting into position! (*/ω＼*)`,
      doggystyle: target ? `${message.author.username} got behind ${tName} for some doggystyle! (*/ω＼*) 💕` : `${message.author.username} is getting into position! (*/ω＼*)`,
      hug: `${message.author.username} gives ${tName} a big warm hug!`,
      kiss: `${message.author.username} gives ${tName} a tender kiss! 💕`,
      pat: `${message.author.username} gives ${tName} gentle headpats!`,
      pats: `${message.author.username} gives ${tName} gentle headpats!`,
      slap: `${message.author.username} slaps ${tName}! Ouch!`,
      cuddle: `${message.author.username} cuddles up close with ${tName}!`,
      poke: `${message.author.username} pokes ${tName}! Hey!`,
      lick: `${message.author.username} licks ${tName}! Slurp~`,
      nom: `${message.author.username} noms on ${tName}! Om nom nom!`,
      stare: `${message.author.username} stares intensely at ${tName}...`,
      highfive: `${message.author.username} gives a high-five to ${tName}!`,
      wave: `${message.author.username} waves at ${tName}!`,
      greet: `${message.author.username} greets ${tName}! Hello!`,
      handholding: `${message.author.username} holds hands with ${tName}! (⁄ ⁄•⁄ω⁄•⁄ ⁄)`,
      hold: `${message.author.username} holds hands with ${tName}!`,
      tickle: `${message.author.username} tickles ${tName}! Hehehe!`,
      kill: `${message.author.username} eliminated ${tName}! R.I.P.`,
      boop: `${message.author.username} boops ${tName} on the nose! *squeak*`,
      snuggle: `${message.author.username} snuggles affectionately with ${tName}!`,
      bully: `${message.author.username} bullies ${tName}! Mean! >:3`,
      lewd: `${message.author.username} points at ${tName}: THAT'S WAY TOO LEWD! (*/ω＼*)`
    };

    embed.setAuthor({
      name: actionAuthorPhrases[actionName] || `${message.author.username} ${actionName}s ${tName}!`,
      iconURL: authorAvatar
    });

    return message.reply({ embeds: [embed] });
  },

  owoify: async (message, args) => {
    const input = args.join(' ');
    if (!input) {
      return message.reply(`❌ Please provide some text to owoify! Example: \`owo owoify hello world\``);
    }
    const converted = owoify(input);
    return message.reply(converted);
  },

  eject: async (message, args) => {
    let target = null;
    if (message.mentions?.users) {
      if (typeof message.mentions.users.first === 'function') {
        target = message.mentions.users.first();
      } else if (typeof message.mentions.users.values === 'function') {
        target = message.mentions.users.values().next().value;
      }
    }

    if (!target && args.length > 0) {
      const cleanTarget = args.join(' ').replace(/^<@!?/, '').replace(/>$/, '').replace(/^@/, '').trim();
      if (cleanTarget) {
        if (message.guild?.members?.cache) {
          const gm = message.guild.members.cache.find(m => 
            m.user.username.toLowerCase() === cleanTarget.toLowerCase() ||
            (m.nickname && m.nickname.toLowerCase() === cleanTarget.toLowerCase())
          );
          if (gm) target = gm.user;
        }
        if (!target) {
          const dbU = db.db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1').get(cleanTarget);
          if (dbU) {
            target = { id: dbU.id, username: dbU.username, displayAvatarURL: () => dbU.avatar };
          } else {
            target = { username: cleanTarget, displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png' };
          }
        }
      }
    }

    if (!target) {
      target = message.author;
    }

    const targetAvatar = typeof target.displayAvatarURL === 'function'
      ? target.displayAvatarURL({ extension: 'png', size: 256 })
      : (target.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png');

    const isImpostor = Math.random() < 0.5;

    try {
      const width = 640;
      const height = 360;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // 1. Deep space background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // 2. Stars
      for (let i = 0; i < 70; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() < 0.2 ? 2.5 : Math.random() < 0.6 ? 1.5 : 1;
        const opacity = 0.5 + Math.random() * 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. User Avatar (tilted 42 degrees, floating on right side of space)
      try {
        const img = await loadImage(targetAvatar);
        ctx.save();
        const avatarSize = 95;
        const avatarX = width * 0.78;
        const avatarY = height * 0.55;
        ctx.translate(avatarX, avatarY);
        ctx.rotate(42 * Math.PI / 180);
        ctx.drawImage(img, -avatarSize / 2, -avatarSize / 2, avatarSize, avatarSize);
        ctx.restore();
      } catch (e) {}

      // 4. Centered Ejection text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '24px "Arial", "Segoe UI", sans-serif';

      const mainText = `${target.username} was ${isImpostor ? 'An Impostor.' : 'not An Impostor.'}`;
      ctx.fillText(mainText, width / 2, height / 2);

      const subText = isImpostor ? '0 Impostors remain.' : '1 Impostor remains.';
      ctx.font = '16px "Arial", "Segoe UI", sans-serif';
      ctx.fillStyle = '#cccccc';
      ctx.fillText(subText, width / 2, height / 2 + 35);

      const buffer = canvas.toBuffer('image/png');
      const attachment = new AttachmentBuilder(buffer, { name: 'ejected.png' });

      return message.reply({
        content: `🚀 | **${message.author.username}** decided to vote off ${target.username}`,
        files: [attachment]
      });
    } catch (err) {
      console.error('Eject generation error:', err);
      return message.reply(`🚀 | **${message.author.username}** decided to vote off ${target.username}\n*${target.username} was ${isImpostor ? 'An Impostor.' : 'not An Impostor.'}*`);
    }
  }
};
