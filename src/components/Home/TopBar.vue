<template>
  <header class="home-topbar">
    <div class="home-topbar__brand">
      <span class="home-topbar__mark" aria-hidden="true">ASF</span>
      <span class="home-topbar__label">{{ $t('home') }}</span>
    </div>

    <nav class="home-topbar__actions" aria-label="home toolbar">
      <button
        type="button"
        class="home-topbar__button"
        :title="$t('sidebar-dark-mode')"
        :aria-pressed="darkMode ? 'true' : 'false'"
        @click="toggleDarkMode"
      >
        <FontAwesomeIcon icon="moon" fixedWidth></FontAwesomeIcon>
      </button>

      <router-link
        class="home-topbar__button"
        :to="{ name: 'ui-config' }"
        :title="$t('ui-config')"
      >
        <FontAwesomeIcon icon="wrench" fixedWidth></FontAwesomeIcon>
      </router-link>

      <button
        v-if="status === 'AUTHENTICATED' && password"
        type="button"
        class="home-topbar__button"
        :title="$t('logout-title')"
        @click="logout"
      >
        <FontAwesomeIcon icon="sign-out-alt" fixedWidth></FontAwesomeIcon>
      </button>
    </nav>
  </header>
</template>

<script>
  import { mapActions, mapGetters } from 'vuex';

  export default {
    name: 'HomeTopBar',
    computed: {
      ...mapGetters({
        darkMode: 'storage/darkMode',
        status: 'auth/status',
        password: 'auth/password',
      }),
    },
    methods: {
      ...mapActions({
        toggleDarkMode: 'storage/toggleDarkMode',
      }),
      async logout() {
        await this.$store.dispatch('auth/setPassword');
        window.location.reload();
      },
    },
  };
</script>

<style lang="scss">
  .home-topbar {
    align-items: center;
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    margin-bottom: 0.25rem;
  }

  .home-topbar__brand {
    align-items: center;
    display: flex;
    gap: 0.75rem;
  }

  .home-topbar__mark {
    align-items: center;
    background: var(--home-accent);
    border-radius: 0.85rem;
    color: #fff;
    display: inline-flex;
    font-family: var(--home-font-display);
    font-size: 0.85rem;
    font-weight: 700;
    height: 2.35rem;
    justify-content: center;
    letter-spacing: 0.04em;
    width: 2.35rem;
  }

  .home-topbar__label {
    color: var(--home-muted);
    font-family: var(--home-font-display);
    font-size: 0.95rem;
    font-weight: 600;
  }

  .home-topbar__actions {
    align-items: center;
    display: flex;
    gap: 0.35rem;
  }

  .home-topbar__button {
    align-items: center;
    background: var(--home-surface);
    border: 1px solid var(--home-border);
    border-radius: 0.85rem;
    color: var(--home-text);
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    height: 2.35rem;
    justify-content: center;
    padding: 0;
    text-decoration: none;
    width: 2.35rem;

    &:hover,
    &:focus-visible {
      border-color: var(--home-accent);
      color: var(--home-accent);
      outline: none;
    }
  }
</style>
