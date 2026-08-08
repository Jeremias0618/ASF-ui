<template>
  <div class="bot-social-tab">
    <div class="bot-social__toolbar">
      <div>
        <p class="bot-social__stat">{{ $t('bot-social-inventory-steam-total', { n: items.length }) }}</p>
        <p class="bot-social__hint">{{ $t('bot-social-inventory-steam-hint') }}</p>
      </div>
      <div class="bot-social__toolbar-actions">
        <input
          v-model.trim="query"
          class="form-item__input bot-social__search"
          type="search"
          :placeholder="$t('bot-social-search')"
        >
        <button
          type="button"
          class="button button--link"
          :disabled="loading || refreshing"
          @click="refresh"
        >
          <FontAwesomeIcon v-if="refreshing" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ $t('bot-social-refresh') }}</span>
        </button>
      </div>
    </div>

    <div v-if="loading && !items.length" class="bot-social__state">
      <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
      <span>{{ $t('bot-social-loading') }}</span>
    </div>
    <div v-else-if="error && !items.length" class="bot-social__state bot-social__state--error">{{ error }}</div>
    <template v-else>
      <p v-if="error" class="bot-social__inline-error">{{ error }}</p>
      <div v-if="!items.length" class="bot-social__state">{{ $t('bot-social-inventory-empty') }}</div>
      <div v-else-if="!filteredItems.length" class="bot-social__state">{{ $t('bot-social-inventory-items-empty') }}</div>
      <ul v-else class="bot-social-list" :class="{ 'is-refreshing': refreshing }">
        <li v-for="item in filteredItems" :key="item.id" class="bot-social-list__row">
          <div>
            <strong>{{ item.name }}</strong>
            <span v-if="item.type" class="bot-social-list__muted">{{ item.type }}</span>
          </div>
          <span class="bot-social-list__badge">×{{ item.amount }}</span>
        </li>
      </ul>
    </template>
  </div>
</template>

<script>
  import { loadInventory } from '../cache/bot-social-queries';
  import { peek } from '../cache/query-cache';

  export default {
    name: 'BotSocialInventoryTab',
    props: {
      botName: { type: String, required: true },
    },
    data() {
      return {
        loading: false,
        refreshing: false,
        error: '',
        items: [],
        query: '',
      };
    },
    computed: {
      filteredItems() {
        const q = this.query.toLowerCase();
        if (!q) return this.items;
        return this.items.filter(item => (
          item.name.toLowerCase().includes(q)
          || (item.type && item.type.toLowerCase().includes(q))
          || item.classId.includes(q)
        ));
      },
    },
    watch: {
      botName: {
        immediate: true,
        handler(name) {
          this.hydrateFromCache(name);
          this.load(false);
        },
      },
    },
    methods: {
      hydrateFromCache(botName) {
        const cached = peek('inventory', botName);
        if (cached?.data) this.items = cached.data;
      },
      async load(force) {
        const hasData = this.items.length > 0;
        this.loading = !hasData;
        this.refreshing = force && hasData;
        if (force) this.error = '';

        try {
          const result = await loadInventory(this.botName, { force });
          this.items = result.data || [];
          if (result.rateLimited) {
            this.$error(this.$t('bot-social-rate-limited'));
          } else if (result.error && result.stale) {
            this.error = result.error.message || String(result.error);
          } else {
            this.error = '';
          }
          this.$emit('loaded', { total: this.items.length });
        } catch (err) {
          if (err?.code === 'RATE_LIMITED') {
            this.$error(this.$t('bot-social-rate-limited'));
          } else if (!hasData) {
            this.error = err.message || String(err);
            this.items = [];
          } else {
            this.error = err.message || String(err);
          }
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
