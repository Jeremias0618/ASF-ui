import { isFresh, peek } from './query-cache';

/**
 * Shared hydrate policy for bot-social tabs.
 *
 * Rules:
 * - If usable cached data exists → use it, do NOT fetch (even if TTL stale).
 * - Fetch only when there is no usable data, or when forceRefresh is true (Actualizar).
 * - Stale-while-revalidate background refresh is intentionally disabled so filters /
 *   remounts / navigation never surprise-hit IPC/Steam.
 */
export function resolveLocalData({
  resource,
  botName,
  isUsable,
}) {
  const cached = peek(resource, botName);
  if (!cached?.data || (typeof isUsable === 'function' && !isUsable(cached.data))) {
    return {
      data: null,
      hasData: false,
      fresh: false,
      shouldFetch: true,
    };
  }
  return {
    data: cached.data,
    hasData: true,
    fresh: Boolean(cached.fresh),
    shouldFetch: false,
  };
}

export function shouldFetchResource(resource, botName, { force = false, hasLocalData = false } = {}) {
  if (force) return true;
  if (hasLocalData) return false;
  if (isFresh(resource, botName)) return false;
  const cached = peek(resource, botName);
  if (cached?.data !== undefined && cached?.data !== null) return false;
  return true;
}
