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
        <template v-if="isInventory">
          <li class="bulk-actions-pipeline__step is-done">
            <span class="bulk-actions-pipeline__index" aria-hidden="true">2</span>
            <span class="bulk-actions-pipeline__text">{{ $t('bulk-actions-pipeline-destination') }}</span>
          </li>
          <li class="bulk-actions-pipeline__step is-done">
            <span class="bulk-actions-pipeline__index" aria-hidden="true">3</span>
            <span class="bulk-actions-pipeline__text">{{ $t('bulk-actions-pipeline-sources') }}</span>
          </li>
          <li class="bulk-actions-pipeline__step is-current" aria-current="step">
            <span class="bulk-actions-pipeline__index" aria-hidden="true">4</span>
            <span class="bulk-actions-pipeline__text">{{ $t('bulk-actions-pipeline-run') }}</span>
          </li>
        </template>
        <template v-else>
          <li class="bulk-actions-pipeline__step is-done">
            <span class="bulk-actions-pipeline__index" aria-hidden="true">2</span>
            <span class="bulk-actions-pipeline__text">{{ $t('bulk-actions-pipeline-bots') }}</span>
          </li>
          <li class="bulk-actions-pipeline__step is-current" aria-current="step">
            <span class="bulk-actions-pipeline__index" aria-hidden="true">3</span>
            <span class="bulk-actions-pipeline__text">{{ $t('bulk-actions-pipeline-run') }}</span>
          </li>
        </template>
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
        <div v-if="isInventory && destinationBotModel" class="bulk-actions-destination-chip">
          <span class="bulk-actions-destination-chip__label">
            {{ $t('bulk-actions-destination-chip', { name: destinationBotModel.viewableName || destinationBotModel.name }) }}
          </span>
          <button type="button" class="bulk-actions-destination-chip__edit" @click="goChangeDestination">
            {{ $t('bulk-actions-destination-change') }}
          </button>
        </div>

        <BulkSelectedCrew
          :bots="selectedBotModels"
          @change="goSelectBots"
        ></BulkSelectedCrew>

        <div class="bulk-actions-setup">
          <BulkInventoryTransferAction
            v-if="action.kind === 'inventory'"
            :action="action"
            :bots="selectedBotModels"
            :destination-bot="destinationName"
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

          <BulkDiscoveryQueueAction
            v-else-if="action.kind === 'discovery-queue'"
            :action="action"
            :bots="selectedBotModels"
            @back="goSelectBots"
            @finished="onFinished"
            @plugin-missing="pluginMissing = true"
          ></BulkDiscoveryQueueAction>

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
    clearSelectedBotNames, readDestinationBotName, readSelectedBotNames,
  } from '../utils/action-session';
  import leaveGuard from '../mixins/leave-guard';
  import BulkLeaveDialog from '../components/leave-dialog.vue';
  import BulkSelectedCrew from '../components/selected-crew.vue';
  import BulkUrlBotsAction from '../components/actions/url-bots-action.vue';
  import BulkReviewsVoteAction from '../components/actions/reviews-vote.vue';
  import BulkSharedActAction from '../components/actions/shared-act.vue';
  import BulkDiscoveryQueueAction from '../components/actions/discovery-queue.vue';
  import BulkInventoryTransferAction from '../components/actions/inventory-transfer.vue';

  export default {
    name: 'MultiActionSetupPage',
    components: {
      BulkLeaveDialog,
      BulkSelectedCrew,
      BulkUrlBotsAction,
      BulkReviewsVoteAction,
      BulkSharedActAction,
      BulkDiscoveryQueueAction,
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
        destinationName: '',
      };
    },
    computed: {
      ...mapGetters({ bots: 'bots/bots' }),
      action() {
        return getBulkAction(this.$route.params.action);
      },
      isInventory() {
        return Boolean(this.action && this.action.kind === 'inventory');
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
      destinationBotModel() {
        if (!this.destinationName) return null;
        return this.sortedBots.find(bot => bot.name === this.destinationName) || null;
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
          this.selectedNames = readSelectedBotNames(this.action.slug)
            .filter(name => name !== readDestinationBotName(this.action.slug));
          this.destinationName = readDestinationBotName(this.action.slug);
          if (!this.selectedNames.length
            || (this.isInventory && !this.destinationName)) {
            this.continueWithoutGuard(actionBotsRoute(this.action));
          }
        },
      },
    },
    methods: {
      goSelectBots() {
        this.continueWithoutGuard(actionBotsRoute(this.action));
      },
      goChangeDestination() {
        this.continueWithoutGuard({
          ...actionBotsRoute(this.action),
          query: { step: 'destination' },
        });
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
