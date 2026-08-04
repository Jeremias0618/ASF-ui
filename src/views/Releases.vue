<template>
  <main class="releases-page home2-page-body">
    <div class="releases-page__panel">
      <AsfReleases></AsfReleases>
    </div>
  </main>
</template>

<script>
  import AsfReleases from '../components/ASF/Releases.vue';

  export default {
    name: 'Releases',
    metaInfo() {
      return {
        title: this.$t('releases'),
      };
    },
    components: { AsfReleases },
  };
</script>

<style lang="scss">
  .releases-page__panel {
    background: var(--h2-shell, var(--color-background-light));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 0.85rem;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
    color: var(--h2-ink, var(--color-text-dark));
    padding: 1.25rem 1.5rem;
  }

  .home2-shell .releases-page {
    .subtitle {
      color: var(--h2-muted);
    }

    .release {
      border-bottom-color: var(--h2-border);
    }

    .release__version {
      color: var(--h2-ink);
    }

    .release__time {
      color: var(--h2-muted);
    }

    .release__badge {
      background: var(--h2-soft);
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .release__badge--stable {
      background: rgba(18, 183, 106, 0.12);
      border-color: #12b76a;
      color: #027a48;
    }

    .release__badge--prerelease {
      background: rgba(217, 45, 32, 0.1);
      border-color: #f97066;
      color: #b42318;
    }

    .release__badge--install {
      background: var(--h2-brand-50);
      border-color: var(--h2-brand);
      color: var(--h2-brand-600);
    }

    .release__changelog-link,
    .release__changes a {
      color: var(--h2-brand-600);
    }

    .release__changes {
      color: var(--h2-muted-2);
    }
  }

  .app--dark-mode .home2-shell .releases-page {
    .release__badge--stable {
      background: rgba(18, 183, 106, 0.12);
      color: #6ce9a6;
    }

    .release__badge--prerelease {
      background: rgba(249, 112, 102, 0.12);
      color: #fda29b;
    }

    .release__badge--install {
      color: var(--h2-brand);
    }

    .release__changelog-link,
    .release__changes a {
      color: var(--h2-brand);
    }
  }
</style>
