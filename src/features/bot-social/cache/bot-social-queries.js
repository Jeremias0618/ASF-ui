import {
  fetchFriends,
  fetchGames,
  fetchSocialStatus,
  fetchSteamInventory,
  fetchWishlist,
} from '../api/bot-social';
import { normalizeInventoryItems } from '../utils/inventory';
import { invalidate, query } from './query-cache';

function unwrap(result, botName) {
  return result?.[botName] ?? result;
}

export function loadInventory(botName, { force = false } = {}) {
  return query({
    resource: 'inventory',
    botName,
    force,
    fetcher: async () => {
      const result = await fetchSteamInventory(botName);
      return normalizeInventoryItems(result, botName);
    },
  });
}

export function loadFriends(botName, { force = false } = {}) {
  return query({
    resource: 'friends',
    botName,
    force,
    fetcher: async () => {
      const result = await fetchFriends(botName);
      const payload = unwrap(result, botName);
      const list = payload?.Friends ?? payload?.friends ?? [];
      const friends = list.map(raw => {
        const steamId = String(raw.SteamId ?? raw.steamId ?? '');
        const avatarHash = raw.AvatarHash ?? raw.avatarHash;
        return {
          steamId,
          name: raw.Name ?? raw.name ?? steamId,
          relationship: String(raw.Relationship ?? raw.relationship ?? ''),
          personaState: String(raw.PersonaState ?? raw.personaState ?? ''),
          avatarUrl: avatarHash
            ? `https://avatars.steamstatic.com/${avatarHash}_medium.jpg`
            : '',
        };
      });
      return {
        friends,
        total: payload?.Total ?? payload?.total ?? friends.length,
      };
    },
  });
}

export function loadGames(botName, { force = false } = {}) {
  return query({
    resource: 'games',
    botName,
    force,
    fetcher: async () => {
      const result = await fetchGames(botName);
      const payload = unwrap(result, botName);
      const list = payload?.Games ?? payload?.games ?? [];
      const games = list.map(g => ({
        appId: String(g.AppId ?? g.appId ?? ''),
        name: g.Name ?? g.name ?? `App ${g.AppId ?? g.appId}`,
      })).sort((a, b) => a.name.localeCompare(b.name));
      return {
        games,
        total: payload?.Total ?? payload?.total ?? games.length,
      };
    },
  });
}

export function loadWishlist(botName, { force = false } = {}) {
  return query({
    resource: 'wishlist',
    botName,
    force,
    fetcher: async () => {
      const result = await fetchWishlist(botName);
      const payload = unwrap(result, botName);
      const list = payload?.Items ?? payload?.items ?? [];
      const items = list.map(item => ({
        appId: String(item.AppId ?? item.appId ?? ''),
        name: item.Name ?? item.name ?? `App ${item.AppId ?? item.appId}`,
      }));
      return {
        items,
        total: payload?.Total ?? payload?.total ?? items.length,
      };
    },
  });
}

export function loadStatus(botName, { force = false } = {}) {
  return query({
    resource: 'status',
    botName,
    force,
    fetcher: () => fetchSocialStatus(botName),
  });
}

export function invalidateFriends(botName) {
  invalidate('friends', botName);
}

export function invalidateWishlist(botName) {
  invalidate('wishlist', botName);
}

export function invalidateInventory(botName) {
  invalidate('inventory', botName);
}
