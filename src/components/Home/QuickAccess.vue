<template>
  <section class="home-quick-access">
    <h2 class="home-section-title">{{ $t('home-quick-access') }}</h2>
    <div class="home-quick-access__grid home-stagger">
      <HomeAccessCard
        v-for="item in items"
        :key="item.route"
        :to="{ name: item.route }"
        :icon="item.icon"
        :title="$t(item.titleKey)"
        :hint="$t(item.hintKey)"
      ></HomeAccessCard>
    </div>
  </section>
</template>

<script>
  import HomeAccessCard from './AccessCard.vue';

  const ACCESS_ITEMS = [
    { route: 'bots', icon: 'users', titleKey: 'bots', hintKey: 'home-hint-bots' },
    { route: 'commands', icon: 'laptop', titleKey: 'commands', hintKey: 'home-hint-commands' },
    { route: 'log', icon: 'file-alt', titleKey: 'log', hintKey: 'home-hint-log' },
    { route: 'plugins', icon: 'puzzle-piece', titleKey: 'plugins', hintKey: 'home-hint-plugins' },
    { route: 'asf-config', icon: 'edit', titleKey: 'asf-config', hintKey: 'home-hint-asf-config' },
    { route: 'mass-editor', icon: 'paste', titleKey: 'mass-editor', hintKey: 'home-hint-mass-editor' },
    { route: 'ui-config', icon: 'wrench', titleKey: 'ui-config', hintKey: 'home-hint-ui-config' },
  ];

  export default {
    name: 'HomeQuickAccess',
    components: { HomeAccessCard },
    data() {
      return {
        items: ACCESS_ITEMS,
      };
    },
  };
</script>

<style lang="scss">
  .home-quick-access__grid {
    display: grid;
    gap: 0.85rem;
    grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr));
  }
</style>
