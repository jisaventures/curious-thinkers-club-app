import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/demo/mode";
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
  const needsAdult = path.startsWith("/club") || path.startsWith("/admin") || path.startsWith("/onboarding");

  if (needsAdult && (signedOut || !persona)) {
    if (!signedOut && !persona) {
      const redirectUrl = request.nextUrl.clone();
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.set("ctc_demo_persona", "sam", demoCookie);
      return response;
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (!signedOut && (path === "/" || path === "/login")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = persona === "admin" ? "/admin" : "/club";
    redirectUrl.search = "";
    const response = NextResponse.redirect(redirectUrl);
    if (!persona) response.cookies.set("ctc_demo_persona", "sam", demoCookie);
    return response;
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
    path.startsWith("/club") || path.startsWith("/admin") || path.startsWith("/onboarding");

  if (needsAdult && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (path.startsWith("/club") || path.startsWith("/admin"))) {
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
