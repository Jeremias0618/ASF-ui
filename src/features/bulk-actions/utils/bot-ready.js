import { BotStatus } from '../../../models/Bot';

/**
 * Bots that can run Steam social / inventory bulk actions.
 * Excludes powered-off (disabled) and disconnected (offline).
 * @param {import('../../../models/Bot').Bot} bot
 * @returns {boolean}
 */
export function isBotReadyForBulk(bot) {
  if (!bot) return false;
  if (bot.isConnected === true) return true;
  const status = bot.status;
  return status === BotStatus.ONLINE || status === BotStatus.FARMING;
}

/**
 * @param {import('../../../models/Bot').Bot[]} bots
 * @returns {import('../../../models/Bot').Bot[]}
 */
export function filterBotsReadyForBulk(bots) {
  return (bots || []).filter(isBotReadyForBulk);
}
