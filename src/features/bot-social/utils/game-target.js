/**
 * Extract Steam AppID from a pasted store URL, steam:// link, or bare numeric id.
 * Returns null when the input looks like a free-text name search.
 * @param {string} raw
 * @returns {number|null}
 */
export function parseGameAppId(raw) {
  let value = String(raw || '').trim();
  if (!value) return null;

  value = value.replace(/^<|>$/g, '').replace(/[.,;]+$/g, '').trim();

  const urlMatch = value.match(/(?:store\.steampowered\.com\/app\/|steam:\/\/(?:store|run)\/)(\d+)/i);
  if (urlMatch) {
    const id = Number(urlMatch[1]);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  if (/^\d+$/.test(value)) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  return null;
}

/**
 * Normalize search input (trim URL noise) while keeping names intact.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeGameSearchQuery(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';

  const appId = parseGameAppId(value);
  if (appId) return String(appId);

  return value.replace(/^<|>$/g, '').trim();
}
