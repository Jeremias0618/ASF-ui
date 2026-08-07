<template>
  <ConfigurationSection
    icon="wrench"
    :title="$t('configuration-section-related')"
    :lead="$t('configuration-section-related-lead')"
    title-id="config-related-title"
  >
    <div class="config-links">
      <router-link
        v-for="item in links"
        :key="item.route"
        class="config-link"
        :to="{ name: item.route }"
      >
        <span class="config-link__icon" aria-hidden="true">
          <FontAwesomeIcon :icon="item.icon" fixedWidth></FontAwesomeIcon>
        </span>
        <span class="config-link__copy">
          <span class="config-link__title">{{ $t(item.titleKey) }}</span>
          <span class="config-link__help">{{ $t(item.helpKey) }}</span>
        </span>
        <span class="config-link__arrow" aria-hidden="true">→</span>
      </router-link>
    </div>
  </ConfigurationSection>
</template>

<script>
  import ConfigurationSection from './Section.vue';

  export default {
    name: 'ConfigurationRelated',
    components: { ConfigurationSection },
    computed: {
      links() {
        return [
          { route: 'asf-config', icon: 'edit', titleKey: 'asf-config', helpKey: 'asf-config-lead' },
          { route: 'ui-config', icon: 'cogs', titleKey: 'ui-config', helpKey: 'ui-config-lead' },
          { route: 'mass-editor', icon: 'paste', titleKey: 'mass-editor', helpKey: 'mass-editor-lead' },
          { route: 'asf-bans', icon: 'ban', titleKey: 'asf-bans', helpKey: 'asf-bans-lead' },
        ];
      },
    },
  };
</script>
