<template>
  <ConfigurationSection
    icon="cogs"
    :title="$t('configuration-section-preferences')"
    :lead="$t('configuration-section-preferences-lead')"
    title-id="config-preferences-title"
  >
    <template #action>
      <router-link class="config-card__link" :to="{ name: 'ui-config' }">
        {{ $t('configuration-preferences-advanced') }}
      </router-link>
    </template>

    <div class="config-prefs">
      <div class="config-prefs__fields">
        <div class="config-field">
          <label class="config-field__label" for="config-default-view">{{ $t('default-page') }}</label>
          <select id="config-default-view" v-model="model.defaultView" class="config-field__select">
            <option v-for="(value, label) in defaultViewOptions" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>

        <div class="config-field">
          <label class="config-field__label" for="config-notification-position">{{ $t('notification-position') }}</label>
          <select id="config-notification-position" v-model="model.notificationPosition" class="config-field__select">
            <option v-for="(value, label) in notificationOptions" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
      </div>

      <div class="config-toggles config-toggles--grid">
        <label v-for="item in toggleItems" :key="item.key" class="config-toggle">
          <span class="config-toggle__copy">
            <span class="config-toggle__title">{{ $t(item.titleKey) }}</span>
            <span class="config-toggle__help">{{ $t(item.helpKey) }}</span>
          </span>
          <input v-model="model[item.key]" class="config-toggle__input" type="checkbox">
          <span class="config-toggle__switch" aria-hidden="true"></span>
        </label>
      </div>

      <div class="config-actions">
        <button type="button" class="config-btn config-btn--primary" :disabled="saving || !isDirty" @click="save">
          <FontAwesomeIcon v-if="saving" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ $t('save') }}</span>
        </button>
        <span v-if="savedFlash" class="config-saved" role="status">{{ $t('settings-saved') }}</span>
      </div>
    </div>
  </ConfigurationSection>
</template>

<script>
  import ConfigurationSection from './Section.vue';

  function snapshotFromStore(store) {
    return {
      defaultView: store.getters['settings/defaultView'],
      notificationPosition: store.getters['settings/notificationPosition'],
      notifyRelease: store.getters['settings/notifyRelease'],
      displayCategories: store.getters['settings/displayCategories'],
      timestamps: store.getters['settings/timestamps'],
      nicknames: store.getters['settings/nicknames'],
      gameName: store.getters['settings/gameName'],
      orderBotsNumeric: store.getters['settings/orderBotsNumeric'],
      orderDisabledBotsLast: store.getters['settings/orderDisabledBotsLast'],
    };
  }

  export default {
    name: 'ConfigurationPreferences',
    components: { ConfigurationSection },
    data() {
      const model = snapshotFromStore(this.$store);
      return {
        saving: false,
        savedFlash: false,
        model: { ...model },
        baseline: JSON.stringify(model),
      };
    },
    computed: {
      isDirty() {
        return JSON.stringify(this.model) !== this.baseline;
      },
      defaultViewOptions() {
        return {
          [this.$t('home')]: 'home',
          [this.$t('bots')]: 'bots',
          [this.$t('commands')]: 'commands',
          [this.$t('releases')]: 'releases',
          [this.$t('credits')]: 'credits',
          [this.$t('plugins')]: 'plugins',
          [this.$t('log')]: 'log',
          [this.$t('asf-config')]: 'asf-config',
          [this.$t('ui-config')]: 'ui-config',
          [this.$t('mass-editor')]: 'mass-editor',
          [this.$t('last-visited-page')]: '_last-visited-page',
        };
      },
      notificationOptions() {
        return {
          [this.$t('notification-position-left-top')]: 'leftTop',
          [this.$t('notification-position-left-bottom')]: 'leftBottom',
          [this.$t('notification-position-right-top')]: 'rightTop',
          [this.$t('notification-position-right-bottom')]: 'rightBottom',
          [this.$t('notification-position-center-top')]: 'centerTop',
          [this.$t('notification-position-center-bottom')]: 'centerBottom',
        };
      },
      toggleItems() {
        return [
          { key: 'notifyRelease', titleKey: 'notify-release', helpKey: 'notify-release-description' },
          { key: 'displayCategories', titleKey: 'display-categories', helpKey: 'display-categories-description' },
          { key: 'timestamps', titleKey: 'timestamps', helpKey: 'timestamps-description' },
          { key: 'nicknames', titleKey: 'bot-nicknames', helpKey: 'bot-nicknames-description' },
          { key: 'gameName', titleKey: 'bot-game-name', helpKey: 'bot-game-name-description' },
          { key: 'orderBotsNumeric', titleKey: 'bot-order-numeric', helpKey: 'bot-order-numeric-description' },
          { key: 'orderDisabledBotsLast', titleKey: 'bot-order-disabled', helpKey: 'bot-order-disabled-description' },
        ];
      },
    },
    methods: {
      async save() {
        if (!this.isDirty || this.saving) return;
        this.saving = true;
        try {
          this.$store.dispatch('settings/setDefaultView', this.model.defaultView);
          this.$store.dispatch('settings/setNotificationPosition', this.model.notificationPosition);
          this.$store.dispatch('settings/setNotifyRelease', this.model.notifyRelease);
          this.$store.dispatch('settings/setDisplayCategories', this.model.displayCategories);
          this.$store.dispatch('settings/setTimestamps', this.model.timestamps);
          this.$store.dispatch('settings/setNicknames', this.model.nicknames);
          this.$store.dispatch('settings/setGameName', this.model.gameName);
          this.$store.dispatch('settings/setOrderBotsNumeric', this.model.orderBotsNumeric);
          this.$store.dispatch('settings/setOrderDisabledBotsLast', this.model.orderDisabledBotsLast);

          this.$snotify.setDefaults({
            toast: { position: this.model.notificationPosition },
          });

          this.baseline = JSON.stringify(this.model);
          this.savedFlash = true;
          this.$success(this.$t('settings-saved'));
          window.setTimeout(() => { this.savedFlash = false; }, 2500);
        } finally {
          this.saving = false;
        }
      },
    },
  };
</script>
