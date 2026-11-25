import fetchWiki from './fetchWiki';
import getLocaleForWiki from './getLocaleForWiki';
import * as storage from './storage';
import createVirtualDOM from './createVirtualDOM';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

// In-flight requests, so several modals asking at once (or fast bot switching) hit the wiki once.
const pendingLoads = new Map();

/**
 * Returns descriptions from the local cache when it is still fresh, otherwise null.
 * Synchronous: lets a form render with help text straight away when the cache is warm.
 */
export function peekParameterDescriptions(locale) {
  const descriptionsCache = storage.get(`cache:parameter-descriptions:${locale}`);
  if (!descriptionsCache) return null;

  const { timestamp, descriptions } = descriptionsCache;
  if (descriptions && timestamp > Date.now() - CACHE_TTL_MS) return descriptions;

  return null;
}

async function fetchParameterDescriptions(version, locale) {
  const descriptions = {};
  const configWiki = await fetchWiki('Configuration', version, locale);
  const virtualDOM = createVirtualDOM(configWiki);
  const parametersHTML = Array.from(virtualDOM.querySelectorAll('h3 > code'));

  parametersHTML.forEach(parameterHTML => {
    const parameterName = parameterHTML.innerText;
    const parameterDescription = [];
    let description = parameterHTML.parentElement.parentElement.nextElementSibling;

    while (description && description.tagName.toLowerCase() !== 'hr') {
      const wikiLinks = description.querySelectorAll('a[href^="#"]');
      const wikiLocale = getLocaleForWiki(locale);
      fixWikiLinks(wikiLinks, 'Configuration', wikiLocale);
      parameterDescription.push(description.outerHTML);
      description = description.nextElementSibling;
    }

    descriptions[parameterName] = parameterDescription.join(' ');
  });

  storage.set(`cache:parameter-descriptions:${locale}`, { timestamp: Date.now(), descriptions });

  return descriptions;
}

export default function loadParameterDescriptions(version, locale) {
  const cached = peekParameterDescriptions(locale);
  if (cached) return Promise.resolve(cached);

  const key = `${version}|${locale}`;
  if (pendingLoads.has(key)) return pendingLoads.get(key);

  // Failures are not cached: the entry is dropped once settled, so the next call retries.
  const promise = fetchParameterDescriptions(version, locale).finally(() => pendingLoads.delete(key));
  pendingLoads.set(key, promise);

  return promise;
}

export function fixWikiLinks(links, page, locale) {
  links.forEach(link => {
    if (!link) return;

    link.setAttribute('href', `https://github.com/JustArchiNET/ArchiSteamFarm/wiki/${page}${locale}${link.hash}`);
    link.setAttribute('target', '_blank');
  });
}
