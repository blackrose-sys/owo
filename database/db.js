// SQLite Database Manager using better-sqlite3
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database location with persistent volume support (prevents data resets on Railway/host redeploy)
const defaultDbPath = path.join(__dirname, 'owo.sqlite');

let dbPath;
if (process.env.DATABASE_PATH) {
  dbPath = process.env.DATABASE_PATH;
} else {
  // Check any Railway volume environment variable (e.g. RAILWAY_VOLUME_MOUNT_PATH, OWO_VOLUME_MOUNT_PATH, etc.)
  const volumeEnvKey = Object.keys(process.env).find(k => 
    k.toUpperCase().includes('VOLUME') && (k.toUpperCase().includes('MOUNT') || k.toUpperCase().includes('PATH'))
  );
  const volumeMountPath = volumeEnvKey ? process.env[volumeEnvKey] : null;

  if (volumeMountPath) {
    dbPath = path.join(volumeMountPath, 'owo.sqlite');
  } else if (fs.existsSync('/data')) {
    dbPath = '/data/owo.sqlite';
  } else if (fs.existsSync('/app/data')) {
    dbPath = '/app/data/owo.sqlite';
  } else if (fs.existsSync('/owo-volume')) {
    dbPath = '/owo-volume/owo.sqlite';
  } else {
    dbPath = defaultDbPath;
  }
}

console.log(`[DB Initialization] Active database path: ${dbPath}`);

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  try { fs.mkdirSync(dbDir, { recursive: true }); } catch (e) {}
}

// If using persistent volume path and target does not exist yet, copy existing database over
if (dbPath !== defaultDbPath && !fs.existsSync(dbPath) && fs.existsSync(defaultDbPath)) {
  try {
    fs.copyFileSync(defaultDbPath, dbPath);
    console.log(`[DB] Preserved and seeded existing database into persistent volume: ${dbPath}`);
  } catch (err) {
    console.error(`[DB] Error seeding persistent volume:`, err);
  }
}

const db = new Database(dbPath);

// Enable WAL mode for high performance concurrent reads and writes
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Periodic automatic database backup every 30 minutes to prevent data loss
setInterval(() => {
  try {
    const backupPath = dbPath + '.bak';
    db.backup(backupPath)
      .then(() => {})
      .catch((err) => console.error('[DB Backup Error]:', err));
  } catch (e) {}
}, 30 * 60 * 1000).unref();

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT DEFAULT 'Adventurer',
    avatar TEXT DEFAULT '',
    cowoncy INTEGER DEFAULT 1000,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    hunts INTEGER DEFAULT 0,
    battles_won INTEGER DEFAULT 0,
    battles_lost INTEGER DEFAULT 0,
    daily_streak INTEGER DEFAULT 0,
    last_daily INTEGER DEFAULT 0,
    last_hunt INTEGER DEFAULT 0,
    last_pray INTEGER DEFAULT 0,
    last_curse INTEGER DEFAULT 0,
    luck_bonus INTEGER DEFAULT 0,
    display_animal TEXT DEFAULT '🐶',
    title TEXT DEFAULT 'Novice Hunter',
    married_to TEXT DEFAULT NULL,
    married_name TEXT DEFAULT NULL,
    married_date INTEGER DEFAULT 0,
    luck_boost_until INTEGER DEFAULT 0,
    bait_charges INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS zoo (
    user_id TEXT NOT NULL,
    animal_id TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    PRIMARY KEY (user_id, animal_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS inventory (
    user_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    PRIMARY KEY (user_id, item_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS weapons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    weapon_id TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    is_equipped INTEGER DEFAULT 0,
    code TEXT,
    quality REAL DEFAULT 50.0,
    tier TEXT DEFAULT 'common',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS team (
    user_id TEXT NOT NULL,
    slot INTEGER NOT NULL,
    animal_id TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, slot),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quests (
    user_id TEXT PRIMARY KEY,
    day_key TEXT NOT NULL,
    hunts_done INTEGER DEFAULT 0,
    slots_done INTEGER DEFAULT 0,
    cf_done INTEGER DEFAULT 0,
    claimed INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS guilds (
    id TEXT PRIMARY KEY,
    prefix TEXT DEFAULT 'owo ',
    disabled_channels TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS lottery (
    id INTEGER PRIMARY KEY,
    jackpot INTEGER DEFAULT 50000,
    participants TEXT DEFAULT '[]',
    last_draw INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_users_cowoncy ON users(cowoncy DESC);
  CREATE INDEX IF NOT EXISTS idx_users_hunts ON users(hunts DESC);
  CREATE INDEX IF NOT EXISTS idx_zoo_user ON zoo(user_id);
`);

// Safe migrations for newly added columns
try { db.exec(`ALTER TABLE users ADD COLUMN active_team INTEGER DEFAULT 1;`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN team_name TEXT DEFAULT NULL;`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN team_name_2 TEXT DEFAULT NULL;`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN wallpaper TEXT DEFAULT 'default';`); } catch (e) {}
try { db.exec(`ALTER TABLE weapons ADD COLUMN code TEXT;`); } catch (e) {}
try { db.exec(`ALTER TABLE weapons ADD COLUMN quality REAL DEFAULT 50.0;`); } catch (e) {}
try { db.exec(`ALTER TABLE weapons ADD COLUMN tier TEXT DEFAULT 'common';`); } catch (e) {}
try { db.exec(`ALTER TABLE weapons ADD COLUMN equipped_to TEXT DEFAULT NULL;`); } catch (e) {}

// Prepared statements for maximum performance
const stmts = {
  getUser: db.prepare('SELECT * FROM users WHERE id = ?'),
  createUser: db.prepare(`
    INSERT INTO users (id, username, avatar, created_at)
    VALUES (?, ?, ?, strftime('%s', 'now'))
  `),
  updateUsername: db.prepare('UPDATE users SET username = ?, avatar = ? WHERE id = ?'),
  updateCowoncy: db.prepare('UPDATE users SET cowoncy = cowoncy + ? WHERE id = ?'),
  setCowoncy: db.prepare('UPDATE users SET cowoncy = ? WHERE id = ?'),
  addXp: db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?'),
  setLevel: db.prepare('UPDATE users SET level = ? WHERE id = ?'),
  updateDaily: db.prepare(`
    UPDATE users 
    SET last_daily = ?, daily_streak = ?, cowoncy = cowoncy + ? 
    WHERE id = ?
  `),
  recordHunt: db.prepare(`
    UPDATE users 
    SET last_hunt = ?, hunts = hunts + 1, xp = xp + 15, bait_charges = MAX(0, bait_charges - 1) 
    WHERE id = ?
  `),
  setDisplayAnimal: db.prepare('UPDATE users SET display_animal = ? WHERE id = ?'),
  setWallpaper: db.prepare('UPDATE users SET wallpaper = ? WHERE id = ?'),
  setTitle: db.prepare('UPDATE users SET title = ? WHERE id = ?'),
  marry: db.prepare('UPDATE users SET married_to = ?, married_name = ?, married_date = ? WHERE id = ?'),
  divorce: db.prepare('UPDATE users SET married_to = NULL, married_name = NULL, married_date = 0 WHERE id = ?'),
  setLuckBoost: db.prepare('UPDATE users SET luck_boost_until = ? WHERE id = ?'),
  addBait: db.prepare('UPDATE users SET bait_charges = bait_charges + ? WHERE id = ?'),

  // Zoo
  getZoo: db.prepare('SELECT animal_id, count FROM zoo WHERE user_id = ?'),
  getZooAnimal: db.prepare('SELECT count FROM zoo WHERE user_id = ? AND animal_id = ?'),
  addZooAnimal: db.prepare(`
    INSERT INTO zoo (user_id, animal_id, count)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, animal_id) DO UPDATE SET count = count + excluded.count
  `),
  removeZooAnimal: db.prepare(`
    UPDATE zoo SET count = count - ? WHERE user_id = ? AND animal_id = ?
  `),
  deleteZooAnimal: db.prepare('DELETE FROM zoo WHERE user_id = ? AND animal_id = ?'),

  // Inventory
  getInventory: db.prepare('SELECT item_id, quantity FROM inventory WHERE user_id = ?'),
  getItemCount: db.prepare('SELECT quantity FROM inventory WHERE user_id = ? AND item_id = ?'),
  addInventoryItem: db.prepare(`
    INSERT INTO inventory (user_id, item_id, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + excluded.quantity
  `),
  removeInventoryItem: db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE user_id = ? AND item_id = ?'),
  deleteInventoryItem: db.prepare('DELETE FROM inventory WHERE user_id = ? AND item_id = ?'),

  // Weapons
  getUserWeapons: db.prepare('SELECT * FROM weapons WHERE user_id = ? ORDER BY id DESC'),
  getEquippedWeapon: db.prepare('SELECT * FROM weapons WHERE user_id = ? AND is_equipped = 1 LIMIT 1'),
  getEquippedWeaponBySlot: db.prepare(`
    SELECT * FROM weapons 
    WHERE user_id = ? AND (equipped_to = ? OR (equipped_to IS NULL AND is_equipped = 1 AND ? = 1))
    LIMIT 1
  `),
  getAllEquippedWeapons: db.prepare('SELECT * FROM weapons WHERE user_id = ? AND is_equipped = 1 ORDER BY equipped_to ASC'),
  unequipAllWeapons: db.prepare('UPDATE weapons SET is_equipped = 0, equipped_to = NULL WHERE user_id = ?'),
  unequipSlotWeapon: db.prepare(`
    UPDATE weapons SET is_equipped = 0, equipped_to = NULL 
    WHERE user_id = ? AND (equipped_to = ? OR (equipped_to IS NULL AND ? = 1))
  `),
  equipWeapon: db.prepare('UPDATE weapons SET is_equipped = 1, equipped_to = 1 WHERE user_id = ? AND id = ?'),
  equipWeaponToSlot: db.prepare('UPDATE weapons SET is_equipped = 1, equipped_to = ? WHERE user_id = ? AND id = ?'),
  addWeapon: db.prepare('INSERT INTO weapons (user_id, weapon_id, level) VALUES (?, ?, 1)'),
  addWeaponFull: db.prepare(`
    INSERT INTO weapons (user_id, weapon_id, level, is_equipped, code, quality, tier)
    VALUES (?, ?, ?, 0, ?, ?, ?)
  `),
  deleteWeapon: db.prepare('DELETE FROM weapons WHERE user_id = ? AND id = ?'),

  // Team
  getTeam: db.prepare('SELECT * FROM team WHERE user_id = ? ORDER BY slot ASC'),
  getTeamByPage: db.prepare('SELECT * FROM team WHERE user_id = ? AND slot BETWEEN ? AND ? ORDER BY slot ASC'),
  setActiveTeam: db.prepare('UPDATE users SET active_team = ? WHERE id = ?'),
  setTeamName: db.prepare('UPDATE users SET team_name = ? WHERE id = ?'),
  setTeamName2: db.prepare('UPDATE users SET team_name_2 = ? WHERE id = ?'),
  setTeamSlot: db.prepare(`
    INSERT INTO team (user_id, slot, animal_id, level, xp)
    VALUES (?, ?, ?, 1, 0)
    ON CONFLICT(user_id, slot) DO UPDATE SET animal_id = excluded.animal_id, level = 1, xp = 0
  `),
  updateTeamAnimalXp: db.prepare('UPDATE team SET xp = xp + ?, level = ? WHERE user_id = ? AND slot = ?'),

  // Guilds
  getGuild: db.prepare('SELECT * FROM guilds WHERE id = ?'),
  setGuildPrefix: db.prepare(`
    INSERT INTO guilds (id, prefix)
    VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET prefix = excluded.prefix
  `),

  // Quests
  getQuest: db.prepare('SELECT * FROM quests WHERE user_id = ?'),
  upsertQuest: db.prepare(`
    INSERT INTO quests (user_id, day_key, hunts_done, slots_done, cf_done, claimed)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET 
      day_key = excluded.day_key,
      hunts_done = excluded.hunts_done,
      slots_done = excluded.slots_done,
      cf_done = excluded.cf_done,
      claimed = excluded.claimed
  `),

  // Leaderboard
  getTopCowoncy: db.prepare('SELECT id, username, cowoncy, display_animal, title FROM users ORDER BY cowoncy DESC LIMIT ?'),
  getTopHunts: db.prepare('SELECT id, username, hunts, display_animal, title FROM users ORDER BY hunts DESC LIMIT ?'),
};

// Helper methods with validation & transaction wrappers
const dbManager = {
  db,
  stmts,

  getUser(userId, username = null, avatar = null) {
    let user = stmts.getUser.get(userId);
    if (!user) {
      stmts.createUser.run(userId, username || 'Adventurer', avatar || '');
      user = stmts.getUser.get(userId);
    } else if (username && username !== 'Adventurer' && (user.username !== username || (avatar !== null && user.avatar !== avatar))) {
      const newAvatar = avatar !== null ? avatar : user.avatar;
      stmts.updateUsername.run(username, newAvatar, userId);
      user.username = username;
      user.avatar = newAvatar;
    }
    return user;
  },

  addCowoncy(userId, amount) {
    stmts.updateCowoncy.run(amount, userId);
    return this.getUser(userId);
  },

  setCowoncy(userId, amount) {
    stmts.setCowoncy.run(amount, userId);
    return this.getUser(userId);
  },

  transferCowoncy(fromId, toId, amount) {
    const transferTx = db.transaction(() => {
      const sender = stmts.getUser.get(fromId);
      if (!sender || sender.cowoncy < amount) return false;
      stmts.updateCowoncy.run(-amount, fromId);
      stmts.updateCowoncy.run(amount, toId);
      return true;
    });
    return transferTx();
  },

  recordHunt(userId, caughtAnimals) {
    const huntTx = db.transaction(() => {
      const now = Math.floor(Date.now() / 1000);
      stmts.recordHunt.run(now, userId);
      
      for (const animal of caughtAnimals) {
        stmts.addZooAnimal.run(userId, animal.id, 1);
      }
    });
    huntTx();
  },

  getZoo(userId) {
    return stmts.getZoo.all(userId);
  },

  addZooAnimal(userId, animalId, count = 1) {
    stmts.addZooAnimal.run(userId, animalId, count);
  },

  removeZooAnimal(userId, animalId, count = 1) {
    const current = stmts.getZooAnimal.get(userId, animalId);
    if (!current || current.count < count) return false;
    if (current.count === count) {
      stmts.deleteZooAnimal.run(userId, animalId);
    } else {
      stmts.removeZooAnimal.run(count, userId, animalId);
    }
    return true;
  },

  getInventory(userId) {
    return stmts.getInventory.all(userId);
  },

  addItem(userId, itemId, qty = 1) {
    stmts.addInventoryItem.run(userId, itemId, qty);
  },

  removeItem(userId, itemId, qty = 1) {
    const current = stmts.getItemCount.get(userId, itemId);
    if (!current || current.quantity < qty) return false;
    if (current.quantity === qty) {
      stmts.deleteInventoryItem.run(userId, itemId);
    } else {
      stmts.removeInventoryItem.run(qty, userId, itemId);
    }
    return true;
  },

  getGuildPrefix(guildId) {
    if (!guildId) return 'owo ';
    const guild = stmts.getGuild.get(guildId);
    return guild ? guild.prefix : 'owo ';
  },

  setGuildPrefix(guildId, prefix) {
    stmts.setGuildPrefix.run(guildId, prefix);
  },

  setTeamName(userId, name, teamNum = 1) {
    if (teamNum === 2) {
      stmts.setTeamName2.run(name, userId);
    } else {
      stmts.setTeamName.run(name, userId);
    }
  },

  getTeamName(userId, teamNum = 1) {
    const user = stmts.getUser.get(userId);
    if (!user) return null;
    return teamNum === 2 ? user.team_name_2 : user.team_name;
  },

  getEquippedWeapon(userId, slot = 1) {
    return stmts.getEquippedWeaponBySlot.get(userId, slot, slot);
  },

  getAllEquippedWeapons(userId) {
    return stmts.getAllEquippedWeapons.all(userId);
  },

  equipWeaponToSlot(userId, weaponId, slot = 1) {
    stmts.unequipSlotWeapon.run(userId, slot, slot);
    stmts.equipWeaponToSlot.run(slot, userId, weaponId);
  },

  unequipWeapon(userId, slot = null) {
    if (slot !== null && slot !== undefined) {
      return stmts.unequipSlotWeapon.run(userId, slot, slot);
    }
    return stmts.unequipAllWeapons.run(userId);
  },

  getTopUsers(type = 'cowoncy', limit = 10) {
    if (type === 'hunts') return stmts.getTopHunts.all(limit);
    return stmts.getTopCowoncy.all(limit);
  },

  getAllUsers(limit = 100) {
    return db.prepare(`
      SELECT id, username, avatar, cowoncy, display_animal, level, hunts, xp
      FROM users 
      ORDER BY cowoncy DESC 
      LIMIT ?
    `).all(limit);
  },

  getDailyQuest(userId) {
    const today = new Date().toISOString().slice(0, 10);
    let quest = stmts.getQuest.get(userId);
    if (!quest || quest.day_key !== today) {
      stmts.upsertQuest.run(userId, today, 0, 0, 0, 0);
      quest = stmts.getQuest.get(userId);
    }
    return quest;
  },

  updateQuestProgress(userId, type, increment = 1) {
    const today = new Date().toISOString().slice(0, 10);
    const quest = this.getDailyQuest(userId);
    let hunts = quest.hunts_done;
    let slots = quest.slots_done;
    let cf = quest.cf_done;

    if (type === 'hunt') hunts += increment;
    if (type === 'slots') slots += increment;
    if (type === 'cf') cf += increment;

    stmts.upsertQuest.run(userId, today, hunts, slots, cf, quest.claimed);
  }
};

module.exports = dbManager;
