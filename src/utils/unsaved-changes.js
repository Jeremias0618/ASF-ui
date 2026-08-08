/**
 * Global unsaved-changes tracker for ASF-ui pages.
 * Pages mark dirty/clean; the router + beforeunload guard prompts the user.
 */

import VueRouter from 'vue-router';

let dirty = false;
let message = '';

export function markDirty(confirmMessage = '') {
  dirty = true;
  if (confirmMessage) message = confirmMessage;
}

export function markClean() {
  dirty = false;
  message = '';
}

export function hasUnsavedChanges() {
  return dirty;
}

export function getUnsavedChangesMessage() {
  return message;
}

/**
 * Vue Router rejects aborted/cancelled/duplicated navigations.
 * Treat those as expected (e.g. user cancels "unsaved changes" confirm).
 */
export function isBenignNavigationError(err) {
  if (!err) return false;

  if (typeof VueRouter.isNavigationFailure === 'function') {
    return VueRouter.isNavigationFailure(err);
  }

  const name = err.name || '';
  const text = err.message || '';
  return name === 'NavigationDuplicated'
    || name === 'NavigationAborted'
    || name === 'NavigationCancelled'
    || text.includes('Navigation aborted')
    || text.includes('Navigation cancelled')
    || text.includes('Avoided redundant navigation');
}

/**
 * @param {boolean|(() => boolean)} isDirty
 * @param {string|(() => string)} [confirmMessage]
 * @returns {boolean} true when navigation may continue
 */
export function confirmLeaveIfNeeded(isDirty = dirty, confirmMessage) {
  const dirtyState = typeof isDirty === 'function' ? isDirty() : Boolean(isDirty);
  if (!dirtyState) return true;

  const text = typeof confirmMessage === 'function'
    ? confirmMessage()
    : (confirmMessage || message || 'You have unsaved changes. Leave without saving?');

  return window.confirm(text);
}

export function installUnsavedChangesGuards(router, getDefaultMessage) {
  const resolveMessage = () => {
    if (message) return message;
    if (typeof getDefaultMessage === 'function') return getDefaultMessage();
    return 'You have unsaved changes. Leave without saving?';
  };

  window.addEventListener('beforeunload', event => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });

  // Prevent webpack/runtime overlays when the user cancels leave.
  window.addEventListener('unhandledrejection', event => {
    if (!isBenignNavigationError(event.reason)) return;
    event.preventDefault();
  });

  router.beforeEach((to, from, next) => {
    if (!dirty) {
      next();
      return;
    }

    if (confirmLeaveIfNeeded(true, resolveMessage)) {
      markClean();
      next();
      return;
    }

    next(false);
  });
}
