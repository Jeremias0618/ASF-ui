<template>
  <main v-if="bot" class="main-container bot-social">
    <header class="bot-social__header">
      <p class="bot-social__eyebrow">{{ bot.viewableName }}</p>
      <h2 class="bot-social__title">{{ $t('bot-social-title') }}</h2>
      <p class="bot-social__lead">{{ $t('bot-social-lead') }}</p>
    </header>

    <nav class="bot-social__tabs" role="tablist" :aria-label="$t('bot-social-title')">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        class="bot-social__tab"
        :class="{ 'is-active': activeTab === tab.id }"
        :aria-selected="activeTab === tab.id ? 'true' : 'false'"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <span v-if="tab.badge != null" class="bot-social__tab-badge">{{ tab.badge }}</span>
      </button>
    </nav>

    <div class="bot-social__body">
      <InventoryTab v-show="activeTab === 'inventory'" :bot-name="bot.name"></InventoryTab>
      <FriendsTab
        v-show="activeTab === 'friends'"
        :bot-name="bot.name"
        :plugin-missing="pluginMissing"
        @plugin-missing="pluginMissing = true"
        @loaded="onFriendsLoaded"
      ></FriendsTab>
      <GamesTab
        v-show="activeTab === 'games'"
        :bot-name="bot.name"
        :plugin-missing="pluginMissing"
        @plugin-missing="pluginMissing = true"
        @loaded="onGamesLoaded"
      ></GamesTab>
      <WishlistTab
        v-show="activeTab === 'wishlist'"
        :bot-name="bot.name"
        :plugin-missing="pluginMissing"
        @plugin-missing="pluginMissing = true"
        @loaded="onWishlistLoaded"
      ></WishlistTab>
    </div>
  </main>
</template>

<script>
  import FriendsTab from '../../features/bot-social/components/FriendsTab.vue';
  import GamesTab from '../../features/bot-social/components/GamesTab.vue';
  import InventoryTab from '../../features/bot-social/components/InventoryTab.vue';
  import WishlistTab from '../../features/bot-social/components/WishlistTab.vue';
  import { fetchSocialStatus, isPluginMissingError } from '../../features/bot-social/api/bot-social';

  export default {
    name: 'BotSocial',
    components: {
      InventoryTab, FriendsTab, GamesTab, WishlistTab,
    },
    data() {
      return {
        activeTab: 'inventory',
        pluginMissing: false,
        friendsTotal: null,
        gamesTotal: null,
        wishlistTotal: null,
      };
    },
    computed: {
      bot() {
        return this.$store.getters['bots/bot'](this.$route.params.bot);
      },
      tabs() {
        return [
          { id: 'inventory', label: this.$t('bot-social-tab-inventory'), badge: null },
          { id: 'friends', label: this.$t('bot-social-tab-friends'), badge: this.friendsTotal },
          { id: 'games', label: this.$t('bot-social-tab-games'), badge: this.gamesTotal },
          { id: 'wishlist', label: this.$t('bot-social-tab-wishlist'), badge: this.wishlistTotal },
        ];
      },
    },
    created() {
      if (!this.bot) {
        this.$router.replace({ name: 'bots' });
        return;
      }
      this.probePlugin();
    },
    methods: {
      async probePlugin() {
        try {
          await fetchSocialStatus(this.bot.name);
          this.pluginMissing = false;
        } catch (err) {
          this.pluginMissing = isPluginMissingError(err);
        }
      },
      onFriendsLoaded({ total }) {
        this.friendsTotal = total;
      },
      onGamesLoaded({ total }) {
        this.gamesTotal = total;
      },
      onWishlistLoaded({ total }) {
        this.wishlistTotal = total;
      },
    },
  };
</script>
