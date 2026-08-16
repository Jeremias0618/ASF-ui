<template>
  <main class="credits-page home2-page-body">
    <header class="credits-hero">
      <h1 class="credits-hero__title">{{ $t('credits') }}</h1>
      <p class="credits-hero__lead">{{ $t('credits-lead') }}</p>
      <p class="credits-hero__note">{{ $t('credits-not-official') }}</p>
    </header>

    <CreditsLineage
      :originHref="asfCoreOrgUrl"
      :originAvatar="originAvatarUrl"
      :forkHref="authorUrl"
      :forkAvatar="forkAvatarUrl"
    ></CreditsLineage>

    <section class="credits-catalog" :aria-label="$t('credits')">
      <CreditsResource
        featured
        :kicker="$t('credits-asf-kicker')"
        title="ArchiSteamFarm"
        :body="$t('credits-asf-body')"
        :links="asfLinks"
      ></CreditsResource>

      <div class="credits-catalog__pair">
        <CreditsResource
          :kicker="$t('credits-ui-kicker')"
          title="ASF-ui"
          :body="$t('credits-ui-body')"
          :links="uiLinks"
        ></CreditsResource>
        <CreditsResource
          :kicker="$t('credits-plugin-kicker')"
          title="ASFBotSocial"
          :body="$t('credits-plugin-body')"
          :links="pluginLinks"
        ></CreditsResource>
      </div>
    </section>

    <p class="credits-license">{{ $t('credits-license') }}</p>
  </main>
</template>

<script>
  import CreditsLineage from '../components/lineage.vue';
  import CreditsResource from '../components/resource.vue';
  import {
    ASF_CORE_ORG_URL,
    ASF_CORE_URL,
    ASF_CORE_WIKI_URL,
    ASF_UI_FORK_URL,
    ASF_UI_UPSTREAM_URL,
    AUTHOR_URL,
    FORK_AVATAR_URL,
    ORIGIN_AVATAR_URL,
    PLUGIN_CLI_URL,
    PLUGIN_REPO_URL,
  } from '../constants';

  export default {
    name: 'CreditsPage',
    components: { CreditsLineage, CreditsResource },
    metaInfo() {
      return {
        title: this.$t('credits'),
      };
    },
    data() {
      return {
        asfCoreOrgUrl: ASF_CORE_ORG_URL,
        authorUrl: AUTHOR_URL,
        originAvatarUrl: ORIGIN_AVATAR_URL,
        forkAvatarUrl: FORK_AVATAR_URL,
      };
    },
    computed: {
      asfLinks() {
        return [
          { href: ASF_CORE_URL, icon: ['fab', 'github'], label: this.$t('credits-open-repo') },
          { href: ASF_CORE_WIKI_URL, icon: 'book-open', label: this.$t('credits-open-wiki') },
        ];
      },
      uiLinks() {
        return [
          { href: ASF_UI_FORK_URL, icon: ['fab', 'github'], label: this.$t('credits-open-ui') },
          { href: ASF_UI_UPSTREAM_URL, icon: ['fab', 'github'], label: this.$t('credits-open-upstream') },
        ];
      },
      pluginLinks() {
        return [
          { href: PLUGIN_REPO_URL, icon: ['fab', 'github'], label: this.$t('credits-open-plugin') },
          { href: PLUGIN_CLI_URL, icon: 'laptop', label: this.$t('credits-open-plugin-cli') },
        ];
      },
    },
  };
</script>

<style lang="scss">
  @import '../credits.scss';
</style>
