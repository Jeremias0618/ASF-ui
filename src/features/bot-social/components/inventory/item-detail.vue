<template>
  <aside class="steam-inv__detail" :class="{ 'steam-inv__detail--empty': !item }">
    <template v-if="item">
      <div
        class="steam-inv__preview"
        :class="{ 'is-loading-hd': !previewHdReady }"
        :style="item.backgroundColor ? { backgroundColor: `#${item.backgroundColor}` } : null"
      >
        <img
          v-if="item.iconUrl"
          class="steam-inv__preview-lq"
          :src="item.iconUrl"
          alt=""
          decoding="async"
        >
        <img
          v-if="item.iconUrlLarge || item.iconUrl"
          :key="`hd-${item.id}`"
          class="steam-inv__preview-img"
          :class="{ 'is-ready': previewHdReady }"
          :src="item.iconUrlLarge || item.iconUrl"
          :alt="item.name"
          decoding="async"
          @load="$emit('preview-hd-load')"
          @error="$emit('preview-hd-error')"
        >
      </div>
      <h3 class="steam-inv__name">{{ item.name }}</h3>
      <p v-if="item.gameName" class="steam-inv__game">
        <a
          v-if="item.storeUrl"
          class="steam-inv__game-link"
          :href="item.storeUrl"
          target="_blank"
          rel="noreferrer noopener"
        >{{ item.gameName }}</a>
        <span v-else>{{ item.gameName }}</span>
      </p>
      <p v-if="item.tags && item.tags.length" class="steam-inv__tags">
        <span class="steam-inv__tags-label">{{ $t('bot-social-inventory-tags') }}</span>
        {{ tagSummary }}
      </p>
      <ul class="steam-inv__flags" :aria-label="$t('bot-social-inventory-flags')">
        <li :class="{ 'is-on': item.tradable }">
          {{ item.tradable ? $t('bot-social-inventory-tradable') : $t('bot-social-inventory-not-tradable') }}
        </li>
        <li :class="{ 'is-on': item.marketable }">
          {{ item.marketable ? $t('bot-social-inventory-marketable') : $t('bot-social-inventory-not-marketable') }}
        </li>
        <li v-if="item.amount > 1">{{ $t('bot-social-inventory-amount', { n: item.amount }) }}</li>
      </ul>
      <div class="steam-inv__detail-actions">
        <button
          v-if="item.tradable"
          type="button"
          class="steam-inv__transfer-one"
          :disabled="transferring"
          @click="$emit('transfer-one', item)"
        >
          {{ $t('bot-social-inventory-transfer-one') }}
        </button>
        <a
          v-if="item.marketable && item.marketUrl"
          class="steam-inv__market-btn"
          :href="item.marketUrl"
          target="_blank"
          rel="noreferrer noopener"
        >
          {{ $t('bot-social-inventory-market-link') }}
        </a>
      </div>
    </template>
    <p v-else>{{ $t('bot-social-inventory-select-hint') }}</p>
  </aside>
</template>

<script>
  export default {
    name: 'InventoryItemDetail',
    props: {
      item: { type: Object, default: null },
      tagSummary: { type: String, default: '' },
      previewHdReady: { type: Boolean, default: false },
      transferring: { type: Boolean, default: false },
    },
  };
</script>
