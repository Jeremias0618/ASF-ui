<template>
  <aside
    class="home2-sidebar"
    :class="{
      'is-expanded': expanded || mobileOpen,
      'is-mobile-open': mobileOpen,
      'is-collapsed': !expanded && !mobileOpen,
      'is-rail-ready': railReady
    }"
    :aria-label="$t('home2-nav-label')"
  >
    <div class="home2-sidebar__mobile-top">
      <router-link class="home2-sidebar__brand" :to="{ name: 'home' }">
        <img class="home2-sidebar__logo" :src="logoSrc" alt="" width="36" height="36" aria-hidden="true">
        <span class="home2-sidebar__title">{{ $t('home-brand') }}</span>
      </router-link>
      <button
        type="button"
        class="home2-sidebar__close"
        :aria-label="$t('home2-close-menu')"
        @click="$emit('toggle-mobile')"
      >
        <FontAwesomeIcon icon="times"></FontAwesomeIcon>
      </button>
    </div>

    <div class="home2-sidebar__desktop-brand">
      <router-link class="home2-sidebar__brand" :to="{ name: 'home' }">
        <img class="home2-sidebar__logo" :src="logoSrc" alt="" width="36" height="36" aria-hidden="true">
        <span class="home2-sidebar__title" :class="{ 'is-hidden': collapsed }">{{ $t('home-brand') }}</span>
      </router-link>
    </div>

    <div class="home2-sidebar__search-wrap" :class="{ 'is-collapsed': collapsed }">
      <button
        v-tooltip="railTip($t('home2-search-open'))"
        type="button"
        class="home2-sidebar__search"
        :class="{ 'is-collapsed': collapsed }"
        :aria-label="$t('home2-search-open')"
        @click="$emit('open-search')"
      >
        <FontAwesomeIcon icon="search" class="home2-sidebar__search-icon" fixedWidth></FontAwesomeIcon>
        <span v-if="!collapsed" class="home2-sidebar__search-label">{{ $t('home2-search-quick') }}</span>
        <kbd v-if="!collapsed" class="home2-sidebar__search-kbd" aria-hidden="true">Ctrl K</kbd>
      </button>
    </div>

    <div class="home2-sidebar__scroll">
      <nav class="home2-sidebar__nav">
        <div
          v-for="section in sections"
          :key="section.titleKey"
          class="home2-sidebar__section"
        >
          <h2 class="home2-sidebar__section-title">
            <span :class="{ 'is-hidden': collapsed }">{{ $t(section.titleKey) }}</span>
            <span
              class="home2-sidebar__section-rail"
              :class="{ 'is-visible': collapsed }"
              role="separator"
              aria-hidden="true"
            ></span>
          </h2>
          <ul class="home2-sidebar__list">
            <li v-for="item in section.items" :key="`${item.route}-${collapsed ? 'rail' : 'wide'}`">
              <router-link
                v-tooltip="railTip($t(item.labelKey))"
                class="home2-menu-item"
                :class="{
                  'is-active': isActive(item.route),
                  'is-rail': collapsed
                }"
                :to="{ name: item.route }"
                :aria-label="$t(item.labelKey)"
                @click.native="$emit('close-mobile')"
              >
                <span class="home2-menu-item__icon" aria-hidden="true">
                  <FontAwesomeIcon :icon="item.icon" fixedWidth></FontAwesomeIcon>
                </span>
                <span class="home2-menu-item__text" :class="{ 'is-collapsed': collapsed }">
                  {{ $t(item.labelKey) }}
                </span>
              </router-link>
            </li>
          </ul>
        </div>
      </nav>
    </div>

    <div class="home2-sidebar__footer" :class="{ 'is-collapsed': collapsed }">
      <div class="home2-theme" :class="{ 'is-collapsed': collapsed }" role="group" :aria-label="$t('home2-theme')">
        <button
          v-tooltip="railTip($t('home2-theme-light'))"
          type="button"
          class="home2-theme__btn"
          :class="{ 'is-active': !darkMode }"
          :aria-pressed="!darkMode ? 'true' : 'false'"
          @click="setDark(false)"
        >
          <FontAwesomeIcon icon="sun" fixedWidth></FontAwesomeIcon>
          <span v-if="!collapsed">{{ $t('home2-theme-light') }}</span>
        </button>
        <button
          v-tooltip="railTip($t('home2-theme-dark'))"
          type="button"
          class="home2-theme__btn"
          :class="{ 'is-active': darkMode }"
          :aria-pressed="darkMode ? 'true' : 'false'"
          @click="setDark(true)"
        >
          <FontAwesomeIcon icon="moon" fixedWidth></FontAwesomeIcon>
          <span v-if="!collapsed">{{ $t('home2-theme-dark') }}</span>
        </button>
      </div>

      <div class="home2-user" :class="{ 'is-collapsed': collapsed }">
        <template v-if="collapsed">
          <span
            v-tooltip="railTip(userLabel)"
            class="home2-user__avatar"
            :aria-label="userLabel"
          >
            <FontAwesomeIcon icon="user" fixedWidth></FontAwesomeIcon>
          </span>
        </template>
        <template v-else>
          <span class="home2-user__avatar" aria-hidden="true">
            <FontAwesomeIcon icon="user" fixedWidth></FontAwesomeIcon>
          </span>
          <div class="home2-user__copy">
            <p class="home2-user__name">{{ userLabel }}</p>
            <p class="home2-user__meta">{{ versionLabel }}</p>
          </div>
          <button
            v-if="status === 'AUTHENTICATED' && password"
            type="button"
            class="home2-user__logout"
            :title="$t('logout-title')"
            :aria-label="$t('logout-title')"
            @click="logout"
          >
            <FontAwesomeIcon icon="sign-out-alt"></FontAwesomeIcon>
          </button>
        </template>
      </div>
    </div>
  </aside>
</template>

<script>
  import { mapGetters } from 'vuex';

  const SECTIONS = [
    {
      titleKey: 'home2-section-menu',
      items: [
        { route: 'home', labelKey: 'home2-nav-dashboard', icon: 'home' },
        { route: 'bots', labelKey: 'bots', icon: 'users' },
        { route: 'multi-action', labelKey: 'bulk-actions', icon: 'layer-group' },
        { route: 'commands', labelKey: 'commands', icon: 'laptop' },
        { route: 'log', labelKey: 'log', icon: 'file-alt' },
        { route: 'plugins', labelKey: 'plugins', icon: 'puzzle-piece' },
        { route: 'releases', labelKey: 'releases', icon: 'code-branch' },
      ],
    },
    {
      titleKey: 'home2-section-config',
      items: [
        { route: 'configuration', labelKey: 'configuration', icon: 'cogs' },
        { route: 'asf-config', labelKey: 'asf-config', icon: 'edit' },
        { route: 'mass-editor', labelKey: 'mass-editor', icon: 'paste' },
        { route: 'ui-config', labelKey: 'ui-config', icon: 'wrench' },
        { route: 'asf-bans', labelKey: 'asf-bans', icon: 'ban' },
      ],
    },
  ];

  // Keep parent nav highlighted on nested modal routes (e.g. /bot/:bot/config → Bots).
  const ACTIVE_ROUTE_GROUPS = {
    'bots': [
      'bots',
      'bot',
      'bot-idle',
      'bot-config',
      'bot-create',
      'bot-copy',
      'bot-delete',
      'bot-2fa',
      'bot-2fa-delete',
      'bot-bgr',
      'bot-input',
      'bot-inventory',
      'bot-friends',
      'bot-community',
      'bot-games',
      'bot-wishlist',
      'password-encrypt',
    ],
    'multi-action': ['multi-action', 'multi-action-bots', 'multi-action-setup'],
    'asf-config': ['asf-config', 'password-hash'],
  };

  export default {
    name: 'HomeSidebar',
    props: {
      expanded: { type: Boolean, required: true },
      mobileOpen: { type: Boolean, required: true },
    },
    data() {
      return {
        sections: SECTIONS,
        railReady: false,
        railTimer: null,
      };
    },
    computed: {
      ...mapGetters({
        darkMode: 'storage/darkMode',
        status: 'auth/status',
        password: 'auth/password',
        version: 'asf/version',
        buildVariant: 'asf/buildVariant',
      }),
      collapsed() {
        return !this.expanded && !this.mobileOpen;
      },
      logoSrc() {
        return (window.__BASE_PATH__) ? `${window.__BASE_PATH__}images/logo.webp` : '/images/logo.webp';
      },
      userLabel() {
        return this.$t('home-brand');
      },
      versionLabel() {
        if (!this.version) return 'ASF';
        return this.buildVariant ? `ASF ${this.version}` : `ASF ${this.version}`;
      },
    },
    watch: {
      collapsed: {
        immediate: true,
        handler(isCollapsed) {
          this.clearRailTimer();
          if (!isCollapsed) {
            this.railReady = false;
            return;
          }
          // Center icons only after width finishes — avoids the right-then-left jump.
          this.railReady = false;
          this.railTimer = setTimeout(() => {
            if (this.collapsed) this.railReady = true;
          }, 320);
        },
      },
    },
    beforeDestroy() {
      this.clearRailTimer();
    },
    methods: {
      clearRailTimer() {
        if (this.railTimer) {
          clearTimeout(this.railTimer);
          this.railTimer = null;
        }
      },
      /** Tooltip only while the desktop rail is collapsed (icons only). */
      railTip(content) {
        if (!this.collapsed || !content) return '';
        return {
          content: String(content),
          html: false,
          placement: 'right',
          container: 'body',
          delay: { show: 80, hide: 0 },
          offset: 10,
          classes: 'tooltip home2-rail-tooltip',
        };
      },
      isActive(routeName) {
        const current = this.$route.name;
        if (current === routeName) return true;
        const group = ACTIVE_ROUTE_GROUPS[routeName];
        return Array.isArray(group) && group.includes(current);
      },
      setDark(value) {
        this.$store.dispatch('storage/setThemeMode', value ? 'dark' : 'light');
      },
      async logout() {
        await this.$store.dispatch('auth/setPassword');
        window.location.reload();
      },
    },
  };
</script>

<style lang="scss">
  .home2-sidebar {
    background: var(--h2-sidebar);
    /* Shadow instead of border so width/padding math stays exact (border-box safe). */
    box-shadow: 1px 0 0 var(--h2-border);
    box-sizing: border-box;
    color: var(--h2-ink);
    display: flex;
    flex-direction: column;
    left: 0;
    overflow: hidden;
    padding: 0 1rem;
    position: fixed;
    top: 0;
    z-index: 160;

    @media screen and (max-width: 1023px) {
      border-radius: 0 1.5rem 1.5rem 0;
      bottom: 0;
      box-shadow: 0 25px 50px -12px rgba(16, 24, 40, 0.35);
      height: 100dvh;
      max-width: min(20rem, 88vw);
      padding-bottom: 1.5rem;
      padding-top: calc(1rem + env(safe-area-inset-top, 0px));
      transform: translateX(-105%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      width: min(20rem, 88vw);
      z-index: 1200;

      &.is-mobile-open {
        transform: translateX(0);
      }
    }

    @media screen and (min-width: 1024px) {
      height: 100vh;
      padding: 0 var(--h2-sidebar-pad-x);
      transition: width 0.3s ease;
      width: var(--h2-wide);

      &.is-collapsed {
        width: var(--h2-rail);
      }

      /*
        After width settles: center the icon column with equal side space.
        Keep a small pad so active pills are never clipped by the edge.
      */
      &.is-collapsed.is-rail-ready {
        align-items: center;
        padding-left: 0.45rem;
        padding-right: 0.45rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;

      &.is-collapsed {
        align-items: center;
        padding-left: 0.45rem;
        padding-right: 0.45rem;
      }
    }
  }

  .home2-sidebar__mobile-top {
    align-items: center;
    display: flex;
    gap: 0.75rem;
    justify-content: space-between;
    margin-bottom: 1rem;

    @media screen and (min-width: 1024px) {
      display: none;
    }
  }

  .home2-sidebar__desktop-brand {
    display: none;

    @media screen and (min-width: 1024px) {
      display: flex;
      justify-content: flex-start;
      padding: 1.15rem 0.15rem 1rem;
      width: 100%;

      .home2-sidebar.is-rail-ready & {
        justify-content: center;
        padding-left: 0;
        padding-right: 0;
        width: var(--h2-icon-slot);
      }
    }
  }

  .home2-sidebar__brand {
    align-items: center;
    color: inherit;
    display: flex;
    gap: 0.55rem;
    justify-content: flex-start;
    min-width: 0;
    text-decoration: none;
    width: 100%;

    .home2-sidebar.is-collapsed & {
      gap: 0;
    }

    .home2-sidebar.is-rail-ready & {
      justify-content: center;
    }
  }

  .home2-sidebar__logo {
    flex-shrink: 0;
    height: var(--h2-icon-slot);
    object-fit: contain;
    width: var(--h2-icon-slot);
  }

  .home2-sidebar__title {
    flex: 1 1 auto;
    font-size: 0.98rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.is-hidden {
      flex: 0 0 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
      pointer-events: none;
      width: 0;
    }
  }

  .home2-sidebar__close {
    align-items: center;
    background: transparent;
    border: 1px solid var(--h2-border);
    border-radius: 0.75rem;
    color: var(--h2-muted-2);
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    height: 2.5rem;
    justify-content: center;
    width: 2.5rem;

    &:hover,
    &:focus-visible {
      background: var(--h2-soft);
      outline: none;
    }
  }

  .home2-sidebar__search-wrap {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 1.1rem;
    padding: 0 0.15rem;
    width: 100%;

    .home2-sidebar.is-rail-ready & {
      justify-content: center;
      padding: 0;
      width: var(--h2-icon-slot);
    }

    @media screen and (max-width: 1023px) {
      margin-top: 0.25rem;
    }
  }

  .home2-sidebar__search {
    align-items: center;
    background: var(--h2-surface);
    border: 1px solid var(--h2-border);
    border-radius: 0.7rem;
    box-sizing: border-box;
    color: var(--h2-muted);
    cursor: pointer;
    display: flex;
    gap: 0.55rem;
    justify-content: flex-start;
    min-height: var(--h2-icon-slot);
    min-width: 0;
    padding: 0 0.75rem;
    text-align: left;
    transition: border-color 0.15s ease, background 0.15s ease;
    width: 100%;

    &:hover,
    &:focus-visible {
      background: var(--h2-soft);
      border-color: #93c5fd;
      color: var(--h2-ink);
      outline: none;
    }

    &.is-collapsed {
      background: transparent;
      border-color: transparent;
      border-radius: 0.6rem;
      gap: 0;
      height: 2.25rem;
      justify-content: center;
      max-width: 2.25rem;
      min-height: 2.25rem;
      padding: 0;
      width: 2.25rem;

      &:hover,
      &:focus-visible {
        background: var(--h2-soft);
        border-color: transparent;
        color: var(--h2-ink);
      }
    }
  }

  .home2-sidebar__search-icon {
    align-items: center;
    display: inline-flex;
    flex: 0 0 auto;
    height: 1.15rem;
    justify-content: center;
    width: 1.15rem;

    .home2-sidebar__search.is-collapsed & {
      height: 1.15rem;
      width: 1.15rem;
    }
  }

  .home2-sidebar__search-label {
    flex: 1;
    font-size: 0.82rem;
    font-weight: 500;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .home2-sidebar__search-kbd {
    background: var(--h2-shell);
    border: 1px solid var(--h2-border);
    border-radius: 0.4rem;
    color: var(--h2-muted);
    flex-shrink: 0;
    font-size: 0.68rem;
    padding: 0.15rem 0.35rem;
  }

  .home2-sidebar__scroll {
    box-sizing: border-box;
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0 0.25rem;
    scrollbar-width: none;
    width: 100%;

    .home2-sidebar.is-rail-ready & {
      overflow-x: visible;
      padding: 0.15rem 0;
      width: auto;
    }

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .home2-sidebar__nav {
    box-sizing: border-box;
    display: grid;
    gap: 1.15rem;
    margin-bottom: 1rem;
    padding: 0;
    width: 100%;

    .home2-sidebar.is-rail-ready & {
      justify-items: center;
      width: auto;
    }
  }

  .home2-sidebar__section-title {
    align-items: center;
    color: #98a2b3;
    display: flex;
    font-size: 0.68rem;
    font-weight: 600;
    height: 1.1rem;
    justify-content: flex-start;
    letter-spacing: 0.06em;
    margin: 0 0 0.55rem;
    padding: 0 0.55rem;
    text-transform: uppercase;

    .app--dark-mode & {
      color: #94a3b8;
    }

    .home2-sidebar.is-rail-ready & {
      justify-content: center;
      padding: 0;
    }

    .is-hidden {
      flex: 0 0 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
      pointer-events: none;
      width: 0;
    }
  }

  .home2-sidebar__section-rail {
    background: #d0d5dd;
    border-radius: 999px;
    display: none;
    flex-shrink: 0;
    height: 0.125rem;
    margin: 0;
    width: 1.15rem;

    &.is-visible {
      display: block;
    }
  }

  .home2-sidebar__list {
    box-sizing: border-box;
    display: grid;
    gap: 0.35rem;
    justify-items: stretch;
    list-style: none;
    margin: 0;
    padding: 0;
    width: 100%;

    .home2-sidebar.is-rail-ready & {
      justify-items: center;
      width: auto;
    }
  }

  .home2-menu-item {
    align-items: center;
    border-radius: 0.65rem;
    box-sizing: border-box;
    color: var(--h2-muted-2);
    display: flex;
    font-size: 0.875rem;
    font-weight: 500;
    gap: 0.7rem;
    justify-content: flex-start;
    max-width: 100%;
    min-height: 2.55rem;
    min-width: 0;
    padding: 0.35rem 0.7rem;
    position: relative;
    text-decoration: none;
    width: 100%;

    &:hover {
      background: var(--h2-soft);
      color: var(--h2-ink);
    }

    &.is-active {
      background: var(--h2-brand-50);
      color: var(--h2-brand-600);

      /* No left accent bar — pill highlight only. */
      &::before {
        content: none;
        display: none;
      }

      .app--dark-mode & {
        background: color-mix(in srgb, var(--h2-brand) 28%, transparent);
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--h2-brand) 42%, transparent);
        color: var(--h2-brand);
      }

      @supports not (background: color-mix(in srgb, red 50%, blue)) {
        .app--dark-mode & {
          background: rgba(91, 159, 255, 0.28);
          box-shadow: inset 0 0 0 1px rgba(91, 159, 255, 0.45);
        }
      }
    }

    &.is-rail {
      border-radius: 0.6rem;
      flex-shrink: 0;
      gap: 0;
      height: 2.25rem;
      justify-content: center;
      margin: 0.15rem auto;
      max-width: 2.25rem;
      min-height: 2.25rem;
      overflow: visible;
      padding: 0;
      width: 2.25rem;

      &.is-active {
        box-shadow: none;
      }
    }
  }

  .home2-menu-item__icon {
    align-items: center;
    display: inline-flex;
    flex: 0 0 1.15rem;
    height: 1.15rem;
    justify-content: center;
    width: 1.15rem;

    .home2-menu-item.is-rail & {
      flex-basis: auto;
      height: 1.15rem;
      width: 1.15rem;
    }
  }

  .home2-menu-item__text {
    flex: 1 1 auto;
    max-width: 14rem;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.is-collapsed {
      display: none;
    }
  }

  .home2-sidebar__footer {
    border-top: 1px solid var(--h2-border);
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    margin-top: auto;
    padding: 0.65rem 0 0.4rem;
    width: 100%;

    .home2-sidebar.is-rail-ready & {
      align-items: center;
      width: var(--h2-icon-slot);
    }
  }

  .home2-theme {
    background: var(--h2-soft);
    border-radius: 0.65rem;
    box-sizing: border-box;
    display: flex;
    gap: 0.1rem;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
    padding: 0.15rem;
    width: 100%;

    &.is-collapsed {
      flex-direction: column;
      width: var(--h2-icon-slot);
    }
  }

  .home2-theme__btn {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 0.5rem;
    color: var(--h2-muted);
    cursor: pointer;
    display: inline-flex;
    flex: 1;
    font: inherit;
    font-size: 0.72rem;
    font-weight: 600;
    gap: 0.3rem;
    justify-content: center;
    min-height: 2rem;
    min-width: 0;
    padding: 0.3rem 0.35rem;

    .home2-theme.is-collapsed & {
      flex: 0 0 auto;
      min-height: 1.85rem;
      padding: 0;
      width: 100%;
    }

    &.is-active {
      background: var(--h2-shell);
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.08);
      color: var(--h2-ink);
    }

    &:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--h2-brand) 55%, transparent);
      outline-offset: 1px;
    }
  }

  .home2-user {
    align-items: center;
    display: flex;
    gap: 0.5rem;
    justify-content: flex-start;
    min-width: 0;
    width: 100%;

    &.is-collapsed {
      justify-content: center;
      width: var(--h2-icon-slot);
    }
  }

  .home2-user__avatar {
    align-items: center;
    background: var(--h2-brand-50);
    border: 1px solid var(--h2-border);
    border-radius: 999px;
    box-shadow: 0 0 0 2px var(--h2-shell);
    color: var(--h2-brand);
    display: inline-flex;
    flex-shrink: 0;
    font-size: 0.85rem;
    height: var(--h2-icon-slot);
    justify-content: center;
    width: var(--h2-icon-slot);
  }

  .home2-user__copy {
    min-width: 0;
    flex: 1;
  }

  .home2-user__name,
  .home2-user__meta {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .home2-user__name {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .home2-user__meta {
    color: var(--h2-muted);
    font-size: 0.72rem;
  }

  .home2-user__logout {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 0.75rem;
    color: var(--h2-muted);
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    height: 2.25rem;
    justify-content: center;
    width: 2.25rem;

    &:hover,
    &:focus-visible {
      background: var(--h2-soft);
      color: var(--h2-error);
      outline: none;
    }
  }
</style>

<style lang="scss">
  /* Appended to body — keep outside scoped/component cascade assumptions. */
  .tooltip.home2-rail-tooltip {
    font-size: 0.8rem;
    pointer-events: none;
    z-index: 10050 !important;

    .tooltip-inner {
      background: #1f2937;
      border: 1px solid #374151;
      border-radius: 0.5rem;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.35);
      color: #f9fafb;
      font-weight: 500;
      max-width: 16rem;
      padding: 0.4rem 0.7rem;
      white-space: nowrap;
    }

    .tooltip-arrow {
      border-color: #1f2937;
    }
  }

  .app:not(.app--dark-mode) .tooltip.home2-rail-tooltip {
    .tooltip-inner {
      background: #101828;
      border-color: #1d2939;
      color: #f9fafb;
    }

    .tooltip-arrow {
      border-color: #101828;
    }
  }
</style>
