import { NextResponse } from "next/server";
import { authCookieOptions, demoLoginEnabled, siteUrl } from "@/lib/env";
import { isDemoMode } from "@/lib/demo/mode";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const personas = {
  guardian: "sam@demo.curiousthinkersclub.test",
  admin: "admin@demo.curiousthinkersclub.test",
} as const;

export async function POST(request: Request) {
  const form = await request.formData();
  const persona = form.get("persona");

  if (isDemoMode()) {
    if (persona !== "admin" && persona !== "guardian") {
      return NextResponse.json({ error: "Unknown demo." }, { status: 400 });
    }
    const next = persona === "admin" ? "/admin" : "/club";
    const response = NextResponse.redirect(`${siteUrl()}${next}`, { status: 303 });
    response.cookies.set("ctc_demo_persona", persona === "admin" ? "admin" : "sam", {
      ...authCookieOptions,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set("ctc_demo_signed_out", "", { ...authCookieOptions, maxAge: 0 });
    return response;
  }

  if (!demoLoginEnabled()) {
    return NextResponse.json({ error: "Demo login is turned off." }, { status: 404 });
  }
  const email = persona === "admin" || persona === "guardian" ? personas[persona] : null;
  if (!email) {
    return NextResponse.json({ error: "Unknown demo." }, { status: 400 });
  }

  const admin = createAdminClient();
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = link.data.properties?.hashed_token;
  if (link.error || !tokenHash) {
    return NextResponse.json({ error: "The demo account is not ready." }, { status: 500 });
  }

  const supabase = await createClient();
  const verified = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (verified.error) {
    return NextResponse.json({ error: "Could not start the demo session." }, { status: 500 });
  }

  const next = persona === "admin" ? "/admin" : "/club";
  return NextResponse.redirect(`${siteUrl()}${next}`, { status: 303 });
}
