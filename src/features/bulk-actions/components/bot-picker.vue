<template>
  <div class="bulk-actions__bots" role="group" :aria-label="ariaLabel || $t('bulk-actions-bots-label')">
    <div class="bulk-actions__bots-toolbar">
      <p class="bulk-actions__bots-count">
        {{ $t('bulk-actions-bots-selected', { n: value.length, total: bots.length }) }}
      </p>
      <div class="bulk-actions__bots-actions">
        <button type="button" class="button button--link" @click="selectAll">
          {{ $t('bulk-actions-bots-select-all') }}
        </button>
        <button type="button" class="button button--link" :disabled="!value.length" @click="clearAll">
          {{ $t('bulk-actions-bots-clear') }}
        </button>
      </div>
    </div>
    <ul class="bulk-actions__bots-list">
      <li v-for="bot in bots" :key="bot.name">
        <label class="bulk-actions__bots-item">
          <input
            type="checkbox"
            :checked="isSelected(bot.name)"
            @change="toggle(bot.name, $event.target.checked)"
          >
          <span class="bulk-actions__bots-name">{{ bot.viewableName || bot.name }}</span>
          <span class="bulk-actions__bots-status">{{ bot.status || '' }}</span>
        </label>
      </li>
    </ul>
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
    methods: {
      isSelected(name) {
        return this.value.includes(name);
      },
      toggle(name, checked) {
        const next = checked
          ? [...new Set([...this.value, name])]
          : this.value.filter(n => n !== name);
        this.$emit('input', next);
      },
      selectAll() {
        this.$emit('input', this.bots.map(b => b.name));
      },
      clearAll() {
        this.$emit('input', []);
      },
    },
  };
</script>
