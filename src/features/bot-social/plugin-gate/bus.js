const listeners = new Set();

export function openPluginMissingModal() {
  listeners.forEach(fn => fn(true));
}

export function closePluginMissingModal() {
  listeners.forEach(fn => fn(false));
}

export function onPluginMissingModal(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
