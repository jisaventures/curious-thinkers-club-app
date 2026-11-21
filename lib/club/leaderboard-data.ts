import "server-only";
import { requireAdult } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { demoDb } from "@/lib/demo/store";
import type { CoverTone, AvatarKey } from "@/lib/validators";
import type { ClubPack } from "@/lib/club/data";

export type LeaderboardPerson = {
  id: string;
  nickname: string;
  firstName: string | null;
  region: string;
  isMine: boolean;
  ageYears: number;
  createdAt: string | null;
  gender: "boy" | "girl" | "unspecified" | null;
  avatarKey: AvatarKey;
  avatarOptions: string | null;
  avatarBg: string | null;
  avatarFace: string | null;
  avatarHairStyle: string | null;
  avatarHairColour: string | null;
  avatarGlasses: boolean | null;
  avatarHat: string | null;
  avatarSkin: string | null;
  avatarEyes: string | null;
  avatarShirt: string | null;
  events: { at: string; amount: number }[];
  doneByPack: Record<string, number>;
};

export type LeaderboardData = {
  people: LeaderboardPerson[];
  packs: ClubPack[];
};

export async function loadLeaderboard(): Promise<LeaderboardData> {
  const { account } = await requireAdult();
  if (isDemoMode()) return demoLeaderboard(account.id);
  return supabaseLeaderboard(account.id);
}

function demoLeaderboard(accountId: string): LeaderboardData {
  const db = demoDb();
  const regions = new Map(db.accounts.map((item) => [item.id, item.region || "Europe"]));
  const people = db.children.map((child) => {
    const doneByPack: Record<string, number> = {};
    for (const pack of db.packs) {
      const steps = db.steps.filter((step) => step.pack_id === pack.id);
      doneByPack[pack.id] = steps.filter((step) => db.progress.some((row) => row.child_id === child.id && row.step_id === step.id && row.status === "complete")).length;
    }
    return {
      id: child.id,
      nickname: child.nickname,
      firstName: child.first_name ?? null,
      region: regions.get(child.account_id) || "Europe",
      isMine: child.account_id === accountId,
      ageYears: child.age_years,
      createdAt: child.created_at,
      gender: child.gender ?? null,
      avatarKey: child.avatar_key,
      avatarOptions: child.avatar_options ?? null,
      avatarBg: child.avatar_bg ?? null,
      avatarFace: child.avatar_face ?? null,
      avatarHairStyle: child.avatar_hair_style ?? null,
      avatarHairColour: child.avatar_hair_colour ?? null,
      avatarGlasses: child.avatar_glasses ?? null,
      avatarHat: child.avatar_hat ?? null,
      avatarSkin: child.avatar_skin ?? null,
      avatarEyes: child.avatar_eyes ?? null,
      avatarShirt: child.avatar_shirt ?? null,
      events: db.ledger
        .filter((row) => row.child_id === child.id)
        .map((row) => ({ at: row.created_at || child.created_at, amount: row.amount })),
      doneByPack,
    } satisfies LeaderboardPerson;
  });
  const packs = db.packs.map((pack) => packCard(pack));
  return { people, packs };
}

async function supabaseLeaderboard(accountId: string): Promise<LeaderboardData> {
  const { supabase } = await requireAdult();
  const packsRes = await supabase.from("packs").select("*").eq("published", true);
  const packs = ((packsRes.data ?? []) as Array<Record<string, unknown>>).map((pack) =>
    packCard({
      id: String(pack.id),
      slug: String(pack.slug),
      title: String(pack.title),
      theme: String(pack.theme ?? ""),
      blurb: String(pack.blurb ?? ""),
      duration_label: String(pack.duration_label ?? ""),
      cover_tone: (pack.cover_tone as CoverTone) || "bottle",
      price_pence: Number(pack.price_pence ?? 0),
      step_count: Number(pack.step_count ?? 0),
      certificate_bonus_points: Number(pack.certificate_bonus_points ?? 0),
    }),
  );
  const roster = await supabase.rpc("leaderboard_roster");
  if (!roster.error && Array.isArray(roster.data)) {
    return { people: (roster.data as RawPerson[]).map(fromRaw), packs };
  }
  const [childrenRes, ledgerRes, progressRes] = await Promise.all([
    supabase.from("children").select("id, nickname, first_name, avatar_key, age_years, gender, avatar_options, avatar_bg, avatar_face, avatar_hair_style, avatar_hair_colour, avatar_glasses, avatar_hat, avatar_skin, avatar_eyes, avatar_shirt, created_at").eq("account_id", accountId),
    supabase.from("points_ledger").select("child_id, amount, created_at").eq("account_id", accountId),
    supabase.from("step_progress").select("child_id, step_id, status").eq("status", "complete"),
  ]);
  const stepsRes = await supabase.from("steps").select("id, pack_id");
  const stepPack = new Map(((stepsRes.data ?? []) as Array<{ id: string; pack_id: string }>).map((step) => [step.id, step.pack_id]));
  const children = (childrenRes.data ?? []) as Array<Record<string, unknown>>;
  const ledger = (ledgerRes.data ?? []) as Array<{ child_id: string; amount: number; created_at: string }>;
  const progress = (progressRes.data ?? []) as Array<{ child_id: string; step_id: string }>;
  const people = children.map((child) => {
    const id = String(child.id);
    const doneByPack: Record<string, number> = {};
    for (const row of progress.filter((item) => item.child_id === id)) {
      const packId = stepPack.get(row.step_id);
      if (!packId) continue;
      doneByPack[packId] = (doneByPack[packId] ?? 0) + 1;
    }
    return {
      id,
      nickname: String(child.nickname),
      firstName: child.first_name ? String(child.first_name) : null,
      region: "Europe",
      isMine: true,
      ageYears: Number(child.age_years ?? 0),
      createdAt: child.created_at ? String(child.created_at) : null,
      gender: (child.gender as LeaderboardPerson["gender"]) ?? null,
      avatarKey: String(child.avatar_key) as AvatarKey,
      avatarOptions: child.avatar_options ? String(child.avatar_options) : null,
      avatarBg: child.avatar_bg ? String(child.avatar_bg) : null,
      avatarFace: child.avatar_face ? String(child.avatar_face) : null,
      avatarHairStyle: child.avatar_hair_style ? String(child.avatar_hair_style) : null,
      avatarHairColour: child.avatar_hair_colour ? String(child.avatar_hair_colour) : null,
      avatarGlasses: Boolean(child.avatar_glasses),
      avatarHat: child.avatar_hat ? String(child.avatar_hat) : null,
      avatarSkin: child.avatar_skin ? String(child.avatar_skin) : null,
      avatarEyes: child.avatar_eyes ? String(child.avatar_eyes) : null,
      avatarShirt: child.avatar_shirt ? String(child.avatar_shirt) : null,
      events: ledger.filter((row) => row.child_id === id).map((row) => ({ at: row.created_at, amount: row.amount })),
      doneByPack,
    } satisfies LeaderboardPerson;
  });
  return { people, packs };
}

type RawPerson = {
  id: string;
  nickname: string;
  first_name: string | null;
  region: string;
  is_mine: boolean;
  age_years: number;
  created_at: string | null;
  gender: LeaderboardPerson["gender"];
  avatar_key: AvatarKey;
  avatar_options: string | null;
  avatar_bg: string | null;
  avatar_face: string | null;
  avatar_hair_style: string | null;
  avatar_hair_colour: string | null;
  avatar_glasses: boolean | null;
  avatar_hat: string | null;
  avatar_skin: string | null;
  avatar_eyes: string | null;
  avatar_shirt: string | null;
  events: { at: string; amount: number }[] | null;
  done_by_pack: Record<string, number> | null;
};

function fromRaw(row: RawPerson): LeaderboardPerson {
  return {
    id: row.id,
    nickname: row.nickname,
    firstName: row.first_name,
    region: row.region || "Europe",
    isMine: row.is_mine,
    ageYears: row.age_years,
    createdAt: row.created_at,
    gender: row.gender,
    avatarKey: row.avatar_key,
    avatarOptions: row.avatar_options,
    avatarBg: row.avatar_bg,
    avatarFace: row.avatar_face,
    avatarHairStyle: row.avatar_hair_style,
    avatarHairColour: row.avatar_hair_colour,
    avatarGlasses: row.avatar_glasses,
    avatarHat: row.avatar_hat,
    avatarSkin: row.avatar_skin,
    avatarEyes: row.avatar_eyes,
    avatarShirt: row.avatar_shirt,
    events: row.events ?? [],
    doneByPack: row.done_by_pack ?? {},
  };
}

function packCard(pack: {
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
}): ClubPack {
  return {
    ...pack,
    owned: true,
    done: 0,
    total: pack.step_count,
    stepPoints: [],
  };
}
