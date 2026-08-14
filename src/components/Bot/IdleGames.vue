<template>
  <div v-if="appIds.length" class="bot-games">
    <div
      v-for="appId in appIds"
      :key="appId"
      v-tooltip="labelFor(appId)"
      class="bot-game status--farming"
    >
      <a
        target="_blank"
        rel="noreferrer noopener"
        :href="`https://store.steampowered.com/app/${appId}/`"
      >
        <div class="bot-game__info">
          <span class="bot-game__name">{{ labelFor(appId) }}</span>
        </div>
        <div class="bot-game__background">
          <img
            class="bot-game__image"
            :src="`https://steamcdn-a.akamaihd.net/steam/apps/${appId}/header.jpg`"
            :alt="labelFor(appId)"
          >
        </div>
      </a>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'BotIdleGames',
    props: {
      appIds: {
        type: Array,
        default: () => [],
      },
      namesByAppId: {
        type: Object,
        default: () => ({}),
      },
    },
    methods: {
      labelFor(appId) {
        const name = this.namesByAppId[appId];
        if (name) return name;
        return this.$t('bot-social-games-idle-unknown', { appId });
      },
    },
  };
</script>
