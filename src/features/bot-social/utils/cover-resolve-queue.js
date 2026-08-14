/**
 * Limits concurrent BotSocial Games/{appId}/Cover IPC calls.
 * Plugin GamesCoverLimiter is ~500ms/bot; UI storms were causing 429s.
 */

const MAX_CONCURRENT = 2;
/** @type {{ run: () => Promise<any>, resolve: Function, reject: Function }[]} */
const pending = [];
let active = 0;

function pump() {
  while (active < MAX_CONCURRENT && pending.length) {
    const job = pending.shift();
    active += 1;
    Promise.resolve()
      .then(job.run)
      .then(job.resolve, job.reject)
      .finally(() => {
        active -= 1;
        pump();
      });
  }
}

/**
 * @template T
 * @param {() => Promise<T>} run
 * @returns {Promise<T>}
 */
export function enqueueCoverResolve(run) {
  return new Promise((resolve, reject) => {
    pending.push({ run, resolve, reject });
    pump();
  });
}
