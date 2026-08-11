<template>
  <main class="bulk-actions-page home2-page-body">
    <header class="home2-page-intro">
      <p class="home2-page-eyebrow">{{ $t('bulk-actions') }}</p>
      <h1 class="home2-page-title">{{ title }}</h1>
      <p class="home2-page-lead">{{ lead }}</p>
    </header>

    <div class="home2-page-panel bulk-actions-page__panel">
      <div v-if="pluginMissing" class="bulk-actions__banner" role="alert">
        <strong>{{ $t('bot-social-plugin-missing-title') }}</strong>
        <p>{{ $t('bot-social-plugin-missing-body') }}</p>
      </div>

      <p v-if="!selectedBotModels.length" class="bulk-actions__empty">
        {{ $t('bulk-actions-bots-required') }}
        <a class="bulk-actions__empty-link" @click="goSelectBots">
          {{ $t('bulk-actions-bots-step-title') }}
        </a>
      </p>

      <template v-else>
        <p class="bulk-actions__bots-summary">
          {{ $t('bulk-actions-bots-selected', { n: selectedBotModels.length, total: selectedBotModels.length }) }}
          <button type="button" class="button button--link" @click="goSelectBots">
            {{ $t('bulk-actions-bots-change') }}
          </button>
        </p>

        <BulkInventoryTransferAction
          v-if="action.kind === 'inventory'"
          :action="action"
          :bots="selectedBotModels"
          :allBots="sortedBots"
          @back="goSelectBots"
          @finished="onFinished"
          @plugin-missing="pluginMissing = true"
        ></BulkInventoryTransferAction>

        <BulkReviewsVoteAction
          v-else-if="action.kind === 'reviews-vote'"
          :action="action"
          :bots="selectedBotModels"
          @back="goSelectBots"
          @finished="onFinished"
          @plugin-missing="pluginMissing = true"
        ></BulkReviewsVoteAction>

        <BulkSharedActAction
          v-else-if="action.kind === 'shared-act'"
          :action="action"
          :bots="selectedBotModels"
          @back="goSelectBots"
          @finished="onFinished"
          @plugin-missing="pluginMissing = true"
        ></BulkSharedActAction>

        <BulkUrlBotsAction
          v-else
          :action="action"
          :bots="selectedBotModels"
          @back="goSelectBots"
          @finished="onFinished"
          @plugin-missing="pluginMissing = true"
        ></BulkUrlBotsAction>
      </template>
    </div>

    <BulkLeaveDialog
      :open="leaveDialogOpen"
      @stay="stayOnPage"
      @leave="onConfirmLeave"
    ></BulkLeaveDialog>
  </main>
</template>

<script>
  import { mapGetters } from 'vuex';
  import {
    actionBotsRoute, getBulkAction,
  } from '../constants/actions';
  import {
    clearSelectedBotNames, readSelectedBotNames,
  } from '../utils/action-session';
  import leaveGuard from '../mixins/leave-guard';
  import BulkLeaveDialog from '../components/leave-dialog.vue';
  import BulkUrlBotsAction from '../components/actions/url-bots-action.vue';
  import BulkReviewsVoteAction from '../components/actions/reviews-vote.vue';
  import BulkSharedActAction from '../components/actions/shared-act.vue';
  import BulkInventoryTransferAction from '../components/actions/inventory-transfer.vue';

  export default {
    name: 'MultiActionSetupPage',
    components: {
      BulkLeaveDialog,
      BulkUrlBotsAction,
      BulkReviewsVoteAction,
      BulkSharedActAction,
      BulkInventoryTransferAction,
    },
    mixins: [leaveGuard],
    metaInfo() {
      return { title: this.title };
    },
    data() {
      return {
        pluginMissing: false,
        selectedNames: [],
      };
    },
    computed: {
      ...mapGetters({ bots: 'bots/bots' }),
      action() {
        return getBulkAction(this.$route.params.action);
      },
      title() {
        return this.action ? this.$t(this.action.titleKey) : this.$t('bulk-actions');
      },
      lead() {
        return this.action ? this.$t(this.action.leadKey) : '';
      },
      sortedBots() {
        return [...this.bots].sort((a, b) => String(a.name).localeCompare(String(b.name)));
      },
      selectedBotModels() {
        const set = new Set(this.selectedNames);
        return this.sortedBots.filter(bot => set.has(bot.name));
      },
    },
    watch: {
      '$route.params.action': {
        immediate: true,
        handler() {
          if (!this.action) {
            this.$router.replace({ name: 'multi-action' });
            return;
          }
          this.selectedNames = readSelectedBotNames(this.action.slug);
          if (!this.selectedNames.length) {
            this.continueWithoutGuard(actionBotsRoute(this.action));
          }
        },
      },
    },
    methods: {
      goSelectBots() {
        this.continueWithoutGuard(actionBotsRoute(this.action));
      },
      onFinished() {
        this.markActionFinished();
        clearSelectedBotNames(this.action.slug);
        this.continueWithoutGuard({ name: 'multi-action' });
      },
      onConfirmLeave() {
        this.confirmLeaveFlow(() => clearSelectedBotNames(this.action.slug));
      },
    },
  };
</script>
