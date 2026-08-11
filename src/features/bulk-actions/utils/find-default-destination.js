/** Resolve default inventory destination from Master / Owner permissions. */

/** BotConfig.EAccess.Master */
export const ACCESS_MASTER = 3;

/**
 * True when a SteamUserPermissions entry is Master.
 * @param {unknown} access
 */
export function isMasterAccess(access) {
  if (access === ACCESS_MASTER || access === 'Master') return true;
  if (typeof access === 'string' && /^\d+$/.test(access)) {
    return Number(access) === ACCESS_MASTER;
  }
  return false;
}

/**
 * SteamIDs that appear with Master on any bot config, ranked by frequency.
 * @param {Array<{ config?: { SteamUserPermissions?: Record<string, unknown> } }>} bots
 * @returns {Map<string, number>}
 */
export function collectMasterSteamIdCounts(bots) {
  const counts = new Map();
  (bots || []).forEach(bot => {
    const perms = (bot && bot.config && bot.config.SteamUserPermissions) || {};
    Object.entries(perms).forEach(([steamId, access]) => {
      if (!isMasterAccess(access)) return;
      const id = String(steamId || '').trim();
      if (!id || id === '0') return;
      counts.set(id, (counts.get(id) || 0) + 1);
    });
  });
  return counts;
}

/**
 * Pick the ASF bot that should be the default inventory destination.
 * Prefer a bot whose SteamID is Master on bot configs; else SteamOwnerID match.
 *
 * @param {Array<{ name: string, steamid?: string, config?: object }>} bots
 * @param {string|number|null|undefined} steamOwnerID
 * @returns {object|null}
 */
export function findDefaultDestinationBot(bots, steamOwnerID) {
  const list = Array.isArray(bots) ? bots.slice() : [];
  if (!list.length) return null;

  const masterCounts = collectMasterSteamIdCounts(list);
  const masterBots = list.filter(bot => masterCounts.has(String(bot.steamid || '')));

  if (masterBots.length) {
    masterBots.sort((a, b) => {
      const diff = (masterCounts.get(String(b.steamid)) || 0)
        - (masterCounts.get(String(a.steamid)) || 0);
      if (diff) return diff;
      return String(a.name).localeCompare(String(b.name));
    });
    return masterBots[0];
  }

  const owner = String(steamOwnerID || '').trim();
  if (owner && owner !== '0') {
    const byOwner = list.find(bot => String(bot.steamid || '') === owner);
    if (byOwner) return byOwner;
  }

  return null;
}
