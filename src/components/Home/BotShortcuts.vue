<template>
  <section v-if="visibleBots.length" class="home-bots">
    <div class="home-bots__heading">
      <h2 class="home-section-title">{{ $t('home-bots-title') }}</h2>
      <router-link class="home-bots__all" :to="{ name: 'bots' }">{{ $t('home-bots-view-all') }}</router-link>
    </div>
    <div class="home-bots__grid home-stagger">
      <router-link
        v-for="bot in visibleBots"
        :key="bot.name"
        class="home-bot-card home-card home-card--interactive"
        :class="`status--${bot.status}`"
        :to="{ name: 'bot', params: { bot: bot.name } }"
      >
        <img class="home-bot-card__avatar" :src="bot.avatarURL" :alt="bot.viewableName">
        <div class="home-bot-card__copy">
          <span class="home-bot-card__name">{{ bot.viewableName }}</span>
          <span class="home-bot-card__status">{{ bot.statusText }}</span>
        </div>
      </router-link>
    </div>
  </section>
</template>

<script>
  import { mapGetters } from 'vuex';

  const MAX_BOTS = 6;

  export default {
    name: 'HomeBotShortcuts',
    computed: {
      ...mapGetters({ bots: 'bots/bots' }),
      visibleBots() {
        return this.bots.slice(0, MAX_BOTS);
      },
    },
  };
</script>

<style lang="scss">
  .home-bots__heading {
    align-items: baseline;
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    margin-bottom: 0.85rem;

    .home-section-title {
      margin: 0;
    }
  }

  .home-bots__all {
    color: var(--home-accent);
    font-size: 0.9rem;
    font-weight: 600;
    text-decoration: none;

    &:hover,
    &:focus-visible {
      text-decoration: underline;
    }
  }

  .home-bots__grid {
    display: grid;
    gap: 0.85rem;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  }

  .home-bot-card {
    align-items: center;
    display: flex;
    gap: 0.85rem;
    position: relative;

    &::before {
      background: var(--color-status, var(--home-muted));
      border-radius: 999px;
      content: '';
      height: 0.55rem;
      position: absolute;
      right: 1rem;
      top: 1rem;
      width: 0.55rem;
    }
  }

  .home-bot-card__avatar {
    border-radius: 0.85rem;
    height: 3rem;
    object-fit: cover;
    width: 3rem;
  }

  .home-bot-card__copy {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .home-bot-card__name {
    font-family: var(--h2-font, 'Segoe UI', system-ui, sans-serif);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .home-bot-card__status {
    color: var(--home-muted);
    font-size: 0.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
