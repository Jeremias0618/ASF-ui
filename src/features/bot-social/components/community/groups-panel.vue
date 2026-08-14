<template>
  <section class="community-hub__compose" :aria-label="$t('bot-social-friends-groups-title')">
    <div class="community-hub__compose-panel">
      <header class="community-hub__compose-header">
        <p class="community-hub__compose-eyebrow">{{ $t('bot-social-community-mode-groups') }}</p>
        <h3 class="community-hub__compose-title">{{ $t('bot-social-friends-groups-title') }}</h3>
        <p class="community-hub__compose-lead">{{ $t('bot-social-friends-groups-lead') }}</p>
      </header>

      <form class="community-hub__compose-form" @submit.prevent="onJoinGroup">
        <label class="community-hub__field-label" for="community-group-target">
          {{ $t('bot-social-friends-groups-target-label') }}
        </label>
        <div class="community-hub__compose-combo">
          <input
            id="community-group-target"
            v-model.trim="groupTarget"
            class="community-hub__compose-input"
            type="text"
            :placeholder="$t('bot-social-friends-groups-placeholder')"
            :disabled="submitLocked"
            autocomplete="off"
            spellcheck="false"
          >
          <button
            type="submit"
            class="community-hub__compose-submit"
            :disabled="!groupTarget || submitLocked"
          >
            <FontAwesomeIcon v-if="mutating" icon="spinner" spin aria-hidden="true"></FontAwesomeIcon>
            <span v-else-if="cooldownSeconds > 0">
              {{ $t('bot-social-community-submit-cooldown', { s: cooldownSeconds }) }}
            </span>
            <span v-else>{{ $t('bot-social-friends-groups-submit') }}</span>
          </button>
        </div>
      </form>

      <div class="community-hub__compose-help" :aria-label="$t('bot-social-friends-groups-formats')">
        <p class="community-hub__compose-help-title">{{ $t('bot-social-friends-groups-formats') }}</p>
        <ul class="community-hub__compose-examples">
          <li><code>{{ $t('bot-social-friends-groups-example-url') }}</code></li>
          <li><code>{{ $t('bot-social-friends-groups-example-vanity') }}</code></li>
          <li><code>{{ $t('bot-social-friends-groups-example-gid') }}</code></li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>
  import { isPluginMissingError, joinGroups } from '../../api/bot-social';
  import { createSubmitCooldownMixin } from '../../mixins/submit-cooldown';
  import { firstMutationResult, mutationSucceeded } from '../../utils/mutation-result';
  import { isLikelyGroupTarget, normalizeGroupTarget } from '../../utils/group-target';

  /** UI ≥ GroupsJoinLimiter (3s). */
  const SUBMIT_COOLDOWN_MS = 5000;

  export default {
    name: 'BotSocialCommunityGroupsPanel',
    mixins: [createSubmitCooldownMixin(SUBMIT_COOLDOWN_MS)],
    props: {
      botName: { type: String, required: true },
    },
    data() {
      return {
        groupTarget: '',
        mutating: false,
      };
    },
    watch: {
      botName() {
        this.groupTarget = '';
        this.mutating = false;
        this.resetSubmitCooldown();
      },
    },
    methods: {
      async onJoinGroup() {
        if (this.submitLocked) return;
        const target = normalizeGroupTarget(this.groupTarget);
        if (!isLikelyGroupTarget(this.groupTarget) || !target) {
          this.$error(this.$t('bot-social-friends-groups-invalid'));
          return;
        }
        this.mutating = true;
        try {
          const payloadTarget = /steamcommunity\.com\/(?:groups|gid)\//i.test(this.groupTarget)
            ? this.groupTarget.trim()
            : target;
          const payload = await joinGroups(this.botName, [payloadTarget]);
          const first = firstMutationResult(payload, this.botName);
          if (!mutationSucceeded(first)) {
            const detail = first?.Message || first?.message || this.$t('bot-social-friends-groups-failed');
            this.$error(detail);
            return;
          }
          const detail = first?.Message || first?.message || '';
          this.$success(
            detail && detail !== 'OK'
              ? this.$t('bot-social-friends-groups-success-named', { detail: detail.replace(/^OK\s*—\s*/i, '') })
              : this.$t('bot-social-friends-groups-success'),
          );
          this.groupTarget = '';
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
