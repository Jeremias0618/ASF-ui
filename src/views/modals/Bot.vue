<template>
  <main
    v-if="bot"
    class="main-container main-container--bot-profile"
    :class="{ 'main-container--bot-idle': isIdleView }"
  >
    <div class="bot-profile" :class="[`status--${bot.status}`]">
      <div class="bot-profile__avatar-wrapper">
        <a v-if="bot.steamid !== '0'" target="_blank" rel="noreferrer noopener" :href="bot.profileURL">
          <img class="bot-profile__avatar" :src="bot.avatarURL">
        </a>
        <img v-else class="bot-profile__avatar" :src="bot.avatarURL">
      </div>

      <div class="bot-profile__meta">
        <div class="bot-profile__info">
          <div class="bot-profile__name">
            <h3 v-tooltip.bottom-start="bot.name" class="bot-profile__name">{{ bot.viewableName }}</h3>
          </div>
          <div v-if="bot.walletInfo" class="bot-profile__wallet pull-right">{{ bot.walletInfo }}</div>
        </div>
        <p class="bot-profile__status">{{ bot.statusText }}</p>
      </div>

      <div class="bot-profile__actions">
        <BotLink v-tooltip="$t('bot-fav-buttons-config')" icon="wrench" :link="{ name: 'bot-config', params: { bot: bot.name } }"></BotLink>
        <BotLink v-tooltip="$t('bot-fav-buttons-inventory')" icon="boxes" :link="{ name: 'bot-inventory', params: { bot: bot.name } }"></BotLink>
        <BotLink v-tooltip="$t('bot-fav-buttons-friends')" icon="users" :link="{ name: 'bot-friends', params: { bot: bot.name } }"></BotLink>
        <BotLink v-tooltip="$t('bot-fav-buttons-community')" icon="globe" :link="{ name: 'bot-community', params: { bot: bot.name } }"></BotLink>
        <BotLink v-tooltip="$t('bot-fav-buttons-games')" icon="gamepad" :link="{ name: 'bot-games', params: { bot: bot.name } }"></BotLink>
        <BotLink v-tooltip="$t('bot-fav-buttons-wishlist')" icon="heart" :link="{ name: 'bot-wishlist', params: { bot: bot.name } }"></BotLink>
        <BotLink v-tooltip="$t('bot-fav-buttons-idle')" icon="clock" :link="{ name: 'bot-idle', params: { bot: bot.name } }"></BotLink>
        <BotLink v-tooltip="$t('bot-fav-buttons-bgr')" icon="key" :link="{ name: 'bot-bgr', params: { bot: bot.name } }"></BotLink>
        <BotLink v-tooltip="$t('bot-fav-buttons-2fa')" icon="lock" :link="{ name: 'bot-2fa', params: { bot: bot.name } }"></BotLink>

        <BotAction v-if="bot.paused && bot.active" v-tooltip="$t('bot-title-resume', { bot: bot.name })" icon="play" @click="resume"></BotAction>
        <BotAction v-if="!bot.paused && bot.active" v-tooltip="$t('bot-title-pause', { bot: bot.name })" icon="pause" @click="pause"></BotAction>

        <BotAction v-if="!bot.active" v-tooltip="$t('bot-title-start', { bot: bot.name })" icon="power-off" @click="start"></BotAction>
        <BotAction v-if="bot.active" v-tooltip="$t('bot-title-stop', { bot: bot.name })" icon="power-off" @click="stop"></BotAction>

        <BotLink v-tooltip="$t('bot-title-delete', { bot: bot.name })" icon="trash" :link="{ name: 'bot-delete', params: { bot: bot.name } }" class="pull-right"></BotLink>
      </div>
    </div>

    <div class="bot-farming-info">
      <template v-if="isIdleView">
        <BotFarmingInfo :value="idleGamesCount" icon="gamepad"></BotFarmingInfo>
        <BotFarmingInfo
          v-tooltip="idlePlaytimeTooltip"
          :value="idlePlaytimeLabel"
          icon="clock"
        ></BotFarmingInfo>
        <BotFarmingInfo :value="idlePlayingLabel" icon="play"></BotFarmingInfo>
      </template>
      <template v-else>
        <BotFarmingInfo :value="gamesRemaining" icon="gamepad"></BotFarmingInfo>
        <BotFarmingInfo :value="timeRemaining" icon="clock"></BotFarmingInfo>
        <BotFarmingInfo :value="cardsRemaining" icon="clone"></BotFarmingInfo>
      </template>
    </div>

    <BotGames v-if="!isIdleView" :bot="bot"></BotGames>
    <div v-else-if="isPlayingIdle" class="bot-idle-games-scroll">
      <BotIdleGames :appIds="idleAppIds" :namesByAppId="idleNamesByAppId"></BotIdleGames>
    </div>
    <p v-else class="bot-idle-empty">{{ $t('bot-idle-empty') }}</p>
  </main>
</template>

<script>
  import { mapGetters } from 'vuex';
  import humanizeDuration from 'humanize-duration';
  import getLocaleForHD from '../../utils/getLocaleForHD';
  import BotAction from '../../components/Bot/Action.vue';
  import BotFarmingInfo from '../../components/Bot/FarmingInfo.vue';
  import BotGames from '../../components/Bot/Games.vue';
  import BotIdleGames from '../../components/Bot/IdleGames.vue';
  import BotLink from '../../components/Bot/Link.vue';
  import getUserInputType from '../../utils/getUserInputType';
  import { fetchIdleGamesConfig, normalizeIdleAppIds } from '../../features/bot-social/api/idle-games';
  import { loadGameStats } from '../../features/bot-social/cache/bot-social-queries';

  export default {
    name: 'BotProfile',
    components: {
      BotAction, BotFarmingInfo, BotGames, BotIdleGames, BotLink,
    },
    metaInfo() {
      if (!this.bot) return {};
      const suffix = this.isIdleView ? this.$t('bot-fav-buttons-idle') : this.bot.viewableName;
      return {
        title: this.isIdleView ? `${this.bot.viewableName} · ${suffix}` : this.bot.viewableName,
      };
    },
    data() {
      return {
        idleConfigAppIds: null,
        idleNamesByAppId: {},
        idlePlaytimeMinutes: 0,
        idlePlaytimeLoading: false,
      };
    },
    computed: {
      ...mapGetters({
        isRunningHeadless: 'asf/isRunningHeadless',
      }),
      bot() {
        return this.$store.getters['bots/bot'](this.$route.params.bot);
      },
      isIdleView() {
        return this.$route.name === 'bot-idle';
      },
      idleAppIds() {
        if (Array.isArray(this.idleConfigAppIds)) return this.idleConfigAppIds;
        return normalizeIdleAppIds(this.bot?.config?.GamesPlayedWhileIdle);
      },
      isPlayingIdle() {
        if (!this.bot || this.bot.status !== 'online') return false;
        if (!this.bot.isPlayingPossible) return false;
        return this.idleAppIds.length > 0;
      },
      idleGamesCount() {
        if (!this.isPlayingIdle) return '-';
        return this.idleAppIds.length;
      },
      idlePlaytimeLabel() {
        if (!this.isPlayingIdle) return '-';
        if (this.idlePlaytimeLoading) return '…';
        if (this.idlePlaytimeMinutes <= 0) return this.$t('bot-idle-playtime-none');
        const language = getLocaleForHD();
        return humanizeDuration(this.idlePlaytimeMinutes * 60 * 1000, {
          language,
          units: ['d', 'h', 'm'],
          round: true,
          largest: 3,
        });
      },
      idlePlaytimeTooltip() {
        return this.$t('bot-idle-playtime-hint');
      },
      idlePlayingLabel() {
        if (!this.isPlayingIdle) return '-';
        return this.$t('bot-idle-playing');
      },
      timeRemaining() {
        if (this.bot.status !== 'farming') return '-';
        const language = getLocaleForHD();
        return humanizeDuration(this.bot.timeRemainingSeconds * 1000, { language });
      },
      gamesRemaining() {
        if (this.bot.status !== 'farming') return '-';
        return this.bot.gamesToFarm.length;
      },
      cardsRemaining() {
        if (this.bot.status !== 'farming') return '-';
        return this.bot.cardsRemaining;
      },
    },
    watch: {
      'isIdleView': {
        immediate: true,
        handler(value) {
          if (value) this.loadIdleConfig();
        },
      },
      '$route.params.bot': {
        handler() {
          if (this.isIdleView) this.loadIdleConfig();
        },
      },
    },
    created() {
      if (!this.bot) this.$router.replace({ name: 'bots' });
    },
    methods: {
      async loadIdleConfig() {
        if (!this.bot?.name) return;
        try {
          const { idleAppIds } = await fetchIdleGamesConfig(this.bot.name);
          this.idleConfigAppIds = idleAppIds;
        } catch (err) {
          this.idleConfigAppIds = normalizeIdleAppIds(this.bot?.config?.GamesPlayedWhileIdle);
        }
        await this.loadIdlePlaytime();
      },
      async loadIdlePlaytime() {
        if (!this.bot?.name || !this.idleAppIds.length) {
          this.idleNamesByAppId = {};
          this.idlePlaytimeMinutes = 0;
          this.idlePlaytimeLoading = false;
          return;
        }

        this.idlePlaytimeLoading = true;
        try {
          const result = await loadGameStats(this.bot.name, { force: false });
          const games = result?.data?.games || [];
          const idleSet = new Set(this.idleAppIds);
          const names = {};
          let totalMinutes = 0;

          games.forEach(game => {
            if (!idleSet.has(game.appId)) return;
            if (game.name) names[game.appId] = game.name;
            totalMinutes += Number(game.playtimeMinutes) || 0;
          });

          this.idleNamesByAppId = names;
          this.idlePlaytimeMinutes = totalMinutes;
        } catch (err) {
          this.idleNamesByAppId = {};
          this.idlePlaytimeMinutes = 0;
        } finally {
          this.idlePlaytimeLoading = false;
        }
      },
      async action(name, params = {}) {
        try {
          return await this.$http.botAction(this.bot.name, name, params);
        } catch (err) {
          this.$error(err.message);
        }
      },
      async update(params = {}) {
        return this.$store.dispatch('bots/updateBot', { name: this.bot.name, ...params });
      },
      async pause() {
        await this.action('pause', { permanent: true });
        await this.update({ paused: true });
      },
      async resume() {
        await this.action('resume');
        await this.update({ paused: false });
      },
      async start() {
        const inputType = getUserInputType(this.bot.requiredInput);

        if (this.isRunningHeadless && inputType !== 'None') {
          this.$router.push({ name: 'bot-input', params: { bot: this.bot.name, type: inputType } });
          return;
        }

        await this.action('start');
        await this.update({ active: true });
      },
      async stop() {
        await this.action('stop');
        await this.update({ active: false });
      },
    },
  };
</script>

<style lang="scss">
  .bot-profile {
    display: grid;
    grid-column-gap: 0.5em;
    grid-template-areas: 'avatar meta' 'avatar actions';
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
  }

  .bot-profile__avatar-wrapper {
    background: var(--color-status);
    grid-area: avatar;
    height: 75px;
    padding: 2px;
    width: 75px;
  }

  .bot-profile__avatar {
    height: 100%;
    width: 100%;
  }

  .bot-profile__meta {
    min-width: 0;
  }

  .bot-profile__info {
    align-items: center;
    display: flex;
    gap: 0.5rem;
    min-width: 0;

    > .bot-profile__name {
      flex: 1 1 auto;
      min-width: 0;
      width: auto;
    }

    .pull-right {
      float: none;
      margin-left: auto;
    }
  }

  .bot-profile__wallet {
    flex-shrink: 0;
    text-align: right;
    white-space: nowrap;
  }

  .bot-profile__name {
    margin: 0;
    min-width: 0;
  }

  .bot-profile__status {
    font-style: italic;
    margin: 0;
  }

  .bot-profile__name,
  .bot-profile__status {
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }

  .bot-profile__buttons {
    grid-area: buttons;
  }

  .bot-profile__actions {
    align-items: center;
    display: flex;
    flex-wrap: nowrap;
    gap: 0.15rem;
    grid-area: actions;
    min-width: 0;

    .pull-right {
      float: none;
      margin-left: auto;
    }

    @media screen and (max-width: 530px) {
      flex-wrap: wrap;
    }
  }

  .bot-farming-info {
    display: grid;
    grid-gap: 0.7em;
    grid-template-columns: repeat(3, 1fr);
    margin: 1em 0 0;
    width: 100%;

    @media screen and (max-width: 530px) {
      grid-gap: 0.5em;
      grid-template-columns: 1fr;
    }
  }

  .bot-idle-empty {
    color: var(--color-text-disabled);
    font-size: 0.95rem;
    margin: 1em 0 0;
    text-align: center;
  }

  .main-container--bot-idle {
    display: flex;
    flex-direction: column;
    max-height: min(72vh, 34rem);
    min-height: 0;
    overflow: hidden;
  }

  .bot-idle-games-scroll {
    flex: 1 1 auto;
    margin: 1em 0 0;
    max-height: min(42vh, 18rem);
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    padding-right: 0.15rem;
  }
</style>
