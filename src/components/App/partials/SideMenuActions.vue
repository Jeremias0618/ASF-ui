<template>
  <section v-if="authenticated" class="side-menu__section side-menu__section--actions" aria-labelledby="side-menu-actions-label">
    <div id="side-menu-actions-label" class="side-menu__category">
      <span class="side-menu__category-icon" aria-hidden="true">
        <FontAwesomeIcon icon="power-off" fixedWidth></FontAwesomeIcon>
      </span>
      <div class="side-menu__category-text">
        <p class="side-menu__category-title">{{ $t('sidebar-instance') }}</p>
        <p class="side-menu__category-help">{{ $t('sidebar-instance-help') }}</p>
      </div>
    </div>

    <div class="side-menu-actions" role="group" :aria-label="$t('sidebar-instance')">
      <button
        v-if="updatesEnabled && canUpdate"
        type="button"
        class="side-menu-actions__btn"
        @click="requestConfirm('update')"
      >
        <FontAwesomeIcon icon="cloud-download-alt" fixedWidth class="side-menu-actions__icon"></FontAwesomeIcon>
        <span>{{ $t('update') }}</span>
      </button>

      <button
        type="button"
        class="side-menu-actions__btn"
        @click="requestConfirm('restart')"
      >
        <FontAwesomeIcon icon="undo-alt" fixedWidth class="side-menu-actions__icon"></FontAwesomeIcon>
        <span>{{ $t('restart') }}</span>
      </button>

      <button
        type="button"
        class="side-menu-actions__btn side-menu-actions__btn--danger"
        @click="requestConfirm('shutdown')"
      >
        <FontAwesomeIcon icon="power-off" fixedWidth class="side-menu-actions__icon"></FontAwesomeIcon>
        <span>{{ $t('shutdown') }}</span>
      </button>
    </div>
  </section>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex';

  export default {
    name: 'SideMenuActions',
    computed: mapGetters({
      authenticated: 'auth/authenticated',
      updatesEnabled: 'asf/updatesEnabled',
      canUpdate: 'asf/canUpdate',
    }),
    methods: {
      ...mapActions({
        setSideMenu: 'layout/setSideMenu',
      }),
      requestConfirm(action) {
        this.setSideMenu(false);
        this.$emit('request-confirm', action);
      },
    },
  };
</script>

<style lang="scss">
  .side-menu-actions {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .side-menu-actions__btn {
    align-items: center;
    background: var(--sm-soft);
    border: 1px solid var(--sm-border);
    border-radius: 0.65rem;
    color: var(--sm-ink);
    cursor: pointer;
    display: flex;
    font-family: inherit;
    font-size: 0.88rem;
    font-weight: 600;
    gap: 0.65rem;
    justify-content: flex-start;
    padding: 0.7rem 0.85rem;
    text-align: left;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    width: 100%;

    &:hover:not(:disabled),
    &:focus-visible:not(:disabled) {
      background: var(--sm-brand-soft);
      border-color: var(--sm-brand);
      color: var(--sm-brand-dark);
      outline: none;
    }
  }

  .side-menu-actions__icon {
    color: var(--sm-brand);
  }

  .side-menu-actions__btn--danger {
    .side-menu-actions__icon {
      color: #f04438;
    }

    &:hover:not(:disabled),
    &:focus-visible:not(:disabled) {
      background: rgba(240, 68, 56, 0.12);
      border-color: #f04438;
      color: #f04438;
    }
  }
</style>
