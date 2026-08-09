/**
 * Persist games list across GamesTab remounts (leaving Bot Social → games again).
 * Memory cache (query-cache) is faster; sessionStorage survives component destroy.
 */

const PREFIX = 'asf-bot-social-games-v1:';

function key(botName) {
  return `${PREFIX}${String(botName || '').toLowerCase()}`;
}

export function readGamesSession(botName) {
  try {
    const raw = sessionStorage.getItem(key(botName));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.games) || !parsed.games.length) return null;
    return {
      games: parsed.games,
      total: Number(parsed.total) || parsed.games.length,
      ownedTotal: Number(parsed.ownedTotal) || 0,
      sharedTotal: Number(parsed.sharedTotal) || 0,
      updatedAt: Number(parsed.updatedAt) || Date.now(),
    };
  } catch {
    return null;
  }
}

export function writeGamesSession(botName, data) {
  if (!botName || !Array.isArray(data?.games)) return;
  try {
    sessionStorage.setItem(key(botName), JSON.stringify({
      games: data.games,
      total: data.total ?? data.games.length,
      ownedTotal: data.ownedTotal ?? 0,
      sharedTotal: data.sharedTotal ?? 0,
      updatedAt: Date.now(),
    }));
  } catch {
    // Quota / private mode — ignore.
  }
}

export function clearGamesSession(botName) {
  try {
    sessionStorage.removeItem(key(botName));
  } catch {
    // ignore
  }
}
