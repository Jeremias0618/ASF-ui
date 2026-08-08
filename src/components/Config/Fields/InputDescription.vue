<template>
  <transition name="form-item__help">
    <div
      v-if="shown"
      ref="panel"
      class="form-item__description"
      :class="{
        'is-wide': hasWikiTable,
        'is-simple-table': hasSimpleTable,
      }"
      :style="panelStyle"
      role="dialog"
      :aria-label="$t('config-help', 'Help')"
      @click.stop
    >
      <div class="form-item__description-content" v-html="safeHtml"></div>
    </div>
  </transition>
</template>

<script>
  export default {
    name: 'InputDescription',
    props: {
      description: String,
      shown: Boolean,
    },
    data() {
      return {
        panelStyle: {},
      };
    },
    computed: {
      hasTable() {
        return /<table[\s>]/i.test(this.description || '');
      },
      hasSimpleTable() {
        return /help-simple/i.test(this.description || '');
      },
      hasWikiTable() {
        return this.hasTable && !this.hasSimpleTable;
      },
      safeHtml() {
        const html = this.description || '';
        if (!this.hasTable) return html;

        return html
          .replace(/<table([^>]*)>/gi, (match, attrs) => {
            const isSimple = /help-simple/i.test(attrs || '');
            const wrapClass = isSimple
              ? 'help-table-wrap help-table-wrap--simple'
              : 'form-item__description-table-wrap help-table-wrap';
            return `<div class="${wrapClass}"><table${attrs}>`;
          })
          .replace(/<\/table>/gi, '</table></div>');
      },
    },
    watch: {
      shown(isOpen) {
        this.unbindPositionListeners();
        if (!isOpen) return;
        this.$nextTick(() => {
          this.positionPanel();
          requestAnimationFrame(() => this.positionPanel());
          window.addEventListener('resize', this.positionPanel, { passive: true });
          window.addEventListener('scroll', this.positionPanel, true);
        });
      },
    },
    beforeDestroy() {
      this.unbindPositionListeners();
    },
    methods: {
      unbindPositionListeners() {
        window.removeEventListener('resize', this.positionPanel);
        window.removeEventListener('scroll', this.positionPanel, true);
      },
      findAnchor() {
        const root = this.$parent && this.$parent.$el;
        if (!root || !root.querySelector) return null;
        return root.querySelector('.form-item__description-icon:not(.form-item__description-icon--key)');
      },
      positionPanel() {
        const anchor = this.findAnchor();
        const panel = this.$refs.panel;
        if (!anchor || !panel) return;

        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        let maxWidth;
        let maxHeight;

        if (this.hasSimpleTable) {
          maxWidth = Math.min(34 * rem, window.innerWidth - 24);
          maxHeight = Math.min(window.innerHeight * 0.55, 22 * rem);
        } else if (this.hasWikiTable) {
          maxWidth = Math.min(42 * rem, window.innerWidth - 24);
          maxHeight = Math.min(window.innerHeight * 0.58, 30 * rem);
        } else {
          maxWidth = Math.min(24 * rem, window.innerWidth - 24);
          maxHeight = Math.min(window.innerHeight * 0.42, 16 * rem);
        }

        const rect = anchor.getBoundingClientRect();
        const gap = 8;
        const edge = 12;
        const widthValue = this.hasSimpleTable ? 'fit-content' : `${Math.round(maxWidth)}px`;

        // Apply width constraints on the live node so offsetHeight matches real content.
        panel.style.position = 'fixed';
        panel.style.width = widthValue;
        panel.style.maxWidth = `${Math.round(maxWidth)}px`;
        panel.style.maxHeight = `${Math.round(maxHeight)}px`;

        const panelHeight = Math.max(panel.offsetHeight, 1);
        const panelWidth = Math.max(panel.offsetWidth, 1);

        let left = Math.min(rect.left, window.innerWidth - panelWidth - edge);
        left = Math.max(edge, left);

        // Prefer below the icon; flip above only when the real height does not fit.
        let top = rect.bottom + gap;
        if (top + panelHeight > window.innerHeight - edge) {
          const above = rect.top - panelHeight - gap;
          if (above >= edge) {
            top = above;
          } else {
            top = Math.max(edge, Math.min(top, window.innerHeight - panelHeight - edge));
          }
        }

        this.panelStyle = {
          position: 'fixed',
          top: `${Math.round(top)}px`,
          left: `${Math.round(left)}px`,
          width: widthValue,
          maxWidth: `${Math.round(maxWidth)}px`,
          maxHeight: `${Math.round(maxHeight)}px`,
          zIndex: 4500,
        };
      },
    },
  };
</script>

<style lang="scss">
  .form-item__description {
    background: var(--h2-shell, var(--color-background-modal, #fff));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 0.65rem;
    box-shadow: 0 16px 40px -12px rgba(16, 24, 40, 0.45);
    box-sizing: border-box;
    color: var(--h2-muted-2, var(--color-text-dark));
    font-size: 0.8125rem;
    line-height: 1.45;
    overflow: auto;
    overscroll-behavior: contain;
    padding: 0.75rem 0.85rem;
    -webkit-overflow-scrolling: touch;

    &.is-simple-table {
      font-size: 0.78rem;
      min-width: min(18rem, calc(100vw - 24px));
      padding: 0.7rem 0.75rem;
    }

    .app--dark-mode & {
      background: #151b28;
      border-color: rgba(255, 255, 255, 0.12);
      box-shadow: 0 18px 42px -10px rgba(0, 0, 0, 0.65);
      color: #e2e8f0;
    }
  }

  .form-item__description-content {
    display: block;
    margin: 0;
    overflow-wrap: break-word;
    word-break: normal;

    > *:first-child {
      margin-top: 0;
    }

    > *:last-child {
      margin-bottom: 0;
    }

    p {
      margin: 0 0 0.45rem;
    }

    .is-simple-table & p {
      color: var(--h2-muted, var(--color-text-disabled));
      font-size: 0.75rem;
      margin-bottom: 0.4rem;

      .app--dark-mode & {
        color: #94a3b8;
      }
    }

    code,
    tt {
      background: rgba(148, 163, 184, 0.18);
      border-radius: 0.25rem;
      font-family: ui-monospace, 'Cascadia Code', 'SF Mono', Menlo, Consolas, monospace;
      font-size: 0.92em;
      padding: 0.05em 0.3em;
      word-break: break-all;
    }

    a {
      color: var(--h2-brand, var(--color-theme));
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .form-item__description-table-wrap {
      border: 1px solid var(--h2-border, rgba(255, 255, 255, 0.1));
      border-radius: 0.45rem;
      margin: 0.65rem 0 0.15rem;
      overflow: auto;
      -webkit-overflow-scrolling: touch;

      .app--dark-mode & {
        background: rgba(0, 0, 0, 0.22);
        border-color: rgba(255, 255, 255, 0.1);
      }
    }

    table:not(.help-simple) {
      border-collapse: collapse;
      display: table;
      min-width: 32rem;
      width: 100%;
    }

    table:not(.help-simple) thead th {
      background: rgba(148, 163, 184, 0.12);
      font-weight: 600;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    table:not(.help-simple) th,
    table:not(.help-simple) td {
      border-bottom: 1px solid var(--h2-border, rgba(255, 255, 255, 0.08));
      padding: 0.45rem 0.65rem;
      text-align: left;
      vertical-align: top;
      white-space: normal;
      word-break: normal;
      overflow-wrap: break-word;
    }

    table:not(.help-simple) th:first-child,
    table:not(.help-simple) td:first-child {
      white-space: nowrap;
      width: 1%;
    }

    table:not(.help-simple) th:nth-child(2),
    table:not(.help-simple) td:nth-child(2) {
      font-family: ui-monospace, 'Cascadia Code', 'SF Mono', Menlo, Consolas, monospace;
      font-size: 0.78rem;
      white-space: nowrap;
    }

    table:not(.help-simple) th:nth-child(3),
    table:not(.help-simple) td:nth-child(3) {
      min-width: 12rem;
    }

    table:not(.help-simple) tr:last-child td {
      border-bottom: 0;
    }

    img {
      height: auto;
      max-width: 100%;
    }
  }

  .form-item__help-enter-active,
  .form-item__help-leave-active {
    transition: opacity 0.16s ease, transform 0.16s ease;
  }

  .form-item__help-enter,
  .form-item__help-leave-to {
    opacity: 0;
    transform: translateY(-0.2rem);
  }

  @media (prefers-reduced-motion: reduce) {
    .form-item__help-enter-active,
    .form-item__help-leave-active {
      transition: none;
    }
  }
</style>
