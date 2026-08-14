<template>
  <section class="community-hub__compose" :aria-label="$t('bot-social-community-curators-title')">
    <div class="community-hub__compose-panel">
      <header class="community-hub__compose-header">
        <p class="community-hub__compose-eyebrow">{{ $t('bot-social-community-mode-curators') }}</p>
        <h3 class="community-hub__compose-title">{{ $t('bot-social-community-curators-title') }}</h3>
        <p class="community-hub__compose-lead">{{ $t('bot-social-community-curators-lead') }}</p>
      </header>

      <form class="community-hub__compose-form" @submit.prevent="onFollow">
        <label class="community-hub__field-label" for="community-curator-target">
          {{ $t('bot-social-community-curators-target-label') }}
        </label>
        <div class="community-hub__compose-combo">
          <input
            id="community-curator-target"
            v-model.trim="curatorTarget"
            class="community-hub__compose-input"
            type="text"
            :placeholder="$t('bot-social-community-curators-placeholder')"
            :disabled="submitLocked"
            autocomplete="off"
            spellcheck="false"
          >
          <button
            type="submit"
            class="community-hub__compose-submit"
            :disabled="!curatorTarget || submitLocked"
          >
            <FontAwesomeIcon v-if="mutating" icon="spinner" spin aria-hidden="true"></FontAwesomeIcon>
            <span v-else-if="cooldownSeconds > 0">
              {{ $t('bot-social-community-submit-cooldown', { s: cooldownSeconds }) }}
            </span>
            <span v-else>{{ $t('bot-social-community-curators-submit') }}</span>
          </button>
        </div>
      </form>

      <div class="community-hub__compose-help" :aria-label="$t('bot-social-community-curators-formats')">
        <p class="community-hub__compose-help-title">{{ $t('bot-social-community-curators-formats') }}</p>
        <ul class="community-hub__compose-examples">
          <li><code>{{ $t('bot-social-community-curators-example-url') }}</code></li>
          <li><code>{{ $t('bot-social-community-curators-example-id') }}</code></li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>
  import { followCurators, isPluginMissingError } from '../../api/bot-social';
  import { createSubmitCooldownMixin } from '../../mixins/submit-cooldown';
  import { firstMutationResult, mutationSucceeded } from '../../utils/mutation-result';
  import { isLikelyCuratorTarget, normalizeCuratorTarget } from '../../utils/curator-target';

  /** UI ≥ CuratorsWriteLimiter (3s). */
  const SUBMIT_COOLDOWN_MS = 5000;

  export default {
    name: 'BotSocialCommunityCuratorsPanel',
    mixins: [createSubmitCooldownMixin(SUBMIT_COOLDOWN_MS)],
    props: {
      botName: { type: String, required: true },
    },
    data() {
      return {
        curatorTarget: '',
        mutating: false,
      };
    },
    watch: {
      botName() {
        this.curatorTarget = '';
        this.mutating = false;
        this.resetSubmitCooldown();
      },
    },
    methods: {
      async onFollow() {
        if (this.submitLocked) return;
        const target = normalizeCuratorTarget(this.curatorTarget);
        if (!isLikelyCuratorTarget(this.curatorTarget) || !target) {
          this.$error(this.$t('bot-social-community-curators-invalid'));
          return;
        }
        this.mutating = true;
        try {
          const payloadTarget = /steampowered\.com\/curator\//i.test(this.curatorTarget)
            ? this.curatorTarget.trim()
            : target;
          const payload = await followCurators(this.botName, [payloadTarget]);
          const first = firstMutationResult(payload, this.botName);
          if (!mutationSucceeded(first)) {
            const detail = first?.Message || first?.message || this.$t('bot-social-community-curators-failed');
            this.$error(detail);
            return;
          }
          this.$success(this.$t('bot-social-community-curators-success', { id: target }));
          this.curatorTarget = '';
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
