<template>
  <main class="bulk-actions-page bulk-actions-page--setup home2-page-body">
    <header class="bulk-actions-hero">
      <div class="bulk-actions-hero__copy">
        <p class="bulk-actions-hero__eyebrow">{{ $t('bulk-actions') }}</p>
        <h1 class="bulk-actions-hero__title">{{ title }}</h1>
        <p class="bulk-actions-hero__lead">{{ lead }}</p>
      </div>

      <ol class="bulk-actions-pipeline" :aria-label="$t('bulk-actions-pipeline-label')">
        <li class="bulk-actions-pipeline__step is-done">
          <span class="bulk-actions-pipeline__index" aria-hidden="true">1</span>
          <span class="bulk-actions-pipeline__text">{{ $t('bulk-actions-pipeline-pick') }}</span>
        </li>
        <li class="bulk-actions-pipeline__step is-done">
          <span class="bulk-actions-pipeline__index" aria-hidden="true">2</span>
          <span class="bulk-actions-pipeline__text">{{ $t('bulk-actions-pipeline-bots') }}</span>
        </li>
        <li class="bulk-actions-pipeline__step is-current" aria-current="step">
          <span class="bulk-actions-pipeline__index" aria-hidden="true">3</span>
          <span class="bulk-actions-pipeline__text">{{ $t('bulk-actions-pipeline-run') }}</span>
        </li>
      </ol>
    </header>

    <section class="bulk-actions-deck bulk-actions-deck--setup" :aria-label="title">
      <div class="bulk-actions-deck__nav">
        <button type="button" class="bulk-actions-back" @click="goSelectBots">
          <FontAwesomeIcon icon="chevron-left" aria-hidden="true"></FontAwesomeIcon>
          {{ $t('bulk-actions-bots-change') }}
        </button>
      </div>

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
        <BulkSelectedCrew
          :bots="selectedBotModels"
          @change="goSelectBots"
        ></BulkSelectedCrew>

        <div class="bulk-actions-setup">
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
        </div>
      </template>
    </section>

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
  import BulkSelectedCrew from '../components/selected-crew.vue';
  import BulkUrlBotsAction from '../components/actions/url-bots-action.vue';
  import BulkReviewsVoteAction from '../components/actions/reviews-vote.vue';
  import BulkSharedActAction from '../components/actions/shared-act.vue';
  import BulkInventoryTransferAction from '../components/actions/inventory-transfer.vue';

  export default {
    name: 'MultiActionSetupPage',
    components: {
      BulkLeaveDialog,
      BulkSelectedCrew,
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
