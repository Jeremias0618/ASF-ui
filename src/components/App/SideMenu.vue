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
        <section class="side-menu__section" aria-labelledby="side-menu-dark-label">
          <div class="side-menu__category side-menu__category--switch">
            <span class="side-menu__category-icon" aria-hidden="true">
              <FontAwesomeIcon :icon="darkMode ? 'moon' : 'sun'" fixedWidth></FontAwesomeIcon>
            </span>
            <div id="side-menu-dark-label" class="side-menu__category-text">
              <p class="side-menu__category-title">{{ $t('sidebar-dark-mode') }}</p>
              <p class="side-menu__category-help">{{ $t('sidebar-dark-mode-help') }}</p>
            </div>
            <button
              type="button"
              class="side-menu__toggle"
              :class="{ 'is-on': darkMode }"
              :aria-pressed="darkMode ? 'true' : 'false'"
              :aria-label="$t('sidebar-dark-mode')"
              @click="toggleDarkMode"
            >
              <span class="side-menu__toggle-knob" aria-hidden="true"></span>
            </button>
          </div>
        </section>

        <SideMenuLanguage></SideMenuLanguage>

        <section class="side-menu__section" aria-labelledby="side-menu-theme-label">
          <div id="side-menu-theme-label" class="side-menu__category">
            <span class="side-menu__category-icon" aria-hidden="true">
              <FontAwesomeIcon icon="palette" fixedWidth></FontAwesomeIcon>
            </span>
            <div class="side-menu__category-text">
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
  import SideMenuLanguage from './partials/SideMenuLanguage.vue';

  export default {
    name: 'AppSideMenu',
    components: { SideMenuLanguage },
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
    --sm-elevated: #ffffff;
    --sm-field: #ffffff;
    --sm-ink: #101828;
    --sm-muted: #667085;
    --sm-border: #e4e7ec;
    --sm-soft: #f2f4f7;
    --sm-brand: var(--color-theme, #0968e5);
    --sm-brand-dark: var(--color-theme-dark, #0757c2);
    --sm-brand-soft: color-mix(in srgb, var(--color-theme, #0968e5) 16%, transparent);
    --sm-dropdown-shadow: 0 10px 28px rgba(16, 24, 40, 0.12);

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
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    width: 18.5rem;
    z-index: 1400;

    .app--dark-mode & {
      /* Same navy as home2 sidebar (--h2-sidebar). */
      --sm-shell: #1b2233;
      --sm-elevated: #1b2233;
      --sm-field: #161d2c;
      --sm-ink: #f8fafc;
      --sm-muted: #94a3b8;
      --sm-border: rgba(255, 255, 255, 0.06);
      --sm-soft: #232c40;
      --sm-brand: var(--color-theme-light, var(--color-theme, #5b9fff));
      --sm-brand-dark: var(--color-theme, #4f8cff);
      --sm-brand-soft: color-mix(in srgb, var(--color-theme, #5b9fff) 24%, transparent);
      --sm-dropdown-shadow: 0 14px 32px rgba(0, 0, 0, 0.45);
      box-shadow: -12px 0 40px rgba(0, 0, 0, 0.45);
    }

    @supports not (background: color-mix(in srgb, red 50%, blue)) {
      --sm-brand-soft: rgba(9, 104, 229, 0.14);

      .app--dark-mode & {
        --sm-brand-soft: rgba(91, 159, 255, 0.24);
      }
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
    background: var(--sm-shell);
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
    gap: 0;
    min-height: 0;
    overflow-y: auto;
    padding: 0.85rem 1.15rem 1.15rem;
  }

  .side-menu__section {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    padding: 1.15rem 0;
    position: relative;
    z-index: 1;

    & + & {
      border-top: 1px solid var(--sm-border);
    }

    &--language {
      z-index: 5;
    }
  }

  .side-menu__category {
    align-items: flex-start;
    display: flex;
    gap: 0.7rem;
    padding: 0;

    &--switch {
      align-items: center;
    }
  }

  .side-menu__category-text {
    flex: 1;
    min-width: 0;
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
    transition: color 0.2s ease, border-color 0.2s ease;
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

  .side-menu__toggle {
    background: rgba(127, 140, 160, 0.35);
    border: 0;
    border-radius: 999px;
    cursor: pointer;
    flex-shrink: 0;
    height: 1.35rem;
    padding: 0;
    position: relative;
    transition: background 0.18s ease;
    width: 2.4rem;

    &.is-on {
      background: var(--sm-brand);
    }

    &.is-on .side-menu__toggle-knob {
      transform: translateX(1.05rem);
    }

    &:focus-visible {
      outline: 2px solid var(--sm-brand-soft);
      outline-offset: 2px;
    }
  }

  .side-menu__toggle-knob {
    background: #fff;
    border-radius: 999px;
    box-shadow: 0 1px 3px rgba(16, 24, 40, 0.25);
    height: 1.05rem;
    left: 0.15rem;
    position: absolute;
    top: 0.15rem;
    transition: transform 0.18s ease;
    width: 1.05rem;
  }

  .theme-switcher {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    padding: 0.1rem 0 0;
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
      border-color: #fff;
      box-shadow: 0 0 0 2px var(--sm-shell), 0 0 0 4px var(--sm-brand);
    }

    .app--dark-mode &.is-active {
      box-shadow: 0 0 0 2px var(--sm-shell), 0 0 0 5px var(--sm-brand);
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
