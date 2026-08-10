<template>
  <section class="friends-hub__compose" :aria-label="$t('bot-social-games-wishlist-title')">
    <div class="friends-hub__compose-panel">
      <header class="friends-hub__compose-header">
        <p class="friends-hub__compose-eyebrow">{{ $t('bot-social-games-view-wishlist') }}</p>
        <h3 class="friends-hub__compose-title">{{ $t('bot-social-games-wishlist-title') }}</h3>
        <p class="friends-hub__compose-lead">{{ $t('bot-social-games-wishlist-lead') }}</p>
      </header>

      <form class="friends-hub__compose-form" @submit.prevent="onSubmit">
        <label class="friends-hub__field-label" for="games-wishlist-url">
          {{ $t('bot-social-games-wishlist-url-label') }}
        </label>
        <div class="friends-hub__compose-combo">
          <input
            id="games-wishlist-url"
            v-model.trim="storeUrl"
            class="friends-hub__compose-input"
            type="text"
            :placeholder="$t('bot-social-games-wishlist-placeholder')"
            :disabled="mutating"
            autocomplete="off"
            spellcheck="false"
          >
          <button
            type="submit"
            class="friends-hub__compose-submit"
            :disabled="!canSubmit || mutating"
          >
            <FontAwesomeIcon v-if="mutating" icon="spinner" spin aria-hidden="true"></FontAwesomeIcon>
            <span v-else>{{ $t('bot-social-games-wishlist-submit') }}</span>
          </button>
        </div>
      </form>

      <div class="friends-hub__compose-help" :aria-label="$t('bot-social-games-wishlist-formats')">
        <p class="friends-hub__compose-help-title">{{ $t('bot-social-games-wishlist-formats') }}</p>
        <ul class="friends-hub__compose-examples">
          <li><code>{{ $t('bot-social-games-wishlist-example-url') }}</code></li>
          <li><code>{{ $t('bot-social-games-wishlist-example-id') }}</code></li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>
  import { followAndWishlist, isPluginMissingError } from '../../api/bot-social';
  import { invalidateWishlist } from '../../cache/bot-social-queries';
  import { parseGameAppId } from '../../utils/game-target';

  export default {
    name: 'BotSocialGamesWishlistPanel',
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
      },
    },
    methods: {
      mutationSucceeded(entry) {
        if (!entry || typeof entry !== 'object') return false;
        return (entry.Success ?? entry.success) === true;
      },
      firstMutationResult(payload) {
        if (!payload || typeof payload !== 'object') return null;
        const botResult = payload[this.botName]
          || payload[Object.keys(payload).find(k => k.toLowerCase() === String(this.botName || '').toLowerCase())]
          || payload[Object.keys(payload)[0]];
        if (!botResult) return null;
        if (Array.isArray(botResult)) return botResult[0] || null;
        const list = botResult.Results || botResult.results;
        return Array.isArray(list) ? (list[0] || null) : null;
      },
      async onSubmit() {
        if (this.mutating || !this.canSubmit) return;
        const appId = parseGameAppId(this.storeUrl);
        if (!appId) {
          this.$error(this.$t('bot-social-games-wishlist-invalid'));
          return;
        }
        this.mutating = true;
        try {
          const payload = await followAndWishlist(this.botName, this.storeUrl.trim());
          const first = this.firstMutationResult(payload);
          if (!this.mutationSucceeded(first)) {
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
        }
      },
    },
  };
</script>
