/**
 * Normalize a Steam Store curator / mentor target (URL or numeric clan id).
 */
export function normalizeCuratorTarget(raw) {
  let value = String(raw || '').trim();
  if (!value) return '';

  value = value.replace(/^<|>$/g, '').replace(/[.,;]+$/g, '').trim();

  try {
    if (/^https?:\/\//i.test(value) || value.toLowerCase().includes('steampowered.com/')) {
      const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, '')}`;
      const url = new URL(withProtocol);
      const match = url.pathname.match(/\/curator\/(\d+)/i);
      if (match) return match[1];
    }
  } catch {
    // Fall through
  }

  const loose = value.match(/steampowered\.com\/curator\/(\d+)/i);
  if (loose) return loose[1];

  if (/^\d+$/.test(value)) return value;

  return '';
}

export function isLikelyCuratorTarget(raw) {
  return Boolean(normalizeCuratorTarget(raw));
}
