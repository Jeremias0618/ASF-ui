<template>
  <main class="bulk-actions-page bulk-actions-page--bots home2-page-body">
    <header class="bulk-actions-hero">
      <div class="bulk-actions-hero__copy">
        <p class="bulk-actions-hero__eyebrow">{{ $t('bulk-actions') }}</p>
        <h1 class="bulk-actions-hero__title">{{ title }}</h1>
        <p class="bulk-actions-hero__lead">{{ stepLead }}</p>
      </div>

      <ol class="bulk-actions-pipeline" :aria-label="$t('bulk-actions-pipeline-label')">
        <li class="bulk-actions-pipeline__step is-done">
          <span class="bulk-actions-pipeline__index" aria-hidden="true">1</span>
          <span class="bulk-actions-pipeline__text">{{ $t('bulk-actions-pipeline-pick') }}</span>
        </li>
        <li
          class="bulk-actions-pipeline__step"
          :class="{ 'is-current': pipelineStep === 2, 'is-done': pipelineStep > 2 }"
          :aria-current="pipelineStep === 2 ? 'step' : null"
        >
          <span class="bulk-actions-pipeline__index" aria-hidden="true">2</span>
          <span class="bulk-actions-pipeline__text">{{ pipelineStepTwoLabel }}</span>
        </li>
        <li
          class="bulk-actions-pipeline__step"
          :class="{ 'is-current': pipelineStep === 3, 'is-done': pipelineStep > 3 }"
          :aria-current="pipelineStep === 3 ? 'step' : null"
        >
          <span class="bulk-actions-pipeline__index" aria-hidden="true">3</span>
          <span class="bulk-actions-pipeline__text">{{ pipelineStepThreeLabel }}</span>
        </li>
        <li
          v-if="isInventory"
          class="bulk-actions-pipeline__step"
          :class="{ 'is-current': pipelineStep === 4 }"
          :aria-current="pipelineStep === 4 ? 'step' : null"
        >
          <span class="bulk-actions-pipeline__index" aria-hidden="true">4</span>
          <span class="bulk-actions-pipeline__text">{{ $t('bulk-actions-pipeline-run') }}</span>
        </li>
      </ol>
    </header>

    <BulkJobBanner
      v-if="activeJob"
      :job="activeJob"
      :show-resume="canResumeJob"
      @resume="resumeJob"
    ></BulkJobBanner>

    <section class="bulk-actions-deck bulk-actions-deck--bots" :aria-label="stepTitle">
      <div class="bulk-actions-deck__nav">
        <button type="button" class="bulk-actions-back" @click="requestBack">
          <FontAwesomeIcon icon="chevron-left" aria-hidden="true"></FontAwesomeIcon>
          {{ backLabel }}
        </button>
      </div>

      <p v-if="!sortedBots.length" class="bulk-actions__empty">
        {{ bots.length
          ? $t('bulk-actions-no-online-bots')
          : $t('bulk-actions-no-bots') }}
        <a
          v-if="!bots.length"
          class="bulk-actions__empty-link"
          @click="$router.push({ name: 'bot-create' })"
        >
          {{ $t('mass-editor-create-bot') }}
        </a>
      </p>

      <template v-else-if="isInventory && inventoryPhase === 'destination'">
        <p v-if="offlineBotsHiddenCount" class="bulk-actions-bots__hint">
          {{ $t('bulk-actions-bots-online-only-hint', { n: offlineBotsHiddenCount }) }}
        </p>
        <p v-if="defaultMasterName" class="bulk-actions-bots__hint">
          {{ $t('bulk-actions-destination-master-hint', { name: defaultMasterName }) }}
        </p>

        <BulkBotPicker
          mode="single"
          :value="destinationSelection"
          :bots="sortedBots"
          :aria-label="$t('bulk-actions-destination-label')"
          :highlight-masters="true"
          @input="onDestinationChange"
        ></BulkBotPicker>

        <footer class="bulk-actions-bots-bar">
          <div class="bulk-actions-bots-bar__copy">
            <p class="bulk-actions-bots-bar__count">
              {{ destinationBot
                ? $t('bulk-actions-destination-selected', { name: destinationDisplayName })
                : $t('bulk-actions-destination-need') }}
            </p>
            <p class="bulk-actions-bots-bar__hint">
              {{ $t('bulk-actions-destination-bar-hint') }}
            </p>
          </div>
          <button
            type="button"
            class="button button--confirm bulk-actions-bots-bar__cta"
            :disabled="!destinationBot || botsStepLocked"
            @click="continueToSources"
          >
            {{ $t('bulk-actions-proceed') }}
            <FontAwesomeIcon icon="chevron-right" aria-hidden="true"></FontAwesomeIcon>
          </button>
        </footer>
      </template>

      <template v-else>
        <p v-if="offlineBotsHiddenCount" class="bulk-actions-bots__hint">
          {{ $t('bulk-actions-bots-online-only-hint', { n: offlineBotsHiddenCount }) }}
        </p>
        <div v-if="isInventory && destinationBot" class="bulk-actions-destination-chip">
          <span class="bulk-actions-destination-chip__label">
            {{ $t('bulk-actions-destination-chip', { name: destinationDisplayName }) }}
          </span>
          <button type="button" class="bulk-actions-destination-chip__edit" @click="goChangeDestination">
            {{ $t('bulk-actions-destination-change') }}
          </button>
        </div>

        <BulkBotPicker
          :value="selectedBots"
          :bots="sourceBots"
          :disabled-names="destinationDisabled"
          :aria-label="$t('bulk-actions-bots-label')"
          @input="onSelectionChange"
        ></BulkBotPicker>

        <footer class="bulk-actions-bots-bar">
          <div class="bulk-actions-bots-bar__copy">
            <p class="bulk-actions-bots-bar__count">
              {{ $t('bulk-actions-bots-selected', { n: selectedBots.length, total: sourceBots.length }) }}
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
            :disabled="!selectedBots.length || botsStepLocked"
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
    clearSelectedBotNames,
    readDestinationBotName,
    readSelectedBotNames,
    writeDestinationBotName,
    writeSelectedBotNames,
  } from '../utils/action-session';
  import { findDefaultDestinationBot } from '../utils/find-default-destination';
  import { filterBotsReadyForBulk, isBotReadyForBulk } from '../utils/bot-ready';
  import { isBulkJobActive, readBulkJob } from '../utils/bulk-job-session';
  import leaveGuard from '../mixins/leave-guard';
  import BulkBotPicker from '../components/bot-picker.vue';
  import BulkJobBanner from '../components/job-banner.vue';
  import BulkLeaveDialog from '../components/leave-dialog.vue';

  export default {
    name: 'MultiActionBotsPage',
    components: { BulkBotPicker, BulkJobBanner, BulkLeaveDialog },
    mixins: [leaveGuard],
    metaInfo() {
      return { title: this.title };
    },
    data() {
      return {
        selectedBots: [],
        destinationBot: '',
        inventoryPhase: 'destination',
        activeJob: null,
      };
    },
    computed: {
      ...mapGetters({
        bots: 'bots/bots',
        steamOwnerID: 'asf/steamOwnerID',
      }),
      action() {
        return getBulkAction(this.$route.params.action);
      },
      isInventory() {
        return Boolean(this.action && this.action.kind === 'inventory');
      },
      title() {
        return this.action ? this.$t(this.action.titleKey) : this.$t('bulk-actions');
      },
      sortedBots() {
        return filterBotsReadyForBulk(this.bots)
          .sort((a, b) => String(a.name).localeCompare(String(b.name)));
      },
      allBotsSorted() {
        return [...this.bots].sort((a, b) => String(a.name).localeCompare(String(b.name)));
      },
      offlineBotsHiddenCount() {
        return Math.max(0, this.allBotsSorted.length - this.sortedBots.length);
      },
      defaultMasterBot() {
        return findDefaultDestinationBot(this.sortedBots, this.steamOwnerID);
      },
      defaultMasterName() {
        const bot = this.defaultMasterBot;
        return bot ? (bot.viewableName || bot.name) : '';
      },
      destinationSelection() {
        return this.destinationBot ? [this.destinationBot] : [];
      },
      destinationDisplayName() {
        const bot = this.sortedBots.find(b => b.name === this.destinationBot);
        return (bot && (bot.viewableName || bot.name)) || this.destinationBot;
      },
      destinationDisabled() {
        return this.destinationBot ? [this.destinationBot] : [];
      },
      sourceBots() {
        if (!this.isInventory || !this.destinationBot) return this.sortedBots;
        return this.sortedBots.filter(bot => bot.name !== this.destinationBot);
      },
      stepTitle() {
        if (this.isInventory && this.inventoryPhase === 'destination') {
          return this.$t('bulk-actions-destination-title');
        }
        return this.$t('bulk-actions-bots-step-title');
      },
      stepLead() {
        if (this.isInventory && this.inventoryPhase === 'destination') {
          return this.$t('bulk-actions-destination-lead');
        }
        if (this.isInventory) return this.$t('bulk-actions-sources-lead');
        return this.$t('bulk-actions-bots-step-lead');
      },
      pipelineStep() {
        if (!this.isInventory) return 2;
        return this.inventoryPhase === 'destination' ? 2 : 3;
      },
      pipelineStepTwoLabel() {
        return this.isInventory
          ? this.$t('bulk-actions-pipeline-destination')
          : this.$t('bulk-actions-pipeline-bots');
      },
      pipelineStepThreeLabel() {
        return this.isInventory
          ? this.$t('bulk-actions-pipeline-sources')
          : this.$t('bulk-actions-pipeline-run');
      },
      backLabel() {
        if (this.isInventory && this.inventoryPhase === 'sources') {
          return this.$t('bulk-actions-destination-change');
        }
        return this.$t('back');
      },
      canResumeJob() {
        if (!this.activeJob || !this.action) return false;
        return String(this.activeJob.actionSlug || '').toLowerCase()
          === String(this.action.slug).toLowerCase();
      },
      botsStepLocked() {
        return Boolean(this.activeJob && !this.canResumeJob);
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
          this.refreshActiveJob();
          if (this.canResumeJob) {
            this.resumeJob();
            return;
          }
          this.hydrateFromSession();
        },
      },
      '$route.query.step'() {
        if (!this.isInventory) return;
        this.hydrateFromSession();
      },
      sortedBots: {
        immediate: true,
        handler(list) {
          if (!this.action) return;
          this.pruneOfflineSelections(list);
          if (!this.isInventory || !list.length) return;
          if (this.destinationBot) return;
          if (readDestinationBotName(this.action.slug)) return;
          const master = this.defaultMasterBot;
          if (!master) return;
          // Prefill UI only; persist when the user continues or changes selection.
          this.destinationBot = master.name;
        },
      },
    },
    methods: {
      pruneOfflineSelections(list = this.sortedBots) {
        const readyNames = new Set((list || []).map(bot => bot.name));
        const pruned = this.selectedBots.filter(name => readyNames.has(name));
        if (pruned.length !== this.selectedBots.length) {
          this.selectedBots = pruned;
          writeSelectedBotNames(this.action.slug, pruned);
        }
        if (this.destinationBot && !readyNames.has(this.destinationBot)) {
          this.destinationBot = '';
          writeDestinationBotName(this.action.slug, '');
        }
      },
      refreshActiveJob() {
        this.activeJob = isBulkJobActive() ? readBulkJob() : null;
      },
      resumeJob() {
        const job = readBulkJob();
        if (!job || !this.action) return;
        writeSelectedBotNames(this.action.slug, job.botNames || []);
        if (this.isInventory && job.params?.destinationBot) {
          writeDestinationBotName(this.action.slug, job.params.destinationBot);
        }
        this.continueWithoutGuard(actionSetupRoute(this.action));
      },
      hydrateFromSession() {
        const readyNames = new Set(this.sortedBots.map(bot => bot.name));
        const stored = readSelectedBotNames(this.action.slug);
        const selected = stored.filter(name => readyNames.has(name));
        this.selectedBots = selected;
        if (selected.length !== stored.length) {
          writeSelectedBotNames(this.action.slug, selected);
        }
        if (!this.isInventory) {
          this.destinationBot = '';
          this.inventoryPhase = 'sources';
          return;
        }
        const destination = readDestinationBotName(this.action.slug);
        this.destinationBot = readyNames.has(destination) ? destination : '';
        if (destination && !this.destinationBot) {
          writeDestinationBotName(this.action.slug, '');
        }
        const forceDestination = String(this.$route.query.step || '') === 'destination';
        this.inventoryPhase = (this.destinationBot && !forceDestination)
          ? 'sources'
          : 'destination';
        if (this.destinationBot) {
          this.selectedBots = this.selectedBots.filter(name => name !== this.destinationBot);
        }
      },
      onDestinationChange(next) {
        const name = (next && next[0]) || '';
        if (name && !isBotReadyForBulk(this.sortedBots.find(bot => bot.name === name))) {
          return;
        }
        this.destinationBot = name;
        writeDestinationBotName(this.action.slug, this.destinationBot);
        if (this.destinationBot) {
          this.selectedBots = this.selectedBots.filter(n => n !== this.destinationBot);
          writeSelectedBotNames(this.action.slug, this.selectedBots);
        }
      },
      onSelectionChange(next) {
        const readyNames = new Set(this.sortedBots.map(bot => bot.name));
        let cleaned = next.filter(name => readyNames.has(name));
        if (this.destinationBot) {
          cleaned = cleaned.filter(name => name !== this.destinationBot);
        }
        this.selectedBots = cleaned;
        writeSelectedBotNames(this.action.slug, cleaned);
      },
      continueToSources() {
        if (this.botsStepLocked || !this.destinationBot) return;
        writeDestinationBotName(this.action.slug, this.destinationBot);
        this.inventoryPhase = 'sources';
      },
      goChangeDestination() {
        if (this.botsStepLocked) return;
        this.inventoryPhase = 'destination';
      },
      continueToSetup() {
        if (this.botsStepLocked) return;
        if (this.isInventory && !this.destinationBot) {
          this.inventoryPhase = 'destination';
          return;
        }
        writeSelectedBotNames(this.action.slug, this.selectedBots);
        if (this.isInventory) writeDestinationBotName(this.action.slug, this.destinationBot);
        this.continueWithoutGuard(actionSetupRoute(this.action));
      },
      requestBack() {
        if (this.isInventory && this.inventoryPhase === 'sources') {
          this.goChangeDestination();
          return;
        }
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
