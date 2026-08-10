<template>
  <div class="bot-social-tab bot-social-tab--wishlist">
    <PluginMissing v-if="pluginMissing"></PluginMissing>

    <template v-else>
      <div class="bot-social-games__chrome">
        <div class="bot-social-games__views" role="tablist" :aria-label="$t('bot-social-wishlist-views')">
          <button
            type="button"
            role="tab"
            class="bot-social-games__view"
            :class="{ 'is-active': panelMode === 'library' }"
            :aria-selected="panelMode === 'library' ? 'true' : 'false'"
            @click="setPanelMode('library')"
          >
            <FontAwesomeIcon icon="book-open" aria-hidden="true"></FontAwesomeIcon>
            {{ $t('bot-social-games-view-library') }}
          </button>
          <button
            type="button"
            role="tab"
            class="bot-social-games__view"
            :class="{ 'is-active': panelMode === 'banner' }"
            :aria-selected="panelMode === 'banner' ? 'true' : 'false'"
            @click="setPanelMode('banner')"
          >
            <FontAwesomeIcon icon="gamepad" aria-hidden="true"></FontAwesomeIcon>
            {{ $t('bot-social-games-view-banner') }}
          </button>
          <button
            type="button"
            role="tab"
            class="bot-social-games__view"
            :class="{ 'is-active': panelMode === 'add' }"
            :aria-selected="panelMode === 'add' ? 'true' : 'false'"
            @click="setPanelMode('add')"
          >
            <FontAwesomeIcon icon="plus" aria-hidden="true"></FontAwesomeIcon>
            {{ $t('bot-social-games-view-add') }}
          </button>
        </div>

        <div v-show="isBrowseMode" class="bot-social-games__chrome-bar">
          <label class="bot-social-games__searchbox">
            <FontAwesomeIcon class="bot-social-games__search-icon" icon="search" aria-hidden="true"></FontAwesomeIcon>
            <input
              v-model.trim="query"
              class="bot-social-games__search-input"
              type="search"
              :placeholder="$t('bot-social-search')"
              :aria-label="$t('bot-social-search')"
            >
          </label>

          <div class="bot-social-games__chrome-actions">
            <p class="bot-social-games__count">
              {{ $t('bot-social-wishlist-showing', { shown: filteredItems.length, total: items.length }) }}
            </p>
            <button
              v-if="query"
              type="button"
              class="bot-social-games__clear"
              @click="query = ''"
            >
              {{ $t('bot-social-games-clear-search') }}
            </button>
            <button
              type="button"
              class="bot-social-games__refresh"
              :disabled="loading || refreshing || mutating"
              @click="refresh"
            >
              <FontAwesomeIcon v-if="refreshing || loading" icon="spinner" spin></FontAwesomeIcon>
              <span v-else>{{ $t('bot-social-refresh') }}</span>
            </button>
          </div>
        </div>

        <div
          v-show="isBrowseMode"
          class="bot-social-games__filterbar wishlist-hub__filterbar"
          role="group"
          :aria-label="$t('bot-social-wishlist-filters')"
        >
          <div class="bot-social-games__field">
            <span id="wishlist-filter-sort-label" class="bot-social-games__field-label">
              {{ $t('bot-social-wishlist-filter-sort') }}
            </span>
            <AsfSelect
              v-model="sortFilter"
              compact
              aria-labelledby="wishlist-filter-sort-label"
              :options="sortOptions"
              :search-placeholder="$t('bot-social-games-filter-search-options')"
            ></AsfSelect>
          </div>

          <button
            v-if="hasActiveFilters"
            type="button"
            class="bot-social-games__clear-filters"
            @click="clearFilters"
          >
            {{ $t('bot-social-games-clear-filters') }}
          </button>
        </div>
      </div>

      <form v-if="panelMode === 'add'" class="wishlist-hub__add" @submit.prevent="onAdd">
        <p class="wishlist-hub__add-lead">{{ $t('bot-social-wishlist-compose-lead') }}</p>
        <label class="wishlist-hub__add-combo" for="wishlist-add-input">
          <FontAwesomeIcon class="wishlist-hub__add-icon" icon="heart" aria-hidden="true"></FontAwesomeIcon>
          <input
            id="wishlist-add-input"
            v-model.trim="appIdInput"
            class="wishlist-hub__add-input"
            type="text"
            autocomplete="off"
            spellcheck="false"
            :placeholder="$t('bot-social-wishlist-add-placeholder')"
            :aria-label="$t('bot-social-wishlist-compose-title')"
            :disabled="mutating"
          >
          <button
            type="submit"
            class="wishlist-hub__add-submit"
            :disabled="!parsedAppId || mutating"
          >
            <FontAwesomeIcon v-if="mutating" icon="spinner" spin aria-hidden="true"></FontAwesomeIcon>
            <span v-else>{{ $t('bot-social-wishlist-add') }}</span>
          </button>
        </label>
      </form>

      <div v-show="isBrowseMode" class="bot-social-games__browse">
        <div v-if="loading && !items.length" class="bot-social__state">
          <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
          <span>{{ $t('bot-social-loading') }}</span>
        </div>
        <div v-else-if="error && !items.length" class="bot-social__state bot-social__state--error">{{ error }}</div>
        <template v-else>
          <p v-if="error" class="bot-social__inline-error">{{ error }}</p>
          <div v-if="!filteredItems.length" class="bot-social__state">
            {{ query ? $t('bot-social-games-empty') : $t('bot-social-wishlist-empty') }}
          </div>
          <div
            v-else
            class="bot-social-games"
            :class="[
              `bot-social-games--${browseVariant}`,
              { 'is-refreshing': refreshing || loading || mutating },
            ]"
          >
            <div
              v-for="item in filteredItems"
              :key="item.appId"
              class="wishlist-hub__tile"
            >
              <CoverTile
                :game="item"
                :botName="botName"
                :variant="browseVariant"
              ></CoverTile>
              <button
                type="button"
                class="wishlist-hub__remove"
                :disabled="mutating"
                :aria-label="$t('bot-social-wishlist-remove-aria', { name: item.name })"
                :title="$t('delete')"
                @click="onRemove(item)"
              >
                <FontAwesomeIcon icon="times" aria-hidden="true"></FontAwesomeIcon>
              </button>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script>
  import {
    addWishlist, isPluginMissingError, removeWishlist,
  } from '../api/bot-social';
  import { invalidateWishlist, loadWishlist } from '../cache/bot-social-queries';
  import { resolveLocalData } from '../cache/load-policy';
  import { parseGameAppId } from '../utils/game-target';
  import CoverTile from './games/cover-tile.vue';
  import PluginMissing from './PluginMissing.vue';

  const PANEL_STORAGE_KEY = 'asf-bot-social-wishlist-panel';
  const PANEL_MODES = new Set(['library', 'banner', 'add']);
  const DEFAULT_SORT = 'name-asc';

  function readStoredPanel() {
    try {
      const value = localStorage.getItem(PANEL_STORAGE_KEY);
      return PANEL_MODES.has(value) ? value : 'library';
    } catch {
      return 'library';
    }
  }

  function isBrowse(mode) {
    return mode === 'library' || mode === 'banner';
  }

  export default {
    name: 'BotSocialWishlistTab',
    components: { CoverTile, PluginMissing },
    props: {
      botName: { type: String, required: true },
      pluginMissing: { type: Boolean, default: false },
    },
    data() {
      const panelMode = readStoredPanel();
      return {
        loading: false,
        refreshing: false,
        mutating: false,
        error: '',
        items: [],
        appIdInput: '',
        query: '',
        sortFilter: DEFAULT_SORT,
        panelMode,
        browseVariant: isBrowse(panelMode) ? panelMode : 'library',
      };
    },
    computed: {
      isBrowseMode() {
        return isBrowse(this.panelMode);
      },
      hasActiveFilters() {
        return this.sortFilter !== DEFAULT_SORT;
      },
      parsedAppId() {
        return parseGameAppId(this.appIdInput) || 0;
      },
      sortOptions() {
        return [
          { value: 'name-asc', label: this.$t('bot-social-wishlist-sort-name-asc') },
          { value: 'name-desc', label: this.$t('bot-social-wishlist-sort-name-desc') },
          { value: 'appid-asc', label: this.$t('bot-social-wishlist-sort-appid-asc') },
          { value: 'appid-desc', label: this.$t('bot-social-wishlist-sort-appid-desc') },
        ];
      },
      filteredItems() {
        const q = this.query.trim().toLowerCase();
        let list = this.items;
        if (q) {
          list = list.filter((item) => {
            const name = String(item.name || '').toLowerCase();
            const id = String(item.appId || '');
            return name.includes(q) || id.includes(q);
          });
        }

        const sorted = list.slice();
        sorted.sort((a, b) => {
          const nameA = String(a.name || '').toLowerCase();
          const nameB = String(b.name || '').toLowerCase();
          const idA = Number(a.appId) || 0;
          const idB = Number(b.appId) || 0;
          switch (this.sortFilter) {
            case 'name-desc':
              return nameB.localeCompare(nameA) || idA - idB;
            case 'appid-asc':
              return idA - idB || nameA.localeCompare(nameB);
            case 'appid-desc':
              return idB - idA || nameA.localeCompare(nameB);
            case 'name-asc':
            default:
              return nameA.localeCompare(nameB) || idA - idB;
          }
        });
        return sorted;
      },
    },
    watch: {
      botName: {
        immediate: true,
        handler() {
          this.query = '';
          this.appIdInput = '';
          this.sortFilter = DEFAULT_SORT;
          this.bootstrap();
        },
      },
      pluginMissing(value) {
        if (!value) this.bootstrap();
      },
    },
    methods: {
      setPanelMode(mode) {
        if (!PANEL_MODES.has(mode) || mode === this.panelMode) return;
        this.panelMode = mode;
        if (isBrowse(mode)) this.browseVariant = mode;
        try {
          localStorage.setItem(PANEL_STORAGE_KEY, mode);
        } catch {
          // ignore
        }
      },
      clearFilters() {
        this.sortFilter = DEFAULT_SORT;
      },
      bootstrap() {
        if (this.pluginMissing) return;
        const resolved = resolveLocalData({
          resource: 'wishlist',
          botName: this.botName,
          isUsable: data => Array.isArray(data?.items),
        });
        if (resolved.hasData) {
          this.items = resolved.data.items;
          this.$emit('loaded', { total: resolved.data.total ?? this.items.length });
          return;
        }
        this.load(false);
      },
      formatError(err) {
        const msg = err?.message || String(err);
        return /wishlist|503|unavailable|steam/i.test(msg)
          ? this.$t('bot-social-wishlist-unavailable')
          : msg;
      },
      async load(force) {
        if (this.pluginMissing) return;
        const hasData = this.items.length > 0;
        this.loading = !hasData;
        this.refreshing = force && hasData;
        if (force) this.error = '';

        try {
          const result = await loadWishlist(this.botName, { force });
          this.items = result.data?.items || [];
          if (result.rateLimited) this.$error(this.$t('bot-social-rate-limited'));
          else if (result.error && result.stale) this.error = this.formatError(result.error);
          else this.error = '';
          this.$emit('loaded', { total: result.data?.total ?? this.items.length });
        } catch (err) {
          if (isPluginMissingError(err)) {
            this.$emit('plugin-missing');
            return;
          }
          if (err?.code === 'RATE_LIMITED') this.$error(this.$t('bot-social-rate-limited'));
          else if (!hasData) {
            this.error = this.formatError(err);
            this.items = [];
            this.$emit('loaded', { total: null });
          } else this.error = this.formatError(err);
        } finally {
          this.loading = false;
          this.refreshing = false;
        }
      },
      refresh() {
        if (this.loading || this.refreshing || this.mutating) return;
        this.load(true);
      },
      async onAdd() {
        if (!this.parsedAppId || this.mutating) return;
        this.mutating = true;
        try {
          await addWishlist(this.botName, [this.parsedAppId]);
          this.$success(this.$t('bot-social-wishlist-add-success'));
          this.appIdInput = '';
          invalidateWishlist(this.botName);
          await this.load(true);
          this.setPanelMode('library');
        } catch (err) {
          if (isPluginMissingError(err)) this.$emit('plugin-missing');
          else this.$error(err.message || String(err));
        } finally {
          this.mutating = false;
        }
      },
      async onRemove(item) {
        if (this.mutating) return;
        const ok = window.confirm(this.$t('bot-social-wishlist-remove-confirm', { name: item.name }));
        if (!ok) return;
        this.mutating = true;
        try {
          await removeWishlist(this.botName, [Number(item.appId)]);
          this.$success(this.$t('bot-social-wishlist-remove-success'));
          invalidateWishlist(this.botName);
          await this.load(true);
        } catch (err) {
          if (isPluginMissingError(err)) this.$emit('plugin-missing');
          else this.$error(err.message || String(err));
        } finally {
          this.mutating = false;
        }
      },
    },
  };
</script>
