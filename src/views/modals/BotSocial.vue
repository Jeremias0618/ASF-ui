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
      <!-- Keep mounting one tab; cache manager avoids refetch when returning -->
      <InventoryTab
        v-if="activeTab === 'inventory'"
        :bot-name="bot.name"
        @loaded="onInventoryLoaded"
      ></InventoryTab>
      <FriendsTab
        v-else-if="activeTab === 'friends'"
        :bot-name="bot.name"
        :plugin-missing="pluginMissing"
        @plugin-missing="pluginMissing = true"
        @loaded="onFriendsLoaded"
      ></FriendsTab>
      <GamesTab
        v-else-if="activeTab === 'games'"
        :bot-name="bot.name"
        :plugin-missing="pluginMissing"
        @plugin-missing="pluginMissing = true"
        @loaded="onGamesLoaded"
      ></GamesTab>
      <WishlistTab
        v-else-if="activeTab === 'wishlist'"
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
  import { isPluginMissingError } from '../../features/bot-social/api/bot-social';
  import { loadStatus } from '../../features/bot-social/cache/bot-social-queries';
  import { invalidateBot, peek } from '../../features/bot-social/cache/query-cache';

  export default {
    name: 'BotSocial',
    components: {
      InventoryTab, FriendsTab, GamesTab, WishlistTab,
    },
    data() {
      return {
        activeTab: 'inventory',
        pluginMissing: false,
        inventoryTotal: null,
        friendsTotal: null,
        gamesTotal: null,
        wishlistTotal: null,
        lastBotName: '',
      };
    },
    computed: {
      bot() {
        return this.$store.getters['bots/bot'](this.$route.params.bot);
      },
      tabs() {
        return [
          { id: 'inventory', label: this.$t('bot-social-tab-inventory'), badge: this.inventoryTotal },
          { id: 'friends', label: this.$t('bot-social-tab-friends'), badge: this.friendsTotal },
          { id: 'games', label: this.$t('bot-social-tab-games'), badge: this.gamesTotal },
          { id: 'wishlist', label: this.$t('bot-social-tab-wishlist'), badge: this.wishlistTotal },
        ];
      },
    },
    watch: {
      'bot.name': {
        immediate: true,
        handler(name, previous) {
          if (!name) return;
          if (previous && previous !== name) {
            // Keep previous bot cache; isolate by key. Reset local badges for the new bot.
            this.resetBadgesFromCache(name);
          } else if (!this.lastBotName) {
            this.resetBadgesFromCache(name);
          }
          this.lastBotName = name;
        },
      },
    },
    created() {
      if (!this.bot) {
        this.$router.replace({ name: 'bots' });
        return;
      }
      this.probePlugin();
    },
    beforeDestroy() {
      // Do not wipe cache on modal close — reopening the same bot should reuse TTL.
    },
    methods: {
      resetBadgesFromCache(botName) {
        const inventory = peek('inventory', botName);
        const friends = peek('friends', botName);
        const games = peek('games', botName);
        const wishlist = peek('wishlist', botName);
        this.inventoryTotal = inventory?.data ? inventory.data.length : null;
        this.friendsTotal = friends?.data?.total ?? null;
        this.gamesTotal = games?.data?.total ?? null;
        this.wishlistTotal = wishlist?.data?.total ?? null;
      },
      async probePlugin() {
        try {
          await loadStatus(this.bot.name, { force: false });
          this.pluginMissing = false;
        } catch (err) {
          this.pluginMissing = isPluginMissingError(err);
        }
      },
      onInventoryLoaded({ total }) {
        this.inventoryTotal = total;
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
      // Exposed for rare hard-reset needs (logout etc.)
      clearBotCache() {
        if (this.bot?.name) invalidateBot(this.bot.name);
      },
    },
  };
</script>
