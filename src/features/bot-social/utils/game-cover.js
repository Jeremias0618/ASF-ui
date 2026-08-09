const PRIMARY_CDN = 'https://cdn.cloudflare.steamstatic.com/steam/apps';
const ALT_CDNS = [
  'https://cdn.akamai.steamstatic.com/steam/apps',
  'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps',
  'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps',
];

/** Portrait / library shelf — includes library_hero for apps without classic header art. */
const PORTRAIT_ASSETS = [
  'library_600x900.jpg',
  'library_hero.jpg',
  'header.jpg',
  'capsule_616x353.jpg',
  'capsule_231x87.jpg',
];

/** Landscape / list banners. */
const LANDSCAPE_ASSETS = [
  'header.jpg',
  'library_hero.jpg',
  'capsule_616x353.jpg',
  'capsule_231x87.jpg',
  'library_600x900.jpg',
];

const CROSS_HOST_ASSETS = [
  'header.jpg',
  'library_hero.jpg',
  'library_600x900.jpg',
  'capsule_231x87.jpg',
];

/**
 * @param {number|string} appId
 * @param {string[]} assets
 * @returns {string[]}
 */
function buildCandidates(appId, assets) {
  const id = Number(appId);
  if (!Number.isInteger(id) || id <= 0) return [];

  const urls = [];
  const seen = new Set();
  const push = url => {
    if (seen.has(url)) return;
    seen.add(url);
    urls.push(url);
  };

  // Fast path: all assets on the primary CDN (most common hit).
  assets.forEach(asset => push(`${PRIMARY_CDN}/${id}/${asset}`));

  // Slow path: a few key assets on alternate hosts / store_item_assets layout.
  ALT_CDNS.forEach(host => {
    CROSS_HOST_ASSETS.forEach(asset => {
      if (!assets.includes(asset)) return;
      push(`${host}/${id}/${asset}`);
    });
  });

  return urls;
}

/**
 * Portrait library covers (Steam library shelf).
 * @param {number|string} appId
 * @returns {string[]}
 */
export function gameCoverCandidates(appId) {
  return buildCandidates(appId, PORTRAIT_ASSETS);
}

/**
 * Landscape store headers (Steam store / hub style).
 * @param {number|string} appId
 * @returns {string[]}
 */
export function gameBannerCandidates(appId) {
  return buildCandidates(appId, LANDSCAPE_ASSETS);
}

/**
 * Default header URL used when no API image is provided.
 * @param {number|string} appId
 * @returns {string}
 */
export function gameHeaderUrl(appId) {
  return gameBannerCandidates(appId)[0] || '';
}

/**
 * @param {number|string} appId
 * @returns {string}
 */
export function steamStoreUrl(appId) {
  return `https://store.steampowered.com/app/${appId}`;
}

/**
 * Initials for cover placeholders when Steam assets are missing.
 * @param {{ name?: string, appId?: number|string }} game
 * @returns {string}
 */
export function gamePlaceholderLabel(game) {
  const name = String(game?.name || '').trim();
  if (name.length >= 2) return name.slice(0, 2).toUpperCase();
  return String(game?.appId || '?').slice(-2);
}
