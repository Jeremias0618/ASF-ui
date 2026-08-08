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
    const name = desc.market_name || desc.market_hash_name || desc.name || desc.Name || `#${classId}`;
    const type = desc.type || desc.Type || '';
    const amount = Number(asset.amount || asset.Amount || 1);

    return {
      id: String(asset.assetid || asset.AssetID || `${classId}-${index}`),
      name,
      type,
      amount,
      classId: String(classId || ''),
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
