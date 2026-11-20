import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(`${siteUrl()}/login?error=link`);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "magiclink" | "email",
      token_hash: tokenHash,
    });
    if (error) return NextResponse.redirect(`${siteUrl()}/login?error=link`);
  } else {
    return NextResponse.redirect(`${siteUrl()}/login?error=link`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${siteUrl()}/login`);

  const { data: account } = await supabase
    .from("accounts")
    .select("is_adult_confirmed")
    .eq("id", user.id)
    .maybeSingle();

  const next = account?.is_adult_confirmed ? "/club" : "/onboarding";
  return NextResponse.redirect(`${siteUrl()}${next}`);
}
