const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../database/db');
const { getRandomFace } = require('../../database/data/dialogue');

module.exports = {
  prefix: async (message, args, user) => {
    if (!message.guild) {
      return message.reply(`Prefix can only be customized inside a server!`);
    }

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return message.reply(`❌ You need **Manage Server** permissions to change the prefix!`);
    }

    const newPrefix = args[0];
    if (!newPrefix) {
      const current = db.getGuildPrefix(message.guild.id);
      return message.reply(`Current prefix for this server is: \`${current}\`\nUsage: \`owo prefix <new_prefix>\``);
    }

    if (newPrefix.length > 5) {
      return message.reply(`❌ Prefix cannot be longer than 5 characters!`);
    }

    db.setGuildPrefix(message.guild.id, newPrefix.endsWith(' ') ? newPrefix : newPrefix + ' ');
    return message.reply(`✅ Server prefix updated to \`${newPrefix}\`! ${getRandomFace()}`);
  },

  ping: async (message) => {
    const sent = await message.reply('🏓 Pong! Calculating latency...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    const apiPing = Math.round(message.client.ws.ping);

    const embed = new EmbedBuilder()
      .setColor('#00e5ff')
      .setDescription(`🏓 **Pong!** ${getRandomFace()}\n⏱️ **Roundtrip Latency:** \`${latency}ms\`\n💓 **WebSocket Ping:** \`${apiPing}ms\``);

    return sent.edit({ content: null, embeds: [embed] });
  },

  stats: async (message) => {
    const totalUsers = message.client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
    const totalGuilds = message.client.guilds.cache.size;
    const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const uptime = Math.floor(process.uptime());
    const uptimeStr = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`;

    const embed = new EmbedBuilder()
      .setColor('#8a7ff8')
      .setTitle(`📊 OwO Bot System Statistics`)
      .setDescription(
        `🤖 **Servers:** \`${totalGuilds}\`\n` +
        `👥 **Users Cached:** \`${totalUsers.toLocaleString()}\`\n` +
        `⚡ **Memory Usage:** \`${memory} MB\`\n` +
        `⏳ **Uptime:** \`${uptimeStr}\`\n` +
        `⚙️ **Node.js:** \`${process.version}\`\n` +
        `📦 **Discord.js:** \`v14.16.3\``
      )
      .setFooter({ text: 'OwO Bot • 100000x Better, Smooth, 100% Reliable' });

    return message.reply({ embeds: [embed] });
  }
};
