require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { createCanvas } = require('@napi-rs/canvas');

const SUITS = [
  { letter: 's', symbol: '♠', isRed: false },
  { letter: 'h', symbol: '♥', isRed: true },
  { letter: 'd', symbol: '♦', isRed: true },
  { letter: 'c', symbol: '♣', isRed: false }
];

const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'];

function drawPlayingCard(valueStr, suitSymbol, isRed) {
  const w = 120;
  const h = 170;
  const r = 10;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  const suitColor = isRed ? '#D32F2F' : '#111827';
  const valUpper = valueStr.toUpperCase();

  // 1. Solid White Card Body with Rounded Corners
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();

  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#CBD5E1';
  ctx.stroke();
  ctx.restore();

  // Inner border guideline
  ctx.save();
  ctx.strokeStyle = isRed ? '#FFCDD2' : '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(7, 7, w - 14, h - 14);
  ctx.restore();

  // 2. Corner Labels (Top-Left)
  ctx.fillStyle = suitColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 22px "Arial", sans-serif';
  ctx.fillText(valUpper, 22, 23);
  ctx.font = '20px "Segoe UI Symbol", "Arial", sans-serif';
  ctx.fillText(suitSymbol, 22, 43);

  // 3. Corner Labels (Bottom-Right, inverted)
  ctx.save();
  ctx.translate(w - 22, h - 23);
  ctx.rotate(Math.PI);
  ctx.font = 'bold 22px "Arial", sans-serif';
  ctx.fillText(valUpper, 0, 0);
  ctx.font = '20px "Segoe UI Symbol", "Arial", sans-serif';
  ctx.fillText(suitSymbol, 0, 20);
  ctx.restore();

  // 4. Center Symbol
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (['J', 'Q', 'K'].includes(valUpper)) {
    ctx.font = 'bold 44px "Arial", sans-serif';
    ctx.fillText(valUpper, w / 2, h / 2 - 6);
    ctx.font = '26px "Segoe UI Symbol", "Arial", sans-serif';
    ctx.fillText(suitSymbol, w / 2, h / 2 + 28);
  } else if (valUpper === 'A') {
    ctx.font = '54px "Segoe UI Symbol", "Arial", sans-serif';
    ctx.fillText(suitSymbol, w / 2, h / 2);
  } else {
    ctx.font = '46px "Segoe UI Symbol", "Arial", sans-serif';
    ctx.fillText(suitSymbol, w / 2, h / 2);
  }

  return canvas.toBuffer('image/png');
}

function drawCardBack() {
  const w = 120;
  const h = 170;
  const r = 10;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  // Solid White Outline
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(w - r, 0); ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = '#FFFFFF'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#CBD5E1'; ctx.stroke();
  ctx.restore();

  // Royal Blue body
  ctx.fillStyle = '#1E3A8A';
  ctx.fillRect(8, 8, w - 16, h - 16);

  ctx.strokeStyle = '#60A5FA';
  ctx.lineWidth = 2;
  ctx.strokeRect(13, 13, w - 26, h - 26);

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 28px "Arial", sans-serif';
  ctx.fillText('OwO', w / 2, h / 2);

  return canvas.toBuffer('image/png');
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function deployCards() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once('ready', async () => {
    console.log(`[Deploy Cards] Logged in as ${client.user.tag}`);
    const existing = await client.application.emojis.fetch();
    console.log(`[Deploy Cards] Fetched ${existing.size} existing application emojis.`);

    // 1. Ensure cback
    const cback = existing.find(e => e.name === 'cback');
    if (!cback) {
      console.log('Creating cback...');
      await client.application.emojis.create({ name: 'cback', attachment: drawCardBack() });
      await sleep(600);
    }

    // 2. Iterate all 52 cards
    for (const s of SUITS) {
      for (const v of VALUES) {
        const cardName = `c${v}${s.letter}`;
        const match = existing.find(e => e.name === cardName);
        const buf = drawPlayingCard(v, s.symbol, s.isRed);

        try {
          if (match) {
            await match.delete();
            await sleep(400);
          }
          await client.application.emojis.create({ name: cardName, attachment: buf });
          console.log(`✅ Deployed ${cardName}`);
          await sleep(500); // Respect Discord rate limits
        } catch (err) {
          console.error(`❌ Error on ${cardName}:`, err.message);
          if (err.message.includes('rate limit')) {
            await sleep(5000);
          }
        }
      }
    }

    console.log('🎉 All cards deployed with clean white backgrounds!');
    client.destroy();
    process.exit(0);
  });

  client.login(process.env.DISCORD_TOKEN);
}

deployCards().catch(console.error);
