<template>
  <main class="config-dash home2-page-body">
    <header class="config-dash__intro">
      <div class="config-dash__intro-copy">
        <p class="home2-page-eyebrow">{{ $t('home2-section-config') }}</p>
        <h1 class="home2-page-title">{{ $t('configuration') }}</h1>
        <p class="home2-page-lead">{{ $t('configuration-hub-lead') }}</p>
      </div>

      <nav class="config-dash__jump" :aria-label="$t('configuration-nav-label')">
        <a
          v-for="item in jumpLinks"
          :key="item.id"
          class="config-dash__jump-link"
          :href="`#${item.id}`"
          @click.prevent="scrollTo(item.id)"
        >
          <FontAwesomeIcon :icon="item.icon" fixedWidth aria-hidden="true"></FontAwesomeIcon>
          <span>{{ $t(item.titleKey) }}</span>
        </a>
      </nav>
    </header>

    <!-- Row: look & language — equal height -->
    <div class="config-dash__row config-dash__row--2">
      <div id="appearance" class="config-dash__cell">
        <ConfigurationAppearance></ConfigurationAppearance>
      </div>
      <div id="language" class="config-dash__cell">
        <ConfigurationLanguage></ConfigurationLanguage>
      </div>
    </div>

    <!-- Row: preferences full bleed -->
    <div class="config-dash__row config-dash__row--1">
      <div id="preferences" class="config-dash__cell">
        <ConfigurationPreferences></ConfigurationPreferences>
      </div>
    </div>

    <!-- Row: security / instance / related — equal thirds -->
    <div class="config-dash__row config-dash__row--3">
      <div id="security" class="config-dash__cell">
        <ConfigurationSecurity></ConfigurationSecurity>
      </div>
      <div id="instance" class="config-dash__cell">
        <ConfigurationInstance @request-action="onInstanceAction"></ConfigurationInstance>
      </div>
      <div id="related" class="config-dash__cell">
        <ConfigurationRelated></ConfigurationRelated>
      </div>
    </div>

    <SideMenuInstanceModal
      :action="instanceAction"
      @close="instanceAction = null"
    ></SideMenuInstanceModal>
  </main>
</template>

<script>
  import ConfigurationAppearance from '../components/Configuration/Appearance.vue';
  import ConfigurationLanguage from '../components/Configuration/Language.vue';
  import ConfigurationSecurity from '../components/Configuration/Security.vue';
  import ConfigurationInstance from '../components/Configuration/Instance.vue';
  import ConfigurationPreferences from '../components/Configuration/Preferences.vue';
  import ConfigurationRelated from '../components/Configuration/Related.vue';
  import SideMenuInstanceModal from '../components/App/partials/SideMenuInstanceModal.vue';
  import { CONFIG_SECTIONS } from '../components/Configuration/Nav.vue';
  import '../style/configuration.scss';

  export default {
    name: 'Configuration',
    metaInfo() {
      return {
        title: this.$t('configuration'),
      };
    },
    components: {
      ConfigurationAppearance,
      ConfigurationLanguage,
      ConfigurationSecurity,
      ConfigurationInstance,
      ConfigurationPreferences,
      ConfigurationRelated,
      SideMenuInstanceModal,
    },
    data() {
      return {
        instanceAction: null,
        jumpLinks: CONFIG_SECTIONS,
      };
    },
    mounted() {
      const section = this.$route.query.section;
      if (section) this.$nextTick(() => this.scrollTo(section));
    },
    methods: {
      onInstanceAction(action) {
        this.instanceAction = action;
      },
      scrollTo(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.$router.replace({
          name: 'configuration',
          query: id === 'appearance' ? {} : { section: id },
        }).catch(() => {});
      },
    },
  };
</script>
