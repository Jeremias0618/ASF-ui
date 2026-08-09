<template>
  <section class="games-add" :aria-label="$t('bot-social-games-add-title')">
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
        <img
          class="games-add__thumb"
          :src="item.tinyImage || gameHeaderUrl(item.appId)"
          :alt="''"
          loading="lazy"
          decoding="async"
          @error="onThumbError($event, item.appId)"
        >
        <div class="games-add__meta">
          <p class="games-add__name">{{ item.name }}</p>
          <div class="games-add__price-row">
            <span v-if="item.owned" class="games-add__owned">{{ $t('bot-social-games-add-owned') }}</span>
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
          :disabled="item.owned || addingId === item.appId"
          @click="onAdd(item)"
        >
          <FontAwesomeIcon v-if="addingId === item.appId" icon="spinner" spin></FontAwesomeIcon>
          <span v-else-if="item.owned">{{ $t('bot-social-games-add-owned') }}</span>
          <span v-else>{{ $t('bot-social-games-add-action') }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<script>
  import { addGames, isPluginMissingError, searchGames } from '../../api/bot-social';
  import { gameBannerCandidates, gameHeaderUrl } from '../../utils/game-cover';
  import { normalizeGameSearchQuery } from '../../utils/game-target';

  const DEBOUNCE_MS = 400;

  export default {
    name: 'BotSocialGamesAddPanel',
    props: {
      botName: { type: String, required: true },
    },
    data() {
      return {
        gameHeaderUrl,
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
      onThumbError(event, appId) {
        const img = event?.target;
        if (!img) return;
        const candidates = gameBannerCandidates(appId);
        const idx = Number(img.dataset.coverIndex || 0) + 1;
        if (idx < candidates.length) {
          img.dataset.coverIndex = String(idx);
          img.src = candidates[idx];
          return;
        }
        img.style.visibility = 'hidden';
      },
      hasPrice(item) {
        return item.finalPrice != null || item.initialPrice != null;
      },
      isFree(item) {
        return item.finalPrice === 0 || item.discountPercent === 100;
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
          this.results = list.map(raw => ({
            appId: Number(raw.AppId ?? raw.appId),
            name: raw.Name ?? raw.name ?? `App ${raw.AppId ?? raw.appId}`,
            tinyImage: raw.TinyImage ?? raw.tinyImage ?? '',
            currency: raw.Currency ?? raw.currency ?? null,
            initialPrice: raw.InitialPrice ?? raw.initialPrice ?? null,
            finalPrice: raw.FinalPrice ?? raw.finalPrice ?? null,
            discountPercent: raw.DiscountPercent ?? raw.discountPercent ?? 0,
            owned: !!(raw.Owned ?? raw.owned),
          })).filter(item => item.appId > 0);
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
        if (!item || item.owned || this.addingId) return;
        this.addingId = item.appId;
        this.error = '';
        try {
          const payload = await addGames(this.botName, [item.appId]);
          const botResult = payload?.[this.botName]
            || payload?.[Object.keys(payload || {}).find(k => k.toLowerCase() === String(this.botName || '').toLowerCase())]
            || payload?.[Object.keys(payload || {})[0]];
          const first = (botResult?.Results || botResult?.results || [])[0];
          const ok = (first?.Success ?? first?.success) === true;
          const message = first?.Message || first?.message || '';
          if (!ok) {
            this.$error(message || this.$t('bot-social-games-add-failed'));
            return;
          }
          item.owned = true;
          this.$success(
            message === 'Already owned'
              ? this.$t('bot-social-games-add-already')
              : this.$t('bot-social-games-add-success', { name: item.name }),
          );
          this.$emit('added', { appId: item.appId, name: item.name });
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
