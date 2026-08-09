<template>
  <section class="games-stats" :aria-label="$t('bot-social-games-view-stats')">
    <AchievementDetail
      v-if="selectedGame"
      :bot-name="botName"
      :app-id="selectedGame.appId"
      :seed-name="selectedGame.name"
      :seed-header="selectedGame.headerImage"
      @back="selectedGame = null"
      @plugin-missing="$emit('plugin-missing')"
      @changed="onAchievementsChanged"
    ></AchievementDetail>

    <template v-else>
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

      <div class="games-stats__filters" role="group" :aria-label="$t('bot-social-games-filters')">
        <button
          type="button"
          class="games-stats__filter"
          :class="{ 'is-active': ownershipFilter === 'all' }"
          @click="ownershipFilter = 'all'"
        >
          {{ $t('bot-social-games-filter-ownership-all') }}
        </button>
        <button
          type="button"
          class="games-stats__filter"
          :class="{ 'is-active': ownershipFilter === 'owned' }"
          @click="ownershipFilter = 'owned'"
        >
          {{ $t('bot-social-games-filter-ownership-owned') }}
        </button>
        <button
          type="button"
          class="games-stats__filter"
          :class="{ 'is-active': ownershipFilter === 'shared' }"
          @click="ownershipFilter = 'shared'"
        >
          {{ $t('bot-social-games-filter-ownership-shared') }}
        </button>
        <button
          type="button"
          class="games-stats__filter"
          :class="{ 'is-active': achievementsFilter === 'yes' }"
          @click="achievementsFilter = achievementsFilter === 'yes' ? 'all' : 'yes'"
        >
          {{ $t('bot-social-games-filter-achievements-yes') }}
        </button>
      </div>

      <div v-if="!filteredGames.length" class="bot-social__state">{{ $t('bot-social-games-empty') }}</div>
      <ul v-else class="games-stats__list" :class="{ 'is-refreshing': refreshing }">
        <li
          v-for="game in filteredGames"
          :key="game.appId"
          class="games-stats__row"
          :class="{ 'games-stats__row--clickable': hasAchievements(game) }"
          :role="hasAchievements(game) ? 'button' : undefined"
          :tabindex="hasAchievements(game) ? 0 : undefined"
          :aria-disabled="hasAchievements(game) ? undefined : 'true'"
          @click="openGame(game)"
          @keydown.enter.prevent="openGame(game)"
          @keydown.space.prevent="openGame(game)"
        >
          <img
            class="games-stats__cover"
            :src="game.headerImage"
            :alt="''"
            loading="lazy"
            decoding="async"
            @error="onCoverError($event, game.appId)"
          >
          <div class="games-stats__body">
            <p class="games-stats__name" :title="game.name">
              {{ game.name }}
              <span
                v-if="game.isShared && !game.isOwned"
                class="games-stats__shared-badge"
              >{{ $t('bot-social-games-badge-shared') }}</span>
            </p>
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
    </template>
  </section>
</template>

<script>
  import { isPluginMissingError } from '../../api/bot-social';
  import { invalidateGameStats, loadGameStats } from '../../cache/bot-social-queries';
  import { resolveLocalData } from '../../cache/load-policy';
  import AchievementDetail from './achievement-detail.vue';

  const emptySummary = () => ({
    totalPlaytimeHours: 0,
    inCollection: 0,
    played: 0,
    neverPlayed: 0,
  });

  export default {
    name: 'BotSocialGamesStatsPanel',
    components: { AchievementDetail },
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
        ownershipFilter: 'all',
        achievementsFilter: 'all',
        summary: emptySummary(),
        games: [],
        selectedGame: null,
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
        if (this.ownershipFilter === 'owned') {
          list = list.filter(g => g.isOwned);
        } else if (this.ownershipFilter === 'shared') {
          list = list.filter(g => g.isShared);
        }
        if (this.achievementsFilter === 'yes') {
          list = list.filter(g => this.hasAchievements(g));
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
          this.bootstrap();
        },
      },
    },
    methods: {
      hasAchievements(game) {
        return Number(game?.achievementsTotal) > 0;
      },
      openGame(game) {
        if (!game?.appId) return;
        if (!this.hasAchievements(game)) {
          this.$error(this.$t('bot-social-games-ach-none'));
          return;
        }
        this.selectedGame = {
          appId: game.appId,
          name: game.name,
          headerImage: game.headerImage,
        };
      },
      onAchievementsChanged() {
        invalidateGameStats(this.botName);
        this.load(true);
      },
      applyPayload(data) {
        this.games = data?.games || [];
        this.summary = data?.summary ? { ...data.summary } : emptySummary();
      },
      bootstrap() {
        this.selectedGame = null;
        const resolved = resolveLocalData({
          resource: 'gameStats',
          botName: this.botName,
          isUsable: data => Array.isArray(data?.games),
        });
        if (resolved.hasData) {
          this.applyPayload(resolved.data);
          this.error = '';
          return;
        }
        this.load(false);
      },
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
          const result = await loadGameStats(this.botName, { force });
          this.applyPayload(result.data);
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
            this.summary = emptySummary();
          } else this.error = err.message || String(err);
        } finally {
          this.loading = false;
          this.refreshing = false;
        }
      },
      refresh() {
        if (this.loading || this.refreshing) return;
        invalidateGameStats(this.botName);
        this.load(true);
      },
    },
  };
</script>
