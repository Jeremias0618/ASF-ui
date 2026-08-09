import { get, post } from '../../../plugins/http';
import { STEAM_APP_ID, STEAM_COMMUNITY_CONTEXT_ID } from '../constants/steam-inventory';

const inventoryBase = botName => `bot/${encodeURIComponent(botName)}/Inventory`;
const socialBase = botName => `BotSocial/${encodeURIComponent(botName)}`;

/** @deprecated Prefer fetchSteamInventory — summary scrapes /my/inventory and hits Steam rate limits. */
export function fetchInventorySummary(botName) {
  return get(inventoryBase(botName));
}

export function fetchInventoryContext(botName, appId, contextId, language) {
  const params = language ? { language } : {};
  return get(`${inventoryBase(botName)}/${appId}/${contextId}`, params);
}

/** Steam-only inventory (AppID 753 / context 6) via ASF SteamKit path — one targeted request. */
export function fetchSteamInventory(botName, language) {
  return fetchInventoryContext(botName, STEAM_APP_ID, STEAM_COMMUNITY_CONTEXT_ID, language);
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

export function searchGames(botName, query) {
  return get(`${socialBase(botName)}/Games/Search`, { q: query });
}

export function addGames(botName, appIds) {
  return post(`${socialBase(botName)}/Games/Add`, { AppIds: appIds });
}

export function fetchGameStats(botName) {
  return get(`${socialBase(botName)}/Games/Stats`);
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

/**
 * Transfer selected inventory assets to another ASF bot (trade offer via plugin).
 * @param {string} botName source bot
 * @param {{ assetIds: string[], targetBotName: string, appId?: number, contextId?: number, message?: string }} payload
 */
export function transferInventory(botName, {
  assetIds, targetBotName, appId, contextId, message,
}) {
  return post(`${socialBase(botName)}/Inventory/Transfer`, {
    AssetIds: assetIds,
    TargetBotName: targetBotName,
    ...(appId != null ? { AppId: appId } : {}),
    ...(contextId != null ? { ContextId: contextId } : {}),
    ...(message ? { Message: message } : {}),
  });
}

export function fetchTradeOffers(botName) {
  return get(`${socialBase(botName)}/TradeOffers`);
}

export function cancelTradeOffer(botName, { tradeOfferId, direction }) {
  return post(`${socialBase(botName)}/TradeOffers/Cancel`, {
    TradeOfferId: tradeOfferId,
    Direction: direction,
  });
}

export function isPluginMissingError(err) {
  const status = err?.result?.status ?? err?.response?.status;
  if (status === 404) return true;
  const message = String(err?.message || '').toLowerCase();
  return message.includes('404') || message.includes('not found') || message.includes('botsocial');
}
