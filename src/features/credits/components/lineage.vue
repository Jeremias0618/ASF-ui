<template>
  <section class="credits-duel" :aria-label="$t('credits-collab-kicker')">
    <a
      class="credits-identity credits-identity--origin"
      :href="originHref"
      target="_blank"
      rel="noreferrer noopener"
    >
      <span class="credits-identity__avatar-wrap">
        <img
          v-if="!originBroken"
          class="credits-identity__avatar"
          :src="originAvatar"
          width="80"
          height="80"
          alt=""
          decoding="async"
          @error="originBroken = true"
        >
        <span v-else class="credits-identity__fallback" aria-hidden="true">JA</span>
      </span>
      <span class="credits-identity__meta">
        <span class="credits-identity__role">{{ $t('credits-asf-kicker') }}</span>
        <span class="credits-identity__name" translate="no">JustArchiNET</span>
        <span class="credits-identity__product" translate="no">ArchiSteamFarm</span>
      </span>
      <span class="credits-sr-only">{{ $t('credits-open-new-tab') }}</span>
    </a>

    <div class="credits-duel__join" aria-hidden="true">
      <span class="credits-duel__rule"></span>
      <span class="credits-duel__badge">
        <FontAwesomeIcon icon="code-branch"></FontAwesomeIcon>
        <span>{{ $t('credits-fork-label') }}</span>
      </span>
      <span class="credits-duel__rule"></span>
    </div>

    <a
      class="credits-identity credits-identity--fork"
      :href="forkHref"
      target="_blank"
      rel="noreferrer noopener"
    >
      <span class="credits-identity__avatar-wrap">
        <img
          v-if="!forkBroken"
          class="credits-identity__avatar"
          :src="forkAvatar"
          width="80"
          height="80"
          alt=""
          decoding="async"
          @error="forkBroken = true"
        >
        <span v-else class="credits-identity__fallback" aria-hidden="true">JT</span>
      </span>
      <span class="credits-identity__meta">
        <span class="credits-identity__role">{{ $t('credits-ui-kicker') }}</span>
        <span class="credits-identity__name" translate="no">Jeremias0618</span>
        <span class="credits-identity__product" translate="no">ASF-ui</span>
      </span>
      <span class="credits-sr-only">{{ $t('credits-open-new-tab') }}</span>
    </a>
  </section>
</template>

<script>
  export default {
    name: 'CreditsLineage',
    props: {
      originHref: { type: String, required: true },
      originAvatar: { type: String, required: true },
      forkHref: { type: String, required: true },
      forkAvatar: { type: String, required: true },
    },
    data() {
      return {
        originBroken: false,
        forkBroken: false,
      };
    },
  };
</script>
