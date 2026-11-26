<template>
  <main v-if="bot" class="main-container main-container--bot-config main-container--bot-login">
    <header class="bot-config__header">
      <p class="bot-config__eyebrow">{{ $t('bot-login-eyebrow') }}</p>
      <h2 v-tooltip="bot.name" class="title bot-config__title">{{ bot.viewableName }}</h2>
    </header>

    <div class="bot-config__body bot-login__body" role="status" aria-live="polite">
      <p v-if="insecureRemote" class="bot-login__notice bot-login__notice--warn">
        <FontAwesomeIcon icon="exclamation-triangle" fixedWidth aria-hidden="true"></FontAwesomeIcon>
        <span>{{ $t('bot-login-insecure') }}</span>
      </p>

      <!-- Connected: only shown once ASF reports IsConnectedAndLoggedOn -->
      <section v-if="phase === PHASE.CONNECTED" class="bot-login__section bot-login__section--ok">
        <FontAwesomeIcon icon="check-circle" class="bot-login__icon bot-login__icon--ok" aria-hidden="true"></FontAwesomeIcon>
        <h3 class="bot-login__heading">{{ $t('bot-login-connected-title') }}</h3>
        <p class="bot-login__text">{{ $t('bot-login-connected-text', { bot: bot.viewableName }) }}</p>
      </section>

      <!-- Stopped bot, ASF not headless: the method is sent in advance so ASF never asks it in its console -->
      <section v-else-if="showMethodChoice" class="bot-login__section">
        <p v-if="phase === PHASE.STOPPED" class="bot-login__notice bot-login__notice--warn">
          <FontAwesomeIcon icon="exclamation-triangle" fixedWidth aria-hidden="true"></FontAwesomeIcon>
          <span>{{ $t('bot-login-stopped-text') }}</span>
        </p>
        <h3 class="bot-login__heading">{{ $t('bot-login-method-title') }}</h3>
        <p class="bot-login__text">{{ $t('bot-login-method-text') }}</p>

        <div v-if="!credentialsOpen" class="bot-login__choices">
          <button type="button" class="button button--confirm bot-config__btn" :disabled="starting" @click="startWithMethod(LOGIN_METHOD.QR)">
            <FontAwesomeIcon v-if="starting" icon="spinner" spin fixedWidth></FontAwesomeIcon>
            <span v-else>{{ $t('bot-login-method-qr') }}</span>
          </button>
          <button type="button" class="button bot-config__btn bot-config__btn--secondary" :disabled="starting" @click="credentialsOpen = true">
            <span>{{ $t('bot-login-method-credentials') }}</span>
          </button>
        </div>

        <form v-else class="bot-login__form" autocomplete="off" @submit.prevent="startWithCredentials">
          <p class="bot-login__hint">{{ $t('bot-login-method-credentials-hint') }}</p>
          <label class="bot-login__label" for="bot-login-name">{{ $t('input-label-login') }}</label>
          <input
            id="bot-login-name"
            v-model="loginName"
            class="form-item__input bot-login__input bot-login__input--plain"
            type="text"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            :disabled="starting"
          >
          <label class="bot-login__label" for="bot-login-password">{{ $t('input-label-password') }}</label>
          <input
            id="bot-login-password"
            v-model="loginPassword"
            class="form-item__input bot-login__input bot-login__input--plain"
            type="password"
            autocomplete="new-password"
            :disabled="starting"
          >
          <button type="submit" class="button button--confirm bot-config__btn" :disabled="starting">
            <FontAwesomeIcon v-if="starting" icon="spinner" spin fixedWidth></FontAwesomeIcon>
            <span v-else>{{ $t('bot-login-method-credentials-start') }}</span>
          </button>
          <button type="button" class="button bot-config__btn bot-config__btn--ghost" :disabled="starting" @click="closeCredentials">
            <span>{{ $t('bot-login-method-back') }}</span>
          </button>
        </form>
      </section>

      <!-- Steam Guard / authenticator code -->
      <section v-else-if="phase === PHASE.CODE" class="bot-login__section">
        <h3 class="bot-login__heading">{{ $t(`input-label-${inputKey}`) }}</h3>
        <p class="bot-login__text">{{ $t(`bot-login-code-${inputKey}`) }}</p>

        <p v-if="rejected" class="bot-login__notice bot-login__notice--warn">
          <FontAwesomeIcon icon="exclamation-triangle" fixedWidth aria-hidden="true"></FontAwesomeIcon>
          <span>{{ $t('bot-login-code-rejected') }}</span>
        </p>
        <p v-if="consoleHint" class="bot-login__notice">{{ $t('bot-login-console-hint') }}</p>

        <form class="bot-login__form" @submit.prevent="submitCode">
          <label class="bot-login__label" for="bot-login-code">{{ $t(`input-label-${inputKey}`) }}</label>
          <input
            id="bot-login-code"
            ref="codeInput"
            v-model="code"
            class="form-item__input bot-login__input"
            type="text"
            autocomplete="one-time-code"
            autocapitalize="characters"
            spellcheck="false"
            :disabled="submitting"
          >
          <button type="submit" class="button button--confirm bot-config__btn" :disabled="submitting || !code">
            <FontAwesomeIcon v-if="submitting" icon="spinner" spin fixedWidth></FontAwesomeIcon>
            <span v-else>{{ $t('bot-login-code-submit') }}</span>
          </button>
        </form>
      </section>

      <!-- QR login session published by ASF -->
      <section v-else-if="phase === PHASE.QR" class="bot-login__section">
        <h3 class="bot-login__heading">{{ $t('bot-login-qr-title') }}</h3>
        <p class="bot-login__text">{{ $t('bot-login-qr-text') }}</p>
        <QrCode :value="bot.qrChallengeURL" :label="$t('bot-login-qr-label')"></QrCode>
        <p class="bot-login__hint">{{ $t('bot-login-qr-refresh') }}</p>
      </section>

      <!-- QR requested but no active session -->
      <section v-else-if="phase === PHASE.QR_PENDING" class="bot-login__section">
        <template v-if="consolePending">
          <FontAwesomeIcon icon="exclamation-triangle" class="bot-login__icon bot-login__icon--warn" aria-hidden="true"></FontAwesomeIcon>
          <h3 class="bot-login__heading">{{ $t('bot-login-qr-console-title') }}</h3>
          <p class="bot-login__text">{{ $t('bot-login-qr-console-text') }}</p>
        </template>
        <template v-else>
          <FontAwesomeIcon icon="spinner" spin class="bot-login__icon" aria-hidden="true"></FontAwesomeIcon>
          <h3 class="bot-login__heading">{{ $t('bot-login-qr-pending-title') }}</h3>
          <p class="bot-login__text">{{ $t('bot-login-qr-pending-text') }}</p>
        </template>
      </section>

      <!-- Mobile approval vs code: ASF only asks this in its console -->
      <section v-else-if="phase === PHASE.DEVICE_CONFIRMATION" class="bot-login__section">
        <FontAwesomeIcon icon="exclamation-triangle" class="bot-login__icon bot-login__icon--warn" aria-hidden="true"></FontAwesomeIcon>
        <h3 class="bot-login__heading">{{ $t('bot-login-device-title') }}</h3>
        <p class="bot-login__text">{{ $t('bot-login-device-text') }}</p>
      </section>

      <!-- Login / password / family view code: plain input form -->
      <section v-else-if="phase === PHASE.CREDENTIAL" class="bot-login__section">
        <h3 class="bot-login__heading">{{ $t(`input-label-${inputKey}`) }}</h3>
        <p class="bot-login__text">{{ $t(`input-info-${inputKey}`) }}</p>
        <router-link v-slot="{ navigate }" custom :to="inputRoute">
          <button type="button" class="button button--confirm bot-config__btn" @click="navigate">
            <span>{{ $t('bot-login-enter-input') }}</span>
          </button>
        </router-link>
      </section>

      <!-- Something this panel cannot handle -->
      <section v-else-if="phase === PHASE.UNSUPPORTED" class="bot-login__section">
        <FontAwesomeIcon icon="exclamation-triangle" class="bot-login__icon bot-login__icon--warn" aria-hidden="true"></FontAwesomeIcon>
        <h3 class="bot-login__heading">{{ $t('bot-login-unsupported-title') }}</h3>
        <p class="bot-login__text">{{ $t('bot-login-unsupported-text', { type: unsupportedType }) }}</p>
      </section>

      <!-- Running, nothing asked: Steam is deciding (e.g. waiting for a mobile approval) -->
      <section v-else-if="phase === PHASE.CONNECTING" class="bot-login__section">
        <FontAwesomeIcon icon="spinner" spin class="bot-login__icon" aria-hidden="true"></FontAwesomeIcon>
        <h3 class="bot-login__heading">{{ $t('bot-login-connecting-title') }}</h3>
        <p class="bot-login__text">{{ $t('bot-login-connecting-text') }}</p>
        <p v-if="sentWhileRunning" class="bot-login__notice">{{ $t('bot-login-console-hint') }}</p>
        <button type="button" class="button bot-config__btn bot-config__btn--secondary" :disabled="refreshing" @click="refresh">
          <FontAwesomeIcon v-if="refreshing" icon="spinner" spin fixedWidth></FontAwesomeIcon>
          <span v-else>{{ $t('bot-login-check') }}</span>
        </button>
      </section>

      <!-- An attempt ended without connecting -->
      <section v-else-if="phase === PHASE.STOPPED" class="bot-login__section">
        <FontAwesomeIcon icon="times-circle" class="bot-login__icon bot-login__icon--warn" aria-hidden="true"></FontAwesomeIcon>
        <h3 class="bot-login__heading">{{ $t('bot-login-stopped-title') }}</h3>
        <p class="bot-login__text">{{ $t('bot-login-stopped-text') }}</p>
        <button type="button" class="button button--confirm bot-config__btn" :disabled="starting" @click="start">
          <FontAwesomeIcon v-if="starting" icon="spinner" spin fixedWidth></FontAwesomeIcon>
          <span v-else>{{ $t('bot-login-try-again') }}</span>
        </button>
      </section>

      <!-- Saved but not running (also: created disabled) -->
      <section v-else class="bot-login__section">
        <FontAwesomeIcon icon="power-off" class="bot-login__icon" aria-hidden="true"></FontAwesomeIcon>
        <h3 class="bot-login__heading">{{ $t('bot-login-disabled-title') }}</h3>
        <p class="bot-login__text">{{ $t('bot-login-disabled-text', { bot: bot.viewableName }) }}</p>
        <button type="button" class="button button--confirm bot-config__btn" :disabled="starting" @click="start">
          <FontAwesomeIcon v-if="starting" icon="spinner" spin fixedWidth></FontAwesomeIcon>
          <span v-else>{{ $t('bot-login-start') }}</span>
        </button>
      </section>
    </div>

    <footer class="bot-config__footer">
      <div class="bot-config__footer-primary">
        <button type="button" class="button bot-config__btn" :class="phase === PHASE.CONNECTED ? 'button--confirm' : 'bot-config__btn--secondary'" @click="$parent.close()">
          <span>{{ phase === PHASE.CONNECTED ? $t('bot-login-done') : $t('modal-close') }}</span>
        </button>

        <button v-if="canCancel" type="button" class="button bot-config__btn bot-config__btn--ghost" :disabled="stopping" @click="cancel">
          <FontAwesomeIcon v-if="stopping" icon="spinner" spin fixedWidth></FontAwesomeIcon>
          <span v-else>{{ $t('bot-login-cancel') }}</span>
        </button>
      </div>
    </footer>
  </main>
</template>

<script>
  import { mapGetters } from 'vuex';
  import QrCode from '../../components/Bot/QrCode.vue';
  import getUserInputType from '../../utils/getUserInputType';
  import {
    InputChangedError,
    LOGIN_METHOD,
    LOGIN_PHASE,
    canChooseLoginMethod,
    getInputRoute,
    normalizeLoginCode,
    resolveLoginPhase,
    startWithLoginMethod,
    submitBotInput,
  } from '../../utils/botLogin';
  import '../../style/bot-form-modal.scss';

  // Right after sending a code ASF clears the request; a request showing up again later means Steam refused it.
  const REJECT_GRACE_MS = 4000;
  // A QR session normally shows up within a couple of seconds; longer than this means ASF is asking in its console.
  const QR_STALL_MS = 8000;
  const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', '::1'];

  export default {
    name: 'BotLogin',
    components: { QrCode },
    metaInfo() {
      return {
        title: this.bot ? `${this.bot.viewableName} · ${this.$t('bot-login-eyebrow')}` : this.$t('bot-login-eyebrow'),
      };
    },
    data() {
      return {
        PHASE: LOGIN_PHASE,
        LOGIN_METHOD,
        // Codes and credentials live only here, in memory: never in storage, route params or logs.
        code: '',
        loginName: '',
        loginPassword: '',
        credentialsOpen: false,
        // This view sent the method for the running attempt, so a missing QR is not an open console question (yet).
        methodChosen: false,
        chosenMethod: null,
        qrStalled: false,
        qrStallTimer: null,
        submitting: false,
        starting: false,
        stopping: false,
        refreshing: false,
        attempted: false,
        awaitingResult: false,
        rejected: false,
        sentWhileRunning: false,
        submittedAt: 0,
        destroyed: false,
      };
    },
    computed: {
      ...mapGetters({
        isRunningHeadless: 'asf/isRunningHeadless',
      }),
      bot() {
        return this.$store.getters['bots/bot'](this.$route.params.bot);
      },
      phase() {
        // The bot can disappear (deleted elsewhere) while this watched value is still evaluated.
        if (!this.bot) return LOGIN_PHASE.DISABLED;

        return resolveLoginPhase(this.bot, {
          attempted: this.attempted,
          ignoreQr: this.methodChosen && this.chosenMethod === LOGIN_METHOD.CREDENTIALS,
        });
      },
      showMethodChoice() {
        return canChooseLoginMethod(this.bot, this.phase, { headless: this.isRunningHeadless });
      },
      // Running, not headless, no QR session and no method sent from here (or it stalled): ASF waits in its console.
      consolePending() {
        return !this.isRunningHeadless && this.bot.active && (!this.methodChosen || this.qrStalled);
      },
      inputType() {
        return getUserInputType(this.bot.requiredInput);
      },
      inputKey() {
        return String(this.inputType || '').toLowerCase();
      },
      inputRoute() {
        return getInputRoute(this.bot);
      },
      unsupportedType() {
        return this.inputType || String(this.bot.requiredInput);
      },
      // The bot is running and ASF is not headless: the same question may also be pending in its console.
      consoleHint() {
        return this.phase === LOGIN_PHASE.CODE && this.bot.active && !this.isRunningHeadless;
      },
      canCancel() {
        return [LOGIN_PHASE.CODE, LOGIN_PHASE.QR, LOGIN_PHASE.QR_PENDING, LOGIN_PHASE.CONNECTING].includes(this.phase) && this.bot.active;
      },
      insecureRemote() {
        return window.location.protocol === 'http:' && !LOCAL_HOSTS.includes(window.location.hostname);
      },
    },
    watch: {
      '$route.params.bot': 'resetLocalState',
      'bot.active': {
        immediate: true,
        handler(active) {
          if (active) this.attempted = true;
        },
      },
      phase(value) {
        if (value !== LOGIN_PHASE.CODE) this.code = '';

        this.clearQrStallTimer();
        this.qrStalled = false;

        if (value === LOGIN_PHASE.QR_PENDING && this.bot && this.bot.active) {
          this.qrStallTimer = setTimeout(() => {
            this.qrStalled = true;
          }, QR_STALL_MS);
        }

        // Whatever ended or replaced the attempt, the next one starts with a fresh choice.
        if (![LOGIN_PHASE.QR_PENDING, LOGIN_PHASE.QR, LOGIN_PHASE.CONNECTING, LOGIN_PHASE.CODE, LOGIN_PHASE.CREDENTIAL].includes(value)) {
          this.methodChosen = false;
          this.chosenMethod = null;
        }

        if (value === LOGIN_PHASE.CONNECTED) {
          this.awaitingResult = false;
          this.rejected = false;
        } else if (value === LOGIN_PHASE.CODE && this.awaitingResult && Date.now() - this.submittedAt > REJECT_GRACE_MS) {
          // ASF asked again after we sent a code: Steam did not accept it.
          this.awaitingResult = false;
          this.rejected = true;
        }

        if (value === LOGIN_PHASE.CODE) this.$nextTick(() => this.$refs.codeInput && this.$refs.codeInput.focus());
      },
    },
    created() {
      if (!this.bot) this.$router.replace({ name: 'bots' });
    },
    beforeDestroy() {
      this.destroyed = true;
      this.code = '';
      this.clearCredentials();
      this.clearQrStallTimer();
    },
    methods: {
      clearQrStallTimer() {
        if (this.qrStallTimer) clearTimeout(this.qrStallTimer);
        this.qrStallTimer = null;
      },
      clearCredentials() {
        this.loginName = '';
        this.loginPassword = '';
      },
      closeCredentials() {
        this.clearCredentials();
        this.credentialsOpen = false;
      },
      startWithCredentials() {
        const login = this.loginName.trim();
        const password = this.loginPassword;

        // Both or none: ASF would otherwise ask for the missing one in its console.
        if (!!login !== !!password) {
          this.$error(this.$t('bot-login-method-credentials-incomplete'));
          return Promise.resolve();
        }

        return this.startWithMethod(LOGIN_METHOD.CREDENTIALS, { login, password });
      },
      async startWithMethod(method, { login = '', password = '' } = {}) {
        if (this.starting || !this.bot) return;

        const { name } = this.bot;
        this.starting = true;
        this.rejected = false;
        this.awaitingResult = false;

        try {
          await startWithLoginMethod(name, { method, login, password });

          // The view moved on to another bot or was closed while waiting.
          if (this.destroyed || this.$route.params.bot !== name) return;

          this.attempted = true;
          this.chosenMethod = method;
          this.methodChosen = true;
          this.qrStalled = false;
        } catch (err) {
          if (err instanceof InputChangedError) {
            this.$info(this.$t('bot-login-input-changed'));
            await this.refresh();
          } else {
            this.$error(err.message);
          }
        } finally {
          // The secrets are never needed again, whatever the outcome.
          this.clearCredentials();
          this.credentialsOpen = false;

          if (!this.destroyed) this.starting = false;
        }
      },
      resetLocalState() {
        this.code = '';
        this.clearCredentials();
        this.credentialsOpen = false;
        this.methodChosen = false;
        this.chosenMethod = null;
        this.qrStalled = false;
        this.clearQrStallTimer();
        this.attempted = false;
        this.awaitingResult = false;
        this.rejected = false;
        this.sentWhileRunning = false;
        this.submitting = false;
        this.starting = false;
        this.stopping = false;
      },
      // The global poll already refreshes every bot; this asks for the open bot only, one request at a time.
      async refresh() {
        if (this.refreshing || !this.bot) return;

        this.refreshing = true;

        try {
          await this.$store.dispatch('bots/updateBot', { name: this.$route.params.bot });
        } finally {
          if (!this.destroyed) this.refreshing = false;
        }
      },
      async start() {
        if (this.starting || !this.bot) return;

        const { name } = this.bot;
        this.starting = true;
        this.rejected = false;
        this.awaitingResult = false;

        try {
          await this.$http.botAction(name, 'start');
          this.attempted = true;
          await this.$store.dispatch('bots/updateBot', { name });
        } catch (err) {
          this.$error(err.message);
        } finally {
          if (!this.destroyed) this.starting = false;
        }
      },
      async cancel() {
        if (this.stopping || !this.bot) return;

        const { name } = this.bot;
        this.stopping = true;
        this.awaitingResult = false;

        try {
          await this.$http.botAction(name, 'stop');
          this.attempted = true;
          await this.$store.dispatch('bots/updateBot', { name });
        } catch (err) {
          this.$error(err.message);
        } finally {
          if (!this.destroyed) this.stopping = false;
        }
      },
      async submitCode() {
        if (this.submitting || this.phase !== LOGIN_PHASE.CODE) return;

        const botName = this.bot.name;
        const type = this.inputType;
        const { value, valid } = normalizeLoginCode(type, this.code);

        if (!value) {
          this.$error(this.$t(`input-no-code-${this.inputKey}`));
          return;
        }

        if (!valid) {
          this.$error(this.$t('bot-login-code-length'));
          return;
        }

        this.submitting = true;
        this.rejected = false;
        this.awaitingResult = false;

        try {
          const { wasRunning } = await submitBotInput(botName, type, value);

          // The view moved on to another bot or was closed while waiting.
          if (this.destroyed || this.$route.params.bot !== botName) return;

          this.code = '';
          this.attempted = true;
          this.sentWhileRunning = wasRunning;
          this.submittedAt = Date.now();
          // ASF only stored the code. Success is shown once the bot reports it is connected.
          this.awaitingResult = true;
        } catch (err) {
          if (err instanceof InputChangedError) {
            this.$info(this.$t('bot-login-input-changed'));
            await this.refresh();
          } else {
            this.$error(err.message);
          }
        } finally {
          if (!this.destroyed) this.submitting = false;
        }
      },
    },
  };
</script>

<style lang="scss">
  .main-container--bot-login {
    min-width: min(26rem, 100%);
  }

  .bot-login__body {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .bot-login__choices {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    justify-content: center;
  }

  .bot-login__section {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    padding: 0.75rem 0 0.25rem;
    text-align: center;
  }

  .bot-login__heading {
    color: var(--h2-ink, var(--color-text));
    font-size: 1.05rem;
    font-weight: 650;
    margin: 0;
  }

  .bot-login__text,
  .bot-login__hint {
    color: var(--h2-muted, var(--color-text-disabled));
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0;
    max-width: 30rem;
  }

  .bot-login__hint {
    font-size: 0.8rem;
  }

  .bot-login__icon {
    color: var(--h2-brand, var(--color-theme));
    font-size: 1.75rem;

    &--ok {
      color: #16a34a;
    }

    &--warn {
      color: #d97706;
    }
  }

  .bot-login__notice {
    align-items: flex-start;
    background: var(--h2-soft, rgba(255, 255, 255, 0.06));
    border: 1px solid var(--h2-border, rgba(255, 255, 255, 0.12));
    border-radius: 0.6rem;
    color: var(--h2-muted-2, var(--color-text));
    display: flex;
    font-size: 0.85rem;
    gap: 0.5rem;
    line-height: 1.45;
    margin: 0;
    padding: 0.6rem 0.75rem;
    text-align: left;
    width: 100%;

    &--warn {
      border-color: rgba(217, 119, 6, 0.5);
    }
  }

  .bot-login__form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 18rem;
    text-align: left;
    width: 100%;
  }

  .bot-login__label {
    color: var(--h2-muted, var(--color-text-disabled));
    font-size: 0.8rem;
    font-weight: 650;
  }

  .bot-login__input {
    font-size: 1.1rem;
    letter-spacing: 0.2em;
    text-align: center;
    text-transform: uppercase;

    // Account credentials are case sensitive: show them exactly as typed.
    &--plain {
      letter-spacing: normal;
      text-align: left;
      text-transform: none;
    }
  }
</style>
