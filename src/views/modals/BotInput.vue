<template>
  <main v-if="bot" class="main-container">
    <h2 v-tooltip="bot.name" class="title">{{ bot.viewableName }}</h2>

    <div class="form-item">
      <div class="form-item__info">{{ $t(`input-info-${inputType}`) }}</div>
      <div class="form-item__code">
        <div>
          <label for="input" class="form-item__label">{{ $t(`input-label-${inputType}`) }}</label>
          <input id="input" v-model="code" class="form-item__input" type="password" autocomplete="new-password">
        </div>
        <div class="form-item__buttons form-item__buttons--column">
          <button v-tooltip="tooltip" class="button button--helper" @click="switchInputType">
            <FontAwesomeIcon v-if="inputHidden" icon="eye" size="lg"></FontAwesomeIcon>
            <FontAwesomeIcon v-else icon="eye-slash" size="lg"></FontAwesomeIcon>
          </button>
        </div>
      </div>
      <div class="form-item__buttons form-item__buttons--center">
        <button class="button button--confirm" @click="submit">
          <FontAwesomeIcon v-if="submitting" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ $t('input-submit') }}</span>
        </button>
      </div>
    </div>
  </main>
</template>

<script>
  import {
    InputChangedError,
    getInputRoute,
    hasRequiredInput,
    submitBotInput,
  } from '../../utils/botLogin';

  export default {
    name: 'BotInput',
    data() {
      return {
        submitting: false,
        code: '',
        inputHidden: true,
      };
    },
    computed: {
      bot() {
        return this.$store.getters['bots/bot'](this.$route.params.bot);
      },
      inputType() {
        return this.$route.params.type.toLowerCase();
      },
      tooltip() {
        return this.inputHidden ? this.$t('input-switch-show') : this.$t('input-switch-hide');
      },
    },
    created() {
      if (!this.bot || !this.$route.params.type) this.$router.replace({ name: 'bots' });
      document.addEventListener('keydown', this.onEnterClick);
    },
    beforeDestroy() {
      document.removeEventListener('keydown', this.onEnterClick);
    },
    mounted() {
      document.getElementById('input').focus();
    },
    methods: {
      switchInputType() {
        this.inputHidden = !this.inputHidden;
        const field = document.getElementById('input');

        if (field.getAttribute('type') === 'password') field.setAttribute('type', 'text');
        else field.setAttribute('type', 'password');
      },
      onEnterClick(e) {
        const charCode = (e.which) ? e.which : e.keyCode;

        if (charCode === 13) {
          this.submit();
          return e.preventDefault();
        }
      },
      async submit() {
        if (this.submitting) return;

        if (this.code === '') {
          this.$error(this.$t(`input-no-code-${this.inputType}`));
          return;
        }

        this.submitting = true;

        const botName = this.bot.name;

        try {
          // Sends the value only while the bot still asks for this type, and restarts the bot only if
          // ASF stopped it while asking. A stored value is not a completed sign-in (see submitBotInput).
          await submitBotInput(botName, this.$route.params.type, this.code);
          this.code = '';

          this.$router.back();
        } catch (err) {
          if (err instanceof InputChangedError) {
            this.$info(this.$t('bot-login-input-changed'));
            this.code = '';
            await this.$store.dispatch('bots/updateBot', { name: botName });

            // Follow what ASF asks for now, or just leave when it stopped asking.
            const bot = this.$store.getters['bots/bot'](botName);
            if (bot && hasRequiredInput(bot)) this.$router.replace(getInputRoute(bot));
            else this.$router.back();
          } else {
            this.$error(err.message);
          }
        } finally {
          this.submitting = false;
        }
      },
    },
  };
</script>

<style lang="scss">
  .form-item__info {
    padding-bottom: 1em;
  }

  .button--helper {
    max-width: 2em;
  }
</style>
