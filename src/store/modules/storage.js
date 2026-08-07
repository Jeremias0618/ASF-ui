import * as http from '../../plugins/http';
import * as storage from '../../utils/storage';

function initialDarkMode() {
  const localDarkMode = storage.get('layout:dark-mode');
  if (typeof localDarkMode === 'boolean') return localDarkMode;
  if (typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  return false;
}

export const state = {
  theme: storage.get('layout:theme') || 'blue',
  // Sync from localStorage before first paint to avoid light→dark FOUC.
  darkMode: initialDarkMode(),
};

export const mutations = {
  changeTheme: (state, theme) => (state.theme = theme),
  setDarkMode: (state, value) => (state.darkMode = value),
  toggleDarkMode: state => (state.darkMode = !state.darkMode),
};

export const actions = {
  init: async ({ commit }) => {
    try {
      // get and set config from local storage
      const localTheme = storage.get('layout:theme');
      const localDarkMode = storage.get('layout:dark-mode');
      if (localTheme) commit('changeTheme', localTheme);
      if (typeof localDarkMode === 'boolean') commit('setDarkMode', localDarkMode);
      else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) commit('setDarkMode', true);

      // get and set config from ASF
      // local config will be overwritten if ASF config is available
      const response = await http.get('/storage/asfui-settings');
      const { theme: asfTheme, darkMode: asfDarkmode } = response;
      if (asfTheme) commit('changeTheme', asfTheme);
      if (typeof asfDarkmode === 'boolean') commit('setDarkMode', asfDarkmode);
    } catch (err) {
      console.warn(err.message);
    }
  },
  changeTheme: ({ commit, state }, theme) => {
    commit('changeTheme', theme);
    storage.set('layout:theme', theme);
    http.post('/storage/asfui-settings', state);
  },
  toggleDarkMode: ({ commit, getters, state }) => {
    commit('toggleDarkMode');
    storage.set('layout:dark-mode', getters.darkMode);
    http.post('/storage/asfui-settings', state);
  },
};

export const getters = {
  theme: state => state.theme,
  darkMode: state => state.darkMode,
};
