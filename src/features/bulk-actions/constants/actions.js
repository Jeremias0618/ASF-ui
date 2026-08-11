/** Catalog of bulk social actions shown on the hub. */

export const BULK_ACTION_IDS = Object.freeze({
  INVENTORY_TRANSFER: 'inventory-transfer',
  FRIENDS_ADD: 'friends-add',
  GROUPS_JOIN: 'groups-join',
  FOLLOWERS_FOLLOW: 'followers-follow',
  CURATORS_FOLLOW: 'curators-follow',
  REVIEWS_VOTE: 'reviews-vote',
  SHARED_ACT: 'shared-act',
  WISHLIST_FOLLOW_ADD: 'wishlist-follow-add',
  GAMES_ADD: 'games-add',
  WISHLIST_ADD: 'wishlist-add',
});

/**
 * @typedef {'inventory' | 'url-bots' | 'reviews-vote' | 'shared-act'} BulkActionKind
 * @typedef {{
 *   id: string,
 *   icon: string,
 *   kind: BulkActionKind,
 *   titleKey: string,
 *   leadKey: string,
 *   targetLabelKey?: string,
 *   targetPlaceholderKey?: string,
 *   api?: string,
 * }} BulkActionDef
 */

/** @type {BulkActionDef[]} */
export const BULK_ACTIONS = Object.freeze([
  {
    id: BULK_ACTION_IDS.INVENTORY_TRANSFER,
    icon: 'exchange-alt',
    kind: 'inventory',
    titleKey: 'bulk-action-inventory-title',
    leadKey: 'bulk-action-inventory-lead',
  },
  {
    id: BULK_ACTION_IDS.FRIENDS_ADD,
    icon: 'user-plus',
    kind: 'url-bots',
    titleKey: 'bulk-action-friends-title',
    leadKey: 'bulk-action-friends-lead',
    targetLabelKey: 'bulk-action-friends-target-label',
    targetPlaceholderKey: 'bulk-action-friends-target-placeholder',
    api: 'friendsAdd',
  },
  {
    id: BULK_ACTION_IDS.GROUPS_JOIN,
    icon: 'users',
    kind: 'url-bots',
    titleKey: 'bulk-action-groups-title',
    leadKey: 'bulk-action-groups-lead',
    targetLabelKey: 'bulk-action-groups-target-label',
    targetPlaceholderKey: 'bulk-action-groups-target-placeholder',
    api: 'groupsJoin',
  },
  {
    id: BULK_ACTION_IDS.FOLLOWERS_FOLLOW,
    icon: 'heart',
    kind: 'url-bots',
    titleKey: 'bulk-action-followers-title',
    leadKey: 'bulk-action-followers-lead',
    targetLabelKey: 'bulk-action-followers-target-label',
    targetPlaceholderKey: 'bulk-action-followers-target-placeholder',
    api: 'followersFollow',
  },
  {
    id: BULK_ACTION_IDS.CURATORS_FOLLOW,
    icon: 'star',
    kind: 'url-bots',
    titleKey: 'bulk-action-curators-title',
    leadKey: 'bulk-action-curators-lead',
    targetLabelKey: 'bulk-action-curators-target-label',
    targetPlaceholderKey: 'bulk-action-curators-target-placeholder',
    api: 'curatorsFollow',
  },
  {
    id: BULK_ACTION_IDS.REVIEWS_VOTE,
    icon: 'comments',
    kind: 'reviews-vote',
    titleKey: 'bulk-action-reviews-title',
    leadKey: 'bulk-action-reviews-lead',
    targetLabelKey: 'bulk-action-reviews-target-label',
    targetPlaceholderKey: 'bulk-action-reviews-target-placeholder',
  },
  {
    id: BULK_ACTION_IDS.SHARED_ACT,
    icon: 'thumbs-up',
    kind: 'shared-act',
    titleKey: 'bulk-action-shared-title',
    leadKey: 'bulk-action-shared-lead',
    targetLabelKey: 'bulk-action-shared-target-label',
    targetPlaceholderKey: 'bulk-action-shared-target-placeholder',
  },
  {
    id: BULK_ACTION_IDS.WISHLIST_FOLLOW_ADD,
    icon: 'heart',
    kind: 'url-bots',
    titleKey: 'bulk-action-wishlist-follow-title',
    leadKey: 'bulk-action-wishlist-follow-lead',
    targetLabelKey: 'bulk-action-game-target-label',
    targetPlaceholderKey: 'bulk-action-game-target-placeholder',
    api: 'wishlistFollowAdd',
  },
  {
    id: BULK_ACTION_IDS.GAMES_ADD,
    icon: 'plus',
    kind: 'url-bots',
    titleKey: 'bulk-action-games-add-title',
    leadKey: 'bulk-action-games-add-lead',
    targetLabelKey: 'bulk-action-game-target-label',
    targetPlaceholderKey: 'bulk-action-game-target-placeholder',
    api: 'gamesAdd',
  },
  {
    id: BULK_ACTION_IDS.WISHLIST_ADD,
    icon: 'book-open',
    kind: 'url-bots',
    titleKey: 'bulk-action-wishlist-add-title',
    leadKey: 'bulk-action-wishlist-add-lead',
    targetLabelKey: 'bulk-action-game-target-label',
    targetPlaceholderKey: 'bulk-action-game-target-placeholder',
    api: 'wishlistAdd',
  },
]);

export function getBulkAction(id) {
  return BULK_ACTIONS.find(action => action.id === id) || null;
}

export function isKnownBulkAction(id) {
  return Boolean(getBulkAction(id));
}
