export const DEFAULT_IPC_PORT = 1242;

export const PRIVATE_NETWORKS = Object.freeze([
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
]);

export const ACCESS_MODE = Object.freeze({
  privateLan: 'private-lan',
  custom: 'custom',
});

const IPV4_PATTERN = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d{1,3})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d{1,3})$/;

/**
 * Normalize a single IP or CIDR into ASF KnownNetworks format (address/prefix).
 * Bare IPv4 becomes /32. Returns null when invalid.
 */
export function normalizeCidr(input) {
  if (typeof input !== 'string') return null;

  const value = input.trim();
  if (!value) return null;

  const parts = value.split('/');
  if (parts.length > 2) return null;

  const address = parts[0].trim();
  if (!IPV4_PATTERN.test(address)) return null;

  let prefix = 32;
  if (parts.length === 2) {
    const parsed = Number.parseInt(parts[1].trim(), 10);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 32) return null;
    prefix = parsed;
  }

  return `${address}/${prefix}`;
}

export function normalizeCidrList(entries) {
  if (!Array.isArray(entries)) return [];

  const unique = new Set();
  const result = [];

  entries.forEach(entry => {
    const cidr = normalizeCidr(entry);
    if (!cidr || unique.has(cidr)) return;
    unique.add(cidr);
    result.push(cidr);
  });

  return result;
}

export function resolveKnownNetworks(accessMode, customEntries) {
  if (accessMode === ACCESS_MODE.custom) {
    return normalizeCidrList(customEntries);
  }

  return [...PRIVATE_NETWORKS];
}

/**
 * Build IPC.config JSON for Kestrel (ASF config/IPC.config).
 */
export function buildIpcConfig({ listenLan, port = DEFAULT_IPC_PORT, knownNetworks = [] } = {}) {
  const listenPort = Number.parseInt(port, 10);
  const safePort = Number.isInteger(listenPort) && listenPort > 0 && listenPort <= 65535
    ? listenPort
    : DEFAULT_IPC_PORT;

  const url = listenLan ? `http://*:${safePort}` : `http://127.0.0.1:${safePort}`;

  const config = {
    Kestrel: {
      Endpoints: {
        HTTP: {
          Url: url,
        },
      },
      PathBase: '/',
    },
  };

  if (listenLan && Array.isArray(knownNetworks) && knownNetworks.length > 0) {
    config.Kestrel.KnownNetworks = knownNetworks;
  }

  return config;
}

export function serializeIpcConfig(config) {
  return `${JSON.stringify(config, null, '\t')}\n`;
}
