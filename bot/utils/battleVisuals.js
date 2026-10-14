const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const EMOJI_DIR = path.join(__dirname, '..', '..', 'database', 'data', 'emojis');
const imageCache = new Map();

function emojiToCodePoint(emoji) {
  if (!emoji) return '';
  return Array.from(emoji)
    .map(c => c.codePointAt(0).toString(16))
    .filter(cp => cp !== 'fe0f')
    .join('-');
}

async function getEmojiImage(emoji) {
  if (!emoji) return null;
  if (imageCache.has(emoji)) return imageCache.get(emoji);

  // 1. Support custom Discord emojis like <:gojo:1559983930629955714>
  const customMatch = typeof emoji === 'string' && emoji.match(/<:(\w+):(\d+)>/);
  if (customMatch) {
    const name = customMatch[1].toLowerCase();
    const id = customMatch[2];
    const assetPath = path.join(__dirname, '..', '..', 'assets', 'emojis', `${name}.png`);
    if (fs.existsSync(assetPath)) {
      try {
        const img = await loadImage(assetPath);
        imageCache.set(emoji, img);
        return img;
      } catch (e) {}
    }
    try {
      const url = `https://cdn.discordapp.com/emojis/${id}.png`;
      const img = await loadImage(url);
      imageCache.set(emoji, img);
      return img;
    } catch (e) {}
  }

  // 2. Direct named asset check in assets/emojis/
  if (typeof emoji === 'string') {
    const directAsset = path.join(__dirname, '..', '..', 'assets', 'emojis', `${emoji.toLowerCase()}.png`);
    if (fs.existsSync(directAsset)) {
      try {
        const img = await loadImage(directAsset);
        imageCache.set(emoji, img);
        return img;
      } catch (e) {}
    }
  }

  // 3. Fallback to standard unicode twemoji
  const cp = emojiToCodePoint(emoji);
  if (cp && imageCache.has(cp)) return imageCache.get(cp);

  const localPath = path.join(EMOJI_DIR, `${cp}.png`);
  if (fs.existsSync(localPath)) {
    try {
      const img = await loadImage(localPath);
      imageCache.set(cp, img);
      return img;
    } catch (e) {}
  }

  // Fallback: try remote CDN if available
  try {
    const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${cp}.png`;
    const img = await loadImage(url);
    imageCache.set(cp, img);
    return img;
  } catch (e) {
    return null;
  }
}

/**
 * Helper to draw a rounded rectangle
 */
function roundRect(ctx, x, y, width, height, radius, fill = true, stroke = false) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/**
 * Generate authentic OwO Battle Visual with real pet and weapon icons
 */
async function createBattleVisual(playerPets = [], enemyPets = [], turns = 16, streak = 59, xp = 200) {
  const width = 640;
  const height = 340;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#23252a';
  ctx.fillRect(0, 0, width, height);

  // Divider
  ctx.strokeStyle = '#32353b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width / 2, 10);
  ctx.lineTo(width / 2, 305);
  ctx.stroke();

  // Draw 3 Player Pets (Left column)
  const leftX = 14;
  for (let i = 0; i < 3; i++) {
    const rawPet = (playerPets && playerPets[i]) || {};
    let petEmoji = rawPet.emoji;
    if (!petEmoji && rawPet.animal) {
      try {
        const { getAnimalById } = require('../../database/data/animals');
        petEmoji = getAnimalById(rawPet.animal)?.emoji;
      } catch (e) {}
    }
    if (!petEmoji && rawPet.name) {
      try {
        const { getAnimalById } = require('../../database/data/animals');
        petEmoji = getAnimalById(rawPet.name.toLowerCase())?.emoji;
      } catch (e) {}
    }
    if (!petEmoji) {
      petEmoji = ['🐺', '🐻', '🐙'][i] || '🐺';
    }

    const curHp = rawPet.hp ?? rawPet.currentHp ?? 850;
    const maxHp = rawPet.maxHp ?? curHp;
    const curMp = rawPet.mp ?? rawPet.currentMana ?? 550;
    const maxMp = rawPet.maxMp ?? curMp;
    const defStat = rawPet.def ?? 440;
    const atkStat = rawPet.atk ?? 100;
    const critStat = rawPet.crit ?? 16;
    const magStat = rawPet.mag ?? 16;
    let weaponIcon = rawPet.weaponIcon;
    if (!weaponIcon && rawPet.weapon) {
      if (typeof rawPet.weapon === 'string') weaponIcon = rawPet.weapon;
      else if (rawPet.weapon.typeEmoji) weaponIcon = rawPet.weapon.typeEmoji;
      else if (rawPet.weapon.type) {
        const map = { sword: '⚔️', shield: '🛡️', bow: '🏹', dagger: '🗡️', wand: '🪄', axe: '⛏️', staff: '🦯' };
        weaponIcon = map[rawPet.weapon.type.toLowerCase()] || '🛡️';
      }
    }
    if (!weaponIcon) weaponIcon = '🛡️';

    const pet = {
      emoji: petEmoji,
      color: rawPet.color || '#4caf50',
      hp: curHp,
      maxHp,
      mp: curMp,
      maxMp,
      def: defStat,
      atk: atkStat,
      crit: critStat,
      mag: magStat,
      weaponIcon
    };

    const rowY = 12 + i * 96;

    // Card boundary
    ctx.fillStyle = '#2b2d32';
    roundRect(ctx, leftX, rowY, 290, 88, 6, true, false);

    // Portrait frame
    ctx.fillStyle = '#1e1f23';
    ctx.strokeStyle = pet.color || '#4caf50';
    ctx.lineWidth = 2;
    roundRect(ctx, leftX + 8, rowY + 8, 72, 72, 6, true, true);

    // Draw real pet icon / picture inside portrait frame
    const petImg = await getEmojiImage(pet.emoji || '🐺');
    if (petImg) {
      ctx.drawImage(petImg, leftX + 17, rowY + 17, 54, 54);
    } else {
      ctx.fillStyle = pet.color || '#4caf50';
      ctx.beginPath();
      ctx.arc(leftX + 44, rowY + 44, 24, 0, Math.PI * 2);
      ctx.fill();
    }

    // HP Bar
    const barX = leftX + 90;
    const barW = 190;
    const barH = 15;

    // HP Background
    ctx.fillStyle = '#3a3c42';
    roundRect(ctx, barX, rowY + 10, barW, barH, 3, true, false);

    // HP Fill (Red / Coral)
    const hpPct = Math.max(0, Math.min(1, pet.hp / (pet.maxHp || 1)));
    ctx.fillStyle = '#d9534f';
    if (hpPct > 0) {
      roundRect(ctx, barX, rowY + 10, Math.max(8, barW * hpPct), barH, 3, true, false);
    }

    // HP Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${pet.hp} / ${pet.maxHp}`, barX + barW / 2, rowY + 21);

    // MP Bar
    ctx.fillStyle = '#3a3c42';
    roundRect(ctx, barX, rowY + 30, barW, barH, 3, true, false);

    // MP Fill (Cyan / Blue)
    const mpPct = Math.max(0, Math.min(1, pet.mp / (pet.maxMp || 1)));
    ctx.fillStyle = '#428bca';
    if (mpPct > 0) {
      roundRect(ctx, barX, rowY + 30, Math.max(8, barW * mpPct), barH, 3, true, false);
    }

    // MP Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${pet.mp} / ${pet.maxMp}`, barX + barW / 2, rowY + 41);

    // Weapon icon and stats row
    const weaponImg = await getEmojiImage(pet.weaponIcon || '🛡️');
    if (weaponImg) {
      ctx.drawImage(weaponImg, barX + 2, rowY + 58, 18, 18);
    }

    ctx.font = '10px monospace';
    ctx.fillStyle = '#9e9e9e';
    ctx.textAlign = 'left';
    ctx.fillText(`[H] ${pet.def || 440}  [W] ${pet.atk || 100}`, barX + 26, rowY + 62);
    ctx.fillText(`[C] ${pet.crit || 16}%  [M] ${pet.mag || 16}%`, barX + 26, rowY + 74);
  }

  // Draw 3 Enemy Pets (Right column - Defeated as in screenshot)
  const rightX = width / 2 + 16;
  for (let i = 0; i < 3; i++) {
    const rawEnemy = (enemyPets && enemyPets[i]) || {};
    let enemyEmoji = rawEnemy.emoji;
    if (!enemyEmoji && rawEnemy.animal) {
      try {
        const { getAnimalById } = require('../../database/data/animals');
        enemyEmoji = getAnimalById(rawEnemy.animal)?.emoji;
      } catch (e) {}
    }
    if (!enemyEmoji && rawEnemy.name) {
      try {
        const { getAnimalById } = require('../../database/data/animals');
        enemyEmoji = getAnimalById(rawEnemy.name.toLowerCase())?.emoji;
      } catch (e) {}
    }
    if (!enemyEmoji) {
      enemyEmoji = ['🐱', '🐑', '🐷'][i] || '🐱';
    }

    const enemyMaxHp = rawEnemy.maxHp || [688, 780, 724][i] || 700;
    let enemyWeaponIcon = rawEnemy.weaponIcon;
    if (!enemyWeaponIcon && rawEnemy.weapon) {
      if (typeof rawEnemy.weapon === 'string') enemyWeaponIcon = rawEnemy.weapon;
      else if (rawEnemy.weapon.typeEmoji) enemyWeaponIcon = rawEnemy.weapon.typeEmoji;
      else if (rawEnemy.weapon.type) {
        const map = { sword: '⚔️', shield: '🛡️', bow: '🏹', dagger: '🗡️', wand: '🪄', axe: '⛏️', staff: '🦯' };
        enemyWeaponIcon = map[rawEnemy.weapon.type.toLowerCase()] || '⚔️';
      }
    }
    if (!enemyWeaponIcon) {
      enemyWeaponIcon = ['🏹', '🗡️', '⛏️'][i] || '⚔️';
    }

    const enemy = {
      emoji: enemyEmoji,
      maxHp: enemyMaxHp,
      weaponIcon: enemyWeaponIcon
    };

    const rowY = 12 + i * 96;

    // Card boundary
    ctx.fillStyle = '#26282d';
    roundRect(ctx, rightX, rowY, 290, 88, 6, true, false);

    // Defeated Empty HP Bar
    const barX = rightX + 10;
    const barW = 185;
    const barH = 15;

    ctx.fillStyle = '#3a3c42';
    roundRect(ctx, barX, rowY + 10, barW, barH, 3, true, false);

    ctx.fillStyle = '#8e9297';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`0 / ${enemy.maxHp}`, barX + barW / 2, rowY + 21);

    // Defeated MP Bar
    ctx.fillStyle = '#3a3c42';
    roundRect(ctx, barX, rowY + 30, barW, barH, 3, true, false);
    ctx.fillText(`0 / ${Math.max(100, enemy.maxHp - 50)}`, barX + barW / 2, rowY + 41);

    // Weapon icon and stats row
    const enemyWeaponImg = await getEmojiImage(enemy.weaponIcon || '⚔️');
    if (enemyWeaponImg) {
      ctx.globalAlpha = 0.6;
      ctx.drawImage(enemyWeaponImg, barX + 4, rowY + 58, 18, 18);
      ctx.globalAlpha = 1.0;
    }

    ctx.font = '10px monospace';
    ctx.fillStyle = '#6d6f78';
    ctx.textAlign = 'left';
    ctx.fillText(`[H] 128  [W] 85`, barX + 28, rowY + 62);
    ctx.fillText(`[C] 12%  [M] 10%`, barX + 28, rowY + 74);

    // Enemy Portrait (Dimmed/Defeated)
    ctx.fillStyle = '#1c1d21';
    ctx.strokeStyle = '#4a4d55';
    ctx.lineWidth = 1;
    roundRect(ctx, rightX + 208, rowY + 8, 72, 72, 6, true, true);

    const enemyImg = await getEmojiImage(enemy.emoji);
    if (enemyImg) {
      ctx.globalAlpha = 0.55;
      ctx.drawImage(enemyImg, rightX + 217, rowY + 17, 54, 54);
      ctx.globalAlpha = 1.0;
    }
  }

  // Footer bar
  ctx.fillStyle = '#9e9e9e';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`You won in ${turns} turns! | +${xp} xp | Streak: ${streak}`, width / 2, 325);

  return canvas.toBuffer('image/png');
}

/**
 * Generate authentic OwO Guild Boss Visual (Matching Picture 1)
 */
async function createBossVisual() {
  const width = 720;
  const height = 350;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#1e1f22';
  ctx.fillRect(0, 0, width, height);

  const cardW = 218;
  const cardH = 320;
  const startY = 15;

  const bosses = [
    {
      lvl: 95,
      title: 'Legendary Snowman',
      emoji: '⛄',
      border: '#d4af37',
      headerCol: '#f1c40f',
      hp: 94339,
      maxHp: 454566,
      h: '1,070',
      w: '2,020',
      d: '290',
      m: '385',
      c: '55%',
      mag: '64%',
      wIcon: '🪄',
      elem: '☢️',
      sub1: '🔮',
      sub2: '🌀'
    },
    {
      lvl: 9,
      title: 'Rare Cat',
      emoji: '🐱',
      border: '#d4af37',
      headerCol: '#f1c40f',
      hp: 0,
      maxHp: 221583,
      h: '554',
      w: '608',
      d: '109',
      m: '127',
      c: '24%',
      mag: '35%',
      wIcon: '🏹',
      elem: '🍃',
      sub1: '🗡️',
      sub2: '✨'
    },
    {
      lvl: 84,
      title: 'Mythical Cat',
      emoji: '🐱',
      border: '#a855f7',
      headerCol: '#c084fc',
      hp: 146774,
      maxHp: 498283,
      h: '1,200',
      w: '1,508',
      d: '212',
      m: '352',
      c: '53%',
      mag: '67%',
      wIcon: '🛡️',
      elem: '🩸',
      sub1: '🔥',
      sub2: '🧛'
    }
  ];

  for (let i = 0; i < 3; i++) {
    const b = bosses[i];
    const cardX = 14 + i * (cardW + 16);

    // Card Body
    ctx.fillStyle = '#23252a';
    ctx.strokeStyle = b.border;
    ctx.lineWidth = 2.5;
    roundRect(ctx, cardX, startY, cardW, cardH, 8, true, true);

    // Inner decorative corner border
    ctx.strokeStyle = b.border;
    ctx.lineWidth = 1;
    roundRect(ctx, cardX + 4, startY + 4, cardW - 8, cardH - 8, 6, false, true);

    // Lvl Header
    ctx.fillStyle = b.headerCol;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Lvl ${b.lvl}`, cardX + cardW / 2, startY + 22);

    // Boss Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(b.title, cardX + cardW / 2, startY + 42);

    // Character illustration area
    ctx.fillStyle = '#1a1b1e';
    roundRect(ctx, cardX + 16, startY + 54, cardW - 32, 100, 6, true, false);

    // Draw real boss icon / picture inside portrait frame
    const bossImg = await getEmojiImage(b.emoji);
    if (bossImg) {
      ctx.drawImage(bossImg, cardX + cardW / 2 - 32, startY + 68, 64, 64);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.emoji, cardX + cardW / 2, startY + 104);
    }

    if (b.title.includes('Snowman')) {
      ctx.font = '14px "Segoe UI Emoji", sans-serif';
      ctx.fillStyle = '#81d4fa';
      ctx.fillText('❄️   ❄️', cardX + cardW / 2, startY + 74);
      ctx.fillText('❄️   ❄️', cardX + cardW / 2, startY + 130);
    }

    // Health Bar
    const hpBarY = startY + 168;
    const barW = cardW - 32;
    const barH = 16;
    ctx.fillStyle = '#36393f';
    roundRect(ctx, cardX + 16, hpBarY, barW, barH, 4, true, false);

    const hpRatio = b.hp / b.maxHp;
    if (hpRatio > 0) {
      ctx.fillStyle = '#d9534f';
      roundRect(ctx, cardX + 16, hpBarY, Math.max(6, barW * hpRatio), barH, 4, true, false);
    }

    // HP Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Segoe UI", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${b.hp.toLocaleString()} / ${b.maxHp.toLocaleString()}`, cardX + cardW / 2, hpBarY + 12);

    // Stat Grid Box
    const statY = startY + 196;
    ctx.fillStyle = '#1c1d21';
    roundRect(ctx, cardX + 12, statY, cardW - 24, 110, 6, true, false);

    ctx.font = '11px "Segoe UI", monospace';
    ctx.textAlign = 'left';

    // Row 1: [H] and [W] and Weapon
    ctx.fillStyle = '#e57373';
    ctx.fillText('🟪', cardX + 20, statY + 22);
    ctx.fillStyle = '#cccccc';
    ctx.fillText(b.h, cardX + 38, statY + 22);

    ctx.fillStyle = '#64b5f6';
    ctx.fillText('🟦', cardX + 90, statY + 22);
    ctx.fillStyle = '#cccccc';
    ctx.fillText(b.w, cardX + 108, statY + 22);

    ctx.font = '16px "Segoe UI Emoji", sans-serif';
    ctx.fillText(b.wIcon, cardX + 170, statY + 24);

    // Row 2: [D] and [M] and Elem
    ctx.font = '11px "Segoe UI", monospace';
    ctx.fillStyle = '#e57373';
    ctx.fillText('🟪', cardX + 20, statY + 54);
    ctx.fillStyle = '#cccccc';
    ctx.fillText(b.d, cardX + 38, statY + 54);

    ctx.fillStyle = '#64b5f6';
    ctx.fillText('🟦', cardX + 90, statY + 54);
    ctx.fillStyle = '#cccccc';
    ctx.fillText(b.m, cardX + 108, statY + 54);

    ctx.font = '16px "Segoe UI Emoji", sans-serif';
    ctx.fillText(b.elem, cardX + 170, statY + 56);

    // Row 3: [C] and [M] and Sub Icons
    ctx.font = '11px "Segoe UI", monospace';
    ctx.fillStyle = '#ba68c8';
    ctx.fillText('🟪', cardX + 20, statY + 86);
    ctx.fillStyle = '#cccccc';
    ctx.fillText(b.c, cardX + 38, statY + 86);

    ctx.fillStyle = '#64b5f6';
    ctx.fillText('🟦', cardX + 90, statY + 86);
    ctx.fillStyle = '#cccccc';
    ctx.fillText(b.mag, cardX + 108, statY + 86);

    ctx.font = '16px "Segoe UI Emoji", sans-serif';
    ctx.fillText(`${b.sub1} ${b.sub2}`, cardX + 160, statY + 88);
  }

  return canvas.toBuffer('image/png');
}

module.exports = {
  createBattleVisual,
  createBossVisual
};
