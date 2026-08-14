<template>
  <div v-if="appIds.length" class="bot-idle-games">
    <a
      v-for="appId in appIds"
      :key="appId"
      class="bot-idle-games__item status--farming"
      target="_blank"
      rel="noreferrer noopener"
      :href="`https://store.steampowered.com/app/${appId}/`"
      :aria-label="labelFor(appId)"
    >
      <GameCoverImage
        class="bot-idle-games__cover"
        :appId="appId"
        :name="labelFor(appId)"
        :botName="botName"
        :alt="labelFor(appId)"
        variant="banner"
        loading="lazy"
      ></GameCoverImage>
      <span class="bot-idle-games__shade" aria-hidden="true"></span>
      <span class="bot-idle-games__name">{{ labelFor(appId) }}</span>
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

      .bot-idle-games__shade {
        opacity: 1;
      }

      .bot-idle-games__name {
        opacity: 1;
      }

      .game-cover-img__media {
        filter: brightness(0.45);
      }
    }
  }

  .bot-idle-games__shade {
    background: rgba(0, 0, 0, 0.55);
    bottom: 0;
    left: 0;
    opacity: 0;
    pointer-events: none;
    position: absolute;
    right: 0;
    top: 0;
    transition: opacity 0.15s ease;
    z-index: 1;
  }

  .bot-idle-games__name {
    align-items: center;
    box-sizing: border-box;
    color: var(--color-text, #f9fafb);
    display: flex;
    font-size: 0.8rem;
    font-weight: 700;
    justify-content: center;
    left: 0;
    line-height: 1.25;
    opacity: 0;
    overflow: hidden;
    padding: 0.65rem 0.5rem;
    pointer-events: none;
    position: absolute;
    right: 0;
    text-align: center;
    text-overflow: ellipsis;
    top: 50%;
    transform: translateY(-50%);
    transition: opacity 0.15s ease;
    white-space: nowrap;
    width: 100%;
    z-index: 2;
  }

  .bot-idle-games__cover {
    aspect-ratio: 460 / 215;
    display: block;
    width: 100%;

    .game-cover-img__media {
      filter: brightness(0.85);
      height: 100%;
      object-fit: cover;
      transition: filter 0.15s ease;
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
