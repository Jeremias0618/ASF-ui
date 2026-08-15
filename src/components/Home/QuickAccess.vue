<template>
  <section class="home2-panel home2-panel--access" :aria-label="$t('home-quick-access')">
    <div class="home2-panel__head">
      <h2 class="home2-panel__title">{{ $t('home-quick-access') }}</h2>
      <p class="home2-panel__sub">{{ $t('home-quick-access-lead') }}</p>
    </div>
    <div class="home2-access-grid">
      <HomeAccessCard
        v-for="item in items"
        :key="item.route"
        :to="{ name: item.route }"
        :icon="item.icon"
        :title="$t(item.titleKey)"
        :hint="$t(item.hintKey)"
        :featured="Boolean(item.featured)"
      ></HomeAccessCard>
    </div>
  </section>
</template>

<script>
  import HomeAccessCard from './AccessCard.vue';

  /** Secondary destinations — primary CTAs (bots / multi-action / commands / log) live in the hero. */
  const ACCESS_ITEMS = [
    {
      route: 'mass-editor',
      icon: 'paste',
      titleKey: 'mass-editor',
      hintKey: 'home-hint-mass-editor',
      featured: true,
    },
    {
      route: 'plugins',
      icon: 'puzzle-piece',
      titleKey: 'plugins',
      hintKey: 'home-hint-plugins',
    },
    {
      route: 'asf-config',
      icon: 'edit',
      titleKey: 'asf-config',
      hintKey: 'home-hint-asf-config',
    },
    {
      route: 'ui-config',
      icon: 'wrench',
      titleKey: 'ui-config',
      hintKey: 'home-hint-ui-config',
    },
    {
      route: 'configuration',
      icon: 'cogs',
      titleKey: 'configuration',
      hintKey: 'home-hint-configuration',
    },
    {
      route: 'releases',
      icon: 'code-branch',
      titleKey: 'releases',
      hintKey: 'home-hint-releases',
    },
    {
      route: 'asf-bans',
      icon: 'ban',
      titleKey: 'asf-bans',
      hintKey: 'home-hint-asf-bans',
    },
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
  .home2-panel--access {
    .home2-panel__head {
      align-items: flex-start;
      flex-direction: column;
      gap: 0.25rem;
      margin-bottom: 1rem;
    }
  }

  .home2-panel__sub {
    color: var(--h2-muted-2);
    font-size: 0.85rem;
    line-height: 1.45;
    margin: 0;
  }

  .home2-access-grid {
    display: grid;
    gap: 0.65rem;
    grid-template-columns: 1fr;

    @media screen and (min-width: 560px) {
      grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    }
  }
</style>
