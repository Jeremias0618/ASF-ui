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
          <p class="bot-social__stat">{{ $t('bot-social-wishlist-total', { n: items.length }) }}</p>
          <button type="button" class="button button--link" @click="reload">{{ $t('bot-social-refresh') }}</button>
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

        <div v-if="!items.length" class="bot-social__state">{{ $t('bot-social-wishlist-empty') }}</div>
        <ul v-else class="bot-social-list">
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
    addWishlist, fetchWishlist, isPluginMissingError, removeWishlist,
  } from '../api/bot-social';
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
          const result = await fetchWishlist(this.botName);
          const payload = this.unwrap(result);
          const list = payload?.Items ?? payload?.items ?? [];
          this.items = list.map(item => ({
            appId: String(item.AppId ?? item.appId ?? ''),
            name: item.Name ?? item.name ?? `App ${item.AppId ?? item.appId}`,
          }));
          this.$emit('loaded', { total: payload?.Total ?? payload?.total ?? this.items.length });
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
        if (!this.parsedAppId || this.mutating) return;
        this.mutating = true;
        try {
          await addWishlist(this.botName, [this.parsedAppId]);
          this.$success(this.$t('bot-social-wishlist-add-success'));
          this.appIdInput = '';
          await this.reload();
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
