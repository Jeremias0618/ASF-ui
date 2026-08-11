<template>
  <div class="asf-icon-tabs" role="tablist" :aria-label="ariaLabel || undefined">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      class="asf-icon-tabs__tab"
      :class="{ 'is-active': value === tab.id }"
      :aria-selected="value === tab.id ? 'true' : 'false'"
      @click="$emit('input', tab.id)"
    >
      <FontAwesomeIcon
        v-if="tab.icon"
        :icon="tab.icon"
        class="asf-icon-tabs__icon"
        aria-hidden="true"
      ></FontAwesomeIcon>
      <span class="asf-icon-tabs__label">{{ tab.label }}</span>
      <span v-if="tab.count != null" class="asf-icon-tabs__count">{{ tab.count }}</span>
    </button>
  </div>
</template>

<script>
  export default {
    name: 'AsfIconTabs',
    props: {
      value: { type: String, required: true },
      tabs: { type: Array, required: true },
      ariaLabel: { type: String, default: '' },
    },
  };
</script>

<style lang="scss">
  .asf-icon-tabs {
    --asf-icon-tabs-idle: #8f98a0;
    --asf-icon-tabs-hover: #c6d4df;
    --asf-icon-tabs-active: #fff;
    --asf-icon-tabs-underline: #fff;
    --asf-icon-tabs-accent: #66c0f4;
    --asf-icon-tabs-count-bg: rgba(0, 0, 0, 0.28);

    box-sizing: border-box;
    display: flex;
    flex-wrap: wrap;
    gap: 0.15rem 0.35rem;
    justify-content: center;
    width: 100%;
  }

  .asf-icon-tabs__tab {
    appearance: none;
    align-items: center;
    background: transparent;
    border: 0;
    border-bottom: 2px solid transparent;
    color: var(--asf-icon-tabs-idle);
    cursor: pointer;
    display: inline-flex;
    flex-direction: column;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 650;
    gap: 0.35rem;
    min-width: 4.6rem;
    padding: 0.45rem 0.7rem 0.55rem;

    &.is-active {
      border-bottom-color: var(--asf-icon-tabs-underline);
      color: var(--asf-icon-tabs-active);
    }

    &:hover:not(.is-active) {
      color: var(--asf-icon-tabs-hover);
    }

    &:focus-visible {
      outline: 2px solid var(--asf-icon-tabs-accent);
      outline-offset: 2px;
    }
  }

  .asf-icon-tabs__icon {
    font-size: 1.05rem;
  }

  .asf-icon-tabs__label {
    line-height: 1.15;
    text-align: center;
  }

  .asf-icon-tabs__count {
    background: var(--asf-icon-tabs-count-bg);
    border-radius: 999px;
    color: inherit;
    font-size: 0.7rem;
    font-weight: 700;
    line-height: 1.2;
    min-width: 1.25rem;
    padding: 0.05rem 0.4rem;
    text-align: center;
  }

  .app:not(.app--dark-mode) .asf-icon-tabs {
    --asf-icon-tabs-idle: #475467;
    --asf-icon-tabs-hover: #344054;
    --asf-icon-tabs-active: #101828;
    --asf-icon-tabs-underline: #1570a8;
    --asf-icon-tabs-accent: #1570a8;
    --asf-icon-tabs-count-bg: rgba(16, 24, 40, 0.08);
  }
</style>
