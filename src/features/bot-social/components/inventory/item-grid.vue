<template>
  <div class="steam-inv__grid-pane">
    <div class="steam-inv__grid-viewport">
      <transition :name="pageTransitionName">
        <div
          :key="`inv-page-${page}`"
          class="steam-inv__grid"
          role="listbox"
          :aria-label="$t('bot-social-tab-inventory')"
          :aria-activedescendant="selectedOnPage ? `inv-item-${selectedId}` : undefined"
        >
          <button
            v-for="item in pageItems"
            :id="`inv-item-${item.id}`"
            :key="item.id"
            type="button"
            role="option"
            class="steam-inv__cell"
            :class="{
              'is-selected': selectedId === item.id,
              'is-checked': isChecked(item.id),
              'is-locked': selectMode && !item.tradable,
            }"
            :aria-selected="selectedId === item.id ? 'true' : 'false'"
            :title="item.tradable ? item.name : `${item.name} (${$t('bot-social-inventory-not-tradable')})`"
            @click="$emit('cell-click', item, $event)"
          >
            <span
              v-if="selectMode"
              class="steam-inv__check"
              :class="{ 'is-on': isChecked(item.id), 'is-disabled': !item.tradable }"
              aria-hidden="true"
            ></span>
            <span
              class="steam-inv__cell-bg"
              :style="item.backgroundColor ? { backgroundColor: `#${item.backgroundColor}` } : null"
            >
              <img
                v-if="item.iconUrl"
                class="steam-inv__thumb"
                :src="item.iconUrl"
                :alt="item.name"
                loading="eager"
                decoding="async"
                draggable="false"
              >
              <span v-else class="steam-inv__thumb-fallback" aria-hidden="true">?</span>
            </span>
            <span v-if="item.amount > 1" class="steam-inv__qty">×{{ item.amount }}</span>
          </button>
        </div>
      </transition>
    </div>

    <div v-if="selectMode" class="steam-inv__selection-bar">
      <span>{{ $t('bot-social-inventory-selected-count', { n: checkedCount }) }}</span>
      <div class="steam-inv__selection-actions">
        <button
          type="button"
          class="button button--link"
          :disabled="!filteredTradableCount"
          @click="$emit('select-all')"
        >
          {{ $t('bot-social-inventory-select-all-filtered') }}
        </button>
        <button
          type="button"
          class="button button--link"
          :disabled="!checkedCount"
          @click="$emit('clear-selection')"
        >
          {{ $t('bot-social-inventory-clear-selection') }}
        </button>
        <button
          type="button"
          class="button button--confirm"
          :disabled="!checkedCount || transferring"
          @click="$emit('transfer-selected')"
        >
          {{ $t('bot-social-inventory-transfer-n', { n: checkedCount }) }}
        </button>
      </div>
    </div>

    <div class="steam-inv__pager">
      <button
        type="button"
        class="steam-inv__page-btn"
        :disabled="page <= 1"
        :aria-label="$t('bot-social-inventory-page-prev')"
        @click="$emit('page-prev')"
      >
        <FontAwesomeIcon icon="chevron-left"></FontAwesomeIcon>
      </button>
      <span class="steam-inv__page-label">
        {{ $t('bot-social-inventory-page', { current: page, total: totalPages }) }}
      </span>
      <button
        type="button"
        class="steam-inv__page-btn"
        :disabled="page >= totalPages"
        :aria-label="$t('bot-social-inventory-page-next')"
        @click="$emit('page-next')"
      >
        <FontAwesomeIcon icon="chevron-right"></FontAwesomeIcon>
      </button>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'InventoryItemGrid',
    props: {
      pageItems: { type: Array, default: () => [] },
      page: { type: Number, default: 1 },
      totalPages: { type: Number, default: 1 },
      pageTransitionName: { type: String, default: 'steam-inv-page-next' },
      selectedId: { type: String, default: '' },
      selectedOnPage: { type: Boolean, default: false },
      selectMode: { type: Boolean, default: false },
      checkedIds: { type: Array, default: () => [] },
      checkedCount: { type: Number, default: 0 },
      filteredTradableCount: { type: Number, default: 0 },
      transferring: { type: Boolean, default: false },
    },
    methods: {
      isChecked(id) {
        return this.checkedIds.includes(id);
      },
    },
  };
</script>
