<template>
  <section class="bulk-actions-setup-panel" :aria-label="title">
    <BulkJobBanner
      v-if="jobBlocked && blockedJob"
      :job="blockedJob"
      :show-resume="false"
    ></BulkJobBanner>

    <div class="bulk-actions-setup-panel__body">
      <label class="bulk-actions-field">
        <span class="bulk-actions-field__label">{{ targetLabel }}</span>
        <input
          v-model.trim="target"
          class="bulk-actions-field__control"
          :class="{ 'is-invalid': showTargetError }"
          type="text"
          autocomplete="off"
          spellcheck="false"
          :placeholder="targetPlaceholder"
          :disabled="busy || jobBlocked"
          :aria-invalid="showTargetError ? 'true' : 'false'"
          :aria-describedby="showTargetError ? targetErrorId : null"
          @blur="targetTouched = true"
        >
        <p
          v-if="showTargetError"
          :id="targetErrorId"
          class="bulk-actions-field__error"
          role="alert"
        >
          {{ $t(targetErrorKey) }}
        </p>
      </label>
    </div>

    <footer class="bulk-actions-setup-bar">
      <div class="bulk-actions-setup-bar__copy">
        <p class="bulk-actions-setup-bar__hint">{{ $t('bulk-actions-setup-hint-paced') }}</p>
      </div>
      <button
        type="button"
        class="button button--confirm bulk-actions-setup-bar__cta"
        :disabled="runDisabled"
        @click="requestConfirm"
      >
        {{ $t('bulk-actions-run') }}
        <FontAwesomeIcon icon="play" aria-hidden="true"></FontAwesomeIcon>
      </button>
    </footer>

    <BulkConfirmDialog
      :open="openConfirm"
      :title="$t('bulk-actions-confirm-title')"
      :lead="$t('bulk-actions-confirm-lead')"
      :lines="confirmLines"
      :warning="$t('bulk-actions-confirm-warning-paced')"
      :confirmLabel="$t('bulk-actions-run')"
      @cancel="openConfirm = false"
      @confirm="onConfirm"
    ></BulkConfirmDialog>

    <BulkProgressModal
      :open="progressOpen"
      :running="runner.running"
      :current="runner.current"
      :total="runner.total"
      :label="runner.label"
      :results="runner.results"
      :summary-target="progressTarget"
      :bots-total="botNames.length"
      :paced="true"
      @cancel="onBulkProgressCancel"
      @close="onBulkProgressClose"
    ></BulkProgressModal>
  </section>
</template>

<script>
  import { isPluginMissingError } from '../../../bot-social/api/bot-social';
  import { flattenMutationResults, runUrlBotsApi } from '../../api/bulk-social';
  import { createBulkRunner } from '../../composables/use-bulk-runner';
  import bulkJobLifecycle from '../../mixins/bulk-job-lifecycle';
  import {
    bulkTargetErrorKey,
    getBulkTargetKind,
    isValidBulkTarget,
    normalizeBulkTarget,
  } from '../../utils/validate-target';
  import BulkConfirmDialog from '../confirm-dialog.vue';
  import BulkJobBanner from '../job-banner.vue';
  import BulkProgressModal from '../progress-modal.vue';

  let targetErrorSeq = 0;

  export default {
    name: 'BulkUrlBotsAction',
    components: { BulkConfirmDialog, BulkJobBanner, BulkProgressModal },
    mixins: [bulkJobLifecycle],
    props: {
      action: { type: Object, required: true },
      bots: { type: Array, default: () => [] },
    },
    data() {
      targetErrorSeq += 1;
      return {
        target: '',
        targetTouched: false,
        targetErrorId: `bulk-target-error-${targetErrorSeq}`,
        openConfirm: false,
        runner: createBulkRunner(),
      };
    },
    computed: {
      title() { return this.$t(this.action.titleKey); },
      targetLabel() { return this.$t(this.action.targetLabelKey); },
      targetPlaceholder() { return this.$t(this.action.targetPlaceholderKey); },
      botNames() { return this.bots.map(b => b.name); },
      targetValid() {
        return isValidBulkTarget(this.action, this.target);
      },
      targetErrorKey() {
        return bulkTargetErrorKey(getBulkTargetKind(this.action));
      },
      showTargetError() {
        return this.targetTouched && Boolean(this.target.trim()) && !this.targetValid;
      },
      canSubmit() {
        return this.botNames.length > 0 && this.targetValid && !this.jobBlocked;
      },
      progressTarget() {
        return this.target.trim();
      },
      confirmLines() {
        return [
          this.$t('bulk-actions-confirm-bots', { n: this.botNames.length }),
          this.$t('bulk-actions-confirm-target', { target: this.target.trim() }),
          this.$t('bulk-actions-confirm-paced'),
        ];
      },
    },
    methods: {
      applyJobParams(job) {
        if (job.params && job.params.target) {
          this.target = String(job.params.target);
        }
      },
      requestConfirm() {
        this.targetTouched = true;
        if (!this.canSubmit || this.busy) return;
        this.openConfirm = true;
      },
      async onConfirm() {
        this.openConfirm = false;
        const botNames = this.botNames.slice();
        const targetRaw = this.target.trim();
        const target = normalizeBulkTarget(this.action, this.target);
        const job = this.beginBulkJob({
          params: { target: targetRaw },
          botNames,
          summaryTarget: target,
        });
        if (!job) return;
        await this.continueBulkJob(job);
      },
      async continueBulkJob(job) {
        const target = normalizeBulkTarget(this.action, job.params.target || this.target);
        await this.executePacedJob(job, async botName => {
          try {
            const payload = await runUrlBotsApi(this.action.api, [botName], { target });
            return flattenMutationResults(payload);
          } catch (err) {
            if (err && err.message === 'INVALID_APP_ID') {
              throw new Error(this.$t('bulk-actions-invalid-appid'));
            }
            if (isPluginMissingError(err)) this.$emit('plugin-missing');
            throw err;
          }
        });
      },
    },
  };
</script>
