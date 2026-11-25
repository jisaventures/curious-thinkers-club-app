"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Backpack, Gift, Home, ShoppingCart, Star, Upload, Users } from "lucide-react";
import { AccountMenu } from "@/components/brand/account-menu";
import type { AccountRecord } from "@/lib/auth/session";

const MENU = [
  { href: "/club", label: "Dashboard", icon: Home, className: "bg-[#306A51] text-white shadow-[0_4px_0_#17352A]", match: (path: string) => path === "/club" },
  { href: "/my-quests", label: "Quests", icon: Backpack, className: "bg-[#E8A428] text-white shadow-[0_4px_0_#C48614]", match: (path: string) => path.startsWith("/my-quests") },
  { href: "/club/leaderboard", label: "Leaderboards", icon: Star, className: "bg-[#F08AB0] text-white shadow-[0_4px_0_#d56b96]", match: (path: string) => path.startsWith("/club/leaderboard") },
  { href: "/rewards", label: "Rewards", icon: Gift, className: "bg-[#50B0DC] text-white shadow-[0_4px_0_#2f8fb8]", match: (path: string) => path.startsWith("/rewards") },
  { href: "/submit-work", label: "Submit Work", icon: Upload, className: "bg-[#9BD0A8] text-white shadow-[0_4px_0_#6eae80]", match: (path: string) => path.startsWith("/submit-work") },
];

const SOCIALS = [
  { name: "YouTube", href: "https://www.youtube.com" },
  { name: "Instagram", href: "https://www.instagram.com" },
  { name: "Facebook", href: "https://www.facebook.com" },
  { name: "TikTok", href: "https://www.tiktok.com" },
];

export function AppHeader({ account }: { account: AccountRecord | null }) {
  const path = usePathname();
  const [community, setCommunity] = useState(false);
  const name = account?.display_name?.trim() || "Parent";

  return (
    <header className="sticky top-0 z-40 bg-[#f6f1e6]">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex justify-center py-3">
          <Link href="/club" className="flex items-center gap-2">
            <img
              src="/brand/bulb.png"
              alt=""
              width={103}
              height={160}
              loading="eager"
              fetchPriority="high"
              decoding="sync"
              className="h-9 w-auto shrink-0 bg-transparent sm:h-10"
            />
            <span className="wordmark text-[#306A51]">Curious Thinkers Club</span>
          </Link>
        </div>
        <nav className="flex flex-wrap items-center gap-2 pb-3" aria-label="Main">
          {MENU.map((item) => {
            const active = item.match(path);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-display text-sm font-bold text-white no-underline ${item.className} ${active ? "outline outline-2 outline-offset-2 outline-white" : ""}`}
              >
                <item.icon className="size-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          <div className="ml-auto flex items-center gap-2">
            <span className="mx-1 h-px w-8 bg-[#306A51]/40" aria-hidden="true" />
            <button type="button" className="header-brand gap-1.5" onClick={() => setCommunity(true)}>
              <Users className="size-4 shrink-0" aria-hidden="true" />
              Community
            </button>
            <Link href="/club/shop" className="header-brand gap-1.5">
              <ShoppingCart className="size-4 shrink-0" aria-hidden="true" />
              Shop
            </Link>
            <AccountMenu
              name={account?.group_name?.trim() || name}
              icon={account?.group_icon}
              background={account?.group_bg}
              colour={account?.group_icon_colour}
              isAdmin={account?.role === "admin"}
            />
          </div>
        </nav>
      </div>
      <div className="border-b border-dashed border-[#306A51]/25" />
      {community && <CommunityModal onClose={() => setCommunity(false)} />}
    </header>
  );
}

function CommunityModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#17352A]/45 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="community-title" onClick={onClose}>
      <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-[0_18px_50px_rgba(23,53,42,0.2)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h2 id="community-title" className="font-display text-2xl text-[#17352A]">Community</h2>
          <button type="button" className="rounded-full px-3 py-1 text-sm font-extrabold text-[#306A51]" onClick={onClose}>
            Close
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {SOCIALS.map((item) => (
            <li key={item.name}>
              <a href={item.href} target="_blank" rel="noreferrer" className="flex min-h-11 items-center rounded-2xl bg-[#f7f3ea] px-4 font-display text-lg font-semibold text-[#17352A] no-underline hover:bg-[#E7F6EA]">
                {item.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
