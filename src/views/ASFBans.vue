<template>
  <main class="asf-bans-page home2-page-body">
    <header class="home2-page-intro">
      <div class="asf-bans-page__intro-row">
        <div>
          <p class="home2-page-eyebrow">{{ $t('home2-section-config') }}</p>
          <h1 class="home2-page-title">{{ $t('asf-bans') }}</h1>
          <p class="home2-page-lead">{{ $t('asf-bans-lead') }}</p>
        </div>

        <div class="asf-bans-page__actions">
          <button class="button button--small" :disabled="loading" @click="refresh()">
            <FontAwesomeIcon v-if="loading" icon="spinner" spin></FontAwesomeIcon>
            <span v-else>{{ $t('asf-bans-refresh') }}</span>
          </button>
          <button
            v-if="bannedIps.length"
            class="button button--small"
            :disabled="removingAll"
            @click="removeBan()"
          >
            <FontAwesomeIcon v-if="removingAll" icon="spinner" spin></FontAwesomeIcon>
            <span v-else>{{ $t('asf-bans-remove-all') }}</span>
          </button>
        </div>
      </div>
    </header>

    <div class="home2-page-panel">
      <div v-if="loading" class="home2-page-loading" role="status">
        <FontAwesomeIcon icon="spinner" size="lg" spin></FontAwesomeIcon>
      </div>

      <p v-else-if="!bannedIps.length" class="asf-bans-page__empty">{{ $t('asf-bans-empty') }}</p>

      <div v-else class="asf-bans">
        <div v-for="bannedIp in bannedIps" :key="bannedIp" class="ban">
          <p class="ban__ip">{{ bannedIp }}</p>
          <div class="ban__buttons">
            <button
              type="button"
              class="ban__button"
              :title="$t('asf-bans-copy')"
              :aria-label="$t('asf-bans-copy')"
              @click="copyIp(bannedIp)"
            >
              <FontAwesomeIcon icon="clipboard"></FontAwesomeIcon>
            </button>
            <button
              type="button"
              class="ban__button"
              :title="$t('asf-bans-remove')"
              :aria-label="$t('asf-bans-remove')"
              @click="removeBan(bannedIp)"
            >
              <FontAwesomeIcon v-if="removing === bannedIp" icon="spinner" spin></FontAwesomeIcon>
              <FontAwesomeIcon v-else icon="trash"></FontAwesomeIcon>
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
  import copy from 'copy-to-clipboard';

  export default {
    name: 'ASFBans',
    metaInfo() {
      return {
        title: this.$t('asf-bans'),
      };
    },
    data() {
      return {
        loading: false,
        removing: false,
        removingAll: false,
        bannedIps: [],
      };
    },
    created() {
      this.refresh();
    },
    methods: {
      async copyIp(ip) {
        await copy(ip);
        this.$info(this.$t('asf-bans-copied'));
      },
      async removeBan(bannedIp = null) {
        if (this.removing || this.removingAll) return;

        if (bannedIp) this.removing = bannedIp;
        else this.removingAll = true;

        try {
          const endpoint = (bannedIp) ? `ipc/bans/${bannedIp}` : 'ipc/bans';
          await this.$http.del(endpoint);

          if (bannedIp) this.$success(this.$t('asf-bans-deleted', { ip: bannedIp }));
          else this.$success(this.$t('asf-bans-deleted-all'));

          this.refresh();
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.removing = false;
          this.removingAll = false;
        }
      },
      async refresh() {
        if (this.loading) return;
        this.loading = true;

        try {
          this.bannedIps = await this.$http.get('ipc/bans');
        } catch (err) {
          this.$error(err.message);
        } finally {
          this.loading = false;
        }
      },
    },
  };
</script>

<style lang="scss">
  .asf-bans-page__intro-row {
    align-items: flex-start;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: space-between;
  }

  .asf-bans-page__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .asf-bans-page__empty {
    color: var(--h2-muted);
    margin: 0;
    text-align: center;
  }

  .asf-bans {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    min-height: 0;

    @media screen and (max-width: 1366px) {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }

    @media screen and (max-width: 400px) {
      grid-template-columns: 1fr;
    }
  }

  .ban {
    align-items: center;
    background: var(--h2-soft, var(--color-background-modal));
    border: 1px solid var(--h2-border, transparent);
    border-radius: 0.65rem;
    display: flex;
    justify-content: space-between;
    padding: 0.65rem 0.75rem;
  }

  .ban__ip {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ban__buttons {
    display: flex;
    gap: 0.15rem;
  }

  .ban__button {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 0.45rem;
    color: var(--h2-muted);
    cursor: pointer;
    display: inline-flex;
    justify-content: center;
    padding: 0.45rem;
    transition: color 0.15s ease, background 0.15s ease;

    &:hover,
    &:focus-visible {
      background: var(--h2-brand-50);
      color: var(--h2-brand);
      outline: none;
    }
  }

  .home2-shell .asf-bans-page {
    .button {
      background: var(--h2-soft);
      border: 1px solid var(--h2-border);
      border-radius: 0.55rem;
      color: var(--h2-ink);
    }

    .button:hover:not(:disabled) {
      background: var(--h2-brand-50);
      border-color: var(--h2-brand);
      color: var(--h2-brand-600);
    }
  }
</style>
