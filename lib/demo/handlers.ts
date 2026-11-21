import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { poundsToPence } from "@/lib/format";
import { childInputSchema, detectVideoProvider, emailSchema, packSchema, rewardSchema, slugify, stepSchema, uuidSchema } from "@/lib/validators";
import { nextStepPosition } from "@/lib/progress";
import { accountByEmail, demoDb, markDemoSteps, saveDemoVideo } from "@/lib/demo/store";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function demoUpdateGroupProfile(
  accountId: string,
  groupName: string,
  leaderName: string,
  icon: { icon: string; background: string; colour: string },
) {
  const account = demoDb().accounts.find((item) => item.id === accountId);
  if (!account) return { error: "Unknown account." };
  account.group_name = groupName;
  account.display_name = leaderName;
  account.group_icon = icon.icon;
  account.group_bg = icon.background;
  account.group_icon_colour = icon.colour;
  revalidatePath("/club");
  revalidatePath("/club/group");
  return { ok: true as const, groupName, leaderName, icon };
}

export async function demoAddChild(accountId: string, formData: FormData) {
  const parsed = childInputSchema.safeParse({
    nickname: text(formData, "nickname"),
    ageYears: text(formData, "ageYears"),
    avatarKey: text(formData, "avatarKey") || "explorer",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the child details." };
  const db = demoDb();
  if (db.children.filter((child) => child.account_id === accountId).length >= 5) {
    return { error: "This account already has 5 children." };
  }
  db.children.push({
    id: crypto.randomUUID(),
    account_id: accountId,
    nickname: parsed.data.nickname,
    avatar_key: parsed.data.avatarKey,
    age_years: parsed.data.ageYears,
    created_at: new Date().toISOString(),
  });
  revalidatePath("/club");
  return { ok: true as const };
}

export async function demoUpdateChild(accountId: string, formData: FormData) {
  const id = uuidSchema.safeParse(text(formData, "childId"));
  const parsed = childInputSchema.safeParse({
    nickname: text(formData, "nickname"),
    ageYears: text(formData, "ageYears"),
    avatarKey: text(formData, "avatarKey"),
  });
  if (!id.success || !parsed.success) {
    return { error: parsed.success ? "Unknown child." : parsed.error.issues[0]?.message ?? "Check the details." };
  }
  const child = demoDb().children.find((item) => item.id === id.data && item.account_id === accountId);
  if (!child) return { error: "Unknown child." };
  child.nickname = parsed.data.nickname;
  child.age_years = parsed.data.ageYears;
  child.avatar_key = parsed.data.avatarKey;
  revalidatePath("/club");
  return { ok: true as const };
}

export async function demoDeleteChild(accountId: string, formData: FormData) {
  const id = uuidSchema.safeParse(text(formData, "childId"));
  if (!id.success) return { error: "Unknown child." };
  const db = demoDb();
  const index = db.children.findIndex((child) => child.id === id.data && child.account_id === accountId);
  if (index < 0) return { error: "Unknown child." };
  db.children.splice(index, 1);
  db.progress = db.progress.filter((row) => row.child_id !== id.data);
  revalidatePath("/club");
  return { ok: true as const };
}

export async function demoOwnsChild(accountId: string, childId: string) {
  return demoDb().children.some((child) => child.id === childId && child.account_id === accountId);
}

export async function demoMark(accountId: string, input: { stepId: string; childIds: string[] }) {
  const parsed = z.object({ stepId: uuidSchema, childIds: z.array(uuidSchema).min(1).max(5) }).safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Choose who finished this step." };
  const result = markDemoSteps(accountId, parsed.data.stepId, parsed.data.childIds);
  revalidatePath("/club");
  return result;
}

export async function demoMarkNextResult(accountId: string, packId: string, childId: string) {
  const db = demoDb();
  const steps = db.steps.filter((step) => step.pack_id === packId).sort((a, b) => a.position - b.position);
  const complete = db.progress
    .filter((row) => row.child_id === childId && row.status === "complete")
    .map((row) => steps.find((step) => step.id === row.step_id)?.position)
    .filter((position): position is number => typeof position === "number");
  const next = nextStepPosition(steps.map((step) => step.position), complete);
  const step = steps.find((item) => item.position === next);
  if (!step) return { ok: false as const, message: "This pack is already finished." };
  const result = markDemoSteps(accountId, step.id, [childId]);
  revalidatePath("/club");
  if (!result.ok) return result;
  return {
    ...result,
    message: result.certificate ? "Pack finished. Certificate and bonus points added." : "Step marked complete",
  };
}

export async function demoMarkNext(accountId: string, formData: FormData) {
  const packId = uuidSchema.safeParse(text(formData, "packId"));
  const childId = uuidSchema.safeParse(text(formData, "childId"));
  if (!packId.success || !childId.success) redirect("/club");
  const result = await demoMarkNextResult(accountId, packId.data, childId.data);
  const notice = result.ok ? encodeURIComponent(result.message) : encodeURIComponent(result.message);
  redirect(`/club?notice=${notice}`);
}

export async function demoSaveVideo(accountId: string, input: { stepId: string; childIds: string[]; seconds: number }) {
  const parsed = z
    .object({ stepId: uuidSchema, childIds: z.array(uuidSchema).min(1).max(5), seconds: z.number().min(0).max(21600) })
    .safeParse(input);
  if (!parsed.success) return;
  saveDemoVideo(accountId, parsed.data.stepId, parsed.data.childIds, Math.floor(parsed.data.seconds));
}

export async function demoWithdraw(accountId: string, formData: FormData) {
  const id = uuidSchema.safeParse(text(formData, "submissionId"));
  if (!id.success) return { error: "Unknown upload." };
  const db = demoDb();
  const index = db.submissions.findIndex((row) => row.id === id.data && row.account_id === accountId && row.status === "pending");
  if (index < 0) return { error: "That upload can no longer be removed." };
  db.submissions.splice(index, 1);
  revalidatePath("/club");
  return { ok: true as const, userId: accountId };
}

export async function demoAddSubmission(input: {
  accountId: string;
  childId: string;
  packId: string | null;
  previewUrl: string;
}) {
  const db = demoDb();
  const pending = db.submissions.filter((row) => row.account_id === input.accountId && row.status === "pending").length;
  if (pending >= 8) return { error: "You already have 8 photos waiting for approval." };
  db.submissions.unshift({
    id: crypto.randomUUID(),
    account_id: input.accountId,
    child_id: input.childId,
    pack_id: input.packId,
    storage_path: `demo/${crypto.randomUUID()}`,
    preview_url: input.previewUrl,
    consent_social: true,
    status: "pending",
    created_at: new Date().toISOString(),
  });
  return { ok: true as const };
}

function readPack(formData: FormData) {
  const price = poundsToPence(text(formData, "price"));
  if (price === null) return { error: "Enter a price like 8.99" as const };
  const parsed = packSchema.safeParse({
    title: text(formData, "title"),
    slug: text(formData, "slug") || slugify(text(formData, "title")),
    theme: text(formData, "theme"),
    ageMin: text(formData, "ageMin"),
    ageMax: text(formData, "ageMax"),
    durationMinutes: text(formData, "durationMinutes"),
    durationLabel: text(formData, "durationLabel"),
    blurb: text(formData, "blurb"),
    coverTone: text(formData, "coverTone"),
    shopifyProductId: text(formData, "shopifyProductId"),
    pricePence: price,
    certificateBonusPoints: text(formData, "certificateBonusPoints") || "50",
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the pack" };
  return { data: parsed.data };
}

export async function demoCreatePack(formData: FormData) {
  const parsed = readPack(formData);
  if ("error" in parsed) fail("/admin/packs/new", parsed.error ?? "Check the pack");
  const id = crypto.randomUUID();
  demoDb().packs.push({
    id,
    slug: parsed.data.slug,
    title: parsed.data.title,
    theme: parsed.data.theme,
    age_min: parsed.data.ageMin,
    age_max: parsed.data.ageMax,
    duration_minutes: parsed.data.durationMinutes,
    duration_label: parsed.data.durationLabel,
    blurb: parsed.data.blurb,
    cover_tone: parsed.data.coverTone,
    shopify_product_id: parsed.data.shopifyProductId || null,
    price_pence: parsed.data.pricePence,
    certificate_bonus_points: parsed.data.certificateBonusPoints,
    step_count: 0,
    published: parsed.data.published,
    created_at: new Date().toISOString(),
  });
  redirect(`/admin/packs/${id}?saved=1`);
}

export async function demoUpdatePack(formData: FormData) {
  const id = text(formData, "packId");
  const parsed = readPack(formData);
  if ("error" in parsed) fail(`/admin/packs/${id}`, parsed.error ?? "Check the pack");
  const pack = demoDb().packs.find((item) => item.id === id);
  if (!pack) fail("/admin/packs", "Unknown pack");
  Object.assign(pack, {
    slug: parsed.data.slug,
    title: parsed.data.title,
    theme: parsed.data.theme,
    age_min: parsed.data.ageMin,
    age_max: parsed.data.ageMax,
    duration_minutes: parsed.data.durationMinutes,
    duration_label: parsed.data.durationLabel,
    blurb: parsed.data.blurb,
    cover_tone: parsed.data.coverTone,
    shopify_product_id: parsed.data.shopifyProductId || null,
    price_pence: parsed.data.pricePence,
    certificate_bonus_points: parsed.data.certificateBonusPoints,
    published: parsed.data.published,
  });
  redirect(`/admin/packs/${id}?saved=1`);
}

export async function demoDeletePack(formData: FormData) {
  const id = text(formData, "packId");
  const db = demoDb();
  db.packs = db.packs.filter((pack) => pack.id !== id);
  db.steps = db.steps.filter((step) => step.pack_id !== id);
  db.ownership = db.ownership.filter((row) => row.pack_id !== id);
  revalidatePath("/admin/packs");
  redirect("/admin/packs");
}

function readStep(formData: FormData) {
  return stepSchema.safeParse({
    title: text(formData, "title"),
    description: text(formData, "description"),
    videoUrl: text(formData, "videoUrl"),
    printableRef: text(formData, "printableRef"),
    estimatedMinutes: text(formData, "estimatedMinutes"),
    points: text(formData, "points"),
  });
}

export async function demoAddStep(formData: FormData) {
  const packId = text(formData, "packId");
  const parsed = readStep(formData);
  if (!parsed.success) fail(`/admin/packs/${packId}`, parsed.error.issues[0]?.message ?? "Check the step");
  const db = demoDb();
  const position = db.steps.filter((step) => step.pack_id === packId).reduce((max, step) => Math.max(max, step.position), 0) + 1;
  const file = formData.get("videoFile");
  const videoUrl = file instanceof File && file.size > 0 ? "/videos/guide.mp4" : parsed.data.videoUrl || "";
  db.steps.push({
    id: crypto.randomUUID(),
    pack_id: packId,
    position,
    title: parsed.data.title,
    description: parsed.data.description,
    video_url: videoUrl || null,
    video_provider: detectVideoProvider(videoUrl),
    printable_ref: parsed.data.printableRef || null,
    estimated_minutes: parsed.data.estimatedMinutes,
    points: parsed.data.points,
  });
  const pack = db.packs.find((item) => item.id === packId);
  if (pack) pack.step_count = db.steps.filter((step) => step.pack_id === packId).length;
  redirect(`/admin/packs/${packId}?saved=1`);
}

export async function demoUpdateStep(formData: FormData) {
  const packId = text(formData, "packId");
  const stepId = text(formData, "stepId");
  const parsed = readStep(formData);
  if (!parsed.success) fail(`/admin/packs/${packId}`, parsed.error.issues[0]?.message ?? "Check the step");
  const step = demoDb().steps.find((item) => item.id === stepId && item.pack_id === packId);
  if (!step) fail(`/admin/packs/${packId}`, "Unknown step");
  const file = formData.get("videoFile");
  const videoUrl = file instanceof File && file.size > 0 ? "/videos/guide.mp4" : parsed.data.videoUrl || "";
  Object.assign(step, {
    title: parsed.data.title,
    description: parsed.data.description,
    video_url: videoUrl || null,
    video_provider: detectVideoProvider(videoUrl),
    printable_ref: parsed.data.printableRef || null,
    estimated_minutes: parsed.data.estimatedMinutes,
    points: parsed.data.points,
  });
  redirect(`/admin/packs/${packId}?saved=1`);
}

export async function demoDeleteStep(formData: FormData) {
  const packId = text(formData, "packId");
  const stepId = text(formData, "stepId");
  const db = demoDb();
  db.steps = db.steps.filter((step) => !(step.id === stepId && step.pack_id === packId));
  db.steps
    .filter((step) => step.pack_id === packId)
    .sort((a, b) => a.position - b.position)
    .forEach((step, index) => {
      step.position = index + 1;
    });
  const pack = db.packs.find((item) => item.id === packId);
  if (pack) pack.step_count = db.steps.filter((step) => step.pack_id === packId).length;
  redirect(`/admin/packs/${packId}?saved=1`);
}

export async function demoMoveStep(formData: FormData) {
  const packId = text(formData, "packId");
  const stepId = text(formData, "stepId");
  const direction = text(formData, "direction") === "up" ? -1 : 1;
  const steps = demoDb().steps.filter((step) => step.pack_id === packId).sort((a, b) => a.position - b.position);
  const index = steps.findIndex((step) => step.id === stepId);
  const swap = index + direction;
  if (index < 0 || swap < 0 || swap >= steps.length) redirect(`/admin/packs/${packId}`);
  const current = steps[index].position;
  steps[index].position = steps[swap].position;
  steps[swap].position = current;
  redirect(`/admin/packs/${packId}?saved=1`);
}

export async function demoReview(formData: FormData) {
  const id = text(formData, "submissionId");
  const status = text(formData, "status") === "approved" ? "approved" : "rejected";
  const row = demoDb().submissions.find((item) => item.id === id);
  if (!row || row.status !== "pending") fail("/admin/submissions", "That upload has already been reviewed.");
  row.status = status;
  if (status === "approved" && !demoDb().ledger.some((item) => item.ref_id === row.id)) {
    demoDb().ledger.push({
      child_id: row.child_id,
      account_id: row.account_id,
      amount: 25,
      reason: "submission_featured",
      ref_id: row.id,
    });
  }
  revalidatePath("/admin/submissions");
  redirect("/admin/submissions?saved=1");
}

export async function demoSaveReward(formData: FormData) {
  const parsed = rewardSchema.safeParse({
    code: text(formData, "code"),
    headline: text(formData, "headline"),
    description: text(formData, "description"),
    minPoints: text(formData, "minPoints"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) fail("/admin/rewards", parsed.error.issues[0]?.message ?? "Check the code");
  const db = demoDb();
  const id = text(formData, "rewardId");
  const existing = db.rewards.find((reward) => reward.id === id);
  const payload = {
    code: parsed.data.code,
    headline: parsed.data.headline,
    description: parsed.data.description,
    min_points: parsed.data.minPoints,
    active: parsed.data.active,
  };
  if (existing) Object.assign(existing, payload);
  else db.rewards.push({ id: crypto.randomUUID(), ...payload });
  redirect("/admin/rewards?saved=1");
}

export async function demoSavePrize(formData: FormData) {
  const title = text(formData, "title").trim();
  const detail = text(formData, "detail").trim();
  if (title.length < 2 || detail.length < 2) fail("/admin/rewards", "Add a prize title and detail");
  demoDb().prizes.push({ id: crypto.randomUUID(), title, detail, sort_order: 10 });
  redirect("/admin/rewards?saved=1");
}

export async function demoGrant(formData: FormData) {
  const email = emailSchema.safeParse(text(formData, "email"));
  const packId = uuidSchema.safeParse(text(formData, "packId"));
  if (!email.success || !packId.success) fail("/admin/grants", "Enter an email and choose a pack");
  const account = accountByEmail(email.data);
  if (!account) fail("/admin/grants", "No club account uses that email yet. They need to sign in once.");
  const db = demoDb();
  if (!db.ownership.some((row) => row.account_id === account.id && row.pack_id === packId.data)) {
    db.ownership.push({
      account_id: account.id,
      pack_id: packId.data,
      source: "admin_grant",
      granted_at: new Date().toISOString(),
    });
  }
  redirect(`/admin/grants?email=${encodeURIComponent(email.data.toLowerCase())}&saved=1`);
}

export async function demoReplay() {
  const db = demoDb();
  for (const event of db.events.filter((item) => item.status === "unmatched")) {
    const account = event.email ? accountByEmail(event.email) : null;
    if (!account) continue;
    const packs = db.packs.filter((pack) => pack.shopify_product_id && event.product_ids.includes(pack.shopify_product_id));
    if (!packs.length) continue;
    for (const pack of packs) {
      if (!db.ownership.some((row) => row.account_id === account.id && row.pack_id === pack.id)) {
        db.ownership.push({ account_id: account.id, pack_id: pack.id, source: "shopify_webhook", granted_at: new Date().toISOString() });
      }
    }
    event.status = "granted";
    event.detail = "Matched on retry.";
  }
  redirect("/admin/grants?saved=1");
}

export function demoApplyOrder(input: { email: string; customerId: string | null; productIds: string[]; orderId: string }) {
  const db = demoDb();
  if (input.productIds.length === 0) {
    db.events.unshift({ id: crypto.randomUUID(), email: input.email || null, shopify_customer_id: input.customerId, product_ids: [], status: "no_products", detail: null, created_at: new Date().toISOString() });
    return { ok: true, granted: 0, reason: "no_products" };
  }
  const packs = db.packs.filter((pack) => pack.shopify_product_id && input.productIds.includes(pack.shopify_product_id));
  if (!packs.length) {
    db.events.unshift({ id: crypto.randomUUID(), email: input.email || null, shopify_customer_id: input.customerId, product_ids: input.productIds, status: "no_products", detail: "No pack uses these product ids yet.", created_at: new Date().toISOString() });
    return { ok: true, granted: 0, reason: "no_matching_packs" };
  }
  const account = input.customerId
    ? db.accounts.find((item) => item.shopify_customer_id === input.customerId) ?? null
    : null;
  const matched = account ?? (input.email ? accountByEmail(input.email) : null);
  if (!matched) {
    db.events.unshift({ id: crypto.randomUUID(), email: input.email || null, shopify_customer_id: input.customerId, product_ids: input.productIds, status: "unmatched", detail: "No club account with this email yet.", created_at: new Date().toISOString() });
    return { ok: true, granted: 0, reason: "account_not_linked" };
  }
  if (input.customerId && !matched.shopify_customer_id) matched.shopify_customer_id = input.customerId;
  for (const pack of packs) {
    if (!db.ownership.some((row) => row.account_id === matched.id && row.pack_id === pack.id)) {
      db.ownership.push({ account_id: matched.id, pack_id: pack.id, source: "shopify_webhook", granted_at: new Date().toISOString() });
    }
  }
  db.events.unshift({ id: crypto.randomUUID(), email: input.email || null, shopify_customer_id: input.customerId, product_ids: input.productIds, status: "granted", detail: `Granted ${packs.length} pack${packs.length === 1 ? "" : "s"}.`, created_at: new Date().toISOString() });
  return { ok: true, granted: packs.length };
}
