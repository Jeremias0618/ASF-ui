<template>
  <div class="steam-inv__modes" role="tablist" :aria-label="$t('bot-social-inventory-modes')">
    <button
      type="button"
      role="tab"
      class="steam-inv__mode"
      :class="{ 'is-active': value === 'inventory' }"
      :aria-selected="value === 'inventory' ? 'true' : 'false'"
      @click="$emit('input', 'inventory')"
    >
      {{ $t('bot-social-tab-inventory') }}
    </button>
    <button
      type="button"
      role="tab"
      class="steam-inv__mode"
      :class="{ 'is-active': value === 'trades' }"
      :aria-selected="value === 'trades' ? 'true' : 'false'"
      @click="$emit('input', 'trades')"
    >
      {{ $t('bot-social-tab-trades') }}
    </button>
  </div>
</template>

<script>
  export default {
    name: 'InventoryModeTabs',
    props: {
      value: { type: String, required: true },
    },
  };
</script>
