<template>
  <div class="bulk-actions__bots" role="group" :aria-label="ariaLabel || $t('bulk-actions-bots-label')">
    <div class="bulk-actions__bots-toolbar">
      <label class="bulk-actions__search bulk-actions__search--bots">
        <FontAwesomeIcon icon="search" aria-hidden="true"></FontAwesomeIcon>
        <input
          v-model.trim="query"
          type="search"
          :placeholder="$t('bulk-actions-bots-filter')"
          :aria-label="$t('bulk-actions-bots-filter')"
        >
      </label>
      <div class="bulk-actions__bots-actions">
        <button type="button" class="button button--link" @click="selectAll">
          {{ $t('bulk-actions-bots-select-all') }}
        </button>
        <button type="button" class="button button--link" :disabled="!value.length" @click="clearAll">
          {{ $t('bulk-actions-bots-clear') }}
        </button>
      </div>
    </div>

    <p class="bulk-actions__bots-count">
      {{ $t('bulk-actions-bots-selected', { n: value.length, total: bots.length }) }}
    </p>

    <p v-if="!filteredBots.length" class="bulk-actions__empty">
      {{ $t('bulk-actions-bots-filter-empty') }}
    </p>

    <div v-else class="bulk-actions__bots-grid" role="listbox" :aria-multiselectable="true">
      <button
        v-for="bot in filteredBots"
        :key="bot.name"
        type="button"
        role="option"
        class="bulk-actions__bot-card"
        :class="[`status--${bot.status}`, { 'is-selected': isSelected(bot.name) }]"
        :aria-selected="isSelected(bot.name) ? 'true' : 'false'"
        @click="toggle(bot.name)"
      >
        <span class="bulk-actions__bot-check" :class="{ 'is-on': isSelected(bot.name) }" aria-hidden="true"></span>
        <img
          class="bulk-actions__bot-avatar"
          :src="bot.avatarURL"
          :alt="bot.viewableName || bot.name"
        >
        <span class="bulk-actions__bot-copy">
          <span class="bulk-actions__bot-name">{{ bot.viewableName || bot.name }}</span>
          <span class="bulk-actions__bot-status">{{ bot.statusText || bot.status || '' }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'BulkBotPicker',
    props: {
      bots: { type: Array, default: () => [] },
      value: { type: Array, default: () => [] },
      ariaLabel: { type: String, default: '' },
    },
    data() {
      return { query: '' };
    },
    computed: {
      filteredBots() {
        const q = this.query.toLowerCase();
        if (!q) return this.bots;
        return this.bots.filter(bot => {
          const name = String(bot.viewableName || bot.name || '').toLowerCase();
          const raw = String(bot.name || '').toLowerCase();
          return name.includes(q) || raw.includes(q);
        });
      },
    },
    methods: {
      isSelected(name) {
        return this.value.includes(name);
      },
      toggle(name) {
        const next = this.isSelected(name)
          ? this.value.filter(n => n !== name)
          : [...this.value, name];
        this.$emit('input', next);
      },
      selectAll() {
        const names = this.filteredBots.map(b => b.name);
        this.$emit('input', [...new Set([...this.value, ...names])]);
      },
      clearAll() {
        if (!this.query) {
          this.$emit('input', []);
          return;
        }
        const filtered = new Set(this.filteredBots.map(b => b.name));
        this.$emit('input', this.value.filter(name => !filtered.has(name)));
      },
    },
  };
</script>
