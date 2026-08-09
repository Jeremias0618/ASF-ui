<template>
  <div
    class="game-cover-img"
    :class="[
      `game-cover-img--${variant}`,
      { 'is-fallback': !currentSrc, 'is-loading': !!currentSrc && !loaded }
    ]"
  >
    <img
      v-if="currentSrc"
      class="game-cover-img__media"
      :src="currentSrc"
      :alt="alt"
      :loading="loading"
      decoding="async"
      draggable="false"
      @load="loaded = true"
      @error="onError"
    >
    <span v-else class="game-cover-img__placeholder" aria-hidden="true">{{ placeholder }}</span>
  </div>
</template>

<script>
  import {
    gameBannerCandidates, gameCoverCandidates, gamePlaceholderLabel,
  } from '../../utils/game-cover';

  export default {
    name: 'BotSocialGameCoverImage',
    props: {
      appId: { type: [Number, String], required: true },
      name: { type: String, default: '' },
      variant: {
        type: String,
        default: 'banner',
        validator: value => value === 'library' || value === 'banner',
      },
      alt: { type: String, default: '' },
      loading: { type: String, default: 'lazy' },
    },
    data() {
      return {
        coverIndex: 0,
        exhausted: false,
        loaded: false,
      };
    },
    computed: {
      candidates() {
        return this.variant === 'library'
          ? gameCoverCandidates(this.appId)
          : gameBannerCandidates(this.appId);
      },
      currentSrc() {
        if (this.exhausted) return '';
        return this.candidates[this.coverIndex] || '';
      },
      placeholder() {
        return gamePlaceholderLabel({ name: this.name, appId: this.appId });
      },
    },
    watch: {
      appId() {
        this.reset();
      },
      variant() {
        this.reset();
      },
    },
    methods: {
      reset() {
        this.coverIndex = 0;
        this.exhausted = false;
        this.loaded = false;
      },
      onError() {
        const next = this.coverIndex + 1;
        if (next < this.candidates.length) {
          this.coverIndex = next;
          this.loaded = false;
          return;
        }
        this.exhausted = true;
        this.loaded = false;
      },
    },
  };
</script>
