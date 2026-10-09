const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const db = require('../../database/db');
const { ANIMALS } = require('../../database/data/animals');
const { getRandomFace } = require('../../database/data/dialogue');

function makeProgressBar(current, max, size = 10) {
  const percent = Math.min(Math.max(current / max, 0), 1);
  const filled = Math.round(size * percent);
  const empty = size - filled;
  return '`[' + '▓'.repeat(filled) + '░'.repeat(empty) + ']` ' + Math.floor(percent * 100) + '%';
}

module.exports = {
  profile: async (message, args, user) => {
    const targetUser = (message.mentions?.users && typeof message.mentions.users.first === 'function' ? message.mentions.users.first() : null) || message.author;
    const avatar = typeof targetUser.displayAvatarURL === 'function' ? targetUser.displayAvatarURL() : '';
    const targetData = db.getUser(targetUser.id, targetUser.username, avatar);
    const zooList = db.getZoo(targetUser.id);

    const xpNeeded = targetData.level * 100;
    const progressBar = makeProgressBar(targetData.xp, xpNeeded);

    const totalAnimals = zooList.reduce((acc, curr) => acc + curr.count, 0);
    const uniqueAnimals = zooList.length;

    let marriageText = 'Single';
    if (targetData.married_to) {
      const days = Math.floor((Math.floor(Date.now() / 1000) - (targetData.married_date || 0)) / 86400);
      marriageText = `💍 Married to **${targetData.married_name || 'Partner'}** *(${days} days)*`;
    }

    const avatarUrl = typeof targetUser.displayAvatarURL === 'function' 
      ? targetUser.displayAvatarURL({ dynamic: true }) 
      : 'https://api.dicebear.com/7.x/bottts/svg?seed=OwO';

    const embed = new EmbedBuilder()
      .setColor('#8a7ff8')
      .setAuthor({ 
        name: `${targetData.display_animal || '🐶'} ${targetData.username} • Level ${targetData.level}`, 
        iconURL: avatarUrl 
      })
      .setThumbnail(avatarUrl)
      .setDescription(
        `🎖️ **Title:** *${targetData.title || 'Novice Hunter'}*\n` +
        `💖 **Relationship:** ${marriageText}\n\n` +
        `⭐ **Level Progress:** (Lv. ${targetData.level})\n` +
        `${progressBar} \`(${targetData.xp}/${xpNeeded} XP)\`\n\n` +
        `🪙 **Cowoncy:** \`${(targetData.cowoncy || 0).toLocaleString()}\`\n` +
        `🔥 **Daily Streak:** \`${targetData.daily_streak || 0} days\`\n\n` +
        `🐾 **Zoo Collection:** \`${uniqueAnimals}/${ANIMALS.length}\` unique (\`${totalAnimals.toLocaleString()}\` total)\n` +
        `🌲 **Hunts Completed:** \`${(targetData.hunts || 0).toLocaleString()}\`\n` +
        `⚔️ **Battle Record:** \`${targetData.battles_won || 0}W / ${targetData.battles_lost || 0}L\``
      )
      .setFooter({ text: `Joined OwO Bot • Type 'owo help' for commands` });

    return message.reply({ embeds: [embed] });
  },

  top: async (message, args, user) => {
    const type = (args[0] || 'cowoncy').toLowerCase();
    const isHunts = type.startsWith('hunt') || type.startsWith('h');
    const topUsers = db.getTopUsers(isHunts ? 'hunts' : 'cowoncy', 10);

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    const embed = new EmbedBuilder()
      .setColor('#ffcc00')
      .setTitle(`🏆 Global Leaderboard — ${isHunts ? 'Master Hunters' : 'Cowoncy Tycoons'} ${getRandomFace()}`)
      .setDescription(
        topUsers.length === 0
          ? 'No players recorded yet!'
          : topUsers.map((u, i) => {
              const medal = medals[i] || `${i + 1}.`;
              const score = isHunts ? `${(u.hunts || 0).toLocaleString()} hunts` : `🪙 ${(u.cowoncy || 0).toLocaleString()}`;
              return `${medal} ${u.display_animal || '🐶'} **${u.username}** — \`${score}\` *(${u.title})*`;
            }).join('\n')
      )
      .setFooter({ text: `Switch between 'owo top' and 'owo top hunts'!` });

    return message.reply({ embeds: [embed] });
  },

  help: async (message, args, user) => {
    const sub = (args[0] || '').toLowerCase();
    if (sub === 'equip' || sub === 'wequip') {
      const equipHelp = new EmbedBuilder()
        .setColor('#8a7ff8')
        .setTitle(`⚔️ Command: equip / wequip`)
        .setDescription(
          `Assign weapons to boost your animals in dungeon battles!\n\n` +
          `**Usage:**\n` +
          `• \`wequip\` (or \`owo equip\`) — View equipped weapon & available armory\n` +
          `• \`wequip <weapon>\` — Equip a weapon by name or ID (e.g. \`wequip iron_broadsword\`)\n` +
          `• \`wequip <number>\` — Equip weapon by armory number (e.g. \`wequip 1\`)\n` +
          `• \`wequip unequip\` — Unequip current weapon`
        )
        .setFooter({ text: `Boosts your battle champions with ATK, DEF, and Crit!` });
      return message.reply({ embeds: [equipHelp] });
    }

    const embed = new EmbedBuilder()
      .setColor('#8a7ff8')
      .setTitle(`✨ OwO Bot — Command Guide & Handbook ${getRandomFace()}`)
      .setDescription(
        `Welcome to OwO! All commands can be run with \`owo <command>\`, \`w <command>\`, or shortcut prefixes (e.g. \`wequip\`, \`wh\`, \`ws all\`, \`wbj all\`).\n\n` +
        `🪙 **ECONOMY & DAILY**\n` +
        `• \`owo daily\` (\`wdaily\`) — Claim daily Cowoncy + streak bonus + crates\n` +
        `• \`owo cash\` (\`wcash\`, \`wbal\`) — Check your wallet balance\n` +
        `• \`owo give @user <amount>\` — Send Cowoncy to a friend\n` +
        `• \`owo quest\` (\`wcl\`) — Complete daily checklist for huge rewards\n` +
        `• \`owo pray / curse [@user]\` — Boost luck or curse someone\n\n` +
        `🐾 **ANIMALS & ZOO**\n` +
        `• \`owo hunt\` (\`wh\`) — Catch wild animals (Common to Gem tier)\n` +
        `• \`owo zoo\` (\`wzoo\`) — View your complete animal collection\n` +
        `• \`owo display <animal>\` — Set animal as your profile mascot\n` +
        `• \`owo sell <all/tier/name>\` — Sell duplicate animals for Cowoncy\n` +
        `• \`owo sacrifice <all/name>\` — Convert animals into magical Essence\n\n` +
        `🎰 **GAMBLING & CASINO**\n` +
        `• \`owo cf <amount> [h/t]\` (\`wcf\`) — Coinflip double or nothing\n` +
        `• \`owo slots <amount>\` (\`ws\`) — Spin slot machine for 10x jackpot\n` +
        `• \`owo bj <amount>\` (\`wbj\`) — Interactive Blackjack with Hit/Stand buttons\n` +
        `• \`owo highlow <amount>\` (\`whl\`) — Authentic Higher or Lower streak\n` +
        `• \`owo roulette <amount> <space>\` — Roulette betting\n\n` +
        `⚔️ **BATTLE & RPG**\n` +
        `• \`owo battle\` (\`wb\`) — Dungeon monster battles for Cowoncy & weapons\n` +
        `• \`owo team\` — View & configure your 3-animal battle champions\n` +
        `• \`wequip\` / \`owo equip <name/num>\` — Equip weapons to boost team power\n` +
        `• \`owo weapon\` — View armory weapons and stats\n\n` +
        `🛍️ **SHOP & INVENTORY**\n` +
        `• \`owo shop\` — Browse crates, love rings, gems, and consumables\n` +
        `• \`owo buy <item> [qty]\` — Buy items from the shop\n` +
        `• \`owo inv\` — View your inventory and crates\n` +
        `• \`owo use <item>\` — Open crates or activate luck gems\n\n` +
        `💖 **SOCIAL & PROFILE**\n` +
        `• \`owo marry @user\` — Propose marriage with Love Ring!\n` +
        `• \`owo hug / kiss / pat / slap / bite / cuddle @user\` — Anime actions\n` +
        `• \`owo owoify <text>\` — Turn any text into cute OwO speak\n` +
        `• \`owo profile\` / \`my\` — View complete player card\n` +
        `• \`owo top\` — Global Cowoncy & Hunter leaderboards`
      )
      .setFooter({ text: `OwO Bot • 100000x Better, Smooth, 100% Reliable` });

    return message.reply({ embeds: [embed] });
  }
};
