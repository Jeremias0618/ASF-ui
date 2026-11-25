<template>
  <main v-if="bot" class="main-container main-container--bot-config">
    <header class="bot-config__header">
      <p class="bot-config__eyebrow">{{ $t('bot-config', 'Bot config') }}</p>
      <h2 v-tooltip="displayTitle" class="title bot-config__title">{{ displayTitle }}</h2>
    </header>

    <AsfModalSkeleton
      v-if="loading"
      class="bot-config__skeleton"
      variant="config"
      :aria-label="$t('modal-loading')"
    ></AsfModalSkeleton>

    <div v-else-if="loadError" class="bot-config__error" role="alert">
      <p class="bot-config__error-title">{{ $t('bot-config-load-failed') }}</p>
      <p class="bot-config__error-detail">{{ loadError }}</p>
      <button type="button" class="button button--confirm bot-config__btn" @click="loadConfig">
        <span>{{ $t('retry') }}</span>
      </button>
    </div>

    <template v-else>
      <div class="bot-config__body">
        <ConfigEditor
          :fields="fields"
          :model="model"
          :categories="displayCategories ? categories : null"
          :deleteDefaultValues="false"
        ></ConfigEditor>
      </div>

      <footer class="bot-config__footer">
        <div class="bot-config__footer-primary">
          <button type="button" class="button button--confirm bot-config__btn" :disabled="saving" @click="onSave">
            <FontAwesomeIcon v-if="saving" icon="spinner" spin fixedWidth></FontAwesomeIcon>
            <template v-else>
              <FontAwesomeIcon icon="save" fixedWidth aria-hidden="true"></FontAwesomeIcon>
              <span>{{ $t('save') }}</span>
            </template>
          </button>

          <router-link v-slot="{ navigate }" custom :to="{ name: 'bot-copy', params: { bot: bot.name } }">
            <button type="button" class="button bot-config__btn bot-config__btn--secondary" @click="navigate">
              <FontAwesomeIcon icon="copy" fixedWidth aria-hidden="true"></FontAwesomeIcon>
              <span>{{ $t('bot-copy') }}</span>
            </button>
          </router-link>
        </div>

        <button type="button" class="button bot-config__btn bot-config__btn--ghost" @click="onDownload">
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
  import AsfModalSkeleton from '../../components/UI/ModalSkeleton.vue';
  import fetchConfigSchema from '../../utils/fetchConfigSchema';
  import loadParameterDescriptions, { peekParameterDescriptions } from '../../utils/loadParameterDescriptions';
  import { downloadConfig } from '../../utils/download';
  import { botCategories } from '../../utils/configCategories';
  import isSameConfig from '../../utils/isSameConfig';
  import botExists from '../../utils/botExists';
  import { normalizeOnlineStatusValue } from '../../utils/config-i18n';
  import unsavedChangesMixin from '../../mixins/unsaved-changes';
  import { markClean } from '../../utils/unsaved-changes';
  import '../../style/bot-form-modal.scss';

  function stripBotName(model) {
    const { Name, ...config } = model || {};
    return config;
  }

  export default {
    name: 'BotConfig',
    components: { ConfigEditor, AsfModalSkeleton },
    mixins: [unsavedChangesMixin],
    data() {
      return {
        loading: true,
        loadError: null,
        loadSeq: 0,
        saving: false,
        fields: [],
        model: {},
        originalName: '',
        originalConfig: null,
        categories: botCategories,
      };
    },
    computed: {
      ...mapGetters({
        version: 'asf/version',
        displayCategories: 'settings/displayCategories',
        bots: 'bots/bots',
      }),
      bot() {
        return this.$store.getters['bots/bot'](this.$route.params.bot);
      },
      displayTitle() {
        const name = (this.model && this.model.Name) || (this.bot && this.bot.viewableName) || '';
        return name;
      },
      isDirty() {
        if (this.loading || this.saving || !this.originalConfig) return false;
        const nameChanged = String(this.model.Name || '') !== String(this.originalName || '');
        return nameChanged || !isSameConfig(stripBotName(this.model), this.originalConfig);
      },
      unsavedChangesMessage() {
        return this.$t('unsaved-changes-confirm');
      },
    },
    watch: {
      $route: {
        immediate: true,
        async handler() {
          if (!this.bot) {
            // Bot is gone: drop any load still in flight.
            this.loadSeq += 1;
            return;
          }
          await this.loadConfig();
        },
      },
    },
    created() {
      if (!this.bot) this.$router.replace({ name: 'bots' });
    },
    beforeDestroy() {
      // Late responses of a closed modal must not touch the component.
      this.loadSeq += 1;
    },
    methods: {
      descriptionFor(key, descriptions) {
        if (!descriptions) return '';
        if (!descriptions[key]) return this.$t('description-not-found');
        return descriptions[key].replace(/<a href="/g, '<a target="_blank" rel="noreferrer noopener" href="');
      },
      applyDescriptions(descriptions) {
        // Update the existing field objects in place: keys, model and focus stay untouched.
        this.fields.forEach(field => {
          if (field.param === 'Name') return;
          field.description = this.descriptionFor(field.param, descriptions);
        });
      },
      loadDescriptions(seq, version, locale) {
        // Wiki help is optional: it never blocks editing and a failure is not an editor error.
        loadParameterDescriptions(version, locale)
          .then(descriptions => {
            if (seq !== this.loadSeq) return;
            this.applyDescriptions(descriptions);
          })
          .catch(err => console.warn(`Could not load parameter descriptions: ${err.message}`));
      },
      async loadConfig() {
        const seq = this.loadSeq + 1;
        this.loadSeq = seq;
        // Captured now: this.bot may point to another bot (or none) by the time responses arrive.
        const botName = this.bot.name;
        const { version } = this;
        const { locale } = this.$i18n;

        this.loading = true;
        this.loadError = null;
        this.originalConfig = null;
        this.originalName = '';
        this.fields = [];
        this.model = {};

        try {
          const [
            { body: fields },
            { [botName]: { BotConfig: model } },
          ] = await Promise.all([
            fetchConfigSchema('ArchiSteamFarm.Steam.Storage.BotConfig'),
            this.$http.get(`bot/${botName}`),
          ]);

          if (seq !== this.loadSeq) return;

          // Warm cache: help text is available right away, so the form renders complete.
          const cachedDescriptions = peekParameterDescriptions(locale);

          Object.keys(model).forEach(key => {
            if (key.startsWith('s_')) delete model[key.substr(2)];
          });

          // Hide legacy Steam statuses in the UI by mapping them to Online.
          if (fields.OnlineStatus && fields.OnlineStatus.values) {
            model.OnlineStatus = normalizeOnlineStatusValue(
              fields.OnlineStatus.values,
              model.OnlineStatus,
            );
          }

          // Name lives outside BotConfig JSON; API exposes rename separately.
          this.model = { Name: botName, ...model };
          this.originalName = botName;
          this.originalConfig = JSON.parse(JSON.stringify(model));

          // if we got routed to bot-config with params, we propably
          // came from PasswordEncrypt.vue and want to set password data from params
          if (Object.keys(this.$route.params).length !== 0) {
            if (typeof this.$route.params.steamPassword !== 'undefined') {
              this.model.SteamPassword = this.$route.params.steamPassword;
            }
            if (typeof this.$route.params.passwordFormat !== 'undefined') {
              this.model.PasswordFormat = this.$route.params.passwordFormat;
            }
          }

          const extendedFields = {
            SteamLogin: { placeholder: this.$t('keep-unchanged') },
            SteamPassword: { placeholder: this.$t('keep-unchanged') },
            SteamParentalCode: { placeholder: this.$t('keep-unchanged') },
          };

          const nameField = {
            defaultValue: '',
            param: 'Name',
            paramName: 'Name',
            type: 'string',
            description: this.$t('name-description'),
            checkBotNameUnique: true,
            excludeBotName: botName,
          };

          this.fields = [
            nameField,
            ...Object.keys(fields).map(key => {
              // Empty until the wiki answers (unless the cache is warm); see loadDescriptions().
              const description = this.descriptionFor(key, cachedDescriptions);

              return { description, ...fields[key], ...(extendedFields[key] || []) };
            }),
          ];

          if (!this.displayCategories) this.fields = this.fields.sort((a, b) => a.paramName.localeCompare(b.paramName));

          // The form is usable from here on. Help text arrives later and never blocks it.
          if (!cachedDescriptions) this.loadDescriptions(seq, version, locale);
        } catch (err) {
          if (seq === this.loadSeq) {
            // No usable model: show a retryable error instead of an empty form that could be saved.
            this.fields = [];
            this.model = {};
            this.originalConfig = null;
            this.loadError = err.message || this.$t('bot-config-load-failed');
            this.$error(this.loadError);
          }
        } finally {
          if (seq === this.loadSeq) this.loading = false;
        }
      },
      async onSave() {
        if (this.saving || this.loading || this.loadError || !this.originalConfig) return;

        const newName = String(this.model.Name || '').trim();
        const oldName = this.bot.name;
        const config = stripBotName(this.model);
        const nameChanged = newName !== oldName;
        const configChanged = !isSameConfig(config, this.originalConfig);

        if (!newName) {
          this.$error(this.$t('bot-create-name'));
          return;
        }

        if (newName === 'ASF') {
          this.$error(this.$t('bot-create-name-asf'));
          return;
        }

        if (nameChanged && botExists(this.bots, newName)) {
          this.$error(this.$t('bot-name-in-use'));
          return;
        }

        if (!nameChanged && !configChanged) {
          this.$info(this.$t('config-no-changes'));
          return;
        }

        this.saving = true;

        try {
          if (configChanged) {
            await this.$http.post(`bot/${oldName}`, { botConfig: config });
          }

          if (nameChanged) {
            await this.$http.post(`bot/${oldName}/Rename`, { NewName: newName });
            await this.$store.dispatch('bots/updateBots');
          } else {
            await this.$store.dispatch('bots/updateBot', { name: oldName });
          }

          this.originalName = newName;
          this.originalConfig = JSON.parse(JSON.stringify(config));
          markClean();

          if (nameChanged) {
            this.$router.replace({ name: 'bot', params: { bot: newName } });
          } else {
            this.$parent.back();
          }
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.saving = false;
        }
      },
      async onDownload() {
        downloadConfig(stripBotName(this.model), this.model.Name || this.bot.name);
      },
    },
  };
</script>

<style lang="scss">
  @import '../../style/bot-form-modal';
</style>
