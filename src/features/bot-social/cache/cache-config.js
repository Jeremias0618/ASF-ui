/**
 * Configurable TTLs and anti-spam intervals for Bot Social Hub.
 * Adjust here without touching query logic.
 */
export const CACHE_TTL_MS = Object.freeze({
  inventory: 10 * 60 * 1000, // Steam inventory changes slowly
  friends: 2 * 60 * 1000, // friend list can change more often
  games: 10 * 60 * 1000,
  gameStats: 10 * 60 * 1000, // playtime/achievements — heavy Steam round-trips
  wishlist: 5 * 60 * 1000,
  trades: 60 * 1000, // pending offers change often
  status: 30 * 60 * 1000,
  points: 3 * 60 * 1000, // Steam Points — slow-changing; avoid remount spam
});

/** Minimum gap between forced refreshes of the same resource+bot (client-side). */
export const MIN_REFRESH_MS = Object.freeze({
  inventory: 8 * 1000,
  friends: 3 * 1000,
  games: 5 * 1000,
  gameStats: 8 * 1000,
  wishlist: 6 * 1000,
  trades: 5 * 1000,
  status: 2 * 1000,
  points: 2 * 1000, // align with plugin PointsReadLimiter (2s)
});

/** Set true in localStorage `asf-bot-social-cache-debug=1` or pass debug:true. */
export function isCacheDebugEnabled() {
  try {
    return window.localStorage?.getItem('asf-bot-social-cache-debug') === '1';
  } catch {
    return false;
  }
}
