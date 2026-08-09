<template>
  <section class="games-stats" :aria-label="$t('bot-social-games-view-stats')">
    <div v-if="loading && !games.length" class="bot-social__state">
      <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
      <span>{{ $t('bot-social-loading') }}</span>
    </div>
    <div v-else-if="error && !games.length" class="bot-social__state bot-social__state--error">{{ error }}</div>
    <template v-else>
      <p v-if="error" class="bot-social__inline-error">{{ error }}</p>

      <div class="games-stats__summary">
        <div class="games-stats__stat">
          <span class="games-stats__stat-label">{{ $t('bot-social-games-stats-total-time') }}</span>
          <span class="games-stats__stat-value">{{ formatHours(summary.totalPlaytimeHours) }}</span>
        </div>
        <div class="games-stats__stat">
          <span class="games-stats__stat-label">{{ $t('bot-social-games-stats-collection') }}</span>
          <span class="games-stats__stat-value">{{ summary.inCollection }}</span>
        </div>
        <div class="games-stats__stat">
          <span class="games-stats__stat-label">{{ $t('bot-social-games-stats-played') }}</span>
          <span class="games-stats__stat-value">{{ summary.played }}</span>
        </div>
        <div class="games-stats__stat">
          <span class="games-stats__stat-label">{{ $t('bot-social-games-stats-never') }}</span>
          <span class="games-stats__stat-value">{{ summary.neverPlayed }}</span>
        </div>
      </div>

      <div class="games-stats__toolbar">
        <label class="games-stats__searchbox">
          <FontAwesomeIcon class="games-stats__search-icon" icon="search" aria-hidden="true"></FontAwesomeIcon>
          <input
            v-model.trim="query"
            class="games-stats__search-input"
            type="search"
            :placeholder="$t('bot-social-games-stats-search')"
            :aria-label="$t('bot-social-games-stats-search')"
          >
        </label>
        <div class="games-stats__sorts" role="group" :aria-label="$t('bot-social-games-stats-sort')">
          <button
            type="button"
            class="games-stats__sort"
            :class="{ 'is-active': sortBy === 'playtime' }"
            @click="sortBy = 'playtime'"
          >
            {{ $t('bot-social-games-stats-sort-playtime') }}
          </button>
          <button
            type="button"
            class="games-stats__sort"
            :class="{ 'is-active': sortBy === 'name' }"
            @click="sortBy = 'name'"
          >
            {{ $t('bot-social-games-stats-sort-name') }}
          </button>
          <button
            type="button"
            class="games-stats__sort"
            :class="{ 'is-active': sortBy === 'achievements' }"
            @click="sortBy = 'achievements'"
          >
            {{ $t('bot-social-games-stats-sort-achievements') }}
          </button>
        </div>
        <button
          type="button"
          class="games-stats__refresh"
          :disabled="loading || refreshing"
          @click="refresh"
        >
          <FontAwesomeIcon v-if="refreshing" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ $t('bot-social-refresh') }}</span>
        </button>
      </div>

      <div v-if="!filteredGames.length" class="bot-social__state">{{ $t('bot-social-games-empty') }}</div>
      <ul v-else class="games-stats__list" :class="{ 'is-refreshing': refreshing }">
        <li v-for="game in filteredGames" :key="game.appId" class="games-stats__row">
          <a
            class="games-stats__cover-link"
            :href="storeUrl(game.appId)"
            target="_blank"
            rel="noreferrer noopener"
          >
            <img
              class="games-stats__cover"
              :src="game.headerImage"
              :alt="''"
              loading="lazy"
              decoding="async"
              @error="onCoverError($event, game.appId)"
            >
          </a>
          <div class="games-stats__body">
            <p class="games-stats__name" :title="game.name">{{ game.name }}</p>
            <div class="games-stats__metrics">
              <div class="games-stats__metric">
                <span class="games-stats__metric-label">{{ $t('bot-social-games-stats-playtime') }}</span>
                <span class="games-stats__metric-value">{{ formatPlaytime(game.playtimeMinutes) }}</span>
              </div>
              <div class="games-stats__metric">
                <span class="games-stats__metric-label">{{ $t('bot-social-games-stats-last-session') }}</span>
                <span class="games-stats__metric-value">{{ formatLastPlayed(game.lastPlayedUnix) }}</span>
              </div>
              <div class="games-stats__metric">
                <span class="games-stats__metric-label">{{ $t('bot-social-games-stats-achievements') }}</span>
                <span class="games-stats__metric-value">{{ formatAchievements(game) }}</span>
                <span
                  v-if="achievementRatio(game) != null"
                  class="games-stats__ach-bar"
                  aria-hidden="true"
                >
                  <span class="games-stats__ach-fill" :style="{ width: `${achievementRatio(game) * 100}%` }"></span>
                </span>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </template>
  </section>
</template>

<script>
  import { fetchGameStats, isPluginMissingError } from '../../api/bot-social';
  import { steamStoreUrl } from '../../utils/game-cover';

  export default {
    name: 'BotSocialGamesStatsPanel',
    props: {
      botName: { type: String, required: true },
    },
    data() {
      return {
        loading: false,
        refreshing: false,
        error: '',
        query: '',
        sortBy: 'playtime',
        summary: {
          totalPlaytimeHours: 0,
          inCollection: 0,
          played: 0,
          neverPlayed: 0,
        },
        games: [],
      };
    },
    computed: {
      filteredGames() {
        const q = this.query.trim().toLowerCase();
        let list = this.games;
        if (q) {
          list = list.filter(g => String(g.name || '').toLowerCase().includes(q)
            || String(g.appId).includes(q));
        }
        const sorted = [...list];
        if (this.sortBy === 'name') {
          sorted.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }));
        } else if (this.sortBy === 'achievements') {
          sorted.sort((a, b) => {
            const ra = this.achievementRatio(a);
            const rb = this.achievementRatio(b);
            if (ra == null && rb == null) return String(a.name || '').localeCompare(String(b.name || ''));
            if (ra == null) return 1;
            if (rb == null) return -1;
            return rb - ra || b.playtimeMinutes - a.playtimeMinutes;
          });
        } else {
          sorted.sort((a, b) => b.playtimeMinutes - a.playtimeMinutes
            || String(a.name || '').localeCompare(String(b.name || '')));
        }
        return sorted;
      },
    },
    watch: {
      botName: {
        immediate: true,
        handler() {
          this.load(false);
        },
      },
    },
    methods: {
      storeUrl: steamStoreUrl,
      formatHours(value) {
        const n = Number(value) || 0;
        return `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })} hrs.`;
      },
      formatPlaytime(minutes) {
        const hrs = (Number(minutes) || 0) / 60;
        return this.$t('bot-social-games-stats-hours', {
          n: hrs.toLocaleString(undefined, { maximumFractionDigits: 1 }),
        });
      },
      formatLastPlayed(unix) {
        const ts = Number(unix) || 0;
        if (ts <= 0) return this.$t('bot-social-games-stats-never-played');
        try {
          return new Date(ts * 1000).toLocaleDateString(undefined, {
            day: 'numeric', month: 'short', year: 'numeric',
          });
        } catch {
          return '—';
        }
      },
      formatAchievements(game) {
        if (game.achievementsTotal == null) return '—';
        return `${game.achievementsUnlocked ?? 0}/${game.achievementsTotal}`;
      },
      achievementRatio(game) {
        const total = Number(game.achievementsTotal);
        if (!total) return null;
        return Math.min(1, Math.max(0, Number(game.achievementsUnlocked || 0) / total));
      },
      onCoverError(event, appId) {
        const img = event?.target;
        if (!img || img.dataset.fallback === '1') return;
        img.dataset.fallback = '1';
        img.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/capsule_231x87.jpg`;
      },
      async load(force) {
        const hasData = this.games.length > 0;
        this.loading = !hasData;
        this.refreshing = force && hasData;
        if (force) this.error = '';
        try {
          const payload = await fetchGameStats(this.botName);
          const botResult = payload?.[this.botName]
            || payload?.[Object.keys(payload || {}).find(k => k.toLowerCase() === String(this.botName || '').toLowerCase())]
            || payload?.[Object.keys(payload || {})[0]];
          const games = (botResult?.Games || botResult?.games || []).map(raw => ({
            appId: Number(raw.AppId ?? raw.appId),
            name: raw.Name ?? raw.name ?? '',
            playtimeMinutes: Number(raw.PlaytimeMinutes ?? raw.playtimeMinutes ?? 0),
            lastPlayedUnix: Number(raw.LastPlayedUnix ?? raw.lastPlayedUnix ?? 0),
            headerImage: (raw.HeaderImage ?? raw.headerImage)
              || `https://cdn.cloudflare.steamstatic.com/steam/apps/${raw.AppId ?? raw.appId}/header.jpg`,
            achievementsUnlocked: raw.AchievementsUnlocked ?? raw.achievementsUnlocked ?? null,
            achievementsTotal: raw.AchievementsTotal ?? raw.achievementsTotal ?? null,
          }));
          this.games = games;
          this.summary = {
            totalPlaytimeHours: Number(botResult?.TotalPlaytimeHours ?? botResult?.totalPlaytimeHours ?? 0),
            inCollection: Number(botResult?.InCollection ?? botResult?.inCollection ?? games.length),
            played: Number(botResult?.Played ?? botResult?.played ?? 0),
            neverPlayed: Number(botResult?.NeverPlayed ?? botResult?.neverPlayed ?? 0),
          };
          this.error = '';
        } catch (err) {
          if (isPluginMissingError(err)) {
            this.$emit('plugin-missing');
            return;
          }
          if (!hasData) {
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
