/**
 * Pure local view pipeline for inventory.
 * Never touches IPC/API — only transforms already-loaded items.
 */

import { ITEM_KIND } from './inventory';

export const NO_GAME_ID = '__none__';
export const INVENTORY_PAGE_SIZE = 25;

export function gameKey(item) {
  if (item?.gameAppId) return String(item.gameAppId);
  if (item?.gameName) return `name:${item.gameName}`;
  return NO_GAME_ID;
}

/**
 * @param {object[]} items
 * @param {{ query?: string, kind?: string, game?: string, status?: string }} filters
 */
export function filterInventoryItems(items, filters = {}) {
  const query = String(filters.query || '').trim().toLowerCase();
  const kind = filters.kind || 'all';
  const game = filters.game || '';
  const status = filters.status || 'all';

  return (items || []).filter(item => {
    if (kind !== 'all' && item.kind !== kind) return false;
    if (game && gameKey(item) !== game) return false;
    if (status === 'tradable' && !item.tradable) return false;
    if (status === 'not_tradable' && item.tradable) return false;
    if (status === 'marketable' && !item.marketable) return false;
    if (status === 'not_marketable' && item.marketable) return false;
    if (status === 'both' && !(item.tradable && item.marketable)) return false;
    if (!query) return true;
    return String(item.name || '').toLowerCase().includes(query)
      || (item.type && String(item.type).toLowerCase().includes(query))
      || (item.gameName && String(item.gameName).toLowerCase().includes(query))
      || String(item.classId || '').includes(query)
      || (item.tags || []).some(tag => String(tag.name || '').toLowerCase().includes(query));
  });
}

export function paginateItems(items, page, pageSize = INVENTORY_PAGE_SIZE) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page || 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    totalPages,
    pageItems: items.slice(start, start + pageSize),
  };
}

export function countByKind(items) {
  const counts = { all: items.length };
  Object.values(ITEM_KIND).forEach(kind => {
    counts[kind] = 0;
  });
  items.forEach(item => {
    const kind = item.kind || ITEM_KIND.OTHER;
    counts[kind] = (counts[kind] || 0) + 1;
  });
  return counts;
}

export function isLegacyInventoryShape(items) {
  return Array.isArray(items)
    && items.length > 0
    && !Object.prototype.hasOwnProperty.call(items[0], 'kind');
}
