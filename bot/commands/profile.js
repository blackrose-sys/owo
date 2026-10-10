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
      .setColor('#2b2d31')
      .setDescription(
        `Here is the list of commands!\n` +
        `For more info on a specific command, use \`owo help {command}\`\n\n` +
        `🏅 **Rankings**\n` +
        `\`top\` \`my\`\n\n` +
        `💰 **Economy**\n` +
        `\`cowoncy\` \`give\` \`daily\` \`vote\` \`quest\` \`checklist\` \`shop\` \`buy\`\n\n` +
        `🌱 **Animals**\n` +
        `\`zoo\` \`hunt\` \`sell\` \`sacrifice\` \`battle\` \`inv\` \`equip\` \`autohunt\` \`owodex\` \`lootbox\` \`crate\` \`team\` \`weapon\` \`rename\` \`dismantle\` \`boss\`\n\n` +
        `🎲 **Gambling**\n` +
        `\`slots\` \`coinflip\` \`lottery\` \`blackjack\` \`snailgarden\` \`mines\` \`highlow\`\n\n` +
        `🎱 **Fun**\n` +
        `\`8b\` \`define\` \`gif\` \`pic\` \`translate\` \`roll\` \`choose\` \`bell\`\n\n` +
        `🎭 **Social**\n` +
        `\`cookie\` \`ship\` \`pray\` \`curse\` \`marry\` \`emoji\` \`profile\` \`level\` \`wallpaper\` \`owoify\` \`avatar\`\n\n` +
        `😂 **Meme Generation**\n` +
        `\`spongebobchicken\` \`slapcar\` \`isthisa\` \`drake\` \`distractedbf\` \`communismcat\` \`eject\` \`emergencymeeting\` \`headpat\` \`tradeoffer\` \`waddle\`\n\n` +
        `😃 **Emotes**\n` +
        `\`blush\` \`cry\` \`dance\` \`lewd\` \`pout\` \`shrug\` \`sleepy\` \`smile\` \`smug\` \`thumbsup\` \`wag\` \`thinking\` \`triggered\` \`teehee\` \`deredere\` \`thonking\` \`scoff\` \`happy\` \`thumbs\` \`grin\`\n\n` +
        `🤗 **Actions**\n` +
        `\`cuddle\` \`hug\` \`kiss\` \`lick\` \`nom\` \`pat\` \`poke\` \`slap\` \`stare\` \`highfive\` \`bite\` \`greet\` \`punch\` \`handholding\` \`tickle\` \`kill\` \`hold\` \`pats\` \`wave\` \`boop\` \`snuggle\` \`bully\` \`dambi\`\n\n` +
        `🔧 **Utility**\n` +
        `\`ping\` \`stats\` \`link\` \`guildlink\` \`disable\` \`censor\` \`patreon\` \`announcement\` \`rules\` \`suggest\` \`shards\` \`math\` \`color\` \`prefix\``
      )
      .setFooter({ text: `OwO Bot • 100000x Better, Smooth & Authentic` });

    return message.reply({ embeds: [embed] });
  }
};
