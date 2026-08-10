<template>
  <span
    class="asf-skeleton"
    :class="modifierClass"
    :style="boneStyle"
    aria-hidden="true"
  ></span>
</template>

<script>
  const VARIANTS = new Set(['text', 'title', 'legend', 'input', 'button', 'circle', 'pill', 'block']);

  export default {
    name: 'AsfSkeleton',
    props: {
      /** Visual preset: text | title | legend | input | button | circle | pill | block */
      variant: {
        type: String,
        default: 'block',
        validator: value => VARIANTS.has(value),
      },
      /** CSS width (e.g. 40%, 8rem). */
      width: {
        type: [String, Number],
        default: null,
      },
      /** CSS height (e.g. 1rem, 40). Numbers become px. */
      height: {
        type: [String, Number],
        default: null,
      },
    },
    computed: {
      modifierClass() {
        if (this.variant === 'block') return null;
        return `asf-skeleton--${this.variant}`;
      },
      boneStyle() {
        const style = {};
        if (this.width != null && this.width !== '') {
          style.width = typeof this.width === 'number' ? `${this.width}px` : this.width;
        }
        if (this.height != null && this.height !== '') {
          style.height = typeof this.height === 'number' ? `${this.height}px` : this.height;
        }
        if (this.variant === 'block' && !style.height) {
          style.height = '1rem';
        }
        return style;
      },
    },
  };
</script>
