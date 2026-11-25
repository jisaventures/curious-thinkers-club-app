"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { GROUP_ICONS, GroupIcon, type GroupIconId } from "@/components/brand/group-icon";

function isGroupIcon(value: string | null | undefined): value is GroupIconId {
  return !!value && (GROUP_ICONS as readonly string[]).includes(value);
}

export function AccountMenu({
  name,
  icon,
  background,
  colour,
  isAdmin,
}: {
  name: string;
  icon?: string | null;
  background?: string | null;
  colour?: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const initial = name.slice(0, 1).toUpperCase();
  const groupIcon = isGroupIcon(icon) ? icon : null;

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="flex cursor-default items-center gap-2 rounded-full border border-[#eadfce] bg-white py-1 pr-2 pl-1 shadow-sm sm:pr-3"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          if (window.matchMedia("(hover: none)").matches) setOpen((current) => !current);
        }}
      >
        {groupIcon ? (
          <GroupIcon icon={groupIcon} background={background || "2f9a4a"} colour={colour || "fff4dc"} className="size-8 shrink-0 overflow-hidden rounded-full" title={name} />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-[#306A51] font-display text-sm font-bold text-white">{initial}</span>
        )}
        <span className="hidden max-w-40 truncate font-display text-base text-[#17352A] sm:inline">{name}</span>
        <svg viewBox="0 0 20 20" className="size-4 text-[#306A51]" aria-hidden="true">
          <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 pt-2">
          <div className="w-48 rounded-2xl border border-[#eadfce] bg-white p-2 shadow-lg" role="menu">
            <Link href="/club/group" className="block rounded-xl px-3 py-2 text-sm font-bold text-[#17352A] no-underline hover:bg-[#f6efe2]" role="menuitem">
              My Group
            </Link>
            <Link href="/club/leaderboard" className="block rounded-xl px-3 py-2 text-sm font-bold text-[#17352A] no-underline hover:bg-[#f6efe2]" role="menuitem">
              Leaderboards
            </Link>
            <Link href="/club/rewards" className="block rounded-xl px-3 py-2 text-sm font-bold text-[#17352A] no-underline hover:bg-[#f6efe2]" role="menuitem">
              Rewards
            </Link>
            <Link href="/submit-work" className="block rounded-xl px-3 py-2 text-sm font-bold text-[#17352A] no-underline hover:bg-[#f6efe2]" role="menuitem">
              Submit work
            </Link>
            <Link href="/club/children" className="block rounded-xl px-3 py-2 text-sm font-bold text-[#17352A] no-underline hover:bg-[#f6efe2]" role="menuitem">
              Children
            </Link>
            {isAdmin && (
              <Link href="/admin" className="block rounded-xl px-3 py-2 text-sm font-bold text-[#17352A] no-underline hover:bg-[#f6efe2]" role="menuitem">
                Admin
              </Link>
            )}
            <form action={signOut}>
              <button type="submit" className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-[#17352A] hover:bg-[#f6efe2]" role="menuitem">
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
