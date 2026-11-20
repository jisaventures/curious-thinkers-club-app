export const LEVELS = [
  { name: "Curious Starter", min: 0 },
  { name: "Curious Explorer", min: 200 },
  { name: "Super Scientist", min: 520 },
  { name: "Master Maker", min: 900 },
] as const;

export function levelProgress(points: number) {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i += 1) {
    if (points >= LEVELS[i].min) index = i;
  }
  const current = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  if (!next) {
    return { current, next: null, toGo: 0, ratio: 1 };
  }
  const span = next.min - current.min;
  const into = Math.max(0, points - current.min);
  return {
    current,
    next,
    toGo: Math.max(0, next.min - points),
    ratio: Math.min(1, into / span),
  };
}
