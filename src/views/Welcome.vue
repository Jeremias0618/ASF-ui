<template>
  <main class="welcome-page" :class="{ 'is-dark': darkMode }">
    <div class="welcome-page__atmosphere" aria-hidden="true"></div>

    <div class="welcome-page__top">
      <button
        type="button"
        class="welcome-page__settings"
        :aria-label="$t('sidebar-toggle')"
        :aria-expanded="sideMenu ? 'true' : 'false'"
        @click="toggleSideMenu"
      >
        <FontAwesomeIcon icon="cogs" fixedWidth></FontAwesomeIcon>
      </button>
    </div>

    <section class="welcome-page__card" aria-labelledby="welcome-title">
      <div class="welcome-page__brand">
        <img class="welcome-page__logo" :src="logoSrc" alt="" width="56" height="56">
        <p class="welcome-page__eyebrow">{{ $t('home-brand') }}</p>
        <h1 id="welcome-title" class="welcome-page__title">{{ $t('welcome') }}</h1>
        <p class="welcome-page__lead">{{ $t('welcome-message') }}</p>
      </div>

      <div v-if="bots.length === 0" class="welcome-page__todo">
        <p class="welcome-page__todo-title">{{ $t('welcome-message-todo') }}</p>
        <ul class="welcome-page__steps">
          <li class="welcome-page__step">
            <span class="welcome-page__step-icon" aria-hidden="true">
              <FontAwesomeIcon icon="plus" fixedWidth></FontAwesomeIcon>
            </span>
            <span class="welcome-page__step-label">{{ $t('welcome-message-bot') }}</span>
          </li>
        </ul>
      </div>

      <router-link v-slot="{ navigate }" custom :to="{ name: 'home' }">
        <button type="button" class="welcome-page__submit" @click="navigate">
          {{ $t('continue') }}
        </button>
      </router-link>
    </section>
  </main>
</template>

<script>
  import { mapActions, mapGetters } from 'vuex';
  import { set } from '../utils/storage';

  export default {
    name: 'Welcome',
    metaInfo() {
      return {
        title: this.$t('welcome'),
      };
    },
    computed: {
      ...mapGetters({
        bots: 'bots/bots',
        darkMode: 'storage/darkMode',
        sideMenu: 'layout/sideMenu',
      }),
      logoSrc() {
        return (window.__BASE_PATH__) ? `${window.__BASE_PATH__}images/logo.webp` : '/images/logo.webp';
      },
    },
    watch: {
      sideMenu(value) {
        if (value) window.addEventListener('click', this.onWindowClick);
        else window.removeEventListener('click', this.onWindowClick);
      },
    },
    mounted() {
      set('first-time', false);
    },
    beforeDestroy() {
      window.removeEventListener('click', this.onWindowClick);
    },
    methods: {
      ...mapActions({
        toggleSideMenu: 'layout/toggleSideMenu',
      }),
      onWindowClick(event) {
        const path = event.path || (event.composedPath && event.composedPath());
        const sideMenu = document.getElementById('side-menu');
        const top = this.$el && this.$el.querySelector('.welcome-page__top');
        if ((path && ((top && path.includes(top)) || path.includes(sideMenu)))
          || (top && top.contains(event.target))
          || (sideMenu && sideMenu.contains(event.target))) {
          return;
        }
        this.toggleSideMenu();
      },
    },
  };
</script>

<style lang="scss">
  .welcome-page {
    --welcome-ink: #101828;
    --welcome-muted: #667085;
    --welcome-shell: #ffffff;
    --welcome-soft: #f2f4f7;
    --welcome-border: #e4e7ec;
    --welcome-brand: #0968e5;
    --welcome-brand-600: #0757c2;
    --welcome-brand-50: rgba(9, 104, 229, 0.12);
    --welcome-surface: #eef2f7;

    align-items: center;
    background: var(--welcome-surface);
    box-sizing: border-box;
    color: var(--welcome-ink);
    display: flex;
    flex-direction: column;
    font-family: var(--h2-font, 'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif);
    justify-content: center;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 1.5rem;
    position: relative;

    &.is-dark {
      --welcome-ink: #f8fafc;
      --welcome-muted: #94a3b8;
      --welcome-shell: #1b2233;
      --welcome-soft: #232c40;
      --welcome-border: rgba(255, 255, 255, 0.08);
      --welcome-brand: #4f8cff;
      --welcome-brand-600: #3b6fd4;
      --welcome-brand-50: rgba(79, 140, 255, 0.14);
      --welcome-surface: #111827;
    }
  }

  .welcome-page__atmosphere {
    background:
      radial-gradient(ellipse 70% 50% at 15% 10%, rgba(9, 104, 229, 0.16), transparent 55%),
      radial-gradient(ellipse 55% 45% at 90% 85%, rgba(9, 104, 229, 0.1), transparent 50%);
    inset: 0;
    pointer-events: none;
    position: absolute;

    .welcome-page.is-dark & {
      background:
        radial-gradient(ellipse 70% 50% at 15% 10%, rgba(79, 140, 255, 0.18), transparent 55%),
        radial-gradient(ellipse 55% 45% at 90% 85%, rgba(79, 140, 255, 0.1), transparent 50%);
    }
  }

  .welcome-page__top {
    align-items: center;
    display: flex;
    gap: 0.4rem;
    justify-content: flex-end;
    position: absolute;
    right: 1.25rem;
    top: 1.25rem;
    z-index: 2;
  }

  .welcome-page__settings {
    align-items: center;
    background: var(--welcome-shell);
    border: 1px solid var(--welcome-border);
    border-radius: 0.75rem;
    color: var(--welcome-muted);
    cursor: pointer;
    display: inline-flex;
    height: 2.5rem;
    justify-content: center;
    width: 2.5rem;

    &:hover,
    &:focus-visible {
      color: var(--welcome-ink);
      outline: none;
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px var(--welcome-brand-50);
    }
  }

  .welcome-page__card {
    background: var(--welcome-shell);
    border: 1px solid var(--welcome-border);
    border-radius: 1.25rem;
    box-shadow: 0 18px 40px rgba(16, 24, 40, 0.08);
    box-sizing: border-box;
    max-width: 26rem;
    padding: 1.75rem 1.6rem 1.7rem;
    position: relative;
    width: 100%;
    z-index: 1;

    .welcome-page.is-dark & {
      box-shadow: 0 22px 48px rgba(0, 0, 0, 0.35);
    }
  }

  .welcome-page__brand {
    margin-bottom: 1.35rem;
    text-align: center;
  }

  .welcome-page__logo {
    display: block;
    height: 3.5rem;
    margin: 0 auto 0.85rem;
    width: 3.5rem;
  }

  .welcome-page__eyebrow {
    color: var(--welcome-brand-600);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin: 0;
    text-transform: uppercase;

    .welcome-page.is-dark & {
      color: var(--welcome-brand);
    }
  }

  .welcome-page__title {
    font-size: 1.55rem;
    font-weight: 750;
    letter-spacing: -0.03em;
    margin: 0.4rem 0 0;
  }

  .welcome-page__lead {
    color: var(--welcome-muted);
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0.45rem 0 0;
  }

  .welcome-page__todo {
    margin-bottom: 1.25rem;
  }

  .welcome-page__todo-title {
    color: var(--welcome-muted);
    font-size: 0.82rem;
    font-weight: 700;
    margin: 0 0 0.55rem;
  }

  .welcome-page__steps {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .welcome-page__step {
    align-items: center;
    background: var(--welcome-soft);
    border: 1px solid var(--welcome-border);
    border-radius: 0.8rem;
    display: flex;
    gap: 0.75rem;
    padding: 0.7rem 0.85rem;
  }

  .welcome-page__step-icon {
    align-items: center;
    background: var(--welcome-brand-50);
    border-radius: 0.6rem;
    color: var(--welcome-brand);
    display: inline-flex;
    flex-shrink: 0;
    height: 2rem;
    justify-content: center;
    width: 2rem;
  }

  .welcome-page__step-label {
    font-size: 0.92rem;
    font-weight: 600;
  }

  .welcome-page__submit {
    align-items: center;
    background: var(--welcome-brand);
    border: 0;
    border-radius: 0.85rem;
    color: #fff;
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    font-weight: 700;
    justify-content: center;
    min-height: 2.95rem;
    width: 100%;

    &:hover {
      background: var(--welcome-brand-600);
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px var(--welcome-brand-50);
      outline: none;
    }
  }
</style>
