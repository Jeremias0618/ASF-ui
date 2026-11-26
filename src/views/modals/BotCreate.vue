<template>
  <main class="main-container main-container--bot-create">
    <header class="bot-config__header">
      <p class="bot-config__eyebrow">{{ $t('bots', 'Bots') }}</p>
      <h2 class="title bot-config__title">{{ $t('bot-new') }}</h2>
    </header>

    <h3 v-if="loading" class="subtitle bot-config__loading">
      <FontAwesomeIcon icon="spinner" size="lg" spin></FontAwesomeIcon>
    </h3>

    <template v-else>
      <!-- The bot is already saved (stopped), but its QR sign-in could not be started: retry on the same bot -->
      <div v-if="createdName" class="bot-config__body bot-create__recovery" role="alert">
        <p class="bot-create__notice bot-create__notice--warn">
          <FontAwesomeIcon icon="exclamation-triangle" fixedWidth aria-hidden="true"></FontAwesomeIcon>
          <span>{{ $t('bot-create-qr-failed-title', { bot: createdName }) }}</span>
        </p>
        <p v-if="startError" class="bot-create__detail">{{ startError }}</p>
        <p class="bot-create__hint">{{ $t('bot-create-qr-saved-text') }}</p>
      </div>

      <div v-else class="bot-config__body">
        <ConfigEditor
          :fields="visibleFields"
          :model="model"
          :categories="displayCategories ? categories : null"
        >
          <template #after-Name>
            <div class="bot-create__method" role="radiogroup" :aria-label="$t('bot-create-method')">
              <span class="bot-create__method-label">{{ $t('bot-create-method') }}</span>
              <div class="bot-create__method-options">
                <label class="bot-create__method-option" :class="{ 'is-active': method === METHOD.CREDENTIALS }">
                  <input v-model="method" type="radio" name="bot-create-method" :value="METHOD.CREDENTIALS" :disabled="creating">
                  <span>{{ $t('bot-create-method-credentials') }}</span>
                </label>
                <label class="bot-create__method-option" :class="{ 'is-active': method === METHOD.QR, 'is-disabled': !qrAvailable }">
                  <input v-model="method" type="radio" name="bot-create-method" :value="METHOD.QR" :disabled="creating || !qrAvailable">
                  <span>{{ $t('bot-create-method-qr') }}</span>
                </label>
              </div>
              <p v-if="!qrAvailable" class="bot-create__notice bot-create__notice--warn">
                <FontAwesomeIcon icon="exclamation-triangle" fixedWidth aria-hidden="true"></FontAwesomeIcon>
                <span>{{ $t('bot-create-qr-headless') }}</span>
              </p>
              <p v-else-if="method === METHOD.QR" class="bot-create__hint">{{ $t('bot-create-qr-hint') }}</p>
            </div>
          </template>
        </ConfigEditor>
      </div>

      <footer class="bot-config__footer">
        <div class="bot-config__footer-primary">
          <button type="button" class="button button--confirm bot-config__btn" :disabled="creating" @click="onCreate">
            <FontAwesomeIcon v-if="creating" icon="spinner" spin fixedWidth></FontAwesomeIcon>
            <template v-else>
              <FontAwesomeIcon :icon="primaryIcon" fixedWidth aria-hidden="true"></FontAwesomeIcon>
              <span>{{ primaryLabel }}</span>
            </template>
          </button>

          <button type="button" class="button bot-config__btn bot-config__btn--secondary" :disabled="creating" @click="onCancel">
            <FontAwesomeIcon icon="times" fixedWidth aria-hidden="true"></FontAwesomeIcon>
            <span>{{ $t('cancel') }}</span>
          </button>
        </div>

        <button v-if="!createdName" type="button" class="button bot-config__btn bot-config__btn--ghost" @click="onDownload">
          <FontAwesomeIcon icon="download" fixedWidth aria-hidden="true"></FontAwesomeIcon>
          <span>{{ $t('download-raw-config') }}</span>
        </button>
      </footer>
    </template>
  </main>
</template>

<script>
  import { mapGetters } from 'vuex';
  import ConfigEditor from '../../components/Config/Editor.vue';
  import fetchConfigSchema from '../../utils/fetchConfigSchema';
  import loadParameterDescriptions from '../../utils/loadParameterDescriptions';
  import { downloadConfig } from '../../utils/download';
  import {
    InputChangedError,
    LOGIN_METHOD,
    startWithLoginMethod,
    waitForBot,
  } from '../../utils/botLogin';
  import botExists from '../../utils/botExists';
  import { botCategories } from '../../utils/configCategories';
  import unsavedChangesMixin from '../../mixins/unsaved-changes';
  import { markClean } from '../../utils/unsaved-changes';
  import '../../style/bot-form-modal.scss';

  // With QR sign-in there is no username/password to save. "Enabled" is not offered either: the bot is saved
  // stopped and started from here, and saving it enabled would make ASF start it before the QR choice arrives.
  const QR_HIDDEN_FIELDS = ['SteamLogin', 'SteamPassword', 'Enabled'];

  export default {
    name: 'BotCreate',
    components: { ConfigEditor },
    mixins: [unsavedChangesMixin],
    data() {
      return {
        METHOD: LOGIN_METHOD,
        method: LOGIN_METHOD.CREDENTIALS,
        loading: true,
        creating: false,
        // Set once the bot is saved: from then on "create" means "retry the QR start" on this very bot.
        createdName: null,
        startError: '',
        fields: [],
        model: {},
        categories: botCategories,
      };
    },
    computed: {
      ...mapGetters({
        version: 'asf/version',
        displayCategories: 'settings/displayCategories',
        bots: 'bots/bots',
        isRunningHeadless: 'asf/isRunningHeadless',
      }),
      // QR sign-in is only asked by an interactive ASF: headless / service mode always uses credentials.
      qrAvailable() {
        return !this.isRunningHeadless;
      },
      visibleFields() {
        if (this.method !== LOGIN_METHOD.QR) return this.fields;

        return this.fields.filter(field => !QR_HIDDEN_FIELDS.includes(field.param));
      },
      primaryLabel() {
        if (this.createdName) return this.$t('bot-login-try-again');

        return this.method === LOGIN_METHOD.QR ? this.$t('bot-create-qr-submit') : this.$t('create');
      },
      primaryIcon() {
        if (this.createdName) return 'redo-alt';

        return this.method === LOGIN_METHOD.QR ? 'power-off' : 'plus';
      },
      isDirty() {
        // Once saved there is nothing left to lose here: the configuration is already on disk.
        if (this.loading || this.creating || this.createdName) return false;
        return Object.keys(this.model).some(key => {
          const value = this.model[key];
          if (value === null || value === undefined || value === '') return false;
          if (Array.isArray(value) && value.length === 0) return false;
          if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false;
          return true;
        });
      },
      unsavedChangesMessage() {
        return this.$t('unsaved-changes-confirm');
      },
    },
    watch: {
      qrAvailable(value) {
        // ASF changed to a mode without QR while this form was open.
        if (!value && !this.createdName) this.method = LOGIN_METHOD.CREDENTIALS;
      },
    },
    async created() {
      await this.loadConfig();
      this.$nextTick(() => {
        const botNameField = document.getElementById('Name');
        if (botNameField) botNameField.focus();
      });
    },
    methods: {
      async loadConfig() {
        const [{ body: fields }, descriptions] = await Promise.all([
          fetchConfigSchema('ArchiSteamFarm.Steam.Storage.BotConfig'),
          loadParameterDescriptions(this.version, this.$i18n.locale),
        ]);

        this.fields = [
          {
            defaultValue: '',
            param: 'Name',
            paramName: 'Name',
            type: 'string',
            description: this.$t('name-description'),
            checkBotNameUnique: true,
          },
          ...Object.keys(fields).map(key => {
            const description = (!descriptions[key])
              ? this.$t('description-not-found')
              : descriptions[key].replace(/<a href="/g, '<a target="_blank" rel="noreferrer noopener" href="');

            return { description, ...fields[key] };
          }),
        ];

        this.model = {};
        this.loading = false;
      },
      // The configuration to save. With QR sign-in the Steam credentials are left out even if they were typed
      // before switching, and the bot is saved stopped so ASF cannot start it before the QR choice is sent.
      buildConfig() {
        const { Name: name, ...config } = JSON.parse(JSON.stringify(this.model));

        if (this.method === LOGIN_METHOD.QR) {
          QR_HIDDEN_FIELDS.forEach(field => delete config[field]);
          config.Enabled = false;
        }

        return { name, config };
      },
      onCancel() {
        // Cancelling after saving keeps the bot: only its sign-in is left to do.
        if (this.createdName) this.$info(this.$t('bot-create-qr-kept', { bot: this.createdName }));

        markClean();
        this.$parent.close();
      },
      // Continues in the sign-in view, which draws the QR. `started` tells it the QR choice was already sent.
      goToLogin(name, started) {
        markClean();
        this.$router.replace({ name: 'bot-login', params: started ? { bot: name, started } : { bot: name } });
      },
      // Sends the QR choice and starts a bot that is already saved (stopped). Shared by the first try and retries.
      async startSavedBot(name) {
        const listed = await waitForBot(name);
        if (!listed) throw new Error(this.$t('bot-create-qr-not-listed', { bot: name }));

        try {
          await startWithLoginMethod(name, { method: LOGIN_METHOD.QR });
        } catch (err) {
          // Already running: a previous try got further than it seemed. The sign-in view shows the real state.
          if (err instanceof InputChangedError) {
            this.goToLogin(name);
            return;
          }

          throw err;
        }

        this.goToLogin(name, LOGIN_METHOD.QR);
      },
      async retryQr() {
        if (this.creating) return;

        if (!this.qrAvailable) {
          this.startError = this.$t('bot-create-qr-headless');
          return;
        }

        this.creating = true;
        this.startError = '';

        try {
          await this.startSavedBot(this.createdName);
        } catch (err) {
          this.startError = err.message;
        } finally {
          this.creating = false;
        }
      },
      async onCreate() {
        if (this.creating) return;
        if (this.createdName) {
          await this.retryQr();
          return;
        }

        const { name, config } = this.buildConfig();
        const { method } = this;

        if (!name) {
          this.$error(this.$t('bot-create-name'));
          return;
        }

        if (name === 'ASF') {
          this.$error(this.$t('bot-create-name-asf'));
          return;
        }

        if (botExists(this.bots, name)) {
          this.$error(this.$t('bot-name-in-use'));
          return;
        }

        if (method === LOGIN_METHOD.QR && !this.qrAvailable) {
          this.$error(this.$t('bot-create-qr-headless'));
          return;
        }

        this.creating = true;

        try {
          try {
            await this.$http.post(`bot/${name}`, { botConfig: config });
          } catch (err) {
            // Nothing was saved: the form stays as it is.
            this.$error(err.message);
            return;
          }

          if (method === LOGIN_METHOD.QR) {
            // From here on the bot exists; a failure below must not be reported as "could not create".
            this.createdName = name;

            try {
              await this.startSavedBot(name);
            } catch (err) {
              this.startError = err.message;
            }

            return;
          }

          // Wait for ASF to list the new bot (instead of a fixed pause), then continue in the sign-in view.
          // A bot saved as disabled is not started: the view offers to start it.
          const created = await waitForBot(name);
          markClean();

          if (created) this.$router.replace({ name: 'bot-login', params: { bot: name } });
          else this.$parent.close();
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.creating = false;
        }
      },
      async onDownload() {
        const { name, config } = this.buildConfig();
        downloadConfig(config, name);
      },
    },
  };
</script>

<style lang="scss">
  .bot-create__method {
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0.35rem 0 0.75rem;
    padding: 0.7rem 0.85rem;
  }

  .bot-create__method-label {
    color: var(--h2-muted, var(--color-text-disabled));
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .bot-create__method-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .bot-create__method-option {
    align-items: center;
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 0.4rem;
    cursor: pointer;
    display: inline-flex;
    gap: 0.45rem;
    padding: 0.4rem 0.75rem;

    &.is-active {
      border-color: var(--h2-accent, var(--color-text));
      font-weight: 650;
    }

    &.is-disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  }

  .bot-create__notice,
  .bot-create__hint,
  .bot-create__detail {
    font-size: 0.85rem;
    line-height: 1.45;
    margin: 0;
  }

  .bot-create__hint,
  .bot-create__detail {
    color: var(--h2-muted, var(--color-text-disabled));
  }

  .bot-create__detail {
    overflow-wrap: anywhere;
  }

  .bot-create__notice {
    align-items: flex-start;
    background: var(--h2-soft, rgba(255, 255, 255, 0.06));
    border: 1px solid var(--h2-border, rgba(255, 255, 255, 0.12));
    border-radius: 0.6rem;
    color: var(--h2-muted-2, var(--color-text));
    display: flex;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;

    &--warn {
      border-color: rgba(217, 119, 6, 0.5);
    }
  }

  .bot-create__recovery {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    padding-top: 1rem;
  }
</style>
