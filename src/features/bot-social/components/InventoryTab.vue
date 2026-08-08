<template>
  <div class="steam-inv" :class="{ 'is-refreshing': refreshing }">
    <section class="steam-inv__chrome" :aria-label="$t('bot-social-tab-inventory')">
      <div class="steam-inv__chrome-bar">
        <div class="steam-inv__searchbox">
          <FontAwesomeIcon icon="search" class="steam-inv__search-icon" aria-hidden="true"></FontAwesomeIcon>
          <input
            v-model.trim="query"
            class="steam-inv__search-input"
            type="search"
            :placeholder="$t('bot-social-inventory-search-placeholder')"
            :aria-label="$t('bot-social-inventory-search-label')"
            autocomplete="off"
          >
        </div>

        <div class="steam-inv__chrome-actions">
          <span class="steam-inv__count">{{ $t('bot-social-inventory-showing', { shown: filteredItems.length, total: items.length }) }}</span>
          <button
            type="button"
            class="steam-inv__refresh"
            :disabled="loading || refreshing"
            :title="$t('bot-social-refresh')"
            @click="refresh"
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
            v-model="kindFilter"
            searchable
            compact
            aria-labelledby="inv-filter-type-label"
            :options="typeSelectOptions"
            :search-placeholder="$t('bot-social-inventory-filter-search-options')"
          ></AsfSelect>
        </div>

        <div class="steam-inv__field steam-inv__field--grow">
          <span id="inv-filter-game-label" class="steam-inv__field-label">{{ $t('bot-social-inventory-filter-game') }}</span>
          <AsfSelect
            v-model="gameFilter"
            searchable
            compact
            aria-labelledby="inv-filter-game-label"
            :options="gameSelectOptions"
            :search-placeholder="$t('bot-social-inventory-filter-search-options')"
          ></AsfSelect>
        </div>

        <div class="steam-inv__field">
          <span id="inv-filter-status-label" class="steam-inv__field-label">{{ $t('bot-social-inventory-filter-status') }}</span>
          <AsfSelect
            v-model="statusFilter"
            searchable
            compact
            aria-labelledby="inv-filter-status-label"
            :options="statusSelectOptions"
            :search-placeholder="$t('bot-social-inventory-filter-search-options')"
          ></AsfSelect>
        </div>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="steam-inv__clear"
          @click="clearFilters"
        >
          {{ $t('bot-social-inventory-clear-filters') }}
        </button>
      </div>
    </section>

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
            :aria-activedescendant="selectedOnPage ? `inv-item-${selectedId}` : undefined"
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
                  loading="eager"
                  decoding="async"
                  draggable="false"
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
          <div
            class="steam-inv__preview"
            :class="{ 'is-loading-hd': !previewHdReady }"
            :style="selectedItem.backgroundColor ? { backgroundColor: `#${selectedItem.backgroundColor}` } : null"
          >
            <img
              v-if="selectedItem.iconUrl"
              class="steam-inv__preview-lq"
              :src="selectedItem.iconUrl"
              alt=""
              decoding="async"
            >
            <img
              v-if="selectedItem.iconUrlLarge || selectedItem.iconUrl"
              :key="`hd-${selectedItem.id}`"
              class="steam-inv__preview-img"
              :class="{ 'is-ready': previewHdReady }"
              :src="selectedItem.iconUrlLarge || selectedItem.iconUrl"
              :alt="selectedItem.name"
              decoding="async"
              @load="onPreviewHdLoad"
              @error="onPreviewHdError"
            >
          </div>
          <h3 class="steam-inv__name">{{ selectedItem.name }}</h3>
          <p v-if="selectedItem.type" class="steam-inv__type">{{ selectedItem.type }}</p>
          <p v-if="selectedItem.gameName" class="steam-inv__game">
            <a
              v-if="selectedItem.storeUrl"
              class="steam-inv__game-link"
              :href="selectedItem.storeUrl"
              target="_blank"
              rel="noreferrer noopener"
            >{{ selectedItem.gameName }}</a>
            <span v-else>{{ selectedItem.gameName }}</span>
          </p>
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
  import { resolveLocalData } from '../cache/load-policy';
  import { loadInventory } from '../cache/bot-social-queries';
  import { INVENTORY_FILTERS } from '../utils/inventory';
  import {
    NO_GAME_ID,
    INVENTORY_PAGE_SIZE,
    countByKind,
    filterInventoryItems,
    gameKey,
    isLegacyInventoryShape,
    paginateItems,
  } from '../utils/filter-inventory';
  import { prefetchInventoryPageIcons } from '../utils/prefetch-images';

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
        /** Raw inventory source of truth (from cache/IPC only). Filters never mutate this. */
        items: [],
        query: '',
        kindFilter: 'all',
        gameFilter: '',
        statusFilter: 'all',
        selectedId: '',
        page: 1,
        previewHdReady: false,
        loadToken: 0,
      };
    },
    computed: {
      /** Local view filters — never trigger IPC. */
      viewFilters() {
        return {
          query: this.query,
          kind: this.kindFilter,
          game: this.gameFilter,
          status: this.statusFilter,
        };
      },
      filteredItems() {
        return filterInventoryItems(this.items, this.viewFilters);
      },
      pagination() {
        return paginateItems(this.filteredItems, this.page, INVENTORY_PAGE_SIZE);
      },
      totalPages() {
        return this.pagination.totalPages;
      },
      pageItems() {
        return this.pagination.pageItems;
      },
      kindCounts() {
        return countByKind(this.items);
      },
      typeSelectOptions() {
        return INVENTORY_FILTERS
          .filter(id => id === 'all' || (this.kindCounts[id] || 0) > 0)
          .map(id => ({
            value: id,
            label: `${this.$t(`bot-social-inventory-filter-${id}`)} (${this.kindCounts[id] || 0})`,
          }));
      },
      gameSelectOptions() {
        const map = new Map();
        this.items.forEach(item => {
          const id = gameKey(item);
          const current = map.get(id);
          if (current) {
            current.count += 1;
            return;
          }
          map.set(id, {
            value: id,
            count: 1,
            name: id === NO_GAME_ID
              ? this.$t('bot-social-inventory-filter-game-none')
              : (item.gameName || id),
          });
        });
        const games = [...map.values()]
          .sort((a, b) => {
            if (a.value === NO_GAME_ID) return 1;
            if (b.value === NO_GAME_ID) return -1;
            return a.name.localeCompare(b.name);
          })
          .map(game => ({
            value: game.value,
            label: `${game.name} (${game.count})`,
          }));
        return [
          { value: '', label: this.$t('bot-social-inventory-filter-game-all', { n: this.items.length }) },
          ...games,
        ];
      },
      statusSelectOptions() {
        const tradable = this.items.filter(item => item.tradable).length;
        const marketable = this.items.filter(item => item.marketable).length;
        const both = this.items.filter(item => item.tradable && item.marketable).length;
        return [
          { value: 'all', label: `${this.$t('bot-social-inventory-filter-status-all')} (${this.items.length})` },
          { value: 'tradable', label: `${this.$t('bot-social-inventory-tradable')} (${tradable})` },
          { value: 'not_tradable', label: `${this.$t('bot-social-inventory-not-tradable')} (${this.items.length - tradable})` },
          { value: 'marketable', label: `${this.$t('bot-social-inventory-marketable')} (${marketable})` },
          { value: 'not_marketable', label: `${this.$t('bot-social-inventory-not-marketable')} (${this.items.length - marketable})` },
          { value: 'both', label: `${this.$t('bot-social-inventory-filter-status-both')} (${both})` },
        ];
      },
      hasActiveFilters() {
        return Boolean(this.query || this.kindFilter !== 'all' || this.gameFilter || this.statusFilter !== 'all');
      },
      selectedOnPage() {
        return this.pageItems.some(item => item.id === this.selectedId);
      },
      selectedItem() {
        if (!this.selectedId) return null;
        return this.items.find(item => item.id === this.selectedId)
          || this.filteredItems.find(item => item.id === this.selectedId)
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
          this.resetViewState();
          this.bootstrap(name);
        },
      },
      selectedId() {
        this.previewHdReady = false;
      },
      // View-only watchers: reset page / selection. Never call load()/IPC.
      query() {
        this.onViewFiltersChanged();
      },
      kindFilter() {
        this.onViewFiltersChanged();
      },
      gameFilter() {
        this.onViewFiltersChanged();
      },
      statusFilter() {
        this.onViewFiltersChanged();
      },
      filteredItems() {
        if (this.page !== this.pagination.page) this.page = this.pagination.page;
        this.ensureSelectionInFilter();
        this.warmNearbyIcons();
      },
      page() {
        this.warmNearbyIcons();
      },
    },
    methods: {
      warmNearbyIcons() {
        // Browser HTTP cache only — never ASF/IPC. Softens page-change thumbnail flash.
        this.$nextTick(() => {
          prefetchInventoryPageIcons(this.filteredItems, this.page, INVENTORY_PAGE_SIZE);
        });
      },
      resetViewState() {
        this.selectedId = '';
        this.page = 1;
        this.query = '';
        this.kindFilter = 'all';
        this.gameFilter = '';
        this.statusFilter = 'all';
        this.previewHdReady = false;
        this.error = '';
      },
      /**
       * Mount / bot change:
       * - Reuse any cached inventory (fresh or stale) → 0 network
       * - Fetch only when cache is empty / unusable
       * - Manual Actualizar is the only forced refresh path
       */
      bootstrap(botName) {
        const resolved = resolveLocalData({
          resource: 'inventory',
          botName,
          isUsable: data => Array.isArray(data) && !isLegacyInventoryShape(data),
        });

        if (resolved.hasData) {
          this.items = resolved.data;
          this.ensureSelectionInFilter();
          this.$emit('loaded', { total: this.items.length });
          this.warmNearbyIcons();
          return;
        }

        // Legacy shape without `kind` — force one re-fetch to rebuild normalized cache.
        const legacy = resolveLocalData({
          resource: 'inventory',
          botName,
          isUsable: () => true,
        });
        if (legacy.hasData && isLegacyInventoryShape(legacy.data)) {
          this.items = [];
          this.fetchInventory(true);
          return;
        }

        this.items = [];
        this.fetchInventory(false);
      },
      onViewFiltersChanged() {
        this.page = 1;
        this.ensureSelectionInFilter();
      },
      ensureSelectionInFilter() {
        if (!this.filteredItems.length) {
          this.selectedId = '';
          return;
        }
        if (this.selectedId && this.filteredItems.some(item => item.id === this.selectedId)) return;
        this.selectedId = this.filteredItems[0].id;
      },
      selectItem(id) {
        if (this.selectedId === id) return;
        this.selectedId = id;
      },
      clearFilters() {
        // Local only — does not touch cache or IPC.
        this.query = '';
        this.kindFilter = 'all';
        this.gameFilter = '';
        this.statusFilter = 'all';
        this.page = 1;
      },
      onPreviewHdLoad() {
        this.previewHdReady = true;
      },
      onPreviewHdError() {
        this.previewHdReady = true;
      },
      async fetchInventory(force) {
        const token = ++this.loadToken;
        const hasData = this.items.length > 0;
        this.loading = !hasData;
        this.refreshing = Boolean(force && hasData);
        if (force) this.error = '';

        try {
          const result = await loadInventory(this.botName, { force: Boolean(force) });
          if (token !== this.loadToken) return;
          this.items = result.data || [];
          if (result.rateLimited) {
            this.$error(this.$t('bot-social-rate-limited'));
          } else if (result.error && result.stale) {
            this.error = result.error.message || String(result.error);
          } else {
            this.error = '';
          }
          this.ensureSelectionInFilter();
          this.$emit('loaded', { total: this.items.length });
          this.warmNearbyIcons();
        } catch (err) {
          if (token !== this.loadToken) return;
          if (err?.code === 'RATE_LIMITED') {
            this.$error(this.$t('bot-social-rate-limited'));
          } else if (!hasData) {
            this.error = err.message || String(err);
            this.items = [];
          } else {
            this.error = err.message || String(err);
          }
        } finally {
          if (token === this.loadToken) {
            this.loading = false;
            this.refreshing = false;
          }
        }
      },
      refresh() {
        // Explicit user action — the only path that may hit Steam/IPC when data exists.
        if (this.loading || this.refreshing) return;
        this.fetchInventory(true);
      },
    },
  };
</script>
