const { EmbedBuilder } = require('discord.js');
const db = require('../../database/db');
const economy = require('../commands/economy');
const zoo = require('../commands/zoo');
const gambling = require('../commands/gambling');
const battle = require('../commands/battle');
const social = require('../commands/social');
const shop = require('../commands/shop');
const profile = require('../commands/profile');
const admin = require('../commands/admin');
const { getRandomFace } = require('../../database/data/dialogue');
const { checkCooldown } = require('./cooldownHandler');

// Command alias registry
const COMMANDS = {
  // Economy
  daily: economy.daily,
  d: economy.daily,
  balance: economy.balance,
  bal: economy.balance,
  cash: economy.balance,
  money: economy.balance,
  cowoncy: economy.balance,
  currency: economy.balance,
  credit: economy.balance,
  credits: economy.balance,
  c: economy.balance,
  give: economy.give,
  send: economy.give,
  pay: economy.give,
  vote: economy.vote,
  topgg: economy.vote,
  lottery: economy.lottery,
  lotto: economy.lottery,
  quest: economy.quest,
  quests: economy.quest,
  cl: economy.quest,
  checklist: economy.quest,
  q: economy.quest,
  pray: economy.pray,
  curse: economy.curse,
  cookie: economy.cookie,
  cookies: economy.cookie,

  // Meme & Voting
  eject: social.eject,
  weject: social.eject,
  voteoff: social.eject,

  // Zoo & Compendium
  hunt: zoo.hunt,
  h: zoo.hunt,
  zoo: zoo.zoo,
  z: zoo.zoo,
  sell: zoo.sell,
  sacrifice: zoo.sacrifice,
  sc: zoo.sacrifice,
  display: zoo.display,
  owodex: zoo.owodex,
  dex: zoo.owodex,
  autohunt: zoo.autohunt,
  ah: zoo.autohunt,
  rename: zoo.rename,

  // Gambling
  coinflip: gambling.coinflip,
  cf: gambling.coinflip,
  flip: gambling.coinflip,
  slots: gambling.slots,
  slot: gambling.slots,
  s: gambling.slots,
  blackjack: gambling.blackjack,
  bj: gambling.blackjack,
  roulette: gambling.roulette,
  highlow: gambling.highlow,
  hl: gambling.highlow,
  whl: gambling.highlow,
  mines: gambling.mines,
  m: gambling.mines,
  wm: gambling.mines,
  snailgarden: gambling.snailgarden,
  snail: gambling.snailgarden,
  snails: gambling.snailgarden,

  // Battle & Weapons
  battle: battle.battle,
  b: battle.battle,
  wb: battle.battle,
  fight: battle.battle,
  team: battle.team,
  wteam: battle.team,
  t: battle.team,
  tm: battle.team,
  owotm: battle.team,
  wtm: battle.team,
  wt: battle.team,
  setteam: (message, args, user) => {
    const num = parseInt(args[0], 10) || 1;
    if (num < 1 || num > 2) return message.reply('❌ Team number must be 1 or 2! Usage: `owo setteam <1/2>`');
    if (db.stmts.setActiveTeam) db.stmts.setActiveTeam.run(num, user.id);
    return message.reply(`✅ Switched active battle team to **Team ${num}**! ⭐`);
  },
  wsetteam: (message, args, user) => {
    const num = parseInt(args[0], 10) || 1;
    if (num < 1 || num > 2) return message.reply('❌ Team number must be 1 or 2! Usage: `wsetteam <1/2>`');
    if (db.stmts.setActiveTeam) db.stmts.setActiveTeam.run(num, user.id);
    return message.reply(`✅ Switched active battle team to **Team ${num}**! ⭐`);
  },
  weapon: battle.weapon,
  weapons: battle.weapon,
  wweapon: battle.weapon,
  wp: battle.weapon,
  owow: battle.weapon,
  ww: battle.weapon,
  equip: battle.equip,
  wequip: battle.equip,
  eq: battle.equip,
  we: battle.equip,
  dismantle: battle.dismantle,
  boss: battle.boss,
  wboss: battle.boss,

  // Shop, Crates & Unboxing
  shop: shop.shop,
  buy: shop.buy,
  inv: shop.inventory,
  inventory: shop.inventory,
  i: shop.inventory,
  use: shop.use,
  open: shop.use,
  crate: shop.use,
  crates: shop.use,
  lootbox: shop.use,
  lb: shop.use,
  box: shop.use,
  boxes: shop.use,

  // Social, Fun & RP
  marry: social.marry,
  divorce: social.divorce,
  owoify: social.owoify,
  avatar: social.avatar,
  av: social.avatar,
  pfp: social.avatar,
  ship: social.ship,
  '8b': social.eightball,
  eightball: social.eightball,
  choose: social.choose,
  roll: social.roll,
  dambi: (message, args) => social.action(message, 'dambi', args),
  wdambi: (message, args) => social.action(message, 'dambi', args),

  // Profile & System
  profile: profile.profile,
  my: profile.profile,
  p: profile.profile,
  level: profile.profile,
  lvl: profile.profile,
  top: profile.top,
  lb: profile.top,
  leaderboard: profile.top,
  help: profile.help,
  prefix: admin.prefix,
  ping: admin.ping,
  stats: admin.stats,
};

const SOCIAL_ACTIONS = [
  // Inter-personal Actions
  'dambi', 'punch', 'sex', 'dogstyle', 'doggystyle', 'hug', 'kiss', 'pat', 'pats', 'slap', 'bite', 'cuddle',
  'poke', 'lick', 'nom', 'stare', 'highfive', 'wave', 'greet', 'handholding',
  'hold', 'tickle', 'kill', 'boop', 'snuggle', 'bully',
  // Emotes & Expressions
  'blush', 'cry', 'dance', 'smile', 'pout', 'shrug', 'sleepy', 'smug',
  'thumbsup', 'thumbs', 'wag', 'thinking', 'thonking', 'triggered',
  'teehee', 'deredere', 'scoff', 'happy', 'grin', 'lewd'
];

async function handleMessage(message) {
  if (message.author.bot) return;

  const content = message.content.trim();
  const lower = content.toLowerCase();

  // Handle standalone 'owo' or 'uwu' (earns 1-15 passive cowoncy every 15s)
  if (lower === 'owo' || lower === 'uwu') {
    const cd = checkCooldown(message.author.id, 'owo_passive', 15);
    let passiveMsg = '';
    if (!cd) {
      const earned = Math.floor(Math.random() * 15) + 5;
      db.addCowoncy(message.author.id, earned);
      passiveMsg = ` *(+${earned} cowoncy)*`;
    }
    const faces = ['OwO What\'s this?', 'UwU', '(・`ω´・)', '>w<', 'rawr x3'];
    return message.reply(`${faces[Math.floor(Math.random() * faces.length)]}${passiveMsg}`);
  }

  const guildPrefix = (message.guild ? db.getGuildPrefix(message.guild.id) : 'owo').trim().toLowerCase();

  const words = content.split(/ +/);
  const firstWord = words[0].toLowerCase();
  const args = words.slice(1);

  let commandName = null;
  let rawArgs = args;

  // Case 1: Separate prefix with space (e.g. "owo hunt", "w bj all", "w cash")
  if (firstWord === 'owo' || firstWord === 'w' || firstWord === guildPrefix) {
    if (args.length > 0) {
      commandName = args[0].toLowerCase();
      rawArgs = args.slice(1);
    } else {
      return message.reply(`OwO What's this? Type \`owo help\` for a list of commands!`);
    }
  }
  // Case 2: Attached "owo" prefix without space (e.g. "owohunt", "owobj all", "owocash", "owocf all")
  else if (firstWord.startsWith('owo') && firstWord.length > 3) {
    const candidate = firstWord.slice(3);
    if (COMMANDS[candidate] || SOCIAL_ACTIONS.includes(candidate)) {
      commandName = candidate;
      rawArgs = args;
    }
  }
  // Case 3: Attached "w" prefix without space (e.g. "wbj all", "wcash", "wcf all", "wh", "ws all", "wzoo", "wcl", "wdaily", "wpray", "wcookie")
  else if (firstWord.startsWith('w') && firstWord.length > 1) {
    const candidate = firstWord.slice(1);
    if (COMMANDS[candidate] || SOCIAL_ACTIONS.includes(candidate)) {
      commandName = candidate;
      rawArgs = args;
    }
  }
  // Case 4: Custom guild prefix without space
  else if (guildPrefix && firstWord.startsWith(guildPrefix) && firstWord.length > guildPrefix.length) {
    const candidate = firstWord.slice(guildPrefix.length);
    if (COMMANDS[candidate] || SOCIAL_ACTIONS.includes(candidate)) {
      commandName = candidate;
      rawArgs = args;
    }
  }

  if (!commandName) return; // Not a recognized OwO command, ignore regular chatting

  // Ensure user is in database
  const user = db.getUser(message.author.id, message.author.username, typeof message.author.displayAvatarURL === 'function' ? message.author.displayAvatarURL() : '');

  try {
    // Check social action commands
    if (SOCIAL_ACTIONS.includes(commandName)) {
      return await social.action(message, commandName, rawArgs);
    }

    const handler = COMMANDS[commandName];
    if (handler) {
      return await handler(message, rawArgs, user);
    }
  } catch (err) {
    console.error(`Error executing command ${commandName}:`, err);
    message.reply(`Nuuu! An error occurred while executing that command: ${err.message} ${getRandomFace()}`).catch(() => {});
  }
}

async function handleInteraction(interaction) {
  if (interaction.isChatInputCommand()) {
    const commandName = interaction.commandName;
    const user = db.getUser(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const handler = COMMANDS[commandName];
    if (!handler) {
      return interaction.reply({ content: `Unknown command! ${getRandomFace()}`, ephemeral: true });
    }

    const mockMsg = {
      author: interaction.user,
      member: interaction.member,
      guild: interaction.guild,
      client: interaction.client,
      mentions: {
        users: {
          first: () => interaction.options.getUser('user') || null
        }
      },
      reply: async (payload) => {
        if (interaction.deferred || interaction.replied) {
          return await interaction.followUp(payload);
        }
        return await interaction.reply(payload);
      }
    };

    const args = [];
    const amt = interaction.options.getInteger('amount');
    if (amt !== null && amt !== undefined) args.push(amt.toString());
    const choice = interaction.options.getString('choice');
    if (choice) args.push(choice);
    const item = interaction.options.getString('item');
    if (item) args.push(item);
    const qty = interaction.options.getInteger('quantity');
    if (qty !== null && qty !== undefined) args.push(qty.toString());

    try {
      return await handler(mockMsg, args, user);
    } catch (err) {
      console.error('Error handling slash command:', err);
      const errMsg = `Nuuu! Error running command: ${err.message} ${getRandomFace()}`;
      if (interaction.deferred || interaction.replied) {
        return interaction.followUp({ content: errMsg, ephemeral: true });
      }
      return interaction.reply({ content: errMsg, ephemeral: true });
    }
  }

  if (interaction.isButton()) {
    // Handle claim quest button
    if (interaction.customId.startsWith('claim_quest_')) {
      const targetUserId = interaction.customId.replace('claim_quest_', '');
      if (interaction.user.id !== targetUserId) {
        return interaction.reply({ content: `This quest button is not for you! ${getRandomFace()}`, ephemeral: true });
      }

      const quest = db.getDailyQuest(interaction.user.id);
      if (quest.claimed === 1) {
        return interaction.reply({ content: `You have already claimed this today!`, ephemeral: true });
      }

      const huntDone = Math.min(quest.hunts_done, 5);
      const slotsDone = Math.min(quest.slots_done, 3);
      const cfDone = Math.min(quest.cf_done, 3);

      if (huntDone >= 5 && slotsDone >= 3 && cfDone >= 3) {
        db.stmts.upsertQuest.run(interaction.user.id, quest.day_key, quest.hunts_done, quest.slots_done, quest.cf_done, 1);
        db.addCowoncy(interaction.user.id, 3000);
        db.addItem(interaction.user.id, 'crate_rare', 1);

        return interaction.update({
          content: `🎉 **Claimed!** You received **3,000 Cowoncy** and **1x Rare Crate**! 🎁 ${getRandomFace()}`,
          components: []
        });
      } else {
        return interaction.reply({ content: `You have not finished all quests yet!`, ephemeral: true });
      }
    }
  }
}

module.exports = {
  handleMessage,
  handleInteraction,
  COMMANDS
};
