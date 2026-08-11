<template>
  <button
    type="button"
    class="bulk-actions__tile"
    :style="{ '--tile-delay': `${index * 35}ms` }"
    :aria-label="title"
    @click="$emit('select', actionId)"
  >
    <span class="bulk-actions__tile-glyph" aria-hidden="true">
      <FontAwesomeIcon :icon="icon"></FontAwesomeIcon>
    </span>
    <span class="bulk-actions__tile-copy">
      <span class="bulk-actions__tile-title">{{ title }}</span>
      <span class="bulk-actions__tile-lead">{{ lead }}</span>
    </span>
    <span class="bulk-actions__tile-go" aria-hidden="true">
      <FontAwesomeIcon icon="chevron-right"></FontAwesomeIcon>
    </span>
  </button>
</template>

<script>
  export default {
    name: 'BulkActionCard',
    props: {
      actionId: { type: String, required: true },
      icon: { type: String, required: true },
      title: { type: String, required: true },
      lead: { type: String, required: true },
      index: { type: Number, default: 0 },
    },
  };
</script>
