/**
 * Shared modal size tokens for App Modal.
 * Prefer `meta.modalSize` on routes; route-name fallbacks keep legacy routes working.
 *
 * Tokens:
 * - default — content-sized (max bounds only)
 * - medium / dialog — fixed width presets
 * - wide — 52rem width, height follows content
 * - workspace — 60rem width (dense social hubs), height follows content
 *
 * Height always follows each modal’s own content. Do not force a shared
 * global height across unrelated modals.
 */

export const MODAL_SIZE = Object.freeze({
  DEFAULT: 'default',
  MEDIUM: 'medium',
  DIALOG: 'dialog',
  WIDE: 'wide',
  WORKSPACE: 'workspace',
});

const SIZE_CLASSES = Object.freeze({
  [MODAL_SIZE.DEFAULT]: [],
  [MODAL_SIZE.MEDIUM]: ['modal__main--medium'],
  [MODAL_SIZE.DIALOG]: ['modal__main--dialog'],
  [MODAL_SIZE.WIDE]: ['modal__main--wide'],
  [MODAL_SIZE.WORKSPACE]: ['modal__main--wide', 'modal__main--friends'],
});

/** Legacy aliases kept so older route meta still resolves. */
const SIZE_ALIASES = Object.freeze({
  'wide-fixed': MODAL_SIZE.WIDE,
  'workspace-fixed': MODAL_SIZE.WORKSPACE,
});

/** Legacy route-name → size when `meta.modalSize` is omitted. */
const ROUTE_SIZE_FALLBACK = Object.freeze({
  'bot-config': MODAL_SIZE.WIDE,
  'bot-create': MODAL_SIZE.WIDE,
  'bot-copy': MODAL_SIZE.WIDE,
  'bot-inventory': MODAL_SIZE.WORKSPACE,
  'bot-friends': MODAL_SIZE.WORKSPACE,
  'bot-community': MODAL_SIZE.WORKSPACE,
  'bot-games': MODAL_SIZE.WORKSPACE,
  'bot-wishlist': MODAL_SIZE.WORKSPACE,
  'password-encrypt': MODAL_SIZE.DIALOG,
  'password-hash': MODAL_SIZE.DIALOG,
  'bot-delete': MODAL_SIZE.DIALOG,
  'bot-2fa-delete': MODAL_SIZE.DIALOG,
  'bot-bgr': MODAL_SIZE.MEDIUM,
});

/**
 * @param {string|undefined|null} size
 * @returns {string|undefined|null}
 */
function normalizeSizeToken(size) {
  if (!size) return size;
  return SIZE_ALIASES[size] || size;
}

/**
 * @param {string|undefined|null} size
 * @returns {boolean}
 */
export function isKnownModalSize(size) {
  const token = normalizeSizeToken(size);
  return Boolean(token && Object.prototype.hasOwnProperty.call(SIZE_CLASSES, token));
}

/**
 * Resolve the modal size token for a Vue Router route.
 * @param {{ name?: string, meta?: { modalSize?: string } }|null|undefined} route
 * @returns {string}
 */
export function resolveModalSize(route) {
  const fromMeta = normalizeSizeToken(route?.meta?.modalSize);
  if (isKnownModalSize(fromMeta)) return fromMeta;

  const fromName = route?.name ? ROUTE_SIZE_FALLBACK[route.name] : undefined;
  return fromName || MODAL_SIZE.DEFAULT;
}

/**
 * CSS classes for `.modal__main`.
 * @param {{ name?: string, meta?: { modalSize?: string } }|null|undefined} route
 * @returns {string[]}
 */
export function resolveModalSizeClasses(route) {
  return SIZE_CLASSES[resolveModalSize(route)] || [];
}
