<template>
  <div class="form-item" :class="{ 'is-help-open': showDescription, 'has-field-error': nameInUse || hasErrors }">
    <input-label
      :label="label"
      :field="field"
      :hasDescription="hasDescription"
      :helpOpen="showDescription"
      @toggle-help="toggleDescription"
    ></input-label>

    <div class="form-item__value">
      <input
        :id="field"
        v-model="value"
        class="form-item__input"
        :class="{ 'is-invalid': nameInUse }"
        type="text"
        :name="field"
        :placeholder="placeholder"
        :aria-invalid="nameInUse ? 'true' : undefined"
        :aria-describedby="nameInUse && field ? `${field}-error` : undefined"
        :aria-labelledby="field ? `${field}-label` : undefined"
        @blur="onBlur"
        @keypress="onKeyPress"
      >
      <p v-if="nameInUse" :id="field ? `${field}-error` : undefined" class="form-item__error" role="alert">
        {{ $t('bot-name-in-use') }}
      </p>
      <span v-else-if="hasErrors" class="form-item__error">{{ errorText }}</span>
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
    computed: {
      ...mapGetters({
        bots: 'bots/bots',
      }),
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
