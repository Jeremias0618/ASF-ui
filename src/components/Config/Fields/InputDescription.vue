<template>
  <transition name="form-item__help">
    <div
      v-if="shown"
      class="form-item__description"
      role="region"
      @click.stop
    >
      <div class="form-item__description-content" v-html="description"></div>
    </div>
  </transition>
</template>

<script>
  export default {
    name: 'InputDescription',
    props: {
      description: String,
      shown: Boolean,
    },
  };
</script>

<style lang="scss">
  .form-item__description {
    background: var(--h2-soft, var(--color-background));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 0.55rem;
    box-shadow: 0 12px 28px -10px rgba(16, 24, 40, 0.35);
    box-sizing: border-box;
    color: var(--h2-muted, var(--color-text-dark));
    font-size: 0.8125rem;
    left: 0;
    line-height: 1.45;
    max-height: min(14rem, 40vh);
    overflow: auto;
    padding: 0.75rem 0.9rem;
    position: absolute;
    right: 0;
    top: calc(100% + 0.35rem);
    z-index: 20;
    -webkit-overflow-scrolling: touch;

    .app--dark-mode & {
      background: var(--h2-elevated, #151b28);
      box-shadow: 0 16px 36px -12px rgba(0, 0, 0, 0.55);
    }
  }

  .form-item__description-content {
    display: block;
    margin: 0;
    overflow-wrap: anywhere;
    word-break: break-word;

    > *:first-child {
      margin-top: 0;
    }

    > *:last-child {
      margin-bottom: 0;
    }

    a {
      color: var(--h2-brand, var(--color-theme));
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    table {
      display: block;
      max-width: 100%;
      overflow-x: auto;
    }

    td, th {
      padding: 0.15em 0.5em 0.15em 0;
      text-align: left;
      vertical-align: top;
    }

    img {
      height: auto;
      max-width: 100%;
    }
  }

  .form-item__help-enter-active,
  .form-item__help-leave-active {
    transition: opacity 0.18s ease, transform 0.18s ease;
  }

  .form-item__help-enter,
  .form-item__help-leave-to {
    opacity: 0;
    transform: translateY(-0.25rem);
  }

  @media (prefers-reduced-motion: reduce) {
    .form-item__help-enter-active,
    .form-item__help-leave-active {
      transition: none;
    }
  }
</style>
