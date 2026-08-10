<template>
  <main
    v-if="bot"
    class="main-container bot-social"
    :class="{
      'bot-social--inventory': feature === 'inventory',
      'bot-social--games': feature === 'games',
      'bot-social--wishlist': feature === 'wishlist',
    }"
  >
    <header class="bot-social__header">
      <p class="bot-social__eyebrow">{{ bot.viewableName }}</p>
      <h2 class="bot-social__title">{{ title }}</h2>
      <p v-if="feature !== 'inventory'" class="bot-social__lead">{{ lead }}</p>
    </header>

    <div
      class="bot-social__body"
      :class="{
        'bot-social__body--inventory': feature === 'inventory',
        'bot-social__body--games': feature === 'games',
        'bot-social__body--wishlist': feature === 'wishlist',
      }"
    >
      <InventoryTab
        v-if="feature === 'inventory'"
        :bot-name="bot.name"
        @plugin-missing="pluginMissing = true"
      ></InventoryTab>
      <FriendsTab
        v-else-if="feature === 'friends'"
        :bot-name="bot.name"
        :plugin-missing="pluginMissing"
        @plugin-missing="pluginMissing = true"
      ></FriendsTab>
      <CommunityTab
        v-else-if="feature === 'community'"
        :bot-name="bot.name"
        :plugin-missing="pluginMissing"
        @plugin-missing="pluginMissing = true"
      ></CommunityTab>
      <GamesTab
        v-else-if="feature === 'games'"
        :bot-name="bot.name"
        :plugin-missing="pluginMissing"
        @plugin-missing="pluginMissing = true"
      ></GamesTab>
      <WishlistTab
        v-else-if="feature === 'wishlist'"
        :bot-name="bot.name"
        :plugin-missing="pluginMissing"
        @plugin-missing="pluginMissing = true"
      ></WishlistTab>
    </div>
  </main>
</template>

<script>
  import FriendsTab from '../../features/bot-social/components/FriendsTab.vue';
  import CommunityTab from '../../features/bot-social/components/CommunityTab.vue';
  import GamesTab from '../../features/bot-social/components/GamesTab.vue';
  import InventoryTab from '../../features/bot-social/components/InventoryTab.vue';
  import WishlistTab from '../../features/bot-social/components/WishlistTab.vue';
  import { isPluginMissingError } from '../../features/bot-social/api/bot-social';
  import { loadStatus } from '../../features/bot-social/cache/bot-social-queries';

  const FEATURES = new Set(['inventory', 'friends', 'community', 'games', 'wishlist']);

  export default {
    name: 'BotSocial',
    components: {
      InventoryTab, FriendsTab, CommunityTab, GamesTab, WishlistTab,
    },
    data() {
      return {
        pluginMissing: false,
      };
    },
    computed: {
      bot() {
        return this.$store.getters['bots/bot'](this.$route.params.bot);
      },
      feature() {
        const fromMeta = this.$route.meta?.feature;
        return FEATURES.has(fromMeta) ? fromMeta : 'inventory';
      },
      title() {
        return this.$t(`bot-social-tab-${this.feature}`);
      },
      lead() {
        return this.$t(`bot-social-lead-${this.feature}`);
      },
    },
    watch: {
      feature: {
        immediate: true,
        handler() {
          if (this.bot && this.feature !== 'inventory') this.probePlugin();
        },
      },
      'bot.name'(name) {
        if (!name) {
          this.$router.replace({ name: 'bots' });
          return;
        }
        this.pluginMissing = false;
        if (this.feature !== 'inventory') this.probePlugin();
      },
    },
    created() {
      if (!this.bot) this.$router.replace({ name: 'bots' });
    },
    methods: {
      async probePlugin() {
        try {
          await loadStatus(this.bot.name, { force: false });
          this.pluginMissing = false;
        } catch (err) {
          this.pluginMissing = isPluginMissingError(err);
        }
      },
    },
  };
</script>
