import { nextStepPosition } from "@/lib/progress";
import type { AvatarKey, CoverTone } from "@/lib/validators";

export const SAM_ID = "a1000000-0000-4000-8000-000000000001";
export const ADMIN_ID = "a1000000-0000-4000-8000-000000000002";
export const PIP_ID = "c1000000-0000-4000-8000-000000000001";
export const LOU_ID = "c1000000-0000-4000-8000-000000000002";
export const MO_ID = "c1000000-0000-4000-8000-000000000003";
export const PIRATE_ID = "b1000000-0000-4000-8000-000000000001";

export type DemoAccount = {
  id: string;
  display_name: string;
  email: string;
  is_adult_confirmed: boolean;
  role: "member" | "admin";
  shopify_customer_id: string | null;
};

export type DemoChild = {
  id: string;
  account_id: string;
  nickname: string;
  avatar_key: AvatarKey;
  age_years: number;
  created_at: string;
  first_name?: string;
  gender?: "boy" | "girl" | "other";
  avatar_bg?: string;
  avatar_face?: string;
  avatar_hair_style?: string;
  avatar_hair_colour?: string;
  avatar_glasses?: boolean;
  avatar_hat?: string;
};

export type DemoPack = {
  id: string;
  slug: string;
  title: string;
  theme: string;
  age_min: number;
  age_max: number;
  duration_minutes: number;
  duration_label: string;
  blurb: string;
  cover_tone: CoverTone;
  shopify_product_id: string | null;
  price_pence: number;
  certificate_bonus_points: number;
  step_count: number;
  published: boolean;
  created_at: string;
};

export type DemoStep = {
  id: string;
  pack_id: string;
  position: number;
  title: string;
  description: string;
  video_url: string | null;
  video_provider: string;
  printable_ref: string | null;
  estimated_minutes: number;
  points: number;
};

export type DemoProgress = {
  child_id: string;
  step_id: string;
  status: "in_progress" | "complete";
  video_position_seconds: number;
  points_awarded: number;
};

export type DemoLedger = {
  child_id: string;
  account_id: string;
  amount: number;
  reason: "step_complete" | "pack_certificate" | "submission_featured" | "opening_balance";
  ref_id: string;
};

export type DemoSubmission = {
  id: string;
  account_id: string;
  child_id: string;
  pack_id: string | null;
  storage_path: string;
  preview_url: string;
  consent_social: boolean;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type DemoReward = {
  id: string;
  code: string;
  headline: string;
  description: string;
  min_points: number;
  active: boolean;
};

export type DemoPrize = { id: string; title: string; detail: string; sort_order: number };

export type DemoOwnership = {
  account_id: string;
  pack_id: string;
  source: "seed" | "admin_grant" | "shopify_webhook";
  granted_at: string;
};

export type DemoEvent = {
  id: string;
  email: string | null;
  shopify_customer_id: string | null;
  product_ids: string[];
  status: "granted" | "unmatched" | "no_products";
  detail: string | null;
  created_at: string;
};

export type DemoDb = {
  accounts: DemoAccount[];
  children: DemoChild[];
  packs: DemoPack[];
  steps: DemoStep[];
  progress: DemoProgress[];
  ledger: DemoLedger[];
  submissions: DemoSubmission[];
  rewards: DemoReward[];
  prizes: DemoPrize[];
  ownership: DemoOwnership[];
  events: DemoEvent[];
  certificates: Array<{ child_id: string; pack_id: string }>;
};

const SAMPLE_WORK =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420"><rect width="100%" height="100%" fill="#fff6e4"/><text x="36" y="200" font-family="Georgia" font-size="32" fill="#1e4d3a">Pip's treasure map — no faces</text></svg>`,
  );

function step(
  packId: string,
  prefix: string,
  position: number,
  title: string,
  description: string,
  printable: string,
): DemoStep {
  return {
    id: `${prefix}${String(position).padStart(3, "0")}`,
    pack_id: packId,
    position,
    title,
    description,
    video_url: "/videos/guide.mp4",
    video_provider: "mp4",
    printable_ref: printable,
    estimated_minutes: 15,
    points: 10,
  };
}

function pack(
  id: string,
  slug: string,
  title: string,
  theme: string,
  blurb: string,
  cover: CoverTone,
  product: string,
  ageMin: number,
  ageMax: number,
): DemoPack {
  return {
    id,
    slug,
    title,
    theme,
    age_min: ageMin,
    age_max: ageMax,
    duration_minutes: 120,
    duration_label: "About 2 hours",
    blurb,
    cover_tone: cover,
    shopify_product_id: product,
    price_pence: 899,
    certificate_bonus_points: 50,
    step_count: 8,
    published: true,
    created_at: new Date().toISOString(),
  };
}

export function createSeed(): DemoDb {
  const pirate = PIRATE_ID;
  const egypt = "b1000000-0000-4000-8000-000000000002";
  const spy = "b1000000-0000-4000-8000-000000000003";
  const knight = "b1000000-0000-4000-8000-000000000004";
  const space = "b1000000-0000-4000-8000-000000000005";

  const pirateSteps = [
    step(pirate, "51100000-0000-4000-8000-000000000", 1, "Meet a real pirate", "Say hello to a real pirate from history and notice what they actually did.", "Print page 1 — Meet a real pirate"),
    step(pirate, "51100000-0000-4000-8000-000000000", 2, "Flags and ships", "Spot the flags and the parts of a ship a crew would know.", "Print page 2 — Flags and ships"),
    step(pirate, "51100000-0000-4000-8000-000000000", 3, "Read a treasure map", "Follow the dotted line on the map and mark the landing spot.", "Print page 4 — Follow the dotted line"),
    step(pirate, "51100000-0000-4000-8000-000000000", 4, "Make a pirate code", "Write three fair rules a crew could keep.", "Print page 5 — A fair pirate code"),
    step(pirate, "51100000-0000-4000-8000-000000000", 5, "Chart your course", "Find a course with a crayon, then follow the compass points from the video.", "Print page 6 — The treasure map"),
    step(pirate, "51100000-0000-4000-8000-000000000", 6, "Life on board", "Find out what people ate, where they slept, and how they passed the time.", "Print page 7 — Life on board"),
    step(pirate, "51100000-0000-4000-8000-000000000", 7, "Famous pirates", "Meet two real pirates and one story that grew taller than the truth.", "Print page 8 — Famous pirates"),
    step(pirate, "51100000-0000-4000-8000-000000000", 8, "Your pirate oath", "Make a promise about being brave and kind on the crew.", "Print page 9 — Your pirate oath"),
  ];

  const other = (
    packId: string,
    prefix: string,
    titles: Array<[string, string, string]>,
  ) => titles.map(([title, description, printable], index) => step(packId, prefix, index + 1, title, description, printable));

  const steps = [
    ...pirateSteps,
    ...other(egypt, "51200000-0000-4000-8000-000000000", [
      ["Meet the Nile", "Find the river that made life in Egypt possible.", "Print page 1 — The Nile"],
      ["Homes and families", "Look at how families lived beside the river.", "Print page 2 — Homes"],
      ["Write in pictures", "Try a few real hieroglyphs.", "Print page 3 — Pictures"],
      ["Pyramids up close", "See how a pyramid was planned.", "Print page 4 — Pyramids"],
      ["A day in the palace", "Follow a morning in a busy household.", "Print page 5 — Palace"],
      ["Boats and trade", "Pack a boat with things Egypt really traded.", "Print page 6 — Boats"],
      ["Famous finds", "Meet objects archaeologists still study.", "Print page 7 — Finds"],
      ["Your explorer badge", "Record one true thing you want to remember.", "Print page 8 — Badge"],
    ]),
    ...other(spy, "51300000-0000-4000-8000-000000000", [
      ["What spies noticed", "Practise looking carefully.", "Print page 1 — Noticing"],
      ["Keep a secret", "Agree a family signal that means talk later.", "Print page 2 — Signals"],
      ["Simple codes", "Swap letters and read a short friendly note.", "Print page 3 — Codes"],
      ["Lemon juice notes", "Write a note that appears when an adult warms the paper.", "Print page 4 — Invisible ink"],
      ["Spot the pattern", "Find the pattern hiding in a grid of shapes.", "Print page 5 — Patterns"],
      ["A careful disguise", "Design a hat and a notebook cover.", "Print page 6 — Disguise"],
      ["Famous codebreakers", "Meet people who solved puzzles to help others.", "Print page 7 — Codebreakers"],
      ["Your spy promise", "Promise to use codes for kindness.", "Print page 8 — Promise"],
    ]),
    ...other(knight, "51400000-0000-4000-8000-000000000", [
      ["A real castle", "Walk the parts of a castle.", "Print page 1 — Castle"],
      ["Who lived there", "Meet the people who cooked and guarded.", "Print page 2 — People"],
      ["Armour and shields", "See what armour could and could not do.", "Print page 3 — Armour"],
      ["Banners and colours", "Design colours a household would recognise.", "Print page 4 — Banners"],
      ["A feast day", "Plan a menu from foods they really had.", "Print page 5 — Feast"],
      ["Horses and heralds", "Follow a message from the gate to the hall.", "Print page 6 — Heralds"],
      ["True knight stories", "Sort the legend from the history.", "Print page 7 — Stories"],
      ["Your coat of arms", "Draw symbols for your own household.", "Print page 8 — Arms"],
    ]),
    ...other(space, "51500000-0000-4000-8000-000000000", [
      ["Our night sky", "Find the moon from a window or garden.", "Print page 1 — Night sky"],
      ["The Moon", "See why the Moon looks different through the month.", "Print page 2 — Moon"],
      ["The rocky planets", "Line up the small rocky worlds.", "Print page 3 — Rocky planets"],
      ["Gas giants", "Compare the huge planets with Earth.", "Print page 4 — Giants"],
      ["The Sun", "Learn why we never look straight at it.", "Print page 5 — Sun"],
      ["Rockets", "Fold a paper rocket and talk about real launches.", "Print page 6 — Rockets"],
      ["People in space", "Meet a few of the people who have left Earth.", "Print page 7 — People"],
      ["Your space log", "Draw one thing you want to look for next.", "Print page 8 — Log"],
    ]),
  ];

  const complete = (childId: string, stepId: string): DemoProgress => ({
    child_id: childId,
    step_id: stepId,
    status: "complete",
    video_position_seconds: 0,
    points_awarded: 10,
  });

  const progress: DemoProgress[] = [];
  for (let n = 1; n <= 4; n += 1) progress.push(complete(PIP_ID, pirateSteps[n - 1].id));
  progress.push({
    child_id: PIP_ID,
    step_id: pirateSteps[4].id,
    status: "in_progress",
    video_position_seconds: 0,
    points_awarded: 0,
  });
  for (let n = 1; n <= 2; n += 1) progress.push(complete(PIP_ID, `51200000-0000-4000-8000-000000000${String(n).padStart(3, "0")}`));
  for (let n = 1; n <= 5; n += 1) progress.push(complete(PIP_ID, `51300000-0000-4000-8000-000000000${String(n).padStart(3, "0")}`));
  progress.push(complete(LOU_ID, pirateSteps[0].id));
  progress.push({
    child_id: LOU_ID,
    step_id: pirateSteps[1].id,
    status: "in_progress",
    video_position_seconds: 134,
    points_awarded: 0,
  });

  const ledger: DemoLedger[] = [
    ...progress
      .filter((row) => row.status === "complete")
      .map((row) => ({
        child_id: row.child_id,
        account_id: SAM_ID,
        amount: 10,
        reason: "step_complete" as const,
        ref_id: row.step_id,
      })),
    { child_id: PIP_ID, account_id: SAM_ID, amount: 230, reason: "opening_balance", ref_id: PIP_ID },
    { child_id: MO_ID, account_id: SAM_ID, amount: 210, reason: "opening_balance", ref_id: MO_ID },
    { child_id: "c1000000-0000-4000-8000-000000000004", account_id: "a1000000-0000-4000-8000-000000000003", amount: 512, reason: "opening_balance", ref_id: "c1000000-0000-4000-8000-000000000004" },
    { child_id: "c1000000-0000-4000-8000-000000000005", account_id: "a1000000-0000-4000-8000-000000000004", amount: 480, reason: "opening_balance", ref_id: "c1000000-0000-4000-8000-000000000005" },
    { child_id: "c1000000-0000-4000-8000-000000000006", account_id: "a1000000-0000-4000-8000-000000000005", amount: 175, reason: "opening_balance", ref_id: "c1000000-0000-4000-8000-000000000006" },
  ];

  return {
    accounts: [
      { id: SAM_ID, display_name: "Sam", email: "sam@demo.curiousthinkersclub.test", is_adult_confirmed: true, role: "member", shopify_customer_id: null },
      { id: ADMIN_ID, display_name: "Ada", email: "admin@demo.curiousthinkersclub.test", is_adult_confirmed: true, role: "admin", shopify_customer_id: null },
      { id: "a1000000-0000-4000-8000-000000000003", display_name: "Star", email: "star@demo.curiousthinkersclub.test", is_adult_confirmed: true, role: "member", shopify_customer_id: null },
      { id: "a1000000-0000-4000-8000-000000000004", display_name: "Dex", email: "dex@demo.curiousthinkersclub.test", is_adult_confirmed: true, role: "member", shopify_customer_id: null },
      { id: "a1000000-0000-4000-8000-000000000005", display_name: "Bea", email: "bea@demo.curiousthinkersclub.test", is_adult_confirmed: true, role: "member", shopify_customer_id: null },
    ],
    children: [
      { id: PIP_ID, account_id: SAM_ID, nickname: "Pirate Pip", avatar_key: "pirate", age_years: 7, created_at: "2026-11-17T00:00:00.000Z" },
      { id: LOU_ID, account_id: SAM_ID, nickname: "Captain Lou", avatar_key: "captain", age_years: 4, created_at: "2026-11-18T00:00:00.000Z" },
      { id: MO_ID, account_id: SAM_ID, nickname: "Magpie Mo", avatar_key: "magpie", age_years: 5, created_at: "2026-11-19T00:00:00.000Z" },
      { id: "c1000000-0000-4000-8000-000000000004", account_id: "a1000000-0000-4000-8000-000000000003", nickname: "Star Scout", avatar_key: "star", age_years: 8, created_at: "2026-11-10T00:00:00.000Z" },
      { id: "c1000000-0000-4000-8000-000000000005", account_id: "a1000000-0000-4000-8000-000000000004", nickname: "Dino Dex", avatar_key: "dino", age_years: 6, created_at: "2026-11-11T00:00:00.000Z" },
      { id: "c1000000-0000-4000-8000-000000000006", account_id: "a1000000-0000-4000-8000-000000000005", nickname: "Cosmic Bea", avatar_key: "astronaut", age_years: 5, created_at: "2026-11-12T00:00:00.000Z" },
    ],
    packs: [
      pack(pirate, "be-a-pirate-for-the-day", "Be a pirate for the day", "history", "Learn about real pirates, maps and ships", "bottle", "900000000001", 4, 8),
      pack(egypt, "be-an-egyptian-explorer", "Be an Egyptian explorer", "history", "Hieroglyphs, pyramids and real ancient Egypt", "palm", "900000000002", 6, 10),
      pack(spy, "become-a-spy", "Become a spy", "codes", "Learn about real spies, codes and secret messages", "navy", "900000000003", 7, 10),
      pack(knight, "be-a-knight-for-the-day", "Be a knight for the day", "castles", "Castles, armour and real medieval life", "plum", "900000000004", 5, 9),
      pack(space, "be-a-space-explorer", "Be a space explorer", "space", "Planets, rockets and the real night sky", "sea", "900000000005", 6, 10),
    ],
    steps,
    progress,
    ledger,
    submissions: [
      {
        id: "d1000000-0000-4000-8000-000000000001",
        account_id: SAM_ID,
        child_id: PIP_ID,
        pack_id: pirate,
        storage_path: "demo/pip-map.svg",
        preview_url: SAMPLE_WORK,
        consent_social: true,
        status: "pending",
        created_at: new Date().toISOString(),
      },
    ],
    rewards: [
      { id: "r1", code: "CURIOUS15", headline: "You've unlocked 15% off your next pack", description: "A little thank you for being a Curious Explorer this month.", min_points: 300, active: true },
      { id: "r2", code: "EXPLORER10", headline: "You've unlocked 10% off your next pack", description: "A small thank you while you climb towards the next level.", min_points: 150, active: true },
    ],
    prizes: [
      { id: "z1", title: "Any pack of their choice", detail: "Printed and posted to you", sort_order: 1 },
      { id: "z2", title: "50% off a pack", detail: "A code in the shop", sort_order: 2 },
      { id: "z3", title: "Certificate + stickers", detail: "Posted to your door", sort_order: 3 },
    ],
    ownership: [
      { account_id: SAM_ID, pack_id: pirate, source: "seed", granted_at: new Date().toISOString() },
      { account_id: SAM_ID, pack_id: egypt, source: "seed", granted_at: new Date().toISOString() },
      { account_id: SAM_ID, pack_id: spy, source: "seed", granted_at: new Date().toISOString() },
    ],
    events: [],
    certificates: [],
  };
}

type GlobalDemo = typeof globalThis & { __ctcDemo?: DemoDb };

export function demoDb() {
  const g = globalThis as GlobalDemo;
  if (!g.__ctcDemo) g.__ctcDemo = createSeed();
  return g.__ctcDemo;
}

export function resetDemoDb() {
  (globalThis as GlobalDemo).__ctcDemo = createSeed();
}

export function accountById(id: string) {
  return demoDb().accounts.find((account) => account.id === id) ?? null;
}

export function accountByEmail(email: string) {
  const needle = email.trim().toLowerCase();
  return demoDb().accounts.find((account) => account.email.toLowerCase() === needle) ?? null;
}

export function pointsFor(childId: string) {
  return demoDb()
    .ledger.filter((row) => row.child_id === childId)
    .reduce((sum, row) => sum + row.amount, 0);
}

export function childNextPosition(childId: string, packId: string) {
  const db = demoDb();
  const steps = db.steps.filter((step) => step.pack_id === packId);
  const complete = db.progress
    .filter((row) => row.child_id === childId && row.status === "complete" && steps.some((step) => step.id === row.step_id))
    .map((row) => steps.find((step) => step.id === row.step_id)?.position)
    .filter((position): position is number => typeof position === "number");
  return nextStepPosition(steps.map((step) => step.position), complete);
}

export function markDemoSteps(accountId: string, stepId: string, childIds: string[]) {
  const db = demoDb();
  const stepRow = db.steps.find((item) => item.id === stepId);
  if (!stepRow) return { ok: false as const, message: "That step is not available." };
  if (!db.ownership.some((row) => row.account_id === accountId && row.pack_id === stepRow.pack_id)) {
    return { ok: false as const, message: "This pack is not unlocked for your club." };
  }
  const packSteps = db.steps.filter((item) => item.pack_id === stepRow.pack_id);
  const last = Math.max(...packSteps.map((item) => item.position));
  const eligible = childIds
    .map((id) => db.children.find((child) => child.id === id && child.account_id === accountId))
    .filter((child): child is DemoChild => Boolean(child))
    .filter((child) => childNextPosition(child.id, stepRow.pack_id) === stepRow.position);

  if (eligible.length === 0) {
    return { ok: false as const, message: "Only children who are on this step can be ticked." };
  }

  let certificate = false;
  for (const child of eligible) {
    const existing = db.progress.find((row) => row.child_id === child.id && row.step_id === stepRow.id);
    if (existing?.status === "complete") continue;
    if (existing) {
      existing.status = "complete";
      existing.points_awarded = stepRow.points;
    } else {
      db.progress.push({
        child_id: child.id,
        step_id: stepRow.id,
        status: "complete",
        video_position_seconds: 0,
        points_awarded: stepRow.points,
      });
    }
    if (!db.ledger.some((row) => row.child_id === child.id && row.reason === "step_complete" && row.ref_id === stepRow.id)) {
      db.ledger.push({
        child_id: child.id,
        account_id: accountId,
        amount: stepRow.points,
        reason: "step_complete",
        ref_id: stepRow.id,
      });
    }
    if (stepRow.position === last && !db.certificates.some((row) => row.child_id === child.id && row.pack_id === stepRow.pack_id)) {
      db.certificates.push({ child_id: child.id, pack_id: stepRow.pack_id });
      const bonus = db.packs.find((item) => item.id === stepRow.pack_id)?.certificate_bonus_points ?? 50;
      if (bonus > 0) {
        db.ledger.push({
          child_id: child.id,
          account_id: accountId,
          amount: bonus,
          reason: "pack_certificate",
          ref_id: stepRow.pack_id,
        });
      }
      certificate = true;
    }
  }

  return {
    ok: true as const,
    names: eligible.map((child) => child.nickname),
    points: stepRow.points,
    certificate,
    packId: stepRow.pack_id,
  };
}

export function nicknameTaken(nickname: string) {
  const folded = nickname.trim().toLowerCase();
  return demoDb().children.some((child) => child.nickname.toLowerCase() === folded);
}

export function createDemoFamily(input: {
  parentName: string;
  children: Array<{
    firstName: string;
    nickname: string;
    ageYears: number;
    gender: "boy" | "girl" | "other";
    avatarBg: string;
    avatarFace: string;
    hairStyle: string;
    hairColour: string;
    glasses: boolean;
    hat: string;
  }>;
}) {
  const db = demoDb();
  const accountId = crypto.randomUUID();
  db.accounts.push({
    id: accountId,
    display_name: input.parentName,
    email: `family-${accountId.slice(0, 8)}@demo.curiousthinkersclub.test`,
    is_adult_confirmed: true,
    role: "member",
    shopify_customer_id: null,
  });
  const childIds = input.children.map((child) => {
    const id = crypto.randomUUID();
    db.children.push({
      id,
      account_id: accountId,
      nickname: child.nickname,
      avatar_key: "star",
      age_years: child.ageYears,
      created_at: new Date().toISOString(),
      first_name: child.firstName,
      gender: child.gender,
      avatar_bg: child.avatarBg,
      avatar_face: child.avatarFace,
      avatar_hair_style: child.hairStyle,
      avatar_hair_colour: child.hairColour,
      avatar_glasses: child.glasses,
      avatar_hat: child.hat,
    });
    return id;
  });
  return { accountId, focusId: childIds[0] ?? null };
}

export function saveDemoVideo(accountId: string, stepId: string, childIds: string[], seconds: number) {
  const db = demoDb();
  const stepRow = db.steps.find((item) => item.id === stepId);
  if (!stepRow) return;
  for (const id of childIds) {
    const child = db.children.find((item) => item.id === id && item.account_id === accountId);
    if (!child || childNextPosition(child.id, stepRow.pack_id) !== stepRow.position) continue;
    const existing = db.progress.find((row) => row.child_id === id && row.step_id === stepId);
    if (existing?.status === "complete") continue;
    if (existing) existing.video_position_seconds = seconds;
    else {
      db.progress.push({
        child_id: id,
        step_id: stepId,
        status: "in_progress",
        video_position_seconds: seconds,
        points_awarded: 0,
      });
    }
  }
}
