<template>
  <header class="home2-header">
    <div class="home2-header__mobile">
      <button
        type="button"
        class="home2-burger"
        :aria-label="mobileOpen ? $t('home2-close-menu') : $t('home2-open-menu')"
        :aria-expanded="mobileOpen ? 'true' : 'false'"
        @click="$emit('toggle')"
      >
        <span class="home2-burger__line" :class="{ 'is-open': mobileOpen }"></span>
        <span class="home2-burger__line" :class="{ 'is-open': mobileOpen }"></span>
        <span class="home2-burger__line" :class="{ 'is-open': mobileOpen }"></span>
      </button>

      <router-link class="home2-header__mobile-brand" :to="{ name: 'home' }">
        <span class="home2-header__mobile-title">{{ $t('home-brand') }}</span>
        <span class="home2-header__mobile-sub">{{ $t('home2-subtitle') }}</span>
      </router-link>

      <div class="home2-header__actions home2-header__actions--mobile">
        <button
          type="button"
          class="home2-burger home2-burger--icon"
          :aria-label="$t('home2-search-open')"
          @click="$emit('open-search')"
        >
          <FontAwesomeIcon icon="search"></FontAwesomeIcon>
        </button>
        <button
          type="button"
          class="home2-header__settings"
          :aria-label="$t('sidebar-toggle')"
          :aria-expanded="sideMenu ? 'true' : 'false'"
          @click="toggleSideMenu"
        >
          <FontAwesomeIcon icon="cogs" fixedWidth></FontAwesomeIcon>
        </button>
      </div>
    </div>

    <div class="home2-header__desktop">
      <button
        type="button"
        class="home2-burger"
        :aria-label="$t('home2-toggle-sidebar')"
        @click="$emit('toggle')"
      >
        <span class="home2-burger__line"></span>
        <span class="home2-burger__line"></span>
        <span class="home2-burger__line"></span>
      </button>

      <div class="home2-header__spacer" aria-hidden="true"></div>

      <div class="home2-header__actions">
        <button
          type="button"
          class="home2-header__settings"
          :aria-label="$t('sidebar-toggle')"
          :aria-expanded="sideMenu ? 'true' : 'false'"
          @click="toggleSideMenu"
        >
          <FontAwesomeIcon icon="cogs" fixedWidth></FontAwesomeIcon>
        </button>
      </div>
    </div>
  </header>
</template>

<script>
  import { mapActions, mapGetters } from 'vuex';

  export default {
    name: 'HomeHeader',
    props: {
      mobileOpen: { type: Boolean, default: false },
    },
    computed: {
      ...mapGetters({
        sideMenu: 'layout/sideMenu',
      }),
    },
    watch: {
      sideMenu(value) {
        if (value) window.addEventListener('click', this.onWindowClick);
        else window.removeEventListener('click', this.onWindowClick);
      },
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
        if ((path && (path.includes(this.$el) || path.includes(sideMenu)))
          || (this.$el && this.$el.contains(event.target))
          || (sideMenu && sideMenu.contains(event.target))) {
          return;
        }
        this.toggleSideMenu();
      },
    },
  };
</script>

<style lang="scss">
  .home2-header {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--h2-border-soft);
    flex-shrink: 0;
    width: 100%;
    z-index: 1000;

    .app--dark-mode & {
      background: rgba(27, 34, 51, 0.9);
    }
  }

  .home2-header__mobile {
    align-items: center;
    display: flex;
    gap: 0.5rem;
    justify-content: space-between;
    min-height: 3.5rem;
    padding: max(0.5rem, env(safe-area-inset-top, 0px)) 0.75rem 0.5rem;

    @media screen and (min-width: 1024px) {
      display: none;
    }
  }

  .home2-header__mobile-brand {
    color: inherit;
    flex: 1;
    min-width: 0;
    text-align: center;
    text-decoration: none;
  }

  .home2-header__mobile-title {
    display: block;
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .home2-header__mobile-sub {
    color: var(--h2-muted);
    display: block;
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    margin-top: 0.1rem;
    overflow: hidden;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .home2-header__desktop {
    align-items: center;
    display: none;
    gap: 1.25rem;
    padding: 1rem 1.5rem;

    @media screen and (min-width: 1024px) {
      display: flex;
    }
  }

  .home2-header__spacer {
    flex: 1;
  }

  .home2-burger {
    align-items: center;
    background: var(--h2-shell);
    border: 1px solid var(--h2-border-soft);
    border-radius: 0.75rem;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
    color: var(--h2-ink);
    cursor: pointer;
    display: inline-flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: 5px;
    height: 2.75rem;
    justify-content: center;
    padding: 0;
    width: 2.75rem;

    &:hover,
    &:focus-visible {
      background: var(--h2-soft);
      outline: none;
    }

    &--icon {
      flex-direction: row;
      gap: 0;
    }
  }

  .home2-burger__line {
    background: currentColor;
    border-radius: 999px;
    display: block;
    height: 2px;
    transition: transform 0.2s ease, opacity 0.2s ease;
    width: 18px;

    .home2-burger:not(.home2-burger--spacer) &:nth-child(1).is-open {
      transform: translateY(7px) rotate(45deg);
    }

    .home2-burger:not(.home2-burger--spacer) &:nth-child(2).is-open {
      opacity: 0;
    }

    .home2-burger:not(.home2-burger--spacer) &:nth-child(3).is-open {
      transform: translateY(-7px) rotate(-45deg);
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  .home2-header__actions {
    align-items: center;
    display: flex;
    gap: 0.4rem;
    margin-left: auto;

    &--mobile {
      flex-shrink: 0;
      margin-left: 0;
    }
  }

  .home2-header__settings {
    align-items: center;
    background: transparent;
    border: 1px solid var(--h2-border);
    border-radius: 0.75rem;
    color: var(--h2-ink);
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    height: 2.75rem;
    justify-content: center;
    padding: 0;
    width: 2.75rem;

    &:hover,
    &:focus-visible {
      background: var(--h2-soft);
      outline: none;
    }
  }
</style>
