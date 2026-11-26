import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/demo/mode";
import { demoAccountFromCookie } from "@/lib/demo/view";
import { createClient } from "@/lib/supabase/server";

export type AccountRecord = {
  id: string;
  display_name: string;
  email: string;
  is_adult_confirmed: boolean;
  role: "member" | "admin";
  shopify_customer_id: string | null;
  group_name?: string | null;
  group_type?: string | null;
  group_location?: string | null;
  group_icon?: string | null;
  group_icon_colour?: string | null;
  group_bg?: string | null;
  created_at?: string | null;
};

export async function requireUser() {
  if (isDemoMode()) {
    const jar = await cookies();
    if (jar.get("ctc_demo_signed_out")?.value === "1") {
      return { supabase: null, user: null, account: null as AccountRecord | null };
    }
    const account = demoAccountFromCookie(jar.get("ctc_demo_persona")?.value);
    if (!account) {
      return { supabase: null, user: null, account: null as AccountRecord | null };
    }
    const unavailable = new Proxy(
      {},
      {
        get() {
          throw new Error("Demo mode is using in-memory data, not Supabase.");
        },
      },
    ) as Awaited<ReturnType<typeof createClient>>;
    return {
      supabase: unavailable,
      user: { id: account.id, email: account.email },
      account,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, account: null as AccountRecord | null };
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("id, display_name, email, is_adult_confirmed, role, shopify_customer_id, group_name, group_type, group_location, group_icon, group_icon_colour, group_bg, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return {
    supabase,
    user,
    account: (data as AccountRecord | null) ?? null,
  };
}

export async function requireAdult() {
  const context = await requireUser();
  if (!context.user) redirect("/login");
  if (!context.account?.is_adult_confirmed) redirect("/onboarding");
  return { ...context, account: context.account, user: context.user };
}

export async function requireAdmin() {
  const context = await requireAdult();
  if (context.account.role !== "admin") redirect("/club");
  return context;
}
