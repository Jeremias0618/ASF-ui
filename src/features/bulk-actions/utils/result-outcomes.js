/**
 * Classify bulk mutation rows into ok / skipped / fail for summary UI.
 * Skipped = already done (follow, friends, owned, etc.).
 */

/**
 * @param {string} message
 * @returns {boolean}
 */
export function isSkippedMutationMessage(message) {
  const value = String(message || '').trim().toLowerCase();
  if (!value) return false;

  if (value.includes('already')) return true;
  if (value.includes('request already pending')) return true;
  if (/:\s*already\b/.test(value)) return true;
  if (value.includes('ya está') || value.includes('ya esta')) return true;
  if (value.includes('ya sigue') || value.includes('ya es amigo')) return true;

  return false;
}

/**
 * @param {{ ok?: boolean, message?: string }|null|undefined} row
 * @returns {'ok' | 'skipped' | 'fail'}
 */
export function classifyMutationOutcome(row) {
  if (!row) return 'fail';
  if (isSkippedMutationMessage(row.message)) return 'skipped';
  if (row.ok) return 'ok';
  return 'fail';
}

/**
 * @param {Array<{ ok?: boolean, message?: string }>} results
 * @returns {{ ok: number, skipped: number, fail: number, total: number }}
 */
export function summarizeMutationResults(results) {
  const list = Array.isArray(results) ? results : [];
  let ok = 0;
  let skipped = 0;
  let fail = 0;

  list.forEach(row => {
    const outcome = classifyMutationOutcome(row);
    if (outcome === 'ok') ok += 1;
    else if (outcome === 'skipped') skipped += 1;
    else fail += 1;
  });

  return { ok, skipped, fail, total: list.length };
}
