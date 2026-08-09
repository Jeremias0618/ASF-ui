import { get, post } from '../../../plugins/http';

/** Steam Network / ASF limit (ArchiHandler.MaxGamesPlayedConcurrently). */
export const MAX_IDLE_GAMES = 32;

/**
 * @param {unknown} value
 * @returns {number[]}
 */
export function normalizeIdleAppIds(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.reduce((ids, raw) => {
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) return ids;
    seen.add(id);
    ids.push(id);
    return ids;
  }, []);
}

/**
 * @param {string} botName
 * @returns {Promise<{ config: object, idleAppIds: number[] }>}
 */
function sanitizeBotConfig(config) {
  const next = { ...(config || {}) };
  Object.keys(next).forEach(key => {
    if (key.startsWith('s_')) delete next[key.substr(2)];
  });
  return next;
}

export async function fetchIdleGamesConfig(botName) {
  const result = await get(`bot/${encodeURIComponent(botName)}`);
  const config = sanitizeBotConfig(result?.[botName]?.BotConfig || {});
  return {
    config,
    idleAppIds: normalizeIdleAppIds(config.GamesPlayedWhileIdle),
  };
}

/**
 * Merge and persist GamesPlayedWhileIdle on the bot config.
 * @param {string} botName
 * @param {number[]} nextIdleAppIds
 * @returns {Promise<number[]>}
 */
export async function saveIdleGames(botName, nextIdleAppIds) {
  const idleAppIds = normalizeIdleAppIds(nextIdleAppIds);

  if (idleAppIds.length > MAX_IDLE_GAMES) {
    const err = new Error(`GamesPlayedWhileIdle exceeds ${MAX_IDLE_GAMES}`);
    err.code = 'IDLE_LIMIT';
    throw err;
  }

  const { config } = await fetchIdleGamesConfig(botName);
  const botConfig = {
    ...config,
    GamesPlayedWhileIdle: idleAppIds,
  };

  await post(`bot/${encodeURIComponent(botName)}`, { botConfig });
  return idleAppIds;
}
