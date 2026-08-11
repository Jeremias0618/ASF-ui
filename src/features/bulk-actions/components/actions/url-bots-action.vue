<template>
  <section class="bulk-actions__panel" :aria-label="title">
    <header class="bulk-actions__panel-header">
      <button type="button" class="button button--link bulk-actions__back" @click="$emit('back')">
        <FontAwesomeIcon icon="chevron-left" aria-hidden="true"></FontAwesomeIcon>
        {{ $t('bulk-actions-bots-change') }}
      </button>
    </header>

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
  import BulkConfirmDialog from '../confirm-dialog.vue';
  import BulkProgressModal from '../progress-modal.vue';

  export default {
    name: 'BulkUrlBotsAction',
    components: { BulkConfirmDialog, BulkProgressModal },
    props: {
      action: { type: Object, required: true },
      bots: { type: Array, default: () => [] },
    },
    data() {
      return {
        target: '',
        openConfirm: false,
        progressOpen: false,
        busy: false,
        runner: createBulkRunner(),
        completedOk: false,
      };
    },
    computed: {
      title() { return this.$t(this.action.titleKey); },
      targetLabel() { return this.$t(this.action.targetLabelKey); },
      targetPlaceholder() { return this.$t(this.action.targetPlaceholderKey); },
      botNames() { return this.bots.map(b => b.name); },
      canSubmit() {
        return this.botNames.length > 0 && Boolean(this.target.trim());
      },
      confirmLines() {
        return [
          this.$t('bulk-actions-confirm-bots', { n: this.botNames.length }),
          this.$t('bulk-actions-confirm-target', { target: this.target }),
        ];
      },
    },
    methods: {
      async onConfirm() {
        this.openConfirm = false;
        this.busy = true;
        this.progressOpen = true;
        this.completedOk = false;
        const botNames = this.botNames.slice();
        const target = this.target.trim();
        try {
          await this.runner.runSteps([{
            label: botNames.join(', '),
            run: async () => {
              try {
                const payload = await runUrlBotsApi(this.action.api, botNames, { target });
                return flattenMutationResults(payload);
              } catch (err) {
                if (err && err.message === 'INVALID_APP_ID') {
                  throw new Error(this.$t('bulk-actions-invalid-appid'));
                }
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
