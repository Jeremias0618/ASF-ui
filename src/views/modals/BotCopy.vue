<template>
  <main v-if="bot" class="main-container main-container--bot-copy">
    <header class="bot-config__header">
      <p class="bot-config__eyebrow">{{ $t('bot-copy') }}</p>
      <h2 class="title bot-config__title">{{ $t('bot-new') }}</h2>
      <p class="bot-config__lead">{{ $t('bot-new-copy', { name: bot.name }) }}</p>
    </header>

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

        <router-link v-slot="{ navigate }" custom :to="{ name: 'bot-config', params: { bot: bot.name } }">
          <button type="button" class="button bot-config__btn bot-config__btn--secondary" @click="navigate">
            <FontAwesomeIcon icon="times" fixedWidth aria-hidden="true"></FontAwesomeIcon>
            <span>{{ $t('cancel') }}</span>
          </button>
        </router-link>
      </div>
    </footer>
  </main>
</template>

<script>
  import { mapGetters } from 'vuex';
  import ConfigEditor from '../../components/Config/Editor.vue';
  import delay from '../../utils/delay';
  import botExists from '../../utils/botExists';
  import { get } from '../../utils/storage';
  import { newBotCategories } from '../../utils/configCategories';
  import isSameConfig from '../../utils/isSameConfig';
  import unsavedChangesMixin from '../../mixins/unsaved-changes';
  import { markClean } from '../../utils/unsaved-changes';
  import '../../style/bot-form-modal.scss';

  export default {
    name: 'BotCopy',
    components: { ConfigEditor },
    mixins: [unsavedChangesMixin],
    data() {
      const fields = [
        {
          defaultValue: '',
          param: 'Name',
          paramName: 'Name',
          type: 'string',
          description: this.$t('name-description'),
          checkBotNameUnique: true,
        },
        {
          defaultValue: '',
          param: 'SteamLogin',
          paramName: 'SteamLogin',
          type: 'string',
          description: get(`cache:parameter-descriptions:${this.$i18n.locale}`).descriptions.SteamLogin,

        },
        {
          defaultValue: '',
          param: 'SteamPassword',
          paramName: 'SteamPassword',
          type: 'string',
          description: get(`cache:parameter-descriptions:${this.$i18n.locale}`).descriptions.SteamPassword,
        },
      ];

      return {
        creating: false,
        categories: newBotCategories,
        fields,
        model: {},
        originalModel: null,
      };
    },
    computed: {
      ...mapGetters({
        displayCategories: 'settings/displayCategories',
        bots: 'bots/bots',
      }),
      bot() {
        return this.$store.getters['bots/bot'](this.$route.params.bot);
      },
      isDirty() {
        if (this.creating || !this.originalModel) return false;
        return !isSameConfig(this.model, this.originalModel);
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
          const nextModel = { Name: '', ...JSON.parse(JSON.stringify(this.bot.config || {})) };
          this.model = nextModel;
          this.originalModel = JSON.parse(JSON.stringify(nextModel));
        },
      },
    },
    created() {
      if (!this.bot) this.$router.replace({ name: 'bots' });
    },
    methods: {
      async onCreate() {
        if (this.creating) return;

        const config = JSON.parse(JSON.stringify(this.model));
        delete config.Name;

        if (!this.model.Name) {
          this.$error(this.$t('bot-create-name'));
          return;
        }

        if (this.model.Name === 'ASF') {
          this.$error(this.$t('bot-create-name-asf'));
          return;
        }

        if (botExists(this.bots, this.model.Name)) {
          this.$error(this.$t('bot-name-in-use'));
          return;
        }

        this.creating = true;

        try {
          await this.$http.post(`bot/${this.model.Name}`, { botConfig: config });
          await delay(1000);
          await this.$store.dispatch('bots/updateBot', { name: this.model.Name });
          markClean();
          this.$parent.close();
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.creating = false;
        }
      },
    },
  };
</script>
