<template>
  <section class="bulk-actions-setup-panel bulk-actions-setup-panel--inventory" :aria-label="title">
    <div class="bulk-actions-setup-panel__body">
      <div class="bulk-actions__inv-toolbar">
        <label class="bulk-actions-bots__search">
          <FontAwesomeIcon icon="search" aria-hidden="true"></FontAwesomeIcon>
          <input
            v-model.trim="query"
            type="search"
            :placeholder="$t('bulk-action-inventory-search')"
            :aria-label="$t('bulk-action-inventory-search')"
          >
        </label>
        <button
          type="button"
          class="bulk-actions-bots__chip"
          :disabled="loading"
          @click="loadAll(true)"
        >
          <FontAwesomeIcon :icon="loading ? 'spinner' : 'redo-alt'" :spin="loading"></FontAwesomeIcon>
          {{ $t('bot-social-refresh') }}
        </button>
      </div>

      <div class="bulk-actions__inv-filters" role="group" :aria-label="$t('bulk-action-inventory-filters')">
        <label class="bulk-actions-field bulk-actions-field--compact">
          <span class="bulk-actions-field__label">{{ $t('bulk-action-inventory-filter-bot') }}</span>
          <select v-model="botFilter" class="bulk-actions-field__control">
            <option value="">{{ $t('bulk-action-inventory-filter-bot-all') }}</option>
            <option v-for="name in botNamesWithItems" :key="name" :value="name">{{ name }}</option>
          </select>
        </label>
        <label class="bulk-actions-field bulk-actions-field--compact">
          <span class="bulk-actions-field__label">{{ $t('bulk-action-inventory-filter-kind') }}</span>
          <select v-model="kindFilter" class="bulk-actions-field__control">
            <option value="all">{{ $t('bot-social-inventory-filter-all') }}</option>
            <option v-for="kind in kindOptions" :key="kind" :value="kind">
              {{ kindLabel(kind) }}
            </option>
          </select>
        </label>
        <label class="bulk-actions-field bulk-actions-field--compact">
          <span class="bulk-actions-field__label">{{ $t('bulk-action-inventory-filter-game') }}</span>
          <select v-model="gameFilter" class="bulk-actions-field__control">
            <option value="">{{ $t('bulk-action-inventory-filter-game-all') }}</option>
            <option v-for="game in gameOptions" :key="game.value" :value="game.value">{{ game.label }}</option>
          </select>
        </label>
        <label class="bulk-actions-field bulk-actions-field--compact">
          <span class="bulk-actions-field__label">{{ $t('bulk-action-inventory-filter-status') }}</span>
          <select v-model="statusFilter" class="bulk-actions-field__control">
            <option value="tradable">{{ $t('bot-social-inventory-tradable') }}</option>
            <option value="all">{{ $t('bot-social-inventory-filter-status-all') }}</option>
            <option value="marketable">{{ $t('bot-social-inventory-marketable') }}</option>
          </select>
        </label>
      </div>

      <p v-if="loadError" class="bot-social__inline-error">{{ loadError }}</p>
      <div class="bulk-actions__inv-count-row">
        <p class="bulk-actions__inv-count">
          {{ $t('bulk-action-inventory-showing', { shown: filteredItems.length, selected: selectedIds.length }) }}
        </p>
        <div class="bulk-actions__inv-count-actions">
          <button
            type="button"
            class="bulk-actions-bots__chip"
            :disabled="!selectableFilteredCount"
            @click="selectAllFiltered"
          >
            {{ $t('bulk-action-inventory-select-all') }}
          </button>
          <button
            type="button"
            class="bulk-actions-bots__chip"
            :disabled="!selectedIds.length"
            @click="clearSelection"
          >
            {{ $t('bulk-action-inventory-clear-selection') }}
          </button>
        </div>
      </div>

      <div v-if="loading && !allItems.length" class="bulk-actions__inv-loading" role="status">
        <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
        {{ $t('bot-social-loading') }}
      </div>

      <div v-else-if="!filteredItems.length" class="bulk-actions__empty">
        {{ $t('bulk-action-inventory-empty') }}
      </div>

      <ul v-else class="bulk-actions__inv-grid" role="listbox" :aria-label="$t('bulk-action-inventory-grid')">
        <li v-for="item in pageItems" :key="item.botName + ':' + item.id">
          <button
            type="button"
            class="bulk-actions__inv-cell"
            :class="{ 'is-checked': isSelected(item), 'is-locked': !item.tradable }"
            :disabled="!item.tradable"
            :aria-pressed="isSelected(item) ? 'true' : 'false'"
            :title="item.name + ' · ' + item.botName"
            @click="toggleItem(item)"
          >
            <span class="bulk-actions__inv-check" :class="{ 'is-on': isSelected(item) }" aria-hidden="true"></span>
            <img v-if="item.iconUrl" class="bulk-actions__inv-thumb" :src="item.iconUrl" :alt="item.name">
            <span class="bulk-actions__inv-meta">{{ item.botName }}</span>
          </button>
        </li>
      </ul>

      <div v-if="totalPages > 1" class="bulk-actions__pager">
        <button type="button" class="button button--link" :disabled="page <= 1" @click="page -= 1">&lsaquo;</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button type="button" class="button button--link" :disabled="page >= totalPages" @click="page += 1">&rsaquo;</button>
      </div>
    </div>

    <footer class="bulk-actions-setup-bar">
      <div class="bulk-actions-setup-bar__copy">
        <p class="bulk-actions-setup-bar__hint">{{ $t('bulk-actions-setup-hint') }}</p>
      </div>
      <div class="bulk-actions-setup-bar__actions">
        <button
          type="button"
          class="bulk-actions-bots__chip"
          :disabled="!selectedIds.length"
          @click="clearSelection"
        >
          {{ $t('bulk-action-inventory-clear-selection') }}
        </button>
        <button
          type="button"
          class="button button--confirm bulk-actions-setup-bar__cta"
          :disabled="!canSubmit || busy"
          @click="openConfirm = true"
        >
          {{ $t('bulk-actions-run') }}
          <FontAwesomeIcon icon="play" aria-hidden="true"></FontAwesomeIcon>
        </button>
      </div>
    </footer>

    <BulkConfirmDialog
      :open="openConfirm"
      :title="$t('bulk-actions-confirm-title')"
      :lead="$t('bulk-actions-confirm-lead')"
      :lines="confirmLines"
      :warning="$t('bulk-actions-confirm-warning')"
      :confirmLabel="$t('bulk-actions-run')"
      @cancel="openConfirm = false"
      @confirm="onConfirm"
    ></BulkConfirmDialog>

    <BulkProgressModal
      :open="progressOpen"
      :running="runner.running"
      :current="runner.current"
      :total="runner.total"
      :label="runner.label"
      :results="runner.results"
      @cancel="runner.cancel()"
      @close="onProgressClose"
    ></BulkProgressModal>
  </section>
</template>

<script>
  import { isPluginMissingError, transferInventory } from '../../../bot-social/api/bot-social';
  import { loadInventory } from '../../../bot-social/cache/bot-social-queries';
  import { INVENTORY_FILTERS } from '../../../bot-social/utils/inventory';
  import {
    filterInventoryItems, gameKey, NO_GAME_ID, paginateItems,
  } from '../../../bot-social/utils/filter-inventory';
  import { createBulkRunner, groupInventoryTransferBatches } from '../../composables/use-bulk-runner';
  import BulkConfirmDialog from '../confirm-dialog.vue';
  import BulkProgressModal from '../progress-modal.vue';

  const PAGE_SIZE = 40;
  const LOAD_CONCURRENCY = 3;

  function pickFlag(entry, pascal, camel) {
    if (!entry || typeof entry !== 'object') return undefined;
    if (Object.prototype.hasOwnProperty.call(entry, pascal)) return entry[pascal];
    if (Object.prototype.hasOwnProperty.call(entry, camel)) return entry[camel];
    return undefined;
  }

  export default {
    name: 'BulkInventoryTransferAction',
    components: { BulkConfirmDialog, BulkProgressModal },
    props: {
      action: { type: Object, required: true },
      bots: { type: Array, default: () => [] },
      destinationBot: { type: String, required: true },
    },
    data() {
      return {
        allItems: [],
        selectedKeys: {},
        query: '',
        botFilter: '',
        kindFilter: 'all',
        gameFilter: '',
        statusFilter: 'tradable',
        page: 1,
        loading: false,
        loadError: '',
        openConfirm: false,
        progressOpen: false,
        busy: false,
        completedOk: false,
        runner: createBulkRunner(),
        kindOptions: INVENTORY_FILTERS.filter(k => k !== 'all'),
      };
    },
    computed: {
      title() { return this.$t(this.action.titleKey); },
      botNamesWithItems() {
        return [...new Set(this.allItems.map(i => i.botName))].sort();
      },
      gameOptions() {
        const map = new Map();
        this.allItems.forEach(item => {
          const key = gameKey(item);
          if (key === NO_GAME_ID) return;
          if (!map.has(key)) {
            map.set(key, item.gameName || key);
          }
        });
        return [...map.entries()]
          .map(([value, label]) => ({ value, label }))
          .sort((a, b) => a.label.localeCompare(b.label));
      },
      filteredItems() {
        let list = this.allItems;
        if (this.botFilter) list = list.filter(i => i.botName === this.botFilter);
        return filterInventoryItems(list, {
          query: this.query,
          kind: this.kindFilter,
          game: this.gameFilter,
          status: this.statusFilter,
        });
      },
      pagination() {
        return paginateItems(this.filteredItems, this.page, PAGE_SIZE);
      },
      pageItems() {
        return this.pagination.pageItems;
      },
      totalPages() {
        return this.pagination.totalPages;
      },
      selectedIds() {
        return Object.keys(this.selectedKeys).filter(k => this.selectedKeys[k]);
      },
      selectedItems() {
        const set = new Set(this.selectedIds);
        return this.allItems.filter(item => set.has(this.itemKey(item)));
      },
      selectedSourceBots() {
        return [...new Set(this.selectedItems.map(i => i.botName))];
      },
      selectableFilteredCount() {
        return this.filteredItems.filter(item => item.tradable).length;
      },
      canSubmit() {
        return this.selectedItems.length > 0
          && Boolean(this.destinationBot)
          && !this.selectedSourceBots.includes(this.destinationBot);
      },
      confirmLines() {
        return [
          this.$t('bulk-action-inventory-confirm-items', { n: this.selectedItems.length }),
          this.$t('bulk-action-inventory-confirm-sources', { n: this.selectedSourceBots.length }),
          this.$t('bulk-action-inventory-confirm-destination', { bot: this.destinationBot }),
        ];
      },
    },
    watch: {
      filteredItems() {
        if (this.page > this.totalPages) this.page = this.totalPages;
      },
      bots: {
        immediate: true,
        handler() {
          this.loadAll(false);
        },
      },
    },
    methods: {
      kindLabel(kind) {
        return this.$t(`bot-social-inventory-filter-${kind}`);
      },
      itemKey(item) {
        return `${item.botName}:${item.id}`;
      },
      isSelected(item) {
        return Boolean(this.selectedKeys[this.itemKey(item)]);
      },
      toggleItem(item) {
        if (!item.tradable) return;
        const key = this.itemKey(item);
        this.$set(this.selectedKeys, key, !this.selectedKeys[key]);
      },
      selectAllFiltered() {
        const next = { ...this.selectedKeys };
        this.filteredItems.forEach(item => {
          if (!item.tradable) return;
          next[this.itemKey(item)] = true;
        });
        this.selectedKeys = next;
      },
      clearSelection() {
        this.selectedKeys = {};
      },
      async loadAll(force) {
        if (!this.bots.length) {
          this.allItems = [];
          return;
        }
        this.loading = true;
        this.loadError = '';
        const aggregated = [];
        const names = this.bots.map(b => b.name);
        try {
          for (let i = 0; i < names.length; i += LOAD_CONCURRENCY) {
            const chunk = names.slice(i, i + LOAD_CONCURRENCY);
            const results = await Promise.all(chunk.map(async botName => {
              try {
                const result = await loadInventory(botName, { force });
                const items = (result && result.data) || [];
                return items.map(item => ({ ...item, botName }));
              } catch (err) {
                if (isPluginMissingError(err)) {
                  this.$emit('plugin-missing');
                  throw err;
                }
                return [];
              }
            }));
            results.forEach(list => aggregated.push(...list));
          }
          this.allItems = aggregated;
        } catch (err) {
          this.loadError = (err && err.message) || String(err);
        } finally {
          this.loading = false;
        }
      },
      async onConfirm() {
        this.openConfirm = false;
        this.busy = true;
        this.progressOpen = true;
        this.completedOk = false;
        const batches = groupInventoryTransferBatches(this.selectedItems);
        const target = this.destinationBot;
        try {
          await this.runner.runSteps(batches.map(batch => ({
            label: batch.sourceBotName,
            run: async () => {
              try {
                const payload = await transferInventory(batch.sourceBotName, {
                  assetIds: batch.assetIds,
                  targetBotName: target,
                });
                const entry = (payload && payload[batch.sourceBotName]) || payload;
                const success = pickFlag(entry, 'Success', 'success');
                const message = pickFlag(entry, 'Message', 'message');
                return {
                  botName: batch.sourceBotName,
                  ok: success !== false,
                  message: String(message || ''),
                };
              } catch (err) {
                if (isPluginMissingError(err)) this.$emit('plugin-missing');
                throw err;
              }
            },
          })));
          this.completedOk = this.runner.results.some(row => row.ok);
        } finally {
          this.busy = false;
        }
      },
      onProgressClose() {
        this.progressOpen = false;
        this.runner.reset();
        this.clearSelection();
        if (this.completedOk) {
          this.$emit('finished');
          return;
        }
        this.loadAll(true);
      },
    },
  };
</script>
