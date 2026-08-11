<template>
  <div v-if="open" class="bulk-actions__dialog" role="presentation">
    <div
      ref="panel"
      class="bulk-actions__dialog-panel bulk-actions__dialog-panel--progress"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-busy="running ? 'true' : 'false'"
      tabindex="-1"
    >
      <h2 :id="titleId" class="bulk-actions__dialog-title">
        {{ running ? $t('bulk-actions-progress-title') : $t('bulk-actions-results-title') }}
      </h2>

      <template v-if="running">
        <p class="bulk-actions__progress-label">
          {{ $t('bulk-actions-progress-status', { current, total, label }) }}
        </p>
        <div
          class="bulk-actions__progress-track"
          role="progressbar"
          :aria-valuenow="current"
          :aria-valuemin="0"
          :aria-valuemax="total"
        >
          <span class="bulk-actions__progress-fill" :style="{ width: `${percent}%` }"></span>
        </div>
        <button type="button" class="button" @click="$emit('cancel')">
          {{ $t('bulk-actions-progress-cancel') }}
        </button>
      </template>

      <template v-else>
        <p class="bulk-actions__dialog-lead">
          {{ $t('bulk-actions-results-summary', { ok: okCount, fail: failCount }) }}
        </p>
        <ul v-if="results.length" class="bulk-actions__results">
          <li
            v-for="(row, index) in results"
            :key="`${row.botName}-${index}`"
            class="bulk-actions__results-row"
            :class="{ 'is-ok': row.ok, 'is-fail': !row.ok }"
          >
            <strong>{{ row.botName }}</strong>
            <span>{{ row.message || (row.ok ? $t('bulk-actions-result-ok') : $t('bulk-actions-result-fail')) }}</span>
          </li>
        </ul>
        <div class="bulk-actions__dialog-actions">
          <button ref="doneBtn" type="button" class="button button--confirm" @click="$emit('close')">
            {{ $t('bulk-actions-done') }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
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
    },
    data() {
      progressSeq += 1;
      return { titleId: `bulk-progress-title-${progressSeq}` };
    },
    computed: {
      percent() {
        if (!this.total) return 0;
        return Math.min(100, Math.round((this.current / this.total) * 100));
      },
      okCount() {
        return this.results.filter(r => r.ok).length;
      },
      failCount() {
        return this.results.filter(r => !r.ok).length;
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
