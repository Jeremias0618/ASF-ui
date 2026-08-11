<template>
  <section class="steam-inv__chrome" :aria-label="$t('bot-social-tab-inventory')">
    <div class="steam-inv__chrome-bar">
      <div class="steam-inv__searchbox">
        <FontAwesomeIcon icon="search" class="steam-inv__search-icon" aria-hidden="true"></FontAwesomeIcon>
        <input
          class="steam-inv__search-input"
          type="search"
          :value="query"
          :placeholder="$t('bot-social-inventory-search-placeholder')"
          :aria-label="$t('bot-social-inventory-search-label')"
          autocomplete="off"
          @input="$emit('update:query', $event.target.value.trim())"
        >
      </div>

      <div class="steam-inv__chrome-actions">
        <span class="steam-inv__count">
          {{ $t('bot-social-inventory-showing', { shown: shownCount, total: totalCount }) }}
        </span>
        <button
          type="button"
          class="steam-inv__select-toggle"
          :class="{ 'is-on': selectMode }"
          :disabled="selectDisabled"
          @click="$emit('toggle-select')"
        >
          {{ selectMode ? $t('bot-social-inventory-select-done') : $t('bot-social-inventory-select-mode') }}
        </button>
        <button
          type="button"
          class="steam-inv__refresh"
          :disabled="refreshDisabled"
          :title="$t('bot-social-refresh')"
          @click="$emit('refresh')"
        >
          <FontAwesomeIcon :icon="refreshing ? 'spinner' : 'redo-alt'" :spin="refreshing"></FontAwesomeIcon>
          <span>{{ $t('bot-social-refresh') }}</span>
        </button>
      </div>
    </div>

    <div class="steam-inv__filterbar">
      <!-- Use div, not label: wrapping AsfSelect in <label> steals clicks and re-opens the menu. -->
      <div class="steam-inv__field">
        <span id="inv-filter-type-label" class="steam-inv__field-label">{{ $t('bot-social-inventory-filter-type') }}</span>
        <AsfSelect
          :value="kindFilter"
          searchable
          compact
          aria-labelledby="inv-filter-type-label"
          :options="typeOptions"
          :search-placeholder="$t('bot-social-inventory-filter-search-options')"
          @input="$emit('update:kindFilter', $event)"
        ></AsfSelect>
      </div>

      <div class="steam-inv__field steam-inv__field--grow">
        <span id="inv-filter-game-label" class="steam-inv__field-label">{{ $t('bot-social-inventory-filter-game') }}</span>
        <AsfSelect
          :value="gameFilter"
          searchable
          compact
          aria-labelledby="inv-filter-game-label"
          :options="gameOptions"
          :search-placeholder="$t('bot-social-inventory-filter-search-options')"
          @input="$emit('update:gameFilter', $event)"
        ></AsfSelect>
      </div>

      <div class="steam-inv__field">
        <span id="inv-filter-status-label" class="steam-inv__field-label">{{ $t('bot-social-inventory-filter-status') }}</span>
        <AsfSelect
          :value="statusFilter"
          searchable
          compact
          aria-labelledby="inv-filter-status-label"
          :disabled="selectMode"
          :options="statusOptions"
          :search-placeholder="$t('bot-social-inventory-filter-search-options')"
          @input="$emit('update:statusFilter', $event)"
        ></AsfSelect>
      </div>

      <button
        v-if="hasActiveFilters"
        type="button"
        class="steam-inv__clear"
        @click="$emit('clear-filters')"
      >
        {{ $t('bot-social-inventory-clear-filters') }}
      </button>
    </div>
  </section>
</template>

<script>
  export default {
    name: 'InventoryChrome',
    props: {
      query: { type: String, default: '' },
      kindFilter: { type: String, default: 'all' },
      gameFilter: { type: String, default: '' },
      statusFilter: { type: String, default: 'all' },
      shownCount: { type: Number, default: 0 },
      totalCount: { type: Number, default: 0 },
      selectMode: { type: Boolean, default: false },
      selectDisabled: { type: Boolean, default: false },
      refreshing: { type: Boolean, default: false },
      refreshDisabled: { type: Boolean, default: false },
      hasActiveFilters: { type: Boolean, default: false },
      typeOptions: { type: Array, default: () => [] },
      gameOptions: { type: Array, default: () => [] },
      statusOptions: { type: Array, default: () => [] },
    },
  };
</script>
