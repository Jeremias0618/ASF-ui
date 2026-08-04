<template>
  <section class="home-farming home-card">
    <h2 class="home-section-title">{{ $t('home-farming-title') }}</h2>
    <p class="home-muted">{{ $t('home-farming-subtitle', { n: botsFarmingCount }) }}</p>
    <div class="home-farming__grid">
      <div class="home-farming__metric">
        <FontAwesomeIcon icon="gamepad" class="home-farming__icon"></FontAwesomeIcon>
        <span class="home-farming__value">{{ gamesRemaining }}</span>
        <span class="home-farming__label">{{ $t('farming-info-games') }}</span>
      </div>
      <div class="home-farming__metric">
        <FontAwesomeIcon icon="clock" class="home-farming__icon"></FontAwesomeIcon>
        <span class="home-farming__value">{{ timeRemaining }}</span>
        <span class="home-farming__label">{{ $t('farming-info-time') }}</span>
      </div>
      <div class="home-farming__metric">
        <FontAwesomeIcon icon="clone" class="home-farming__icon"></FontAwesomeIcon>
        <span class="home-farming__value">{{ cardsRemaining }}</span>
        <span class="home-farming__label">{{ $t('farming-info-cards') }}</span>
      </div>
    </div>
  </section>
</template>

<script>
  import { mapGetters } from 'vuex';
  import humanizeDuration from 'humanize-duration';
  import getLocaleForHD from '../../utils/getLocaleForHD';

  export default {
    name: 'HomeFarmingSnapshot',
    computed: {
      ...mapGetters({ botsFarmingCount: 'bots/botsFarmingCount' }),
      timeRemaining() {
        if (this.botsFarmingCount === 0) return '—';
        const language = getLocaleForHD();
        return humanizeDuration(this.$store.getters['bots/timeRemaining'] * 1000, { language });
      },
      gamesRemaining() {
        if (this.botsFarmingCount === 0) return '—';
        return this.$store.getters['bots/gamesRemaining'];
      },
      cardsRemaining() {
        if (this.botsFarmingCount === 0) return '—';
        return this.$store.getters['bots/cardsRemaining'];
      },
    },
  };
</script>

<style lang="scss">
  .home-farming__grid {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(3, 1fr);
    margin-top: 1rem;

    @media screen and (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }

  .home-farming__metric {
    background: var(--home-bg);
    border-radius: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.9rem;
  }

  .home-farming__icon {
    color: var(--home-accent);
    margin-bottom: 0.25rem;
  }

  .home-farming__value {
    font-family: var(--home-font-display);
    font-size: 1.15rem;
    font-weight: 700;
  }

  .home-farming__label {
    color: var(--home-muted);
    font-size: 0.8rem;
  }
</style>
