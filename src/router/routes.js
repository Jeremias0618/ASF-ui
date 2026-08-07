import store from '../store';
import * as storage from '../utils/storage';

const routes = {
  asfBans: 'asf-bans',
  asfConfig: 'asf-config',
  bot: 'bot',
  bot2fa: 'bot-2fa',
  bot2faDelete: 'bot-2fa-delete',
  botBgr: 'bot-bgr',
  botConfig: 'bot-config',
  botCopy: 'bot-copy',
  botCreate: 'bot-create',
  botDelete: 'bot-delete',
  botInput: 'bot-input',
  bots: 'bots',
  commands: 'commands',
  configuration: 'configuration',
  home: 'home',
  log: 'log',
  login: 'login',
  massEditor: 'mass-editor',
  notFound: '404',
  passwordEncrypt: 'password-encrypt',
  passwordHash: 'password-hash',
  plugins: 'plugins',
  releases: 'releases',
  setup: 'setup',
  uiConfig: 'ui-config',
  welcome: 'welcome',
};

let defaultView = store.getters['settings/defaultView'];
if (defaultView === '_last-visited-page') defaultView = storage.get('last-visited-page', routes.home);
if (!Object.values(routes).includes(defaultView)) {
  defaultView = routes.home;
  store.dispatch('settings/setDefaultView', routes.home);
}

export default [
  {
    path: '/',
    redirect: { name: defaultView },
  },
  {
    path: '/home',
    name: routes.home,
    component: () => import('../views/Home.vue'),
    async beforeEnter(to, from, next) {
      const setupComplete = storage.get('setup-complete', false);
      const botsDetected = await store.dispatch('bots/detectBots');

      if (!setupComplete && from.name !== routes.welcome && !botsDetected) {
        return next({ name: routes.welcome });
      }

      if (from.name === routes.welcome && !botsDetected) {
        return next({ name: routes.botCreate });
      }

      if (botsDetected) {
        storage.set('setup-complete', true);
      }

      return next();
    },
  },
  {
    path: '/home2',
    redirect: { name: routes.home },
  },
  {
    path: '/setup',
    name: routes.setup,
    component: () => import('../views/Setup.vue'),
    meta: { noPasswordRequired: true, bare: true },
    params: {
      restart: false,
      update: false,
    },
  },
  {
    path: '/login',
    name: routes.login,
    component: () => import('../views/Login.vue'),
    meta: { noPasswordRequired: true, bare: true },
  },
  {
    path: '/ui-config',
    name: routes.uiConfig,
    component: () => import('../views/UIConfig.vue'),
  },
  {
    path: '/welcome',
    name: routes.welcome,
    component: () => import('../views/Welcome.vue'),
    meta: { noPasswordRequired: true, bare: true },
  },
  {
    path: '/releases',
    name: routes.releases,
    component: () => import('../views/Releases.vue'),
  },
  {
    path: '/plugins',
    name: routes.plugins,
    component: () => import('../views/Plugins.vue'),
  },
  {
    path: '/bots',
    name: routes.bots,
    component: () => import('../views/Bots.vue'),
  },
  {
    path: '/bot/new',
    name: routes.botCreate,
    components: {
      default: () => import('../views/Bots.vue'),
      modal: () => import('../views/modals/BotCreate.vue'),
    },
    meta: {
      modal: true,
      closeRoute: routes.bots,
    },
  },
  {
    path: '/bot/:bot',
    name: routes.bot,
    components: {
      default: () => import('../views/Bots.vue'),
      modal: () => import('../views/modals/Bot.vue'),
    },
    meta: {
      modal: true,
      arrows: true,
      closeRoute: routes.bots,
    },
  },
  {
    path: '/bot/:bot/config',
    name: routes.botConfig,
    components: {
      default: () => import('../views/Bots.vue'),
      modal: () => import('../views/modals/BotConfig.vue'),
    },
    meta: {
      modal: true,
      arrows: true,
      closeRoute: routes.bots,
    },
  },
  {
    path: '/bot/:bot/config/:label/encrypt',
    name: routes.passwordEncrypt,
    components: {
      default: () => import('../views/Bots.vue'),
      modal: () => import('../views/modals/PasswordEncrypt.vue'),
    },
    meta: {
      modal: true,
      closeRoute: routes.bots,
    },
  },
  {
    path: '/bot/:bot/bgr',
    name: routes.botBgr,
    components: {
      default: () => import('../views/Bots.vue'),
      modal: () => import('../views/modals/BotBGR.vue'),
    },
    meta: {
      modal: true,
      arrows: true,
      closeRoute: routes.bots,
    },
  },
  {
    path: '/bot/:bot/2fa',
    name: routes.bot2fa,
    components: {
      default: () => import('../views/Bots.vue'),
      modal: () => import('../views/modals/Bot2FA.vue'),
    },
    meta: {
      modal: true,
      arrows: true,
      closeRoute: routes.bots,
    },
  },
  {
    path: '/bot/:bot/2fa/delete',
    name: routes.bot2faDelete,
    components: {
      default: () => import('../views/Bots.vue'),
      modal: () => import('../views/modals/Bot2FADelete.vue'),
    },
    meta: {
      modal: true,
      arrows: true,
      closeRoute: routes.bots,
    },
  },
  {
    path: '/bot/:bot/input/:type',
    name: routes.botInput,
    components: {
      default: () => import('../views/Bots.vue'),
      modal: () => import('../views/modals/BotInput.vue'),
    },
    meta: {
      modal: true,
      closeRoute: routes.bots,
    },
  },
  {
    path: '/bot/:bot/delete',
    name: routes.botDelete,
    components: {
      default: () => import('../views/Bots.vue'),
      modal: () => import('../views/modals/BotDelete.vue'),
    },
    meta: {
      modal: true,
      closeRoute: routes.bots,
    },
  },
  {
    path: '/bot/:bot/copy',
    name: routes.botCopy,
    components: {
      default: () => import('../views/Bots.vue'),
      modal: () => import('../views/modals/BotCopy.vue'),
    },
    meta: {
      modal: true,
      closeRoute: routes.bots,
    },
  },
  {
    path: '/bot',
    redirect: { name: routes.bots },
  },
  {
    path: '/commands',
    name: routes.commands,
    component: () => import('../views/Commands.vue'),
  },
  {
    path: '/configuration',
    name: routes.configuration,
    component: () => import('../views/Configuration.vue'),
  },
  {
    path: '/log',
    name: routes.log,
    component: () => import('../views/Log.vue'),
  },
  {
    path: '/asf-config',
    name: routes.asfConfig,
    component: () => import('../views/ASFConfig.vue'),
  },
  {
    path: '/asf-bans',
    name: routes.asfBans,
    component: () => import('../views/ASFBans.vue'),
  },
  {
    path: '/asf-config/:label/hash',
    name: routes.passwordHash,
    components: {
      default: () => import('../views/ASFConfig.vue'),
      modal: () => import('../views/modals/PasswordHash.vue'),
    },
    meta: {
      modal: true,
      closeRoute: routes.asfConfig,
    },
  },
  {
    path: '/mass-editor',
    name: routes.massEditor,
    component: () => import('../views/MassEditor.vue'),
  },
  {
    path: '*',
    name: routes.notFound,
    redirect: { name: routes.home },
  },
];
