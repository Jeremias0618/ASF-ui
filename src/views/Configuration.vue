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
          <p class="configuration-page__lead">{{ configurationLead }}</p>
        </div>
      </header>

      <section
        v-if="pluginAvailable === false"
        class="configuration-page__plugin-banner"
        role="status"
        aria-labelledby="configuration-plugin-missing-title"
      >
        <div class="configuration-page__plugin-banner-body">
          <h2 id="configuration-plugin-missing-title" class="configuration-page__plugin-banner-title">
            {{ $t('configuration-plugin-missing-title') }}
          </h2>
          <p>{{ $t('configuration-plugin-missing-text') }}</p>
          <ol class="configuration-page__plugin-steps">
            <li>{{ $t('configuration-plugin-step-1', { zip: IPC_CONFIG_PLUGIN.zipHint }) }}</li>
            <li>{{ $t('configuration-plugin-step-2', { path: IPC_CONFIG_PLUGIN.installPath }) }}</li>
            <li>{{ $t('configuration-plugin-step-3') }}</li>
          </ol>
          <p class="configuration-page__help">{{ $t('configuration-plugin-install-limit') }}</p>
        </div>
        <div class="configuration-page__plugin-banner-actions">
          <a
            class="button button--confirm configuration-page__btn"
            :href="IPC_CONFIG_PLUGIN.latestReleaseUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon="cloud-download-alt" fixedWidth></FontAwesomeIcon>
            {{ $t('configuration-plugin-download') }}
          </a>
          <button
            type="button"
            class="button configuration-page__btn configuration-page__btn--soft"
            :disabled="restarting"
            @click="onRestartAsf"
          >
            <FontAwesomeIcon v-if="restarting" icon="spinner" spin></FontAwesomeIcon>
            <span v-else>{{ $t('configuration-plugin-restart') }}</span>
          </button>
          <a
            class="configuration-page__plugin-link"
            :href="IPC_CONFIG_PLUGIN.readmeUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ $t('configuration-plugin-docs') }}
          </a>
        </div>
      </section>

      <section
        v-else-if="pluginAvailable === true"
        class="configuration-page__plugin-ok"
        role="status"
      >
        {{ $t('configuration-plugin-ready') }}
      </section>

      <div class="configuration-page__layout">
        <div class="configuration-page__main">
          <section class="configuration-page__block" aria-labelledby="configuration-where-heading">
            <div class="configuration-page__block-head">
              <span class="configuration-page__step-num" aria-hidden="true">1</span>
              <div>
                <h2 id="configuration-where-heading" class="configuration-page__heading">
                  {{ $t('configuration-where-title') }}
                </h2>
                <p class="configuration-page__help">{{ $t('configuration-where-help') }}</p>
              </div>
            </div>

            <div class="configuration-page__options" role="radiogroup" :aria-label="$t('configuration-where-title')">
              <button
                type="button"
                class="configuration-page__option"
                :class="{ 'is-active': !listenLan }"
                :aria-pressed="(!listenLan).toString()"
                @click="listenLan = false"
              >
                <span class="configuration-page__option-icon" aria-hidden="true">
                  <FontAwesomeIcon icon="laptop"></FontAwesomeIcon>
                </span>
                <span class="configuration-page__option-body">
                  <span class="configuration-page__option-title">{{ $t('configuration-mode-local') }}</span>
                  <span class="configuration-page__option-text">{{ $t('configuration-mode-local-help') }}</span>
                </span>
              </button>

              <button
                type="button"
                class="configuration-page__option"
                :class="{ 'is-active': listenLan }"
                :aria-pressed="listenLan.toString()"
                @click="listenLan = true"
              >
                <span class="configuration-page__option-icon" aria-hidden="true">
                  <FontAwesomeIcon icon="users"></FontAwesomeIcon>
                </span>
                <span class="configuration-page__option-body">
                  <span class="configuration-page__option-title">{{ $t('configuration-mode-lan') }}</span>
                  <span class="configuration-page__option-text">{{ $t('configuration-mode-lan-help') }}</span>
                </span>
              </button>
            </div>

            <div class="configuration-page__port-row">
              <label class="configuration-page__label configuration-page__label--inline" for="configuration-port">
                {{ $t('configuration-port-friendly') }}
              </label>
              <input
                id="configuration-port"
                v-model.number="port"
                class="configuration-page__input configuration-page__input--port"
                type="number"
                min="1"
                max="65535"
                step="1"
              >
              <p class="configuration-page__help configuration-page__help--inline">
                {{ $t('configuration-port-help') }}
              </p>
            </div>
          </section>

          <section class="configuration-page__block" aria-labelledby="configuration-password-heading">
            <div class="configuration-page__block-head">
              <span class="configuration-page__step-num" aria-hidden="true">2</span>
              <div>
                <h2 id="configuration-password-heading" class="configuration-page__heading">
                  {{ $t('configuration-password-title-friendly') }}
                </h2>
                <p class="configuration-page__help">
                  {{ hasPassword ? $t('configuration-password-set-friendly') : $t('configuration-password-unset-friendly') }}
                </p>
              </div>
            </div>

            <p v-if="listenLan" class="configuration-page__notice" role="status">
              {{ $t('configuration-password-lan-friendly') }}
            </p>

            <div class="configuration-page__field">
              <label class="configuration-page__label" for="configuration-password">
                {{ $t('configuration-password-friendly') }}
              </label>
              <div class="configuration-page__password">
                <input
                  id="configuration-password"
                  v-model="password"
                  class="configuration-page__input configuration-page__input--password"
                  :type="passwordHidden ? 'password' : 'text'"
                  autocomplete="new-password"
                  :placeholder="$t('configuration-password-placeholder')"
                  :disabled="clearPassword"
                >
                <button
                  type="button"
                  class="configuration-page__reveal"
                  :aria-label="passwordRevealLabel"
                  :disabled="clearPassword"
                  @click="passwordHidden = !passwordHidden"
                >
                  <FontAwesomeIcon :icon="passwordHidden ? 'eye' : 'eye-slash'" fixedWidth></FontAwesomeIcon>
                </button>
              </div>
            </div>

            <label v-if="!listenLan" class="configuration-page__check">
              <input v-model="clearPassword" type="checkbox">
              <span>{{ $t('configuration-password-clear-friendly') }}</span>
            </label>
          </section>

          <section
            v-if="listenLan"
            class="configuration-page__block configuration-page__block--enter"
            aria-labelledby="configuration-who-heading"
          >
            <div class="configuration-page__block-head">
              <span class="configuration-page__step-num" aria-hidden="true">3</span>
              <div>
                <h2 id="configuration-who-heading" class="configuration-page__heading">
                  {{ $t('configuration-who-title') }}
                </h2>
                <p class="configuration-page__help">{{ $t('configuration-who-help') }}</p>
              </div>
            </div>

            <div class="configuration-page__options" role="radiogroup" :aria-label="$t('configuration-who-title')">
              <button
                type="button"
                class="configuration-page__option"
                :class="{ 'is-active': accessMode === ACCESS_MODE.privateLan }"
                :aria-pressed="(accessMode === ACCESS_MODE.privateLan).toString()"
                @click="accessMode = ACCESS_MODE.privateLan"
              >
                <span class="configuration-page__option-body">
                  <span class="configuration-page__option-title">{{ $t('configuration-who-everyone') }}</span>
                  <span class="configuration-page__option-text">{{ $t('configuration-who-everyone-help') }}</span>
                </span>
              </button>

              <button
                type="button"
                class="configuration-page__option"
                :class="{ 'is-active': accessMode === ACCESS_MODE.custom }"
                :aria-pressed="(accessMode === ACCESS_MODE.custom).toString()"
                @click="accessMode = ACCESS_MODE.custom"
              >
                <span class="configuration-page__option-body">
                  <span class="configuration-page__option-title">{{ $t('configuration-who-specific') }}</span>
                  <span class="configuration-page__option-text">{{ $t('configuration-who-specific-help') }}</span>
                </span>
              </button>
            </div>

            <div v-if="accessMode === ACCESS_MODE.custom" class="configuration-page__devices">
              <div class="configuration-page__add-row">
                <input
                  v-model="cidrDraft"
                  class="configuration-page__input"
                  type="text"
                  :placeholder="$t('configuration-device-placeholder')"
                  :aria-invalid="cidrError ? 'true' : 'false'"
                  :aria-describedby="cidrError ? 'configuration-device-error' : 'configuration-device-hint'"
                  @keydown.enter.prevent="addCidr"
                >
                <button type="button" class="button button--confirm" @click="addCidr">
                  {{ $t('configuration-device-add') }}
                </button>
              </div>
              <p id="configuration-device-hint" class="configuration-page__help">
                {{ $t('configuration-device-hint') }}
              </p>
              <p v-if="cidrError" id="configuration-device-error" class="configuration-page__error" role="alert">
                {{ cidrError }}
              </p>
              <ul v-if="customNetworks.length" class="configuration-page__device-list">
                <li v-for="entry in customNetworks" :key="entry">
                  <span>{{ friendlyNetworkLabel(entry) }}</span>
                  <button
                    type="button"
                    class="configuration-page__remove"
                    :aria-label="$t('configuration-device-remove')"
                    @click="removeCidr(entry)"
                  >
                    <FontAwesomeIcon icon="trash"></FontAwesomeIcon>
                  </button>
                </li>
              </ul>
              <p v-else class="configuration-page__help">{{ $t('configuration-device-empty') }}</p>
            </div>
          </section>
        </div>

        <aside class="configuration-page__aside" aria-labelledby="configuration-finish-heading">
          <div class="configuration-page__aside-card">
            <h2 id="configuration-finish-heading" class="configuration-page__heading">
              {{ $t('configuration-finish-title') }}
            </h2>
            <p class="configuration-page__help">{{ $t('configuration-finish-help') }}</p>

            <ol class="configuration-page__checklist">
              <li>
                <strong>{{ $t('configuration-finish-1-title') }}</strong>
                <span>{{ $t('configuration-finish-1-text') }}</span>
              </li>
              <li>
                <strong>{{ pluginAvailable ? $t('configuration-finish-2-plugin-title') : $t('configuration-finish-2-title') }}</strong>
                <span>{{ pluginAvailable ? $t('configuration-finish-2-plugin-text') : $t('configuration-finish-2-text') }}</span>
              </li>
              <li v-if="!pluginAvailable">
                <strong>{{ $t('configuration-finish-3-title') }}</strong>
                <span>{{ $t('configuration-finish-3-text') }}</span>
              </li>
              <li>
                <strong>{{ $t('configuration-finish-4-title') }}</strong>
                <span>{{ finishRestartText }}</span>
              </li>
            </ol>

            <div class="configuration-page__summary">
              <p class="configuration-page__summary-label">{{ $t('configuration-summary') }}</p>
              <p>{{ summaryText }}</p>
            </div>

            <div class="configuration-page__actions">
              <button
                type="button"
                class="button button--confirm configuration-page__btn"
                :disabled="saving"
                @click="onSavePassword"
              >
                <FontAwesomeIcon v-if="saving" icon="spinner" spin></FontAwesomeIcon>
                <span v-else>{{ $t('configuration-save-password-friendly') }}</span>
              </button>
              <button
                v-if="pluginAvailable"
                type="button"
                class="button button--confirm configuration-page__btn"
                :disabled="applyingNetwork"
                @click="onApplyNetwork"
              >
                <FontAwesomeIcon v-if="applyingNetwork" icon="spinner" spin></FontAwesomeIcon>
                <span v-else>{{ $t('configuration-apply-network') }}</span>
              </button>
              <button
                type="button"
                class="button configuration-page__btn configuration-page__btn--soft"
                :disabled="downloading"
                @click="onDownloadIpcConfig"
              >
                <FontAwesomeIcon icon="cloud-download-alt" fixedWidth></FontAwesomeIcon>
                {{ pluginAvailable ? $t('configuration-download-backup') : $t('configuration-download-friendly') }}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </main>
</template>

<script>
  import {
    ACCESS_MODE,
    DEFAULT_IPC_PORT,
    PRIVATE_NETWORKS,
    buildIpcConfig,
    normalizeCidr,
    resolveKnownNetworks,
    serializeIpcConfig,
  } from '../utils/ipc-config';
  import {
    IPC_CONFIG_PLUGIN,
    buildIpcConfigApiBody,
    detectIpcConfigPlugin,
  } from '../utils/ipc-config-plugin';
  import { downloadRaw } from '../utils/download';
  import * as storage from '../utils/storage';
  import unsavedChangesMixin from '../mixins/unsaved-changes';
  import { markClean } from '../utils/unsaved-changes';

  const PREFS_KEY = 'configuration:lan-prefs';

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
        ACCESS_MODE,
        IPC_CONFIG_PLUGIN,
        loading: true,
        saving: false,
        applyingNetwork: false,
        downloading: false,
        restarting: false,
        pluginAvailable: null,
        hasPassword: false,
        password: '',
        clearPassword: false,
        listenLan: false,
        port: DEFAULT_IPC_PORT,
        accessMode: ACCESS_MODE.privateLan,
        customNetworks: [],
        cidrDraft: '',
        cidrError: '',
        networkBaseline: '',
        passwordHidden: true,
      };
    },
    computed: {
      configurationLead() {
        return this.pluginAvailable
          ? this.$t('configuration-lead-plugin')
          : this.$t('configuration-lead-friendly');
      },
      finishRestartText() {
        if (this.pluginAvailable) {
          return this.$t('configuration-finish-4-plugin');
        }
        return this.listenLan
          ? this.$t('configuration-finish-4-lan')
          : this.$t('configuration-finish-4-local');
      },
      passwordRevealLabel() {
        return this.passwordHidden ? this.$t('input-switch-show') : this.$t('input-switch-hide');
      },
      networkFingerprint() {
        return JSON.stringify({
          listenLan: this.listenLan,
          port: this.safePort,
          accessMode: this.accessMode,
          customNetworks: this.customNetworks,
        });
      },
      isDirty() {
        if (this.loading || !this.networkBaseline) return false;
        const networkDirty = this.networkFingerprint !== this.networkBaseline;
        const passwordDirty = Boolean(this.password.trim()) || this.clearPassword;
        return networkDirty || passwordDirty;
      },
      unsavedChangesMessage() {
        return this.$t('unsaved-changes-confirm');
      },
      summaryText() {
        const port = this.safePort;
        if (!this.listenLan) {
          return this.$t('configuration-summary-local', { port });
        }
        if (this.accessMode === ACCESS_MODE.custom) {
          const count = this.customNetworks.length;
          return this.$t('configuration-summary-lan-custom', { port, n: count });
        }
        return this.$t('configuration-summary-lan-all', { port });
      },
      safePort() {
        return Number.isInteger(this.port) && this.port > 0 && this.port <= 65535
          ? this.port
          : DEFAULT_IPC_PORT;
      },
    },
    watch: {
      listenLan(value) {
        if (value) this.clearPassword = false;
        this.persistPrefs();
      },
      accessMode() {
        this.persistPrefs();
      },
      port() {
        this.persistPrefs();
      },
      customNetworks: {
        deep: true,
        handler() {
          this.persistPrefs();
        },
      },
      clearPassword(value) {
        if (value) this.password = '';
      },
    },
    async created() {
      this.restorePrefs();
      await this.bootstrap();
    },
    methods: {
      friendlyNetworkLabel(entry) {
        if (typeof entry === 'string' && entry.endsWith('/32')) {
          return entry.slice(0, -3);
        }
        return entry;
      },
      restorePrefs() {
        const prefs = storage.get(PREFS_KEY, null);
        if (!prefs || typeof prefs !== 'object') return;

        if (typeof prefs.listenLan === 'boolean') this.listenLan = prefs.listenLan;
        if (Number.isInteger(prefs.port) && prefs.port > 0 && prefs.port <= 65535) this.port = prefs.port;
        if (prefs.accessMode === ACCESS_MODE.privateLan || prefs.accessMode === ACCESS_MODE.custom) {
          this.accessMode = prefs.accessMode;
        }
        if (Array.isArray(prefs.customNetworks)) {
          this.customNetworks = prefs.customNetworks
            .map(normalizeCidr)
            .filter(Boolean);
        }
      },
      persistPrefs() {
        storage.set(PREFS_KEY, {
          listenLan: this.listenLan,
          port: this.port,
          accessMode: this.accessMode,
          customNetworks: this.customNetworks,
        });
      },
      async bootstrap() {
        this.loading = true;
        try {
          const detection = await detectIpcConfigPlugin(this.$http);
          this.pluginAvailable = detection.available;

          const { GlobalConfig: model } = await this.$http.get('asf');
          this.hasPassword = Boolean(model && model.IPCPassword);

          if (this.pluginAvailable) {
            await this.loadIpcConfigFromPlugin();
          }
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.loading = false;
          this.$nextTick(() => {
            this.captureNetworkBaseline();
          });
        }
      },
      async loadIpcConfigFromPlugin() {
        try {
          const status = await this.$http.get('IpcConfig');
          if (!status) return;

          if (typeof status.ListenLan === 'boolean') this.listenLan = status.ListenLan;
          if (Number.isInteger(status.Port) && status.Port > 0 && status.Port <= 65535) {
            this.port = status.Port;
          }

          const networks = Array.isArray(status.KnownNetworks) ? status.KnownNetworks.map(normalizeCidr).filter(Boolean) : [];
          if (!networks.length) {
            this.accessMode = ACCESS_MODE.privateLan;
            return;
          }

          const privateSet = PRIVATE_NETWORKS.join('|');
          const currentSet = [...networks].sort().join('|');
          const privateSorted = [...PRIVATE_NETWORKS].sort().join('|');
          if (currentSet === privateSorted || currentSet === privateSet) {
            this.accessMode = ACCESS_MODE.privateLan;
            this.customNetworks = [];
          } else {
            this.accessMode = ACCESS_MODE.custom;
            this.customNetworks = networks;
          }
        } catch (err) {
          this.pluginAvailable = false;
          this.$info(this.$t('configuration-plugin-missing-title'));
        }
      },
      captureNetworkBaseline() {
        this.networkBaseline = this.networkFingerprint;
      },
      clearPasswordDraft() {
        this.password = '';
        this.clearPassword = false;
      },
      addCidr() {
        this.cidrError = '';
        const cidr = normalizeCidr(this.cidrDraft);
        if (!cidr) {
          this.cidrError = this.$t('configuration-device-invalid');
          return;
        }
        if (this.customNetworks.includes(cidr)) {
          this.cidrError = this.$t('configuration-device-duplicate');
          return;
        }
        this.customNetworks = [...this.customNetworks, cidr];
        this.cidrDraft = '';
      },
      removeCidr(entry) {
        this.customNetworks = this.customNetworks.filter(item => item !== entry);
      },
      validateLanPasswordRequirement() {
        if (!this.listenLan) return true;
        if (this.hasPassword && !this.clearPassword) return true;
        if (this.password.trim()) return true;
        this.$error(this.$t('configuration-password-lan-missing-friendly'));
        return false;
      },
      validateCustomNetworks() {
        if (!this.listenLan || this.accessMode !== ACCESS_MODE.custom) return true;
        if (this.customNetworks.length > 0) return true;
        this.$error(this.$t('configuration-device-required'));
        return false;
      },
      async onSavePassword() {
        if (this.saving) return;
        if (!this.validateLanPasswordRequirement()) return;

        const nextPassword = this.clearPassword ? null : this.password.trim();
        if (!this.clearPassword && !nextPassword) {
          this.$info(this.$t('config-no-changes'));
          return;
        }

        this.saving = true;
        try {
          const { GlobalConfig: current } = await this.$http.get('asf');
          const globalConfig = { ...current };

          Object.keys(globalConfig).forEach(key => {
            if (key.startsWith('s_')) delete globalConfig[key.substr(2)];
          });

          globalConfig.IPCPassword = nextPassword;

          await this.$http.post('asf', { globalConfig });
          this.clearPasswordDraft();
          this.hasPassword = Boolean(nextPassword);
          markClean();
          this.$info(this.$t('restart-initiated'));
          this.$router.push({ name: 'setup', params: { restart: true } });
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.saving = false;
        }
      },
      async onApplyNetwork() {
        if (this.applyingNetwork) return;
        if (!this.pluginAvailable) {
          this.$error(this.$t('configuration-plugin-missing-title'));
          return;
        }
        if (!this.validateLanPasswordRequirement()) return;
        if (!this.validateCustomNetworks()) return;

        this.applyingNetwork = true;
        try {
          const knownNetworks = this.listenLan
            ? resolveKnownNetworks(this.accessMode, this.customNetworks)
            : [];
          const body = buildIpcConfigApiBody({
            listenLan: this.listenLan,
            port: this.safePort,
            knownNetworks,
          });

          const status = await this.$http.put('IpcConfig', body);
          this.captureNetworkBaseline();
          this.persistPrefs();
          markClean();

          if (status && status.RestartRequired) {
            this.$success(this.$t('configuration-apply-network-done-restart'));
          } else {
            this.$success(this.$t('configuration-apply-network-done'));
          }
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.applyingNetwork = false;
        }
      },
      onDownloadIpcConfig() {
        if (this.downloading) return;
        if (!this.validateLanPasswordRequirement()) return;
        if (!this.validateCustomNetworks()) return;

        this.downloading = true;
        try {
          const knownNetworks = this.listenLan
            ? resolveKnownNetworks(this.accessMode, this.customNetworks)
            : [];
          const config = buildIpcConfig({
            listenLan: this.listenLan,
            port: this.port,
            knownNetworks,
          });
          downloadRaw('IPC.config', serializeIpcConfig(config));
          this.captureNetworkBaseline();
          this.$success(this.$t(
            this.pluginAvailable
              ? 'configuration-download-backup-done'
              : 'configuration-download-done-friendly',
          ));
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.downloading = false;
        }
      },
      async onRestartAsf() {
        if (this.restarting) return;
        this.restarting = true;
        try {
          await this.$http.post('asf/restart');
          this.$info(this.$t('restart-initiated'));
          this.$router.push({ name: 'setup', params: { restart: true } });
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.restarting = false;
        }
      },
    },
  };
</script>

<style lang="scss">
  .configuration-page {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-width: none;
    width: 100%;
  }

  .configuration-page__loading {
    align-items: center;
    background: var(--h2-shell, var(--color-background-light));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 1.1rem;
    color: var(--h2-ink, var(--color-text-dark));
    display: flex;
    justify-content: center;
    min-height: 14rem;
  }

  .configuration-page__intro {
    max-width: 40rem;
  }

  .configuration-page__plugin-banner {
    align-items: flex-start;
    background: color-mix(in srgb, var(--h2-brand-600, var(--color-theme)) 8%, var(--h2-shell, var(--color-background-light)));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 1.1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    justify-content: space-between;
    padding: 1.1rem 1.25rem;
  }

  .configuration-page__plugin-banner-title {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0 0 0.4rem;
  }

  .configuration-page__plugin-banner-body {
    flex: 1 1 18rem;
    max-width: 40rem;

    p {
      color: var(--h2-muted-2, var(--color-text-secondary));
      margin: 0 0 0.75rem;
    }
  }

  .configuration-page__plugin-steps {
    color: var(--h2-ink, var(--color-text-dark));
    margin: 0 0 0.75rem;
    padding-left: 1.2rem;

    li + li {
      margin-top: 0.35rem;
    }
  }

  .configuration-page__plugin-banner-actions {
    align-items: stretch;
    display: flex;
    flex: 0 1 14rem;
    flex-direction: column;
    gap: 0.55rem;
  }

  .configuration-page__plugin-link {
    color: var(--h2-brand-600, var(--color-theme));
    font-size: 0.9rem;
    text-align: center;
    text-decoration: underline;
  }

  .configuration-page__plugin-ok {
    background: color-mix(in srgb, #1b7f4a 10%, var(--h2-shell, var(--color-background-light)));
    border: 1px solid color-mix(in srgb, #1b7f4a 35%, var(--h2-border, var(--color-border)));
    border-radius: 0.9rem;
    color: var(--h2-ink, var(--color-text-dark));
    font-size: 0.92rem;
    padding: 0.75rem 1rem;
  }

  .configuration-page__eyebrow {
    color: var(--h2-brand-600, var(--color-theme));
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin: 0;
    text-transform: uppercase;
  }

  .configuration-page__title {
    font-size: clamp(1.55rem, 2.4vw, 2rem);
    font-weight: 750;
    letter-spacing: -0.03em;
    margin: 0.35rem 0 0;
  }

  .configuration-page__lead {
    color: var(--h2-muted-2, var(--color-text-secondary));
    font-size: 1.02rem;
    line-height: 1.55;
    margin: 0.55rem 0 0;
  }

  .configuration-page__layout {
    display: grid;
    gap: 1.15rem;
    grid-template-columns: minmax(0, 1fr);

    @media screen and (min-width: 1080px) {
      align-items: start;
      grid-template-columns: minmax(0, 1.45fr) minmax(18rem, 23rem);
    }
  }

  .configuration-page__main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
  }

  .configuration-page__block,
  .configuration-page__aside-card {
    background: var(--h2-shell, var(--color-background-light));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 1.15rem;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
    box-sizing: border-box;
    color: var(--h2-ink, var(--color-text-dark));
    min-width: 0;
    overflow: hidden;
    padding: 1.25rem 1.3rem 1.4rem;
    width: 100%;
  }

  .configuration-page__block--enter {
    animation: configuration-enter 220ms ease-out;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }

  @keyframes configuration-enter {
    from {
      opacity: 0;
      transform: translateY(0.35rem);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }

  .configuration-page__block-head {
    display: flex;
    gap: 0.9rem;
    margin-bottom: 1.05rem;
  }

  .configuration-page__step-num {
    align-items: center;
    background: var(--h2-brand-50, #eff6ff);
    border-radius: 999px;
    color: var(--h2-brand-600, var(--color-theme));
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 0.95rem;
    font-weight: 750;
    height: 2.35rem;
    justify-content: center;
    width: 2.35rem;
  }

  .configuration-page__heading {
    font-size: 1.12rem;
    font-weight: 740;
    letter-spacing: -0.02em;
    margin: 0;
  }

  .configuration-page__help {
    color: var(--h2-muted-2, var(--color-text-secondary));
    font-size: 0.92rem;
    line-height: 1.5;
    margin: 0.35rem 0 0;
  }

  .configuration-page__options {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: minmax(0, 1fr);

    @media screen and (min-width: 720px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .configuration-page__option {
    align-items: flex-start;
    background: var(--h2-soft, #f2f4f7);
    border: 1px solid transparent;
    border-radius: 1rem;
    color: inherit;
    cursor: pointer;
    display: flex;
    gap: 0.85rem;
    min-height: 6.2rem;
    padding: 1rem 1.05rem;
    text-align: left;
    transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;

    &.is-active {
      background: var(--h2-brand-50, #eff6ff);
      border-color: var(--h2-brand, var(--color-theme));
      box-shadow: inset 0 0 0 1px var(--h2-brand, var(--color-theme));
    }

    &:focus-visible {
      outline: 2px solid var(--h2-brand, var(--color-theme));
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  .configuration-page__option-icon {
    align-items: center;
    background: var(--h2-shell, #fff);
    border-radius: 0.8rem;
    color: var(--h2-brand-600, var(--color-theme));
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 1.05rem;
    height: 2.5rem;
    justify-content: center;
    width: 2.5rem;
  }

  .configuration-page__option-body {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
  }

  .configuration-page__option-title {
    font-size: 1rem;
    font-weight: 720;
  }

  .configuration-page__option-text {
    color: var(--h2-muted-2, var(--color-text-secondary));
    font-size: 0.88rem;
    line-height: 1.45;
  }

  .configuration-page__port-row {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem 0.75rem;
    margin-top: 1rem;
  }

  .configuration-page__label--inline {
    flex: 0 0 auto;
    margin: 0;
  }

  .configuration-page__help--inline {
    flex: 1 1 10rem;
    margin: 0;
  }

  .configuration-page__field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    max-width: 100%;
    min-width: 0;
    width: 100%;
  }

  .configuration-page__password {
    min-width: 0;
    position: relative;
    width: 100%;
  }

  .configuration-page__label {
    color: var(--h2-muted, var(--color-text-secondary));
    font-size: 0.82rem;
    font-weight: 700;
  }

  .configuration-page__input {
    background: var(--h2-shell, var(--color-background));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 0.7rem;
    box-sizing: border-box;
    color: var(--h2-ink, var(--color-text-dark));
    display: block;
    font: inherit;
    max-width: 100%;
    min-height: 2.5rem;
    min-width: 0;
    padding: 0.55rem 0.8rem;
    width: 100%;

    &:focus {
      border-color: var(--h2-brand, var(--color-theme));
      box-shadow: 0 0 0 3px var(--h2-brand-50, rgba(9, 104, 229, 0.16));
      outline: none;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  .configuration-page__input--password {
    padding-right: 2.75rem;

    &::-ms-reveal,
    &::-ms-clear {
      display: none;
    }

    &::-webkit-credentials-auto-fill-button {
      visibility: hidden;
    }
  }

  .configuration-page__reveal {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 0.45rem;
    color: var(--h2-muted-2, var(--color-text-secondary));
    cursor: pointer;
    display: inline-flex;
    height: 2.1rem;
    justify-content: center;
    padding: 0;
    position: absolute;
    right: 0.35rem;
    top: 50%;
    transform: translateY(-50%);
    width: 2.1rem;
    z-index: 1;

    &:hover:not(:disabled),
    &:focus-visible {
      color: var(--h2-ink, var(--color-text-dark));
      outline: none;
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px var(--h2-brand-50, rgba(9, 104, 229, 0.16));
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }
  }

  .configuration-page__input--port {
    flex: 0 0 auto;
    font-variant-numeric: tabular-nums;
    max-width: 5rem;
    min-height: 2.25rem;
    padding: 0.35rem 0.5rem;
    text-align: center;
    width: 5rem;
  }

  .configuration-page__notice {
    background: rgba(217, 45, 32, 0.08);
    border-radius: 0.85rem;
    color: var(--h2-error, #d92d20);
    font-size: 0.9rem;
    line-height: 1.45;
    margin: 0 0 1rem;
    padding: 0.8rem 0.95rem;
  }

  .configuration-page__check {
    align-items: flex-start;
    cursor: pointer;
    display: flex;
    font-size: 0.92rem;
    gap: 0.55rem;
    line-height: 1.4;
    margin-top: 0.95rem;

    input {
      margin-top: 0.2rem;
    }
  }

  .configuration-page__devices {
    margin-top: 1rem;
  }

  .configuration-page__add-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;

    .configuration-page__input {
      flex: 1 1 14rem;
    }
  }

  .configuration-page__device-list {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    list-style: none;
    margin: 0.85rem 0 0;
    padding: 0;

    li {
      align-items: center;
      background: var(--h2-soft, #f2f4f7);
      border-radius: 0.8rem;
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.7rem 0.8rem;
    }
  }

  .configuration-page__remove {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 0.55rem;
    color: var(--h2-muted-2, var(--color-text-secondary));
    cursor: pointer;
    display: inline-flex;
    height: 2.1rem;
    justify-content: center;
    width: 2.1rem;

    &:hover,
    &:focus-visible {
      background: rgba(217, 45, 32, 0.1);
      color: var(--h2-error, #d92d20);
      outline: none;
    }
  }

  .configuration-page__error {
    color: var(--h2-error, #d92d20);
    font-size: 0.88rem;
    margin: 0.45rem 0 0;
  }

  .configuration-page__aside {
    min-width: 0;

    @media screen and (min-width: 1080px) {
      position: sticky;
      top: 0.25rem;
    }
  }

  .configuration-page__aside-card {
    display: flex;
    flex-direction: column;
    gap: 0.95rem;
  }

  .configuration-page__checklist {
    display: grid;
    gap: 0.85rem;
    list-style: none;
    margin: 0;
    padding: 0;

    li {
      background: var(--h2-soft, #f2f4f7);
      border-radius: 0.9rem;
      display: grid;
      gap: 0.2rem;
      padding: 0.85rem 0.95rem;
    }

    strong {
      font-size: 0.92rem;
    }

    span {
      color: var(--h2-muted-2, var(--color-text-secondary));
      font-size: 0.86rem;
      line-height: 1.45;
    }
  }

  .configuration-page__summary {
    background: var(--h2-brand-50, #eff6ff);
    border-radius: 0.9rem;
    padding: 0.9rem 1rem;

    p {
      color: var(--h2-ink, var(--color-text-dark));
      font-size: 0.92rem;
      line-height: 1.45;
      margin: 0;
    }
  }

  .configuration-page__summary-label {
    color: var(--h2-brand-600, var(--color-theme)) !important;
    font-size: 0.75rem !important;
    font-weight: 750;
    letter-spacing: 0.05em;
    margin-bottom: 0.3rem !important;
    text-transform: uppercase;
  }

  .configuration-page__actions {
    display: grid;
    gap: 0.65rem;
  }

  .configuration-page__btn {
    align-items: center;
    display: inline-flex;
    gap: 0.45rem;
    justify-content: center;
    min-height: 2.9rem;
    width: 100%;
  }

  .configuration-page__btn--soft {
    background: var(--h2-soft, #f2f4f7);
    border: 1px solid var(--h2-border, var(--color-border));
    color: var(--h2-ink, var(--color-text-dark));

    &:hover:not(:disabled) {
      border-color: var(--h2-brand, var(--color-theme));
    }
  }
</style>
