"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  AVATAAARS_ACCESSORIES,
  AVATAAARS_CLOTHES,
  AVATAAARS_EYEBROWS,
  AVATAAARS_EYES,
  AVATAAARS_FACIAL_HAIR,
  AVATAAARS_GRAPHICS,
  AVATAAARS_MOUTHS,
  AVATAAARS_TOPS,
} from "@/lib/avataaars-options";
import { authCookieOptions } from "@/lib/env";
import { isDemoMode } from "@/lib/demo/mode";
import { createDemoFamily, demoDb, nicknameTaken } from "@/lib/demo/store";
import { isRudeNickname, suggestNickname } from "@/lib/nicknames";
import { requireUser } from "@/lib/auth/session";
import { friendlyError } from "@/lib/utils";
import { ageSchema, childFirstNameSchema, nicknameSchema } from "@/lib/validators";
import { groupNameProblem } from "@/lib/unsafe-language";
import { GROUP_ICONS } from "@/components/brand/group-icon";

const familySchema = z.object({
  adult: z.literal(true),
  group: z.object({
    name: z.string().trim().min(2).max(32),
    type: z.enum(["Family", "School", "Team", "Club", "Homeschool", "Other"]),
    location: z.string().trim().min(2).max(60),
    leaderName: childFirstNameSchema,
    icon: z.enum(GROUP_ICONS),
    background: z.string().regex(/^[0-9a-fA-F]{6}$/),
    colour: z.string().regex(/^[0-9a-fA-F]{6}$/),
  }),
  children: z
    .array(
      z.object({
        firstName: childFirstNameSchema,
        nickname: nicknameSchema,
        ageYears: ageSchema,
        gender: z.enum(["boy", "girl", "unspecified"]),
        avatar: z.object({
          top: z.enum(AVATAAARS_TOPS),
          hairColor: z.string().regex(/^[0-9a-fA-F]{6}$/),
          hatColor: z.string().regex(/^[0-9a-fA-F]{6}$/),
          skin: z.string().regex(/^[0-9a-fA-F]{6}$/),
          eyes: z.enum(AVATAAARS_EYES),
          eyeColor: z.string().regex(/^[0-9a-fA-F]{6}$/),
          eyebrows: z.enum(AVATAAARS_EYEBROWS),
          mouth: z.enum(AVATAAARS_MOUTHS),
          facialHair: z.enum(AVATAAARS_FACIAL_HAIR),
          facialHairColor: z.string().regex(/^[0-9a-fA-F]{6}$/),
          accessory: z.enum(AVATAAARS_ACCESSORIES),
          accessoryColor: z.string().regex(/^[0-9a-fA-F]{6}$/),
          clothing: z.enum(AVATAAARS_CLOTHES),
          clothesColor: z.string().regex(/^[0-9a-fA-F]{6}$/),
          clothingGraphic: z.enum(AVATAAARS_GRAPHICS),
          background: z.string().regex(/^[0-9a-fA-F]{6}$/),
        }),
      }),
    )
    .min(1)
    .max(5),
});

export async function checkNickname(nickname: string, firstName: string) {
  const taken = new Set<string>();
  if (isDemoMode()) {
    for (const child of demoDb().children) taken.add(child.nickname);
  }
  const suggestion = suggestNickname(firstName, taken);
  const parsed = nicknameSchema.safeParse(nickname);
  if (!parsed.success) {
    return { ok: false as const, suggestion, message: parsed.error.issues[0]?.message ?? "Check that nickname." };
  }
  if (isRudeNickname(parsed.data)) {
    return { ok: false as const, suggestion, message: "Choose a kinder nickname." };
  }
  if (await isNicknameTaken(parsed.data)) {
    return { ok: false as const, suggestion, message: "That nickname is already taken." };
  }
  return { ok: true as const, suggestion, message: "" };
}

async function isNicknameTaken(nickname: string) {
  if (isDemoMode()) return nicknameTaken(nickname);
  const { supabase, user } = await requireUser();
  if (!user) return false;
  const { data, error } = await supabase.rpc("nickname_available", { candidate: nickname });
  if (!error && typeof data === "boolean") return !data;
  const { data: rows } = await supabase.from("children").select("id").ilike("nickname", nickname).limit(1);
  return (rows ?? []).length > 0;
}

export async function completeOnboarding(input: z.infer<typeof familySchema>) {
  const parsed = familySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the details and try again." };
  }
  const seen = new Set<string>();
  for (const child of parsed.data.children) {
    const key = child.nickname.toLowerCase();
    if (seen.has(key)) return { ok: false as const, message: "Each child needs a different nickname." };
    seen.add(key);
    if (isRudeNickname(child.nickname)) return { ok: false as const, message: "Choose a kinder nickname." };
    if (await isNicknameTaken(child.nickname)) {
      return { ok: false as const, message: `${child.nickname} is already taken.` };
    }
  }

  if (groupNameProblem(parsed.data.group.name)) {
    return { ok: false as const, message: "Choose a kinder group name." };
  }
  const parentName = parsed.data.group.leaderName;

  if (isDemoMode()) {
    const created = createDemoFamily({ parentName, group: parsed.data.group, children: parsed.data.children });
    const jar = await cookies();
    jar.set("ctc_demo_persona", created.accountId, { ...authCookieOptions, httpOnly: true, maxAge: 60 * 60 * 24 * 30 });
    jar.set("ctc_demo_signed_out", "", { ...authCookieOptions, maxAge: 0 });
    if (created.focusId) {
      jar.set("ctc_focus_child", created.focusId, { ...authCookieOptions, maxAge: 60 * 60 * 24 * 180 });
    }
    redirect("/club");
  }

  const { supabase, user, account } = await requireUser();
  if (!user) redirect("/login");
  if (!account) {
    const { error } = await supabase.from("accounts").insert({
      id: user.id,
      email: user.email ?? "",
        display_name: parentName,
        role: "member",
        is_adult_confirmed: true,
        adult_confirmed_at: new Date().toISOString(),
        group_name: parsed.data.group.name,
        group_type: parsed.data.group.type,
        group_location: parsed.data.group.location,
        group_icon: parsed.data.group.icon,
        group_icon_colour: parsed.data.group.colour,
        group_bg: parsed.data.group.background,
    });
    if (error) return { ok: false as const, message: friendlyError(error.message) };
  } else {
    const { error } = await supabase
      .from("accounts")
      .update({
        display_name: parentName,
        is_adult_confirmed: true,
        adult_confirmed_at: new Date().toISOString(),
        group_name: parsed.data.group.name,
        group_type: parsed.data.group.type,
        group_location: parsed.data.group.location,
        group_icon: parsed.data.group.icon,
        group_icon_colour: parsed.data.group.colour,
        group_bg: parsed.data.group.background,
      })
      .eq("id", user.id);
    if (error) return { ok: false as const, message: friendlyError(error.message) };
  }

  const { error } = await supabase.from("children").insert(
    parsed.data.children.map((child) => ({
      account_id: user.id,
      nickname: child.nickname,
      age_years: child.ageYears,
      avatar_key: "star",
      first_name: child.firstName,
      gender: child.gender,
      avatar_bg: "leaf",
      avatar_face: "smile",
      avatar_options: JSON.stringify(child.avatar),
    })),
  );
  if (error) return { ok: false as const, message: friendlyError(error.message) };
  redirect("/club");
}
