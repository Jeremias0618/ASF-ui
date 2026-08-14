<template>
  <div class="bot-social-tab bot-social-tab--wishlist">
    <PluginMissing v-if="pluginMissing"></PluginMissing>

    <template v-else>
      <AsfIconTabs
        :value="panelMode"
        :tabs="viewTabs"
        :aria-label="$t('bot-social-wishlist-views')"
        @input="setPanelMode"
      ></AsfIconTabs>

      <div v-show="isBrowseMode" class="bot-social-games__chrome">
        <GamesBrowseToolbar
          :query.sync="query"
          :busy="refreshing || loading"
          :refresh-disabled="loading || refreshing || mutating || cooldownSeconds > 0"
          :cooldown-seconds="cooldownSeconds"
          :show-filters="false"
          @refresh="refresh"
        >
          <template #count>
            {{ $t('bot-social-wishlist-showing', { shown: filteredItems.length, total: items.length }) }}
          </template>
        </GamesBrowseToolbar>
      </div>

      <section
        v-if="panelMode === 'add'"
        class="bot-social-games__chrome games-wishlist"
        :aria-label="$t('bot-social-wishlist-compose-title')"
      >
        <header class="games-wishlist__header">
          <p class="games-wishlist__eyebrow">{{ $t('bot-social-games-view-wishlist') }}</p>
          <h3 class="games-wishlist__title">{{ $t('bot-social-wishlist-compose-title') }}</h3>
          <p class="games-wishlist__lead">{{ $t('bot-social-wishlist-compose-lead') }}</p>
        </header>

        <form class="games-wishlist__form" @submit.prevent="onAdd">
          <label class="games-wishlist__label" for="wishlist-add-input">
            {{ $t('bot-social-games-wishlist-url-label') }}
          </label>
          <div class="games-wishlist__combo">
            <input
              id="wishlist-add-input"
              v-model.trim="appIdInput"
              class="games-wishlist__input"
              type="text"
              autocomplete="off"
              spellcheck="false"
              :placeholder="$t('bot-social-games-wishlist-placeholder')"
              :aria-label="$t('bot-social-wishlist-compose-title')"
              :disabled="mutating || cooldownSeconds > 0"
            >
            <button
              type="submit"
              class="games-wishlist__submit"
              :disabled="!parsedAppId || mutating || cooldownSeconds > 0"
            >
              <FontAwesomeIcon v-if="mutating" icon="spinner" spin aria-hidden="true"></FontAwesomeIcon>
              <span v-else-if="cooldownSeconds > 0">
                {{ $t('bot-social-community-submit-cooldown', { s: cooldownSeconds }) }}
              </span>
              <span v-else>{{ $t('bot-social-wishlist-add') }}</span>
            </button>
          </div>
        </form>

        <div class="games-wishlist__help" :aria-label="$t('bot-social-games-wishlist-formats')">
          <p class="games-wishlist__help-title">{{ $t('bot-social-games-wishlist-formats') }}</p>
          <ul class="games-wishlist__examples">
            <li><code>{{ $t('bot-social-games-wishlist-example-url') }}</code></li>
            <li><code>{{ $t('bot-social-games-wishlist-example-id') }}</code></li>
          </ul>
        </div>
      </section>

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
                :disabled="mutating || cooldownSeconds > 0"
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
  import { createSubmitCooldownMixin } from '../mixins/submit-cooldown';
  import { parseGameAppId } from '../utils/game-target';
  import CoverTile from './games/cover-tile.vue';
  import GamesBrowseToolbar from './games/browse-toolbar.vue';
  import PluginMissing from './PluginMissing.vue';
  import { normalizeQueryValue, replaceModalView } from '../../../utils/modal-view-query';

  const PANEL_MODES = new Set(['library', 'banner', 'add']);
  const PANEL_VIEW_DEFAULT = 'library';
  /** UI ≥ Wishlist MIN_REFRESH (6s) / write limiter (3s). */
  const ACTION_COOLDOWN_MS = 6000;

  function resolveInitialPanel(route) {
    const fromRoute = normalizeQueryValue(route?.query?.view);
    if (PANEL_MODES.has(fromRoute)) return fromRoute;
    return PANEL_VIEW_DEFAULT;
  }

  function isBrowse(mode) {
    return mode === 'library' || mode === 'banner';
  }

  export default {
    name: 'BotSocialWishlistTab',
    mixins: [createSubmitCooldownMixin(ACTION_COOLDOWN_MS)],
    components: { CoverTile, PluginMissing, GamesBrowseToolbar },
    props: {
      botName: { type: String, required: true },
      pluginMissing: { type: Boolean, default: false },
    },
    data() {
      const panelMode = resolveInitialPanel(this.$route);
      return {
        loading: false,
        refreshing: false,
        mutating: false,
        error: '',
        items: [],
        appIdInput: '',
        query: '',
        panelMode,
        browseVariant: isBrowse(panelMode) ? panelMode : 'library',
      };
    },
    computed: {
      isBrowseMode() {
        return isBrowse(this.panelMode);
      },
      viewTabs() {
        return [
          { id: 'library', icon: 'book-open', label: this.$t('bot-social-games-view-library') },
          { id: 'banner', icon: 'gamepad', label: this.$t('bot-social-games-view-banner') },
          { id: 'add', icon: 'plus', label: this.$t('bot-social-games-view-add') },
        ];
      },
      parsedAppId() {
        return parseGameAppId(this.appIdInput) || 0;
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
          return nameA.localeCompare(nameB) || idA - idB;
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
          this.bootstrap();
        },
      },
      pluginMissing(value) {
        if (!value) this.bootstrap();
      },
      '$route.query.view'() {
        this.syncPanelFromRoute();
      },
    },
    created() {
      try {
        localStorage.removeItem('asf-bot-social-wishlist-panel');
      } catch {
        // ignore
      }
    },
    methods: {
      applyPanelMode(mode, { syncRoute = true } = {}) {
        if (!PANEL_MODES.has(mode) || mode === this.panelMode) return;
        this.panelMode = mode;
        if (isBrowse(mode)) this.browseVariant = mode;
        if (syncRoute) {
          replaceModalView(this.$router, this.$route, mode, PANEL_VIEW_DEFAULT);
        }
      },
      syncPanelFromRoute() {
        const raw = normalizeQueryValue(this.$route.query?.view);
        if (PANEL_MODES.has(raw)) {
          this.applyPanelMode(raw, { syncRoute: false });
          return;
        }
        if (!raw) this.applyPanelMode(PANEL_VIEW_DEFAULT, { syncRoute: false });
      },
      setPanelMode(mode) {
        this.applyPanelMode(mode, { syncRoute: true });
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
          if (force) this.armSubmitCooldown();
        }
      },
      refresh() {
        if (this.loading || this.refreshing || this.mutating || this.cooldownSeconds > 0) return;
        this.load(true);
      },
      async onAdd() {
        if (!this.parsedAppId || this.mutating || this.cooldownSeconds > 0) return;
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
          this.armSubmitCooldown();
        }
      },
      async onRemove(item) {
        if (this.mutating || this.cooldownSeconds > 0) return;
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
          this.armSubmitCooldown();
        }
      },
    },
  };
</script>
