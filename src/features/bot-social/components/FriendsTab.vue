<template>
  <div class="bot-social-tab">
    <PluginMissing v-if="pluginMissing"></PluginMissing>

    <template v-else>
      <div class="bot-social__toolbar">
        <p class="bot-social__stat">{{ $t('bot-social-friends-total', { n: friends.length }) }}</p>
        <button
          type="button"
          class="button button--link"
          :disabled="loading || refreshing || mutating"
          @click="refresh"
        >
          <FontAwesomeIcon v-if="refreshing" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ $t('bot-social-refresh') }}</span>
        </button>
      </div>

      <form class="bot-social__form" @submit.prevent="onAdd">
        <input
          v-model.trim="addTarget"
          class="form-item__input"
          type="text"
          :placeholder="$t('bot-social-friends-add-placeholder')"
          :disabled="mutating"
        >
        <button type="submit" class="button button--confirm" :disabled="!addTarget || mutating">
          <FontAwesomeIcon v-if="mutating" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ $t('bot-social-friends-add') }}</span>
        </button>
      </form>

      <div v-if="loading && !friends.length" class="bot-social__state">
        <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
        <span>{{ $t('bot-social-loading') }}</span>
      </div>
      <div v-else-if="error && !friends.length" class="bot-social__state bot-social__state--error">{{ error }}</div>
      <template v-else>
        <p v-if="error" class="bot-social__inline-error">{{ error }}</p>
        <div v-if="!friends.length" class="bot-social__state">{{ $t('bot-social-friends-empty') }}</div>
        <ul v-else class="bot-social-list" :class="{ 'is-refreshing': refreshing }">
          <li v-for="friend in filteredFriends" :key="friend.steamId" class="bot-social-list__row">
            <div class="bot-social-list__identity">
              <img
                v-if="friend.avatarUrl"
                class="bot-social-list__avatar"
                :src="friend.avatarUrl"
                alt=""
                width="32"
                height="32"
              >
              <div>
                <strong>{{ friend.name || friend.steamId }}</strong>
                <span class="bot-social-list__muted">{{ friend.steamId }}</span>
              </div>
            </div>
            <button
              type="button"
              class="button button--cancel bot-social-list__action"
              :disabled="mutating"
              @click="onRemove(friend)"
            >
              {{ $t('delete') }}
            </button>
          </li>
        </ul>
      </template>
    </template>
  </div>
</template>

<script>
  import {
    addFriends, isPluginMissingError, removeFriends,
  } from '../api/bot-social';
  import { invalidateFriends, loadFriends } from '../cache/bot-social-queries';
  import { peek } from '../cache/query-cache';
  import PluginMissing from './PluginMissing.vue';

  export default {
    name: 'BotSocialFriendsTab',
    components: { PluginMissing },
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
      };
    },
    computed: {
      filteredFriends() {
        const q = this.query.trim().toLowerCase();
        if (!q) return this.friends;
        return this.friends.filter(f => (
          String(f.name || '').toLowerCase().includes(q)
          || String(f.steamId).includes(q)
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
        const cached = peek('friends', botName);
        if (cached?.data?.friends) {
          this.friends = cached.data.friends;
          this.$emit('loaded', { total: cached.data.total ?? this.friends.length });
        }
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
      async onRemove(friend) {
        if (this.mutating) return;
        const ok = window.confirm(this.$t('bot-social-friends-remove-confirm', { name: friend.name }));
        if (!ok) return;
        this.mutating = true;
        try {
          await removeFriends(this.botName, [friend.steamId]);
          this.$success(this.$t('bot-social-friends-remove-success'));
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
