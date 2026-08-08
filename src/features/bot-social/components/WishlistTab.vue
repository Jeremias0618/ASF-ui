<template>
  <div class="bot-social-tab">
    <PluginMissing v-if="pluginMissing"></PluginMissing>

    <template v-else>
      <div class="bot-social__toolbar">
        <p class="bot-social__stat">{{ $t('bot-social-wishlist-total', { n: items.length }) }}</p>
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
          v-model.trim="appIdInput"
          class="form-item__input"
          type="text"
          inputmode="numeric"
          :placeholder="$t('bot-social-wishlist-add-placeholder')"
          :disabled="mutating"
        >
        <button type="submit" class="button button--confirm" :disabled="!parsedAppId || mutating">
          <FontAwesomeIcon v-if="mutating" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ $t('bot-social-wishlist-add') }}</span>
        </button>
      </form>

      <div v-if="loading && !items.length" class="bot-social__state">
        <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
        <span>{{ $t('bot-social-loading') }}</span>
      </div>
      <div v-else-if="error && !items.length" class="bot-social__state bot-social__state--error">{{ error }}</div>
      <template v-else>
        <p v-if="error" class="bot-social__inline-error">{{ error }}</p>
        <div v-if="!items.length" class="bot-social__state">{{ $t('bot-social-wishlist-empty') }}</div>
        <ul v-else class="bot-social-list" :class="{ 'is-refreshing': refreshing }">
          <li v-for="item in items" :key="item.appId" class="bot-social-list__row">
            <div>
              <strong>{{ item.name }}</strong>
              <span class="bot-social-list__muted">AppID {{ item.appId }}</span>
            </div>
            <button
              type="button"
              class="button button--cancel bot-social-list__action"
              :disabled="mutating"
              @click="onRemove(item)"
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
    addWishlist, isPluginMissingError, removeWishlist,
  } from '../api/bot-social';
  import { invalidateWishlist, loadWishlist } from '../cache/bot-social-queries';
  import { peek } from '../cache/query-cache';
  import PluginMissing from './PluginMissing.vue';

  export default {
    name: 'BotSocialWishlistTab',
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
        items: [],
        appIdInput: '',
      };
    },
    computed: {
      parsedAppId() {
        const n = Number(this.appIdInput);
        return Number.isInteger(n) && n > 0 ? n : 0;
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
        const cached = peek('wishlist', botName);
        if (cached?.data?.items) {
          this.items = cached.data.items;
          this.$emit('loaded', { total: cached.data.total ?? this.items.length });
        }
      },
      formatError(err) {
        const msg = err?.message || String(err);
        return /wishlist|503|unavailable|steam/i.test(msg)
          ? this.$t('bot-social-wishlist-unavailable')
          : msg;
      },
      async load(force) {
        if (this.pluginMissing) return;
        const hasData = this.items.length > 0;
        this.loading = !hasData;
        this.refreshing = force && hasData;
        if (force) this.error = '';

        try {
          const result = await loadWishlist(this.botName, { force });
          this.items = result.data?.items || [];
          if (result.rateLimited) this.$error(this.$t('bot-social-rate-limited'));
          else if (result.error && result.stale) this.error = this.formatError(result.error);
          else this.error = '';
          this.$emit('loaded', { total: result.data?.total ?? this.items.length });
        } catch (err) {
          if (isPluginMissingError(err)) {
            this.$emit('plugin-missing');
            return;
          }
          if (err?.code === 'RATE_LIMITED') this.$error(this.$t('bot-social-rate-limited'));
          else if (!hasData) {
            this.error = this.formatError(err);
            this.items = [];
            this.$emit('loaded', { total: null });
          } else this.error = this.formatError(err);
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
        if (!this.parsedAppId || this.mutating) return;
        this.mutating = true;
        try {
          await addWishlist(this.botName, [this.parsedAppId]);
          this.$success(this.$t('bot-social-wishlist-add-success'));
          this.appIdInput = '';
          invalidateWishlist(this.botName);
          await this.load(true);
        } catch (err) {
          if (isPluginMissingError(err)) this.$emit('plugin-missing');
          else this.$error(err.message || String(err));
        } finally {
          this.mutating = false;
        }
      },
      async onRemove(item) {
        if (this.mutating) return;
        const ok = window.confirm(this.$t('bot-social-wishlist-remove-confirm', { name: item.name }));
        if (!ok) return;
        this.mutating = true;
        try {
          await removeWishlist(this.botName, [Number(item.appId)]);
          this.$success(this.$t('bot-social-wishlist-remove-success'));
          invalidateWishlist(this.botName);
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
