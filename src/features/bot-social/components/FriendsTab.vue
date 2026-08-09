<template>
  <div class="friends-hub" :class="{ 'is-refreshing': refreshing }">
    <PluginMissing v-if="pluginMissing"></PluginMissing>

    <template v-else>
      <div class="friends-hub__modes" role="tablist" :aria-label="$t('bot-social-friends-modes')">
        <button
          type="button"
          role="tab"
          class="friends-hub__mode"
          :class="{ 'is-active': panelMode === 'friends' }"
          :aria-selected="panelMode === 'friends' ? 'true' : 'false'"
          @click="setPanelMode('friends')"
        >
          {{ $t('bot-social-friends-mode-friends') }}
          <span class="friends-hub__mode-count">{{ friends.length }}</span>
        </button>
        <button
          type="button"
          role="tab"
          class="friends-hub__mode"
          :class="{ 'is-active': panelMode === 'sent' }"
          :aria-selected="panelMode === 'sent' ? 'true' : 'false'"
          @click="setPanelMode('sent')"
        >
          {{ $t('bot-social-friends-mode-sent') }}
          <span class="friends-hub__mode-count">{{ sentRequests.length }}</span>
        </button>
        <button
          type="button"
          role="tab"
          class="friends-hub__mode"
          :class="{ 'is-active': panelMode === 'received' }"
          :aria-selected="panelMode === 'received' ? 'true' : 'false'"
          @click="setPanelMode('received')"
        >
          {{ $t('bot-social-friends-mode-received') }}
          <span class="friends-hub__mode-count">{{ receivedRequests.length }}</span>
        </button>
        <button
          type="button"
          role="tab"
          class="friends-hub__mode"
          :class="{ 'is-active': panelMode === 'send' }"
          :aria-selected="panelMode === 'send' ? 'true' : 'false'"
          @click="setPanelMode('send')"
        >
          <FontAwesomeIcon icon="plus" aria-hidden="true"></FontAwesomeIcon>
          {{ $t('bot-social-friends-mode-send') }}
        </button>
        <button
          type="button"
          role="tab"
          class="friends-hub__mode"
          :class="{ 'is-active': panelMode === 'groups' }"
          :aria-selected="panelMode === 'groups' ? 'true' : 'false'"
          @click="setPanelMode('groups')"
        >
          <FontAwesomeIcon icon="users" aria-hidden="true"></FontAwesomeIcon>
          {{ $t('bot-social-friends-mode-groups') }}
        </button>
      </div>

      <section
        v-if="panelMode === 'send'"
        class="friends-hub__compose"
        :aria-label="$t('bot-social-friends-send-title')"
      >
        <div class="friends-hub__compose-panel">
          <header class="friends-hub__compose-header">
            <p class="friends-hub__compose-eyebrow">{{ $t('bot-social-friends-mode-send') }}</p>
            <h3 class="friends-hub__compose-title">{{ $t('bot-social-friends-send-title') }}</h3>
            <p class="friends-hub__compose-lead">{{ $t('bot-social-friends-send-lead') }}</p>
          </header>

          <form class="friends-hub__compose-form" @submit.prevent="onAdd">
            <label class="friends-hub__field-label" for="friends-send-target">
              {{ $t('bot-social-friends-send-target-label') }}
            </label>
            <div class="friends-hub__compose-combo">
              <input
                id="friends-send-target"
                v-model.trim="addTarget"
                class="friends-hub__compose-input"
                type="text"
                :placeholder="$t('bot-social-friends-send-placeholder')"
                :disabled="mutating"
                autocomplete="off"
                spellcheck="false"
              >
              <button
                type="submit"
                class="friends-hub__compose-submit"
                :disabled="!addTarget || mutating"
              >
                <FontAwesomeIcon v-if="mutating" icon="spinner" spin aria-hidden="true"></FontAwesomeIcon>
                <span v-else>{{ $t('bot-social-friends-send-submit') }}</span>
              </button>
            </div>
          </form>

          <div class="friends-hub__compose-help" :aria-label="$t('bot-social-friends-send-formats')">
            <p class="friends-hub__compose-help-title">{{ $t('bot-social-friends-send-formats') }}</p>
            <ul class="friends-hub__compose-examples">
              <li><code>{{ $t('bot-social-friends-send-example-steamid') }}</code></li>
              <li><code>{{ $t('bot-social-friends-send-example-code') }}</code></li>
              <li><code>{{ $t('bot-social-friends-send-example-vanity') }}</code></li>
              <li><code>{{ $t('bot-social-friends-send-example-profiles') }}</code></li>
            </ul>
          </div>
        </div>
      </section>

      <section
        v-else-if="panelMode === 'groups'"
        class="friends-hub__compose"
        :aria-label="$t('bot-social-friends-groups-title')"
      >
        <div class="friends-hub__compose-panel">
          <header class="friends-hub__compose-header">
            <p class="friends-hub__compose-eyebrow">{{ $t('bot-social-friends-mode-groups') }}</p>
            <h3 class="friends-hub__compose-title">{{ $t('bot-social-friends-groups-title') }}</h3>
            <p class="friends-hub__compose-lead">{{ $t('bot-social-friends-groups-lead') }}</p>
          </header>

          <form class="friends-hub__compose-form" @submit.prevent="onJoinGroup">
            <label class="friends-hub__field-label" for="friends-group-target">
              {{ $t('bot-social-friends-groups-target-label') }}
            </label>
            <div class="friends-hub__compose-combo">
              <input
                id="friends-group-target"
                v-model.trim="groupTarget"
                class="friends-hub__compose-input"
                type="text"
                :placeholder="$t('bot-social-friends-groups-placeholder')"
                :disabled="mutating"
                autocomplete="off"
                spellcheck="false"
              >
              <button
                type="submit"
                class="friends-hub__compose-submit"
                :disabled="!groupTarget || mutating"
              >
                <FontAwesomeIcon v-if="mutating" icon="spinner" spin aria-hidden="true"></FontAwesomeIcon>
                <span v-else>{{ $t('bot-social-friends-groups-submit') }}</span>
              </button>
            </div>
          </form>

          <div class="friends-hub__compose-help" :aria-label="$t('bot-social-friends-groups-formats')">
            <p class="friends-hub__compose-help-title">{{ $t('bot-social-friends-groups-formats') }}</p>
            <ul class="friends-hub__compose-examples">
              <li><code>{{ $t('bot-social-friends-groups-example-url') }}</code></li>
              <li><code>{{ $t('bot-social-friends-groups-example-vanity') }}</code></li>
              <li><code>{{ $t('bot-social-friends-groups-example-gid') }}</code></li>
            </ul>
          </div>
        </div>
      </section>

      <template v-else>
        <section class="friends-hub__chrome" :aria-label="$t('bot-social-tab-friends')">
          <div class="friends-hub__chrome-bar">
            <div class="friends-hub__searchbox">
              <FontAwesomeIcon icon="search" class="friends-hub__search-icon" aria-hidden="true"></FontAwesomeIcon>
              <input
                v-model.trim="query"
                class="friends-hub__search-input"
                type="search"
                :placeholder="$t('bot-social-friends-search-placeholder')"
                :aria-label="$t('bot-social-friends-search-label')"
                autocomplete="off"
              >
            </div>

            <div class="friends-hub__chrome-actions">
              <span class="friends-hub__count">{{ countLabel }}</span>
              <button
                v-if="hasActiveFilters"
                type="button"
                class="friends-hub__clear"
                @click="clearFilters"
              >
                {{ $t('bot-social-friends-clear-filters') }}
              </button>
              <button
                type="button"
                class="friends-hub__refresh"
                :disabled="loading || refreshing || mutating"
                :title="$t('bot-social-refresh')"
                @click="refresh"
              >
                <FontAwesomeIcon :icon="refreshing ? 'spinner' : 'redo-alt'" :spin="refreshing"></FontAwesomeIcon>
                <span>{{ $t('bot-social-refresh') }}</span>
              </button>
            </div>
          </div>
        </section>

        <div v-if="loading && !hasAnyData" class="friends-hub__skeleton" aria-busy="true" :aria-label="$t('bot-social-loading')">
          <div v-for="n in 20" :key="n" class="friends-hub__skel-card"></div>
        </div>
        <div v-else-if="error && !hasAnyData" class="bot-social__state bot-social__state--error">{{ error }}</div>
        <template v-else>
          <p v-if="error" class="bot-social__inline-error">{{ error }}</p>
          <div v-if="!activeList.length" class="friends-hub__empty">
            <p>{{ emptyLabel }}</p>
          </div>
          <div v-else-if="!filteredList.length" class="friends-hub__empty">
            <p>{{ $t('bot-social-friends-search-empty') }}</p>
            <button type="button" class="button button--link" @click="clearFilters">
              {{ $t('bot-social-friends-clear-filters') }}
            </button>
          </div>
          <ul v-else class="friends-hub__grid" :class="{ 'is-refreshing': refreshing }">
            <li v-for="friend in pageList" :key="`${panelMode}-${friend.steamId}`" class="friends-hub__card-wrap">
              <article
                class="friends-hub__card"
                :class="{ 'is-blocked': isBlocked(friend) }"
              >
              <a
                class="friends-hub__avatar-link"
                :href="profileUrl(friend.steamId)"
                target="_blank"
                rel="noreferrer noopener"
                :aria-label="displayName(friend)"
                @click="onProfileClick(friend, $event)"
              >
                <img
                  v-if="friend.avatarUrl && !brokenAvatars[friend.steamId]"
                  class="friends-hub__avatar"
                  :src="friend.avatarUrl"
                  alt=""
                  width="40"
                  height="40"
                  loading="lazy"
                  decoding="async"
                  @error="onAvatarError(friend.steamId)"
                >
                <span v-else class="friends-hub__avatar friends-hub__avatar--fallback" aria-hidden="true">
                  {{ initials(friend) }}
                </span>
              </a>
              <div class="friends-hub__meta">
                <a
                  class="friends-hub__name"
                  :href="profileUrl(friend.steamId)"
                  target="_blank"
                  rel="noreferrer noopener"
                  @click="onProfileClick(friend, $event)"
                >{{ displayName(friend) }}</a>
                <span v-if="isBlocked(friend)" class="friends-hub__badge friends-hub__badge--blocked">
                  {{ $t('bot-social-friends-blocked') }}
                </span>
              </div>
              <div class="friends-hub__actions">
                <button
                  v-if="panelMode === 'received'"
                  type="button"
                  class="friends-hub__icon-btn friends-hub__icon-btn--accept"
                  :disabled="mutating"
                  :aria-label="$t('bot-social-friends-accept-aria', { name: displayName(friend) })"
                  :title="$t('bot-social-friends-accept')"
                  @click="askAction(friend, 'accept')"
                >
                  <FontAwesomeIcon icon="check-circle" aria-hidden="true"></FontAwesomeIcon>
                </button>
                <button
                  type="button"
                  class="friends-hub__icon-btn friends-hub__icon-btn--danger"
                  :disabled="mutating"
                  :aria-label="actionAria(friend)"
                  :title="actionLabel"
                  @click="askAction(friend, dangerActionMode)"
                >
                  <FontAwesomeIcon icon="trash" aria-hidden="true"></FontAwesomeIcon>
                </button>
              </div>
            </article>
          </li>
        </ul>

          <div v-if="totalPages > 1" class="friends-hub__pager">
            <button type="button" class="friends-hub__page-btn" :disabled="page <= 1" @click="page -= 1">
              <FontAwesomeIcon icon="chevron-left"></FontAwesomeIcon>
            </button>
            <span>{{ $t('bot-social-inventory-page', { current: page, total: totalPages }) }}</span>
            <button type="button" class="friends-hub__page-btn" :disabled="page >= totalPages" @click="page += 1">
              <FontAwesomeIcon icon="chevron-right"></FontAwesomeIcon>
            </button>
          </div>
        </template>
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
    addFriends, isPluginMissingError, joinGroups, removeFriends,
  } from '../api/bot-social';
  import { invalidateFriends, loadFriends } from '../cache/bot-social-queries';
  import { resolveLocalData } from '../cache/load-policy';
  import { normalizeFriendTarget } from '../utils/friend-target';
  import { isLikelyGroupTarget, normalizeGroupTarget } from '../utils/group-target';
  import PluginMissing from './PluginMissing.vue';
  import RemoveDialog from './friends/remove-dialog.vue';

  const PAGE_SIZE = 20;
  const STEAM_ID64_RE = /^[0-9]{17}$/;

  export default {
    name: 'BotSocialFriendsTab',
    components: { PluginMissing, RemoveDialog },
    props: {
      botName: { type: String, required: true },
      pluginMissing: { type: Boolean, default: false },
    },
    data() {
      return {
        panelMode: 'friends',
        loading: false,
        refreshing: false,
        mutating: false,
        error: '',
        friends: [],
        sentRequests: [],
        receivedRequests: [],
        addTarget: '',
        groupTarget: '',
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
        return this.displayName(this.pendingAction.friend);
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
    },
    methods: {
      setPanelMode(mode) {
        if (mode === this.panelMode) return;
        this.panelMode = mode;
      },
      resetView() {
        this.panelMode = 'friends';
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
      isBlocked(friend) {
        return String(friend.relationship || '').toLowerCase() === 'blocked';
      },
      displayName(friend) {
        const name = String(friend.name || '').trim();
        if (name && name !== friend.steamId) return name;
        return friend.steamId || '?';
      },
      profileUrl(steamId) {
        const id = String(steamId || '').trim();
        if (!STEAM_ID64_RE.test(id)) return 'https://steamcommunity.com/';
        return `https://steamcommunity.com/profiles/${id}`;
      },
      onProfileClick(friend, event) {
        if (!STEAM_ID64_RE.test(String(friend.steamId || ''))) {
          event.preventDefault();
          this.$error(this.$t('bot-social-friends-profile-invalid'));
        }
      },
      initials(friend) {
        return String(this.displayName(friend) || '?').trim().slice(0, 1).toUpperCase();
      },
      onAvatarError(steamId) {
        this.$set(this.brokenAvatars, steamId, true);
      },
      actionAria(friend) {
        const name = this.displayName(friend);
        if (this.panelMode === 'sent') return this.$t('bot-social-friends-cancel-request-aria', { name });
        if (this.panelMode === 'received') return this.$t('bot-social-friends-decline-aria', { name });
        return this.$t('bot-social-friends-remove-aria', { name });
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
          this.panelMode = 'sent';
        } catch (err) {
          if (isPluginMissingError(err)) this.$emit('plugin-missing');
          else this.$error(err.message || String(err));
        } finally {
          this.mutating = false;
        }
      },
      async onJoinGroup() {
        if (this.mutating) return;
        const target = normalizeGroupTarget(this.groupTarget);
        if (!isLikelyGroupTarget(this.groupTarget) || !target) {
          this.$error(this.$t('bot-social-friends-groups-invalid'));
          return;
        }
        this.mutating = true;
        try {
          // Prefer full URL when pasted so the plugin can resolve vanity reliably.
          const payloadTarget = /steamcommunity\.com\/(?:groups|gid)\//i.test(this.groupTarget)
            ? this.groupTarget.trim()
            : target;
          const payload = await joinGroups(this.botName, [payloadTarget]);
          const first = this.firstMutationResult(payload);
          if (!this.mutationSucceeded(first)) {
            const detail = first?.Message || first?.message || this.$t('bot-social-friends-groups-failed');
            this.$error(detail);
            return;
          }
          const detail = first?.Message || first?.message || '';
          this.$success(
            detail && detail !== 'OK'
              ? this.$t('bot-social-friends-groups-success-named', { detail: detail.replace(/^OK\s*—\s*/i, '') })
              : this.$t('bot-social-friends-groups-success'),
          );
          this.groupTarget = '';
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
