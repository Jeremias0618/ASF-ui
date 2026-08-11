<template>
  <main class="bulk-actions-page home2-page-body">
    <header class="home2-page-intro">
      <p class="home2-page-eyebrow">{{ $t('control') }}</p>
      <h1 class="home2-page-title">{{ $t('bulk-actions') }}</h1>
      <p class="home2-page-lead">{{ $t('bulk-actions-lead') }}</p>
    </header>

    <div class="home2-page-panel bulk-actions-page__panel">
      <p v-if="!sortedBots.length" class="bulk-actions__empty">
        {{ $t('bulk-actions-no-bots') }}
        <a class="bulk-actions__empty-link" @click="$router.push({ name: 'bot-create' })">
          {{ $t('mass-editor-create-bot') }}
        </a>
      </p>

      <div v-else class="bulk-actions__hub">
        <BulkActionCard
          v-for="action in actions"
          :key="action.id"
          :actionId="action.id"
          :icon="action.icon"
          :title="$t(action.titleKey)"
          :lead="$t(action.leadKey)"
          @select="openAction"
        ></BulkActionCard>
      </div>
    </div>
  </main>
</template>

<script>
  import { mapGetters } from 'vuex';
  import { actionBotsRoute, BULK_ACTIONS, getBulkAction } from '../constants/actions';
  import BulkActionCard from '../components/action-card.vue';

  export default {
    name: 'BulkActionsPage',
    metaInfo() {
      return {
        title: this.$t('bulk-actions'),
      };
    },
    components: { BulkActionCard },
    data() {
      return { actions: BULK_ACTIONS };
    },
    computed: {
      ...mapGetters({ bots: 'bots/bots' }),
      sortedBots() {
        return [...this.bots].sort((a, b) => String(a.name).localeCompare(String(b.name)));
      },
    },
    methods: {
      openAction(id) {
        const action = getBulkAction(id);
        if (!action) return;
        this.$router.push(actionBotsRoute(action));
      },
    },
  };
</script>
