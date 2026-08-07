<template>
  <div>
    <div
      class="side-menu-backdrop"
      :class="{ 'is-open': sideMenu }"
      role="presentation"
      :aria-hidden="sideMenu ? 'false' : 'true'"
      @click="closeMenu"
    ></div>

    <aside
      id="side-menu"
      class="side-menu"
      :class="{ 'is-open': sideMenu }"
      role="dialog"
      :aria-modal="sideMenu ? 'true' : 'false'"
      :aria-label="$t('sidebar-panel-title')"
      :aria-hidden="sideMenu ? 'false' : 'true'"
    >
      <header class="side-menu__header">
        <div class="side-menu__heading">
          <span class="side-menu__eyebrow">{{ $t('home2-section-config') }}</span>
          <h2 class="side-menu__title">{{ $t('sidebar-panel-title') }}</h2>
        </div>
        <button
          type="button"
          class="side-menu__close"
          :aria-label="$t('home2-close-menu')"
          @click="closeMenu"
        >
          <FontAwesomeIcon icon="times" fixedWidth></FontAwesomeIcon>
        </button>
      </header>

      <div class="side-menu__body">
        <section class="side-menu__card" :aria-label="$t('sidebar-dark-mode')">
          <SideMenuSwitch
            :name="$t('sidebar-dark-mode')"
            :icon="darkMode ? 'moon' : 'sun'"
            :checked="darkMode"
            @click="toggleDarkMode"
          ></SideMenuSwitch>
        </section>

        <SideMenuLanguage></SideMenuLanguage>

        <section class="side-menu__card" aria-labelledby="side-menu-theme-label">
          <div id="side-menu-theme-label" class="side-menu__category">
            <span class="side-menu__category-icon" aria-hidden="true">
              <FontAwesomeIcon icon="palette" fixedWidth></FontAwesomeIcon>
            </span>
            <div>
              <p class="side-menu__category-title">{{ $t('sidebar-theme') }}</p>
              <p class="side-menu__category-help">{{ $t('sidebar-theme-help') }}</p>
            </div>
          </div>

          <div class="theme-switcher" role="listbox" :aria-label="$t('sidebar-theme')">
            <button
              v-for="themeOption in availableThemes"
              :key="themeOption"
              type="button"
              class="theme-switcher__theme"
              :class="[`theme-${themeOption}`, { 'is-active': theme === themeOption }]"
              role="option"
              :aria-selected="theme === themeOption ? 'true' : 'false'"
              :aria-label="themeOption"
              :title="themeOption"
              @click="changeTheme(themeOption)"
            ></button>
          </div>
        </section>
      </div>

      <footer class="side-menu__footer">
        <p class="side-menu__info" v-html="$t('sidebar-info')"></p>
      </footer>
    </aside>
  </div>
</template>

<script>
  import { mapActions, mapGetters } from 'vuex';
  import SideMenuSwitch from './partials/SideMenuSwitch.vue';
  import SideMenuLanguage from './partials/SideMenuLanguage.vue';

  export default {
    name: 'AppSideMenu',
    components: { SideMenuSwitch, SideMenuLanguage },
    computed: mapGetters({
      sideMenu: 'layout/sideMenu',
      availableThemes: 'layout/availableThemes',
      darkMode: 'storage/darkMode',
      theme: 'storage/theme',
    }),
    methods: {
      ...mapActions({
        changeTheme: 'storage/changeTheme',
        toggleDarkMode: 'storage/toggleDarkMode',
        setSideMenu: 'layout/setSideMenu',
      }),
      closeMenu() {
        if (this.sideMenu) this.setSideMenu(false);
      },
      onKeydown(event) {
        if (event.key === 'Escape') this.closeMenu();
      },
    },
    watch: {
      sideMenu(isOpen) {
        if (isOpen) {
          window.addEventListener('keydown', this.onKeydown);
        } else {
          window.removeEventListener('keydown', this.onKeydown);
        }
      },
    },
    beforeDestroy() {
      window.removeEventListener('keydown', this.onKeydown);
    },
  };
</script>

<style lang="scss">
  .side-menu-backdrop {
    background: rgba(16, 24, 40, 0.35);
    inset: 0;
    opacity: 0;
    pointer-events: none;
    position: fixed;
    transition: opacity 0.2s ease;
    z-index: 1390;

    &.is-open {
      opacity: 1;
      pointer-events: auto;
    }

    .app--dark-mode & {
      background: rgba(0, 0, 0, 0.55);
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  .side-menu {
    --sm-shell: #ffffff;
    --sm-ink: #101828;
    --sm-muted: #667085;
    --sm-border: #e4e7ec;
    --sm-soft: #f2f4f7;
    --sm-brand: var(--color-theme, #0968e5);

    background: var(--sm-shell);
    border-left: 1px solid var(--sm-border);
    bottom: 0;
    box-shadow: -12px 0 40px rgba(16, 24, 40, 0.12);
    box-sizing: border-box;
    color: var(--sm-ink);
    display: flex;
    flex-direction: column;
    font-family: 'Segoe UI Variable', Candara, 'Noto Sans', sans-serif;
    max-width: min(20rem, 92vw);
    padding: 0;
    position: fixed;
    right: 0;
    top: 0;
    transform: translateX(105%);
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    width: 18.5rem;
    z-index: 1400;

    .app--dark-mode & {
      --sm-shell: #1b2233;
      --sm-ink: #f8fafc;
      --sm-muted: #94a3b8;
      --sm-border: rgba(255, 255, 255, 0.08);
      --sm-soft: #232c40;
      box-shadow: -12px 0 40px rgba(0, 0, 0, 0.45);
    }

    &.is-open {
      transform: translateX(0);
    }

    .app--boxed-layout & {
      @media screen and (min-width: 1250px) {
        position: absolute;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  .side-menu__header {
    align-items: flex-start;
    border-bottom: 1px solid var(--sm-border);
    display: flex;
    gap: 0.75rem;
    justify-content: space-between;
    padding: 1.15rem 1.15rem 1rem;
  }

  .side-menu__eyebrow {
    color: var(--sm-muted);
    display: block;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
  }

  .side-menu__title {
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0;
  }

  .side-menu__close {
    align-items: center;
    background: transparent;
    border: 1px solid var(--sm-border);
    border-radius: 0.65rem;
    color: var(--sm-muted);
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    height: 2.25rem;
    justify-content: center;
    width: 2.25rem;

    &:hover,
    &:focus-visible {
      background: var(--sm-soft);
      color: var(--sm-ink);
      outline: none;
    }
  }

  .side-menu__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.85rem;
    min-height: 0;
    overflow-y: auto;
    padding: 1rem 1.15rem;
  }

  .side-menu__card {
    background: var(--sm-soft);
    border: 1px solid var(--sm-border);
    border-radius: 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    overflow: hidden;
    padding: 0.35rem;
  }

  .side-menu__category {
    align-items: flex-start;
    display: flex;
    gap: 0.7rem;
    padding: 0.55rem 0.55rem 0.35rem;
  }

  .side-menu__category-icon {
    align-items: center;
    background: var(--sm-shell);
    border: 1px solid var(--sm-border);
    border-radius: 0.55rem;
    color: var(--sm-brand);
    display: inline-flex;
    flex-shrink: 0;
    height: 2rem;
    justify-content: center;
    width: 2rem;
  }

  .side-menu__category-title {
    font-size: 0.88rem;
    font-weight: 600;
    margin: 0 0 0.15rem;
  }

  .side-menu__category-help {
    color: var(--sm-muted);
    font-size: 0.75rem;
    line-height: 1.35;
    margin: 0;
  }

  .theme-switcher {
    display: grid;
    gap: 0.45rem;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    padding: 0.35rem 0.55rem 0.65rem;
  }

  .theme-switcher__theme {
    aspect-ratio: 1;
    background: var(--color-theme);
    border: 2px solid transparent;
    border-radius: 0.45rem;
    box-sizing: border-box;
    cursor: pointer;
    min-height: 1.65rem;
    padding: 0;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    width: 100%;

    &:hover,
    &:focus-visible {
      outline: none;
      transform: translateY(-1px);
    }

    &.is-active {
      border-color: var(--sm-ink);
      box-shadow: 0 0 0 2px var(--sm-shell), 0 0 0 4px var(--sm-brand);
    }
  }

  .side-menu__footer {
    border-top: 1px solid var(--sm-border);
    margin-top: auto;
    padding: 0.95rem 1.15rem 1.15rem;
  }

  .side-menu__info {
    color: var(--sm-muted);
    font-size: 0.78rem;
    line-height: 1.45;
    margin: 0;
    text-align: center;

    a {
      color: var(--sm-brand);
      text-decoration: none;

      &:hover,
      &:focus-visible {
        text-decoration: underline;
      }
    }
  }
</style>
