"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import {
  demoAddStep,
  demoCreatePack,
  demoDeletePack,
  demoDeleteStep,
  demoGrant,
  demoMoveStep,
  demoReplay,
  demoReview,
  demoSaveDashboardBanner,
  demoSavePrize,
  demoSaveReward,
  demoUpdatePack,
  demoUpdateStep,
} from "@/lib/demo/handlers";
import { friendlyError, } from "@/lib/utils";
import { poundsToPence } from "@/lib/format";
import { safePromoBackground, safePromoLink } from "@/lib/club/promo";
import {
  detectVideoProvider,
  emailSchema,
  packSchema,
  rewardSchema,
  slugify,
  stepSchema,
  uuidSchema,
} from "@/lib/validators";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function back(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createPack(formData: FormData) {
  if (isDemoMode()) {
    await requireAdmin();
    return demoCreatePack(formData);
  }
  const { supabase } = await requireAdmin();
  const price = poundsToPence(text(formData, "price"));
  if (price === null) back("/admin/packs/new", "Enter a price like 8.99");
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
  if (!parsed.success) back("/admin/packs/new", parsed.error.issues[0]?.message ?? "Check the pack");

  const { data, error } = await supabase
    .from("packs")
    .insert({
      title: parsed.data.title,
      slug: parsed.data.slug,
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
    })
    .select("id")
    .single();
  if (error || !data) back("/admin/packs/new", friendlyError(error?.message ?? "Could not save"));
  redirect(`/admin/packs/${data.id}?saved=1`);
}

export async function updatePack(formData: FormData) {
  if (isDemoMode()) {
    await requireAdmin();
    return demoUpdatePack(formData);
  }
  const { supabase } = await requireAdmin();
  const id = uuidSchema.safeParse(text(formData, "packId"));
  if (!id.success) back("/admin/packs", "Unknown pack");
  const price = poundsToPence(text(formData, "price"));
  if (price === null) back(`/admin/packs/${id.data}`, "Enter a price like 8.99");
  const parsed = packSchema.safeParse({
    title: text(formData, "title"),
    slug: text(formData, "slug"),
    theme: text(formData, "theme"),
    ageMin: text(formData, "ageMin"),
    ageMax: text(formData, "ageMax"),
    durationMinutes: text(formData, "durationMinutes"),
    durationLabel: text(formData, "durationLabel"),
    blurb: text(formData, "blurb"),
    coverTone: text(formData, "coverTone"),
    shopifyProductId: text(formData, "shopifyProductId"),
    pricePence: price,
    certificateBonusPoints: text(formData, "certificateBonusPoints"),
    published: formData.get("published") === "on",
  });
  if (!parsed.success) back(`/admin/packs/${id.data}`, parsed.error.issues[0]?.message ?? "Check the pack");
  const { error } = await supabase
    .from("packs")
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
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
    })
    .eq("id", id.data);
  if (error) back(`/admin/packs/${id.data}`, friendlyError(error.message));
  redirect(`/admin/packs/${id.data}?saved=1`);
}

export async function deletePack(formData: FormData) {
  if (isDemoMode()) {
    await requireAdmin();
    return demoDeletePack(formData);
  }
  const { supabase } = await requireAdmin();
  const id = text(formData, "packId");
  await supabase.from("packs").delete().eq("id", id);
  revalidatePath("/admin/packs");
  redirect("/admin/packs");
}

async function storeVideo(formData: FormData, packId: string, stepId: string, fallback: string) {
  const file = formData.get("videoFile");
  if (!(file instanceof File) || file.size === 0) return fallback;
  if (file.size > 20 * 1024 * 1024) throw new Error("Video uploads are limited to 20MB. Paste a link for a longer film.");
  if (!["video/mp4", "video/webm"].includes(file.type)) throw new Error("Upload an MP4 or WEBM, or paste a link.");
  const { supabase } = await requireAdmin();
  const ext = file.type === "video/webm" ? "webm" : "mp4";
  const path = `${packId}/${stepId}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const uploaded = await supabase.storage.from("pack-videos").upload(path, bytes, {
    contentType: file.type,
    upsert: true,
  });
  if (uploaded.error) throw new Error("The video could not be stored.");
  return `storage://pack-videos/${path}`;
}

export async function addStep(formData: FormData) {
  if (isDemoMode()) {
    await requireAdmin();
    return demoAddStep(formData);
  }
  const { supabase } = await requireAdmin();
  const packId = text(formData, "packId");
  const path = `/admin/packs/${packId}`;
  const parsed = stepSchema.safeParse({
    title: text(formData, "title"),
    description: text(formData, "description"),
    videoUrl: text(formData, "videoUrl"),
    printableRef: text(formData, "printableRef"),
    estimatedMinutes: text(formData, "estimatedMinutes"),
    points: text(formData, "points"),
  });
  if (!parsed.success) back(path, parsed.error.issues[0]?.message ?? "Check the step");
  const { data: existing } = await supabase.from("steps").select("position").eq("pack_id", packId);
  const position = (existing ?? []).reduce((max, row) => Math.max(max, row.position), 0) + 1;
  const id = crypto.randomUUID();
  let videoUrl = parsed.data.videoUrl || "";
  try {
    videoUrl = await storeVideo(formData, packId, id, videoUrl);
  } catch (error) {
    back(path, error instanceof Error ? error.message : "Video upload failed");
  }
  const { error } = await supabase.from("steps").insert({
    id,
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
  if (error) back(path, friendlyError(error.message));
  redirect(`${path}?saved=1`);
}

export async function updateStep(formData: FormData) {
  if (isDemoMode()) {
    await requireAdmin();
    return demoUpdateStep(formData);
  }
  const { supabase } = await requireAdmin();
  const packId = text(formData, "packId");
  const stepId = text(formData, "stepId");
  const path = `/admin/packs/${packId}`;
  const parsed = stepSchema.safeParse({
    title: text(formData, "title"),
    description: text(formData, "description"),
    videoUrl: text(formData, "videoUrl"),
    printableRef: text(formData, "printableRef"),
    estimatedMinutes: text(formData, "estimatedMinutes"),
    points: text(formData, "points"),
  });
  if (!parsed.success) back(path, parsed.error.issues[0]?.message ?? "Check the step");
  let videoUrl = parsed.data.videoUrl || "";
  try {
    videoUrl = await storeVideo(formData, packId, stepId, videoUrl);
  } catch (error) {
    back(path, error instanceof Error ? error.message : "Video upload failed");
  }
  const { error } = await supabase
    .from("steps")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      video_url: videoUrl || null,
      video_provider: detectVideoProvider(videoUrl),
      printable_ref: parsed.data.printableRef || null,
      estimated_minutes: parsed.data.estimatedMinutes,
      points: parsed.data.points,
    })
    .eq("id", stepId)
    .eq("pack_id", packId);
  if (error) back(path, friendlyError(error.message));
  redirect(`${path}?saved=1`);
}

export async function deleteStep(formData: FormData) {
  if (isDemoMode()) {
    await requireAdmin();
    return demoDeleteStep(formData);
  }
  const { supabase } = await requireAdmin();
  const packId = text(formData, "packId");
  const stepId = text(formData, "stepId");
  await supabase.from("steps").delete().eq("id", stepId).eq("pack_id", packId);
  const { data: remaining } = await supabase.from("steps").select("id").eq("pack_id", packId).order("position");
  if (remaining && remaining.length) {
    await supabase.rpc("reorder_steps", {
      p_pack_id: packId,
      p_step_ids: remaining.map((step) => step.id),
    });
  }
  redirect(`/admin/packs/${packId}?saved=1`);
}

export async function moveStep(formData: FormData) {
  if (isDemoMode()) {
    await requireAdmin();
    return demoMoveStep(formData);
  }
  const { supabase } = await requireAdmin();
  const packId = text(formData, "packId");
  const stepId = text(formData, "stepId");
  const direction = text(formData, "direction") === "up" ? -1 : 1;
  const { data: steps } = await supabase.from("steps").select("id, position").eq("pack_id", packId).order("position");
  const list = steps ?? [];
  const index = list.findIndex((step) => step.id === stepId);
  const swap = index + direction;
  if (index < 0 || swap < 0 || swap >= list.length) redirect(`/admin/packs/${packId}`);
  const order = list.map((step) => step.id);
  const current = order[index];
  order[index] = order[swap];
  order[swap] = current;
  const { error } = await supabase.rpc("reorder_steps", { p_pack_id: packId, p_step_ids: order });
  if (error) back(`/admin/packs/${packId}`, friendlyError(error.message));
  redirect(`/admin/packs/${packId}?saved=1`);
}

export async function reviewSubmission(formData: FormData) {
  if (isDemoMode()) {
    await requireAdmin();
    return demoReview(formData);
  }
  const { supabase } = await requireAdmin();
  const id = text(formData, "submissionId");
  const status = text(formData, "status") === "approved" ? "approved" : "rejected";
  const { error } = await supabase.rpc("review_submission", { p_id: id, p_status: status });
  if (error) back("/admin/submissions", friendlyError(error.message));
  revalidatePath("/admin/submissions");
  redirect("/admin/submissions?saved=1");
}

export async function saveReward(formData: FormData) {
  if (isDemoMode()) {
    await requireAdmin();
    return demoSaveReward(formData);
  }
  const { supabase } = await requireAdmin();
  const parsed = rewardSchema.safeParse({
    code: text(formData, "code"),
    headline: text(formData, "headline"),
    description: text(formData, "description"),
    minPoints: text(formData, "minPoints"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) back("/admin/rewards", parsed.error.issues[0]?.message ?? "Check the code");
  const id = text(formData, "rewardId");
  const payload = {
    code: parsed.data.code,
    headline: parsed.data.headline,
    description: parsed.data.description,
    min_points: parsed.data.minPoints,
    active: parsed.data.active,
  };
  const { error } = id
    ? await supabase.from("reward_codes").update(payload).eq("id", id)
    : await supabase.from("reward_codes").insert(payload);
  if (error) back("/admin/rewards", friendlyError(error.message));
  redirect("/admin/rewards?saved=1");
}

export async function savePrize(formData: FormData) {
  if (isDemoMode()) {
    await requireAdmin();
    return demoSavePrize(formData);
  }
  const { supabase } = await requireAdmin();
  const title = text(formData, "title").trim();
  const detail = text(formData, "detail").trim();
  if (title.length < 2 || detail.length < 2) back("/admin/rewards", "Add a prize title and detail");
  const { error } = await supabase.from("prizes").insert({ title, detail, sort_order: 10 });
  if (error) back("/admin/rewards", friendlyError(error.message));
  redirect("/admin/rewards?saved=1");
}

export async function grantPack(formData: FormData) {
  if (isDemoMode()) {
    await requireAdmin();
    return demoGrant(formData);
  }
  const { supabase } = await requireAdmin();
  const email = emailSchema.safeParse(text(formData, "email"));
  const packId = uuidSchema.safeParse(text(formData, "packId"));
  if (!email.success || !packId.success) back("/admin/grants", "Enter an email and choose a pack");
  const { data: account } = await supabase
    .from("accounts")
    .select("id")
    .ilike("email", email.data.toLowerCase())
    .maybeSingle();
  if (!account) back("/admin/grants", "No club account uses that email yet. They need to sign in once.");
  const { error } = await supabase.from("pack_ownership").insert({
    account_id: account.id,
    pack_id: packId.data,
    source: "admin_grant",
  });
  if (error) back("/admin/grants", friendlyError(error.message));
  redirect(`/admin/grants?email=${encodeURIComponent(email.data.toLowerCase())}&saved=1`);
}

export async function replayUnmatched() {
  if (isDemoMode()) {
    await requireAdmin();
    return demoReplay();
  }
  const { supabase } = await requireAdmin();
  const { data: events } = await supabase
    .from("shopify_events")
    .select("id, email, shopify_customer_id, product_ids")
    .eq("status", "unmatched");
  for (const event of events ?? []) {
    let account: { id: string } | null = null;
    if (event.shopify_customer_id) {
      const { data } = await supabase
        .from("accounts")
        .select("id")
        .eq("shopify_customer_id", event.shopify_customer_id)
        .maybeSingle();
      account = data;
    }
    if (!account && event.email) {
      const { data } = await supabase.from("accounts").select("id").ilike("email", event.email).maybeSingle();
      account = data;
    }
    if (!account) continue;
    const { data: packs } = await supabase
      .from("packs")
      .select("id")
      .in("shopify_product_id", event.product_ids ?? []);
    if (!packs?.length) continue;
    await supabase.from("pack_ownership").upsert(
      packs.map((pack) => ({
        account_id: account.id,
        pack_id: pack.id,
        source: "shopify_webhook" as const,
      })),
      { onConflict: "account_id,pack_id", ignoreDuplicates: true },
    );
    await supabase.from("shopify_events").update({ status: "granted", detail: "Matched on retry." }).eq("id", event.id);
  }
  redirect("/admin/grants?saved=1");
}

export async function saveDashboardBanner(formData: FormData) {
  await requireAdmin();
  if (isDemoMode()) {
    const result = await demoSaveDashboardBanner(formData);
    if ("error" in result && result.error) back("/admin/dashboard-banner", result.error);
    revalidatePath("/club");
    revalidatePath("/admin/dashboard-banner");
    redirect("/admin/dashboard-banner?saved=1");
  }
  const { supabase } = await requireAdmin();
  const background = safePromoBackground(text(formData, "background"));
  const textColour = text(formData, "textColour").trim();
  const buttonLink = safePromoLink(text(formData, "buttonLink"));
  const badgeText = text(formData, "badgeText").trim();
  const headline = text(formData, "headline").trim();
  const subtext = text(formData, "subtext").trim();
  const buttonLabel = text(formData, "buttonLabel").trim();
  if (!badgeText || headline.length < 2 || subtext.length < 2 || buttonLabel.length < 2) back("/admin/dashboard-banner", "Fill in the banner text.");
  if (!background) back("/admin/dashboard-banner", "Use a hex colour or a linear-gradient for the background.");
  if (!/^#[0-9a-fA-F]{3,8}$/.test(textColour)) back("/admin/dashboard-banner", "Use a hex text colour.");
  if (!buttonLink) back("/admin/dashboard-banner", "Use a site path or a web link.");
  const existing = await supabase.from("dashboard_banners").select("image_url").eq("id", "club-kit").maybeSingle();
  let imageUrl = existing.data?.image_url || "/brand/merch-banner-v2.png";
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 1_500_000) {
      back("/admin/dashboard-banner", "Use a JPG, PNG or WebP under 1.5 MB.");
    }
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `club-kit/${Date.now()}.${extension}`;
    const uploaded = await supabase.storage.from("dashboard-banners").upload(path, new Uint8Array(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: true,
    });
    if (uploaded.error) back("/admin/dashboard-banner", friendlyError(uploaded.error.message));
    imageUrl = supabase.storage.from("dashboard-banners").getPublicUrl(path).data.publicUrl;
  }
  const starts = text(formData, "startsAt");
  const ends = text(formData, "endsAt");
  const { error } = await supabase.from("dashboard_banners").upsert({
    id: "club-kit",
    image_url: imageUrl,
    badge_text: badgeText,
    headline,
    subtext,
    button_label: buttonLabel,
    button_link: buttonLink,
    background,
    text_colour: textColour,
    visible: formData.get("visible") === "on",
    starts_at: starts ? new Date(starts).toISOString() : null,
    ends_at: ends ? new Date(ends).toISOString() : null,
    updated_at: new Date().toISOString(),
  });
  if (error) back("/admin/dashboard-banner", friendlyError(error.message));
  revalidatePath("/club");
  revalidatePath("/admin/dashboard-banner");
  redirect("/admin/dashboard-banner?saved=1");
}
