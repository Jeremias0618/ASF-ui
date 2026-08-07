/**
 * Locale labels and cross-language search aliases for the appearance panel.
 */

const SPECIAL_LOCALES = {
  'lol-US': {
    name: 'LOLCAT',
    region: 'United States',
    aliases: ['lolcat', 'lol', 'cat', 'april fools'],
  },
  'sr-CS': {
    name: 'Srpski',
    region: 'Serbia',
    aliases: ['serbian', 'serbia', 'srpski', 'српски'],
  },
};

/** Locales used to build alternate language/region names for search. */
const SEARCH_DISPLAY_LOCALES = [
  'en', 'es', 'fr', 'de', 'pt', 'it', 'ru', 'uk', 'pl', 'nl',
  'tr', 'ja', 'ko', 'zh', 'ar', 'sv', 'cs', 'ro', 'hu', 'el',
  'fi', 'da', 'no', 'bg', 'hr', 'sk', 'lt', 'lv', 'id', 'vi',
  'th', 'he', 'fa', 'ca', 'eu', 'gl',
];

const EXTRA_ALIASES = {
  en: ['english', 'ingles', 'inglés', 'anglais', 'englisch', 'inglese', 'английский'],
  es: ['spanish', 'español', 'espanol', 'castellano', 'castilian', 'espagnol', 'spanisch'],
  ca: ['catalan', 'catalán', 'català', 'catala', 'catalonia', 'cataluña', 'catalunya'],
  pt: ['portuguese', 'português', 'portugues', 'portugais', 'brasil', 'brazil', 'portugal'],
  fr: ['french', 'français', 'francais', 'francés', 'frances'],
  de: ['german', 'deutsch', 'alemán', 'aleman', 'allemand'],
  it: ['italian', 'italiano', 'italien', 'italiano'],
  ru: ['russian', 'русский', 'ruso', 'russe', 'russisch'],
  zh: ['chinese', '中文', 'chino', 'mandarin', 'mandarín', '简体', '繁體'],
  ja: ['japanese', '日本語', 'japonés', 'japones', 'japonais'],
  ko: ['korean', '한국어', 'coreano', 'coréen'],
  uk: ['ukrainian', 'українська', 'ucraniano', 'ukrainien'],
  pl: ['polish', 'polski', 'polaco', 'polonais'],
  nl: ['dutch', 'nederlands', 'holandés', 'hollandais', 'flemish'],
  tr: ['turkish', 'türkçe', 'turco', 'turc'],
  ar: ['arabic', 'العربية', 'árabe', 'arabe'],
  he: ['hebrew', 'עברית', 'hebreo', 'hébreu'],
  fa: ['persian', 'farsi', 'فارسی', 'persa'],
  cs: ['czech', 'čeština', 'checo', 'tchèque'],
  sk: ['slovak', 'slovenčina', 'eslovaco'],
  hr: ['croatian', 'hrvatski', 'croata'],
  bs: ['bosnian', 'bosanski', 'bosnio'],
  bg: ['bulgarian', 'български', 'búlgaro'],
  be: ['belarusian', 'беларуская', 'bielorruso'],
  ro: ['romanian', 'română', 'rumano', 'roumain'],
  hu: ['hungarian', 'magyar', 'húngaro', 'hongrois'],
  el: ['greek', 'ελληνικά', 'griego', 'grec'],
  fi: ['finnish', 'suomi', 'finlandés', 'finnois'],
  sv: ['swedish', 'svenska', 'sueco', 'suédois'],
  da: ['danish', 'dansk', 'danés', 'danois'],
  no: ['norwegian', 'norsk', 'noruego', 'norvégien'],
  lt: ['lithuanian', 'lietuvių', 'lituano'],
  lv: ['latvian', 'latviešu', 'letón', 'letton'],
  et: ['estonian', 'eesti', 'estonio'],
  id: ['indonesian', 'bahasa indonesia', 'indonesio'],
  vi: ['vietnamese', 'tiếng việt', 'vietnamita'],
  th: ['thai', 'ไทย', 'tailandés'],
  ka: ['georgian', 'ქართული', 'georgiano'],
  sr: ['serbian', 'српски', 'srpski', 'serbio'],
};

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];
  values.forEach(value => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  });
  return result;
}

export function normalizeLocaleSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getFlagCountry(locale) {
  if (locale === 'sr-CS') return 'rs';
  if (locale === 'lol-US') return 'lol';
  const parts = String(locale || '').split('-');
  return (parts[1] || parts[0] || '').toLowerCase();
}

function displayName(type, code, locales) {
  if (!code || typeof Intl === 'undefined' || !Intl.DisplayNames) return null;
  try {
    const names = new Intl.DisplayNames(locales, { type });
    return names.of(code) || null;
  } catch (err) {
    return null;
  }
}

function collectNames(type, code, preferredLocales = []) {
  if (!code) return [];
  const locales = uniqueStrings([
    ...preferredLocales,
    ...SEARCH_DISPLAY_LOCALES,
    code,
  ]);
  return uniqueStrings(locales.map(locale => displayName(type, code, [locale, 'en'])));
}

/**
 * @param {string} locale BCP-47 locale, e.g. es-ES
 * @param {string} uiLocale Current UI locale for primary labels
 */
export function describeLocale(locale, uiLocale = 'en-US') {
  const special = SPECIAL_LOCALES[locale];
  const [languageCode, regionCode] = String(locale).split('-');
  const country = getFlagCountry(locale);

  const languageNames = uniqueStrings([
    ...(special ? [special.name] : []),
    ...collectNames('language', languageCode, [uiLocale, locale, 'en']),
    ...(EXTRA_ALIASES[languageCode] || []),
    ...(special ? special.aliases : []),
    languageCode,
  ]);

  const regionNames = uniqueStrings([
    ...(special ? [special.region] : []),
    ...(regionCode ? collectNames('region', regionCode, [uiLocale, locale, 'en']) : []),
    regionCode,
    country,
  ]);

  const name = special
    ? special.name
    : (displayName('language', languageCode, [uiLocale, locale, 'en']) || languageCode);

  const nativeName = special
    ? special.name
    : (displayName('language', languageCode, [locale, languageCode, 'en']) || name);

  const region = special
    ? special.region
    : (regionCode
      ? (displayName('region', regionCode, [uiLocale, locale, 'en']) || regionCode)
      : languageCode);

  const englishName = special
    ? special.name
    : (displayName('language', languageCode, ['en']) || name);

  const aliases = uniqueStrings([
    ...languageNames,
    ...regionNames,
    locale,
    `${languageCode}-${country}`,
    englishName,
    nativeName,
  ]);

  return {
    locale,
    country,
    languageCode,
    regionCode: regionCode || '',
    name,
    nativeName,
    englishName,
    region,
    aliases,
    searchText: aliases.join(' '),
  };
}

export function localeMatchesQuery(option, query) {
  const needle = normalizeLocaleSearch(query);
  if (!needle) return true;

  return normalizeLocaleSearch(option.searchText).includes(needle)
    || (option.aliases || []).some(alias => normalizeLocaleSearch(alias).includes(needle));
}
