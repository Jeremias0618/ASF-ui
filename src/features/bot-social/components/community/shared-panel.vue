<template>
  <section class="friends-hub__compose" :aria-label="$t('bot-social-community-shared-title')">
    <div class="friends-hub__compose-panel">
      <header class="friends-hub__compose-header">
        <p class="friends-hub__compose-eyebrow">{{ $t('bot-social-community-mode-shared') }}</p>
        <h3 class="friends-hub__compose-title">{{ $t('bot-social-community-shared-title') }}</h3>
        <p class="friends-hub__compose-lead">{{ $t('bot-social-community-shared-lead') }}</p>
      </header>

      <form class="friends-hub__compose-form" @submit.prevent="onSubmit">
        <label class="friends-hub__field-label" for="community-shared-url">
          {{ $t('bot-social-community-shared-url-label') }}
        </label>
        <div class="friends-hub__compose-combo">
          <input
            id="community-shared-url"
            v-model.trim="sharedUrl"
            class="friends-hub__compose-input"
            type="text"
            :placeholder="$t('bot-social-community-shared-placeholder')"
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
            <span v-else>{{ $t('bot-social-community-shared-submit') }}</span>
          </button>
        </div>

        <p class="friends-hub__field-label" id="community-shared-vote-label">
          {{ $t('bot-social-community-shared-vote-label') }}
        </p>
        <div class="community-hub__vote-row">
          <div
            class="community-hub__vote-bar"
            role="radiogroup"
            aria-labelledby="community-shared-vote-label"
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
                name="community-shared-vote"
                :value="opt.value"
                :disabled="mutating"
              >
              <FontAwesomeIcon :icon="opt.icon" aria-hidden="true"></FontAwesomeIcon>
              <span>{{ opt.label }}</span>
            </label>
          </div>

          <label class="community-hub__vote-chip community-hub__vote-chip--check" :class="{ 'is-active': favorite }">
            <input v-model="favorite" type="checkbox" :disabled="mutating">
            <FontAwesomeIcon icon="star" aria-hidden="true"></FontAwesomeIcon>
            <span>{{ $t('bot-social-community-shared-favorite') }}</span>
          </label>
        </div>
      </form>

      <div class="friends-hub__compose-help" :aria-label="$t('bot-social-community-shared-formats')">
        <p class="friends-hub__compose-help-title">{{ $t('bot-social-community-shared-formats') }}</p>
        <ul class="friends-hub__compose-examples">
          <li><code>{{ $t('bot-social-community-shared-example-a') }}</code></li>
          <li><code>{{ $t('bot-social-community-shared-example-b') }}</code></li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>
  import { actSharedFile, isPluginMissingError } from '../../api/bot-social';
  import { isLikelySharedFileUrl } from '../../utils/shared-file-target';

  export default {
    name: 'BotSocialCommunitySharedPanel',
    props: {
      botName: { type: String, required: true },
    },
    data() {
      return {
        sharedUrl: '',
        vote: '',
        favorite: false,
        mutating: false,
      };
    },
    computed: {
      voteOptions() {
        return [
          { value: 'like', tone: 'positive', icon: 'thumbs-up', label: this.$t('bot-social-community-shared-vote-like') },
          { value: 'dislike', tone: 'negative', icon: 'thumbs-down', label: this.$t('bot-social-community-shared-vote-dislike') },
        ];
      },
      canSubmit() {
        return isLikelySharedFileUrl(this.sharedUrl) && (!!this.vote || this.favorite);
      },
    },
    watch: {
      botName() {
        this.sharedUrl = '';
        this.vote = '';
        this.favorite = false;
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
        if (!isLikelySharedFileUrl(this.sharedUrl)) {
          this.$error(this.$t('bot-social-community-shared-invalid'));
          return;
        }
        if (!this.vote && !this.favorite) {
          this.$error(this.$t('bot-social-community-shared-need-action'));
          return;
        }
        this.mutating = true;
        try {
          const payload = await actSharedFile(this.botName, {
            url: this.sharedUrl.trim(),
            vote: this.vote || null,
            favorite: this.favorite,
          });
          const first = this.firstMutationResult(payload);
          if (!this.mutationSucceeded(first)) {
            const detail = first?.Message || first?.message || this.$t('bot-social-community-shared-failed');
            this.$error(detail);
            return;
          }
          this.$success(this.$t('bot-social-community-shared-success'));
          this.sharedUrl = '';
          this.favorite = false;
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
