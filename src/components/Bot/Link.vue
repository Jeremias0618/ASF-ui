<template>
  <div
    v-if="disabled"
    v-show="visible"
    class="bot-action bot-action--disabled"
    role="button"
    aria-disabled="true"
    @click.prevent.stop
  >
    <span v-if="name" class="bot-action__label">{{ name }}</span>
    <FontAwesomeIcon v-if="icon" class="bot-action__icon" :icon="icon"></FontAwesomeIcon>
  </div>
  <router-link v-else v-show="visible" v-slot="{ navigate }" custom :to="link">
    <div class="bot-action" @click="navigate">
      <span v-if="name" class="bot-action__label">{{ name }}</span>
      <FontAwesomeIcon v-if="icon" class="bot-action__icon" :icon="icon"></FontAwesomeIcon>
    </div>
  </router-link>
</template>

<script>
  export default {
    name: 'BotLink',
    props: {
      icon: String,
      name: String,
      link: Object,
      condition: Function,
      disabled: { type: Boolean, default: false },
    },
    computed: {
      visible() {
        if (!this.condition) return true;
        return this.condition();
      },
    },
  };
</script>

<style lang="scss">
  .bot-action {
    color: var(--color-text-disabled);
    cursor: pointer;
    margin: 0 0.1em;
    padding: 0.25em;
    transition: color .3s;

    &:hover {
      color: var(--color-text-dark);

      .app--dark-mode & {
        color: var(--color-text);
      }
    }
  }

  .bot-action--disabled {
    color: rgba(148, 163, 184, 0.35);
    cursor: not-allowed;
    opacity: 0.45;

    .app--dark-mode & {
      color: rgba(148, 163, 184, 0.28);
    }

    &:hover {
      color: rgba(148, 163, 184, 0.35);

      .app--dark-mode & {
        color: rgba(148, 163, 184, 0.28);
      }
    }
  }

  .bot-action__label {
    display: none;
  }

  .bot-action__icon {
    .bot-action__label + & {
      margin-left: 0.5em;
    }
  }
</style>
