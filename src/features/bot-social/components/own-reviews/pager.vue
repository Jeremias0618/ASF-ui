<template>
  <nav v-if="lastPage > 1" class="own-reviews__pager" :aria-label="$t('bot-social-reviews-pager')">
    <button
      type="button"
      class="own-reviews__page-btn own-reviews__page-btn--step"
      :disabled="disabled || page <= 1"
      @click="go(page - 1)"
    >
      {{ $t('bot-social-reviews-prev') }}
    </button>

    <ul class="own-reviews__pager-list">
      <li v-for="entry in entries" :key="entry.key">
        <span v-if="entry.gap" class="own-reviews__page-gap" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="own-reviews__page-btn"
          :class="{ 'is-current': entry.value === page }"
          :aria-current="entry.value === page ? 'page' : null"
          :aria-label="$t('bot-social-reviews-page-label', { n: entry.value })"
          :disabled="disabled"
          @click="go(entry.value)"
        >
          {{ entry.value }}
        </button>
      </li>
    </ul>

    <button
      type="button"
      class="own-reviews__page-btn own-reviews__page-btn--step"
      :disabled="disabled || page >= lastPage"
      @click="go(page + 1)"
    >
      {{ $t('bot-social-reviews-next') }}
    </button>
  </nav>
</template>

<script>
  import { pageEntries } from '../../utils/page-entries';

  export default {
    name: 'BotSocialOwnReviewsPager',
    props: {
      page: { type: Number, required: true },
      lastPage: { type: Number, required: true },
      disabled: { type: Boolean, default: false },
    },
    computed: {
      entries() {
        return pageEntries(this.page, this.lastPage);
      },
    },
    methods: {
      go(target) {
        if (this.disabled || target < 1 || target > this.lastPage || target === this.page) return;
        this.$emit('change', target);
      },
    },
  };
</script>
