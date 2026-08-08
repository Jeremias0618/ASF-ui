import Vue from 'vue';
import VueRouter from 'vue-router';
import VueMeta from 'vue-meta';
import store from '../store';
import * as storage from '../utils/storage';
import { installUnsavedChangesGuards, isBenignNavigationError } from '../utils/unsaved-changes';
import routes from './routes';

Vue.use(VueRouter);
Vue.use(VueMeta);

const router = new VueRouter({
  routes,
  base: (window.__BASE_PATH__) ? window.__BASE_PATH__ : '/',
  mode: 'history',
});

installUnsavedChangesGuards(router, () => {
  if (Vue.i18n && typeof Vue.i18n.translate === 'function') {
    return Vue.i18n.translate('unsaved-changes-confirm');
  }

  return 'You have unsaved changes. Leave without saving?';
});

router.beforeEach(async (routeTo, routeFrom, next) => {
  const noPasswordRequired = routeTo.matched.every(route => route.meta.noPasswordRequired);
  if (storage.get('first-time', true) && routeTo.name !== 'welcome') next({ name: 'welcome' });
  else if (noPasswordRequired || await store.dispatch('auth/validate')) next();
  else next({ name: 'login' });
});

router.afterEach(to => {
  if (to.name === 'setup' || to.name === 'login') return;
  storage.set('last-visited-page', to.name);
});

router.onError(err => {
  // Cancelled leave / duplicate push — not real app failures.
  if (isBenignNavigationError(err)) return;
  if (err.type === 'missing') window.location.reload();
  else throw err;
});

export default router;
