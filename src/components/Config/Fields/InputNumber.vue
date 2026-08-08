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
      <input :id="field" v-model.number="value" class="form-item__input" type="number" :name="field" :placeholder="placeholder" @blur="onBlur">
      <span v-if="hasErrors" class="form-item__error">{{ errorText }}</span>
    </div>

    <input-description v-if="hasDescription" :shown="showDescription" :description="description"></input-description>
  </div>
</template>

<script>
  import Input from './Input.vue';

  export default {
    name: 'InputNumber',
    mixins: [Input],
    methods: {
      onBlur() {
        if (this.value === '') this.value = this.defaultValue;
      },
    },
  };
</script>
