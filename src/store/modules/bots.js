import Vue from 'vue';
import * as http from '../../plugins/http';
import { Bot } from '../../models/Bot';
import findBotWithSameAccount from '../../utils/botAccount';
import {
  applyPendingSetup,
  clearPendingSetup,
  getPendingSetup,
  getPendingSetupNames,
} from '../../utils/pendingBotSetup';

export const state = {
  bots: {},
  // Final save of the "Enabled" a user chose for a bot created stopped (see utils/pendingBotSetup).
  // name -> { status: 'duplicate' | 'needs-login' | 'saving' | 'reconnecting' | 'done' | 'failed' | 'timeout', ... }
  //   duplicate: another bot already uses this Steam account (other); nothing is enabled automatically.
  //   needs-login: connected, but the Steam username was not saved yet; the user is asked for it (error?).
  //   done: saved? (a save was written), stopped? (saved disabled, so ASF stopped it), reconnect? (the saved
  //   session lets it connect again by itself when ASF restarts).
  setups: {},
};

export const mutations = {
  setBots: (state, bots) => (state.bots = bots),
  setBot: (state, bot) => Vue.set(state.bots, bot.name, bot),
  removeBot: (state, name) => Vue.delete(state.bots, name),
  setSetup: (state, { name, ...setup }) => Vue.set(state.setups, name, setup),
  clearSetup: (state, name) => Vue.delete(state.setups, name),
  updateBot: (state, { name, ...changes }) => {
    if (!state.bots[name]) return;
    Object.keys(changes).forEach(key => {
      state.bots[name][key] = changes[key];
    });
  },
};

const POLL_INTERVAL_MS = 2500;
const BOT_REQUEST_TIMEOUT_MS = 15000;

let requestCounter = 0;
let lastAppliedListRequest = 0;
let listRequestsInFlight = 0;
const latestBotRequests = new Map();

// Writes the pending configuration and reports how it went. Disabled bots are stopped by ASF when their
// configuration changes (they stay down, as chosen); enabled ones are restarted and must reconnect.
function finishSetup(commit, name, pending, { steamLogin }) {
  const saved = true;
  const reconnect = pending.enabled && pending.loginKeys;

  return applyPendingSetup(name, { steamLogin })
    .then(() => {
      clearPendingSetup(name);

      if (!pending.enabled) {
        commit('setSetup', {
          name,
          status: 'done',
          saved,
          stopped: true,
          reconnect: false,
        });
        return;
      }

      commit('setSetup', {
        name,
        status: 'reconnecting',
        since: Date.now(),
        sawDisconnect: false,
        saved,
        stopped: false,
        reconnect,
      });
    })
    .catch(err => {
      // Asking for the username again is possible; the rest is retried with the usual button.
      if (steamLogin) {
        commit('setSetup', {
          name,
          status: 'needs-login',
          disabledChoice: !pending.enabled,
          error: err.message,
        });
      } else {
        commit('setSetup', { name, status: 'failed', error: err.message });
      }
    });
}

export const actions = {
  init: async ({ dispatch }) => {
    setInterval(() => dispatch('updateBots', { periodic: true }), POLL_INTERVAL_MS);
  },
  onAuth: async ({ dispatch }) => {
    dispatch('updateBots');
  },
  // Explicit calls (after save, rename, login…) always send a fresh request.
  // Periodic polls ({ periodic: true }) never pile up behind a slow response.
  updateBots: async ({ state, dispatch, commit, rootGetters }, options) => {
    if (!rootGetters['auth/authenticated']) return;

    const periodic = !!(options && options.periodic);
    if (periodic && listRequestsInFlight > 0) return;

    requestCounter += 1;
    const requestId = requestCounter;
    listRequestsInFlight += 1;

    try {
      const response = await http.get('bot/asf', {}, { timeout: BOT_REQUEST_TIMEOUT_MS });

      // A newer request already applied its data; this response is older and must not overwrite it.
      if (requestId < lastAppliedListRequest) return;
      const bots = Object.fromEntries(Object.values(response).map(data => [data.BotName, new Bot(data)]));

      // Preserve individual bot updates that started after this list request.
      latestBotRequests.forEach((botRequestId, name) => {
        if (botRequestId <= requestId) {
          latestBotRequests.delete(name);
        } else if (state.bots[name]) {
          bots[name] = state.bots[name];
        } else {
          delete bots[name];
        }
      });

      commit('setBots', bots);
      lastAppliedListRequest = requestId;
      dispatch('processSetups');
    } catch (err) {
      dispatch('auth/updateStatus', '', { root: true });
    } finally {
      listRequestsInFlight -= 1;
    }
  },
  // Resolves with the refreshed Bot, or null when the bot is gone, the request failed or a newer
  // response already replaced this one (read the store in that case: it holds fresher data).
  async updateBot({ commit }, bot) {
    const { name } = bot;
    requestCounter += 1;
    const requestId = requestCounter;
    latestBotRequests.set(name, requestId);
    commit('updateBot', bot);

    try {
      const response = await http.get(`bot/${encodeURIComponent(name)}`, {}, { timeout: BOT_REQUEST_TIMEOUT_MS });
      if (requestId < lastAppliedListRequest || latestBotRequests.get(name) !== requestId) return null;

      if (response[name]) {
        const updated = new Bot(response[name]);
        commit('setBot', updated);
        return updated;
      }

      commit('removeBot', name);
    } catch (err) {
      console.warn(err.message);
    }

    return null;
  },
  // Handles the user's choices for new bots whose connection Steam has confirmed, whatever view is open.
  async processSetups({ state, commit, getters }) {
    const now = Date.now();

    // Bots with a user choice still waiting for their first confirmed connection.
    getPendingSetupNames().forEach(name => {
      const bot = getters.bot(name);
      if (!bot || !bot.isConnected || state.setups[name]) return;

      const pending = getPendingSetup(name);
      if (!pending) return;

      // The same Steam account behind two bots: the new one is not enabled (nor its username saved) automatically.
      const other = findBotWithSameAccount(getters.bots, name, bot.steamid);
      if (other) {
        commit('setSetup', { name, status: 'duplicate', other: other.name });
        return;
      }

      // The Steam username was not typed in the form: ask for it before saving anything else.
      if (pending.needsLogin) {
        commit('setSetup', { name, status: 'needs-login', disabledChoice: !pending.enabled });
        return;
      }

      // Disabled and nothing else to save: the bot was already created like that.
      if (!pending.enabled) {
        clearPendingSetup(name);
        commit('setSetup', {
          name,
          status: 'done',
          saved: false,
          stopped: false,
          reconnect: false,
        });
        return;
      }

      commit('setSetup', { name, status: 'saving' });
      finishSetup(commit, name, pending, {});
    });

    // ASF restarts the bot after the save: it must come back before the setup is reported as done.
    Object.keys(state.setups).forEach(name => {
      const setup = state.setups[name];
      if (setup.status !== 'reconnecting') return;

      const bot = getters.bot(name);
      const connected = !!bot && bot.isConnected;

      if (!connected && !setup.sawDisconnect) {
        commit('setSetup', { name, ...setup, sawDisconnect: true });
      } else if (connected && (setup.sawDisconnect || now - setup.since > 10000)) {
        // Either it went down and came back, or ASF finished the restart between two polls.
        commit('setSetup', { name, ...setup, status: 'done' });
      } else if (now - setup.since > 90000) {
        commit('setSetup', { name, ...setup, status: 'timeout' });
      }
    });
  },
  // Saves the Steam username asked after the QR (together with the chosen "Enabled").
  async saveSetupLogin({ commit }, { name, steamLogin }) {
    const pending = getPendingSetup(name);
    const login = String(steamLogin || '').trim();
    if (!pending || !login) return;

    commit('setSetup', { name, status: 'saving' });
    await finishSetup(commit, name, pending, { steamLogin: login });
  },
  // The user dealt with a duplicated account (stopped the bot): the pending choice is dropped.
  dismissSetup({ commit }, name) {
    clearPendingSetup(name);
    commit('clearSetup', name);
  },
  // Lets the user try the final save again without recreating the bot.
  retrySetup({ commit }, name) {
    commit('clearSetup', name);
  },
  async detectBots({ dispatch, getters }) {
    await dispatch('updateBots');
    return getters.bots.length !== 0;
  },
};

export const getters = {
  bots: state => Object.values(state.bots).sort((a, b) => (a.name > b.name ? 1 : -1)),
  bot: state => name => state.bots[name],
  status: (state, getters) => status => getters.bots.filter(bot => bot.status === status),
  count: (state, getters) => status => getters.status(status).length,
  gamesRemaining: (state, getters) => getters.bots.reduce((gamesRemaining, bot) => gamesRemaining + bot.gamesToFarm.length, 0),
  timeRemaining: (state, getters) => Math.max(...getters.bots.map(bot => bot.timeRemainingSeconds)),
  cardsRemaining: (state, getters) => getters.bots.reduce((cardsRemaining, bot) => cardsRemaining + bot.cardsRemaining, 0),
  botsFarmingCount: (state, getters) => getters.bots.filter(bot => bot.status === 'farming').length,
};
