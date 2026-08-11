<template>
  <section class="friends-hub__chrome" :aria-label="$t('bot-social-tab-friends')">
    <div class="friends-hub__chrome-bar">
      <div class="friends-hub__searchbox">
        <FontAwesomeIcon icon="search" class="friends-hub__search-icon" aria-hidden="true"></FontAwesomeIcon>
        <input
          class="friends-hub__search-input"
          type="search"
          :value="query"
          :placeholder="$t('bot-social-friends-search-placeholder')"
          :aria-label="$t('bot-social-friends-search-label')"
          autocomplete="off"
          @input="$emit('update:query', $event.target.value.trim())"
        >
      </div>

      <div class="friends-hub__chrome-actions">
        <span class="friends-hub__count">{{ countLabel }}</span>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="friends-hub__clear"
          @click="$emit('clear')"
        >
          {{ $t('bot-social-friends-clear-filters') }}
        </button>
        <button
          type="button"
          class="friends-hub__refresh"
          :disabled="refreshDisabled"
          :title="$t('bot-social-refresh')"
          @click="$emit('refresh')"
        >
          <FontAwesomeIcon :icon="refreshing ? 'spinner' : 'redo-alt'" :spin="refreshing"></FontAwesomeIcon>
          <span>{{ $t('bot-social-refresh') }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script>
  export default {
    name: 'FriendsSearchChrome',
    props: {
      query: { type: String, default: '' },
      countLabel: { type: String, required: true },
      hasActiveFilters: { type: Boolean, default: false },
      refreshing: { type: Boolean, default: false },
      refreshDisabled: { type: Boolean, default: false },
    },
  };
</script>
