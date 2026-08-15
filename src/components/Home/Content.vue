<template>
  <div class="home2-content">
    <section class="home2-hero">
      <p class="home2-hero__eyebrow">{{ $t('home') }}</p>
      <h1 class="home2-hero__title">{{ $t('home2-welcome', { name: brand }) }}</h1>
      <p class="home2-hero__lead">{{ $t('home2-lead') }}</p>

      <div class="home2-kpis">
        <article class="home2-kpi">
          <p class="home2-kpi__label">{{ $t('home-version') }}</p>
          <p class="home2-kpi__value">{{ versionLabel }}</p>
        </article>
        <article class="home2-kpi">
          <p class="home2-kpi__label">{{ $t('home-uptime') }}</p>
          <p class="home2-kpi__value">{{ uptime || '—' }}</p>
        </article>
        <article class="home2-kpi">
          <p class="home2-kpi__label">{{ $t('bots') }}</p>
          <p class="home2-kpi__value">{{ bots.length }}</p>
        </article>
        <article class="home2-kpi">
          <p class="home2-kpi__label">{{ $t('home-metric-farming') }}</p>
          <p class="home2-kpi__value">{{ botsFarmingCount }}</p>
        </article>
        <article class="home2-kpi">
          <p class="home2-kpi__label">{{ $t('home-memory') }}</p>
          <p class="home2-kpi__value home2-kpi__value--mono">{{ memory || '—' }}</p>
        </article>
        <article class="home2-kpi">
          <p class="home2-kpi__label">{{ $t('farming-info-games') }}</p>
          <p class="home2-kpi__value">{{ gamesLabel }}</p>
        </article>
      </div>

      <div class="home2-hero__actions">
        <router-link class="home2-btn home2-btn--primary" :to="{ name: 'bots' }">
          {{ $t('home-callout-bots-action') }}
        </router-link>
        <router-link class="home2-btn home2-btn--accent" :to="{ name: 'multi-action' }">
          <FontAwesomeIcon icon="layer-group" aria-hidden="true"></FontAwesomeIcon>
          {{ $t('bulk-actions') }}
        </router-link>
        <router-link class="home2-btn home2-btn--ghost" :to="{ name: 'commands' }">
          {{ $t('commands') }}
        </router-link>
        <router-link class="home2-btn home2-btn--ghost" :to="{ name: 'log' }">
          {{ $t('log') }}
        </router-link>
      </div>
    </section>

    <HomeQuickAccess></HomeQuickAccess>

    <section v-if="previewBots.length" class="home2-panel">
      <div class="home2-panel__head">
        <h2 class="home2-panel__title">{{ $t('home-bots-title') }}</h2>
        <router-link class="home2-panel__link" :to="{ name: 'bots' }">{{ $t('home-bots-view-all') }}</router-link>
      </div>
      <div class="home2-bots">
        <router-link
          v-for="bot in previewBots"
          :key="bot.name"
          class="home2-bot"
          :class="`status--${bot.status}`"
          :to="{ name: 'bot', params: { bot: bot.name } }"
        >
          <img class="home2-bot__avatar" :src="bot.avatarURL" :alt="bot.viewableName">
          <div class="home2-bot__copy">
            <span class="home2-bot__name">{{ bot.viewableName }}</span>
            <span class="home2-bot__status">{{ bot.statusText }}</span>
          </div>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex';
  import HomeQuickAccess from './QuickAccess.vue';

  export default {
    name: 'HomeContent',
    components: { HomeQuickAccess },
    computed: {
      ...mapGetters({
        bots: 'bots/bots',
        botsFarmingCount: 'bots/botsFarmingCount',
        gamesRemaining: 'bots/gamesRemaining',
        version: 'asf/version',
        buildVariant: 'asf/buildVariant',
        uptime: 'asf/uptime',
        memory: 'asf/memory',
      }),
      brand() {
        return this.$t('home-brand');
      },
      versionLabel() {
        if (!this.version) return '—';
        return this.buildVariant ? `${this.version} (${this.buildVariant})` : String(this.version);
      },
      gamesLabel() {
        return this.botsFarmingCount === 0 ? '—' : this.gamesRemaining;
      },
      previewBots() {
        return this.bots;
      },
    },
  };
</script>

<style lang="scss">
  .home2-content {
    display: grid;
    gap: 1rem;

    @media screen and (min-width: 768px) {
      gap: 1.5rem;
    }
  }

  .home2-hero,
  .home2-panel {
    background: var(--h2-shell);
    border: 1px solid var(--h2-border);
    border-radius: 1rem;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
    padding: 1.5rem;

    @media screen and (min-width: 768px) {
      padding: 2rem;
    }
  }

  .home2-hero__eyebrow {
    color: var(--h2-brand-600);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin: 0;
    text-transform: uppercase;
  }

  .home2-hero__title {
    font-size: clamp(1.5rem, 2.4vw, 1.9rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    margin: 0.5rem 0 0;
  }

  .home2-hero__lead {
    color: var(--h2-muted-2);
    font-size: 0.95rem;
    line-height: 1.55;
    margin: 0.55rem 0 0;
    max-width: 40rem;
  }

  .home2-kpis {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: 1fr;
    margin-top: 1.5rem;

    @media screen and (min-width: 640px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media screen and (min-width: 1024px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .home2-kpi {
    background: var(--h2-surface);
    border: 1px solid #f2f4f7;
    border-radius: 0.75rem;
    padding: 1rem;

    .app--dark-mode & {
      border-color: var(--h2-border);
    }
  }

  .home2-kpi__label {
    color: var(--h2-muted);
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    margin: 0;
    text-transform: uppercase;
  }

  .home2-kpi__value {
    font-family: inherit;
    font-size: 1rem;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: 1.35;
    margin: 0.35rem 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--mono {
      font-family: inherit;
      font-size: 1rem;
    }
  }

  .home2-hero__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 1.35rem;
  }

  .home2-btn {
    align-items: center;
    border-radius: 0.65rem;
    display: inline-flex;
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.65rem 1rem;
    text-decoration: none;

    &--primary {
      background: var(--h2-brand-600);
      color: #fff;

      &:hover,
      &:focus-visible {
        filter: brightness(0.95);
        outline: 2px solid rgba(9, 104, 229, 0.35);
        outline-offset: 2px;
      }
    }

    &--accent {
      background: rgba(9, 104, 229, 0.12);
      border: 1px solid rgba(9, 104, 229, 0.28);
      color: var(--h2-brand-600);
      gap: 0.45rem;

      &:hover,
      &:focus-visible {
        background: rgba(9, 104, 229, 0.18);
        outline: none;
      }
    }

    &--ghost {
      background: transparent;
      border: 1px solid var(--h2-border);
      color: var(--h2-ink);

      &:hover,
      &:focus-visible {
        background: var(--h2-soft);
        outline: none;
      }
    }
  }

  .home2-panel__head {
    align-items: baseline;
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .home2-panel__title {
    font-size: 1rem;
    font-weight: 650;
    margin: 0;
  }

  .home2-panel__link {
    color: var(--h2-brand-600);
    font-size: 0.85rem;
    font-weight: 600;
    text-decoration: none;

    &:hover,
    &:focus-visible {
      text-decoration: underline;
    }
  }

  .home2-bots {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  }

  .home2-bot {
    align-items: center;
    background: var(--h2-surface);
    border: 1px solid var(--h2-border);
    border-radius: 0.85rem;
    color: inherit;
    display: flex;
    gap: 0.75rem;
    padding: 0.85rem;
    position: relative;
    text-decoration: none;
    transition: border-color 0.15s ease, transform 0.15s ease;

    &.status--online {
      --color-status: #57cbde;
    }

    &.status--farming {
      --color-status: #90ba3c;
    }

    &.status--offline {
      --color-status: #898989;
    }

    &.status--disabled {
      --color-status: #bfc3cb;
    }

    &::after {
      background: var(--color-status);
      border-radius: 999px;
      box-shadow: 0 0 0 2px var(--h2-surface);
      content: '';
      height: 0.55rem;
      position: absolute;
      right: 0.85rem;
      top: 0.85rem;
      width: 0.55rem;
    }

    &:hover,
    &:focus-visible {
      border-color: var(--h2-brand);
      outline: none;
      transform: translateY(-1px);
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;

      &:hover,
      &:focus-visible {
        transform: none;
      }
    }
  }

  .home2-bot__avatar {
    border-radius: 0.65rem;
    height: 2.5rem;
    object-fit: cover;
    width: 2.5rem;
  }

  .home2-bot__copy {
    display: grid;
    gap: 0.15rem;
    min-width: 0;
  }

  .home2-bot__name {
    font-size: 0.875rem;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .home2-bot__status {
    color: var(--h2-muted);
    font-size: 0.75rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
