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
      <h2 :id="titleId" class="bulk-actions__dialog-title">{{ title }}</h2>
      <p v-if="lead" class="bulk-actions__dialog-lead">{{ lead }}</p>
      <ul v-if="lines.length" class="bulk-actions__dialog-lines">
        <li v-for="(line, index) in lines" :key="index">{{ line }}</li>
      </ul>
      <p v-if="warning" class="bulk-actions__dialog-warn">{{ warning }}</p>
      <div class="bulk-actions__dialog-actions">
        <button type="button" class="button" @click="$emit('cancel')">
          {{ $t('cancel') }}
        </button>
        <button ref="confirmBtn" type="button" class="button button--confirm" @click="$emit('confirm')">
          {{ confirmLabel || $t('bulk-actions-confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
  let dialogSeq = 0;

  export default {
    name: 'BulkConfirmDialog',
    props: {
      open: { type: Boolean, default: false },
      title: { type: String, required: true },
      lead: { type: String, default: '' },
      lines: { type: Array, default: () => [] },
      warning: { type: String, default: '' },
      confirmLabel: { type: String, default: '' },
    },
    data() {
      dialogSeq += 1;
      return { titleId: `bulk-confirm-title-${dialogSeq}` };
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
