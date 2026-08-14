const PRIMARY_CDN = 'https://cdn.cloudflare.steamstatic.com/steam/apps';

/** Portrait / library shelf — primary CDN only (fast fail → Cover API). */
const PORTRAIT_ASSETS = [
  'library_600x900.jpg',
  'library_hero.jpg',
  'header.jpg',
  'capsule_616x353.jpg',
];

/** Landscape store capsules. */
const LANDSCAPE_ASSETS = [
  'header.jpg',
  'capsule_616x353.jpg',
  'capsule_231x87.jpg',
  'library_hero.jpg',
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
  assets.forEach(asset => {
    const url = `${PRIMARY_CDN}/${id}/${asset}`;
    if (seen.has(url)) return;
    seen.add(url);
    urls.push(url);
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

/** @type {Map<number, { header?: string, capsule?: string }>} */
const resolvedCoverCache = new Map();

/**
 * @param {number|string} appId
 * @param {'library'|'banner'} [variant]
 * @returns {string}
 */
export function peekResolvedCover(appId, variant = 'banner') {
  const id = Number(appId);
  if (!Number.isInteger(id) || id <= 0) return '';
  const entry = resolvedCoverCache.get(id);
  if (!entry) return '';
  if (variant === 'library') return entry.capsule || entry.header || '';
  return entry.header || entry.capsule || '';
}

/**
 * @param {number|string} appId
 * @param {{ header?: string, capsule?: string }} urls
 */
export function rememberResolvedCover(appId, urls) {
  const id = Number(appId);
  if (!Number.isInteger(id) || id <= 0) return;
  const header = urls?.header || '';
  const capsule = urls?.capsule || '';
  if (!header && !capsule) return;
  resolvedCoverCache.set(id, { header, capsule });
}
