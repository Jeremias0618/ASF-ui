<template>
  <div
    class="asf-modal-skeleton"
    :class="`asf-modal-skeleton--${variant}`"
    role="status"
    aria-live="polite"
    aria-busy="true"
    :aria-label="resolvedLabel"
  >
    <slot>
      <div class="asf-modal-skeleton__body">
        <section
          v-for="(section, sectionIndex) in resolvedSections"
          :key="`section-${sectionIndex}`"
          class="asf-modal-skeleton__section"
        >
          <AsfSkeleton
            v-if="section.legend !== false"
            class="asf-modal-skeleton__legend"
            variant="legend"
            :width="section.legendWidth || undefined"
          ></AsfSkeleton>

          <div
            v-for="(row, rowIndex) in section.rows"
            :key="`row-${sectionIndex}-${rowIndex}`"
            class="asf-modal-skeleton__row"
          >
            <AsfSkeleton
              class="asf-modal-skeleton__label"
              variant="text"
              :width="row.labelWidth || '72%'"
            ></AsfSkeleton>
            <AsfSkeleton
              class="asf-modal-skeleton__control"
              :class="{
                'asf-modal-skeleton__control--narrow': row.narrow,
                'asf-modal-skeleton__control--toggle': row.toggle,
              }"
              :variant="row.toggle ? 'pill' : 'input'"
              :height="row.toggle ? '2rem' : undefined"
              :width="row.controlWidth || undefined"
            ></AsfSkeleton>
          </div>
        </section>
      </div>

      <footer v-if="showFooter" class="asf-modal-skeleton__footer">
        <div class="asf-modal-skeleton__footer-primary">
          <AsfSkeleton variant="button"></AsfSkeleton>
          <AsfSkeleton variant="button"></AsfSkeleton>
        </div>
        <AsfSkeleton variant="button" width="11rem"></AsfSkeleton>
      </footer>
    </slot>
  </div>
</template>

<script>
  import AsfSkeleton from './Skeleton.vue';

  const CONFIG_SECTIONS = [
    {
      legendWidth: '4.5rem',
      rows: [
        { labelWidth: '4rem' },
        { labelWidth: '8rem' },
        { labelWidth: '9rem' },
        { labelWidth: '6.5rem', toggle: true },
        { labelWidth: '7rem', narrow: true },
        { labelWidth: '9rem', narrow: true },
      ],
    },
    {
      legendWidth: '5.5rem',
      rows: [
        { labelWidth: '9rem', narrow: true },
        { labelWidth: '8.5rem', toggle: true },
      ],
    },
    {
      legendWidth: '4rem',
      rows: [
        { labelWidth: '11rem' },
        { labelWidth: '10rem' },
      ],
    },
    {
      legendWidth: '5.25rem',
      rows: [
        { labelWidth: '5.5rem' },
      ],
    },
  ];

  const DEFAULT_SECTIONS = [
    {
      rows: [
        { labelWidth: '40%' },
        { labelWidth: '55%' },
        { labelWidth: '35%', narrow: true },
      ],
    },
    {
      rows: [
        { labelWidth: '45%' },
        { labelWidth: '50%', toggle: true },
      ],
    },
  ];

  export default {
    name: 'AsfModalSkeleton',
    components: { AsfSkeleton },
    props: {
      /**
       * Layout preset:
       * - config: bot/ASF config form (sections + label/control rows + footer)
       * - default: generic modal body skeleton
       */
      variant: {
        type: String,
        default: 'config',
        validator: value => ['config', 'default'].includes(value),
      },
      /** Override section definitions. */
      sections: {
        type: Array,
        default: null,
      },
      showFooter: {
        type: Boolean,
        default: true,
      },
      ariaLabel: {
        type: String,
        default: '',
      },
    },
    computed: {
      resolvedSections() {
        if (this.sections && this.sections.length) return this.sections;
        return this.variant === 'config' ? CONFIG_SECTIONS : DEFAULT_SECTIONS;
      },
      resolvedLabel() {
        return this.ariaLabel || this.$t('modal-loading');
      },
    },
  };
</script>
