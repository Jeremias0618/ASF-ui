<template>
  <transition name="modal" :duration="MODAL_DURATION_MS" appear>
    <div v-if="isShown" class="modal" role="dialog" aria-modal="true">
      <div class="modal__background" aria-hidden="true"></div>

      <transition name="modal-panel" :duration="MODAL_DURATION_MS" mode="out-in">
        <div :key="modalTransitionKey" class="modal__body">
          <button
            v-if="showBackToBot"
            type="button"
            class="modal__back"
            v-tooltip="$t('modal-back-bot')"
            :aria-label="$t('modal-back-bot')"
            @click="backToBot"
          >
            <FontAwesomeIcon icon="chevron-left" aria-hidden="true"></FontAwesomeIcon>
            <span class="modal__back-text">{{ $t('back') }}</span>
          </button>

          <button
            type="button"
            class="modal__close"
            v-tooltip="$t('modal-close')"
            :aria-label="$t('modal-close')"
            @click="close"
          >
            <FontAwesomeIcon icon="times" aria-hidden="true"></FontAwesomeIcon>
          </button>

          <FontAwesomeIcon v-if="showArrows" icon="chevron-left" class="modal__arrow left" @click="next('left')"></FontAwesomeIcon>
          <FontAwesomeIcon v-if="showArrows" icon="chevron-right" class="modal__arrow right" @click="next('right')"></FontAwesomeIcon>

          <div
            class="modal__main"
            :class="modalMainClasses"
          >
            <router-view ref="modal" name="modal"></router-view>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
  import { mapGetters } from 'vuex';
  import { isBenignNavigationError } from '../../utils/unsaved-changes';
  import { resolveModalSizeClasses } from '../../utils/modal-size';

  const MODAL_DURATION_MS = 220;

  export default {
    name: 'Modal',
    data() {
      return {
        MODAL_DURATION_MS,
      };
    },
    computed: {
      ...mapGetters({
        bots: 'bots/bots',
      }),
      isShown() {
        return !!this.$route.meta.modal;
      },
      /** Remount panel on each modal route so enter/leave runs when swapping views. */
      modalTransitionKey() {
        return this.$route.name || this.$route.path;
      },
      modalMainClasses() {
        return resolveModalSizeClasses(this.$route);
      },
      showArrows() {
        return !!this.$route.meta.arrows && this.bots.length > 1;
      },
      showBackToBot() {
        const botName = this.$route.params?.bot;
        if (!botName || this.$route.name === 'bot') return false;
        return true;
      },
    },
    created() {
      document.addEventListener('keyup', this.onKeyPress);
    },
    beforeDestroy() {
      document.removeEventListener('keyup', this.onKeyPress);
    },
    methods: {
      navigate(location) {
        return this.$router.push(location).catch(err => {
          if (isBenignNavigationError(err)) return;
          throw err;
        });
      },
      close() {
        this.navigate({ name: this.$route.meta.closeRoute });
      },
      /**
       * Used by nested modal views via `$parent.back()` (Cancel, etc.).
       * Prefer returning to the bot profile when a bot param exists.
       */
      back() {
        const botName = this.$route.params?.bot;
        if (botName && this.$route.name !== 'bot') {
          this.backToBot();
          return;
        }
        this.close();
      },
      backToBot() {
        const botName = this.$route.params?.bot;
        if (!botName) return;
        this.navigate({ name: 'bot', params: { bot: botName } });
      },
      onKeyPress(event) {
        // Ignore key presses when the modal is not visible
        if (!this.isShown) return;

        // Ignore key presses inside inputs
        if (document.activeElement.tagName === 'TEXTAREA') return;
        if (document.activeElement.tagName === 'INPUT') return;

        switch (event.key) {
          case 'Escape':
            this.close();
            break;
          case 'ArrowRight':
            this.next('right');
            break;
          case 'ArrowLeft':
            this.next('left');
            break;
        }
      },
      next(direction) {
        const currentIndex = this.bots.findIndex(bot => bot.name === this.$route.params.bot);
        let targetIndex = currentIndex + ((direction === 'left') ? -1 : 1);

        if (targetIndex > this.bots.length - 1) targetIndex = 0;
        else if (targetIndex < 0) targetIndex = this.bots.length - 1;

        this.navigate({ name: this.$route.name, params: { bot: this.bots[targetIndex].name } });
      },
    },
  };
</script>

<style lang="scss">
  $modal-duration: 220ms;
  $modal-ease: cubic-bezier(0.16, 1, 0.3, 1);

  .modal {
    align-items: center;
    bottom: 0;
    display: flex;
    justify-content: center;
    left: 0;
    padding: 0.75rem;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 1020;

    @media screen and (max-width: 640px) {
      .modal__main--wide {
        border-radius: 0;
        height: 100dvh;
        max-height: 100dvh;
        max-width: 100%;
        width: 100%;
      }

      &:has(.modal__main--wide) {
        align-items: stretch;
        padding: 0;
      }
    }
  }

  .modal__background {
    background: rgba(0, 0, 0, 0.8);
    bottom: 0;
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
  }

  .modal__body {
    max-height: 100%;
    max-width: 100%;
    position: relative;
  }

  .modal__main {
    background: var(--color-background-modal);
    border-radius: 0.75rem;
    box-shadow: 0 0 5px 0 var(--color-border);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    max-height: min(90dvh, 56rem);
    max-width: min(90vw, 40rem);
    overflow: auto;
    position: relative;
    width: auto;
    z-index: 21;

    > * {
      box-sizing: border-box;
      max-width: 100%;
    }

    &--wide {
      max-width: min(52rem, calc(100vw - 1.5rem));
      overflow: hidden;
      width: min(52rem, calc(100vw - 1.5rem));

      > * {
        box-sizing: border-box;
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        max-height: 100%;
        max-width: 100%;
        min-height: 0;
        min-width: 0;
        overflow-x: hidden;
        overflow-y: auto;
        width: 100%;
      }
    }

    &--friends {
      max-width: min(60rem, calc(100vw - 1.5rem));
      overflow: hidden;
      width: min(60rem, calc(100vw - 1.5rem));
    }

    &--dialog {
      max-width: min(28rem, calc(100vw - 1.5rem));
      width: min(28rem, calc(100vw - 1.5rem));
    }

    &--medium {
      max-width: min(36rem, calc(100vw - 1.5rem));
      width: min(36rem, calc(100vw - 1.5rem));
    }
  }

  .modal__back,
  .modal__close {
    appearance: none;
    background: transparent;
    border: 0;
    color: var(--color-text-disabled);
    cursor: pointer;
    font: inherit;
    line-height: 1;
    padding: 0;
    position: absolute;
    top: 0.25em;
    z-index: 30;

    &:hover,
    &:focus-visible {
      color: var(--color-text);
      outline: none;
    }
  }

  .modal__back {
    align-items: center;
    display: inline-flex;
    font-size: 0.95em;
    gap: 0.35em;
    left: 0;
    transform: translateX(calc(-100% - 1rem));
    white-space: nowrap;

    @media screen and (max-width: 720px) {
      background: rgba(0, 0, 0, 0.35);
      border-radius: 999px;
      left: 0.65rem;
      padding: 0.4em 0.7em;
      top: 0.65rem;
      transform: none;
    }
  }

  .modal__back-text {
    font-size: 0.85em;
    font-weight: 650;
  }

  .modal__close {
    font-size: 1.2em;
    right: -1.5em;

    @media screen and (max-width: 720px) {
      background: rgba(0, 0, 0, 0.35);
      border-radius: 999px;
      padding: 0.4em 0.55em;
      right: 0.65rem;
      top: 0.65rem;
    }
  }

  /* Shell open/close: backdrop + panel together */
  .modal-enter-active,
  .modal-leave-active {
    .modal__background {
      transition: background $modal-duration ease;
    }

    .modal__body {
      transition:
        opacity $modal-duration $modal-ease,
        transform $modal-duration $modal-ease;
    }
  }

  .modal-enter,
  .modal-leave-to {
    .modal__background {
      background: rgba(#000000, 0);
    }

    .modal__body {
      opacity: 0;
      transform: translateY(0.65rem) scale(0.96);
    }
  }

  /* Route swap while modal stays open (config, inventory, …) */
  .modal-panel-enter-active,
  .modal-panel-leave-active {
    transition:
      opacity $modal-duration $modal-ease,
      transform $modal-duration $modal-ease;
  }

  .modal-panel-enter,
  .modal-panel-leave-to {
    opacity: 0;
    transform: translateY(0.65rem) scale(0.96);
  }

  @media (prefers-reduced-motion: reduce) {
    .modal-enter-active,
    .modal-leave-active {
      .modal__background,
      .modal__body {
        transition: none;
      }
    }

    .modal-enter,
    .modal-leave-to {
      .modal__body {
        transform: none;
      }
    }

    .modal-panel-enter-active,
    .modal-panel-leave-active {
      transition: none;
    }

    .modal-panel-enter,
    .modal-panel-leave-to {
      transform: none;
    }
  }

  .modal__arrow {
    color: var(--color-text-disabled);
    cursor: pointer;
    font-size: 1.5em;
    position: absolute;
    top: 50%;
    z-index: 30;

    &.left {
      left: -1em;
    }

    &.right {
      right: -1em;
    }

    @media screen and (max-width: 720px) {
      display: none;
    }
  }
</style>
