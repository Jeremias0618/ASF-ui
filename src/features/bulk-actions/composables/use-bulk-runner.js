/**
 * Cooperative bulk runner state for Vue 2 (plain mutable object).
 * @returns {{
 *   running: boolean,
 *   cancelled: boolean,
 *   current: number,
 *   total: number,
 *   label: string,
 *   results: object[],
 *   reset: () => void,
 *   cancel: () => void,
 *   runSteps: (steps: { label: string, run: () => Promise<object|object[]> }[]) => Promise<object[]>,
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
     */
    async runSteps(steps) {
      state.running = true;
      state.cancelled = false;
      state.current = 0;
      state.total = steps.length;
      state.label = '';
      state.results = [];
      const all = [];

      for (let i = 0; i < steps.length; i += 1) {
        if (state.cancelled) break;
        const step = steps[i];
        state.current = i + 1;
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
