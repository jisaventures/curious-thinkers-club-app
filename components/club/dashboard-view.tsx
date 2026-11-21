"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { setFocusChild } from "@/app/club/actions";
import { Avatar } from "@/components/brand/avatar";
import { ChildForm } from "@/components/club/child-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Scrapbook } from "@/components/club/scrapbook";
import { formatWhen, shortName } from "@/lib/format";
import { colourForChild, memberColour } from "@/lib/member-colour";
import type { CoverTone } from "@/lib/validators";
import type { loadDashboard } from "@/lib/club/data";

type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
type Pack = DashboardData["packs"][number];

export function DashboardView({ data, notice }: { data: DashboardData; notice?: string }) {
  const { account } = data;
  const [focusId, setFocusId] = useState(data.focus?.id ?? "");
  const [bookId, setBookId] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const focus = data.children.find((child) => child.id === focusId) ?? data.focus;
  const owned = data.packs.filter((pack) => pack.owned);
  const spotlight = focus ? pickSpotlight(owned, data.doneByChild[focus.id] ?? {}) : null;
  const welcome = spotlight && focus
    ? activityLine(memberName(focus), spotlight.pack.title, spotlight.done, spotlight.total)
    : focus
      ? `${memberName(focus)} is ready for a new pack.`
      : "Add a child to start a pack together.";
  const recent = data.activities.slice(0, 5);

  function chooseChild(childId: string) {
    setFocusId(childId);
    const body = new FormData();
    body.set("childId", childId);
    void setFocusChild(body);
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="flex items-center justify-between gap-4">
        <div className="relative min-w-0">
          <h1 className="font-display text-3xl leading-tight text-[#306A51] sm:text-4xl">
            Welcome back, <span className="text-[#e8a428]">{account.display_name}</span>
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-display text-base text-[#306A51] sm:text-lg">Activity log</span>
            <button type="button" className="inline-flex items-center gap-1 rounded-full border border-[#eadfce] bg-white px-3 py-1.5 text-left font-display text-base text-[#306A51] shadow-sm" aria-expanded={logOpen} onClick={() => setLogOpen((open) => !open)}>
              {welcome}
              <ChevronDown className={`size-5 shrink-0 transition ${logOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
          </div>
          {logOpen && (
            <div className="absolute z-20 mt-2 w-[min(100%,28rem)] rounded-2xl border border-[#eadfce] bg-white p-3 shadow-[0_16px_40px_rgba(23,53,42,0.08)]">
              {recent.length === 0 ? (
                <p className="text-sm text-[#5e7266]">Nothing has been logged yet.</p>
              ) : (
                <ul className="space-y-2">
                  {recent.map((item) => {
                    const colour = colourForChild(item.childId, data.children);
                    return (
                      <li key={item.id} className="rounded-xl px-3 py-2 text-sm font-bold" style={{ background: colour.wash, color: colour.ink }}>
                        <span className="mr-2 inline-block size-2.5 rounded-full align-middle" style={{ background: colour.dot }} />
                        {item.summary}
                        {item.at && <span className="mt-0.5 block text-xs font-extrabold">{formatWhen(item.at)}</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link href="/club/group#activity" className="mt-3 inline-block text-sm font-extrabold text-[#306A51] underline">
                View full activity log
              </Link>
            </div>
          )}
        </div>
        {data.children.length > 0 && (
          <div className="shrink-0">
            <p className="text-center font-display text-sm text-[#306A51]">Group Members</p>
            <div className="mt-2 flex flex-wrap items-start justify-end gap-x-4 gap-y-3">
              {data.children.map((child) => {
                const name = memberName(child);
                return (
                  <button key={child.id} type="button" className="member-chip w-max text-center" onClick={() => setBookId(child.id)}>
                    <span className="member-avatar mx-auto block size-14 overflow-hidden rounded-full bg-white">
                      <Avatar
                        avatar={child.avatar_key}
                        colour={child.avatar_bg}
                        face={child.avatar_face}
                        hairStyle={child.avatar_hair_style}
                        hairColour={child.avatar_hair_colour}
                        glasses={child.avatar_glasses}
                        hat={child.avatar_hat}
                        gender={child.gender === "girl" ? "girl" : "boy"}
                        skin={child.avatar_skin}
                        eyeColour={child.avatar_eyes}
                        shirt={child.avatar_shirt}
                        options={child.avatar_options}
                        title={name}
                        className="size-14"
                      />
                    </span>
                    <span className="mt-1 flex items-center justify-center gap-1 whitespace-nowrap font-display text-sm leading-tight text-[#17352A]">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: memberColour(data.children.indexOf(child)).dot }} />
                      {name}
                    </span>
                    <span className="block whitespace-nowrap text-[11px] font-extrabold text-[#5e7266]">@{child.nickname}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {notice && <p className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#306A51]">{notice}</p>}

      {spotlight && focus ? (
        <article className="rounded-[28px] bg-white p-4 shadow-[0_18px_50px_rgba(23,53,42,0.06)] sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <PackArt tone={spotlight.pack.cover_tone} title={spotlight.pack.title} className="mx-auto h-44 w-36 sm:mx-0 sm:h-48 sm:w-40" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold tracking-[0.16em] text-[#306A51]">UP NEXT</p>
              <h2 className="mt-1 font-display text-2xl text-[#17352A] sm:text-3xl">{spotlight.pack.title}</h2>
              <p className="mt-1 text-base text-[#3d5348]">
                Next: {data.nextStepByChild[focus.id]?.[spotlight.pack.id] ?? "Keep going"}
              </p>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm text-[#3d5348]">
                  <span>
                    {spotlight.done} of {spotlight.total} steps done
                  </span>
                  <span>{paceWord(spotlight.done, spotlight.total)}</span>
                </div>
                <Progress value={spotlight.done} total={spotlight.total} />
              </div>
              <Button asChild variant="mustard" size="md" className="mt-4 w-full sm:w-auto">
                <Link href={`/club/packs/${spotlight.pack.slug}?mode=together&child=${focus.id}`}>
                  Continue with {shortName(focus.nickname)}
                </Link>
              </Button>
            </div>
            <img src="/brand/mascot-spy.png" alt="" className="hidden h-40 w-auto shrink-0 md:block" />
          </div>
        </article>
      ) : (
        <article className="rounded-[28px] bg-white p-6 text-[#3d5348] shadow-[0_18px_50px_rgba(23,53,42,0.06)]">
          <h2 className="font-display text-2xl text-[#17352A]">Nothing in progress yet</h2>
          <p className="mt-2">When a child starts a pack, the next step will show up here.</p>
          <Button asChild variant="mustard" size="md" className="mt-4">
            <Link href="/club/shop">Find a pack</Link>
          </Button>
        </article>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl text-[#17352A]">Your kids</h2>
          {data.children.length < 5 && (
            <Dialog>
              <DialogTrigger className="text-sm font-extrabold text-[#306A51] underline-offset-2 hover:underline">
                Add a child
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Add a child</DialogTitle>
                <DialogDescription>Up to 5 children share every pack you unlock.</DialogDescription>
                <div className="mt-4">
                  <ChildForm mode="add" />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {data.children.map((child) => {
            const current = currentPack(owned, data.doneByChild[child.id] ?? {});
            const done = current ? (data.doneByChild[child.id]?.[current.id] ?? 0) : 0;
            const active = child.id === focus?.id;
            return (
              <button
                key={child.id}
                type="button"
                aria-pressed={active}
                onClick={() => chooseChild(child.id)}
                className={`rounded-[22px] bg-white p-4 text-left shadow-[0_10px_30px_rgba(23,53,42,0.05)] ${active ? "ring-2 ring-[#306A51]" : "ring-1 ring-transparent"}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    avatar={child.avatar_key}
                    colour={child.avatar_bg}
                    face={child.avatar_face}
                    hairStyle={child.avatar_hair_style}
                    hairColour={child.avatar_hair_colour}
                    glasses={child.avatar_glasses}
                    hat={child.avatar_hat}
                    gender={child.gender === "girl" ? "girl" : "boy"}
                    skin={child.avatar_skin}
                    eyeColour={child.avatar_eyes}
                    shirt={child.avatar_shirt}
                    options={child.avatar_options}
                    title={child.nickname}
                    className="size-12 shrink-0 rounded-full"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg text-[#17352A]">{shortName(child.nickname)}</p>
                    <p className="text-sm text-[#5e7266]">{child.age_years} years old</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[#3d5348]">
                  {current ? `${packLabel(current.title)} · ${done} of ${current.total} steps` : "No pack yet"}
                </p>
                <Progress value={done} total={current?.total ?? 0} className="mt-2" />
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl text-[#17352A]">My packs</h2>
          <Link href="/club/shop" className="text-sm font-extrabold text-[#306A51] underline-offset-2 hover:underline">
            Find a pack
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {owned.map((pack) => {
            const done = focus ? (data.doneByChild[focus.id]?.[pack.id] ?? pack.done) : pack.done;
            const total = pack.total || pack.step_count;
            return (
              <Link key={pack.id} href={focus ? `/club/packs/${pack.slug}?mode=together&child=${focus.id}` : `/club/packs/${pack.slug}`} className="min-w-0 no-underline">
                <PackArt tone={pack.cover_tone} title={pack.title} className="aspect-[3/4] w-full" />
                <p className="mt-2 font-display text-base leading-tight text-[#17352A]">{pack.title}</p>
                <p className="text-sm text-[#5e7266]">{statusWord(done, total)}</p>
              </Link>
            );
          })}
          <Link href="/club/shop" className="flex min-h-48 flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-[#c9b89a] bg-[#fbf7f0] text-center no-underline">
            <span className="flex size-10 items-center justify-center rounded-full bg-white text-2xl text-[#306A51] shadow-sm">+</span>
            <span className="mt-3 text-sm font-extrabold text-[#306A51]">Find a pack</span>
          </Link>
        </div>
      </section>
      {bookId && (
        <Scrapbook
          child={data.children.find((child) => child.id === bookId) ?? data.children[0]}
          packs={owned}
          doneByPack={data.doneByChild[bookId] ?? {}}
          points={data.pointsByChild[bookId] ?? 0}
          rank={memberRank(bookId, data.children, data.pointsByChild)}
          onClose={() => setBookId(null)}
        />
      )}
    </div>
  );
}

function memberName(child: DashboardData["children"][number]) {
  return child.first_name?.trim() || shortName(child.nickname);
}

function memberRank(childId: string, children: DashboardData["children"], pointsByChild: Record<string, number>) {
  const ordered = [...children].sort((a, b) => (pointsByChild[b.id] ?? 0) - (pointsByChild[a.id] ?? 0) || a.nickname.localeCompare(b.nickname));
  return ordered.findIndex((child) => child.id === childId) + 1;
}

function pickSpotlight(packs: Pack[], doneByPack: Record<string, number>) {
  const open = packs
    .map((pack) => ({ pack, done: doneByPack[pack.id] ?? 0, total: pack.total || pack.step_count }))
    .filter((item) => item.total > 0 && item.done < item.total && item.done > 0);
  open.sort((a, b) => b.done / b.total - a.done / a.total);
  return open[0] ?? null;
}

function currentPack(packs: Pack[], doneByPack: Record<string, number>) {
  const ranked = packs
    .map((pack) => ({ ...pack, done: doneByPack[pack.id] ?? 0, total: pack.total || pack.step_count }))
    .filter((pack) => pack.total > 0);
  ranked.sort((a, b) => {
    const aOpen = a.done > 0 && a.done < a.total ? 1 : 0;
    const bOpen = b.done > 0 && b.done < b.total ? 1 : 0;
    return bOpen - aOpen || b.done / b.total - a.done / a.total;
  });
  return ranked[0] ?? null;
}

function paceWord(done: number, total: number) {
  if (!total || done <= 0) return "Started";
  const ratio = done / total;
  if (ratio >= 1) return "Finished";
  if (ratio >= 0.75) return "Almost done";
  if (ratio >= 0.35) return "Halfway";
  return "Started";
}

function statusWord(done: number, total: number) {
  if (!total || done <= 0) return "Started";
  const ratio = done / total;
  if (ratio >= 1) return "Finished";
  if (ratio >= 0.75) return "Almost done";
  if (ratio >= 0.34) return "In progress";
  return "Started";
}

function activityLine(name: string, title: string, done: number, total: number) {
  const pack = packLabel(title).toLowerCase();
  const ratio = total ? done / total : 0;
  if (ratio >= 1) return `${name} has finished the ${pack}.`;
  if (ratio >= 0.75) return `${name} is nearly done with the ${pack}.`;
  if (ratio >= 0.4) return `${name} is halfway through the ${pack}.`;
  if (done > 0) return `${name} has started the ${pack}.`;
  return `${name} can start the ${pack}.`;
}

function packLabel(title: string) {
  const value = title.toLowerCase();
  if (value.includes("pirate")) return "Pirate pack";
  if (value.includes("egypt")) return "Egypt pack";
  if (value.includes("spy")) return "Spy pack";
  if (value.includes("knight")) return "Knight pack";
  if (value.includes("space")) return "Space pack";
  return title;
}

function Progress({ value, total, className = "" }: { value: number; total: number; className?: string }) {
  const pct = total ? Math.max(0, Math.min(100, Math.round((value / total) * 100))) : 0;
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-[#F3E7CF] ${className}`}>
      <div className="h-full rounded-full bg-[#306A51]" style={{ width: `${pct}%` }} />
    </div>
  );
}

const tones: Record<CoverTone, string> = {
  bottle: "bg-[#1e4d3a]",
  palm: "bg-[#2f6b45]",
  navy: "bg-[#1e3a5f]",
  plum: "bg-[#5c3d6e]",
  sea: "bg-[#245e78]",
};

function PackArt({ tone, title, className = "" }: { tone: CoverTone; title: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[22px] ${tones[tone]} ${className}`}>
      <div className="absolute inset-x-3 top-3 bottom-[28%] rounded-xl bg-[#f7f1e6]">
        <CoverSketch title={title} />
      </div>
      <p className="absolute inset-x-3 bottom-3 text-center text-xs leading-tight font-bold text-white sm:text-sm">{title}</p>
    </div>
  );
}

function CoverSketch({ title }: { title: string }) {
  const value = title.toLowerCase();
  if (value.includes("egypt")) {
    return (
      <svg viewBox="0 0 80 90" className="h-full w-full" aria-hidden="true">
        <path d="M10 70 L40 18 L70 70 Z" fill="#e7c56a" />
        <path d="M28 70 L40 42 L52 70 Z" fill="#f3e0a0" />
        <circle cx="58" cy="24" r="8" fill="#e8a428" />
      </svg>
    );
  }
  if (value.includes("spy")) {
    return (
      <svg viewBox="0 0 80 90" className="h-full w-full" aria-hidden="true">
        <rect x="18" y="16" width="44" height="56" rx="4" fill="#f4e2b0" />
        <circle cx="40" cy="40" r="12" fill="none" stroke="#1e4d3a" strokeWidth="3" />
        <path d="M48 48 L60 62" stroke="#1e4d3a" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 90" className="h-full w-full" aria-hidden="true">
      <path d="M14 58 C28 40 52 40 66 58" fill="none" stroke="#c45b4a" strokeWidth="3" strokeDasharray="3 3" />
      <circle cx="22" cy="50" r="4" fill="#e07a3d" />
      <path d="M48 28 l4 8 h8 l-6 5 2 8 -8-5 -8 5 2-8 -6-5 h8 z" fill="#e8a428" />
      <rect x="16" y="62" width="48" height="8" rx="2" fill="#d7c4a2" />
    </svg>
  );
}
