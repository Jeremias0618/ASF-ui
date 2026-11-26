/**
 * Shared text helpers for the «Mis reseñas» panels.
 * Everything coming from Steam/the plugin is rendered through Vue text interpolation only
 * (never v-html), so review text cannot inject markup.
 */
import { ownReviewsErrorCode, ownReviewsErrorDetail } from '../cache/own-reviews-session';

export default {
  methods: {
    /** Friendly text for a plugin error code ("session_expired", …); falls back to the raw message. */
    reviewsErrorText(code, fallback, detail = '') {
      if (code) {
        const key = `bot-social-reviews-error-${code}`;
        const text = this.$t(key, { detail });
        if (text && text !== key) return text;
      }
      return fallback || this.$t('bot-social-reviews-error-generic');
    },
    /**
     * Text for an error thrown by a plugin call: the stable code when there is one, a wait hint when the
     * plugin rate-limited the call ("Retry in 3s"), otherwise the plain message.
     */
    reviewsErrorFrom(err) {
      const message = String(err?.message || '');
      const code = ownReviewsErrorCode(err);
      const wait = /retry in (\d+)s/i.exec(message);
      if (!code && wait) return this.$t('bot-social-reviews-error-rate_limited', { n: wait[1] });
      return this.reviewsErrorText(code, message, ownReviewsErrorDetail(err));
    },
    reviewRecommendLabel(recommended) {
      if (recommended === true) return this.$t('bot-social-reviews-recommend-yes');
      if (recommended === false) return this.$t('bot-social-reviews-recommend-no');
      return this.$t('bot-social-reviews-recommend-unknown');
    },
    reviewDateLabel(item) {
      if (item.postedDate) {
        const date = new Date(`${item.postedDate}T00:00:00`);
        if (!Number.isNaN(date.getTime())) {
          return date.toLocaleDateString(this.$i18n.locale, { year: 'numeric', month: 'short', day: 'numeric' });
        }
      }
      return item.postedText || '';
    },
    /** Counters Steam really returned; missing ones are omitted (never shown as 0). */
    reviewCounters(item) {
      const rows = [];
      if (item.helpful != null) {
        rows.push({
          key: 'helpful', icon: 'thumbs-up', label: this.$t('bot-social-reviews-counter-helpful'), value: item.helpful,
        });
      }
      if (item.funny != null) {
        rows.push({
          key: 'funny', icon: 'smile', label: this.$t('bot-social-reviews-counter-funny'), value: item.funny,
        });
      }
      return rows;
    },
    steamStoreUrl(appId) {
      return `https://store.steampowered.com/app/${encodeURIComponent(appId)}/`;
    },
  },
};
