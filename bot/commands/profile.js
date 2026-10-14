const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const db = require('../../database/db');
const { ANIMALS } = require('../../database/data/animals');
const { ITEMS } = require('../../database/data/items');
const { getRandomFace, getCowoncyEmoji } = require('../../database/data/dialogue');

function makeProgressBar(current, max, size = 10) {
  const percent = Math.min(Math.max(current / max, 0), 1);
  const filled = Math.round(size * percent);
  const empty = size - filled;
  return '`[' + '▓'.repeat(filled) + '░'.repeat(empty) + ']` ' + Math.floor(percent * 100) + '%';
}

module.exports = {
  profile: async (message, args, user) => {
    // Check if subcommand: owo profile set wallpaper <id>
    if (args[0]?.toLowerCase() === 'set' && (args[1]?.toLowerCase() === 'wallpaper' || args[1]?.toLowerCase() === 'wp')) {
      const fun = require('./fun');
      return fun.wallpaper(message, ['set', ...args.slice(2)], user);
    }

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

    const activeWp = targetData.wallpaper && targetData.wallpaper !== 'default'
      ? ITEMS.find(i => i.id === targetData.wallpaper && i.category === 'wallpaper')
      : null;

    const embed = new EmbedBuilder()
      .setColor('#8a7ff8')
      .setAuthor({ 
        name: `${targetData.display_animal || '🐶'} ${targetData.username} • Level ${targetData.level}`, 
        iconURL: avatarUrl 
      })
      .setThumbnail(avatarUrl)
      .setDescription(
        `🎖️ **Title:** *${targetData.title || 'Novice Hunter'}*\n` +
        `💖 **Relationship:** ${marriageText}\n` +
        (activeWp ? `🖼️ **Wallpaper:** ${activeWp.emoji} *${activeWp.name}*\n\n` : '\n') +
        `⭐ **Level Progress:** (Lv. ${targetData.level})\n` +
        `${progressBar} \`(${targetData.xp}/${xpNeeded} XP)\`\n\n` +
        `${getCowoncyEmoji(message?.client)} **Cowoncy:** \`${(targetData.cowoncy || 0).toLocaleString()}\`\n` +
        `🔥 **Daily Streak:** \`${targetData.daily_streak || 0} days\`\n\n` +
        `🐾 **Zoo Collection:** \`${uniqueAnimals}/${ANIMALS.length}\` unique (\`${totalAnimals.toLocaleString()}\` total)\n` +
        `🌲 **Hunts Completed:** \`${(targetData.hunts || 0).toLocaleString()}\`\n` +
        `⚔️ **Battle Record:** \`${targetData.battles_won || 0}W / ${targetData.battles_lost || 0}L\``
      )
      .setFooter({ text: `Joined OwO Bot • Type 'owo help' for commands` });

    if (activeWp && activeWp.image) {
      embed.setImage(activeWp.image);
    }

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
              const score = isHunts ? `${(u.hunts || 0).toLocaleString()} hunts` : `${getCowoncyEmoji(message?.client)} ${(u.cowoncy || 0).toLocaleString()}`;
              return `${medal} ${u.display_animal || '🐶'} **${u.username}** — \`${score}\` *(${u.title})*`;
            }).join('\n')
      )
      .setFooter({ text: `Switch between 'owo top' and 'owo top hunts'!` });

    return message.reply({ embeds: [embed] });
  },

  help: async (message, args, user) => {
    const sub = (args[0] || '').toLowerCase();
    
    // ===== DETAILED SUB-HELP PAGES =====
    if (sub === 'team' || sub === 'wteam' || sub === 't') {
      const embed = new EmbedBuilder()
        .setColor('#43b581')
        .setTitle(`🐾 Team Commands Guide`)
        .setDescription(
          `**Build your dream battle team!**\n\n` +
          `📋 **View Team**\n` +
          `\`wteam\` or \`wt\` — View your current team\n\n` +
          `➕ **Add Animal to Team**\n` +
          `\`wteam add {animal} {slot}\`\n` +
          `• \`wteam add dog 1\` — Add Dog to slot 1\n` +
          `• \`wteam add frost kitsune 3\` — Multi-word names work!\n` +
          `• \`wteam add frost_kitsune 2\` — Underscores work too\n` +
          `• \`wteam add phoenix 1\` — Partial names work\n` +
          `• \`wteam add kitsune 1\` — Just part of the name works\n\n` +
          `➖ **Remove Animal**\n` +
          `\`wteam remove {slot}\` — Remove animal from slot (1, 2, or 3)\n\n` +
          `🏷️ **Rename Team**\n` +
          `\`wteam rename {name}\` — e.g. \`wteam rename TEAM WALANG BITAW\`\n\n` +
          `⭐ **Switch Teams**\n` +
          `\`wsetteam 1\` or \`wsetteam 2\` — Switch active team\n\n` +
          `⚔️ **Equip Weapons to Pets**\n` +
          `\`wteam equip {slot} {weapon_code}\`\n` +
          `• \`wteam equip 1 FV9XWP\` — Equip weapon to pet in slot 1\n` +
          `• \`wteam unequip 1\` — Unequip weapon from slot 1\n\n` +
          `💡 *Check your zoo with \`wzoo\` to see all animal names!*`
        )
        .setFooter({ text: `Use 'whelp battle' for battle guide!` });
      return message.reply({ embeds: [embed] });
    }
    
    if (sub === 'battle' || sub === 'wb' || sub === 'b' || sub === 'pvp') {
      const embed = new EmbedBuilder()
        .setColor('#f04747')
        .setTitle(`⚔️ Battle Commands Guide`)
        .setDescription(
          `**Fight monsters or challenge other players!**\n\n` +
          `🗡️ **PvE Battle (vs Monsters)**\n` +
          `\`wb\` or \`wbattle\` — Fight wild monsters for XP & Cowoncy\n\n` +
          `⚔️ **PvP Battle (vs Players)**\n` +
          `\`wb @user\` — Challenge another player to a duel!\n` +
          `• They get Accept/Decline buttons\n` +
          `• Winner gets 800-1200 Cowoncy + 300 XP\n` +
          `• Loser gets 150 Cowoncy consolation\n` +
          `• Per-pet combat with crits, dodges, defeats\n\n` +
          `🐲 **Guild Boss**\n` +
          `\`wboss\` — Fight the Guild Boss for big rewards!\n\n` +
          `💡 **Tips:**\n` +
          `• Build your team first: \`wteam add {animal} {slot}\`\n` +
          `• Equip weapons for stat bonuses: \`wweapon\` → \`wequip {slot} {code}\`\n` +
          `• Match weapon types to pet builds for **synergy bonuses**!`
        )
        .setFooter({ text: `Use 'whelp team' for team setup guide!` });
      return message.reply({ embeds: [embed] });
    }
    
    if (sub === 'zoo' || sub === 'hunt' || sub === 'animals') {
      const embed = new EmbedBuilder()
        .setColor('#8a7ff8')
        .setTitle(`🌿 Zoo & Hunting Guide`)
        .setDescription(
          `**Catch animals, build your collection!**\n\n` +
          `🏹 **Hunting**\n` +
          `\`wh\` or \`whunt\` — Hunt for animals (15s cooldown)\n` +
          `• Catches 1-3 animals per hunt\n` +
          `• Rarer tiers = rarer drops\n\n` +
          `🐾 **View Zoo**\n` +
          `\`wzoo\` — View your full animal collection\n` +
          `\`wzoo @user\` — View someone else's zoo\n\n` +
          `📖 **OwoDex**\n` +
          `\`wdex\` — View completion progress for all tiers\n\n` +
          `💰 **Sell Animals**\n` +
          `\`wsell all\` — Sell all duplicate animals (keeps 1 each)\n` +
          `\`wsell common\` — Sell only common duplicates\n` +
          `\`wsell dog 5\` — Sell 5 Dogs\n\n` +
          `🔮 **Sacrifice**\n` +
          `\`wsc all\` — Sacrifice duplicates for Magical Essence\n\n` +
          `🏷️ **Display Mascot**\n` +
          `\`wdisplay {animal}\` — Set your profile mascot\n\n` +
          `**🎲 Animal Tiers:**\n` +
          `Common (55%) → Uncommon (26%) → Rare (12%) → Epic (5%)\n` +
          `→ Mythic (1.5%) → Legendary (0.4%) → Fabled (0.08%) → Gem (0.02%)`
        )
        .setFooter({ text: `Use 'whelp team' to learn how to add animals to your team!` });
      return message.reply({ embeds: [embed] });
    }
    
    if (sub === 'weapon' || sub === 'weapons' || sub === 'equip' || sub === 'wequip') {
      const embed = new EmbedBuilder()
        .setColor('#ff9800')
        .setTitle(`⚔️ Weapons & Equipment Guide`)
        .setDescription(
          `**Equip weapons to boost your battle pets!**\n\n` +
          `🗡️ **View Weapons**\n` +
          `\`ww\` or \`wweapon\` — View your weapon armory\n\n` +
          `⚔️ **Equip Weapon to Pet Slot**\n` +
          `\`wequip {slot} {weapon_code}\`\n` +
          `• \`wequip 1 FV9XWP\` — Equip to pet in slot 1\n` +
          `• \`wequip 2 AB3CDE\` — Equip to pet in slot 2\n\n` +
          `🚫 **Unequip**\n` +
          `\`wequip unequip\` or \`wunequip\` — Remove weapon\n\n` +
          `🔨 **Dismantle**\n` +
          `\`wdismantle {code}\` — Scrap weapon for Cowoncy\n\n` +
          `⭐ **Build Synergy:**\n` +
          `Each animal has a preferred weapon type (Tank, Assassin, Sniper, Mage, Brawler).\n` +
          `Matching the right weapon = **bonus HP, ATK, DEF, CRIT!**\n` +
          `Check your pet's build type in \`wteam\``
        )
        .setFooter({ text: `Get weapons from crates: 'wopen' or 'wlootbox'` });
      return message.reply({ embeds: [embed] });
    }
    
    if (sub === 'gamble' || sub === 'gambling' || sub === 'slots' || sub === 'casino') {
      const embed = new EmbedBuilder()
        .setColor('#ffcc00')
        .setTitle(`🎰 Gambling Guide`)
        .setDescription(
          `**Try your luck and win big!**\n\n` +
          `🎰 **Slots**\n` +
          `\`ws {amount}\` or \`wslots all\` — Spin the slot machine\n\n` +
          `🪙 **Coinflip**\n` +
          `\`wcf {amount} heads/tails\` — Flip a coin\n\n` +
          `🃏 **Blackjack**\n` +
          `\`wbj {amount}\` — Play blackjack\n\n` +
          `🎡 **Roulette**\n` +
          `\`wroulette {amount} {color/number}\`\n\n` +
          `📊 **High-Low**\n` +
          `\`whl {amount}\` — Guess higher or lower\n\n` +
          `💣 **Mines**\n` +
          `\`wm {amount}\` — Minesweeper gambling\n\n` +
          `🐌 **Snail Garden**\n` +
          `\`wsnail {amount}\` — Race your snail!\n\n` +
          `💡 *Use \`all\` or \`max\` to bet everything!*`
        )
        .setFooter({ text: `Don't gamble what you can't afford to lose! 😅` });
      return message.reply({ embeds: [embed] });
    }
    
    if (sub === 'social' || sub === 'actions' || sub === 'emotes') {
      const embed = new EmbedBuilder()
        .setColor('#ff66b2')
        .setTitle(`🤗 Social & Actions Guide`)
        .setDescription(
          `**Interact with friends!**\n\n` +
          `💖 **Romance**\n` +
          `\`wmarry @user\` — Propose (need Love Ring from shop)\n` +
          `\`wdivorce\` — End marriage\n` +
          `\`wship @user1 @user2\` — Ship compatibility\n\n` +
          `🤗 **Actions** (use with @user or alone)\n` +
          `\`whug\` \`wkiss\` \`wpat\` \`wheadpat\` \`wslap\` \`wpunch\`\n` +
          `\`wcuddle\` \`wsnuggle\` \`wboop\` \`wbite\` \`wlick\`\n` +
          `\`wpoke\` \`wtickle\` \`wbonk\` \`wyeet\` \`wglomp\`\n` +
          `\`wtackle\` \`wchase\` \`wpounce\` \`wnuzzle\` \`wbully\`\n\n` +
          `😂 **Fun**\n` +
          `\`wspongebobchicken\` \`wzombie\` \`wdab\` \`wfacepalm\`\n` +
          `\`weject @user\` — Among Us ejection\n\n` +
          `😃 **Emotes** (solo expressions)\n` +
          `\`wblush\` \`wcry\` \`wdance\` \`wsmile\` \`wsmug\`\n` +
          `\`wthinking\` \`wtriggered\` \`whappy\` \`wlewd\`\n\n` +
          `🎱 **Misc**\n` +
          `\`w8b {question}\` — Magic 8-Ball\n` +
          `\`wchoose {a} or {b}\` — Random choice\n` +
          `\`wroll\` — Roll 1-100\n` +
          `\`wav @user\` — View avatar`
        );
      return message.reply({ embeds: [embed] });
    }
    
    if (sub === 'economy' || sub === 'money' || sub === 'cowoncy') {
      const embed = new EmbedBuilder()
        .setColor('#4caf50')
        .setTitle(`💰 Economy Guide`)
        .setDescription(
          `**Earn and spend Cowoncy!**\n\n` +
          `🪙 **Earn Cowoncy**\n` +
          `\`wdaily\` — Daily reward (streak bonuses!)\n` +
          `\`whunt\` — Catch & sell animals\n` +
          `\`wb\` — Win battles\n` +
          `\`wpray @user\` — Pray to someone\n` +
          `\`wcookie @user\` — Give someone a cookie\n` +
          `Just type \`owo\` or \`uwu\` — Passive 5-15 cowoncy\n\n` +
          `💸 **Spend Cowoncy**\n` +
          `\`wshop\` — View the shop\n` +
          `\`wbuy {item}\` — Buy items\n` +
          `\`wgive @user {amount}\` — Send cowoncy\n\n` +
          `📦 **Crates & Lootboxes**\n` +
          `\`wopen\` or \`wlootbox\` — Open crates\n` +
          `\`winv\` — View your inventory\n\n` +
          `🏆 **Quests**\n` +
          `\`wquest\` or \`wcl\` — View daily quests for bonus rewards`
        );
      return message.reply({ embeds: [embed] });
    }
    
    // ===== MAIN HELP PAGE =====
    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setTitle(`📖 OwO Bot Command Guide ${getRandomFace()}`)
      .setDescription(
        `**Prefix:** \`owo\`, \`w\`, or just attach to command (e.g. \`whunt\`, \`wzoo\`)\n` +
        `For detailed guides, use \`whelp {category}\`\n\n` +
        `🐾 **Team & Battle** — \`whelp team\` / \`whelp battle\`\n` +
        `\`wteam\` \`wteam add {animal} {slot}\` \`wb\` \`wb @user\` \`wboss\`\n` +
        `\`wsetteam\` \`wteam rename\` \`wteam equip\`\n\n` +
        `🌿 **Zoo & Hunting** — \`whelp zoo\`\n` +
        `\`whunt\` \`wzoo\` \`wsell\` \`wsc\` \`wdex\` \`wdisplay\` \`wautohunt\`\n\n` +
        `⚔️ **Weapons** — \`whelp weapon\`\n` +
        `\`ww\` \`wequip\` \`wunequip\` \`wdismantle\`\n\n` +
        `💰 **Economy** — \`whelp economy\`\n` +
        `\`wdaily\` \`wcash\` \`wgive\` \`wshop\` \`wbuy\` \`winv\` \`wopen\` \`wquest\`\n\n` +
        `🎰 **Gambling** — \`whelp gamble\`\n` +
        `\`wslots\` \`wcf\` \`wbj\` \`wroulette\` \`whl\` \`wmines\` \`wsnail\`\n\n` +
        `🤗 **Social & Fun** — \`whelp social\`\n` +
        `\`wmarry\` \`wship\` \`whug\` \`wkiss\` \`wpat\` \`wspongebobchicken\`\n` +
        `\`wzombie\` \`wbonk\` \`wyeet\` \`weject\` \`wav\` \`w8b\`\n\n` +
        `📊 **Profile & Stats**\n` +
        `\`wmy\` \`wlvl\` \`wtop\` \`wping\` \`wstats\`\n\n` +
        `💡 **Quick Tips:**\n` +
        `• Animal names support spaces, underscores, and partial matches\n` +
        `  e.g. \`frost_kitsune\`, \`frost kitsune\`, \`kitsune\` all work!\n` +
        `• Use \`all\` or \`max\` for amount in gambling commands`
      )
      .setFooter({ text: `OwO Bot • Type 'whelp {category}' for detailed guides!` });

    return message.reply({ embeds: [embed] });
  }
};
