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
      <select :id="field" v-model="value" class="form-item__input" :name="field">
        <option v-for="(enumValue, name) in values" v-if="!(name === 'Max' && isLastValue(enumValue))" :key="name" :value="enumValue">
          {{ translateEnum(name) }}
        </option>
      </select>
    </div>

    <input-description v-if="hasDescription" :shown="showDescription" :description="description"></input-description>
  </div>
</template>

<script>
  import Input from './Input.vue';

  export default {
    name: 'InputEnum',
    mixins: [Input],
    computed: {
      values() {
        return this.schema.values;
      },
    },
    methods: {
      isLastValue(value) {
        return value === Math.max(...Object.values(this.values));
      },
    },
  };
</script>
