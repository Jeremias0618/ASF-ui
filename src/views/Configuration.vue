<template>
  <main class="configuration-page home2-page-body">
    <div v-if="loading" class="configuration-page__loading" role="status" aria-live="polite">
      <FontAwesomeIcon icon="spinner" size="lg" spin></FontAwesomeIcon>
    </div>

    <template v-else>
      <header class="configuration-page__intro">
        <div>
          <p class="configuration-page__eyebrow">{{ $t('home2-section-config') }}</p>
          <h1 class="configuration-page__title">{{ $t('configuration') }}</h1>
          <p class="configuration-page__lead">{{ $t('configuration-lead') }}</p>
        </div>
      </header>

      <section class="configuration-page__block" aria-labelledby="configuration-password-heading">
        <div class="configuration-page__block-head">
          <span class="configuration-page__step-num" aria-hidden="true">
            <FontAwesomeIcon icon="lock"></FontAwesomeIcon>
          </span>
          <div>
            <h2 id="configuration-password-heading" class="configuration-page__heading">
              {{ $t('configuration-password-title') }}
            </h2>
            <p class="configuration-page__help">{{ statusHelp }}</p>
          </div>
        </div>

        <p
          class="configuration-page__badge"
          :class="passwordRequired ? 'is-protected' : 'is-open'"
          role="status"
        >
          {{ passwordRequired ? $t('configuration-status-protected') : $t('configuration-status-open') }}
        </p>

        <p v-if="probeState === IPC_PASSWORD_STATE.FORBIDDEN" class="configuration-page__notice" role="status">
          {{ $t('configuration-status-forbidden') }}
        </p>

        <div class="configuration-page__field">
          <label class="configuration-page__label" for="configuration-password">
            {{ passwordRequired ? $t('configuration-password-new') : $t('configuration-password') }}
          </label>
          <div class="configuration-page__password">
            <input
              id="configuration-password"
              v-model="password"
              class="configuration-page__input configuration-page__input--password"
              :type="passwordHidden ? 'password' : 'text'"
              autocomplete="new-password"
              :placeholder="$t('configuration-password-placeholder')"
              :disabled="saving || clearing"
              :aria-invalid="validationError ? 'true' : 'false'"
              :aria-describedby="validationError ? 'configuration-password-error' : 'configuration-password-hint'"
            >
            <button
              type="button"
              class="configuration-page__reveal"
              :aria-label="passwordRevealLabel"
              :disabled="saving || clearing"
              @click="passwordHidden = !passwordHidden"
            >
              <FontAwesomeIcon :icon="passwordHidden ? 'eye' : 'eye-slash'" fixedWidth></FontAwesomeIcon>
            </button>
          </div>
        </div>

        <div class="configuration-page__field">
          <label class="configuration-page__label" for="configuration-password-confirm">
            {{ $t('configuration-password-confirm') }}
          </label>
          <div class="configuration-page__password">
            <input
              id="configuration-password-confirm"
              v-model="passwordConfirm"
              class="configuration-page__input configuration-page__input--password"
              :type="passwordHidden ? 'password' : 'text'"
              autocomplete="new-password"
              :placeholder="$t('configuration-password-confirm-placeholder')"
              :disabled="saving || clearing"
            >
          </div>
        </div>

        <p
          v-if="validationError"
          id="configuration-password-error"
          class="configuration-page__error"
          role="alert"
        >
          {{ validationError }}
        </p>
        <p id="configuration-password-hint" class="configuration-page__hint">
          {{ $t('configuration-password-hint') }}
        </p>

        <div class="configuration-page__actions">
          <button
            type="button"
            class="button button--confirm configuration-page__btn"
            :disabled="saving || clearing || !canSave"
            @click="onSavePassword"
          >
            <FontAwesomeIcon v-if="saving" icon="spinner" spin></FontAwesomeIcon>
            <span v-else>
              {{ passwordRequired ? $t('configuration-save-password') : $t('configuration-create-password') }}
            </span>
          </button>

          <button
            v-if="passwordRequired"
            type="button"
            class="button configuration-page__btn configuration-page__btn--danger"
            :disabled="saving || clearing"
            @click="onClearPassword"
          >
            <FontAwesomeIcon v-if="clearing" icon="spinner" spin></FontAwesomeIcon>
            <span v-else>{{ $t('configuration-password-clear') }}</span>
          </button>
        </div>
      </section>
    </template>
  </main>
</template>

<script>
  import unsavedChangesMixin from '../mixins/unsaved-changes';
  import { markClean } from '../utils/unsaved-changes';
  import {
    IPC_PASSWORD_STATE,
    clearAuthenticationRequiredCache,
    isIpcPasswordRequired,
    probeIpcPasswordState,
  } from '../utils/ipc-password-status';

  const MIN_PASSWORD_LENGTH = 4;

  export default {
    name: 'Configuration',
    mixins: [unsavedChangesMixin],
    metaInfo() {
      return {
        title: this.$t('configuration'),
      };
    },
    data() {
      return {
        IPC_PASSWORD_STATE,
        loading: true,
        saving: false,
        clearing: false,
        probeState: IPC_PASSWORD_STATE.UNKNOWN,
        password: '',
        passwordConfirm: '',
        passwordHidden: true,
      };
    },
    computed: {
      passwordRequired() {
        return isIpcPasswordRequired(this.probeState);
      },
      statusHelp() {
        if (this.probeState === IPC_PASSWORD_STATE.FORBIDDEN) {
          return this.$t('configuration-status-forbidden');
        }
        return this.passwordRequired
          ? this.$t('configuration-password-set')
          : this.$t('configuration-password-unset');
      },
      passwordRevealLabel() {
        return this.passwordHidden ? this.$t('input-switch-show') : this.$t('input-switch-hide');
      },
      trimmedPassword() {
        return this.password.trim();
      },
      trimmedConfirm() {
        return this.passwordConfirm.trim();
      },
      validationError() {
        if (!this.trimmedPassword && !this.trimmedConfirm) return '';
        if (this.trimmedPassword.length > 0 && this.trimmedPassword.length < MIN_PASSWORD_LENGTH) {
          return this.$t('configuration-password-too-short', { n: MIN_PASSWORD_LENGTH });
        }
        if (this.trimmedPassword !== this.trimmedConfirm) {
          return this.$t('configuration-password-mismatch');
        }
        return '';
      },
      canSave() {
        return Boolean(this.trimmedPassword)
          && this.trimmedPassword.length >= MIN_PASSWORD_LENGTH
          && this.trimmedPassword === this.trimmedConfirm
          && !this.validationError;
      },
      isDirty() {
        if (this.loading || this.saving || this.clearing) return false;
        return Boolean(this.trimmedPassword || this.trimmedConfirm);
      },
      unsavedChangesMessage() {
        return this.$t('unsaved-changes-confirm');
      },
    },
    async created() {
      await this.bootstrap();
    },
    methods: {
      clearDraft() {
        this.password = '';
        this.passwordConfirm = '';
      },
      async bootstrap() {
        this.loading = true;
        try {
          this.probeState = await probeIpcPasswordState();
        } catch (err) {
          this.$error(err.message);
          this.probeState = IPC_PASSWORD_STATE.UNKNOWN;
        } finally {
          this.loading = false;
        }
      },
      async buildGlobalConfig(nextPassword) {
        const { GlobalConfig: current } = await this.$http.get('asf');
        const globalConfig = { ...current };

        Object.keys(globalConfig).forEach(key => {
          if (key.startsWith('s_')) delete globalConfig[key.substr(2)];
        });

        // Explicit null clears IPCPassword (sets IsIPCPasswordSet on ASF deserialize).
        globalConfig.IPCPassword = nextPassword;
        return globalConfig;
      },
      async persistAndRestart(nextPassword) {
        const globalConfig = await this.buildGlobalConfig(nextPassword);
        await this.$http.post('asf', { globalConfig });

        clearAuthenticationRequiredCache();
        await this.$store.dispatch('auth/setPassword', null);
        this.clearDraft();
        markClean();

        this.$info(this.$t('restart-initiated'));
        this.$router.push({ name: 'setup', params: { restart: true } });
      },
      async onSavePassword() {
        if (this.saving || this.clearing || !this.canSave) return;

        this.saving = true;
        try {
          await this.persistAndRestart(this.trimmedPassword);
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.saving = false;
        }
      },
      async onClearPassword() {
        if (this.saving || this.clearing || !this.passwordRequired) return;
        if (!window.confirm(this.$t('configuration-password-clear-confirm'))) return;

        this.clearing = true;
        try {
          await this.persistAndRestart(null);
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.clearing = false;
        }
      },
    },
  };
</script>

<style lang="scss">
  .configuration-page {
    max-width: 40rem;
  }

  .configuration-page__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 12rem;
    color: var(--color-text-secondary, #8b95a8);
  }

  .configuration-page__intro {
    margin-bottom: 1.5rem;
  }

  .configuration-page__eyebrow {
    margin: 0 0 0.35rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-secondary, #8b95a8);
  }

  .configuration-page__title {
    margin: 0 0 0.5rem;
    font-size: 1.75rem;
    line-height: 1.2;
  }

  .configuration-page__lead {
    margin: 0;
    color: var(--color-text-secondary, #8b95a8);
    line-height: 1.5;
  }

  .configuration-page__block {
    padding: 1.35rem 1.4rem 1.5rem;
    border: 1px solid var(--color-border, rgba(127, 140, 160, 0.28));
    border-radius: 12px;
    background: var(--color-navigation, rgba(255, 255, 255, 0.04));
  }

  .configuration-page__block-head {
    display: flex;
    gap: 0.85rem;
    margin-bottom: 1rem;
  }

  .configuration-page__step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 2.25rem;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 10px;
    background: rgba(14, 117, 182, 0.14);
    color: var(--color-theme, #0e75b6);
  }

  .configuration-page__heading {
    margin: 0 0 0.25rem;
    font-size: 1.1rem;
  }

  .configuration-page__help {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-text-secondary, #8b95a8);
    line-height: 1.45;
  }

  .configuration-page__badge {
    display: inline-flex;
    align-items: center;
    margin: 0 0 1.1rem;
    padding: 0.35rem 0.7rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;

    &.is-protected {
      background: rgba(14, 117, 182, 0.16);
      color: var(--color-theme, #4f8cff);
    }

    &.is-open {
      background: rgba(34, 160, 107, 0.14);
      color: #3dcf8e;
    }
  }

  .configuration-page__notice {
    margin: 0 0 1rem;
    padding: 0.75rem 0.9rem;
    border-radius: 8px;
    background: rgba(234, 179, 8, 0.12);
    color: #eab308;
    font-size: 0.875rem;
    line-height: 1.45;
  }

  .configuration-page__field {
    margin-bottom: 1rem;
  }

  .configuration-page__label {
    display: block;
    margin-bottom: 0.4rem;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .configuration-page__password {
    position: relative;
  }

  .configuration-page__input {
    width: 100%;
    box-sizing: border-box;
    padding: 0.7rem 0.85rem;
    border: 1px solid var(--color-border, rgba(127, 140, 160, 0.35));
    border-radius: 8px;
    background: var(--color-background, #0f141c);
    color: inherit;
    font: inherit;

    &:focus {
      outline: 2px solid rgba(14, 117, 182, 0.45);
      outline-offset: 1px;
    }

    &:disabled {
      opacity: 0.55;
    }
  }

  .configuration-page__input--password {
    padding-right: 2.75rem;

    &::-ms-reveal,
    &::-ms-clear {
      display: none;
    }
  }

  .configuration-page__reveal {
    position: absolute;
    top: 50%;
    right: 0.35rem;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-secondary, #8b95a8);
    cursor: pointer;

    &:hover:not(:disabled),
    &:focus-visible {
      color: inherit;
      background: rgba(127, 140, 160, 0.12);
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  .configuration-page__error {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
    color: #f87171;
  }

  .configuration-page__hint {
    margin: 0 0 1.25rem;
    font-size: 0.85rem;
    color: var(--color-text-secondary, #8b95a8);
    line-height: 1.45;
  }

  .configuration-page__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .configuration-page__btn {
    min-width: 10rem;
  }

  .configuration-page__btn--danger {
    border-color: rgba(248, 113, 113, 0.45);
    color: #f87171;

    &:hover:not(:disabled),
    &:focus-visible {
      background: rgba(248, 113, 113, 0.12);
    }
  }
</style>
