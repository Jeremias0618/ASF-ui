import * as http from '../plugins/http';
import store from '../store';
import delay from './delay';
import getUserInputType from './getUserInputType';

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
 * @param {{ attempted?: boolean }} [options] attempted: this view has seen the bot trying to sign in
 */
export function resolveLoginPhase(bot, { attempted = false } = {}) {
  if (bot.isConnected) return LOGIN_PHASE.CONNECTED;

  if (hasRequiredInput(bot)) {
    const type = getUserInputType(bot.requiredInput);

    if (CODE_INPUT_TYPES.includes(type)) return LOGIN_PHASE.CODE;
    if (CREDENTIAL_INPUT_TYPES.includes(type)) return LOGIN_PHASE.CREDENTIAL;
    if (type === 'DeviceConfirmation') return LOGIN_PHASE.DEVICE_CONFIRMATION;
    if (type === 'QrCodeLogin') return isValidChallengeUrl(bot.qrChallengeURL) ? LOGIN_PHASE.QR : LOGIN_PHASE.QR_PENDING;

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
