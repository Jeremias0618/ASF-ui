<template>
  <section class="bulk-actions-setup-panel" :aria-label="title">
    <BulkJobBanner
      v-if="jobBlocked && blockedJob"
      :job="blockedJob"
      :show-resume="false"
    ></BulkJobBanner>

    <div class="bulk-actions-setup-panel__body">
      <label class="bulk-actions-field">
        <span class="bulk-actions-field__label">{{ $t(action.targetLabelKey) }}</span>
        <input
          v-model.trim="target"
          class="bulk-actions-field__control"
          :class="{ 'is-invalid': showTargetError }"
          type="text"
          autocomplete="off"
          spellcheck="false"
          :placeholder="$t(action.targetPlaceholderKey)"
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
          {{ $t('bulk-actions-invalid-target-review') }}
        </p>
      </label>

      <fieldset class="bulk-actions-choice" :disabled="busy || jobBlocked">
        <legend class="bulk-actions-field__label">{{ $t('bulk-action-reviews-vote-label') }}</legend>
        <div class="bulk-actions-choice__row">
          <label class="bulk-actions-choice__option" :class="{ 'is-on': vote === 'yes' }">
            <input v-model="vote" type="radio" value="yes">
            {{ $t('bulk-action-reviews-vote-yes') }}
          </label>
          <label class="bulk-actions-choice__option" :class="{ 'is-on': vote === 'no' }">
            <input v-model="vote" type="radio" value="no">
            {{ $t('bulk-action-reviews-vote-no') }}
          </label>
          <label class="bulk-actions-choice__option" :class="{ 'is-on': vote === 'funny' }">
            <input v-model="vote" type="radio" value="funny">
            {{ $t('bulk-action-reviews-vote-funny') }}
          </label>
        </div>
      </fieldset>
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
      :summary-target="target.trim()"
      :bots-total="botNames.length"
      :paced="true"
      @cancel="onBulkProgressCancel"
      @close="onBulkProgressClose"
    ></BulkProgressModal>
  </section>
</template>

<script>
  import { isPluginMissingError } from '../../../bot-social/api/bot-social';
  import { flattenMutationResults, reviewsVote } from '../../api/bulk-social';
  import { createBulkRunner } from '../../composables/use-bulk-runner';
  import bulkJobLifecycle from '../../mixins/bulk-job-lifecycle';
  import { isValidBulkTarget } from '../../utils/validate-target';
  import BulkConfirmDialog from '../confirm-dialog.vue';
  import BulkJobBanner from '../job-banner.vue';
  import BulkProgressModal from '../progress-modal.vue';

  let reviewTargetErrorSeq = 0;

  export default {
    name: 'BulkReviewsVoteAction',
    components: { BulkConfirmDialog, BulkJobBanner, BulkProgressModal },
    mixins: [bulkJobLifecycle],
    props: {
      action: { type: Object, required: true },
      bots: { type: Array, default: () => [] },
    },
    data() {
      reviewTargetErrorSeq += 1;
      return {
        target: '',
        targetTouched: false,
        targetErrorId: `bulk-review-target-error-${reviewTargetErrorSeq}`,
        vote: 'yes',
        openConfirm: false,
        runner: createBulkRunner(),
      };
    },
    computed: {
      title() { return this.$t(this.action.titleKey); },
      botNames() { return this.bots.map(b => b.name); },
      targetValid() {
        return isValidBulkTarget(this.action, this.target);
      },
      showTargetError() {
        return this.targetTouched && Boolean(this.target.trim()) && !this.targetValid;
      },
      canSubmit() {
        return this.botNames.length > 0 && this.targetValid && Boolean(this.vote) && !this.jobBlocked;
      },
      confirmLines() {
        return [
          this.$t('bulk-actions-confirm-bots', { n: this.botNames.length }),
          this.$t('bulk-actions-confirm-target', { target: this.target }),
          this.$t('bulk-actions-confirm-vote', { vote: this.vote }),
          this.$t('bulk-actions-confirm-paced'),
        ];
      },
    },
    methods: {
      applyJobParams(job) {
        if (job.params?.target) this.target = String(job.params.target);
        if (job.params?.vote) this.vote = String(job.params.vote);
      },
      requestConfirm() {
        this.targetTouched = true;
        if (!this.canSubmit || this.busy) return;
        this.openConfirm = true;
      },
      async onConfirm() {
        this.openConfirm = false;
        const job = this.beginBulkJob({
          params: { target: this.target.trim(), vote: this.vote },
          botNames: this.botNames.slice(),
          summaryTarget: this.target.trim(),
        });
        if (!job) return;
        await this.continueBulkJob(job);
      },
      async continueBulkJob(job) {
        const url = String(job.params.target || this.target).trim();
        const vote = String(job.params.vote || this.vote);
        await this.executePacedJob(job, async botName => {
          try {
            const payload = await reviewsVote([botName], { url, vote });
            return flattenMutationResults(payload);
          } catch (err) {
            if (isPluginMissingError(err)) this.$emit('plugin-missing');
            throw err;
          }
        });
      },
    },
  };
</script>
