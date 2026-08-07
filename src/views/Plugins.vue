<template>
  <main class="plugins-page home2-page-body">
    <header class="home2-page-intro">
      <p class="home2-page-eyebrow">{{ $t('control') }}</p>
      <h1 class="home2-page-title">{{ $t('plugins') }}</h1>
      <p class="home2-page-lead">{{ $t('plugins-lead') }}</p>
    </header>

    <div class="home2-page-panel plugins-page__panel">
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
    background: transparent;
    border: 0;
    box-shadow: none;
    color: var(--h2-ink, var(--color-text-dark));
    padding: 0;
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
