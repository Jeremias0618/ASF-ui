<template>
  <main v-if="bot" class="confirm-danger">
    <div class="confirm-danger__icon" aria-hidden="true">
      <FontAwesomeIcon icon="exclamation-triangle"></FontAwesomeIcon>
    </div>

    <h2 class="confirm-danger__title">
      {{ $t('bot-delete-title', { name: bot.viewableName }) }}
    </h2>

    <p class="confirm-danger__body" v-html="$t('bot-delete-body', { name: bot.viewableName })"></p>

    <div class="confirm-danger__confirm">
      <label for="bot-delete-confirm" class="confirm-danger__label" v-html="$t('confirmation', { name: bot.viewableName })"></label>
      <input
        id="bot-delete-confirm"
        ref="confirmInput"
        v-model="confirmationText"
        class="confirm-danger__input"
        :class="{ 'is-ready': confirmed }"
        type="text"
        autocomplete="off"
        spellcheck="false"
        :placeholder="bot.viewableName"
        @keydown.enter.prevent="onEnter"
      >
    </div>

    <div class="confirm-danger__actions">
      <button type="button" class="button confirm-danger__cancel" :disabled="deleting" @click="$parent.back()">
        {{ $t('cancel') }}
      </button>
      <button
        type="button"
        class="button confirm-danger__delete"
        :disabled="!confirmed || deleting"
        @click="onDelete"
      >
        <FontAwesomeIcon v-if="deleting" icon="spinner" spin fixedWidth aria-hidden="true"></FontAwesomeIcon>
        <span v-else>{{ $t('delete') }}</span>
      </button>
    </div>
  </main>
</template>

<script>
  import delay from '../../utils/delay';

  export default {
    name: 'BotDelete',
    data() {
      return {
        deleting: false,
        confirmationText: '',
      };
    },
    computed: {
      bot() {
        return this.$store.getters['bots/bot'](this.$route.params.bot);
      },
      confirmed() {
        return this.confirmationText === this.bot.viewableName;
      },
    },
    created() {
      if (!this.bot) this.$router.replace({ name: 'bots' });
    },
    mounted() {
      this.$nextTick(() => {
        if (this.$refs.confirmInput) this.$refs.confirmInput.focus();
      });
    },
    methods: {
      onEnter() {
        if (this.confirmed && !this.deleting) this.onDelete();
      },
      async onDelete() {
        if (!this.confirmed || this.deleting) return;

        this.deleting = true;

        try {
          await this.$http.del(`bot/${this.bot.name}`);
          await delay(1000);
          await this.$store.dispatch('bots/updateBot', { name: this.bot.name });
          this.$router.push({ name: 'bots' });
        } finally {
          this.deleting = false;
        }
      },
    },
  };
</script>
