import type { CoverTone } from "@/lib/validators";

export type ClubRelease = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  coverTone: CoverTone;
  owned: boolean;
};

export type ClubBanner = {
  id: string;
  slug: string;
  title: string;
  coverTone: CoverTone;
  state: "start" | "continue";
  done: number;
  total: number;
  nextStep: string | null;
  purchasedAt: string;
  lastActivity: string | null;
};

type StepRow = { id: string; pack_id: string; position: number; title: string };
type ProgressRow = { child_id: string; step_id: string; status: string; completed_at?: string | null };

export function clubPackBanners(input: {
  packs: Array<{ id: string; slug: string; title: string; cover_tone: CoverTone; step_count: number }>;
  steps: StepRow[];
  owned: Array<{ pack_id: string; granted_at?: string | null }>;
  progress: ProgressRow[];
  childIds: string[];
}): ClubBanner[] {
  const kids = new Set(input.childIds);
  const ownedAt = new Map(input.owned.map((row) => [row.pack_id, row.granted_at || ""]));
  const starts: ClubBanner[] = [];
  const continues: ClubBanner[] = [];

  for (const pack of input.packs) {
    if (!ownedAt.has(pack.id)) continue;
    const steps = input.steps.filter((step) => step.pack_id === pack.id).sort((a, b) => a.position - b.position);
    const total = steps.length || pack.step_count;
    if (!total) continue;
    const packProgress = input.progress.filter(
      (row) => row.status === "complete" && kids.has(row.child_id) && steps.some((step) => step.id === row.step_id),
    );
    const doneIds = new Set(packProgress.map((row) => row.step_id));
    const done = steps.filter((step) => doneIds.has(step.id)).length;
    if (done >= total) continue;
    const next = steps.find((step) => !doneIds.has(step.id));
    const lastActivity = packProgress
      .map((row) => row.completed_at || "")
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;
    const banner: ClubBanner = {
      id: pack.id,
      slug: pack.slug,
      title: pack.title,
      coverTone: pack.cover_tone,
      state: done === 0 ? "start" : "continue",
      done,
      total,
      nextStep: next?.title ?? null,
      purchasedAt: ownedAt.get(pack.id) || "",
      lastActivity,
    };
    if (banner.state === "start") starts.push(banner);
    else continues.push(banner);
  }

  starts.sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
  continues.sort((a, b) => (b.lastActivity || "").localeCompare(a.lastActivity || ""));
  return [...starts, ...continues];
}

export function recentReleases(input: {
  packs: Array<{ id: string; slug: string; title: string; blurb: string; cover_tone: CoverTone; created_at?: string | null; published?: boolean }>;
  ownedIds: Set<string>;
}): ClubRelease[] {
  const published = input.packs.filter((pack) => pack.published !== false);
  const sorted = [...published].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  const unowned = sorted.filter((pack) => !input.ownedIds.has(pack.id));
  const list = (unowned.length ? unowned : sorted).slice(0, 4);
  return list.map((pack) => ({
    id: pack.id,
    slug: pack.slug,
    title: pack.title,
    blurb: pack.blurb,
    coverTone: pack.cover_tone,
    owned: input.ownedIds.has(pack.id),
  }));
}
