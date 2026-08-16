<template>
  <transition name="plugin-gate" appear>
    <div
      v-if="open"
      class="plugin-gate"
      role="presentation"
    >
      <div
        ref="panel"
        class="plugin-gate__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plugin-gate-title"
        tabindex="-1"
      >
        <header class="plugin-gate__header">
          <div class="plugin-gate__heading">
            <p class="plugin-gate__eyebrow">ASFBotSocial</p>
            <h2 id="plugin-gate-title" class="plugin-gate__title">
              {{ $t('bot-social-plugin-missing-title') }}
            </h2>
          </div>
          <button
            v-tooltip="$t('modal-close')"
            type="button"
            class="plugin-gate__close"
            :aria-label="$t('modal-close')"
            @click="close"
          >
            <FontAwesomeIcon icon="times" aria-hidden="true"></FontAwesomeIcon>
          </button>
        </header>

        <p class="plugin-gate__lead">{{ $t('bot-social-plugin-missing-body') }}</p>

        <nav class="plugin-gate__links" :aria-label="$t('bot-social-plugin-repo')">
          <a
            class="plugin-gate__link"
            :href="cliUrl"
            target="_blank"
            rel="noreferrer noopener"
          >
            <span class="plugin-gate__link-icon" aria-hidden="true">
              <FontAwesomeIcon icon="book-open"></FontAwesomeIcon>
            </span>
            <span class="plugin-gate__link-copy">
              <span class="plugin-gate__link-title">{{ $t('bot-social-plugin-guide') }}</span>
              <span class="plugin-gate__link-url">{{ cliUrl }}</span>
            </span>
            <FontAwesomeIcon class="plugin-gate__link-go" icon="chevron-right" aria-hidden="true"></FontAwesomeIcon>
          </a>
          <a
            class="plugin-gate__link"
            :href="repoUrl"
            target="_blank"
            rel="noreferrer noopener"
          >
            <span class="plugin-gate__link-icon" aria-hidden="true">
              <FontAwesomeIcon :icon="['fab', 'github']"></FontAwesomeIcon>
            </span>
            <span class="plugin-gate__link-copy">
              <span class="plugin-gate__link-title">{{ $t('bot-social-plugin-repo') }}</span>
              <span class="plugin-gate__link-url">{{ repoUrl }}</span>
            </span>
            <FontAwesomeIcon class="plugin-gate__link-go" icon="chevron-right" aria-hidden="true"></FontAwesomeIcon>
          </a>
        </nav>

        <div class="plugin-gate__actions">
          <button type="button" class="button" @click="close">
            {{ $t('cancel') }}
          </button>
          <button
            ref="installBtn"
            type="button"
            class="button button--confirm"
            :aria-expanded="String(showCommands)"
            aria-controls="plugin-gate-commands"
            @click="toggleCommands"
          >
            {{ $t('bot-social-plugin-commands') }}
          </button>
        </div>

        <div
          v-if="showCommands"
          id="plugin-gate-commands"
          class="plugin-gate__cli"
        >
          <p class="plugin-gate__cli-hint">
            {{ homePath ? $t('bot-social-plugin-commands-hint') : $t('bot-social-plugin-path-unknown') }}
          </p>
          <div class="plugin-gate__cli-toolbar">
            <span class="plugin-gate__cli-label">{{ cliLabel }}</span>
            <button type="button" class="button button--small" @click="copyCommands">
              <FontAwesomeIcon icon="clipboard" aria-hidden="true"></FontAwesomeIcon>
              <span>{{ $t('bot-social-plugin-copy') }}</span>
            </button>
          </div>
          <pre class="plugin-gate__cli-code" tabindex="0">{{ commands }}</pre>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
  import copy from 'copy-to-clipboard';
  import { closePluginMissingModal, onPluginMissingModal } from './bus';
  import { PLUGIN_CLI_URL, PLUGIN_REPO_URL } from './constants';
  import { isWindowsHomePath, resolveAsfHomePath } from './asf-home-path';
  import { buildPluginInstallCommands } from './install-commands';

  export default {
    name: 'PluginMissingModal',
    data() {
      return {
        open: false,
        showCommands: false,
        homePath: '',
        cliUrl: PLUGIN_CLI_URL,
        repoUrl: PLUGIN_REPO_URL,
      };
    },
    computed: {
      fallbackPath() {
        return String(this.$i18n.locale || '').startsWith('es')
          ? 'RUTA_DE_TU_ARCHISTEAMFARM'
          : 'PATH_TO_YOUR_ARCHISTEAMFARM';
      },
      useWindowsCli() {
        if (this.homePath) return isWindowsHomePath(this.homePath);
        return /win/i.test(window.navigator.platform || window.navigator.userAgent || '');
      },
      commands() {
        return buildPluginInstallCommands(this.homePath || this.fallbackPath, { windows: this.useWindowsCli });
      },
      cliLabel() {
        return this.useWindowsCli ? 'PowerShell' : 'Linux / macOS';
      },
    },
    mounted() {
      this.unsubscribe = onPluginMissingModal(value => {
        this.open = Boolean(value);
        if (this.open) {
          this.showCommands = false;
          this.homePath = '';
          document.body.classList.add('plugin-gate-open');
          this.loadHomePath();
          this.$nextTick(() => {
            const target = this.$refs.installBtn || this.$refs.panel;
            if (target && typeof target.focus === 'function') target.focus();
          });
        } else {
          document.body.classList.remove('plugin-gate-open');
        }
      });
    },
    beforeDestroy() {
      document.body.classList.remove('plugin-gate-open');
      if (this.unsubscribe) this.unsubscribe();
    },
    methods: {
      close() {
        this.open = false;
        this.showCommands = false;
        document.body.classList.remove('plugin-gate-open');
        closePluginMissingModal();
      },
      async loadHomePath() {
        this.homePath = await resolveAsfHomePath();
      },
      toggleCommands() {
        this.showCommands = !this.showCommands;
      },
      copyCommands() {
        copy(this.commands);
        this.$info(this.$t('bot-social-plugin-copied'));
      },
    },
  };
</script>

<style lang="scss">
  $plugin-gate-duration: 220ms;
  $plugin-gate-ease: cubic-bezier(0.16, 1, 0.3, 1);

  body.plugin-gate-open {
    .modal__close,
    .modal__back,
    .modal__arrow {
      pointer-events: none;
      visibility: hidden;
    }
  }

  .plugin-gate {
    align-items: center;
    background: rgba(11, 16, 28, 0.72);
    display: flex;
    inset: 0;
    justify-content: center;
    padding: 1.25rem;
    position: fixed;
    z-index: 3200;
  }

  .plugin-gate__panel {
    background: var(--h2-shell, var(--color-background-modal));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 1rem;
    box-shadow: 0 18px 48px rgba(15, 23, 42, 0.28);
    box-sizing: border-box;
    color: var(--h2-ink, var(--color-text-dark));
    max-width: 36rem;
    outline: none;
    padding: 1.15rem 1.25rem 1.2rem;
    position: relative;
    width: min(100%, 36rem);
  }

  .plugin-gate-enter-active,
  .plugin-gate-leave-active {
    transition: opacity $plugin-gate-duration $plugin-gate-ease;

    .plugin-gate__panel {
      transition: transform $plugin-gate-duration $plugin-gate-ease, opacity $plugin-gate-duration $plugin-gate-ease;
    }
  }

  .plugin-gate-enter,
  .plugin-gate-leave-to {
    opacity: 0;

    .plugin-gate__panel {
      opacity: 0;
      transform: translateY(0.7rem) scale(0.98);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .plugin-gate-enter-active,
    .plugin-gate-leave-active {
      transition: none;

      .plugin-gate__panel {
        transition: none;
      }
    }

    .plugin-gate-enter,
    .plugin-gate-leave-to {
      .plugin-gate__panel {
        transform: none;
      }
    }
  }

  .plugin-gate__header {
    align-items: flex-start;
    display: flex;
    gap: 0.75rem;
    justify-content: space-between;
    margin: 0 0 0.7rem;
  }

  .plugin-gate__heading {
    min-width: 0;
    padding-right: 0.25rem;
  }

  .plugin-gate__close {
    align-items: center;
    appearance: none;
    background: transparent;
    border: 0;
    border-radius: 0.55rem;
    color: var(--h2-muted, var(--color-text-disabled));
    cursor: pointer;
    display: inline-flex;
    flex: 0 0 auto;
    font: inherit;
    height: 2.75rem;
    justify-content: center;
    margin: -0.35rem -0.35rem 0 0;
    padding: 0;
    width: 2.75rem;

    &:hover,
    &:focus-visible {
      background: var(--h2-soft, rgba(148, 163, 184, 0.12));
      color: var(--h2-ink, var(--color-text-dark));
      outline: none;
    }
  }

  .plugin-gate__eyebrow {
    color: var(--h2-muted, var(--color-text-disabled));
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin: 0 0 0.3rem;
    text-transform: uppercase;
  }

  .plugin-gate__title {
    font-size: 1.15rem;
    font-weight: 700;
    line-height: 1.3;
    margin: 0;
  }

  .plugin-gate__lead {
    color: var(--h2-muted-2, var(--color-text));
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0 0 1rem;
  }

  .plugin-gate__links {
    display: grid;
    gap: 0.5rem;
    margin: 0 0 1.1rem;
  }

  .plugin-gate__link {
    align-items: center;
    background: var(--h2-soft, rgba(148, 163, 184, 0.1));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 0.75rem;
    color: inherit;
    display: grid;
    gap: 0.7rem;
    grid-template-columns: auto minmax(0, 1fr) auto;
    min-height: 3.15rem;
    padding: 0.65rem 0.75rem;
    text-decoration: none;

    &:hover,
    &:focus-visible {
      border-color: var(--h2-brand, var(--color-theme));
      outline: none;
    }
  }

  .plugin-gate__link-icon {
    align-items: center;
    background: rgba(148, 163, 184, 0.12);
    border-radius: 0.5rem;
    color: var(--h2-brand, var(--color-theme));
    display: inline-flex;
    flex: 0 0 auto;
    height: 2rem;
    justify-content: center;
    width: 2rem;
  }

  .plugin-gate__link-copy {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
    min-width: 0;
  }

  .plugin-gate__link-title {
    font-size: 0.88rem;
    font-weight: 650;
    line-height: 1.25;
  }

  .plugin-gate__link-url {
    color: var(--h2-muted, var(--color-text-disabled));
    font-size: 0.72rem;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .plugin-gate__link-go {
    color: var(--h2-muted, var(--color-text-disabled));
    font-size: 0.75rem;
  }

  .plugin-gate__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    justify-content: flex-end;

    .button {
      align-items: center;
      display: inline-flex;
      gap: 0.4rem;
      min-height: 2.75rem;
    }
  }

  .plugin-gate__cli {
    border-top: 1px solid var(--h2-border, var(--color-border));
    margin-top: 1rem;
    padding-top: 0.95rem;
  }

  .plugin-gate__cli-hint {
    color: var(--h2-muted-2, var(--color-text));
    font-size: 0.82rem;
    line-height: 1.45;
    margin: 0 0 0.7rem;
  }

  .plugin-gate__cli-toolbar {
    align-items: center;
    display: flex;
    gap: 0.5rem;
    justify-content: space-between;
    margin-bottom: 0.45rem;

    .button {
      align-items: center;
      display: inline-flex;
      gap: 0.35rem;
      min-height: 2.25rem;
    }
  }

  .plugin-gate__cli-label {
    color: var(--h2-muted, var(--color-text-disabled));
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .plugin-gate__cli-code {
    background: var(--h2-soft, rgba(15, 23, 42, 0.72));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 0.65rem;
    color: var(--h2-ink, #e2e8f0);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.75rem;
    line-height: 1.5;
    margin: 0;
    max-height: 14rem;
    overflow: auto;
    padding: 0.75rem 0.85rem;
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
