<script>
  import InputDescription from './InputDescription.vue';
  import InputLabel from './InputLabel.vue';
  import validator from '../../../utils/validator';
  import { resolveConfigHelp, translateConfigEnum, translateConfigParam } from '../../../utils/config-i18n';

  export default {
    components: { InputLabel, InputDescription },
    props: {
      schema: {
        type: Object,
        required: true,
      },
      currentValue: {
        defaultValue: true,
      },
    },
    data() {
      const initialValue = (typeof this.currentValue !== 'undefined') ? this.currentValue : this.schema.defaultValue;

      return {
        value: (typeof initialValue === 'object') ? JSON.parse(JSON.stringify(initialValue)) : initialValue,
        showDescription: false,
      };
    },
    computed: {
      defaultValue() {
        return this.schema.defaultValue;
      },
      label() {
        const name = this.schema.label || this.schema.param || this.schema.paramName;
        return translateConfigParam(this, name);
      },
      field() {
        return this.schema.paramName;
      },
      placeholder() {
        return this.schema.placeholder || this.schema.defaultValue;
      },
      description() {
        return resolveConfigHelp(this, this.field, this.schema.description);
      },
      hasDescription() {
        return !!this.description;
      },
      isValid() {
        return !this.hasErrors;
      },
      hasErrors() {
        return this.errors.length;
      },
      errors() {
        if (Object.prototype.hasOwnProperty.call(validator, this.schema.type)) return validator[this.schema.type](this.value, this.schema);
        return [];
      },
      errorText() {
        return this.errors.map(error => `Value is ${error}!`).join(' ');
      },
    },
    watch: {
      value: {
        handler: 'update',
        deep: true,
      },
      showDescription(isOpen) {
        if (isOpen) {
          this.$nextTick(() => {
            document.addEventListener('click', this.onDocumentClick, true);
            document.addEventListener('keydown', this.onDocumentKeydown, true);
          });
        } else {
          this.unbindHelpListeners();
        }
      },
    },
    mounted() {
      if (this.$el) this.$el.addEventListener('asf-close-help', this.onCloseHelpEvent);
    },
    beforeDestroy() {
      this.unbindHelpListeners();
      if (this.$el) this.$el.removeEventListener('asf-close-help', this.onCloseHelpEvent);
    },
    methods: {
      update() {
        const value = (typeof this.value === 'object') ? JSON.parse(JSON.stringify(this.value)) : this.value;
        this.$emit('update', value, this.field);
      },
      toggleDescription() {
        // Close other open help panels so only one floats at a time.
        if (!this.showDescription) {
          document.querySelectorAll('.form-item.is-help-open').forEach(el => {
            if (el !== this.$el) {
              el.dispatchEvent(new CustomEvent('asf-close-help'));
            }
          });
        }
        this.showDescription = !this.showDescription;
      },
      closeDescription() {
        this.showDescription = false;
      },
      onCloseHelpEvent() {
        this.closeDescription();
      },
      onDocumentClick(event) {
        if (!this.$el) return;

        const helpBtn = this.$el.querySelector('.form-item__description-icon:not(.form-item__description-icon--key)');
        const panel = this.$el.querySelector('.form-item__description');

        // Only the ? button and the floating panel count as "inside".
        if (helpBtn && helpBtn.contains(event.target)) return;
        if (panel && panel.contains(event.target)) return;

        this.closeDescription();
      },
      onDocumentKeydown(event) {
        if (event.key !== 'Escape') return;
        event.stopImmediatePropagation();
        event.preventDefault();
        this.closeDescription();
      },
      unbindHelpListeners() {
        document.removeEventListener('click', this.onDocumentClick, true);
        document.removeEventListener('keydown', this.onDocumentKeydown, true);
      },
      translateEnum(name) {
        return translateConfigEnum(this, name);
      },
    },
  };
</script>
