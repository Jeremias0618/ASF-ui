import {
  markClean,
  markDirty,
} from '../utils/unsaved-changes';

/**
 * Mixin for pages/forms with unsaved edits.
 * Define a boolean computed `isDirty` on the component.
 * Optional: `unsavedChangesMessage` computed/data for the confirm text.
 */
export default {
  watch: {
    isDirty: {
      immediate: true,
      handler(value) {
        if (value) {
          const message = this.unsavedChangesMessage
            || (this.$t && this.$t('unsaved-changes-confirm'))
            || '';
          markDirty(message);
          return;
        }

        markClean();
      },
    },
  },
  beforeDestroy() {
    markClean();
  },
};
