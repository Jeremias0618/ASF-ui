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
      <span class="bulk-actions__field-label">{{ targetLabel }}</span>
      <input
        v-model.trim="target"
        class="bulk-actions__input"
        type="text"
        autocomplete="off"
        spellcheck="false"
        :placeholder="targetPlaceholder"
        :disabled="busy"
      >
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
  import { flattenMutationResults, runUrlBotsApi } from '../../api/bulk-social';
  import { createBulkRunner } from '../../composables/use-bulk-runner';
  import BulkBotPicker from '../bot-picker.vue';
  import BulkConfirmDialog from '../confirm-dialog.vue';
  import BulkProgressModal from '../progress-modal.vue';

  export default {
    name: 'BulkUrlBotsAction',
    components: { BulkBotPicker, BulkConfirmDialog, BulkProgressModal },
    props: {
      action: { type: Object, required: true },
      bots: { type: Array, default: () => [] },
    },
    data() {
      return {
        selectedBots: [],
        target: '',
        openConfirm: false,
        progressOpen: false,
        busy: false,
        runner: createBulkRunner(),
      };
    },
    computed: {
      title() {
        return this.$t(this.action.titleKey);
      },
      lead() {
        return this.$t(this.action.leadKey);
      },
      targetLabel() {
        return this.$t(this.action.targetLabelKey);
      },
      targetPlaceholder() {
        return this.$t(this.action.targetPlaceholderKey);
      },
      canSubmit() {
        return this.selectedBots.length > 0 && Boolean(this.target.trim());
      },
      confirmLines() {
        return [
          this.$t('bulk-actions-confirm-bots', { n: this.selectedBots.length }),
          this.$t('bulk-actions-confirm-target', { target: this.target }),
        ];
      },
    },
    methods: {
      async onConfirm() {
        this.openConfirm = false;
        this.busy = true;
        this.progressOpen = true;
        const botNames = this.selectedBots.slice();
        const target = this.target.trim();

        try {
          await this.runner.runSteps([{
            label: botNames.join(', '),
            run: async () => {
              try {
                const payload = await runUrlBotsApi(this.action.api, botNames, { target });
                return flattenMutationResults(payload);
              } catch (err) {
                if (err?.message === 'INVALID_APP_ID') {
                  throw new Error(this.$t('bulk-actions-invalid-appid'));
                }
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
