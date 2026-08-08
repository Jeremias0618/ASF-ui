<template>
  <div class="bgr-input">
    <label class="bgr-input__label" for="bgr-keys">{{ $t('bgr-keys-insert') }}</label>
    <textarea
      id="bgr-keys"
      ref="user-input"
      v-model="userInput"
      class="bgr-input__textarea"
      rows="12"
      :placeholder="$t('bgr-keys-insert') + '\n\n' + $t('bgr-keys-insert-example')"
      spellcheck="false"
    ></textarea>

    <div class="bgr-input__actions">
      <button type="button" class="button button--confirm" :disabled="!hasKeys" @click="$emit('check', keys, userInput)">
        {{ $t('check') }}
      </button>
    </div>
  </div>
</template>

<script>
  const keyRegex = /[0-9A-Z]{4,7}-[0-9A-Z]{4,7}-[0-9A-Z]{4,7}(?:(?:-[0-9A-Z]{4,7})?(?:-[0-9A-Z]{4,7}))?/;
  const commonDelimiters = [':', ';', '|', '-', ','];

  export default {
    name: 'BgrInput',
    data() {
      return {
        userInput: '',
        userDelimiter: '',
      };
    },
    computed: {
      keys() {
        const lines = this.userInput
          .trim()
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => !!line);

        return this.parseKeys(lines);
      },
      hasKeys() {
        return Object.keys(this.keys).length > 0;
      },
    },
    mounted() {
      this.$refs['user-input'].focus();
    },
    methods: {
      detectKeyNamePair(line) {
        if (!keyRegex.test(line)) return { key: null, name: line };

        const key = keyRegex.exec(line)[0];
        const keyIndex = line.indexOf(key);
        const name = line.replace(key, '').trim();

        if (this.userDelimiter) {
          const delimiterIndex = (keyIndex === 0) ? name.indexOf(this.userDelimiter) : name.lastIndexOf(this.userDelimiter);
          return { key, name: name.slice(delimiterIndex, this.userDelimiter.length).trim() };
        }

        const possibleDelimiter = name.charAt((keyIndex === 0) ? 0 : name.length - 1);
        if (commonDelimiters.includes(possibleDelimiter)) return { key, name: name.slice((keyIndex === 0) ? 1 : 0, name.length - ((keyIndex === 0) ? 0 : 1)).trim() };

        return { key, name };
      },
      parseKeys(lines) {
        const keys = {};

        for (let i = 0; i < lines.length; ++i) {
          const line = lines[i];

          const keyNamePair = this.detectKeyNamePair(line);

          if (keyNamePair.key && keyNamePair.name) {
            keys[keyNamePair.key] = keyNamePair.name;
            continue;
          }

          const nextLine = lines[i + 1];
          const nextKeyNamePair = this.detectKeyNamePair(nextLine);

          if (nextKeyNamePair.name && !nextKeyNamePair.key && !keyNamePair.name) {
            keys[keyNamePair.key] = nextKeyNamePair.name;
          } else if (!nextKeyNamePair.name && nextKeyNamePair.key && !keyNamePair.key) {
            keys[nextKeyNamePair.key] = keyNamePair.name;
          } else if (keyNamePair.key) {
            keys[keyNamePair.key] = keyNamePair.key;
          }
        }

        return keys;
      },
    },
  };
</script>

<style lang="scss">
  .bgr-input {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
    width: 100%;
  }

  .bgr-input__label {
    color: var(--h2-muted, var(--color-text-disabled));
    font-size: 0.8rem;
    font-weight: 600;
  }

  .bgr-input__textarea {
    background: var(--h2-soft, var(--color-background));
    border: 1px solid var(--h2-border, var(--color-border));
    border-radius: 0.7rem;
    box-sizing: border-box;
    color: inherit;
    font-family: inherit;
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
    line-height: 1.5;
    max-width: 100%;
    min-height: 14rem;
    padding: 0.85rem 0.95rem;
    resize: vertical;
    width: 100%;

    &:focus {
      border-color: var(--h2-brand, var(--color-theme));
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--h2-brand, var(--color-theme)) 24%, transparent);
      outline: none;
    }

    &::placeholder {
      color: var(--h2-muted, var(--color-text-disabled));
      opacity: 0.9;
    }
  }

  .bgr-input__actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 0.15rem;

    .button {
      min-width: 8rem;
    }

    @media screen and (max-width: 480px) {
      .button {
        width: 100%;
      }
    }
  }
</style>
