<template>
  <div class="bot-social__missing" role="status">
    <p class="bot-social__missing-title">{{ $t('bot-social-plugin-missing-title') }}</p>
    <p class="bot-social__missing-text">{{ $t('bot-social-plugin-missing-body') }}</p>
    <a
      class="bot-social__missing-link"
      :href="repoUrl"
      target="_blank"
      rel="noreferrer noopener"
    >{{ repoUrl }}</a>
    <button type="button" class="button button--confirm" @click="openModal">
      {{ $t('bot-social-plugin-install') }}
    </button>
  </div>
</template>

<script>
  import { openPluginMissingModal } from '../plugin-gate/bus';
  import { PLUGIN_REPO_URL } from '../plugin-gate/constants';

  export default {
    name: 'BotSocialPluginMissing',
    data() {
      return { repoUrl: PLUGIN_REPO_URL };
    },
    methods: {
      openModal() {
        openPluginMissingModal();
      },
    },
  };
</script>
