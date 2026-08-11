<template>
  <div class="friends-hub__modes" role="tablist" :aria-label="$t('bot-social-friends-modes')">
    <button
      type="button"
      role="tab"
      class="friends-hub__mode"
      :class="{ 'is-active': value === 'friends' }"
      :aria-selected="value === 'friends' ? 'true' : 'false'"
      @click="$emit('input', 'friends')"
    >
      {{ $t('bot-social-friends-mode-friends') }}
      <span class="friends-hub__mode-count">{{ friendsCount }}</span>
    </button>
    <button
      type="button"
      role="tab"
      class="friends-hub__mode"
      :class="{ 'is-active': value === 'sent' }"
      :aria-selected="value === 'sent' ? 'true' : 'false'"
      @click="$emit('input', 'sent')"
    >
      {{ $t('bot-social-friends-mode-sent') }}
      <span class="friends-hub__mode-count">{{ sentCount }}</span>
    </button>
    <button
      type="button"
      role="tab"
      class="friends-hub__mode"
      :class="{ 'is-active': value === 'received' }"
      :aria-selected="value === 'received' ? 'true' : 'false'"
      @click="$emit('input', 'received')"
    >
      {{ $t('bot-social-friends-mode-received') }}
      <span class="friends-hub__mode-count">{{ receivedCount }}</span>
    </button>
    <button
      type="button"
      role="tab"
      class="friends-hub__mode"
      :class="{ 'is-active': value === 'send' }"
      :aria-selected="value === 'send' ? 'true' : 'false'"
      @click="$emit('input', 'send')"
    >
      <FontAwesomeIcon icon="plus" aria-hidden="true"></FontAwesomeIcon>
      {{ $t('bot-social-friends-mode-send') }}
    </button>
  </div>
</template>

<script>
  export default {
    name: 'FriendsModeTabs',
    props: {
      value: { type: String, required: true },
      friendsCount: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      receivedCount: { type: Number, default: 0 },
    },
  };
</script>
