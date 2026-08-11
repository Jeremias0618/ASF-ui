<template>
  <main class="bulk-actions-page home2-page-body">
    <header class="home2-page-intro">
      <p class="home2-page-eyebrow">{{ $t('control') }}</p>
      <h1 class="home2-page-title">{{ $t('bulk-actions') }}</h1>
      <p class="home2-page-lead">{{ $t('bulk-actions-lead') }}</p>
    </header>

    <div class="home2-page-panel bulk-actions-page__panel">
      <div v-if="pluginMissing" class="bulk-actions__banner" role="alert">
        <strong>{{ $t('bot-social-plugin-missing-title') }}</strong>
        <p>{{ $t('bot-social-plugin-missing-body') }}</p>
      </div>

      <template v-if="!activeAction">
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
      </template>

      <BulkInventoryTransferAction
        v-else-if="activeAction.kind === 'inventory'"
        :action="activeAction"
        :bots="sortedBots"
        @back="closeAction"
        @plugin-missing="pluginMissing = true"
      ></BulkInventoryTransferAction>

      <BulkReviewsVoteAction
        v-else-if="activeAction.kind === 'reviews-vote'"
        :action="activeAction"
        :bots="sortedBots"
        @back="closeAction"
        @plugin-missing="pluginMissing = true"
      ></BulkReviewsVoteAction>

      <BulkSharedActAction
        v-else-if="activeAction.kind === 'shared-act'"
        :action="activeAction"
        :bots="sortedBots"
        @back="closeAction"
        @plugin-missing="pluginMissing = true"
      ></BulkSharedActAction>

      <BulkUrlBotsAction
        v-else
        :action="activeAction"
        :bots="sortedBots"
        @back="closeAction"
        @plugin-missing="pluginMissing = true"
      ></BulkUrlBotsAction>
    </div>
  </main>
</template>

<script>
  import { mapGetters } from 'vuex';
  import { BULK_ACTIONS, getBulkAction } from '../constants/actions';
  import BulkActionCard from '../components/action-card.vue';
  import BulkUrlBotsAction from '../components/actions/url-bots-action.vue';
  import BulkReviewsVoteAction from '../components/actions/reviews-vote.vue';
  import BulkSharedActAction from '../components/actions/shared-act.vue';
  import BulkInventoryTransferAction from '../components/actions/inventory-transfer.vue';

  export default {
    name: 'BulkActionsPage',
    metaInfo() {
      return {
        title: this.$t('bulk-actions'),
      };
    },
    components: {
      BulkActionCard,
      BulkUrlBotsAction,
      BulkReviewsVoteAction,
      BulkSharedActAction,
      BulkInventoryTransferAction,
    },
    data() {
      return {
        actions: BULK_ACTIONS,
        activeId: '',
        pluginMissing: false,
      };
    },
    computed: {
      ...mapGetters({
        bots: 'bots/bots',
      }),
      sortedBots() {
        return [...this.bots].sort((a, b) => String(a.name).localeCompare(String(b.name)));
      },
      activeAction() {
        return this.activeId ? getBulkAction(this.activeId) : null;
      },
    },
    methods: {
      openAction(id) {
        if (!getBulkAction(id)) return;
        this.activeId = id;
        this.pluginMissing = false;
      },
      closeAction() {
        this.activeId = '';
      },
    },
  };
</script>
