<template>
  <button
    type="button"
    class="side-menu__switch"
    :class="{ 'is-on': checked }"
    :aria-pressed="checked ? 'true' : 'false'"
    @click="$emit('click')"
  >
    <span class="side-menu__switch-left">
      <span class="side-menu__switch-icon" aria-hidden="true">
        <FontAwesomeIcon :icon="icon" fixedWidth></FontAwesomeIcon>
      </span>
      <span class="side-menu__switch-label">{{ name }}</span>
    </span>

    <span class="side-menu__toggle" aria-hidden="true">
      <span class="side-menu__toggle-knob"></span>
    </span>
  </button>
</template>

<script>
  export default {
    name: 'SideMenuSwitch',
    props: {
      name: {
        type: String,
        required: true,
      },
      icon: {
        type: String,
        required: true,
      },
      checked: {
        type: Boolean,
        required: true,
      },
    },
  };
</script>

<style lang="scss">
  .side-menu__switch {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 0.7rem;
    box-sizing: border-box;
    color: inherit;
    cursor: pointer;
    display: flex;
    font: inherit;
    gap: 0.75rem;
    justify-content: space-between;
    padding: 0.55rem 0.55rem;
    text-align: left;
    width: 100%;

    &:hover,
    &:focus-visible {
      background: var(--sm-shell, #fff);
      outline: none;
    }

    &.is-on .side-menu__toggle {
      background: var(--sm-brand, #0968e5);
    }

    &.is-on .side-menu__toggle-knob {
      transform: translateX(1.05rem);
    }
  }

  .side-menu__switch-left {
    align-items: center;
    display: inline-flex;
    gap: 0.65rem;
    min-width: 0;
  }

  .side-menu__switch-icon {
    align-items: center;
    background: var(--sm-shell, #fff);
    border: 1px solid var(--sm-border, #e4e7ec);
    border-radius: 0.55rem;
    color: var(--sm-muted, #667085);
    display: inline-flex;
    flex-shrink: 0;
    height: 2rem;
    justify-content: center;
    width: 2rem;

    .side-menu__switch.is-on & {
      color: var(--sm-brand, #0968e5);
    }
  }

  .side-menu__switch-label {
    font-size: 0.88rem;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .side-menu__toggle {
    background: rgba(127, 140, 160, 0.35);
    border-radius: 999px;
    flex-shrink: 0;
    height: 1.35rem;
    position: relative;
    transition: background 0.18s ease;
    width: 2.4rem;
  }

  .side-menu__toggle-knob {
    background: #fff;
    border-radius: 999px;
    box-shadow: 0 1px 3px rgba(16, 24, 40, 0.25);
    height: 1.05rem;
    left: 0.15rem;
    position: absolute;
    top: 0.15rem;
    transition: transform 0.18s ease;
    width: 1.05rem;
  }
</style>
