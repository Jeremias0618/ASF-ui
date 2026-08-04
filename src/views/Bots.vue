<template>
  <main class="bots-overview home2-page-body">
    <AsfFarmingInfo></AsfFarmingInfo>
    <AsfBots></AsfBots>
    <AsfBotsFilter></AsfBotsFilter>
  </main>
</template>

<script>
  import AsfFarmingInfo from '../components/ASF/FarmingInfo.vue';
  import AsfBots from '../components/ASF/Bots.vue';
  import AsfBotsFilter from '../components/ASF/BotsFilter.vue';

  export default {
    name: 'BotsOverview',
    metaInfo() {
      return {
        title: this.$t('bots'),
      };
    },
    components: { AsfBots, AsfFarmingInfo, AsfBotsFilter },
  };
</script>

<style lang="scss">
  .bots-overview {
    display: grid;
    grid-gap: 1rem;
    grid-template-columns: 1fr;
    grid-template-rows: min-content min-content;
  }

  .home2-page-body {
    margin: 0;
    min-width: 0;
  }
</style>
