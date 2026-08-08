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
      <h3 :id="titleId" class="friends-remove__title">{{ $t('bot-social-friends-remove-title') }}</h3>
      <p class="friends-remove__lead">
        {{ $t('bot-social-friends-remove-body', { name: friendName }) }}
      </p>
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
          <span v-else>{{ $t('bot-social-friends-remove-confirm-btn') }}</span>
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
    },
    data() {
      removeUid += 1;
      return { titleId: `friends-remove-title-${removeUid}` };
    },
    watch: {
      open(value) {
        if (value) {
          window.addEventListener('keydown', this.onKeydown);
        } else {
          window.removeEventListener('keydown', this.onKeydown);
        }
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
