<template>
  <div class="bot-social-tab">
    <div v-if="loading" class="bot-social__state">
      <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
      <span>{{ $t('bot-social-loading') }}</span>
    </div>

    <div v-else-if="error" class="bot-social__state bot-social__state--error">{{ error }}</div>

    <template v-else>
      <div class="bot-social__toolbar">
        <p class="bot-social__stat">{{ $t('bot-social-inventory-apps', { n: apps.length }) }}</p>
        <button type="button" class="button button--link" :disabled="loading" @click="reload">
          {{ $t('bot-social-refresh') }}
        </button>
      </div>

      <div v-if="!apps.length" class="bot-social__state">{{ $t('bot-social-inventory-empty') }}</div>

      <div v-else class="bot-social-inventory">
        <aside class="bot-social-inventory__apps">
          <button
            v-for="app in apps"
            :key="app.appId"
            type="button"
            class="bot-social-inventory__app"
            :class="{ 'is-active': selectedAppId === app.appId }"
            @click="selectApp(app)"
          >
            <span class="bot-social-inventory__app-name">{{ app.name }}</span>
            <span class="bot-social-inventory__app-meta">{{ app.totalAssets }}</span>
          </button>
        </aside>

        <section class="bot-social-inventory__detail">
          <div v-if="selectedApp" class="bot-social-inventory__contexts">
            <button
              v-for="ctx in selectedApp.contexts"
              :key="ctx.contextId"
              type="button"
              class="bot-social-inventory__context"
              :class="{ 'is-active': selectedContextId === ctx.contextId }"
              @click="selectContext(ctx)"
            >
              {{ ctx.name }} ({{ ctx.assetsCount }})
            </button>
          </div>

          <div v-if="itemsLoading" class="bot-social__state">
            <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
          </div>
          <div v-else-if="itemsError" class="bot-social__state bot-social__state--error">{{ itemsError }}</div>
          <div v-else-if="!items.length && selectedContextId" class="bot-social__state">
            {{ $t('bot-social-inventory-items-empty') }}
          </div>
          <ul v-else class="bot-social-list">
            <li v-for="item in filteredItems" :key="item.id" class="bot-social-list__row">
              <div>
                <strong>{{ item.name }}</strong>
                <span v-if="item.type" class="bot-social-list__muted">{{ item.type }}</span>
              </div>
              <span class="bot-social-list__badge">×{{ item.amount }}</span>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>

<script>
  import { fetchInventoryContext, fetchInventorySummary } from '../api/bot-social';
  import { normalizeInventoryItems, normalizeInventorySummary } from '../utils/inventory';

  export default {
    name: 'BotSocialInventoryTab',
    props: {
      botName: { type: String, required: true },
    },
    data() {
      return {
        loading: false,
        error: '',
        apps: [],
        selectedAppId: '',
        selectedContextId: '',
        items: [],
        itemsLoading: false,
        itemsError: '',
      };
    },
    computed: {
      selectedApp() {
        return this.apps.find(app => app.appId === this.selectedAppId) || null;
      },
      filteredItems() {
        return this.items;
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
      async reload() {
        this.loading = true;
        this.error = '';
        this.items = [];
        this.selectedContextId = '';

        try {
          const result = await fetchInventorySummary(this.botName);
          this.apps = normalizeInventorySummary(result, this.botName);
          if (this.apps.length) {
            await this.selectApp(this.apps[0]);
          } else {
            this.selectedAppId = '';
          }
        } catch (err) {
          this.error = err.message || String(err);
          this.apps = [];
        } finally {
          this.loading = false;
        }
      },
      async selectApp(app) {
        this.selectedAppId = app.appId;
        this.items = [];
        this.selectedContextId = '';
        const first = app.contexts[0];
        if (first) await this.selectContext(first);
      },
      async selectContext(ctx) {
        this.selectedContextId = ctx.contextId;
        this.itemsLoading = true;
        this.itemsError = '';
        this.items = [];

        try {
          const result = await fetchInventoryContext(this.botName, this.selectedAppId, ctx.contextId);
          this.items = normalizeInventoryItems(result, this.botName);
        } catch (err) {
          this.itemsError = err.message || String(err);
        } finally {
          this.itemsLoading = false;
        }
      },
    },
  };
</script>
