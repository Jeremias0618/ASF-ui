<template>
  <main v-if="bot" class="main-container bgr-modal">
    <header class="bgr-modal__header">
      <p class="bgr-modal__eyebrow">{{ $t('bot-fav-buttons-bgr') }}</p>
      <h2 v-tooltip="bot.name" class="bgr-modal__title">{{ bot.viewableName }}</h2>
    </header>

    <div v-if="loading" class="bgr-modal__loading" aria-busy="true">
      <FontAwesomeIcon icon="spinner" size="lg" spin></FontAwesomeIcon>
    </div>

    <template v-else>
      <BgrStatus
        v-if="state === 'input'"
        :usedKeys="usedKeys"
        :unusedKeys="unusedKeys"
        @reset="showReset"
        @show-unused="state = 'unusedKeys'"
        @show-used="state = 'usedKeys'"
      ></BgrStatus>

      <div v-if="state === 'input' && bot.bgrCount !== 0" class="bgr__info">
        <div v-if="bot.isConnected" class="bgr__info-icon">
          <FontAwesomeLayers class="hourglass-spin">
            <FontAwesomeIcon icon="hourglass-start"></FontAwesomeIcon>
            <FontAwesomeIcon icon="hourglass-half"></FontAwesomeIcon>
            <FontAwesomeIcon icon="hourglass-end"></FontAwesomeIcon>
            <FontAwesomeIcon icon="hourglass-end" spin></FontAwesomeIcon>
          </FontAwesomeLayers>
        </div>
        <p class="bgr-modal__queue">{{ backgroundQueueText }}</p>
      </div>

      <keep-alive>
        <BgrInput v-if="state === 'input'" @check="onCheck"></BgrInput>
        <BgrCheck v-if="state === 'check'" :keys="keys" :title="$t('bgr-check', { n: foundKeysCount })" :bot="bot" :confirming="confirming" @confirm="onConfirm" @cancel="onCancel"></BgrCheck>
        <BgrReset v-if="state === 'reset'" :title="$t('bgr-reset')" :resetting="resetting" @reset="onReset" @cancel="onCancel"></BgrReset>
        <BgrSummary v-if="state === 'summary'" :keys="summaryKeys" :title="$t('bgr-summary-success', { n: addedKeysCount })" @back="$parent.back()"></BgrSummary>
        <BgrSummary v-if="state === 'usedKeys'" :keys="usedKeys" :title="$t('bgr-used-keys')" @back="state = 'input'"></BgrSummary>
        <BgrSummary v-if="state === 'unusedKeys'" :keys="unusedKeys" :title="$t('bgr-unused-keys')" @back="state = 'input'"></BgrSummary>
      </keep-alive>
    </template>
  </main>
</template>

<script>
  import BgrCheck from '../../components/BGR/Check.vue';
  import BgrInput from '../../components/BGR/Input.vue';
  import BgrReset from '../../components/BGR/Reset.vue';
  import BgrStatus from '../../components/BGR/Status.vue';
  import BgrSummary from '../../components/BGR/Summary.vue';

  export default {
    name: 'BotBgr',
    components: {
      BgrCheck, BgrInput, BgrReset, BgrStatus, BgrSummary,
    },
    data() {
      return {
        loading: true,
        confirming: false,
        resetting: false,
        state: 'input',
        unusedKeys: {},
        usedKeys: {},
        keys: {},
        summaryKeys: {},
      };
    },
    computed: {
      bot() {
        return this.$store.getters['bots/bot'](this.$route.params.bot);
      },
      foundKeysCount() {
        return Object.keys(this.keys).length;
      },
      addedKeysCount() {
        return Object.keys(this.summaryKeys).length;
      },
      backgroundQueueText() {
        const text = this.$t('bgr-background-queue', { n: this.bot.bgrCount });
        return (this.bot.isConnected) ? `${text}..` : text;
      },
    },
    watch: {
      $route: {
        immediate: true,
        async handler() {
          if (!this.bot) return;
          this.loading = true;
          const { UnusedKeys, UsedKeys } = await this.loadBGR();
          this.unusedKeys = UnusedKeys;
          this.usedKeys = UsedKeys;
          this.loading = false;
        },
      },
    },
    created() {
      if (!this.bot) this.$router.replace({ name: 'bots' });
    },
    methods: {
      async loadBGR() {
        return (await this.$http.get(`bot/${this.bot.name}/GamesToRedeemInBackground`))[this.bot.name];
      },
      onCheck(keys) {
        this.keys = keys;
        this.state = 'check';
      },
      async onConfirm() {
        this.confirming = true;

        try {
          const activatedKeys = await this.$http.post(`bot/${this.bot.name}/GamesToRedeemInBackground`, { gamesToRedeemInBackground: this.keys });
          this.state = 'summary';
          this.summaryKeys = activatedKeys[this.bot.name];
        } finally {
          this.confirming = false;
        }
      },
      onCancel() {
        this.state = 'input';
      },
      showReset() {
        this.state = 'reset';
      },
      async onReset() {
        this.resetting = true;

        try {
          await this.$http.del(`bot/${this.bot.name}/GamesToRedeemInBackground`);
          this.unusedKeys = {};
          this.usedKeys = {};
        } finally {
          this.resetting = false;
          this.state = 'input';
        }
      },
    },
  };
</script>

<style lang="scss">
  .bgr-modal {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    max-width: 100%;
    min-width: 0;
    padding: 1.1rem 1.2rem 1.25rem;
    width: 100%;
  }

  .bgr-modal__header {
    padding-right: 2rem;
  }

  .bgr-modal__eyebrow {
    color: var(--h2-muted, var(--color-text-disabled));
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    margin: 0 0 0.2rem;
    text-transform: uppercase;
  }

  .bgr-modal__title {
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bgr-modal__loading {
    align-items: center;
    color: var(--h2-muted, var(--color-text-disabled));
    display: flex;
    justify-content: center;
    min-height: 8rem;
  }

  .bgr-modal__queue {
    color: var(--h2-muted, var(--color-text-disabled));
    font-size: 0.9rem;
    margin: 0;
  }

  .bgr__info {
    align-items: center;
    background: var(--h2-soft, rgba(0, 0, 0, 0.08));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 0.65rem;
    display: flex;
    gap: 0.55rem;
    justify-content: flex-start;
    padding: 0.7rem 0.85rem;
  }

  .bgr__info-icon {
    color: var(--h2-brand, var(--color-theme));
    flex-shrink: 0;
  }

  .hourglass-spin {
    [class*="fa-hourglass"] {
      animation: showHide 4s steps(1) infinite;
      opacity: 0;
    }

    .fa-hourglass-half {
      animation-delay: 1s;
    }
    .fa-hourglass-start {
      animation-delay: 0s;
    }
    .fa-hourglass-end {
      animation-delay: 2s;
    }

    .fa-hourglass-end.fa-spin {
      animation: showHideSpin 4s linear infinite;
    }
  }

  @keyframes showHide {
    0% { opacity: 1 }
    25% { opacity: 0 }
  }

  @keyframes showHideSpin {
    0% { opacity: 0 }
    74.99% { opacity: 0 }
    75% { opacity: 1; transform: rotate(0deg); }
    100% { opacity: 1; transform: rotate(180deg); }
  }

  @media screen and (max-width: 480px) {
    .bgr-modal {
      padding: 0.95rem 0.85rem 1.05rem;
    }
  }
</style>
