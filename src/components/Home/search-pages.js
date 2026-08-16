import { BULK_ACTIONS } from '../../features/bulk-actions/constants/actions';

/** Multi-action shortcuts (bots step for each catalog action). */
const MULTI_ACTION_PAGES = BULK_ACTIONS.map(action => ({
  id: `multi-action-${action.slug}`,
  route: 'multi-action-bots',
  params: { action: action.slug },
  labelKey: action.titleKey,
  descKey: action.leadKey,
  icon: action.icon,
  keywords: `multi-action bulk lote acciones ${action.slug} ${action.group}`,
}));

/** Navigable pages for the home command palette. */
const SEARCH_PAGES = [
  {
    id: 'home',
    route: 'home',
    labelKey: 'home2-nav-dashboard',
    descKey: 'home2-search-desc-home',
    icon: 'home',
    keywords: 'dashboard inicio home',
  },
  {
    id: 'bots',
    route: 'bots',
    labelKey: 'bots',
    descKey: 'home2-search-desc-bots',
    icon: 'users',
    keywords: 'bots accounts',
  },
  {
    id: 'multi-action',
    route: 'multi-action',
    labelKey: 'bulk-actions',
    descKey: 'home2-search-desc-bulk-actions',
    icon: 'layer-group',
    keywords: 'bulk actions batch acciones por lote social inventory friends discovery wishlist',
  },
  ...MULTI_ACTION_PAGES,
  {
    id: 'commands',
    route: 'commands',
    labelKey: 'commands',
    descKey: 'home2-search-desc-commands',
    icon: 'laptop',
    keywords: 'commands terminal',
  },
  {
    id: 'log',
    route: 'log',
    labelKey: 'log',
    descKey: 'home2-search-desc-log',
    icon: 'file-alt',
    keywords: 'log registro',
  },
  {
    id: 'plugins',
    route: 'plugins',
    labelKey: 'plugins',
    descKey: 'home2-search-desc-plugins',
    icon: 'puzzle-piece',
    keywords: 'plugins',
  },
  {
    id: 'releases',
    route: 'releases',
    labelKey: 'releases',
    descKey: 'home2-search-desc-releases',
    icon: 'code-branch',
    keywords: 'releases versiones',
  },
  {
    id: 'credits',
    route: 'credits',
    labelKey: 'credits',
    descKey: 'home2-search-desc-credits',
    icon: 'heart',
    keywords: 'credits creditos about acerca colaboracion justarchi plugin',
  },
  {
    id: 'configuration',
    route: 'configuration',
    labelKey: 'configuration',
    descKey: 'home2-search-desc-configuration',
    icon: 'cogs',
    keywords: 'configuration config settings',
  },
  {
    id: 'asf-config',
    route: 'asf-config',
    labelKey: 'asf-config',
    descKey: 'home2-search-desc-asf-config',
    icon: 'edit',
    keywords: 'config asf',
  },
  {
    id: 'mass-editor',
    route: 'mass-editor',
    labelKey: 'mass-editor',
    descKey: 'home2-search-desc-mass-editor',
    icon: 'paste',
    keywords: 'mass editor',
  },
  {
    id: 'ui-config',
    route: 'ui-config',
    labelKey: 'ui-config',
    descKey: 'home2-search-desc-ui-config',
    icon: 'wrench',
    keywords: 'ui interface',
  },
  {
    id: 'asf-bans',
    route: 'asf-bans',
    labelKey: 'asf-bans',
    descKey: 'home2-search-desc-asf-bans',
    icon: 'ban',
    keywords: 'bans ip',
  },
];

export default SEARCH_PAGES;
