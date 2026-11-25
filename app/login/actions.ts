"use server";

import { redirect } from "next/navigation";
import { authProvider } from "@/lib/env";
import { isDemoMode } from "@/lib/demo/mode";
import { cookies } from "next/headers";
import { authCookieOptions } from "@/lib/env";
import { startShopifyCustomerLogin } from "@/lib/auth/shopify";
import { createClient } from "@/lib/supabase/server";
import { emailSchema } from "@/lib/validators";
import { shopUrl, siteUrl } from "@/lib/env";

const recentLinks = new Map<string, number>();

export async function requestMagicLink(
  _prev: { ok: boolean; message: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  if (isDemoMode()) {
    return {
      ok: true,
      message: "Demo mode does not send email. Use Continue as Sam or Continue as admin.",
    };
  }

  if (authProvider() === "shopify") {
    return startShopifyCustomerLogin();
  }

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { ok: false, message: "Enter the email address you use for the club." };
  }

  const email = parsed.data.toLowerCase();
  const last = recentLinks.get(email) ?? 0;
  if (Date.now() - last < 30_000) {
    return { ok: true, message: "If that inbox is yours, a sign-in link is already on its way." };
  }
  recentLinks.set(email, Date.now());

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { ok: false, message: "We couldn't send the link just now. Please wait a moment and try again." };
  }

  return {
    ok: true,
    message: "Check your email for a sign-in link. It expires soon, and we never ask for a password.",
  };
}

export async function requestShopLogin(
  prev: { ok: boolean; message: string } | null,
): Promise<{ ok: boolean; message: string }> {
  void prev;
  return startShopifyCustomerLogin();
}

async function endSession() {
  if (isDemoMode()) {
    const jar = await cookies();
    jar.set("ctc_demo_signed_out", "1", { ...authCookieOptions, maxAge: 60 * 60 * 24 * 30 });
    jar.set("ctc_demo_persona", "", { ...authCookieOptions, maxAge: 0 });
    return;
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function signOut() {
  await endSession();
  redirect("/login");
}

export async function exitClubApp() {
  await endSession();
  redirect(shopUrl());
}
