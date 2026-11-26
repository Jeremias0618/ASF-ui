import * as http from '../plugins/http';
import store from '../store';
import delay from './delay';
import getUserInputType, { USER_INPUT_TYPES } from './getUserInputType';

/**
 * Steam sign-in state of a bot, derived only from what ASF's IPC publishes
 * (IsConnectedAndLoggedOn, KeepRunning, RequiredInput, QrChallengeURL).
 */
export const LOGIN_PHASE = {
  CONNECTED: 'connected',
  CODE: 'code', // SteamGuard / TwoFactorAuthentication code expected
  QR: 'qr', // active QR session: a challenge URL is published
  QR_PENDING: 'qr-pending', // QR requested, but no session (yet): ASF decides in its console
  DEVICE_CONFIRMATION: 'device-confirmation', // mobile approval vs code: ASF asks in its console
  CREDENTIAL: 'credential', // Login / Password / SteamParentalCode
  UNSUPPORTED: 'unsupported', // Cryptkey or an input type unknown to this UI
  CONNECTING: 'connecting', // running, nothing asked: waiting for Steam (e.g. mobile approval)
  STOPPED: 'stopped', // an attempt ended without connecting (cancelled, rejected, expired)
  DISABLED: 'disabled', // not running, no attempt in progress
};

const CODE_INPUT_TYPES = ['SteamGuard', 'TwoFactorAuthentication'];
const CREDENTIAL_INPUT_TYPES = ['Login', 'Password', 'SteamParentalCode'];

// Valid lengths of the codes ASF accepts through POST /Api/Bot/{bot}/Input.
const CODE_LENGTHS = {
  SteamGuard: [5],
  TwoFactorAuthentication: [5, 7], // regular code, backup code
};

export class InputChangedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InputChangedError';
    Object.setPrototypeOf(this, InputChangedError.prototype);
  }
}

export function hasRequiredInput(bot) {
  return !!bot && bot.requiredInput != null && bot.requiredInput !== 0 && bot.requiredInput !== 'None';
}

/** Only https URLs are drawn as QR codes: the value comes from the server and is shown as-is. */
export function isValidChallengeUrl(value) {
  if (!value) return false;

  try {
    return new URL(value).protocol === 'https:';
  } catch (err) {
    return false;
  }
}

/**
 * @param {object} bot
 * @param {{ attempted?: boolean, ignoreQr?: boolean }} [options]
 *   attempted: this view has seen the bot trying to sign in;
 *   ignoreQr: the user started this attempt with credentials, so a published QR challenge is not theirs
 */
export function resolveLoginPhase(bot, { attempted = false, ignoreQr = false } = {}) {
  if (bot.isConnected) return LOGIN_PHASE.CONNECTED;

  if (hasRequiredInput(bot)) {
    const type = getUserInputType(bot.requiredInput);

    if (CODE_INPUT_TYPES.includes(type)) return LOGIN_PHASE.CODE;
    if (CREDENTIAL_INPUT_TYPES.includes(type)) return LOGIN_PHASE.CREDENTIAL;
    if (type === 'DeviceConfirmation') return LOGIN_PHASE.DEVICE_CONFIRMATION;
    if (type === 'QrCodeLogin') {
      // ASF keeps the last QR challenge and RequiredInput after a stop: a stopped bot has no live QR session.
      if (!bot.active) return attempted ? LOGIN_PHASE.STOPPED : LOGIN_PHASE.DISABLED;

      // This attempt was started with credentials, so any QR challenge ASF still publishes is a leftover
      // of an earlier attempt (ASF never cancels those): what ASF waits for now is its console question.
      if (ignoreQr) return LOGIN_PHASE.QR_PENDING;

      return isValidChallengeUrl(bot.qrChallengeURL) ? LOGIN_PHASE.QR : LOGIN_PHASE.QR_PENDING;
    }

    return LOGIN_PHASE.UNSUPPORTED;
  }

  if (bot.active) return LOGIN_PHASE.CONNECTING;

  return attempted ? LOGIN_PHASE.STOPPED : LOGIN_PHASE.DISABLED;
}

/** Where to send the user when a bot needs input: codes/QR use the wizard, credentials the plain form. */
export function getInputRoute(bot) {
  const type = getUserInputType(bot.requiredInput);

  if (CREDENTIAL_INPUT_TYPES.includes(type)) return { name: 'bot-input', params: { bot: bot.name, type } };

  return { name: 'bot-login', params: { bot: bot.name } };
}

/** Trims and validates a code. Only the shape is checked here; ASF and Steam decide if it is right. */
export function normalizeLoginCode(type, raw) {
  const value = String(raw || '').trim().toUpperCase();
  const lengths = CODE_LENGTHS[type] || [];

  return { value, valid: value !== '' && lengths.includes(value.length) };
}

/**
 * Sends a pending input to ASF, but only if the bot is still asking for that very type.
 *
 * Resolves once ASF has stored the value. That is NOT a successful sign-in: Steam still has to
 * accept it, so callers must wait for IsConnectedAndLoggedOn before showing success.
 * The bot is started again only when ASF stopped it while asking for the input (headless / service).
 * A bot that is still running is already inside the sign-in attempt and must not be restarted.
 *
 * @throws {InputChangedError} the bot is gone or no longer asks for `expectedType`
 */
export async function submitBotInput(botName, expectedType, value) {
  const bot = (await store.dispatch('bots/updateBot', { name: botName })) || store.getters['bots/bot'](botName);

  if (!bot) throw new InputChangedError(`Bot ${botName} not found`);

  const currentType = getUserInputType(bot.requiredInput);
  if (currentType !== expectedType) throw new InputChangedError(`${botName} asks for ${currentType} instead of ${expectedType}`);

  await http.post(`bot/${encodeURIComponent(botName)}/input`, { type: bot.requiredInput, value });

  let restarted = false;

  if (!bot.active) {
    await http.botAction(botName, 'start');
    restarted = true;
  }

  await store.dispatch('bots/updateBot', { name: botName });

  return { restarted, wasRunning: bot.active };
}

export const LOGIN_METHOD = {
  QR: 'qr',
  CREDENTIALS: 'credentials',
};

/**
 * Whether the QR/credentials choice can be sent in advance.
 *
 * ASF only reads the answer up front, so the bot must be stopped and ASF must not be headless:
 * headless ASF never asks and always uses credentials. Once ASF is already waiting for this answer in
 * its console, the same value would only be stored for the next question, so it cannot be answered here.
 */
export function canChooseLoginMethod(bot, phase, { headless = false } = {}) {
  if (!bot || headless || bot.active || bot.isConnected) return false;

  return phase === LOGIN_PHASE.DISABLED || phase === LOGIN_PHASE.STOPPED;
}

/**
 * Sends the sign-in method (and optionally the credentials) through the official POST /Api/Bot/{bot}/Input
 * and only then starts the bot, so ASF finds the answers stored and never asks them in its console.
 *
 * ASF consumes the QR answer when it uses it: after a failed attempt it may ask again in its console.
 * Credentials sent here are kept by ASF in memory for this process only; they are never saved to the bot config.
 *
 * @param {string} botName
 * @param {{ method: 'qr'|'credentials', login?: string, password?: string }} options
 * @throws {InputChangedError} the bot is gone or already running (the question may be open in the console)
 */
export async function startWithLoginMethod(botName, { method, login = '', password = '' }) {
  if (!Object.values(LOGIN_METHOD).includes(method)) throw new Error(`Unknown login method ${method}`);

  const bot = (await store.dispatch('bots/updateBot', { name: botName })) || store.getters['bots/bot'](botName);

  if (!bot) throw new InputChangedError(`Bot ${botName} not found`);
  if (bot.active) throw new InputChangedError(`${botName} is already running`);

  const endpoint = `bot/${encodeURIComponent(botName)}/input`;

  if (method === LOGIN_METHOD.CREDENTIALS && login && password) {
    await http.post(endpoint, { type: USER_INPUT_TYPES.Login, value: login });
    await http.post(endpoint, { type: USER_INPUT_TYPES.Password, value: password });
  }

  await http.post(endpoint, { type: USER_INPUT_TYPES.QrCodeLogin, value: method === LOGIN_METHOD.QR ? 'Y' : 'N' });
  await http.botAction(botName, 'start');
  await store.dispatch('bots/updateBot', { name: botName });
}

/** Waits until a just created bot shows up in ASF, instead of sleeping a fixed time. */
export async function waitForBot(name, { attempts = 10, interval = 300 } = {}) {
  for (let i = 0; i < attempts; i++) {
    // eslint-disable-next-line no-await-in-loop
    const bot = await store.dispatch('bots/updateBot', { name });
    if (bot || store.getters['bots/bot'](name)) return store.getters['bots/bot'](name) || bot;

    // eslint-disable-next-line no-await-in-loop
    await delay(interval);
  }

  return null;
}
