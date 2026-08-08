<template>
  <div class="bot-social-tab">
    <PluginMissing v-if="pluginMissing"></PluginMissing>

    <template v-else>
      <div class="bot-social__toolbar">
        <p class="bot-social__stat">{{ $t('bot-social-games-total', { n: games.length }) }}</p>
        <input
          v-model.trim="query"
          class="form-item__input bot-social__search"
          type="search"
          :placeholder="$t('bot-social-search')"
        >
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

      <div v-if="loading && !games.length" class="bot-social__state">
        <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
        <span>{{ $t('bot-social-loading') }}</span>
      </div>
      <div v-else-if="error && !games.length" class="bot-social__state bot-social__state--error">{{ error }}</div>
      <template v-else>
        <p v-if="error" class="bot-social__inline-error">{{ error }}</p>
        <div v-if="!filteredGames.length" class="bot-social__state">{{ $t('bot-social-games-empty') }}</div>
        <ul v-else class="bot-social-list" :class="{ 'is-refreshing': refreshing }">
          <li v-for="game in filteredGames" :key="game.appId" class="bot-social-list__row">
            <div>
              <strong>{{ game.name }}</strong>
              <span class="bot-social-list__muted">AppID {{ game.appId }}</span>
            </div>
            <a
              class="button button--link"
              :href="`https://store.steampowered.com/app/${game.appId}`"
              target="_blank"
              rel="noreferrer noopener"
            >
              Steam
            </a>
          </li>
        </ul>
      </template>
    </template>
  </div>
</template>

<script>
  import { isPluginMissingError } from '../api/bot-social';
  import { loadGames } from '../cache/bot-social-queries';
  import { peek } from '../cache/query-cache';
  import PluginMissing from './PluginMissing.vue';

  export default {
    name: 'BotSocialGamesTab',
    components: { PluginMissing },
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
      };
    },
    computed: {
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
        handler(name) {
          this.hydrateFromCache(name);
          if (!this.pluginMissing) this.load(false);
        },
      },
      pluginMissing(value) {
        if (!value) this.load(false);
      },
    },
    methods: {
      hydrateFromCache(botName) {
        const cached = peek('games', botName);
        if (cached?.data?.games) {
          this.games = cached.data.games;
          this.$emit('loaded', { total: cached.data.total ?? this.games.length });
        }
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
