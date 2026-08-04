/** Route names that use the home2 sidebar + header shell. */
export const HOME2_SHELL_ROUTES = new Set([
  'home',
  'bots',
  'bot',
  'bot-create',
  'bot-config',
  'bot-copy',
  'bot-delete',
  'bot-bgr',
  'bot-2fa',
  'bot-2fa-delete',
  'bot-input',
  'password-encrypt',
  'commands',
  'configuration',
  'log',
  'plugins',
  'releases',
]);

export function usesHome2Shell(routeName) {
  return HOME2_SHELL_ROUTES.has(routeName);
}
