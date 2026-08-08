import Snotify from 'vue-snotify';
import { get } from '../utils/storage';

export default {
  install(Vue) {
    if (this.installed) return;
    this.installed = true;

    Vue.use(Snotify, {
      toast: {
        timeout: 3200,
        position: get('settings:notification-position', 'rightBottom'),
        pauseOnHover: true,
        showProgressBar: true,
        closeOnClick: true,
        preventDuplicates: false,
        bodyMaxLength: 140,
        titleMaxLength: 32,
      },
    });

    Vue.prototype.$error = function notifyError(message) {
      Vue.prototype.$snotify.error(message, this.$t('error'));
    };

    Vue.prototype.$success = function notifySuccess(message) {
      Vue.prototype.$snotify.success(message, this.$t('success'));
    };

    Vue.prototype.$info = function notifyInfo(message) {
      Vue.prototype.$snotify.info(message, this.$t('info'));
    };
  },
};
