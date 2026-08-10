/**
 * Validate Steam shared file URLs:
 * https://steamcommunity.com/sharedfiles/filedetails/?id=123
 */
export function isLikelySharedFileUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) return false;
  if (/steamcommunity\.com\/sharedfiles\/filedetails\/\?id=\d+/i.test(value)) return true;
  if (/^\d{6,}$/.test(value)) return true;
  return false;
}
