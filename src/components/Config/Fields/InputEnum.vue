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
        v-model="value"
        :options="selectOptions"
        :placeholder="$t('input-select-enum-value')"
        :aria-labelledby="field ? `${field}-label` : ''"
      ></AsfSelect>
    </div>

    <input-description v-if="hasDescription" :shown="showDescription" :description="description"></input-description>
  </div>
</template>

<script>
  import { BASIC_ONLINE_STATUS_NAMES } from '../../../utils/config-i18n';
  import Input from './Input.vue';

  export default {
    name: 'InputEnum',
    mixins: [Input],
    computed: {
      values() {
        return this.schema.values;
      },
      selectOptions() {
        let entries = Object.entries(this.values || {})
          .filter(([name, enumValue]) => !(name === 'Max' && this.isLastValue(enumValue)));

        if (this.field === 'OnlineStatus') {
          const allowed = new Set(BASIC_ONLINE_STATUS_NAMES);
          entries = entries.filter(([name]) => allowed.has(name));
          entries.sort(([a], [b]) => {
            const ia = BASIC_ONLINE_STATUS_NAMES.indexOf(a);
            const ib = BASIC_ONLINE_STATUS_NAMES.indexOf(b);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
          });
        }

        return entries.map(([name, enumValue]) => ({
          value: enumValue,
          label: this.translateEnum(name),
        }));
      },
    },
    methods: {
      isLastValue(value) {
        return value === Math.max(...Object.values(this.values));
      },
    },
  };
</script>
