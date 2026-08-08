/**
 * Functional groups for ASF / terminal commands shown in the Commands help modal.
 */

export const COMMAND_CATEGORY_ORDER = [
  'ui',
  'aliases',
  'information',
  'farming',
  'trading',
  'twofa',
  'licenses',
  'lifecycle',
  'utility',
  'other',
];

const EXACT_CATEGORY = {
  commands: 'ui',
  help: 'ui',
  clear: 'ui',
  clearhistory: 'ui',

  oa: 'aliases',
  sa: 'aliases',

  status: 'information',
  version: 'information',
  stats: 'information',
  balance: 'information',
  inventory: 'information',
  level: 'information',
  points: 'information',
  owns: 'information',

  farm: 'farming',
  pause: 'farming',
  'pause~': 'farming',
  'pause&': 'farming',
  resume: 'farming',
  fb: 'farming',
  fbadd: 'farming',
  fbrm: 'farming',
  fq: 'farming',
  fqadd: 'farming',
  fqrm: 'farming',
  unpack: 'farming',
  play: 'farming',

  loot: 'trading',
  'loot^': 'trading',
  'loot&': 'trading',
  'loot@': 'trading',
  'loot%': 'trading',
  transfer: 'trading',
  'transfer^': 'trading',
  'transfer&': 'trading',
  'transfer@': 'trading',
  'transfer%': 'trading',
  tb: 'trading',
  tbadd: 'trading',
  tbrm: 'trading',
  mab: 'trading',
  mabadd: 'trading',
  mabrm: 'trading',
  match: 'trading',

  '2fa': 'twofa',
  '2faok': 'twofa',
  '2fano': 'twofa',

  addlicense: 'licenses',
  al: 'licenses',
  ala: 'licenses',
  redeem: 'licenses',
  r: 'licenses',
  'redeem^': 'licenses',
  'r^': 'licenses',
  rmlicense: 'licenses',
  rl: 'licenses',
  redeempoints: 'licenses',
  rp: 'licenses',

  start: 'lifecycle',
  stop: 'lifecycle',
  restart: 'lifecycle',
  reset: 'lifecycle',
  input: 'lifecycle',
  nickname: 'lifecycle',
  privacy: 'lifecycle',
  exit: 'lifecycle',
  update: 'lifecycle',
  updateplugins: 'lifecycle',

  bgr: 'utility',
  bgrclear: 'utility',
  encrypt: 'utility',
  hash: 'utility',
};

const PREFIX_CATEGORY = [
  { prefix: 'loot', category: 'trading' },
  { prefix: 'transfer', category: 'trading' },
  { prefix: 'pause', category: 'farming' },
  { prefix: 'redeem', category: 'licenses' },
  { prefix: '2fa', category: 'twofa' },
  { prefix: 'fb', category: 'farming' },
  { prefix: 'fq', category: 'farming' },
  { prefix: 'tb', category: 'trading' },
  { prefix: 'mab', category: 'trading' },
];

export function getCommandBaseName(commandSyntax) {
  return String(commandSyntax || '').trim().split(/\s+/)[0] || '';
}

export function getCommandCategory(commandSyntax, source) {
  if (source === 'ui') return 'ui';
  if (source === 'alias') return 'aliases';

  const name = getCommandBaseName(commandSyntax).toLowerCase();
  if (!name) return 'other';

  if (EXACT_CATEGORY[name]) return EXACT_CATEGORY[name];

  const match = PREFIX_CATEGORY.find(({ prefix }) => name === prefix || name.startsWith(prefix));
  if (match) return match.category;

  return 'other';
}

export function groupCommandsByCategory(entries) {
  const buckets = COMMAND_CATEGORY_ORDER.reduce((acc, id) => {
    acc[id] = [];
    return acc;
  }, {});

  entries.forEach((entry) => {
    const category = getCommandCategory(entry.command, entry.source);
    (buckets[category] || buckets.other).push(entry);
  });

  return COMMAND_CATEGORY_ORDER
    .map(id => ({
      id,
      commands: buckets[id]
        .slice()
        .sort((a, b) => getCommandBaseName(a.command).localeCompare(getCommandBaseName(b.command))),
    }))
    .filter(group => group.commands.length > 0);
}
