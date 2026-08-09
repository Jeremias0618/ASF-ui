import {
  fetchFriends,
  fetchGames,
  fetchSocialStatus,
  fetchSteamInventory,
  fetchTradeOffers,
  fetchWishlist,
} from '../api/bot-social';
import { normalizeInventoryItems, steamEconomyImageUrl } from '../utils/inventory';
import { invalidate, query } from './query-cache';

function unwrap(result, botName) {
  return result?.[botName] ?? result;
}

function mapTradeItem(raw) {
  const iconPath = raw.IconUrl ?? raw.iconUrl ?? '';
  const iconPathLarge = raw.IconUrlLarge ?? raw.iconUrlLarge ?? iconPath;
  return {
    assetId: String(raw.AssetId ?? raw.assetId ?? ''),
    appId: Number(raw.AppId ?? raw.appId ?? 0),
    contextId: String(raw.ContextId ?? raw.contextId ?? ''),
    amount: Number(raw.Amount ?? raw.amount ?? 1),
    classId: String(raw.ClassId ?? raw.classId ?? ''),
    name: raw.Name ?? raw.name ?? '',
    type: raw.Type ?? raw.type ?? '',
    game: raw.Game ?? raw.game ?? '',
    iconUrl: steamEconomyImageUrl(iconPath, '96fx96f'),
    iconUrlLarge: steamEconomyImageUrl(iconPathLarge, '330x192'),
    backgroundColor: String(raw.BackgroundColor ?? raw.backgroundColor ?? '').replace(/^#/, ''),
  };
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
      const mapList = list => (list || []).map(raw => {
        // Prefer string SteamId — JSON numbers truncate SteamID64 past Number.MAX_SAFE_INTEGER.
        const steamIdRaw = raw.SteamId ?? raw.steamId;
        const steamId = typeof steamIdRaw === 'string'
          ? steamIdRaw.trim()
          : (steamIdRaw != null ? String(steamIdRaw) : '');
        const avatarHash = raw.AvatarHash ?? raw.avatarHash;
        const name = String(raw.Name ?? raw.name ?? '').trim();
        return {
          steamId,
          name: name || steamId,
          relationship: String(raw.Relationship ?? raw.relationship ?? ''),
          personaState: String(raw.PersonaState ?? raw.personaState ?? ''),
          avatarUrl: avatarHash
            ? `https://avatars.steamstatic.com/${avatarHash}_medium.jpg`
            : '',
        };
      }).filter(f => /^[0-9]{17}$/.test(f.steamId));

      const friends = mapList(payload?.Friends ?? payload?.friends ?? []);
      const sentRequests = mapList(payload?.SentRequests ?? payload?.sentRequests ?? []);
      const receivedRequests = mapList(payload?.ReceivedRequests ?? payload?.receivedRequests ?? []);
      return {
        friends,
        sentRequests,
        receivedRequests,
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

export function loadTradeOffers(botName, { force = false } = {}) {
  return query({
    resource: 'trades',
    botName,
    force,
    fetcher: async () => {
      const result = await fetchTradeOffers(botName);
      const payload = unwrap(result, botName);
      const list = payload?.Offers ?? payload?.offers ?? [];
      const offers = list.map(raw => {
        const partnerSteamId = String(raw.PartnerSteamId ?? raw.partnerSteamId ?? '');
        const avatarHash = raw.PartnerAvatarHash ?? raw.partnerAvatarHash;
        return {
          tradeOfferId: String(raw.TradeOfferId ?? raw.tradeOfferId ?? ''),
          state: String(raw.State ?? raw.state ?? ''),
          direction: String(raw.Direction ?? raw.direction ?? ''),
          waitingFor: String(raw.WaitingFor ?? raw.waitingFor ?? ''),
          partnerSteamId,
          partnerName: raw.PartnerName ?? raw.partnerName ?? partnerSteamId,
          partnerAvatarUrl: avatarHash
            ? `https://avatars.steamstatic.com/${avatarHash}_medium.jpg`
            : '',
          itemsToGive: (raw.ItemsToGive ?? raw.itemsToGive ?? []).map(mapTradeItem),
          itemsToReceive: (raw.ItemsToReceive ?? raw.itemsToReceive ?? []).map(mapTradeItem),
        };
      });
      return {
        offers,
        total: payload?.Total ?? payload?.total ?? offers.length,
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

export function invalidateTradeOffers(botName) {
  invalidate('trades', botName);
}
