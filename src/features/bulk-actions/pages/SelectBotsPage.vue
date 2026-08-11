<template>
  <main class="bulk-actions-page bulk-actions-page--bots home2-page-body">
    <header class="bulk-actions-hero">
      <div class="bulk-actions-hero__copy">
        <p class="bulk-actions-hero__eyebrow">{{ $t('bulk-actions') }}</p>
        <h1 class="bulk-actions-hero__title">{{ title }}</h1>
        <p class="bulk-actions-hero__lead">{{ $t('bulk-actions-bots-step-lead') }}</p>
      </div>

      <ol class="bulk-actions-pipeline" :aria-label="$t('bulk-actions-pipeline-label')">
        <li class="bulk-actions-pipeline__step is-done">
          <span class="bulk-actions-pipeline__index" aria-hidden="true">1</span>
          <span class="bulk-actions-pipeline__text">{{ $t('bulk-actions-pipeline-pick') }}</span>
        </li>
        <li class="bulk-actions-pipeline__step is-current" aria-current="step">
          <span class="bulk-actions-pipeline__index" aria-hidden="true">2</span>
          <span class="bulk-actions-pipeline__text">{{ $t('bulk-actions-pipeline-bots') }}</span>
        </li>
        <li class="bulk-actions-pipeline__step">
          <span class="bulk-actions-pipeline__index" aria-hidden="true">3</span>
          <span class="bulk-actions-pipeline__text">{{ $t('bulk-actions-pipeline-run') }}</span>
        </li>
      </ol>
    </header>

    <section class="bulk-actions-deck bulk-actions-deck--bots" :aria-label="$t('bulk-actions-bots-step-title')">
      <div class="bulk-actions-deck__nav">
        <button type="button" class="bulk-actions-back" @click="requestBack">
          <FontAwesomeIcon icon="chevron-left" aria-hidden="true"></FontAwesomeIcon>
          {{ $t('back') }}
        </button>
      </div>

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

        <footer class="bulk-actions-bots-bar">
          <div class="bulk-actions-bots-bar__copy">
            <p class="bulk-actions-bots-bar__count">
              {{ $t('bulk-actions-bots-selected', { n: selectedBots.length, total: sortedBots.length }) }}
            </p>
            <p class="bulk-actions-bots-bar__hint">
              {{ selectedBots.length
                ? $t('bulk-actions-bots-bar-ready')
                : $t('bulk-actions-bots-bar-need') }}
            </p>
          </div>
          <button
            type="button"
            class="button button--confirm bulk-actions-bots-bar__cta"
            :disabled="!selectedBots.length"
            @click="continueToSetup"
          >
            {{ $t('bulk-actions-proceed') }}
            <FontAwesomeIcon icon="chevron-right" aria-hidden="true"></FontAwesomeIcon>
          </button>
        </footer>
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
