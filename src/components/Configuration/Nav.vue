<template>
  <nav class="config-hub__nav" :aria-label="$t('configuration-nav-label')">
    <button
      v-for="item in items"
      :id="`config-nav-${item.id}`"
      :key="item.id"
      type="button"
      class="config-hub__nav-item"
      :class="{ 'is-active': value === item.id }"
      :aria-current="value === item.id ? 'page' : null"
      @click="$emit('input', item.id)"
    >
      <span class="config-hub__nav-icon" aria-hidden="true">
        <FontAwesomeIcon :icon="item.icon" fixedWidth></FontAwesomeIcon>
      </span>
      <span class="config-hub__nav-copy">
        <span class="config-hub__nav-title">{{ $t(item.titleKey) }}</span>
        <span class="config-hub__nav-help">{{ $t(item.helpKey) }}</span>
      </span>
    </button>
  </nav>
</template>

<script>
  export const CONFIG_SECTIONS = [
    { id: 'appearance', icon: 'palette', titleKey: 'configuration-section-appearance', helpKey: 'configuration-section-appearance-help' },
    { id: 'language', icon: 'language', titleKey: 'configuration-section-language', helpKey: 'configuration-section-language-help' },
    { id: 'security', icon: 'lock', titleKey: 'configuration-section-security', helpKey: 'configuration-section-security-help' },
    { id: 'instance', icon: 'power-off', titleKey: 'configuration-section-instance', helpKey: 'configuration-section-instance-help' },
    { id: 'preferences', icon: 'cogs', titleKey: 'configuration-section-preferences', helpKey: 'configuration-section-preferences-help' },
    { id: 'related', icon: 'wrench', titleKey: 'configuration-section-related', helpKey: 'configuration-section-related-help' },
  ];

  export default {
    name: 'ConfigurationNav',
    props: {
      value: { type: String, required: true },
    },
    data() {
      return { items: CONFIG_SECTIONS };
    },
  };
</script>
