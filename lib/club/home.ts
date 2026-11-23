import type { CoverTone } from "@/lib/validators";

export type HomePack = {
  id: string;
  slug: string;
  title: string;
  theme: string;
  coverTone: CoverTone;
  createdAt: string;
  owned: boolean;
  upcoming: boolean;
  free: boolean;
  submissionSlots: number;
  done: number;
  total: number;
  nextStep: string | null;
};

export type HomePackCard = {
  id: string;
  slug: string;
  title: string;
  theme: string;
  coverTone: CoverTone;
  done: number;
  total: number;
  nextStep: string | null;
};

export type HomeRelease = {
  id: string;
  slug: string;
  title: string;
  theme: string;
  coverTone: CoverTone;
  owned: boolean;
  free: boolean;
};

export type DashboardHome = {
  inProgress: HomePackCard[];
  completed: HomePackCard[];
  stats: {
    owned: number;
    shopTotal: number;
    points: number;
    unfinished: number;
    sent: number;
    available: number;
  };
  recent: HomeRelease[];
  upcoming: HomeRelease[];
  remindedIds: string[];
};

function card(pack: HomePack): HomePackCard {
  return {
    id: pack.id,
    slug: pack.slug,
    title: pack.title,
    theme: pack.theme,
    coverTone: pack.coverTone,
    done: pack.done,
    total: pack.total,
    nextStep: pack.nextStep,
  };
}

function release(pack: HomePack): HomeRelease {
  return {
    id: pack.id,
    slug: pack.slug,
    title: pack.title,
    theme: pack.theme,
    coverTone: pack.coverTone,
    owned: pack.owned,
    free: pack.free,
  };
}

export function groupPackProgress(input: {
  steps: Array<{ id: string; pack_id: string; position: number; title: string }>;
  progress: Array<{ child_id: string; step_id: string; status: string }>;
  childIds: string[];
  packId: string;
  stepCount: number;
}) {
  const kids = new Set(input.childIds);
  const steps = input.steps.filter((step) => step.pack_id === input.packId).sort((a, b) => a.position - b.position);
  const total = steps.length || input.stepCount;
  const doneIds = new Set(
    input.progress
      .filter((row) => row.status === "complete" && kids.has(row.child_id) && steps.some((step) => step.id === row.step_id))
      .map((row) => row.step_id),
  );
  const done = steps.filter((step) => doneIds.has(step.id)).length;
  const next = steps.find((step) => !doneIds.has(step.id));
  return { done, total, nextStep: next?.title ?? null };
}

export function buildDashboardHome(input: {
  packs: HomePack[];
  points: number;
  submissionsSent: number;
  remindedPackIds: string[];
}): DashboardHome {
  const released = input.packs.filter((pack) => !pack.upcoming);
  const owned = released.filter((pack) => pack.owned);
  const inProgress = owned.filter((pack) => pack.total > 0 && pack.done > 0 && pack.done < pack.total);
  const completed = owned.filter((pack) => pack.total > 0 && pack.done >= pack.total);
  const recent = [...released]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map(release);
  const upcoming = input.packs
    .filter((pack) => pack.upcoming)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(release);

  return {
    inProgress: inProgress.map(card),
    completed: completed.map(card),
    stats: {
      owned: owned.length,
      shopTotal: released.length,
      points: input.points,
      unfinished: owned.filter((pack) => pack.total === 0 || pack.done < pack.total).length,
      sent: input.submissionsSent,
      available: owned.reduce((sum, pack) => sum + pack.submissionSlots, 0),
    },
    recent,
    upcoming,
    remindedIds: input.remindedPackIds,
  };
}
