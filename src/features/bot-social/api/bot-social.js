import { get, post } from '../../../plugins/http';

const inventoryBase = botName => `bot/${encodeURIComponent(botName)}/Inventory`;
const socialBase = botName => `BotSocial/${encodeURIComponent(botName)}`;

export function fetchInventorySummary(botName) {
  return get(inventoryBase(botName));
}

export function fetchInventoryContext(botName, appId, contextId, language) {
  const params = language ? { language } : {};
  return get(`${inventoryBase(botName)}/${appId}/${contextId}`, params);
}

export function fetchSocialStatus(botName) {
  return get(`${socialBase(botName)}/Status`);
}

export function fetchFriends(botName) {
  return get(`${socialBase(botName)}/Friends`);
}

export function addFriends(botName, targets) {
  return post(`${socialBase(botName)}/Friends/Add`, { Targets: targets });
}

export function removeFriends(botName, steamIds) {
  return post(`${socialBase(botName)}/Friends/Remove`, { SteamIds: steamIds });
}

export function fetchGames(botName) {
  return get(`${socialBase(botName)}/Games`);
}

export function fetchWishlist(botName) {
  return get(`${socialBase(botName)}/Wishlist`);
}

export function addWishlist(botName, appIds) {
  return post(`${socialBase(botName)}/Wishlist/Add`, { AppIds: appIds });
}

export function removeWishlist(botName, appIds) {
  return post(`${socialBase(botName)}/Wishlist/Remove`, { AppIds: appIds });
}

export function isPluginMissingError(err) {
  const status = err?.result?.status ?? err?.response?.status;
  if (status === 404) return true;
  const message = String(err?.message || '').toLowerCase();
  return message.includes('404') || message.includes('not found') || message.includes('botsocial');
}
