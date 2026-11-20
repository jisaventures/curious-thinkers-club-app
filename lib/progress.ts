export function nextStepPosition(
  positions: number[],
  completePositions: number[],
): number | null {
  const done = new Set(completePositions);
  const sorted = [...positions].sort((a, b) => a - b);
  return sorted.find((position) => !done.has(position)) ?? null;
}

export type ChildPlace = {
  id: string;
  nickname: string;
  /** Null when the child has not started and we are not treating them as on step 1. */
  currentPosition: number | null;
  started: boolean;
};

/**
 * Nudge when another child who has started is 3 or more steps behind
 * the child the family is gathered around.
 */
export function catchUpNudge(
  focusPosition: number | null,
  others: Array<{ nickname: string; currentPosition: number | null; started: boolean }>,
) {
  if (focusPosition === null) return null;
  let best: { nickname: string; gap: number } | null = null;
  for (const other of others) {
    if (!other.started || other.currentPosition === null) continue;
    const gap = focusPosition - other.currentPosition;
    if (gap >= 3 && (!best || gap > best.gap)) {
      best = { nickname: other.nickname, gap };
    }
  }
  return best;
}
