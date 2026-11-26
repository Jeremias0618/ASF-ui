/**
 * `Previous · 1 · 2 · 3 · … · N · Next`. Always shows the first and last page and the neighbours of the
 * current one; a gap of a single page shows that page instead of an ellipsis.
 */
export function pageEntries(page, lastPage) {
  const wanted = new Set([1, lastPage, page - 1, page, page + 1]);
  if (page <= 3) [2, 3].forEach(n => wanted.add(n));
  if (page >= lastPage - 2) [lastPage - 2, lastPage - 1].forEach(n => wanted.add(n));

  const numbers = Array.from(wanted).filter(n => n >= 1 && n <= lastPage).sort((a, b) => a - b);
  const entries = [];
  numbers.forEach((n, index) => {
    const previous = numbers[index - 1];
    if (previous != null && n - previous === 2) {
      entries.push({ key: `n${previous + 1}`, value: previous + 1 });
    } else if (previous != null && n - previous > 2) {
      entries.push({ key: `gap${n}`, gap: true });
    }
    entries.push({ key: `n${n}`, value: n });
  });
  return entries;
}
