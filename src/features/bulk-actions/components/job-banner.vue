<template>
  <div v-if="job" class="bulk-actions__banner bulk-actions__banner--job" role="status">
    <strong>{{ $t('bulk-actions-job-active-title') }}</strong>
    <p>
      {{ $t('bulk-actions-job-active-body', {
        action: actionLabel,
        current: progressCurrent,
        total: progressTotal,
      }) }}
    </p>
    <div class="bulk-actions__banner-actions">
      <button
        v-if="showResume"
        type="button"
        class="button button--confirm"
        @click="$emit('resume')"
      >
        {{ $t('bulk-actions-job-resume') }}
      </button>
      <p v-else class="bulk-actions__banner-note">
        {{ $t('bulk-actions-job-block-other') }}
      </p>
    </div>
  </div>
</template>

<script>
  import { getBulkAction } from '../constants/actions';

  export default {
    name: 'BulkJobBanner',
    props: {
      job: { type: Object, default: null },
      /** When true, show Resume CTA (same action or hub). */
      showResume: { type: Boolean, default: true },
    },
    computed: {
      actionLabel() {
        if (!this.job) return '';
        const action = getBulkAction(this.job.actionSlug || this.job.actionId);
        if (!action) return this.job.actionSlug || '';
        return this.$t(action.titleKey);
      },
      progressCurrent() {
        if (!this.job) return 0;
        return Math.min(
          Number(this.job.nextIndex) || 0,
          (this.job.botNames && this.job.botNames.length) || 0,
        );
      },
      progressTotal() {
        if (!this.job || !Array.isArray(this.job.botNames)) return 0;
        return this.job.botNames.length;
      },
    },
  };
</script>
