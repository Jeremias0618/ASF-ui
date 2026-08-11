import AsfIconTabs from '../components/UI/IconTabs.vue';
import AsfSelect from '../components/UI/Select.vue';

export default {
  install(Vue) {
    Vue.component('AsfIconTabs', AsfIconTabs);
    Vue.component('AsfSelect', AsfSelect);
  },
};
