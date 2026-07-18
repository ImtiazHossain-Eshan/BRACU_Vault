/** Tiny fuzzy matcher + highlighter — no dependencies, fast enough for live search. */

/** Subsequence fuzzy score. Returns -1 for no match, higher = better. */
export function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (!q) return 0;

  let ti = 0;
  let score = 0;
  let streak = 0;
  let firstIdx = -1;

  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    let found = -1;
    for (let i = ti; i < t.length; i++) {
      if (t[i] === ch) {
        found = i;
        break;
      }
    }
    if (found === -1) return -1;
    if (firstIdx < 0) firstIdx = found;
    // contiguous matches and word-start matches score higher
    if (found === ti) {
      streak++;
      score += 6 + streak;
    } else {
      streak = 0;
      score += 1;
      if (t[found - 1] === " " || t[found - 1] === "-") score += 4;
    }
    ti = found + 1;
  }
  score += Math.max(0, 12 - firstIdx); // earlier = better
  return score;
}

export interface HighlightPart {
  text: string;
  match: boolean;
}

/** Split text into matched/unmatched parts (substring first, else subsequence). */
export function highlight(text: string, query: string): HighlightPart[] {
  const q = query.toLowerCase().trim();
  if (!q) return [{ text, match: false }];

  const lt = text.toLowerCase();
  const idx = lt.indexOf(q);
  if (idx >= 0) {
    return [
      { text: text.slice(0, idx), match: false },
      { text: text.slice(idx, idx + q.length), match: true },
      { text: text.slice(idx + q.length), match: false },
    ].filter((p) => p.text.length > 0);
  }

  // subsequence highlight
  const parts: HighlightPart[] = [];
  let qi = 0;
  let plain = "";
  let matched = "";
  for (let i = 0; i < text.length; i++) {
    if (qi < q.length && lt[i] === q[qi]) {
      if (plain) {
        parts.push({ text: plain, match: false });
        plain = "";
      }
      matched += text[i];
      qi++;
    } else {
      if (matched) {
        parts.push({ text: matched, match: true });
        matched = "";
      }
      plain += text[i];
    }
  }
  if (matched) parts.push({ text: matched, match: true });
  if (plain) parts.push({ text: plain, match: false });
  return parts;
}
