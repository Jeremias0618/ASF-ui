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
      <div class="bot-config__body">
        <ConfigEditor
          :fields="fields"
          :model="model"
          :categories="displayCategories ? categories : null"
        ></ConfigEditor>
      </div>

      <footer class="bot-config__footer">
        <div class="bot-config__footer-primary">
          <button type="button" class="button button--confirm bot-config__btn" :disabled="creating" @click="onCreate">
            <FontAwesomeIcon v-if="creating" icon="spinner" spin fixedWidth></FontAwesomeIcon>
            <template v-else>
              <FontAwesomeIcon icon="plus" fixedWidth aria-hidden="true"></FontAwesomeIcon>
              <span>{{ $t('create') }}</span>
            </template>
          </button>

          <button type="button" class="button bot-config__btn bot-config__btn--secondary" @click="$parent.close()">
            <FontAwesomeIcon icon="times" fixedWidth aria-hidden="true"></FontAwesomeIcon>
            <span>{{ $t('cancel') }}</span>
          </button>
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
  import delay from '../../utils/delay';
  import botExists from '../../utils/botExists';
  import { botCategories } from '../../utils/configCategories';
  import unsavedChangesMixin from '../../mixins/unsaved-changes';
  import { markClean } from '../../utils/unsaved-changes';
  import '../../style/bot-form-modal.scss';

  export default {
    name: 'BotCreate',
    components: { ConfigEditor },
    mixins: [unsavedChangesMixin],
    data() {
      return {
        loading: true,
        creating: false,
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
      isDirty() {
        if (this.loading || this.creating) return false;
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
      async onCreate() {
        if (this.creating) return;

        const { Name: name, ...config } = JSON.parse(JSON.stringify(this.model));

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

        this.creating = true;

        try {
          await this.$http.post(`bot/${name}`, { botConfig: config });
          await delay(1000);
          await this.$store.dispatch('bots/updateBot', { name });
          markClean();
          this.$parent.close();
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.creating = false;
        }
      },
      async onDownload() {
        const { Name: name, ...config } = JSON.parse(JSON.stringify(this.model));
        downloadConfig(config, name);
      },
    },
  };
</script>
