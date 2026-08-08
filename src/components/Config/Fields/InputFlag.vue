<template>
  <div class="form-item input-option" :class="{ 'is-help-open': showDescription }">
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
        :options="availableFlagOptions"
        :placeholder="flagPlaceholder"
        :disabled="!availableFlagOptions.length"
        :aria-labelledby="field ? `${field}-label` : ''"
        @input="onFlagSelect"
      ></AsfSelect>

      <div class="input-option__items">
        <button v-for="enumValue in getSelectedFlagValues()" :key="enumValue" class="button input-option__item" @click.prevent="removeFlag(enumValue)">
          {{ translateEnum(resolveFlagName(enumValue)) }}
        </button>
      </div>
    </div>

    <input-description v-if="hasDescription" :shown="showDescription" :description="description"></input-description>
  </div>
</template>

<script>
  import { sortFlagEnumEntries } from '../../../utils/config-i18n';
  import Input from './Input.vue';

  export default {
    name: 'InputFlag',
    mixins: [Input],
    computed: {
      flags() {
        return this.schema.values;
      },
      flagEntries() {
        return sortFlagEnumEntries(this.flags);
      },
      availableFlagOptions() {
        return this.flagEntries
          // eslint-disable-next-line no-bitwise
          .filter(([, enumValue]) => enumValue === 0 || !((this.value & enumValue) === enumValue))
          .map(([name, enumValue]) => ({
            value: enumValue,
            label: this.translateEnum(name),
          }));
      },
      flagPlaceholder() {
        if (!this.availableFlagOptions.length) return this.$t('input-all-selected');
        return this.$t('input-select-enum-value');
      },
    },
    methods: {
      getSelectedFlagValues() {
        // eslint-disable-next-line no-bitwise
        return [...Array(32).keys()].map(i => 1 << i).filter(val => this.value & val);
      },
      onFlagSelect(input) {
        this.addFlag(input);
      },
      addFlag(input) {
        const parsedInput = (typeof (input) !== (typeof (0))) ? parseInt(input, 10) : input;

        if (!parsedInput && parsedInput !== 0) return;

        if (parsedInput === 0) {
          this.value = 0;
        } else {
          this.value |= parsedInput;
        }
      },
      removeFlag(value) {
        this.value &= ~value;
      },
      resolveFlagName(value) {
        return Object.keys(this.flags).find(key => this.flags[key] === value);
      },
    },
  };
</script>
