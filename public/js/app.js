// Master frontend controller for OwO Web Companion & Discord Simulator
const state = {
  userId: 'web_player',
  username: 'Ezmaronovich',
  user: null,
  zoo: [],
  animals: [],
  tiers: {},
  shopItems: [],
  weapons: [],
  botStatus: null,
  activeFilter: 'all'
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  initSoundToggle();
  await loadBotStatus();
  await loadAnimals();
  await loadShop();
  await loadUserData();
  await loadLeaderboards();
  setupChatInput();
  setupWebSocket();
});

// Navigation Tabs
function initTabs() {
  const tabs = document.querySelectorAll('.nav-item');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      if (!target) return;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(panel => {
        panel.classList.remove('active');
      });
      const activePanel = document.getElementById(`tab-${target}`);
      if (activePanel) activePanel.classList.add('active');
    });
  });
}

// Sound toggle
function initSoundToggle() {
  const btn = document.getElementById('sound-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      window.sound.muted = !window.sound.muted;
      btn.textContent = window.sound.muted ? '🔇' : '🔊';
    });
  }
}

// Fetch Bot Status
async function loadBotStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    state.botStatus = data;

    const dot = document.getElementById('bot-dot');
    const text = document.getElementById('bot-status-text');
    const inviteBtn = document.getElementById('invite-link-btn');

    if (data.isOnline) {
      dot.className = 'status-dot online';
      text.textContent = `Online (${data.guildCount || 0} servers)`;
    } else {
      dot.className = 'status-dot';
      text.textContent = 'Bot Standby (Offline)';
    }

    if (inviteBtn && data.inviteUrl) {
      inviteBtn.href = data.inviteUrl;
      inviteBtn.style.display = 'inline-flex';
    }
  } catch (err) {
    console.warn('Could not fetch bot status:', err);
  }
}

// Fetch Animals Master Data
async function loadAnimals() {
  try {
    const res = await fetch('/api/animals');
    const data = await res.json();
    state.animals = data.animals;
    state.tiers = data.tiers;
    renderZoo();
    setupZooFilters();
  } catch (err) {
    console.error('Failed to load animals:', err);
  }
}

// Fetch Shop
async function loadShop() {
  try {
    const res = await fetch('/api/shop');
    const data = await res.json();
    state.shopItems = data.items;
    state.weapons = data.weapons;
    renderShop();
  } catch (err) {
    console.error('Failed to load shop:', err);
  }
}

// Fetch User Data
async function loadUserData() {
  try {
    const res = await fetch(`/api/user/${state.userId}?username=${encodeURIComponent(state.username)}`);
    const data = await res.json();
    state.user = data.user;
    state.zoo = data.zoo;

    // Update wallet badge
    const balEl = document.getElementById('wallet-balance');
    if (balEl && data.user) {
      balEl.textContent = `${data.user.cowoncy.toLocaleString()} Cowoncy`;
    }

    renderZoo();
  } catch (err) {
    console.error('Failed to load user:', err);
  }
}

// Fetch Leaderboards
async function loadLeaderboards() {
  try {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();

    const cowoncyList = document.getElementById('lb-cowoncy-list');
    if (cowoncyList) {
      cowoncyList.innerHTML = data.cowoncy.map((u, i) => `
        <div class="lb-item">
          <div class="lb-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</div>
          <div class="lb-user">
            <span>${u.display_animal || '🐶'}</span>
            <span>${u.username}</span>
          </div>
          <div class="lb-score">🪙 ${u.cowoncy.toLocaleString()}</div>
        </div>
      `).join('');
    }

    const huntsList = document.getElementById('lb-hunts-list');
    if (huntsList) {
      huntsList.innerHTML = data.hunts.map((u, i) => `
        <div class="lb-item">
          <div class="lb-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</div>
          <div class="lb-user">
            <span>${u.display_animal || '🐶'}</span>
            <span>${u.username}</span>
          </div>
          <div class="lb-score">🌲 ${u.hunts.toLocaleString()}</div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load leaderboards:', err);
  }
}

// Render Zoo Cards
function renderZoo() {
  const container = document.getElementById('zoo-grid');
  if (!container || state.animals.length === 0) return;

  const zooMap = new Map(state.zoo.map(z => [z.animal_id, z.count]));

  const filtered = state.animals.filter(a => {
    if (state.activeFilter === 'all') return true;
    if (state.activeFilter === 'owned') return zooMap.has(a.id);
    return a.tier === state.activeFilter;
  });

  container.innerHTML = filtered.map(animal => {
    const count = zooMap.get(animal.id) || 0;
    const isOwned = count > 0;
    const tierMeta = state.tiers[animal.tier] || { name: animal.tier, color: '#aaa' };

    return `
      <div class="animal-card ${isOwned ? 'owned' : ''}">
        <div class="animal-emoji">${animal.emoji}</div>
        <div class="animal-name">${animal.name}</div>
        <div class="animal-tier" style="background: ${tierMeta.color}22; color: ${tierMeta.color}; border: 1px solid ${tierMeta.color}44;">
          ${tierMeta.name}
        </div>
        <div class="animal-count-badge">
          ${isOwned ? `Owned: <strong>x${count}</strong>` : '<span style="color: var(--text-dim)">Undiscovered</span>'}
        </div>
      </div>
    `;
  }).join('');
}

// Setup Zoo Filter Pills
function setupZooFilters() {
  const pills = document.querySelectorAll('.zoo-controls .filter-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.activeFilter = pill.dataset.filter;
      renderZoo();
    });
  });
}

// Render Shop
function renderShop() {
  const container = document.getElementById('shop-grid');
  if (!container) return;

  container.innerHTML = state.shopItems.map(item => `
    <div class="setup-card" style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <span style="font-size: 2.25rem;">${item.emoji}</span>
        <div>
          <div style="font-size: 1.1rem; font-weight: 700;">${item.name}</div>
          <div style="color: var(--text-muted); font-size: 0.85rem;">${item.description}</div>
          <div style="color: var(--accent-gold); font-weight: 700; margin-top: 0.25rem;">🪙 ${item.price.toLocaleString()} Cowoncy</div>
        </div>
      </div>
      <button class="btn btn-secondary" onclick="buyItem('${item.id}')">Buy 1x</button>
    </div>
  `).join('');
}

// Buy Item Handler
window.buyItem = async function(itemId) {
  try {
    const res = await fetch('/api/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: state.userId,
        username: state.username,
        action: 'buy',
        args: [itemId, 1]
      })
    });
    const data = await res.json();
    if (data.success) {
      window.sound.playCoin();
      appendBotMessage(`🛍️ **Purchased!** ${data.message}`);
      await loadUserData();
    } else {
      appendBotMessage(`❌ ${data.message}`);
    }
  } catch (err) {
    console.error(err);
  }
};

// Chat Input & Terminal System
function setupChatInput() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');

  function handleSend() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    executeCommand(text);
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  sendBtn.addEventListener('click', handleSend);
}

// Append User Message to Discord Lounge
function appendUserMessage(text) {
  const history = document.getElementById('chat-history');
  if (!history) return;

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const row = document.createElement('div');
  row.className = 'message-row';
  row.innerHTML = `
    <div class="msg-avatar" style="background: #e91e63;">E</div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-author">${state.username}</span>
        <span class="msg-time">Today at ${now}</span>
      </div>
      <div class="msg-text">${text}</div>
    </div>
  `;
  history.appendChild(row);
  history.scrollTop = history.scrollHeight;
}

// Append Bot Response (with optional embed)
function appendBotMessage(text, embed = null) {
  const history = document.getElementById('chat-history');
  if (!history) return;

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const row = document.createElement('div');
  row.className = 'message-row';

  let embedHtml = '';
  if (embed) {
    embedHtml = `
      <div class="discord-embed" style="border-left-color: ${embed.color || '#8a7ff8'};">
        ${embed.title ? `<div class="embed-title">${embed.title}</div>` : ''}
        ${embed.description ? `<div class="embed-desc">${embed.description}</div>` : ''}
        ${(embed.fields || []).map(f => `
          <div class="embed-field">
            <div class="embed-field-name">${f.name}</div>
            <div class="embed-field-value">${f.value}</div>
          </div>
        `).join('')}
        ${embed.footer ? `<div class="embed-footer">${embed.footer}</div>` : ''}
      </div>
    `;
  }

  row.innerHTML = `
    <div class="msg-avatar" style="border: 2px solid var(--accent-purple);">
      <img src="https://api.dicebear.com/7.x/bottts/svg?seed=OwO&backgroundColor=2a2254" alt="OwO" />
    </div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-author" style="color: var(--accent-purple);">(w) OwO</span>
        <span class="msg-badge">APP</span>
        <span class="msg-time">Today at ${now}</span>
      </div>
      ${text ? `<div class="msg-text">${text}</div>` : ''}
      ${embedHtml}
    </div>
  `;

  history.appendChild(row);
  history.scrollTop = history.scrollHeight;
}

// Master Command Executor (supports wbj all, wcash, wcf all, wh, ws all, wdaily, etc.)
async function executeCommand(rawCommand) {
  appendUserMessage(rawCommand);

  const clean = rawCommand.toLowerCase().trim();
  const words = clean.split(/ +/);
  const firstWord = words[0];
  let args = words.slice(1);
  let cmd = null;

  if (firstWord === 'owo' || firstWord === 'w') {
    if (args.length > 0) {
      cmd = args[0];
      args = args.slice(1);
    }
  } else if (firstWord.startsWith('owo') && firstWord.length > 3) {
    cmd = firstWord.slice(3);
  } else if (firstWord.startsWith('w') && firstWord.length > 1) {
    cmd = firstWord.slice(1);
  } else {
    cmd = firstWord;
  }

  function resolveBet(rawBet) {
    if (!rawBet) return '50';
    const s = rawBet.toLowerCase();
    const bal = state.user?.cowoncy || 1000;
    if (s === 'all' || s === 'a') return Math.min(bal, 250000).toString();
    if (s === 'half' || s === 'h') return Math.floor(Math.min(bal, 250000) / 2).toString();
    if (s.endsWith('k')) return (parseFloat(s) * 1000).toString();
    if (s.endsWith('m')) return (parseFloat(s) * 1000000).toString();
    return rawBet;
  }

  // Quick dispatch
  if (cmd === 'hunt' || cmd === 'h') {
    await runQuickAction('hunt');
  } else if (cmd === 'daily' || cmd === 'd') {
    await runQuickAction('daily');
  } else if (cmd === 'cf' || cmd === 'coinflip' || cmd === 'flip') {
    const bet = resolveBet(args[0]);
    const choice = args[1] || 'heads';
    await runQuickAction('coinflip', [bet, choice]);
  } else if (cmd === 's' || cmd === 'slots' || cmd === 'slot') {
    const bet = resolveBet(args[0]);
    await runQuickAction('slots', [bet]);
  } else if (cmd === 'bj' || cmd === 'blackjack') {
    const bet = resolveBet(args[0]);
    appendBotMessage(`🃏 **Blackjack (Bet: ${parseInt(bet).toLocaleString()} Cowoncy)**: Play with 👊 Hit, 🛑 Stand, and ⚡ Double buttons in Discord using \`wbj ${bet}\`!`);
  } else if (cmd === 'hl' || cmd === 'whl' || cmd === 'highlow') {
    const bet = resolveBet(args[0]);
    appendBotMessage(`🃏 **Higher or Lower (Bet: ${parseInt(bet).toLocaleString()} Cowoncy)**: Play the authentic Higher or Lower card streak game with cash out buttons in Discord using \`whl ${bet}\`!`);
  } else if (cmd === 'zoo' || cmd === 'z') {
    const totalAnimals = state.zoo.reduce((a, b) => a + b.count, 0);
    appendBotMessage(null, {
      title: `🐾 ${state.username}'s Zoo Collection`,
      description: `🏆 Unique Animals Discovered: \`${state.zoo.length}/${state.animals.length}\`\n📦 Total Animal Count: \`${totalAnimals}\`\n⭐ Mascot: 🐶 Dog`,
      color: '#8a7ff8'
    });
  } else if (cmd === 'cash' || cmd === 'bal' || cmd === 'money' || cmd === 'c') {
    const bal = state.user?.cowoncy || 1000;
    appendBotMessage(`💰 | **${state.username}**, you currently have **${bal.toLocaleString()}** Cowoncy!`);
  } else if (cmd === 'cl' || cmd === 'checklist' || cmd === 'quest' || cmd === 'q') {
    appendBotMessage(null, {
      title: `📜 Daily Checklist & Quests`,
      description: `Complete your daily tasks in Discord or here:\n• 🐾 Hunt 5 times\n• 🎰 Play Slots 3 times\n• 🪙 Play Coinflip 3 times\n\nReward: 3,000 Cowoncy + Rare Crate!`,
      color: '#8a7ff8'
    });
  } else if (cmd === 'cookie') {
    appendBotMessage(`🍪 | **${state.username}** sent a delicious cookie! Yum! ^w^`);
  } else if (cmd === 'equip' || cmd === 'wequip' || cmd === 'eq' || cmd === 'weapon' || cmd === 'weapons') {
    try {
      const res = await fetch('/api/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: state.userId,
          username: state.username,
          action: 'equip',
          args
        })
      });
      const data = await res.json();
      appendBotMessage(data.message);
    } catch (e) {
      appendBotMessage(`❌ Could not equip weapon: ${e.message}`);
    }
  } else if (cmd === 'avatar' || cmd === 'av' || cmd === 'pfp') {
    const avatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=OwO&backgroundColor=2a2254';
    appendBotMessage(null, {
      title: `🖼️ Avatar — ${state.username}`,
      description: `[Click here for original image](${avatarUrl})`,
      image: avatarUrl,
      color: '#8a7ff8'
    });
  } else if (['punch', 'sex', 'dogstyle', 'doggystyle', 'hug', 'kiss', 'pat', 'pats', 'slap', 'bite', 'cuddle', 'poke', 'lick', 'nom', 'stare', 'highfive', 'wave', 'greet', 'tickle', 'kill', 'boop', 'snuggle', 'bully', 'blush', 'cry', 'dance', 'smile', 'pout', 'shrug', 'sleepy', 'smug', 'thumbsup', 'wag', 'thinking', 'triggered', 'lewd'].includes(cmd)) {
    const target = args.length > 0 ? args.join(' ') : null;
    const actions = {
      punch: target ? `👊 | **${state.username}** delivered a powerful punch to **${target}**! Oof! >_<` : `👊 | **${state.username}** punches the air with furious power! *whoosh*`,
      sex: target ? `😳 | **${state.username}** got all spicy and intimate with **${target}**! (*/ω＼*) 💕` : `😳 | **${state.username}** is feeling extra naughty and spicy... (*/ω＼*)`,
      dogstyle: target ? `🐶 | **${state.username}** got behind **${target}** for some spicy doggystyle! (*/ω＼*) 💕` : `🐶 | **${state.username}** is getting into doggystyle position waiting for someone... (*/ω＼*)`,
      doggystyle: target ? `🐶 | **${state.username}** got behind **${target}** for some spicy doggystyle! (*/ω＼*) 💕` : `🐶 | **${state.username}** is getting into doggystyle position waiting for someone... (*/ω＼*)`,
      hug: target ? `🤗 | **${state.username}** warmly hugged **${target}**!` : `🤗 | **${state.username}** gives out free hugs!`,
      kiss: target ? `💋 | **${state.username}** gave a tender kiss to **${target}**! 💕` : `💋 | **${state.username}** blows a sweet kiss!`,
      pat: target ? `🐾 | **${state.username}** gently patted **${target}**'s head!` : `🐾 | **${state.username}** wants headpats!`,
      slap: target ? `💢 | **${state.username}** slapped **${target}**! Ouch!` : `💢 | **${state.username}** is looking for someone to slap!`,
      blush: `😳 | **${state.username}** is blushing furiously! (⁄ ⁄•⁄ω⁄•⁄ ⁄)`,
      cry: `😭 | **${state.username}** is crying uncontrollably... ;;w;;`,
      dance: `💃 | **${state.username}** is busting some sweet dance moves! ヾ(⌐■_■)ノ♪`,
      lewd: `🔞 | **${state.username}** thinks that is WAY TOO LEWD! (*/ω＼*)`
    };
    appendBotMessage(actions[cmd] || `✨ | **${state.username}** ${cmd}ed ${target || 'everyone'}! (˘ω˘)`);
  } else if (cmd === 'help') {
    appendBotMessage(null, {
      title: `✨ OwO Command Handbook`,
      description: `All original OwO commands and shortcuts are fully supported:\n` +
        `• \`wh\` or \`owo hunt\` — Catch wild animals\n` +
        `• \`ws all\` or \`owo slots <bet>\` — Spin slot machine\n` +
        `• \`wcf all\` or \`owo cf <bet> [h/t]\` — Coinflip\n` +
        `• \`wbj all\` or \`owo bj <bet>\` — Interactive Blackjack\n` +
        `• \`wcash\` or \`wbal\` — Check Cowoncy\n` +
        `• \`wdaily\` — Claim daily reward & streak\n` +
        `• \`wequip\` or \`owo equip\` — Equip weapons\n` +
        `• \`wcl\` — Daily checklist\n` +
        `• \`wzoo\` — View zoo collection\n` +
        `• \`wshop\` / \`wbuy\` — Buy crates and upgrades\n` +
        `• \`wprofile\` / \`wmy\` — View player card`,
      color: '#8a7ff8'
    });
  } else {
    appendBotMessage(`OwO What's this? Type \`owo help\` or \`whelp\` to view all commands!`);
  }
}

// Quick Actions Handler
window.runQuickAction = async function(action, args = []) {
  try {
    const res = await fetch('/api/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: state.userId,
        username: state.username,
        action,
        args
      })
    });
    const data = await res.json();

    if (action === 'hunt') {
      if (data.success) {
        window.sound.playHunt();
        const animalNames = data.caught.map(c => `${c.emoji} **${c.name}** *(${c.tier})*`).join(', ');
        appendBotMessage(null, {
          title: `🌲 ${state.username} went hunting!`,
          description: `You ventured into the wilderness and caught:\n${animalNames}`,
          color: '#4caf50',
          footer: `Total Hunts: #${data.user.hunts}`
        });
      } else {
        appendBotMessage(`⏰ ${data.message}`);
      }
    } else if (action === 'daily') {
      if (data.success) {
        window.sound.playWin();
        appendBotMessage(data.message);
      } else {
        appendBotMessage(data.message);
      }
    } else if (action === 'coinflip') {
      if (data.won) window.sound.playWin();
      else window.sound.playLoss();
      appendBotMessage(data.message);
    } else if (action === 'slots') {
      if (data.multiplier > 0) window.sound.playWin();
      else window.sound.playLoss();
      appendBotMessage(data.message);
    }

    await loadUserData();
    await loadLeaderboards();
  } catch (err) {
    console.error(err);
  }
};

// Start Discord Bot with Token from Web UI
window.connectDiscordBot = async function() {
  const input = document.getElementById('bot-token-input');
  const token = input ? input.value.trim() : '';

  if (!token) {
    alert('Please enter your Discord Bot Token!');
    return;
  }

  const btn = document.getElementById('connect-bot-btn');
  btn.textContent = 'Connecting...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/bot/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json();

    if (data.success) {
      alert('🎉 Bot connected successfully to Discord!');
      await loadBotStatus();
    } else {
      alert(`❌ Failed to connect: ${data.status?.error || 'Invalid token or intents'}`);
    }
  } catch (err) {
    alert('Error connecting: ' + err.message);
  } finally {
    btn.textContent = 'Connect Bot';
    btn.disabled = false;
  }
};

// WebSocket for Live Events
function setupWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'jackpot') {
        appendBotMessage(`🔥 **GLOBAL JACKPOT!** ${msg.data.username} just won **${msg.data.amount.toLocaleString()} Cowoncy** on slots!`);
      } else if (msg.type === 'balance_update') {
        if (msg.data.userId === state.userId || msg.data.userId === 'web_player') {
          const balEl = document.getElementById('wallet-balance');
          if (balEl && typeof msg.data.cowoncy === 'number') {
            balEl.textContent = `${msg.data.cowoncy.toLocaleString()} Cowoncy`;
          }
        }
        loadLeaderboards();
      }
    } catch (e) {}
  };
}

// ==========================================================
// Admin Add Cash / Cowoncy Injector Controller
// ==========================================================
const adminState = {
  users: [],
  selectedUserId: '',
  mode: 'add' // 'add' or 'set'
};

// Open the Add Cash modal
window.openAddCashModal = async function() {
  const modal = document.getElementById('modal-add-cash');
  if (!modal) return;

  modal.style.display = 'flex';
  clearCashAlert();

  // Close when clicking outside modal window
  modal.onclick = (e) => {
    if (e.target === modal) closeAddCashModal();
  };

  // Close on Escape
  document.addEventListener('keydown', onModalEscape);

  // Load registered users from backend
  await refreshAdminUsers();
};

function onModalEscape(e) {
  if (e.key === 'Escape') closeAddCashModal();
}

// Close the Add Cash modal
window.closeAddCashModal = function() {
  const modal = document.getElementById('modal-add-cash');
  if (modal) modal.style.display = 'none';
  document.removeEventListener('keydown', onModalEscape);
};

// Fetch users from API and populate selector
async function refreshAdminUsers(preferredUserId = null) {
  const select = document.getElementById('cash-user-select');
  if (!select) return;

  try {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch users');

    adminState.users = data.users || [];

    // Populate dropdown
    select.innerHTML = '';

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.disabled = true;
    defaultOpt.textContent = '── Select Player ──';
    select.appendChild(defaultOpt);

    adminState.users.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id;
      const emoji = u.display_animal || '👤';
      opt.textContent = `${emoji} ${u.username} (${u.cowoncy.toLocaleString()} Cowoncy) — ID: ${u.id}`;
      select.appendChild(opt);
    });

    // Custom ID option
    const customOpt = document.createElement('option');
    customOpt.value = '__custom__';
    customOpt.textContent = '✏️ Enter Custom User ID / Discord ID...';
    select.appendChild(customOpt);

    // Pick initial selection:
    // 1) preferredUserId if specified
    // 2) kamotedelight (370485038879604738) if present
    // 3) state.userId (web_player)
    // 4) first user
    let target = preferredUserId;
    if (!target) {
      if (adminState.users.some(u => u.id === '370485038879604738')) {
        target = '370485038879604738';
      } else if (adminState.users.some(u => u.id === state.userId)) {
        target = state.userId;
      } else if (adminState.users.length > 0) {
        target = adminState.users[0].id;
      }
    }

    if (target) {
      select.value = target;
      adminState.selectedUserId = target;
    }

    onTargetUserChanged();
  } catch (err) {
    console.error('Error fetching admin users:', err);
    select.innerHTML = '<option value="__custom__">✏️ Custom User ID (Manual Entry)</option>';
    const customGroup = document.getElementById('custom-user-group');
    if (customGroup) customGroup.style.display = 'block';
  }
}

// When dropdown selection changes
window.onTargetUserChanged = function() {
  const select = document.getElementById('cash-user-select');
  const customGroup = document.getElementById('custom-user-group');
  if (!select) return;

  const val = select.value;
  adminState.selectedUserId = val;

  if (val === '__custom__') {
    if (customGroup) customGroup.style.display = 'block';
    onCustomIdInput();
  } else {
    if (customGroup) customGroup.style.display = 'none';
    const user = adminState.users.find(u => u.id === val);
    updateTargetCard(user);
  }
};

// Handle manual Discord ID typing
window.onCustomIdInput = function() {
  const input = document.getElementById('cash-custom-id');
  const customId = input ? input.value.trim() : '';

  const existingUser = adminState.users.find(u => u.id === customId);
  if (existingUser) {
    updateTargetCard(existingUser);
  } else if (customId) {
    updateTargetCard({
      id: customId,
      username: 'Discord User',
      display_animal: '✨',
      cowoncy: 0
    });
  } else {
    updateTargetCard(null);
  }
};

// Update preview card
function updateTargetCard(user) {
  const nameEl = document.getElementById('target-user-name');
  const idEl = document.getElementById('target-user-id');
  const balEl = document.getElementById('target-user-bal');
  const avatarEl = document.getElementById('target-user-avatar');

  if (!user) {
    if (nameEl) nameEl.textContent = 'No user selected';
    if (idEl) idEl.textContent = 'ID: —';
    if (balEl) balEl.textContent = '— Cowoncy';
    if (avatarEl) avatarEl.textContent = '❓';
    return;
  }

  if (nameEl) nameEl.textContent = user.username;
  if (idEl) idEl.textContent = `ID: ${user.id}`;
  if (balEl) balEl.textContent = `${user.cowoncy.toLocaleString()} Cowoncy`;
  if (avatarEl) avatarEl.textContent = user.display_animal || '👤';
}

// Set mode (add vs set)
window.setCashMode = function(mode) {
  adminState.mode = mode;
  const btnAdd = document.getElementById('btn-mode-add');
  const btnSet = document.getElementById('btn-mode-set');
  const confirmBtn = document.getElementById('btn-confirm-give-cash');

  if (mode === 'add') {
    if (btnAdd) btnAdd.classList.add('active');
    if (btnSet) btnSet.classList.remove('active');
    if (confirmBtn) confirmBtn.innerHTML = '<span>➕ Add Cowoncy</span>';
  } else {
    if (btnAdd) btnAdd.classList.remove('active');
    if (btnSet) btnSet.classList.add('active');
    if (confirmBtn) confirmBtn.innerHTML = '<span>🎯 Set Exact Balance</span>';
  }
};

// Preset chips handler
window.setPresetAmount = function(amount) {
  const amountInput = document.getElementById('cash-amount-input');
  if (amountInput) {
    amountInput.value = amount;
    amountInput.focus();
  }
};

// Status message inside modal
function showCashAlert(type, message) {
  const alertEl = document.getElementById('cash-modal-status');
  if (!alertEl) return;
  alertEl.className = `modal-status-alert ${type}`;
  alertEl.innerHTML = `${type === 'success' ? '✅' : '❌'} ${message}`;
  alertEl.style.display = 'flex';
}

function clearCashAlert() {
  const alertEl = document.getElementById('cash-modal-status');
  if (alertEl) alertEl.style.display = 'none';
}

// Submit cash injection
window.submitAddCash = async function() {
  const select = document.getElementById('cash-user-select');
  const customInput = document.getElementById('cash-custom-id');
  const amountInput = document.getElementById('cash-amount-input');
  const confirmBtn = document.getElementById('btn-confirm-give-cash');

  let targetUserId = select ? select.value : '';
  if (targetUserId === '__custom__') {
    targetUserId = customInput ? customInput.value.trim() : '';
  }

  if (!targetUserId) {
    showCashAlert('error', 'Please select a recipient or enter a Discord User ID.');
    return;
  }

  const rawAmount = amountInput ? amountInput.value : '';
  const parsedAmount = Number(rawAmount);

  if (isNaN(parsedAmount) || parsedAmount < 0) {
    showCashAlert('error', 'Please enter a valid non-negative number for the amount.');
    return;
  }

  clearCashAlert();
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Processing...';
  }

  try {
    const res = await fetch('/api/admin/give-cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: targetUserId,
        amount: parsedAmount,
        mode: adminState.mode
      })
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to inject cash');
    }

    // Success!
    if (window.sound && typeof window.sound.playWin === 'function') {
      window.sound.playWin();
    }

    showCashAlert('success', data.message);

    // Update target preview card
    updateTargetCard(data.user);

    // If target was current web player, update header wallet pill
    if (data.user.id === state.userId || data.user.id === 'web_player') {
      const balEl = document.getElementById('wallet-balance');
      if (balEl) balEl.textContent = `${data.user.cowoncy.toLocaleString()} Cowoncy`;
      await loadUserData();
    }

    // Refresh leaderboards
    await loadLeaderboards();

    // Reload users list with this user active
    await refreshAdminUsers(data.user.id);

  } catch (err) {
    showCashAlert('error', err.message || 'Failed to communicate with server.');
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = adminState.mode === 'add' 
        ? '<span>✨ Inject Cash</span>' 
        : '<span>🎯 Set Exact Balance</span>';
    }
  }
};

