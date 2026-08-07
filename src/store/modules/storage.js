import * as http from '../../plugins/http';
import * as storage from '../../utils/storage';

const THEME_MODES = new Set(['light', 'dark', 'system']);

function systemPrefersDark() {
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveDarkMode(themeMode) {
  if (themeMode === 'dark') return true;
  if (themeMode === 'light') return false;
  return systemPrefersDark();
}

function initialThemeMode() {
  const storedMode = storage.get('layout:theme-mode');
  if (THEME_MODES.has(storedMode)) return storedMode;

  const localDarkMode = storage.get('layout:dark-mode');
  if (typeof localDarkMode === 'boolean') return localDarkMode ? 'dark' : 'light';

  return 'system';
}

function persistSettings(state) {
  storage.set('layout:theme', state.theme);
  storage.set('layout:theme-mode', state.themeMode);
  storage.set('layout:dark-mode', state.darkMode);
  http.post('/storage/asfui-settings', {
    theme: state.theme,
    darkMode: state.darkMode,
    themeMode: state.themeMode,
  }).catch(() => {});
}

const initialMode = initialThemeMode();

export const state = {
  theme: storage.get('layout:theme') || 'blue',
  themeMode: initialMode,
  // Effective value used by the app (resolved from themeMode).
  darkMode: resolveDarkMode(initialMode),
};

export const mutations = {
  changeTheme: (state, theme) => (state.theme = theme),
  setThemeMode: (state, themeMode) => {
    state.themeMode = themeMode;
    state.darkMode = resolveDarkMode(themeMode);
  },
  setDarkMode: (state, value) => {
    state.darkMode = Boolean(value);
    state.themeMode = value ? 'dark' : 'light';
  },
  toggleDarkMode: (state) => {
    const next = !state.darkMode;
    state.darkMode = next;
    state.themeMode = next ? 'dark' : 'light';
  },
  syncSystemDarkMode: (state) => {
    if (state.themeMode === 'system') {
      state.darkMode = systemPrefersDark();
    }
  },
};

let systemMediaBound = false;

export const actions = {
  init: async ({ commit }) => {
    try {
      const localTheme = storage.get('layout:theme');
      const localMode = storage.get('layout:theme-mode');
      const localDarkMode = storage.get('layout:dark-mode');

      if (localTheme) commit('changeTheme', localTheme);
      if (THEME_MODES.has(localMode)) commit('setThemeMode', localMode);
      else if (typeof localDarkMode === 'boolean') commit('setDarkMode', localDarkMode);

      const response = await http.get('/storage/asfui-settings');
      const { theme: asfTheme, darkMode: asfDarkmode, themeMode: asfThemeMode } = response || {};
      if (asfTheme) commit('changeTheme', asfTheme);
      if (THEME_MODES.has(asfThemeMode)) commit('setThemeMode', asfThemeMode);
      else if (typeof asfDarkmode === 'boolean') commit('setDarkMode', asfDarkmode);
    } catch (err) {
      console.warn(err.message);
    }

    if (typeof window !== 'undefined' && window.matchMedia && !systemMediaBound) {
      systemMediaBound = true;
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => commit('syncSystemDarkMode');
      if (media.addEventListener) media.addEventListener('change', onChange);
      else if (media.addListener) media.addListener(onChange);
    }
  },
  changeTheme: ({ commit, state }, theme) => {
    commit('changeTheme', theme);
    persistSettings(state);
  },
  setThemeMode: ({ commit, state }, themeMode) => {
    if (!THEME_MODES.has(themeMode)) return;
    commit('setThemeMode', themeMode);
    persistSettings(state);
  },
  toggleDarkMode: ({ commit, state }) => {
    commit('toggleDarkMode');
    persistSettings(state);
  },
};

export const getters = {
  theme: state => state.theme,
  themeMode: state => state.themeMode,
  darkMode: state => state.darkMode,
};
