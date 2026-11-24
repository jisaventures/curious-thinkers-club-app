import "server-only";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { requireAdult } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { demoDashboard, demoPackPage } from "@/lib/demo/view";
import { levelProgress } from "@/lib/levels";
import { clubPackBanners } from "@/lib/club/banners";
import { buildDashboardHome, buildOwnedPacks, groupPackProgress } from "@/lib/club/home";
import { activePromo, bannerFromRow } from "@/lib/club/promo";
import { catchUpNudge, nextStepPosition } from "@/lib/progress";
import { detectVideoProvider, vimeoId, youtubeId, type AvatarKey, type CoverTone } from "@/lib/validators";

export type ClubChild = {
  id: string;
  nickname: string;
  avatar_key: AvatarKey;
  age_years: number;
  first_name?: string | null;
  gender?: "boy" | "girl" | "unspecified" | null;
  avatar_bg?: string | null;
  avatar_face?: string | null;
  avatar_hair_style?: string | null;
  avatar_hair_colour?: string | null;
  avatar_glasses?: boolean | null;
  avatar_hat?: string | null;
  avatar_skin?: string | null;
  avatar_eyes?: string | null;
  avatar_shirt?: string | null;
  avatar_options?: string | null;
  created_at?: string | null;
};

export type ClubPack = {
  id: string;
  slug: string;
  title: string;
  theme: string;
  blurb: string;
  duration_label: string;
  cover_tone: CoverTone;
  price_pence: number;
  step_count: number;
  certificate_bonus_points: number;
  owned: boolean;
  done: number;
  total: number;
  stepPoints: number[];
};

type StepRow = {
  id: string;
  pack_id: string;
  position: number;
  title: string;
  description: string;
  video_url: string | null;
  printable_ref: string | null;
  estimated_minutes: number;
  points: number;
};

type ProgressRow = {
  child_id: string;
  step_id: string;
  status: "in_progress" | "complete";
  video_position_seconds: number;
};

const PACK_ORDER = [
  "be-a-pirate-for-the-day",
  "be-an-egyptian-explorer",
  "become-a-spy",
  "be-a-knight-for-the-day",
  "be-a-space-explorer",
];

function must<T>(data: T, error: { message: string } | null, label: string) {
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

export async function loadDashboard() {
  const { account } = await requireAdult();
  if (isDemoMode()) return demoDashboard(account);

  const { supabase } = await requireAdult();
  const [childrenRes, packsRes, ownershipRes, ledgerRes, boardRes, rewardsRes, prizesRes, submissionsRes, sentRes, remindersRes, packSubmissionsRes, bannerRes] =
    await Promise.all([
      supabase.from("children").select("id, nickname, avatar_key, age_years, first_name, gender, avatar_bg, avatar_face, avatar_hair_style, avatar_hair_colour, avatar_glasses, avatar_hat, avatar_skin, avatar_eyes, avatar_shirt, avatar_options, created_at").order("created_at"),
      supabase.from("packs").select("*").or("published.eq.true,upcoming.eq.true"),
      supabase.from("pack_ownership").select("pack_id, granted_at").eq("account_id", account.id),
      supabase.from("points_ledger").select("child_id, amount, reason, ref_id"),
      supabase.rpc("leaderboard_month"),
      supabase.from("reward_codes").select("*").order("min_points", { ascending: false }),
      supabase.from("prizes").select("*").order("sort_order"),
      supabase
        .from("submissions")
        .select("id, child_id, status, created_at")
        .order("created_at", { ascending: false })
        .limit(12),
      supabase.from("submissions").select("id", { count: "exact", head: true }).neq("status", "rejected"),
      supabase.from("pack_reminders").select("pack_id").eq("account_id", account.id),
      supabase.from("submissions").select("pack_id, status"),
      supabase.from("dashboard_banners").select("*").eq("id", "club-kit").maybeSingle(),
    ]);

  const children = must(childrenRes.data, childrenRes.error, "children") as ClubChild[];
  const packs = must(packsRes.data, packsRes.error, "packs") as Array<
    ClubPack & {
      created_at?: string;
      upcoming?: boolean;
      free?: boolean;
      submission_slots?: number;
      age_min?: number;
      age_max?: number;
      page_count?: number | null;
    }
  >;
  const owned = new Set((must(ownershipRes.data, ownershipRes.error, "ownership") ?? []).map((row) => row.pack_id));
  const ledger = must(ledgerRes.data, ledgerRes.error, "points") ?? [];
  const leaderboard = must(boardRes.data, boardRes.error, "leaderboard") ?? [];
  const rewards = must(rewardsRes.data, rewardsRes.error, "rewards") ?? [];
  const prizes = must(prizesRes.data, prizesRes.error, "prizes") ?? [];
  const submissions = must(submissionsRes.data, submissionsRes.error, "submissions") ?? [];

  const ownedIds = [...owned];
  const stepsRes = ownedIds.length
    ? await supabase.from("steps").select("id, pack_id, position, points, title").in("pack_id", ownedIds)
    : { data: [], error: null };
  const progressRes = children.length
    ? await supabase
        .from("step_progress")
        .select("id, child_id, step_id, status, completed_at")
        .in(
          "child_id",
          children.map((child) => child.id),
        )
    : { data: [], error: null };

  const steps = must(stepsRes.data, stepsRes.error, "steps") ?? [];
  const progress = must(progressRes.data, progressRes.error, "progress") ?? [];

  const jar = await cookies();
  const focus = children.find((child) => child.id === jar.get("ctc_focus_child")?.value) ?? children[0] ?? null;

  const pointsByChild = new Map<string, number>();
  for (const row of ledger) {
    pointsByChild.set(row.child_id, (pointsByChild.get(row.child_id) ?? 0) + row.amount);
  }

  const packCards: ClubPack[] = packs
    .filter((pack) => !pack.upcoming)
    .map((pack) => {
      const packSteps = steps.filter((step) => step.pack_id === pack.id);
      const done = focus
        ? packSteps.filter((step) =>
            progress.some(
              (row) => row.child_id === focus.id && row.step_id === step.id && row.status === "complete",
            ),
          ).length
        : 0;
      return {
        id: pack.id,
        slug: pack.slug,
        title: pack.title,
        theme: pack.theme,
        blurb: pack.blurb,
        duration_label: pack.duration_label,
        cover_tone: pack.cover_tone,
        price_pence: pack.price_pence,
        step_count: pack.step_count,
        certificate_bonus_points: pack.certificate_bonus_points,
        owned: owned.has(pack.id),
        done,
        total: pack.step_count || packSteps.length,
        stepPoints: packSteps.sort((a, b) => a.position - b.position).map((step) => step.points),
      };
    })
    .sort((a, b) => {
      const ai = PACK_ORDER.indexOf(a.slug);
      const bi = PACK_ORDER.indexOf(b.slug);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  const doneByChild: Record<string, Record<string, number>> = {};
  const nextStepByChild: Record<string, Record<string, string | null>> = {};
  for (const child of children) {
    doneByChild[child.id] = {};
    nextStepByChild[child.id] = {};
    for (const pack of packs) {
      const packSteps = steps
        .filter((step) => step.pack_id === pack.id)
        .sort((a, b) => a.position - b.position);
      doneByChild[child.id][pack.id] = packSteps.filter((step) =>
        progress.some((row) => row.child_id === child.id && row.step_id === step.id && row.status === "complete"),
      ).length;
      const next = packSteps.find(
        (step) => !progress.some((row) => row.child_id === child.id && row.step_id === step.id && row.status === "complete"),
      );
      nextStepByChild[child.id][pack.id] = next && "title" in next ? String(next.title) : null;
    }
  }

  const focusPoints = focus ? (pointsByChild.get(focus.id) ?? 0) : 0;
  const level = levelProgress(focusPoints);
  const unlockedReward = rewards.find((reward) => reward.active && focusPoints >= reward.min_points) ?? null;
  const nextReward =
    [...rewards]
      .filter((reward) => reward.active && focusPoints < reward.min_points)
      .sort((a, b) => a.min_points - b.min_points)[0] ?? null;

  return {
    account,
    children,
    focus,
    packs: packCards,
    points: focusPoints,
    clubPoints: [...pointsByChild.values()].reduce((sum, value) => sum + value, 0),
    clubRank: null as number | null,
    level,
    leaderboard: leaderboard as Array<{
      nickname: string;
      age_years: number;
      avatar_key: AvatarKey;
      points: number;
      rank: number;
      is_mine: boolean;
    }>,
    prizes,
    unlockedReward,
    nextReward,
    submissions: submissions.slice(0, 12),
    partial: packCards.find((pack) => pack.owned && pack.done > 0 && pack.total > 0 && pack.done < pack.total) ?? null,
    doneByChild,
    nextStepByChild,
    activities: activityFeed(children, packs, steps, progress),
    banners: clubPackBanners({
      packs,
      steps: steps as Array<{ id: string; pack_id: string; position: number; title: string }>,
      owned: (ownershipRes.data ?? []) as Array<{ pack_id: string; granted_at?: string | null }>,
      progress: progress as Array<{ child_id: string; step_id: string; status: string; completed_at?: string | null }>,
      childIds: children.map((child) => child.id),
    }),
    home: buildDashboardHome({
      packs: packs.map((pack) => {
        const progressRow = groupPackProgress({
          steps: steps as Array<{ id: string; pack_id: string; position: number; title: string }>,
          progress: progress as Array<{ child_id: string; step_id: string; status: string }>,
          childIds: children.map((child) => child.id),
          packId: pack.id,
          stepCount: pack.step_count,
        });
        return {
          id: pack.id,
          slug: pack.slug,
          title: pack.title,
          theme: pack.theme,
          coverTone: pack.cover_tone,
          createdAt: pack.created_at ?? "",
          owned: owned.has(pack.id),
          upcoming: Boolean(pack.upcoming),
          free: Boolean(pack.free),
          submissionSlots: Number(pack.submission_slots ?? 3),
          ...progressRow,
        };
      }),
      points: [...pointsByChild.values()].reduce((sum, value) => sum + value, 0),
      submissionsSent: sentRes.count ?? submissions.filter((row) => row.status !== "rejected").length,
      remindedPackIds: (remindersRes.data ?? []).map((row) => String(row.pack_id)),
      promo: activePromo(bannerFromRow(bannerRes.data)),
      ownedPacks: buildOwnedPacks({
        packs: packs.map((pack) => ({
          id: pack.id,
          slug: pack.slug,
          title: pack.title,
          theme: pack.theme,
          coverTone: pack.cover_tone,
          ageMin: pack.age_min ?? 0,
          ageMax: pack.age_max ?? 0,
          durationLabel: pack.duration_label,
          pageCount: pack.page_count ?? null,
          owned: owned.has(pack.id),
          upcoming: Boolean(pack.upcoming),
          submissionSlots: Number(pack.submission_slots ?? 3),
          stepCount: pack.step_count,
        })),
        steps,
        progress,
        childIds: children.map((child) => child.id),
        purchases: ((ownershipRes.data ?? []) as Array<{ pack_id: string; granted_at?: string | null }>).map((row) => ({
          packId: row.pack_id,
          grantedAt: row.granted_at ?? null,
        })),
        submissions: (packSubmissionsRes.data ?? []).map((row) => ({
          packId: row.pack_id ? String(row.pack_id) : null,
          status: String(row.status),
        })),
        ledger: ledger.map((row) => ({
          childId: String(row.child_id),
          amount: Number(row.amount),
          refId: String(row.ref_id),
          reason: String(row.reason),
        })),
      }),
    }),
    pointsByChild: Object.fromEntries(pointsByChild),
    rewardLadder: rewards
      .filter((reward) => reward.active)
      .map((reward) => ({
        code: reward.code as string,
        headline: reward.headline as string,
        description: reward.description as string,
        min_points: reward.min_points as number,
      })),
  };
}

export type PackChildView = {
  id: string;
  nickname: string;
  avatar_key: AvatarKey;
  age_years: number;
  avatar_bg?: string | null;
  avatar_face?: string | null;
  avatar_hair_style?: string | null;
  avatar_hair_colour?: string | null;
  avatar_glasses?: boolean | null;
  avatar_hat?: string | null;
  avatar_skin?: string | null;
  avatar_eyes?: string | null;
  avatar_shirt?: string | null;
  avatar_options?: string | null;
  gender?: "boy" | "girl" | "unspecified" | null;
  started: boolean;
  finished: boolean;
  nextPosition: number | null;
  resumeSeconds: number;
};

export async function loadPackPage(slug: string, modeRaw?: string, childRaw?: string) {
  const { account } = await requireAdult();
  if (isDemoMode()) return demoPackPage(account, slug, modeRaw, childRaw);

  const { supabase } = await requireAdult();
  const { data: pack, error } = await supabase.from("packs").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!pack) notFound();

  const { data: ownership } = await supabase
    .from("pack_ownership")
    .select("id")
    .eq("pack_id", pack.id)
    .eq("account_id", account.id)
    .maybeSingle();
  const owned = Boolean(ownership);

  const { data: childRows, error: childError } = await supabase
    .from("children")
    .select("id, nickname, avatar_key, age_years, first_name, gender, avatar_bg, avatar_face, avatar_hair_style, avatar_hair_colour, avatar_glasses, avatar_hat, avatar_skin, avatar_eyes, avatar_shirt, avatar_options")
    .eq("account_id", account.id)
    .order("created_at");
  if (childError) throw new Error(childError.message);
  const children = (childRows ?? []) as ClubChild[];

  if (!owned) {
    return {
      account,
      pack,
      owned: false as const,
      children,
      steps: [] as StepRow[],
      childViews: [] as PackChildView[],
      focus: children[0] ?? null,
      mode: "together" as const,
      activeStep: null,
      video: { provider: "none" as const, src: "" },
      nudge: null,
      certificates: [] as string[],
    };
  }

  const [{ data: stepRows, error: stepError }, { data: progressRows, error: progressError }, { data: certificateRows }] =
    await Promise.all([
      supabase.from("steps").select("*").eq("pack_id", pack.id).order("position"),
      supabase
        .from("step_progress")
        .select("child_id, step_id, status, video_position_seconds")
        .in("child_id", children.length ? children.map((child) => child.id) : ["00000000-0000-0000-0000-000000000000"]),
      supabase.from("certificates").select("child_id").eq("pack_id", pack.id),
    ]);
  if (stepError) throw new Error(stepError.message);
  if (progressError) throw new Error(progressError.message);

  const steps = await Promise.all(
    ((stepRows ?? []) as StepRow[])
      .sort((a, b) => a.position - b.position)
      .map(async (step) => ({ ...step, video: await resolveVideo(supabase, step.video_url) })),
  );
  const progress = (progressRows ?? []) as ProgressRow[];
  const positions = steps.map((step) => step.position);

  const childViews: PackChildView[] = children.map((child) => {
    const rows = progress.filter((row) => row.child_id === child.id && steps.some((step) => step.id === row.step_id));
    const complete = rows
      .filter((row) => row.status === "complete")
      .map((row) => steps.find((step) => step.id === row.step_id)?.position)
      .filter((position): position is number => typeof position === "number");
    const next = nextStepPosition(positions, complete);
    const current = next ? steps.find((step) => step.position === next) : null;
    const resume = current
      ? (rows.find((row) => row.step_id === current.id)?.video_position_seconds ?? 0)
      : 0;
    return {
      ...child,
      started: rows.length > 0,
      finished: next === null && steps.length > 0,
      nextPosition: next,
      resumeSeconds: resume,
    };
  });

  const mode = modeRaw === "solo" ? "solo" : "together";
  const focus = childViews.find((child) => child.id === childRaw) ?? childViews[0] ?? null;
  const activePosition = focus ? (focus.finished ? null : (focus.nextPosition ?? (steps[0]?.position ?? null))) : null;
  const activeStep = steps.find((step) => step.position === activePosition) ?? null;
  const video = activeStep?.video ?? { provider: "none" as const, src: "" };

  const nudge =
    mode === "together" && focus
      ? catchUpNudge(
          focus.nextPosition ?? (focus.finished ? null : 1),
          childViews
            .filter((child) => child.id !== focus.id)
            .map((child) => ({
              nickname: child.nickname,
              currentPosition: child.started ? child.nextPosition : null,
              started: child.started,
            })),
        )
      : null;

  const behind = childViews.find((child) => child.nickname === nudge?.nickname) ?? null;

  return {
    account,
    pack,
    owned: true as const,
    children,
    steps,
    childViews,
    focus,
    mode,
    activeStep,
    video,
    nudge: nudge && behind ? { ...nudge, childId: behind.id } : null,
    certificates: (certificateRows ?? []).map((row) => row.child_id as string),
    progress,
  };
}

function activityFeed(
  children: ClubChild[],
  packs: Array<{ id: string; title: string }>,
  steps: Array<{ id: string; pack_id: string; position: number; title?: string }>,
  progress: Array<{ id?: string; child_id: string; step_id: string; status: string; completed_at?: string | null }>,
) {
  const names = new Map(children.map((child) => [child.id, child.first_name?.trim() || child.nickname.split(/\s+/).at(-1) || child.nickname]));
  return progress
    .filter((row) => row.status === "complete" && names.has(row.child_id))
    .map((row) => {
      const step = steps.find((item) => item.id === row.step_id);
      const pack = packs.find((item) => item.id === step?.pack_id);
      const name = names.get(row.child_id) ?? "Someone";
      const finishedPack = step && pack && !steps.some((item) => item.pack_id === pack.id && item.position > step.position);
      const summary = finishedPack
        ? `${name} earned a stamp for the ${pack.title}.`
        : `${name} finished ${step?.title ?? "a step"}${pack ? ` in ${pack.title}` : ""}.`;
      return {
        id: row.id ?? `${row.child_id}-${row.step_id}`,
        childId: row.child_id,
        childName: name,
        summary,
        at: row.completed_at ?? "",
      };
    })
    .sort((a, b) => b.at.localeCompare(a.at));
}

async function resolveVideo(
  supabase: Awaited<ReturnType<typeof requireAdult>>["supabase"],
  url: string | null,
) {
  if (!url) return { provider: "none" as const, src: "" };
  if (url.startsWith("storage://pack-videos/")) {
    const path = url.slice("storage://pack-videos/".length);
    const { data } = await supabase.storage.from("pack-videos").createSignedUrl(path, 60 * 60);
    return { provider: "storage" as const, src: data?.signedUrl ?? "" };
  }
  const provider = detectVideoProvider(url);
  if (provider === "youtube") return { provider, src: youtubeId(url) ?? "" };
  if (provider === "vimeo") return { provider, src: vimeoId(url) ?? "" };
  return { provider: "mp4" as const, src: url };
}
