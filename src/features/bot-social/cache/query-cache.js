import { CACHE_TTL_MS, MIN_REFRESH_MS, isCacheDebugEnabled } from './cache-config';

/**
 * Central query/cache manager for Bot Social Hub.
 * - Per-bot / per-resource isolation
 * - TTL reuse when switching tabs
 * - In-flight deduplication
 * - Forced refresh with client rate-limit
 * - Keeps last good data on refresh errors
 */

const entries = new Map();
const lastForcedAt = new Map();

function log(event, detail) {
  if (!isCacheDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.debug(`[bot-social-cache] ${event}`, detail);
}

export function cacheKey(resource, botName) {
  return `${resource}:${String(botName || '').toLowerCase()}`;
}

function getEntry(key) {
  let entry = entries.get(key);
  if (!entry) {
    entry = {
      data: undefined,
      error: null,
      updatedAt: 0,
      status: 'idle',
      promise: null,
    };
    entries.set(key, entry);
  }
  return entry;
}

function ttlFor(resource) {
  return CACHE_TTL_MS[resource] ?? 5 * 60 * 1000;
}

function minRefreshFor(resource) {
  return MIN_REFRESH_MS[resource] ?? 3000;
}

export function peek(resource, botName) {
  const entry = entries.get(cacheKey(resource, botName));
  if (!entry || entry.data === undefined) return null;
  return {
    data: entry.data,
    error: entry.error,
    updatedAt: entry.updatedAt,
    status: entry.status,
    fresh: Date.now() - entry.updatedAt < ttlFor(resource),
  };
}

export function isFresh(resource, botName) {
  const snapshot = peek(resource, botName);
  return Boolean(snapshot?.fresh);
}

export function invalidate(resource, botName) {
  const key = cacheKey(resource, botName);
  entries.delete(key);
  lastForcedAt.delete(key);
  log('invalidate', { key });
}

export function invalidateBot(botName) {
  const bot = String(botName || '').toLowerCase();
  [...entries.keys()].forEach(key => {
    if (key.endsWith(`:${bot}`)) {
      entries.delete(key);
      lastForcedAt.delete(key);
    }
  });
  log('invalidateBot', { botName });
}

export function invalidateAll() {
  entries.clear();
  lastForcedAt.clear();
  log('invalidateAll', {});
}

/**
 * @param {object} options
 * @param {string} options.resource
 * @param {string} options.botName
 * @param {() => Promise<any>} options.fetcher
 * @param {boolean} [options.force]
 * @returns {Promise<{ data: any, fromCache: boolean, status: string, deduped?: boolean, rateLimited?: boolean, stale?: boolean, error?: Error }>}
 */
export async function query({
  resource, botName, fetcher, force = false,
}) {
  if (!resource || !botName || typeof fetcher !== 'function') {
    throw new Error('query() requires resource, botName and fetcher');
  }

  const key = cacheKey(resource, botName);
  const entry = getEntry(key);
  const now = Date.now();
  const hasData = entry.data !== undefined;

  if (!force && hasData && (now - entry.updatedAt) < ttlFor(resource)) {
    log('cache hit', { key, ageMs: now - entry.updatedAt });
    return {
      data: entry.data,
      fromCache: true,
      status: 'success',
    };
  }

  if (entry.promise) {
    log('request deduplicated', { key, force });
    try {
      const data = await entry.promise;
      return {
        data,
        fromCache: false,
        status: 'success',
        deduped: true,
      };
    } catch (error) {
      if (entry.data !== undefined) {
        return {
          data: entry.data,
          fromCache: true,
          status: 'success',
          deduped: true,
          stale: true,
          error,
        };
      }
      throw error;
    }
  }

  if (force) {
    const last = lastForcedAt.get(key) || 0;
    const waitMs = minRefreshFor(resource) - (now - last);
    if (waitMs > 0) {
      log('rate limited', { key, waitMs });
      if (hasData) {
        return {
          data: entry.data,
          fromCache: true,
          status: 'success',
          rateLimited: true,
        };
      }
      const error = new Error('RATE_LIMITED');
      error.code = 'RATE_LIMITED';
      throw error;
    }
  }

  entry.status = hasData ? 'refreshing' : 'loading';
  entry.error = null;

  entry.promise = (async () => {
    log('request started', { key, force, status: entry.status });
    if (force) lastForcedAt.set(key, Date.now());
    try {
      const data = await fetcher();
      entry.data = data;
      entry.error = null;
      entry.updatedAt = Date.now();
      entry.status = 'success';
      log('request completed', { key });
      return data;
    } catch (error) {
      entry.error = error;
      entry.status = hasData ? 'success' : 'error';
      log('error', { key, message: error?.message || String(error) });
      throw error;
    } finally {
      entry.promise = null;
      entries.set(key, entry);
    }
  })();

  entries.set(key, entry);

  try {
    const data = await entry.promise;
    return {
      data,
      fromCache: false,
      status: 'success',
    };
  } catch (error) {
    if (entry.data !== undefined) {
      return {
        data: entry.data,
        fromCache: true,
        status: 'success',
        stale: true,
        error,
      };
    }
    throw error;
  }
}

export function getCacheStats() {
  return {
    entries: entries.size,
    inFlight: [...entries.values()].filter(e => e.promise).length,
  };
}
