<template>
  <div v-if="open" class="bulk-actions__dialog" role="presentation">
    <div
      ref="panel"
      class="bulk-actions__dialog-panel"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
    >
      <h2 :id="titleId" class="bulk-actions__dialog-title">{{ $t('bulk-actions-leave-title') }}</h2>
      <p class="bulk-actions__dialog-lead">{{ $t('bulk-actions-leave-lead') }}</p>
      <div class="bulk-actions__dialog-actions">
        <button type="button" class="button" @click="$emit('stay')">
          {{ $t('bulk-actions-leave-stay') }}
        </button>
        <button ref="confirmBtn" type="button" class="button button--confirm" @click="$emit('leave')">
          {{ $t('bulk-actions-leave-confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
  let leaveSeq = 0;

  export default {
    name: 'BulkLeaveDialog',
    props: {
      open: { type: Boolean, default: false },
    },
    data() {
      leaveSeq += 1;
      return { titleId: `bulk-leave-title-${leaveSeq}` };
    },
    watch: {
      open: {
        immediate: true,
        handler(value) {
          if (!value) return;
          this.$nextTick(() => {
            const target = this.$refs.confirmBtn || this.$refs.panel;
            if (target && typeof target.focus === 'function') target.focus();
          });
        },
      },
    },
  };
</script>
