import { get } from '../../../plugins/http';

const PATH_IN_LOG = /\) in \[([^\]]+)\]/;

function extractHomePath(lines) {
  if (!Array.isArray(lines)) return '';

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const match = String(lines[index] || '').match(PATH_IN_LOG);
    const value = match && match[1] ? match[1].trim() : '';
    if (value && (value.includes('\\') || value.startsWith('/'))) return value;
  }

  return '';
}

export async function resolveAsfHomePath() {
  try {
    const recent = await get('nlog/file', { count: 400 });
    const fromRecent = extractHomePath(recent?.Content);
    if (fromRecent) return fromRecent;

    const total = Number(recent?.TotalLines) || 0;
    if (total <= 400) return '';

    const start = await get('nlog/file', { count: 200, lastAt: Math.min(200, total) });
    return extractHomePath(start?.Content);
  } catch (err) {
    return '';
  }
}

export function isWindowsHomePath(homePath) {
  return /^[A-Za-z]:[\\/]/.test(String(homePath || '')) || String(homePath || '').includes('\\');
}
