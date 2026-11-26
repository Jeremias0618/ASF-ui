// A SteamID64 ASF has not authenticated yet is 0 (or missing): it says nothing about the account.
export function hasKnownSteamId(steamid) {
  const value = String(steamid === undefined || steamid === null ? '' : steamid).trim();

  return value !== '' && value !== '0';
}

/**
 * Another bot (not `excludeName`) that is signed in with the same Steam account.
 *
 * It compares the SteamID64 ASF reports after authenticating, as strings (the value does not fit a JS number).
 * Bots whose identity ASF does not expose, such as stopped or disconnected ones, cannot be matched.
 */
export default function findBotWithSameAccount(bots, name, steamid) {
  if (!hasKnownSteamId(steamid)) return null;

  const id = String(steamid).trim();

  return bots.find(bot => bot.name !== name && hasKnownSteamId(bot.steamid) && String(bot.steamid).trim() === id) || null;
}
