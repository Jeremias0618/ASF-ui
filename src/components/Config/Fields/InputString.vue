<template>
  <div class="form-item" :class="{ 'is-help-open': showDescription }">
    <input-label
      :label="label"
      :field="field"
      :hasDescription="hasDescription"
      :helpOpen="showDescription"
      @toggle-help="toggleDescription"
    ></input-label>

    <div class="form-item__value">
      <input :id="field" v-model="value" class="form-item__input" type="text" :name="field" :placeholder="placeholder" @blur="onBlur" @keypress="onKeyPress">
      <span v-if="hasErrors" class="form-item__error">{{ errorText }}</span>
    </div>

    <input-description v-if="hasDescription" :shown="showDescription" :description="description"></input-description>
  </div>
</template>

<script>
  import Input from './Input.vue';

  export default {
    name: 'InputString',
    mixins: [Input],
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
