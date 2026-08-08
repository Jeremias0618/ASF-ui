export function normalizeInventorySummary(result, botName) {
  const raw = result?.[botName] ?? result;
  if (!raw || typeof raw !== 'object') return [];

  return Object.entries(raw).map(([appId, appData]) => {
    const contexts = Object.entries(appData?.Contexts || appData?.contexts || {}).map(([contextId, ctx]) => ({
      contextId: String(contextId),
      name: ctx?.Name || ctx?.name || `Context ${contextId}`,
      assetsCount: ctx?.AssetCount ?? ctx?.AssetsCount ?? ctx?.assetCount ?? 0,
    }));

    return {
      appId: String(appId),
      name: appData?.Name || appData?.name || `App ${appId}`,
      contexts,
      totalAssets: contexts.reduce((sum, c) => sum + (Number(c.assetsCount) || 0), 0),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

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
