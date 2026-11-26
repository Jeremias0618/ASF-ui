import Vue from 'vue';
import {
  editOwnReview,
  fetchOwnReviewDetail,
  fetchOwnReviewEditor,
  fetchOwnReviews,
  publishOwnReview,
} from '../api/bot-social';
import { loadStatus } from './bot-social-queries';

/**
 * Per-bot session state for «Mis reseñas».
 * - Steam serves the author's reviews 10 per page, so pages are read one by one and kept by page number:
 *   opening the modal reads page 1 only; other pages are read when visited, or all of them when the search
 *   (or the «Para reseñar» tab) needs the whole list.
 * - Requests to the plugin are spaced out (its read routes are rate limited per bot).
 * - Nothing here is derived: every counter stays `null` when Steam did not return it.
 */

export const OWN_REVIEWS_CAPABILITY = 'reviews.own.read';
export const OWN_REVIEWS_PUBLISH_CAPABILITY = 'reviews.own.publish';
export const OWN_REVIEWS_EDIT_CAPABILITY = 'reviews.own.edit';

/** Fixed by Steam on /recommended/. */
export const OWN_REVIEWS_PAGE_SIZE = 10;
/** Steam's own limit for a review text. */
export const REVIEW_MAX_LENGTH = 8000;

/** Plugin cooldown is 1.5 s per bot; keep a small safety margin. */
const REQUEST_GAP_MS = 1800;
const MAX_RETRIES = 3;
const MAX_PAGES = 500;
const EXCERPT_LENGTH = 600;

const sessions = new Map();
const generations = new Map();
const details = new Map();
const queues = new Map();
const inflight = new Map();

const keyOf = botName => String(botName || '').toLowerCase();

function pick(raw, name) {
  if (!raw || typeof raw !== 'object') return undefined;
  return raw[name] ?? raw[name.charAt(0).toLowerCase() + name.slice(1)];
}

function toCount(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function unwrap(result, botName) {
  if (!result || typeof result !== 'object') return result;
  if (result[botName] != null) return result[botName];
  const matchKey = Object.keys(result).find(k => k.toLowerCase() === String(botName || '').toLowerCase());
  if (matchKey != null) return result[matchKey];
  const keys = Object.keys(result);
  return keys.length === 1 ? result[keys[0]] : result;
}

function safeImageUrl(value) {
  const url = String(value || '');
  return /^https:\/\//i.test(url) ? url : '';
}

function normalizeAwards(list) {
  return (Array.isArray(list) ? list : []).map(raw => ({
    id: toCount(pick(raw, 'Id')),
    name: String(pick(raw, 'Name') || ''),
    iconUrl: safeImageUrl(pick(raw, 'IconUrl')),
    count: toCount(pick(raw, 'Count')),
  })).filter(a => a.name);
}

export function normalizeOwnReview(raw) {
  const appId = Number(pick(raw, 'AppId'));
  const recommended = pick(raw, 'Recommended');
  return {
    appId,
    // 64-bit ids always travel as strings.
    reviewId: pick(raw, 'ReviewId') != null ? String(pick(raw, 'ReviewId')) : null,
    url: String(pick(raw, 'Url') || ''),
    recommended: typeof recommended === 'boolean' ? recommended : null,
    excerpt: String(pick(raw, 'Excerpt') || ''),
    excerptTruncated: Boolean(pick(raw, 'ExcerptTruncated')),
    postedText: pick(raw, 'PostedText') || null,
    postedDate: pick(raw, 'PostedDate') || null,
    playtimeText: pick(raw, 'PlaytimeText') || null,
    coverUrl: safeImageUrl(pick(raw, 'CoverUrl')),
    helpful: toCount(pick(raw, 'HelpfulCount')),
    funny: toCount(pick(raw, 'FunnyCount')),
    awards: normalizeAwards(pick(raw, 'Awards')),
  };
}

export function normalizeOwnReviewDetail(raw) {
  const recommended = pick(raw, 'Recommended');
  return {
    appId: Number(pick(raw, 'AppId')),
    reviewId: pick(raw, 'ReviewId') != null ? String(pick(raw, 'ReviewId')) : null,
    url: String(pick(raw, 'Url') || ''),
    title: pick(raw, 'Title') || null,
    recommended: typeof recommended === 'boolean' ? recommended : null,
    text: String(pick(raw, 'Text') || ''),
    postedText: pick(raw, 'PostedText') || null,
    playtimeText: pick(raw, 'PlaytimeText') || null,
    helpful: toCount(pick(raw, 'HelpfulCount')),
    funny: toCount(pick(raw, 'FunnyCount')),
    awards: normalizeAwards(pick(raw, 'Awards')),
  };
}

/** What Steam's own edit form holds: the stored (raw) text and the current recommendation. */
export function normalizeOwnReviewEditor(raw) {
  return {
    appId: Number(pick(raw, 'AppId')),
    reviewId: pick(raw, 'ReviewId') != null ? String(pick(raw, 'ReviewId')) : null,
    url: String(pick(raw, 'Url') || ''),
    recommended: pick(raw, 'Recommended') === true,
    text: String(pick(raw, 'Text') || ''),
    receivedCompensation: Boolean(pick(raw, 'ReceivedCompensation')),
    maxLength: toCount(pick(raw, 'MaxLength')) || REVIEW_MAX_LENGTH,
  };
}

function normalizeWriteResult(raw) {
  const review = pick(raw, 'Review');
  return {
    operation: String(pick(raw, 'Operation') || ''),
    appId: Number(pick(raw, 'AppId')),
    verified: Boolean(pick(raw, 'Verified')),
    review: review ? normalizeOwnReviewDetail(review) : null,
  };
}

/** Machine-readable prefix added by the plugin ("session_expired: …"). */
export function ownReviewsErrorCode(err) {
  const message = String(err?.message || '');
  const match = /^([a-z_]+):\s/.exec(message);
  if (match) return match[1];
  // ASF itself answers 503 "Bot is not connected" before the plugin code runs.
  return /not connected/i.test(message) ? 'bot_not_connected' : '';
}

/** The human part of a plugin error ("steam_rejected: <text from Steam>" → "<text from Steam>"). */
export function ownReviewsErrorDetail(err) {
  return String(err?.message || '').replace(/^[a-z_]+:\s/, '');
}

function retryAfterMs(err) {
  const match = /retry in (\d+)s/i.exec(String(err?.message || ''));
  return match ? (Number(match[1]) + 1) * 1000 : 0;
}

const sleep = ms => new Promise(resolve => {
  setTimeout(resolve, ms);
});

/** Runs plugin reads of one bot one after another, at least REQUEST_GAP_MS apart. */
function schedule(botName, task) {
  const key = keyOf(botName);
  let queue = queues.get(key);
  if (!queue) {
    queue = { tail: Promise.resolve(), last: 0 };
    queues.set(key, queue);
  }
  const run = async () => {
    const wait = REQUEST_GAP_MS - (Date.now() - queue.last);
    if (wait > 0) await sleep(wait);
    try {
      return await task();
    } finally {
      queue.last = Date.now();
    }
  };
  const result = queue.tail.then(run, run);
  queue.tail = result.catch(() => {});
  return result;
}

/** Reads with a few retries when the plugin answers "Retry in Ns". */
async function withRetry(botName, task) {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await schedule(botName, task);
    } catch (err) {
      const wait = retryAfterMs(err);
      attempt += 1;
      if (!wait || attempt > MAX_RETRIES) throw err;
      // eslint-disable-next-line no-await-in-loop
      await sleep(wait);
    }
  }
}

function newSession() {
  return Vue.observable({
    /** page number → normalized reviews of that page */
    pages: {},
    /** page number → { hasMore } as Steam answered for that page */
    meta: {},
    /** every loaded review, in Steam's order */
    items: [],
    total: null,
    /** True only when Steam's list was read to its end. */
    complete: false,
    /** Steam says there are more pages after the highest one read. */
    hasMore: false,
    /** Steam returned no entries and gave no total (none, or an unreadable profile). */
    emptyUnconfirmed: false,
    status: 'idle', // idle | loading | ready | error
    error: '',
    errorCode: '',
    /** Page being read right now (0 = none). */
    pageLoading: 0,
    pageError: '',
    pageErrorCode: '',
    loadingAll: false,
    allError: '',
    updatedAt: 0,
    /** AppIDs published from here that the list read may not include yet. */
    extraReviewed: {},
  });
}

export function getOwnReviewsSession(botName) {
  const key = keyOf(botName);
  let session = sessions.get(key);
  if (!session) {
    session = newSession();
    sessions.set(key, session);
  }
  return session;
}

const generationOf = botName => generations.get(keyOf(botName)) || 0;

export function resetOwnReviewsSession(botName, { keepExtra = false } = {}) {
  const key = keyOf(botName);
  generations.set(key, generationOf(botName) + 1);
  Array.from(inflight.keys()).filter(k => k.endsWith(`:${key}`)).forEach(k => inflight.delete(k));
  details.delete(key);
  const session = getOwnReviewsSession(botName);
  const extra = keepExtra ? session.extraReviewed : {};
  session.pages = {};
  session.meta = {};
  session.items = [];
  session.total = null;
  session.complete = false;
  session.hasMore = false;
  session.emptyUnconfirmed = false;
  session.status = 'idle';
  session.error = '';
  session.errorCode = '';
  session.pageLoading = 0;
  session.pageError = '';
  session.pageErrorCode = '';
  session.loadingAll = false;
  session.allError = '';
  session.updatedAt = 0;
  session.extraReviewed = extra;
  return session;
}

const loadedPageNumbers = session => Object.keys(session.pages).map(Number).sort((a, b) => a - b);

/** Last page number of the author's list (from Steam's total, or from "there is another page"). */
export function ownReviewsLastPage(session) {
  const loaded = loadedPageNumbers(session);
  if (!loaded.length) return 1;
  if (session.total != null) return Math.max(1, Math.ceil(session.total / OWN_REVIEWS_PAGE_SIZE));
  const highest = loaded[loaded.length - 1];
  return highest + (session.meta[highest]?.hasMore ? 1 : 0);
}

function missingPage(session) {
  const last = Math.min(ownReviewsLastPage(session), MAX_PAGES);
  for (let n = 1; n <= last; n += 1) {
    if (!session.pages[n]) return n;
  }
  return 0;
}

function rebuild(session) {
  const known = new Set();
  const items = [];
  loadedPageNumbers(session).forEach(n => {
    session.pages[n].forEach(review => {
      if (known.has(review.appId)) return;
      known.add(review.appId);
      items.push(review);
    });
  });
  session.items = items;
  const loaded = loadedPageNumbers(session);
  const highest = loaded.length ? loaded[loaded.length - 1] : 0;
  session.hasMore = Boolean(highest && session.meta[highest]?.hasMore);
  session.complete = loaded.length > 0 && !session.emptyUnconfirmed && missingPage(session) === 0 && !session.hasMore;
}

function applyPage(session, payload, page) {
  const list = pick(payload, 'Items');
  const incoming = (Array.isArray(list) ? list : []).map(normalizeOwnReview).filter(r => r.appId > 0);
  Vue.set(session.pages, page, incoming);
  // An empty page can never lead anywhere: stop instead of walking up to MAX_PAGES.
  Vue.set(session.meta, page, { hasMore: Boolean(pick(payload, 'HasMore')) && incoming.length > 0 });
  const total = toCount(pick(payload, 'Total'));
  if (total != null) session.total = total;
  if (page === 1) session.emptyUnconfirmed = pick(payload, 'Status') === 'empty_unconfirmed';
  rebuild(session);
  session.updatedAt = Date.now();
}

async function readPage(botName, page) {
  const result = await withRetry(botName, () => fetchOwnReviews(botName, page));
  return unwrap(result, botName);
}

/**
 * Reads one page (no-op when already loaded). Page 1 drives the screen state; other pages report
 * their own loading/error so the list stays usable.
 */
export function loadOwnReviewsPage(botName, page, { force = false } = {}) {
  const key = `page${page}:${keyOf(botName)}`;
  const session = getOwnReviewsSession(botName);
  if (!force && session.pages[page]) return Promise.resolve(session);
  if (inflight.has(key)) return inflight.get(key);

  const generation = generationOf(botName);
  const isFirst = page === 1;
  if (isFirst) {
    session.status = 'loading';
    session.error = '';
    session.errorCode = '';
  } else {
    session.pageLoading = page;
    session.pageError = '';
    session.pageErrorCode = '';
  }

  const promise = (async () => {
    try {
      const payload = await readPage(botName, page);
      if (generation !== generationOf(botName)) return session;
      applyPage(session, payload, page);
      if (isFirst) session.status = 'ready';
    } catch (err) {
      if (generation !== generationOf(botName)) return session;
      if (isFirst) {
        session.status = 'error';
        session.error = err?.message || String(err);
        session.errorCode = ownReviewsErrorCode(err);
      } else {
        session.pageError = err?.message || String(err);
        session.pageErrorCode = ownReviewsErrorCode(err);
      }
    } finally {
      if (!isFirst && session.pageLoading === page) session.pageLoading = 0;
      inflight.delete(key);
    }
    return session;
  })();
  inflight.set(key, promise);
  return promise;
}

/** Reads page 1 (no-op when already loaded unless `force`, which also forgets everything read before). */
export function loadOwnReviewsFirstPage(botName, { force = false, keepExtra = false } = {}) {
  const session = getOwnReviewsSession(botName);
  if (!force && session.pages[1]) return Promise.resolve(session);
  if (force) resetOwnReviewsSession(botName, { keepExtra });
  return loadOwnReviewsPage(botName, 1);
}

/** Reads every page that is still missing, one by one, until the list is complete (or an error stops it). */
export function loadOwnReviewsAll(botName) {
  const key = `all:${keyOf(botName)}`;
  const session = getOwnReviewsSession(botName);
  if (inflight.has(key)) return inflight.get(key);
  if (!session.pages[1] || session.complete) return Promise.resolve(session);

  const generation = generationOf(botName);
  session.loadingAll = true;
  session.allError = '';

  const promise = (async () => {
    try {
      let next = missingPage(session);
      while (next && generation === generationOf(botName)) {
        // eslint-disable-next-line no-await-in-loop
        const payload = await readPage(botName, next);
        if (generation !== generationOf(botName)) break;
        applyPage(session, payload, next);
        next = missingPage(session);
      }
    } catch (err) {
      if (generation === generationOf(botName)) session.allError = err?.message || String(err);
    } finally {
      if (generation === generationOf(botName)) session.loadingAll = false;
      inflight.delete(key);
    }
    return session;
  })();
  inflight.set(key, promise);
  return promise;
}

function detailBucket(botName) {
  const key = keyOf(botName);
  let bucket = details.get(key);
  if (!bucket) {
    bucket = new Map();
    details.set(key, bucket);
  }
  return bucket;
}

/** Detail of one review. Cached per bot+app for the session; pass `force` to re-read. */
export async function loadOwnReviewDetail(botName, appId, { force = false } = {}) {
  const bucket = detailBucket(botName);
  if (!force && bucket.has(appId)) return bucket.get(appId);
  const result = await withRetry(botName, () => fetchOwnReviewDetail(botName, appId));
  const detail = normalizeOwnReviewDetail(unwrap(result, botName));
  bucket.set(appId, detail);
  return detail;
}

/** Always read fresh: the editor must start from what Steam stores right now. */
export async function loadOwnReviewEditor(botName, appId) {
  const result = await withRetry(botName, () => fetchOwnReviewEditor(botName, appId));
  return normalizeOwnReviewEditor(unwrap(result, botName));
}

function excerptOf(text) {
  const clean = String(text || '').trim();
  return clean.length > EXCERPT_LENGTH
    ? { excerpt: `${clean.slice(0, EXCERPT_LENGTH).trimEnd()}…`, excerptTruncated: true }
    : { excerpt: clean, excerptTruncated: false };
}

/** Updates the card of an edited review in place (same page, same position). */
function patchReview(botName, appId, detail) {
  const session = getOwnReviewsSession(botName);
  Object.keys(session.pages).forEach(page => {
    const list = session.pages[page];
    const index = list.findIndex(r => r.appId === appId);
    if (index < 0) return;
    const current = list[index];
    Vue.set(list, index, {
      ...current,
      ...excerptOf(detail.text),
      recommended: detail.recommended ?? current.recommended,
      helpful: detail.helpful,
      funny: detail.funny,
      awards: detail.awards,
    });
  });
  rebuild(session);
}

/** Publishes a review. Resolves only when Steam accepted it. */
export async function publishReview(botName, {
  appId, recommended, text, language,
}) {
  const result = normalizeWriteResult(unwrap(await publishOwnReview(botName, {
    appId, recommended, text, language,
  }), botName));
  Vue.set(getOwnReviewsSession(botName).extraReviewed, appId, true);
  return result;
}

/** Saves an edit. Resolves only when Steam accepted it; the cached detail and the card follow. */
export async function saveReviewEdit(botName, appId, { recommended, text, confirmRatingReset }) {
  const result = normalizeWriteResult(unwrap(await editOwnReview(botName, appId, {
    recommended, text, confirmRatingReset,
  }), botName));
  if (result.review) {
    detailBucket(botName).set(appId, result.review);
    patchReview(botName, appId, result.review);
  } else {
    detailBucket(botName).delete(appId);
  }
  return result;
}

/**
 * What the installed ASFBotSocial DLL can do with the account's reviews.
 * Throws when the plugin cannot be queried at all.
 */
export async function loadOwnReviewsCapabilities(botName, { force = false } = {}) {
  const result = await loadStatus(botName, { force });
  const payload = unwrap(result?.data ?? result, botName);
  const caps = pick(payload, 'Capabilities');
  const list = Array.isArray(caps) ? caps : [];
  return {
    read: list.includes(OWN_REVIEWS_CAPABILITY),
    publish: list.includes(OWN_REVIEWS_PUBLISH_CAPABILITY),
    edit: list.includes(OWN_REVIEWS_EDIT_CAPABILITY),
  };
}
