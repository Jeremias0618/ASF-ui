<template>
  <div class="steam-inv" :class="{ 'is-refreshing': refreshing && panelMode === 'inventory' }">
    <InventoryModeTabs :value="panelMode" @input="setPanelMode"></InventoryModeTabs>

    <TradeOffersPanel
      v-if="panelMode === 'trades'"
      :bot-name="botName"
      @plugin-missing="$emit('plugin-missing')"
    ></TradeOffersPanel>

    <template v-else>
      <InventoryChrome
        :query.sync="query"
        :kind-filter.sync="kindFilter"
        :game-filter.sync="gameFilter"
        :status-filter.sync="statusFilter"
        :shown-count="filteredItems.length"
        :total-count="items.length"
        :select-mode="selectMode"
        :select-disabled="loading || transferring"
        :refreshing="refreshing"
        :refresh-disabled="loading || refreshing || transferring"
        :has-active-filters="hasActiveFilters"
        :type-options="typeSelectOptions"
        :game-options="gameSelectOptions"
        :status-options="statusSelectOptions"
        @toggle-select="toggleSelectMode"
        @refresh="refresh"
        @clear-filters="clearFilters"
      ></InventoryChrome>

      <div v-if="loading && !items.length" class="steam-inv__content-loading">
        <InventorySkeleton></InventorySkeleton>
      </div>
      <div v-else-if="error && !items.length" class="bot-social__state bot-social__state--error">{{ error }}</div>
      <template v-else>
        <p v-if="error" class="bot-social__inline-error">{{ error }}</p>
        <div v-if="!items.length" class="bot-social__state">{{ $t('bot-social-inventory-empty') }}</div>
        <div v-else-if="!filteredItems.length" class="bot-social__state">{{ $t('bot-social-inventory-items-empty') }}</div>

        <div v-else class="steam-inv__shell">
          <InventoryItemGrid
            :page-items="pageItems"
            :page="page"
            :total-pages="totalPages"
            :page-transition-name="pageTransitionName"
            :selected-id="selectedId"
            :selected-on-page="selectedOnPage"
            :select-mode="selectMode"
            :checked-ids="checkedIds"
            :checked-count="checkedCount"
            :filtered-tradable-count="filteredTradableCount"
            :transferring="transferring"
            @cell-click="onCellClick"
            @select-all="selectAllFilteredTradable"
            @clear-selection="clearChecked"
            @transfer-selected="openTransferDialog"
            @page-prev="goToPage(page - 1)"
            @page-next="goToPage(page + 1)"
          ></InventoryItemGrid>

          <InventoryItemDetail
            :item="selectedItem"
            :tag-summary="tagSummary"
            :preview-hd-ready="previewHdReady"
            :transferring="transferring"
            @preview-hd-load="onPreviewHdLoad"
            @preview-hd-error="onPreviewHdError"
            @transfer-one="transferSingle"
          ></InventoryItemDetail>
        </div>
      </template>
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
  import { invalidateInventory, invalidateTradeOffers, loadInventory } from '../cache/bot-social-queries';
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
  import TradeOffersPanel from './inventory/trade-offers-panel.vue';
  import InventorySkeleton from './inventory/skeleton.vue';
  import { readModalView, replaceModalView } from '../../../utils/modal-view-query';

  const INVENTORY_VIEWS = new Set(['inventory', 'trades']);
  const INVENTORY_VIEW_DEFAULT = 'inventory';

  export default {
    name: 'BotSocialInventoryTab',
    components: {
      TransferDialog,
      TradeOffersPanel,
      InventorySkeleton,
      InventoryModeTabs,
      InventoryChrome,
      InventoryItemGrid,
      InventoryItemDetail,
    },
    props: {
      botName: { type: String, required: true },
    },
    data() {
      return {
        panelMode: readModalView(this.$route, INVENTORY_VIEWS, INVENTORY_VIEW_DEFAULT),
        loading: true,
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
        pageDirection: 'next',
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
      pageTransitionName() {
        return this.pageDirection === 'prev' ? 'steam-inv-page-prev' : 'steam-inv-page-next';
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
      '$route.query.view'() {
        this.syncPanelFromRoute();
      },
    },
    methods: {
      syncPanelFromRoute() {
        const next = readModalView(this.$route, INVENTORY_VIEWS, INVENTORY_VIEW_DEFAULT);
        if (next !== this.panelMode) this.panelMode = next;
      },
      warmNearbyIcons() {
        this.$nextTick(() => {
          prefetchInventoryPageIcons(this.filteredItems, this.page, INVENTORY_PAGE_SIZE);
        });
      },
      resetViewState() {
        this.syncPanelFromRoute();
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
        this.loading = true;
        this.items = [];
      },
      setPanelMode(mode) {
        if (!INVENTORY_VIEWS.has(mode) || mode === this.panelMode) return;
        this.panelMode = mode;
        replaceModalView(this.$router, this.$route, mode, INVENTORY_VIEW_DEFAULT);
      },
      bootstrap(botName) {
        const resolved = resolveLocalData({
          resource: 'inventory',
          botName,
          isUsable: data => Array.isArray(data) && !isLegacyInventoryShape(data),
        });
        if (resolved.hasData) {
          this.items = sortInventoryItems(resolved.data);
          this.loading = false;
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
      goToPage(nextPage) {
        const target = Number(nextPage);
        if (!Number.isInteger(target) || target < 1 || target > this.totalPages || target === this.page) {
          return;
        }

        this.pageDirection = target > this.page ? 'next' : 'prev';
        this.page = target;
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
          invalidateTradeOffers(this.botName);
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
