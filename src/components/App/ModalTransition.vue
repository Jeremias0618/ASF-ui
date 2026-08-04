<template>
  <transition
    :name="name"
    :duration="duration"
    appear
    v-on="$listeners"
  >
    <slot></slot>
  </transition>
</template>

<script>
  import { MODAL_TRANSITION_MS, MODAL_TRANSITION_NAME } from '../../utils/modal-transition';

  export default {
    name: 'ModalTransition',
    props: {
      name: {
        type: String,
        default: MODAL_TRANSITION_NAME,
      },
      duration: {
        type: Number,
        default: MODAL_TRANSITION_MS,
      },
    },
  };
</script>
