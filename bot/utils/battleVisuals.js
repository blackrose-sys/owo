const { createCanvas } = require('@napi-rs/canvas');

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
 * Generate authentic OwO Battle Visual (Matching Picture 2)
 */
function createBattleVisual(playerPets = [], enemyPets = [], turns = 16, streak = 59, xp = 200) {
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
    const pet = (playerPets && playerPets[i]) || {
      name: 'Champion',
      emoji: '🐻',
      color: '#4caf50',
      hp: 850,
      maxHp: 850,
      mp: 550,
      maxMp: 550,
      atk: 100,
      def: 440,
      crit: 16,
      mag: 16,
      weaponIcon: '🛡️'
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

    // Animal symbol / emoji in portrait
    ctx.fillStyle = '#ffffff';
    ctx.font = '36px "Segoe UI Emoji", "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pet.emoji || '🐻', leftX + 44, rowY + 44);

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
    ctx.font = 'bold 10px "Segoe UI", "Arial", sans-serif';
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
    ctx.font = 'bold 10px "Segoe UI", "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${pet.mp} / ${pet.maxMp}`, barX + barW / 2, rowY + 41);

    // Weapon icon and stats row
    ctx.font = '16px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(pet.weaponIcon || '🛡️', barX + 2, rowY + 68);

    ctx.font = '9px "Segoe UI", monospace';
    ctx.fillStyle = '#9e9e9e';
    ctx.fillText(`[H] ${pet.def || 440}  [W] ${pet.atk || 100}`, barX + 26, rowY + 62);
    ctx.fillText(`[C] ${pet.crit || 16}%  [M] ${pet.mag || 16}%`, barX + 26, rowY + 74);
  }

  // Draw 3 Enemy Pets (Right column - Defeated as in screenshot)
  const rightX = width / 2 + 16;
  for (let i = 0; i < 3; i++) {
    const enemy = (enemyPets && enemyPets[i]) || {
      name: ['cat', 'sheep', 'pig'][i],
      emoji: ['🐱', '🐑', '🐷'][i],
      maxHp: [688, 780, 724][i],
      weaponIcon: ['🏹', '🗡️', '⚔️'][i]
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
    ctx.font = 'bold 10px "Segoe UI", "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`0 / ${enemy.maxHp}`, barX + barW / 2, rowY + 21);

    // Defeated MP Bar
    ctx.fillStyle = '#3a3c42';
    roundRect(ctx, barX, rowY + 30, barW, barH, 3, true, false);
    ctx.fillText(`0 / ${enemy.maxHp - 50}`, barX + barW / 2, rowY + 41);

    // Stats
    ctx.font = '16px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(enemy.weaponIcon || '⚔️', barX + 4, rowY + 68);

    ctx.font = '9px "Segoe UI", monospace';
    ctx.fillStyle = '#6d6f78';
    ctx.fillText(`[H] 128  [W] 85`, barX + 28, rowY + 62);
    ctx.fillText(`[C] 12%  [M] 10%`, barX + 28, rowY + 74);

    // Enemy Portrait (Dimmed/Defeated)
    ctx.fillStyle = '#1c1d21';
    ctx.strokeStyle = '#4a4d55';
    ctx.lineWidth = 1;
    roundRect(ctx, rightX + 208, rowY + 8, 72, 72, 6, true, true);

    ctx.fillStyle = '#6b7280';
    ctx.font = '36px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(enemy.emoji, rightX + 244, rowY + 44);
  }

  // Footer bar
  ctx.fillStyle = '#9e9e9e';
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`You won in ${turns} turns! | +${xp} xp | Streak: ${streak}`, width / 2, 325);

  return canvas.toBuffer('image/png');
}

/**
 * Generate authentic OwO Guild Boss Visual (Matching Picture 1)
 */
function createBossVisual() {
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
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Lvl ${b.lvl}`, cardX + cardW / 2, startY + 22);

    // Boss Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillText(b.title, cardX + cardW / 2, startY + 42);

    // Character illustration area
    ctx.fillStyle = '#1a1b1e';
    roundRect(ctx, cardX + 16, startY + 54, cardW - 32, 100, 6, true, false);

    // Emoji / Illustration
    ctx.font = '48px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.emoji, cardX + cardW / 2, startY + 104);

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
