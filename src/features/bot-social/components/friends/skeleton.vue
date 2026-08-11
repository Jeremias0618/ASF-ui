<template>
  <div class="friends-hub__skeleton" aria-busy="true" :aria-label="$t('bot-social-loading')">
    <div v-for="n in count" :key="n" class="friends-hub__skel-card">
      <span class="friends-hub__skel-avatar" aria-hidden="true"></span>
      <span class="friends-hub__skel-meta" aria-hidden="true">
        <span class="friends-hub__skel-line friends-hub__skel-line--name"></span>
      </span>
      <span class="friends-hub__skel-action" aria-hidden="true"></span>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'FriendsSkeleton',
    props: {
      count: { type: Number, default: 20 },
    },
  };
</script>
