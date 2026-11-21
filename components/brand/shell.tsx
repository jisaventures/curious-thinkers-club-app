import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { isDemoMode } from "@/lib/demo/mode";
import { shopUrl } from "@/lib/env";
import type { AccountRecord } from "@/lib/auth/session";
import { LogoMark } from "@/components/brand/logo";

export function AppShell({
  account,
  children,
  hideShop: _hideShop = false,
  centered = false,
  onboarding = false,
}: {
  account: AccountRecord | null;
  children: React.ReactNode;
  hideShop?: boolean;
  centered?: boolean;
  onboarding?: boolean;
}) {
  void _hideShop;
  const shop = shopUrl();
  const frame = centered
    ? `mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 [justify-content:safe_center] sm:px-4 ${onboarding ? "pt-4 pb-28 sm:pt-6" : "py-4 sm:py-6"}`
    : "mx-auto w-full max-w-none px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5";
  return (
    <div className={`flex min-h-svh flex-col ${onboarding ? "onboarding-zoom" : ""}`}>
      <SiteHeader account={account} shop={shop} centered={centered} onboarding={onboarding} />
      <div className={frame}>
        <div className="min-w-0 rounded-[28px] border border-white/80 bg-[#fffdf8] shadow-[0_24px_70px_rgba(30,77,58,0.08)]">
          <div className={centered ? "px-3 pt-9 pb-8 sm:px-5 md:px-7" : "px-3 pb-6 sm:px-5 md:px-7 md:pb-8"}>{children}</div>
        </div>
      </div>
      {isDemoMode() && <DemoModeMenu />}
    </div>
  );
}

function SiteHeader({
  account,
  shop,
  centered,
  onboarding,
}: {
  account: AccountRecord | null;
  shop: string;
  centered: boolean;
  onboarding: boolean;
}) {
  const row = centered ? "mx-auto w-full max-w-6xl px-3 sm:px-4" : "w-full px-3 sm:px-4 lg:px-6";
  return (
    <header className="sticky top-0 z-50 w-full border-b border-dashed border-club/25 bg-header">
      <div className={`flex items-center gap-2 py-1.5 ${row} ${onboarding ? "justify-center" : ""} ${!onboarding && isDemoMode() ? "pr-16 sm:pr-20" : ""}`}>
        <Link href={account ? "/club" : "/"} className="flex min-w-0 items-center gap-2">
          <img src="/brand/bulb.png" alt="" className="h-10 w-auto shrink-0 bg-transparent" />
          <span className="wordmark">Curious Thinkers Club</span>
        </Link>
        {!onboarding && (
        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          <nav className="hidden items-center gap-5 md:flex" aria-label="Site">
            <a href={shop} className="font-sans text-base font-semibold text-club no-underline hover:underline">
              Free pack
            </a>
            <Link href={account ? "/club" : "/login"} className="font-sans text-base font-semibold text-club no-underline hover:underline">
              Club login
            </Link>
            {account?.role === "admin" && (
              <Link href="/admin" className="font-sans text-base font-semibold text-club no-underline hover:underline">
                Admin
              </Link>
            )}
          </nav>
          <details className="relative md:hidden">
            <summary className="cursor-pointer list-none rounded-full px-3 py-2 font-sans text-base font-semibold text-club [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 z-30 mt-2 w-48 rounded-2xl border border-line bg-white p-2 shadow-lg">
              <a href={shop} className="block rounded-xl px-3 py-2 font-sans text-sm font-semibold text-club no-underline hover:underline">
                Free pack
              </a>
              <a href={shop} className="block rounded-xl px-3 py-2 font-sans text-sm font-semibold text-club no-underline hover:underline">
                Shop the packs
              </a>
              <Link href={account ? "/club" : "/login"} className="block rounded-xl px-3 py-2 font-sans text-sm font-semibold text-club no-underline hover:underline">
                Club login
              </Link>
              {account && (
                <Link href="/club/children" className="block rounded-xl px-3 py-2 font-sans text-sm font-semibold text-club no-underline hover:underline">
                  Children
                </Link>
              )}
              {account?.role === "admin" && (
                <Link href="/admin" className="block rounded-xl px-3 py-2 font-sans text-sm font-semibold text-club no-underline hover:underline">
                  Admin
                </Link>
              )}
              {account && (
                <form action={signOut}>
                  <button className="w-full rounded-xl px-3 py-2 text-left font-sans text-sm font-semibold text-club hover:underline">
                    Log out
                  </button>
                </form>
              )}
            </div>
          </details>
          <a
            href={shop}
              className="hidden rounded-full bg-mustard px-4 py-2.5 font-sans text-sm font-bold text-white shadow-[0_6px_16px_rgba(232,164,40,0.35)] md:inline-flex"
          >
            Shop the packs
          </a>
          <a href={`${shop}/cart`} className="relative inline-flex text-club" aria-label="Cart, 0 items">
            <CartIcon />
            <span className="absolute -top-2 -right-2 min-w-4 rounded-full bg-mustard px-1 text-center text-[10px] leading-4 font-bold text-white">
              0
            </span>
          </a>
        </div>
        )}
      </div>
    </header>
  );
}

function DemoModeMenu() {
  return (
    <details className="fixed top-3 right-3 z-50">
      <summary
        className="flex cursor-pointer list-none flex-col items-center [&::-webkit-details-marker]:hidden"
        aria-label="Demo mode"
      >
        <LogoMark className="size-11 drop-shadow-md" />
        <span className="-mt-1 rounded-full bg-[#f0b429] px-1.5 text-[10px] font-extrabold text-[#1a3b2c]">Demo</span>
      </summary>
      <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-[#efe2d0] bg-white p-2 shadow-lg">
        <p className="px-3 py-1 text-[11px] font-extrabold tracking-wide text-[#c45b73] uppercase">Demo mode</p>
        <form action="/api/dev/demo-login" method="post">
          <input type="hidden" name="persona" value="guardian" />
          <button className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-[#f6f1e6]">Sam&apos;s club</button>
        </form>
        <form action="/api/dev/demo-login" method="post">
          <input type="hidden" name="persona" value="admin" />
          <button className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-[#f6f1e6]">Admin</button>
        </form>
        <form action={signOut}>
          <button className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-[#f6f1e6]">Log out</button>
        </form>
      </div>
    </details>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 7h15l-1.5 9h-12z" strokeLinejoin="round" />
      <path d="M6 7 5 4H2" strokeLinecap="round" />
      <circle cx="9" cy="20" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}
