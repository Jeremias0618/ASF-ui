<template>
  <main class="mass-editor-page home2-page-body">
    <header class="home2-page-intro">
      <p class="home2-page-eyebrow">{{ $t('home2-section-config') }}</p>
      <h1 class="home2-page-title">{{ $t('mass-editor') }}</h1>
      <p class="home2-page-lead">{{ $t('mass-editor-lead') }}</p>
    </header>

    <div class="home2-page-panel">
      <template v-if="loading || noBotsFound">
        <div v-if="loading" class="home2-page-loading" role="status">
          <FontAwesomeIcon icon="spinner" size="lg" spin></FontAwesomeIcon>
        </div>

        <template v-if="noBotsFound">
          <p class="mass-editor-page__empty">{{ $t('mass-editor-no-bots') }}</p>
          <div class="mass-editor__info">
            <a @click="$router.push({ name: 'bot-create' })">{{ $t('mass-editor-create-bot') }}</a>
          </div>
        </template>
      </template>

      <template v-else>
        <MassEditorSteps
          :steps="steps"
          :currentStep="status"
          :isDisabled="isStepDisabled"
          :getTitle="getDisabledTitle"
          @setStep="setStatus"
        ></MassEditorSteps>

        <MassEditorBots
          v-if="status === 'bots'"
          :bots="sortedBots"
          :selectedBots="selectedBots"
          @toggle="toggleSelectedBots"
          @update="updateSelectedBots"
          @next="setStatus('properties')"
        ></MassEditorBots>

        <MassEditorSelect
          v-if="status === 'properties'"
          :loading="loading"
          :status="status"
          :selectedProperties="selectedProperties"
          :options="fields"
          @select="selectProperty"
          @remove="removeProperty"
          @update="updateModel"
          @next="setStatus('values')"
          @back="setStatus('bots')"
        ></MassEditorSelect>

        <MassEditorValue
          v-if="status === 'values'"
          :selectedProperties="selectedProperties"
          :categories="categories"
          :config="config"
          @next="setStatus('check')"
          @back="setStatus('properties')"
        ></MassEditorValue>

        <MassEditorCheck
          v-if="status === 'check'"
          :config="config"
          :selectedBots="selectedBots"
          :selectedProperties="selectedProperties"
          @back="setStatus('values')"
        ></MassEditorCheck>
      </template>
    </div>
  </main>
</template>

<script>
  import { mapGetters } from 'vuex';
  import MassEditorSteps from '../components/MassEditor/Steps.vue';
  import MassEditorBots from '../components/MassEditor/Bots.vue';
  import MassEditorValue from '../components/MassEditor/Value.vue';
  import MassEditorCheck from '../components/MassEditor/Check.vue';
  import MassEditorSelect from '../components/MassEditor/Select.vue';
  import fetchConfigSchema from '../utils/fetchConfigSchema';
  import loadParameterDescriptions from '../utils/loadParameterDescriptions';
  import { botCategories } from '../utils/configCategories';
  import { BotStatus } from '../models/Bot';

  export default {
    name: 'MassEditor',
    metaInfo() {
      return {
        title: this.$t('mass-editor'),
      };
    },
    components: {
      MassEditorSteps,
      MassEditorBots,
      MassEditorCheck,
      MassEditorSelect,
      MassEditorValue,
    },
    data() {
      return {
        loading: true,
        fields: [],
        model: {},
        descriptions: {},
        categories: botCategories,
        config: {},
        status: 'bots',
        selectedBots: [],
        selectedProperties: [],
        noBotsFound: false,
        steps: ['bots', 'properties', 'values', 'check'],
      };
    },
    computed: {
      ...mapGetters({
        version: 'asf/version',
        bots: 'bots/bots',
        orderDisabledBotsLast: 'settings/orderDisabledBotsLast',
        orderBotsNumeric: 'settings/orderBotsNumeric',
      }),
      sortedBots() {
        const bots = this.bots.sort(this.sortDefault());
        if (this.orderDisabledBotsLast) return bots.sort(this.sortByStatus());
        return bots;
      },
    },
    watch: {
      async bots() {
        // I have no idea why but in the created/mounted hook,
        // 'this.bots' is sometimes empty after reload.
        const firstBot = this.bots[Object.keys(this.bots)[0]];
        if (!firstBot) {
          this.noBotsFound = true;
          this.loading = false;
        } else if (this.loading) {
          await this.loadBotConfig();
        }
      },
    },
    methods: {
      sortDefault() {
        if (!this.orderBotsNumeric) return undefined;

        return function(a, b) {
          return a.name - b.name;
        };
      },
      sortByStatus() {
        // Order: farming -> online -> offline -> disabled
        // eslint-disable-next-line func-names
        return function(a, b) {
          if (a.status === b.status) return 0;

          if (a.status === BotStatus.DISABLED) return 1;
          if (b.status === BotStatus.DISABLED) return -1;

          if (a.status === BotStatus.FARMING) return -1;
          if (b.status === BotStatus.FARMING) return 1;

          if (a.status === BotStatus.ONLINE) return -1;

          return 1;
        };
      },
      async loadBotConfig() {
        const firstBot = this.bots[Object.keys(this.bots)[0]];

        const [
          { [firstBot.name]: { BotConfig: model } },
          { body: fields },
          descriptions,
        ] = await Promise.all([
          this.$http.get(`bot/${firstBot.name}`),
          fetchConfigSchema('ArchiSteamFarm.Steam.Storage.BotConfig'),
          loadParameterDescriptions(this.version, this.$i18n.locale),
        ]);

        Object.keys(model).forEach(key => {
          if (key.startsWith('s_')) delete model[key.substr(2)];
        });

        this.model = model;

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

        this.noBotsFound = false;
        this.loading = false;
      },
      updateSelectedBots(bot) {
        const selectedBotNames = this.selectedBots.map(bot => bot.name);
        if (selectedBotNames.includes(bot.name)) {
          this.selectedBots = this.selectedBots.filter(selectedBot => selectedBot.name !== bot.name);
        } else {
          this.selectedBots.push(bot);
        }
      },
      selectProperty(property) {
        // initialize config property with default value
        this.config[property.param] = property.defaultValue;
      },
      removeProperty(property) {
        delete this.config[property.param];
      },
      updateModel(model) {
        this.selectedProperties = model;
      },
      setStatus(status) {
        this.status = status;
      },
      toggleSelectedBots() {
        if (this.selectedBots.length === this.bots.length) this.selectedBots = [];
        else this.selectedBots = this.bots;
      },
      isStepDisabled(step) {
        switch (step) {
          case 'properties':
            return this.selectedBots.length === 0;
          case 'values':
            return this.selectedBots.length === 0 || this.selectedProperties.length === 0;
          case 'check':
            return this.selectedBots.length === 0 || this.selectedProperties.length === 0;
          default:
            return false;
        }
      },
      getDisabledTitle(step) {
        switch (step) {
          case 'properties':
            return (this.selectedBots.length === 0) ? this.$t('mass-editor-bots-disabled') : null;
          case 'values':
          case 'check':
            if (this.selectedBots.length === 0) return this.$t('mass-editor-bots-disabled');
            return (this.selectedProperties.length === 0) ? this.$t('mass-editor-properties-disabled') : null;
          default:
            return null;
        }
      },
    },
  };
</script>

<style lang="scss">
  .mass-editor__title {
    background: var(--h2-soft, var(--color-background));
    border-bottom: 1px solid var(--h2-border, var(--color-text-dark));
    border-radius: 0.55rem 0.55rem 0 0;
    color: var(--h2-ink, var(--color-text-dark));
    display: flex;
    align-items: center;
    padding: 1em;
  }

  .mass-editor__navigation {
    display: flex;
    padding-left: 0.7em;
    gap: 0.5em;
  }

  .mass-editor__content {
    background: var(--h2-shell, var(--color-background-modal));
    border-radius: 0 0 0.55rem 0.55rem;
    display: block;
    padding: 1em;
  }

  .mass-editor__info {
    color: var(--h2-brand, var(--color-theme));
    cursor: pointer;
    text-align: center;
  }

  .mass-editor-page__empty {
    color: var(--h2-muted);
    margin: 0 0 0.75rem;
    text-align: center;
  }

  .home2-shell .mass-editor-page {
    .button {
      border-radius: 0.55rem;
    }
  }
</style>
