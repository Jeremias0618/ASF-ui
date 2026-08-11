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

/** Steam Points (loyalty) balance for the bot profile modal. */
export function fetchSteamPoints(botName) {
  return get(`${socialBase(botName)}/Points`);
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

/** Join Steam community groups (vanity URL, /gid/…, or clan SteamID64). */
export function joinGroups(botName, targets) {
  return post(`${socialBase(botName)}/Groups/Join`, { Targets: targets });
}

/** Public follower count for the bot Steam profile. */
export function fetchFollowersCount(botName) {
  return get(`${socialBase(botName)}/Followers`);
}

/** Follow Steam community profiles (workshop / profile follow). */
export function followUsers(botName, targets) {
  return post(`${socialBase(botName)}/Followers/Follow`, { Targets: targets });
}

/** Follow Steam Store curators (mentors). */
export function followCurators(botName, targets) {
  return post(`${socialBase(botName)}/Curators/Follow`, { Targets: targets });
}

/** Vote on a Steam review URL: vote = yes | no | funny */
export function voteReview(botName, { url, vote }) {
  return post(`${socialBase(botName)}/Reviews/Vote`, { Url: url, Vote: vote });
}

/** Vote and/or favorite a shared file: vote = like | dislike | null */
export function actSharedFile(botName, { url, vote, favorite }) {
  return post(`${socialBase(botName)}/SharedFiles/Act`, {
    Url: url,
    Vote: vote || null,
    Favorite: !!favorite,
  });
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

/** Booster pack eligibility ranked by playtime for GamesPlayedWhileIdle (max 32). */
export function fetchBoosterIdleSuggestions(botName) {
  return get(`${socialBase(botName)}/Games/BoosterIdleSuggestions`);
}

export function fetchGameAchievements(botName, appId) {
  return get(`${socialBase(botName)}/Games/${encodeURIComponent(appId)}/Achievements`);
}

/** Hashed Steam store artwork when classic CDN paths 404 (demos / new apps). */
export function fetchGameCover(botName, appId) {
  return get(`${socialBase(botName)}/Games/${encodeURIComponent(appId)}/Cover`);
}

export function unlockGameAchievements(botName, appId, { indices, all } = {}) {
  return post(`${socialBase(botName)}/Games/${encodeURIComponent(appId)}/Achievements/Unlock`, {
    Indices: indices || [],
    All: !!all,
  });
}

export function lockGameAchievements(botName, appId, { indices, all } = {}) {
  return post(`${socialBase(botName)}/Games/${encodeURIComponent(appId)}/Achievements/Lock`, {
    Indices: indices || [],
    All: !!all,
  });
}

export function fetchWishlist(botName) {
  return get(`${socialBase(botName)}/Wishlist`);
}

export function addWishlist(botName, appIds) {
  return post(`${socialBase(botName)}/Wishlist/Add`, { AppIds: appIds });
}

/** Add store app to wishlist and follow it (skips actions already done). */
export function followAndWishlist(botName, url) {
  return post(`${socialBase(botName)}/Wishlist/FollowAndAdd`, { Url: url });
}

export function removeWishlist(botName, appIds) {
  return post(`${socialBase(botName)}/Wishlist/Remove`, { AppIds: appIds });
}

/** Steam discovery queue status (daily explore). */
export function fetchDiscoveryQueueStatus(botName) {
  return get(`${socialBase(botName)}/DiscoveryQueue`);
}

/** Generate and clear discovery queue(s). queues = 1..3 */
export function exploreDiscoveryQueue(botName, queues = 1) {
  return post(`${socialBase(botName)}/DiscoveryQueue/Explore`, { Queues: queues });
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
