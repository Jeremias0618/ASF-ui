/**
 * Shared modal size tokens for App Modal.
 * Prefer `meta.modalSize` on routes; route-name fallbacks keep legacy routes working.
 *
 * Tokens:
 * - default — content-sized (max bounds only)
 * - medium / dialog — fixed width presets
 * - wide — 52rem width, height follows content
 * - wide-fixed — 52rem + reserved height (stable across tabs / empty states)
 * - workspace — 60rem width (friends / dense UIs)
 * - workspace-fixed — 60rem + reserved height
 */

export const MODAL_SIZE = Object.freeze({
  DEFAULT: 'default',
  MEDIUM: 'medium',
  DIALOG: 'dialog',
  WIDE: 'wide',
  WIDE_FIXED: 'wide-fixed',
  WORKSPACE: 'workspace',
  WORKSPACE_FIXED: 'workspace-fixed',
});

const SIZE_CLASSES = Object.freeze({
  [MODAL_SIZE.DEFAULT]: [],
  [MODAL_SIZE.MEDIUM]: ['modal__main--medium'],
  [MODAL_SIZE.DIALOG]: ['modal__main--dialog'],
  [MODAL_SIZE.WIDE]: ['modal__main--wide'],
  [MODAL_SIZE.WIDE_FIXED]: ['modal__main--wide', 'modal__main--fixed'],
  [MODAL_SIZE.WORKSPACE]: ['modal__main--wide', 'modal__main--friends'],
  [MODAL_SIZE.WORKSPACE_FIXED]: ['modal__main--wide', 'modal__main--friends', 'modal__main--fixed'],
});

/** Legacy route-name → size when `meta.modalSize` is omitted. */
const ROUTE_SIZE_FALLBACK = Object.freeze({
  'bot-config': MODAL_SIZE.WIDE,
  'bot-create': MODAL_SIZE.WIDE,
  'bot-copy': MODAL_SIZE.WIDE,
  'bot-inventory': MODAL_SIZE.WORKSPACE_FIXED,
  'bot-friends': MODAL_SIZE.WORKSPACE,
  'bot-community': MODAL_SIZE.WORKSPACE,
  'bot-games': MODAL_SIZE.WORKSPACE,
  'bot-wishlist': MODAL_SIZE.WIDE,
  'password-encrypt': MODAL_SIZE.DIALOG,
  'password-hash': MODAL_SIZE.DIALOG,
  'bot-delete': MODAL_SIZE.DIALOG,
  'bot-2fa-delete': MODAL_SIZE.DIALOG,
  'bot-bgr': MODAL_SIZE.MEDIUM,
});

/**
 * @param {string|undefined|null} size
 * @returns {boolean}
 */
export function isKnownModalSize(size) {
  return Boolean(size && Object.prototype.hasOwnProperty.call(SIZE_CLASSES, size));
}

/**
 * Resolve the modal size token for a Vue Router route.
 * @param {{ name?: string, meta?: { modalSize?: string } }|null|undefined} route
 * @returns {string}
 */
export function resolveModalSize(route) {
  const fromMeta = route?.meta?.modalSize;
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

/**
 * Whether the modal reserves a fixed height (avoids CLS on tab / empty swaps).
 * @param {{ name?: string, meta?: { modalSize?: string } }|null|undefined} route
 * @returns {boolean}
 */
export function isFixedModalSize(route) {
  return resolveModalSizeClasses(route).includes('modal__main--fixed');
}
