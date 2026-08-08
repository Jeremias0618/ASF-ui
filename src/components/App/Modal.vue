<template>
  <transition name="modal" duration="200" appear>
    <div v-if="isShown" class="modal">
      <div class="modal__background" @click.self="close"></div>
      <div class="modal__body">
        <FontAwesomeIcon icon="times" class="modal__close" @click="close"></FontAwesomeIcon>
        <FontAwesomeIcon v-if="showArrows" icon="chevron-left" class="modal__arrow left" @click="next('left')"></FontAwesomeIcon>
        <FontAwesomeIcon v-if="showArrows" icon="chevron-right" class="modal__arrow right" @click="next('right')"></FontAwesomeIcon>
        <div class="modal__main" :class="{ 'modal__main--wide': isWide }">
          <router-view ref="modal" name="modal"></router-view>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
  import { mapGetters } from 'vuex';

  const WIDE_MODAL_ROUTES = new Set([
    'bot-config',
    'bot-create',
    'bot-copy',
    'bot-bgr',
  ]);

  export default {
    name: 'Modal',
    computed: {
      ...mapGetters({
        bots: 'bots/bots',
      }),
      isShown() {
        return !!this.$route.meta.modal;
      },
      isWide() {
        return WIDE_MODAL_ROUTES.has(this.$route.name);
      },
      showArrows() {
        return !!this.$route.meta.arrows && this.bots.length > 1;
      },
    },
    created() {
      document.addEventListener('keyup', this.onKeyPress);
    },
    beforeDestroy() {
      document.removeEventListener('keyup', this.onKeyPress);
    },
    methods: {
      close() {
        this.$router.push({ name: this.$route.meta.closeRoute });
      },
      back() {
        this.$router.push(this.$route.path.slice(0, this.$route.path.lastIndexOf('/')));
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

        this.$router.push({ name: this.$route.name, params: { bot: this.bots[targetIndex].name } });
      },
    },
  };
</script>

<style lang="scss">
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
    transition: background .2s linear;
  }

  .modal__body {
    max-height: 100%;
    max-width: 100%;
    position: relative;
    transition: opacity .3s ease-out, transform .3s ease-out;
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
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        max-height: 100%;
        min-height: 0;
        overflow: auto;
      }
    }
  }

  .modal__close {
    color: var(--color-text-disabled);
    cursor: pointer;
    font-size: 1.2em;
    position: absolute;
    right: -1.5em;
    top: 0.25em;
    z-index: 30;

    @media screen and (max-width: 720px) {
      background: rgba(0, 0, 0, 0.35);
      border-radius: 999px;
      padding: 0.4em 0.55em;
      right: 0.65rem;
      top: 0.65rem;
    }
  }

  .modal-enter, .modal-leave-to {
    .modal__background {
      background: rgba(#000000, 0);
    }

    .modal__body {
      opacity: 0;
      transform: scale(0.75);
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
