/** Persist selected bots for an in-progress multi-action flow. */

const PREFIX = 'asf-multi-action:';
const DESTINATION_SUFFIX = ':destination';

function key(actionSlug) {
  return `${PREFIX}${String(actionSlug || '').toLowerCase()}`;
}

function destinationKey(actionSlug) {
  return `${key(actionSlug)}${DESTINATION_SUFFIX}`;
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
 * @returns {string}
 */
export function readDestinationBotName(actionSlug) {
  try {
    const raw = sessionStorage.getItem(destinationKey(actionSlug));
    return String(raw || '').trim();
  } catch (err) {
    return '';
  }
}

/**
 * @param {string} actionSlug
 * @param {string} botName
 */
export function writeDestinationBotName(actionSlug, botName) {
  const name = String(botName || '').trim();
  if (!name) {
    sessionStorage.removeItem(destinationKey(actionSlug));
    return;
  }
  sessionStorage.setItem(destinationKey(actionSlug), name);
}

/**
 * @param {string} actionSlug
 */
export function clearDestinationBotName(actionSlug) {
  sessionStorage.removeItem(destinationKey(actionSlug));
}

/**
 * @param {string} actionSlug
 */
export function clearSelectedBotNames(actionSlug) {
  sessionStorage.removeItem(key(actionSlug));
  clearDestinationBotName(actionSlug);
}

/**
 * True once the user has started the flow (sources and/or inventory destination).
 * @param {string} actionSlug
 */
export function hasStartedAction(actionSlug) {
  if (readDestinationBotName(actionSlug)) return true;
  return readSelectedBotNames(actionSlug).length > 0;
}
