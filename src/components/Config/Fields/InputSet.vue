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
      <AsfSelect
        :id="field"
        :value="null"
        :options="availableSelectOptions"
        :placeholder="listPlaceholder"
        :disabled="!availableEnumValues.length"
        :aria-labelledby="field ? `${field}-label` : ''"
        @input="addElement"
      ></AsfSelect>

      <div class="input-option__items">
        <button v-for="(item, index) in value" :key="index" class="button input-option__item" @click.prevent="removeElement(item)">
          {{ translateEnum(resolveOption(item)) }}
        </button>
      </div>
    </div>

    <input-description v-if="hasDescription" :shown="showDescription" :description="description"></input-description>
  </div>
</template>

<script>
  import Input from './Input.vue';

  export default {
    name: 'InputSet',
    mixins: [Input],
    computed: {
      availableEnumValues() {
        const availableEnumValues = [];

        Object.keys(this.enumValues).forEach(key => {
          if (this.value.includes(this.enumValues[key])) return;
          availableEnumValues.push(this.enumValues[key]);
        });

        return availableEnumValues;
      },
      enumValues() {
        return this.schema.values.values;
      },
      availableSelectOptions() {
        return Object.entries(this.enumValues || {})
          .filter(([, enumValue]) => !this.value.includes(enumValue))
          .map(([name, enumValue]) => ({
            value: enumValue,
            label: this.translateEnum(name),
          }));
      },
      listPlaceholder() {
        if (!this.availableEnumValues.length) return this.$t('input-all-selected');
        return this.$t('input-select-enum-value');
      },
    },
    created() {
      this.value.sort();
    },
    methods: {
      addElement(input) {
        const parsedInput = (typeof (input) !== (typeof (0))) ? parseInt(input, 10) : input;

        if (this.value.includes(parsedInput)) return;

        this.value.push(parsedInput);
        this.value.sort();
      },
      removeElement(input) {
        const parsedInput = (typeof (input) !== (typeof (0))) ? parseInt(input, 10) : input;
        this.value = this.value.filter(item => item !== parsedInput);
      },
      resolveOption(value) {
        return Object.keys(this.enumValues).find(key => this.enumValues[key] === value);
      },
    },
  };
</script>
