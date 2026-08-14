/**
 * Persist a single in-flight multi-action job (survives reload within the tab session).
 * Also acts as a global lock so a second bulk cannot start while one is running.
 */

const JOB_KEY = 'asf-multi-action-job';

/**
 * @typedef {{
 *   id: string,
 *   status: 'running' | 'done' | 'cancelled',
 *   actionSlug: string,
 *   actionId: string,
 *   kind: string,
 *   api: string,
 *   params: Record<string, any>,
 *   botNames: string[],
 *   nextIndex: number,
 *   results: object[],
 *   summaryTarget?: string,
 *   startedAt: number,
 *   updatedAt: number,
 * }} BulkJob
 */

function now() {
  return Date.now();
}

function makeId() {
  return `bulk-${now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @returns {BulkJob|null}
 */
export function readBulkJob() {
  try {
    const raw = sessionStorage.getItem(JOB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.id || !parsed.actionSlug || !Array.isArray(parsed.botNames)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {BulkJob|null} job
 */
export function writeBulkJob(job) {
  if (!job) {
    sessionStorage.removeItem(JOB_KEY);
    return;
  }
  sessionStorage.setItem(JOB_KEY, JSON.stringify({
    ...job,
    updatedAt: now(),
  }));
}

export function clearBulkJob() {
  sessionStorage.removeItem(JOB_KEY);
}

/**
 * @returns {boolean}
 */
export function isBulkJobActive() {
  const job = readBulkJob();
  return Boolean(job && job.status === 'running');
}

/**
 * @param {string} [actionSlug]
 * @returns {boolean}
 */
export function isBulkJobActiveForOtherAction(actionSlug) {
  const job = readBulkJob();
  if (!job || job.status !== 'running') return false;
  if (!actionSlug) return true;
  return String(job.actionSlug).toLowerCase() !== String(actionSlug).toLowerCase();
}

/**
 * @param {{
 *   actionSlug: string,
 *   actionId: string,
 *   kind: string,
 *   api: string,
 *   params?: Record<string, any>,
 *   botNames: string[],
 *   summaryTarget?: string,
 * }} input
 * @returns {BulkJob|null} null if another job is already running
 */
export function tryStartBulkJob(input) {
  if (isBulkJobActive()) return null;
  const botNames = [...new Set((input.botNames || []).map(n => String(n || '').trim()).filter(Boolean))];
  if (!botNames.length) return null;
  /** @type {BulkJob} */
  const job = {
    id: makeId(),
    status: 'running',
    actionSlug: String(input.actionSlug || '').toLowerCase(),
    actionId: String(input.actionId || ''),
    kind: String(input.kind || ''),
    api: String(input.api || ''),
    params: input.params && typeof input.params === 'object' ? { ...input.params } : {},
    botNames,
    nextIndex: 0,
    results: [],
    summaryTarget: input.summaryTarget || '',
    startedAt: now(),
    updatedAt: now(),
  };
  writeBulkJob(job);
  return job;
}

/**
 * @param {Partial<BulkJob>} patch
 * @returns {BulkJob|null}
 */
export function patchBulkJob(patch) {
  const current = readBulkJob();
  if (!current) return null;
  const next = {
    ...current,
    ...patch,
    updatedAt: now(),
  };
  writeBulkJob(next);
  return next;
}

/**
 * @param {object[]} results
 * @param {number} nextIndex
 */
export function checkpointBulkJob(results, nextIndex) {
  return patchBulkJob({
    results: Array.isArray(results) ? results : [],
    nextIndex: Math.max(0, Number(nextIndex) || 0),
  });
}

/**
 * @param {'done'|'cancelled'} status
 * @param {object[]} [results]
 */
export function finishBulkJob(status, results) {
  const current = readBulkJob();
  if (!current) return;
  if (results) {
    writeBulkJob({
      ...current,
      status,
      results,
      nextIndex: current.botNames.length,
      updatedAt: now(),
    });
  } else {
    writeBulkJob({
      ...current,
      status,
      nextIndex: current.botNames.length,
      updatedAt: now(),
    });
  }
  // Keep done/cancelled briefly so restore can show final modal once, then hub clears.
  // Callers should clearBulkJob() when the progress modal is dismissed.
}
