/** Steam CDN base for economy item icons (icon_url / icon_url_large). */
export const STEAM_ECONOMY_IMAGE_BASE = 'https://community.cloudflare.steamstatic.com/economy/image/';

/** Inventory item kinds used for sort + filters. */
export const ITEM_KIND = Object.freeze({
  BOOSTER: 'booster',
  FOIL: 'foil',
  CARD: 'card',
  EMOTICON: 'emoticon',
  BACKGROUND: 'background',
  FRAME: 'frame',
  STICKER: 'sticker',
  OTHER: 'other',
});

/** Lower = earlier in the grid. Boosters → foil → cards → rest. */
export const ITEM_KIND_SORT = Object.freeze({
  [ITEM_KIND.BOOSTER]: 0,
  [ITEM_KIND.FOIL]: 1,
  [ITEM_KIND.CARD]: 2,
  [ITEM_KIND.EMOTICON]: 3,
  [ITEM_KIND.BACKGROUND]: 4,
  [ITEM_KIND.FRAME]: 5,
  [ITEM_KIND.STICKER]: 6,
  [ITEM_KIND.OTHER]: 7,
});

export const INVENTORY_FILTERS = Object.freeze([
  'all',
  ITEM_KIND.BOOSTER,
  ITEM_KIND.FOIL,
  ITEM_KIND.CARD,
  ITEM_KIND.EMOTICON,
  ITEM_KIND.BACKGROUND,
  ITEM_KIND.FRAME,
  ITEM_KIND.STICKER,
  ITEM_KIND.OTHER,
]);

/**
 * Build a full Steam economy image URL from an icon_url path.
 * @param {string} iconPath
 * @param {string} [sizeSuffix] e.g. `96fx96f` or `330x192`
 */
export function steamEconomyImageUrl(iconPath, sizeSuffix = '') {
  if (!iconPath) return '';
  if (/^https?:\/\//i.test(iconPath)) return iconPath;
  const path = String(iconPath).replace(/^\/+/, '');
  const size = sizeSuffix ? `/${sizeSuffix}` : '';
  return `${STEAM_ECONOMY_IMAGE_BASE}${path}${size}`;
}

export function steamStoreUrl(appId) {
  if (!appId) return '';
  return `https://store.steampowered.com/app/${encodeURIComponent(String(appId))}`;
}

function pickDescField(desc, ...keys) {
  for (const key of keys) {
    if (desc[key] != null && desc[key] !== '') return desc[key];
  }
  return '';
}

function normalizeTags(rawTags) {
  if (!Array.isArray(rawTags)) return [];
  return rawTags
    .map(tag => {
      const name = tag.localized_tag_name || tag.LocalizedValue || tag.name || tag.internal_name || tag.Value || '';
      if (!name) return null;
      const categoryId = String(tag.category || tag.Identifier || '');
      const value = String(tag.internal_name || tag.Value || '');
      return {
        name: String(name),
        category: String(tag.localized_category_name || tag.LocalizedIdentifier || categoryId),
        categoryId,
        value,
        color: tag.color || tag.Color || '',
      };
    })
    .filter(Boolean);
}

function extractGame(tags) {
  const gameTag = tags.find(tag => tag.categoryId === 'Game' || /^app_\d+$/i.test(tag.value));
  if (!gameTag) {
    return { gameName: '', gameAppId: '', storeUrl: '' };
  }
  const match = /^app_(\d+)$/i.exec(gameTag.value);
  const gameAppId = match ? match[1] : '';
  return {
    gameName: gameTag.name || '',
    gameAppId,
    storeUrl: steamStoreUrl(gameAppId),
  };
}

/**
 * Classify a Steam community inventory item for sort/filter.
 * Prefer Steam tag internals (item_class / cardborder).
 */
export function classifyInventoryItem(tags, typeText = '') {
  const values = new Set((tags || []).map(tag => String(tag.value || '').toLowerCase()));
  const type = String(typeText || '').toLowerCase();

  if (values.has('item_class_5') || type.includes('booster')) return ITEM_KIND.BOOSTER;
  if (values.has('cardborder_1') || type.includes('foil')) return ITEM_KIND.FOIL;
  if (values.has('cardborder_0') || values.has('item_class_2') || type.includes('trading card')) {
    return ITEM_KIND.CARD;
  }
  if (values.has('item_class_4') || type.includes('emoticon')) return ITEM_KIND.EMOTICON;
  if (values.has('item_class_3') || type.includes('profile background') || type.includes('background')) {
    return ITEM_KIND.BACKGROUND;
  }
  if (values.has('item_class_14') || type.includes('profile frame') || type.includes('avatar frame')) {
    return ITEM_KIND.FRAME;
  }
  if (values.has('item_class_11') || type.includes('sticker')) return ITEM_KIND.STICKER;
  return ITEM_KIND.OTHER;
}

export function sortInventoryItems(items) {
  return [...items].sort((a, b) => {
    const rankA = ITEM_KIND_SORT[a.kind] ?? ITEM_KIND_SORT[ITEM_KIND.OTHER];
    const rankB = ITEM_KIND_SORT[b.kind] ?? ITEM_KIND_SORT[ITEM_KIND.OTHER];
    if (rankA !== rankB) return rankA - rankB;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

/**
 * Normalize ASF IPC inventory items for one bot.
 * Prefer GET /Api/Bot/{bot}/Inventory/753/6 (SteamKit path) over the HTML summary scrape.
 */
export function normalizeInventoryItems(result, botName) {
  const payload = result?.[botName] ?? result;
  const assets = payload?.Assets || payload?.assets || [];
  const descriptions = payload?.Descriptions || payload?.descriptions || [];

  const descMap = new Map();
  descriptions.forEach(desc => {
    const key = `${desc.classid || desc.ClassID}_${desc.instanceid || desc.InstanceID || '0'}`;
    descMap.set(key, desc);
  });

  const items = assets.map((asset, index) => {
    const classId = asset.classid || asset.ClassID;
    const instanceId = asset.instanceid || asset.InstanceID || '0';
    const desc = descMap.get(`${classId}_${instanceId}`) || {};
    const name = pickDescField(desc, 'market_name', 'MarketName', 'market_hash_name', 'MarketHashName', 'name', 'Name') || `#${classId}`;
    const type = pickDescField(desc, 'type', 'Type', 'TypeText');
    const amount = Number(asset.amount || asset.Amount || 1);
    const iconPath = pickDescField(desc, 'icon_url', 'IconURL');
    const iconPathLarge = pickDescField(desc, 'icon_url_large', 'IconURLLarge') || iconPath;
    const marketHashName = pickDescField(desc, 'market_hash_name', 'MarketHashName') || name;
    const tags = normalizeTags(desc.tags || desc.Tags);
    const game = extractGame(tags);
    const kind = classifyInventoryItem(tags, type);

    return {
      id: String(asset.assetid || asset.AssetID || `${classId}-${index}`),
      name,
      type,
      amount,
      classId: String(classId || ''),
      instanceId: String(instanceId || '0'),
      iconUrl: steamEconomyImageUrl(iconPath, '96fx96f'),
      iconUrlLarge: steamEconomyImageUrl(iconPathLarge, '330x192'),
      marketHashName,
      marketable: Boolean(desc.marketable ?? desc.Marketable),
      tradable: Boolean(desc.tradable ?? desc.Tradable),
      backgroundColor: pickDescField(desc, 'background_color', 'BackgroundColor') || '',
      tags,
      kind,
      gameName: game.gameName,
      gameAppId: game.gameAppId,
      storeUrl: game.storeUrl,
      marketUrl: marketHashName
        ? `https://steamcommunity.com/market/listings/753/${encodeURIComponent(marketHashName)}`
        : '',
    };
  });

  return sortInventoryItems(items);
}

/**
 * @deprecated Summary scrape hits /my/inventory and is rate-limit prone.
 * Kept for reference / tests; InventoryTab uses Steam-only context fetch.
 */
export function normalizeInventorySummary(result, botName) {
  if (result == null || typeof result !== 'object') {
    return { apps: [], unavailable: true };
  }

  const hasBotKey = Object.prototype.hasOwnProperty.call(result, botName)
    || Object.keys(result).some(key => key.toLowerCase() === String(botName).toLowerCase());

  let raw = result[botName];
  if (raw === undefined) {
    const matchKey = Object.keys(result).find(key => key.toLowerCase() === String(botName).toLowerCase());
    raw = matchKey !== undefined ? result[matchKey] : undefined;
  }

  if (hasBotKey && raw == null) {
    return { apps: [], unavailable: true };
  }

  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { apps: [], unavailable: false };
  }

  const apps = Object.entries(raw).map(([appId, appData]) => {
    if (!appData || typeof appData !== 'object') {
      return null;
    }

    const contexts = Object.entries(appData.Contexts || appData.contexts || appData.rgContexts || {}).map(([contextId, ctx]) => ({
      contextId: String(contextId),
      name: ctx?.Name || ctx?.name || `Context ${contextId}`,
      assetsCount: ctx?.AssetCount ?? ctx?.AssetsCount ?? ctx?.asset_count ?? ctx?.assetCount ?? 0,
    }));

    return {
      appId: String(appId),
      name: appData.Name || appData.name || `App ${appId}`,
      contexts,
      totalAssets: contexts.reduce((sum, c) => sum + (Number(c.assetsCount) || 0), 0),
    };
  }).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));

  return { apps, unavailable: false };
}
