<template>
  <section class="friends-hub__compose" :aria-label="$t('bot-social-friends-send-title')">
    <div class="friends-hub__compose-panel">
      <header class="friends-hub__compose-header">
        <p class="friends-hub__compose-eyebrow">{{ $t('bot-social-friends-mode-send') }}</p>
        <h3 class="friends-hub__compose-title">{{ $t('bot-social-friends-send-title') }}</h3>
        <p class="friends-hub__compose-lead">{{ $t('bot-social-friends-send-lead') }}</p>
      </header>

      <form class="friends-hub__compose-form" @submit.prevent="$emit('submit')">
        <label class="friends-hub__field-label" for="friends-send-target">
          {{ $t('bot-social-friends-send-target-label') }}
        </label>
        <div class="friends-hub__compose-combo">
          <input
            id="friends-send-target"
            class="friends-hub__compose-input"
            type="text"
            :value="target"
            :placeholder="$t('bot-social-friends-send-placeholder')"
            :disabled="submitting"
            autocomplete="off"
            spellcheck="false"
            @input="$emit('update:target', $event.target.value)"
          >
          <button
            type="submit"
            class="friends-hub__compose-submit"
            :disabled="!target || submitting"
          >
            <FontAwesomeIcon v-if="submitting" icon="spinner" spin aria-hidden="true"></FontAwesomeIcon>
            <span v-else>{{ $t('bot-social-friends-send-submit') }}</span>
          </button>
        </div>
      </form>

      <div class="friends-hub__compose-help" :aria-label="$t('bot-social-friends-send-formats')">
        <p class="friends-hub__compose-help-title">{{ $t('bot-social-friends-send-formats') }}</p>
        <ul class="friends-hub__compose-examples">
          <li><code>{{ $t('bot-social-friends-send-example-steamid') }}</code></li>
          <li><code>{{ $t('bot-social-friends-send-example-code') }}</code></li>
          <li><code>{{ $t('bot-social-friends-send-example-vanity') }}</code></li>
          <li><code>{{ $t('bot-social-friends-send-example-profiles') }}</code></li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>
  export default {
    name: 'FriendsComposePanel',
    props: {
      target: { type: String, default: '' },
      submitting: { type: Boolean, default: false },
    },
  };
</script>
