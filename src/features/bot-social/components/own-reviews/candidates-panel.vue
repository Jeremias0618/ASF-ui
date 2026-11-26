<template>
  <section class="own-reviews__panel" :aria-label="$t('bot-social-reviews-tab-candidates')">
    <p class="own-reviews__lead">{{ $t('bot-social-reviews-candidates-lead') }}</p>

    <div class="own-reviews__toolbar">
      <label class="bot-social-games__searchbox">
        <FontAwesomeIcon class="bot-social-games__search-icon" icon="search" aria-hidden="true"></FontAwesomeIcon>
        <input
          v-model.trim="queryModel"
          class="bot-social-games__search-input"
          type="search"
          :placeholder="$t('bot-social-search')"
          :aria-label="$t('bot-social-search')"
        >
      </label>
      <p v-if="rangeLabel" class="own-reviews__count">{{ rangeLabel }}</p>
    </div>

    <p v-if="session.status === 'error' && !session.complete" class="bot-social__inline-error">
      {{ reviewsErrorText(session.errorCode, session.error) }}
    </p>
    <p v-else-if="session.loadingAll || session.status === 'loading'" class="own-reviews__notice" role="status">
      <FontAwesomeIcon icon="spinner" spin aria-hidden="true"></FontAwesomeIcon>
      {{ $t('bot-social-reviews-candidates-incomplete', { n: session.items.length, total: session.total == null ? '?' : session.total }) }}
    </p>
    <p v-else-if="session.allError" class="bot-social__inline-error">
      {{ $t('bot-social-reviews-more-error') }}
      <button type="button" class="own-reviews__link-btn" @click="$emit('retry-all')">
        {{ $t('bot-social-reviews-retry') }}
      </button>
    </p>
    <p v-else-if="session.emptyUnconfirmed" class="own-reviews__notice" role="status">
      {{ $t('bot-social-reviews-empty-unconfirmed') }}
    </p>

    <div v-if="library.status === 'loading' || library.status === 'idle'" class="bot-social__state">
      <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
      <span>{{ $t('bot-social-loading') }}</span>
    </div>

    <div v-else-if="library.status === 'error'" class="bot-social__state bot-social__state--error">
      <span>{{ library.error }}</span>
      <button type="button" class="own-reviews__link-btn" @click="$emit('reload-library')">
        {{ $t('bot-social-reviews-retry') }}
      </button>
    </div>

    <div v-else-if="!candidates.length" class="bot-social__state">{{ $t('bot-social-reviews-candidates-empty') }}</div>
    <div v-else-if="!filtered.length" class="bot-social__state">{{ $t('bot-social-games-empty') }}</div>

    <template v-else>
      <ul class="own-reviews__list">
        <li v-for="game in visible" :key="game.appId" class="own-reviews__row own-reviews__row--static">
          <GameCoverImage
            class="own-reviews__cover"
            :appId="game.appId"
            :name="game.name"
            :botName="botName"
            :alt="game.name"
            variant="banner"
          ></GameCoverImage>
          <span class="own-reviews__row-body">
            <span class="own-reviews__row-head">
              <span class="own-reviews__title">{{ game.name }}</span>
              <span class="own-reviews__badge" :title="$t('bot-social-reviews-candidate-tooltip')">
                {{ $t('bot-social-reviews-candidate') }}
              </span>
            </span>
            <span class="own-reviews__date">AppID {{ game.appId }}</span>
          </span>
          <button
            v-if="canPublish"
            type="button"
            class="own-reviews__action own-reviews__action--primary"
            :title="$t('bot-social-reviews-write-editor-tooltip')"
            @click="$emit('write', game)"
          >
            <FontAwesomeIcon icon="pen-square" aria-hidden="true"></FontAwesomeIcon>
            {{ $t('bot-social-reviews-write') }}
          </button>
          <a
            v-else
            class="own-reviews__action own-reviews__action--primary"
            :href="steamStoreUrl(game.appId)"
            target="_blank"
            rel="noreferrer noopener"
            :title="$t('bot-social-reviews-write-tooltip')"
          >
            <FontAwesomeIcon icon="pen-square" aria-hidden="true"></FontAwesomeIcon>
            {{ $t('bot-social-reviews-write') }}
          </a>
        </li>
      </ul>

      <Pager :page="page" :lastPage="lastPage" @change="goTo"></Pager>
    </template>
  </section>
</template>

<script>
  import { OWN_REVIEWS_PAGE_SIZE, loadOwnReviewsAll } from '../../cache/own-reviews-session';
  import ownReviewsText from '../../mixins/own-reviews-text';
  import GameCoverImage from '../games/cover-image.vue';
  import Pager from './pager.vue';

  export default {
    name: 'BotSocialOwnReviewsCandidates',
    components: { GameCoverImage, Pager },
    mixins: [ownReviewsText],
    props: {
      botName: { type: String, required: true },
      session: { type: Object, required: true },
      library: { type: Object, required: true },
      /** 1-based page of the (filtered) candidates. Owned by the parent. */
      page: { type: Number, default: 1 },
      query: { type: String, default: '' },
      canPublish: { type: Boolean, default: false },
    },
    computed: {
      queryModel: {
        get() {
          return this.query;
        },
        set(value) {
          this.$emit('update:query', value);
          this.$emit('update:page', 1);
        },
      },
      reviewedIds() {
        const ids = new Set(this.session.items.map(item => item.appId));
        Object.keys(this.session.extraReviewed).forEach(id => ids.add(Number(id)));
        return ids;
      },
      /**
       * Library products the account owns and has no known review for.
       * These are only candidates: Steam decides eligibility when a review is actually published.
       * While the author's list is still being read, already-reviewed games may still appear.
       */
      candidates() {
        return this.library.games.filter(game => (
          game.isOwned !== false
          && game.appType === 'game'
          && !this.reviewedIds.has(Number(game.appId))
        ));
      },
      /** The whole library is filtered before it is paginated. */
      filtered() {
        const q = this.query.toLowerCase();
        if (!q) return this.candidates;
        return this.candidates.filter(game => (
          game.name.toLowerCase().includes(q) || String(game.appId).includes(q)
        ));
      },
      lastPage() {
        return Math.max(1, Math.ceil(this.filtered.length / OWN_REVIEWS_PAGE_SIZE));
      },
      visible() {
        const from = (this.page - 1) * OWN_REVIEWS_PAGE_SIZE;
        return this.filtered.slice(from, from + OWN_REVIEWS_PAGE_SIZE);
      },
      rangeLabel() {
        if (!this.visible.length) return '';
        const from = (this.page - 1) * OWN_REVIEWS_PAGE_SIZE + 1;
        return this.$t('bot-social-reviews-showing', {
          from,
          to: from + this.visible.length - 1,
          total: this.filtered.length,
        });
      },
    },
    watch: {
      'lastPage': function lastPageChanged(last) {
        if (this.page > last) this.$emit('update:page', last);
      },
      'session.status': function statusChanged(status) {
        if (status === 'ready') this.ensureAll();
      },
    },
    created() {
      this.ensureAll();
    },
    methods: {
      /** Knowing which games already have a review needs the whole list of published reviews. */
      ensureAll() {
        if (this.session.pages[1]) loadOwnReviewsAll(this.botName);
      },
      goTo(target) {
        this.$emit('update:page', target);
      },
    },
  };
</script>
