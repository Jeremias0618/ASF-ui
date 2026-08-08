<template>
  <main v-if="bot" class="main-container main-container--bot-config">
    <header class="bot-config__header">
      <p class="bot-config__eyebrow">{{ $t('bot-config', 'Bot config') }}</p>
      <h2 v-tooltip="bot.name" class="title bot-config__title">{{ bot.viewableName }}</h2>
    </header>

    <h3 v-if="loading" class="subtitle bot-config__loading">
      <FontAwesomeIcon icon="spinner" size="lg" spin></FontAwesomeIcon>
    </h3>

    <div v-else class="container bot-config__body">
      <ConfigEditor
        :fields="fields"
        :model="model"
        :categories="displayCategories ? categories : null"
        :deleteDefaultValues="false"
      ></ConfigEditor>

      <div class="form-item bot-config__actions">
        <div class="form-item__buttons">
          <button class="button button--confirm" @click="onSave">
            <FontAwesomeIcon v-if="saving" icon="spinner" spin></FontAwesomeIcon>
            <span v-else>{{ $t('save') }}</span>
          </button>
          <router-link v-slot="{ navigate }" custom :to="{ name: 'bot-copy', params: { bot: bot.name } }">
            <button class="button button--confirm" @click="navigate">{{ $t('bot-copy') }}</button>
          </router-link>

          <button class="button button--link bot-config__download" @click="onDownload">
            {{ $t('download-raw-config') }}
          </button>
        </div>
      </div>
    </div>
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

  export default {
    name: 'BotConfig',
    components: { ConfigEditor },
    data() {
      return {
        loading: false,
        saving: false,
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
      }),
      bot() {
        return this.$store.getters['bots/bot'](this.$route.params.bot);
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

          this.model = model;

          // if we got routed to bot-config with params, we propably
          // came from PasswordEncrypt.vue and want to set password data from params
          if (Object.keys(this.$route.params).length !== 0) {
            // only set the values if they exist in the params
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

          this.fields = Object.keys(fields).map(key => {
            const description = (!descriptions[key])
              ? this.$t('description-not-found')
              : descriptions[key].replace(/<a href="/g, '<a target="_blank" rel="noreferrer noopener" href="');

            return { description, ...fields[key], ...(extendedFields[key] || []) };
          });

          // Sort the config properties alphabetically to make them easier to find when not using config categories
          if (!this.displayCategories) this.fields = this.fields.sort((a, b) => a.paramName.localeCompare(b.paramName));
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.loading = false;
        }
      },
      async onSave() {
        if (this.saving) return;

        if (this.model.Name === 'ASF') {
          this.$error(this.$t('bot-create-name-asf'));
          return;
        }

        this.saving = true;

        try {
          // fetch current bot config
          const { [this.bot.name]: { BotConfig: oldConfig } } = await this.$http.get(`bot/${this.bot.name}`);

          // we do not want to save identical config
          if (isSameConfig(this.model, oldConfig)) {
            this.$info(this.$t('config-no-changes'));
            return;
          }

          await this.$http.post(`bot/${this.bot.name}`, { botConfig: this.model });
          this.$parent.back();
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.saving = false;
        }
      },
      async onDownload() {
        downloadConfig(this.model, this.bot.name);
      },
    },
  };
</script>

<style lang="scss">
  .main-container--bot-config {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: none;
    min-height: 0;
    padding: 1rem 1.1rem 1.15rem;
  }

  .bot-config__header {
    flex-shrink: 0;
    padding-right: 2.5rem;
  }

  .bot-config__eyebrow {
    color: var(--h2-muted, var(--color-text-disabled));
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    margin: 0 0 0.2rem;
    text-transform: uppercase;
  }

  .bot-config__title {
    margin: 0;
  }

  .bot-config__loading {
    align-items: center;
    display: flex;
    justify-content: center;
    min-height: 8rem;
  }

  .bot-config__body {
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    margin: 0;
    min-height: 0;
    padding: 0;
  }

  .bot-config__actions {
    border-top: 1px solid var(--h2-border, var(--color-border));
    margin-bottom: 0;
    margin-top: 0.75rem;
    padding-top: 0.9rem;
    position: sticky;
    bottom: 0;
    background: linear-gradient(180deg, transparent, var(--color-background-modal) 28%);
    z-index: 2;
  }

  .bot-config__download {
    margin-left: auto;
  }

  @media screen and (max-width: 559px) {
    .main-container--bot-config {
      padding: 0.85rem 0.85rem 1rem;
    }

    .bot-config__download {
      margin-left: 0;
      width: 100%;
    }

    .bot-config__actions .form-item__buttons {
      width: 100%;

      > .button,
      > a {
        flex: 1 1 auto;
      }
    }
  }
</style>
