/**
 * ASF console commands split arguments on whitespace, then join bot targets with commas.
 * Bot names that contain spaces therefore cannot be passed literally (e.g. "Giveaway 2"
 * becomes "Giveaway,2"). Use ASF's regex bot selector instead.
 */

export function encodeBotNameForCommand(name) {
  const botName = String(name || '');
  if (!botName) return botName;
  if (!/\s/.test(botName)) return botName;

  const escaped = botName
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');

  return `r!^${escaped}$`;
}

export function encodeBotsArgument(argsText, botNames) {
  const text = String(argsText || '');
  if (!text) return text;

  const sorted = [...botNames]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (!sorted.length) return text;

  const exact = sorted.find(name => name.toLowerCase() === text.toLowerCase());
  if (exact) return encodeBotNameForCommand(exact);

  if (text.includes(',')) {
    return text.split(',').map((part) => {
      const trimmed = part.trim();
      const bot = sorted.find(name => name.toLowerCase() === trimmed.toLowerCase());
      return bot ? encodeBotNameForCommand(bot) : trimmed;
    }).join(',');
  }

  for (const name of sorted) {
    if (!text.toLowerCase().startsWith(name.toLowerCase())) continue;
    const after = text.slice(name.length);
    if (after === '' || after[0] === ' ' || after[0] === ',') {
      return `${encodeBotNameForCommand(name)}${after}`;
    }
  }

  return text;
}

export function prepareCommandForSend(commandText, botNames) {
  const trimmed = String(commandText || '').trim();
  if (!trimmed) return trimmed;

  const separator = trimmed.indexOf(' ');
  if (separator < 0) return trimmed;

  const command = trimmed.slice(0, separator);
  const args = trimmed.slice(separator + 1).trim();
  if (!args) return command;

  return `${command} ${encodeBotsArgument(args, botNames)}`;
}
