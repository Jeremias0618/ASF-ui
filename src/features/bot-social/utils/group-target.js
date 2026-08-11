/**
 * Normalize a Steam community group target (URL, vanity, or clan SteamID64).
 * @param {string} raw
 * @returns {string}
 */
export function normalizeGroupTarget(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';

  const match = value.match(/steamcommunity\.com\/(?:groups|gid)\/([^/?#\s]+)/i);
  if (match?.[1]) return match[1].trim();

  return value.replace(/\/+$/, '');
}

/**
 * @param {string} raw
 * @returns {boolean}
 */
export function isLikelyGroupTarget(raw) {
  const value = normalizeGroupTarget(raw);
  if (!value) return false;

  const looksLikeUrl = /^https?:\/\//i.test(String(raw || ''))
    || /steamcommunity\.com/i.test(String(raw || ''));
  if (looksLikeUrl) {
    return /steamcommunity\.com\/(?:groups|gid)\/[^/?#\s]+/i.test(String(raw || ''));
  }

  if (/^\d{17}$/.test(value)) return true;
  // Vanity / custom group URL slug
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value);
}
