require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { WebSocketServer } = require('ws');
const db = require('./database/db');
const { ANIMALS, TIER_INFO, getRandomAnimals } = require('./database/data/animals');
const { SHOP_ITEMS, WEAPONS, getItemById, getWeaponById } = require('./database/data/items');
const { owoify, getRandomFace } = require('./database/data/dialogue');
const { startBot, getBotStatus, getClient } = require('./bot/client');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

process.on('unhandledRejection', (reason, promise) => {
  console.error('[OwO Server] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[OwO Server] Uncaught Exception:', err);
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Broadcast to connected web clients
function broadcast(type, data) {
  const payload = JSON.stringify({ type, data, timestamp: Date.now() });
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
}

// REST APIs
// 1. Bot & System status
app.get('/api/status', (req, res) => {
  const status = getBotStatus();
  const clientId = status.id || process.env.DISCORD_CLIENT_ID || '';
  const inviteUrl = clientId 
    ? `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot%20applications.commands&permissions=277025508416`
    : null;

  res.json({
    ...status,
    inviteUrl,
    hasEnvToken: Boolean(process.env.DISCORD_TOKEN)
  });
});

// 2. Start bot with token
app.post('/api/bot/start', async (req, res) => {
  const { token, clientId } = req.body;
  const targetToken = token || process.env.DISCORD_TOKEN;

  if (!targetToken) {
    return res.status(400).json({ success: false, message: 'Please provide a Discord bot token.' });
  }

  const started = await startBot(targetToken);
  res.json({
    success: started,
    status: getBotStatus()
  });
});

// 3. Animals database & statistics
app.get('/api/animals', (req, res) => {
  res.json({
    animals: ANIMALS,
    tiers: TIER_INFO
  });
});

// 4. Shop catalogue
app.get('/api/shop', (req, res) => {
  res.json({
    items: SHOP_ITEMS,
    weapons: WEAPONS
  });
});

// 5. Global Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const cowoncyTop = db.getTopUsers('cowoncy', 15);
  const huntsTop = db.getTopUsers('hunts', 15);
  res.json({
    cowoncy: cowoncyTop,
    hunts: huntsTop
  });
});

// 6. User profile
app.get('/api/user/:id', (req, res) => {
  const userId = req.params.id;
  const user = db.getUser(userId, req.query.username || 'Adventurer');
  const zoo = db.getZoo(userId);
  const inventory = db.getInventory(userId);
  const team = db.stmts.getTeam.all(userId);
  const quest = db.getDailyQuest(userId);

  res.json({
    user,
    zoo,
    inventory,
    team,
    quest
  });
});

// Admin Cash Injection & User Management APIs
app.get('/api/admin/users', (req, res) => {
  try {
    const users = db.getAllUsers(200);
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/give-cash', (req, res) => {
  try {
    let { userId, username, amount, mode = 'add' } = req.body;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid User ID.' });
    }
    userId = userId.trim();

    const parsedAmount = Math.floor(Number(amount));
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a valid non-negative number.' });
    }

    // Ensure the user exists in database
    const user = db.getUser(userId, username || 'Adventurer');

    let updatedUser;
    if (mode === 'set') {
      updatedUser = db.setCowoncy(userId, parsedAmount);
    } else {
      updatedUser = db.addCowoncy(userId, parsedAmount);
    }

    // Broadcast balance update event to all active web clients
    broadcast('balance_update', {
      userId: updatedUser.id,
      username: updatedUser.username,
      cowoncy: updatedUser.cowoncy
    });

    res.json({
      success: true,
      user: updatedUser,
      message: mode === 'set'
        ? `Successfully set ${updatedUser.username}'s balance to ${updatedUser.cowoncy.toLocaleString()} Cowoncy!`
        : `Successfully added +${parsedAmount.toLocaleString()} Cowoncy to ${updatedUser.username}! New balance: ${updatedUser.cowoncy.toLocaleString()} Cowoncy.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Interactive Browser Gameplay Engine
// Allows playing games directly in the web app or virtual terminal
app.post('/api/play', (req, res) => {
  const { userId = 'web_player', username = 'Adventurer', action, args = [] } = req.body;
  const user = db.getUser(userId, username);

  if (action === 'daily') {
    const now = Math.floor(Date.now() / 1000);
    const hoursSinceLast = (now - (user.last_daily || 0)) / 3600;

    if (hoursSinceLast < 24) {
      const wait = (24 - hoursSinceLast).toFixed(1);
      return res.json({ success: false, message: `⏰ Nuuu! Wait **${wait} hours** before claiming daily again! ${getRandomFace()}` });
    }

    let streak = (hoursSinceLast < 48) ? (user.daily_streak || 0) + 1 : 1;
    const base = 1500;
    const streakBonus = Math.min(streak * 100, 3000);
    const total = base + streakBonus;

    db.stmts.updateDaily.run(now, streak, total, userId);
    db.stmts.addXp.run(50, userId);

    return res.json({
      success: true,
      message: `✨ Claimed **+${total.toLocaleString()} Cowoncy**! Daily streak: \`${streak} days\`!`,
      cowoncyAdded: total,
      user: db.getUser(userId)
    });
  }

  if (action === 'hunt') {
    const hasLuck = (user.luck_boost_until || 0) > Math.floor(Date.now() / 1000);
    const count = user.bait_charges > 0 ? 3 : (Math.random() < 0.25 ? 1 : Math.random() < 0.75 ? 2 : 3);
    const caught = getRandomAnimals(count, hasLuck ? 1.5 : 0);

    db.recordHunt(userId, caught);
    db.updateQuestProgress(userId, 'hunt');

    // Broadcast live hunt event to web users!
    broadcast('hunt', { username: user.username, caught });

    return res.json({
      success: true,
      caught,
      message: `🌲 Caught: ${caught.map(c => `${c.emoji} ${c.name} (${c.tier})`).join(', ')}!`,
      user: db.getUser(userId)
    });
  }

  if (action === 'coinflip') {
    const bet = parseInt(args[0], 10) || 50;
    const choice = (args[1] || 'heads').toLowerCase();
    if (user.cowoncy < bet) {
      return res.json({ success: false, message: `❌ You only have ${user.cowoncy} Cowoncy!` });
    }

    const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = choice.startsWith(outcome[0]);

    db.updateQuestProgress(userId, 'cf');
    if (won) {
      db.addCowoncy(userId, bet);
      return res.json({
        success: true,
        won: true,
        outcome,
        message: `🪙 Coin landed on **${outcome.toUpperCase()}**! You won **+${bet.toLocaleString()} Cowoncy**!`,
        user: db.getUser(userId)
      });
    } else {
      db.addCowoncy(userId, -bet);
      return res.json({
        success: true,
        won: false,
        outcome,
        message: `🪙 Coin landed on **${outcome.toUpperCase()}**! You lost **-${bet.toLocaleString()} Cowoncy** ;w;`,
        user: db.getUser(userId)
      });
    }
  }

  if (action === 'slots') {
    const bet = parseInt(args[0], 10) || 50;
    if (user.cowoncy < bet) {
      return res.json({ success: false, message: `❌ You only have ${user.cowoncy} Cowoncy!` });
    }

    db.addCowoncy(userId, -bet);
    db.updateQuestProgress(userId, 'slots');

    const symbols = ['💎', '👑', '🍒', '🍇', '🍋', '🍆'];
    const r1 = symbols[Math.floor(Math.random() * symbols.length)];
    const r2 = symbols[Math.floor(Math.random() * symbols.length)];
    const r3 = symbols[Math.floor(Math.random() * symbols.length)];

    let multiplier = 0;
    if (r1 === r2 && r2 === r3) {
      multiplier = (r1 === '💎') ? 10 : (r1 === '👑') ? 7 : (r1 === '🍒') ? 5 : 3;
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      multiplier = 2;
    }

    const winnings = bet * multiplier;
    if (winnings > 0) db.addCowoncy(userId, winnings);

    if (multiplier >= 7) {
      broadcast('jackpot', { username: user.username, amount: winnings });
    }

    return res.json({
      success: true,
      reels: [r1, r2, r3],
      multiplier,
      winnings,
      message: multiplier > 0 
        ? `🎰 [ ${r1} | ${r2} | ${r3} ] — Won **+${winnings.toLocaleString()} Cowoncy** (${multiplier}x)!`
        : `🎰 [ ${r1} | ${r2} | ${r3} ] — Lost -${bet.toLocaleString()} Cowoncy ;w;`,
      user: db.getUser(userId)
    });
  }

  if (action === 'buy') {
    const itemId = args[0];
    const qty = Math.max(1, parseInt(args[1], 10) || 1);
    const item = getItemById(itemId);
    if (!item) return res.json({ success: false, message: 'Item not found in shop!' });

    const totalCost = item.price * qty;
    if (user.cowoncy < totalCost) {
      return res.json({ success: false, message: `Not enough Cowoncy! Needs ${totalCost}, have ${user.cowoncy}.` });
    }

    db.addCowoncy(userId, -totalCost);
    db.addItem(userId, item.id, qty);
    return res.json({
      success: true,
      message: `Purchased ${qty}x ${item.name}!`,
      user: db.getUser(userId)
    });
  }

  if (action === 'equip') {
    const userWeapons = db.stmts.getUserWeapons.all(userId);
    const target = (args.join(' ') || '').toLowerCase().trim();

    if (!target) {
      const equipped = userWeapons.find(w => w.is_equipped === 1);
      const equippedData = equipped ? getWeaponById(equipped.weapon_id) : null;
      return res.json({
        success: true,
        userWeapons,
        equipped: equippedData ? { ...equippedData, level: equipped.level } : null,
        message: equippedData 
          ? `⚔️ **Equipped Weapon:** ${equippedData.emoji} **${equippedData.name}** (Lv.${equipped.level}) *(+${equippedData.atk + (equipped.level - 1) * 5} ATK, +${equippedData.def + (equipped.level - 1) * 3} DEF, +${equippedData.crit}% Crit)*`
          : `*No weapon equipped! Type \`wequip <name>\` or \`wequip 1\` to equip a weapon.*`
      });
    }

    if (['unequip', 'none', 'off', 'remove'].includes(target)) {
      db.stmts.unequipAllWeapons.run(userId);
      return res.json({
        success: true,
        message: `⚔️ Unequipped your weapon!`
      });
    }

    if (userWeapons.length === 0) {
      return res.json({
        success: false,
        message: `❌ You do not own any weapons yet! Buy an Armory Crate from the Emporium shop or open crates!`
      });
    }

    let match = null;
    const num = parseInt(target, 10);
    if (!isNaN(num) && num >= 1 && num <= userWeapons.length) {
      match = userWeapons[num - 1];
    } else if (!isNaN(num)) {
      match = userWeapons.find(w => w.id === num);
    }

    if (!match) {
      match = userWeapons.find(w => {
        const data = getWeaponById(w.weapon_id);
        return data && (
          data.name.toLowerCase().includes(target) || 
          data.id.toLowerCase() === target ||
          w.weapon_id.toLowerCase() === target
        );
      });
    }

    if (!match) {
      return res.json({
        success: false,
        message: `❌ Weapon \`${target}\` not found in your armory! Type \`wequip\` to view your weapons.`
      });
    }

    db.stmts.unequipAllWeapons.run(userId);
    db.stmts.equipWeapon.run(userId, match.id);

    const data = getWeaponById(match.weapon_id);
    const bonusAtk = data.atk + (match.level - 1) * 5;
    const bonusDef = data.def + (match.level - 1) * 3;

    return res.json({
      success: true,
      weapon: { ...data, level: match.level },
      message: `⚔️ Equipped ${data.emoji} **${data.name}** (Lv.${match.level})! *(+${bonusAtk} ATK, +${bonusDef} DEF, +${data.crit}% Crit)*`
    });
  }

  return res.json({ success: false, message: 'Unknown action.' });
});

// Auto-start bot if DISCORD_TOKEN is set in environment
if (process.env.DISCORD_TOKEN) {
  console.log('[OwO Server] DISCORD_TOKEN found in environment. Launching Discord bot...');
  startBot(process.env.DISCORD_TOKEN);
} else {
  console.log('[OwO Server] No DISCORD_TOKEN found yet. You can enter one via the Web Dashboard or .env file.');
}

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`✨ OwO Bot & Web Companion running at: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
