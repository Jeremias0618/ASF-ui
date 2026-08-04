export const IPC_CONFIG_PLUGIN = Object.freeze({
  name: 'IpcConfig',
  assembly: 'IpcConfig',
  repository: 'Jeremias0618/ASF-Plugin',
  releasesUrl: 'https://github.com/Jeremias0618/ASF-Plugin/releases',
  latestReleaseUrl: 'https://github.com/Jeremias0618/ASF-Plugin/releases/latest',
  readmeUrl: 'https://github.com/Jeremias0618/ASF-Plugin/tree/main/IpcConfig',
  installPath: 'plugins/IpcConfig/',
  zipHint: 'IpcConfig.zip',
});

/**
 * Detect whether the IpcConfig custom plugin is loaded.
 * Prefers GET /Api/IpcConfig; falls back to GET /Api/Plugins.
 */
export async function detectIpcConfigPlugin(http) {
  try {
    await http.get('IpcConfig');
    return { available: true, via: 'api' };
  } catch (err) {
    // 404 / missing route → plugin not loaded. Auth errors still mean route may exist.
    const status = err?.result?.StatusCode || err?.result?.Result?.StatusCode;
    if (status === 401 || status === 403) {
      return { available: true, via: 'auth' };
    }
  }

  try {
    const custom = await http.get('Plugins', { official: false, custom: true });
    const list = Array.isArray(custom) ? custom : [];
    const found = list.some(plugin => {
      const name = plugin?.Name || '';
      return name === IPC_CONFIG_PLUGIN.name || name === `${IPC_CONFIG_PLUGIN.name}Plugin`;
    });

    return { available: found, via: 'plugins' };
  } catch {
    return { available: false, via: 'unknown' };
  }
}

/**
 * Body for PUT /Api/IpcConfig (ASF JSON is PascalCase).
 */
export function buildIpcConfigApiBody({ listenLan, port, knownNetworks = [], pathBase = '/' } = {}) {
  return {
    ListenLan: Boolean(listenLan),
    Port: Number(port) || 1242,
    PathBase: pathBase || '/',
    KnownNetworks: Array.isArray(knownNetworks) ? knownNetworks : [],
  };
}

export function applyIpcConfigStatusToForm(status, form) {
  if (!status || !form) return;

  if (typeof status.ListenLan === 'boolean') form.listenLan = status.ListenLan;
  if (Number.isInteger(status.Port) && status.Port > 0 && status.Port <= 65535) {
    form.port = status.Port;
  }

  const networks = Array.isArray(status.KnownNetworks) ? status.KnownNetworks : [];
  if (networks.length) {
    form.customNetworks = [...networks];
    form.accessMode = 'custom';
  }
}
