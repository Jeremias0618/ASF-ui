<template>
  <HomeContent></HomeContent>
</template>

<script>
  import HomeContent from '../components/Home/Content.vue';

  export default {
    name: 'HomeView',
    metaInfo() {
      return {
        title: this.$t('home'),
      };
    },
    components: {
      HomeContent,
    },
  };
</script>
