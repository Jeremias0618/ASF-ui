<template>
  <section class="own-reviews__panel" :aria-label="$t('bot-social-reviews-tab-published')">
    <!-- Detail -->
    <article v-if="openApp" class="own-reviews__detail">
      <button type="button" class="own-reviews__back" @click="closeDetail">
        <FontAwesomeIcon icon="chevron-left" aria-hidden="true"></FontAwesomeIcon>
        {{ $t('bot-social-reviews-back') }}
      </button>

      <header class="own-reviews__detail-head">
        <GameCoverImage
          class="own-reviews__cover own-reviews__cover--detail"
          :appId="openApp.appId"
          :name="titleOf(openApp)"
          :src="openApp.coverUrl"
          :alt="titleOf(openApp)"
          variant="banner"
        ></GameCoverImage>
        <div class="own-reviews__detail-title">
          <h3 class="own-reviews__title">{{ detailTitle }}</h3>
          <p class="own-reviews__meta">
            <span
              class="own-reviews__badge"
              :class="recommendClass(currentRecommended)"
              :title="$t('bot-social-reviews-recommend-tooltip')"
            >
              <FontAwesomeIcon
                :icon="currentRecommended === false ? 'thumbs-down' : 'thumbs-up'"
                aria-hidden="true"
              ></FontAwesomeIcon>
              {{ reviewRecommendLabel(currentRecommended) }}
            </span>
            <span v-if="dateText">{{ dateText }}</span>
            <span v-if="playtimeText">{{ playtimeText }}</span>
          </p>
        </div>
      </header>

      <div v-if="detailState === 'loading'" class="bot-social__state">
        <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
        <span>{{ $t('bot-social-loading') }}</span>
      </div>

      <div v-else-if="detailState === 'error'" class="bot-social__state bot-social__state--error">
        <span>{{ detailError }}</span>
        <button type="button" class="own-reviews__link-btn" @click="loadDetail(openApp.appId, true)">
          {{ $t('bot-social-reviews-retry') }}
        </button>
      </div>

      <template v-else-if="detail">
        <p class="own-reviews__text">{{ detail.text }}</p>

        <section class="own-reviews__reactions" :aria-label="$t('bot-social-reviews-reactions')">
          <h4 class="own-reviews__section-title">{{ $t('bot-social-reviews-reactions') }}</h4>
          <ul class="own-reviews__chips">
            <li v-for="row in counters" :key="row.key" class="own-reviews__chip">
              <FontAwesomeIcon :icon="row.icon" aria-hidden="true"></FontAwesomeIcon>
              {{ row.label }}: <strong>{{ row.value }}</strong>
            </li>
            <li v-for="award in awards" :key="`award-${award.id}-${award.name}`" class="own-reviews__chip own-reviews__chip--award">
              <img v-if="award.iconUrl" :src="award.iconUrl" alt="" class="own-reviews__award-icon" loading="lazy">
              <FontAwesomeIcon v-else icon="award" aria-hidden="true"></FontAwesomeIcon>
              {{ award.name }}<template v-if="award.count != null"> × <strong>{{ award.count }}</strong></template>
            </li>
          </ul>
          <p class="own-reviews__note">{{ $t('bot-social-reviews-reactions-note') }}</p>
        </section>
      </template>

      <footer class="own-reviews__actions">
        <button
          v-if="canEdit"
          type="button"
          class="own-reviews__action own-reviews__action--primary"
          :title="$t('bot-social-reviews-edit-tooltip')"
          @click="$emit('edit', openApp.appId)"
        >
          <FontAwesomeIcon icon="pen-square" aria-hidden="true"></FontAwesomeIcon>
          {{ $t('bot-social-reviews-edit') }}
        </button>
        <a
          class="own-reviews__action"
          :href="steamUrl"
          target="_blank"
          rel="noreferrer noopener"
        >
          <FontAwesomeIcon icon="external-link-alt" aria-hidden="true"></FontAwesomeIcon>
          {{ $t('bot-social-reviews-view-steam') }}
        </a>
        <a
          v-if="!canEdit"
          class="own-reviews__action own-reviews__action--primary"
          :href="steamUrl"
          target="_blank"
          rel="noreferrer noopener"
          :title="$t('bot-social-reviews-manage-tooltip')"
        >
          <FontAwesomeIcon icon="pen-square" aria-hidden="true"></FontAwesomeIcon>
          {{ $t('bot-social-reviews-manage-steam') }}
        </a>
      </footer>
      <p v-if="!canEdit" class="own-reviews__note">{{ $t('bot-social-reviews-manage-note') }}</p>
    </article>

    <!-- List -->
    <template v-else>
      <div class="own-reviews__toolbar">
        <label class="bot-social-games__searchbox">
          <FontAwesomeIcon class="bot-social-games__search-icon" icon="search" aria-hidden="true"></FontAwesomeIcon>
          <input
            v-model.trim="queryModel"
            class="bot-social-games__search-input"
            type="search"
            :placeholder="$t('bot-social-reviews-search')"
            :aria-label="$t('bot-social-reviews-search')"
          >
        </label>
        <p v-if="session.status === 'ready' && rangeLabel" class="own-reviews__count">{{ rangeLabel }}</p>
      </div>

      <div v-if="session.status === 'loading' || session.status === 'idle'" class="own-reviews__skeleton" aria-busy="true">
        <div v-for="n in 4" :key="n" class="own-reviews__skel-row"></div>
      </div>

      <div v-else-if="session.status === 'error' && !session.items.length" class="bot-social__state bot-social__state--error">
        <span>{{ reviewsErrorText(session.errorCode, session.error) }}</span>
        <button type="button" class="own-reviews__link-btn" @click="$emit('refresh')">
          {{ $t('bot-social-reviews-retry') }}
        </button>
      </div>

      <template v-else>
        <p v-if="searching && session.loadingAll" class="own-reviews__progress" role="status">
          <FontAwesomeIcon icon="spinner" spin aria-hidden="true"></FontAwesomeIcon>
          {{ $t('bot-social-reviews-searching', { n: session.items.length, total: session.total == null ? '?' : session.total }) }}
        </p>
        <p v-else-if="searching && session.allError" class="bot-social__inline-error">
          {{ $t('bot-social-reviews-search-error') }}
          <button type="button" class="own-reviews__link-btn" @click="retryAll">
            {{ $t('bot-social-reviews-retry') }}
          </button>
        </p>

        <div v-if="!session.items.length" class="bot-social__state">
          {{ session.emptyUnconfirmed ? $t('bot-social-reviews-empty-unconfirmed') : $t('bot-social-reviews-empty') }}
        </div>

        <div v-else-if="pageItems === null && pageFailed" class="bot-social__state bot-social__state--error">
          <span>{{ reviewsErrorText(session.pageErrorCode, session.pageError) }}</span>
          <button type="button" class="own-reviews__link-btn" @click="retryPage">
            {{ $t('bot-social-reviews-retry') }}
          </button>
        </div>

        <div v-else-if="pageItems === null" class="own-reviews__skeleton" aria-busy="true">
          <div v-for="n in 4" :key="n" class="own-reviews__skel-row"></div>
        </div>

        <div v-else-if="!pageItems.length" class="bot-social__state">{{ $t('bot-social-games-empty') }}</div>

        <ul v-else class="own-reviews__list">
          <li v-for="item in pageItems" :key="item.appId">
            <button type="button" class="own-reviews__row" @click="openDetail(item)">
              <GameCoverImage
                class="own-reviews__cover"
                :appId="item.appId"
                :name="titleOf(item)"
                :src="item.coverUrl"
                :alt="titleOf(item)"
                variant="banner"
              ></GameCoverImage>
              <span class="own-reviews__row-body">
                <span class="own-reviews__row-head">
                  <span class="own-reviews__title">{{ titleOf(item) }}</span>
                  <span
                    class="own-reviews__badge"
                    :class="recommendClass(item.recommended)"
                    :title="$t('bot-social-reviews-recommend-tooltip')"
                  >
                    <FontAwesomeIcon
                      :icon="item.recommended === false ? 'thumbs-down' : 'thumbs-up'"
                      aria-hidden="true"
                    ></FontAwesomeIcon>
                    {{ reviewRecommendLabel(item.recommended) }}
                  </span>
                </span>
                <span v-if="reviewDateLabel(item)" class="own-reviews__date">{{ reviewDateLabel(item) }}</span>
                <span class="own-reviews__excerpt">{{ item.excerpt || $t('bot-social-reviews-no-text') }}</span>
                <span v-if="reviewCounters(item).length || item.awards.length" class="own-reviews__row-stats">
                  <span v-for="row in reviewCounters(item)" :key="row.key">
                    <FontAwesomeIcon :icon="row.icon" aria-hidden="true"></FontAwesomeIcon>
                    {{ row.label }} {{ row.value }}
                  </span>
                  <span v-if="item.awards.length">
                    <FontAwesomeIcon icon="award" aria-hidden="true"></FontAwesomeIcon>
                    {{ $t('bot-social-reviews-awards-count', { n: item.awards.length }) }}
                  </span>
                </span>
              </span>
            </button>
          </li>
        </ul>

        <Pager
          :page="page"
          :lastPage="lastPage"
          :disabled="pageBusy"
          @change="goTo"
        ></Pager>
      </template>
    </template>
  </section>
</template>

<script>
  import { isPluginMissingError } from '../../api/bot-social';
  import {
    OWN_REVIEWS_PAGE_SIZE,
    loadOwnReviewDetail,
    loadOwnReviewsAll,
    loadOwnReviewsPage,
    ownReviewsErrorCode,
    ownReviewsLastPage,
  } from '../../cache/own-reviews-session';
  import ownReviewsText from '../../mixins/own-reviews-text';
  import GameCoverImage from '../games/cover-image.vue';
  import Pager from './pager.vue';

  const SEARCH_DEBOUNCE_MS = 300;

  export default {
    name: 'BotSocialOwnReviewsPublished',
    components: { GameCoverImage, Pager },
    mixins: [ownReviewsText],
    props: {
      botName: { type: String, required: true },
      session: { type: Object, required: true },
      nameByAppId: { type: Object, default: () => ({}) },
      /** 1-based page of the list (of the search results while searching). Owned by the parent. */
      page: { type: Number, default: 1 },
      query: { type: String, default: '' },
      /** AppID of the review whose detail is open (null = list). */
      openAppId: { type: Number, default: null },
      canEdit: { type: Boolean, default: false },
    },
    data() {
      return {
        detail: null,
        detailState: 'idle', // idle | loading | ready | error
        detailError: '',
        searchTimer: 0,
      };
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
      searching() {
        return this.query !== '';
      },
      matches() {
        const q = this.query.toLowerCase();
        if (!q) return [];
        return this.session.items.filter(item => (
          this.titleOf(item).toLowerCase().includes(q)
          || item.excerpt.toLowerCase().includes(q)
          || String(item.appId).includes(q)
        ));
      },
      /** Reviews of the visible page; null while that page has not been read yet. */
      pageItems() {
        if (this.searching) {
          const from = (this.page - 1) * OWN_REVIEWS_PAGE_SIZE;
          return this.matches.slice(from, from + OWN_REVIEWS_PAGE_SIZE);
        }
        return this.session.pages[this.page] || null;
      },
      pageFailed() {
        return Boolean(this.session.pageError) && this.session.pageLoading === 0;
      },
      pageBusy() {
        return this.session.pageLoading !== 0;
      },
      lastPage() {
        if (this.searching) return Math.max(1, Math.ceil(this.matches.length / OWN_REVIEWS_PAGE_SIZE));
        return ownReviewsLastPage(this.session);
      },
      rangeLabel() {
        const list = this.pageItems;
        if (this.searching) {
          const total = this.matches.length;
          if (!total) return '';
          const from = (this.page - 1) * OWN_REVIEWS_PAGE_SIZE + 1;
          return this.$t('bot-social-reviews-showing', { from, to: from + list.length - 1, total });
        }
        if (!list || !list.length) return '';
        const from = (this.page - 1) * OWN_REVIEWS_PAGE_SIZE + 1;
        const to = from + list.length - 1;
        if (this.session.total != null) {
          return this.$t('bot-social-reviews-showing', { from, to, total: this.session.total });
        }
        // Steam did not state the total: all we know is whether another page exists.
        return this.session.meta[this.page]?.hasMore
          ? this.$t('bot-social-reviews-showing-more', { from, to })
          : this.$t('bot-social-reviews-showing-range', { from, to });
      },
      openApp() {
        if (this.openAppId == null) return null;
        const known = this.session.items.find(item => item.appId === this.openAppId);
        if (known) return known;
        // The list was refreshed (or not read up to there yet): the detail still works from the AppID.
        return {
          appId: this.openAppId,
          url: '',
          coverUrl: '',
          recommended: null,
          postedDate: null,
          postedText: null,
          playtimeText: null,
          awards: [],
        };
      },
      currentRecommended() {
        if (this.detail && this.detail.recommended != null) return this.detail.recommended;
        return this.openApp ? this.openApp.recommended : null;
      },
      steamUrl() {
        return this.detail?.url || this.openApp?.url || '';
      },
      detailTitle() {
        return this.detail?.title || this.titleOf(this.openApp);
      },
      dateText() {
        if (!this.openApp) return '';
        return this.reviewDateLabel(this.openApp) || this.detail?.postedText || '';
      },
      playtimeText() {
        return this.detail?.playtimeText || this.openApp?.playtimeText || '';
      },
      counters() {
        return this.detail ? this.reviewCounters(this.detail) : [];
      },
      awards() {
        if (this.detail?.awards?.length) return this.detail.awards;
        return this.openApp?.awards || [];
      },
    },
    watch: {
      'botName': function botNameChanged() {
        this.detail = null;
        this.detailState = 'idle';
      },
      'openAppId': {
        immediate: true,
        handler(appId) {
          if (appId == null) {
            this.detail = null;
            this.detailState = 'idle';
            return;
          }
          this.loadDetail(appId, false);
        },
      },
      'page': function pageChanged() {
        this.ensure();
      },
      'lastPage': function lastPageChanged(last) {
        // The list got shorter (search narrowed down, refresh): never stay on a page that no longer exists.
        if (this.page > last) this.$emit('update:page', last);
      },
      'query': function queryChanged() {
        window.clearTimeout(this.searchTimer);
        this.searchTimer = window.setTimeout(() => this.ensure(), SEARCH_DEBOUNCE_MS);
      },
      'session.status': function statusChanged(status) {
        if (status === 'ready') this.ensure();
      },
    },
    created() {
      this.ensure();
    },
    beforeDestroy() {
      window.clearTimeout(this.searchTimer);
    },
    methods: {
      /** Reads what the current view needs: the visible page, or the whole list while searching. */
      ensure() {
        if (!this.session.pages[1]) return;
        if (this.searching) {
          loadOwnReviewsAll(this.botName);
          return;
        }
        loadOwnReviewsPage(this.botName, this.page);
      },
      retryPage() {
        loadOwnReviewsPage(this.botName, this.page, { force: true });
      },
      retryAll() {
        loadOwnReviewsAll(this.botName);
      },
      goTo(target) {
        this.$emit('update:page', target);
      },
      titleOf(item) {
        if (!item) return '';
        return this.nameByAppId[item.appId] || this.$t('bot-social-reviews-app-fallback', { id: item.appId });
      },
      recommendClass(recommended) {
        if (recommended === true) return 'own-reviews__badge--yes';
        if (recommended === false) return 'own-reviews__badge--no';
        return '';
      },
      openDetail(item) {
        this.$emit('update:openAppId', item.appId);
      },
      closeDetail() {
        this.$emit('update:openAppId', null);
      },
      async loadDetail(appId, force) {
        const { botName } = this;
        this.detail = null;
        this.detailState = 'loading';
        this.detailError = '';
        try {
          const detail = await loadOwnReviewDetail(botName, appId, { force });
          if (this.openAppId !== appId || botName !== this.botName) return;
          this.detail = detail;
          this.detailState = 'ready';
        } catch (err) {
          if (this.openAppId !== appId || botName !== this.botName) return;
          if (isPluginMissingError(err) && !ownReviewsErrorCode(err)) {
            this.$emit('plugin-missing');
            return;
          }
          this.detailState = 'error';
          this.detailError = this.reviewsErrorFrom(err);
        }
      },
    },
  };
</script>
