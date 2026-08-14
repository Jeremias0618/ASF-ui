/**
 * Client pacing between per-bot bulk steps.
 * Slightly above ASFBotSocial EndpointRateLimiter values to avoid 429 spam.
 */
export const BULK_PACING_MS = Object.freeze({
  friendsAdd: 4500,
  groupsJoin: 3500,
  followersFollow: 3500,
  curatorsFollow: 3500,
  reviewsVote: 3500,
  sharedAct: 5500,
  wishlistFollowAdd: 3500,
  wishlistAdd: 3500,
  gamesAdd: 3500,
  discoveryExplore: 9000,
  inventoryTransfer: 10000,
});

/**
 * @param {string} api
 * @returns {number}
 */
export function pacingMsForApi(api) {
  return BULK_PACING_MS[api] ?? 3500;
}
