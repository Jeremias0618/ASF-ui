<template>
  <div class="community-hub" :class="{ 'is-refreshing': refreshing }">
    <PluginMissing v-if="pluginMissing"></PluginMissing>

    <template v-else>
      <div class="community-hub__toolbar">
        <p class="community-hub__hint">{{ $t('bot-social-community-hint') }}</p>
        <button
          type="button"
          class="community-hub__refresh"
          :disabled="loading || refreshing"
          @click="refresh"
        >
          <FontAwesomeIcon :icon="loading || refreshing ? 'spinner' : 'redo-alt'" :spin="loading || refreshing"></FontAwesomeIcon>
          {{ $t('bot-social-refresh') }}
        </button>
      </div>

      <p v-if="error" class="bot-social__inline-error">{{ error }}</p>

      <div v-if="loading && !hasLoaded" class="community-hub__skeleton" aria-busy="true">
        <div v-for="n in 8" :key="n" class="community-hub__skel-card"></div>
      </div>

      <template v-else>
        <section class="community-hub__section" :aria-label="$t('bot-social-community-section-account')">
          <h3 class="community-hub__section-title">{{ $t('bot-social-community-section-account') }}</h3>
          <ul class="community-hub__grid">
            <li v-for="row in accountRows" :key="row.key" class="community-hub__card">
              <span class="community-hub__card-icon" aria-hidden="true">
                <FontAwesomeIcon :icon="row.icon"></FontAwesomeIcon>
              </span>
              <div class="community-hub__card-body">
                <p class="community-hub__card-label">{{ row.label }}</p>
                <p class="community-hub__card-value" :title="row.value">
                  <a
                    v-if="row.href"
                    class="community-hub__link"
                    :href="row.href"
                    target="_blank"
                    rel="noreferrer noopener"
                  >{{ row.value }}</a>
                  <template v-else>{{ row.value }}</template>
                </p>
              </div>
            </li>
          </ul>
        </section>

        <section class="community-hub__section" :aria-label="$t('bot-social-community-section-economy')">
          <h3 class="community-hub__section-title">{{ $t('bot-social-community-section-economy') }}</h3>
          <ul class="community-hub__grid">
            <li v-for="row in economyRows" :key="row.key" class="community-hub__card">
              <span class="community-hub__card-icon" aria-hidden="true">
                <FontAwesomeIcon :icon="row.icon"></FontAwesomeIcon>
              </span>
              <div class="community-hub__card-body">
                <p class="community-hub__card-label">{{ row.label }}</p>
                <p class="community-hub__card-value" :title="row.value">{{ row.value }}</p>
              </div>
            </li>
          </ul>
        </section>

        <section class="community-hub__section" :aria-label="$t('bot-social-community-section-status')">
          <h3 class="community-hub__section-title">{{ $t('bot-social-community-section-status') }}</h3>
          <ul class="community-hub__grid">
            <li v-for="row in statusRows" :key="row.key" class="community-hub__card">
              <span class="community-hub__card-icon" aria-hidden="true">
                <FontAwesomeIcon :icon="row.icon"></FontAwesomeIcon>
              </span>
              <div class="community-hub__card-body">
                <p class="community-hub__card-label">{{ row.label }}</p>
                <p class="community-hub__card-value" :title="row.value">{{ row.value }}</p>
              </div>
            </li>
          </ul>
        </section>
      </template>
    </template>
  </div>
</template>

<script>
  import { fetchSteamPoints, isPluginMissingError } from '../api/bot-social';
  import PluginMissing from './PluginMissing.vue';

  // SteamKit EAccountFlags
  const FLAG_LIMITED_USER = 2048;
  const FLAG_LIMITED_USER_FORCE = 4096;
  const FLAG_LOCKDOWN = 64;

  export default {
    name: 'BotSocialCommunityTab',
    components: { PluginMissing },
    props: {
      botName: { type: String, required: true },
      pluginMissing: { type: Boolean, default: false },
    },
    data() {
      return {
        loading: false,
        refreshing: false,
        hasLoaded: false,
        error: '',
        steamPoints: null,
      };
    },
    computed: {
      bot() {
        return this.$store.getters['bots/bot'](this.botName);
      },
      accountRows() {
        const bot = this.bot;
        if (!bot) return [];
        return [
          {
            key: 'name',
            icon: 'user',
            label: this.$t('bot-social-community-field-bot'),
            value: bot.viewableName || bot.name || '—',
          },
          {
            key: 'nickname',
            icon: 'comments',
            label: this.$t('bot-social-community-field-persona'),
            value: bot.nickname || this.$t('bot-social-community-none'),
          },
          {
            key: 'steamid',
            icon: 'key',
            label: this.$t('bot-social-community-field-steamid'),
            value: bot.steamid && bot.steamid !== '0' ? bot.steamid : '—',
            href: bot.steamid && bot.steamid !== '0' ? bot.profileURL : null,
          },
          {
            key: 'profile',
            icon: 'globe',
            label: this.$t('bot-social-community-field-profile'),
            value: bot.steamid && bot.steamid !== '0'
              ? this.$t('bot-social-community-open-profile')
              : '—',
            href: bot.steamid && bot.steamid !== '0' ? bot.profileURL : null,
          },
        ];
      },
      economyRows() {
        const bot = this.bot;
        if (!bot) return [];
        const points = this.steamPoints;
        const pointsLabel = points == null
          ? this.$t('bot-social-community-unavailable')
          : this.$t('bot-steam-points-value', {
            n: Number(points).toLocaleString(this.$i18n.locale),
          });
        return [
          {
            key: 'wallet',
            icon: 'coins',
            label: this.$t('bot-social-community-field-wallet'),
            value: bot.walletInfo || this.$t('bot-social-community-none'),
          },
          {
            key: 'points',
            icon: 'star',
            label: this.$t('bot-social-community-field-points'),
            value: pointsLabel,
          },
          {
            key: 'bgr',
            icon: 'key',
            label: this.$t('bot-social-community-field-bgr'),
            value: String(bot.bgrCount ?? 0),
          },
        ];
      },
      statusRows() {
        const bot = this.bot;
        if (!bot) return [];
        const flags = Number(bot.accountFlags || 0);
        const limited = (flags & FLAG_LIMITED_USER) !== 0 || (flags & FLAG_LIMITED_USER_FORCE) !== 0;
        const locked = (flags & FLAG_LOCKDOWN) !== 0;
        return [
          {
            key: 'status',
            icon: 'tachometer-alt',
            label: this.$t('bot-social-community-field-status'),
            value: bot.statusText || '—',
          },
          {
            key: '2fa',
            icon: 'lock',
            label: this.$t('bot-social-community-field-2fa'),
            value: bot.has2FA
              ? this.$t('bot-social-community-yes')
              : this.$t('bot-social-community-no'),
          },
          {
            key: 'limited',
            icon: 'exclamation-triangle',
            label: this.$t('bot-social-community-field-limited'),
            value: limited
              ? this.$t('bot-social-community-yes')
              : this.$t('bot-social-community-no'),
          },
          {
            key: 'locked',
            icon: 'ban',
            label: this.$t('bot-social-community-field-locked'),
            value: locked
              ? this.$t('bot-social-community-yes')
              : this.$t('bot-social-community-no'),
          },
          {
            key: 'playing',
            icon: 'gamepad',
            label: this.$t('bot-social-community-field-playing'),
            value: bot.isPlayingPossible
              ? this.$t('bot-social-community-yes')
              : this.$t('bot-social-community-no'),
          },
          {
            key: 'ip',
            icon: 'laptop',
            label: this.$t('bot-social-community-field-ip'),
            value: bot.publicIP || this.$t('bot-social-community-unavailable'),
          },
        ];
      },
    },
    watch: {
      botName: {
        immediate: true,
        handler() {
          this.load(false);
        },
      },
      pluginMissing(value) {
        if (value) {
          this.loading = false;
          this.refreshing = false;
        }
      },
    },
    methods: {
      async refresh() {
        if (this.loading || this.refreshing || this.pluginMissing) return;
        await this.load(true);
      },
      async load(force) {
        if (this.pluginMissing || !this.botName) return;
        const first = !this.hasLoaded;
        this.loading = first;
        this.refreshing = !first && !!force;
        this.error = '';

        try {
          const payload = await fetchSteamPoints(this.botName);
          const botResult = payload?.[this.botName]
            || payload?.[Object.keys(payload || {}).find(k => k.toLowerCase() === String(this.botName || '').toLowerCase())]
            || payload?.[Object.keys(payload || {})[0]];
          const points = botResult?.Points ?? botResult?.points;
          this.steamPoints = points == null ? null : Number(points);
          this.hasLoaded = true;
        } catch (err) {
          if (isPluginMissingError(err)) {
            this.$emit('plugin-missing');
            return;
          }
          this.error = err.message || String(err);
          if (!this.hasLoaded) this.steamPoints = null;
          this.hasLoaded = true;
        } finally {
          this.loading = false;
          this.refreshing = false;
        }
      },
    },
  };
</script>
