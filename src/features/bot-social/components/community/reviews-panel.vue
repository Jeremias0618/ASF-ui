<template>
  <section class="community-hub__compose" :aria-label="$t('bot-social-community-reviews-title')">
    <div class="community-hub__compose-panel">
      <header class="community-hub__compose-header">
        <p class="community-hub__compose-eyebrow">{{ $t('bot-social-community-mode-reviews') }}</p>
        <h3 class="community-hub__compose-title">{{ $t('bot-social-community-reviews-title') }}</h3>
        <p class="community-hub__compose-lead">{{ $t('bot-social-community-reviews-lead') }}</p>
      </header>

      <form class="community-hub__compose-form" @submit.prevent="onSubmit">
        <label class="community-hub__field-label" for="community-review-url">
          {{ $t('bot-social-community-reviews-url-label') }}
        </label>
        <div class="community-hub__compose-combo">
          <input
            id="community-review-url"
            v-model.trim="reviewUrl"
            class="community-hub__compose-input"
            type="text"
            :placeholder="$t('bot-social-community-reviews-placeholder')"
            :disabled="submitLocked"
            autocomplete="off"
            spellcheck="false"
          >
          <button
            type="submit"
            class="community-hub__compose-submit"
            :disabled="!canSubmit || submitLocked"
          >
            <FontAwesomeIcon v-if="mutating" icon="spinner" spin aria-hidden="true"></FontAwesomeIcon>
            <span v-else-if="cooldownSeconds > 0">
              {{ $t('bot-social-community-submit-cooldown', { s: cooldownSeconds }) }}
            </span>
            <span v-else>{{ $t('bot-social-community-reviews-submit') }}</span>
          </button>
        </div>

        <p class="community-hub__field-label" id="community-review-vote-label">
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
            :class="[
              `community-hub__vote-chip--${opt.tone}`,
              { 'is-active': vote === opt.value },
            ]"
          >
            <input
              v-model="vote"
              type="radio"
              name="community-review-vote"
              :value="opt.value"
              :disabled="submitLocked"
            >
            <FontAwesomeIcon :icon="opt.icon" aria-hidden="true"></FontAwesomeIcon>
            <span>{{ opt.label }}</span>
          </label>
        </div>
      </form>

      <div class="community-hub__compose-help" :aria-label="$t('bot-social-community-reviews-formats')">
        <p class="community-hub__compose-help-title">{{ $t('bot-social-community-reviews-formats') }}</p>
        <ul class="community-hub__compose-examples">
          <li><code>{{ $t('bot-social-community-reviews-example') }}</code></li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>
  import { isPluginMissingError, voteReview } from '../../api/bot-social';
  import { createSubmitCooldownMixin } from '../../mixins/submit-cooldown';
  import { firstMutationResult, mutationSucceeded } from '../../utils/mutation-result';
  import { isLikelyReviewUrl } from '../../utils/review-target';

  /** UI ≥ ReviewsWriteLimiter (3s); multi-hop Steam. */
  const SUBMIT_COOLDOWN_MS = 5500;

  export default {
    name: 'BotSocialCommunityReviewsPanel',
    mixins: [createSubmitCooldownMixin(SUBMIT_COOLDOWN_MS)],
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
          { value: 'yes', tone: 'positive', icon: 'thumbs-up', label: this.$t('bot-social-community-reviews-vote-yes') },
          { value: 'no', tone: 'negative', icon: 'thumbs-down', label: this.$t('bot-social-community-reviews-vote-no') },
          { value: 'funny', tone: 'funny', icon: 'smile', label: this.$t('bot-social-community-reviews-vote-funny') },
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
        this.resetSubmitCooldown();
      },
    },
    methods: {
      async onSubmit() {
        if (this.submitLocked || !this.canSubmit) return;
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
          const first = firstMutationResult(payload, this.botName);
          if (!mutationSucceeded(first)) {
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
          this.armSubmitCooldown();
        }
      },
    },
  };
</script>
