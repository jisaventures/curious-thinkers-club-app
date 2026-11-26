"use client";

import { useState } from "react";
import Link from "next/link";
import { ownedPackStatus, type OwnedPack, type OwnedPackStatus } from "@/lib/club/home";
import { Button } from "@/components/ui/button";
import { PackCover, StatusPill } from "@/components/club/my-packs-strip";

const filters: Array<{ id: "all" | OwnedPackStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "in-progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "not-started", label: "Not started" },
];

export function MyPacksPage({ packs }: { packs: OwnedPack[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const shown = packs.filter((pack) => filter === "all" || ownedPackStatus(pack) === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/club" className="text-sm font-extrabold text-[#306A51] no-underline hover:underline">
            Back to the club
          </Link>
          <h1 className="mt-2 font-display text-3xl text-[#17352A]">My quests</h1>
        </div>
      </div>
      <div role="tablist" aria-label="Filter quests" className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const selected = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`min-h-11 rounded-full px-4 text-sm font-bold ${selected ? "bg-[#306A51] text-white" : "bg-white text-[#17352A]"}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {shown.length === 0 ? (
        <div className="rounded-[28px] bg-white p-6 text-center">
          <p className="font-display text-2xl text-[#17352A]">No quests yet</p>
          <Button asChild variant="mustard" size="md" className="mt-4">
            <Link href="/club/shop">Browse quests</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((pack) => (
            <PackDetail key={pack.id} pack={pack} />
          ))}
        </div>
      )}
    </div>
  );
}

function PackDetail({ pack }: { pack: OwnedPack }) {
  const status = ownedPackStatus(pack);
  const ratio = pack.total ? Math.min(1, pack.done / pack.total) : 0;
  const href = `/club/packs/${pack.slug}`;
  const primary = status === "completed" ? "View again" : status === "in-progress" ? "Continue" : "Start";
  const bought = pack.purchasedAt ? new Date(pack.purchasedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not recorded";
  return (
    <article className="flex min-w-0 flex-col rounded-[28px] bg-white p-4 shadow-[0_18px_50px_rgba(23,53,42,0.06)]">
      <div className="flex gap-3">
        <PackCover title={pack.title} tone={pack.coverTone} />
        <div className="min-w-0">
          <h2 className="font-display text-xl leading-tight text-[#17352A]">{pack.title}</h2>
          <p className="mt-1 text-sm capitalize text-[#3d5348]">{pack.theme}</p>
          <StatusPill status={status} />
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-[#3d5348]">
        <Fact label="Ages" value={pack.ageMin && pack.ageMax ? `${pack.ageMin}–${pack.ageMax}` : "All ages"} />
        <Fact label="Time" value={pack.durationLabel || "Not set"} />
        <Fact label="Pages" value={pack.pageCount != null ? String(pack.pageCount) : "Not set"} />
        <Fact label="Steps" value={`${pack.done} of ${pack.total}`} />
        <Fact label="Next step" value={status === "completed" ? "All done" : pack.nextStep || "Ready to start"} />
        <Fact label="Work sent" value={`${pack.submissionsSent} / ${pack.submissionSlots}`} />
        <Fact label="Points" value={String(pack.pointsEarned)} />
        <Fact label="Bought" value={bought} />
      </dl>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F3E7CF]" role="progressbar" aria-valuemin={0} aria-valuemax={pack.total} aria-valuenow={pack.done} aria-label={`${pack.done} of ${pack.total} steps`}>
        <div className="h-full rounded-full bg-[#306A51]" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Button asChild variant="mustard" size="md" className="w-full">
          <Link href={href}>{primary}</Link>
        </Button>
        <Button asChild variant="white" size="md" className="w-full border-2 border-[#306A51]">
          <Link href={href}>Print pages</Link>
        </Button>
        <Link href="/club/shop" className="text-center text-sm font-extrabold text-[#306A51] underline">
          Order printed workbook
        </Link>
      </div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-extrabold tracking-wide text-[#5e7266] uppercase">{label}</dt>
      <dd className="truncate font-bold text-[#17352A]">{value}</dd>
    </div>
  );
}
