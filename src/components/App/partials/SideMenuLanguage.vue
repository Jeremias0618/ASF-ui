<template>
  <section class="side-menu__section side-menu__section--language" aria-labelledby="side-menu-language-label">
    <div id="side-menu-language-label" class="side-menu__category">
      <span class="side-menu__category-icon" aria-hidden="true">
        <FontAwesomeIcon icon="language" fixedWidth></FontAwesomeIcon>
      </span>
      <div class="side-menu__category-text">
        <p class="side-menu__category-title">{{ $t('sidebar-language') }}</p>
        <p class="side-menu__category-help">{{ $t('sidebar-language-help') }}</p>
      </div>
    </div>

    <div
      class="side-menu__locale"
      :class="{ 'is-open': open, 'is-searching': isSearching }"
    >
      <label class="side-menu__locale-field" :for="inputId">
        <span class="side-menu__locale-selected" aria-hidden="true">
          <Flag :key="currentLocale" :country="getFlagCountry(currentLocale)"></Flag>
        </span>

        <input
          :id="inputId"
          ref="input"
          v-model="query"
          type="search"
          class="side-menu__locale-input"
          autocomplete="off"
          spellcheck="false"
          role="combobox"
          :aria-expanded="open ? 'true' : 'false'"
          aria-autocomplete="list"
          :aria-controls="listId"
          :aria-activedescendant="activeOptionId"
          :placeholder="inputPlaceholder"
          @focus="onFocus"
          @input="onInput"
          @keydown="onInputKeydown"
        >

        <button
          type="button"
          class="side-menu__locale-toggle"
          tabindex="-1"
          :aria-label="$t('language-title')"
          @mousedown.prevent="toggleList"
        >
          <FontAwesomeIcon
            class="side-menu__locale-caret"
            :class="{ 'is-open': open }"
            icon="angle-down"
            fixedWidth
          ></FontAwesomeIcon>
        </button>
      </label>

      <div v-show="open" class="side-menu__locale-panel">
        <p v-if="isSearching" class="side-menu__locale-count">
          {{ $t('sidebar-language-results', { n: filteredLocales.length }) }}
        </p>

        <ul
          :id="listId"
          class="side-menu__locale-list"
          role="listbox"
          :aria-label="$t('language-title')"
        >
          <li v-if="!filteredLocales.length" class="side-menu__locale-empty" role="presentation">
            {{ $t('sidebar-language-empty') }}
          </li>

          <li
            v-for="(option, index) in filteredLocales"
            :id="optionId(index)"
            :key="option.locale"
            class="side-menu__locale-option"
            :class="{
              'is-active': option.locale === currentLocale,
              'is-highlighted': index === highlightIndex,
            }"
            role="option"
            :aria-selected="option.locale === currentLocale ? 'true' : 'false'"
            @mousedown.prevent="selectLocale(option.locale)"
            @mouseenter="highlightIndex = index"
          >
            <span class="side-menu__locale-flag">
              <Flag :country="option.country"></Flag>
            </span>
            <span class="side-menu__locale-meta">
              <span class="side-menu__locale-name">{{ option.nativeName || option.name }}</span>
              <span class="side-menu__locale-region">
                <template v-if="showEnglishAlias(option)">
                  {{ option.englishName }} ·
                </template>
                {{ option.region }} · {{ option.locale }}
              </span>
            </span>
            <span v-if="option.locale === currentLocale" class="side-menu__locale-check" aria-hidden="true">
              <FontAwesomeIcon icon="check-circle" fixedWidth></FontAwesomeIcon>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>
  import * as storage from '../../../utils/storage';
  import isAprilFoolsDay from '../../../utils/isAprilFoolsDay';
  import {
    describeLocale,
    getFlagCountry,
    localeMatchesQuery,
  } from '../../../utils/locale-display';
  import Flag from '../../utils/Flag.vue';

  let instanceCounter = 0;

  export default {
    name: 'SideMenuLanguage',
    components: { Flag },
    data() {
      instanceCounter += 1;
      return {
        open: false,
        query: '',
        highlightIndex: 0,
        inputId: `side-menu-locale-input-${instanceCounter}`,
        listId: `side-menu-locale-list-${instanceCounter}`,
      };
    },
    computed: {
      currentLocale() {
        return this.$i18n.locale;
      },
      currentOption() {
        return describeLocale(this.currentLocale, this.currentLocale);
      },
      isSearching() {
        return this.open && this.query.trim().length > 0;
      },
      inputPlaceholder() {
        return this.$t('sidebar-language-search');
      },
      localeOptions() {
        return this.$i18n.availableLocales
          .map(locale => describeLocale(locale, this.currentLocale))
          .sort((a, b) => (a.nativeName || a.name).localeCompare(b.nativeName || b.name, this.currentLocale));
      },
      filteredLocales() {
        if (!this.isSearching) return this.localeOptions;
        return this.localeOptions.filter(option => localeMatchesQuery(option, this.query));
      },
      activeOptionId() {
        if (!this.open || !this.filteredLocales.length) return null;
        return this.optionId(this.highlightIndex);
      },
    },
    watch: {
      currentLocale: {
        immediate: true,
        handler() {
          if (!this.open) this.syncClosedQuery();
        },
      },
      filteredLocales() {
        this.highlightIndex = 0;
      },
      open(isOpen) {
        if (isOpen) {
          window.addEventListener('click', this.onWindowClick, true);
          window.addEventListener('keydown', this.onWindowKeydown, true);
          this.$nextTick(() => this.scrollHighlightedIntoView());
        } else {
          window.removeEventListener('click', this.onWindowClick, true);
          window.removeEventListener('keydown', this.onWindowKeydown, true);
          this.syncClosedQuery();
          this.highlightIndex = 0;
        }
      },
    },
    beforeDestroy() {
      window.removeEventListener('click', this.onWindowClick, true);
      window.removeEventListener('keydown', this.onWindowKeydown, true);
    },
    methods: {
      getFlagCountry,
      syncClosedQuery() {
        this.query = this.currentOption.nativeName || this.currentOption.name;
      },
      showEnglishAlias(option) {
        const primary = (option.nativeName || option.name || '').toLowerCase();
        const english = (option.englishName || '').toLowerCase();
        return english && english !== primary;
      },
      optionId(index) {
        return `${this.listId}-option-${index}`;
      },
      openList() {
        this.open = true;
        const activeIndex = this.filteredLocales.findIndex(option => option.locale === this.currentLocale);
        this.highlightIndex = activeIndex >= 0 ? activeIndex : 0;
      },
      onFocus() {
        this.query = '';
        this.openList();
      },
      onInput() {
        if (!this.open) this.open = true;
        this.highlightIndex = 0;
      },
      closeList() {
        this.open = false;
      },
      toggleList() {
        if (this.open) this.closeList();
        else {
          this.query = '';
          this.openList();
          this.$nextTick(() => {
            if (this.$refs.input) this.$refs.input.focus();
          });
        }
      },
      onWindowClick(event) {
        if (!this.$el.contains(event.target)) this.closeList();
      },
      onWindowKeydown(event) {
        if (event.key !== 'Escape' || !this.open) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        this.closeList();
        if (this.$refs.input) this.$refs.input.blur();
      },
      onInputKeydown(event) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          if (!this.open) this.openList();
          else this.moveHighlight(1);
          return;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          if (!this.open) this.openList();
          else this.moveHighlight(-1);
          return;
        }

        if (event.key === 'Enter') {
          if (!this.open || !this.filteredLocales.length) return;
          event.preventDefault();
          this.selectLocale(this.filteredLocales[this.highlightIndex].locale);
          return;
        }

        if (event.key === 'Escape' && this.open) {
          event.preventDefault();
          event.stopPropagation();
          this.closeList();
        }
      },
      moveHighlight(delta) {
        const total = this.filteredLocales.length;
        if (!total) return;
        this.highlightIndex = (this.highlightIndex + delta + total) % total;
        this.$nextTick(() => this.scrollHighlightedIntoView());
      },
      scrollHighlightedIntoView() {
        const option = document.getElementById(this.optionId(this.highlightIndex));
        if (option) option.scrollIntoView({ block: 'nearest' });
      },
      displayTranslationStatus() {
        const { translationPercent } = this.$i18n;

        if (translationPercent === 100) return;
        if (translationPercent > 80) {
          return this.$info(this.$t('language-translation-good', {
            percent: translationPercent.toFixed(2),
            locale: this.$i18n.locale,
          }));
        }
        if (translationPercent > 40) {
          return this.$info(this.$t('language-translation-medium', {
            percent: translationPercent.toFixed(2),
            locale: this.$i18n.locale,
          }));
        }
        return this.$info(this.$t('language-translation-bad', {
          percent: translationPercent.toFixed(2),
          locale: this.$i18n.locale,
        }));
      },
      async selectLocale(locale) {
        this.closeList();
        if (locale === this.currentLocale) return;

        const year = new Date().getFullYear();
        if (isAprilFoolsDay()) storage.set(`fooled-${year}`, true);

        await this.$i18n.load(locale);
        await this.$i18n.set(locale);
        storage.set('locale', locale);
        this.displayTranslationStatus();
      },
    },
  };
</script>

<style lang="scss">
  .side-menu__section--language {
    position: relative;
    z-index: 8;
  }

  .side-menu__locale {
    padding: 0;
    position: relative;
    z-index: 2;
  }

  .side-menu__locale.is-open {
    z-index: 9;
  }

  .side-menu__locale-field {
    align-items: center;
    background: var(--sm-field, var(--sm-shell));
    border: 1px solid var(--sm-border);
    border-radius: 0.75rem;
    box-sizing: border-box;
    display: flex;
    gap: 0.5rem;
    min-height: 2.75rem;
    padding: 0.4rem 0.4rem 0.4rem 0.6rem;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    width: 100%;

    .side-menu__locale.is-open & {
      border-color: var(--sm-brand);
      box-shadow: 0 0 0 3px var(--sm-brand-soft);
    }

    .flag-icon {
      border-radius: 2px;
      box-shadow: 0 0 0 1px var(--sm-border);
      display: block;
      width: 1.35rem;
    }
  }

  .side-menu__locale-selected {
    align-items: center;
    display: inline-flex;
    flex-shrink: 0;
  }

  .side-menu__locale-input {
    appearance: none;
    background: transparent;
    border: 0;
    color: var(--sm-ink);
    caret-color: var(--sm-brand);
    flex: 1;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    min-width: 0;
    outline: none;
    padding: 0;
    width: 100%;

    &::-webkit-search-cancel-button {
      display: none;
    }

    &::placeholder {
      color: var(--sm-muted);
      font-weight: 500;
      opacity: 1;
    }
  }

  .side-menu__locale-toggle {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 0.5rem;
    color: var(--sm-muted);
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    height: 1.9rem;
    justify-content: center;
    padding: 0;
    width: 1.9rem;

    &:hover,
    &:focus-visible {
      background: var(--sm-soft);
      color: var(--sm-ink);
      outline: none;
    }
  }

  .side-menu__locale-caret {
    transition: transform 0.15s ease;

    &.is-open {
      transform: rotate(180deg);
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }

  .side-menu__locale-panel {
    background: var(--sm-elevated, var(--sm-shell));
    border: 1px solid var(--sm-border);
    border-radius: 0.85rem;
    box-shadow: var(--sm-dropdown-shadow);
    left: 0;
    margin-top: 0;
    overflow: hidden;
    position: absolute;
    right: 0;
    top: calc(100% + 0.4rem);
    z-index: 12;
  }

  .side-menu__locale-count {
    border-bottom: 1px solid var(--sm-border);
    color: var(--sm-muted);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    margin: 0;
    padding: 0.55rem 0.75rem 0.5rem;
  }

  .side-menu__locale-list {
    list-style: none;
    margin: 0;
    max-height: 15.5rem;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 0.35rem;

    .side-menu__locale.is-searching & {
      max-height: 17rem;
    }
  }

  .side-menu__locale-empty {
    color: var(--sm-muted);
    font-size: 0.82rem;
    padding: 1rem 0.65rem;
    text-align: center;
  }

  .side-menu__locale-option {
    align-items: center;
    border: 1px solid transparent;
    border-radius: 0.65rem;
    color: var(--sm-ink);
    cursor: pointer;
    display: flex;
    gap: 0.7rem;
    padding: 0.58rem 0.55rem;
    transition: background 0.12s ease, border-color 0.12s ease;

    &.is-highlighted {
      background: var(--sm-brand-soft);
      border-color: var(--sm-brand);
    }

    &.is-active {
      background: var(--sm-brand-soft);
      border-color: var(--sm-brand);
    }

    &.is-active .side-menu__locale-check {
      color: var(--sm-brand);
      opacity: 1;
    }
  }

  .side-menu__locale-flag {
    align-items: center;
    background: var(--sm-soft);
    border: 1px solid var(--sm-border);
    border-radius: 0.5rem;
    display: inline-flex;
    flex-shrink: 0;
    height: 2rem;
    justify-content: center;
    width: 2rem;

    .flag-icon {
      border-radius: 2px;
      box-shadow: none;
      width: 1.25rem;
    }
  }

  .side-menu__locale-meta {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .side-menu__locale-name {
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .side-menu__locale-region {
    color: var(--sm-muted);
    font-size: 0.72rem;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .side-menu__locale-check {
    color: var(--sm-brand);
    flex-shrink: 0;
    font-size: 0.95rem;
    opacity: 0;
  }
</style>
