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
      <h3 :id="titleId" class="friends-remove__title">{{ $t(titleKey) }}</h3>
      <p class="friends-remove__lead">
        {{ $t(bodyKey, { name: friendName }) }}
      </p>
      <div class="friends-remove__actions">
        <button type="button" class="button" :disabled="submitting" @click="onCancel">
          {{ $t('cancel') }}
        </button>
        <button
          type="button"
          class="button"
          :class="confirmTone === 'primary' ? 'button--confirm' : 'button--cancel'"
          :disabled="submitting"
          @click="$emit('confirm')"
        >
          <FontAwesomeIcon v-if="submitting" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ $t(confirmKey) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
  let removeUid = 0;

  export default {
    name: 'FriendsRemoveDialog',
    props: {
      open: { type: Boolean, default: false },
      friendName: { type: String, default: '' },
      submitting: { type: Boolean, default: false },
      titleKey: { type: String, default: 'bot-social-friends-remove-title' },
      bodyKey: { type: String, default: 'bot-social-friends-remove-body' },
      confirmKey: { type: String, default: 'bot-social-friends-remove-confirm-btn' },
      confirmTone: { type: String, default: 'danger' },
    },
    data() {
      removeUid += 1;
      return { titleId: `friends-remove-title-${removeUid}` };
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
