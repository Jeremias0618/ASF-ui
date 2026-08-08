<template>
  <main v-if="label && bot" class="main-container password-crypto">
    <header class="password-crypto__header">
      <p class="password-crypto__eyebrow">{{ bot.viewableName }}</p>
      <h2 class="password-crypto__title">{{ $t('encrypt') }}</h2>
      <p class="password-crypto__lead">{{ $t('encrypt-lead') }}</p>
    </header>

    <div v-if="loading" class="password-crypto__loading" aria-busy="true">
      <FontAwesomeIcon icon="spinner" size="lg" spin></FontAwesomeIcon>
    </div>

    <div v-else class="password-crypto__body">
      <section class="password-crypto__card">
        <div class="password-crypto__card-head">
          <label class="password-crypto__label" for="password-format">{{ formatLabel }}</label>
          <button
            v-if="formatDescription"
            ref="helpBtn"
            type="button"
            class="password-crypto__help"
            :aria-expanded="showFormatHelp ? 'true' : 'false'"
            :aria-label="$t('config-help')"
            @click.stop="toggleFormatHelp"
          >
            <FontAwesomeIcon icon="question"></FontAwesomeIcon>
          </button>
        </div>

        <AsfSelect
          id="password-format"
          v-model="config[key]"
          :options="formatOptions"
          :placeholder="$t('input-select-enum-value')"
        ></AsfSelect>
      </section>

      <section class="password-crypto__card">
        <label class="password-crypto__label password-crypto__label--spaced" for="password">{{ passwordLabel }}</label>
        <div class="password-crypto__field">
          <input
            id="password"
            ref="passwordInput"
            v-model="password"
            class="password-crypto__input"
            :type="inputHidden ? 'password' : 'text'"
            autocomplete="new-password"
            :placeholder="$t('encrypt-password-placeholder')"
            @keydown.enter="savePassword"
          >
          <button
            type="button"
            class="password-crypto__toggle"
            :aria-label="tooltip"
            :aria-pressed="(!inputHidden).toString()"
            @click="switchInputType"
          >
            <FontAwesomeIcon :icon="inputHidden ? 'eye' : 'eye-slash'"></FontAwesomeIcon>
          </button>
        </div>
      </section>

      <div class="password-crypto__actions">
        <button
          type="button"
          class="button button--confirm password-crypto__submit"
          :disabled="!canSubmit"
          @click="savePassword"
        >
          <FontAwesomeIcon v-if="saving" icon="spinner" spin></FontAwesomeIcon>
          <span v-else>{{ $t('encrypt') }}</span>
        </button>

        <button type="button" class="button button--link" @click="$router.back()">
          {{ $t('cancel') }}
        </button>
      </div>
    </div>

    <div
      v-if="showFormatHelp"
      ref="helpPanel"
      class="password-crypto__help-panel"
      :style="helpStyle"
      role="dialog"
      :aria-label="$t('config-help')"
      @click.stop
      v-html="formatDescription"
    ></div>
  </main>
</template>

<script>
  import { mapGetters } from 'vuex';
  import fetchConfigSchema from '../../utils/fetchConfigSchema';
  import loadParameterDescriptions from '../../utils/loadParameterDescriptions';
  import { translateConfigEnum, translateConfigParam } from '../../utils/config-i18n';

  export default {
    name: 'PasswordEncrypt',
    data() {
      return {
        password: '',
        inputHidden: true,
        config: {},
        loading: true,
        formatSchema: null,
        formatDescription: '',
        showFormatHelp: false,
        helpStyle: {},
        saving: false,
      };
    },
    computed: {
      ...mapGetters({
        version: 'asf/version',
      }),
      label() {
        return this.$route.params.label;
      },
      passwordLabel() {
        return translateConfigParam(this, this.label);
      },
      formatLabel() {
        return translateConfigParam(this, this.key);
      },
      key() {
        if (this.$route.params.label.startsWith('Steam')) return 'PasswordFormat';
        return `${this.$route.params.label}Format`;
      },
      bot() {
        return this.$store.getters['bots/bot'](this.$route.params.bot);
      },
      tooltip() {
        return this.inputHidden ? this.$t('input-switch-show') : this.$t('input-switch-hide');
      },
      formatOptions() {
        const values = (this.formatSchema && this.formatSchema.values) || {};
        return Object.entries(values)
          .filter(([name, enumValue]) => !(name === 'Max' && enumValue === Math.max(...Object.values(values))))
          .map(([name, enumValue]) => ({
            value: enumValue,
            label: translateConfigEnum(this, name),
          }));
      },
      canSubmit() {
        return !!this.password && !this.saving && this.config[this.key] != null;
      },
    },
    watch: {
      showFormatHelp(isOpen) {
        this.unbindHelp();
        if (!isOpen) return;
        this.$nextTick(() => {
          this.positionHelp();
          document.addEventListener('click', this.onHelpOutside, true);
          document.addEventListener('keydown', this.onHelpEscape, true);
          window.addEventListener('resize', this.positionHelp, { passive: true });
          window.addEventListener('scroll', this.positionHelp, true);
        });
      },
    },
    beforeDestroy() {
      this.unbindHelp();
    },
    async created() {
      if (!this.label || !this.bot) this.$router.replace({ name: 'bots' });

      const [
        { body: fields },
        { [this.bot.name]: { BotConfig: model } },
        descriptions,
      ] = await Promise.all([
        fetchConfigSchema('ArchiSteamFarm.Steam.Storage.BotConfig'),
        this.$http.get(`bot/${this.bot.name}`),
        loadParameterDescriptions(this.version, this.$i18n.locale),
      ]);

      Object.keys(model).forEach(key => {
        if (key.startsWith('s_')) delete model[key.substr(2)];
      });

      this.formatSchema = fields[this.key];
      this.config = { [this.key]: model[this.key] };
      this.formatDescription = (!descriptions[this.key])
        ? this.$t('description-not-found')
        : descriptions[this.key].replace(/<a href="/g, '<a target="_blank" rel="noreferrer noopener" href="');

      this.loading = false;
    },
    methods: {
      toggleFormatHelp() {
        this.showFormatHelp = !this.showFormatHelp;
      },
      positionHelp() {
        const btn = this.$refs.helpBtn;
        if (!btn) return;

        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const maxWidth = Math.min(22 * rem, window.innerWidth - 24);
        const rect = btn.getBoundingClientRect();
        let left = Math.min(rect.left, window.innerWidth - maxWidth - 12);
        left = Math.max(12, left);

        const estimatedHeight = Math.min(window.innerHeight * 0.4, 280);
        let top = rect.bottom + 10;
        if (top + estimatedHeight > window.innerHeight - 12) {
          top = Math.max(12, rect.top - estimatedHeight - 10);
        }

        this.helpStyle = {
          position: 'fixed',
          top: `${Math.round(top)}px`,
          left: `${Math.round(left)}px`,
          width: `${Math.round(maxWidth)}px`,
          zIndex: 4000,
        };
      },
      unbindHelp() {
        document.removeEventListener('click', this.onHelpOutside, true);
        document.removeEventListener('keydown', this.onHelpEscape, true);
        window.removeEventListener('resize', this.positionHelp);
        window.removeEventListener('scroll', this.positionHelp, true);
      },
      onHelpOutside(event) {
        const helpBtn = this.$refs.helpBtn;
        const panel = this.$refs.helpPanel;
        if ((helpBtn && helpBtn.contains(event.target)) || (panel && panel.contains(event.target))) return;
        this.showFormatHelp = false;
      },
      onHelpEscape(event) {
        if (event.key !== 'Escape') return;
        event.stopImmediatePropagation();
        event.preventDefault();
        this.showFormatHelp = false;
      },
      switchInputType() {
        this.inputHidden = !this.inputHidden;
        this.$nextTick(() => {
          const field = this.$refs.passwordInput;
          if (field) field.focus();
        });
      },
      async savePassword() {
        if (!this.canSubmit) return;
        this.saving = true;

        try {
          const steamPassword = await this.$http.post('asf/encrypt', {
            CryptoMethod: this.config[this.key],
            StringToEncrypt: this.password,
          });

          const params = { steamPassword, passwordFormat: this.config[this.key] };

          this.$info(this.$t('encrypt-success'));
          this.$router.push({ name: 'bot-config', params });
        } finally {
          this.saving = false;
        }
      },
    },
  };
</script>

<style lang="scss">
  .password-crypto {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    max-width: 100%;
    min-width: 0;
    padding: 1.2rem 1.25rem 1.3rem;
    width: 100%;
  }

  .password-crypto__header {
    padding-right: 2rem;
  }

  .password-crypto__eyebrow {
    color: var(--h2-muted, var(--color-text-disabled));
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    margin: 0 0 0.3rem;
    text-transform: uppercase;
  }

  .password-crypto__title {
    font-size: 1.45rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0;
  }

  .password-crypto__lead {
    color: var(--h2-muted, var(--color-text-disabled));
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0.5rem 0 0;
  }

  .password-crypto__loading {
    align-items: center;
    color: var(--h2-muted, var(--color-text-disabled));
    display: flex;
    justify-content: center;
    min-height: 9rem;
  }

  .password-crypto__body {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    min-width: 0;
  }

  .password-crypto__card {
    background: var(--h2-surface, rgba(0, 0, 0, 0.12));
    border: 1px solid var(--h2-border, rgba(255, 255, 255, 0.06));
    border-radius: 0.85rem;
    padding: 1rem 1rem 1.1rem;

    .app--dark-mode & {
      background: rgba(255, 255, 255, 0.035);
    }
  }

  .password-crypto__card-head {
    align-items: center;
    display: flex;
    gap: 0.35rem;
    margin-bottom: 0.65rem;
  }

  .password-crypto__label {
    color: inherit;
    display: block;
    flex: 1 1 auto;
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0;
    min-width: 0;

    &--spaced {
      margin-bottom: 0.65rem;
    }
  }

  .password-crypto__help {
    align-items: center;
    appearance: none;
    background: transparent;
    border: 0;
    border-radius: 999px;
    color: var(--h2-muted, var(--color-text-disabled));
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    height: 1.55rem;
    justify-content: center;
    margin: 0;
    padding: 0;
    width: 1.55rem;

    &:hover,
    &[aria-expanded='true'] {
      background: var(--h2-brand-50, rgba(14, 165, 233, 0.14));
      color: var(--h2-brand, var(--color-theme));
    }
  }

  .password-crypto__help-panel {
    background: var(--h2-shell, #1b2233);
    border: 1px solid var(--h2-border, rgba(255, 255, 255, 0.1));
    border-radius: 0.7rem;
    box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.65);
    box-sizing: border-box;
    color: var(--h2-muted-2, #cbd5e1);
    font-size: 0.8125rem;
    line-height: 1.5;
    max-height: min(40vh, 18rem);
    overflow: auto;
    padding: 0.85rem 0.95rem;
    -webkit-overflow-scrolling: touch;

    a {
      color: var(--h2-brand, var(--color-theme));
    }

    > *:first-child {
      margin-top: 0;
    }

    > *:last-child {
      margin-bottom: 0;
    }
  }

  .password-crypto__field {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .password-crypto__input {
    background: var(--h2-field, #334155);
    border: 1px solid var(--h2-border, rgba(255, 255, 255, 0.18));
    border-radius: 0.55rem;
    box-sizing: border-box;
    color: #f8fafc;
    font: inherit;
    height: 2.75rem;
    min-width: 0;
    padding: 0 0.85rem;
    width: 100%;

    &::placeholder {
      color: #cbd5e1;
      opacity: 1;
    }

    .app:not(.app--dark-mode) & {
      background: var(--h2-field, #fff);
      border-color: var(--h2-border, #e4e7ec);
      color: var(--h2-ink, #101828);

      &::placeholder {
        color: var(--h2-muted, #667085);
      }
    }

    &:focus {
      border-color: var(--h2-brand, var(--color-theme));
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--h2-brand, var(--color-theme)) 24%, transparent);
      outline: none;
    }

    &::placeholder {
      color: var(--h2-muted, var(--color-text-disabled));
    }
  }

  .password-crypto__toggle {
    align-items: center;
    appearance: none;
    background: var(--h2-field, #334155);
    border: 1px solid var(--h2-border, rgba(255, 255, 255, 0.18));
    border-radius: 0.55rem;
    color: #f8fafc;
    cursor: pointer;
    display: inline-flex;
    flex-shrink: 0;
    height: 2.75rem;
    justify-content: center;
    margin: 0;
    padding: 0;
    width: 2.75rem;

    .app:not(.app--dark-mode) & {
      background: var(--h2-field, #fff);
      border-color: var(--h2-border, #e4e7ec);
      color: var(--h2-muted-2, #475467);
    }

    &:hover,
    &[aria-pressed='true'] {
      background: var(--h2-brand-50, rgba(14, 165, 233, 0.12));
      border-color: var(--h2-brand, var(--color-theme));
      color: var(--h2-brand-600, var(--color-theme));
    }
  }

  .password-crypto__actions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    margin-top: 0.25rem;
    padding-top: 0.15rem;
  }

  .password-crypto__submit {
    min-width: 8rem;
  }

  .password-crypto__submit:disabled {
    opacity: 0.55;
  }

  @media screen and (max-width: 420px) {
    .password-crypto {
      padding: 1rem 0.9rem 1.1rem;
    }

    .password-crypto__actions {
      flex-direction: column;

      > .button {
        justify-content: center;
        width: 100%;
      }
    }
  }
</style>
