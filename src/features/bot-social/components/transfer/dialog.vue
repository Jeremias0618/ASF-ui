<template>
  <div
    v-if="open"
    class="steam-inv-transfer"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
  >
    <button type="button" class="steam-inv-transfer__backdrop" :aria-label="$t('cancel')" @click="onCancel"></button>
    <div class="steam-inv-transfer__panel">
      <h3 :id="titleId" class="steam-inv-transfer__title">{{ $t('bot-social-inventory-transfer-title') }}</h3>
      <p class="steam-inv-transfer__lead">
        {{ $t('bot-social-inventory-transfer-lead', { n: assetIds.length, bot: sourceBotName }) }}
      </p>

      <div class="steam-inv-transfer__field">
        <span id="inv-transfer-target-label" class="steam-inv-transfer__label">{{ $t('bot-social-inventory-transfer-target') }}</span>
        <AsfSelect
          v-model="targetBotName"
          searchable
          compact
          aria-labelledby="inv-transfer-target-label"
          :disabled="submitting || !targetOptions.length"
          :options="targetOptions"
          :placeholder="$t('bot-social-inventory-transfer-target-placeholder')"
          :search-placeholder="$t('bot-social-inventory-filter-search-options')"
        ></AsfSelect>
      </div>

      <p v-if="!targetOptions.length" class="steam-inv-transfer__warn">
        {{ $t('bot-social-inventory-transfer-no-targets') }}
      </p>
      <p class="steam-inv-transfer__hint">{{ $t('bot-social-inventory-transfer-hint') }}</p>

      <div class="steam-inv-transfer__actions">
        <button type="button" class="button" :disabled="submitting" @click="onCancel">
          {{ $t('cancel') }}
        </button>
        <button
          type="button"
          class="button button--confirm"
          :disabled="!canSubmit"
          @click="onConfirm"
        >
          <FontAwesomeIcon v-if="submitting" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ $t('bot-social-inventory-transfer-confirm') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
  let dialogUid = 0;

  export default {
    name: 'InventoryTransferDialog',
    props: {
      open: { type: Boolean, default: false },
      sourceBotName: { type: String, required: true },
      assetIds: { type: Array, default: () => [] },
      submitting: { type: Boolean, default: false },
    },
    data() {
      dialogUid += 1;
      return {
        targetBotName: '',
        titleId: `inv-transfer-title-${dialogUid}`,
      };
    },
    computed: {
      farmBots() {
        return this.$store.getters['bots/bots'] || [];
      },
      targetOptions() {
        const source = String(this.sourceBotName || '').toLowerCase();
        return this.farmBots
          .filter(bot => bot.isConnected && String(bot.name).toLowerCase() !== source)
          .map(bot => ({
            value: bot.name,
            label: `${bot.viewableName}${bot.name !== bot.viewableName ? ` (${bot.name})` : ''} · ${bot.statusText}`,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
      },
      canSubmit() {
        return Boolean(this.targetBotName) && this.assetIds.length > 0 && !this.submitting && this.targetOptions.length > 0;
      },
    },
    watch: {
      open(isOpen) {
        if (!isOpen) {
          this.targetBotName = '';
          return;
        }
        if (this.targetOptions.length === 1) {
          this.targetBotName = this.targetOptions[0].value;
        }
      },
      targetOptions(options) {
        if (!this.open) return;
        if (this.targetBotName && options.some(o => o.value === this.targetBotName)) return;
        this.targetBotName = options.length === 1 ? options[0].value : '';
      },
    },
    methods: {
      onCancel() {
        if (this.submitting) return;
        this.$emit('cancel');
      },
      onConfirm() {
        if (!this.canSubmit) return;
        this.$emit('confirm', { targetBotName: this.targetBotName });
      },
    },
  };
</script>
