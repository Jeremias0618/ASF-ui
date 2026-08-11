import { post } from '../../../plugins/http';
import { parseGameAppId } from '../../bot-social/utils/game-target';
import { transferInventory } from '../../bot-social/api/bot-social';

/**
 * @param {string|string[]} botNames
 * @returns {string}
 */
export function toBotNamesParam(botNames) {
  const list = Array.isArray(botNames) ? botNames : [botNames];
  return list
    .map(name => String(name || '').trim())
    .filter(Boolean)
    .join(',');
}

function socialBase(botNames) {
  return `BotSocial/${encodeURIComponent(toBotNamesParam(botNames))}`;
}

/**
 * Flatten MutationsResponse dictionary into per-bot rows.
 * @param {Record<string, any>} payload
 * @returns {{ botName: string, ok: boolean, message: string, target?: string }[]}
 */
export function flattenMutationResults(payload) {
  if (!payload || typeof payload !== 'object') return [];
  const rows = [];
  Object.keys(payload).forEach(botName => {
    const entry = payload[botName];
    const results = entry?.Results ?? entry?.results;
    if (Array.isArray(results) && results.length) {
      results.forEach(item => {
        rows.push({
          botName,
          ok: (item?.Success ?? item?.success) === true,
          message: String(item?.Message ?? item?.message ?? ''),
          target: String(item?.Target ?? item?.target ?? ''),
        });
      });
      return;
    }
    const ok = (entry?.Success ?? entry?.success);
    if (typeof ok === 'boolean') {
      rows.push({
        botName,
        ok,
        message: String(entry?.Message ?? entry?.message ?? ''),
      });
      return;
    }
    rows.push({
      botName,
      ok: true,
      message: '',
    });
  });
  return rows;
}

export function friendsAdd(botNames, targets) {
  return post(`${socialBase(botNames)}/Friends/Add`, { Targets: targets });
}

export function groupsJoin(botNames, targets) {
  return post(`${socialBase(botNames)}/Groups/Join`, { Targets: targets });
}

export function followersFollow(botNames, targets) {
  return post(`${socialBase(botNames)}/Followers/Follow`, { Targets: targets });
}

export function curatorsFollow(botNames, targets) {
  return post(`${socialBase(botNames)}/Curators/Follow`, { Targets: targets });
}

export function reviewsVote(botNames, { url, vote }) {
  return post(`${socialBase(botNames)}/Reviews/Vote`, { Url: url, Vote: vote });
}

export function sharedFilesAct(botNames, { url, vote, favorite }) {
  return post(`${socialBase(botNames)}/SharedFiles/Act`, {
    Url: url,
    Vote: vote || null,
    Favorite: !!favorite,
  });
}

export function wishlistFollowAdd(botNames, url) {
  return post(`${socialBase(botNames)}/Wishlist/FollowAndAdd`, { Url: url });
}

export function wishlistAdd(botNames, appIds) {
  return post(`${socialBase(botNames)}/Wishlist/Add`, { AppIds: appIds });
}

export function gamesAdd(botNames, appIds) {
  return post(`${socialBase(botNames)}/Games/Add`, { AppIds: appIds });
}

/**
 * Resolve AppIDs from a URL / numeric paste for Games.Add / Wishlist.Add.
 * @param {string} raw
 * @returns {number[]}
 */
export function resolveAppIdsFromInput(raw) {
  const appId = parseGameAppId(raw);
  return appId ? [appId] : [];
}

/**
 * Run inventory transfers grouped by source bot (API allows one source per call).
 * @param {{ sourceBotName: string, assetIds: string[] }[]} batches
 * @param {string} targetBotName
 * @param {{ onBatch?: (info: { index: number, total: number, sourceBotName: string }) => void, shouldCancel?: () => boolean }} [hooks]
 */
export async function transferInventoryBatches(batches, targetBotName, hooks = {}) {
  const results = [];
  const total = batches.length;
  for (let index = 0; index < batches.length; index += 1) {
    if (hooks.shouldCancel?.()) break;
    const batch = batches[index];
    hooks.onBatch?.({ index: index + 1, total, sourceBotName: batch.sourceBotName });
    try {
      const payload = await transferInventory(batch.sourceBotName, {
        assetIds: batch.assetIds,
        targetBotName,
      });
      const entry = payload?.[batch.sourceBotName] ?? payload;
      const ok = (entry?.Success ?? entry?.success) !== false;
      results.push({
        botName: batch.sourceBotName,
        ok,
        message: String(entry?.Message ?? entry?.message ?? ''),
        itemCount: batch.assetIds.length,
      });
    } catch (err) {
      results.push({
        botName: batch.sourceBotName,
        ok: false,
        message: err?.message || String(err),
        itemCount: batch.assetIds.length,
      });
    }
  }
  return results;
}

/**
 * @param {string} api
 * @param {string[]} botNames
 * @param {{ target: string, vote?: string, favorite?: boolean }} opts
 */
export async function runUrlBotsApi(api, botNames, opts) {
  const target = String(opts.target || '').trim();
  switch (api) {
    case 'friendsAdd':
      return friendsAdd(botNames, [target]);
    case 'groupsJoin':
      return groupsJoin(botNames, [target]);
    case 'followersFollow':
      return followersFollow(botNames, [target]);
    case 'curatorsFollow':
      return curatorsFollow(botNames, [target]);
    case 'wishlistFollowAdd':
      return wishlistFollowAdd(botNames, target);
    case 'wishlistAdd': {
      const appIds = resolveAppIdsFromInput(target);
      if (!appIds.length) throw new Error('INVALID_APP_ID');
      return wishlistAdd(botNames, appIds);
    }
    case 'gamesAdd': {
      const appIds = resolveAppIdsFromInput(target);
      if (!appIds.length) throw new Error('INVALID_APP_ID');
      return gamesAdd(botNames, appIds);
    }
    default:
      throw new Error(`Unknown bulk api: ${api}`);
  }
}
