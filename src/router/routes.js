import store from '../store';
import * as storage from '../utils/storage';
import { requireBotSocialPlugin } from '../features/bot-social/plugin-gate/guard';

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
  botFriends: 'bot-friends',
  botCommunity: 'bot-community',
  botGames: 'bot-games',
  botIdle: 'bot-idle',
  botInventory: 'bot-inventory',
  botSocial: 'bot-social',
  botWishlist: 'bot-wishlist',
  bots: 'bots',
  bulkActions: 'multi-action',
  multiActionBots: 'multi-action-bots',
  multiActionSetup: 'multi-action-setup',
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
  credits: 'credits',
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
    path: '/credits',
    name: routes.credits,
    component: () => import('../features/credits/pages/CreditsPage.vue'),
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
    path: '/bot/:bot/inventory',
    name: routes.botInventory,
    components: {
      default: () => import('../views/Bots.vue'),
      modal: () => import('../views/modals/BotSocial.vue'),
    },
    meta: {
      modal: true,
      arrows: true,
      closeRoute: routes.bots,
      feature: 'inventory',
      modalSize: 'workspace',
    },
    beforeEnter: requireBotSocialPlugin,
  },
  {
    path: '/bot/:bot/friends',
    name: routes.botFriends,
    components: {
      default: () => import('../views/Bots.vue'),
      modal: () => import('../views/modals/BotSocial.vue'),
    },
    meta: {
      modal: true,
      arrows: true,
      closeRoute: routes.bots,
      feature: 'friends',
      modalSize: 'workspace',
    },
    beforeEnter: requireBotSocialPlugin,
  },
  {
    path: '/bot/:bot/community',
    name: routes.botCommunity,
    components: {
      default: () => import('../views/Bots.vue'),
      modal: () => import('../views/modals/BotSocial.vue'),
    },
    meta: {
      modal: true,
      arrows: true,
      closeRoute: routes.bots,
      feature: 'community',
      modalSize: 'workspace',
    },
    beforeEnter: requireBotSocialPlugin,
  },
  {
    path: '/bot/:bot/games',
    name: routes.botGames,
    components: {
      default: () => import('../views/Bots.vue'),
      modal: () => import('../views/modals/BotSocial.vue'),
    },
    meta: {
      modal: true,
      arrows: true,
      closeRoute: routes.bots,
      feature: 'games',
      modalSize: 'workspace',
    },
    beforeEnter: requireBotSocialPlugin,
  },
  {
    path: '/bot/:bot/wishlist',
    name: routes.botWishlist,
    components: {
      default: () => import('../views/Bots.vue'),
      modal: () => import('../views/modals/BotSocial.vue'),
    },
    meta: {
      modal: true,
      arrows: true,
      closeRoute: routes.bots,
      feature: 'wishlist',
      modalSize: 'workspace',
    },
    beforeEnter: requireBotSocialPlugin,
  },
  {
    path: '/bot/:bot/idle',
    name: routes.botIdle,
    components: {
      default: () => import('../views/Bots.vue'),
      modal: () => import('../views/modals/Bot.vue'),
    },
    meta: {
      modal: true,
      arrows: true,
      closeRoute: routes.bots,
    },
    beforeEnter: requireBotSocialPlugin,
  },
  {
    path: '/bot/:bot/social',
    name: routes.botSocial,
    redirect: to => ({ name: routes.botInventory, params: { bot: to.params.bot } }),
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
    path: '/bulk-actions',
    redirect: { name: routes.bulkActions },
  },
  {
    path: '/bulk-actions/:action',
    redirect: to => ({
      name: routes.multiActionBots,
      params: { action: to.params.action },
    }),
  },
  {
    path: '/bulk-actions/:action/setup',
    redirect: to => ({
      name: routes.multiActionSetup,
      params: { action: to.params.action },
    }),
  },
  {
    path: '/multi-action',
    name: routes.bulkActions,
    component: () => import('../views/BulkActions.vue'),
  },
  {
    path: '/multi-action/:action/setup',
    name: routes.multiActionSetup,
    component: () => import('../views/MultiActionSetup.vue'),
    beforeEnter: requireBotSocialPlugin,
  },
  {
    path: '/multi-action/:action',
    name: routes.multiActionBots,
    component: () => import('../views/MultiActionBots.vue'),
    beforeEnter: requireBotSocialPlugin,
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
