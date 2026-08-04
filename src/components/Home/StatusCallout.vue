<template>
  <section class="home-callout home-card" :class="`home-callout--${variant}`">
    <div class="home-callout__body">
      <h2 class="home-section-title">{{ title }}</h2>
      <p class="home-muted">{{ description }}</p>
    </div>
    <router-link
      v-if="actionTo"
      class="home-callout__action"
      :to="actionTo"
    >
      {{ actionLabel }}
    </router-link>
  </section>
</template>

<script>
  import { mapGetters } from 'vuex';

  export default {
    name: 'HomeStatusCallout',
    computed: {
      ...mapGetters({
        bots: 'bots/bots',
        botsFarmingCount: 'bots/botsFarmingCount',
      }),
      hasBots() {
        return this.bots.length > 0;
      },
      variant() {
        if (!this.hasBots) return 'empty';
        if (this.botsFarmingCount > 0) return 'farming';
        return 'ready';
      },
      title() {
        if (!this.hasBots) return this.$t('home-callout-empty-title');
        if (this.botsFarmingCount > 0) return this.$t('home-callout-farming-title');
        return this.$t('home-callout-ready-title');
      },
      description() {
        if (!this.hasBots) return this.$t('home-callout-empty-description');
        if (this.botsFarmingCount > 0) {
          return this.$t('home-callout-farming-description', { n: this.botsFarmingCount });
        }
        return this.$t('home-callout-ready-description', { n: this.bots.length });
      },
      actionLabel() {
        if (!this.hasBots) return this.$t('home-callout-empty-action');
        return this.$t('home-callout-bots-action');
      },
      actionTo() {
        if (!this.hasBots) return { name: 'bot-create' };
        return { name: 'bots' };
      },
    },
  };
</script>

<style lang="scss">
  .home-callout {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    justify-content: space-between;
    min-height: 100%;
  }

  .home-callout--empty {
    background: linear-gradient(145deg, var(--home-surface) 60%, var(--home-accent-soft));
  }

  .home-callout--farming .home-section-title {
    color: #3f7d1f;
  }

  .app--dark-mode .home-callout--farming .home-section-title {
    color: #9fd36a;
  }

  .home-callout__action {
    align-self: flex-start;
    background: var(--home-accent);
    border-radius: 999px;
    color: #fff;
    display: inline-flex;
    font-size: 0.9rem;
    font-weight: 600;
    padding: 0.65rem 1.1rem;
    text-decoration: none;
    transition: opacity 0.2s ease;

    &:hover,
    &:focus-visible {
      opacity: 0.9;
      outline: 2px solid var(--home-accent);
      outline-offset: 2px;
    }
  }
</style>
