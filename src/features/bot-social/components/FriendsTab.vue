<template>
  <div class="friends-hub" :class="{ 'is-refreshing': refreshing }">
    <PluginMissing v-if="pluginMissing"></PluginMissing>

    <template v-else>
      <div class="friends-hub__toolbar">
        <p class="friends-hub__stat">{{ $t('bot-social-friends-total', { n: friends.length }) }}</p>
        <button
          type="button"
          class="friends-hub__refresh"
          :disabled="loading || refreshing || mutating"
          @click="refresh"
        >
          <FontAwesomeIcon v-if="refreshing" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ $t('bot-social-refresh') }}</span>
        </button>
      </div>

      <div class="friends-hub__chrome">
        <div class="friends-hub__searchbox">
          <FontAwesomeIcon icon="search" class="friends-hub__search-icon" aria-hidden="true"></FontAwesomeIcon>
          <input
            v-model.trim="query"
            class="friends-hub__search-input"
            type="search"
            :placeholder="$t('bot-social-friends-search-placeholder')"
            :aria-label="$t('bot-social-friends-search-label')"
            autocomplete="off"
          >
        </div>

        <div class="friends-hub__filter">
          <span id="friends-status-label" class="friends-hub__filter-label">{{ $t('bot-social-friends-filter-status') }}</span>
          <AsfSelect
            v-model="statusFilter"
            compact
            searchable
            aria-labelledby="friends-status-label"
            :options="statusOptions"
            :search-placeholder="$t('bot-social-inventory-filter-search-options')"
          ></AsfSelect>
        </div>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="friends-hub__clear"
          @click="clearFilters"
        >
          {{ $t('bot-social-friends-clear-filters') }}
        </button>
      </div>

      <form class="friends-hub__add" @submit.prevent="onAdd">
        <input
          v-model.trim="addTarget"
          class="friends-hub__add-input"
          type="text"
          :placeholder="$t('bot-social-friends-add-placeholder')"
          :disabled="mutating"
        >
        <button type="submit" class="friends-hub__add-btn" :disabled="!addTarget || mutating">
          <FontAwesomeIcon v-if="mutating" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ $t('bot-social-friends-add') }}</span>
        </button>
      </form>

      <div v-if="loading && !friends.length" class="friends-hub__skeleton" aria-busy="true" :aria-label="$t('bot-social-loading')">
        <div v-for="n in 6" :key="n" class="friends-hub__skel-card"></div>
      </div>
      <div v-else-if="error && !friends.length" class="bot-social__state bot-social__state--error">{{ error }}</div>
      <template v-else>
        <p v-if="error" class="bot-social__inline-error">{{ error }}</p>
        <div v-if="!friends.length" class="friends-hub__empty">
          <p>{{ $t('bot-social-friends-empty') }}</p>
        </div>
        <div v-else-if="!filteredFriends.length" class="friends-hub__empty">
          <p>{{ $t('bot-social-friends-search-empty') }}</p>
          <button type="button" class="button button--link" @click="clearFilters">
            {{ $t('bot-social-friends-clear-filters') }}
          </button>
        </div>
        <ul v-else class="friends-hub__grid" :class="{ 'is-refreshing': refreshing }">
          <li v-for="friend in pageFriends" :key="friend.steamId" class="friends-hub__card-wrap">
            <article
              class="friends-hub__card"
              :class="{
                'is-blocked': isBlocked(friend),
                'is-offline': isOffline(friend),
              }"
            >
              <a
                class="friends-hub__avatar-link"
                :href="profileUrl(friend.steamId)"
                target="_blank"
                rel="noreferrer noopener"
                :aria-label="friend.name || friend.steamId"
              >
                <img
                  v-if="friend.avatarUrl && !brokenAvatars[friend.steamId]"
                  class="friends-hub__avatar"
                  :src="friend.avatarUrl"
                  alt=""
                  width="64"
                  height="64"
                  loading="lazy"
                  decoding="async"
                  @error="onAvatarError(friend.steamId)"
                >
                <span v-else class="friends-hub__avatar friends-hub__avatar--fallback" aria-hidden="true">
                  {{ initials(friend) }}
                </span>
              </a>
              <div class="friends-hub__meta">
                <a
                  class="friends-hub__name"
                  :href="profileUrl(friend.steamId)"
                  target="_blank"
                  rel="noreferrer noopener"
                >{{ friend.name || friend.steamId }}</a>
                <span v-if="isBlocked(friend)" class="friends-hub__badge friends-hub__badge--blocked">
                  {{ $t('bot-social-friends-blocked') }}
                </span>
                <span v-else-if="personaLabel(friend)" class="friends-hub__badge">
                  {{ personaLabel(friend) }}
                </span>
                <span class="friends-hub__steamid">{{ friend.steamId }}</span>
              </div>
              <button
                type="button"
                class="friends-hub__remove"
                :disabled="mutating"
                :title="$t('delete')"
                :aria-label="$t('bot-social-friends-remove-aria', { name: friend.name || friend.steamId })"
                @click="askRemove(friend)"
              >
                {{ $t('delete') }}
              </button>
            </article>
          </li>
        </ul>

        <div v-if="totalPages > 1" class="friends-hub__pager">
          <button type="button" class="friends-hub__page-btn" :disabled="page <= 1" @click="page -= 1">
            <FontAwesomeIcon icon="chevron-left"></FontAwesomeIcon>
          </button>
          <span>{{ $t('bot-social-inventory-page', { current: page, total: totalPages }) }}</span>
          <button type="button" class="friends-hub__page-btn" :disabled="page >= totalPages" @click="page += 1">
            <FontAwesomeIcon icon="chevron-right"></FontAwesomeIcon>
          </button>
        </div>
      </template>
    </template>

    <RemoveDialog
      :open="Boolean(pendingRemove)"
      :friend-name="pendingRemoveDisplayName"
      :submitting="mutating"
      @cancel="pendingRemove = null"
      @confirm="confirmRemove"
    ></RemoveDialog>
  </div>
</template>

<script>
  import {
    addFriends, isPluginMissingError, removeFriends,
  } from '../api/bot-social';
  import { invalidateFriends, loadFriends } from '../cache/bot-social-queries';
  import { resolveLocalData } from '../cache/load-policy';
  import PluginMissing from './PluginMissing.vue';
  import RemoveDialog from './friends/remove-dialog.vue';

  const PAGE_SIZE = 24;

  export default {
    name: 'BotSocialFriendsTab',
    components: { PluginMissing, RemoveDialog },
    props: {
      botName: { type: String, required: true },
      pluginMissing: { type: Boolean, default: false },
    },
    data() {
      return {
        loading: false,
        refreshing: false,
        mutating: false,
        error: '',
        friends: [],
        addTarget: '',
        query: '',
        statusFilter: 'all',
        page: 1,
        pendingRemove: null,
        brokenAvatars: {},
      };
    },
    computed: {
      hasActiveFilters() {
        return Boolean(this.query || this.statusFilter !== 'all');
      },
      statusOptions() {
        const all = this.friends.length;
        const blocked = this.friends.filter(f => this.isBlocked(f)).length;
        const online = this.friends.filter(f => this.isOnline(f)).length;
        return [
          { value: 'all', label: `${this.$t('bot-social-friends-filter-all')} (${all})` },
          { value: 'online', label: `${this.$t('bot-social-friends-filter-online')} (${online})` },
          { value: 'offline', label: `${this.$t('bot-social-friends-filter-offline')} (${all - online - blocked})` },
          { value: 'blocked', label: `${this.$t('bot-social-friends-blocked')} (${blocked})` },
        ];
      },
      filteredFriends() {
        const q = this.query.trim().toLowerCase();
        return this.friends.filter(f => {
          if (this.statusFilter === 'blocked' && !this.isBlocked(f)) return false;
          if (this.statusFilter === 'online' && !this.isOnline(f)) return false;
          if (this.statusFilter === 'offline' && (this.isOnline(f) || this.isBlocked(f))) return false;
          if (!q) return true;
          return String(f.name || '').toLowerCase().includes(q)
            || String(f.steamId).includes(q);
        });
      },
      totalPages() {
        return Math.max(1, Math.ceil(this.filteredFriends.length / PAGE_SIZE) || 1);
      },
      pageFriends() {
        const safe = Math.min(Math.max(1, this.page), this.totalPages);
        const start = (safe - 1) * PAGE_SIZE;
        return this.filteredFriends.slice(start, start + PAGE_SIZE);
      },
      pendingRemoveDisplayName() {
        if (!this.pendingRemove) return '';
        return this.pendingRemove.name || this.pendingRemove.steamId;
      },
    },
    watch: {
      botName: {
        immediate: true,
        handler() {
          this.resetView();
          this.bootstrap();
        },
      },
      pluginMissing(value) {
        if (!value) this.bootstrap();
      },
      query() {
        this.page = 1;
      },
      statusFilter() {
        this.page = 1;
      },
      filteredFriends() {
        if (this.page > this.totalPages) this.page = this.totalPages;
      },
    },
    methods: {
      resetView() {
        this.query = '';
        this.statusFilter = 'all';
        this.page = 1;
        this.pendingRemove = null;
        this.brokenAvatars = {};
        this.error = '';
      },
      clearFilters() {
        this.query = '';
        this.statusFilter = 'all';
        this.page = 1;
      },
      bootstrap() {
        if (this.pluginMissing) return;
        const resolved = resolveLocalData({
          resource: 'friends',
          botName: this.botName,
          isUsable: data => Array.isArray(data?.friends),
        });
        if (resolved.hasData) {
          this.friends = resolved.data.friends;
          this.$emit('loaded', { total: resolved.data.total ?? this.friends.length });
          return;
        }
        this.load(false);
      },
      async load(force) {
        if (this.pluginMissing) return;
        const hasData = this.friends.length > 0;
        this.loading = !hasData;
        this.refreshing = force && hasData;
        if (force) this.error = '';

        try {
          const result = await loadFriends(this.botName, { force });
          this.friends = result.data?.friends || [];
          if (result.rateLimited) this.$error(this.$t('bot-social-rate-limited'));
          else if (result.error && result.stale) this.error = result.error.message || String(result.error);
          else this.error = '';
          this.$emit('loaded', { total: result.data?.total ?? this.friends.length });
        } catch (err) {
          if (isPluginMissingError(err)) {
            this.$emit('plugin-missing');
            return;
          }
          if (err?.code === 'RATE_LIMITED') this.$error(this.$t('bot-social-rate-limited'));
          else if (!hasData) {
            this.error = err.message || String(err);
            this.friends = [];
          } else this.error = err.message || String(err);
        } finally {
          this.loading = false;
          this.refreshing = false;
        }
      },
      refresh() {
        if (this.loading || this.refreshing || this.mutating) return;
        this.load(true);
      },
      isBlocked(friend) {
        return String(friend.relationship || '').toLowerCase() === 'blocked';
      },
      isOnline(friend) {
        if (this.isBlocked(friend)) return false;
        const state = String(friend.personaState || '').toLowerCase();
        return state && state !== 'offline' && state !== 'invisible';
      },
      isOffline(friend) {
        return !this.isBlocked(friend) && !this.isOnline(friend);
      },
      personaLabel(friend) {
        if (this.isBlocked(friend)) return '';
        const state = String(friend.personaState || '');
        if (!state || state === 'Offline' || state === 'Invisible') {
          return this.$t('bot-social-friends-state-offline');
        }
        if (state === 'Online') return this.$t('bot-social-friends-state-online');
        if (state === 'Away') return this.$t('bot-social-friends-state-away');
        if (state === 'Busy' || state === 'Snooze') return this.$t('bot-social-friends-state-busy');
        return state;
      },
      profileUrl(steamId) {
        return `https://steamcommunity.com/profiles/${encodeURIComponent(steamId)}`;
      },
      initials(friend) {
        const name = String(friend.name || friend.steamId || '?').trim();
        return name.slice(0, 1).toUpperCase();
      },
      onAvatarError(steamId) {
        this.$set(this.brokenAvatars, steamId, true);
      },
      async onAdd() {
        if (!this.addTarget || this.mutating) return;
        this.mutating = true;
        try {
          await addFriends(this.botName, [this.addTarget]);
          this.$success(this.$t('bot-social-friends-add-success'));
          this.addTarget = '';
          invalidateFriends(this.botName);
          await this.load(true);
        } catch (err) {
          if (isPluginMissingError(err)) this.$emit('plugin-missing');
          else this.$error(err.message || String(err));
        } finally {
          this.mutating = false;
        }
      },
      askRemove(friend) {
        if (this.mutating) return;
        this.pendingRemove = friend;
      },
      async confirmRemove() {
        const friend = this.pendingRemove;
        if (!friend || this.mutating) return;
        this.mutating = true;
        try {
          await removeFriends(this.botName, [friend.steamId]);
          this.$success(this.$t('bot-social-friends-remove-success'));
          this.pendingRemove = null;
          invalidateFriends(this.botName);
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
