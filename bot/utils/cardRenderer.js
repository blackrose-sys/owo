/**
 * Canvas-based card renderer for Blackjack and Higher-or-Lower
 * Generates actual card images that display BIG in Discord messages
 * (matching the original OwO bot card size)
 */
const { createCanvas } = require('@napi-rs/canvas');

// Card dimensions (each card) - Bigger & bolder matching original OwO high clarity
const CARD_W = 96;
const CARD_H = 136;
const CARD_RADIUS = 10;
const CARD_GAP = 16;
const PADDING = 18;
const ARROW_W = 34;

// Suit symbols and colors
const SUIT_DATA = {
  '♠': { symbol: '♠', color: '#1a1a2e' },
  '♥': { symbol: '♥', color: '#e53935' },
  '♦': { symbol: '♦', color: '#e53935' },
  '♣': { symbol: '♣', color: '#1a1a2e' }
};

/**
 * Draw a single playing card onto a canvas context
 */
function drawCard(ctx, x, y, value, suit) {
  const sd = SUIT_DATA[suit] || SUIT_DATA['♠'];

  // Card body with white background and subtle shadow
  ctx.save();

  // Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Rounded rect
  ctx.beginPath();
  ctx.moveTo(x + CARD_RADIUS, y);
  ctx.lineTo(x + CARD_W - CARD_RADIUS, y);
  ctx.quadraticCurveTo(x + CARD_W, y, x + CARD_W, y + CARD_RADIUS);
  ctx.lineTo(x + CARD_W, y + CARD_H - CARD_RADIUS);
  ctx.quadraticCurveTo(x + CARD_W, y + CARD_H, x + CARD_W - CARD_RADIUS, y + CARD_H);
  ctx.lineTo(x + CARD_RADIUS, y + CARD_H);
  ctx.quadraticCurveTo(x, y + CARD_H, x, y + CARD_H - CARD_RADIUS);
  ctx.lineTo(x, y + CARD_RADIUS);
  ctx.quadraticCurveTo(x, y, x + CARD_RADIUS, y);
  ctx.closePath();

  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  // Thin border
  ctx.strokeStyle = '#d0d0d0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Top-left value
  ctx.fillStyle = sd.color;
  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(value, x + 8, y + 6);

  // Top-left suit (smaller)
  ctx.font = '20px "Segoe UI Symbol", Arial, sans-serif';
  ctx.fillText(sd.symbol, x + 9, y + 34);

  // Center suit (large)
  ctx.font = '46px "Segoe UI Symbol", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sd.symbol, x + CARD_W / 2, y + CARD_H / 2 + 4);

  // Bottom-right value
  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(value, x + CARD_W - 8, y + CARD_H - 6);

  // Bottom-right suit
  ctx.font = '20px "Segoe UI Symbol", Arial, sans-serif';
  ctx.fillText(sd.symbol, x + CARD_W - 9, y + CARD_H - 34);
}

/**
 * Draw a face-down card (card back)
 */
function drawCardBack(ctx, x, y) {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Rounded rect
  ctx.beginPath();
  ctx.moveTo(x + CARD_RADIUS, y);
  ctx.lineTo(x + CARD_W - CARD_RADIUS, y);
  ctx.quadraticCurveTo(x + CARD_W, y, x + CARD_W, y + CARD_RADIUS);
  ctx.lineTo(x + CARD_W, y + CARD_H - CARD_RADIUS);
  ctx.quadraticCurveTo(x + CARD_W, y + CARD_H, x + CARD_W - CARD_RADIUS, y + CARD_H);
  ctx.lineTo(x + CARD_RADIUS, y + CARD_H);
  ctx.quadraticCurveTo(x, y + CARD_H, x, y + CARD_H - CARD_RADIUS);
  ctx.lineTo(x, y + CARD_RADIUS);
  ctx.quadraticCurveTo(x, y, x + CARD_RADIUS, y);
  ctx.closePath();

  // Dark blue card back
  const grad = ctx.createLinearGradient(x, y, x + CARD_W, y + CARD_H);
  grad.addColorStop(0, '#1a237e');
  grad.addColorStop(1, '#283593');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // Border
  ctx.strokeStyle = '#0d1654';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Diamond pattern inside
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  const cx = x + CARD_W / 2;
  const cy = y + CARD_H / 2;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      const px = cx + dx * 18;
      const py = cy + dy * 16;
      ctx.beginPath();
      ctx.moveTo(px, py - 6);
      ctx.lineTo(px + 5, py);
      ctx.lineTo(px, py + 6);
      ctx.lineTo(px - 5, py);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Question mark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', cx, cy);
}

/**
 * Render a Higher-or-Lower card strip
 * @param {Array} cards - Array of { value: 'A'-'K', suit: '♠♥♦♣' }
 * @returns {Buffer} PNG buffer
 */
function renderHlCards(cards) {
  const numCards = cards.length;
  const numArrows = numCards - 1;
  const totalW = PADDING * 2 + numCards * CARD_W + numArrows * (CARD_GAP + ARROW_W + CARD_GAP);
  const totalH = PADDING * 2 + CARD_H;

  const canvas = createCanvas(totalW, totalH);
  const ctx = canvas.getContext('2d');

  // Transparent background (Discord dark theme friendly)
  ctx.clearRect(0, 0, totalW, totalH);

  // Semi-transparent dark background for contrast
  ctx.fillStyle = 'rgba(32, 34, 37, 0.85)';
  roundRect(ctx, 0, 0, totalW, totalH, 12);
  ctx.fill();

  let curX = PADDING;
  for (let i = 0; i < numCards; i++) {
    const card = cards[i];
    drawCard(ctx, curX, PADDING, card.value, card.suit);
    curX += CARD_W;

    if (i < numCards - 1) {
      // Draw smooth vector arrow triangle between cards
      curX += CARD_GAP;
      const arrowCx = curX + ARROW_W / 2;
      const arrowCy = PADDING + CARD_H / 2;
      ctx.beginPath();
      ctx.moveTo(arrowCx - 7, arrowCy - 11);
      ctx.lineTo(arrowCx + 9, arrowCy);
      ctx.lineTo(arrowCx - 7, arrowCy + 11);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      curX += ARROW_W + CARD_GAP;
    }
  }

  return canvas.toBuffer('image/png');
}

/**
 * Render Blackjack hands side by side
 * @param {Object} opts
 * @param {Array} opts.dealerHand - dealer cards [{value, suit}]
 * @param {Array} opts.playerHand - player cards [{value, suit}]
 * @param {boolean} opts.hideDealer - true to show card back for 2nd dealer card
 * @param {string} opts.dealerLabel - e.g. "Dealer [15+?]"
 * @param {string} opts.playerLabel - e.g. "Player [19]"
 * @returns {Buffer} PNG buffer
 */
function renderBjHands({ dealerHand, playerHand, hideDealer = false, dealerLabel, playerLabel }) {
  const maxCards = Math.max(dealerHand.length, playerHand.length);
  const handWidth = maxCards * CARD_W + (maxCards - 1) * 8;
  const sectionW = Math.max(handWidth + 20, 200);
  const dividerW = 30;
  const totalW = PADDING * 2 + sectionW * 2 + dividerW;
  const labelH = 32;
  const totalH = PADDING * 2 + labelH + CARD_H + 8;

  const canvas = createCanvas(totalW, totalH);
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, totalW, totalH);

  // Background
  ctx.fillStyle = 'rgba(32, 34, 37, 0.9)';
  roundRect(ctx, 0, 0, totalW, totalH, 12);
  ctx.fill();

  // -- Dealer section --
  const dealerX = PADDING;
  ctx.fillStyle = '#b0b0b0';
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(dealerLabel || 'Dealer', dealerX, PADDING);

  let cardX = dealerX + 10;
  const cardY = PADDING + labelH;
  for (let i = 0; i < dealerHand.length; i++) {
    if (hideDealer && i === 1) {
      drawCardBack(ctx, cardX, cardY);
    } else {
      drawCard(ctx, cardX, cardY, dealerHand[i].value, dealerHand[i].suit);
    }
    cardX += CARD_W + 8;
  }

  // -- Divider --
  const divX = PADDING + sectionW + dividerW / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(divX, PADDING + 8);
  ctx.lineTo(divX, totalH - PADDING - 8);
  ctx.stroke();

  // -- Player section --
  const playerSectionX = PADDING + sectionW + dividerW;
  ctx.fillStyle = '#e0e0e0';
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(playerLabel || 'Player', playerSectionX, PADDING);

  cardX = playerSectionX + 10;
  for (let i = 0; i < playerHand.length; i++) {
    drawCard(ctx, cardX, cardY, playerHand[i].value, playerHand[i].suit);
    cardX += CARD_W + 8;
  }

  return canvas.toBuffer('image/png');
}

// Helper to draw rounded rects
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

module.exports = { renderHlCards, renderBjHands, drawCard, drawCardBack };
