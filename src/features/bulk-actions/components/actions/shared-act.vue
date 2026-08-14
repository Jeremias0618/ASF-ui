<template>
  <section class="bulk-actions-setup-panel" :aria-label="title">
    <BulkJobBanner
      v-if="jobBlocked && blockedJob"
      :job="blockedJob"
      :show-resume="false"
    ></BulkJobBanner>

    <div class="bulk-actions-setup-panel__body">
      <label class="bulk-actions-field">
        <span class="bulk-actions-field__label">{{ $t(action.targetLabelKey) }}</span>
        <input
          v-model.trim="target"
          class="bulk-actions-field__control"
          :class="{ 'is-invalid': showTargetError }"
          type="text"
          autocomplete="off"
          spellcheck="false"
          :placeholder="$t(action.targetPlaceholderKey)"
          :disabled="busy || jobBlocked"
          :aria-invalid="showTargetError ? 'true' : 'false'"
          :aria-describedby="showTargetError ? targetErrorId : null"
          @blur="targetTouched = true"
        >
        <p
          v-if="showTargetError"
          :id="targetErrorId"
          class="bulk-actions-field__error"
          role="alert"
        >
          {{ $t('bulk-actions-invalid-target-shared') }}
        </p>
      </label>

      <fieldset class="bulk-actions-choice" :disabled="busy || jobBlocked">
        <legend class="bulk-actions-field__label">{{ $t('bulk-action-shared-vote-label') }}</legend>
        <div class="bulk-actions-choice__row">
          <label class="bulk-actions-choice__option" :class="{ 'is-on': vote === 'like' }">
            <input v-model="vote" type="radio" value="like">
            {{ $t('bulk-action-shared-vote-like') }}
          </label>
          <label class="bulk-actions-choice__option" :class="{ 'is-on': vote === 'dislike' }">
            <input v-model="vote" type="radio" value="dislike">
            {{ $t('bulk-action-shared-vote-dislike') }}
          </label>
          <label class="bulk-actions-choice__option" :class="{ 'is-on': vote === '' }">
            <input v-model="vote" type="radio" value="">
            {{ $t('bulk-action-shared-vote-none') }}
          </label>
        </div>
      </fieldset>

      <label class="bulk-actions-toggle" :class="{ 'is-on': favorite, 'is-disabled': busy || jobBlocked }">
        <input v-model="favorite" type="checkbox" :disabled="busy || jobBlocked">
        <span>{{ $t('bulk-action-shared-favorite') }}</span>
      </label>
    </div>

    <footer class="bulk-actions-setup-bar">
      <div class="bulk-actions-setup-bar__copy">
        <p class="bulk-actions-setup-bar__hint">{{ $t('bulk-actions-setup-hint-paced') }}</p>
      </div>
      <button
        type="button"
        class="button button--confirm bulk-actions-setup-bar__cta"
        :disabled="runDisabled"
        @click="requestConfirm"
      >
        {{ $t('bulk-actions-run') }}
        <FontAwesomeIcon icon="play" aria-hidden="true"></FontAwesomeIcon>
      </button>
    </footer>

    <BulkConfirmDialog
      :open="openConfirm"
      :title="$t('bulk-actions-confirm-title')"
      :lead="$t('bulk-actions-confirm-lead')"
      :lines="confirmLines"
      :warning="$t('bulk-actions-confirm-warning-paced')"
      :confirmLabel="$t('bulk-actions-run')"
      @cancel="openConfirm = false"
      @confirm="onConfirm"
    ></BulkConfirmDialog>

    <BulkProgressModal
      :open="progressOpen"
      :running="runner.running"
      :current="runner.current"
      :total="runner.total"
      :label="runner.label"
      :results="runner.results"
      :summary-target="target.trim()"
      :bots-total="botNames.length"
      :paced="true"
      @cancel="onBulkProgressCancel"
      @close="onBulkProgressClose"
    ></BulkProgressModal>
  </section>
</template>

<script>
  import { isPluginMissingError } from '../../../bot-social/api/bot-social';
  import { flattenMutationResults, sharedFilesAct } from '../../api/bulk-social';
  import { createBulkRunner } from '../../composables/use-bulk-runner';
  import bulkJobLifecycle from '../../mixins/bulk-job-lifecycle';
  import { isValidBulkTarget } from '../../utils/validate-target';
  import BulkConfirmDialog from '../confirm-dialog.vue';
  import BulkJobBanner from '../job-banner.vue';
  import BulkProgressModal from '../progress-modal.vue';

  let sharedTargetErrorSeq = 0;

  export default {
    name: 'BulkSharedActAction',
    components: { BulkConfirmDialog, BulkJobBanner, BulkProgressModal },
    mixins: [bulkJobLifecycle],
    props: {
      action: { type: Object, required: true },
      bots: { type: Array, default: () => [] },
    },
    data() {
      sharedTargetErrorSeq += 1;
      return {
        target: '',
        targetTouched: false,
        targetErrorId: `bulk-shared-target-error-${sharedTargetErrorSeq}`,
        vote: 'like',
        favorite: false,
        openConfirm: false,
        runner: createBulkRunner(),
      };
    },
    computed: {
      title() { return this.$t(this.action.titleKey); },
      botNames() { return this.bots.map(b => b.name); },
      targetValid() {
        return isValidBulkTarget(this.action, this.target);
      },
      showTargetError() {
        return this.targetTouched && Boolean(this.target.trim()) && !this.targetValid;
      },
      canSubmit() {
        return this.botNames.length > 0
          && this.targetValid
          && (Boolean(this.vote) || this.favorite)
          && !this.jobBlocked;
      },
      confirmLines() {
        const lines = [
          this.$t('bulk-actions-confirm-bots', { n: this.botNames.length }),
          this.$t('bulk-actions-confirm-target', { target: this.target }),
        ];
        if (this.vote) lines.push(this.$t('bulk-actions-confirm-vote', { vote: this.vote }));
        if (this.favorite) lines.push(this.$t('bulk-actions-confirm-favorite'));
        lines.push(this.$t('bulk-actions-confirm-paced'));
        return lines;
      },
    },
    methods: {
      applyJobParams(job) {
        if (job.params?.target) this.target = String(job.params.target);
        if (Object.prototype.hasOwnProperty.call(job.params || {}, 'vote')) {
          this.vote = job.params.vote == null ? '' : String(job.params.vote);
        }
        if (typeof job.params?.favorite === 'boolean') this.favorite = job.params.favorite;
      },
      requestConfirm() {
        this.targetTouched = true;
        if (!this.canSubmit || this.busy) return;
        this.openConfirm = true;
      },
      async onConfirm() {
        this.openConfirm = false;
        const job = this.beginBulkJob({
          params: {
            target: this.target.trim(),
            vote: this.vote || null,
            favorite: this.favorite,
          },
          botNames: this.botNames.slice(),
          summaryTarget: this.target.trim(),
          api: 'sharedAct',
        });
        if (!job) return;
        await this.continueBulkJob(job);
      },
      async continueBulkJob(job) {
        const url = String(job.params.target || this.target).trim();
        const vote = job.params.vote || null;
        const favorite = Boolean(job.params.favorite);
        await this.executePacedJob(job, async botName => {
          try {
            const payload = await sharedFilesAct([botName], { url, vote, favorite });
            return flattenMutationResults(payload);
          } catch (err) {
            if (isPluginMissingError(err)) this.$emit('plugin-missing');
            throw err;
          }
        }, { api: 'sharedAct' });
      },
    },
  };
</script>
