import {
  fetchFriends,
  fetchGames,
  fetchGameStats,
  fetchSocialStatus,
  fetchSteamInventory,
  fetchTradeOffers,
  fetchWishlist,
} from '../api/bot-social';
import { gameHeaderUrl } from '../utils/game-cover';
import { normalizeInventoryItems, steamEconomyImageUrl } from '../utils/inventory';
import { clearGamesSession } from './games-session';
import { invalidate, query } from './query-cache';

function unwrap(result, botName) {
  if (!result || typeof result !== 'object') return result;
  if (result[botName] != null) return result[botName];
  const matchKey = Object.keys(result).find(
    key => key.toLowerCase() === String(botName || '').toLowerCase(),
  );
  if (matchKey != null) return result[matchKey];
  const keys = Object.keys(result);
  return keys.length === 1 ? result[keys[0]] : result;
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
        isOwned: g.IsOwned ?? g.isOwned ?? true,
        isShared: Boolean(g.IsShared ?? g.isShared),
        hasAchievements: Boolean(g.HasAchievements ?? g.hasAchievements),
        hasCards: Boolean(g.HasCards ?? g.hasCards),
        appType: String(g.AppType ?? g.appType ?? 'game').toLowerCase(),
      })).sort((a, b) => a.name.localeCompare(b.name));
      return {
        games,
        total: payload?.Total ?? payload?.total ?? games.length,
        ownedTotal: payload?.OwnedTotal ?? payload?.ownedTotal ?? games.filter(g => g.isOwned).length,
        sharedTotal: payload?.SharedTotal ?? payload?.sharedTotal
          ?? games.filter(g => g.isShared && !g.isOwned).length,
      };
    },
  });
}

export function loadGameStats(botName, { force = false } = {}) {
  return query({
    resource: 'gameStats',
    botName,
    force,
    fetcher: async () => {
      const result = await fetchGameStats(botName);
      const payload = unwrap(result, botName);
      const list = payload?.Games ?? payload?.games ?? [];
      const games = list.map(raw => {
        const appId = Number(raw.AppId ?? raw.appId);
        return {
          appId,
          name: raw.Name ?? raw.name ?? '',
          playtimeMinutes: Number(raw.PlaytimeMinutes ?? raw.playtimeMinutes ?? 0),
          lastPlayedUnix: Number(raw.LastPlayedUnix ?? raw.lastPlayedUnix ?? 0),
          headerImage: (raw.HeaderImage ?? raw.headerImage)
            || gameHeaderUrl(appId),
          achievementsUnlocked: raw.AchievementsUnlocked ?? raw.achievementsUnlocked ?? null,
          achievementsTotal: raw.AchievementsTotal ?? raw.achievementsTotal ?? null,
          isOwned: raw.IsOwned ?? raw.isOwned ?? true,
          isShared: Boolean(raw.IsShared ?? raw.isShared),
          hasCards: Boolean(raw.HasCards ?? raw.hasCards),
        };
      }).filter(game => game.appId > 0);

      return {
        games,
        summary: {
          totalPlaytimeHours: Number(payload?.TotalPlaytimeHours ?? payload?.totalPlaytimeHours ?? 0),
          inCollection: Number(payload?.InCollection ?? payload?.inCollection ?? games.length),
          played: Number(payload?.Played ?? payload?.played ?? 0),
          neverPlayed: Number(payload?.NeverPlayed ?? payload?.neverPlayed ?? 0),
        },
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

export function invalidateGames(botName) {
  invalidate('games', botName);
  clearGamesSession(botName);
}

export function invalidateGameStats(botName) {
  invalidate('gameStats', botName);
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
