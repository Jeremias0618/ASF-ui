<template>
  <main class="bulk-actions-page home2-page-body">
    <header class="home2-page-intro">
      <p class="home2-page-eyebrow">{{ $t('bulk-actions') }}</p>
      <h1 class="home2-page-title">{{ title }}</h1>
      <p class="home2-page-lead">{{ $t('bulk-actions-bots-step-lead') }}</p>
    </header>

    <div class="home2-page-panel bulk-actions-page__panel">
      <button type="button" class="button button--link bulk-actions__back" @click="requestBack">
        <FontAwesomeIcon icon="chevron-left" aria-hidden="true"></FontAwesomeIcon>
        {{ $t('back') }}
      </button>

      <p v-if="!sortedBots.length" class="bulk-actions__empty">
        {{ $t('bulk-actions-no-bots') }}
        <a class="bulk-actions__empty-link" @click="$router.push({ name: 'bot-create' })">
          {{ $t('mass-editor-create-bot') }}
        </a>
      </p>

      <template v-else>
        <BulkBotPicker
          :value="selectedBots"
          :bots="sortedBots"
          @input="onSelectionChange"
        ></BulkBotPicker>

        <div class="bulk-actions__panel-footer">
          <button
            type="button"
            class="button button--confirm"
            :disabled="!selectedBots.length"
            @click="continueToSetup"
          >
            {{ $t('bulk-actions-proceed') }}
          </button>
        </div>
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
    actionSetupRoute, getBulkAction,
  } from '../constants/actions';
  import {
    clearSelectedBotNames, readSelectedBotNames, writeSelectedBotNames,
  } from '../utils/action-session';
  import leaveGuard from '../mixins/leave-guard';
  import BulkBotPicker from '../components/bot-picker.vue';
  import BulkLeaveDialog from '../components/leave-dialog.vue';

  export default {
    name: 'MultiActionBotsPage',
    components: { BulkBotPicker, BulkLeaveDialog },
    mixins: [leaveGuard],
    metaInfo() {
      return { title: this.title };
    },
    data() {
      return {
        selectedBots: [],
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
      sortedBots() {
        return [...this.bots].sort((a, b) => String(a.name).localeCompare(String(b.name)));
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
          this.selectedBots = readSelectedBotNames(this.action.slug);
        },
      },
    },
    methods: {
      onSelectionChange(next) {
        this.selectedBots = next;
        writeSelectedBotNames(this.action.slug, next);
      },
      continueToSetup() {
        writeSelectedBotNames(this.action.slug, this.selectedBots);
        this.continueWithoutGuard(actionSetupRoute(this.action));
      },
      requestBack() {
        if (!this.isFlowDirty) {
          this.$router.push({ name: 'multi-action' });
          return;
        }
        this.pendingRoute = { name: 'multi-action' };
        this.leaveDialogOpen = true;
      },
      onConfirmLeave() {
        this.confirmLeaveFlow(() => clearSelectedBotNames(this.action.slug));
      },
    },
  };
</script>
