<template>
  <section class="own-reviews__editor" :aria-label="heading">
    <button type="button" class="own-reviews__back" :disabled="submitting" @click="requestClose">
      <FontAwesomeIcon icon="chevron-left" aria-hidden="true"></FontAwesomeIcon>
      {{ $t('bot-social-reviews-editor-back') }}
    </button>

    <header class="own-reviews__detail-head">
      <GameCoverImage
        class="own-reviews__cover own-reviews__cover--detail"
        :appId="appId"
        :name="title"
        :botName="botName"
        :src="coverUrl"
        :alt="title"
        variant="banner"
      ></GameCoverImage>
      <div class="own-reviews__detail-title">
        <h3 class="own-reviews__title">{{ heading }}</h3>
        <p class="own-reviews__meta">{{ title }}</p>
      </div>
    </header>

    <div v-if="loadState === 'loading'" class="bot-social__state">
      <FontAwesomeIcon icon="spinner" spin></FontAwesomeIcon>
      <span>{{ $t('bot-social-reviews-editor-loading') }}</span>
    </div>

    <div v-else-if="loadState === 'error'" class="bot-social__state bot-social__state--error">
      <span>{{ loadError }}</span>
      <button type="button" class="own-reviews__link-btn" @click="loadStored">
        {{ $t('bot-social-reviews-retry') }}
      </button>
    </div>

    <form v-else class="own-reviews__form" novalidate @submit.prevent="submit">
      <fieldset class="own-reviews__field" :disabled="submitting">
        <legend class="own-reviews__field-label">{{ $t('bot-social-reviews-editor-recommend-q') }}</legend>
        <div class="own-reviews__choices" role="radiogroup" :aria-label="$t('bot-social-reviews-editor-recommend-q')">
          <button
            type="button"
            role="radio"
            class="own-reviews__choice own-reviews__choice--yes"
            :class="{ 'is-active': recommended === true }"
            :aria-checked="recommended === true ? 'true' : 'false'"
            @click="recommended = true"
          >
            <FontAwesomeIcon icon="thumbs-up" aria-hidden="true"></FontAwesomeIcon>
            {{ $t('bot-social-reviews-recommend-yes') }}
          </button>
          <button
            type="button"
            role="radio"
            class="own-reviews__choice own-reviews__choice--no"
            :class="{ 'is-active': recommended === false }"
            :aria-checked="recommended === false ? 'true' : 'false'"
            @click="recommended = false"
          >
            <FontAwesomeIcon icon="thumbs-down" aria-hidden="true"></FontAwesomeIcon>
            {{ $t('bot-social-reviews-recommend-no') }}
          </button>
        </div>
        <p v-if="recommended === null" class="own-reviews__hint">{{ $t('bot-social-reviews-editor-needs-recommendation') }}</p>
      </fieldset>

      <div class="own-reviews__field">
        <label class="own-reviews__field-label" :for="textId">{{ $t('bot-social-reviews-editor-text') }}</label>
        <textarea
          :id="textId"
          ref="text"
          v-model="text"
          class="own-reviews__textarea"
          rows="10"
          :maxlength="maxLength"
          :disabled="submitting"
          :placeholder="$t('bot-social-reviews-editor-placeholder')"
        ></textarea>
        <p class="own-reviews__counter" :class="{ 'is-full': length >= maxLength }">
          {{ $t('bot-social-reviews-editor-counter', { n: length, max: maxLength }) }}
        </p>
      </div>

      <div v-if="mode === 'publish'" class="own-reviews__field own-reviews__field--inline">
        <label class="own-reviews__field-label" :for="languageId">{{ $t('bot-social-reviews-editor-language') }}</label>
        <select :id="languageId" v-model="language" class="own-reviews__select" :disabled="submitting">
          <option v-for="item in languages" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>
      </div>

      <div v-if="needsRatingReset" class="own-reviews__warning" role="alert">
        <p>{{ $t('bot-social-reviews-editor-reset-warning') }}</p>
        <label class="own-reviews__check">
          <input v-model="confirmRatingReset" type="checkbox" :disabled="submitting">
          {{ $t('bot-social-reviews-editor-reset-confirm') }}
        </label>
      </div>

      <p v-if="error" class="own-reviews__error" role="alert">
        {{ error }}
        <button
          v-if="errorCode === 'review_exists'"
          type="button"
          class="own-reviews__link-btn"
          @click="openExisting"
        >
          {{ $t('bot-social-reviews-editor-open-existing') }}
        </button>
      </p>

      <footer class="own-reviews__actions">
        <button type="button" class="own-reviews__action" :disabled="submitting" @click="requestClose">
          {{ $t('bot-social-reviews-editor-cancel') }}
        </button>
        <button
          type="submit"
          class="own-reviews__action own-reviews__action--primary"
          :disabled="!canSubmit"
        >
          <FontAwesomeIcon :icon="submitting ? 'spinner' : 'pen-square'" :spin="submitting" aria-hidden="true"></FontAwesomeIcon>
          {{ submitLabel }}
        </button>
      </footer>
    </form>
  </section>
</template>

<script>
  import unsavedChangesMixin from '../../../../mixins/unsaved-changes';
  import { confirmLeaveIfNeeded, markClean } from '../../../../utils/unsaved-changes';
  import {
    REVIEW_MAX_LENGTH,
    loadOwnReviewEditor,
    ownReviewsErrorCode,
    publishReview,
    saveReviewEdit,
  } from '../../cache/own-reviews-session';
  import { REVIEW_LANGUAGES, reviewLanguageForLocale } from '../../constants/review-languages';
  import ownReviewsText from '../../mixins/own-reviews-text';
  import GameCoverImage from '../games/cover-image.vue';

  let editorCounter = 0;

  /** One editor for both operations: «publish» starts empty, «edit» starts from what Steam stores. */
  export default {
    name: 'BotSocialOwnReviewsEditor',
    components: { GameCoverImage },
    mixins: [ownReviewsText, unsavedChangesMixin],
    props: {
      botName: { type: String, required: true },
      mode: { type: String, required: true, validator: value => value === 'publish' || value === 'edit' },
      appId: { type: Number, required: true },
      title: { type: String, default: '' },
      coverUrl: { type: String, default: '' },
    },
    data() {
      editorCounter += 1;
      return {
        textId: `own-review-text-${editorCounter}`,
        languageId: `own-review-language-${editorCounter}`,
        languages: REVIEW_LANGUAGES,
        loadState: this.mode === 'edit' ? 'loading' : 'ready', // loading | ready | error
        loadError: '',
        maxLength: REVIEW_MAX_LENGTH,
        /** What the form started from (what Steam stores when editing). */
        initialText: '',
        initialRecommended: null,
        recommended: null,
        text: '',
        language: reviewLanguageForLocale(this.$i18n.locale),
        confirmRatingReset: false,
        submitting: false,
        done: false,
        error: '',
        errorCode: '',
      };
    },
    computed: {
      heading() {
        return this.$t(this.mode === 'edit' ? 'bot-social-reviews-editor-edit-title' : 'bot-social-reviews-editor-write-title');
      },
      length() {
        return this.text.length;
      },
      trimmed() {
        return this.text.trim();
      },
      changed() {
        return this.trimmed !== this.initialText.trim() || this.recommended !== this.initialRecommended;
      },
      isDirty() {
        if (this.done || this.loadState !== 'ready') return false;
        return this.mode === 'edit' ? this.changed : (this.trimmed !== '' || this.recommended !== null);
      },
      unsavedChangesMessage() {
        return this.$t('bot-social-reviews-editor-unsaved');
      },
      /** Steam clears the ratings other users gave a review when its recommendation changes. */
      needsRatingReset() {
        return this.mode === 'edit' && this.initialRecommended !== null && this.recommended !== null
          && this.recommended !== this.initialRecommended;
      },
      canSubmit() {
        if (this.submitting || this.loadState !== 'ready') return false;
        if (this.recommended === null || this.trimmed === '' || this.length > this.maxLength) return false;
        if (this.mode === 'edit' && !this.changed) return false;
        return !this.needsRatingReset || this.confirmRatingReset;
      },
      submitLabel() {
        if (this.submitting) return this.$t(this.mode === 'edit' ? 'bot-social-reviews-editor-saving' : 'bot-social-reviews-editor-publishing');
        return this.$t(this.mode === 'edit' ? 'bot-social-reviews-editor-save' : 'bot-social-reviews-editor-publish');
      },
    },
    watch: {
      needsRatingReset(value) {
        if (!value) this.confirmRatingReset = false;
      },
    },
    created() {
      if (this.mode === 'edit') this.loadStored();
    },
    mounted() {
      if (this.mode === 'publish' && this.$refs.text) this.$refs.text.focus();
    },
    methods: {
      async loadStored() {
        const { botName, appId } = this;
        this.loadState = 'loading';
        this.loadError = '';
        try {
          const stored = await loadOwnReviewEditor(botName, appId);
          if (botName !== this.botName || appId !== this.appId) return;
          this.initialText = stored.text;
          this.initialRecommended = stored.recommended;
          this.text = stored.text;
          this.recommended = stored.recommended;
          this.maxLength = stored.maxLength;
          this.loadState = 'ready';
        } catch (err) {
          if (botName !== this.botName || appId !== this.appId) return;
          this.loadState = 'error';
          this.loadError = this.reviewsErrorFrom(err);
        }
      },
      /** Leaving with an unsaved draft asks first (the same guard the other forms use). */
      requestClose() {
        if (this.submitting) return;
        if (!confirmLeaveIfNeeded(this.isDirty, this.unsavedChangesMessage)) return;
        markClean();
        this.$emit('close');
      },
      openExisting() {
        if (this.submitting) return;
        const hasDraft = this.trimmed !== '';
        if (hasDraft && !confirmLeaveIfNeeded(true, this.$t('bot-social-reviews-editor-open-existing-confirm'))) return;
        markClean();
        this.$emit('edit-existing', this.appId);
      },
      async submit() {
        // Synchronous guard: a double click / Enter can never send the same review twice.
        if (this.submitting || !this.canSubmit) return;
        this.submitting = true;
        this.error = '';
        this.errorCode = '';
        try {
          const input = { recommended: this.recommended, text: this.trimmed };
          const result = this.mode === 'edit'
            ? await saveReviewEdit(this.botName, this.appId, { ...input, confirmRatingReset: this.confirmRatingReset })
            : await publishReview(this.botName, { ...input, appId: this.appId, language: this.language });
          this.done = true;
          markClean();
          this.$emit('saved', { mode: this.mode, result });
        } catch (err) {
          // The draft stays exactly as it was: only the message changes.
          this.errorCode = ownReviewsErrorCode(err);
          this.error = this.reviewsErrorFrom(err);
        } finally {
          this.submitting = false;
        }
      },
    },
  };
</script>
