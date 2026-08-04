/**
 * Shared modal enter/leave transition.
 * Pair with `_modal-transition.scss` and `ModalTransition.vue`.
 */
export const MODAL_TRANSITION_NAME = 'asf-modal';
export const MODAL_TRANSITION_MS = 200;

let scrollLockCount = 0;

export function lockModalScroll() {
  scrollLockCount += 1;
  if (scrollLockCount === 1) {
    document.body.style.overflow = 'hidden';
  }
}

export function unlockModalScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = '';
  }
}
