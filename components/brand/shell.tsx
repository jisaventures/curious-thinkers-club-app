import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { isDemoMode } from "@/lib/demo/mode";
import { shopUrl } from "@/lib/env";
import type { AccountRecord } from "@/lib/auth/session";
import { AdultAvatar, LogoMark } from "@/components/brand/logo";

export function AppShell({
  account,
  children,
  hideShop = false,
  centered = false,
}: {
  account: AccountRecord | null;
  children: React.ReactNode;
  hideShop?: boolean;
  centered?: boolean;
}) {
  const shop = shopUrl();
  return (
    <div
      className={
        centered
          ? "mx-auto flex min-h-svh w-full max-w-6xl flex-col px-3 py-4 sm:px-4 sm:py-6 lg:h-svh lg:overflow-hidden lg:py-3"
          : "mx-auto w-full max-w-none px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5"
      }
    >
      <div className={`min-w-0 rounded-[28px] border border-white/80 bg-[#fffdf8] shadow-[0_24px_70px_rgba(30,77,58,0.08)] ${centered ? "flex flex-1 flex-col" : ""}`}>
        <header className="flex items-center gap-3 px-3 py-3 sm:px-5 sm:py-4">
          <Link href={account ? "/club" : "/login"} className="flex min-w-0 items-center gap-2">
            <LogoMark className="size-10 shrink-0" />
            <span className="truncate font-display text-lg leading-none text-[#1e4d3a] sm:text-xl">
              Curious Thinkers
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            {account && (
              <Link
                href="/club"
                className="hidden rounded-full px-3 py-2 text-sm font-extrabold text-[#1e4d3a] hover:bg-[#e7f5e1] sm:inline-flex"
              >
                My Club
              </Link>
            )}
            {account?.role === "admin" && (
              <Link
                href="/admin"
                className="hidden rounded-full px-3 py-2 text-sm font-extrabold text-[#1e4d3a] hover:bg-[#e7f5e1] md:inline-flex"
              >
                Admin
              </Link>
            )}
            {!hideShop && (
              <a
                href={shop}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-extrabold text-[#1e4d3a] hover:bg-[#e7f5e1] sm:px-3"
              >
                <BagIcon />
                <span className="hidden min-[380px]:inline">Shop packs</span>
              </a>
            )}
            {account && (
              <details className="relative hidden sm:block">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full py-1 pr-2 pl-1 hover:bg-[#f6f1e6]">
                  <AdultAvatar className="size-9" />
                  <span className="text-sm font-extrabold">Hi, {account.display_name}</span>
                </summary>
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-[#efe2d0] bg-white p-2 shadow-lg">
                  <Link href="/club/children" className="block rounded-xl px-3 py-2 text-sm font-bold hover:bg-[#f6f1e6]">
                    Children
                  </Link>
                  {account.role === "admin" && (
                    <Link href="/admin" className="block rounded-xl px-3 py-2 text-sm font-bold hover:bg-[#f6f1e6] md:hidden">
                      Admin
                    </Link>
                  )}
                  <form action={signOut}>
                    <button className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-[#f6f1e6]">
                      Sign out
                    </button>
                  </form>
                </div>
              </details>
            )}
          </nav>
        </header>
        {isDemoMode() && (
          <div className="mx-3 mb-2 flex flex-col gap-2 rounded-2xl bg-[#fff6dc] px-3 py-2 text-sm text-[#1e4d3a] sm:mx-5 sm:flex-row sm:items-center sm:justify-between">
            <p>
              <span className="font-extrabold">Demo mode.</span> In-memory sample family. No Docker or Supabase. It resets when the dev server restarts.
            </p>
            <div className="flex gap-2">
              <form action="/api/dev/demo-login" method="post">
                <input type="hidden" name="persona" value="guardian" />
                <button className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold">Sam&apos;s club</button>
              </form>
              <form action="/api/dev/demo-login" method="post">
                <input type="hidden" name="persona" value="admin" />
                <button className="rounded-full bg-[#1e4d3a] px-3 py-1.5 text-xs font-extrabold text-white">Admin</button>
              </form>
            </div>
          </div>
        )}
        <div className={`px-3 pb-6 sm:px-5 md:px-7 md:pb-8 ${centered ? "flex flex-1 flex-col lg:pb-4" : ""}`}>{children}</div>
      </div>
    </div>
  );
}

function BagIcon() {
  return (
    <span className="relative inline-flex">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M6 8h12l-1 12H7L6 8z" strokeLinejoin="round" />
        <path d="M9 8V7a3 3 0 0 1 6 0v1" strokeLinecap="round" />
      </svg>
      <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[#1e4d3a]" />
    </span>
  );
}
