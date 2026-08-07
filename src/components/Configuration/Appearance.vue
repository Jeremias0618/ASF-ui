<template>
  <ConfigurationSection
    icon="palette"
    :title="$t('configuration-section-appearance')"
    :lead="$t('configuration-section-appearance-lead')"
    title-id="config-appearance-title"
  >
    <div class="config-split">
      <div class="config-block">
        <p class="config-block__label" id="config-theme-mode-label">{{ $t('configuration-theme-mode') }}</p>
        <div class="config-mode" role="radiogroup" aria-labelledby="config-theme-mode-label">
          <button
            v-for="option in modeOptions"
            :key="option.id"
            type="button"
            class="config-mode__option"
            :class="{ 'is-active': themeMode === option.id }"
            role="radio"
            :aria-checked="themeMode === option.id ? 'true' : 'false'"
            @click="setThemeMode(option.id)"
          >
            <span class="config-mode__icon" aria-hidden="true">
              <FontAwesomeIcon :icon="option.icon" fixedWidth></FontAwesomeIcon>
            </span>
            <span class="config-mode__title">{{ $t(option.titleKey) }}</span>
            <span class="config-mode__desc">{{ $t(option.descKey) }}</span>
          </button>
        </div>
      </div>

      <div class="config-block">
        <p class="config-block__label" id="config-accent-label">{{ $t('sidebar-theme') }}</p>
        <p class="config-block__help">{{ $t('sidebar-theme-help') }}</p>
        <div class="config-accents" role="listbox" aria-labelledby="config-accent-label">
          <button
            v-for="themeOption in availableThemes"
            :key="themeOption"
            type="button"
            class="config-accents__swatch"
            :class="[`theme-${themeOption}`, { 'is-active': theme === themeOption }]"
            role="option"
            :aria-selected="theme === themeOption ? 'true' : 'false'"
            :aria-label="themeOption"
            :title="themeOption"
            @click="changeTheme(themeOption)"
          ></button>
        </div>
      </div>
    </div>
  </ConfigurationSection>
</template>

<script>
  import { mapActions, mapGetters } from 'vuex';
  import ConfigurationSection from './Section.vue';

  export default {
    name: 'ConfigurationAppearance',
    components: { ConfigurationSection },
    computed: {
      ...mapGetters({
        theme: 'storage/theme',
        themeMode: 'storage/themeMode',
        availableThemes: 'layout/availableThemes',
      }),
      modeOptions() {
        return [
          { id: 'light', icon: 'sun', titleKey: 'configuration-theme-light', descKey: 'configuration-theme-light-help' },
          { id: 'dark', icon: 'moon', titleKey: 'configuration-theme-dark', descKey: 'configuration-theme-dark-help' },
          { id: 'system', icon: 'laptop', titleKey: 'configuration-theme-system', descKey: 'configuration-theme-system-help' },
        ];
      },
    },
    methods: mapActions({
      changeTheme: 'storage/changeTheme',
      setThemeMode: 'storage/setThemeMode',
    }),
  };
</script>
