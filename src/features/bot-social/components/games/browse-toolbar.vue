<template>
  <div>
    <div class="bot-social-games__chrome-bar">
      <label class="bot-social-games__searchbox">
        <FontAwesomeIcon class="bot-social-games__search-icon" icon="search" aria-hidden="true"></FontAwesomeIcon>
        <input
          class="bot-social-games__search-input"
          type="search"
          :value="query"
          :placeholder="$t('bot-social-search')"
          :aria-label="$t('bot-social-search')"
          @input="$emit('update:query', $event.target.value.trim())"
        >
      </label>

      <div class="bot-social-games__chrome-actions">
        <p class="bot-social-games__count">
          <slot name="count"></slot>
        </p>
        <button
          v-if="query"
          type="button"
          class="bot-social-games__clear"
          @click="$emit('update:query', '')"
        >
          {{ $t('bot-social-games-clear-search') }}
        </button>
        <button
          type="button"
          class="bot-social-games__refresh"
          :disabled="refreshDisabled"
          @click="$emit('refresh')"
        >
          <FontAwesomeIcon v-if="busy" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ $t('bot-social-refresh') }}</span>
        </button>
      </div>
    </div>

    <div
      v-if="showFilters"
      class="bot-social-games__filterbar"
      :class="filterbarClass"
      role="group"
      :aria-label="filtersAriaLabel"
    >
      <slot name="filters"></slot>
      <button
        v-if="hasActiveFilters"
        type="button"
        class="bot-social-games__clear-filters"
        @click="$emit('clear-filters')"
      >
        {{ $t('bot-social-games-clear-filters') }}
      </button>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'GamesBrowseToolbar',
    props: {
      query: { type: String, default: '' },
      busy: { type: Boolean, default: false },
      refreshDisabled: { type: Boolean, default: false },
      showFilters: { type: Boolean, default: true },
      hasActiveFilters: { type: Boolean, default: false },
      filtersAriaLabel: { type: String, default: '' },
      filterbarClass: { type: [String, Object, Array], default: '' },
    },
  };
</script>
