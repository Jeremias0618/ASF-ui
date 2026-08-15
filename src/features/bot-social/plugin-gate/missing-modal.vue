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
        <p class="plugin-gate__eyebrow">ASFBotSocial</p>
        <h2 id="plugin-gate-title" class="plugin-gate__title">
          {{ $t('bot-social-plugin-missing-title') }}
        </h2>
        <p class="plugin-gate__lead">{{ $t('bot-social-plugin-missing-body') }}</p>

        <a
          class="plugin-gate__repo"
          :href="repoUrl"
          target="_blank"
          rel="noreferrer noopener"
        >
          <FontAwesomeIcon :icon="['fab', 'github']" aria-hidden="true"></FontAwesomeIcon>
          <span>{{ repoUrl }}</span>
        </a>

        <p v-if="statusText" class="plugin-gate__status" :class="{ 'is-error': Boolean(error) }">
          {{ statusText }}
        </p>

        <div class="plugin-gate__actions">
          <button type="button" class="button" :disabled="busy" @click="close">
            {{ $t('cancel') }}
          </button>
          <button
            ref="installBtn"
            type="button"
            class="button button--confirm"
            :disabled="busy"
            @click="install"
          >
            <FontAwesomeIcon v-if="busy" icon="spinner" spin aria-hidden="true"></FontAwesomeIcon>
            <span>{{ busy ? $t('bot-social-plugin-installing') : $t('bot-social-plugin-install') }}</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
  import { closePluginMissingModal, onPluginMissingModal } from './bus';
  import { PLUGIN_REPO_URL, PLUGIN_ZIP } from './constants';
  import { invalidatePluginDetect } from './detect';
  import {
    dllFromZipBuffer,
    downloadDllFallback,
    fetchLatestReleaseAsset,
    readZipFromUser,
    restartAsf,
    triggerBrowserDownload,
    writePluginDll,
  } from './install';

  export default {
    name: 'PluginMissingModal',
    data() {
      return {
        open: false,
        busy: false,
        error: '',
        phase: '',
        repoUrl: PLUGIN_REPO_URL,
      };
    },
    computed: {
      statusText() {
        if (this.error) return this.error;
        if (this.phase === 'download') return this.$t('bot-social-plugin-status-download');
        if (this.phase === 'zip') return this.$t('bot-social-plugin-status-zip');
        if (this.phase === 'picker') return this.$t('bot-social-plugin-status-picker');
        if (this.phase === 'restart') return this.$t('bot-social-plugin-status-restart');
        return '';
      },
    },
    mounted() {
      this.unsubscribe = onPluginMissingModal(value => {
        this.open = Boolean(value);
        if (this.open) {
          this.error = '';
          this.phase = '';
          this.$nextTick(() => {
            const target = this.$refs.installBtn || this.$refs.panel;
            if (target && typeof target.focus === 'function') target.focus();
          });
        }
      });
    },
    beforeDestroy() {
      if (this.unsubscribe) this.unsubscribe();
    },
    methods: {
      close() {
        if (this.busy) return;
        this.open = false;
        closePluginMissingModal();
      },
      async install() {
        if (this.busy) return;
        this.busy = true;
        this.error = '';
        this.phase = 'download';

        try {
          const { downloadUrl } = await fetchLatestReleaseAsset();
          triggerBrowserDownload(downloadUrl, PLUGIN_ZIP);

          this.phase = 'zip';
          let zipBuffer;
          try {
            zipBuffer = await readZipFromUser();
          } catch (err) {
            if (err && err.name === 'AbortError') {
              this.phase = '';
              return;
            }
            throw err;
          }

          const dllBytes = await dllFromZipBuffer(zipBuffer);
          this.phase = 'picker';
          try {
            await writePluginDll(dllBytes);
          } catch (err) {
            if (err && err.name === 'AbortError') {
              this.phase = '';
              return;
            }
            if (String(err?.message) === 'picker-unsupported') {
              downloadDllFallback(dllBytes);
              this.error = this.$t('bot-social-plugin-fallback');
              return;
            }
            throw err;
          }

          this.phase = 'restart';
          invalidatePluginDetect();
          await restartAsf();
          this.$info(this.$t('restart-initiated'));
          this.open = false;
          closePluginMissingModal();
          this.$router.push({ name: 'setup', params: { restart: true } });
        } catch (err) {
          const code = String(err?.message || '');
          if (code === 'release-fetch' || code === 'asset-missing') {
            this.error = this.$t('bot-social-plugin-error-github');
          } else if (code === 'dll-not-in-zip' || code === 'truncated-zip') {
            this.error = this.$t('bot-social-plugin-error-zip');
          } else {
            this.error = this.$t('bot-social-plugin-error-generic');
          }
        } finally {
          this.busy = false;
          if (this.error) this.phase = '';
        }
      },
    },
  };
</script>

<style lang="scss">
  $plugin-gate-duration: 220ms;
  $plugin-gate-ease: cubic-bezier(0.16, 1, 0.3, 1);

  .plugin-gate {
    align-items: center;
    background: rgba(15, 23, 42, 0.62);
    display: flex;
    inset: 0;
    justify-content: center;
    padding: 1.25rem;
    position: fixed;
    z-index: 2200;
  }

  .plugin-gate__panel {
    background: var(--h2-shell, var(--color-background-modal));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 1rem;
    box-shadow: 0 18px 48px rgba(15, 23, 42, 0.28);
    box-sizing: border-box;
    color: var(--h2-ink, var(--color-text-dark));
    max-width: 28rem;
    outline: none;
    padding: 1.35rem 1.4rem 1.2rem;
    width: min(100%, 28rem);
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

  .plugin-gate__eyebrow {
    color: var(--h2-muted, var(--color-text-disabled));
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin: 0 0 0.35rem;
    text-transform: uppercase;
  }

  .plugin-gate__title {
    font-size: 1.15rem;
    font-weight: 700;
    line-height: 1.3;
    margin: 0 0 0.55rem;
  }

  .plugin-gate__lead {
    color: var(--h2-muted-2, var(--color-text));
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0 0 0.9rem;
  }

  .plugin-gate__repo {
    align-items: center;
    background: var(--h2-soft, rgba(148, 163, 184, 0.12));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 0.65rem;
    color: var(--h2-ink, var(--color-text-dark));
    display: flex;
    font-size: 0.82rem;
    gap: 0.55rem;
    margin: 0 0 0.9rem;
    padding: 0.7rem 0.8rem;
    word-break: break-all;

    &:hover,
    &:focus-visible {
      border-color: var(--h2-brand, var(--color-theme));
      color: var(--h2-brand, var(--color-theme));
    }
  }

  .plugin-gate__status {
    color: var(--h2-muted, var(--color-text-disabled));
    font-size: 0.82rem;
    line-height: 1.45;
    margin: 0 0 1rem;

    &.is-error {
      color: var(--color-button-cancel, #e11d48);
    }
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
    }
  }
</style>
