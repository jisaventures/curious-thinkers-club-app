"use client";

import { useState } from "react";
import Link from "next/link";
import { exitClubApp } from "@/app/login/actions";
import { GROUP_ICONS, GroupIcon, type GroupIconId } from "@/components/brand/group-icon";

function isGroupIcon(value: string | null | undefined): value is GroupIconId {
  return !!value && (GROUP_ICONS as readonly string[]).includes(value);
}

export function AccountMenu({
  name,
  icon,
  background,
  colour,
}: {
  name: string;
  icon?: string | null;
  background?: string | null;
  colour?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const initial = name.slice(0, 1).toUpperCase();
  const groupIcon = isGroupIcon(icon) ? icon : null;

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="flex h-9 cursor-pointer items-center gap-1 rounded-full bg-white pr-1.5 pl-0.5 shadow-[0_4px_0_#9a958c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#306A51] md:h-[38px] md:gap-2 md:pr-2.5 md:pl-1"
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
        <span className="hidden max-w-32 truncate font-display text-base text-[#17352A] lg:inline">{name}</span>
        <svg viewBox="0 0 20 20" className="size-3.5 text-[#306A51] md:size-4" aria-hidden="true">
          <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 pt-2">
          <div className="w-48 rounded-2xl border border-[#eadfce] bg-white p-2 shadow-lg" role="menu">
            <Link href="/club/group" className="block rounded-xl px-3 py-2 text-sm font-bold text-[#17352A] no-underline hover:bg-[#f6efe2]" role="menuitem">
              My Group
            </Link>
            <button
              type="button"
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-[#c44536] hover:bg-[#fdeceb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c44536]"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setConfirmExit(true);
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
      {confirmExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17352A]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="exit-title" onClick={() => setConfirmExit(false)}>
          <div className="w-full max-w-sm rounded-[28px] bg-white p-6 text-center shadow-[0_18px_50px_rgba(23,53,42,0.2)]" onClick={(event) => event.stopPropagation()}>
            <h2 id="exit-title" className="font-display text-3xl text-[#17352A]">Are you sure?</h2>
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                className="rounded-full bg-[#306A51] px-4 py-3 text-base font-bold text-white shadow-[0_4px_0_#17352A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17352A]"
                onClick={() => setConfirmExit(false)}
              >
                Stay Logged In
              </button>
              <form action={exitClubApp}>
                <button type="submit" className="w-full rounded-full bg-[#c44536] px-4 py-3 text-base font-bold text-white shadow-[0_4px_0_#8d2e24] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17352A]">
                  Exit Club App
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
