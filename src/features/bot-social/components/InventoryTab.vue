<template>
  <div class="steam-inv" :class="{ 'is-refreshing': refreshing }">
    <div class="steam-inv__toolbar">
      <label class="steam-inv__search-wrap">
        <span class="steam-inv__search-label">{{ $t('bot-social-inventory-search-label') }}</span>
        <input
          v-model.trim="query"
          class="form-item__input steam-inv__search"
          type="search"
          :placeholder="$t('bot-social-search')"
          autocomplete="off"
        >
      </label>
      <div class="steam-inv__toolbar-meta">
        <span class="steam-inv__count">{{ $t('bot-social-inventory-steam-total', { n: items.length }) }}</span>
        <button
          type="button"
          class="button button--link"
          :disabled="loading || refreshing"
          @click="refresh"
        >
          <FontAwesomeIcon v-if="refreshing" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ $t('bot-social-refresh') }}</span>
        </button>
      </div>
    </div>

    <div v-if="loading && !items.length" class="bot-social__state">
      <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
      <span>{{ $t('bot-social-loading') }}</span>
    </div>
    <div v-else-if="error && !items.length" class="bot-social__state bot-social__state--error">{{ error }}</div>
    <template v-else>
      <p v-if="error" class="bot-social__inline-error">{{ error }}</p>
      <div v-if="!items.length" class="bot-social__state">{{ $t('bot-social-inventory-empty') }}</div>
      <div v-else-if="!filteredItems.length" class="bot-social__state">{{ $t('bot-social-inventory-items-empty') }}</div>

      <div v-else class="steam-inv__shell">
        <div class="steam-inv__grid-pane">
          <div
            class="steam-inv__grid"
            role="listbox"
            :aria-label="$t('bot-social-tab-inventory')"
            :aria-activedescendant="selectedItem ? `inv-item-${selectedItem.id}` : undefined"
          >
            <button
              v-for="item in pageItems"
              :id="`inv-item-${item.id}`"
              :key="item.id"
              type="button"
              role="option"
              class="steam-inv__cell"
              :class="{ 'is-selected': selectedId === item.id }"
              :aria-selected="selectedId === item.id ? 'true' : 'false'"
              :title="item.name"
              @click="selectItem(item.id)"
            >
              <span
                class="steam-inv__cell-bg"
                :style="item.backgroundColor ? { backgroundColor: `#${item.backgroundColor}` } : null"
              >
                <img
                  v-if="item.iconUrl"
                  class="steam-inv__thumb"
                  :src="item.iconUrl"
                  :alt="item.name"
                  loading="lazy"
                  decoding="async"
                >
                <span v-else class="steam-inv__thumb-fallback" aria-hidden="true">?</span>
              </span>
              <span v-if="item.amount > 1" class="steam-inv__qty">×{{ item.amount }}</span>
            </button>
          </div>

          <div class="steam-inv__pager">
            <button
              type="button"
              class="steam-inv__page-btn"
              :disabled="page <= 1"
              :aria-label="$t('bot-social-inventory-page-prev')"
              @click="page -= 1"
            >
              <FontAwesomeIcon icon="chevron-left"></FontAwesomeIcon>
            </button>
            <span class="steam-inv__page-label">{{ $t('bot-social-inventory-page', { current: page, total: totalPages }) }}</span>
            <button
              type="button"
              class="steam-inv__page-btn"
              :disabled="page >= totalPages"
              :aria-label="$t('bot-social-inventory-page-next')"
              @click="page += 1"
            >
              <FontAwesomeIcon icon="chevron-right"></FontAwesomeIcon>
            </button>
          </div>
        </div>

        <aside v-if="selectedItem" class="steam-inv__detail">
          <div class="steam-inv__preview">
            <img
              v-if="selectedItem.iconUrlLarge || selectedItem.iconUrl"
              class="steam-inv__preview-img"
              :src="selectedItem.iconUrlLarge || selectedItem.iconUrl"
              :alt="selectedItem.name"
            >
          </div>
          <h3 class="steam-inv__name">{{ selectedItem.name }}</h3>
          <p v-if="selectedItem.type" class="steam-inv__type">{{ selectedItem.type }}</p>
          <p v-if="selectedItem.tags.length" class="steam-inv__tags">
            <span class="steam-inv__tags-label">{{ $t('bot-social-inventory-tags') }}</span>
            {{ tagSummary }}
          </p>
          <ul class="steam-inv__flags" :aria-label="$t('bot-social-inventory-flags')">
            <li :class="{ 'is-on': selectedItem.tradable }">
              {{ selectedItem.tradable ? $t('bot-social-inventory-tradable') : $t('bot-social-inventory-not-tradable') }}
            </li>
            <li :class="{ 'is-on': selectedItem.marketable }">
              {{ selectedItem.marketable ? $t('bot-social-inventory-marketable') : $t('bot-social-inventory-not-marketable') }}
            </li>
            <li v-if="selectedItem.amount > 1">{{ $t('bot-social-inventory-amount', { n: selectedItem.amount }) }}</li>
          </ul>
          <div v-if="selectedItem.marketable && selectedItem.marketUrl" class="steam-inv__market">
            <a
              class="steam-inv__market-btn"
              :href="selectedItem.marketUrl"
              target="_blank"
              rel="noreferrer noopener"
            >
              {{ $t('bot-social-inventory-market-link') }}
            </a>
          </div>
        </aside>
        <aside v-else class="steam-inv__detail steam-inv__detail--empty">
          <p>{{ $t('bot-social-inventory-select-hint') }}</p>
        </aside>
      </div>
    </template>
  </div>
</template>

<script>
  import { loadInventory } from '../cache/bot-social-queries';
  import { peek } from '../cache/query-cache';

  const PAGE_SIZE = 25;

  function isLegacyInventoryShape(items) {
    return Array.isArray(items) && items.length > 0 && !Object.prototype.hasOwnProperty.call(items[0], 'iconUrl');
  }

  export default {
    name: 'BotSocialInventoryTab',
    props: {
      botName: { type: String, required: true },
    },
    data() {
      return {
        loading: false,
        refreshing: false,
        error: '',
        items: [],
        query: '',
        selectedId: '',
        page: 1,
      };
    },
    computed: {
      filteredItems() {
        const q = this.query.toLowerCase();
        if (!q) return this.items;
        return this.items.filter(item => (
          item.name.toLowerCase().includes(q)
          || (item.type && item.type.toLowerCase().includes(q))
          || item.classId.includes(q)
          || (item.tags || []).some(tag => tag.name.toLowerCase().includes(q))
        ));
      },
      totalPages() {
        return Math.max(1, Math.ceil(this.filteredItems.length / PAGE_SIZE));
      },
      pageItems() {
        const start = (this.page - 1) * PAGE_SIZE;
        return this.filteredItems.slice(start, start + PAGE_SIZE);
      },
      selectedItem() {
        if (!this.selectedId) return null;
        return this.filteredItems.find(item => item.id === this.selectedId)
          || this.items.find(item => item.id === this.selectedId)
          || null;
      },
      tagSummary() {
        if (!this.selectedItem?.tags?.length) return '';
        return this.selectedItem.tags.map(tag => tag.name).join(', ');
      },
    },
    watch: {
      botName: {
        immediate: true,
        handler(name) {
          this.selectedId = '';
          this.page = 1;
          this.query = '';
          const force = this.hydrateFromCache(name);
          this.load(force);
        },
      },
      query() {
        this.page = 1;
        this.ensureSelection();
      },
      filteredItems() {
        if (this.page > this.totalPages) this.page = this.totalPages;
        this.ensureSelection();
      },
      page() {
        this.ensureSelectionOnPage();
      },
    },
    methods: {
      hydrateFromCache(botName) {
        const cached = peek('inventory', botName);
        if (!cached?.data) {
          this.items = [];
          return false;
        }
        if (isLegacyInventoryShape(cached.data)) {
          this.items = [];
          return true;
        }
        this.items = cached.data;
        this.ensureSelection();
        return false;
      },
      ensureSelection() {
        if (!this.filteredItems.length) {
          this.selectedId = '';
          return;
        }
        if (!this.selectedId || !this.filteredItems.some(item => item.id === this.selectedId)) {
          this.selectedId = this.pageItems[0]?.id || this.filteredItems[0].id;
        }
      },
      ensureSelectionOnPage() {
        if (!this.pageItems.length) return;
        if (!this.pageItems.some(item => item.id === this.selectedId)) {
          this.selectedId = this.pageItems[0].id;
        }
      },
      selectItem(id) {
        this.selectedId = id;
      },
      async load(force) {
        const hasData = this.items.length > 0;
        this.loading = !hasData;
        this.refreshing = force && hasData;
        if (force) this.error = '';

        try {
          const result = await loadInventory(this.botName, { force });
          this.items = result.data || [];
          if (result.rateLimited) {
            this.$error(this.$t('bot-social-rate-limited'));
          } else if (result.error && result.stale) {
            this.error = result.error.message || String(result.error);
          } else {
            this.error = '';
          }
          this.ensureSelection();
          this.$emit('loaded', { total: this.items.length });
        } catch (err) {
          if (err?.code === 'RATE_LIMITED') {
            this.$error(this.$t('bot-social-rate-limited'));
          } else if (!hasData) {
            this.error = err.message || String(err);
            this.items = [];
          } else {
            this.error = err.message || String(err);
          }
        } finally {
          this.loading = false;
          this.refreshing = false;
        }
      },
      refresh() {
        if (this.loading || this.refreshing) return;
        this.load(true);
      },
    },
  };
</script>
