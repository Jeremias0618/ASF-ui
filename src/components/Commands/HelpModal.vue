<template>
  <ModalTransition @after-enter="onAfterEnter">
    <div
      v-if="open"
      class="commands-help"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="leadId"
    >
      <button
        type="button"
        class="commands-help__backdrop asf-modal__backdrop"
        tabindex="-1"
        :aria-label="$t('commands-help-close')"
        @click="close"
      ></button>

      <div class="commands-help__panel asf-modal__panel">
        <header class="commands-help__header">
          <div class="commands-help__heading">
            <h2 :id="titleId" class="commands-help__title">{{ $t('commands-help-title') }}</h2>
            <p :id="leadId" class="commands-help__lead">{{ $t('commands-help-lead') }}</p>
          </div>
          <button
            type="button"
            class="commands-help__close"
            :aria-label="$t('commands-help-close')"
            @click="close"
          >
            <FontAwesomeIcon icon="times" fixedWidth></FontAwesomeIcon>
          </button>
        </header>

        <nav
          v-if="navGroups.length"
          class="commands-help__nav"
          :aria-label="$t('commands-help-nav-label')"
        >
          <button
            v-for="group in navGroups"
            :key="`nav-${group.id}`"
            type="button"
            class="commands-help__nav-chip"
            @click="scrollToGroup(group.id)"
          >
            <span>{{ $t(`commands-help-category-${group.id}`) }}</span>
            <span class="commands-help__nav-count">{{ group.commands.length }}</span>
          </button>
        </nav>

        <div class="commands-help__search">
          <FontAwesomeIcon icon="search" class="commands-help__search-icon" aria-hidden="true"></FontAwesomeIcon>
          <input
            ref="input"
            v-model="query"
            type="search"
            class="commands-help__search-input"
            :placeholder="$t('commands-help-search')"
            autocomplete="off"
            spellcheck="false"
            @keydown.esc.prevent="close"
          >
        </div>

        <div ref="body" class="commands-help__body">
          <p v-if="!filteredGroups.length" class="commands-help__empty">
            {{ $t('commands-help-empty') }}
          </p>

          <section
            v-for="group in filteredGroups"
            :id="groupAnchorId(group.id)"
            :key="group.id"
            class="commands-help__group"
          >
            <h3 class="commands-help__group-title">
              {{ $t(`commands-help-category-${group.id}`) }}
              <span class="commands-help__group-count">{{ group.commands.length }}</span>
            </h3>

            <ul class="commands-help__list">
              <li
                v-for="entry in group.commands"
                :key="`${group.id}:${entry.command}`"
                class="commands-help__item"
              >
                <div class="commands-help__item-main">
                  <div class="commands-help__item-top">
                    <code class="commands-help__command">{{ entry.command }}</code>
                    <span v-if="entry.access" class="commands-help__access">{{ entry.access }}</span>
                  </div>
                  <p class="commands-help__description">{{ entry.description }}</p>
                </div>

                <button
                  type="button"
                  class="commands-help__copy"
                  :aria-label="$t('commands-help-copy')"
                  :title="$t('commands-help-copy')"
                  @click="copyCommand(entry.command)"
                >
                  <FontAwesomeIcon icon="clipboard" fixedWidth></FontAwesomeIcon>
                </button>
              </li>
            </ul>
          </section>
        </div>

        <footer class="commands-help__footer">
          <span>{{ $t('commands-help-count', { n: filteredCount }) }}</span>
          <span><kbd>Esc</kbd> {{ $t('commands-help-close') }}</span>
        </footer>
      </div>
    </div>
  </ModalTransition>
</template>

<script>
  import copy from 'copy-to-clipboard';
  import ModalTransition from '../App/ModalTransition.vue';
  import { lockModalScroll, unlockModalScroll } from '../../utils/modal-transition';
  import { getCommandBaseName, groupCommandsByCategory } from '../../utils/command-categories';

  export default {
    name: 'CommandsHelpModal',
    components: { ModalTransition },
    props: {
      open: { type: Boolean, default: false },
      commands: {
        type: Array,
        default: () => [],
      },
    },
    data() {
      return {
        query: '',
        titleId: 'commands-help-title',
        leadId: 'commands-help-lead',
      };
    },
    computed: {
      filteredEntries() {
        const q = this.query.trim().toLowerCase();
        if (!q) return this.commands;

        return this.commands.filter((entry) => {
          const haystack = [
            entry.command,
            entry.description,
            entry.access,
          ].filter(Boolean).join(' ').toLowerCase();
          return haystack.includes(q);
        });
      },
      filteredGroups() {
        return groupCommandsByCategory(this.filteredEntries);
      },
      navGroups() {
        return groupCommandsByCategory(this.commands);
      },
      filteredCount() {
        return this.filteredEntries.length;
      },
    },
    watch: {
      open(value) {
        if (value) {
          this.query = '';
          lockModalScroll();
          return;
        }
        unlockModalScroll();
      },
    },
    beforeDestroy() {
      if (this.open) unlockModalScroll();
    },
    methods: {
      groupAnchorId(groupId) {
        return `commands-help-group-${groupId}`;
      },
      scrollToGroup(groupId) {
        const scroll = () => {
          const body = this.$refs.body;
          const target = body && body.querySelector(`#${this.groupAnchorId(groupId)}`);
          if (!body || !target) return;

          const bodyRect = body.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          const top = body.scrollTop + (targetRect.top - bodyRect.top) - 8;

          body.scrollTo({
            top: Math.max(0, top),
            behavior: 'smooth',
          });
        };

        // Clear search so the target category is always present in the list.
        if (this.query) {
          this.query = '';
          this.$nextTick(scroll);
          return;
        }

        this.$nextTick(scroll);
      },
      onAfterEnter() {
        if (this.$refs.input) this.$refs.input.focus();
      },
      copyCommand(commandSyntax) {
        const command = getCommandBaseName(commandSyntax);
        if (!command) return;
        copy(command);
        this.$info(this.$t('commands-help-copied', { command }));
      },
      close() {
        this.$emit('close');
      },
    },
  };
</script>

<style lang="scss">
  @import '../../style/scrollbar';

  .commands-help {
    align-items: flex-start;
    bottom: 0;
    display: flex;
    justify-content: center;
    left: 0;
    padding: 8vh 1rem 1rem;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 2000;
  }

  .commands-help__backdrop {
    background: rgba(16, 24, 40, 0.45);
    border: 0;
    bottom: 0;
    cursor: default;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }

  .commands-help__panel {
    background: var(--h2-shell, var(--color-background-light));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 0.9rem;
    box-shadow: 0 25px 50px -12px rgba(16, 24, 40, 0.35);
    color: var(--h2-ink, var(--color-text-dark));
    display: flex;
    flex-direction: column;
    max-height: min(40rem, 84vh);
    max-width: 44rem;
    overflow: hidden;
    position: relative;
    width: 100%;
    z-index: 1;
  }

  .commands-help__header {
    align-items: flex-start;
    border-bottom: 1px solid var(--h2-border, var(--color-border));
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1.1rem 0.9rem;
  }

  .commands-help__heading {
    flex: 1;
    min-width: 0;
  }

  .commands-help__title {
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0 0 0.25rem;
  }

  .commands-help__lead {
    color: var(--h2-muted, #667085);
    font-size: 0.8rem;
    line-height: 1.4;
    margin: 0;
  }

  .commands-help__close {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 0.5rem;
    color: var(--h2-muted, #667085);
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    height: 2rem;
    justify-content: center;
    width: 2rem;

    &:hover,
    &:focus-visible {
      background: var(--h2-soft, rgba(127, 140, 160, 0.12));
      color: var(--h2-ink, var(--color-text-dark));
      outline: none;
    }
  }

  .commands-help__nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0.75rem 1.1rem 0.15rem;
  }

  .commands-help__nav-chip {
    align-items: center;
    background: var(--h2-soft, rgba(127, 140, 160, 0.1));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 999px;
    color: var(--h2-ink, var(--color-text-dark));
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    font-size: 0.72rem;
    font-weight: 650;
    gap: 0.35rem;
    line-height: 1.2;
    padding: 0.35rem 0.65rem;
    transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;

    &:hover,
    &:focus-visible {
      background: var(--color-theme, #3b82f6);
      border-color: var(--color-theme, #3b82f6);
      color: #fff;
      outline: none;

      .commands-help__nav-count {
        background: rgba(255, 255, 255, 0.22);
        color: #fff;
      }
    }
  }

  .commands-help__nav-count {
    background: rgba(16, 24, 40, 0.08);
    border-radius: 999px;
    color: var(--h2-muted, #667085);
    font-size: 0.66rem;
    font-weight: 700;
    min-width: 1.15rem;
    padding: 0.08rem 0.35rem;
    text-align: center;

    .app--dark-mode & {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .commands-help__search {
    align-items: center;
    border-bottom: 1px solid var(--h2-border, var(--color-border));
    display: flex;
    gap: 0.65rem;
    padding: 0.7rem 1.1rem;
  }

  .commands-help__search-icon {
    color: var(--h2-muted, #667085);
    flex-shrink: 0;
  }

  .commands-help__search-input {
    appearance: none;
    background: transparent;
    border: 0;
    color: inherit;
    flex: 1;
    font: inherit;
    font-size: 0.9rem;
    min-width: 0;
    outline: none;
    padding: 0;

    &::-webkit-search-cancel-button {
      display: none;
    }

    &::placeholder {
      color: #98a2b3;
      opacity: 1;
    }
  }

  .commands-help__body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 0.85rem 1rem 1rem;
    @include h2-scrollbar;

    .app--dark-mode & {
      @include h2-scrollbar-dark;
    }
  }

  .commands-help__empty {
    color: var(--h2-muted, #667085);
    font-size: 0.85rem;
    margin: 1.5rem 0;
    text-align: center;
  }

  .commands-help__group {
    scroll-margin-top: 0.5rem;
  }

  .commands-help__group + .commands-help__group {
    margin-top: 1.15rem;
  }

  .commands-help__group-title {
    align-items: center;
    color: var(--h2-muted, #667085);
    display: flex;
    font-size: 0.72rem;
    font-weight: 700;
    gap: 0.45rem;
    letter-spacing: 0.05em;
    margin: 0 0 0.45rem 0.15rem;
    text-transform: uppercase;
  }

  .commands-help__group-count {
    background: var(--h2-soft, rgba(127, 140, 160, 0.12));
    border-radius: 999px;
    color: var(--h2-muted, #667085);
    font-size: 0.68rem;
    font-weight: 650;
    letter-spacing: 0;
    padding: 0.08rem 0.4rem;
    text-transform: none;
  }

  .commands-help__list {
    display: grid;
    gap: 0.35rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .commands-help__item {
    align-items: flex-start;
    background: var(--h2-soft, rgba(127, 140, 160, 0.08));
    border: 1px solid transparent;
    border-radius: 0.65rem;
    display: flex;
    gap: 0.55rem;
    padding: 0.65rem 0.65rem 0.65rem 0.75rem;
  }

  .commands-help__item-main {
    flex: 1;
    min-width: 0;
  }

  .commands-help__item-top {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem 0.65rem;
    margin-bottom: 0.25rem;
  }

  .commands-help__copy {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 0.45rem;
    color: var(--h2-muted, #667085);
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    height: 1.9rem;
    justify-content: center;
    margin-top: 0.05rem;
    width: 1.9rem;

    &:hover,
    &:focus-visible {
      background: rgba(59, 130, 246, 0.12);
      color: var(--color-theme, #3b82f6);
      outline: none;
    }
  }

  .commands-help__command {
    background: rgba(16, 24, 40, 0.06);
    border-radius: 0.35rem;
    color: var(--color-theme, #3b82f6);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.82rem;
    font-weight: 650;
    padding: 0.12rem 0.4rem;

    .app--dark-mode & {
      background: rgba(255, 255, 255, 0.06);
    }
  }

  .commands-help__access {
    background: transparent;
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 999px;
    color: var(--h2-muted, #667085);
    font-size: 0.68rem;
    font-weight: 650;
    padding: 0.1rem 0.45rem;
  }

  .commands-help__description {
    color: var(--h2-ink, var(--color-text-dark));
    font-size: 0.8rem;
    line-height: 1.4;
    margin: 0;
    opacity: 0.9;
  }

  .commands-help__footer {
    align-items: center;
    border-top: 1px solid var(--h2-border, var(--color-border));
    color: var(--h2-muted, #667085);
    display: flex;
    flex-wrap: wrap;
    font-size: 0.72rem;
    gap: 0.75rem 1.25rem;
    justify-content: space-between;
    padding: 0.65rem 1.1rem;

    kbd {
      background: var(--h2-soft, rgba(127, 140, 160, 0.12));
      border: 1px solid var(--h2-border, var(--color-border));
      border-radius: 0.3rem;
      font-size: 0.68rem;
      padding: 0.05rem 0.3rem;
    }
  }
</style>
