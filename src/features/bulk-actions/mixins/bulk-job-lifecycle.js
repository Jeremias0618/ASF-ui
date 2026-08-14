/**
 * Shared lifecycle for paced bulk runs: global lock, resume after reload, progress close.
 * Host components must provide `runner` (createBulkRunner) and optional `applyJobParams(job)`.
 */

import { summarizeMutationResults } from '../utils/result-outcomes';
import {
  clearBulkJob,
  finishBulkJob,
  getBulkBlockState,
  readBulkJob,
  runPacedPerBot,
  tryStartBulkJob,
} from '../utils/bulk-run';
import { writeSelectedBotNames } from '../utils/action-session';

export default {
  data() {
    return {
      jobBlocked: false,
      blockedJob: null,
      progressOpen: false,
      busy: false,
      completedOk: false,
      _bulkResuming: false,
    };
  },
  computed: {
    runDisabled() {
      return this.busy || this.jobBlocked || !this.canSubmit;
    },
    blockedJobTitle() {
      const slug = this.blockedJob && this.blockedJob.actionSlug;
      if (!slug) return '';
      return String(slug);
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.bootstrapBulkJob();
    });
  },
  methods: {
    bootstrapBulkJob() {
      const slug = String(this.action?.slug || '').toLowerCase();
      if (!slug) return;

      const { blocked, job } = getBulkBlockState(slug);
      if (blocked) {
        this.jobBlocked = true;
        this.blockedJob = job;
        return;
      }

      if (!job) return;

      const sameAction = String(job.actionSlug || '').toLowerCase() === slug;
      if (!sameAction) return;

      if (typeof this.applyJobParams === 'function') {
        this.applyJobParams(job);
      }

      if (job.status === 'running') {
        this.resumeBulkFromJob(job);
        return;
      }

      if (job.status === 'done' || job.status === 'cancelled') {
        this.runner.results = Array.isArray(job.results) ? job.results.slice() : [];
        this.runner.running = false;
        this.runner.current = job.botNames?.length || this.runner.results.length;
        this.runner.total = job.botNames?.length || this.runner.results.length;
        this.progressOpen = true;
        const summary = summarizeMutationResults(this.runner.results);
        this.completedOk = summary.ok > 0 || summary.skipped > 0;
      }
    },

    /**
     * @param {{ params?: object, botNames: string[], summaryTarget?: string }} input
     * @returns {object|null}
     */
    beginBulkJob(input) {
      const job = tryStartBulkJob({
        actionSlug: this.action.slug,
        actionId: this.action.id,
        kind: this.action.kind,
        api: this.action.api || input.api || '',
        params: input.params || {},
        botNames: input.botNames,
        summaryTarget: input.summaryTarget || '',
      });
      if (!job) {
        this.jobBlocked = true;
        this.blockedJob = readBulkJob();
        return null;
      }
      writeSelectedBotNames(this.action.slug, job.botNames);
      this.jobBlocked = false;
      this.blockedJob = null;
      return job;
    },

    /**
     * @param {object} job
     * @param {(botName: string) => Promise<object|object[]>} runForBot
     * @param {{ api?: string, labelForBot?: (botName: string) => string }} [opts]
     */
    async executePacedJob(job, runForBot, opts = {}) {
      this.busy = true;
      this.progressOpen = true;
      this.completedOk = false;
      try {
        await runPacedPerBot({
          runner: this.runner,
          botNames: job.botNames,
          api: opts.api || this.action.api || job.api,
          startIndex: job.nextIndex || 0,
          initialResults: Array.isArray(job.results) ? job.results : [],
          labelForBot: opts.labelForBot,
          runForBot,
        });
        const cancelled = this.runner.cancelled;
        finishBulkJob(cancelled ? 'cancelled' : 'done', this.runner.results);
        const summary = summarizeMutationResults(this.runner.results);
        this.completedOk = summary.ok > 0 || summary.skipped > 0;
      } finally {
        this.busy = false;
        this._bulkResuming = false;
      }
    },

    async resumeBulkFromJob(job) {
      if (this._bulkResuming || this.busy) return;
      this._bulkResuming = true;
      if (typeof this.continueBulkJob === 'function') {
        await this.continueBulkJob(job);
        return;
      }
      this._bulkResuming = false;
    },

    onBulkProgressCancel() {
      this.runner.cancel();
    },

    onBulkProgressClose() {
      clearBulkJob();
      this.progressOpen = false;
      this.runner.reset();
      this.jobBlocked = false;
      this.blockedJob = null;
      if (this.completedOk) {
        this.$emit('finished');
        return;
      }
      if (typeof this.afterProgressCloseIncomplete === 'function') {
        this.afterProgressCloseIncomplete();
      }
    },
  },
};
