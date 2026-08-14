/**
 * Post-submit UI cooldown aligned with ASFBotSocial EndpointRateLimiter.
 * Use a duration slightly longer than the plugin limiter to avoid 429 spam.
 *
 * @param {number} cooldownMs
 */
export function createSubmitCooldownMixin(cooldownMs) {
  const ms = Math.max(0, Number(cooldownMs) || 0);

  return {
    data() {
      return {
        cooldownEndsAt: 0,
        nowMs: Date.now(),
        cooldownTick: null,
      };
    },
    computed: {
      cooldownSeconds() {
        return Math.max(0, Math.ceil((this.cooldownEndsAt - this.nowMs) / 1000));
      },
      submitLocked() {
        return Boolean(this.mutating) || this.cooldownSeconds > 0;
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
          if (this.cooldownEndsAt <= this.nowMs) this.stopCooldownTick();
        }, 250);
      },
      stopCooldownTick() {
        if (!this.cooldownTick) return;
        clearInterval(this.cooldownTick);
        this.cooldownTick = null;
      },
      armSubmitCooldown() {
        if (ms <= 0) return;
        this.cooldownEndsAt = Date.now() + ms;
        this.nowMs = Date.now();
        this.startCooldownTick();
      },
      resetSubmitCooldown() {
        this.cooldownEndsAt = 0;
        this.nowMs = Date.now();
        this.stopCooldownTick();
      },
    },
  };
}
