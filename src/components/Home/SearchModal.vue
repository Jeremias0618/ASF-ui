<template>
  <ModalTransition @after-enter="onAfterEnter">
    <div
      v-if="open"
      class="home2-search-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="$t('home2-search-modal-title')"
    >
      <button
        type="button"
        class="home2-search-modal__backdrop asf-modal__backdrop"
        tabindex="-1"
        :aria-label="$t('home2-search-close')"
        @click="close"
      ></button>

      <div class="home2-search-modal__panel asf-modal__panel" @keydown="onPanelKey">
        <div class="home2-search-modal__field">
          <FontAwesomeIcon icon="search" class="home2-search-modal__icon" aria-hidden="true"></FontAwesomeIcon>
          <input
            ref="input"
            v-model="query"
            type="search"
            class="home2-search-modal__input"
            :placeholder="$t('home2-search-modal-placeholder')"
            autocomplete="off"
            spellcheck="false"
            @keydown.down.prevent="move(1)"
            @keydown.up.prevent="move(-1)"
            @keydown.enter.prevent="selectActive"
            @keydown.esc.prevent="close"
          >
          <kbd class="home2-search-modal__esc" aria-hidden="true">Esc</kbd>
        </div>

        <div class="home2-search-modal__body">
          <p v-if="!filtered.length" class="home2-search-modal__empty">
            {{ $t('home2-search-empty') }}
          </p>
          <template v-else>
            <p class="home2-search-modal__group">{{ $t('home2-search-pages') }}</p>
            <ul class="home2-search-modal__list" role="listbox">
              <li
                v-for="(item, index) in filtered"
                :key="item.route"
                role="option"
                :aria-selected="index === activeIndex ? 'true' : 'false'"
              >
                <button
                  type="button"
                  class="home2-search-modal__item"
                  :class="{ 'is-active': index === activeIndex }"
                  @click="go(item)"
                  @mouseenter="activeIndex = index"
                >
                  <span class="home2-search-modal__item-icon" aria-hidden="true">
                    <FontAwesomeIcon :icon="item.icon" fixedWidth></FontAwesomeIcon>
                  </span>
                  <span class="home2-search-modal__item-copy">
                    <span class="home2-search-modal__item-title">{{ $t(item.labelKey) }}</span>
                    <span class="home2-search-modal__item-desc">{{ $t(item.descKey) }}</span>
                  </span>
                  <span class="home2-search-modal__item-enter" aria-hidden="true">→</span>
                </button>
              </li>
            </ul>
          </template>
        </div>

        <div class="home2-search-modal__footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> {{ $t('home2-search-nav') }}</span>
          <span><kbd>↵</kbd> {{ $t('home2-search-select') }}</span>
          <span><kbd>Esc</kbd> {{ $t('home2-search-close') }}</span>
        </div>
      </div>
    </div>
  </ModalTransition>
</template>

<script>
  import ModalTransition from '../App/ModalTransition.vue';
  import { lockModalScroll, unlockModalScroll } from '../../utils/modal-transition';
  import { SEARCH_PAGES } from './search-pages';

  export default {
    name: 'HomeSearchModal',
    components: { ModalTransition },
    props: {
      open: { type: Boolean, default: false },
    },
    data() {
      return {
        query: '',
        activeIndex: 0,
      };
    },
    computed: {
      filtered() {
        const q = this.query.trim().toLowerCase();
        if (!q) return SEARCH_PAGES;

        return SEARCH_PAGES.filter((item) => {
          const label = String(this.$t(item.labelKey)).toLowerCase();
          const desc = String(this.$t(item.descKey)).toLowerCase();
          const haystack = `${label} ${desc} ${item.route} ${item.keywords}`.toLowerCase();
          return haystack.includes(q);
        });
      },
    },
    watch: {
      open(value) {
        if (value) {
          this.query = '';
          this.activeIndex = 0;
          lockModalScroll();
          return;
        }
        unlockModalScroll();
      },
      filtered() {
        this.activeIndex = 0;
      },
    },
    beforeDestroy() {
      if (this.open) unlockModalScroll();
    },
    methods: {
      onAfterEnter() {
        if (this.$refs.input) this.$refs.input.focus();
      },
      close() {
        this.$emit('close');
      },
      move(delta) {
        if (!this.filtered.length) return;
        const next = (this.activeIndex + delta + this.filtered.length) % this.filtered.length;
        this.activeIndex = next;
      },
      selectActive() {
        const item = this.filtered[this.activeIndex];
        if (item) this.go(item);
      },
      go(item) {
        this.$router.push({ name: item.route }).catch(() => {});
        this.close();
      },
      onPanelKey() {
        // Esc handled on input; backdrop click closes.
      },
    },
  };
</script>

<style lang="scss">
  @import '../../style/scrollbar';

  .home2-search-modal {
    align-items: flex-start;
    bottom: 0;
    display: flex;
    justify-content: center;
    left: 0;
    padding: 12vh 1rem 1rem;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 2000;
  }

  .home2-search-modal__backdrop {
    background: rgba(16, 24, 40, 0.45);
    border: 0;
    bottom: 0;
    cursor: default;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }

  .home2-search-modal__panel {
    background: var(--h2-shell);
    border: 1px solid var(--h2-border);
    border-radius: 0.85rem;
    box-shadow: 0 25px 50px -12px rgba(16, 24, 40, 0.35);
    display: flex;
    flex-direction: column;
    max-height: min(32rem, 76vh);
    max-width: 40rem;
    overflow: hidden;
    position: relative;
    width: 100%;
    z-index: 1;
  }

  .home2-search-modal__field {
    align-items: center;
    border-bottom: 1px solid var(--h2-border);
    display: flex;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
  }

  .home2-search-modal__icon {
    color: var(--h2-muted);
    flex-shrink: 0;
  }

  .home2-search-modal__input {
    background: transparent;
    border: 0;
    color: var(--h2-ink);
    flex: 1;
    font: inherit;
    font-size: 0.95rem;
    min-width: 0;
    outline: none;
    padding: 0;

    &::placeholder {
      color: #98a2b3;
    }
  }

  .home2-search-modal__esc {
    background: var(--h2-soft);
    border: 1px solid var(--h2-border);
    border-radius: 0.4rem;
    color: var(--h2-muted);
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
  }

  .home2-search-modal__body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 0.75rem;
    @include h2-scrollbar;

    .app--dark-mode & {
      @include h2-scrollbar-dark;
    }
  }

  .home2-search-modal__group {
    color: var(--h2-muted);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    margin: 0 0 0.5rem 0.35rem;
    text-transform: uppercase;
  }

  .home2-search-modal__list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .home2-search-modal__item {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 0.65rem;
    color: inherit;
    cursor: pointer;
    display: flex;
    gap: 0.75rem;
    padding: 0.7rem 0.75rem;
    text-align: left;
    width: 100%;

    &.is-active,
    &:hover {
      background: var(--h2-soft);
    }

    &.is-active .home2-search-modal__item-enter {
      opacity: 1;
    }
  }

  .home2-search-modal__item-icon {
    align-items: center;
    color: var(--h2-muted);
    display: inline-flex;
    flex-shrink: 0;
    font-size: 0.95rem;
    justify-content: center;
    width: 1.25rem;
  }

  .home2-search-modal__item-copy {
    display: grid;
    flex: 1;
    gap: 0.1rem;
    min-width: 0;
  }

  .home2-search-modal__item-title {
    font-size: 0.9rem;
    font-weight: 600;
  }

  .home2-search-modal__item-desc {
    color: var(--h2-muted);
    font-size: 0.75rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .home2-search-modal__item-enter {
    color: var(--h2-muted);
    flex-shrink: 0;
    font-size: 0.95rem;
    opacity: 0;
  }

  .home2-search-modal__empty {
    color: var(--h2-muted);
    font-size: 0.875rem;
    margin: 1.5rem 0;
    text-align: center;
  }

  .home2-search-modal__footer {
    align-items: center;
    background: var(--h2-surface);
    border-top: 1px solid var(--h2-border);
    color: var(--h2-muted);
    display: flex;
    flex-wrap: wrap;
    font-size: 0.72rem;
    gap: 0.85rem;
    padding: 0.65rem 1rem;

    kbd {
      background: var(--h2-shell);
      border: 1px solid var(--h2-border);
      border-radius: 0.3rem;
      display: inline-block;
      margin-right: 0.15rem;
      min-width: 1.1rem;
      padding: 0.1rem 0.3rem;
      text-align: center;
    }
  }
</style>
