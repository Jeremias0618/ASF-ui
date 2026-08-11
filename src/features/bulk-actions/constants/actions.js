/** Catalog of multi-action (bulk social) actions. */

export const MULTI_ACTION_BASE = 'multi-action';

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
 * @typedef {'inventory' | 'community' | 'library'} BulkActionGroup
 * @typedef {{
 *   id: string,
 *   slug: string,
 *   icon: string,
 *   kind: BulkActionKind,
 *   group: BulkActionGroup,
 *   titleKey: string,
 *   leadKey: string,
 *   targetLabelKey?: string,
 *   targetPlaceholderKey?: string,
 *   api?: string,
 * }} BulkActionDef
 */

/** @type {{ id: BulkActionGroup, titleKey: string }[]} */
export const BULK_ACTION_GROUPS = Object.freeze([
  { id: 'inventory', titleKey: 'bulk-actions-group-inventory' },
  { id: 'community', titleKey: 'bulk-actions-group-community' },
  { id: 'library', titleKey: 'bulk-actions-group-library' },
]);

/** @type {BulkActionDef[]} */
export const BULK_ACTIONS = Object.freeze([
  {
    id: BULK_ACTION_IDS.INVENTORY_TRANSFER,
    slug: 'inventory',
    icon: 'exchange-alt',
    kind: 'inventory',
    group: 'inventory',
    titleKey: 'bulk-action-inventory-title',
    leadKey: 'bulk-action-inventory-lead',
  },
  {
    id: BULK_ACTION_IDS.FRIENDS_ADD,
    slug: 'friends',
    icon: 'user-plus',
    kind: 'url-bots',
    group: 'community',
    titleKey: 'bulk-action-friends-title',
    leadKey: 'bulk-action-friends-lead',
    targetLabelKey: 'bulk-action-friends-target-label',
    targetPlaceholderKey: 'bulk-action-friends-target-placeholder',
    api: 'friendsAdd',
  },
  {
    id: BULK_ACTION_IDS.GROUPS_JOIN,
    slug: 'groups',
    icon: 'users',
    kind: 'url-bots',
    group: 'community',
    titleKey: 'bulk-action-groups-title',
    leadKey: 'bulk-action-groups-lead',
    targetLabelKey: 'bulk-action-groups-target-label',
    targetPlaceholderKey: 'bulk-action-groups-target-placeholder',
    api: 'groupsJoin',
  },
  {
    id: BULK_ACTION_IDS.FOLLOWERS_FOLLOW,
    slug: 'followers',
    icon: 'heart',
    kind: 'url-bots',
    group: 'community',
    titleKey: 'bulk-action-followers-title',
    leadKey: 'bulk-action-followers-lead',
    targetLabelKey: 'bulk-action-followers-target-label',
    targetPlaceholderKey: 'bulk-action-followers-target-placeholder',
    api: 'followersFollow',
  },
  {
    id: BULK_ACTION_IDS.CURATORS_FOLLOW,
    slug: 'curators',
    icon: 'star',
    kind: 'url-bots',
    group: 'community',
    titleKey: 'bulk-action-curators-title',
    leadKey: 'bulk-action-curators-lead',
    targetLabelKey: 'bulk-action-curators-target-label',
    targetPlaceholderKey: 'bulk-action-curators-target-placeholder',
    api: 'curatorsFollow',
  },
  {
    id: BULK_ACTION_IDS.REVIEWS_VOTE,
    slug: 'reviews',
    icon: 'comments',
    kind: 'reviews-vote',
    group: 'community',
    titleKey: 'bulk-action-reviews-title',
    leadKey: 'bulk-action-reviews-lead',
    targetLabelKey: 'bulk-action-reviews-target-label',
    targetPlaceholderKey: 'bulk-action-reviews-target-placeholder',
  },
  {
    id: BULK_ACTION_IDS.SHARED_ACT,
    slug: 'shared',
    icon: 'thumbs-up',
    kind: 'shared-act',
    group: 'community',
    titleKey: 'bulk-action-shared-title',
    leadKey: 'bulk-action-shared-lead',
    targetLabelKey: 'bulk-action-shared-target-label',
    targetPlaceholderKey: 'bulk-action-shared-target-placeholder',
  },
  {
    id: BULK_ACTION_IDS.WISHLIST_FOLLOW_ADD,
    slug: 'wishlist-follow',
    icon: 'heart',
    kind: 'url-bots',
    group: 'library',
    titleKey: 'bulk-action-wishlist-follow-title',
    leadKey: 'bulk-action-wishlist-follow-lead',
    targetLabelKey: 'bulk-action-game-target-label',
    targetPlaceholderKey: 'bulk-action-game-target-placeholder',
    api: 'wishlistFollowAdd',
  },
  {
    id: BULK_ACTION_IDS.GAMES_ADD,
    slug: 'games',
    icon: 'plus',
    kind: 'url-bots',
    group: 'library',
    titleKey: 'bulk-action-games-add-title',
    leadKey: 'bulk-action-games-add-lead',
    targetLabelKey: 'bulk-action-game-target-label',
    targetPlaceholderKey: 'bulk-action-game-target-placeholder',
    api: 'gamesAdd',
  },
  {
    id: BULK_ACTION_IDS.WISHLIST_ADD,
    slug: 'wishlist',
    icon: 'book-open',
    kind: 'url-bots',
    group: 'library',
    titleKey: 'bulk-action-wishlist-add-title',
    leadKey: 'bulk-action-wishlist-add-lead',
    targetLabelKey: 'bulk-action-game-target-label',
    targetPlaceholderKey: 'bulk-action-game-target-placeholder',
    api: 'wishlistAdd',
  },
]);

export function getBulkAction(idOrSlug) {
  const key = String(idOrSlug || '');
  return BULK_ACTIONS.find(action => action.id === key || action.slug === key) || null;
}

export function isKnownBulkAction(idOrSlug) {
  return Boolean(getBulkAction(idOrSlug));
}

export function actionBotsRoute(action) {
  return {
    name: 'multi-action-bots',
    params: { action: action.slug },
  };
}

export function actionSetupRoute(action) {
  return {
    name: 'multi-action-setup',
    params: { action: action.slug },
  };
}
