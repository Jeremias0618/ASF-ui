const STEAM_CDN = 'https://cdn.cloudflare.steamstatic.com/steam/apps';

/**
 * Portrait library covers (Steam library shelf).
 * @param {number|string} appId
 * @returns {string[]}
 */
export function gameCoverCandidates(appId) {
  const id = Number(appId);
  if (!Number.isInteger(id) || id <= 0) return [];

  return [
    `${STEAM_CDN}/${id}/library_600x900.jpg`,
    `${STEAM_CDN}/${id}/header.jpg`,
    `${STEAM_CDN}/${id}/capsule_231x87.jpg`,
  ];
}

/**
 * Landscape store headers (Steam store / hub style).
 * @param {number|string} appId
 * @returns {string[]}
 */
export function gameBannerCandidates(appId) {
  const id = Number(appId);
  if (!Number.isInteger(id) || id <= 0) return [];

  return [
    `${STEAM_CDN}/${id}/header.jpg`,
    `${STEAM_CDN}/${id}/capsule_616x353.jpg`,
    `${STEAM_CDN}/${id}/library_600x900.jpg`,
  ];
}

/**
 * @param {number|string} appId
 * @returns {string}
 */
export function steamStoreUrl(appId) {
  return `https://store.steampowered.com/app/${appId}`;
}
