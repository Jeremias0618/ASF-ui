<template>
  <section class="bot-social-games__chrome games-wishlist" :aria-label="$t('bot-social-games-wishlist-title')">
    <header class="games-wishlist__header">
      <p class="games-wishlist__eyebrow">{{ $t('bot-social-games-view-wishlist') }}</p>
      <h3 class="games-wishlist__title">{{ $t('bot-social-games-wishlist-title') }}</h3>
      <p class="games-wishlist__lead">{{ $t('bot-social-games-wishlist-lead') }}</p>
    </header>

    <form class="games-wishlist__form" @submit.prevent="onSubmit">
      <label class="games-wishlist__label" for="games-wishlist-url">
        {{ $t('bot-social-games-wishlist-url-label') }}
      </label>
      <div class="games-wishlist__combo">
        <input
          id="games-wishlist-url"
          v-model.trim="storeUrl"
          class="games-wishlist__input"
          type="text"
          :placeholder="$t('bot-social-games-wishlist-placeholder')"
          :disabled="submitLocked"
          autocomplete="off"
          spellcheck="false"
        >
        <button
          type="submit"
          class="games-wishlist__submit"
          :disabled="!canSubmit || submitLocked"
        >
          <FontAwesomeIcon v-if="mutating" icon="spinner" spin aria-hidden="true"></FontAwesomeIcon>
          <span v-else-if="cooldownSeconds > 0">
            {{ $t('bot-social-community-submit-cooldown', { s: cooldownSeconds }) }}
          </span>
          <span v-else>{{ $t('bot-social-games-wishlist-submit') }}</span>
        </button>
      </div>
    </form>

    <div class="games-wishlist__help" :aria-label="$t('bot-social-games-wishlist-formats')">
      <p class="games-wishlist__help-title">{{ $t('bot-social-games-wishlist-formats') }}</p>
      <ul class="games-wishlist__examples">
        <li><code>{{ $t('bot-social-games-wishlist-example-url') }}</code></li>
        <li><code>{{ $t('bot-social-games-wishlist-example-id') }}</code></li>
      </ul>
    </div>
  </section>
</template>

<script>
  import { followAndWishlist, isPluginMissingError } from '../../api/bot-social';
  import { invalidateWishlist } from '../../cache/bot-social-queries';
  import { createSubmitCooldownMixin } from '../../mixins/submit-cooldown';
  import { firstMutationResult, mutationSucceeded } from '../../utils/mutation-result';
  import { parseGameAppId } from '../../utils/game-target';

  /** UI ≥ WishlistWriteLimiter (3s). */
  const SUBMIT_COOLDOWN_MS = 5000;

  export default {
    name: 'BotSocialGamesWishlistPanel',
    mixins: [createSubmitCooldownMixin(SUBMIT_COOLDOWN_MS)],
    props: {
      botName: { type: String, required: true },
    },
    data() {
      return {
        storeUrl: '',
        mutating: false,
      };
    },
    computed: {
      canSubmit() {
        return !!parseGameAppId(this.storeUrl);
      },
    },
    watch: {
      botName() {
        this.storeUrl = '';
        this.mutating = false;
        this.resetSubmitCooldown();
      },
    },
    methods: {
      async onSubmit() {
        if (this.submitLocked || !this.canSubmit) return;
        const appId = parseGameAppId(this.storeUrl);
        if (!appId) {
          this.$error(this.$t('bot-social-games-wishlist-invalid'));
          return;
        }
        this.mutating = true;
        try {
          const payload = await followAndWishlist(this.botName, this.storeUrl.trim());
          const first = firstMutationResult(payload, this.botName);
          if (!mutationSucceeded(first)) {
            const detail = first?.Message || first?.message || this.$t('bot-social-games-wishlist-failed');
            this.$error(detail);
            return;
          }
          const detail = first?.Message || first?.message || '';
          this.$success(this.$t('bot-social-games-wishlist-success', {
            appId,
            detail: detail || this.$t('bot-social-games-wishlist-success-ok'),
          }));
          this.storeUrl = '';
          invalidateWishlist(this.botName);
        } catch (err) {
          if (isPluginMissingError(err)) this.$emit('plugin-missing');
          else this.$error(err.message || String(err));
        } finally {
          this.mutating = false;
          this.armSubmitCooldown();
        }
      },
    },
  };
</script>
