<template>
  <div class="own-reviews" :class="{ 'is-refreshing': refreshing }">
    <PluginMissing v-if="pluginMissing"></PluginMissing>

    <div v-else-if="support === 'checking'" class="bot-social__state">
      <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
      <span>{{ $t('bot-social-loading') }}</span>
    </div>

    <div v-else-if="support === 'outdated'" class="bot-social__missing" role="status">
      <p class="bot-social__missing-title">{{ $t('bot-social-reviews-outdated-title') }}</p>
      <p class="bot-social__missing-text">{{ $t('bot-social-reviews-outdated-body') }}</p>
      <button type="button" class="button button--confirm" @click="recheckSupport">
        {{ $t('bot-social-reviews-outdated-retry') }}
      </button>
    </div>

    <div v-else-if="support === 'error'" class="bot-social__state bot-social__state--error">
      <span>{{ supportError }}</span>
      <button type="button" class="own-reviews__link-btn" @click="recheckSupport">
        {{ $t('bot-social-reviews-retry') }}
      </button>
    </div>

    <template v-else>
      <ReviewEditor
        v-if="editor"
        :key="`${editor.mode}-${editor.appId}`"
        :botName="botName"
        :mode="editor.mode"
        :appId="editor.appId"
        :title="titleOf(editor.appId)"
        :coverUrl="coverOf(editor.appId)"
        @close="closeEditor"
        @saved="onSaved"
        @edit-existing="editExisting"
      ></ReviewEditor>

      <template v-else>
        <div class="own-reviews__top">
          <AsfIconTabs
            :value="panelMode"
            :tabs="modeTabs"
            :aria-label="$t('bot-social-reviews-modes')"
            @input="setPanelMode"
          ></AsfIconTabs>
          <button
            type="button"
            class="own-reviews__refresh"
            :disabled="busy || cooldownSeconds > 0"
            @click="refresh"
          >
            <FontAwesomeIcon :icon="busy ? 'spinner' : 'redo-alt'" :spin="busy"></FontAwesomeIcon>
            <template v-if="cooldownSeconds > 0">
              {{ $t('bot-social-refresh-cooldown', { s: cooldownSeconds }) }}
            </template>
            <template v-else>{{ $t('bot-social-refresh') }}</template>
          </button>
        </div>

        <p v-if="notice" class="own-reviews__flash" :class="`own-reviews__flash--${notice.kind}`" role="status">
          <FontAwesomeIcon :icon="notice.kind === 'success' ? 'check-circle' : 'exclamation-triangle'" aria-hidden="true"></FontAwesomeIcon>
          <span>{{ notice.text }}</span>
          <button type="button" class="own-reviews__link-btn" @click="notice = null">
            {{ $t('bot-social-reviews-flash-dismiss') }}
          </button>
        </p>

        <PublishedPanel
          v-if="panelMode === 'published'"
          :botName="botName"
          :session="session"
          :nameByAppId="nameByAppId"
          :page.sync="ui.publishedPage"
          :query.sync="ui.publishedQuery"
          :openAppId.sync="ui.openAppId"
          :canEdit="caps.edit"
          @edit="openEditor('edit', $event)"
          @refresh="refresh"
          @plugin-missing="$emit('plugin-missing')"
        ></PublishedPanel>

        <CandidatesPanel
          v-else
          :botName="botName"
          :session="session"
          :library="library"
          :page.sync="ui.candidatesPage"
          :query.sync="ui.candidatesQuery"
          :canPublish="caps.publish"
          @write="game => openEditor('publish', game.appId)"
          @retry-all="retryAll"
          @reload-library="loadLibrary(true)"
        ></CandidatesPanel>
      </template>
    </template>
  </div>
</template>

<script>
  import { isPluginMissingError } from '../api/bot-social';
  import { loadGames } from '../cache/bot-social-queries';
  import {
    getOwnReviewsSession,
    loadOwnReviewsAll,
    loadOwnReviewsCapabilities,
    loadOwnReviewsFirstPage,
  } from '../cache/own-reviews-session';
  import { createSubmitCooldownMixin } from '../mixins/submit-cooldown';
  import CandidatesPanel from './own-reviews/candidates-panel.vue';
  import PublishedPanel from './own-reviews/published-panel.vue';
  import ReviewEditor from './own-reviews/review-editor.vue';
  import PluginMissing from './PluginMissing.vue';
  import { readModalView, replaceModalView } from '../../../utils/modal-view-query';

  const VIEWS = new Set(['published', 'candidates']);
  const VIEW_DEFAULT = 'published';
  /** UI cooldown ≥ plugin OwnReviews limiter (1.5 s). */
  const REFRESH_COOLDOWN_MS = 3000;

  const freshUi = () => ({
    publishedPage: 1,
    publishedQuery: '',
    openAppId: null,
    candidatesPage: 1,
    candidatesQuery: '',
  });

  export default {
    name: 'BotSocialOwnReviewsTab',
    components: {
      CandidatesPanel, PublishedPanel, ReviewEditor, PluginMissing,
    },
    mixins: [createSubmitCooldownMixin(REFRESH_COOLDOWN_MS)],
    props: {
      botName: { type: String, required: true },
      pluginMissing: { type: Boolean, default: false },
    },
    data() {
      return {
        panelMode: readModalView(this.$route, VIEWS, VIEW_DEFAULT),
        /** checking | ready | outdated | error */
        support: 'checking',
        supportError: '',
        /** What the installed plugin DLL can do: read always, publish / edit announced separately. */
        caps: { read: false, publish: false, edit: false },
        refreshing: false,
        library: { status: 'idle', games: [], error: '' },
        /** Page, search and open review of each tab: kept here so they survive the detail and the editor. */
        ui: freshUi(),
        /** { mode: 'publish' | 'edit', appId } while the editor is open. */
        editor: null,
        notice: null,
      };
    },
    computed: {
      session() {
        return getOwnReviewsSession(this.botName);
      },
      busy() {
        return this.refreshing
          || this.session.status === 'loading'
          || this.session.pageLoading !== 0
          || this.session.loadingAll;
      },
      nameByAppId() {
        const map = {};
        this.library.games.forEach(game => {
          map[Number(game.appId)] = game.name;
        });
        return map;
      },
      modeTabs() {
        const reviewed = this.session.total ?? (this.session.pages[1] ? this.session.items.length : null);
        return [
          {
            id: 'published',
            icon: 'comments',
            label: this.$t('bot-social-reviews-tab-published'),
            count: reviewed,
          },
          { id: 'candidates', icon: 'pen-square', label: this.$t('bot-social-reviews-tab-candidates') },
        ];
      },
    },
    watch: {
      'botName': {
        immediate: true,
        handler() {
          this.library = { status: 'idle', games: [], error: '' };
          this.ui = freshUi();
          this.editor = null;
          this.notice = null;
          this.syncPanelFromRoute();
          this.resetSubmitCooldown();
          this.bootstrap();
        },
      },
      pluginMissing(value) {
        if (!value) this.bootstrap();
      },
      '$route.query.view': function viewChanged() {
        this.syncPanelFromRoute();
      },
    },
    methods: {
      syncPanelFromRoute() {
        const next = readModalView(this.$route, VIEWS, VIEW_DEFAULT);
        if (next !== this.panelMode) this.panelMode = next;
      },
      setPanelMode(mode) {
        if (!VIEWS.has(mode) || mode === this.panelMode) return;
        this.panelMode = mode;
        this.notice = null;
        replaceModalView(this.$router, this.$route, mode, VIEW_DEFAULT);
      },
      async bootstrap({ forceSupport = false } = {}) {
        if (this.pluginMissing || !this.botName) return;
        const { botName } = this;
        this.support = 'checking';
        this.supportError = '';
        try {
          const caps = await loadOwnReviewsCapabilities(botName, { force: forceSupport });
          if (botName !== this.botName) return;
          this.caps = caps;
          if (!caps.read) {
            this.support = 'outdated';
            return;
          }
        } catch (err) {
          if (botName !== this.botName) return;
          if (isPluginMissingError(err)) {
            this.$emit('plugin-missing');
            return;
          }
          this.support = 'error';
          this.supportError = err?.message || String(err);
          return;
        }
        this.support = 'ready';
        // Only page 1 is read here: other pages are read when visited, the rest when a search needs them.
        await loadOwnReviewsFirstPage(botName);
        this.loadLibrary(false);
      },
      recheckSupport() {
        this.bootstrap({ forceSupport: true });
      },
      async refresh() {
        if (this.busy || this.cooldownSeconds > 0) return;
        this.refreshing = true;
        try {
          await loadOwnReviewsFirstPage(this.botName, { force: true });
        } finally {
          this.refreshing = false;
          this.armSubmitCooldown();
        }
      },
      retryAll() {
        loadOwnReviewsAll(this.botName);
      },
      async loadLibrary(force) {
        const { botName } = this;
        if (this.library.status === 'loading') return;
        this.library = { ...this.library, status: 'loading', error: '' };
        try {
          const result = await loadGames(botName, { force });
          if (botName !== this.botName) return;
          this.library = {
            status: 'ready',
            games: result?.data?.games || [],
            error: '',
          };
        } catch (err) {
          if (botName !== this.botName) return;
          this.library = { status: 'error', games: [], error: err?.message || String(err) };
        }
      },
      titleOf(appId) {
        return this.nameByAppId[appId] || this.$t('bot-social-reviews-app-fallback', { id: appId });
      },
      coverOf(appId) {
        return this.session.items.find(item => item.appId === appId)?.coverUrl || '';
      },
      openEditor(mode, appId) {
        this.notice = null;
        this.editor = { mode, appId: Number(appId) };
      },
      closeEditor() {
        this.editor = null;
      },
      /** The review already exists: continue as an edit of the stored one, from the published list. */
      editExisting(appId) {
        this.setPanelMode('published');
        this.ui.openAppId = appId;
        this.editor = { mode: 'edit', appId };
      },
      async onSaved({ mode, result }) {
        const { appId } = this.editor;
        const title = this.titleOf(appId);
        this.editor = null;
        this.setPanelMode('published');

        if (mode === 'publish') {
          // The new review is the newest one: show the list from its first page, read again from Steam.
          this.ui.publishedQuery = '';
          this.ui.publishedPage = 1;
          this.ui.openAppId = null;
          this.notice = result.verified
            ? { kind: 'success', text: this.$t('bot-social-reviews-published-ok', { title }) }
            : { kind: 'warning', text: this.$t('bot-social-reviews-published-unverified', { title }) };
          await loadOwnReviewsFirstPage(this.botName, { force: true, keepExtra: true });
          return;
        }

        // Edited: the card and the cached detail were already updated in place; the page does not change.
        this.ui.openAppId = appId;
        this.notice = result.verified
          ? { kind: 'success', text: this.$t('bot-social-reviews-edited-ok', { title }) }
          : { kind: 'warning', text: this.$t('bot-social-reviews-edited-unverified', { title }) };
      },
    },
  };
</script>
