/** Persist idle-play session start per bot (resets when not online/idle). */

const STORAGE_KEY = 'asf-ui:idle-play-sessions';

function readMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota / private mode failures.
  }
}

/**
 * Keep or clear the idle session for a bot.
 * @param {string} botName
 * @param {boolean} isPlayingIdle
 * @returns {number|null} session start epoch ms, or null when not playing
 */
export function syncIdlePlaySession(botName, isPlayingIdle) {
  const key = String(botName || '');
  if (!key) return null;

  const map = readMap();

  if (!isPlayingIdle) {
    if (map[key]) {
      delete map[key];
      writeMap(map);
    }
    return null;
  }

  if (!map[key] || !Number.isFinite(map[key].startedAt)) {
    map[key] = { startedAt: Date.now() };
    writeMap(map);
  }

  return map[key].startedAt;
}

/**
 * @param {number} ms
 * @returns {string} e.g. "123d, 12h, 34m" | "12h, 34m" | "34m"
 */
export function formatCompactDuration(ms) {
  const totalMinutes = Math.max(0, Math.floor(Number(ms) / 60000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (days > 0 || hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(', ');
}
