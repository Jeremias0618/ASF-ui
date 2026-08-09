<template>
  <section class="games-ach" :aria-label="$t('bot-social-games-ach-title')">
    <header class="games-ach__header">
      <button type="button" class="games-ach__back" @click="$emit('back')">
        <FontAwesomeIcon icon="chevron-left" aria-hidden="true"></FontAwesomeIcon>
        {{ $t('bot-social-games-ach-back') }}
      </button>
      <button
        type="button"
        class="games-ach__refresh"
        :disabled="loading || mutating"
        @click="reload(true)"
      >
        <FontAwesomeIcon v-if="loading || mutating" icon="spinner" spin></FontAwesomeIcon>
        <span v-else>{{ $t('bot-social-refresh') }}</span>
      </button>
    </header>

    <div v-if="loading && !detail" class="bot-social__state">
      <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
      <span>{{ $t('bot-social-loading') }}</span>
    </div>
    <div v-else-if="error && !detail" class="bot-social__state bot-social__state--error">{{ error }}</div>
    <template v-else-if="detail">
      <p v-if="error" class="bot-social__inline-error">{{ error }}</p>

      <div class="games-ach__hero">
        <img
          class="games-ach__hero-cover"
          :src="detail.headerImage"
          :alt="''"
          loading="lazy"
          @error="onHeroError"
        >
        <div class="games-ach__hero-meta">
          <h3 class="games-ach__name">{{ detail.name }}</h3>
          <p class="games-ach__appid">AppID {{ detail.appId }}</p>
          <p class="games-ach__progress">
            {{ $t('bot-social-games-ach-progress', { unlocked: detail.unlocked, total: detail.total }) }}
          </p>
          <span class="games-ach__bar" aria-hidden="true">
            <span class="games-ach__fill" :style="{ width: `${progressRatio * 100}%` }"></span>
          </span>
        </div>
      </div>

      <div class="games-ach__toolbar">
        <label class="games-ach__check-all">
          <input
            type="checkbox"
            :checked="allSelectableChecked"
            :indeterminate.prop="someSelectableChecked && !allSelectableChecked"
            :disabled="!selectable.length"
            @change="toggleSelectAll($event.target.checked)"
          >
          <span>{{ $t('bot-social-games-ach-select-all') }}</span>
        </label>
        <div class="games-ach__actions">
          <button
            type="button"
            class="games-ach__btn"
            :disabled="mutating || !selectedUnlockable.length"
            @click="unlockSelected"
          >
            {{ $t('bot-social-games-ach-unlock-selected') }}
          </button>
          <button
            type="button"
            class="games-ach__btn games-ach__btn--accent"
            :disabled="mutating || !lockedUnlockable.length"
            @click="unlockAll"
          >
            {{ $t('bot-social-games-ach-unlock-all') }}
          </button>
        </div>
      </div>

      <ul class="games-ach__list" :class="{ 'is-busy': mutating }">
        <li
          v-for="item in detail.achievements"
          :key="item.index"
          class="games-ach__row"
          :class="{
            'is-unlocked': item.unlocked,
            'is-restricted': item.restricted,
          }"
        >
          <label class="games-ach__pick">
            <input
              type="checkbox"
              :disabled="!item.unlockable || item.unlocked || mutating"
              :checked="selected.has(item.index)"
              @change="toggleIndex(item.index, $event.target.checked)"
            >
          </label>
          <img
            class="games-ach__icon"
            :src="item.iconUrl || placeholderIcon"
            :alt="''"
            loading="lazy"
            @error="onIconError($event)"
          >
          <div class="games-ach__body">
            <p class="games-ach__title">{{ item.name }}</p>
            <p class="games-ach__desc">{{ item.description || '—' }}</p>
            <p v-if="item.restricted" class="games-ach__note">{{ $t('bot-social-games-ach-restricted') }}</p>
          </div>
          <span class="games-ach__state">
            {{ item.unlocked ? $t('bot-social-games-ach-unlocked') : $t('bot-social-games-ach-locked') }}
          </span>
        </li>
      </ul>
    </template>
  </section>
</template>

<script>
  import {
    fetchGameAchievements,
    isPluginMissingError,
    unlockGameAchievements,
  } from '../../api/bot-social';
  import { invalidateGameStats } from '../../cache/bot-social-queries';

  function unwrapBot(payload, botName) {
    if (!payload || typeof payload !== 'object') return null;
    if (payload[botName] != null) return payload[botName];
    const key = Object.keys(payload).find(k => k.toLowerCase() === String(botName || '').toLowerCase());
    if (key != null) return payload[key];
    const keys = Object.keys(payload);
    return keys.length === 1 ? payload[keys[0]] : null;
  }

  export default {
    name: 'BotSocialGamesAchievementDetail',
    props: {
      botName: { type: String, required: true },
      appId: { type: [Number, String], required: true },
      seedName: { type: String, default: '' },
      seedHeader: { type: String, default: '' },
    },
    data() {
      return {
        loading: false,
        mutating: false,
        error: '',
        detail: null,
        selected: new Set(),
        placeholderIcon: 'data:image/svg+xml,' + encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect fill="#1b2838" width="64" height="64"/></svg>',
        ),
      };
    },
    computed: {
      progressRatio() {
        const total = Number(this.detail?.total) || 0;
        if (!total) return 0;
        return Math.min(1, Math.max(0, Number(this.detail.unlocked || 0) / total));
      },
      selectable() {
        return (this.detail?.achievements || []).filter(a => a.unlockable && !a.unlocked);
      },
      lockedUnlockable() {
        return this.selectable;
      },
      selectedUnlockable() {
        return this.selectable.filter(a => this.selected.has(a.index));
      },
      allSelectableChecked() {
        return this.selectable.length > 0
          && this.selectable.every(a => this.selected.has(a.index));
      },
      someSelectableChecked() {
        return this.selectable.some(a => this.selected.has(a.index));
      },
    },
    watch: {
      appId: {
        immediate: true,
        handler() {
          this.selected = new Set();
          this.reload(false);
        },
      },
    },
    methods: {
      onHeroError(event) {
        const img = event?.target;
        if (!img || img.dataset.fallback === '1') return;
        img.dataset.fallback = '1';
        img.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${this.appId}/capsule_231x87.jpg`;
      },
      onIconError(event) {
        const img = event?.target;
        if (img) img.src = this.placeholderIcon;
      },
      toggleIndex(index, checked) {
        const next = new Set(this.selected);
        if (checked) next.add(index);
        else next.delete(index);
        this.selected = next;
      },
      toggleSelectAll(checked) {
        this.selected = checked
          ? new Set(this.selectable.map(a => a.index))
          : new Set();
      },
      mapDetail(raw) {
        const achievements = (raw?.Achievements || raw?.achievements || []).map(item => ({
          index: Number(item.Index ?? item.index),
          apiName: item.ApiName ?? item.apiName ?? '',
          name: item.Name ?? item.name ?? '',
          description: item.Description ?? item.description ?? '',
          iconUrl: item.IconUrl ?? item.iconUrl ?? '',
          unlocked: !!(item.Unlocked ?? item.unlocked),
          restricted: !!(item.Restricted ?? item.restricted),
          unlockable: !!(item.Unlockable ?? item.unlockable),
        }));
        return {
          appId: Number(raw?.AppId ?? raw?.appId ?? this.appId),
          name: (raw?.Name ?? raw?.name ?? this.seedName) || `App ${this.appId}`,
          headerImage: (raw?.HeaderImage ?? raw?.headerImage)
            || this.seedHeader
            || `https://cdn.cloudflare.steamstatic.com/steam/apps/${this.appId}/header.jpg`,
          unlocked: Number(raw?.Unlocked ?? raw?.unlocked ?? 0),
          total: Number(raw?.Total ?? raw?.total ?? achievements.length),
          achievements,
        };
      },
      async reload(force) {
        this.loading = !this.detail || force;
        if (force) this.error = '';
        try {
          const payload = await fetchGameAchievements(this.botName, this.appId);
          this.detail = this.mapDetail(unwrapBot(payload, this.botName));
          this.error = '';
          // Drop selections that are no longer unlockable.
          this.selected = new Set(
            [...this.selected].filter(index => this.selectable.some(a => a.index === index)),
          );
        } catch (err) {
          if (isPluginMissingError(err)) {
            this.$emit('plugin-missing');
            return;
          }
          this.error = err.message || String(err);
          if (!this.detail) this.detail = null;
        } finally {
          this.loading = false;
        }
      },
      async runUnlock({ indices, all }) {
        if (this.mutating) return;
        this.mutating = true;
        this.error = '';
        try {
          const payload = await unlockGameAchievements(this.botName, this.appId, { indices, all });
          const result = unwrapBot(payload, this.botName);
          const ok = !!(result?.Success ?? result?.success);
          const message = result?.Message || result?.message || '';
          if (!ok) {
            this.$error(message || this.$t('bot-social-games-ach-failed'));
            return;
          }
          this.$success(message || this.$t('bot-social-games-ach-success'));
          invalidateGameStats(this.botName);
          this.selected = new Set();
          await this.reload(true);
          this.$emit('changed');
        } catch (err) {
          if (isPluginMissingError(err)) {
            this.$emit('plugin-missing');
            return;
          }
          this.$error(err.message || String(err));
        } finally {
          this.mutating = false;
        }
      },
      unlockSelected() {
        const indices = this.selectedUnlockable.map(a => a.index);
        if (!indices.length) return;
        this.runUnlock({ indices, all: false });
      },
      unlockAll() {
        if (!this.lockedUnlockable.length) return;
        this.runUnlock({ indices: [], all: true });
      },
    },
  };
</script>
