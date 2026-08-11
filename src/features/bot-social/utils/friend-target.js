/**
 * Normalize a pasted Steam friend target (SteamID64, account id / friend code,
 * vanity, or profile URL) before sending it to the plugin.
 */
export function normalizeFriendTarget(raw) {
  let value = String(raw || '').trim();
  if (!value) return '';

  // Angle-bracket paste / trailing punctuation from chat
  value = value.replace(/^<|>$/g, '').replace(/[.,;]+$/g, '').trim();

  try {
    if (/^https?:\/\//i.test(value) || value.toLowerCase().includes('steamcommunity.com/')) {
      const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, '')}`;
      const url = new URL(withProtocol);
      const path = url.pathname.replace(/\/+$/, '');

      const profiles = path.match(/\/profiles\/(\d{17})$/i);
      if (profiles) return profiles[1];

      const vanity = path.match(/\/id\/([^/]+)$/i);
      if (vanity) return decodeURIComponent(vanity[1]);
    }
  } catch {
    // Fall through to plain-text handling
  }

  const profilesLoose = value.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
  if (profilesLoose) return profilesLoose[1];

  const vanityLoose = value.match(/steamcommunity\.com\/id\/([^/?#]+)/i);
  if (vanityLoose) return decodeURIComponent(vanityLoose[1]);

  return value;
}

/**
 * True when the paste looks like a usable Steam profile / friend target.
 * URL-shaped input must be a real steamcommunity profile link.
 * @param {string} raw
 * @returns {boolean}
 */
export function isLikelyFriendTarget(raw) {
  const value = String(raw || '').trim();
  if (!value) return false;

  const looksLikeUrl = /^https?:\/\//i.test(value) || /steamcommunity\.com/i.test(value);
  if (looksLikeUrl) {
    return /steamcommunity\.com\/(?:profiles\/\d{17}|id\/[^/?#\s]+)/i.test(value);
  }

  if (/^\d{17}$/.test(value)) return true;
  // Steam vanity / friend code style identifiers (no spaces / URLs)
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value);
}
