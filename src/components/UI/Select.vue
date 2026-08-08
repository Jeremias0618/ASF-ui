<template>
  <div
    ref="root"
    class="asf-select"
    :class="{
      'is-open': open,
      'is-disabled': disabled,
      'is-placeholder': !hasValue,
    }"
  >
    <button
      :id="id || undefined"
      ref="trigger"
      type="button"
      class="asf-select__trigger"
      :disabled="disabled"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-labelledby="ariaLabelledby || undefined"
      aria-haspopup="listbox"
      :aria-controls="listId"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <span class="asf-select__value">{{ displayLabel }}</span>
      <FontAwesomeIcon class="asf-select__chevron" icon="angle-down" aria-hidden="true"></FontAwesomeIcon>
    </button>

    <transition name="asf-select">
      <ul
        v-if="open"
        :id="listId"
        ref="menu"
        class="asf-select__menu"
        role="listbox"
        :aria-activedescendant="activeOptionId"
        tabindex="-1"
        @keydown="onMenuKeydown"
      >
        <li
          v-for="(option, index) in normalizedOptions"
          :id="optionId(index)"
          :key="option.key"
          class="asf-select__option"
          :class="{
            'is-selected': isSelected(option),
            'is-active': index === activeIndex,
          }"
          role="option"
          :aria-selected="isSelected(option) ? 'true' : 'false'"
          @click="selectOption(option)"
          @mouseenter="activeIndex = index"
        >
          {{ option.label }}
        </li>
      </ul>
    </transition>
  </div>
</template>

<script>
  let selectUid = 0;

  export default {
    name: 'AsfSelect',
    model: {
      prop: 'value',
      event: 'input',
    },
    props: {
      value: {
        default: null,
      },
      options: {
        type: Array,
        default: () => [],
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      placeholder: {
        type: String,
        default: '',
      },
      id: {
        type: String,
        default: '',
      },
      ariaLabelledby: {
        type: String,
        default: '',
      },
    },
    data() {
      selectUid += 1;
      return {
        open: false,
        activeIndex: -1,
        instanceId: selectUid,
      };
    },
    computed: {
      listId() {
        return `asf-select-list-${this.instanceId}`;
      },
      normalizedOptions() {
        return (this.options || []).map((option, index) => {
          if (option && typeof option === 'object' && !Array.isArray(option)) {
            return {
              key: `${index}-${option.value}`,
              value: option.value,
              label: option.label != null ? String(option.label) : String(option.value),
            };
          }
          return {
            key: `${index}-${option}`,
            value: option,
            label: String(option),
          };
        });
      },
      hasValue() {
        return this.normalizedOptions.some(option => this.isSelected(option));
      },
      displayLabel() {
        const selected = this.normalizedOptions.find(option => this.isSelected(option));
        if (selected) return selected.label;
        return this.placeholder || this.$t('input-select-enum-value');
      },
      activeOptionId() {
        if (this.activeIndex < 0) return undefined;
        return this.optionId(this.activeIndex);
      },
    },
    watch: {
      open(isOpen) {
        if (isOpen) {
          this.activeIndex = Math.max(0, this.normalizedOptions.findIndex(option => this.isSelected(option)));
          this.$nextTick(() => {
            document.addEventListener('click', this.onDocumentClick, true);
            document.addEventListener('keydown', this.onDocumentKeydown, true);
            this.scrollActiveIntoView();
          });
        } else {
          this.unbindListeners();
        }
      },
    },
    beforeDestroy() {
      this.unbindListeners();
    },
    methods: {
      optionId(index) {
        return `asf-select-option-${this.instanceId}-${index}`;
      },
      isSelected(option) {
        return option.value === this.value;
      },
      toggle() {
        if (this.disabled) return;
        this.open = !this.open;
      },
      close() {
        this.open = false;
      },
      selectOption(option) {
        this.$emit('input', option.value);
        this.$emit('change', option.value);
        this.close();
        this.$nextTick(() => {
          if (this.$refs.trigger) this.$refs.trigger.focus();
        });
      },
      onDocumentClick(event) {
        if (!this.$refs.root || this.$refs.root.contains(event.target)) return;
        this.close();
      },
      onDocumentKeydown(event) {
        if (event.key === 'Escape') {
          event.stopImmediatePropagation();
          event.preventDefault();
          this.close();
          if (this.$refs.trigger) this.$refs.trigger.focus();
        }
      },
      unbindListeners() {
        document.removeEventListener('click', this.onDocumentClick, true);
        document.removeEventListener('keydown', this.onDocumentKeydown, true);
      },
      onTriggerKeydown(event) {
        if (this.disabled) return;

        switch (event.key) {
          case 'ArrowDown':
          case 'ArrowUp':
          case 'Enter':
          case ' ':
            event.preventDefault();
            if (!this.open) this.open = true;
            break;
          case 'Escape':
            if (this.open) {
              event.preventDefault();
              this.close();
            }
            break;
          default:
            break;
        }
      },
      onMenuKeydown(event) {
        const total = this.normalizedOptions.length;
        if (!total) return;

        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            this.activeIndex = (this.activeIndex + 1) % total;
            this.scrollActiveIntoView();
            break;
          case 'ArrowUp':
            event.preventDefault();
            this.activeIndex = (this.activeIndex - 1 + total) % total;
            this.scrollActiveIntoView();
            break;
          case 'Home':
            event.preventDefault();
            this.activeIndex = 0;
            this.scrollActiveIntoView();
            break;
          case 'End':
            event.preventDefault();
            this.activeIndex = total - 1;
            this.scrollActiveIntoView();
            break;
          case 'Enter':
          case ' ':
            event.preventDefault();
            if (this.activeIndex >= 0) this.selectOption(this.normalizedOptions[this.activeIndex]);
            break;
          case 'Escape':
            event.preventDefault();
            this.close();
            if (this.$refs.trigger) this.$refs.trigger.focus();
            break;
          case 'Tab':
            this.close();
            break;
          default:
            break;
        }
      },
      scrollActiveIntoView() {
        const menu = this.$refs.menu;
        if (!menu || this.activeIndex < 0) return;
        const option = menu.children[this.activeIndex];
        if (option && option.scrollIntoView) {
          option.scrollIntoView({ block: 'nearest' });
        }
      },
    },
  };
</script>

<style lang="scss">
  .asf-select {
    position: relative;
    width: 100%;
  }

  .asf-select__trigger {
    align-items: center;
    appearance: none;
    background: var(--h2-field, var(--h2-soft, var(--color-background-light, #fff)));
    border: 1px solid var(--h2-border, rgba(0, 0, 0, 0.12));
    border-radius: 0.55rem;
    box-sizing: border-box;
    color: var(--h2-ink, inherit);
    cursor: pointer;
    display: flex;
    font: inherit;
    gap: 0.65rem;
    justify-content: space-between;
    min-height: 2.75rem;
    padding: 0.45rem 0.8rem;
    text-align: left;
    transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
    width: 100%;

    .app--dark-mode & {
      background: var(--h2-field, #334155);
      border-color: rgba(255, 255, 255, 0.18);
      color: #f8fafc;
    }

    &:hover:not(:disabled) {
      border-color: color-mix(in srgb, var(--h2-brand, var(--color-theme)) 55%, var(--h2-border, #ccc));
    }

    &:focus-visible {
      border-color: var(--h2-brand, var(--color-theme));
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--h2-brand, var(--color-theme)) 28%, transparent);
      outline: none;
    }

    .asf-select.is-open & {
      border-color: var(--h2-brand, var(--color-theme));
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--h2-brand, var(--color-theme)) 22%, transparent);
    }

    .asf-select.is-disabled & {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .asf-select.is-placeholder & {
      color: var(--h2-muted, var(--color-text-disabled));

      .app--dark-mode & {
        color: #cbd5e1;
      }
    }
  }

  .asf-select__value {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .asf-select__chevron {
    color: var(--h2-muted, var(--color-text-disabled));
    flex-shrink: 0;
    font-size: 0.85rem;
    transition: transform 0.18s ease;

    .asf-select.is-open & {
      transform: rotate(180deg);
    }
  }

  .asf-select__menu {
    background: var(--h2-shell, var(--color-background-modal));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 0.65rem;
    box-shadow: 0 16px 36px -14px rgba(16, 24, 40, 0.45);
    box-sizing: border-box;
    left: 0;
    list-style: none;
    margin: 0.35rem 0 0;
    max-height: min(16rem, 45vh);
    overflow: auto;
    overscroll-behavior: contain;
    padding: 0.35rem;
    position: absolute;
    right: 0;
    top: 100%;
    z-index: 40;
    -webkit-overflow-scrolling: touch;

    .app--dark-mode & {
      background: var(--h2-elevated, #151b28);
      box-shadow: 0 18px 40px -14px rgba(0, 0, 0, 0.6);
    }
  }

  .asf-select__option {
    border-radius: 0.45rem;
    color: var(--h2-ink, inherit);
    cursor: pointer;
    font-size: 0.9rem;
    line-height: 1.35;
    padding: 0.55rem 0.7rem;

    &.is-active {
      background: var(--h2-soft, rgba(0, 0, 0, 0.06));
    }

    &.is-selected {
      background: var(--h2-brand-50, rgba(14, 165, 233, 0.14));
      color: var(--h2-brand-600, var(--color-theme));
      font-weight: 600;
    }

    &.is-selected.is-active {
      background: color-mix(in srgb, var(--h2-brand, var(--color-theme)) 22%, transparent);
    }
  }

  .asf-select-enter-active,
  .asf-select-leave-active {
    transition: opacity 0.14s ease, transform 0.14s ease;
  }

  .asf-select-enter,
  .asf-select-leave-to {
    opacity: 0;
    transform: translateY(-0.25rem);
  }

  @media (prefers-reduced-motion: reduce) {
    .asf-select__chevron,
    .asf-select-enter-active,
    .asf-select-leave-active {
      transition: none;
    }
  }

  @media screen and (max-width: 480px) {
    .asf-select__menu {
      max-height: min(14rem, 40vh);
    }

    .asf-select__option {
      padding: 0.65rem 0.75rem;
    }
  }
</style>
