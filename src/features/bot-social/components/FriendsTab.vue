<template>
  <div class="friends-hub" :class="{ 'is-refreshing': refreshing }">
    <PluginMissing v-if="pluginMissing"></PluginMissing>

    <template v-else>
      <FriendsModeTabs
        :value="panelMode"
        :friends-count="friends.length"
        :sent-count="sentRequests.length"
        :received-count="receivedRequests.length"
        @input="setPanelMode"
      ></FriendsModeTabs>

      <FriendsComposePanel
        v-if="panelMode === 'send'"
        :target.sync="addTarget"
        :submitting="mutating"
        @submit="onAdd"
      ></FriendsComposePanel>

      <template v-else>
        <FriendsSearchChrome
          :query.sync="query"
          :count-label="countLabel"
          :has-active-filters="hasActiveFilters"
          :refreshing="refreshing"
          :refresh-disabled="loading || refreshing || mutating"
          @clear="clearFilters"
          @refresh="refresh"
        ></FriendsSearchChrome>

        <FriendsSkeleton v-if="loading && !hasAnyData"></FriendsSkeleton>
        <div v-else-if="error && !hasAnyData" class="bot-social__state bot-social__state--error">
          {{ error }}
        </div>
        <FriendsListPanel
          v-else
          :panel-mode="panelMode"
          :items="pageList"
          :active-count="activeList.length"
          :empty-label="emptyLabel"
          :error="error"
          :refreshing="refreshing"
          :mutating="mutating"
          :broken-avatars="brokenAvatars"
          :page.sync="page"
          :total-pages="totalPages"
          :danger-title="actionLabel"
          @clear-filters="clearFilters"
          @profile-click="onProfileClick"
          @avatar-error="onAvatarError"
          @accept="friend => askAction(friend, 'accept')"
          @danger="friend => askAction(friend, dangerActionMode)"
        ></FriendsListPanel>
      </template>
    </template>

    <RemoveDialog
      :open="Boolean(pendingAction)"
      :friend-name="pendingActionName"
      :submitting="mutating"
      :title-key="dialogTitleKey"
      :body-key="dialogBodyKey"
      :confirm-key="dialogConfirmKey"
      :confirm-tone="dialogConfirmTone"
      @cancel="pendingAction = null"
      @confirm="confirmAction"
    ></RemoveDialog>
  </div>
</template>

<script>
  import {
    addFriends, isPluginMissingError, removeFriends,
  } from '../api/bot-social';
  import { invalidateFriends, loadFriends } from '../cache/bot-social-queries';
  import { resolveLocalData } from '../cache/load-policy';
  import { normalizeFriendTarget } from '../utils/friend-target';
  import {
    STEAM_ID64_RE,
    friendDisplayName,
    isValidSteamId64,
  } from '../utils/friend-display';
  import { readModalView, replaceModalView } from '../../../utils/modal-view-query';
  import PluginMissing from './PluginMissing.vue';
  import FriendsComposePanel from './friends/compose-panel.vue';
  import FriendsListPanel from './friends/list-panel.vue';
  import FriendsModeTabs from './friends/mode-tabs.vue';
  import RemoveDialog from './friends/remove-dialog.vue';
  import FriendsSearchChrome from './friends/search-chrome.vue';
  import FriendsSkeleton from './friends/skeleton.vue';

  const PAGE_SIZE = 20;
  const FRIEND_VIEWS = new Set(['friends', 'sent', 'received', 'send']);
  const FRIEND_VIEW_DEFAULT = 'friends';

  export default {
    name: 'BotSocialFriendsTab',
    components: {
      PluginMissing,
      RemoveDialog,
      FriendsModeTabs,
      FriendsComposePanel,
      FriendsSearchChrome,
      FriendsSkeleton,
      FriendsListPanel,
    },
    props: {
      botName: { type: String, required: true },
      pluginMissing: { type: Boolean, default: false },
    },
    data() {
      return {
        panelMode: readModalView(this.$route, FRIEND_VIEWS, FRIEND_VIEW_DEFAULT),
        loading: false,
        refreshing: false,
        mutating: false,
        error: '',
        friends: [],
        sentRequests: [],
        receivedRequests: [],
        addTarget: '',
        query: '',
        page: 1,
        pendingAction: null,
        brokenAvatars: {},
      };
    },
    computed: {
      hasAnyData() {
        return this.friends.length > 0 || this.sentRequests.length > 0 || this.receivedRequests.length > 0;
      },
      hasActiveFilters() {
        return Boolean(this.query);
      },
      activeList() {
        if (this.panelMode === 'sent') return this.sentRequests;
        if (this.panelMode === 'received') return this.receivedRequests;
        return this.friends;
      },
      filteredList() {
        const q = this.query.trim().toLowerCase();
        if (!q) return this.activeList;
        return this.activeList.filter(f => String(f.name || '').toLowerCase().includes(q));
      },
      totalPages() {
        return Math.max(1, Math.ceil(this.filteredList.length / PAGE_SIZE) || 1);
      },
      pageList() {
        const safe = Math.min(Math.max(1, this.page), this.totalPages);
        const start = (safe - 1) * PAGE_SIZE;
        return this.filteredList.slice(start, start + PAGE_SIZE);
      },
      countLabel() {
        if (this.panelMode === 'sent') {
          return this.$t('bot-social-friends-sent-total', { n: this.sentRequests.length });
        }
        if (this.panelMode === 'received') {
          return this.$t('bot-social-friends-received-total', { n: this.receivedRequests.length });
        }
        return this.$t('bot-social-friends-total', { n: this.friends.length });
      },
      emptyLabel() {
        if (this.panelMode === 'sent') return this.$t('bot-social-friends-sent-empty');
        if (this.panelMode === 'received') return this.$t('bot-social-friends-received-empty');
        return this.$t('bot-social-friends-empty');
      },
      dangerActionMode() {
        if (this.panelMode === 'sent') return 'sent';
        if (this.panelMode === 'received') return 'received';
        return 'friends';
      },
      actionLabel() {
        if (this.panelMode === 'sent') return this.$t('bot-social-friends-cancel-request');
        if (this.panelMode === 'received') return this.$t('bot-social-friends-decline');
        return this.$t('delete');
      },
      pendingActionName() {
        if (!this.pendingAction) return '';
        return friendDisplayName(this.pendingAction.friend);
      },
      pendingMode() {
        return this.pendingAction?.mode || this.panelMode;
      },
      dialogTitleKey() {
        if (this.pendingMode === 'accept') return 'bot-social-friends-accept-title';
        if (this.pendingMode === 'sent') return 'bot-social-friends-cancel-request-title';
        if (this.pendingMode === 'received') return 'bot-social-friends-decline-title';
        return 'bot-social-friends-remove-title';
      },
      dialogBodyKey() {
        if (this.pendingMode === 'accept') return 'bot-social-friends-accept-body';
        if (this.pendingMode === 'sent') return 'bot-social-friends-cancel-request-body';
        if (this.pendingMode === 'received') return 'bot-social-friends-decline-body';
        return 'bot-social-friends-remove-body';
      },
      dialogConfirmKey() {
        if (this.pendingMode === 'accept') return 'bot-social-friends-accept';
        if (this.pendingMode === 'sent') return 'bot-social-friends-cancel-request';
        if (this.pendingMode === 'received') return 'bot-social-friends-decline';
        return 'bot-social-friends-remove-confirm-btn';
      },
      dialogConfirmTone() {
        return this.pendingMode === 'accept' ? 'primary' : 'danger';
      },
    },
    watch: {
      botName: {
        immediate: true,
        handler() {
          this.resetView();
          this.bootstrap();
        },
      },
      pluginMissing(value) {
        if (!value) this.bootstrap();
      },
      query() {
        this.page = 1;
      },
      panelMode() {
        this.page = 1;
        this.query = '';
        this.pendingAction = null;
      },
      filteredList() {
        if (this.page > this.totalPages) this.page = this.totalPages;
      },
      '$route.query.view'() {
        this.syncPanelFromRoute();
      },
    },
    methods: {
      syncPanelFromRoute() {
        const next = readModalView(this.$route, FRIEND_VIEWS, FRIEND_VIEW_DEFAULT);
        if (next !== this.panelMode) this.panelMode = next;
      },
      setPanelMode(mode) {
        if (!FRIEND_VIEWS.has(mode) || mode === this.panelMode) return;
        this.panelMode = mode;
        replaceModalView(this.$router, this.$route, mode, FRIEND_VIEW_DEFAULT);
      },
      resetView() {
        this.syncPanelFromRoute();
        this.query = '';
        this.page = 1;
        this.pendingAction = null;
        this.brokenAvatars = {};
        this.error = '';
      },
      clearFilters() {
        this.query = '';
        this.page = 1;
      },
      applyPayload(data) {
        this.friends = data?.friends || [];
        this.sentRequests = data?.sentRequests || [];
        this.receivedRequests = data?.receivedRequests || [];
      },
      bootstrap() {
        if (this.pluginMissing) return;
        const resolved = resolveLocalData({
          resource: 'friends',
          botName: this.botName,
          isUsable: data => Array.isArray(data?.friends)
            && Array.isArray(data?.sentRequests)
            && Array.isArray(data?.receivedRequests)
            && data.friends.every(f => STEAM_ID64_RE.test(String(f.steamId || ''))),
        });
        if (resolved.hasData) {
          this.applyPayload(resolved.data);
          this.$emit('loaded', { total: resolved.data.total ?? this.friends.length });
          return;
        }
        this.load(true);
      },
      async load(force) {
        if (this.pluginMissing) return;
        const hasData = this.hasAnyData;
        this.loading = !hasData;
        this.refreshing = force && hasData;
        if (force) this.error = '';

        try {
          const result = await loadFriends(this.botName, { force });
          this.applyPayload(result.data);
          if (result.rateLimited) this.$error(this.$t('bot-social-rate-limited'));
          else if (result.error && result.stale) this.error = result.error.message || String(result.error);
          else this.error = '';
          this.$emit('loaded', { total: result.data?.total ?? this.friends.length });
        } catch (err) {
          if (isPluginMissingError(err)) {
            this.$emit('plugin-missing');
            return;
          }
          if (err?.code === 'RATE_LIMITED') this.$error(this.$t('bot-social-rate-limited'));
          else if (!hasData) {
            this.error = err.message || String(err);
            this.applyPayload(null);
          } else this.error = err.message || String(err);
        } finally {
          this.loading = false;
          this.refreshing = false;
        }
      },
      refresh() {
        if (this.loading || this.refreshing || this.mutating) return;
        this.load(true);
      },
      onProfileClick(friend, event) {
        if (!isValidSteamId64(friend.steamId)) {
          event.preventDefault();
          this.$error(this.$t('bot-social-friends-profile-invalid'));
        }
      },
      onAvatarError(steamId) {
        this.$set(this.brokenAvatars, steamId, true);
      },
      mutationSucceeded(entry) {
        if (!entry || typeof entry !== 'object') return false;
        const ok = entry.Success ?? entry.success;
        return ok === true;
      },
      firstMutationResult(payload) {
        if (!payload || typeof payload !== 'object') return null;
        const botResult = payload[this.botName]
          || payload[Object.keys(payload).find(k => k.toLowerCase() === String(this.botName || '').toLowerCase())]
          || payload[Object.keys(payload)[0]];
        if (!botResult) return null;
        if (Array.isArray(botResult)) return botResult[0] || null;
        const list = botResult.Results || botResult.results;
        return Array.isArray(list) ? (list[0] || null) : null;
      },
      async onAdd() {
        if (this.mutating) return;
        const target = normalizeFriendTarget(this.addTarget);
        if (!target) {
          this.$error(this.$t('bot-social-friends-send-invalid'));
          return;
        }
        this.mutating = true;
        try {
          const payload = await addFriends(this.botName, [target]);
          const first = this.firstMutationResult(payload);
          if (!this.mutationSucceeded(first)) {
            const detail = first?.Message || first?.message || this.$t('bot-social-friends-add-failed');
            this.$error(detail);
            return;
          }
          this.$success(this.$t('bot-social-friends-add-success'));
          this.addTarget = '';
          invalidateFriends(this.botName);
          await this.load(true);
          this.setPanelMode('sent');
        } catch (err) {
          if (isPluginMissingError(err)) this.$emit('plugin-missing');
          else this.$error(err.message || String(err));
        } finally {
          this.mutating = false;
        }
      },
      askAction(friend, mode) {
        if (this.mutating || !friend) return;
        this.pendingAction = { friend, mode: mode || this.dangerActionMode };
      },
      async confirmAction() {
        const pending = this.pendingAction;
        if (!pending?.friend || this.mutating) return;
        this.mutating = true;
        try {
          if (pending.mode === 'accept') {
            await addFriends(this.botName, [pending.friend.steamId]);
            this.$success(this.$t('bot-social-friends-accept-success'));
          } else {
            await removeFriends(this.botName, [pending.friend.steamId]);
            if (pending.mode === 'sent') this.$success(this.$t('bot-social-friends-cancel-request-success'));
            else if (pending.mode === 'received') this.$success(this.$t('bot-social-friends-decline-success'));
            else this.$success(this.$t('bot-social-friends-remove-success'));
          }
          this.pendingAction = null;
          invalidateFriends(this.botName);
          await this.load(true);
        } catch (err) {
          if (isPluginMissingError(err)) this.$emit('plugin-missing');
          else this.$error(err.message || String(err));
        } finally {
          this.mutating = false;
        }
      },
    },
  };
</script>
