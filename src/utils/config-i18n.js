/**
 * Translate ASF config parameter / enum names when locale strings exist.
 * Falls back to the original technical name.
 */

/** Steam statuses shown in the bot UI (legacy API values stay hidden). */
export const BASIC_ONLINE_STATUS_NAMES = ['Online', 'Away', 'Invisible', 'Offline'];

/**
 * Map legacy OnlineStatus values to a basic one for the UI.
 * Returns the same value when already basic.
 */
export function normalizeOnlineStatusValue(values, current) {
  if (!values || current === null || typeof current === 'undefined') return current;

  const currentName = Object.keys(values).find(name => values[name] === current);
  if (!currentName || BASIC_ONLINE_STATUS_NAMES.includes(currentName)) return current;

  if (typeof values.Online !== 'undefined') return values.Online;
  return current;
}

export function translateConfigParam(vm, paramName) {
  const name = String(paramName || '');
  if (!name) return name;
  return vm.$t(`config-param-${name}`, name);
}

export function translateConfigEnum(vm, enumName) {
  const name = String(enumName || '');
  if (!name) return name;
  return vm.$t(`config-enum-${name}`, name);
}

/**
 * Prefer short end-user help for known basic fields; otherwise keep wiki HTML.
 * ASF uses a custom i18n plugin (no vue-i18n `$te`).
 */
export function resolveConfigHelp(vm, paramName, fallbackDescription) {
  const name = String(paramName || '');
  if (!name || !vm || typeof vm.$t !== 'function') return fallbackDescription;

  const key = `config-help-simple-${name}`;
  const translationLocale = vm.$store
    && vm.$store.getters
    && typeof vm.$store.getters['i18n/translationLocale'] === 'function'
    && vm.$store.getters['i18n/translationLocale'](key);

  if (translationLocale) return vm.$t(key);

  return fallbackDescription;
}

/**
 * Sort flag enum entries for readable selects: None → individual flags → All.
 */
export function sortFlagEnumEntries(values) {
  const entries = Object.entries(values || {});
  const maxValue = Math.max(...entries.filter(([name]) => name !== 'Max').map(([, value]) => value));

  return entries
    .filter(([name, enumValue]) => !(name === 'Max' && enumValue === maxValue))
    .sort(([nameA, valueA], [nameB, valueB]) => {
      if (nameA === 'None' || valueA === 0) return -1;
      if (nameB === 'None' || valueB === 0) return 1;
      if (nameA === 'All') return 1;
      if (nameB === 'All') return -1;
      return valueA - valueB;
    });
}
