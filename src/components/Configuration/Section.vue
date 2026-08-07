<template>
  <section class="config-card" :aria-labelledby="titleId">
    <header class="config-card__header">
      <span class="config-card__icon" aria-hidden="true">
        <FontAwesomeIcon :icon="icon" fixedWidth></FontAwesomeIcon>
      </span>
      <div class="config-card__heading">
        <h2 :id="titleId" class="config-card__title">{{ title }}</h2>
        <p v-if="lead" class="config-card__lead">{{ lead }}</p>
      </div>
      <div v-if="$slots.action" class="config-card__action">
        <slot name="action"></slot>
      </div>
    </header>
    <div class="config-card__body">
      <slot></slot>
    </div>
  </section>
</template>

<script>
  export default {
    name: 'ConfigurationSection',
    props: {
      icon: { type: String, required: true },
      title: { type: String, required: true },
      lead: { type: String, default: '' },
      titleId: { type: String, required: true },
    },
  };
</script>
