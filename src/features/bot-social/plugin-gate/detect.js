import { get } from '../../../plugins/http';
import { DETECT_TTL_MS, PLUGIN_NAME } from './constants';

let cache = { at: 0, loaded: null };

export function invalidatePluginDetect() {
  cache = { at: 0, loaded: null };
}

function isNamedPlugin(plugin) {
  const name = String(plugin?.Name || '').toLowerCase();
  return name === PLUGIN_NAME.toLowerCase();
}

export async function isBotSocialPluginLoaded({ force = false } = {}) {
  const now = Date.now();
  if (!force && cache.loaded != null && now - cache.at < DETECT_TTL_MS) {
    return cache.loaded;
  }

  try {
    const custom = await get('Plugins', { official: false, custom: true });
    const list = Array.isArray(custom) ? custom : [];
    const loaded = list.some(isNamedPlugin);
    cache = { at: now, loaded };
    return loaded;
  } catch (err) {
    cache = { at: now, loaded: null };
    throw err;
  }
}
