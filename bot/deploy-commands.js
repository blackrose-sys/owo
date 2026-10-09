require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder().setName('hunt').setDescription('Hunt for wild animals across all rarities!'),
  new SlashCommandBuilder().setName('daily').setDescription('Claim your daily Cowoncy reward and streak bonus!'),
  new SlashCommandBuilder().setName('zoo').setDescription('View your complete animal collection and completion %!'),
  new SlashCommandBuilder().setName('balance').setDescription('Check your current Cowoncy wallet balance.'),
  new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Spin the slot machine for up to 10x jackpot!')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to bet').setRequired(true)),
  new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin double or nothing!')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to bet').setRequired(true))
    .addStringOption(opt => opt.setName('choice').setDescription('heads or tails').addChoices(
      { name: 'Heads', value: 'heads' },
      { name: 'Tails', value: 'tails' }
    )),
  new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Play interactive blackjack with 👊 and 🛑 buttons!')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to bet').setRequired(true)),
  new SlashCommandBuilder()
    .setName('highlow')
    .setDescription('Play Higher or Lower card betting!')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to bet').setRequired(true)),
  new SlashCommandBuilder().setName('battle').setDescription('Fight dungeon monsters with your battle team!'),
  new SlashCommandBuilder().setName('team').setDescription('View and manage your active battle team.'),
  new SlashCommandBuilder().setName('weapon').setDescription('View and manage your armory weapons.'),
  new SlashCommandBuilder().setName('shop').setDescription('Browse crates, rings, and powerups in the shop.'),
  new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy an item from the shop')
    .addStringOption(opt => opt.setName('item').setDescription('Item ID (e.g. ring, crate_rare)').setRequired(true))
    .addIntegerOption(opt => opt.setName('quantity').setDescription('Quantity to purchase')),
  new SlashCommandBuilder()
    .setName('marry')
    .setDescription('Propose marriage to someone special!')
    .addUserOption(opt => opt.setName('user').setDescription('The user to marry').setRequired(true)),
  new SlashCommandBuilder().setName('profile').setDescription('View your full player card and stats.'),
  new SlashCommandBuilder().setName('top').setDescription('View top Cowoncy and Hunter leaderboards.'),
  new SlashCommandBuilder().setName('help').setDescription('View the complete OwO command guide.')
].map(command => command.toJSON());

async function deploySlashCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    console.error('Please set DISCORD_TOKEN and DISCORD_CLIENT_ID in .env before deploying slash commands.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );
    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error('Error deploying slash commands:', error);
  }
}

if (require.main === module) {
  deploySlashCommands();
}

module.exports = { deploySlashCommands };
