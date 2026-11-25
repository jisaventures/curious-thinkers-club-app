"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Backpack, Gift, Home, ShoppingCart, Star, Upload, Users } from "lucide-react";
import { AccountMenu } from "@/components/brand/account-menu";
import type { AccountRecord } from "@/lib/auth/session";

const MENU = [
  { href: "/club", label: "Dashboard", icon: Home, face: "bg-[#E8A428] shadow-[0_4px_0_#C48614]", current: "bg-[#E8A428] shadow-[inset_0_0_0_2px_#fff,0_4px_0_#C48614]", tab: "bg-[#E8A428]", tabShadow: "shadow-[0_3px_0_#C48614]", match: (path: string) => path === "/club" },
  { href: "/my-quests", label: "Quests", icon: Backpack, face: "bg-[#E07A3D] shadow-[0_4px_0_#c4551a]", current: "bg-[#E07A3D] shadow-[inset_0_0_0_2px_#fff,0_4px_0_#c4551a]", tab: "bg-[#E07A3D]", tabShadow: "shadow-[0_3px_0_#c4551a]", match: (path: string) => path.startsWith("/my-quests") },
  { href: "/club/leaderboard", label: "Leaderboards", icon: Star, face: "bg-[#F08AB0] shadow-[0_4px_0_#d56b96]", current: "bg-[#F08AB0] shadow-[inset_0_0_0_2px_#fff,0_4px_0_#d56b96]", tab: "bg-[#F08AB0]", tabShadow: "shadow-[0_3px_0_#d56b96]", match: (path: string) => path.startsWith("/club/leaderboard") },
  { href: "/rewards", label: "Rewards", icon: Gift, face: "bg-[#50B0DC] shadow-[0_4px_0_#2f8fb8]", current: "bg-[#50B0DC] shadow-[inset_0_0_0_2px_#fff,0_4px_0_#2f8fb8]", tab: "bg-[#50B0DC]", tabShadow: "shadow-[0_3px_0_#2f8fb8]", match: (path: string) => path.startsWith("/rewards") },
  { href: "/submit-work", label: "Submit Work", icon: Upload, face: "bg-[#3F8A5C] shadow-[0_4px_0_#2d6844]", current: "bg-[#3F8A5C] shadow-[inset_0_0_0_2px_#fff,0_4px_0_#2d6844]", tab: "bg-[#3F8A5C]", tabShadow: "shadow-[0_3px_0_#2d6844]", match: (path: string) => path.startsWith("/submit-work") },
];

const SOCIALS = [
  { name: "YouTube", href: "https://www.youtube.com" },
  { name: "Instagram", href: "https://www.instagram.com" },
  { name: "Facebook", href: "https://www.facebook.com" },
  { name: "TikTok", href: "https://www.tiktok.com" },
];

const focus = "rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17352A]";

export function AppHeader({ account }: { account: AccountRecord | null }) {
  const path = usePathname();
  const router = useRouter();
  const rowRef = useRef<HTMLDivElement>(null);
  const [community, setCommunity] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const name = account?.group_name?.trim() || account?.display_name?.trim() || "Parent";

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    let lock = false;
    const fit = () => {
      if (lock) return;
      lock = true;
      const desktop = window.matchMedia("(min-width: 768px)").matches;
      if (!desktop) {
        row.dataset.labels = "hide";
        lock = false;
        return;
      }
      row.dataset.labels = "show";
      const boxes = [...row.querySelectorAll("a, button")]
        .map((node) => node.getBoundingClientRect())
        .filter((box) => box.width > 2);
      const crowded = boxes.some((box, index) =>
        boxes.slice(index + 1).some((other) => box.top < other.bottom - 1 && other.top < box.bottom - 1 && box.left < other.right - 1 && other.left < box.right - 1),
      );
      row.dataset.labels = crowded || row.scrollWidth > row.clientWidth + 1 ? "hide" : "show";
      lock = false;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(row);
    return () => observer.disconnect();
  }, [name]);

  useEffect(() => {
    setPendingHref(null);
  }, [path]);

  useEffect(() => {
    for (const href of ["/club", "/my-quests", "/club/leaderboard", "/rewards", "/submit-work", "/club/shop"]) {
      router.prefetch(href);
    }
  }, [router]);

  function selected(href: string, match: (value: string) => boolean) {
    return pendingHref ? pendingHref === href : match(path);
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#f6f1e6]">
        <div ref={rowRef} data-labels="hide" className="header-row mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-3 md:h-[84px] md:gap-3 md:px-6">
          <Link href="/club" prefetch className={`header-logo flex min-w-0 items-center gap-1.5 ${focus}`}>
            <img
              src="/brand/bulb.png"
              alt=""
              width={103}
              height={160}
              loading="eager"
              fetchPriority="high"
              decoding="sync"
              className="h-8 w-auto shrink-0 bg-transparent md:h-10 lg:h-14"
            />
            <span className="wordmark truncate text-[#306A51] md:hidden">Curious Thinkers</span>
            <span className="wordmark hidden truncate text-[#306A51] md:inline">Curious Thinkers Club</span>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-2 md:flex lg:gap-3" aria-label="Main">
            {MENU.map((item) => {
              const active = selected(item.href, item.match);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  title={item.label}
                  onClick={() => setPendingHref(item.href)}
                  data-tip={item.label}
                  className={`menu-tip ${focus}`}
                >
                  <span data-current={active ? "true" : undefined} className={`nav-pill menu-pill inline-flex h-11 w-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-0 font-display text-[14px] font-bold text-white lg:h-[52px] lg:w-[52px] ${active ? item.current : item.face}`}>
                    <item.icon className="size-6 shrink-0 lg:size-7" aria-hidden="true" />
                    <span className="menu-label">{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
            <button type="button" data-tip="Community" className={`menu-tip order-2 border-0 bg-transparent p-0 md:order-1 ${focus}`} aria-label="Community" title="Community" onClick={() => setCommunity(true)}>
              <span className="nav-pill menu-pill inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#306A51] px-0 font-display text-[14px] font-bold text-white shadow-[0_4px_0_#17352A]">
                <Users className="size-4 shrink-0" aria-hidden="true" />
                <span className="menu-label">Community</span>
              </span>
            </button>
            <Link href="/club/shop" prefetch data-tip="Shop" aria-label="Shop" title="Shop" onClick={() => setPendingHref("/club/shop")} className={`menu-tip order-1 md:order-2 ${focus}`}>
              <span data-current={selected("/club/shop", (value) => value.startsWith("/club/shop")) ? "true" : undefined} className={`nav-pill menu-pill inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#306A51] px-0 font-display text-[14px] font-bold text-white ${selected("/club/shop", (value) => value.startsWith("/club/shop")) ? "shadow-[inset_0_0_0_2px_#fff,0_4px_0_#17352A]" : "shadow-[0_4px_0_#17352A]"}`}>
                <ShoppingCart className="size-4 shrink-0" aria-hidden="true" />
                <span className="menu-label">Shop</span>
              </span>
            </Link>
            <div className="order-3">
              <AccountMenu
                name={name}
                icon={account?.group_icon}
                background={account?.group_bg}
                colour={account?.group_icon_colour}
                isAdmin={account?.role === "admin"}
              />
            </div>
          </div>
        </div>
        <div className="border-b border-dashed border-[#306A51]/25" />
        {community && <CommunityModal onClose={() => setCommunity(false)} />}
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(23,53,42,0.12)] md:hidden" aria-label="Main">
        <ul className="grid h-16 grid-cols-5">
          {MENU.map((item) => {
            const active = selected(item.href, item.match);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  onClick={() => setPendingHref(item.href)}
                  className="flex h-full flex-col items-center justify-center gap-1 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#306A51]"
                >
                  <span className={`flex items-center justify-center rounded-xl text-white ${item.tab} ${active ? `size-9 -translate-y-0.5 ${item.tabShadow}` : "size-7 opacity-70"}`}>
                    <item.icon className={active ? "size-[18px]" : "size-4"} aria-hidden="true" />
                  </span>
                  <span className={`max-w-full truncate px-0.5 text-[11px] leading-none text-[#17352A] ${active ? "font-bold" : "font-semibold opacity-70"}`}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

function CommunityModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#17352A]/45 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="community-title" onClick={onClose}>
      <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-[0_18px_50px_rgba(23,53,42,0.2)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h2 id="community-title" className="font-display text-2xl text-[#17352A]">Community</h2>
          <button type="button" className="rounded-full px-3 py-1 text-sm font-extrabold text-[#306A51] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#306A51]" onClick={onClose}>
            Close
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {SOCIALS.map((item) => (
            <li key={item.name}>
              <a href={item.href} target="_blank" rel="noreferrer" className="flex min-h-11 items-center rounded-2xl bg-[#f7f3ea] px-4 font-display text-lg font-semibold text-[#17352A] no-underline hover:bg-[#E7F6EA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#306A51]">
                {item.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
