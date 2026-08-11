<template>
  <section class="bulk-actions-setup-panel" :aria-label="title">
    <div class="bulk-actions-setup-panel__body">
      <label class="bulk-actions-field">
        <span class="bulk-actions-field__label">{{ $t(action.targetLabelKey) }}</span>
        <input
          v-model.trim="target"
          class="bulk-actions-field__control"
          type="text"
          autocomplete="off"
          spellcheck="false"
          :placeholder="$t(action.targetPlaceholderKey)"
          :disabled="busy"
        >
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
        @click="openConfirm = true"
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
      @cancel="runner.cancel()"
      @close="onProgressClose"
    ></BulkProgressModal>
  </section>
</template>

<script>
  import { isPluginMissingError } from '../../../bot-social/api/bot-social';
  import { flattenMutationResults, sharedFilesAct } from '../../api/bulk-social';
  import { createBulkRunner } from '../../composables/use-bulk-runner';
  import BulkConfirmDialog from '../confirm-dialog.vue';
  import BulkProgressModal from '../progress-modal.vue';

  export default {
    name: 'BulkSharedActAction',
    components: { BulkConfirmDialog, BulkProgressModal },
    props: {
      action: { type: Object, required: true },
      bots: { type: Array, default: () => [] },
    },
    data() {
      return {
        target: '',
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
      canSubmit() {
        return this.botNames.length > 0
          && Boolean(this.target.trim())
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
            label: botNames.join(', '),
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
