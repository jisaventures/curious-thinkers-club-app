"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdult } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import {
  demoAddChild,
  demoDeleteChild,
  demoMark,
  demoMarkNext,
  demoMarkNextResult,
  demoOwnsChild,
  demoSaveVideo,
  demoUpdateChild,
  demoWithdraw,
} from "@/lib/demo/handlers";
import { authCookieOptions } from "@/lib/env";
import { nextStepPosition } from "@/lib/progress";
import { friendlyError } from "@/lib/utils";
import { childInputSchema, uuidSchema } from "@/lib/validators";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function addChild(formData: FormData) {
  const { account } = await requireAdult();
  if (isDemoMode()) return demoAddChild(account.id, formData);
  const { supabase } = await requireAdult();
  const parsed = childInputSchema.safeParse({
    nickname: text(formData, "nickname"),
    ageYears: text(formData, "ageYears"),
    avatarKey: text(formData, "avatarKey") || "explorer",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the child details." };
  }

  const { count } = await supabase
    .from("children")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account.id);
  if ((count ?? 0) >= 5) return { error: "This account already has 5 children." };

  const { error } = await supabase.from("children").insert({
    account_id: account.id,
    nickname: parsed.data.nickname,
    age_years: parsed.data.ageYears,
    avatar_key: parsed.data.avatarKey,
  });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/club");
  return { ok: true as const };
}

export async function updateChild(formData: FormData) {
  const { account } = await requireAdult();
  if (isDemoMode()) return demoUpdateChild(account.id, formData);
  const { supabase } = await requireAdult();
  const id = uuidSchema.safeParse(text(formData, "childId"));
  const parsed = childInputSchema.safeParse({
    nickname: text(formData, "nickname"),
    ageYears: text(formData, "ageYears"),
    avatarKey: text(formData, "avatarKey"),
  });
  if (!id.success || !parsed.success) {
    return { error: parsed.success ? "Unknown child." : parsed.error.issues[0]?.message ?? "Check the details." };
  }
  const { error } = await supabase
    .from("children")
    .update({
      nickname: parsed.data.nickname,
      age_years: parsed.data.ageYears,
      avatar_key: parsed.data.avatarKey,
    })
    .eq("id", id.data)
    .eq("account_id", account.id);
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/club");
  return { ok: true as const };
}

export async function deleteChild(formData: FormData) {
  const { account } = await requireAdult();
  if (isDemoMode()) return demoDeleteChild(account.id, formData);
  const { supabase } = await requireAdult();
  const id = uuidSchema.safeParse(text(formData, "childId"));
  if (!id.success) return { error: "Unknown child." };
  const { error } = await supabase.from("children").delete().eq("id", id.data).eq("account_id", account.id);
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/club");
  return { ok: true as const };
}

export async function setFocusChild(formData: FormData) {
  const { account } = await requireAdult();
  const id = uuidSchema.safeParse(text(formData, "childId"));
  if (!id.success) return;
  if (isDemoMode()) {
    if (!(await demoOwnsChild(account.id, id.data))) return;
    const jar = await cookies();
    jar.set("ctc_focus_child", id.data, { ...authCookieOptions, maxAge: 60 * 60 * 24 * 180 });
    return;
  }
  const { supabase } = await requireAdult();
  const { data } = await supabase
    .from("children")
    .select("id")
    .eq("id", id.data)
    .eq("account_id", account.id)
    .maybeSingle();
  if (!data) return;
  const jar = await cookies();
  jar.set("ctc_focus_child", id.data, { ...authCookieOptions, maxAge: 60 * 60 * 24 * 180 });
}

async function stepContext(stepId: string, childIds: string[]) {
  const { supabase, account } = await requireAdult();
  const { data: step } = await supabase
    .from("steps")
    .select("id, pack_id, position, points")
    .eq("id", stepId)
    .maybeSingle();
  if (!step) return { error: "That step is not available." as const };

  const [{ data: steps }, { data: kids }] = await Promise.all([
    supabase.from("steps").select("id, position").eq("pack_id", step.pack_id),
    supabase.from("children").select("id, nickname").in("id", childIds).eq("account_id", account.id),
  ]);

  const childList = kids ?? [];
  const stepList = steps ?? [];
  const positions = stepList.map((item) => item.position);
  const { data: progress } = await supabase
    .from("step_progress")
    .select("child_id, step_id, status")
    .in("child_id", childList.length ? childList.map((kid) => kid.id) : ["00000000-0000-0000-0000-000000000000"]);

  const eligible = childList.filter((kid) => {
    const complete = (progress ?? [])
      .filter((row) => row.child_id === kid.id && row.status === "complete")
      .map((row) => stepList.find((item) => item.id === row.step_id)?.position)
      .filter((position): position is number => typeof position === "number");
    return nextStepPosition(positions, complete) === step.position;
  });

  return {
    supabase,
    step,
    eligible,
    last: positions.length ? Math.max(...positions) : 0,
  };
}

export async function markStepForChildren(input: { stepId: string; childIds: string[] }) {
  const parsed = z
    .object({
      stepId: uuidSchema,
      childIds: z.array(uuidSchema).min(1).max(5),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Choose who finished this step." };
  if (isDemoMode()) {
    const { account } = await requireAdult();
    return demoMark(account.id, parsed.data);
  }

  const context = await stepContext(parsed.data.stepId, parsed.data.childIds);
  if ("error" in context) return { ok: false as const, message: context.error };
  if (context.eligible.length === 0) {
    return { ok: false as const, message: "Only children who are on this step can be ticked." };
  }

  for (const kid of context.eligible) {
    const { error } = await context.supabase.from("step_progress").upsert(
      {
        child_id: kid.id,
        step_id: context.step.id,
        status: "complete",
        video_position_seconds: 0,
      },
      { onConflict: "child_id,step_id" },
    );
    if (error) return { ok: false as const, message: friendlyError(error.message) };
  }

  revalidatePath("/club");
  revalidatePath(`/club/packs/${context.step.pack_id}`);
  return {
    ok: true as const,
    names: context.eligible.map((kid) => kid.nickname),
    points: context.step.points,
    certificate: context.step.position === context.last,
  };
}

export async function markNextStepNow(packId: string, childId: string) {
  const parsedPack = uuidSchema.safeParse(packId);
  const parsedChild = uuidSchema.safeParse(childId);
  if (!parsedPack.success || !parsedChild.success) {
    return { ok: false as const, message: "That pack could not be updated." };
  }
  if (isDemoMode()) {
    const { account } = await requireAdult();
    return demoMarkNextResult(account.id, parsedPack.data, parsedChild.data);
  }

  const { supabase } = await requireAdult();
  const { data: steps } = await supabase
    .from("steps")
    .select("id, position")
    .eq("pack_id", parsedPack.data)
    .order("position");
  const { data: progress } = await supabase
    .from("step_progress")
    .select("step_id, status")
    .eq("child_id", parsedChild.data);
  const complete = (progress ?? [])
    .filter((row) => row.status === "complete")
    .map((row) => steps?.find((step) => step.id === row.step_id)?.position)
    .filter((position): position is number => typeof position === "number");
  const next = nextStepPosition((steps ?? []).map((step) => step.position), complete);
  const step = (steps ?? []).find((item) => item.position === next);
  if (!step) return { ok: false as const, message: "This pack is already finished." };
  return markStepForChildren({ stepId: step.id, childIds: [parsedChild.data] });
}

export async function markNextStep(formData: FormData) {
  const packId = uuidSchema.safeParse(text(formData, "packId"));
  const childId = uuidSchema.safeParse(text(formData, "childId"));
  if (!packId.success || !childId.success) redirect("/club");
  if (isDemoMode()) {
    const { account } = await requireAdult();
    return demoMarkNext(account.id, formData);
  }

  const { supabase } = await requireAdult();
  const { data: steps } = await supabase
    .from("steps")
    .select("id, position")
    .eq("pack_id", packId.data)
    .order("position");
  const { data: progress } = await supabase
    .from("step_progress")
    .select("step_id, status")
    .eq("child_id", childId.data);

  const complete = (progress ?? [])
    .filter((row) => row.status === "complete")
    .map((row) => steps?.find((step) => step.id === row.step_id)?.position)
    .filter((position): position is number => typeof position === "number");
  const next = nextStepPosition((steps ?? []).map((step) => step.position), complete);
  const step = (steps ?? []).find((item) => item.position === next);
  if (!step) {
    redirect("/club?notice=This+pack+is+already+finished");
  }

  const result = await markStepForChildren({ stepId: step.id, childIds: [childId.data] });
  const notice = result.ok
    ? result.certificate
      ? "Pack+finished.+Certificate+and+bonus+points+added."
      : "Step+marked+complete"
    : encodeURIComponent(result.message ?? "Something went wrong");
  redirect(`/club?notice=${notice}`);
}

export async function saveVideoPosition(input: {
  stepId: string;
  childIds: string[];
  seconds: number;
}) {
  const parsed = z
    .object({
      stepId: uuidSchema,
      childIds: z.array(uuidSchema).min(1).max(5),
      seconds: z.number().min(0).max(21600),
    })
    .safeParse(input);
  if (!parsed.success) return;
  if (isDemoMode()) {
    const { account } = await requireAdult();
    return demoSaveVideo(account.id, parsed.data);
  }

  const context = await stepContext(parsed.data.stepId, parsed.data.childIds);
  if ("error" in context || context.eligible.length === 0) return;
  const seconds = Math.floor(parsed.data.seconds);

  await Promise.all(
    context.eligible.map((kid) =>
      context.supabase.from("step_progress").upsert(
        {
          child_id: kid.id,
          step_id: context.step.id,
          status: "in_progress",
          video_position_seconds: seconds,
        },
        { onConflict: "child_id,step_id" },
      ),
    ),
  );
}

export async function withdrawSubmission(formData: FormData) {
  const { account } = await requireAdult();
  if (isDemoMode()) return demoWithdraw(account.id, formData);
  const { supabase, user } = await requireAdult();
  const id = uuidSchema.safeParse(text(formData, "submissionId"));
  if (!id.success) return { error: "Unknown upload." };
  const { data } = await supabase
    .from("submissions")
    .select("id, storage_path, status")
    .eq("id", id.data)
    .maybeSingle();
  if (!data || data.status !== "pending") return { error: "That upload can no longer be removed." };
  await supabase.storage.from("work-submissions").remove([data.storage_path]);
  const { error } = await supabase.from("submissions").delete().eq("id", data.id);
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/club");
  return { ok: true as const, userId: user.id };
}
