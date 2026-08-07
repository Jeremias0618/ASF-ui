<template>
  <main class="log home2-page-body">
    <header class="home2-page-intro">
      <p class="home2-page-eyebrow">{{ $t('control') }}</p>
      <h1 class="home2-page-title">{{ $t('log') }}</h1>
      <p class="home2-page-lead">{{ $t('log-lead') }}</p>
    </header>

    <div class="home2-page-panel log__panel">
      <AsfLog></AsfLog>
    </div>
  </main>
</template>

<script>
  import AsfLog from '../components/ASF/Log.vue';

  export default {
    name: 'Log',
    metaInfo() {
      return {
        title: this.$t('log'),
      };
    },
    components: { AsfLog },
  };
</script>

<style lang="scss">
  @import '../style/scrollbar';

  .log {
    display: grid;
    gap: 1rem;
    grid-template-rows: auto minmax(0, 1fr);
    min-height: 0;
  }

  .log__panel {
    background: transparent;
    border: 0;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    padding: 0;
  }

  .home2-shell .log {
    .terminal-container {
      gap: 0.75rem;
      min-height: 0;
    }

    .terminal {
      background: #0f172a;
      border-radius: 0.65rem;
      color: #e2e8f0;
      flex: 1;
      min-height: 0;
      @include h2-scrollbar;
      @include h2-scrollbar-dark;
    }

    .terminal-message__time,
    .terminal-message__process {
      color: #64748b;
    }

    .button {
      background: var(--h2-soft);
      border: 1px solid var(--h2-border);
      border-radius: 0.55rem;
      color: var(--h2-ink);
    }

    .button:hover:not(:disabled) {
      background: var(--h2-brand-50);
      border-color: var(--h2-brand);
      color: var(--h2-brand-600);
    }

    .button:disabled {
      opacity: 0.55;
    }
  }

  .app--dark-mode .home2-shell .log .terminal {
    background: #0b1220;
    color: #f1f5f9;
  }
</style>
