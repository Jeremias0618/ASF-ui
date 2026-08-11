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
            :disabled="mutating"
            autocomplete="off"
            spellcheck="false"
          >
          <button
            type="submit"
            class="community-hub__compose-submit"
            :disabled="!followTarget || mutating"
          >
            <FontAwesomeIcon v-if="mutating" icon="spinner" spin aria-hidden="true"></FontAwesomeIcon>
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
  import { normalizeFriendTarget } from '../../utils/friend-target';

  export default {
    name: 'BotSocialCommunityFollowersPanel',
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
      async onFollow() {
        if (this.mutating) return;
        const target = normalizeFriendTarget(this.followTarget);
        if (!target) {
          this.$error(this.$t('bot-social-community-followers-invalid'));
          return;
        }
        this.mutating = true;
        try {
          const payload = await followUsers(this.botName, [target]);
          const first = this.firstMutationResult(payload);
          if (!this.mutationSucceeded(first)) {
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
        }
      },
    },
  };
</script>
