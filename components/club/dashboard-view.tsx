"use client";

import { useState } from "react";
import Link from "next/link";
import { setFocusChild } from "@/app/club/actions";
import { Avatar } from "@/components/brand/avatar";
import { CountryFlag } from "@/components/brand/country-flag";
import { GROUP_ICONS, GroupIcon, type GroupIconId } from "@/components/brand/group-icon";
import { ChildForm } from "@/components/club/child-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyPackBanner, PackBanner, RecentReleases } from "@/components/club/pack-banner";
import { Scrapbook } from "@/components/club/scrapbook";
import { shortName } from "@/lib/format";
import { memberColour } from "@/lib/member-colour";
import type { CoverTone } from "@/lib/validators";
import type { loadDashboard } from "@/lib/club/data";

type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
type Pack = DashboardData["packs"][number];

export function DashboardView({ data, notice }: { data: DashboardData; notice?: string }) {
  const { account } = data;
  const [focusId, setFocusId] = useState(data.focus?.id ?? "");
  const [bookId, setBookId] = useState<string | null>(null);
  const focus = data.children.find((child) => child.id === focusId) ?? data.focus;
  const owned = data.packs.filter((pack) => pack.owned);
  function chooseChild(childId: string) {
    setFocusId(childId);
    const body = new FormData();
    body.set("childId", childId);
    void setFocusChild(body);
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="flex flex-col items-center gap-6 text-center xl:flex-row xl:items-center xl:justify-between xl:gap-8 xl:text-left">
        <div className="w-full min-w-0 xl:w-auto xl:flex-1">
          <div className="flex items-center justify-center gap-3 xl:justify-start">
            {isGroupIcon(account.group_icon) && (
              <Link href="/club/group#profile" className="group relative size-16 shrink-0 overflow-hidden rounded-[22px] sm:size-20" aria-label="Edit group icon">
                <GroupIcon
                  icon={account.group_icon}
                  background={account.group_bg || "2f9a4a"}
                  colour={account.group_icon_colour || "fff4dc"}
                  className="size-full"
                  title="Group icon"
                />
                <span className="pointer-events-none absolute inset-0 bg-black/45 opacity-0 transition group-hover:opacity-100" />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent pt-6 pb-2 text-center text-sm font-extrabold text-white opacity-0 transition group-hover:opacity-100">
                  Edit
                </span>
              </Link>
            )}
            <div className="min-w-0 text-left">
              <p className="text-xs font-extrabold text-[#5e7266] sm:text-sm">Group Leader: {account.display_name}</p>
              <h1 className="mt-0.5 flex items-center gap-2 font-display text-3xl leading-tight text-[#306A51] sm:text-4xl">
                <span className="text-[#e8a428]">{account.group_name || account.display_name}</span>
                {account.group_location && <CountryFlag country={account.group_location} className="h-3.5 w-5 sm:h-4 sm:w-6" />}
              </h1>
            </div>
          </div>
        </div>
        {data.children.length > 0 && (
          <div className="w-full xl:w-auto xl:shrink-0">
            <p className="text-center font-display text-sm text-[#306A51]">Group Members</p>
            <div className="mt-2 flex flex-wrap items-start justify-center gap-x-4 gap-y-3 xl:justify-end">
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

      <section className="space-y-4">
        {data.banners.length === 0 ? (
          <EmptyPackBanner />
        ) : (
          <>
            <PackBanner
              state={data.banners[0].state}
              title={data.banners[0].title}
              tone={data.banners[0].coverTone}
              clubName={account.group_name?.trim() || "Your club"}
              done={data.banners[0].done}
              total={data.banners[0].total}
              nextStep={data.banners[0].nextStep}
              members={data.children}
              href={focus ? `/club/packs/${data.banners[0].slug}?mode=together&child=${focus.id}` : `/club/packs/${data.banners[0].slug}`}
              featured
            />
            {data.banners.length > 1 ? (
              <div className="grid items-start gap-4 lg:grid-cols-3">
                <div className="space-y-3 lg:col-span-2">
                  {data.banners.slice(1).map((banner) => (
                    <PackBanner
                      key={banner.id}
                      state={banner.state}
                      title={banner.title}
                      tone={banner.coverTone}
                      clubName={account.group_name?.trim() || "Your club"}
                      done={banner.done}
                      total={banner.total}
                      nextStep={banner.nextStep}
                      members={data.children}
                      href={focus ? `/club/packs/${banner.slug}?mode=together&child=${focus.id}` : `/club/packs/${banner.slug}`}
                      compact
                    />
                  ))}
                </div>
                <RecentReleases releases={data.releases} />
              </div>
            ) : (
              <RecentReleases releases={data.releases} />
            )}
          </>
        )}
      </section>

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

function statusWord(done: number, total: number) {
  if (!total || done <= 0) return "Started";
  const ratio = done / total;
  if (ratio >= 1) return "Finished";
  if (ratio >= 0.75) return "Almost done";
  if (ratio >= 0.34) return "In progress";
  return "Started";
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

function isGroupIcon(value: string | null | undefined): value is GroupIconId {
  return !!value && (GROUP_ICONS as readonly string[]).includes(value);
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
