<template>
  <article class="credits-resource" :class="{ 'is-featured': featured }">
    <p class="credits-resource__kicker">{{ kicker }}</p>
    <h2 class="credits-resource__title" translate="no">{{ title }}</h2>
    <p class="credits-resource__body">{{ body }}</p>
    <div class="credits-resource__actions">
      <a
        v-for="link in links"
        :key="link.href"
        class="credits-resource__link"
        :href="link.href"
        target="_blank"
        rel="noreferrer noopener"
      >
        <FontAwesomeIcon :icon="link.icon" aria-hidden="true"></FontAwesomeIcon>
        <span>{{ link.label }}</span>
        <span class="credits-sr-only">{{ $t('credits-open-new-tab') }}</span>
      </a>
    </div>
  </article>
</template>

<script>
  export default {
    name: 'CreditsResource',
    props: {
      featured: { type: Boolean, default: false },
      kicker: { type: String, required: true },
      title: { type: String, required: true },
      body: { type: String, required: true },
      links: { type: Array, required: true },
    },
  };
</script>
