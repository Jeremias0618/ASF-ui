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
          <p class="bot-social__stat">{{ $t('bot-social-friends-total', { n: friends.length }) }}</p>
          <button type="button" class="button button--link" @click="reload">{{ $t('bot-social-refresh') }}</button>
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

        <div v-if="!friends.length" class="bot-social__state">{{ $t('bot-social-friends-empty') }}</div>
        <ul v-else class="bot-social-list">
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
    addFriends, fetchFriends, isPluginMissingError, removeFriends,
  } from '../api/bot-social';
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
      botName: { immediate: true, handler() { if (!this.pluginMissing) this.reload(); } },
      pluginMissing(value) { if (!value) this.reload(); },
    },
    methods: {
      mapFriend(raw) {
        const steamId = String(raw.SteamId ?? raw.steamId ?? '');
        const avatarHash = raw.AvatarHash ?? raw.avatarHash;
        return {
          steamId,
          name: raw.Name ?? raw.name ?? steamId,
          relationship: raw.Relationship ?? raw.relationship ?? '',
          avatarUrl: avatarHash
            ? `https://avatars.steamstatic.com/${avatarHash}_medium.jpg`
            : '',
        };
      },
      unwrap(result) {
        return result?.[this.botName] ?? result;
      },
      async reload() {
        if (this.pluginMissing) return;
        this.loading = true;
        this.error = '';
        try {
          const result = await fetchFriends(this.botName);
          const payload = this.unwrap(result);
          const list = payload?.Friends ?? payload?.friends ?? [];
          this.friends = list.map(this.mapFriend);
          this.$emit('loaded', { total: payload?.Total ?? payload?.total ?? this.friends.length });
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
      async onAdd() {
        if (!this.addTarget || this.mutating) return;
        this.mutating = true;
        try {
          await addFriends(this.botName, [this.addTarget]);
          this.$success(this.$t('bot-social-friends-add-success'));
          this.addTarget = '';
          await this.reload();
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
          await this.reload();
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
