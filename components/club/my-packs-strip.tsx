"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ownedPackStatus, type OwnedPack, type OwnedPackStatus } from "@/lib/club/home";
import type { CoverTone } from "@/lib/validators";

const tones: Record<CoverTone, string> = {
  bottle: "bg-[#1e4d3a]",
  palm: "bg-[#2f6b45]",
  navy: "bg-[#1e3a5f]",
  plum: "bg-[#5c3d6e]",
  sea: "bg-[#245e78]",
};

const statusLabel: Record<OwnedPackStatus, string> = {
  "in-progress": "In progress",
  completed: "Completed",
  "not-started": "Not started",
};

export function MyPacksStrip({
  packs,
  columnRef,
}: {
  packs: OwnedPack[];
  columnRef: RefObject<HTMLDivElement | null>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(() => Math.min(packs.length, 2));

  useLayoutEffect(() => {
    const measure = () => {
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      if (!wide || packs.length === 0) {
        setVisible(Math.min(packs.length, 4));
        return;
      }
      const right = columnRef.current;
      const section = sectionRef.current;
      const card = cardRef.current;
      if (!right || !section || !card) return;
      const header = section.querySelector("[data-packs-header]");
      const style = getComputedStyle(section);
      const padBottom = parseFloat(style.paddingBottom) || 0;
      const gap = 12;
      const cardHeight = card.getBoundingClientRect().height;
      const budget = right.getBoundingClientRect().bottom - (header?.getBoundingClientRect().bottom ?? section.getBoundingClientRect().top) - padBottom;
      const rows = Math.max(1, Math.floor((budget + gap) / (cardHeight + gap)));
      const next = Math.min(packs.length, rows * 2);
      setVisible((current) => (current === next ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (columnRef.current) observer.observe(columnRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [columnRef, packs.length]);

  if (packs.length === 0) {
    return (
      <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_50px_rgba(23,53,42,0.06)]">
        <h2 className="font-display text-2xl text-[#17352A]">My quests</h2>
        <p className="mt-3 text-sm text-[#3d5348]">No quests yet</p>
        <Button asChild variant="mustard" size="md" className="mt-4">
          <Link href="/club/shop">Browse quests</Link>
        </Button>
      </section>
    );
  }

  const shown = packs.slice(0, visible);

  return (
    <section ref={sectionRef} className="rounded-[28px] bg-white p-4 shadow-[0_18px_50px_rgba(23,53,42,0.06)] sm:p-5 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
      <div data-packs-header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-[#17352A]">My quests</h2>
        <Link href="/my-packs" className="inline-flex min-h-11 items-center gap-1 rounded-full border-2 border-[#306A51] px-3 text-sm font-bold text-[#306A51] no-underline">
          See all
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {shown.map((pack, index) => (
          <PackTile key={pack.id} pack={pack} cardRef={index === 0 ? cardRef : undefined} />
        ))}
      </div>
    </section>
  );
}

function PackTile({ pack, cardRef }: { pack: OwnedPack; cardRef?: RefObject<HTMLAnchorElement | null> }) {
  const status = ownedPackStatus(pack);
  const ratio = pack.total ? Math.min(1, pack.done / pack.total) : 0;
  return (
    <Link ref={cardRef} href={`/club/packs/${pack.slug}`} className="min-w-0 rounded-2xl bg-[#f7f3ea] p-3 no-underline">
      <div className="flex min-w-0 gap-3">
        <PackCover title={pack.title} tone={pack.coverTone} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm leading-tight text-[#17352A] sm:text-base">{pack.title}</p>
          <StatusPill status={status} />
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F3E7CF]" role="progressbar" aria-valuemin={0} aria-valuemax={pack.total} aria-valuenow={pack.done} aria-label={`${pack.done} of ${pack.total} steps`}>
        <div className="h-full rounded-full bg-[#306A51]" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
      <p className="mt-1.5 text-xs font-bold text-[#3d5348]">{pack.done} of {pack.total} steps</p>
    </Link>
  );
}

export function PackCover({ title, tone }: { title: string; tone: CoverTone }) {
  return (
    <span className={`relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-xl ${tones[tone]}`} role="img" aria-label={title}>
      <span className="absolute inset-x-1.5 top-1.5 bottom-7 rounded-md bg-[#f7f1e6]" aria-hidden="true" />
      <span className="absolute inset-x-1.5 bottom-1.5 text-center text-[9px] leading-tight font-bold text-white">{title}</span>
    </span>
  );
}

export function StatusPill({ status }: { status: OwnedPackStatus }) {
  const className =
    status === "completed"
      ? "bg-[#306A51] text-white"
      : status === "in-progress"
        ? "bg-[#9BD0A8] text-[#17352A]"
        : "bg-[#F3E7CF] text-[#17352A]";
  return <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-extrabold ${className}`}>{statusLabel[status]}</span>;
}
