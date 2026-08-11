/**
 * Validate / normalize multi-action Steam targets using bot-social parsers.
 */

import { isLikelyFriendTarget, normalizeFriendTarget } from '../../bot-social/utils/friend-target';
import { isLikelyGroupTarget, normalizeGroupTarget } from '../../bot-social/utils/group-target';
import { isLikelyCuratorTarget, normalizeCuratorTarget } from '../../bot-social/utils/curator-target';
import { parseGameAppId } from '../../bot-social/utils/game-target';
import { isLikelyReviewUrl } from '../../bot-social/utils/review-target';
import { isLikelySharedFileUrl } from '../../bot-social/utils/shared-file-target';

/** @typedef {'profile' | 'group' | 'curator' | 'game' | 'review' | 'shared'} BulkTargetKind */

const API_TARGET_KIND = Object.freeze({
  friendsAdd: 'profile',
  followersFollow: 'profile',
  groupsJoin: 'group',
  curatorsFollow: 'curator',
  wishlistFollowAdd: 'game',
  gamesAdd: 'game',
  wishlistAdd: 'game',
});

/**
 * @param {{ kind?: string, api?: string }|null|undefined} action
 * @returns {BulkTargetKind|null}
 */
export function getBulkTargetKind(action) {
  if (!action) return null;
  if (action.kind === 'reviews-vote') return 'review';
  if (action.kind === 'shared-act') return 'shared';
  return API_TARGET_KIND[action.api] || null;
}

/**
 * @param {BulkTargetKind|null} kind
 * @returns {string}
 */
export function bulkTargetErrorKey(kind) {
  if (!kind) return 'bulk-actions-invalid-target';
  return `bulk-actions-invalid-target-${kind}`;
}

/**
 * @param {{ kind?: string, api?: string }|null|undefined} action
 * @param {string} raw
 * @returns {boolean}
 */
export function isValidBulkTarget(action, raw) {
  const kind = getBulkTargetKind(action);
  const value = String(raw || '').trim();
  if (!kind || !value) return false;

  switch (kind) {
    case 'profile':
      return isLikelyFriendTarget(value);
    case 'group':
      return isLikelyGroupTarget(value);
    case 'curator':
      return isLikelyCuratorTarget(value);
    case 'game':
      return Boolean(parseGameAppId(value));
    case 'review':
      return isLikelyReviewUrl(value);
    case 'shared':
      return isLikelySharedFileUrl(value);
    default:
      return false;
  }
}

/**
 * Normalize a valid target for the API when possible; otherwise trim.
 * @param {{ kind?: string, api?: string }|null|undefined} action
 * @param {string} raw
 * @returns {string}
 */
export function normalizeBulkTarget(action, raw) {
  const kind = getBulkTargetKind(action);
  const value = String(raw || '').trim();
  if (!kind || !value) return '';

  switch (kind) {
    case 'profile':
      return normalizeFriendTarget(value);
    case 'group':
      return normalizeGroupTarget(value);
    case 'curator':
      return normalizeCuratorTarget(value);
    case 'game': {
      // Wishlist follow expects a store URL; Games/Wishlist Add accept AppID.
      if (action && action.api === 'wishlistFollowAdd') return value;
      const appId = parseGameAppId(value);
      return appId ? String(appId) : value;
    }
    case 'review':
    case 'shared':
      return value;
    default:
      return value;
  }
}
