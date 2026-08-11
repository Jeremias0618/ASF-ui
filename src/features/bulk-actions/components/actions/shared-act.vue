<template>
  <section class="bulk-actions__panel" :aria-label="title">
    <header class="bulk-actions__panel-header">
      <button type="button" class="button button--link bulk-actions__back" @click="$emit('back')">
        <FontAwesomeIcon icon="chevron-left" aria-hidden="true"></FontAwesomeIcon>
        {{ $t('back') }}
      </button>
      <h2 class="bulk-actions__panel-title">{{ title }}</h2>
      <p class="bulk-actions__panel-lead">{{ lead }}</p>
    </header>

    <BulkBotPicker :value="selectedBots" :bots="bots" @input="selectedBots = $event"></BulkBotPicker>

    <label class="bulk-actions__field">
      <span class="bulk-actions__field-label">{{ $t(action.targetLabelKey) }}</span>
      <input
        v-model.trim="target"
        class="bulk-actions__input"
        type="text"
        autocomplete="off"
        spellcheck="false"
        :placeholder="$t(action.targetPlaceholderKey)"
        :disabled="busy"
      >
    </label>

    <fieldset class="bulk-actions__fieldset">
      <legend class="bulk-actions__field-label">{{ $t('bulk-action-shared-vote-label') }}</legend>
      <label class="bulk-actions__radio">
        <input v-model="vote" type="radio" value="like">
        {{ $t('bulk-action-shared-vote-like') }}
      </label>
      <label class="bulk-actions__radio">
        <input v-model="vote" type="radio" value="dislike">
        {{ $t('bulk-action-shared-vote-dislike') }}
      </label>
      <label class="bulk-actions__radio">
        <input v-model="vote" type="radio" value="">
        {{ $t('bulk-action-shared-vote-none') }}
      </label>
    </fieldset>

    <label class="bulk-actions__check">
      <input v-model="favorite" type="checkbox">
      {{ $t('bulk-action-shared-favorite') }}
    </label>

    <div class="bulk-actions__panel-footer">
      <button
        type="button"
        class="button button--confirm"
        :disabled="!canSubmit || busy"
        @click="openConfirm = true"
      >
        {{ $t('bulk-actions-proceed') }}
      </button>
    </div>

    <BulkConfirmDialog
      :open="openConfirm"
      :title="$t('bulk-actions-confirm-title')"
      :lead="$t('bulk-actions-confirm-lead')"
      :lines="confirmLines"
      :warning="$t('bulk-actions-confirm-warning')"
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
  import BulkBotPicker from '../bot-picker.vue';
  import BulkConfirmDialog from '../confirm-dialog.vue';
  import BulkProgressModal from '../progress-modal.vue';

  export default {
    name: 'BulkSharedActAction',
    components: { BulkBotPicker, BulkConfirmDialog, BulkProgressModal },
    props: {
      action: { type: Object, required: true },
      bots: { type: Array, default: () => [] },
    },
    data() {
      return {
        selectedBots: [],
        target: '',
        vote: 'like',
        favorite: false,
        openConfirm: false,
        progressOpen: false,
        busy: false,
        runner: createBulkRunner(),
      };
    },
    computed: {
      title() { return this.$t(this.action.titleKey); },
      lead() { return this.$t(this.action.leadKey); },
      canSubmit() {
        return this.selectedBots.length > 0
          && Boolean(this.target.trim())
          && (Boolean(this.vote) || this.favorite);
      },
      confirmLines() {
        const lines = [
          this.$t('bulk-actions-confirm-bots', { n: this.selectedBots.length }),
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
        const botNames = this.selectedBots.slice();
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
        } finally {
          this.busy = false;
        }
      },
      onProgressClose() {
        this.progressOpen = false;
        this.runner.reset();
      },
    },
  };
</script>
