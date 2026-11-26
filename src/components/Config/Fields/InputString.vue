<template>
  <div class="form-item" :class="{ 'is-help-open': showDescription, 'has-field-error': nameInUse || hasErrors || showRequired }">
    <input-label
      :label="label"
      :field="field"
      :hasDescription="hasDescription"
      :helpOpen="showDescription"
      :required="!!schema.required"
      @toggle-help="toggleDescription"
    ></input-label>

    <div class="form-item__value">
      <input
        :id="field"
        v-model="value"
        class="form-item__input"
        :class="{ 'is-invalid': nameInUse || showRequired }"
        type="text"
        :name="field"
        :placeholder="placeholder"
        :required="schema.required ? true : undefined"
        :aria-required="schema.required ? 'true' : undefined"
        :aria-invalid="nameInUse || showRequired ? 'true' : undefined"
        :aria-describedby="describedBy"
        :aria-labelledby="field ? `${field}-label` : undefined"
        @blur="onBlur"
        @keypress="onKeyPress"
      >
      <p v-if="nameInUse" :id="field ? `${field}-error` : undefined" class="form-item__error" role="alert">
        {{ $t('bot-name-in-use') }}
      </p>
      <span v-else-if="hasErrors" class="form-item__error">{{ errorText }}</span>
      <p
        v-else-if="requiredMissing && schema.requiredHint"
        :id="field ? `${field}-hint` : undefined"
        class="form-item__hint"
        :class="{ 'form-item__error': showRequired }"
      >
        {{ schema.requiredHint }}
      </p>
      <p v-else-if="schema.hint" :id="field ? `${field}-hint` : undefined" class="form-item__hint">
        {{ schema.hint }}
      </p>
    </div>

    <input-description v-if="hasDescription" :shown="showDescription" :description="description"></input-description>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex';
  import botExists from '../../../utils/botExists';
  import Input from './Input.vue';

  export default {
    name: 'InputString',
    mixins: [Input],
    data() {
      return { touched: false };
    },
    computed: {
      ...mapGetters({
        bots: 'bots/bots',
      }),
      // A required field that is empty (or only spaces). The hint shows from the start; the error style once left.
      requiredMissing() {
        return !!this.schema.required && !String(this.value || '').trim();
      },
      showRequired() {
        return this.requiredMissing && this.touched;
      },
      describedBy() {
        if (!this.field) return undefined;
        if (this.nameInUse) return `${this.field}-error`;
        if (this.requiredMissing && this.schema.requiredHint) return `${this.field}-hint`;
        if (this.schema.hint) return `${this.field}-hint`;
        return undefined;
      },
      nameInUse() {
        if (!this.schema.checkBotNameUnique) return false;

        const name = String(this.value || '').trim();
        if (!name) return false;

        const exclude = this.schema.excludeBotName;
        if (exclude && name === exclude) return false;

        return botExists(this.bots, name);
      },
    },
    methods: {
      onBlur() {
        this.touched = true;
        if (this.value === '') this.value = this.defaultValue;
      },
      onKeyPress($event) {
        if (this.schema.type !== 'uint64') return true;

        const charCode = ($event.which) ? $event.which : $event.keyCode;
        if ((charCode > 31 && (charCode < 48 || charCode > 57)) && charCode !== 46) return $event.preventDefault();
        return true;
      },
    },
  };
</script>
