<template>
  <div class="community-hub" :class="{ 'is-refreshing': refreshing }">
    <PluginMissing v-if="pluginMissing"></PluginMissing>

    <template v-else>
      <AsfIconTabs
        :value="panelMode"
        :tabs="modeTabs"
        :aria-label="$t('bot-social-community-modes')"
        @input="setPanelMode"
      ></AsfIconTabs>

      <GroupsPanel
        v-if="panelMode === 'groups'"
        :bot-name="botName"
        @plugin-missing="$emit('plugin-missing')"
      ></GroupsPanel>

      <FollowersPanel
        v-else-if="panelMode === 'followers'"
        :bot-name="botName"
        @plugin-missing="$emit('plugin-missing')"
      ></FollowersPanel>

      <CuratorsPanel
        v-else-if="panelMode === 'curators'"
        :bot-name="botName"
        @plugin-missing="$emit('plugin-missing')"
      ></CuratorsPanel>

      <ReviewsPanel
        v-else-if="panelMode === 'reviews'"
        :bot-name="botName"
        @plugin-missing="$emit('plugin-missing')"
      ></ReviewsPanel>

      <SharedPanel
        v-else-if="panelMode === 'shared'"
        :bot-name="botName"
        @plugin-missing="$emit('plugin-missing')"
      ></SharedPanel>

      <template v-else>
        <div class="community-hub__toolbar">
          <p class="community-hub__hint">{{ $t('bot-social-community-hint') }}</p>
          <button
            type="button"
            class="community-hub__refresh"
            :disabled="loading || refreshing || refreshCooldownSec > 0"
            @click="refresh"
          >
            <FontAwesomeIcon
              :icon="loading || refreshing ? 'spinner' : 'redo-alt'"
              :spin="loading || refreshing"
            ></FontAwesomeIcon>
            <template v-if="refreshCooldownSec > 0">
              {{ $t('bot-social-refresh-cooldown', { s: refreshCooldownSec }) }}
            </template>
            <template v-else>
              {{ $t('bot-social-refresh') }}
            </template>
          </button>
        </div>

        <p v-if="error" class="bot-social__inline-error">{{ error }}</p>

        <div v-if="loading && !hasLoaded" class="community-hub__skeleton" aria-busy="true">
          <div v-for="n in 6" :key="n" class="community-hub__skel-card"></div>
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
        </template>
      </template>
    </template>
  </div>
</template>

<script>
  import { isPluginMissingError } from '../api/bot-social';
  import { loadPoints } from '../cache/bot-social-queries';
  import { resolveLocalData } from '../cache/load-policy';
  import { createSubmitCooldownMixin } from '../mixins/submit-cooldown';
  import CuratorsPanel from './community/curators-panel.vue';
  import FollowersPanel from './community/followers-panel.vue';
  import GroupsPanel from './community/groups-panel.vue';
  import ReviewsPanel from './community/reviews-panel.vue';
  import SharedPanel from './community/shared-panel.vue';
  import PluginMissing from './PluginMissing.vue';
  import { readModalView, replaceModalView } from '../../../utils/modal-view-query';

  const COMMUNITY_VIEWS = new Set(['account', 'groups', 'followers', 'curators', 'reviews', 'shared']);
  const COMMUNITY_VIEW_DEFAULT = 'account';
  /** UI countdown ≥ points MIN_REFRESH (2s) / PointsReadLimiter. */
  const REFRESH_COOLDOWN_MS = 3000;

  export default {
    name: 'BotSocialCommunityTab',
    mixins: [createSubmitCooldownMixin(REFRESH_COOLDOWN_MS)],
    components: {
      CuratorsPanel,
      FollowersPanel,
      GroupsPanel,
      ReviewsPanel,
      SharedPanel,
      PluginMissing,
    },
    props: {
      botName: { type: String, required: true },
      pluginMissing: { type: Boolean, default: false },
    },
    data() {
      return {
        panelMode: readModalView(this.$route, COMMUNITY_VIEWS, COMMUNITY_VIEW_DEFAULT),
        loading: false,
        refreshing: false,
        hasLoaded: false,
        error: '',
        steamPoints: null,
      };
    },
    computed: {
      refreshCooldownSec() {
        return this.cooldownSeconds;
      },
      modeTabs() {
        return [
          { id: 'account', icon: 'user', label: this.$t('bot-social-community-mode-account') },
          { id: 'groups', icon: 'users', label: this.$t('bot-social-community-mode-groups') },
          { id: 'followers', icon: 'heart', label: this.$t('bot-social-community-mode-followers') },
          { id: 'curators', icon: 'star', label: this.$t('bot-social-community-mode-curators') },
          { id: 'reviews', icon: 'comments', label: this.$t('bot-social-community-mode-reviews') },
          { id: 'shared', icon: 'clone', label: this.$t('bot-social-community-mode-shared') },
        ];
      },
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
    },
    watch: {
      botName: {
        immediate: true,
        handler() {
          this.syncPanelFromRoute();
          this.resetPointsView();
          if (this.panelMode === 'account') this.bootstrapPoints();
        },
      },
      pluginMissing(value) {
        if (value) {
          this.loading = false;
          this.refreshing = false;
          return;
        }
        if (this.panelMode === 'account') this.bootstrapPoints();
      },
      panelMode(mode) {
        if (mode === 'account' && !this.pluginMissing) this.bootstrapPoints();
      },
      '$route.query.view'() {
        this.syncPanelFromRoute();
      },
    },
    methods: {
      syncPanelFromRoute() {
        const next = readModalView(this.$route, COMMUNITY_VIEWS, COMMUNITY_VIEW_DEFAULT);
        if (next !== this.panelMode) this.panelMode = next;
      },
      setPanelMode(mode) {
        if (!COMMUNITY_VIEWS.has(mode) || mode === this.panelMode) return;
        this.panelMode = mode;
        replaceModalView(this.$router, this.$route, mode, COMMUNITY_VIEW_DEFAULT);
      },
      resetPointsView() {
        this.steamPoints = null;
        this.hasLoaded = false;
        this.error = '';
        this.loading = false;
        this.refreshing = false;
        this.resetSubmitCooldown();
      },
      applyPoints(points) {
        this.steamPoints = points == null ? null : Number(points);
        this.hasLoaded = true;
      },
      bootstrapPoints() {
        if (this.pluginMissing || this.panelMode !== 'account') return;
        const resolved = resolveLocalData({
          resource: 'points',
          botName: this.botName,
          isUsable: data => data === null || Number.isFinite(Number(data)),
        });
        if (resolved.hasData) {
          this.applyPoints(resolved.data);
          this.error = '';
          return;
        }
        this.load(false);
      },
      async refresh() {
        if (
          this.panelMode !== 'account'
          || this.loading
          || this.refreshing
          || this.pluginMissing
          || this.refreshCooldownSec > 0
        ) return;
        await this.load(true);
      },
      async load(force) {
        if (this.pluginMissing || !this.botName || this.panelMode !== 'account') return;
        const first = !this.hasLoaded;
        this.loading = first;
        this.refreshing = !first && !!force;
        if (force) this.error = '';

        try {
          const result = await loadPoints(this.botName, { force });
          this.applyPoints(result.data);
          if (result.rateLimited) this.$error(this.$t('bot-social-rate-limited'));
          else if (result.error && result.stale) this.error = result.error.message || String(result.error);
          else this.error = '';
        } catch (err) {
          if (isPluginMissingError(err)) {
            this.$emit('plugin-missing');
            return;
          }
          if (err?.code === 'RATE_LIMITED') this.$error(this.$t('bot-social-rate-limited'));
          else {
            this.error = err.message || String(err);
            if (!this.hasLoaded) this.steamPoints = null;
            this.hasLoaded = true;
          }
        } finally {
          this.loading = false;
          this.refreshing = false;
          if (force) this.armSubmitCooldown();
        }
      },
    },
  };
</script>
