<template>
  <div v-if="appIds.length" class="bot-idle-games">
    <a
      v-for="appId in appIds"
      :key="appId"
      v-tooltip="labelFor(appId)"
      class="bot-idle-games__item status--farming"
      target="_blank"
      rel="noreferrer noopener"
      :href="`https://store.steampowered.com/app/${appId}/`"
    >
      <span class="bot-idle-games__shade" aria-hidden="true"></span>
      <GameCoverImage
        class="bot-idle-games__cover"
        :appId="appId"
        :name="labelFor(appId)"
        :botName="botName"
        :alt="labelFor(appId)"
        variant="banner"
        loading="lazy"
      ></GameCoverImage>
    </a>
  </div>
</template>

<script>
  import GameCoverImage from '../../features/bot-social/components/games/cover-image.vue';

  export default {
    name: 'BotIdleGames',
    components: { GameCoverImage },
    props: {
      appIds: {
        type: Array,
        default: () => [],
      },
      namesByAppId: {
        type: Object,
        default: () => ({}),
      },
      botName: {
        type: String,
        default: '',
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
    border: 2px solid var(--color-status, #90ba3c);
    border-radius: 4px;
    box-sizing: border-box;
    display: block;
    line-height: 0;
    overflow: hidden;
    position: relative;
    transition: box-shadow 0.15s ease;

    &:hover,
    &:focus-visible {
      box-shadow: 0 0 0 1px var(--color-status, #90ba3c);
      outline: none;
    }
  }

  .bot-idle-games__shade {
    background: rgba(0, 0, 0, 0.42);
    bottom: 0;
    left: 0;
    pointer-events: none;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 1;
  }

  .bot-idle-games__cover {
    aspect-ratio: 460 / 215;
    display: block;
    width: 100%;

    .game-cover-img__media {
      filter: brightness(0.72);
      height: 100%;
      object-fit: cover;
      width: 100%;
    }

    .game-cover-img__placeholder {
      align-items: center;
      background: #1f2937;
      color: #e5e7eb;
      display: flex;
      font-size: 0.85rem;
      font-weight: 700;
      height: 100%;
      justify-content: center;
      min-height: 3.5rem;
    }
  }
</style>
