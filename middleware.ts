import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html") && request.nextUrl.pathname === "/club") {
    response.headers.append("Link", "</brand/mascot-spy.webp>; rel=preload; as=image; type=image/webp; fetchpriority=high");
    response.headers.append("Link", "</brand/merch-banner.webp>; rel=preload; as=image; type=image/webp; fetchpriority=high");
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|videos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
