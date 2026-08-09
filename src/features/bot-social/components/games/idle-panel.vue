<template>
  <section class="games-idle" :aria-label="$t('bot-social-games-view-idle')">
    <div class="games-idle__header">
      <div class="games-idle__intro">
        <p class="games-idle__lead">{{ $t('bot-social-games-idle-lead') }}</p>
        <p class="games-idle__count" :class="{ 'is-full': isFull }">
          {{ $t('bot-social-games-idle-count', { n: idleAppIds.length, max: MAX_IDLE_GAMES }) }}
        </p>
      </div>
      <button
        type="button"
        class="games-idle__refresh"
        :disabled="loading || saving"
        @click="reload"
      >
        <FontAwesomeIcon v-if="loading || saving" icon="spinner" spin></FontAwesomeIcon>
        <span v-else>{{ $t('bot-social-refresh') }}</span>
      </button>
    </div>

    <div v-if="loading && !loaded" class="bot-social__state">
      <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
      <span>{{ $t('bot-social-loading') }}</span>
    </div>
    <div v-else-if="error && !loaded" class="bot-social__state bot-social__state--error">{{ error }}</div>

    <template v-else>
      <p v-if="error" class="bot-social__inline-error">{{ error }}</p>
      <p v-if="isFull" class="games-idle__limit-hint">{{ $t('bot-social-games-idle-limit') }}</p>

      <div class="games-idle__columns">
        <div class="games-idle__column">
          <h3 class="games-idle__column-title">{{ $t('bot-social-games-idle-current') }}</h3>
          <div v-if="!idleEntries.length" class="bot-social__state">{{ $t('bot-social-games-idle-empty') }}</div>
          <ul v-else class="games-idle__list" :class="{ 'is-busy': saving }">
            <li v-for="entry in idleEntries" :key="entry.appId" class="games-idle__row">
              <img
                class="games-idle__cover"
                :src="entry.cover"
                :alt="''"
                loading="lazy"
                decoding="async"
                @error="onCoverError($event, entry.appId)"
              >
              <div class="games-idle__body">
                <p class="games-idle__name" :title="entry.name">{{ entry.name }}</p>
                <p class="games-idle__appid">AppID {{ entry.appId }}</p>
              </div>
              <button
                type="button"
                class="games-idle__action games-idle__action--remove"
                :disabled="saving"
                :aria-label="$t('bot-social-games-idle-remove-aria', { name: entry.name })"
                @click="removeGame(entry.appId)"
              >
                {{ $t('bot-social-games-idle-remove') }}
              </button>
            </li>
          </ul>
        </div>

        <div class="games-idle__column">
          <h3 class="games-idle__column-title">{{ $t('bot-social-games-idle-add-from') }}</h3>
          <label class="games-idle__searchbox">
            <FontAwesomeIcon class="games-idle__search-icon" icon="search" aria-hidden="true"></FontAwesomeIcon>
            <input
              v-model.trim="query"
              class="games-idle__search-input"
              type="search"
              :placeholder="$t('bot-social-games-idle-search')"
              :aria-label="$t('bot-social-games-idle-search')"
            >
          </label>
          <div v-if="!candidateGames.length" class="bot-social__state">
            {{ query ? $t('bot-social-games-empty') : $t('bot-social-games-idle-no-candidates') }}
          </div>
          <ul v-else class="games-idle__list" :class="{ 'is-busy': saving }">
            <li v-for="game in visibleCandidates" :key="game.appId" class="games-idle__row">
              <img
                class="games-idle__cover"
                :src="coverFor(game.appId)"
                :alt="''"
                loading="lazy"
                decoding="async"
                @error="onCoverError($event, game.appId)"
              >
              <div class="games-idle__body">
                <p class="games-idle__name" :title="game.name">{{ game.name }}</p>
                <p class="games-idle__appid">AppID {{ game.appId }}</p>
              </div>
              <button
                type="button"
                class="games-idle__action"
                :disabled="saving || isFull"
                :aria-label="$t('bot-social-games-idle-add-aria', { name: game.name })"
                @click="addGame(game.appId)"
              >
                {{ $t('bot-social-games-idle-add') }}
              </button>
            </li>
          </ul>
          <p v-if="candidateGames.length > CANDIDATE_LIMIT" class="games-idle__more-hint">
            {{ $t('bot-social-games-idle-candidates-truncated', { shown: visibleCandidates.length, total: candidateGames.length }) }}
          </p>
        </div>
      </div>
    </template>
  </section>
</template>

<script>
  import {
    fetchIdleGamesConfig, MAX_IDLE_GAMES, saveIdleGames,
  } from '../../api/idle-games';
  import { gameBannerCandidates } from '../../utils/game-cover';

  const CANDIDATE_LIMIT = 80;

  export default {
    name: 'BotSocialGamesIdlePanel',
    props: {
      botName: { type: String, required: true },
      games: { type: Array, default: () => [] },
    },
    data() {
      return {
        MAX_IDLE_GAMES,
        CANDIDATE_LIMIT,
        loading: false,
        saving: false,
        loaded: false,
        error: '',
        query: '',
        idleAppIds: [],
      };
    },
    computed: {
      isFull() {
        return this.idleAppIds.length >= MAX_IDLE_GAMES;
      },
      gamesById() {
        return (this.games || []).reduce((map, game) => {
          const id = Number(game?.appId);
          if (Number.isInteger(id) && id > 0) map.set(id, game);
          return map;
        }, new Map());
      },
      idleSet() {
        return new Set(this.idleAppIds);
      },
      idleEntries() {
        return this.idleAppIds.map(appId => {
          const game = this.gamesById.get(appId);
          const name = game?.name || this.$t('bot-social-games-idle-unknown', { appId });
          return {
            appId,
            name,
            cover: this.coverFor(appId),
          };
        });
      },
      candidateGames() {
        const q = this.query.trim().toLowerCase();
        return (this.games || []).filter(game => {
          if (!game?.isOwned) return false;
          const appId = Number(game.appId);
          if (!Number.isInteger(appId) || appId <= 0) return false;
          if (this.idleSet.has(appId)) return false;
          if (!q) return true;
          const name = String(game.name || '').toLowerCase();
          return name.includes(q) || String(appId).includes(q);
        });
      },
      visibleCandidates() {
        return this.candidateGames.slice(0, CANDIDATE_LIMIT);
      },
    },
    watch: {
      botName: {
        immediate: true,
        handler() {
          this.reload();
        },
      },
    },
    methods: {
      coverFor(appId) {
        return gameBannerCandidates(appId)[0] || '';
      },
      onCoverError(event, appId) {
        const img = event?.target;
        if (!img || img.dataset.fallback === '1') return;
        img.dataset.fallback = '1';
        const fallback = gameBannerCandidates(appId)[1];
        if (fallback) img.src = fallback;
      },
      async reload() {
        if (!this.botName || this.loading) return;
        this.loading = true;
        this.error = '';
        try {
          const { idleAppIds } = await fetchIdleGamesConfig(this.botName);
          this.idleAppIds = idleAppIds;
          this.loaded = true;
        } catch (err) {
          if (!this.loaded) this.error = err.message || String(err);
          else this.$error(err.message || String(err));
        } finally {
          this.loading = false;
        }
      },
      async persist(nextIds) {
        this.saving = true;
        this.error = '';
        try {
          this.idleAppIds = await saveIdleGames(this.botName, nextIds);
          await this.$store.dispatch('bots/updateBot', { name: this.botName });
          this.$success(this.$t('bot-social-games-idle-saved'));
        } catch (err) {
          if (err?.code === 'IDLE_LIMIT') {
            this.$error(this.$t('bot-social-games-idle-limit'));
          } else {
            this.$error(err.message || String(err));
          }
          await this.reload();
        } finally {
          this.saving = false;
        }
      },
      addGame(appId) {
        const id = Number(appId);
        if (!Number.isInteger(id) || id <= 0 || this.saving) return;
        if (this.idleSet.has(id)) return;
        if (this.isFull) {
          this.$error(this.$t('bot-social-games-idle-limit'));
          return;
        }
        this.persist([...this.idleAppIds, id]);
      },
      removeGame(appId) {
        const id = Number(appId);
        if (!Number.isInteger(id) || id <= 0 || this.saving) return;
        this.persist(this.idleAppIds.filter(entry => entry !== id));
      },
    },
  };
</script>
