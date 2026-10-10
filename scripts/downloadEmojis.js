const fs = require('fs');
const path = require('path');
const https = require('https');
const { ANIMALS } = require('../database/data/animals');
const { WEAPONS } = require('../database/data/items');

const EMOJI_DIR = path.join(__dirname, '..', 'database', 'data', 'emojis');
if (!fs.existsSync(EMOJI_DIR)) {
  fs.mkdirSync(EMOJI_DIR, { recursive: true });
}

function emojiToCodePoint(emoji) {
  return Array.from(emoji)
    .map(c => c.codePointAt(0).toString(16))
    .filter(cp => cp !== 'fe0f')
    .join('-');
}

const emojiSet = new Set();

// Add all animal emojis
ANIMALS.forEach(a => {
  if (a.emoji) emojiSet.add(a.emoji);
});

// Add extra common animals
['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🦝', '🦨', '🦡', '🦔', '🦦', '🦥', '🦘', '🦙', '🦒', '🐘', '🦏', '🦛', '🐪', '🦓', '🐆', '🦌', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐬', '🐳', '🦈', '🐊', '🐢', '🐍', '🦚', '🦢', '🦩', '🦖', '🦕', '🐉', '⚡', '❄️', '🔥', '🌑', '🌟', '👑', '🌌', '☄️', '⚜️', '🌠', '💎', '💠', '🔮', '🦧', '🐑'].forEach(e => emojiSet.add(e));

// Add weapon & battle icons
['🛡️', '⚔️', '🏹', '🗡️', '⛏️', '🪄', '🐾', '🦯', '🪃', '🐟', '🤺', '🪓', '🔮', '🔥', '🌙', '🎯', '🔱'].forEach(e => emojiSet.add(e));

WEAPONS.forEach(w => {
  if (w.typeEmoji) emojiSet.add(w.typeEmoji);
  if (w.elementEmoji) emojiSet.add(w.elementEmoji);
});

console.log(`Downloading ${emojiSet.size} emoji icons...`);

function downloadEmoji(emoji) {
  return new Promise((resolve) => {
    const cp = emojiToCodePoint(emoji);
    const dest = path.join(EMOJI_DIR, `${cp}.png`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 100) {
      return resolve(true);
    }

    const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${cp}.png`;
    const file = fs.createWriteStream(dest);

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        fs.unlink(dest, () => {});
        return resolve(false);
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
    }).on('error', () => {
      fs.unlink(dest, () => {});
      resolve(false);
    });
  });
}

(async () => {
  let count = 0;
  for (const emoji of emojiSet) {
    const ok = await downloadEmoji(emoji);
    if (ok) count++;
  }
  console.log(`Successfully prepared ${count} local emoji PNGs in ${EMOJI_DIR}!`);
})();
