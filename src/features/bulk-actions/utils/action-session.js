/** Persist selected bots for an in-progress multi-action flow. */

const PREFIX = 'asf-multi-action:';

function key(actionSlug) {
  return `${PREFIX}${String(actionSlug || '').toLowerCase()}`;
}

/**
 * @param {string} actionSlug
 * @returns {string[]}
 */
export function readSelectedBotNames(actionSlug) {
  try {
    const raw = sessionStorage.getItem(key(actionSlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(name => String(name || '').trim()).filter(Boolean);
  } catch (err) {
    return [];
  }
}

/**
 * @param {string} actionSlug
 * @param {string[]} botNames
 */
export function writeSelectedBotNames(actionSlug, botNames) {
  const list = [...new Set((botNames || []).map(name => String(name || '').trim()).filter(Boolean))];
  if (!list.length) {
    sessionStorage.removeItem(key(actionSlug));
    return;
  }
  sessionStorage.setItem(key(actionSlug), JSON.stringify(list));
}

/**
 * @param {string} actionSlug
 */
export function clearSelectedBotNames(actionSlug) {
  sessionStorage.removeItem(key(actionSlug));
}

/**
 * True once the user has picked at least one bot (flow started).
 * @param {string} actionSlug
 */
export function hasStartedAction(actionSlug) {
  return readSelectedBotNames(actionSlug).length > 0;
}
