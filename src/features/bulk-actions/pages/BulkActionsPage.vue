<template>
  <main class="bulk-actions-page bulk-actions-page--hub home2-page-body">
    <header class="bulk-actions-hero">
      <div class="bulk-actions-hero__copy">
        <p class="bulk-actions-hero__eyebrow">{{ $t('control') }}</p>
        <h1 class="bulk-actions-hero__title">{{ $t('bulk-actions') }}</h1>
        <p class="bulk-actions-hero__lead">{{ $t('bulk-actions-lead') }}</p>
      </div>

      <ol class="bulk-actions-pipeline" :aria-label="$t('bulk-actions-pipeline-label')">
        <li class="bulk-actions-pipeline__step is-current">
          <span class="bulk-actions-pipeline__index" aria-hidden="true">1</span>
          <span class="bulk-actions-pipeline__text">{{ $t('bulk-actions-pipeline-pick') }}</span>
        </li>
        <li class="bulk-actions-pipeline__step" aria-current="false">
          <span class="bulk-actions-pipeline__index" aria-hidden="true">2</span>
          <span class="bulk-actions-pipeline__text">{{ $t('bulk-actions-pipeline-bots') }}</span>
        </li>
        <li class="bulk-actions-pipeline__step" aria-current="false">
          <span class="bulk-actions-pipeline__index" aria-hidden="true">3</span>
          <span class="bulk-actions-pipeline__text">{{ $t('bulk-actions-pipeline-run') }}</span>
        </li>
      </ol>
    </header>

    <BulkJobBanner
      v-if="activeJob"
      :job="activeJob"
      :show-resume="true"
      @resume="resumeActiveJob"
    ></BulkJobBanner>

    <section class="bulk-actions-deck" :aria-label="$t('bulk-actions')">
      <div class="bulk-actions-deck__toolbar">
        <label class="bulk-actions-deck__search">
          <FontAwesomeIcon icon="search" aria-hidden="true"></FontAwesomeIcon>
          <input
            v-model.trim="query"
            type="search"
            :placeholder="$t('bulk-actions-search')"
            :aria-label="$t('bulk-actions-search')"
          >
        </label>
        <p class="bulk-actions-deck__meta">
          {{ $t('bulk-actions-ready-bots', { n: sortedBots.length }) }}
        </p>
      </div>

      <p v-if="!sortedBots.length" class="bulk-actions__empty">
        {{ $t('bulk-actions-no-bots') }}
        <a class="bulk-actions__empty-link" @click="$router.push({ name: 'bot-create' })">
          {{ $t('mass-editor-create-bot') }}
        </a>
      </p>

      <p v-else-if="!visibleGroups.length" class="bulk-actions__empty">
        {{ $t('bulk-actions-search-empty') }}
      </p>

      <div v-else class="bulk-actions-deck__groups">
        <section
          v-for="group in visibleGroups"
          :key="group.id"
          class="bulk-actions-rail"
        >
          <header class="bulk-actions-rail__head">
            <h2 class="bulk-actions-rail__title">{{ $t(group.titleKey) }}</h2>
            <span class="bulk-actions-rail__count">{{ group.actions.length }}</span>
          </header>
          <div class="bulk-actions-rail__grid">
            <BulkActionCard
              v-for="(action, index) in group.actions"
              :key="action.id"
              :actionId="action.id"
              :icon="action.icon"
              :title="$t(action.titleKey)"
              :lead="$t(action.leadKey)"
              :index="index"
              @select="openAction"
            ></BulkActionCard>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>

<script>
  import { mapGetters } from 'vuex';
  import {
    actionBotsRoute,
    actionSetupRoute,
    BULK_ACTION_GROUPS,
    BULK_ACTIONS,
    getBulkAction,
  } from '../constants/actions';
  import {
    writeDestinationBotName,
    writeSelectedBotNames,
  } from '../utils/action-session';
  import { isBulkJobActive, readBulkJob } from '../utils/bulk-job-session';
  import { ensureBotSocialPluginOrModal } from '../../bot-social/plugin-gate/guard';
  import BulkActionCard from '../components/action-card.vue';
  import BulkJobBanner from '../components/job-banner.vue';

  export default {
    name: 'BulkActionsPage',
    metaInfo() {
      return {
        title: this.$t('bulk-actions'),
      };
    },
    components: { BulkActionCard, BulkJobBanner },
    data() {
      return {
        query: '',
        groups: BULK_ACTION_GROUPS,
        actions: BULK_ACTIONS,
        activeJob: null,
      };
    },
    computed: {
      ...mapGetters({ bots: 'bots/bots' }),
      sortedBots() {
        return [...this.bots].sort((a, b) => String(a.name).localeCompare(String(b.name)));
      },
      filteredActions() {
        const q = this.query.toLowerCase();
        if (!q) return this.actions;
        return this.actions.filter(action => {
          const title = String(this.$t(action.titleKey) || '').toLowerCase();
          const lead = String(this.$t(action.leadKey) || '').toLowerCase();
          return title.includes(q) || lead.includes(q) || action.slug.includes(q);
        });
      },
      visibleGroups() {
        return this.groups
          .map(group => ({
            ...group,
            actions: this.filteredActions.filter(action => action.group === group.id),
          }))
          .filter(group => group.actions.length > 0);
      },
    },
    mounted() {
      this.refreshActiveJob();
    },
    activated() {
      this.refreshActiveJob();
    },
    methods: {
      refreshActiveJob() {
        this.activeJob = isBulkJobActive() ? readBulkJob() : null;
      },
      async resumeActiveJob() {
        const ok = await ensureBotSocialPluginOrModal();
        if (!ok) return;
        const job = readBulkJob();
        if (!job || job.status !== 'running') {
          this.activeJob = null;
          return;
        }
        const action = getBulkAction(job.actionSlug || job.actionId);
        if (!action) return;
        writeSelectedBotNames(action.slug, job.botNames || []);
        if (action.kind === 'inventory' && job.params?.destinationBot) {
          writeDestinationBotName(action.slug, job.params.destinationBot);
        }
        this.$router.push(actionSetupRoute(action));
      },
      async openAction(id) {
        const action = getBulkAction(id);
        if (!action) return;
        const ok = await ensureBotSocialPluginOrModal();
        if (!ok) return;
        const job = readBulkJob();
        if (job && job.status === 'running') {
          const same = String(job.actionSlug || '').toLowerCase() === String(action.slug).toLowerCase();
          if (same) {
            this.resumeActiveJob();
            return;
          }
          this.activeJob = job;
          return;
        }
        this.$router.push(actionBotsRoute(action));
      },
    },
  };
</script>
