<template>
  <div v-if="open" class="bulk-actions__dialog" role="presentation">
    <div
      ref="panel"
      class="bulk-run-modal"
      :class="{ 'is-running': running, 'is-done': !running }"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-busy="running ? 'true' : 'false'"
      tabindex="-1"
    >
      <template v-if="running">
        <header class="bulk-run-modal__head">
          <h2 :id="titleId" class="bulk-run-modal__title">
            {{ $t('bulk-actions-progress-title') }}
          </h2>

          <p
            v-if="!isIndeterminate"
            class="bulk-run-modal__fraction"
            aria-live="polite"
          >
            <span class="bulk-run-modal__fraction-current">{{ current }}</span>
            <span class="bulk-run-modal__fraction-sep">/</span>
            <span class="bulk-run-modal__fraction-total">{{ total }}</span>
          </p>
          <p
            v-else
            class="bulk-run-modal__fraction bulk-run-modal__fraction--busy"
            aria-live="polite"
          >
            <FontAwesomeIcon icon="spinner" spin aria-hidden="true"></FontAwesomeIcon>
            <span>{{ $t('bulk-actions-progress-bots', { n: botsTotal || total || 0 }) }}</span>
          </p>

          <p v-if="summaryTarget" class="bulk-run-modal__target" :title="summaryTarget">
            {{ summaryTarget }}
          </p>
        </header>

        <div
          class="bulk-run-modal__track"
          :class="{ 'is-indeterminate': isIndeterminate }"
          role="progressbar"
          :aria-valuenow="isIndeterminate ? null : current"
          :aria-valuemin="0"
          :aria-valuemax="isIndeterminate ? null : total"
          :aria-label="$t('bulk-actions-progress-title')"
        >
          <span
            class="bulk-run-modal__fill"
            :style="isIndeterminate ? null : { width: `${percent}%` }"
          ></span>
        </div>

        <p v-if="paced && !isIndeterminate" class="bulk-run-modal__pace-hint">
          {{ $t('bulk-actions-progress-pace-hint') }}
        </p>

        <footer class="bulk-run-modal__foot">
          <button type="button" class="button bulk-run-modal__stop" @click="$emit('cancel')">
            {{ $t('bulk-actions-progress-cancel') }}
          </button>
        </footer>
      </template>

      <template v-else>
        <header class="bulk-run-modal__head">
          <h2 :id="titleId" class="bulk-run-modal__title">
            {{ $t('bulk-actions-results-title') }}
          </h2>
          <p v-if="summaryTarget" class="bulk-run-modal__target bulk-run-modal__target--result" :title="summaryTarget">
            {{ $t('bulk-actions-results-target', { target: summaryTarget }) }}
          </p>
        </header>

        <dl class="bulk-run-modal__summary">
          <div class="bulk-run-modal__stat">
            <dt>{{ $t('bulk-actions-results-bots-label') }}</dt>
            <dd>{{ botsInvolved }}</dd>
          </div>
          <div class="bulk-run-modal__stat is-ok">
            <dt>{{ $t('bulk-actions-results-ok-label') }}</dt>
            <dd>{{ summary.ok }}</dd>
          </div>
          <div class="bulk-run-modal__stat is-skip">
            <dt>{{ $t('bulk-actions-results-skipped-label') }}</dt>
            <dd>{{ summary.skipped }}</dd>
          </div>
          <div class="bulk-run-modal__stat is-fail">
            <dt>{{ $t('bulk-actions-results-fail-label') }}</dt>
            <dd>{{ summary.fail }}</dd>
          </div>
        </dl>

        <p v-if="summary.skipped" class="bulk-run-modal__skip-hint">
          {{ $t('bulk-actions-results-skipped-hint') }}
        </p>

        <footer class="bulk-run-modal__foot bulk-run-modal__foot--end">
          <button
            ref="doneBtn"
            type="button"
            class="button button--confirm bulk-run-modal__done"
            @click="$emit('close')"
          >
            {{ $t('bulk-actions-done') }}
          </button>
        </footer>
      </template>
    </div>
  </div>
</template>

<script>
  import { summarizeMutationResults } from '../utils/result-outcomes';

  let progressSeq = 0;

  export default {
    name: 'BulkProgressModal',
    props: {
      open: { type: Boolean, default: false },
      running: { type: Boolean, default: false },
      current: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      label: { type: String, default: '' },
      results: { type: Array, default: () => [] },
      summaryTarget: { type: String, default: '' },
      botsTotal: { type: Number, default: 0 },
      paced: { type: Boolean, default: false },
    },
    data() {
      progressSeq += 1;
      return { titleId: `bulk-progress-title-${progressSeq}` };
    },
    computed: {
      isIndeterminate() {
        return this.total <= 1 && this.botsTotal > 1;
      },
      percent() {
        if (!this.total) return 0;
        return Math.min(100, Math.round((this.current / this.total) * 100));
      },
      summary() {
        return summarizeMutationResults(this.results);
      },
      botsInvolved() {
        if (this.summary.total) return this.summary.total;
        if (this.botsTotal > 0) return this.botsTotal;
        return this.total || 0;
      },
    },
    watch: {
      open: {
        immediate: true,
        handler(value) {
          if (!value) return;
          this.focusPanel();
        },
      },
      running(value, previous) {
        if (previous && !value) this.focusPanel();
      },
    },
    methods: {
      focusPanel() {
        this.$nextTick(() => {
          const target = this.$refs.doneBtn || this.$refs.panel;
          if (target && typeof target.focus === 'function') target.focus();
        });
      },
    },
  };
</script>
