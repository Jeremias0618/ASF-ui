/**
 * Pure helpers for friend list display (SteamID / persona).
 */

const STEAM_ID64_RE = /^[0-9]{17}$/;

export { STEAM_ID64_RE };

export function isFriendBlocked(friend) {
  return String(friend?.relationship || '').toLowerCase() === 'blocked';
}

export function friendDisplayName(friend) {
  const name = String(friend?.name || '').trim();
  if (name && name !== friend?.steamId) return name;
  return friend?.steamId || '?';
}

export function friendProfileUrl(steamId) {
  const id = String(steamId || '').trim();
  if (!STEAM_ID64_RE.test(id)) return 'https://steamcommunity.com/';
  return `https://steamcommunity.com/profiles/${id}`;
}

export function friendInitials(friend) {
  return String(friendDisplayName(friend) || '?').trim().slice(0, 1).toUpperCase();
}

export function isValidSteamId64(steamId) {
  return STEAM_ID64_RE.test(String(steamId || ''));
}
