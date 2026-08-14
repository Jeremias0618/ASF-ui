/**
 * Helpers for ASFBotSocial MutationsResponse payloads.
 */

export function mutationSucceeded(entry) {
  if (!entry || typeof entry !== 'object') return false;
  return (entry.Success ?? entry.success) === true;
}

export function firstMutationResult(payload, botName) {
  if (!payload || typeof payload !== 'object') return null;
  const keys = Object.keys(payload);
  const botResult = payload[botName]
    || payload[keys.find(k => k.toLowerCase() === String(botName || '').toLowerCase())]
    || payload[keys[0]];
  if (!botResult) return null;
  if (Array.isArray(botResult)) return botResult[0] || null;
  const list = botResult.Results || botResult.results;
  return Array.isArray(list) ? (list[0] || null) : null;
}
