<template>
  <main class="plugins-page home2-page-body">
    <div class="plugins-page__panel">
      <AsfPlugins></AsfPlugins>
    </div>
  </main>
</template>

<script>
  import AsfPlugins from '../components/ASF/Plugins.vue';

  export default {
    name: 'Plugins',
    metaInfo() {
      return {
        title: this.$t('plugins'),
      };
    },
    components: { AsfPlugins },
  };
</script>

<style lang="scss">
  .plugins-page__panel {
    background: var(--h2-shell, var(--color-background-light));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 0.85rem;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
    color: var(--h2-ink, var(--color-text-dark));
    padding: 1.25rem 1.5rem;
  }

  .home2-shell .plugins-page {
    .subtitle {
      color: var(--h2-muted);
    }

    .plugin {
      border-bottom-color: var(--h2-border);
    }

    .plugin__name {
      color: var(--h2-ink);
    }

    .plugin__version {
      color: var(--h2-muted);
    }

    .plugin__label {
      background: var(--h2-brand-50);
      border-color: #12b76a;
      border-radius: 999px;
      color: #027a48;
      font-size: 0.75rem;
      font-weight: 600;
    }
  }

  .app--dark-mode .home2-shell .plugins-page .plugin__label {
    background: rgba(18, 183, 106, 0.12);
    color: #6ce9a6;
  }
</style>
