<template>
  <div class="bot-social-games__views" role="tablist" :aria-label="ariaLabel">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      class="bot-social-games__view"
      :class="{ 'is-active': value === tab.id }"
      :aria-selected="value === tab.id ? 'true' : 'false'"
      @click="$emit('input', tab.id)"
    >
      <FontAwesomeIcon :icon="tab.icon" aria-hidden="true"></FontAwesomeIcon>
      {{ tab.label }}
    </button>
  </div>
</template>

<script>
  export default {
    name: 'GamesViewTabs',
    props: {
      value: { type: String, required: true },
      tabs: { type: Array, required: true },
      ariaLabel: { type: String, required: true },
    },
  };
</script>
