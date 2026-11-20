"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { friendlyError } from "@/lib/utils";
import { childInputSchema, displayNameSchema } from "@/lib/validators";

export async function confirmAdult(formData: FormData) {
  const { supabase, user, account } = await requireUser();
  if (!user) redirect("/login");

  const name = displayNameSchema.safeParse(formData.get("displayName"));
  const adult = formData.get("adult") === "on" || formData.get("adult") === "true";
  if (!adult) {
    redirect("/onboarding?error=Please+confirm+you+are+18+or+over");
  }
  if (!name.success) {
    redirect("/onboarding?error=Use+your+first+name+only");
  }

  if (!account) {
    const { error } = await supabase.from("accounts").insert({
      id: user.id,
      email: user.email ?? "",
      display_name: name.data,
      role: "member",
      is_adult_confirmed: true,
      adult_confirmed_at: new Date().toISOString(),
    });
    if (error) redirect(`/onboarding?error=${encodeURIComponent(friendlyError(error.message))}`);
  } else {
    const { error } = await supabase
      .from("accounts")
      .update({
        display_name: name.data,
        is_adult_confirmed: true,
        adult_confirmed_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (error) redirect(`/onboarding?error=${encodeURIComponent(friendlyError(error.message))}`);
  }

  const nickname = String(formData.get("nickname") ?? "").trim();
  if (nickname) {
    const child = childInputSchema.safeParse({
      nickname,
      ageYears: formData.get("ageYears"),
      avatarKey: formData.get("avatarKey") || "explorer",
    });
    if (!child.success) {
      redirect("/club?notice=Account+saved.+Check+the+child+details+and+try+again.");
    }
    await supabase.from("children").insert({
      account_id: user.id,
      nickname: child.data.nickname,
      age_years: child.data.ageYears,
      avatar_key: child.data.avatarKey,
    });
  }

  redirect("/club");
}
