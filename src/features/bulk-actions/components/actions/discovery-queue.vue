<template>
  <section class="bulk-actions-setup-panel" :aria-label="title">
    <div class="bulk-actions-setup-panel__body">
      <div class="bulk-actions-choice bulk-actions-discovery-queues">
        <p class="bulk-actions-field__label" id="bulk-discovery-queues-label">
          {{ $t('bulk-action-discovery-queues-label') }}
        </p>
        <div
          class="bulk-actions-choice__row"
          role="radiogroup"
          aria-labelledby="bulk-discovery-queues-label"
        >
          <label
            v-for="opt in queueOptions"
            :key="opt.value"
            class="bulk-actions-choice__option"
            :class="{ 'is-on': queues === opt.value }"
          >
            <input
              v-model.number="queues"
              type="radio"
              name="bulk-discovery-queues"
              :value="opt.value"
              :disabled="busy"
            >
            {{ opt.label }}
          </label>
        </div>
        <p class="bulk-actions-discovery-queues__hint">
          {{ $t('bulk-action-discovery-queues-hint') }}
        </p>
      </div>
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
      :summary-target="summaryTarget"
      :bots-total="botNames.length"
      @cancel="runner.cancel()"
      @close="onProgressClose"
    ></BulkProgressModal>
  </section>
</template>

<script>
  import { isPluginMissingError } from '../../../bot-social/api/bot-social';
  import { exploreDiscoveryQueues, flattenDiscoveryExploreResults } from '../../api/bulk-social';
  import { summarizeMutationResults } from '../../utils/result-outcomes';
  import { createBulkRunner } from '../../composables/use-bulk-runner';
  import BulkConfirmDialog from '../confirm-dialog.vue';
  import BulkProgressModal from '../progress-modal.vue';

  export default {
    name: 'BulkDiscoveryQueueAction',
    components: { BulkConfirmDialog, BulkProgressModal },
    props: {
      action: { type: Object, required: true },
      bots: { type: Array, default: () => [] },
    },
    data() {
      return {
        queues: 1,
        openConfirm: false,
        progressOpen: false,
        busy: false,
        completedOk: false,
        runner: createBulkRunner(),
      };
    },
    computed: {
      title() {
        return this.$t(this.action.titleKey);
      },
      botNames() {
        return this.bots.map(bot => bot.name).filter(Boolean);
      },
      canSubmit() {
        return this.botNames.length > 0 && this.queues >= 1 && this.queues <= 3;
      },
      queueOptions() {
        return [
          { value: 1, label: this.$t('bot-social-games-discovery-queues-one') },
          { value: 2, label: this.$t('bot-social-games-discovery-queues-two') },
          { value: 3, label: this.$t('bot-social-games-discovery-queues-three') },
        ];
      },
      summaryTarget() {
        return this.$t('bulk-action-discovery-summary-queues', { n: this.queues });
      },
      confirmLines() {
        return [
          this.$t('bulk-actions-confirm-bots', { n: this.botNames.length }),
          this.$t('bulk-action-discovery-confirm-queues', { n: this.queues }),
        ];
      },
    },
    methods: {
      requestConfirm() {
        if (!this.canSubmit || this.busy) return;
        this.openConfirm = true;
      },
      async onConfirm() {
        this.openConfirm = false;
        this.busy = true;
        this.progressOpen = true;
        this.completedOk = false;
        const botNames = this.botNames.slice();
        const { queues } = this;
        try {
          await this.runner.runSteps([{
            label: this.summaryTarget,
            run: async () => {
              try {
                const payload = await exploreDiscoveryQueues(botNames, queues);
                return flattenDiscoveryExploreResults(payload);
              } catch (err) {
                if (isPluginMissingError(err)) this.$emit('plugin-missing');
                throw err;
              }
            },
          }]);
          const summary = summarizeMutationResults(this.runner.results);
          this.completedOk = summary.ok > 0 || summary.skipped > 0;
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
