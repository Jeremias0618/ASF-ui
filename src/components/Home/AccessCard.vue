<template>
  <router-link
    class="home2-access"
    :class="{ 'is-featured': featured }"
    :to="to"
  >
    <span class="home2-access__icon" aria-hidden="true">
      <FontAwesomeIcon :icon="icon"></FontAwesomeIcon>
    </span>
    <span class="home2-access__copy">
      <span class="home2-access__title">{{ title }}</span>
      <span class="home2-access__hint">{{ hint }}</span>
    </span>
    <span class="home2-access__chevron" aria-hidden="true">
      <FontAwesomeIcon icon="chevron-right"></FontAwesomeIcon>
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
      featured: {
        type: Boolean,
        default: false,
      },
    },
  };
</script>

<style lang="scss">
  .home2-access {
    align-items: center;
    background: var(--h2-surface);
    border: 1px solid var(--h2-border);
    border-radius: 0.85rem;
    color: inherit;
    display: grid;
    gap: 0.75rem;
    grid-template-columns: auto 1fr auto;
    min-height: 4.25rem;
    padding: 0.85rem 1rem;
    text-decoration: none;
    transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;

    &:hover,
    &:focus-visible {
      border-color: var(--h2-brand);
      outline: none;
      transform: translateY(-1px);
    }

    &.is-featured {
      background: rgba(9, 104, 229, 0.06);
      border-color: rgba(9, 104, 229, 0.28);

      .home2-access__icon {
        background: var(--h2-brand-600);
        color: #fff;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;

      &:hover,
      &:focus-visible {
        transform: none;
      }
    }
  }

  .home2-access__icon {
    align-items: center;
    background: var(--h2-soft);
    border-radius: 0.7rem;
    color: var(--h2-brand-600);
    display: inline-flex;
    flex-shrink: 0;
    font-size: 0.95rem;
    height: 2.35rem;
    justify-content: center;
    width: 2.35rem;
  }

  .home2-access__copy {
    display: grid;
    gap: 0.15rem;
    min-width: 0;
  }

  .home2-access__title {
    font-size: 0.9rem;
    font-weight: 650;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .home2-access__hint {
    color: var(--h2-muted);
    font-size: 0.75rem;
    line-height: 1.35;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .home2-access__chevron {
    color: var(--h2-muted);
    font-size: 0.7rem;
  }
</style>
