<template>
  <div v-if="appIds.length" class="bot-idle-games">
    <a
      v-for="appId in appIds"
      :key="appId"
      v-tooltip="labelFor(appId)"
      class="bot-idle-games__item"
      target="_blank"
      rel="noreferrer noopener"
      :href="`https://store.steampowered.com/app/${appId}/`"
    >
      <img
        class="bot-idle-games__image"
        :src="`https://steamcdn-a.akamaihd.net/steam/apps/${appId}/header.jpg`"
        :alt="labelFor(appId)"
        loading="lazy"
      >
    </a>
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

<style lang="scss">
  .bot-idle-games {
    display: grid;
    gap: 0.35rem;
    grid-template-columns: repeat(3, 1fr);
    width: 100%;

    @media screen and (max-width: 1200px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media screen and (max-width: 530px) {
      grid-template-columns: 1fr;
    }
  }

  .bot-idle-games__item {
    border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
    border-radius: 0.35rem;
    display: block;
    line-height: 0;
    overflow: hidden;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &:hover,
    &:focus-visible {
      border-color: var(--color-theme, #5b9fff);
      box-shadow: 0 0 0 1px var(--color-theme, #5b9fff);
      outline: none;
    }
  }

  .bot-idle-games__image {
    display: block;
    height: auto;
    width: 100%;
  }
</style>
