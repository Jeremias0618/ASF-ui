<template>
  <label class="form-item__label" :for="field || undefined">
    <span class="form-item__label-text">{{ label }}</span>
    <button
      v-if="hasDescription"
      type="button"
      class="form-item__description-icon"
      :aria-label="$t('config-help', 'Help')"
      :aria-expanded="helpOpen ? 'true' : 'false'"
      @click.stop.prevent="$emit('toggle-help')"
    >
      <FontAwesomeIcon icon="question"></FontAwesomeIcon>
    </button>
    <button
      v-if="showKey"
      type="button"
      class="form-item__description-icon form-item__description-icon--key"
      :aria-label="$t('config-encrypt', 'Encrypt')"
      @click.stop.prevent="onRoute"
    >
      <FontAwesomeIcon icon="key"></FontAwesomeIcon>
    </button>
  </label>
</template>

<script>
  export default {
    name: 'InputLabel',
    props: {
      label: String,
      field: String,
      hasDescription: Boolean,
      helpOpen: Boolean,
    },
    computed: {
      showKey() {
        return (this.field === 'IPCPassword' && this.$route.name === 'asf-config')
          || (this.field === 'SteamPassword' && this.$route.name === 'bot-config');
      },
    },
    methods: {
      onRoute() {
        if (this.field === 'IPCPassword') return this.$router.push({ name: 'password-hash', params: { label: this.field } });
        if (this.field === 'SteamPassword') return this.$router.push({ name: 'password-encrypt', params: { label: this.field } });
      },
    },
  };
</script>
