/** Steam CDN base for economy item icons (icon_url / icon_url_large). */
export const STEAM_ECONOMY_IMAGE_BASE = 'https://community.cloudflare.steamstatic.com/economy/image/';

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
      return {
        name: String(name),
        category: String(tag.localized_category_name || tag.LocalizedIdentifier || tag.category || tag.Identifier || ''),
        color: tag.color || tag.Color || '',
      };
    })
    .filter(Boolean);
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

  return assets.map((asset, index) => {
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
      marketUrl: marketHashName
        ? `https://steamcommunity.com/market/listings/753/${encodeURIComponent(marketHashName)}`
        : '',
    };
  });
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
