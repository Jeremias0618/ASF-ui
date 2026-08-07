<template>
  <main class="login-page" :class="{ 'is-dark': darkMode }">
    <div class="login-page__atmosphere" aria-hidden="true"></div>

    <div class="login-page__top">
      <button
        type="button"
        class="login-page__theme"
        :aria-label="darkMode ? $t('home2-theme-light') : $t('home2-theme-dark')"
        @click="toggleTheme"
      >
        <FontAwesomeIcon :icon="darkMode ? 'sun' : 'moon'" fixedWidth></FontAwesomeIcon>
      </button>
    </div>

    <section class="login-page__card" aria-labelledby="login-title">
      <div class="login-page__brand">
        <img class="login-page__logo" :src="logoSrc" alt="" width="56" height="56">
        <p class="login-page__eyebrow">{{ $t('home-brand') }}</p>
        <h1 id="login-title" class="login-page__title">{{ $t('login-title') }}</h1>
        <p class="login-page__lead">{{ $t('login-lead') }}</p>
      </div>

      <p v-if="checking" class="login-page__status" role="status">{{ $t('connection') }}…</p>
      <p v-else-if="statusMessage" class="login-page__status" role="status">{{ statusMessage }}</p>

      <form v-if="showForm" class="login-page__form" @submit.prevent="onSubmit">
        <label class="login-page__label" for="login-password">{{ $t('password') }}</label>
        <div class="login-page__field">
          <input
            id="login-password"
            ref="passwordInput"
            v-model="password"
            class="login-page__input"
            :type="inputHidden ? 'password' : 'text'"
            autocomplete="current-password"
            :placeholder="$t('login-password-placeholder')"
            :disabled="processing"
          >
          <button
            type="button"
            class="login-page__reveal"
            :aria-label="tooltip"
            @click="switchInputType"
          >
            <FontAwesomeIcon :icon="inputHidden ? 'eye' : 'eye-slash'" fixedWidth></FontAwesomeIcon>
          </button>
        </div>

        <button type="submit" class="login-page__submit" :disabled="processing || !password">
          <FontAwesomeIcon v-if="processing" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ $t('login-submit') }}</span>
        </button>
      </form>
    </section>
  </main>
</template>

<script>
  import { mapGetters } from 'vuex';
  import { STATUS } from '../utils/getStatus';
  import { clearAuthenticationRequiredCache } from '../utils/ipc-password-status';

  export default {
    name: 'Login',
    metaInfo() {
      return {
        title: this.$t('login-title'),
      };
    },
    data() {
      return {
        password: '',
        processing: false,
        checking: true,
        inputHidden: true,
      };
    },
    computed: {
      ...mapGetters({
        status: 'auth/status',
        darkMode: 'storage/darkMode',
      }),
      logoSrc() {
        return (window.__BASE_PATH__) ? `${window.__BASE_PATH__}images/logo.webp` : '/images/logo.webp';
      },
      tooltip() {
        return this.inputHidden ? this.$t('input-switch-show') : this.$t('input-switch-hide');
      },
      statusMessage() {
        if (this.status === STATUS.RATE_LIMITED) return this.$t('setup-rate-limited');
        return null;
      },
      showForm() {
        return !this.checking && this.status !== STATUS.AUTHENTICATED;
      },
    },
    watch: {
      status(value) {
        if (value === STATUS.AUTHENTICATED) this.redirect();
      },
    },
    async created() {
      await this.recheckAccess();
    },
    methods: {
      async recheckAccess() {
        this.checking = true;
        try {
          clearAuthenticationRequiredCache();
          await this.$store.dispatch('auth/setPassword', null);
          await this.$store.dispatch('auth/updateStatus');
          if (this.status === STATUS.AUTHENTICATED) {
            this.redirect();
            return;
          }
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.checking = false;
          this.$nextTick(() => {
            if (this.showForm && this.$refs.passwordInput) this.$refs.passwordInput.focus();
          });
        }
      },
      toggleTheme() {
        this.$store.dispatch('storage/toggleDarkMode');
      },
      switchInputType() {
        this.inputHidden = !this.inputHidden;
      },
      async onSubmit() {
        if (this.processing || !this.password) return;
        this.processing = true;
        clearAuthenticationRequiredCache();

        try {
          await this.$store.dispatch('auth/setPassword', this.password);
          const validPassword = await this.$store.dispatch('auth/validate');

          if (validPassword) {
            this.redirect();
          } else {
            this.password = '';
            await this.$store.dispatch('auth/setPassword', null);
            this.$error(this.$t('password-invalid'));
            this.$nextTick(() => {
              if (this.$refs.passwordInput) this.$refs.passwordInput.focus();
            });
          }
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.processing = false;
        }
      },
      redirect() {
        this.$router.replace({ name: 'home' }, () => {}, () => {});
      },
    },
  };
</script>

<style lang="scss">
  .login-page {
    --login-ink: #101828;
    --login-muted: #667085;
    --login-shell: #ffffff;
    --login-soft: #f2f4f7;
    --login-border: #e4e7ec;
    --login-brand: #0968e5;
    --login-brand-600: #0757c2;
    --login-brand-50: #eff6ff;
    --login-surface: #eef2f7;

    align-items: center;
    background: var(--login-surface);
    box-sizing: border-box;
    color: var(--login-ink);
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 1.5rem;
    position: relative;

    &.is-dark {
      --login-ink: #f8fafc;
      --login-muted: #94a3b8;
      --login-shell: #1b2233;
      --login-soft: #232c40;
      --login-border: rgba(255, 255, 255, 0.08);
      --login-brand: #4f8cff;
      --login-brand-600: #3b6fd4;
      --login-brand-50: rgba(79, 140, 255, 0.14);
      --login-surface: #111827;
    }
  }

  .login-page__atmosphere {
    background:
      radial-gradient(ellipse 70% 50% at 15% 10%, rgba(9, 104, 229, 0.16), transparent 55%),
      radial-gradient(ellipse 55% 45% at 90% 85%, rgba(9, 104, 229, 0.1), transparent 50%);
    inset: 0;
    pointer-events: none;
    position: absolute;

    .login-page.is-dark & {
      background:
        radial-gradient(ellipse 70% 50% at 15% 10%, rgba(79, 140, 255, 0.18), transparent 55%),
        radial-gradient(ellipse 55% 45% at 90% 85%, rgba(79, 140, 255, 0.1), transparent 50%);
    }
  }

  .login-page__top {
    display: flex;
    justify-content: flex-end;
    position: absolute;
    right: 1.25rem;
    top: 1.25rem;
    z-index: 2;
  }

  .login-page__theme {
    align-items: center;
    background: var(--login-shell);
    border: 1px solid var(--login-border);
    border-radius: 999px;
    color: var(--login-muted);
    cursor: pointer;
    display: inline-flex;
    height: 2.5rem;
    justify-content: center;
    width: 2.5rem;

    &:hover,
    &:focus-visible {
      color: var(--login-ink);
      outline: none;
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px var(--login-brand-50);
    }
  }

  .login-page__card {
    background: var(--login-shell);
    border: 1px solid var(--login-border);
    border-radius: 1.25rem;
    box-shadow: 0 18px 40px rgba(16, 24, 40, 0.08);
    box-sizing: border-box;
    max-width: 26rem;
    padding: 1.75rem 1.6rem 1.7rem;
    position: relative;
    width: 100%;
    z-index: 1;

    .login-page.is-dark & {
      box-shadow: 0 22px 48px rgba(0, 0, 0, 0.35);
    }
  }

  .login-page__brand {
    margin-bottom: 1.35rem;
    text-align: center;
  }

  .login-page__logo {
    display: block;
    height: 3.5rem;
    margin: 0 auto 0.85rem;
    width: 3.5rem;
  }

  .login-page__eyebrow {
    color: var(--login-brand-600);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin: 0;
    text-transform: uppercase;
  }

  .login-page__title {
    font-size: 1.55rem;
    font-weight: 750;
    letter-spacing: -0.03em;
    margin: 0.4rem 0 0;
  }

  .login-page__lead {
    color: var(--login-muted);
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0.45rem 0 0;
  }

  .login-page__status {
    background: rgba(217, 45, 32, 0.1);
    border-radius: 0.75rem;
    color: #d92d20;
    font-size: 0.88rem;
    line-height: 1.45;
    margin: 0 0 1rem;
    padding: 0.75rem 0.85rem;

    .login-page.is-dark & {
      color: #fca5a5;
    }
  }

  .login-page__form {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .login-page__label {
    color: var(--login-muted);
    font-size: 0.82rem;
    font-weight: 700;
  }

  .login-page__field {
    min-width: 0;
    position: relative;
    width: 100%;
  }

  .login-page__input {
    background: var(--login-soft);
    border: 1px solid var(--login-border);
    border-radius: 0.8rem;
    box-sizing: border-box;
    color: var(--login-ink);
    display: block;
    font: inherit;
    min-height: 2.85rem;
    min-width: 0;
    padding: 0.7rem 2.75rem 0.7rem 0.9rem;
    width: 100%;

    &::-ms-reveal,
    &::-ms-clear {
      display: none;
    }

    &::-webkit-credentials-auto-fill-button {
      visibility: hidden;
    }

    &:focus {
      border-color: var(--login-brand);
      box-shadow: 0 0 0 3px var(--login-brand-50);
      outline: none;
    }

    &:disabled {
      opacity: 0.65;
    }
  }

  .login-page__reveal {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 0.5rem;
    color: var(--login-muted);
    cursor: pointer;
    display: inline-flex;
    height: 2.25rem;
    justify-content: center;
    padding: 0;
    position: absolute;
    right: 0.35rem;
    top: 50%;
    transform: translateY(-50%);
    width: 2.25rem;

    &:hover,
    &:focus-visible {
      color: var(--login-ink);
      outline: none;
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px var(--login-brand-50);
    }
  }

  .login-page__submit {
    align-items: center;
    background: var(--login-brand);
    border: 0;
    border-radius: 0.85rem;
    color: #fff;
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    font-weight: 700;
    justify-content: center;
    margin-top: 0.75rem;
    min-height: 2.95rem;
    width: 100%;

    &:hover:not(:disabled) {
      background: var(--login-brand-600);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px var(--login-brand-50);
      outline: none;
    }
  }
</style>
