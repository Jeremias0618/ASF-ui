<template>
  <section class="side-menu__card" aria-labelledby="side-menu-language-label">
    <div id="side-menu-language-label" class="side-menu__category">
      <span class="side-menu__category-icon" aria-hidden="true">
        <FontAwesomeIcon icon="language" fixedWidth></FontAwesomeIcon>
      </span>
      <div>
        <p class="side-menu__category-title">{{ $t('sidebar-language') }}</p>
        <p class="side-menu__category-help">{{ $t('sidebar-language-help') }}</p>
      </div>
    </div>

    <div class="side-menu__locale" :class="{ 'is-open': open }">
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
          :placeholder="$t('sidebar-language-search')"
          @focus="onFocus"
          @input="openList"
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

      <ul
        v-show="open"
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
          <Flag :country="option.country"></Flag>
          <span class="side-menu__locale-meta">
            <span class="side-menu__locale-name">{{ option.name }}</span>
            <span class="side-menu__locale-region">{{ option.region }} · {{ option.locale }}</span>
          </span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script>
  import * as storage from '../../../utils/storage';
  import isAprilFoolsDay from '../../../utils/isAprilFoolsDay';
  import Flag from '../../utils/Flag.vue';

  const SPECIAL_NAMES = {
    'lol-US': { name: 'LOLCAT', region: 'United States' },
    'sr-CS': { name: 'Srpski', region: 'Serbia' },
  };

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
      localeOptions() {
        return this.$i18n.availableLocales
          .map(locale => this.describeLocale(locale))
          .sort((a, b) => a.name.localeCompare(b.name, this.currentLocale));
      },
      filteredLocales() {
        const needle = this.normalize(this.query);
        if (!needle) return this.localeOptions;

        return this.localeOptions.filter(option => (
          this.normalize(option.locale).includes(needle)
          || this.normalize(option.name).includes(needle)
          || this.normalize(option.region).includes(needle)
          || this.normalize(option.languageCode).includes(needle)
          || this.normalize(option.country).includes(needle)
          || this.normalize(option.searchText).includes(needle)
        ));
      },
      activeOptionId() {
        if (!this.open || !this.filteredLocales.length) return null;
        return this.optionId(this.highlightIndex);
      },
    },
    watch: {
      currentLocale: {
        immediate: true,
        handler(locale) {
          if (!this.open) this.query = this.describeLocale(locale).name;
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
          this.query = this.describeLocale(this.currentLocale).name;
          this.highlightIndex = 0;
        }
      },
    },
    beforeDestroy() {
      window.removeEventListener('click', this.onWindowClick, true);
      window.removeEventListener('keydown', this.onWindowKeydown, true);
    },
    methods: {
      normalize(value) {
        return String(value || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim();
      },
      getFlagCountry(locale) {
        if (locale === 'sr-CS') return 'rs';
        if (locale === 'lol-US') return 'lol';
        const parts = locale.split('-');
        return (parts[1] || parts[0] || '').toLowerCase();
      },
      describeLocale(locale) {
        const special = SPECIAL_NAMES[locale];
        const [languageCode, regionCode] = locale.split('-');
        const country = this.getFlagCountry(locale);

        let name = special ? special.name : languageCode;
        let region = special ? special.region : (regionCode || languageCode);

        try {
          if (typeof Intl !== 'undefined' && Intl.DisplayNames) {
            const languageNames = new Intl.DisplayNames([this.currentLocale, 'en'], { type: 'language' });
            const regionNames = new Intl.DisplayNames([this.currentLocale, 'en'], { type: 'region' });
            if (!special) {
              name = languageNames.of(languageCode) || name;
              if (regionCode) region = regionNames.of(regionCode) || regionCode;
            }
          }
        } catch (err) {
          // Keep fallback labels when Intl.DisplayNames is unavailable.
        }

        return {
          locale,
          country,
          languageCode,
          name,
          region,
          searchText: `${name} ${region} ${locale} ${languageCode} ${country}`,
        };
      },
      optionId(index) {
        return `${this.listId}-option-${index}`;
      },
      openList() {
        this.open = true;
        const activeIndex = this.filteredLocales.findIndex(option => option.locale === this.currentLocale);
        this.highlightIndex = activeIndex >= 0 ? activeIndex : 0;
      },
      onFocus(event) {
        this.openList();
        this.$nextTick(() => {
          if (event && event.target && event.target.select) event.target.select();
        });
      },
      closeList() {
        this.open = false;
      },
      toggleList() {
        if (this.open) this.closeList();
        else {
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
        if (locale === this.currentLocale) {
          this.query = this.describeLocale(locale).name;
          return;
        }

        const year = new Date().getFullYear();
        if (isAprilFoolsDay()) storage.set(`fooled-${year}`, true);

        await this.$i18n.load(locale);
        await this.$i18n.set(locale);
        storage.set('locale', locale);

        this.query = this.describeLocale(locale).name;
        this.displayTranslationStatus();
      },
    },
  };
</script>

<style lang="scss">
  .side-menu__locale {
    padding: 0.15rem 0.45rem 0.65rem;
    position: relative;
  }

  .side-menu__locale-field {
    align-items: center;
    background: var(--sm-shell, #fff);
    border: 1px solid var(--sm-border, #e4e7ec);
    border-radius: 0.7rem;
    box-sizing: border-box;
    display: flex;
    gap: 0.45rem;
    min-height: 2.65rem;
    padding: 0.35rem 0.4rem 0.35rem 0.55rem;
    width: 100%;

    .side-menu__locale.is-open & {
      border-color: var(--sm-brand, #0968e5);
      box-shadow: 0 0 0 2px rgba(9, 104, 229, 0.16);
    }

    .flag-icon {
      box-shadow: none;
      display: block;
      width: 1.25rem;
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
    color: inherit;
    flex: 1;
    font: inherit;
    font-size: 0.88rem;
    font-weight: 600;
    min-width: 0;
    outline: none;
    padding: 0;
    width: 100%;

    &::-webkit-search-cancel-button {
      display: none;
    }

    &::placeholder {
      color: var(--sm-muted, #667085);
      font-weight: 500;
    }
  }

  .side-menu__locale-toggle {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 0.45rem;
    color: var(--sm-muted, #667085);
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    height: 1.85rem;
    justify-content: center;
    padding: 0;
    width: 1.85rem;

    &:hover,
    &:focus-visible {
      background: var(--sm-soft, #f2f4f7);
      color: inherit;
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

  .side-menu__locale-list {
    background: var(--sm-shell, #fff);
    border: 1px solid var(--sm-border, #e4e7ec);
    border-radius: 0.75rem;
    box-shadow: 0 10px 28px rgba(16, 24, 40, 0.16);
    box-sizing: border-box;
    left: 0.45rem;
    list-style: none;
    margin: 0.35rem 0 0;
    max-height: 14rem;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 0.35rem;
    position: absolute;
    right: 0.45rem;
    top: 100%;
    z-index: 5;

    .app--dark-mode & {
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
    }
  }

  .side-menu__locale-empty {
    color: var(--sm-muted, #667085);
    font-size: 0.8rem;
    padding: 0.7rem 0.55rem;
    text-align: center;
  }

  .side-menu__locale-option {
    align-items: center;
    border-radius: 0.55rem;
    cursor: pointer;
    display: flex;
    gap: 0.6rem;
    padding: 0.5rem 0.55rem;

    .flag-icon {
      box-shadow: none;
      flex-shrink: 0;
      width: 1.25rem;
    }

    &.is-highlighted,
    &:hover {
      background: var(--sm-soft, #f2f4f7);
    }

    &.is-active {
      box-shadow: inset 0 0 0 1px var(--sm-brand, #0968e5);
    }
  }

  .side-menu__locale-meta {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
    min-width: 0;
  }

  .side-menu__locale-name {
    font-size: 0.86rem;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .side-menu__locale-region {
    color: var(--sm-muted, #667085);
    font-size: 0.72rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
