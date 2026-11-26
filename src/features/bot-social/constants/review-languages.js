/**
 * Review languages offered by Steam's own review form (id = what Steam expects, name = its English label).
 * The id is sent as-is; the plugin validates it against the same list.
 */
export const REVIEW_LANGUAGES = [
  { id: 'english', name: 'English' },
  { id: 'spanish', name: 'Spanish - Spain' },
  { id: 'latam', name: 'Spanish - Latin America' },
  { id: 'brazilian', name: 'Portuguese - Brazil' },
  { id: 'portuguese', name: 'Portuguese - Portugal' },
  { id: 'french', name: 'French' },
  { id: 'german', name: 'German' },
  { id: 'italian', name: 'Italian' },
  { id: 'dutch', name: 'Dutch' },
  { id: 'russian', name: 'Russian' },
  { id: 'ukrainian', name: 'Ukrainian' },
  { id: 'polish', name: 'Polish' },
  { id: 'czech', name: 'Czech' },
  { id: 'hungarian', name: 'Hungarian' },
  { id: 'romanian', name: 'Romanian' },
  { id: 'bulgarian', name: 'Bulgarian' },
  { id: 'greek', name: 'Greek' },
  { id: 'turkish', name: 'Turkish' },
  { id: 'swedish', name: 'Swedish' },
  { id: 'danish', name: 'Danish' },
  { id: 'norwegian', name: 'Norwegian' },
  { id: 'finnish', name: 'Finnish' },
  { id: 'schinese', name: 'Simplified Chinese' },
  { id: 'tchinese', name: 'Traditional Chinese' },
  { id: 'japanese', name: 'Japanese' },
  { id: 'koreana', name: 'Korean' },
  { id: 'thai', name: 'Thai' },
  { id: 'vietnamese', name: 'Vietnamese' },
  { id: 'indonesian', name: 'Indonesian' },
  { id: 'malay', name: 'Malay' },
];

const BY_LOCALE = {
  'es-ES': 'spanish',
  'pt-BR': 'brazilian',
  'pt-PT': 'portuguese',
  'zh-CN': 'schinese',
  'zh-TW': 'tchinese',
  'zh-HK': 'tchinese',
  'ja-JP': 'japanese',
  'ko-KR': 'koreana',
  'uk-UA': 'ukrainian',
  'no-NO': 'norwegian',
  'sv-SE': 'swedish',
  'da-DK': 'danish',
  'fi-FI': 'finnish',
  'el-GR': 'greek',
  'cs-CZ': 'czech',
  'hu-HU': 'hungarian',
  'ro-RO': 'romanian',
  'bg-BG': 'bulgarian',
  'tr-TR': 'turkish',
  'th-TH': 'thai',
  'vi-VN': 'vietnamese',
  'id-ID': 'indonesian',
  'pl-PL': 'polish',
  'nl-NL': 'dutch',
  'de-DE': 'german',
  'fr-FR': 'french',
  'it-IT': 'italian',
  'ru-RU': 'russian',
};

/** Suggested review language for an ASF-ui locale (English when there is no match). */
export function reviewLanguageForLocale(locale) {
  return BY_LOCALE[locale] || 'english';
}
