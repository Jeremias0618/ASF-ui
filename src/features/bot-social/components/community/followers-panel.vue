<template>
  <section class="friends-hub__compose community-hub__followers" :aria-label="$t('bot-social-community-followers-title')">
    <div class="friends-hub__compose-panel">
      <header class="friends-hub__compose-header">
        <p class="friends-hub__compose-eyebrow">{{ $t('bot-social-community-mode-followers') }}</p>
        <h3 class="friends-hub__compose-title">{{ $t('bot-social-community-followers-title') }}</h3>
        <p class="friends-hub__compose-lead">{{ $t('bot-social-community-followers-lead') }}</p>
      </header>

      <div class="community-hub__followers-stat" aria-live="polite">
        <span class="community-hub__followers-stat-label">{{ $t('bot-social-community-followers-count-label') }}</span>
        <strong class="community-hub__followers-stat-value">{{ countLabel }}</strong>
        <button
          type="button"
          class="community-hub__refresh"
          :disabled="loadingCount || refreshingCount"
          @click="refreshCount"
        >
          <FontAwesomeIcon :icon="loadingCount || refreshingCount ? 'spinner' : 'redo-alt'" :spin="loadingCount || refreshingCount"></FontAwesomeIcon>
          {{ $t('bot-social-refresh') }}
        </button>
      </div>

      <p v-if="countError" class="bot-social__inline-error">{{ countError }}</p>

      <form class="friends-hub__compose-form" @submit.prevent="onFollow">
        <label class="friends-hub__field-label" for="community-follow-target">
          {{ $t('bot-social-community-followers-target-label') }}
        </label>
        <div class="friends-hub__compose-combo">
          <input
            id="community-follow-target"
            v-model.trim="followTarget"
            class="friends-hub__compose-input"
            type="text"
            :placeholder="$t('bot-social-community-followers-placeholder')"
            :disabled="mutating"
            autocomplete="off"
            spellcheck="false"
          >
          <button
            type="submit"
            class="friends-hub__compose-submit"
            :disabled="!followTarget || mutating"
          >
            <FontAwesomeIcon v-if="mutating" icon="spinner" spin aria-hidden="true"></FontAwesomeIcon>
            <span v-else>{{ $t('bot-social-community-followers-submit') }}</span>
          </button>
        </div>
      </form>

      <div class="friends-hub__compose-help" :aria-label="$t('bot-social-community-followers-formats')">
        <p class="friends-hub__compose-help-title">{{ $t('bot-social-community-followers-formats') }}</p>
        <ul class="friends-hub__compose-examples">
          <li><code>{{ $t('bot-social-friends-send-example-vanity') }}</code></li>
          <li><code>{{ $t('bot-social-friends-send-example-profiles') }}</code></li>
          <li><code>{{ $t('bot-social-friends-send-example-steamid') }}</code></li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>
  import { fetchFollowersCount, followUsers, isPluginMissingError } from '../../api/bot-social';
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
        loadingCount: false,
        refreshingCount: false,
        hasLoadedCount: false,
        followerCount: null,
        countError: '',
      };
    },
    computed: {
      countLabel() {
        if (this.loadingCount && !this.hasLoadedCount) return '…';
        if (this.followerCount == null) return this.$t('bot-social-community-unavailable');
        return Number(this.followerCount).toLocaleString(this.$i18n.locale);
      },
    },
    watch: {
      botName: {
        immediate: true,
        handler() {
          this.followTarget = '';
          this.mutating = false;
          this.hasLoadedCount = false;
          this.followerCount = null;
          this.loadCount(false);
        },
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
      async refreshCount() {
        if (this.loadingCount || this.refreshingCount) return;
        await this.loadCount(true);
      },
      async loadCount(force) {
        if (!this.botName) return;
        const first = !this.hasLoadedCount;
        this.loadingCount = first;
        this.refreshingCount = !first && !!force;
        this.countError = '';

        try {
          const payload = await fetchFollowersCount(this.botName);
          const botResult = payload?.[this.botName]
            || payload?.[Object.keys(payload || {}).find(k => k.toLowerCase() === String(this.botName || '').toLowerCase())]
            || payload?.[Object.keys(payload || {})[0]];
          const count = botResult?.Count ?? botResult?.count;
          this.followerCount = count == null ? null : Number(count);
          this.hasLoadedCount = true;
        } catch (err) {
          if (isPluginMissingError(err)) {
            this.$emit('plugin-missing');
            return;
          }
          this.countError = err.message || String(err);
          if (!this.hasLoadedCount) this.followerCount = null;
          this.hasLoadedCount = true;
        } finally {
          this.loadingCount = false;
          this.refreshingCount = false;
        }
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
          await this.loadCount(true);
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
