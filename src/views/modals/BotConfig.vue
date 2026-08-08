<template>
  <main v-if="bot" class="main-container main-container--bot-config">
    <header class="bot-config__header">
      <p class="bot-config__eyebrow">{{ $t('bot-config', 'Bot config') }}</p>
      <h2 v-tooltip="displayTitle" class="title bot-config__title">{{ displayTitle }}</h2>
    </header>

    <h3 v-if="loading" class="subtitle bot-config__loading">
      <FontAwesomeIcon icon="spinner" size="lg" spin></FontAwesomeIcon>
    </h3>

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
  import fetchConfigSchema from '../../utils/fetchConfigSchema';
  import loadParameterDescriptions from '../../utils/loadParameterDescriptions';
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
    components: { ConfigEditor },
    mixins: [unsavedChangesMixin],
    data() {
      return {
        loading: false,
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
          if (!this.bot) return;
          await this.loadConfig();
        },
      },
    },
    created() {
      if (!this.bot) this.$router.replace({ name: 'bots' });
    },
    methods: {
      async loadConfig() {
        if (this.loading) return;

        this.loading = true;
        this.originalConfig = null;

        try {
          const [
            { body: fields },
            { [this.bot.name]: { BotConfig: model } },
            descriptions,
          ] = await Promise.all([
            fetchConfigSchema('ArchiSteamFarm.Steam.Storage.BotConfig'),
            this.$http.get(`bot/${this.bot.name}`),
            loadParameterDescriptions(this.version, this.$i18n.locale),
          ]);

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
          this.model = { Name: this.bot.name, ...model };
          this.originalName = this.bot.name;
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
            excludeBotName: this.bot.name,
          };

          this.fields = [
            nameField,
            ...Object.keys(fields).map(key => {
              const description = (!descriptions[key])
                ? this.$t('description-not-found')
                : descriptions[key].replace(/<a href="/g, '<a target="_blank" rel="noreferrer noopener" href="');

              return { description, ...fields[key], ...(extendedFields[key] || []) };
            }),
          ];

          if (!this.displayCategories) this.fields = this.fields.sort((a, b) => a.paramName.localeCompare(b.paramName));
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.loading = false;
        }
      },
      async onSave() {
        if (this.saving) return;

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
