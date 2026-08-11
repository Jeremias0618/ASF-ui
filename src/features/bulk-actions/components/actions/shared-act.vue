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
          {{ $t('bulk-actions-invalid-target-shared') }}
        </p>
      </label>

      <fieldset class="bulk-actions-choice">
        <legend class="bulk-actions-field__label">{{ $t('bulk-action-shared-vote-label') }}</legend>
        <div class="bulk-actions-choice__row">
          <label class="bulk-actions-choice__option" :class="{ 'is-on': vote === 'like' }">
            <input v-model="vote" type="radio" value="like">
            {{ $t('bulk-action-shared-vote-like') }}
          </label>
          <label class="bulk-actions-choice__option" :class="{ 'is-on': vote === 'dislike' }">
            <input v-model="vote" type="radio" value="dislike">
            {{ $t('bulk-action-shared-vote-dislike') }}
          </label>
          <label class="bulk-actions-choice__option" :class="{ 'is-on': vote === '' }">
            <input v-model="vote" type="radio" value="">
            {{ $t('bulk-action-shared-vote-none') }}
          </label>
        </div>
      </fieldset>

      <label class="bulk-actions-toggle" :class="{ 'is-on': favorite }">
        <input v-model="favorite" type="checkbox">
        <span>{{ $t('bulk-action-shared-favorite') }}</span>
      </label>
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
  import { flattenMutationResults, sharedFilesAct } from '../../api/bulk-social';
  import { createBulkRunner } from '../../composables/use-bulk-runner';
  import { isValidBulkTarget } from '../../utils/validate-target';
  import BulkConfirmDialog from '../confirm-dialog.vue';
  import BulkProgressModal from '../progress-modal.vue';

  let sharedTargetErrorSeq = 0;

  export default {
    name: 'BulkSharedActAction',
    components: { BulkConfirmDialog, BulkProgressModal },
    props: {
      action: { type: Object, required: true },
      bots: { type: Array, default: () => [] },
    },
    data() {
      sharedTargetErrorSeq += 1;
      return {
        target: '',
        targetTouched: false,
        targetErrorId: `bulk-shared-target-error-${sharedTargetErrorSeq}`,
        vote: 'like',
        favorite: false,
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
        return this.botNames.length > 0
          && this.targetValid
          && (Boolean(this.vote) || this.favorite);
      },
      confirmLines() {
        const lines = [
          this.$t('bulk-actions-confirm-bots', { n: this.botNames.length }),
          this.$t('bulk-actions-confirm-target', { target: this.target }),
        ];
        if (this.vote) lines.push(this.$t('bulk-actions-confirm-vote', { vote: this.vote }));
        if (this.favorite) lines.push(this.$t('bulk-actions-confirm-favorite'));
        return lines;
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
        const vote = this.vote || null;
        const { favorite } = this;
        try {
          await this.runner.runSteps([{
            label: url,
            run: async () => {
              try {
                const payload = await sharedFilesAct(botNames, { url, vote, favorite });
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
