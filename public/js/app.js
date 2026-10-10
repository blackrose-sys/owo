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
          <div class="lb-score"><img src="/cowoncy.png" class="cowoncy-icon" alt="cowoncy"> ${u.cowoncy.toLocaleString()}</div>
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
          <div style="color: var(--accent-gold); font-weight: 700; margin-top: 0.25rem;"><img src="/cowoncy.png" class="cowoncy-icon" alt="cowoncy"> ${item.price.toLocaleString()} Cowoncy</div>
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
      description: `Complete your daily tasks in Discord or here:\n• 🐾 Hunt 5 times\n• 🎰 Play Slots 3 times\n• <img src="/cowoncy.png" class="cowoncy-icon" alt="cowoncy"> Play Coinflip 3 times\n\nReward: 3,000 Cowoncy + Rare Crate!`,
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
// Admin Master Injector Controller (Pets, Items, Weapons & Cash)
// ==========================================================
const adminState = {
  users: [],
  selectedUserId: '',
  activeTab: 'pets',
  selectedPetId: 'dragon',
  petFilter: 'all',
  petSearchQuery: '',
  selectedItemId: 'crate_weapon',
  cashMode: 'add'
};

// Open the Admin Master modal
window.openAdminManagerModal = async function(initialTab = 'pets') {
  const modal = document.getElementById('modal-admin-manager');
  if (!modal) return;

  modal.style.display = 'flex';
  clearAdminAlerts();

  modal.onclick = (e) => {
    if (e.target === modal) closeAdminManagerModal();
  };

  document.addEventListener('keydown', onAdminModalEscape);

  switchAdminTab(initialTab);
  await refreshAdminUsers();
  renderAdminPetsGrid();
  renderAdminItemsGrid();
  renderAdminWeaponsDropdown();
};

function onAdminModalEscape(e) {
  if (e.key === 'Escape') {
    closeAdminManagerModal();
    closeAddCashModal();
  }
}

// Close the Admin Master modal
window.closeAdminManagerModal = function() {
  const modal = document.getElementById('modal-admin-manager');
  if (modal) modal.style.display = 'none';
  document.removeEventListener('keydown', onAdminModalEscape);
};

// Switch Tab inside Admin modal
window.switchAdminTab = function(tabName) {
  adminState.activeTab = tabName;

  // Update tab buttons
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    if (btn.dataset.adminTab === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update tab panes
  document.querySelectorAll('.admin-tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });

  const activePane = document.getElementById(`admin-pane-${tabName}`);
  if (activePane) activePane.classList.add('active');
};

// Fetch users from API and populate selectors
async function refreshAdminUsers(preferredUserId = null) {
  const adminSelect = document.getElementById('admin-user-select');
  const cashSelect = document.getElementById('cash-user-select');
  if (!adminSelect && !cashSelect) return;

  try {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch users');

    adminState.users = data.users || [];

    const populateDropdown = (sel) => {
      if (!sel) return;
      sel.innerHTML = '';

      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.disabled = true;
      defaultOpt.textContent = '── Select Player ──';
      sel.appendChild(defaultOpt);

      adminState.users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        const emoji = u.display_animal || '👤';
        opt.textContent = `${emoji} ${u.username} (${u.cowoncy.toLocaleString()} Cowoncy) — ID: ${u.id}`;
        sel.appendChild(opt);
      });

      const customOpt = document.createElement('option');
      customOpt.value = '__custom__';
      customOpt.textContent = '✏️ Enter Custom User ID / Discord ID...';
      sel.appendChild(customOpt);
    };

    populateDropdown(adminSelect);
    populateDropdown(cashSelect);

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
      if (adminSelect) adminSelect.value = target;
      if (cashSelect) cashSelect.value = target;
      adminState.selectedUserId = target;
    }

    onAdminTargetUserChanged();
    if (window.onTargetUserChanged) onTargetUserChanged();
  } catch (err) {
    console.error('Error fetching admin users:', err);
    if (adminSelect) adminSelect.innerHTML = '<option value="__custom__">✏️ Custom User ID (Manual Entry)</option>';
    const customGroup = document.getElementById('admin-custom-user-group');
    if (customGroup) customGroup.style.display = 'block';
  }
}

// When user selection changes in Admin Modal
window.onAdminTargetUserChanged = function() {
  const select = document.getElementById('admin-user-select');
  const customGroup = document.getElementById('admin-custom-user-group');
  if (!select) return;

  const val = select.value;
  adminState.selectedUserId = val;

  if (val === '__custom__') {
    if (customGroup) customGroup.style.display = 'block';
    onAdminCustomIdInput();
  } else {
    if (customGroup) customGroup.style.display = 'none';
    const user = adminState.users.find(u => u.id === val);
    updateAdminTargetCard(user);
    if (val) fetchAdminUserExtraDetails(val);
  }
};

window.onAdminCustomIdInput = function() {
  const input = document.getElementById('admin-custom-id');
  const customId = input ? input.value.trim() : '';

  const existingUser = adminState.users.find(u => u.id === customId);
  if (existingUser) {
    updateAdminTargetCard(existingUser);
    fetchAdminUserExtraDetails(customId);
  } else if (customId) {
    updateAdminTargetCard({
      id: customId,
      username: 'Discord User',
      display_animal: '✨',
      cowoncy: 0
    });
    fetchAdminUserExtraDetails(customId);
  } else {
    updateAdminTargetCard(null);
  }
};

async function fetchAdminUserExtraDetails(userId) {
  try {
    const res = await fetch(`/api/admin/user-details/${userId}`);
    const data = await res.json();
    if (data.success && data.user) {
      updateAdminTargetCard(data.user, data.zoo, data.weapons);
    }
  } catch (e) {}
}

function updateAdminTargetCard(user, zoo = null, weapons = null) {
  const nameEl = document.getElementById('admin-target-user-name');
  const idEl = document.getElementById('admin-target-user-id');
  const balEl = document.getElementById('admin-target-bal');
  const avatarEl = document.getElementById('admin-target-user-avatar');
  const zooCountEl = document.getElementById('admin-target-zoo-count');
  const weaponCountEl = document.getElementById('admin-target-weapon-count');

  if (!user) {
    if (nameEl) nameEl.textContent = 'No player selected';
    if (idEl) idEl.textContent = 'ID: —';
    if (balEl) balEl.textContent = '0';
    if (avatarEl) avatarEl.textContent = '❓';
    if (zooCountEl) zooCountEl.textContent = '0';
    if (weaponCountEl) weaponCountEl.textContent = '0';
    return;
  }

  if (nameEl) nameEl.textContent = user.username;
  if (idEl) idEl.textContent = `ID: ${user.id}`;
  if (balEl) balEl.textContent = `${user.cowoncy.toLocaleString()}`;
  if (avatarEl) avatarEl.textContent = user.display_animal || '👤';

  if (zooCountEl && zoo) {
    const totalCount = zoo.reduce((acc, z) => acc + (z.count || 0), 0);
    zooCountEl.textContent = `${zoo.length} species (${totalCount})`;
  }

  if (weaponCountEl && weapons) {
    weaponCountEl.textContent = `${weapons.length}`;
  }

  renderAdminUserWeapons(weapons, data?.team);
}

// ---------------- Pet Grid & Selection ----------------
function renderAdminPetsGrid() {
  const grid = document.getElementById('admin-pet-grid');
  if (!grid || !state.animals || state.animals.length === 0) return;

  const query = adminState.petSearchQuery.toLowerCase().trim();
  const filter = adminState.petFilter;

  const filtered = state.animals.filter(a => {
    if (filter !== 'all' && a.tier.toLowerCase() !== filter) return false;
    if (query && !a.name.toLowerCase().includes(query) && !a.id.toLowerCase().includes(query)) return false;
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-dim);">No animals found matching criteria.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(a => {
    const isSelected = a.id === adminState.selectedPetId;
    const tierColor = (state.tiers && state.tiers[a.tier]?.color) || '#9e9e9e';
    return `
      <div class="admin-card ${isSelected ? 'selected' : ''}" onclick="selectAdminPet('${a.id}')">
        <div class="admin-card-emoji">${a.emoji}</div>
        <div class="admin-card-name">${a.name}</div>
        <div class="admin-card-tier" style="background: ${tierColor}25; color: ${tierColor}; border: 1px solid ${tierColor}60;">${a.tier}</div>
        <div style="font-size: 0.65rem; color: var(--text-dim); font-family: var(--font-mono);">⚔️${a.atk} 🛡️${a.def}</div>
      </div>
    `;
  }).join('');
}

window.selectAdminPet = function(animalId) {
  adminState.selectedPetId = animalId;
  renderAdminPetsGrid();
};

window.filterAdminPets = function(tier) {
  adminState.petFilter = tier;
  document.querySelectorAll('.admin-tier-pills .admin-pill').forEach(btn => {
    if (btn.dataset.petFilter === tier) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  renderAdminPetsGrid();
};

window.onAdminPetSearch = function() {
  const input = document.getElementById('admin-pet-search');
  adminState.petSearchQuery = input ? input.value : '';
  renderAdminPetsGrid();
};

window.setAdminPetQty = function(qty) {
  const input = document.getElementById('admin-pet-qty');
  if (input) input.value = qty;
};

// ---------------- Item Grid & Selection ----------------
function renderAdminItemsGrid() {
  const grid = document.getElementById('admin-item-grid');
  if (!grid || !state.shopItems || state.shopItems.length === 0) return;

  grid.innerHTML = state.shopItems.map(item => {
    const isSelected = item.id === adminState.selectedItemId;
    return `
      <div class="admin-card ${isSelected ? 'selected' : ''}" onclick="selectAdminItem('${item.id}')">
        <div class="admin-card-emoji">${item.emoji}</div>
        <div class="admin-card-name">${item.name}</div>
        <div class="admin-card-tier" style="background: rgba(255, 204, 0, 0.15); color: #ffcc00; border: 1px solid rgba(255, 204, 0, 0.4);">${item.category || 'item'}</div>
        <div style="font-size: 0.7rem; color: var(--text-dim); font-family: var(--font-mono);"><img src="/cowoncy.png" class="cowoncy-icon" alt="cowoncy"> ${item.price?.toLocaleString()}</div>
      </div>
    `;
  }).join('');
}

window.selectAdminItem = function(itemId) {
  adminState.selectedItemId = itemId;
  renderAdminItemsGrid();
};

window.setAdminItemQty = function(qty) {
  const input = document.getElementById('admin-item-qty');
  if (input) input.value = qty;
};

// ---------------- Weapons Dropdown & Build Hint ----------------
function renderAdminWeaponsDropdown() {
  const select = document.getElementById('admin-weapon-select');
  if (!select || !state.weapons || state.weapons.length === 0) return;

  select.innerHTML = state.weapons.map(w => `
    <option value="${w.id}">
      ${w.typeEmoji || '⚔️'} ${w.name} [${w.tier.toUpperCase()}] (+${w.atk} ATK, +${w.def} DEF, +${w.crit}% Crit)
    </option>
  `).join('');

  updateAdminWeaponBuildHint();
}

window.updateAdminWeaponBuildHint = function() {
  const select = document.getElementById('admin-weapon-select');
  const hintEl = document.getElementById('admin-weapon-build-hint');
  if (!select || !hintEl || !state.weapons) return;

  const weaponId = select.value;
  const weapon = state.weapons.find(w => w.id === weaponId);
  if (!weapon) {
    hintEl.innerHTML = '';
    return;
  }

  const type = (weapon.type || '').toLowerCase();
  let buildName = 'Brawler (Cleaver)';
  let buildRole = '⚔️ Berserker Cleave (+35% ATK, Cleave AOE)';
  let matchingAnimals = 'Lion, Gorilla, Crocodile, T-Rex, Dog, Horse';

  if (['shield', 'armor'].includes(type)) {
    buildName = 'Iron Fortress (Tank)';
    buildRole = '🛡️ Taunt & +30% Damage Mitigation (+30% HP & DEF)';
    matchingAnimals = 'Bear, Elephant, Hippo, Rhino, Panda, Turtle, Whale';
  } else if (['dagger', 'claw', 'scythe'].includes(type)) {
    buildName = 'Shadow Striker (Assassin)';
    buildRole = '🗡️ Bleed True Damage (+35% Crit Rate, +25% Speed)';
    matchingAnimals = 'Wolf, Leopard, Tiger, Fox, Snake, Bat, Raccoon';
  } else if (['bow', 'crossbow', 'slingshot'].includes(type)) {
    buildName = 'Hawkeye Ranger (Sniper)';
    buildRole = '🏹 Armor Piercing (+40% Crit DMG, Bypasses 50% DEF)';
    matchingAnimals = 'Eagle, Owl, Falcon, Hawk, Rabbit, Giraffe';
  } else if (['staff', 'wand', 'scepter', 'relic', 'orb'].includes(type)) {
    buildName = 'Arcane Mystic (Mage)';
    buildRole = '🪄 Arcane Surge (+50% Spell Damage, +30 Mana Regen)';
    matchingAnimals = 'Unicorn, Dragon, Squid, Octopus, Phoenix, Kitsune';
  }

  hintEl.innerHTML = `
    <strong>⭐ Build Synergy:</strong> <span style="color: #fff;">${buildName}</span> • ${buildRole}<br/>
    <span style="color: var(--text-muted); font-size: 0.8rem;">🐾 Best suited for: ${matchingAnimals}</span>
  `;
};

function renderAdminUserWeapons(weapons = [], team = []) {
  const container = document.getElementById('admin-user-weapons-list');
  if (!container) return;

  if (!weapons || weapons.length === 0) {
    container.innerHTML = `<div style="grid-column: 1 / -1; padding: 1rem; text-align: center; color: var(--text-dim); font-size: 0.85rem;">Player has no weapons in armory. Use the form above to forge weapons!</div>`;
    return;
  }

  const teamMap = new Map();
  if (team && Array.isArray(team)) {
    team.forEach(t => {
      const animal = (state.animals || []).find(a => a.id === t.animal_id);
      teamMap.set(t.slot, animal ? `${animal.emoji} ${animal.name}` : `Pet`);
    });
  }

  container.innerHTML = weapons.map(w => {
    const data = (state.weapons || []).find(item => item.id === w.weapon_id);
    const name = data ? data.name : w.weapon_id;
    const typeEmoji = data ? data.typeEmoji : '🗡️';
    const tier = (w.tier || data?.tier || 'common').toUpperCase();
    const isEquipped = w.is_equipped === 1;
    const slot = w.equipped_to || (isEquipped ? 1 : null);
    const petLabel = slot ? teamMap.get(slot) || `Slot ${slot}` : null;

    return `
      <div class="admin-card" style="padding: 0.6rem; text-align: left; position: relative;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
          <span style="font-size: 1.25rem;">${typeEmoji}</span>
          <span class="admin-card-tier" style="font-size: 0.65rem;">#${w.code || 'WEAPON'}</span>
        </div>
        <div style="font-weight: 700; font-size: 0.8rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name}</div>
        <div style="font-size: 0.7rem; color: var(--accent-cyan);">Lv.${w.level} • [${tier}] • ${w.quality || 50}%</div>
        ${isEquipped ? `
          <div style="margin-top: 0.35rem; font-size: 0.7rem; color: #4caf50; font-weight: 700;">
            ✅ Equipped to [${slot}] ${petLabel || ''}
          </div>
          <button type="button" class="btn btn-sm btn-secondary" style="margin-top: 0.35rem; width: 100%; font-size: 0.7rem; padding: 0.2rem;" onclick="adminEquipWeapon(${w.id}, ${slot}, 'unequip')">
            Unequip
          </button>
        ` : `
          <div style="display: flex; gap: 0.25rem; margin-top: 0.4rem;">
            <button type="button" class="btn btn-sm btn-secondary" style="flex: 1; font-size: 0.65rem; padding: 0.2rem;" title="Equip to Slot 1" onclick="adminEquipWeapon(${w.id}, 1, 'equip')">Eq.1</button>
            <button type="button" class="btn btn-sm btn-secondary" style="flex: 1; font-size: 0.65rem; padding: 0.2rem;" title="Equip to Slot 2" onclick="adminEquipWeapon(${w.id}, 2, 'equip')">Eq.2</button>
            <button type="button" class="btn btn-sm btn-secondary" style="flex: 1; font-size: 0.65rem; padding: 0.2rem;" title="Equip to Slot 3" onclick="adminEquipWeapon(${w.id}, 3, 'equip')">Eq.3</button>
          </div>
        `}
      </div>
    `;
  }).join('');
}

window.adminEquipWeapon = async function(weaponId, slot, action = 'equip') {
  const userId = getAdminTargetUserId();
  if (!userId) return;

  try {
    const res = await fetch('/api/admin/equip-weapon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, weaponId, slot, action })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    showAdminAlert('weapon', 'success', data.message);
    fetchAdminUserExtraDetails(userId);
  } catch (err) {
    showAdminAlert('weapon', 'error', err.message);
  }
};

// ---------------- Feedback Alerts ----------------
function showAdminAlert(tab, type, message) {
  const alertEl = document.getElementById(`admin-${tab}-alert`);
  if (!alertEl) return;
  alertEl.className = `modal-status-alert ${type}`;
  alertEl.innerHTML = `${type === 'success' ? '✅' : '❌'} ${message}`;
  alertEl.style.display = 'flex';
}

function clearAdminAlerts() {
  ['pet', 'item', 'weapon', 'cash'].forEach(t => {
    const el = document.getElementById(`admin-${t}-alert`);
    if (el) el.style.display = 'none';
  });
}

function getAdminTargetUserId() {
  const select = document.getElementById('admin-user-select');
  const customInput = document.getElementById('admin-custom-id');
  let id = select ? select.value : '';
  if (id === '__custom__') {
    id = customInput ? customInput.value.trim() : '';
  }
  return id;
}

// ---------------- Submit Injections ----------------
window.submitGiveSelectedPet = async function() {
  const userId = getAdminTargetUserId();
  if (!userId) return showAdminAlert('pet', 'error', 'Please select a recipient player or enter a Discord User ID.');
  if (!adminState.selectedPetId) return showAdminAlert('pet', 'error', 'Please select a pet to give.');

  const qty = parseInt(document.getElementById('admin-pet-qty')?.value, 10) || 1;
  const btn = document.getElementById('btn-submit-give-pet');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/admin/give-pet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, animalId: adminState.selectedPetId, count: qty })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    if (window.sound?.playWin) window.sound.playWin();
    showAdminAlert('pet', 'success', data.message);
    fetchAdminUserExtraDetails(userId);

    if (userId === state.userId || userId === 'web_player') {
      await loadUserData();
    }
  } catch (err) {
    showAdminAlert('pet', 'error', err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.submitGivePetAll = async function(count = 1) {
  const userId = getAdminTargetUserId();
  if (!userId) return showAdminAlert('pet', 'error', 'Please select a recipient player.');

  try {
    const res = await fetch('/api/admin/give-pet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, animalId: '__ALL__', count })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    if (window.sound?.playWin) window.sound.playWin();
    showAdminAlert('pet', 'success', data.message);
    fetchAdminUserExtraDetails(userId);

    if (userId === state.userId || userId === 'web_player') {
      await loadUserData();
    }
  } catch (err) {
    showAdminAlert('pet', 'error', err.message);
  }
};

window.submitGivePetTier = async function(tier, count = 5) {
  const userId = getAdminTargetUserId();
  if (!userId) return showAdminAlert('pet', 'error', 'Please select a recipient player.');

  try {
    const res = await fetch('/api/admin/give-pet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, tier, count })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    if (window.sound?.playWin) window.sound.playWin();
    showAdminAlert('pet', 'success', data.message);
    fetchAdminUserExtraDetails(userId);

    if (userId === state.userId || userId === 'web_player') {
      await loadUserData();
    }
  } catch (err) {
    showAdminAlert('pet', 'error', err.message);
  }
};

window.submitGiveSelectedItem = async function() {
  const userId = getAdminTargetUserId();
  if (!userId) return showAdminAlert('item', 'error', 'Please select a recipient player.');
  if (!adminState.selectedItemId) return showAdminAlert('item', 'error', 'Please select an item to give.');

  const qty = parseInt(document.getElementById('admin-item-qty')?.value, 10) || 1;
  const btn = document.getElementById('btn-submit-give-item');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/admin/give-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemId: adminState.selectedItemId, count: qty })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    if (window.sound?.playWin) window.sound.playWin();
    showAdminAlert('item', 'success', data.message);
    fetchAdminUserExtraDetails(userId);

    if (userId === state.userId || userId === 'web_player') {
      await loadUserData();
    }
  } catch (err) {
    showAdminAlert('item', 'error', err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.submitGiveAllCrates = async function(count = 100) {
  const userId = getAdminTargetUserId();
  if (!userId) return showAdminAlert('item', 'error', 'Please select a recipient player.');

  try {
    const res = await fetch('/api/admin/give-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemId: '__ALL_CRATES__', count })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    if (window.sound?.playWin) window.sound.playWin();
    showAdminAlert('item', 'success', data.message);
    fetchAdminUserExtraDetails(userId);

    if (userId === state.userId || userId === 'web_player') {
      await loadUserData();
    }
  } catch (err) {
    showAdminAlert('item', 'error', err.message);
  }
};

window.submitGiveItemDirect = async function(itemId, count = 10) {
  const userId = getAdminTargetUserId();
  if (!userId) return showAdminAlert('item', 'error', 'Please select a recipient player.');

  try {
    const res = await fetch('/api/admin/give-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemId, count })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    if (window.sound?.playWin) window.sound.playWin();
    showAdminAlert('item', 'success', data.message);
    fetchAdminUserExtraDetails(userId);

    if (userId === state.userId || userId === 'web_player') {
      await loadUserData();
    }
  } catch (err) {
    showAdminAlert('item', 'error', err.message);
  }
};

window.submitGiveSelectedWeapon = async function() {
  const userId = getAdminTargetUserId();
  if (!userId) return showAdminAlert('weapon', 'error', 'Please select a recipient player.');

  const weaponId = document.getElementById('admin-weapon-select')?.value;
  const tier = document.getElementById('admin-weapon-tier')?.value || 'legendary';
  const level = parseInt(document.getElementById('admin-weapon-level')?.value, 10) || 1;
  const quality = parseFloat(document.getElementById('admin-weapon-quality')?.value) || 85.0;
  const slot = document.getElementById('admin-weapon-slot')?.value || '';

  const btn = document.getElementById('btn-submit-give-weapon');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/admin/give-weapon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, weaponId, level, tier, quality, slot })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    if (window.sound?.playWin) window.sound.playWin();
    showAdminAlert('weapon', 'success', data.message);
    fetchAdminUserExtraDetails(userId);
  } catch (err) {
    showAdminAlert('weapon', 'error', err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.submitGiveAllWeapons = async function(level = 10, tier = 'mythic', quality = 95) {
  const userId = getAdminTargetUserId();
  if (!userId) return showAdminAlert('weapon', 'error', 'Please select a recipient player.');

  try {
    const res = await fetch('/api/admin/give-weapon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, weaponId: '__ALL__', level, tier, quality })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    if (window.sound?.playWin) window.sound.playWin();
    showAdminAlert('weapon', 'success', data.message);
    fetchAdminUserExtraDetails(userId);
  } catch (err) {
    showAdminAlert('weapon', 'error', err.message);
  }
};

window.setAdminCashMode = function(mode) {
  adminState.cashMode = mode;
  const btnAdd = document.getElementById('btn-admin-cash-mode-add');
  const btnSet = document.getElementById('btn-admin-cash-mode-set');
  if (btnAdd && btnSet) {
    if (mode === 'add') {
      btnAdd.classList.add('active');
      btnSet.classList.remove('active');
    } else {
      btnAdd.classList.remove('active');
      btnSet.classList.add('active');
    }
  }
};

window.setAdminPresetAmount = function(amt) {
  const input = document.getElementById('admin-cash-amount-input');
  if (input) input.value = amt;
};

window.submitAdminGiveCash = async function() {
  const userId = getAdminTargetUserId();
  if (!userId) return showAdminAlert('cash', 'error', 'Please select a recipient player.');

  const parsedAmount = Number(document.getElementById('admin-cash-amount-input')?.value);
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    return showAdminAlert('cash', 'error', 'Please enter a valid amount.');
  }

  const btn = document.getElementById('btn-submit-give-cash');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/admin/give-cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount: parsedAmount, mode: adminState.cashMode })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    if (window.sound?.playWin) window.sound.playWin();
    showAdminAlert('cash', 'success', data.message);
    fetchAdminUserExtraDetails(userId);

    if (userId === state.userId || userId === 'web_player') {
      const balEl = document.getElementById('wallet-balance');
      if (balEl) balEl.textContent = `${data.user.cowoncy.toLocaleString()} Cowoncy`;
      await loadUserData();
    }
    await loadLeaderboards();
  } catch (err) {
    showAdminAlert('cash', 'error', err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
};

// Also keep existing Add Cash modal functions working seamlessly
window.openAddCashModal = function() {
  openAdminManagerModal('cash');
};

window.closeAddCashModal = function() {
  closeAdminManagerModal();
};

window.onTargetUserChanged = window.onAdminTargetUserChanged;
window.onCustomIdInput = window.onAdminCustomIdInput;
window.setCashMode = window.setAdminCashMode;
window.setPresetAmount = window.setAdminPresetAmount;
window.submitAddCash = window.submitAdminGiveCash;


