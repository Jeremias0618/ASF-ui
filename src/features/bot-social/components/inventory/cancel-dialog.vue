<template>
  <div
    v-if="open"
    class="friends-remove"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
  >
    <button type="button" class="friends-remove__backdrop" :aria-label="$t('cancel')" @click="onCancel"></button>
    <div class="friends-remove__panel">
      <h3 :id="titleId" class="friends-remove__title">{{ title }}</h3>
      <p class="friends-remove__lead">{{ body }}</p>
      <div class="friends-remove__actions">
        <button type="button" class="button" :disabled="submitting" @click="onCancel">
          {{ $t('cancel') }}
        </button>
        <button
          type="button"
          class="button button--cancel"
          :disabled="submitting"
          @click="$emit('confirm')"
        >
          <FontAwesomeIcon v-if="submitting" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ confirmLabel }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
  let cancelUid = 0;

  export default {
    name: 'TradeOfferCancelDialog',
    props: {
      open: { type: Boolean, default: false },
      partnerName: { type: String, default: '' },
      tradeOfferId: { type: String, default: '' },
      direction: { type: String, default: 'sent' },
      waitingFor: { type: String, default: '' },
      submitting: { type: Boolean, default: false },
    },
    data() {
      cancelUid += 1;
      return { titleId: `trade-cancel-title-${cancelUid}` };
    },
    computed: {
      isReceived() {
        return this.direction === 'received';
      },
      title() {
        return this.isReceived
          ? this.$t('bot-social-trades-decline-title')
          : this.$t('bot-social-trades-cancel-title');
      },
      body() {
        const name = this.partnerName || this.tradeOfferId;
        if (this.isReceived) {
          return this.$t('bot-social-trades-decline-body', { name, id: this.tradeOfferId });
        }
        if (this.waitingFor === 'needs_confirmation') {
          return this.$t('bot-social-trades-cancel-confirm-body', { name, id: this.tradeOfferId });
        }
        return this.$t('bot-social-trades-cancel-body', { name, id: this.tradeOfferId });
      },
      confirmLabel() {
        return this.isReceived
          ? this.$t('bot-social-trades-decline-confirm-btn')
          : this.$t('bot-social-trades-cancel-confirm-btn');
      },
    },
    watch: {
      open(value) {
        if (value) window.addEventListener('keydown', this.onKeydown);
        else window.removeEventListener('keydown', this.onKeydown);
      },
    },
    beforeDestroy() {
      window.removeEventListener('keydown', this.onKeydown);
    },
    methods: {
      onKeydown(event) {
        if (event.key === 'Escape') this.onCancel();
      },
      onCancel() {
        if (this.submitting) return;
        this.$emit('cancel');
      },
    },
  };
</script>
