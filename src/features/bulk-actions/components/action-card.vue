<template>
  <button
    type="button"
    class="bulk-actions__card"
    :aria-label="title"
    @click="$emit('select', actionId)"
  >
    <span class="bulk-actions__card-icon" aria-hidden="true">
      <FontAwesomeIcon :icon="icon"></FontAwesomeIcon>
    </span>
    <span class="bulk-actions__card-body">
      <span class="bulk-actions__card-title">{{ title }}</span>
      <span class="bulk-actions__card-lead">{{ lead }}</span>
    </span>
    <FontAwesomeIcon class="bulk-actions__card-chevron" icon="chevron-right" aria-hidden="true"></FontAwesomeIcon>
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
    },
  };
</script>
