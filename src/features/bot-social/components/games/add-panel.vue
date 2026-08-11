<template>
  <section class="games-add" :aria-label="$t('bot-social-games-add-title')">
    <div class="bot-social-games__chrome">
    <header class="games-add__header">
      <p class="games-add__eyebrow">{{ $t('bot-social-games-view-add') }}</p>
      <h3 class="games-add__title">{{ $t('bot-social-games-add-title') }}</h3>
      <p class="games-add__lead">{{ $t('bot-social-games-add-lead') }}</p>
    </header>

    <form class="games-add__form" @submit.prevent="runSearch(true)">
      <label class="games-add__searchbox" for="games-add-query">
        <FontAwesomeIcon class="games-add__search-icon" icon="search" aria-hidden="true"></FontAwesomeIcon>
        <input
          id="games-add-query"
          v-model="query"
          class="games-add__input"
          type="search"
          autocomplete="off"
          spellcheck="false"
          :placeholder="$t('bot-social-games-add-placeholder')"
          :disabled="searching"
          @input="onQueryInput"
        >
      </label>
      <button type="submit" class="games-add__submit" :disabled="!canSearch || searching">
        <FontAwesomeIcon v-if="searching" icon="spinner" spin></FontAwesomeIcon>
        <FontAwesomeIcon v-else icon="search" aria-hidden="true"></FontAwesomeIcon>
        <span class="games-add__submit-label">{{ $t('bot-social-games-add-search') }}</span>
      </button>
    </form>
    </div>

    <p v-if="error" class="bot-social__inline-error">{{ error }}</p>

    <div v-if="searching && !results.length" class="bot-social__state">
      <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
      <span>{{ $t('bot-social-loading') }}</span>
    </div>
    <div v-else-if="searched && !results.length" class="bot-social__state">
      {{ $t('bot-social-games-add-empty') }}
    </div>
    <ul v-else-if="results.length" class="games-add__list" :class="{ 'is-busy': searching || addingId }">
      <li v-for="item in results" :key="item.appId" class="games-add__row">
        <CoverImage
          class="games-add__thumb"
          :appId="item.appId"
          :name="item.name"
          :botName="botName"
          :src="item.tinyImage || ''"
          variant="banner"
        ></CoverImage>
        <div class="games-add__meta">
          <p class="games-add__name">
            {{ item.name }}
            <span v-if="item.isDemo" class="games-add__demo-badge">{{ $t('bot-social-games-add-demo-badge') }}</span>
            <span v-else-if="item.demoAppId" class="games-add__demo-badge">{{ $t('bot-social-games-add-demo-available') }}</span>
          </p>
          <div class="games-add__price-row">
            <span v-if="item.owned" class="games-add__owned">{{ $t('bot-social-games-add-owned') }}</span>
            <span v-else-if="item.demoOwned" class="games-add__owned">{{ $t('bot-social-games-add-demo-owned') }}</span>
            <template v-else-if="hasPrice(item)">
              <span
                v-if="item.discountPercent > 0"
                class="games-add__discount"
              >-{{ item.discountPercent }}%</span>
              <span
                v-if="item.discountPercent > 0 && item.initialPrice != null"
                class="games-add__price-was"
              >{{ formatPrice(item.initialPrice, item.currency) }}</span>
              <span class="games-add__price">
                {{ isFree(item) ? $t('bot-social-games-add-free') : formatPrice(item.finalPrice, item.currency) }}
              </span>
            </template>
            <span v-else class="games-add__price-muted">AppID {{ item.appId }}</span>
          </div>
        </div>
        <button
          type="button"
          class="games-add__add-btn"
          :disabled="!canAdd(item) || addingId === item.appId"
          @click="onAdd(item)"
        >
          <FontAwesomeIcon v-if="addingId === item.appId" icon="spinner" spin></FontAwesomeIcon>
          <span v-else-if="item.owned">{{ $t('bot-social-games-add-owned') }}</span>
          <span v-else-if="item.demoOwned">{{ $t('bot-social-games-add-demo-owned') }}</span>
          <span v-else-if="addUsesDemo(item)">{{ $t('bot-social-games-add-demo-action') }}</span>
          <span v-else>{{ $t('bot-social-games-add-action') }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<script>
  import { addGames, isPluginMissingError, searchGames } from '../../api/bot-social';
  import { normalizeGameSearchQuery } from '../../utils/game-target';
  import CoverImage from './cover-image.vue';

  const DEBOUNCE_MS = 400;

  export default {
    name: 'BotSocialGamesAddPanel',
    components: { CoverImage },
    props: {
      botName: { type: String, required: true },
    },
    data() {
      return {
        query: '',
        results: [],
        searching: false,
        searched: false,
        error: '',
        addingId: 0,
        debounceTimer: null,
        searchSeq: 0,
      };
    },
    computed: {
      canSearch() {
        return normalizeGameSearchQuery(this.query).length > 0;
      },
    },
    beforeDestroy() {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
    },
    methods: {
      hasPrice(item) {
        return item.finalPrice != null || item.initialPrice != null;
      },
      isFree(item) {
        return item.finalPrice === 0 || item.discountPercent === 100 || item.isDemo;
      },
      addUsesDemo(item) {
        return !!(item && !item.owned && !item.isDemo && item.demoAppId && !item.demoOwned && !this.isFree(item));
      },
      canAdd(item) {
        if (!item || item.owned) return false;
        if (item.demoOwned && !this.isFree(item) && !item.isDemo) return false;
        return true;
      },
      formatPrice(cents, currency) {
        if (cents == null) return '';
        const amount = Number(cents) / 100;
        const code = currency || 'USD';
        try {
          return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(amount);
        } catch {
          return `${amount.toFixed(2)} ${code}`;
        }
      },
      onQueryInput() {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        const q = normalizeGameSearchQuery(this.query);
        if (!q) {
          this.results = [];
          this.searched = false;
          this.error = '';
          return;
        }
        this.debounceTimer = setTimeout(() => this.runSearch(false), DEBOUNCE_MS);
      },
      async runSearch(fromSubmit) {
        const q = normalizeGameSearchQuery(this.query);
        if (!q) {
          if (fromSubmit) this.$error(this.$t('bot-social-games-add-invalid'));
          return;
        }

        const seq = ++this.searchSeq;
        this.searching = true;
        this.error = '';

        try {
          const payload = await searchGames(this.botName, q);
          if (seq !== this.searchSeq) return;
          const botResult = payload?.[this.botName]
            || payload?.[Object.keys(payload || {}).find(k => k.toLowerCase() === String(this.botName || '').toLowerCase())]
            || payload?.[Object.keys(payload || {})[0]];
          const list = botResult?.Items || botResult?.items || [];
          this.results = list.map(raw => {
            const demoRaw = raw.DemoAppId ?? raw.demoAppId;
            const demoAppId = demoRaw != null && Number(demoRaw) > 0 ? Number(demoRaw) : null;
            return {
              appId: Number(raw.AppId ?? raw.appId),
              name: raw.Name ?? raw.name ?? `App ${raw.AppId ?? raw.appId}`,
              tinyImage: raw.TinyImage ?? raw.tinyImage ?? '',
              currency: raw.Currency ?? raw.currency ?? null,
              initialPrice: raw.InitialPrice ?? raw.initialPrice ?? null,
              finalPrice: raw.FinalPrice ?? raw.finalPrice ?? null,
              discountPercent: raw.DiscountPercent ?? raw.discountPercent ?? 0,
              owned: !!(raw.Owned ?? raw.owned),
              isDemo: !!(raw.IsDemo ?? raw.isDemo),
              demoAppId,
              demoOwned: !!(raw.DemoOwned ?? raw.demoOwned),
            };
          }).filter(item => item.appId > 0);
          this.searched = true;
        } catch (err) {
          if (seq !== this.searchSeq) return;
          if (isPluginMissingError(err)) {
            this.$emit('plugin-missing');
            return;
          }
          this.error = err.message || String(err);
          this.results = [];
          this.searched = true;
        } finally {
          if (seq === this.searchSeq) this.searching = false;
        }
      },
      async onAdd(item) {
        if (!item || !this.canAdd(item) || this.addingId) return;
        this.addingId = item.appId;
        this.error = '';
        try {
          const payload = await addGames(this.botName, [item.appId]);
          const botResult = payload?.[this.botName]
            || payload?.[Object.keys(payload || {}).find(k => k.toLowerCase() === String(this.botName || '').toLowerCase())]
            || payload?.[Object.keys(payload || {})[0]];
          const first = (botResult?.Results || botResult?.results || [])[0];
          const ok = (first?.Success ?? first?.success) === true;
          const message = String(first?.Message || first?.message || '');
          const claimedId = Number(first?.Target ?? first?.target) || item.appId;
          if (!ok) {
            this.$error(message || this.$t('bot-social-games-add-failed'));
            return;
          }

          const viaDemo = /demo/i.test(message) || (item.demoAppId && claimedId === item.demoAppId);
          if (viaDemo) {
            item.demoOwned = true;
            if (!item.demoAppId) item.demoAppId = claimedId;
          } else {
            item.owned = true;
          }

          const already = /^Already owned/i.test(message);
          if (already && viaDemo) {
            this.$success(this.$t('bot-social-games-add-demo-already'));
          } else if (already) {
            this.$success(this.$t('bot-social-games-add-already'));
          } else if (viaDemo) {
            this.$success(this.$t('bot-social-games-add-demo-success', { name: item.name, appId: claimedId }));
          } else {
            this.$success(this.$t('bot-social-games-add-success', { name: item.name }));
          }

          this.$emit('added', {
            appId: claimedId,
            name: item.name,
            isDemo: viaDemo || item.isDemo,
          });
        } catch (err) {
          if (isPluginMissingError(err)) {
            this.$emit('plugin-missing');
            return;
          }
          this.$error(err.message || String(err));
        } finally {
          this.addingId = 0;
        }
      },
    },
  };
</script>
