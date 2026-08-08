<template>
  <div class="bot-social-tab">
    <PluginMissing v-if="pluginMissing"></PluginMissing>

    <template v-else>
      <div v-if="loading" class="bot-social__state">
        <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
        <span>{{ $t('bot-social-loading') }}</span>
      </div>
      <div v-else-if="error" class="bot-social__state bot-social__state--error">{{ error }}</div>

      <template v-else>
        <div class="bot-social__toolbar">
          <p class="bot-social__stat">{{ $t('bot-social-games-total', { n: games.length }) }}</p>
          <input
            v-model.trim="query"
            class="form-item__input bot-social__search"
            type="search"
            :placeholder="$t('bot-social-search')"
          >
          <button type="button" class="button button--link" @click="reload">{{ $t('bot-social-refresh') }}</button>
        </div>

        <div v-if="!filteredGames.length" class="bot-social__state">{{ $t('bot-social-games-empty') }}</div>
        <ul v-else class="bot-social-list">
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
  import { fetchGames, isPluginMissingError } from '../api/bot-social';
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
      botName: { immediate: true, handler() { if (!this.pluginMissing) this.reload(); } },
      pluginMissing(value) { if (!value) this.reload(); },
    },
    methods: {
      unwrap(result) {
        return result?.[this.botName] ?? result;
      },
      async reload() {
        if (this.pluginMissing) return;
        this.loading = true;
        this.error = '';
        try {
          const result = await fetchGames(this.botName);
          const payload = this.unwrap(result);
          const list = payload?.Games ?? payload?.games ?? [];
          this.games = list.map(g => ({
            appId: String(g.AppId ?? g.appId ?? ''),
            name: g.Name ?? g.name ?? `App ${g.AppId ?? g.appId}`,
          })).sort((a, b) => a.name.localeCompare(b.name));
          this.$emit('loaded', { total: payload?.Total ?? payload?.total ?? this.games.length });
        } catch (err) {
          if (isPluginMissingError(err)) {
            this.$emit('plugin-missing');
            return;
          }
          this.error = err.message || String(err);
        } finally {
          this.loading = false;
        }
      },
    },
  };
</script>
