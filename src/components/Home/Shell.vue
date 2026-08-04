<template>
  <div class="home2-page">
    <div class="home2-shell" :class="{ 'home2-shell--collapsed': collapsed }">
      <HomeSidebar
        :expanded="expanded"
        :mobile-open="mobileOpen"
        @toggle-mobile="toggleMobile"
        @close-mobile="closeMobile"
        @open-search="openSearch"
      ></HomeSidebar>

      <div class="home2-shell__main">
        <HomeHeader
          :mobile-open="mobileOpen"
          @toggle="onHeaderToggle"
          @open-search="openSearch"
        ></HomeHeader>

        <div class="home2-shell__content">
          <div class="home2-shell__content-inner">
            <slot></slot>
          </div>
        </div>
      </div>

      <div
        class="home2-backdrop"
        :class="{ 'is-open': mobileOpen }"
        role="presentation"
        :aria-hidden="mobileOpen ? 'false' : 'true'"
        @click="closeMobile"
      ></div>

      <HomeSearchModal
        :open="searchOpen"
        @close="closeSearch"
      ></HomeSearchModal>
    </div>
  </div>
</template>

<script>
  import HomeSidebar from './Sidebar.vue';
  import HomeHeader from './Header.vue';
  import HomeSearchModal from './SearchModal.vue';
  import * as storage from '../../utils/storage';

  const SIDEBAR_EXPANDED_KEY = 'layout:home2-sidebar-expanded';

  export default {
    name: 'HomeShell',
    components: {
      HomeSidebar,
      HomeHeader,
      HomeSearchModal,
    },
    data() {
      const savedExpanded = storage.get(SIDEBAR_EXPANDED_KEY);
      return {
        expanded: typeof savedExpanded === 'boolean' ? savedExpanded : true,
        mobileOpen: false,
        searchOpen: false,
      };
    },
    computed: {
      collapsed() {
        return !this.expanded && !this.mobileOpen;
      },
    },
    watch: {
      $route() {
        this.closeMobile();
        this.closeSearch();
      },
    },
    mounted() {
      window.addEventListener('keydown', this.onGlobalKey);
    },
    beforeDestroy() {
      window.removeEventListener('keydown', this.onGlobalKey);
    },
    methods: {
      toggleExpanded() {
        this.expanded = !this.expanded;
        storage.set(SIDEBAR_EXPANDED_KEY, this.expanded);
      },
      toggleMobile() {
        this.mobileOpen = !this.mobileOpen;
      },
      closeMobile() {
        this.mobileOpen = false;
      },
      onHeaderToggle() {
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
          this.toggleExpanded();
          return;
        }
        this.toggleMobile();
      },
      openSearch() {
        this.searchOpen = true;
        this.closeMobile();
      },
      closeSearch() {
        this.searchOpen = false;
      },
      onGlobalKey(event) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          if (this.searchOpen) this.closeSearch();
          else this.openSearch();
        }
      },
    },
  };
</script>

<style lang="scss">
  @import '../../style/home';
</style>
