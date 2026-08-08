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
            class="steam-inv__select-toggle"
            :class="{ 'is-on': selectMode }"
            :disabled="loading || transferring"
            @click="toggleSelectMode"
          >
            {{ selectMode ? $t('bot-social-inventory-select-done') : $t('bot-social-inventory-select-mode') }}
          </button>
          <button
            type="button"
            class="steam-inv__refresh"
            :disabled="loading || refreshing || transferring"
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
            :disabled="selectMode"
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
              :class="{
                'is-selected': selectedId === item.id,
                'is-checked': isChecked(item.id),
                'is-locked': selectMode && !item.tradable,
              }"
              :aria-selected="selectedId === item.id ? 'true' : 'false'"
              :title="item.tradable ? item.name : `${item.name} (${$t('bot-social-inventory-not-tradable')})`"
              @click="onCellClick(item, $event)"
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

          <div v-if="selectMode" class="steam-inv__selection-bar">
            <span>{{ $t('bot-social-inventory-selected-count', { n: checkedCount }) }}</span>
            <div class="steam-inv__selection-actions">
              <button type="button" class="button button--link" :disabled="!filteredTradableCount" @click="selectAllFilteredTradable">
                {{ $t('bot-social-inventory-select-all-filtered') }}
              </button>
              <button type="button" class="button button--link" :disabled="!checkedCount" @click="clearChecked">
                {{ $t('bot-social-inventory-clear-selection') }}
              </button>
              <button
                type="button"
                class="button button--confirm"
                :disabled="!checkedCount || transferring"
                @click="openTransferDialog"
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
          <div class="steam-inv__detail-actions">
            <button
              v-if="selectedItem.tradable"
              type="button"
              class="steam-inv__transfer-one"
              :disabled="transferring"
              @click="transferSingle(selectedItem)"
            >
              {{ $t('bot-social-inventory-transfer-one') }}
            </button>
            <a
              v-if="selectedItem.marketable && selectedItem.marketUrl"
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

    <TransferDialog
      :open="transferOpen"
      :source-bot-name="botName"
      :asset-ids="transferAssetIds"
      :submitting="transferring"
      @cancel="closeTransferDialog"
      @confirm="onTransferConfirm"
    ></TransferDialog>
  </div>
</template>

<script>
  import { isPluginMissingError, transferInventory } from '../api/bot-social';
  import { resolveLocalData } from '../cache/load-policy';
  import { invalidateInventory, loadInventory } from '../cache/bot-social-queries';
  import { STEAM_APP_ID, STEAM_COMMUNITY_CONTEXT_ID } from '../constants/steam-inventory';
  import { INVENTORY_FILTERS, sortInventoryItems } from '../utils/inventory';
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
  import TransferDialog from './transfer/dialog.vue';

  export default {
    name: 'BotSocialInventoryTab',
    components: { TransferDialog },
    props: {
      botName: { type: String, required: true },
    },
    data() {
      return {
        loading: false,
        refreshing: false,
        transferring: false,
        error: '',
        items: [],
        query: '',
        kindFilter: 'all',
        gameFilter: '',
        statusFilter: 'all',
        selectedId: '',
        checkedIds: [],
        selectMode: false,
        statusFilterBeforeSelect: 'all',
        transferOpen: false,
        transferAssetIds: [],
        page: 1,
        previewHdReady: false,
        loadToken: 0,
      };
    },
    computed: {
      viewFilters() {
        return {
          query: this.query,
          kind: this.kindFilter,
          game: this.gameFilter,
          // Select mode is for transfer: only tradable items are listed.
          status: this.selectMode ? 'tradable' : this.statusFilter,
        };
      },
      filteredItems() {
        return filterInventoryItems(this.items, this.viewFilters);
      },
      filteredTradableCount() {
        return this.filteredItems.filter(item => item.tradable).length;
      },
      checkedCount() {
        return this.checkedIds.length;
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
        this.pruneCheckedToExisting();
        this.warmNearbyIcons();
      },
      page() {
        this.warmNearbyIcons();
      },
    },
    methods: {
      warmNearbyIcons() {
        this.$nextTick(() => {
          prefetchInventoryPageIcons(this.filteredItems, this.page, INVENTORY_PAGE_SIZE);
        });
      },
      resetViewState() {
        this.selectedId = '';
        this.checkedIds = [];
        this.selectMode = false;
        this.statusFilterBeforeSelect = 'all';
        this.transferOpen = false;
        this.transferAssetIds = [];
        this.page = 1;
        this.query = '';
        this.kindFilter = 'all';
        this.gameFilter = '';
        this.statusFilter = 'all';
        this.previewHdReady = false;
        this.error = '';
      },
      bootstrap(botName) {
        const resolved = resolveLocalData({
          resource: 'inventory',
          botName,
          isUsable: data => Array.isArray(data) && !isLegacyInventoryShape(data),
        });
        if (resolved.hasData) {
          this.items = sortInventoryItems(resolved.data);
          this.ensureSelectionInFilter();
          this.$emit('loaded', { total: this.items.length });
          this.warmNearbyIcons();
          return;
        }
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
      pruneCheckedToExisting() {
        if (!this.checkedIds.length) return;
        const alive = new Set(this.items.map(item => item.id));
        this.checkedIds = this.checkedIds.filter(id => alive.has(id));
      },
      isChecked(id) {
        return this.checkedIds.includes(id);
      },
      toggleSelectMode() {
        if (!this.selectMode) {
          this.statusFilterBeforeSelect = this.statusFilter;
          this.selectMode = true;
          this.statusFilter = 'tradable';
          this.page = 1;
          this.checkedIds = this.checkedIds.filter(id => {
            const item = this.items.find(i => i.id === id);
            return item?.tradable;
          });
          return;
        }
        this.selectMode = false;
        this.checkedIds = [];
        this.statusFilter = this.statusFilterBeforeSelect || 'all';
        this.page = 1;
      },
      onCellClick(item, event) {
        this.selectItem(item.id);
        const multi = this.selectMode || event.ctrlKey || event.metaKey;
        if (!multi) return;
        if (!item.tradable) {
          this.$error(this.$t('bot-social-inventory-not-tradable-hint'));
          return;
        }
        this.toggleChecked(item.id);
      },
      toggleChecked(id) {
        const idx = this.checkedIds.indexOf(id);
        if (idx >= 0) this.checkedIds.splice(idx, 1);
        else this.checkedIds.push(id);
      },
      selectAllFilteredTradable() {
        const ids = this.filteredItems.filter(item => item.tradable).map(item => item.id);
        this.checkedIds = [...new Set([...this.checkedIds, ...ids])];
        this.selectMode = true;
      },
      clearChecked() {
        this.checkedIds = [];
      },
      selectItem(id) {
        if (this.selectedId === id) return;
        this.selectedId = id;
      },
      clearFilters() {
        this.query = '';
        this.kindFilter = 'all';
        this.gameFilter = '';
        this.statusFilter = 'all';
        this.page = 1;
      },
      openTransferDialog() {
        if (!this.checkedIds.length || this.transferring) return;
        this.transferAssetIds = [...this.checkedIds];
        this.transferOpen = true;
      },
      transferSingle(item) {
        if (!item?.tradable || this.transferring) return;
        this.transferAssetIds = [item.id];
        this.transferOpen = true;
      },
      closeTransferDialog() {
        if (this.transferring) return;
        this.transferOpen = false;
        this.transferAssetIds = [];
      },
      async onTransferConfirm({ targetBotName }) {
        if (this.transferring || !targetBotName || !this.transferAssetIds.length) return;
        this.transferring = true;
        try {
          const result = await transferInventory(this.botName, {
            assetIds: this.transferAssetIds,
            targetBotName,
            appId: STEAM_APP_ID,
            contextId: STEAM_COMMUNITY_CONTEXT_ID,
          });
          const payload = result?.[this.botName] ?? result;
          if (!payload?.Ok) {
            this.$error(payload?.Message || this.$t('bot-social-inventory-transfer-failed'));
            return;
          }
          const skipped = payload.Skipped?.length || 0;
          this.$success(this.$t('bot-social-inventory-transfer-success', {
            n: payload.Transferred ?? this.transferAssetIds.length,
            bot: payload.TargetBotName || targetBotName,
            skipped,
          }));
          this.transferOpen = false;
          this.transferAssetIds = [];
          this.checkedIds = [];
          this.selectMode = false;
          invalidateInventory(this.botName);
          await this.fetchInventory(true);
        } catch (err) {
          if (isPluginMissingError(err)) {
            this.$error(this.$t('bot-social-plugin-missing'));
          } else if (err?.result?.status === 429 || err?.code === 'RATE_LIMITED') {
            this.$error(this.$t('bot-social-rate-limited'));
          } else {
            this.$error(err.message || this.$t('bot-social-inventory-transfer-failed'));
          }
        } finally {
          this.transferring = false;
        }
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
          this.items = sortInventoryItems(result.data || []);
          if (result.rateLimited) this.$error(this.$t('bot-social-rate-limited'));
          else if (result.error && result.stale) this.error = result.error.message || String(result.error);
          else this.error = '';
          this.ensureSelectionInFilter();
          this.pruneCheckedToExisting();
          this.$emit('loaded', { total: this.items.length });
          this.warmNearbyIcons();
        } catch (err) {
          if (token !== this.loadToken) return;
          if (err?.code === 'RATE_LIMITED') this.$error(this.$t('bot-social-rate-limited'));
          else if (!hasData) {
            this.error = err.message || String(err);
            this.items = [];
          } else this.error = err.message || String(err);
        } finally {
          if (token === this.loadToken) {
            this.loading = false;
            this.refreshing = false;
          }
        }
      },
      refresh() {
        if (this.loading || this.refreshing || this.transferring) return;
        this.fetchInventory(true);
      },
    },
  };

</script>
