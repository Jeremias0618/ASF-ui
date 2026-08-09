<template>
  <a
    class="bot-social-games__tile"
    :class="`bot-social-games__tile--${variant}`"
    :href="storeUrl"
    target="_blank"
    rel="noreferrer noopener"
    :aria-label="ariaLabel"
  >
    <div class="bot-social-games__cover">
      <CoverImage
        :appId="game.appId"
        :name="game.name"
        :botName="botName"
        :variant="variant"
      ></CoverImage>
      <span
        v-if="game.isShared && !game.isOwned"
        class="bot-social-games__badge bot-social-games__badge--shared"
      >{{ $t('bot-social-games-badge-shared') }}</span>
    </div>
    <div class="bot-social-games__meta">
      <span class="bot-social-games__name" :title="game.name">{{ game.name }}</span>
    </div>
  </a>
</template>

<script>
  import { steamStoreUrl } from '../../utils/game-cover';
  import CoverImage from './cover-image.vue';

  export default {
    name: 'BotSocialGameCoverTile',
    components: { CoverImage },
    props: {
      game: {
        type: Object,
        required: true,
      },
      botName: { type: String, default: '' },
      variant: {
        type: String,
        default: 'library',
        validator: value => value === 'library' || value === 'banner',
      },
    },
    computed: {
      storeUrl() {
        return steamStoreUrl(this.game.appId);
      },
      ariaLabel() {
        return this.$t('bot-social-games-open-store', { name: this.game.name || this.game.appId });
      },
    },
  };
</script>
