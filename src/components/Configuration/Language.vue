<template>
  <ConfigurationSection
    icon="language"
    :title="$t('configuration-section-language')"
    :lead="$t('configuration-section-language-lead')"
    title-id="config-language-title"
  >
    <div
      class="config-locale-select"
      :class="{ 'is-open': open }"
    >
      <label class="config-locale-select__label" :for="inputId">
        {{ $t('sidebar-language') }}
      </label>

      <div class="config-locale-select__control">
        <span class="config-locale-select__flag" aria-hidden="true">
          <Flag :key="currentLocale" :country="getFlagCountry(currentLocale)"></Flag>
        </span>

        <input
          :id="inputId"
          ref="input"
          v-model="query"
          type="search"
          class="config-locale-select__input"
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
          class="config-locale-select__caret-btn"
          tabindex="-1"
          :aria-label="$t('language-title')"
          @mousedown.prevent="toggleList"
        >
          <FontAwesomeIcon
            class="config-locale-select__caret"
            :class="{ 'is-open': open }"
            icon="angle-down"
            fixedWidth
          ></FontAwesomeIcon>
        </button>
      </div>

      <div v-show="open" class="config-locale-select__menu" role="presentation">
        <p v-if="isSearching" class="config-locale-select__count">
          {{ $t('sidebar-language-results', { n: filteredLocales.length }) }}
        </p>

        <ul
          :id="listId"
          class="config-locale-select__list"
          role="listbox"
          :aria-label="$t('language-title')"
        >
          <li v-if="!filteredLocales.length" class="config-locale-select__empty" role="presentation">
            {{ $t('sidebar-language-empty') }}
          </li>

          <li
            v-for="(option, index) in filteredLocales"
            :id="optionId(index)"
            :key="option.locale"
            class="config-locale-select__option"
            :class="{
              'is-active': option.locale === currentLocale,
              'is-highlighted': index === highlightIndex,
            }"
            role="option"
            :aria-selected="option.locale === currentLocale ? 'true' : 'false'"
            @mousedown.prevent="selectLocale(option.locale)"
            @mouseenter="highlightIndex = index"
          >
            <span class="config-locale-select__option-flag" aria-hidden="true">
              <Flag :country="option.country"></Flag>
            </span>
            <span class="config-locale-select__option-meta">
              <span class="config-locale-select__option-name">{{ option.nativeName || option.name }}</span>
              <span class="config-locale-select__option-region">
                <template v-if="showEnglishAlias(option)">{{ option.englishName }} · </template>
                {{ option.region }} · {{ option.locale }}
              </span>
            </span>
            <FontAwesomeIcon
              v-if="option.locale === currentLocale"
              icon="check-circle"
              class="config-locale-select__check"
              fixedWidth
              aria-hidden="true"
            ></FontAwesomeIcon>
          </li>
        </ul>
      </div>
    </div>
  </ConfigurationSection>
</template>

<script>
  import * as storage from '../../utils/storage';
  import isAprilFoolsDay from '../../utils/isAprilFoolsDay';
  import {
    describeLocale,
    getFlagCountry,
    localeMatchesQuery,
  } from '../../utils/locale-display';
  import Flag from '../utils/Flag.vue';
  import ConfigurationSection from './Section.vue';

  export default {
    name: 'ConfigurationLanguage',
    components: { Flag, ConfigurationSection },
    data() {
      return {
        open: false,
        query: '',
        highlightIndex: 0,
        inputId: 'config-language-search',
        listId: 'config-language-list',
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
        return this.open
          ? this.$t('sidebar-language-search')
          : (this.currentOption.nativeName || this.currentOption.name);
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
          this.$info(this.$t('language-translation-good', { percent: translationPercent.toFixed(2), locale: this.$i18n.locale }));
        } else if (translationPercent > 40) {
          this.$info(this.$t('language-translation-medium', { percent: translationPercent.toFixed(2), locale: this.$i18n.locale }));
        } else {
          this.$info(this.$t('language-translation-bad', { percent: translationPercent.toFixed(2), locale: this.$i18n.locale }));
        }
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
