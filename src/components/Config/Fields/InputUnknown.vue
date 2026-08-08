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
      <span class="input-unknown">{{ $t('input-unknown-type') }}</span>
    </div>

    <input-description v-if="hasDescription" :shown="showDescription" :description="description"></input-description>
  </div>
</template>

<script>
  import Input from './Input.vue';

  export default {
    name: 'InputUnknown',
    mixins: [Input],
  };
</script>

<style lang="scss">
  .input-unknown {
    color: var(--color-theme);
    font-weight: 600;
  }
</style>
