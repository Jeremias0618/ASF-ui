<template>
  <div
    ref="root"
    class="asf-select"
    :class="{
      'is-open': open,
      'is-disabled': disabled,
      'is-placeholder': !hasValue && !open,
      'is-searchable': searchable,
      'is-compact': compact,
    }"
  >
    <div
      class="asf-select__trigger"
      :class="{ 'asf-select__trigger--input': searchable }"
      @click="onTriggerClick"
    >
      <input
        v-if="searchable"
        :id="id || undefined"
        ref="search"
        class="asf-select__inline-input"
        type="text"
        :value="triggerText"
        :disabled="disabled"
        :placeholder="inlinePlaceholder"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-labelledby="ariaLabelledby || undefined"
        aria-haspopup="listbox"
        :aria-controls="listId"
        autocomplete="off"
        role="combobox"
        @input="onInlineInput"
        @focus="onInlineFocus"
        @keydown="onInlineKeydown"
      >
      <button
        v-else
        :id="id || undefined"
        ref="trigger"
        type="button"
        class="asf-select__button"
        :disabled="disabled"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-labelledby="ariaLabelledby || undefined"
        aria-haspopup="listbox"
        :aria-controls="listId"
        @click.stop="toggle"
        @keydown="onTriggerKeydown"
      >
        <span class="asf-select__value">{{ displayLabel }}</span>
      </button>

      <button
        type="button"
        class="asf-select__chevron-btn"
        :disabled="disabled"
        :aria-label="chevronAriaLabel"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-controls="listId"
        tabindex="-1"
        @click.stop="onChevronClick"
      >
        <FontAwesomeIcon class="asf-select__chevron" icon="angle-down" aria-hidden="true"></FontAwesomeIcon>
      </button>
    </div>

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
          v-if="!visibleOptions.length"
          class="asf-select__empty"
          role="presentation"
        >
          {{ $t('input-select-no-options') }}
        </li>
        <li
          v-for="(option, index) in visibleOptions"
          :id="optionId(index)"
          :key="option.key"
          class="asf-select__option"
          :class="{
            'is-selected': isSelected(option),
            'is-active': index === activeIndex,
          }"
          role="option"
          :aria-selected="isSelected(option) ? 'true' : 'false'"
          @mousedown.prevent="selectOption(option)"
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
      searchable: {
        type: Boolean,
        default: false,
      },
      searchPlaceholder: {
        type: String,
        default: '',
      },
      compact: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      selectUid += 1;
      return {
        open: false,
        activeIndex: -1,
        instanceId: selectUid,
        searchQuery: '',
      };
    },
    computed: {
      listId() {
        return `asf-select-list-${this.instanceId}`;
      },
      searchPlaceholderText() {
        return this.searchPlaceholder || this.$t('input-select-search-options');
      },
      inlinePlaceholder() {
        // While open with empty query, keep showing the current selection so the
        // control does not look like it lost its value ("Filtrar opciones...").
        if (this.open && !this.searchQuery && this.hasValue) return this.displayLabel;
        if (this.open) return this.searchPlaceholderText;
        return this.displayLabel || this.placeholder || this.searchPlaceholderText;
      },
      triggerText() {
        // While open/searching, show what the user types; otherwise show selected label.
        if (this.open) return this.searchQuery;
        return this.displayLabel;
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
      visibleOptions() {
        const q = this.searchQuery.trim().toLowerCase();
        if (!this.searchable || !q) return this.normalizedOptions;
        return this.normalizedOptions.filter(option => option.label.toLowerCase().includes(q));
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
        if (this.activeIndex < 0 || !this.visibleOptions[this.activeIndex]) return undefined;
        return this.optionId(this.activeIndex);
      },
      chevronAriaLabel() {
        return this.open
          ? this.$t('input-select-collapse')
          : this.$t('input-select-expand');
      },
    },
    watch: {
      open(isOpen) {
        if (isOpen) {
          this.activeIndex = Math.max(0, this.visibleOptions.findIndex(option => this.isSelected(option)));
          this.$nextTick(() => {
            document.addEventListener('mousedown', this.onDocumentPointer, true);
            document.addEventListener('keydown', this.onDocumentKeydown, true);
            if (this.searchable && this.$refs.search) {
              this.$refs.search.focus();
            }
            this.scrollActiveIntoView();
          });
        } else {
          this.searchQuery = '';
          this.unbindListeners();
        }
      },
      searchQuery() {
        if (!this.open) return;
        this.activeIndex = this.visibleOptions.length ? 0 : -1;
        this.$nextTick(() => this.scrollActiveIntoView());
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
      openSelect() {
        if (this.disabled || this.open) return;
        this.open = true;
      },
      close() {
        this.open = false;
      },
      onChevronClick() {
        if (this.disabled) return;
        if (this.open) {
          this.close();
          this.$nextTick(() => {
            if (this.searchable && this.$refs.search) this.$refs.search.blur();
            else if (this.$refs.trigger) this.$refs.trigger.focus();
          });
          return;
        }
        this.openSelect();
        this.$nextTick(() => {
          if (this.searchable && this.$refs.search) this.$refs.search.focus();
          else if (this.$refs.trigger) this.$refs.trigger.focus();
        });
      },
      onTriggerClick(event) {
        if (this.disabled) return;
        // Chevron has its own handler; ignore bubbled clicks.
        if (event?.target?.closest?.('.asf-select__chevron-btn')) return;
        if (this.searchable) {
          // Field click opens for typing; closing is via chevron, option, Escape, or outside.
          this.openSelect();
          this.$nextTick(() => this.$refs.search?.focus());
          return;
        }
        // Non-searchable: value button uses @click.stop="toggle"; padding still toggles here.
        this.toggle();
      },
      onInlineFocus() {
        this.openSelect();
      },
      onInlineInput(event) {
        this.searchQuery = event.target.value;
        if (!this.open) this.open = true;
      },
      onInlineKeydown(event) {
        switch (event.key) {
          case 'ArrowDown':
          case 'ArrowUp':
          case 'Enter':
          case 'Escape':
          case 'Home':
          case 'End':
            this.onMenuKeydown(event);
            break;
          case 'Tab':
            this.close();
            break;
          default:
            break;
        }
      },
      selectOption(option) {
        this.$emit('input', option.value);
        this.$emit('change', option.value);
        this.searchQuery = '';
        this.close();
        this.$nextTick(() => {
          if (this.searchable && this.$refs.search) this.$refs.search.blur();
          else if (this.$refs.trigger) this.$refs.trigger.focus();
        });
      },
      onDocumentPointer(event) {
        if (!this.$refs.root || this.$refs.root.contains(event.target)) return;
        this.close();
      },
      onDocumentKeydown(event) {
        if (event.key === 'Escape') {
          event.stopImmediatePropagation();
          event.preventDefault();
          this.close();
          if (this.searchable && this.$refs.search) this.$refs.search.blur();
          else if (this.$refs.trigger) this.$refs.trigger.focus();
        }
      },
      unbindListeners() {
        document.removeEventListener('mousedown', this.onDocumentPointer, true);
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
        const total = this.visibleOptions.length;

        switch (event.key) {
          case 'ArrowDown':
            if (!total) return;
            event.preventDefault();
            this.activeIndex = (this.activeIndex + 1) % total;
            this.scrollActiveIntoView();
            break;
          case 'ArrowUp':
            if (!total) return;
            event.preventDefault();
            this.activeIndex = (this.activeIndex - 1 + total) % total;
            this.scrollActiveIntoView();
            break;
          case 'Home':
            if (!total) return;
            event.preventDefault();
            this.activeIndex = 0;
            this.scrollActiveIntoView();
            break;
          case 'End':
            if (!total) return;
            event.preventDefault();
            this.activeIndex = total - 1;
            this.scrollActiveIntoView();
            break;
          case 'Enter':
            event.preventDefault();
            if (this.activeIndex >= 0 && this.visibleOptions[this.activeIndex]) {
              this.selectOption(this.visibleOptions[this.activeIndex]);
            }
            break;
          case ' ':
            if (this.searchable) return;
            event.preventDefault();
            if (this.activeIndex >= 0 && this.visibleOptions[this.activeIndex]) {
              this.selectOption(this.visibleOptions[this.activeIndex]);
            }
            break;
          case 'Escape':
            event.preventDefault();
            this.close();
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
        const option = menu.querySelector(`#${this.optionId(this.activeIndex)}`);
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
    background: var(--h2-field, var(--h2-soft, var(--color-background-light, #fff)));
    border: 1px solid var(--h2-border, rgba(0, 0, 0, 0.12));
    border-radius: 0.55rem;
    box-sizing: border-box;
    color: var(--h2-ink, inherit);
    cursor: pointer;
    display: flex;
    font: inherit;
    gap: 0.5rem;
    justify-content: space-between;
    min-height: 2.75rem;
    padding: 0.35rem 0.7rem;
    text-align: left;
    transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
    width: 100%;

    .app--dark-mode & {
      background: var(--h2-field, #334155);
      border-color: rgba(255, 255, 255, 0.18);
      color: #f8fafc;
    }

    &:hover {
      border-color: color-mix(in srgb, var(--h2-brand, var(--color-theme)) 55%, var(--h2-border, #ccc));
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

    .asf-select.is-compact & {
      border-radius: 0.4rem;
      min-height: 2rem;
      padding: 0.15rem 0.55rem;
    }
  }

  .asf-select__button {
    appearance: none;
    background: transparent;
    border: 0;
    color: inherit;
    cursor: inherit;
    display: flex;
    flex: 1 1 auto;
    font: inherit;
    min-width: 0;
    padding: 0;
    text-align: left;
  }

  .asf-select__inline-input {
    appearance: none;
    background: transparent;
    border: 0;
    color: inherit;
    flex: 1 1 auto;
    font: inherit;
    font-size: 0.88rem;
    min-width: 0;
    outline: none;
    padding: 0;
    width: 100%;

    .asf-select.is-compact & {
      font-size: 0.82rem;
    }

    &::placeholder {
      color: var(--h2-muted, var(--color-text-disabled));
    }
  }

  .asf-select__value {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .asf-select__chevron-btn {
    appearance: none;
    align-items: center;
    background: transparent;
    border: 0;
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    justify-content: center;
    margin: 0;
    padding: 0.15rem;
    border-radius: 0.25rem;

    &:disabled {
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: 2px solid var(--h2-brand, var(--color-theme));
      outline-offset: 1px;
    }

    .asf-select.is-disabled & {
      cursor: not-allowed;
    }
  }

  .asf-select__chevron {
    color: var(--h2-muted, var(--color-text-disabled));
    flex-shrink: 0;
    font-size: 0.8rem;
    pointer-events: none;
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
    margin: 0.3rem 0 0;
    max-height: min(14rem, 42vh);
    overflow: auto;
    overscroll-behavior: contain;
    padding: 0.3rem;
    position: absolute;
    right: 0;
    top: 100%;
    z-index: 40;
    -webkit-overflow-scrolling: touch;

    .app--dark-mode & {
      background: var(--h2-elevated, #151b28);
      box-shadow: 0 18px 40px -14px rgba(0, 0, 0, 0.6);
    }

    .asf-select.is-compact & {
      border-radius: 0.45rem;
      margin-top: 0.25rem;
      max-height: min(12rem, 38vh);
      padding: 0.25rem;
    }
  }

  .asf-select__empty {
    color: var(--h2-muted, var(--color-text-disabled));
    font-size: 0.82rem;
    padding: 0.5rem 0.6rem;
  }

  .asf-select__option {
    border-radius: 0.4rem;
    color: var(--h2-ink, inherit);
    cursor: pointer;
    font-size: 0.88rem;
    line-height: 1.3;
    padding: 0.5rem 0.65rem;

    .asf-select.is-compact & {
      font-size: 0.82rem;
      padding: 0.38rem 0.55rem;
    }

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
</style>
