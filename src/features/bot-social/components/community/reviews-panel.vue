<template>
  <section class="friends-hub__compose" :aria-label="$t('bot-social-community-reviews-title')">
    <div class="friends-hub__compose-panel">
      <header class="friends-hub__compose-header">
        <p class="friends-hub__compose-eyebrow">{{ $t('bot-social-community-mode-reviews') }}</p>
        <h3 class="friends-hub__compose-title">{{ $t('bot-social-community-reviews-title') }}</h3>
        <p class="friends-hub__compose-lead">{{ $t('bot-social-community-reviews-lead') }}</p>
      </header>

      <form class="friends-hub__compose-form" @submit.prevent="onSubmit">
        <label class="friends-hub__field-label" for="community-review-url">
          {{ $t('bot-social-community-reviews-url-label') }}
        </label>
        <div class="friends-hub__compose-combo">
          <input
            id="community-review-url"
            v-model.trim="reviewUrl"
            class="friends-hub__compose-input"
            type="text"
            :placeholder="$t('bot-social-community-reviews-placeholder')"
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
            <span v-else>{{ $t('bot-social-community-reviews-submit') }}</span>
          </button>
        </div>

        <p class="friends-hub__field-label" id="community-review-vote-label">
          {{ $t('bot-social-community-reviews-vote-label') }}
        </p>
        <div
          class="community-hub__vote-bar"
          role="radiogroup"
          aria-labelledby="community-review-vote-label"
        >
          <label
            v-for="opt in voteOptions"
            :key="opt.value"
            class="community-hub__vote-chip"
            :class="{ 'is-active': vote === opt.value }"
          >
            <input
              v-model="vote"
              type="radio"
              name="community-review-vote"
              :value="opt.value"
              :disabled="mutating"
            >
            <span>{{ opt.label }}</span>
          </label>
        </div>
      </form>

      <div class="friends-hub__compose-help" :aria-label="$t('bot-social-community-reviews-formats')">
        <p class="friends-hub__compose-help-title">{{ $t('bot-social-community-reviews-formats') }}</p>
        <ul class="friends-hub__compose-examples">
          <li><code>{{ $t('bot-social-community-reviews-example') }}</code></li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>
  import { isPluginMissingError, voteReview } from '../../api/bot-social';
  import { isLikelyReviewUrl } from '../../utils/review-target';

  export default {
    name: 'BotSocialCommunityReviewsPanel',
    props: {
      botName: { type: String, required: true },
    },
    data() {
      return {
        reviewUrl: '',
        vote: 'yes',
        mutating: false,
      };
    },
    computed: {
      voteOptions() {
        return [
          { value: 'yes', label: this.$t('bot-social-community-reviews-vote-yes') },
          { value: 'no', label: this.$t('bot-social-community-reviews-vote-no') },
          { value: 'funny', label: this.$t('bot-social-community-reviews-vote-funny') },
        ];
      },
      canSubmit() {
        return isLikelyReviewUrl(this.reviewUrl) && !!this.vote;
      },
    },
    watch: {
      botName() {
        this.reviewUrl = '';
        this.vote = 'yes';
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
        if (!isLikelyReviewUrl(this.reviewUrl)) {
          this.$error(this.$t('bot-social-community-reviews-invalid'));
          return;
        }
        this.mutating = true;
        try {
          const payload = await voteReview(this.botName, {
            url: this.reviewUrl.trim(),
            vote: this.vote,
          });
          const first = this.firstMutationResult(payload);
          if (!this.mutationSucceeded(first)) {
            const detail = first?.Message || first?.message || this.$t('bot-social-community-reviews-failed');
            this.$error(detail);
            return;
          }
          this.$success(this.$t('bot-social-community-reviews-success'));
          this.reviewUrl = '';
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
