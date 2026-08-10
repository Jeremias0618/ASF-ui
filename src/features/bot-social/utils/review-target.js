/**
 * Validate Steam review URLs:
 * https://steamcommunity.com/id/{vanity}/recommended/{appId}/
 * https://steamcommunity.com/profiles/{steamId64}/recommended/{appId}/
 */
export function isLikelyReviewUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) return false;
  return /steamcommunity\.com\/(?:id|profiles)\/[^/?#]+\/recommended\/\d+/i.test(value);
}
