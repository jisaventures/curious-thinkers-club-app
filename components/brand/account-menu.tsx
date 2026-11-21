"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/login/actions";

export function AccountMenu({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const initial = name.slice(0, 1).toUpperCase();

  function close() {
    setOpen(false);
  }

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={close}>
      <button
        type="button"
        className="flex cursor-default items-center gap-2 rounded-full border border-[#eadfce] bg-white py-1 pr-2 pl-1 shadow-sm sm:pr-3"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          if (window.matchMedia("(hover: none)").matches) setOpen((current) => !current);
        }}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-[#306A51] font-display text-sm font-bold text-white">{initial}</span>
        <span className="hidden font-display text-base text-[#17352A] sm:inline">{name}</span>
        <svg viewBox="0 0 20 20" className="size-4 text-[#306A51]" aria-hidden="true">
          <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 pt-2">
          <div className="w-48 rounded-2xl border border-[#eadfce] bg-white p-2 shadow-lg" role="menu">
            <Link href="/club/group" onClick={close} className="block rounded-xl px-3 py-2 text-sm font-bold text-[#17352A] no-underline hover:bg-[#f6efe2]" role="menuitem">
              My Group
            </Link>
            <Link href="/club/leaderboard" onClick={close} className="block rounded-xl px-3 py-2 text-sm font-bold text-[#17352A] no-underline hover:bg-[#f6efe2]" role="menuitem">
              Leaderboards
            </Link>
            <Link href="/club/rewards" onClick={close} className="block rounded-xl px-3 py-2 text-sm font-bold text-[#17352A] no-underline hover:bg-[#f6efe2]" role="menuitem">
              Rewards
            </Link>
            <Link href="/club/uploads" onClick={close} className="block rounded-xl px-3 py-2 text-sm font-bold text-[#17352A] no-underline hover:bg-[#f6efe2]" role="menuitem">
              Uploads
            </Link>
            <Link href="/club/children" onClick={close} className="block rounded-xl px-3 py-2 text-sm font-bold text-[#17352A] no-underline hover:bg-[#f6efe2]" role="menuitem">
              Children
            </Link>
            {isAdmin && (
              <Link href="/admin" onClick={close} className="block rounded-xl px-3 py-2 text-sm font-bold text-[#17352A] no-underline hover:bg-[#f6efe2]" role="menuitem">
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
