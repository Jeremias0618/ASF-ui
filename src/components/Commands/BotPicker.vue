<template>
  <div
    v-if="visible"
    class="commands-bot-picker"
    role="listbox"
    :aria-label="$t('commands-bot-picker-label')"
    @mousedown.prevent
  >
    <div class="commands-bot-picker__bar">
      <p class="commands-bot-picker__title">{{ $t('commands-bot-picker-title') }}</p>
      <p class="commands-bot-picker__hint">{{ $t('commands-bot-picker-hint') }}</p>
    </div>

    <p v-if="!options.length" class="commands-bot-picker__empty">
      {{ $t('commands-bot-picker-empty') }}
    </p>

    <ul v-else class="commands-bot-picker__list">
      <li
        v-for="(option, index) in options"
        :id="optionId(index)"
        :key="`${option.kind}:${option.name}`"
        class="commands-bot-picker__item"
        :class="{ 'is-active': index === activeIndex }"
        role="option"
        :aria-selected="index === activeIndex ? 'true' : 'false'"
        @mouseenter="$emit('highlight', index)"
      >
        <span class="commands-bot-picker__name">{{ option.name }}</span>
        <span class="commands-bot-picker__kind">
          {{ option.kind === 'group' ? $t('commands-bot-picker-group') : $t('commands-bot-picker-bot') }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script>
  export default {
    name: 'CommandsBotPicker',
    props: {
      visible: { type: Boolean, default: false },
      options: { type: Array, default: () => [] },
      activeIndex: { type: Number, default: 0 },
      listId: { type: String, default: 'commands-bot-picker-list' },
    },
    methods: {
      optionId(index) {
        return `${this.listId}-option-${index}`;
      },
    },
  };
</script>

<style lang="scss">
  .commands-bot-picker {
    background: #111827;
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: 0.65rem;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
    left: 1.35rem;
    max-width: min(28rem, calc(100% - 1.75rem));
    padding: 0.5rem;
    position: absolute;
    right: 0.75rem;
    top: calc(100% + 0.35rem);
    width: max-content;
    z-index: 5;
  }

  .commands-bot-picker__bar {
    display: grid;
    gap: 0.15rem;
    margin-bottom: 0.4rem;
    padding: 0 0.2rem;
  }

  .commands-bot-picker__title {
    color: #e2e8f0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    margin: 0;
    text-transform: uppercase;
  }

  .commands-bot-picker__hint,
  .commands-bot-picker__empty {
    color: #94a3b8;
    font-size: 0.7rem;
    margin: 0;
  }

  .commands-bot-picker__empty {
    padding: 0.35rem 0.2rem;
  }

  .commands-bot-picker__list {
    display: grid;
    gap: 0.2rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .commands-bot-picker__item {
    align-items: center;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0.45rem;
    color: #e2e8f0;
    display: flex;
    gap: 0.65rem;
    justify-content: space-between;
    padding: 0.42rem 0.5rem;
    transition: background 0.12s ease, border-color 0.12s ease;

    &.is-active {
      background: rgba(96, 165, 250, 0.14);
      border-color: rgba(96, 165, 250, 0.4);
    }
  }

  .commands-bot-picker__name {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.84rem;
    font-weight: 650;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .commands-bot-picker__kind {
    color: #94a3b8;
    flex-shrink: 0;
    font-size: 0.66rem;
    font-weight: 650;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .app--dark-mode .commands-bot-picker {
    background: #0a1220;
  }
</style>
