<template>
  <section class="bulk-actions-setup-panel" :aria-label="title">
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
          :disabled="busy"
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

      <fieldset class="bulk-actions-choice">
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
        <p class="bulk-actions-setup-bar__hint">{{ $t('bulk-actions-setup-hint') }}</p>
      </div>
      <button
        type="button"
        class="button button--confirm bulk-actions-setup-bar__cta"
        :disabled="!canSubmit || busy"
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
      :warning="$t('bulk-actions-confirm-warning')"
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
      @cancel="runner.cancel()"
      @close="onProgressClose"
    ></BulkProgressModal>
  </section>
</template>

<script>
  import { isPluginMissingError } from '../../../bot-social/api/bot-social';
  import { flattenMutationResults, reviewsVote } from '../../api/bulk-social';
  import { createBulkRunner } from '../../composables/use-bulk-runner';
  import { isValidBulkTarget } from '../../utils/validate-target';
  import BulkConfirmDialog from '../confirm-dialog.vue';
  import BulkProgressModal from '../progress-modal.vue';

  let reviewTargetErrorSeq = 0;

  export default {
    name: 'BulkReviewsVoteAction',
    components: { BulkConfirmDialog, BulkProgressModal },
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
        progressOpen: false,
        busy: false,
        runner: createBulkRunner(),
        completedOk: false,
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
        return this.botNames.length > 0 && this.targetValid && Boolean(this.vote);
      },
      confirmLines() {
        return [
          this.$t('bulk-actions-confirm-bots', { n: this.botNames.length }),
          this.$t('bulk-actions-confirm-target', { target: this.target }),
          this.$t('bulk-actions-confirm-vote', { vote: this.vote }),
        ];
      },
    },
    methods: {
      requestConfirm() {
        this.targetTouched = true;
        if (!this.canSubmit) return;
        this.openConfirm = true;
      },
      async onConfirm() {
        this.openConfirm = false;
        this.busy = true;
        this.progressOpen = true;
        this.completedOk = false;
        const botNames = this.botNames.slice();
        const url = this.target.trim();
        const { vote } = this;
        try {
          await this.runner.runSteps([{
            label: url,
            run: async () => {
              try {
                const payload = await reviewsVote(botNames, { url, vote });
                return flattenMutationResults(payload);
              } catch (err) {
                if (isPluginMissingError(err)) this.$emit('plugin-missing');
                throw err;
              }
            },
          }]);
          this.completedOk = this.runner.results.some(row => row.ok);
        } finally {
          this.busy = false;
        }
      },
      onProgressClose() {
        this.progressOpen = false;
        this.runner.reset();
        if (this.completedOk) this.$emit('finished');
      },
    },
  };
</script>
