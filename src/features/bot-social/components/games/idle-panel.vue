<template>
  <section class="games-idle" :aria-label="$t('bot-social-games-view-idle')">
    <div class="games-idle__header">
      <div class="games-idle__intro">
        <p class="games-idle__lead">{{ $t('bot-social-games-idle-lead') }}</p>
        <p class="games-idle__count" :class="{ 'is-full': isFull }">
          {{ $t('bot-social-games-idle-count', { n: idleAppIds.length, max: MAX_IDLE_GAMES }) }}
          <span v-if="isDirty" class="games-idle__dirty">{{ $t('bot-social-games-idle-unsaved') }}</span>
        </p>
      </div>
      <div class="games-idle__header-actions">
        <button
          type="button"
          class="games-idle__refresh"
          :disabled="loading || saving"
          @click="reload"
        >
          <FontAwesomeIcon v-if="loading" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ $t('bot-social-refresh') }}</span>
        </button>
        <button
          type="button"
          class="games-idle__save"
          :disabled="loading || saving || !isDirty"
          @click="save"
        >
          <FontAwesomeIcon v-if="saving" icon="spinner" spin></FontAwesomeIcon>
          <template v-else>
            <FontAwesomeIcon icon="save" aria-hidden="true"></FontAwesomeIcon>
            <span>{{ $t('bot-social-games-idle-save') }}</span>
          </template>
        </button>
      </div>
    </div>

    <div v-if="loading && !loaded" class="bot-social__state">
      <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
      <span>{{ $t('bot-social-loading') }}</span>
    </div>
    <div v-else-if="error && !loaded" class="bot-social__state bot-social__state--error">{{ error }}</div>

    <template v-else>
      <p v-if="error" class="bot-social__inline-error">{{ error }}</p>
      <p v-if="isFull" class="games-idle__limit-hint">{{ $t('bot-social-games-idle-limit') }}</p>
      <p class="games-idle__reorder-hint">{{ $t('bot-social-games-idle-reorder-hint') }}</p>

      <div class="games-idle__columns">
        <div class="games-idle__column">
          <div class="games-idle__column-head">
            <h3 class="games-idle__column-title">{{ $t('bot-social-games-idle-current') }}</h3>
            <button
              v-if="idleAppIds.length"
              type="button"
              class="games-idle__clear"
              :disabled="saving"
              @click="clearAll"
            >
              {{ $t('bot-social-games-idle-clear') }}
            </button>
          </div>
          <div v-if="!idleEntries.length" class="bot-social__state">{{ $t('bot-social-games-idle-empty') }}</div>
          <ul
            v-else
            class="games-idle__list"
            :class="{ 'is-busy': saving }"
          >
            <li
              v-for="(entry, index) in idleEntries"
              :key="entry.appId"
              class="games-idle__row games-idle__row--draggable"
              :class="{
                'is-dragging': dragIndex === index,
                'is-drop-target': dropIndex === index && dragIndex !== index
              }"
              draggable="true"
              @dragstart="onDragStart(index, $event)"
              @dragover.prevent="onDragOver(index, $event)"
              @dragleave="onDragLeave(index)"
              @drop.prevent="onDrop(index)"
              @dragend="onDragEnd"
            >
              <span class="games-idle__handle" aria-hidden="true" title="">
                <FontAwesomeIcon icon="grip-vertical"></FontAwesomeIcon>
              </span>
              <span class="games-idle__order">{{ index + 1 }}</span>
              <img
                class="games-idle__cover"
                :src="entry.cover"
                :alt="''"
                loading="lazy"
                decoding="async"
                draggable="false"
                @error="onCoverError($event, entry.appId)"
              >
              <div class="games-idle__body">
                <p class="games-idle__name" :title="entry.name">
                  {{ entry.name }}
                  <span
                    v-if="entry.isShared && !entry.isOwned"
                    class="games-idle__shared-badge"
                  >{{ $t('bot-social-games-badge-shared') }}</span>
                </p>
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
                <p class="games-idle__name" :title="game.name">
                  {{ game.name }}
                  <span
                    v-if="game.isShared && !game.isOwned"
                    class="games-idle__shared-badge"
                  >{{ $t('bot-social-games-badge-shared') }}</span>
                </p>
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
  import { botAction } from '../../../../plugins/http';
  import {
    fetchIdleGamesConfig, MAX_IDLE_GAMES, saveIdleGames,
  } from '../../api/idle-games';
  import { gameBannerCandidates } from '../../utils/game-cover';

  const CANDIDATE_LIMIT = 80;

  function sameIdList(a, b) {
    if (a === b) return true;
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((id, index) => id === b[index]);
  }

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
        savedIdleAppIds: [],
        dragIndex: -1,
        dropIndex: -1,
      };
    },
    computed: {
      isFull() {
        return this.idleAppIds.length >= MAX_IDLE_GAMES;
      },
      isDirty() {
        return !sameIdList(this.idleAppIds, this.savedIdleAppIds);
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
            isOwned: !!game?.isOwned,
            isShared: !!game?.isShared,
          };
        });
      },
      candidateGames() {
        const q = this.query.trim().toLowerCase();
        return (this.games || []).filter(game => {
          if (!game?.isOwned && !game?.isShared) return false;
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
        if (!this.botName || this.loading || this.saving) return;
        if (this.isDirty && !window.confirm(this.$t('bot-social-games-idle-discard-confirm'))) {
          return;
        }
        this.loading = true;
        this.error = '';
        try {
          const { idleAppIds } = await fetchIdleGamesConfig(this.botName);
          this.idleAppIds = [...idleAppIds];
          this.savedIdleAppIds = [...idleAppIds];
          this.loaded = true;
        } catch (err) {
          if (!this.loaded) this.error = err.message || String(err);
          else this.$error(err.message || String(err));
        } finally {
          this.loading = false;
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
        this.idleAppIds = [...this.idleAppIds, id];
      },
      removeGame(appId) {
        const id = Number(appId);
        if (!Number.isInteger(id) || id <= 0 || this.saving) return;
        this.idleAppIds = this.idleAppIds.filter(entry => entry !== id);
      },
      clearAll() {
        if (this.saving || !this.idleAppIds.length) return;
        if (!window.confirm(this.$t('bot-social-games-idle-clear-confirm'))) return;
        this.idleAppIds = [];
      },
      onDragStart(index, event) {
        if (this.saving) {
          event.preventDefault();
          return;
        }
        this.dragIndex = index;
        this.dropIndex = index;
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', String(index));
        }
      },
      onDragOver(index, event) {
        if (this.dragIndex < 0 || this.saving) return;
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        this.dropIndex = index;
      },
      onDragLeave(index) {
        if (this.dropIndex === index) this.dropIndex = -1;
      },
      onDrop(toIndex) {
        const fromIndex = this.dragIndex;
        this.dragIndex = -1;
        this.dropIndex = -1;
        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex || this.saving) return;
        const next = [...this.idleAppIds];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        this.idleAppIds = next;
      },
      onDragEnd() {
        this.dragIndex = -1;
        this.dropIndex = -1;
      },
      async restartBotIfNeeded() {
        const bot = this.$store.getters['bots/bot'](this.botName);
        const wasActive = !!bot?.active;
        if (!wasActive) return;

        try {
          await botAction(this.botName, 'stop');
        } catch {
          // Bot may already be stopping after config reload.
        }

        try {
          await botAction(this.botName, 'start');
          await this.$store.dispatch('bots/updateBot', { name: this.botName, active: true });
        } catch (err) {
          this.$error(err.message || String(err));
        }
      },
      async save() {
        if (!this.isDirty || this.saving || this.loading) return;
        this.saving = true;
        this.error = '';
        try {
          const saved = await saveIdleGames(this.botName, this.idleAppIds);
          this.idleAppIds = [...saved];
          this.savedIdleAppIds = [...saved];
          await this.$store.dispatch('bots/updateBot', { name: this.botName });
          await this.restartBotIfNeeded();
          this.$success(this.$t('bot-social-games-idle-saved'));
        } catch (err) {
          if (err?.code === 'IDLE_LIMIT') {
            this.$error(this.$t('bot-social-games-idle-limit'));
          } else {
            this.$error(err.message || String(err));
          }
        } finally {
          this.saving = false;
        }
      },
    },
  };
</script>
