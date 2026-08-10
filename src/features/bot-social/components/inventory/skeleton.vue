<template>
  <div
    class="steam-inv__skeleton"
    role="status"
    aria-live="polite"
    aria-busy="true"
    :aria-label="$t('modal-loading')"
  >
    <div class="steam-inv__skeleton-shell">
      <div class="steam-inv__skeleton-grid-pane">
        <div class="steam-inv__skeleton-grid" aria-hidden="true">
          <AsfSkeleton
            v-for="n in cellCount"
            :key="n"
            class="steam-inv__skeleton-cell"
            variant="block"
            width="100%"
            height="100%"
          ></AsfSkeleton>
        </div>
        <div class="steam-inv__skeleton-pager">
          <AsfSkeleton variant="pill" width="2rem" height="2rem"></AsfSkeleton>
          <AsfSkeleton variant="text" width="4.5rem"></AsfSkeleton>
          <AsfSkeleton variant="pill" width="2rem" height="2rem"></AsfSkeleton>
        </div>
      </div>

      <aside class="steam-inv__skeleton-detail" aria-hidden="true">
        <AsfSkeleton class="steam-inv__skeleton-preview" variant="block" height="11rem"></AsfSkeleton>
        <AsfSkeleton variant="title" width="70%"></AsfSkeleton>
        <AsfSkeleton variant="text" width="45%"></AsfSkeleton>
        <AsfSkeleton variant="text" width="88%"></AsfSkeleton>
        <div class="steam-inv__skeleton-flags">
          <AsfSkeleton variant="pill" width="5.5rem" height="1.35rem"></AsfSkeleton>
          <AsfSkeleton variant="pill" width="5.5rem" height="1.35rem"></AsfSkeleton>
        </div>
        <AsfSkeleton variant="button" width="100%"></AsfSkeleton>
        <AsfSkeleton variant="button" width="100%"></AsfSkeleton>
      </aside>
    </div>
  </div>
</template>

<script>
  import AsfSkeleton from '../../../../components/UI/Skeleton.vue';
  import { INVENTORY_PAGE_SIZE } from '../../utils/filter-inventory';

  export default {
    name: 'InventorySkeleton',
    components: { AsfSkeleton },
    computed: {
      cellCount() {
        return INVENTORY_PAGE_SIZE;
      },
    },
  };
</script>
