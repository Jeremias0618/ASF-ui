<template>
  <div class="bot-social-tab bot-social-tab--games">
    <PluginMissing v-if="pluginMissing"></PluginMissing>

    <template v-else>
      <AsfIconTabs
        :value="panelMode"
        :tabs="viewTabs"
        :aria-label="$t('bot-social-games-views')"
        @input="setPanelMode"
      ></AsfIconTabs>

      <div v-show="isBrowseMode" class="bot-social-games__chrome">
        <GamesBrowseToolbar
          :query.sync="query"
          :busy="refreshing || loading"
          :refresh-disabled="loading || refreshing"
          :has-active-filters="hasActiveFilters"
          :filters-aria-label="$t('bot-social-games-filters')"
          @refresh="refresh"
          @clear-filters="clearFilters"
        >
          <template #count>
            {{ $t('bot-social-games-showing', { shown: visibleGames.length, total: games.length }) }}
            <span v-if="isPaintingMore" class="bot-social-games__count-more">
              · {{ $t('bot-social-games-painting') }}
            </span>
          </template>
          <template #filters>
            <div class="bot-social-games__field">
              <span id="games-filter-ownership-label" class="bot-social-games__field-label">
                {{ $t('bot-social-games-filter-ownership') }}
              </span>
              <AsfSelect
                v-model="ownershipFilter"
                compact
                aria-labelledby="games-filter-ownership-label"
                :options="ownershipOptions"
                :search-placeholder="$t('bot-social-games-filter-search-options')"
              ></AsfSelect>
            </div>
            <div class="bot-social-games__field">
              <span id="games-filter-achievements-label" class="bot-social-games__field-label">
                {{ $t('bot-social-games-filter-achievements') }}
              </span>
              <AsfSelect
                v-model="achievementsFilter"
                compact
                aria-labelledby="games-filter-achievements-label"
                :options="achievementsOptions"
                :search-placeholder="$t('bot-social-games-filter-search-options')"
              ></AsfSelect>
            </div>
            <div class="bot-social-games__field">
              <span id="games-filter-cards-label" class="bot-social-games__field-label">
                {{ $t('bot-social-games-filter-cards') }}
              </span>
              <AsfSelect
                v-model="cardsFilter"
                compact
                aria-labelledby="games-filter-cards-label"
                :options="cardsOptions"
                :search-placeholder="$t('bot-social-games-filter-search-options')"
              ></AsfSelect>
            </div>
            <div class="bot-social-games__field">
              <span id="games-filter-type-label" class="bot-social-games__field-label">
                {{ $t('bot-social-games-filter-type') }}
              </span>
              <AsfSelect
                v-model="typeFilter"
                compact
                searchable
                aria-labelledby="games-filter-type-label"
                :options="typeOptions"
                :search-placeholder="$t('bot-social-games-filter-search-options')"
              ></AsfSelect>
            </div>
          </template>
        </GamesBrowseToolbar>
      </div>

      <AddPanel
        v-if="panelMode === 'add'"
        :bot-name="botName"
        @plugin-missing="$emit('plugin-missing')"
        @added="onGameAdded"
      ></AddPanel>

      <WishlistPanel
        v-else-if="panelMode === 'wishlist'"
        :bot-name="botName"
        @plugin-missing="$emit('plugin-missing')"
      ></WishlistPanel>

      <DiscoveryPanel
        v-else-if="panelMode === 'discovery'"
        :bot-name="botName"
        @plugin-missing="$emit('plugin-missing')"
      ></DiscoveryPanel>

      <StatsPanel
        v-show="panelMode === 'stats'"
        v-if="statsMounted"
        :bot-name="botName"
        @plugin-missing="$emit('plugin-missing')"
      ></StatsPanel>

      <IdlePanel
        v-show="panelMode === 'idle'"
        v-if="idleMounted"
        :botName="botName"
        :games="games"
        @plugin-missing="$emit('plugin-missing')"
      ></IdlePanel>

      <div v-show="isBrowseMode" class="bot-social-games__browse">
        <div v-if="loading && !games.length" class="bot-social__state">
          <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
          <span>{{ $t('bot-social-loading') }}</span>
        </div>
        <div v-else-if="error && !games.length" class="bot-social__state bot-social__state--error">{{ error }}</div>
        <template v-else>
          <p v-if="error" class="bot-social__inline-error">{{ error }}</p>
          <div v-if="!filteredGames.length" class="bot-social__state">{{ $t('bot-social-games-empty') }}</div>
          <div
            v-else
            class="bot-social-games"
            :class="[
              `bot-social-games--${browseVariant}`,
              { 'is-refreshing': refreshing || loading },
            ]"
          >
            <CoverTile
              v-for="game in visibleGames"
              :key="game.appId"
              :game="game"
              :botName="botName"
              :variant="browseVariant"
            ></CoverTile>
          </div>
          <p v-if="isPaintingMore" class="bot-social-games__paint-hint" aria-live="polite">
            <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
            {{ $t('bot-social-games-painting-progress', { shown: visibleGames.length, total: filteredGames.length }) }}
          </p>
        </template>
      </div>
    </template>
  </div>
</template>

<script>
  import { isPluginMissingError } from '../api/bot-social';
  import { invalidateGameStats, invalidateGames, loadGames } from '../cache/bot-social-queries';
  import { readGamesSession, writeGamesSession } from '../cache/games-session';
  import { resolveLocalData } from '../cache/load-policy';
  import { prime } from '../cache/query-cache';
  import AddPanel from './games/add-panel.vue';
  import GamesBrowseToolbar from './games/browse-toolbar.vue';
  import CoverTile from './games/cover-tile.vue';
  import DiscoveryPanel from './games/discovery-panel.vue';
  import IdlePanel from './games/idle-panel.vue';
  import StatsPanel from './games/stats-panel.vue';
  import WishlistPanel from './games/wishlist-panel.vue';
  import PluginMissing from './PluginMissing.vue';
  import { normalizeQueryValue, replaceModalView } from '../../../utils/modal-view-query';

  const PANEL_MODES = new Set(['library', 'banner', 'stats', 'idle', 'wishlist', 'discovery', 'add']);
  const PANEL_VIEW_DEFAULT = 'library';
  const TYPE_ORDER = ['game', 'dlc', 'demo', 'application', 'tool', 'beta', 'video', 'music', 'other'];
  const TYPE_LABEL_KEYS = {
    game: 'bot-social-games-filter-type-game',
    dlc: 'bot-social-games-filter-type-dlc',
    demo: 'bot-social-games-filter-type-demo',
    application: 'bot-social-games-filter-type-application',
    tool: 'bot-social-games-filter-type-tool',
    beta: 'bot-social-games-filter-type-beta',
    video: 'bot-social-games-filter-type-video',
    music: 'bot-social-games-filter-type-music',
    other: 'bot-social-games-filter-type-other',
  };
  const INITIAL_RENDER = 72;
  const RENDER_CHUNK = 48;

  function resolveInitialPanel(route) {
    const fromRoute = normalizeQueryValue(route?.query?.view);
    if (PANEL_MODES.has(fromRoute)) return fromRoute;
    return PANEL_VIEW_DEFAULT;
  }

  function isBrowse(mode) {
    return mode === 'library' || mode === 'banner';
  }

  export default {
    name: 'BotSocialGamesTab',
    components: {
      AddPanel,
      CoverTile,
      DiscoveryPanel,
      IdlePanel,
      StatsPanel,
      WishlistPanel,
      PluginMissing,
      GamesBrowseToolbar,
    },
    props: {
      botName: { type: String, required: true },
      pluginMissing: { type: Boolean, default: false },
    },
    data() {
      const panelMode = resolveInitialPanel(this.$route);
      return {
        loading: false,
        refreshing: false,
        error: '',
        games: [],
        query: '',
        ownershipFilter: 'all',
        achievementsFilter: 'all',
        cardsFilter: 'all',
        typeFilter: 'all',
        panelMode,
        // Keep last library/banner mode for CoverTile while Stats/Add stay mounted via v-show.
        browseVariant: isBrowse(panelMode) ? panelMode : 'library',
        statsMounted: panelMode === 'stats',
        idleMounted: panelMode === 'idle',
        renderCount: INITIAL_RENDER,
        paintRaf: 0,
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
          { id: 'stats', icon: 'chart-bar', label: this.$t('bot-social-games-view-stats') },
          { id: 'idle', icon: 'clock', label: this.$t('bot-social-games-view-idle') },
          { id: 'wishlist', icon: 'heart', label: this.$t('bot-social-games-view-wishlist') },
          { id: 'discovery', icon: 'compass', label: this.$t('bot-social-games-view-discovery') },
          { id: 'add', icon: 'plus', label: this.$t('bot-social-games-view-add') },
        ];
      },
      hasActiveFilters() {
        return this.ownershipFilter !== 'all'
          || this.achievementsFilter !== 'all'
          || this.cardsFilter !== 'all'
          || this.typeFilter !== 'all';
      },
      ownershipOptions() {
        return [
          { value: 'all', label: this.$t('bot-social-games-filter-ownership-all') },
          { value: 'owned', label: this.$t('bot-social-games-filter-ownership-owned') },
          { value: 'shared', label: this.$t('bot-social-games-filter-ownership-shared') },
        ];
      },
      achievementsOptions() {
        return [
          { value: 'all', label: this.$t('bot-social-games-filter-achievements-all') },
          { value: 'yes', label: this.$t('bot-social-games-filter-achievements-yes') },
          { value: 'no', label: this.$t('bot-social-games-filter-achievements-no') },
        ];
      },
      cardsOptions() {
        return [
          { value: 'all', label: this.$t('bot-social-games-filter-cards-all') },
          { value: 'yes', label: this.$t('bot-social-games-filter-cards-yes') },
          { value: 'no', label: this.$t('bot-social-games-filter-cards-no') },
        ];
      },
      typeOptions() {
        const present = new Set(this.games.map(g => g.appType || 'game'));
        const values = TYPE_ORDER.filter(type => present.has(type) || type === 'game');
        return [
          { value: 'all', label: this.$t('bot-social-games-filter-type-all') },
          ...values.map(type => ({
            value: type,
            label: this.$t(TYPE_LABEL_KEYS[type] || TYPE_LABEL_KEYS.other),
          })),
        ];
      },
      filteredGames() {
        const q = this.query.trim().toLowerCase();
        return this.games.filter(g => {
          if (q) {
            const name = String(g.name || '').toLowerCase();
            const appId = String(g.appId);
            if (!name.includes(q) && !appId.includes(q)) return false;
          }
          if (this.ownershipFilter === 'owned' && !g.isOwned) return false;
          if (this.ownershipFilter === 'shared' && !g.isShared) return false;
          if (this.achievementsFilter === 'yes' && !g.hasAchievements) return false;
          if (this.achievementsFilter === 'no' && g.hasAchievements) return false;
          if (this.cardsFilter === 'yes' && !g.hasCards) return false;
          if (this.cardsFilter === 'no' && g.hasCards) return false;
          if (this.typeFilter !== 'all' && (g.appType || 'game') !== this.typeFilter) return false;
          return true;
        });
      },
      visibleGames() {
        return this.filteredGames.slice(0, this.renderCount);
      },
      isPaintingMore() {
        return this.visibleGames.length < this.filteredGames.length;
      },
    },
    watch: {
      botName: {
        immediate: true,
        handler() {
          this.bootstrap();
        },
      },
      pluginMissing(value) {
        if (!value) this.bootstrap();
      },
      filteredGames: {
        handler() {
          this.startProgressivePaint();
        },
      },
      '$route.query.view'() {
        this.syncPanelFromRoute();
      },
    },
    created() {
      // Drop legacy panel persistence so reopening always starts at the default view.
      try {
        localStorage.removeItem('asf-bot-social-games-panel');
        localStorage.removeItem('asf-bot-social-games-view');
      } catch {
        // ignore
      }
    },
    beforeDestroy() {
      this.cancelProgressivePaint();
    },
    methods: {
      clearFilters() {
        this.ownershipFilter = 'all';
        this.achievementsFilter = 'all';
        this.cardsFilter = 'all';
        this.typeFilter = 'all';
      },
      applyPanelMode(mode, { syncRoute = true } = {}) {
        if (!PANEL_MODES.has(mode) || mode === this.panelMode) return;
        if (mode === 'stats') this.statsMounted = true;
        if (mode === 'idle') this.idleMounted = true;
        if (isBrowse(mode)) this.browseVariant = mode;
        this.panelMode = mode;
        if (syncRoute) {
          replaceModalView(this.$router, this.$route, mode, PANEL_VIEW_DEFAULT);
        }
        // Idle picker and browse reuse the same library cache.
        if ((isBrowse(mode) || mode === 'idle') && !this.games.length && !this.loading) {
          this.bootstrap();
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
      cancelProgressivePaint() {
        if (this.paintRaf) {
          cancelAnimationFrame(this.paintRaf);
          this.paintRaf = 0;
        }
      },
      startProgressivePaint() {
        this.cancelProgressivePaint();
        const total = this.filteredGames.length;
        this.renderCount = Math.min(INITIAL_RENDER, total);
        if (this.renderCount >= total) return;

        const step = () => {
          if (this.renderCount >= this.filteredGames.length) {
            this.paintRaf = 0;
            return;
          }
          this.renderCount = Math.min(this.renderCount + RENDER_CHUNK, this.filteredGames.length);
          this.paintRaf = requestAnimationFrame(step);
        };
        this.paintRaf = requestAnimationFrame(step);
      },
      applyGamesPayload(payload, { emitLoaded = true } = {}) {
        this.games = payload?.games || [];
        if (emitLoaded) {
          this.$emit('loaded', { total: payload?.total ?? this.games.length });
        }
        this.startProgressivePaint();
      },
      async onGameAdded() {
        invalidateGames(this.botName);
        invalidateGameStats(this.botName);
        await this.load(true);
      },
      bootstrap() {
        if (this.pluginMissing) return;

        const resolved = resolveLocalData({
          resource: 'games',
          botName: this.botName,
          isUsable: data => Array.isArray(data?.games) && data.games.length > 0,
        });

        if (resolved.hasData) {
          this.applyGamesPayload(resolved.data);
          return;
        }

        const session = readGamesSession(this.botName);
        if (session) {
          prime('games', this.botName, {
            games: session.games,
            total: session.total,
            ownedTotal: session.ownedTotal,
            sharedTotal: session.sharedTotal,
          }, { updatedAt: session.updatedAt });
          this.applyGamesPayload(session);
          // Keep cached view; only network on Actualizar / empty cache.
          return;
        }

        this.load(false);
      },
      async load(force) {
        if (this.pluginMissing) return;
        const hasData = this.games.length > 0;
        this.loading = !hasData;
        this.refreshing = Boolean(force && hasData);
        if (force) this.error = '';

        try {
          const result = await loadGames(this.botName, { force });
          const payload = result.data || { games: [] };
          this.applyGamesPayload(payload);
          writeGamesSession(this.botName, payload);
          if (result.rateLimited) this.$error(this.$t('bot-social-rate-limited'));
          else if (result.error && result.stale) this.error = result.error.message || String(result.error);
          else this.error = '';
        } catch (err) {
          if (isPluginMissingError(err)) {
            this.$emit('plugin-missing');
            return;
          }
          if (err?.code === 'RATE_LIMITED') this.$error(this.$t('bot-social-rate-limited'));
          else if (!hasData) {
            this.error = err.message || String(err);
            this.games = [];
          } else this.error = err.message || String(err);
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
