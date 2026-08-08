/**
 * Warm the browser HTTP cache for Steam CDN thumbnails.
 * Does not hit ASF/IPC — only creates Image() requests for URLs already known locally.
 */

const warmed = new Set();
const MAX_WARMED = 500;

export function prefetchImageUrls(urls) {
  if (!Array.isArray(urls) || !urls.length) return;

  for (const url of urls) {
    if (!url || warmed.has(url)) continue;
    if (warmed.size >= MAX_WARMED) warmed.clear();
    warmed.add(url);

    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
    } catch {
      // Ignore environments without Image constructor.
    }
  }
}

/**
 * Prefetch icon URLs for the current page and immediate neighbors.
 * @param {object[]} items filtered inventory list
 * @param {number} page 1-based page
 * @param {number} pageSize
 */
export function prefetchInventoryPageIcons(items, page, pageSize) {
  if (!items?.length || !pageSize) return;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page || 1), totalPages);
  const urls = [];

  for (const p of [safePage - 1, safePage, safePage + 1]) {
    if (p < 1 || p > totalPages) continue;
    const start = (p - 1) * pageSize;
    const slice = items.slice(start, start + pageSize);
    for (const item of slice) {
      if (item?.iconUrl) urls.push(item.iconUrl);
    }
  }

  prefetchImageUrls(urls);
}
