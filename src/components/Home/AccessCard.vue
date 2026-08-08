<template>
  <router-link
    class="home-access-card home-card home-card--interactive"
    :to="to"
  >
    <span class="home-access-card__icon" aria-hidden="true">
      <FontAwesomeIcon :icon="icon"></FontAwesomeIcon>
    </span>
    <span class="home-access-card__copy">
      <span class="home-access-card__title">{{ title }}</span>
      <span class="home-access-card__hint">{{ hint }}</span>
    </span>
  </router-link>
</template>

<script>
  export default {
    name: 'HomeAccessCard',
    props: {
      to: {
        type: Object,
        required: true,
      },
      icon: {
        type: String,
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      hint: {
        type: String,
        required: true,
      },
    },
  };
</script>

<style lang="scss">
  .home-access-card {
    align-items: flex-start;
    display: flex;
    gap: 0.85rem;
    min-height: 6.5rem;
  }

  .home-access-card__icon {
    align-items: center;
    background: var(--home-accent-soft);
    border-radius: 0.9rem;
    color: var(--home-accent);
    display: inline-flex;
    flex-shrink: 0;
    font-size: 1.1rem;
    height: 2.5rem;
    justify-content: center;
    width: 2.5rem;
  }

  .home-access-card__copy {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .home-access-card__title {
    font-family: var(--h2-font, 'Segoe UI', system-ui, sans-serif);
    font-size: 1rem;
    font-weight: 600;
  }

  .home-access-card__hint {
    color: var(--home-muted);
    font-size: 0.82rem;
    line-height: 1.4;
  }
</style>
