const { Client, GatewayIntentBits, Partials, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { handleMessage, handleInteraction } = require('./handlers/commandHandler');

let client = null;
let botStatus = {
  isOnline: false,
  tag: null,
  id: null,
  avatar: null,
  guildCount: 0,
  userCount: 0,
  ping: 0,
  startedAt: null,
  error: null
};

function createClient() {
  if (client) return client;

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
  });

  client.once('ready', async () => {
    botStatus.isOnline = true;
    botStatus.tag = client.user.tag;
    botStatus.id = client.user.id;
    botStatus.avatar = client.user.displayAvatarURL();
    botStatus.guildCount = client.guilds.cache.size;
    botStatus.userCount = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
    botStatus.ping = Math.round(client.ws.ping);
    botStatus.startedAt = Date.now();
    botStatus.error = null;

    console.log(`[OwO Bot] Logged in successfully as ${client.user.tag}! Active in ${client.guilds.cache.size} servers.`);

    // Pre-cache application emojis & create custom emojis if missing
    if (client.application?.emojis) {
      try {
        await client.application.emojis.fetch().catch(() => {});
        const customEmojiList = [
          { name: 'cowoncy', path: path.join(__dirname, '..', 'public', 'cowoncy.png') },
          { name: 'gojo', path: path.join(__dirname, '..', 'assets', 'emojis', 'gojo.png') },
          { name: 'sukuna', path: path.join(__dirname, '..', 'assets', 'emojis', 'sukuna.png') },
          { name: 'saitama', path: path.join(__dirname, '..', 'assets', 'emojis', 'saitama.png') },
        ];

        for (const item of customEmojiList) {
          let found = client.application.emojis.cache.find(e => e.name.toLowerCase() === item.name);
          if (!found && fs.existsSync(item.path)) {
            found = await client.application.emojis.create({ name: item.name, attachment: item.path });
            console.log(`[OwO Bot] Created custom application emoji <:${item.name}:${found.id}>!`);
          }
        }
      } catch (err) {
        console.log('[OwO Bot] Custom emoji check note:', err.message);
      }
      console.log(`[OwO Bot] Cached ${client.application.emojis.cache.size} custom emojis.`);
    }

    // Cycle cute presence
    const presences = [
      () => `owo help | in ${client.guilds.cache.size} servers`,
      () => `owo hunt | catching animals!`,
      () => `owo slots | winning jackpots!`,
      () => `owo bj | playing blackjack!`,
      () => `owo daily | claim your cowoncy!`
    ];
    let pIdx = 0;

    setInterval(() => {
      if (client && client.user) {
        const text = presences[pIdx % presences.length]();
        client.user.setActivity(text, { type: ActivityType.Playing });
        pIdx++;
        botStatus.guildCount = client.guilds.cache.size;
        botStatus.ping = Math.round(client.ws.ping);
      }
    }, 20000);
  });

  client.on('messageCreate', async (message) => {
    try {
      await handleMessage(message);
    } catch (err) {
      console.error('[OwO Bot] messageCreate error:', err);
    }
  });

  client.on('interactionCreate', async (interaction) => {
    try {
      await handleInteraction(interaction);
    } catch (err) {
      console.error('[OwO Bot] interactionCreate error:', err);
    }
  });

  client.on('error', (err) => {
    console.error('[OwO Bot] Client error:', err);
    botStatus.error = err.message;
  });

  return client;
}

async function startBot(token) {
  if (!token) {
    botStatus.error = 'No Discord bot token provided.';
    return false;
  }

  try {
    const botClient = createClient();
    await botClient.login(token);
    return true;
  } catch (err) {
    botStatus.error = err.message;
    console.error('[OwO Bot] Failed to login with token:', err.message);
    return false;
  }
}

function getBotStatus() {
  if (client && client.ws) {
    botStatus.ping = Math.round(client.ws.ping);
    if (client.guilds) {
      botStatus.guildCount = client.guilds.cache.size;
      botStatus.userCount = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
    }
  }
  return botStatus;
}

module.exports = {
  createClient,
  startBot,
  getBotStatus,
  getClient: () => client
};
