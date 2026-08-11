<template>
  <div class="bulk-actions-bots" role="group" :aria-label="ariaLabel || $t('bulk-actions-bots-label')">
    <div class="bulk-actions-bots__toolbar">
      <label class="bulk-actions-bots__search">
        <FontAwesomeIcon icon="search" aria-hidden="true"></FontAwesomeIcon>
        <input
          v-model.trim="query"
          type="search"
          :placeholder="$t('bulk-actions-bots-filter')"
          :aria-label="$t('bulk-actions-bots-filter')"
        >
      </label>
      <div class="bulk-actions-bots__actions">
        <button type="button" class="bulk-actions-bots__chip" @click="selectAll">
          {{ $t('bulk-actions-bots-select-all') }}
        </button>
        <button
          type="button"
          class="bulk-actions-bots__chip"
          :disabled="!value.length"
          @click="clearAll"
        >
          {{ $t('bulk-actions-bots-clear') }}
        </button>
      </div>
    </div>

    <div class="bulk-actions-bots__meter" aria-live="polite">
      <div class="bulk-actions-bots__meter-track" aria-hidden="true">
        <span class="bulk-actions-bots__meter-fill" :style="{ width: `${selectedPercent}%` }"></span>
      </div>
      <p class="bulk-actions-bots__meter-label">
        {{ $t('bulk-actions-bots-selected', { n: value.length, total: bots.length }) }}
      </p>
    </div>

    <p v-if="!filteredBots.length" class="bulk-actions__empty">
      {{ $t('bulk-actions-bots-filter-empty') }}
    </p>

    <div
      v-else
      class="bulk-actions-bots__grid"
      role="listbox"
      :aria-multiselectable="true"
      :aria-label="$t('bulk-actions-bots-label')"
    >
      <button
        v-for="(bot, index) in filteredBots"
        :key="bot.name"
        type="button"
        role="option"
        class="bulk-actions-bots__card"
        :class="[`status--${bot.status}`, { 'is-selected': isSelected(bot.name) }]"
        :style="{ '--tile-delay': `${index * 40}ms` }"
        :aria-selected="isSelected(bot.name) ? 'true' : 'false'"
        @click="toggle(bot.name)"
      >
        <span
          class="bulk-actions-bots__check"
          :class="{ 'is-on': isSelected(bot.name) }"
          aria-hidden="true"
        >
          <FontAwesomeIcon v-if="isSelected(bot.name)" icon="check"></FontAwesomeIcon>
        </span>
        <span class="bulk-actions-bots__avatar-wrap" aria-hidden="true">
          <img
            class="bulk-actions-bots__avatar"
            :src="bot.avatarURL"
            alt=""
          >
        </span>
        <span class="bulk-actions-bots__copy">
          <span class="bulk-actions-bots__name">{{ bot.viewableName || bot.name }}</span>
          <span class="bulk-actions-bots__status">{{ bot.statusText || bot.status || '' }}</span>
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
      selectedPercent() {
        if (!this.bots.length) return 0;
        return Math.round((this.value.length / this.bots.length) * 100);
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
