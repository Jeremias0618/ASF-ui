<template>
  <section class="community-hub__compose" :aria-label="$t('bot-social-community-followers-title')">
    <div class="community-hub__compose-panel">
      <header class="community-hub__compose-header">
        <p class="community-hub__compose-eyebrow">{{ $t('bot-social-community-mode-followers') }}</p>
        <h3 class="community-hub__compose-title">{{ $t('bot-social-community-followers-title') }}</h3>
        <p class="community-hub__compose-lead">{{ $t('bot-social-community-followers-lead') }}</p>
      </header>

      <form class="community-hub__compose-form" @submit.prevent="onFollow">
        <label class="community-hub__field-label" for="community-follow-target">
          {{ $t('bot-social-community-followers-target-label') }}
        </label>
        <div class="community-hub__compose-combo">
          <input
            id="community-follow-target"
            v-model.trim="followTarget"
            class="community-hub__compose-input"
            type="text"
            :placeholder="$t('bot-social-community-followers-placeholder')"
            :disabled="submitLocked"
            autocomplete="off"
            spellcheck="false"
          >
          <button
            type="submit"
            class="community-hub__compose-submit"
            :disabled="!followTarget || submitLocked"
          >
            <FontAwesomeIcon v-if="mutating" icon="spinner" spin aria-hidden="true"></FontAwesomeIcon>
            <span v-else-if="cooldownSeconds > 0">
              {{ $t('bot-social-community-submit-cooldown', { s: cooldownSeconds }) }}
            </span>
            <span v-else>{{ $t('bot-social-community-followers-submit') }}</span>
          </button>
        </div>
      </form>

      <div class="community-hub__compose-help" :aria-label="$t('bot-social-community-followers-formats')">
        <p class="community-hub__compose-help-title">{{ $t('bot-social-community-followers-formats') }}</p>
        <ul class="community-hub__compose-examples">
          <li><code>{{ $t('bot-social-friends-send-example-vanity') }}</code></li>
          <li><code>{{ $t('bot-social-friends-send-example-profiles') }}</code></li>
          <li><code>{{ $t('bot-social-friends-send-example-steamid') }}</code></li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>
  import { followUsers, isPluginMissingError } from '../../api/bot-social';
  import { createSubmitCooldownMixin } from '../../mixins/submit-cooldown';
  import { firstMutationResult, mutationSucceeded } from '../../utils/mutation-result';
  import { normalizeFriendTarget } from '../../utils/friend-target';

  /** UI ≥ FollowersWriteLimiter (3s). */
  const SUBMIT_COOLDOWN_MS = 5000;

  export default {
    name: 'BotSocialCommunityFollowersPanel',
    mixins: [createSubmitCooldownMixin(SUBMIT_COOLDOWN_MS)],
    props: {
      botName: { type: String, required: true },
    },
    data() {
      return {
        followTarget: '',
        mutating: false,
      };
    },
    watch: {
      botName() {
        this.followTarget = '';
        this.mutating = false;
        this.resetSubmitCooldown();
      },
    },
    methods: {
      async onFollow() {
        if (this.submitLocked) return;
        const target = normalizeFriendTarget(this.followTarget);
        if (!target) {
          this.$error(this.$t('bot-social-community-followers-invalid'));
          return;
        }
        this.mutating = true;
        try {
          const payload = await followUsers(this.botName, [target]);
          const first = firstMutationResult(payload, this.botName);
          if (!mutationSucceeded(first)) {
            const detail = first?.Message || first?.message || this.$t('bot-social-community-followers-failed');
            this.$error(detail);
            return;
          }
          this.$success(this.$t('bot-social-community-followers-success', { target }));
          this.followTarget = '';
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
