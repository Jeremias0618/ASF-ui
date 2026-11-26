import * as http from '../plugins/http';

/**
 * "Enabled" chosen by the user for a bot that was created stopped on purpose.
 *
 * ASF starts an enabled bot as soon as its config file appears, before the sign-in method can be sent, so a
 * new bot is saved with Enabled: false. The user's choice waits here until Steam confirms the connection;
 * only then is it written to the bot configuration (see the bots store).
 *
 * Only the intention is kept (bot name + enabled flag + time), in this tab's session storage. Credentials,
 * codes and QR URLs never go here: the rest of the configuration is read back from ASF when it is applied.
 */
const KEY_PREFIX = 'asf-ui:pending-bot-setup:';
const TTL_MS = 12 * 60 * 60 * 1000;

function storage() {
  try {
    return window.sessionStorage;
  } catch (err) {
    return null;
  }
}

export function registerPendingSetup(name, { enabled }) {
  const store = storage();
  if (!store) return;

  store.setItem(`${KEY_PREFIX}${name}`, JSON.stringify({ enabled: !!enabled, createdAt: Date.now() }));
}

export function clearPendingSetup(name) {
  const store = storage();
  if (store) store.removeItem(`${KEY_PREFIX}${name}`);
}

export function getPendingSetup(name) {
  const store = storage();
  if (!store) return null;

  try {
    const entry = JSON.parse(store.getItem(`${KEY_PREFIX}${name}`));
    if (!entry || typeof entry.enabled !== 'boolean') return null;

    if (Date.now() - entry.createdAt > TTL_MS) {
      clearPendingSetup(name);
      return null;
    }

    return entry;
  } catch (err) {
    return null;
  }
}

export function getPendingSetupNames() {
  const store = storage();
  if (!store) return [];

  const names = [];

  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (key && key.startsWith(KEY_PREFIX)) names.push(key.slice(KEY_PREFIX.length));
  }

  return names.filter(name => getPendingSetup(name));
}

/**
 * Writes the pending "Enabled" into the bot configuration, keeping everything else.
 *
 * POST /Api/Bot/{bot} replaces the whole configuration, so the current one is read first. ASF keeps the
 * stored Steam login, password and parental code when the request does not carry them (BotController.BotPost),
 * which is what keeps the QR account name. Saving makes ASF restart the bot (Bot.OnConfigChanged: Stop,
 * reload, InitStart), so it reconnects with the saved session instead of staying as it is.
 */
export async function applyPendingSetup(name) {
  const pending = getPendingSetup(name);
  if (!pending) return false;

  const response = await http.get(`bot/${encodeURIComponent(name)}`);
  const entry = response && response[name];
  if (!entry || !entry.BotConfig) throw new Error(`Bot ${name} not found`);

  const botConfig = { ...entry.BotConfig };

  // Same normalisation as the bot editor: 64-bit numbers travel as strings under an "s_" key.
  Object.keys(botConfig).forEach(key => {
    if (key.startsWith('s_')) delete botConfig[key.substr(2)];
  });

  botConfig.Enabled = pending.enabled;

  await http.post(`bot/${encodeURIComponent(name)}`, { botConfig });

  return true;
}
