<template>
  <section class="games-discovery" :aria-label="$t('bot-social-games-discovery-title')">
    <div class="bot-social-games__chrome games-discovery">
      <header class="games-discovery__header">
        <p class="games-discovery__eyebrow">{{ $t('bot-social-games-view-discovery') }}</p>
        <h3 class="games-discovery__title">{{ $t('bot-social-games-discovery-title') }}</h3>
        <p class="games-discovery__lead">{{ $t('bot-social-games-discovery-lead') }}</p>
      </header>

      <div v-if="loading && !loaded" class="bot-social__state">
        <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
        <span>{{ $t('bot-social-loading') }}</span>
      </div>
      <div v-else-if="error && !loaded" class="bot-social__state bot-social__state--error">{{ error }}</div>

      <template v-else>
        <p v-if="error" class="bot-social__inline-error">{{ error }}</p>

        <div class="games-discovery__status" :class="statusClass" aria-live="polite">
          <div class="games-discovery__status-main">
            <span class="games-discovery__badge">{{ statusLabel }}</span>
            <p v-if="detail" class="games-discovery__detail">{{ detail }}</p>
            <p v-else class="games-discovery__detail games-discovery__detail--muted">
              {{ $t('bot-social-games-discovery-detail-empty') }}
            </p>
          </div>
        </div>

        <div class="games-discovery__actions">
          <div class="games-discovery__queues">
            <p class="games-discovery__queues-label" id="discovery-queues-label">
              {{ $t('bot-social-games-discovery-queues-label') }}
            </p>
            <div
              class="games-discovery__queues-row"
              role="radiogroup"
              aria-labelledby="discovery-queues-label"
            >
              <label
                v-for="opt in queueOptions"
                :key="opt.value"
                class="games-discovery__queue-chip"
                :class="{ 'is-on': queues === opt.value }"
              >
                <input
                  v-model.number="queues"
                  type="radio"
                  name="discovery-queues"
                  :value="opt.value"
                  :disabled="exploring || exploreCooldownSec > 0"
                >
                <span>{{ opt.label }}</span>
              </label>
            </div>
          </div>

          <button
            type="button"
            class="button games-discovery__run"
            :disabled="exploring || loading || exploreCooldownSec > 0"
            @click="explore"
          >
            <FontAwesomeIcon v-if="exploring" icon="spinner" spin></FontAwesomeIcon>
            <template v-else-if="exploreCooldownSec > 0">
              <span>{{ $t('bot-social-community-submit-cooldown', { s: exploreCooldownSec }) }}</span>
            </template>
            <template v-else>
              <FontAwesomeIcon icon="compass" aria-hidden="true"></FontAwesomeIcon>
              <span>{{ exploreLabel }}</span>
            </template>
          </button>
        </div>

        <p class="games-discovery__hint">{{ $t('bot-social-games-discovery-hint') }}</p>

        <p v-if="lastResult" class="games-discovery__result" :class="{ 'is-ok': lastOk, 'is-fail': !lastOk }">
          {{ lastResult }}
        </p>
      </template>
    </div>
  </section>
</template>

<script>
  import {
    exploreDiscoveryQueue,
    fetchDiscoveryQueueStatus,
    isPluginMissingError,
  } from '../../api/bot-social';

  /** UI ≥ DiscoveryQueueExploreLimiter (8s). */
  const EXPLORE_COOLDOWN_MS = 9000;

  function pickEntry(payload, botName) {
    if (!payload || typeof payload !== 'object') return null;
    if (payload[botName]) return payload[botName];
    const keys = Object.keys(payload);
    return keys.length === 1 ? payload[keys[0]] : null;
  }

  function readFlag(entry, pascal, camel) {
    if (!entry || typeof entry !== 'object') return undefined;
    if (Object.prototype.hasOwnProperty.call(entry, pascal)) return entry[pascal];
    if (Object.prototype.hasOwnProperty.call(entry, camel)) return entry[camel];
    return undefined;
  }

  export default {
    name: 'GamesDiscoveryPanel',
    props: {
      botName: { type: String, required: true },
    },
    data() {
      return {
        loading: false,
        exploring: false,
        loaded: false,
        error: '',
        available: false,
        completedToday: false,
        detail: '',
        queues: 1,
        lastResult: '',
        lastOk: false,
        exploreCooldownEndsAt: 0,
        nowMs: Date.now(),
        cooldownTick: null,
      };
    },
    computed: {
      exploreCooldownSec() {
        return Math.max(0, Math.ceil((this.exploreCooldownEndsAt - this.nowMs) / 1000));
      },
      queueOptions() {
        return [
          { value: 1, label: this.$t('bot-social-games-discovery-queues-one') },
          { value: 2, label: this.$t('bot-social-games-discovery-queues-two') },
          { value: 3, label: this.$t('bot-social-games-discovery-queues-three') },
        ];
      },
      statusClass() {
        if (this.completedToday) return 'is-done';
        if (this.available) return 'is-ready';
        return 'is-unknown';
      },
      statusLabel() {
        if (this.completedToday) return this.$t('bot-social-games-discovery-status-done');
        if (this.available) return this.$t('bot-social-games-discovery-status-ready');
        return this.$t('bot-social-games-discovery-status-unknown');
      },
      exploreLabel() {
        return this.completedToday
          ? this.$t('bot-social-games-discovery-run-again')
          : this.$t('bot-social-games-discovery-run');
      },
    },
    watch: {
      botName: {
        immediate: true,
        handler() {
          this.exploreCooldownEndsAt = 0;
          this.refresh();
        },
      },
    },
    beforeDestroy() {
      this.stopCooldownTick();
    },
    methods: {
      startCooldownTick() {
        if (this.cooldownTick) return;
        this.cooldownTick = setInterval(() => {
          this.nowMs = Date.now();
          if (this.exploreCooldownEndsAt <= this.nowMs) this.stopCooldownTick();
        }, 250);
      },
      stopCooldownTick() {
        if (!this.cooldownTick) return;
        clearInterval(this.cooldownTick);
        this.cooldownTick = null;
      },
      armExploreCooldown() {
        this.exploreCooldownEndsAt = Date.now() + EXPLORE_COOLDOWN_MS;
        this.nowMs = Date.now();
        this.startCooldownTick();
      },
      async refresh() {
        if (this.loading || this.exploring) return;
        this.loading = true;
        this.error = '';
        try {
          const payload = await fetchDiscoveryQueueStatus(this.botName);
          const entry = pickEntry(payload, this.botName);
          this.available = !!readFlag(entry, 'Available', 'available');
          this.completedToday = !!readFlag(entry, 'CompletedToday', 'completedToday');
          this.detail = String(readFlag(entry, 'Detail', 'detail') || '');
          this.loaded = true;
        } catch (err) {
          if (isPluginMissingError(err)) this.$emit('plugin-missing');
          this.error = (err && err.message) || String(err);
          if (!this.loaded) this.loaded = true;
        } finally {
          this.loading = false;
        }
      },
      async explore() {
        if (this.exploring || this.loading || this.exploreCooldownSec > 0) return;
        this.exploring = true;
        this.error = '';
        this.lastResult = '';
        try {
          const payload = await exploreDiscoveryQueue(this.botName, this.queues);
          const entry = pickEntry(payload, this.botName);
          const ok = !!readFlag(entry, 'Success', 'success');
          const message = String(readFlag(entry, 'Message', 'message') || '');
          const apps = Number(readFlag(entry, 'AppsCleared', 'appsCleared') || 0);
          const doneQueues = Number(readFlag(entry, 'QueuesCompleted', 'queuesCompleted') || 0);
          this.lastOk = ok;
          this.lastResult = ok
            ? this.$t('bot-social-games-discovery-success', { apps, queues: doneQueues })
            : (message || this.$t('bot-social-games-discovery-failed'));
          if (ok) this.$success(this.lastResult);
          else this.$error(this.lastResult);
          await this.refresh();
        } catch (err) {
          if (isPluginMissingError(err)) this.$emit('plugin-missing');
          this.lastOk = false;
          this.lastResult = (err && err.message) || this.$t('bot-social-games-discovery-failed');
          this.$error(this.lastResult);
        } finally {
          this.exploring = false;
          this.armExploreCooldown();
        }
      },
    },
  };
</script>
