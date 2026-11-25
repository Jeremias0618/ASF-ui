import * as http from '../../plugins/http';
import { Bot } from '../../models/Bot';

export const state = {
  bots: {},
};

export const mutations = {
  setBots: (state, bots) => (state.bots = bots),
  setBot: (state, bot) => (state.bots[bot.name] = bot),
  updateBot: (state, { name, ...changes }) => {
    if (!state.bots[name]) return;
    Object.keys(changes).forEach(key => {
      state.bots[name][key] = changes[key];
    });
  },
};

const POLL_INTERVAL_MS = 2500;
// A poll is skipped while another request is in flight, unless that one looks stuck
// (axios has no default timeout, so a hung request must not stop the polling forever).
const POLL_STALE_MS = 15000;

let requestCounter = 0;
let lastAppliedRequest = 0;
let requestsInFlight = 0;
let lastRequestStartedAt = 0;

export const actions = {
  init: async ({ dispatch }) => {
    setInterval(() => dispatch('updateBots', { periodic: true }), POLL_INTERVAL_MS);
  },
  onAuth: async ({ dispatch }) => {
    dispatch('updateBots');
  },
  // Explicit calls (after save, rename, login…) always send a fresh request.
  // Periodic polls ({ periodic: true }) never pile up behind a slow response.
  updateBots: async ({ dispatch, commit, rootGetters }, options) => {
    if (!rootGetters['auth/authenticated']) return;

    const periodic = !!(options && options.periodic);
    if (periodic && requestsInFlight > 0 && Date.now() - lastRequestStartedAt < POLL_STALE_MS) return;

    requestCounter += 1;
    const requestId = requestCounter;
    requestsInFlight += 1;
    lastRequestStartedAt = Date.now();

    try {
      const response = await http.get('bot/asf');

      // A newer request already applied its data; this response is older and must not overwrite it.
      if (requestId < lastAppliedRequest) return;
      lastAppliedRequest = requestId;

      // eslint-disable-next-line no-sequences
      commit('setBots', Object.values(response).map(data => new Bot(data)).reduce((bots, bot) => ((bots[bot.name] = bot), bots), {}));
    } catch (err) {
      dispatch('auth/updateStatus', '', { root: true });
    } finally {
      requestsInFlight -= 1;
    }
  },
  async updateBot({ commit }, bot) {
    commit('updateBot', bot);

    try {
      const [response] = await http.get(`bot/${bot.name}`);
      commit('setBot', new Bot(response[bot.name]));
    } catch (err) {
      console.warn(err.message);
    }
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
