<template>
  <main v-if="bot" class="confirm-danger">
    <div class="confirm-danger__icon" aria-hidden="true">
      <FontAwesomeIcon icon="exclamation-triangle"></FontAwesomeIcon>
    </div>

    <h2 class="confirm-danger__title">
      {{ $t('2fa-delete-title', { name: bot.viewableName }) }}
    </h2>

    <p class="confirm-danger__body" v-html="$t('2fa-delete-body', { name: bot.viewableName })"></p>

    <div class="confirm-danger__confirm">
      <label for="bot-2fa-delete-confirm" class="confirm-danger__label" v-html="$t('confirmation', { name: bot.viewableName })"></label>
      <input
        id="bot-2fa-delete-confirm"
        ref="confirmInput"
        v-model="confirmationText"
        class="confirm-danger__input"
        :class="{ 'is-ready': confirmed }"
        type="text"
        autocomplete="off"
        spellcheck="false"
        :placeholder="bot.viewableName"
        @keydown.enter.prevent="onEnter"
      >
    </div>

    <div class="confirm-danger__actions">
      <button type="button" class="button confirm-danger__cancel" :disabled="deleting" @click="$parent.back()">
        {{ $t('cancel') }}
      </button>
      <button
        type="button"
        class="button confirm-danger__delete"
        :disabled="!confirmed || deleting"
        @click="onDelete"
      >
        <FontAwesomeIcon v-if="deleting" icon="spinner" spin fixedWidth aria-hidden="true"></FontAwesomeIcon>
        <span v-else>{{ $t('delete') }}</span>
      </button>
    </div>
  </main>
</template>

<script>
  import delay from '../../utils/delay';

  export default {
    name: 'Bot2faDelete',
    data() {
      return {
        deleting: false,
        confirmationText: '',
      };
    },
    computed: {
      bot() {
        return this.$store.getters['bots/bot'](this.$route.params.bot);
      },
      confirmed() {
        return this.confirmationText === this.bot.viewableName;
      },
    },
    created() {
      if (!this.bot) this.$router.replace({ name: 'bots' });
    },
    mounted() {
      this.$nextTick(() => {
        if (this.$refs.confirmInput) this.$refs.confirmInput.focus();
      });
    },
    methods: {
      onEnter() {
        if (this.confirmed && !this.deleting) this.onDelete();
      },
      async onDelete() {
        if (!this.confirmed || this.deleting) return;

        this.deleting = true;

        try {
          const bot = this.bot.name;
          const response = await this.$http.del(`bot/${bot}/twoFactorAuthentication`);

          if (response[bot].Success) {
            this.$success(this.$t('2fa-delete-success', { bot }));
            await delay(1000);
            this.$router.push({ name: 'bots' });
          } else {
            this.$error(response[bot].Message);
          }
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.deleting = false;
        }
      },
    },
  };
</script>
