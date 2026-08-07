<template>
  <ModalTransition>
    <div
      v-if="action"
      class="side-menu-confirm"
      role="alertdialog"
      aria-modal="true"
      :aria-labelledby="confirmTitleId"
      :aria-describedby="confirmBodyId"
    >
      <button
        type="button"
        class="side-menu-confirm__backdrop asf-modal__backdrop"
        tabindex="-1"
        :aria-label="$t('cancel')"
        :disabled="busy"
        @click="cancel"
      ></button>

      <div class="side-menu-confirm__dialog asf-modal__panel">
        <h3 :id="confirmTitleId" class="side-menu-confirm__title">{{ confirmTitle }}</h3>
        <p :id="confirmBodyId" class="side-menu-confirm__body">{{ confirmMessage }}</p>
        <div class="side-menu-confirm__actions">
          <button
            type="button"
            class="side-menu-confirm__btn side-menu-confirm__btn--ghost"
            :disabled="busy"
            @click="cancel"
          >
            {{ $t('cancel') }}
          </button>
          <button
            ref="confirmButton"
            type="button"
            class="side-menu-confirm__btn"
            :class="action === 'shutdown' ? 'side-menu-confirm__btn--danger' : 'side-menu-confirm__btn--primary'"
            :disabled="busy"
            @click="confirm"
          >
            <FontAwesomeIcon v-if="busy" icon="spinner" spin fixedWidth></FontAwesomeIcon>
            <span v-else>{{ confirmActionLabel }}</span>
          </button>
        </div>
      </div>
    </div>
  </ModalTransition>
</template>

<script>
  import { mapGetters } from 'vuex';
  import ModalTransition from '../ModalTransition.vue';
  import { isReleaseAvailable } from '../../../utils/ui';
  import { lockModalScroll, unlockModalScroll } from '../../../utils/modal-transition';

  export default {
    name: 'SideMenuInstanceModal',
    components: { ModalTransition },
    props: {
      action: {
        type: String,
        default: null,
        validator: value => value == null || ['update', 'restart', 'shutdown'].includes(value),
      },
    },
    data() {
      return {
        busy: false,
        confirmTitleId: 'side-menu-confirm-title',
        confirmBodyId: 'side-menu-confirm-body',
      };
    },
    computed: {
      ...mapGetters({
        version: 'asf/version',
      }),
      confirmTitle() {
        switch (this.action) {
          case 'update': return this.$t('sidebar-confirm-update-title');
          case 'restart': return this.$t('sidebar-confirm-restart-title');
          case 'shutdown': return this.$t('sidebar-confirm-shutdown-title');
          default: return '';
        }
      },
      confirmMessage() {
        switch (this.action) {
          case 'update': return this.$t('sidebar-confirm-update-body');
          case 'restart': return this.$t('sidebar-confirm-restart-body');
          case 'shutdown': return this.$t('sidebar-confirm-shutdown-body');
          default: return '';
        }
      },
      confirmActionLabel() {
        switch (this.action) {
          case 'update': return this.$t('update');
          case 'restart': return this.$t('restart');
          case 'shutdown': return this.$t('shutdown');
          default: return this.$t('continue');
        }
      },
    },
    watch: {
      action: {
        immediate: true,
        handler(value) {
          if (value) {
            lockModalScroll();
            window.addEventListener('keydown', this.onKeydown, true);
            this.$nextTick(() => {
              if (this.$refs.confirmButton) this.$refs.confirmButton.focus();
            });
            return;
          }

          unlockModalScroll();
          window.removeEventListener('keydown', this.onKeydown, true);
        },
      },
    },
    beforeDestroy() {
      window.removeEventListener('keydown', this.onKeydown, true);
      if (this.action) unlockModalScroll();
    },
    methods: {
      onKeydown(event) {
        if (event.key !== 'Escape' || !this.action || this.busy) return;
        event.stopPropagation();
        event.preventDefault();
        this.cancel();
      },
      cancel() {
        if (this.busy) return;
        this.$emit('close');
      },
      async confirm() {
        if (!this.action || this.busy) return;

        this.busy = true;
        try {
          if (this.action === 'update') await this.performUpdate();
          else if (this.action === 'restart') await this.performRestart();
          else if (this.action === 'shutdown') await this.performShutdown();
          this.$emit('close');
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.busy = false;
        }
      },
      extractVersions(err) {
        if (err.result) {
          return {
            remoteVersion: err.result,
            localVersion: this.version,
          };
        }

        if (err.message && err.message.includes('≥')) {
          const [localVersion, remoteVersion] = err.message.split(' ≥ ');
          return { remoteVersion, localVersion };
        }

        return {};
      },
      async performUpdate() {
        this.$info(this.$t('update-check'));
        const newVersionAvailable = await isReleaseAvailable();

        if (newVersionAvailable) {
          const notification = this.$snotify.info(this.$t('update-trying'), this.$t('info'));
          notification.on('click', () => this.redirectToLog());
        }

        try {
          await this.$http.post('asf/update', {});
          this.$router.push({ name: 'setup', params: { update: true } });
        } catch (err) {
          if (!err.result && !(err.message && err.message.includes('≥'))) throw err;
          const { remoteVersion, localVersion } = this.extractVersions(err);
          if (localVersion === remoteVersion) this.$info(this.$t('update-is-up-to-date'));
          else this.$info(this.$t('update-is-newest'));
        }
      },
      async performRestart() {
        await this.$http.post('asf/restart');
        this.$info(this.$t('restart-initiated'));
        this.$router.push({ name: 'setup', params: { restart: true } });
      },
      async performShutdown() {
        await this.$http.post('asf/exit');
        this.$info(this.$t('shutdown-message'));
      },
      redirectToLog() {
        if (this.$route.name !== 'log') this.$router.push({ name: 'log' });
      },
    },
  };
</script>

<style lang="scss">
  .side-menu-confirm {
    align-items: center;
    bottom: 0;
    display: flex;
    justify-content: center;
    left: 0;
    padding: 1rem;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 2100;
  }

  .side-menu-confirm__backdrop {
    background: rgba(16, 24, 40, 0.55);
    border: 0;
    cursor: default;
    inset: 0;
    position: absolute;

    .app--dark-mode & {
      background: rgba(0, 0, 0, 0.65);
    }
  }

  .side-menu-confirm__dialog {
    background: var(--sm-elevated, #ffffff);
    border: 1px solid var(--sm-border, #e4e7ec);
    border-radius: 1rem;
    box-shadow: 0 18px 40px rgba(16, 24, 40, 0.2);
    box-sizing: border-box;
    color: var(--sm-ink, #101828);
    max-width: 22rem;
    padding: 1.25rem 1.2rem 1.15rem;
    position: relative;
    width: 100%;
    z-index: 1;

    .app--dark-mode & {
      background: #1b2233;
      border-color: rgba(255, 255, 255, 0.08);
      box-shadow: 0 22px 48px rgba(0, 0, 0, 0.45);
      color: #f8fafc;
    }
  }

  .side-menu-confirm__title {
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0 0 0.45rem;
  }

  .side-menu-confirm__body {
    color: var(--sm-muted, #667085);
    font-size: 0.88rem;
    line-height: 1.45;
    margin: 0 0 1.15rem;

    .app--dark-mode & {
      color: #94a3b8;
    }
  }

  .side-menu-confirm__actions {
    display: flex;
    gap: 0.55rem;
    justify-content: flex-end;
  }

  .side-menu-confirm__btn {
    align-items: center;
    border: 0;
    border-radius: 0.6rem;
    cursor: pointer;
    display: inline-flex;
    font-family: inherit;
    font-size: 0.86rem;
    font-weight: 600;
    gap: 0.35rem;
    justify-content: center;
    min-height: 2.35rem;
    min-width: 5.5rem;
    padding: 0.45rem 0.9rem;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  .side-menu-confirm__btn--ghost {
    background: var(--sm-soft, #f2f4f7);
    color: var(--sm-ink, #101828);

    .app--dark-mode & {
      background: #232c40;
      color: #f8fafc;
    }
  }

  .side-menu-confirm__btn--primary {
    background: var(--color-theme, #0968e5);
    color: #fff;

    &:hover:not(:disabled),
    &:focus-visible:not(:disabled) {
      background: var(--color-theme-dark, #0757c2);
      outline: none;
    }
  }

  .side-menu-confirm__btn--danger {
    background: #f04438;
    color: #fff;

    &:hover:not(:disabled),
    &:focus-visible:not(:disabled) {
      background: #d92d20;
      outline: none;
    }
  }
</style>
