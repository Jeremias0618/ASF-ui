<template>
  <div class="bot-social-tab bot-social-tab--games">
    <PluginMissing v-if="pluginMissing"></PluginMissing>

    <template v-else>
      <div class="bot-social-games__chrome">
        <div class="bot-social-games__views" role="tablist" :aria-label="$t('bot-social-games-views')">
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
            :class="{ 'is-active': panelMode === 'stats' }"
            :aria-selected="panelMode === 'stats' ? 'true' : 'false'"
            @click="setPanelMode('stats')"
          >
            <FontAwesomeIcon icon="chart-bar" aria-hidden="true"></FontAwesomeIcon>
            {{ $t('bot-social-games-view-stats') }}
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

        <div v-if="isBrowseMode" class="bot-social-games__chrome-bar">
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
              {{ $t('bot-social-games-showing', { shown: filteredGames.length, total: games.length }) }}
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
              :disabled="loading || refreshing"
              @click="refresh"
            >
              <FontAwesomeIcon v-if="refreshing" icon="spinner" spin></FontAwesomeIcon>
              <span v-else>{{ $t('bot-social-refresh') }}</span>
            </button>
          </div>
        </div>
      </div>

      <AddPanel
        v-if="panelMode === 'add'"
        :bot-name="botName"
        @plugin-missing="$emit('plugin-missing')"
        @added="onGameAdded"
      ></AddPanel>

      <StatsPanel
        v-else-if="panelMode === 'stats'"
        :bot-name="botName"
        @plugin-missing="$emit('plugin-missing')"
      ></StatsPanel>

      <template v-else>
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
              `bot-social-games--${panelMode}`,
              { 'is-refreshing': refreshing },
            ]"
          >
            <CoverTile
              v-for="game in filteredGames"
              :key="`${panelMode}-${game.appId}`"
              :game="game"
              :variant="panelMode"
            ></CoverTile>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

<script>
  import { isPluginMissingError } from '../api/bot-social';
  import { invalidateGames, loadGames } from '../cache/bot-social-queries';
  import { resolveLocalData } from '../cache/load-policy';
  import AddPanel from './games/add-panel.vue';
  import CoverTile from './games/cover-tile.vue';
  import StatsPanel from './games/stats-panel.vue';
  import PluginMissing from './PluginMissing.vue';

  const PANEL_STORAGE_KEY = 'asf-bot-social-games-panel';
  const PANEL_MODES = new Set(['library', 'banner', 'stats', 'add']);

  function readStoredPanel() {
    try {
      const value = localStorage.getItem(PANEL_STORAGE_KEY);
      if (PANEL_MODES.has(value)) return value;
      const legacy = localStorage.getItem('asf-bot-social-games-view');
      return PANEL_MODES.has(legacy) ? legacy : 'library';
    } catch {
      return 'library';
    }
  }

  export default {
    name: 'BotSocialGamesTab',
    components: {
      AddPanel, CoverTile, StatsPanel, PluginMissing,
    },
    props: {
      botName: { type: String, required: true },
      pluginMissing: { type: Boolean, default: false },
    },
    data() {
      return {
        loading: false,
        refreshing: false,
        error: '',
        games: [],
        query: '',
        panelMode: readStoredPanel(),
      };
    },
    computed: {
      isBrowseMode() {
        return this.panelMode === 'library' || this.panelMode === 'banner';
      },
      filteredGames() {
        const q = this.query.trim().toLowerCase();
        if (!q) return this.games;
        return this.games.filter(g => (
          String(g.name || '').toLowerCase().includes(q)
          || String(g.appId).includes(q)
        ));
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
    },
    methods: {
      setPanelMode(mode) {
        if (!PANEL_MODES.has(mode) || mode === this.panelMode) return;
        this.panelMode = mode;
        try {
          localStorage.setItem(PANEL_STORAGE_KEY, mode);
        } catch {
          // ignore
        }
      },
      async onGameAdded() {
        invalidateGames(this.botName);
        await this.load(true);
      },
      bootstrap() {
        if (this.pluginMissing) return;
        const resolved = resolveLocalData({
          resource: 'games',
          botName: this.botName,
          isUsable: data => Array.isArray(data?.games),
        });
        if (resolved.hasData) {
          this.games = resolved.data.games;
          this.$emit('loaded', { total: resolved.data.total ?? this.games.length });
          return;
        }
        this.load(false);
      },
      async load(force) {
        if (this.pluginMissing) return;
        const hasData = this.games.length > 0;
        this.loading = !hasData;
        this.refreshing = force && hasData;
        if (force) this.error = '';

        try {
          const result = await loadGames(this.botName, { force });
          this.games = result.data?.games || [];
          if (result.rateLimited) this.$error(this.$t('bot-social-rate-limited'));
          else if (result.error && result.stale) this.error = result.error.message || String(result.error);
          else this.error = '';
          this.$emit('loaded', { total: result.data?.total ?? this.games.length });
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
