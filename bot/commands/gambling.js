const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const db = require('../../database/db');
const { getRandomFace } = require('../../database/data/dialogue');
const { checkCooldown } = require('../handlers/cooldownHandler');

// Blackjack card utilities
const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Authentic Unicode Playing Cards mapping matching OwO deck
const UNICODE_CARDS = {
  '♠': { 'A': '🂡', '2': '🂢', '3': '🂣', '4': '🂤', '5': '🂥', '6': '🂦', '7': '🂧', '8': '🂨', '9': '🂩', '10': '🂪', 'J': '🂫', 'Q': '🂭', 'K': '🂮' },
  '♥': { 'A': '🂱', '2': '🂲', '3': '🂳', '4': '🂴', '5': '🂵', '6': '🂶', '7': '🂷', '8': '🂸', '9': '🂹', '10': '🂺', 'J': '🂻', 'Q': '🂽', 'K': '🂾' },
  '♦': { 'A': '🃁', '2': '🃂', '3': '🃃', '4': '🃄', '5': '🃅', '6': '🃆', '7': '🃇', '8': '🃈', '9': '🃉', '10': '🃊', 'J': '🃋', 'Q': '🃍', 'K': '🃎' },
  '♣': { 'A': '🃑', '2': '🃒', '3': '🃓', '4': '🃔', '5': '🃕', '6': '🃖', '7': '🃗', '8': '🃘', '9': '🃙', '10': '🃚', 'J': '🃛', 'Q': '🃝', 'K': '🃞' }
};

let CARDS_MAP = {};
try {
  CARDS_MAP = require('../../database/data/cards.json');
} catch (e) {}

function getCardEmoji(card, client = null) {
  if (!card) return '`[ 🂠 ? ]`';
  const cleanSuit = (card.suit || '').replace(/\uFE0F/g, '');
  const suitLetter = cleanSuit === '♠' ? 's' : cleanSuit === '♥' ? 'h' : cleanSuit === '♦' ? 'd' : 'c';
  const targetName = `c${card.value}${suitLetter}`.toLowerCase();

  // 1. Direct application emoji from pre-deployed cards.json
  if (CARDS_MAP[targetName]) {
    return `<:${targetName}:${CARDS_MAP[targetName]}>`;
  }

  // 2. Check Discord application emojis cache
  if (client?.application?.emojis?.cache) {
    const appMatch = client.application.emojis.cache.find(e => e.name.toLowerCase() === targetName);
    if (appMatch) return appMatch.toString();
  }

  // 3. Check guild emojis
  if (client?.emojis?.cache && typeof client.emojis.cache.find === 'function') {
    const guildMatch = client.emojis.cache.find(e => e.name.toLowerCase() === targetName);
    if (guildMatch) return guildMatch.toString();
  }

  return `\`[ ${card.value}${cleanSuit} ]\``;
}

function getCardBackEmoji(client = null) {
  if (CARDS_MAP['cback']) {
    return `<:cback:${CARDS_MAP['cback']}>`;
  }

  if (client?.application?.emojis?.cache) {
    const appMatch = client.application.emojis.cache.find(e => e.name.toLowerCase() === 'cback');
    if (appMatch) return appMatch.toString();
  }

  if (client?.emojis?.cache && typeof client.emojis.cache.find === 'function') {
    const guildMatch = client.emojis.cache.find(e => e.name.toLowerCase() === 'cback');
    if (guildMatch) return guildMatch.toString();
  }

  return '`[ 🂠 ? ]`';
}

function getDealerUpValue(card) {
  if (card.value === 'A') return 11;
  if (['J', 'Q', 'K'].includes(card.value)) return 10;
  return parseInt(card.value, 10);
}

function createDeck() {
  const deck = [];
  for (const s of SUITS) {
    for (const v of VALUES) {
      deck.push({ suit: s, value: v });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function calculateHandValue(hand) {
  let value = 0;
  let aces = 0;

  for (const card of hand) {
    if (['J', 'Q', 'K'].includes(card.value)) {
      value += 10;
    } else if (card.value === 'A') {
      aces += 1;
      value += 11;
    } else {
      value += parseInt(card.value, 10);
    }
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }

  return value;
}

function formatHand(hand, hideDealerHole = false, client = null) {
  if (hideDealerHole) {
    return `${getCardEmoji(hand[0], client)} ${getCardBackEmoji(client)}`;
  }
  return hand.map(c => getCardEmoji(c, client)).join(' ');
}

// Higher or Lower card deck utilities
const HL_NAMES = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K'
};

function drawHlCard() {
  const value = Math.floor(Math.random() * 13) + 1;
  const suit = ['♠', '♥', '♦', '♣'][Math.floor(Math.random() * 4)];
  return { value, suit, label: `${HL_NAMES[value]}${suit}` };
}

// Parses bet arguments like "all", "a", "half", "h", "1k", "10k", "1m", or numbers
// OwO standard: Max bet cap is strictly 250,000 cowoncy (including 'all' / 'a')
function parseBet(rawBet, userBalance) {
  if (!rawBet) return null;
  const str = rawBet.toLowerCase().trim();
  const maxBet = 250000;

  if (str === 'all' || str === 'a') {
    return Math.min(Math.max(0, userBalance), maxBet);
  }
  if (str === 'half' || str === 'h') {
    return Math.min(Math.max(0, Math.floor(userBalance / 2)), maxBet);
  }

  const kMatch = str.match(/^(\d+(\.\d+)?)k$/);
  if (kMatch) {
    return Math.min(Math.floor(parseFloat(kMatch[1]) * 1000), maxBet);
  }
  const mMatch = str.match(/^(\d+(\.\d+)?)m$/);
  if (mMatch) {
    return Math.min(Math.floor(parseFloat(mMatch[1]) * 1000000), maxBet);
  }
  const bMatch = str.match(/^(\d+(\.\d+)?)b$/);
  if (bMatch) {
    return Math.min(Math.floor(parseFloat(bMatch[1]) * 1000000000), maxBet);
  }
  const tMatch = str.match(/^(\d+(\.\d+)?)t$/);
  if (tMatch) {
    return Math.min(Math.floor(parseFloat(tMatch[1]) * 1000000000000), maxBet);
  }

  const num = parseInt(str, 10);
  if (isNaN(num) || num <= 0) return null;
  return Math.min(num, maxBet);
}

module.exports = {
  // --- 1. COINFLIP (with smooth animated toss) ---
  coinflip: async (message, args, user) => {
    const cd = checkCooldown(user.id, 'cf', 2);
    if (cd) return message.reply(`⏰ Hold on! Cooldown: **${cd}s** ${getRandomFace()}`);

    const bet = parseBet(args[0], user.cowoncy);
    if (!bet || bet <= 0) {
      return message.reply(`❌ Please specify a valid bet amount! Usage: \`wcf <amount> [heads/tails]\``);
    }
    if (user.cowoncy < bet) {
      return message.reply(`❌ You don't have enough Cowoncy! Your balance: **${user.cowoncy.toLocaleString()}**.`);
    }

    const choiceRaw = (args[1] || 'heads').toLowerCase();
    const playerChoice = (choiceRaw.startsWith('h')) ? 'heads' : (choiceRaw.startsWith('t') ? 'tails' : 'heads');

    const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
    const isWin = playerChoice === outcome;

    db.updateQuestProgress(user.id, 'cf');

    // Smooth animation: Send initial toss then edit!
    const spinMsg = await message.reply(`🪙 | **${message.author.username}** spent **${bet.toLocaleString()}** cowoncy and chose **${playerChoice}**... The coin spins in the air... 🔄`);

    setTimeout(async () => {
      if (isWin) {
        db.addCowoncy(user.id, bet);
        await spinMsg.edit(`🪙 | **${message.author.username}** spent **${bet.toLocaleString()}** cowoncy and chose **${playerChoice}**... The coin landed on **${outcome}**! You won **${(bet * 2).toLocaleString()}** cowoncy! 🎉`).catch(() => {});
      } else {
        db.addCowoncy(user.id, -bet);
        await spinMsg.edit(`🪙 | **${message.author.username}** spent **${bet.toLocaleString()}** cowoncy and chose **${playerChoice}**... The coin landed on **${outcome}** and you lost it all... :c`).catch(() => {});
      }
    }, 850);
  },

  // --- 2. SLOTS (with realistic multi-stage reel stopping animation) ---
  slots: async (message, args, user) => {
    const cd = checkCooldown(user.id, 'slots', 3);
    if (cd) return message.reply(`⏰ Slow down! Wait **${cd}s** before spinning again!`);

    const bet = parseBet(args[0], user.cowoncy);
    if (!bet || bet <= 0) {
      return message.reply(`❌ Please enter a valid bet amount! Usage: \`ws <amount>\``);
    }
    if (user.cowoncy < bet) {
      return message.reply(`❌ You only have **${user.cowoncy.toLocaleString()}** cowoncy!`);
    }

    db.addCowoncy(user.id, -bet);
    db.updateQuestProgress(user.id, 'slots');

    const symbols = ['💎', '👑', '🍒', '🍇', '🍋', '🍆'];
    const weights = [3, 6, 12, 18, 28, 33];

    function pickSymbol() {
      const total = weights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * total;
      for (let i = 0; i < symbols.length; i++) {
        if (rand < weights[i]) return symbols[i];
        rand -= weights[i];
      }
      return '🍆';
    }

    const reel1 = pickSymbol();
    const reel2 = pickSymbol();
    const reel3 = pickSymbol();

    let multiplier = 0;
    if (reel1 === reel2 && reel2 === reel3) {
      if (reel1 === '💎') multiplier = 10;
      else if (reel1 === '👑') multiplier = 7;
      else if (reel1 === '🍒') multiplier = 5;
      else if (reel1 === '🍇') multiplier = 4;
      else if (reel1 === '🍋') multiplier = 3;
      else multiplier = 3;
    } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
      multiplier = 2;
    }

    const winnings = bet * multiplier;

    // Step 1: Initial reel spin
    const spinMsg = await message.reply(
      `🎰 | **${message.author.username}** spent **${bet.toLocaleString()}** cowoncy\n` +
      `[ 🔄 | 🔄 | 🔄 ]`
    );

    // Step 2: Lock reel 1 (450ms)
    setTimeout(async () => {
      await spinMsg.edit(
        `🎰 | **${message.author.username}** spent **${bet.toLocaleString()}** cowoncy\n` +
        `[ ${reel1} | 🔄 | 🔄 ]`
      ).catch(() => {});

      // Step 3: Lock reel 2 (950ms)
      setTimeout(async () => {
        await spinMsg.edit(
          `🎰 | **${message.author.username}** spent **${bet.toLocaleString()}** cowoncy\n` +
          `[ ${reel1} | ${reel2} | 🔄 ]`
        ).catch(() => {});

        // Step 4: Lock reel 3 & reveal outcome (1500ms)
        setTimeout(async () => {
          if (winnings > 0) db.addCowoncy(user.id, winnings);

          let resultText = '';
          if (multiplier >= 7) {
            resultText = `and won **${winnings.toLocaleString()}** cowoncy! 🔥 **JACKPOT!**`;
          } else if (multiplier > 0) {
            resultText = `and won **${winnings.toLocaleString()}** cowoncy! 🎉`;
          } else {
            resultText = `and lost it all... :c`;
          }

          await spinMsg.edit(
            `🎰 | **${message.author.username}** spent **${bet.toLocaleString()}** cowoncy\n` +
            `[ ${reel1} | ${reel2} | ${reel3} ]\n` +
            `${resultText}`
          ).catch(() => {});
        }, 550);
      }, 500);
    }, 450);
  },

  // --- 3. BLACKJACK (Exact authentic OwO Embed & Custom Emojis matching Picture 1) ---
  blackjack: async (message, args, user) => {
    const cd = checkCooldown(user.id, 'bj', 3);
    if (cd) return message.reply(`⏰ Please wait **${cd}s** before starting another blackjack game!`);

    const bet = parseBet(args[0], user.cowoncy);
    if (!bet || bet <= 0) {
      return message.reply(`❌ Specify a valid bet amount! Usage: \`wbj <amount>\` (or \`wbj all\`)`);
    }
    if (user.cowoncy < bet) {
      return message.reply(`🚫 | **${message.author.username}**, you don't have enough cowoncy! You currently have **${user.cowoncy.toLocaleString()}** cowoncy.`);
    }

    db.addCowoncy(user.id, -bet);

    const deck = createDeck();
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];

    let playerVal = calculateHandValue(playerHand);
    let dealerVal = calculateHandValue(dealerHand);
    const authorName = message.author.username;
    const authorAvatar = (typeof message.author.displayAvatarURL === 'function' && message.author.displayAvatarURL()) || undefined;

    function buildBjEmbed(dealerTitle, dealerCards, playerTitle, playerCards, statusText, color) {
      return new EmbedBuilder()
        .setColor(color)
        .setAuthor({
          name: `${authorName}, you bet ${bet.toLocaleString()} to play blackjack`,
          iconURL: authorAvatar
        })
        .addFields(
          {
            name: dealerTitle,
            value: dealerCards,
            inline: true
          },
          {
            name: playerTitle,
            value: playerCards,
            inline: true
          },
          {
            name: '\u200b',
            value: statusText,
            inline: false
          }
        );
    }

    // Natural 21 Blackjack
    if (playerVal === 21) {
      if (dealerVal === 21) {
        db.addCowoncy(user.id, bet);
        const embed = buildBjEmbed(
          'Dealer [21]',
          formatHand(dealerHand, false, message.client),
          `${authorName} [21]`,
          formatHand(playerHand, false, message.client),
          '🎲 ~ You tied!',
          0x4f545c
        );
        return message.reply({ embeds: [embed] });
      } else {
        const winAmount = bet * 2;
        db.addCowoncy(user.id, winAmount);
        const embed = buildBjEmbed(
          `Dealer [${dealerVal}]`,
          formatHand(dealerHand, false, message.client),
          `${authorName} [21]`,
          formatHand(playerHand, false, message.client),
          `🎲 ~ You won ${winAmount.toLocaleString()} cowoncy!`,
          0x57f287
        );
        return message.reply({ embeds: [embed] });
      }
    }

    const dealerUpVal = getDealerUpValue(dealerHand[0]);
    const dealerUpEmoji = getCardEmoji(dealerHand[0], message.client);
    const cardBackEmoji = getCardBackEmoji(message.client);
    const dealerInitialCards = `${dealerUpEmoji} ${cardBackEmoji}`;
    const playerInitialCards = formatHand(playerHand, false, message.client);

    const initialEmbed = buildBjEmbed(
      `Dealer [${dealerUpVal}+?]`,
      dealerInitialCards,
      `${authorName} [${playerVal}]`,
      playerInitialCards,
      '🎲 ~ game in progress',
      0x3498db
    );

    const replyMsg = await message.reply({ embeds: [initialEmbed] });
    await replyMsg.react('👊').catch(() => {});
    await replyMsg.react('🛑').catch(() => {});

    let gameEnded = false;

    const filter = (reaction, userObj) => {
      return ['👊', '🛑'].includes(reaction.emoji.name) && userObj.id === message.author.id;
    };

    const collector = replyMsg.createReactionCollector({
      filter,
      time: 60000,
      max: 20
    });

    async function finishGame() {
      if (gameEnded) return;
      gameEnded = true;

      while (calculateHandValue(dealerHand) < 17 && deck.length > 0) {
        dealerHand.push(deck.pop());
      }

      const finalDealerVal = calculateHandValue(dealerHand);
      const finalPlayerVal = calculateHandValue(playerHand);

      let embedColor = 0x4f545c;
      let statusText = '🎲 ~ You tied!';

      if (finalDealerVal > 21) {
        const winAmount = bet * 2;
        db.addCowoncy(user.id, winAmount);
        embedColor = 0x57f287;
        statusText = `🎲 ~ Dealer busted! You won **${winAmount.toLocaleString()}** cowoncy!`;
      } else if (finalPlayerVal > finalDealerVal) {
        const winAmount = bet * 2;
        db.addCowoncy(user.id, winAmount);
        embedColor = 0x57f287;
        statusText = `🎲 ~ You won ${winAmount.toLocaleString()} cowoncy!`;
      } else if (finalPlayerVal === finalDealerVal) {
        db.addCowoncy(user.id, bet);
        embedColor = 0x4f545c;
        statusText = '🎲 ~ You tied!';
      } else {
        embedColor = 0xed4245;
        statusText = `🎲 ~ You lost ${bet.toLocaleString()} cowoncy!`;
      }

      const finalEmbed = buildBjEmbed(
        `Dealer [${finalDealerVal}]`,
        formatHand(dealerHand, false, message.client),
        `${authorName} [${finalPlayerVal}]`,
        formatHand(playerHand, false, message.client),
        statusText,
        embedColor
      );

      await replyMsg.edit({ embeds: [finalEmbed] }).catch(() => {});
    }

    collector.on('collect', async (reaction, userObj) => {
      if (gameEnded) return;

      if (reaction.emoji.name === '👊') {
        // Hit
        playerHand.push(deck.pop());
        playerVal = calculateHandValue(playerHand);

        if (message.guild) {
          reaction.users.remove(userObj.id).catch(() => {});
        }

        if (playerVal > 21) {
          gameEnded = true;
          collector.stop('bust');
          const finalDealerVal = calculateHandValue(dealerHand);

          const bustEmbed = buildBjEmbed(
            `Dealer [${finalDealerVal}]`,
            formatHand(dealerHand, false, message.client),
            `${authorName} [${playerVal}]`,
            formatHand(playerHand, false, message.client),
            `🎲 ~ You lost ${bet.toLocaleString()} cowoncy!`,
            0xed4245
          );

          await replyMsg.edit({ embeds: [bustEmbed] }).catch(() => {});
        } else if (playerVal === 21) {
          collector.stop('stand');
          await finishGame();
        } else {
          const updatedEmbed = buildBjEmbed(
            `Dealer [${dealerUpVal}+?]`,
            dealerInitialCards,
            `${authorName} [${playerVal}]`,
            formatHand(playerHand, false, message.client),
            '🎲 ~ game in progress',
            0x3498db
          );

          await replyMsg.edit({ embeds: [updatedEmbed] }).catch(() => {});
        }
      } else if (reaction.emoji.name === '🛑') {
        collector.stop('stand');
        await finishGame();
      }
    });

    collector.on('end', async (_, reason) => {
      if (!gameEnded) {
        await finishGame();
      }
    });
  },

  // --- 4. HIGHER OR LOWER (whl / hl - matching the exact user screenshot) ---
  highlow: async (message, args, user) => {
    const cd = checkCooldown(user.id, 'hl', 2);
    if (cd) return message.reply(`⏰ Hold on! Wait **${cd}s** before starting another game!`);

    const bet = parseBet(args[0], user.cowoncy);
    if (!bet || bet <= 0) {
      return message.reply(`❌ Specify a bet! Usage: \`whl <amount>\` (e.g. \`whl 40000\`)`);
    }
    if (user.cowoncy < bet) {
      return message.reply(`❌ You only have **${user.cowoncy.toLocaleString()}** cowoncy!`);
    }

    db.addCowoncy(user.id, -bet);

    let streak = 0;
    let currentCashOut = bet;
    const cardHistory = [drawHlCard()];

    function calcOdds(currentVal, pot) {
      const numHigher = 13 - currentVal;
      const numLower = currentVal - 1;

      const higherMult = numHigher > 0 ? (1 + ((currentVal / (14 - currentVal)) * 0.88)) : 1;
      const lowerMult = numLower > 0 ? (1 + (((14 - currentVal) / currentVal) * 0.88)) : 1;
      const sameMult = 11.0;

      const rewardH = numHigher > 0 ? Math.floor(pot * higherMult) - pot : 0;
      const rewardL = numLower > 0 ? Math.floor(pot * lowerMult) - pot : 0;
      const rewardS = Math.floor(pot * sameMult);

      return { rewardH, rewardL, rewardS, numHigher, numLower };
    }

    function buildHlComponents(currentVal, pot) {
      const odds = calcOdds(currentVal, pot);

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('hl_higher')
          .setLabel(`Higher (+${odds.rewardH.toLocaleString()})`)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(odds.numHigher === 0),
        new ButtonBuilder()
          .setCustomId('hl_lower')
          .setLabel(`Lower (+${odds.rewardL.toLocaleString()})`)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(odds.numLower === 0)
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('hl_same')
          .setLabel(`Same (+${odds.rewardS.toLocaleString()})`)
          .setStyle(ButtonStyle.Primary)
      );

      const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('hl_cashout')
          .setLabel(`Cash Out`)
          .setStyle(ButtonStyle.Success)
      );

      return [row1, row2, row3];
    }

    function buildHlEmbed(statusTitle, isDone = false) {
      const currentCard = cardHistory[cardHistory.length - 1];
      const historyStr = cardHistory.map(c => getCardEmoji({ value: HL_NAMES[c.value], suit: c.suit }, message.client)).join(' ▶ ');
      const multStr = (currentCashOut / bet).toFixed(2);
      const icon = isDone ? (currentCashOut > 0 ? '👍' : '👎') : '🎰';

      const embed = new EmbedBuilder()
        .setColor(isDone ? (currentCashOut > 0 ? '#4caf50' : '#e53935') : '#8a7ff8')
        .setDescription(
          `${icon} **@${message.author.username} ${statusTitle}**\n` +
          `**Bet:** \`${bet.toLocaleString()}\`  **Streak:** \`${streak}\`  **Cash Out:** \`${currentCashOut.toLocaleString()}\` \`(${multStr}x)\`\n\n` +
          `${historyStr}\n\n` +
          (isDone 
            ? (currentCashOut > 0 ? `You cashed out with **${currentCashOut.toLocaleString()}** cowoncy!` : `You lost your bet of **${bet.toLocaleString()}** cowoncy.`)
            : `Current Card: ${HL_NAMES[currentCard.value]}`)
        );
      return embed;
    }

    const currentCard = cardHistory[0];
    const initialEmbed = buildHlEmbed(`playing!`);
    const components = buildHlComponents(currentCard.value, currentCashOut);

    const replyMsg = await message.reply({ embeds: [initialEmbed], components });

    if (typeof replyMsg?.createMessageComponentCollector !== 'function') return;

    const collector = replyMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
      filter: (i) => i.user.id === message.author.id
    });

    collector.on('collect', async (interaction) => {
      const prevCard = cardHistory[cardHistory.length - 1];
      const odds = calcOdds(prevCard.value, currentCashOut);

      if (interaction.customId === 'hl_cashout') {
        collector.stop('cashout');
        db.addCowoncy(user.id, currentCashOut);
        const finalEmbed = buildHlEmbed(`cashed out!`, true);
        return interaction.update({ embeds: [finalEmbed], components: [] });
      }

      // Draw next card
      const nextCard = drawHlCard();
      cardHistory.push(nextCard);

      let isCorrect = false;
      let wonBonus = 0;

      if (interaction.customId === 'hl_higher') {
        if (nextCard.value > prevCard.value) {
          isCorrect = true;
          wonBonus = odds.rewardH;
        }
      } else if (interaction.customId === 'hl_lower') {
        if (nextCard.value < prevCard.value) {
          isCorrect = true;
          wonBonus = odds.rewardL;
        }
      } else if (interaction.customId === 'hl_same') {
        if (nextCard.value === prevCard.value) {
          isCorrect = true;
          wonBonus = odds.rewardS;
        }
      }

      if (isCorrect) {
        streak += 1;
        currentCashOut += wonBonus;
        const newEmbed = buildHlEmbed(`guessed correctly!!`);
        const newComponents = buildHlComponents(nextCard.value, currentCashOut);
        return interaction.update({ embeds: [newEmbed], components: newComponents });
      } else {
        // Lost!
        collector.stop('lost');
        currentCashOut = 0;
        const lostEmbed = buildHlEmbed(`guessed incorrectly!!`, true);
        return interaction.update({ embeds: [lostEmbed], components: [] });
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        replyMsg.edit({ components: [] }).catch(() => {});
      }
    });
  },

  // --- 5. ROULETTE ---
  roulette: async (message, args, user) => {
    const bet = parseBet(args[0], user.cowoncy);
    const space = (args[1] || '').toLowerCase();

    if (!bet || !space) {
      return message.reply(`❌ Usage: \`wroulette <amount> <red/black/green/even/odd/0-36>\``);
    }
    if (user.cowoncy < bet) {
      return message.reply(`❌ You only have **${user.cowoncy.toLocaleString()}** cowoncy!`);
    }

    db.addCowoncy(user.id, -bet);

    const roll = Math.floor(Math.random() * 37);
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const isRed = redNumbers.includes(roll);
    const isBlack = roll !== 0 && !isRed;
    const isGreen = roll === 0;

    let won = false;
    let multiplier = 0;

    if (space === 'red' && isRed) { won = true; multiplier = 2; }
    else if (space === 'black' && isBlack) { won = true; multiplier = 2; }
    else if (space === 'green' && isGreen) { won = true; multiplier = 36; }
    else if (space === 'even' && roll !== 0 && roll % 2 === 0) { won = true; multiplier = 2; }
    else if (space === 'odd' && roll % 2 !== 0) { won = true; multiplier = 2; }
    else if (parseInt(space, 10) === roll) { won = true; multiplier = 36; }

    const rollColor = isGreen ? '🟢 Green' : (isRed ? '🔴 Red' : '⚫ Black');

    if (won) {
      const winnings = bet * multiplier;
      db.addCowoncy(user.id, winnings);
      return message.reply(`🎡 | The ball landed on **${rollColor} ${roll}**! You won **+${winnings.toLocaleString()}** cowoncy!`);
    } else {
      return message.reply(`🎡 | The ball landed on **${rollColor} ${roll}**. You lost **-${bet.toLocaleString()}** cowoncy.`);
    }
  },

  // --- 5. MINES (Interactive Grid with Cash Out) ---
  mines: async (message, args, user) => {
    const cd = checkCooldown(user.id, 'mines', 3);
    if (cd) return message.reply(`⏰ Please wait **${cd}s** before starting another mines game!`);

    const bet = parseBet(args[0], user.cowoncy);
    if (!bet || bet <= 0) {
      return message.reply(`❌ Specify a valid bet amount! Usage: \`wmines <bet>\` (e.g. \`wmines 5000\`)`);
    }
    if (user.cowoncy < bet) {
      return message.reply(`🚫 | **${message.author.username}**, you only have **${user.cowoncy.toLocaleString()}** cowoncy.`);
    }

    db.addCowoncy(user.id, -bet);

    // 9 tiles, 2 mines randomly placed
    const totalTiles = 9;
    const mineCount = 2;
    const minePositions = new Set();
    while (minePositions.size < mineCount) {
      minePositions.add(Math.floor(Math.random() * totalTiles));
    }

    const multipliers = [1.0, 1.28, 1.70, 2.35, 3.40, 5.20, 8.50, 16.0];
    let revealedCount = 0;
    const revealedSet = new Set();
    let isGameOver = false;

    function buildComponents(disabledAll = false, hitIndex = -1) {
      const rows = [];
      for (let r = 0; r < 3; r++) {
        const row = new ActionRowBuilder();
        for (let c = 0; c < 3; c++) {
          const idx = r * 3 + c;
          const btn = new ButtonBuilder().setCustomId(`mine_${idx}`);

          if (revealedSet.has(idx)) {
            btn.setEmoji('💎').setStyle(ButtonStyle.Success).setDisabled(true);
          } else if (disabledAll) {
            if (minePositions.has(idx)) {
              btn.setEmoji(idx === hitIndex ? '💥' : '💣').setStyle(ButtonStyle.Danger).setDisabled(true);
            } else {
              btn.setEmoji('💎').setStyle(ButtonStyle.Secondary).setDisabled(true);
            }
          } else {
            btn.setEmoji('❓').setStyle(ButtonStyle.Secondary);
          }
          row.addComponents(btn);
        }
        rows.push(row);
      }

      const currentMult = multipliers[revealedCount];
      const cashoutVal = Math.floor(bet * currentMult);
      const cashoutRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('mine_cashout')
          .setLabel(`💰 Cash Out (+${cashoutVal.toLocaleString()})`)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(revealedCount === 0 || disabledAll)
      );
      rows.push(cashoutRow);
      return rows;
    }

    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setAuthor({ name: `${message.author.username}'s Mines Game`, iconURL: message.author.displayAvatarURL() })
      .setDescription(
        `💣 **Bet:** **${bet.toLocaleString()}** Cowoncy | **Mines:** 2 / 9\n` +
        `💎 **Next Multiplier:** **${multipliers[revealedCount + 1]}x**\n\n` +
        `Click a tile to reveal diamonds! Cash out anytime to lock in profits.`
      );

    const gameMsg = await message.reply({ embeds: [embed], components: buildComponents() });

    const collector = gameMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
      filter: (i) => i.user.id === message.author.id
    });

    collector.on('collect', async (interaction) => {
      if (isGameOver) return;

      if (interaction.customId === 'mine_cashout') {
        isGameOver = true;
        collector.stop('cashout');
        const finalMult = multipliers[revealedCount];
        const win = Math.floor(bet * finalMult);
        db.addCowoncy(user.id, win);

        const winEmbed = new EmbedBuilder()
          .setColor('#57f287')
          .setAuthor({ name: `${message.author.username} Cashed Out!`, iconURL: message.author.displayAvatarURL() })
          .setDescription(
            `🎉 You safely cashed out at **${finalMult}x** and won **+${win.toLocaleString()}** Cowoncy!\n` +
            `💎 **Gems found:** ${revealedCount} / 7`
          );

        return interaction.update({ embeds: [winEmbed], components: buildComponents(true) });
      }

      const match = interaction.customId.match(/^mine_(\d+)$/);
      if (!match) return;
      const idx = parseInt(match[1], 10);

      if (minePositions.has(idx)) {
        // Hit a mine!
        isGameOver = true;
        collector.stop('boom');

        const loseEmbed = new EmbedBuilder()
          .setColor('#ed4245')
          .setAuthor({ name: `${message.author.username} Hit a Mine!`, iconURL: message.author.displayAvatarURL() })
          .setDescription(
            `💥 **BOOM!** You stepped on a hidden mine!\n` +
            `You lost your bet of **${bet.toLocaleString()}** Cowoncy.`
          );

        return interaction.update({ embeds: [loseEmbed], components: buildComponents(true, idx) });
      }

      // Safe diamond
      revealedSet.add(idx);
      revealedCount++;

      if (revealedCount === 7) {
        // Cleared all 7 safe tiles!
        isGameOver = true;
        collector.stop('cleared');
        const jackpotWin = Math.floor(bet * multipliers[7]);
        db.addCowoncy(user.id, jackpotWin);

        const clearEmbed = new EmbedBuilder()
          .setColor('#ffcc00')
          .setAuthor({ name: `${message.author.username} Cleared the Board! 👑`, iconURL: message.author.displayAvatarURL() })
          .setDescription(
            `👑 **PERFECT RUN!** You uncovered all 7 diamonds!\n` +
            `You won **${multipliers[7]}x** — **+${jackpotWin.toLocaleString()}** Cowoncy!`
          );

        return interaction.update({ embeds: [clearEmbed], components: buildComponents(true) });
      }

      const nextMult = multipliers[revealedCount + 1];
      const curMult = multipliers[revealedCount];
      const curWin = Math.floor(bet * curMult);

      const updateEmbed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setAuthor({ name: `${message.author.username}'s Mines Game`, iconURL: message.author.displayAvatarURL() })
        .setDescription(
          `💎 **Current:** **${curMult}x** *(+${curWin.toLocaleString()} Cowoncy)*\n` +
          `🔥 **Next Tile:** **${nextMult}x**\n\n` +
          `Keep going or hit **Cash Out** below!`
        );

      return interaction.update({ embeds: [updateEmbed], components: buildComponents() });
    });
  },

  // --- 6. SNAIL GARDEN (OwO Snail Minigame) ---
  snailgarden: async (message, args, user) => {
    const snails = [
      { name: 'Turbo', emoji: '🐌' },
      { name: 'Shelly', emoji: '🐚' },
      { name: 'Flash', emoji: '🐌' },
      { name: 'Speedy', emoji: '🐌' }
    ];

    const winner = snails[Math.floor(Math.random() * snails.length)];
    const reward = Math.floor(Math.random() * 800) + 300;
    db.addCowoncy(user.id, reward);

    const raceMsg = await message.reply(`🏁 | **Snail Garden Race started!**\n` +
      `[ 🏁 . . . . . . . . . 🐌 Turbo ]\n` +
      `[ 🏁 . . . . . . . . . 🐚 Shelly ]\n` +
      `[ 🏁 . . . . . . . . . 🐌 Flash ]\n` +
      `[ 🏁 . . . . . . . . . 🐌 Speedy ]`
    );

    setTimeout(async () => {
      await raceMsg.edit(
        `🏆 | **${winner.name}** crossed the finish line first! ${winner.emoji}\n` +
        `You visited the Snail Garden and earned **+${reward.toLocaleString()}** Cowoncy! ${getRandomFace()}`
      ).catch(() => {});
    }, 1200);
  },

  getCardEmoji,
  getCardBackEmoji,
  parseBet
};
