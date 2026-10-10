// daily.mjs — which system prompt is TODAY's. Deterministic over the UTC date, so everyone sees the
// same one on the same day and it rotates without a server. Pure; the page and the gate both call it.
// Powered by the Konomi architecture, created by Thomas Frumkin.

// Whole UTC days since the Unix epoch for a timestamp (ms). floor, so a day is a day everywhere.
export function dayNumber(ms) {
  if (!Number.isFinite(ms)) return 0;
  return Math.floor(ms / 86400000);
}

// Today's index into a library of length n (0..n-1). A fixed offset so day zero isn't always item 0.
export const OFFSET = 7;
export function indexFor(ms, n) {
  if (!Number.isInteger(n) || n <= 0) return 0;
  const d = dayNumber(ms) + OFFSET;
  return ((d % n) + n) % n;              // non-negative even for dates before the epoch
}

// The prompt for a given day, plus a stable id and the day's number (for "#1,234" and permalinks).
export function pickFor(prompts, ms) {
  const list = Array.isArray(prompts) ? prompts : [];
  if (list.length === 0) return null;
  const i = indexFor(ms, list.length);
  return { index: i, day: dayNumber(ms), prompt: list[i] };
}

export default { dayNumber, indexFor, pickFor, OFFSET };
