/**
 * Cooperative bulk runner state for Vue 2 (plain mutable object).
 * Supports per-step delays and resume from a checkpoint.
 */

/**
 * @param {number} ms
 * @param {() => boolean} isCancelled
 */
function sleepCancellable(ms, isCancelled) {
  if (ms <= 0) return Promise.resolve();
  return new Promise(resolve => {
    const started = Date.now();
    const tick = () => {
      if (isCancelled()) {
        resolve();
        return;
      }
      if (Date.now() - started >= ms) {
        resolve();
        return;
      }
      setTimeout(tick, Math.min(250, ms - (Date.now() - started)));
    };
    setTimeout(tick, Math.min(250, ms));
  });
}

/**
 * @returns {{
 *   running: boolean,
 *   cancelled: boolean,
 *   current: number,
 *   total: number,
 *   label: string,
 *   results: object[],
 *   reset: () => void,
 *   cancel: () => void,
 *   runSteps: (steps: { label: string, run: () => Promise<object|object[]> }[], opts?: object) => Promise<object[]>,
 * }}
 */
export function createBulkRunner() {
  const state = {
    running: false,
    cancelled: false,
    current: 0,
    total: 0,
    label: '',
    results: [],
    reset() {
      state.running = false;
      state.cancelled = false;
      state.current = 0;
      state.total = 0;
      state.label = '';
      state.results = [];
    },
    cancel() {
      state.cancelled = true;
    },
    /**
     * @param {{ label: string, run: () => Promise<object|object[]> }[]} steps
     * @param {{
     *   delayMs?: number,
     *   initialResults?: object[],
     *   startOffset?: number,
     *   onStepDone?: (info: { stepIndex: number, absoluteIndex: number, results: object[] }) => void,
     * }} [opts]
     */
    async runSteps(steps, opts = {}) {
      const delayMs = Math.max(0, Number(opts.delayMs) || 0);
      const startOffset = Math.max(0, Number(opts.startOffset) || 0);
      const initialResults = Array.isArray(opts.initialResults) ? opts.initialResults.slice() : [];

      state.running = true;
      state.cancelled = false;
      state.current = startOffset;
      state.total = startOffset + steps.length;
      state.label = '';
      state.results = initialResults;
      const all = initialResults.slice();

      for (let i = 0; i < steps.length; i += 1) {
        if (state.cancelled) break;
        const step = steps[i];
        const absoluteIndex = startOffset + i;
        state.current = absoluteIndex + 1;
        state.label = step.label;
        try {
          const raw = await step.run();
          const rows = Array.isArray(raw) ? raw : [raw];
          rows.forEach(row => all.push(row));
        } catch (err) {
          all.push({
            botName: step.label,
            ok: false,
            message: err?.message || String(err),
          });
        }
        state.results = all.slice();
        opts.onStepDone?.({
          stepIndex: i,
          absoluteIndex,
          results: all.slice(),
        });

        if (delayMs > 0 && i < steps.length - 1 && !state.cancelled) {
          await sleepCancellable(delayMs, () => state.cancelled);
        }
      }

      state.running = false;
      state.label = '';
      return all;
    },
  };

  return state;
}

/**
 * Split selected inventory items into transfer batches by source bot.
 * @param {{ botName: string, id?: string, assetId?: string }[]} items
 * @returns {{ sourceBotName: string, assetIds: string[] }[]}
 */
export function groupInventoryTransferBatches(items) {
  const map = new Map();
  (items || []).forEach(item => {
    const bot = String(item.botName || '').trim();
    const assetId = String(item.id || item.assetId || '').trim();
    if (!bot || !assetId) return;
    if (!map.has(bot)) map.set(bot, []);
    map.get(bot).push(assetId);
  });
  return Array.from(map.entries()).map(([sourceBotName, assetIds]) => ({
    sourceBotName,
    assetIds,
  }));
}
