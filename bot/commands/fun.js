const { EmbedBuilder } = require('discord.js');
const { getRandomFace } = require('../../database/data/dialogue');

module.exports = {
  // owo define <word> — Urban Dictionary style definitions
  define: async (message, args) => {
    const word = args.join(' ').trim();
    if (!word) {
      return message.reply(`📖 | What word do you want to define? Usage: \`owo define <word>\``);
    }

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!res.ok) {
        // Fallback: generate a fun OwO-style fake definition
        const fakeDefinitions = [
          `A mysterious entity that even the wisest OwO scholars cannot define.`,
          `Something so powerful that dictionaries refuse to acknowledge it.`,
          `The feeling you get when you type "owo" at 3 AM.`,
          `A word that transcends human understanding. uwu`,
          `Legend says only those with max level pets can truly understand this word.`
        ];
        const fakeDef = fakeDefinitions[Math.floor(Math.random() * fakeDefinitions.length)];

        const embed = new EmbedBuilder()
          .setColor('#ff9800')
          .setTitle(`📖 Definition: ${word}`)
          .setDescription(`*No definition found, but here's my best guess:*\n\n${fakeDef}`)
          .setFooter({ text: `Requested by ${message.author.username}` });

        return message.reply({ embeds: [embed] });
      }

      const data = await res.json();
      const entry = data[0];
      const meanings = entry.meanings.slice(0, 3);

      let description = '';
      for (const meaning of meanings) {
        const defs = meaning.definitions.slice(0, 2);
        description += `**${meaning.partOfSpeech}**\n`;
        for (let i = 0; i < defs.length; i++) {
          description += `${i + 1}. ${defs[i].definition}\n`;
          if (defs[i].example) {
            description += `   *"${defs[i].example}"*\n`;
          }
        }
        description += '\n';
      }

      const phonetic = entry.phonetics?.find(p => p.text)?.text || '';

      const embed = new EmbedBuilder()
        .setColor('#4caf50')
        .setTitle(`📖 ${entry.word} ${phonetic}`)
        .setDescription(description.trim())
        .setFooter({ text: `Source: Free Dictionary API • Requested by ${message.author.username}` });

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Define error:', err);
      return message.reply(`📖 | Couldn't find a definition for **${word}**! ${getRandomFace()}`);
    }
  },

  // owo gif <search> — Search for a GIF
  gif: async (message, args) => {
    const query = args.join(' ').trim();
    if (!query) {
      return message.reply(`🎬 | What GIF are you looking for? Usage: \`owo gif <search>\``);
    }

    try {
      // Use Tenor's free public API
      const res = await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&client_key=owo_bot&limit=10`);

      if (!res.ok) {
        return message.reply(`🎬 | Couldn't find any GIFs for **${query}**! Try something else ${getRandomFace()}`);
      }

      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        return message.reply(`🎬 | No GIFs found for **${query}**! ${getRandomFace()}`);
      }

      const result = data.results[Math.floor(Math.random() * data.results.length)];
      const gifUrl = result.media_formats?.gif?.url || result.url;

      const embed = new EmbedBuilder()
        .setColor('#7c4dff')
        .setTitle(`🎬 ${query}`)
        .setImage(gifUrl)
        .setFooter({ text: `Searched by ${message.author.username} • Powered by Tenor` });

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('GIF search error:', err);
      return message.reply(`🎬 | Error searching for GIFs! ${getRandomFace()}`);
    }
  },

  // owo pic <search> — Search for a random image
  pic: async (message, args) => {
    const query = args.join(' ').trim() || 'cute animal';

    // Use curated animal/nature pics as fallback for common queries
    const animalPics = {
      cat: [
        'https://cdn2.thecatapi.com/images/MTk1NzUzOQ.jpg',
        'https://cdn2.thecatapi.com/images/bpc.jpg',
        'https://cdn2.thecatapi.com/images/MTUwNjcyMQ.jpg'
      ],
      dog: [
        'https://images.dog.ceo/breeds/retriever-golden/n02099601_1003.jpg',
        'https://images.dog.ceo/breeds/husky/n02110185_10116.jpg',
        'https://images.dog.ceo/breeds/corgi-cardigan/n02113186_10475.jpg'
      ]
    };

    try {
      let imageUrl = null;
      const lowerQuery = query.toLowerCase();

      if (lowerQuery === 'cat' || lowerQuery === 'cats' || lowerQuery === 'kitty') {
        // Use TheCatAPI
        try {
          const res = await fetch('https://api.thecatapi.com/v1/images/search');
          const data = await res.json();
          imageUrl = data[0]?.url;
        } catch (e) {
          imageUrl = animalPics.cat[Math.floor(Math.random() * animalPics.cat.length)];
        }
      } else if (lowerQuery === 'dog' || lowerQuery === 'dogs' || lowerQuery === 'puppy') {
        // Use Dog CEO API
        try {
          const res = await fetch('https://dog.ceo/api/breeds/image/random');
          const data = await res.json();
          imageUrl = data?.message;
        } catch (e) {
          imageUrl = animalPics.dog[Math.floor(Math.random() * animalPics.dog.length)];
        }
      } else if (lowerQuery === 'fox') {
        try {
          const res = await fetch('https://randomfox.ca/floof/');
          const data = await res.json();
          imageUrl = data?.image;
        } catch (e) {}
      } else if (lowerQuery === 'duck') {
        imageUrl = 'https://random-d.uk/api/randomimg';
      } else {
        // For general queries, use a random animal
        const apis = [
          { url: 'https://api.thecatapi.com/v1/images/search', extract: (d) => d[0]?.url },
          { url: 'https://dog.ceo/api/breeds/image/random', extract: (d) => d?.message },
          { url: 'https://randomfox.ca/floof/', extract: (d) => d?.image },
        ];
        const api = apis[Math.floor(Math.random() * apis.length)];
        try {
          const res = await fetch(api.url);
          const data = await res.json();
          imageUrl = api.extract(data);
        } catch (e) {}
      }

      if (!imageUrl) {
        return message.reply(`🖼️ | Couldn't find a picture for **${query}**! Try: \`owo pic cat\`, \`owo pic dog\`, \`owo pic fox\` ${getRandomFace()}`);
      }

      const embed = new EmbedBuilder()
        .setColor('#e91e63')
        .setTitle(`🖼️ ${query}`)
        .setImage(imageUrl)
        .setFooter({ text: `Searched by ${message.author.username}` });

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Pic search error:', err);
      return message.reply(`🖼️ | Error finding pictures! ${getRandomFace()}`);
    }
  },

  // owo translate <text> — Translate text to OwO-speak (enhanced owoify)
  translate: async (message, args) => {
    const text = args.join(' ').trim();
    if (!text) {
      return message.reply(`🌐 | What do you want me to translate? Usage: \`owo translate <text>\`\n*Translates text into OwO-speak!*`);
    }

    // Enhanced OwO translation
    let result = text;
    // Basic OwO substitutions
    result = result.replace(/[rl]/g, 'w');
    result = result.replace(/[RL]/g, 'W');
    result = result.replace(/n([aeiou])/gi, (match, vowel) => `ny${vowel}`);
    result = result.replace(/ove/gi, 'uv');
    result = result.replace(/th/gi, 'd');
    result = result.replace(/this/gi, 'dis');
    result = result.replace(/that/gi, 'dat');
    result = result.replace(/the /gi, 'da ');
    result = result.replace(/!/g, '! >w< ');
    result = result.replace(/\?/g, '? owo ');

    // Add random OwO faces at the end
    const faces = ['OwO', 'UwU', '>w<', '^w^', '(・`ω´・)', 'rawr x3', '~w~', ':3', 'nyaa~', 'OwO whats this?'];
    const endFace = faces[Math.floor(Math.random() * faces.length)];

    // Add random stuttering
    const words = result.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (Math.random() < 0.15 && words[i].length > 2) {
        words[i] = words[i][0] + '-' + words[i];
      }
    }
    result = words.join(' ');

    const embed = new EmbedBuilder()
      .setColor('#ff80ab')
      .setTitle(`🌐 OwO Translator`)
      .addFields(
        { name: '📝 Original', value: text.substring(0, 1024) },
        { name: `${endFace} Translated`, value: result.substring(0, 1024) }
      )
      .setFooter({ text: `Translated by ${message.author.username}` });

    return message.reply({ embeds: [embed] });
  },

  // owo bell — Ring the notification bell
  bell: async (message, args) => {
    const target = (message.mentions?.users && typeof message.mentions.users.first === 'function' ? message.mentions.users.first() : null);

    if (target) {
      return message.reply(`🔔 | **${message.author.username}** rang the bell for **${target.username}**! *ding ding ding!* 🛎️`);
    }

    const bellMessages = [
      `🔔 *DING DING DING!* The OwO bell rings throughout the server!`,
      `🛎️ *ring ring!* **${message.author.username}** demands attention! ${getRandomFace()}`,
      `🔔 The bell tolls for thee! ...just kidding, **${message.author.username}** just wanted to say hi!`,
      `🛎️ *tap tap tap* **${message.author.username}** is ringing the bell impatiently! Someone notice them!`,
      `🔔 **${message.author.username}** summoned the sacred OwO bell! All shall tremble! >w<`
    ];

    const msg = bellMessages[Math.floor(Math.random() * bellMessages.length)];
    return message.reply(msg);
  },

  // owo emoji <emoji> — Get info about an emoji
  emoji: async (message, args) => {
    const input = args.join(' ').trim();
    if (!input) {
      return message.reply(`😀 | Please provide an emoji! Usage: \`owo emoji <emoji>\``);
    }

    // Check if it's a custom Discord emoji
    const customEmojiMatch = input.match(/<a?:(\w+):(\d+)>/);
    if (customEmojiMatch) {
      const isAnimated = input.startsWith('<a:');
      const name = customEmojiMatch[1];
      const id = customEmojiMatch[2];
      const ext = isAnimated ? 'gif' : 'png';
      const url = `https://cdn.discordapp.com/emojis/${id}.${ext}?size=256`;

      const embed = new EmbedBuilder()
        .setColor('#7c4dff')
        .setTitle(`Emoji: :${name}:`)
        .addFields(
          { name: 'Name', value: `:${name}:`, inline: true },
          { name: 'ID', value: id, inline: true },
          { name: 'Animated', value: isAnimated ? 'Yes' : 'No', inline: true },
          { name: 'URL', value: `[Link](${url})` }
        )
        .setImage(url)
        .setFooter({ text: `Requested by ${message.author.username}` });

      return message.reply({ embeds: [embed] });
    }

    // Unicode emoji — show the codepoints
    const codepoints = [...input].map(c => `U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`);

    const embed = new EmbedBuilder()
      .setColor('#ff9800')
      .setTitle(`Emoji Info`)
      .addFields(
        { name: 'Emoji', value: input, inline: true },
        { name: 'Unicode', value: codepoints.join(' '), inline: true }
      )
      .setFooter({ text: `Requested by ${message.author.username}` });

    return message.reply({ embeds: [embed] });
  },

  // owo wallpaper — View or manage wallpapers (placeholder)
  wallpaper: async (message, args, user) => {
    const embed = new EmbedBuilder()
      .setColor('#00bcd4')
      .setTitle(`🖼️ ${message.author.username}'s Wallpapers`)
      .setDescription(
        `Manage your profile wallpapers!\n\n` +
        `• \`owo shop wp\` — Browse wallpapers in the shop\n` +
        `• \`owo buy <id>\` — Purchase a wallpaper\n` +
        `• \`owo profile set wallpaper <id>\` — Set your active wallpaper\n\n` +
        `*You currently have the **Default** wallpaper equipped.*`
      )
      .setFooter({ text: `Tip: Use 'owo shop wp' to view available wallpapers!` });

    return message.reply({ embeds: [embed] });
  },

  // owo battlesetting — View/edit battle settings
  battlesetting: async (message, args, user) => {
    const embed = new EmbedBuilder()
      .setColor('#ff5722')
      .setTitle(`⚔️ Battle Settings`)
      .setDescription(
        `Configure your battle preferences!\n\n` +
        `**Active Team:** Team ${user.active_team || 1}\n` +
        `**Auto-Battle:** Disabled\n` +
        `**Battle Notifications:** Enabled\n\n` +
        `• \`owo setteam <1/2>\` — Switch active battle team\n` +
        `• \`owo team\` — View your current team\n` +
        `• \`owo team add <animal>\` — Add animals to your team\n` +
        `• \`owo equip <weapon_id>\` — Equip a weapon`
      )
      .setFooter({ text: `Use 'owo help battle' for more battle commands!` });

    return message.reply({ embeds: [embed] });
  },

  // owo level — Show your level info  
  level: async (message, args, user) => {
    const db = require('../../database/db');
    const targetUser = (message.mentions?.users && typeof message.mentions.users.first === 'function' ? message.mentions.users.first() : null) || message.author;
    const avatar = typeof targetUser.displayAvatarURL === 'function' ? targetUser.displayAvatarURL() : '';
    const targetData = db.getUser(targetUser.id, targetUser.username, avatar);

    const xpNeeded = targetData.level * 100;
    const percent = Math.min(Math.max(targetData.xp / xpNeeded, 0), 1);
    const filled = Math.round(10 * percent);
    const empty = 10 - filled;
    const bar = '`[' + '▓'.repeat(filled) + '░'.repeat(empty) + ']` ' + Math.floor(percent * 100) + '%';

    const embed = new EmbedBuilder()
      .setColor('#4caf50')
      .setAuthor({ 
        name: `${targetData.display_animal || '🐶'} ${targetData.username}`, 
        iconURL: typeof targetUser.displayAvatarURL === 'function' ? targetUser.displayAvatarURL({ dynamic: true }) : undefined 
      })
      .setDescription(
        `⭐ **Level ${targetData.level}**\n\n` +
        `**XP Progress:**\n${bar} \`(${targetData.xp}/${xpNeeded} XP)\`\n\n` +
        `🏆 **Title:** *${targetData.title || 'Novice Hunter'}*\n` +
        `🔥 **Daily Streak:** \`${targetData.daily_streak || 0} days\`\n` +
        `🌲 **Total Hunts:** \`${(targetData.hunts || 0).toLocaleString()}\`\n` +
        `⚔️ **Battles Won:** \`${targetData.battles_won || 0}\``
      )
      .setFooter({ text: `Keep hunting and battling to earn XP!` });

    return message.reply({ embeds: [embed] });
  },

  // owo sell — Sell animals for cowoncy (alias handled in zoo.js already, but adding explicit sell command)
  // This is already in zoo.js, just making sure alias works

  // owo huntbot / autohunt — already exists in zoo.js
};
