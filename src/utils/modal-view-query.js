/**
 * Sync modal sub-views with `?view=<name>` (English tokens).
 * The default view omits the query for a clean URL.
 */

export const MODAL_VIEW_QUERY = 'view';

/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeQueryValue(value) {
  if (Array.isArray(value)) return value[0] == null ? '' : String(value[0]);
  return value == null ? '' : String(value);
}

/**
 * @param {{ query?: Record<string, unknown> }|null|undefined} route
 * @param {Set<string>} allowed
 * @param {string} fallback
 * @returns {string}
 */
export function readModalView(route, allowed, fallback) {
  const raw = normalizeQueryValue(route?.query?.[MODAL_VIEW_QUERY]);
  if (raw && allowed.has(raw)) return raw;
  return fallback;
}

/**
 * @param {import('vue-router').default} router
 * @param {{ name?: string, params?: object, query?: object, hash?: string }} route
 * @param {string} view
 * @param {string} fallback
 * @returns {Promise<void>}
 */
export function replaceModalView(router, route, view, fallback) {
  const current = normalizeQueryValue(route.query?.[MODAL_VIEW_QUERY]);
  const nextQuery = { ...(route.query || {}) };

  if (!view || view === fallback) {
    if (!(MODAL_VIEW_QUERY in nextQuery)) return Promise.resolve();
    delete nextQuery[MODAL_VIEW_QUERY];
  } else {
    if (current === view) return Promise.resolve();
    nextQuery[MODAL_VIEW_QUERY] = view;
  }

  return router.replace({
    name: route.name,
    params: route.params,
    query: nextQuery,
    hash: route.hash,
  }).catch(() => {});
}
