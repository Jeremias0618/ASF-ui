<template>
  <div class="trade-offers" :class="{ 'is-refreshing': refreshing }">
    <div class="trade-offers__toolbar">
      <p class="trade-offers__stat">{{ $t('bot-social-trades-total', { n: offers.length }) }}</p>
      <button
        type="button"
        class="trade-offers__refresh"
        :disabled="loading || refreshing || mutating"
        @click="refresh"
      >
        <FontAwesomeIcon :icon="refreshing ? 'spinner' : 'redo-alt'" :spin="refreshing"></FontAwesomeIcon>
        <span>{{ $t('bot-social-refresh') }}</span>
      </button>
    </div>

    <div v-if="loading && !offers.length" class="trade-offers__skeleton" aria-busy="true">
      <div v-for="n in 3" :key="n" class="trade-offers__skel-card"></div>
    </div>
    <div v-else-if="error && !offers.length" class="bot-social__state bot-social__state--error">{{ error }}</div>
    <template v-else>
      <p v-if="error" class="bot-social__inline-error">{{ error }}</p>
      <div v-if="!offers.length" class="trade-offers__empty">
        <p>{{ $t('bot-social-trades-empty') }}</p>
      </div>
      <ul v-else class="trade-offers__list">
        <li v-for="offer in offers" :key="offer.tradeOfferId" class="trade-offers__item">
          <article class="trade-card">
            <header class="trade-card__head">
              <a
                class="trade-card__partner"
                :href="profileUrl(offer.partnerSteamId)"
                target="_blank"
                rel="noreferrer noopener"
              >
                <img
                  v-if="offer.partnerAvatarUrl && !brokenAvatars[offer.partnerSteamId]"
                  class="trade-card__avatar"
                  :src="offer.partnerAvatarUrl"
                  alt=""
                  width="40"
                  height="40"
                  loading="lazy"
                  decoding="async"
                  @error="onAvatarError(offer.partnerSteamId)"
                >
                <span v-else class="trade-card__avatar trade-card__avatar--fallback" aria-hidden="true">
                  {{ initials(offer.partnerName) }}
                </span>
                <span class="trade-card__headline">{{ headline(offer) }}</span>
              </a>
              <span class="trade-card__id">#{{ offer.tradeOfferId }}</span>
            </header>

            <div class="trade-card__banner" :class="`is-${offer.waitingFor}`">
              {{ waitingLabel(offer) }}
            </div>

            <section class="trade-card__side">
              <h4 class="trade-card__side-title">
                <span class="trade-card__side-label">{{ receiveTitle(offer) }}</span>
                <span class="trade-card__side-count">{{ offer.itemsToReceive.length }}</span>
              </h4>
              <div v-if="offer.itemsToReceive.length" class="trade-card__grid">
                <div
                  v-for="item in offer.itemsToReceive"
                  :key="`in-${offer.tradeOfferId}-${item.assetId}`"
                  class="trade-card__cell"
                  :style="item.backgroundColor ? { backgroundColor: `#${item.backgroundColor}` } : null"
                  :title="item.name"
                >
                  <img
                    v-if="item.iconUrl"
                    class="trade-card__thumb"
                    :src="item.iconUrl"
                    :alt="item.name"
                    loading="lazy"
                    decoding="async"
                  >
                  <span v-else class="trade-card__thumb-fallback">?</span>
                  <span class="trade-card__cell-name">{{ item.name }}</span>
                  <span v-if="item.game" class="trade-card__cell-game">{{ item.game }}</span>
                  <span v-if="item.amount > 1" class="trade-card__qty">×{{ item.amount }}</span>
                </div>
              </div>
              <p v-else class="trade-card__none">{{ $t('bot-social-trades-no-items') }}</p>
            </section>

            <section class="trade-card__side">
              <h4 class="trade-card__side-title">
                <span class="trade-card__side-label">{{ giveTitle(offer) }}</span>
                <span class="trade-card__side-count">{{ offer.itemsToGive.length }}</span>
              </h4>
              <div v-if="offer.itemsToGive.length" class="trade-card__grid">
                <div
                  v-for="item in offer.itemsToGive"
                  :key="`out-${offer.tradeOfferId}-${item.assetId}`"
                  class="trade-card__cell"
                  :style="item.backgroundColor ? { backgroundColor: `#${item.backgroundColor}` } : null"
                  :title="item.name"
                >
                  <img
                    v-if="item.iconUrl"
                    class="trade-card__thumb"
                    :src="item.iconUrl"
                    :alt="item.name"
                    loading="lazy"
                    decoding="async"
                  >
                  <span v-else class="trade-card__thumb-fallback">?</span>
                  <span class="trade-card__cell-name">{{ item.name }}</span>
                  <span v-if="item.game" class="trade-card__cell-game">{{ item.game }}</span>
                  <span v-if="item.amount > 1" class="trade-card__qty">×{{ item.amount }}</span>
                </div>
              </div>
              <p v-else class="trade-card__none">{{ $t('bot-social-trades-no-items') }}</p>
            </section>

            <div class="trade-card__footer">
              <button
                type="button"
                class="trade-card__cancel-link"
                :disabled="mutating"
                :aria-label="cancelAria(offer)"
                @click="askCancel(offer)"
              >
                {{ cancelButtonLabel(offer) }}
              </button>
            </div>
          </article>
        </li>
      </ul>
    </template>

    <CancelDialog
      :open="Boolean(pendingCancel)"
      :partner-name="pendingCancel?.partnerName || ''"
      :trade-offer-id="pendingCancel?.tradeOfferId || ''"
      :direction="pendingCancel?.direction || 'sent'"
      :waiting-for="pendingCancel?.waitingFor || ''"
      :submitting="mutating"
      @cancel="pendingCancel = null"
      @confirm="confirmCancel"
    ></CancelDialog>
  </div>
</template>

<script>
  import { cancelTradeOffer, isPluginMissingError } from '../../api/bot-social';
  import { invalidateTradeOffers, loadTradeOffers } from '../../cache/bot-social-queries';
  import { resolveLocalData } from '../../cache/load-policy';
  import CancelDialog from './cancel-dialog.vue';

  export default {
    name: 'BotSocialTradeOffersPanel',
    components: { CancelDialog },
    props: {
      botName: { type: String, required: true },
    },
    data() {
      return {
        loading: false,
        refreshing: false,
        mutating: false,
        error: '',
        offers: [],
        brokenAvatars: {},
        pendingCancel: null,
        loadToken: 0,
      };
    },
    watch: {
      botName: {
        immediate: true,
        handler() {
          this.brokenAvatars = {};
          this.error = '';
          this.pendingCancel = null;
          this.bootstrap();
        },
      },
    },
    methods: {
      bootstrap() {
        const resolved = resolveLocalData({
          resource: 'trades',
          botName: this.botName,
          isUsable: data => Array.isArray(data?.offers),
        });
        if (resolved.hasData) {
          this.offers = resolved.data.offers;
          this.$emit('loaded', { total: resolved.data.total ?? this.offers.length });
          return;
        }
        this.load(false);
      },
      async load(force) {
        const token = ++this.loadToken;
        const hasData = this.offers.length > 0;
        this.loading = !hasData;
        this.refreshing = Boolean(force && hasData);
        if (force) this.error = '';
        try {
          const result = await loadTradeOffers(this.botName, { force: Boolean(force) });
          if (token !== this.loadToken) return;
          this.offers = result.data?.offers || [];
          if (result.rateLimited) this.$error(this.$t('bot-social-rate-limited'));
          else if (result.error && result.stale) this.error = result.error.message || String(result.error);
          else this.error = '';
          this.$emit('loaded', { total: result.data?.total ?? this.offers.length });
        } catch (err) {
          if (token !== this.loadToken) return;
          if (isPluginMissingError(err)) {
            this.$emit('plugin-missing');
            return;
          }
          if (err?.code === 'RATE_LIMITED') this.$error(this.$t('bot-social-rate-limited'));
          else if (!hasData) {
            this.error = err.message || String(err);
            this.offers = [];
          } else this.error = err.message || String(err);
        } finally {
          if (token === this.loadToken) {
            this.loading = false;
            this.refreshing = false;
          }
        }
      },
      refresh() {
        if (this.loading || this.refreshing || this.mutating) return;
        this.load(true);
      },
      profileUrl(steamId) {
        return `https://steamcommunity.com/profiles/${encodeURIComponent(steamId)}`;
      },
      initials(name) {
        return String(name || '?').trim().slice(0, 1).toUpperCase();
      },
      onAvatarError(steamId) {
        this.$set(this.brokenAvatars, steamId, true);
      },
      headline(offer) {
        if (offer.direction === 'sent') {
          return this.$t('bot-social-trades-headline-sent', { name: offer.partnerName });
        }
        return this.$t('bot-social-trades-headline-received', { name: offer.partnerName });
      },
      waitingLabel(offer) {
        if (offer.waitingFor === 'needs_confirmation') {
          return this.$t('bot-social-trades-waiting-confirm');
        }
        if (offer.waitingFor === 'waiting_bot') {
          return this.$t('bot-social-trades-waiting-bot');
        }
        return this.$t('bot-social-trades-waiting-partner');
      },
      receiveTitle(offer) {
        return this.$t('bot-social-trades-they-offer', { name: offer.partnerName });
      },
      giveTitle() {
        return this.$t('bot-social-trades-you-give');
      },
      cancelButtonLabel(offer) {
        return offer.direction === 'received'
          ? this.$t('bot-social-trades-decline')
          : this.$t('bot-social-trades-cancel');
      },
      cancelAria(offer) {
        return offer.direction === 'received'
          ? this.$t('bot-social-trades-decline-aria', { name: offer.partnerName })
          : this.$t('bot-social-trades-cancel-aria', { name: offer.partnerName });
      },
      askCancel(offer) {
        if (this.mutating) return;
        this.pendingCancel = offer;
      },
      async confirmCancel() {
        const offer = this.pendingCancel;
        if (!offer || this.mutating) return;
        this.mutating = true;
        try {
          const result = await cancelTradeOffer(this.botName, {
            tradeOfferId: offer.tradeOfferId,
            direction: offer.direction,
          });
          const payload = result?.[this.botName] ?? result;
          if (!payload?.Ok) {
            this.$error(payload?.Message || this.$t('bot-social-trades-cancel-failed'));
            return;
          }
          this.$success(
            offer.direction === 'received'
              ? this.$t('bot-social-trades-decline-success')
              : this.$t('bot-social-trades-cancel-success'),
          );
          this.pendingCancel = null;
          invalidateTradeOffers(this.botName);
          await this.load(true);
        } catch (err) {
          if (isPluginMissingError(err)) this.$emit('plugin-missing');
          else if (err?.result?.status === 429 || err?.code === 'RATE_LIMITED') {
            this.$error(this.$t('bot-social-rate-limited'));
          } else this.$error(err.message || this.$t('bot-social-trades-cancel-failed'));
        } finally {
          this.mutating = false;
        }
      },
    },
  };
</script>
