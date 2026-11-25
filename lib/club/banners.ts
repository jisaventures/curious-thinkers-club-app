import type { CoverTone } from "@/lib/validators";

export type ClubBanner = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  durationLabel: string;
  ageMin: number;
  ageMax: number;
  pageCount: number | null;
  coverTone: CoverTone;
  state: "start" | "continue";
  done: number;
  total: number;
  nextStep: string | null;
  purchasedAt: string;
  lastActivity: string | null;
  pendingMemberIds: string[];
};

type StepRow = { id: string; pack_id: string; position: number; title: string };
type ProgressRow = { child_id: string; step_id: string; status: string; completed_at?: string | null };

export function clubPackBanners(input: {
  packs: Array<{
    id: string;
    slug: string;
    title: string;
    blurb?: string;
    duration_label?: string;
    age_min?: number;
    age_max?: number;
    page_count?: number | null;
    cover_tone: CoverTone;
    step_count: number;
  }>;
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
    const stepIds = new Set(steps.map((step) => step.id));
    const doneByChild = new Map<string, Set<string>>();
    let lastActivity = "";
    for (const row of input.progress) {
      if (row.status !== "complete" || !kids.has(row.child_id) || !stepIds.has(row.step_id)) continue;
      const finished = doneByChild.get(row.child_id) ?? new Set<string>();
      finished.add(row.step_id);
      doneByChild.set(row.child_id, finished);
      if (row.completed_at && row.completed_at > lastActivity) lastActivity = row.completed_at;
    }
    const doneIds = new Set([...doneByChild.values()].flatMap((finished) => [...finished]));
    const done = steps.filter((step) => doneIds.has(step.id)).length;
    const next = steps.find((step) => !doneIds.has(step.id));
    const pendingMemberIds = input.childIds.filter((id) => (doneByChild.get(id)?.size ?? 0) < total);
    const started = doneByChild.size > 0;
    if (started && pendingMemberIds.length === 0) continue;
    const banner: ClubBanner = {
      id: pack.id,
      slug: pack.slug,
      title: pack.title,
      blurb: pack.blurb || "",
      durationLabel: pack.duration_label || "",
      ageMin: pack.age_min ?? 0,
      ageMax: pack.age_max ?? 0,
      pageCount: pack.page_count ?? null,
      coverTone: pack.cover_tone,
      state: started ? "continue" : "start",
      done,
      total,
      nextStep: next?.title ?? null,
      purchasedAt: ownedAt.get(pack.id) || "",
      lastActivity: lastActivity || null,
      pendingMemberIds,
    };
    if (banner.state === "start") starts.push(banner);
    else continues.push(banner);
  }

  starts.sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
  continues.sort((a, b) => (b.lastActivity || "").localeCompare(a.lastActivity || ""));
  if (starts.length > 0) return [starts[0]];
  return continues.slice(0, 1);
}

