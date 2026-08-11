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
      <div v-if="!isSingle" class="bulk-actions-bots__actions">
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
        <template v-if="isSingle">
          {{ value.length
            ? $t('bulk-actions-destination-selected', { name: selectedLabel })
            : $t('bulk-actions-destination-need') }}
        </template>
        <template v-else>
          {{ $t('bulk-actions-bots-selected', { n: value.length, total: bots.length }) }}
        </template>
      </p>
    </div>

    <p v-if="!filteredBots.length" class="bulk-actions__empty">
      {{ $t('bulk-actions-bots-filter-empty') }}
    </p>

    <div
      v-else
      class="bulk-actions-bots__grid"
      role="listbox"
      :aria-multiselectable="isSingle ? 'false' : 'true'"
      :aria-label="ariaLabel || $t('bulk-actions-bots-label')"
    >
      <button
        v-for="(bot, index) in filteredBots"
        :key="bot.name"
        type="button"
        role="option"
        class="bulk-actions-bots__card"
        :class="[
          `status--${bot.status}`,
          {
            'is-selected': isSelected(bot.name),
            'is-disabled': isDisabled(bot.name),
            'is-master': isMasterBot(bot),
          },
        ]"
        :style="{ '--tile-delay': `${index * 40}ms` }"
        :aria-selected="isSelected(bot.name) ? 'true' : 'false'"
        :disabled="isDisabled(bot.name)"
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
          <span class="bulk-actions-bots__status">
            <template v-if="isMasterBot(bot)">{{ $t('bulk-actions-destination-master-badge') }} · </template>
            {{ bot.statusText || bot.status || '' }}
          </span>
        </span>
      </button>
    </div>
  </div>
</template>

<script>
  import { collectMasterSteamIdCounts } from '../utils/find-default-destination';

  export default {
    name: 'BulkBotPicker',
    props: {
      bots: { type: Array, default: () => [] },
      value: { type: Array, default: () => [] },
      ariaLabel: { type: String, default: '' },
      /** @type {'multiple' | 'single'} */
      mode: { type: String, default: 'multiple' },
      /** Bot names that cannot be selected (e.g. destination when picking sources). */
      disabledNames: { type: Array, default: () => [] },
      /** When true, highlight bots that hold Master SteamIDs. */
      highlightMasters: { type: Boolean, default: false },
    },
    data() {
      return { query: '' };
    },
    computed: {
      isSingle() {
        return this.mode === 'single';
      },
      masterSteamIds() {
        if (!this.highlightMasters) return new Set();
        return new Set(collectMasterSteamIdCounts(this.bots).keys());
      },
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
        if (this.isSingle) return this.value.length ? 100 : 0;
        if (!this.bots.length) return 0;
        return Math.round((this.value.length / this.bots.length) * 100);
      },
      selectedLabel() {
        const name = this.value[0];
        if (!name) return '';
        const bot = this.bots.find(b => b.name === name);
        return (bot && (bot.viewableName || bot.name)) || name;
      },
    },
    methods: {
      isSelected(name) {
        return this.value.includes(name);
      },
      isDisabled(name) {
        return this.disabledNames.includes(name);
      },
      isMasterBot(bot) {
        if (!this.highlightMasters || !bot) return false;
        return this.masterSteamIds.has(String(bot.steamid || ''));
      },
      toggle(name) {
        if (this.isDisabled(name)) return;
        if (this.isSingle) {
          this.$emit('input', this.isSelected(name) ? [] : [name]);
          return;
        }
        const next = this.isSelected(name)
          ? this.value.filter(n => n !== name)
          : [...this.value, name];
        this.$emit('input', next);
      },
      selectAll() {
        const names = this.filteredBots
          .map(b => b.name)
          .filter(name => !this.isDisabled(name));
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
