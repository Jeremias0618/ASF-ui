<template>
  <a
    class="bot-social-games__tile"
    :class="`bot-social-games__tile--${variant}`"
    :href="storeUrl"
    target="_blank"
    rel="noreferrer noopener"
    :aria-label="ariaLabel"
  >
    <div class="bot-social-games__cover" :class="{ 'is-fallback': !currentSrc }">
      <img
        v-if="currentSrc"
        class="bot-social-games__img"
        :src="currentSrc"
        :alt="''"
        loading="lazy"
        decoding="async"
        @error="onCoverError"
      >
      <span v-else class="bot-social-games__placeholder" aria-hidden="true">
        {{ placeholderLabel }}
      </span>
      <span
        v-if="game.isShared && !game.isOwned"
        class="bot-social-games__badge bot-social-games__badge--shared"
      >{{ $t('bot-social-games-badge-shared') }}</span>
    </div>
    <div class="bot-social-games__meta">
      <span class="bot-social-games__name" :title="game.name">{{ game.name }}</span>
    </div>
  </a>
</template>

<script>
  import {
    gameBannerCandidates, gameCoverCandidates, steamStoreUrl,
  } from '../../utils/game-cover';

  export default {
    name: 'BotSocialGameCoverTile',
    props: {
      game: {
        type: Object,
        required: true,
      },
      variant: {
        type: String,
        default: 'library',
        validator: value => value === 'library' || value === 'banner',
      },
    },
    data() {
      return {
        coverIndex: 0,
        exhausted: false,
      };
    },
    computed: {
      candidates() {
        return this.variant === 'banner'
          ? gameBannerCandidates(this.game.appId)
          : gameCoverCandidates(this.game.appId);
      },
      currentSrc() {
        if (this.exhausted) return '';
        return this.candidates[this.coverIndex] || '';
      },
      storeUrl() {
        return steamStoreUrl(this.game.appId);
      },
      ariaLabel() {
        return this.$t('bot-social-games-open-store', { name: this.game.name || this.game.appId });
      },
      placeholderLabel() {
        const name = String(this.game.name || '').trim();
        if (name.length >= 2) return name.slice(0, 2).toUpperCase();
        return String(this.game.appId || '?').slice(-2);
      },
    },
    watch: {
      'game.appId'() {
        this.resetCover();
      },
      variant() {
        this.resetCover();
      },
    },
    methods: {
      resetCover() {
        this.coverIndex = 0;
        this.exhausted = false;
      },
      onCoverError() {
        const next = this.coverIndex + 1;
        if (next < this.candidates.length) {
          this.coverIndex = next;
          return;
        }
        this.exhausted = true;
      },
    },
  };
</script>
