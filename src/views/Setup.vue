<template>
  <main class="setup-page" :class="{ 'is-dark': darkMode }">
    <div class="setup-page__atmosphere" aria-hidden="true"></div>

    <div class="setup-page__top">
      <button
        type="button"
        class="setup-page__settings"
        :aria-label="$t('sidebar-toggle')"
        :aria-expanded="sideMenu ? 'true' : 'false'"
        @click="toggleSideMenu"
      >
        <FontAwesomeIcon icon="cogs" fixedWidth></FontAwesomeIcon>
      </button>
    </div>

    <section class="setup-page__card" aria-labelledby="setup-title">
      <div class="setup-page__brand">
        <img class="setup-page__logo" :src="logoSrc" alt="" width="56" height="56">
        <p class="setup-page__eyebrow">{{ $t('home-brand') }}</p>
        <h1 id="setup-title" class="setup-page__title">{{ $t('setup') }}</h1>
        <p class="setup-page__lead">{{ setupLead }}</p>
      </div>

      <div v-if="status === 'AUTHENTICATED'" class="setup-page__status" role="status">
        <FontAwesomeIcon v-if="waiting" icon="spinner" spin class="setup-page__spinner"></FontAwesomeIcon>
        <p v-if="$route.params.restart">{{ $t('setup-restart') }}</p>
        <p v-else-if="$route.params.update">{{ $t('setup-update') }}</p>
        <p v-else>{{ $t('setup-authenticated') }}</p>
      </div>

      <p v-else-if="statusText" class="setup-page__status" role="status" v-html="statusText"></p>

      <div v-if="status === 'UNAUTHORIZED'" class="setup-page__form">
        <label class="setup-page__label" for="setup-password">{{ $t('password') }}</label>
        <div class="setup-page__field">
          <input
            id="setup-password"
            v-model="password"
            class="setup-page__input"
            :type="inputHidden ? 'password' : 'text'"
            autocomplete="current-password"
            :disabled="processing"
            @keydown.enter="onButtonClick"
          >
          <button
            type="button"
            class="setup-page__reveal"
            :aria-label="tooltip"
            @click="switchInputType"
          >
            <FontAwesomeIcon :icon="inputHidden ? 'eye' : 'eye-slash'" fixedWidth></FontAwesomeIcon>
          </button>
        </div>
      </div>

      <button
        v-if="status !== 'AUTHENTICATED'"
        type="button"
        class="setup-page__submit"
        :disabled="processing || (status === 'UNAUTHORIZED' && !password)"
        @click="onButtonClick"
      >
        <FontAwesomeIcon v-if="processing" icon="spinner" spin></FontAwesomeIcon>
        <span v-else>{{ buttonText }}</span>
      </button>
    </section>
  </main>
</template>

<script>
  import { mapActions, mapGetters } from 'vuex';
  import { STATUS } from '../utils/getStatus';
  import { clearAuthenticationRequiredCache } from '../utils/ipc-password-status';
  import waitForRestart from '../utils/waitForRestart';

  export default {
    name: 'Setup',
    metaInfo() {
      return {
        title: this.$t('setup'),
      };
    },
    data() {
      return {
        password: this.$store.getters['auth/password'],
        processing: false,
        countdown: 5,
        timer: null,
        inputHidden: true,
      };
    },
    computed: {
      ...mapGetters({
        status: 'auth/status',
        darkMode: 'storage/darkMode',
        sideMenu: 'layout/sideMenu',
      }),
      logoSrc() {
        return (window.__BASE_PATH__) ? `${window.__BASE_PATH__}images/logo.webp` : '/images/logo.webp';
      },
      waiting() {
        return this.processing && (this.$route.params.restart || this.$route.params.update);
      },
      setupLead() {
        return this.$t('setup-description-short');
      },
      buttonText() {
        switch (this.status) {
          case STATUS.UNAUTHORIZED:
          case STATUS.AUTHENTICATED:
            return this.$t('continue');
          default:
            return this.$t('refresh');
        }
      },
      statusText() {
        switch (this.status) {
          case STATUS.UNAUTHORIZED:
            return this.$t('setup-description');
          case STATUS.NOT_CONNECTED:
            return this.$t('setup-not-connected');
          case STATUS.GATEWAY_TIMEOUT:
            return this.$t('setup-gateway-timeout', { n: this.countdown });
          case STATUS.NETWORK_ERROR:
            return this.$t('setup-network-error', { n: this.countdown });
          case STATUS.NO_IPC_PASSWORD:
            return this.$t('setup-no-ipc-password');
          case STATUS.RATE_LIMITED:
            return this.$t('setup-rate-limited');
          default:
            return null;
        }
      },
      tooltip() {
        return this.inputHidden ? this.$t('input-switch-show') : this.$t('input-switch-hide');
      },
    },
    watch: {
      status() {
        this.cancelAutoUpdate();
        this.checkStatus();
      },
      countdown: {
        immediate: true,
        handler(value) {
          if (value > 0) setTimeout(() => this.countdown--, 1000);
          if (value === 0) this.countdown = 5;
        },
      },
      $route: {
        immediate: true,
        async handler() {
          if (this.$route.params.restart) await this.handleWaiting('restart');
          else if (this.$route.params.update) await this.handleWaiting('update');
          else this.checkStatus();
        },
      },
      sideMenu(value) {
        if (value) window.addEventListener('click', this.onWindowClick);
        else window.removeEventListener('click', this.onWindowClick);
      },
    },
    beforeDestroy() {
      this.cancelAutoUpdate();
      window.removeEventListener('click', this.onWindowClick);
    },
    mounted() {
      this.onButtonClick();
    },
    methods: {
      ...mapActions({
        toggleSideMenu: 'layout/toggleSideMenu',
      }),
      onWindowClick(event) {
        const path = event.path || (event.composedPath && event.composedPath());
        const sideMenu = document.getElementById('side-menu');
        const top = this.$el && this.$el.querySelector('.setup-page__top');
        if ((path && ((top && path.includes(top)) || path.includes(sideMenu)))
          || (top && top.contains(event.target))
          || (sideMenu && sideMenu.contains(event.target))) {
          return;
        }
        this.toggleSideMenu();
      },
      switchInputType() {
        this.inputHidden = !this.inputHidden;
      },
      async handleWaiting(mode = 'restart') {
        this.processing = true;
        await waitForRestart();
        clearAuthenticationRequiredCache();
        await this.$store.dispatch('auth/setPassword', null);
        await this.$store.dispatch('auth/updateStatus');
        if (mode === 'restart') this.$success(this.$t('restart-complete'));
        else if (mode === 'update') this.$success(this.$t('update-complete'));
        this.processing = false;
        this.checkStatus();
      },
      async onButtonClick() {
        if (this.processing) return;

        switch (this.status) {
          case STATUS.UNAUTHORIZED:
            this.updatePassword();
            break;
          case STATUS.AUTHENTICATED:
            this.redirect();
            break;
          default:
            this.refreshStatus();
        }
      },
      async updatePassword() {
        this.processing = true;

        clearAuthenticationRequiredCache();

        try {
          await this.$store.dispatch('auth/setPassword', this.password);

          const validPassword = await this.$store.dispatch('auth/validate');
          if (validPassword) {
            this.redirect();
          } else {
            await this.resetPassword();
            this.$error(this.$t('password-invalid'));
          }
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.processing = false;
        }
      },
      async refreshStatus() {
        this.processing = true;

        try {
          await this.$store.dispatch('auth/updateStatus');
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.processing = false;
        }
      },
      redirect() {
        this.$router.replace({ name: 'home' }, () => {}, () => {});
      },
      cancelAutoUpdate() {
        clearInterval(this.timer);
      },
      async checkStatus() {
        switch (this.status) {
          case STATUS.AUTHENTICATED:
            this.redirect();
            break;
          case STATUS.UNAUTHORIZED:
            this.cancelAutoUpdate();
            await this.resetPassword();
            this.$router.replace({ name: 'login' });
            break;
          case STATUS.RATE_LIMITED:
            this.cancelAutoUpdate();
            break;
          case STATUS.NO_IPC_PASSWORD:
            this.cancelAutoUpdate();
            await this.resetPassword();
            break;
          default:
            this.timer = setInterval(this.refreshStatus, this.countdown * 1000);
        }
      },
      async resetPassword() {
        this.password = null;
        await this.$store.dispatch('auth/setPassword', this.password);
      },
    },
  };
</script>

<style lang="scss">
  .setup-page {
    --setup-ink: #101828;
    --setup-muted: #667085;
    --setup-shell: #ffffff;
    --setup-soft: #f2f4f7;
    --setup-border: #e4e7ec;
    --setup-brand: #0968e5;
    --setup-brand-600: #0757c2;
    --setup-brand-50: rgba(9, 104, 229, 0.12);
    --setup-surface: #f7f9fb;

    align-items: center;
    background: var(--setup-surface);
    box-sizing: border-box;
    color: var(--setup-ink);
    display: flex;
    flex-direction: column;
    font-family: var(--h2-font, 'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif);
    justify-content: center;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 1.5rem;
    position: relative;

    &.is-dark {
      --setup-ink: #f8fafc;
      --setup-muted: #94a3b8;
      --setup-shell: #1b2233;
      --setup-soft: #232c40;
      --setup-border: rgba(255, 255, 255, 0.08);
      --setup-brand: #4f8cff;
      --setup-brand-600: #3b6fd4;
      --setup-brand-50: rgba(79, 140, 255, 0.14);
      --setup-surface: #111827;
    }
  }

  .setup-page__atmosphere {
    background:
      radial-gradient(ellipse 70% 50% at 15% 10%, rgba(9, 104, 229, 0.16), transparent 55%),
      radial-gradient(ellipse 55% 45% at 90% 85%, rgba(9, 104, 229, 0.1), transparent 50%);
    inset: 0;
    pointer-events: none;
    position: absolute;

    .setup-page.is-dark & {
      background:
        radial-gradient(ellipse 70% 50% at 15% 10%, rgba(79, 140, 255, 0.18), transparent 55%),
        radial-gradient(ellipse 55% 45% at 90% 85%, rgba(79, 140, 255, 0.1), transparent 50%);
    }
  }

  .setup-page__top {
    align-items: center;
    display: flex;
    gap: 0.4rem;
    justify-content: flex-end;
    position: absolute;
    right: 1.25rem;
    top: 1.25rem;
    z-index: 2;
  }

  .setup-page__settings {
    align-items: center;
    background: var(--setup-shell);
    border: 1px solid var(--setup-border);
    border-radius: 0.75rem;
    color: var(--setup-muted);
    cursor: pointer;
    display: inline-flex;
    height: 2.5rem;
    justify-content: center;
    width: 2.5rem;

    &:hover,
    &:focus-visible {
      color: var(--setup-ink);
      outline: none;
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px var(--setup-brand-50);
    }
  }

  .setup-page__card {
    background: var(--setup-shell);
    border: 1px solid var(--setup-border);
    border-radius: 1.25rem;
    box-shadow: 0 18px 40px rgba(16, 24, 40, 0.08);
    box-sizing: border-box;
    max-width: 26rem;
    padding: 1.75rem 1.6rem 1.7rem;
    position: relative;
    width: 100%;
    z-index: 1;

    .setup-page.is-dark & {
      box-shadow: 0 22px 48px rgba(0, 0, 0, 0.35);
    }
  }

  .setup-page__brand {
    margin-bottom: 1.2rem;
    text-align: center;
  }

  .setup-page__logo {
    display: block;
    height: 3.5rem;
    margin: 0 auto 0.85rem;
    width: 3.5rem;
  }

  .setup-page__eyebrow {
    color: var(--setup-brand-600);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin: 0;
    text-transform: uppercase;
  }

  .setup-page__title {
    font-size: 1.55rem;
    font-weight: 750;
    letter-spacing: -0.03em;
    margin: 0.4rem 0 0;
  }

  .setup-page__lead {
    color: var(--setup-muted);
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0.45rem 0 0;
  }

  .setup-page__status {
    align-items: center;
    color: var(--setup-muted);
    display: flex;
    flex-direction: column;
    font-size: 0.92rem;
    gap: 0.65rem;
    line-height: 1.5;
    margin: 0 0 1.1rem;
    text-align: center;

    a {
      color: var(--setup-brand);
    }

    p {
      margin: 0;
    }
  }

  .setup-page__spinner {
    color: var(--setup-brand);
    font-size: 1.35rem;
  }

  .setup-page__form {
    margin-bottom: 1rem;
  }

  .setup-page__label {
    color: var(--setup-ink);
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 0.4rem;
  }

  .setup-page__field {
    display: flex;
    gap: 0.45rem;
  }

  .setup-page__input {
    background: var(--setup-soft);
    border: 1px solid var(--setup-border);
    border-radius: 0.7rem;
    box-sizing: border-box;
    color: var(--setup-ink);
    flex: 1;
    font-family: inherit;
    font-size: 0.95rem;
    min-height: 2.75rem;
    padding: 0 0.9rem;

    &:focus {
      border-color: var(--setup-brand);
      box-shadow: 0 0 0 3px var(--setup-brand-50);
      outline: none;
    }
  }

  .setup-page__reveal {
    align-items: center;
    background: var(--setup-soft);
    border: 1px solid var(--setup-border);
    border-radius: 0.7rem;
    color: var(--setup-muted);
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    height: 2.75rem;
    justify-content: center;
    width: 2.75rem;

    &:hover,
    &:focus-visible {
      color: var(--setup-ink);
      outline: none;
    }
  }

  .setup-page__submit {
    align-items: center;
    background: var(--setup-brand);
    border: 0;
    border-radius: 0.75rem;
    color: #fff;
    cursor: pointer;
    display: inline-flex;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 650;
    gap: 0.45rem;
    justify-content: center;
    min-height: 2.75rem;
    width: 100%;

    &:hover:not(:disabled),
    &:focus-visible:not(:disabled) {
      background: var(--setup-brand-600);
      outline: none;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  }
</style>
