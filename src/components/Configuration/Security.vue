<template>
  <ConfigurationSection
    icon="lock"
    :title="$t('configuration-password-title')"
    :lead="statusHelp"
    title-id="config-security-title"
  >
    <div v-if="loading" class="config-loading" role="status">
      <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
    </div>

    <template v-else>
      <p
        class="config-badge"
        :class="passwordRequired ? 'is-protected' : 'is-open'"
        role="status"
      >
        {{ passwordRequired ? $t('configuration-status-protected') : $t('configuration-status-open') }}
      </p>

      <p v-if="probeState === IPC_PASSWORD_STATE.FORBIDDEN" class="config-notice" role="status">
        {{ $t('configuration-status-forbidden') }}
      </p>

      <div class="config-field">
        <label class="config-field__label" for="configuration-password">
          {{ passwordRequired ? $t('configuration-password-new') : $t('configuration-password') }}
        </label>
        <div class="config-field__password">
          <input
            id="configuration-password"
            v-model="password"
            class="config-field__input config-field__input--password"
            :type="passwordHidden ? 'password' : 'text'"
            autocomplete="new-password"
            :placeholder="$t('configuration-password-placeholder')"
            :disabled="saving || clearing"
            :aria-invalid="validationError ? 'true' : 'false'"
            :aria-describedby="validationError ? 'configuration-password-error' : 'configuration-password-hint'"
          >
          <button
            type="button"
            class="config-field__reveal"
            :aria-label="passwordRevealLabel"
            :disabled="saving || clearing"
            @click="passwordHidden = !passwordHidden"
          >
            <FontAwesomeIcon :icon="passwordHidden ? 'eye' : 'eye-slash'" fixedWidth></FontAwesomeIcon>
          </button>
        </div>
      </div>

      <div class="config-field">
        <label class="config-field__label" for="configuration-password-confirm">
          {{ $t('configuration-password-confirm') }}
        </label>
        <input
          id="configuration-password-confirm"
          v-model="passwordConfirm"
          class="config-field__input"
          :type="passwordHidden ? 'password' : 'text'"
          autocomplete="new-password"
          :placeholder="$t('configuration-password-confirm-placeholder')"
          :disabled="saving || clearing"
        >
      </div>

      <p
        v-if="validationError"
        id="configuration-password-error"
        class="config-field__error"
        role="alert"
      >
        {{ validationError }}
      </p>
      <p id="configuration-password-hint" class="config-field__hint">
        {{ $t('configuration-password-hint') }}
      </p>

      <div class="config-actions">
        <button
          type="button"
          class="config-btn config-btn--primary"
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
          class="config-btn config-btn--danger"
          :disabled="saving || clearing"
          @click="onClearPassword"
        >
          <FontAwesomeIcon v-if="clearing" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ $t('configuration-password-clear') }}</span>
        </button>
      </div>
    </template>
  </ConfigurationSection>
</template>

<script>
  import unsavedChangesMixin from '../../mixins/unsaved-changes';
  import { markClean } from '../../utils/unsaved-changes';
  import {
    IPC_PASSWORD_STATE,
    clearAuthenticationRequiredCache,
    isIpcPasswordRequired,
    probeIpcPasswordState,
  } from '../../utils/ipc-password-status';
  import ConfigurationSection from './Section.vue';

  const MIN_PASSWORD_LENGTH = 4;

  export default {
    name: 'ConfigurationSecurity',
    components: { ConfigurationSection },
    mixins: [unsavedChangesMixin],
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
