/**
 * Shared helpers for per-bot bulk runs with pacing + job checkpoints.
 */

import { pacingMsForApi } from '../constants/bulk-pacing';
import {
  checkpointBulkJob,
  clearBulkJob,
  finishBulkJob,
  isBulkJobActive,
  isBulkJobActiveForOtherAction,
  patchBulkJob,
  readBulkJob,
  tryStartBulkJob,
} from '../utils/bulk-job-session';

/**
 * @param {string} actionSlug
 * @returns {{ blocked: boolean, job: object|null }}
 */
export function getBulkBlockState(actionSlug) {
  const job = readBulkJob();
  if (!job) {
    return { blocked: false, job: null };
  }
  const same = String(job.actionSlug || '').toLowerCase() === String(actionSlug || '').toLowerCase();
  if (job.status === 'running' && !same) {
    return { blocked: true, job };
  }
  if (same) {
    return { blocked: false, job };
  }
  return { blocked: false, job: null };
}

/**
 * Build one-step-per-bot list and run with pacing / checkpoints.
 * @param {object} options
 * @param {ReturnType<import('../composables/use-bulk-runner').createBulkRunner>} options.runner
 * @param {string[]} options.botNames
 * @param {string} options.api pacing key
 * @param {(botName: string) => Promise<object|object[]>} options.runForBot
 * @param {number} [options.startIndex]
 * @param {object[]} [options.initialResults]
 * @param {(botName: string) => string} [options.labelForBot]
 */
export async function runPacedPerBot({
  runner,
  botNames,
  api,
  runForBot,
  startIndex = 0,
  initialResults = [],
  labelForBot,
}) {
  const names = (botNames || []).map(n => String(n || '').trim()).filter(Boolean);
  const start = Math.min(Math.max(0, startIndex), names.length);
  const remaining = names.slice(start);
  const steps = remaining.map(botName => ({
    label: labelForBot ? labelForBot(botName) : botName,
    run: () => runForBot(botName),
  }));

  return runner.runSteps(steps, {
    delayMs: pacingMsForApi(api),
    startOffset: start,
    initialResults,
    onStepDone: ({ absoluteIndex, results }) => {
      checkpointBulkJob(results, absoluteIndex + 1);
    },
  });
}

export {
  checkpointBulkJob,
  clearBulkJob,
  finishBulkJob,
  isBulkJobActive,
  isBulkJobActiveForOtherAction,
  patchBulkJob,
  readBulkJob,
  tryStartBulkJob,
};
