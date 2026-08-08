/** Route names historically associated with the home2 sidebar + header shell.
 * App.vue now uses home2 for every non-bare route; this set remains for tooling/docs.
 */
export const HOME2_SHELL_ROUTES = new Set([
  'home',
  'bots',
  'bot',
  'bot-create',
  'bot-config',
  'bot-copy',
  'bot-delete',
  'bot-social',
  'bot-bgr',
  'bot-2fa',
  'bot-2fa-delete',
  'bot-input',
  'password-encrypt',
  'password-hash',
  'commands',
  'configuration',
  'log',
  'plugins',
  'releases',
  'asf-config',
  'asf-bans',
  'ui-config',
  'mass-editor',
  '404',
]);

export function usesHome2Shell(routeName) {
  return HOME2_SHELL_ROUTES.has(routeName);
}
