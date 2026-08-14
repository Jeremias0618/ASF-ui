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
  import { fetchGameCover } from '../../api/bot-social';
  import { enqueueCoverResolve } from '../../utils/cover-resolve-queue';
  import {
    gameBannerCandidates, gameCoverCandidates, gamePlaceholderLabel,
    peekResolvedCover, rememberResolvedCover,
  } from '../../utils/game-cover';

  export default {
    name: 'BotSocialGameCoverImage',
    props: {
      appId: { type: [Number, String], required: true },
      name: { type: String, default: '' },
      botName: { type: String, default: '' },
      /** Prefer this URL first (e.g. API capsule / header). */
      src: { type: String, default: '' },
      variant: {
        type: String,
        default: 'banner',
        validator: value => value === 'library' || value === 'banner',
      },
      alt: { type: String, default: '' },
      loading: { type: String, default: 'lazy' },
    },
    data() {
      const cached = peekResolvedCover(this.appId, this.variant);
      return {
        coverIndex: 0,
        propSrcFailed: false,
        exhausted: false,
        loaded: false,
        resolvedSrc: cached || '',
        resolvingStore: false,
        storeTried: !!cached,
      };
    },
    computed: {
      candidates() {
        return this.variant === 'library'
          ? gameCoverCandidates(this.appId)
          : gameBannerCandidates(this.appId);
      },
      currentSrc() {
        if (this.resolvedSrc) return this.resolvedSrc;
        if (this.src && !this.propSrcFailed) return this.src;
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
      src() {
        this.propSrcFailed = false;
        this.loaded = false;
      },
    },
    methods: {
      reset() {
        const cached = peekResolvedCover(this.appId, this.variant);
        this.coverIndex = 0;
        this.propSrcFailed = false;
        this.exhausted = false;
        this.loaded = false;
        this.resolvedSrc = cached || '';
        this.resolvingStore = false;
        this.storeTried = !!cached;
      },
      onError() {
        if (this.resolvedSrc) {
          // Store URL itself failed — give up.
          this.resolvedSrc = '';
          this.exhausted = true;
          this.loaded = false;
          return;
        }

        if (this.src && !this.propSrcFailed) {
          this.propSrcFailed = true;
          this.loaded = false;
          if (this.candidates.length) return;
          this.tryResolveStoreCover();
          return;
        }

        const next = this.coverIndex + 1;
        if (next < this.candidates.length) {
          this.coverIndex = next;
          this.loaded = false;
          return;
        }

        this.tryResolveStoreCover();
      },
      async tryResolveStoreCover() {
        if (this.storeTried || this.resolvingStore) {
          this.exhausted = true;
          this.loaded = false;
          return;
        }

        const cached = peekResolvedCover(this.appId, this.variant);
        if (cached) {
          this.resolvedSrc = cached;
          this.storeTried = true;
          this.exhausted = false;
          this.loaded = false;
          return;
        }

        if (!this.botName) {
          this.exhausted = true;
          this.loaded = false;
          return;
        }

        this.resolvingStore = true;
        this.storeTried = true;
        try {
          const payload = await enqueueCoverResolve(
            () => fetchGameCover(this.botName, this.appId),
          );
          const botResult = payload?.[this.botName]
            || payload?.[Object.keys(payload || {}).find(k => k.toLowerCase() === String(this.botName || '').toLowerCase())]
            || payload?.[Object.keys(payload || {})[0]];
          const header = botResult?.HeaderImage || botResult?.headerImage || '';
          const capsule = botResult?.CapsuleImage || botResult?.capsuleImage || '';
          const picked = this.variant === 'library'
            ? (capsule || header)
            : (header || capsule);
          if (picked) {
            rememberResolvedCover(this.appId, { header, capsule });
            this.resolvedSrc = picked;
            this.exhausted = false;
            this.loaded = false;
            return;
          }
        } catch {
          // Fall through to placeholder.
        } finally {
          this.resolvingStore = false;
        }

        this.exhausted = true;
        this.loaded = false;
      },
    },
  };
</script>
