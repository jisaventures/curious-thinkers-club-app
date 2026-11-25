import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/demo/mode";
import { knownDemoPersona } from "@/lib/demo/store";
import { authCookieOptions, supabaseAnonKey, supabaseUrl } from "@/lib/env";

const demoCookie = {
  ...authCookieOptions,
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 30,
};

function demoSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const persona = request.cookies.get("ctc_demo_persona")?.value;
  const signedOut = request.cookies.get("ctc_demo_signed_out")?.value === "1";
  const needsAdult = path.startsWith("/club") || path.startsWith("/admin") || path.startsWith("/onboarding") || path.startsWith("/my-quests") || path.startsWith("/submit-work") || path.startsWith("/rewards");

  if (persona && !knownDemoPersona(persona)) {
    const response = needsAdult
      ? NextResponse.redirect(new URL("/login", request.url))
      : NextResponse.next({ request });
    response.cookies.set("ctc_demo_persona", "", { ...authCookieOptions, maxAge: 0 });
    response.cookies.set("ctc_demo_signed_out", "1", { ...demoCookie });
    return response;
  }

  const fresh = !persona && !signedOut;
  if (fresh && (path.startsWith("/onboarding") || path === "/terms" || path.startsWith("/api/"))) {
    return NextResponse.next({ request });
  }
  if (fresh) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/onboarding";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (signedOut && needsAdult) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (!signedOut && persona && (path === "/" || path === "/login")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = persona === "admin" ? "/admin" : "/club";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (persona !== "admin" && path.startsWith("/admin")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/club";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next({ request });
}

export async function updateSession(request: NextRequest) {
  if (isDemoMode()) return demoSession(request);

  let supabaseResponse = NextResponse.next({ request });
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) return supabaseResponse;

  const supabase = createServerClient(url, key, {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, { ...options, ...authCookieOptions });
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsAdult =
    path.startsWith("/club") || path.startsWith("/admin") || path.startsWith("/onboarding") || path.startsWith("/my-quests") || path.startsWith("/submit-work") || path.startsWith("/rewards");

  if (needsAdult && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (path.startsWith("/club") || path.startsWith("/admin") || path.startsWith("/my-quests") || path.startsWith("/submit-work") || path.startsWith("/rewards"))) {
    const { data: account } = await supabase
      .from("accounts")
      .select("role, is_adult_confirmed")
      .eq("id", user.id)
      .maybeSingle();

    if (!account?.is_adult_confirmed) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/onboarding";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (path.startsWith("/admin") && account.role !== "admin") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/club";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (user && (path === "/login" || path === "/")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/club";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
