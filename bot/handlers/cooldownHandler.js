// Cooldown manager for commands
const cooldowns = new Map();

/**
 * Checks if a user is on cooldown for a given command.
 * @param {string} userId 
 * @param {string} commandName 
 * @param {number} cooldownSeconds 
 * @returns {number|null} Remaining seconds if on cooldown, null if allowed.
 */
function checkCooldown(userId, commandName, cooldownSeconds) {
  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Map());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(commandName);
  const cooldownAmount = cooldownSeconds * 1000;

  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
      return Math.max(0.1, parseFloat(timeLeft));
    }
  }

  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownAmount);
  return null;
}

module.exports = {
  checkCooldown
};
