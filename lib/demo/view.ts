import "server-only";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { levelProgress } from "@/lib/levels";
import { clubPackBanners, recentReleases } from "@/lib/club/banners";
import { catchUpNudge } from "@/lib/progress";
import { detectVideoProvider, vimeoId, youtubeId, type AvatarKey } from "@/lib/validators";
import type { AccountRecord } from "@/lib/auth/session";
import {
  childNextPosition,
  demoDb,
  type DemoAccount,
} from "@/lib/demo/store";

const PACK_ORDER = [
  "be-a-pirate-for-the-day",
  "be-an-egyptian-explorer",
  "become-a-spy",
  "be-a-knight-for-the-day",
  "be-a-space-explorer",
];

function activityFeed(children: Array<{ id: string; first_name?: string; nickname: string }>, db: ReturnType<typeof demoDb>) {
  const family = new Set(children.map((child) => child.id));
  const names = new Map(children.map((child) => [child.id, child.first_name?.trim() || child.nickname.split(/\s+/).at(-1) || child.nickname]));
  return db.progress
    .filter((row) => row.status === "complete" && family.has(row.child_id))
    .map((row) => {
      const step = db.steps.find((item) => item.id === row.step_id);
      const pack = db.packs.find((item) => item.id === step?.pack_id);
      const name = names.get(row.child_id) ?? "Someone";
      const finishedPack = step && pack && !db.steps.some((item) => item.pack_id === pack.id && item.position > step.position);
      const summary = finishedPack
        ? `${name} earned a stamp for the ${pack.title}.`
        : `${name} finished ${step?.title ?? "a step"}${pack ? ` in ${pack.title}` : ""}.`;
      return {
        id: `${row.child_id}-${row.step_id}`,
        childId: row.child_id,
        childName: name,
        summary,
        at: row.completed_at ?? "",
      };
    })
    .sort((a, b) => b.at.localeCompare(a.at));
}

function asAccount(account: DemoAccount): AccountRecord {
  return account;
}

function nextTitles(
  children: Array<{ id: string }>,
  db: ReturnType<typeof demoDb>,
) {
  const nextStepByChild: Record<string, Record<string, string | null>> = {};
  for (const child of children) {
    nextStepByChild[child.id] = {};
    for (const pack of db.packs) {
      const packSteps = db.steps
        .filter((step) => step.pack_id === pack.id)
        .sort((a, b) => a.position - b.position);
      const next = packSteps.find(
        (step) => !db.progress.some((row) => row.child_id === child.id && row.step_id === step.id && row.status === "complete"),
      );
      nextStepByChild[child.id][pack.id] = next?.title ?? null;
    }
  }
  return nextStepByChild;
}

export async function demoDashboard(account: AccountRecord) {
  const db = demoDb();
  const children = db.children
    .filter((child) => child.account_id === account.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const jar = await cookies();
  const focus = children.find((child) => child.id === jar.get("ctc_focus_child")?.value) ?? children[0] ?? null;
  const ownership = db.ownership.filter((row) => row.account_id === account.id);
  const owned = new Set(ownership.map((row) => row.pack_id));
  const packs = db.packs
    .filter((pack) => pack.published || account.role === "admin")
    .map((pack) => {
      const packSteps = db.steps.filter((step) => step.pack_id === pack.id).sort((a, b) => a.position - b.position);
      const done = focus
        ? packSteps.filter((step) =>
            db.progress.some((row) => row.child_id === focus.id && row.step_id === step.id && row.status === "complete"),
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
        stepPoints: packSteps.map((step) => step.points),
      };
    })
    .sort((a, b) => (PACK_ORDER.indexOf(a.slug) === -1 ? 99 : PACK_ORDER.indexOf(a.slug)) - (PACK_ORDER.indexOf(b.slug) === -1 ? 99 : PACK_ORDER.indexOf(b.slug)));

  const doneByChild: Record<string, Record<string, number>> = {};
  const pointsByChild: Record<string, number> = {};
  for (const child of children) {
    pointsByChild[child.id] = db.ledger.filter((row) => row.child_id === child.id).reduce((sum, row) => sum + row.amount, 0);
    doneByChild[child.id] = {};
    for (const pack of db.packs) {
      const packSteps = db.steps.filter((step) => step.pack_id === pack.id);
      doneByChild[child.id][pack.id] = packSteps.filter((step) =>
        db.progress.some((row) => row.child_id === child.id && row.step_id === step.id && row.status === "complete"),
      ).length;
    }
  }
  const focusPoints = focus ? (pointsByChild[focus.id] ?? 0) : 0;
  const totals = new Map<string, number>();
  for (const row of db.ledger) totals.set(row.child_id, (totals.get(row.child_id) ?? 0) + row.amount);
  const ranked = db.children
    .map((child) => ({
      nickname: child.nickname,
      age_years: child.age_years,
      avatar_key: child.avatar_key as AvatarKey,
      points: totals.get(child.id) ?? 0,
      is_mine: child.account_id === account.id,
    }))
    .filter((row) => row.points > 0)
    .sort((a, b) => b.points - a.points || a.nickname.localeCompare(b.nickname))
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const rewards = [...db.rewards].filter((reward) => reward.active || account.role === "admin").sort((a, b) => b.min_points - a.min_points);
  return {
    account,
    children,
    focus,
    packs,
    points: focusPoints,
    level: levelProgress(focusPoints),
    leaderboard: ranked,
    prizes: [...db.prizes].sort((a, b) => a.sort_order - b.sort_order),
    unlockedReward: rewards.find((reward) => reward.active && focusPoints >= reward.min_points) ?? null,
    nextReward: [...rewards].filter((reward) => reward.active && focusPoints < reward.min_points).sort((a, b) => a.min_points - b.min_points)[0] ?? null,
    submissions: db.submissions.slice(0, 12),
    partial: null,
    doneByChild,
    nextStepByChild: nextTitles(children, db),
    activities: activityFeed(children, db),
    banners: clubPackBanners({
      packs: db.packs,
      steps: db.steps,
      owned: ownership,
      progress: db.progress,
      childIds: children.map((child) => child.id),
    }),
    releases: recentReleases({ packs: db.packs, ownedIds: owned }),
    pointsByChild,
    rewardLadder: rewards
      .filter((reward) => reward.active)
      .map((reward) => ({
        code: reward.code,
        headline: reward.headline,
        description: reward.description,
        min_points: reward.min_points,
      })),
  };
}

export function demoPackPage(account: AccountRecord, slug: string, modeRaw?: string, childRaw?: string) {
  const db = demoDb();
  const pack = db.packs.find((item) => item.slug === slug);
  if (!pack) notFound();
  const children = db.children
    .filter((child) => child.account_id === account.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const owned = db.ownership.some((row) => row.account_id === account.id && row.pack_id === pack.id);
  if (!owned) {
    return {
      account,
      pack,
      owned: false as const,
      children,
      steps: [],
      childViews: [],
      focus: children[0] ?? null,
      mode: "together" as const,
      activeStep: null,
      video: { provider: "none" as const, src: "" },
      nudge: null,
      certificates: [] as string[],
    };
  }

  const steps = db.steps
    .filter((step) => step.pack_id === pack.id)
    .sort((a, b) => a.position - b.position)
    .map((step) => ({ ...step, video: resolve(step.video_url) }));
  const childViews = children.map((child) => {
    const rows = db.progress.filter((row) => row.child_id === child.id && steps.some((step) => step.id === row.step_id));
    const next = childNextPosition(child.id, pack.id);
    const current = next ? steps.find((step) => step.position === next) : null;
    return {
      ...child,
      started: rows.length > 0,
      finished: next === null && steps.length > 0,
      nextPosition: next,
      resumeSeconds: current ? (rows.find((row) => row.step_id === current.id)?.video_position_seconds ?? 0) : 0,
    };
  });
  const mode = modeRaw === "solo" ? "solo" : "together";
  const focus = childViews.find((child) => child.id === childRaw) ?? childViews[0] ?? null;
  const activePosition = focus ? (focus.finished ? null : (focus.nextPosition ?? steps[0]?.position ?? null)) : null;
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
    certificates: db.certificates.filter((row) => row.pack_id === pack.id).map((row) => row.child_id),
    progress: db.progress,
  };
}

function resolve(url: string | null) {
  if (!url) return { provider: "none" as const, src: "" };
  if (url.startsWith("storage://")) return { provider: "mp4" as const, src: "/videos/guide.mp4" };
  const provider = detectVideoProvider(url);
  if (provider === "youtube") return { provider, src: youtubeId(url) ?? "" };
  if (provider === "vimeo") return { provider, src: vimeoId(url) ?? "" };
  return { provider: "mp4" as const, src: url };
}

export function demoChildren(accountId: string) {
  return demoDb()
    .children.filter((child) => child.account_id === accountId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function demoAdminCounts() {
  const db = demoDb();
  return {
    packs: db.packs.length,
    pending: db.submissions.filter((row) => row.status === "pending").length,
    accounts: db.accounts.length,
  };
}

export function demoPackList() {
  return [...demoDb().packs].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function demoPackEditor(id: string) {
  const db = demoDb();
  const pack = db.packs.find((item) => item.id === id);
  if (!pack) return null;
  return {
    pack,
    steps: db.steps.filter((step) => step.pack_id === id).sort((a, b) => a.position - b.position),
  };
}

export function demoSubmissions() {
  const db = demoDb();
  return [...db.submissions]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((row) => ({
      ...row,
      url: row.preview_url,
      nickname: db.children.find((child) => child.id === row.child_id)?.nickname ?? "Nickname hidden",
    }));
}

export function demoRewards() {
  const db = demoDb();
  return {
    codes: [...db.rewards].sort((a, b) => a.min_points - b.min_points),
    prizes: [...db.prizes].sort((a, b) => a.sort_order - b.sort_order),
  };
}

export function demoGrants(email: string) {
  const db = demoDb();
  const account = email ? db.accounts.find((item) => item.email.toLowerCase() === email) ?? null : null;
  return {
    packs: [...db.packs].sort((a, b) => a.title.localeCompare(b.title)),
    account,
    owned: account ? db.ownership.filter((row) => row.account_id === account.id) : [],
    events: [...db.events].reverse().slice(0, 12),
  };
}

export function demoAccount(persona: "sam" | "admin"): AccountRecord {
  const id = persona === "admin" ? "a1000000-0000-4000-8000-000000000002" : "a1000000-0000-4000-8000-000000000001";
  const account = demoDb().accounts.find((item) => item.id === id);
  if (!account) throw new Error("Demo family is missing.");
  return asAccount(account);
}

export function demoAccountFromCookie(persona: string | undefined): AccountRecord | null {
  if (!persona) return null;
  if (persona === "admin") return demoAccount("admin");
  if (persona === "sam") return demoAccount("sam");
  const account = demoDb().accounts.find((item) => item.id === persona);
  return account ? asAccount(account) : null;
}
