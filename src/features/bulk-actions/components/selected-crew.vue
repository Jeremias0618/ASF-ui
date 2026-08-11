<template>
  <div class="bulk-actions-crew" :aria-label="$t('bulk-actions-bots-label')">
    <div class="bulk-actions-crew__head">
      <p class="bulk-actions-crew__title">
        {{ $t('bulk-actions-crew-title', { n: bots.length }) }}
      </p>
      <button type="button" class="bulk-actions-crew__edit" @click="$emit('change')">
        {{ $t('bulk-actions-bots-change') }}
      </button>
    </div>
    <ul class="bulk-actions-crew__list">
      <li
        v-for="bot in bots"
        :key="bot.name"
        class="bulk-actions-crew__item"
        :class="`status--${bot.status}`"
        :title="bot.viewableName || bot.name"
      >
        <img
          class="bulk-actions-crew__avatar"
          :src="bot.avatarURL"
          :alt="bot.viewableName || bot.name"
        >
        <span class="bulk-actions-crew__name">{{ bot.viewableName || bot.name }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
  export default {
    name: 'BulkSelectedCrew',
    props: {
      bots: { type: Array, default: () => [] },
    },
  };
</script>
