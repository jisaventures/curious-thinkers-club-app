"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import { CountryFlag } from "@/components/brand/country-flag";
import { GROUP_ICONS, GroupIcon, type GroupIconId } from "@/components/brand/group-icon";
import { DashboardHome } from "@/components/club/dashboard-home";
import { EmptyPackBanner, PackBanner } from "@/components/club/pack-banner";
import { Scrapbook } from "@/components/club/scrapbook";
import { shortName } from "@/lib/format";
import { memberColour } from "@/lib/member-colour";
import type { loadDashboard } from "@/lib/club/data";

type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;

export function DashboardView({ data, notice }: { data: DashboardData; notice?: string }) {
  const { account } = data;
  const [bookId, setBookId] = useState<string | null>(null);
  const focus = data.focus;
  const owned = data.packs.filter((pack) => pack.owned);

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="rounded-[28px] bg-white p-4 shadow-[0_18px_50px_rgba(23,53,42,0.06)] sm:p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {isGroupIcon(account.group_icon) && (
              <Link href="/club/group#profile" className="group relative size-16 shrink-0 overflow-hidden rounded-[22px]" aria-label="Edit group icon">
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
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-[#306A51]">Group Leader: {account.display_name}</p>
              <h1 className="mt-1 flex items-center gap-2 font-display text-3xl leading-tight font-bold whitespace-nowrap text-[#17352A] sm:text-4xl">
                <span>{account.group_name || account.display_name}</span>
                {account.group_location && <CountryFlag country={account.group_location} className="h-4 w-6 shrink-0" />}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.clubRank != null && (
                  <span className="rounded-full bg-[#F8E4B8] px-2.5 py-1 text-xs font-extrabold text-[#17352A]">Rank #{data.clubRank}</span>
                )}
                <span className="rounded-full bg-[#DDF3E4] px-2.5 py-1 text-xs font-extrabold text-[#306A51]">
                  {data.clubPoints.toLocaleString("en-GB")} club points
                </span>
              </div>
            </div>
          </div>
          <div className="min-w-0 lg:max-w-[58%]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <p className="text-center font-display text-sm font-bold text-[#306A51]">Group Members</p>
              <Link href="/club/group" className="hidden min-h-11 items-center gap-2 rounded-full border-2 border-[#306A51] px-4 text-sm font-bold text-[#306A51] no-underline lg:inline-flex">
                <LayoutGrid className="size-4" aria-hidden="true" />
                Manage club
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-3 lg:justify-end">
              {data.children.map((child) => {
                const name = memberName(child);
                return (
                  <button key={child.id} type="button" className="member-chip w-[calc((100%-1.5rem)/3)] text-center lg:w-max" onClick={() => setBookId(child.id)}>
                    <span className="relative mx-auto block size-14">
                      <span className="member-avatar block size-14 overflow-hidden rounded-full bg-white">
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
                      <span className="absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-white" style={{ background: memberColour(data.children.indexOf(child)).dot }} />
                    </span>
                    <span className="mt-1 block whitespace-nowrap font-display text-sm font-bold leading-tight text-[#17352A]">{name}</span>
                    <span className="block whitespace-nowrap text-[10px] font-extrabold text-[#5e7266] sm:text-[11px]">@{child.nickname}</span>
                  </button>
                );
              })}
            </div>
            <Link href="/club/group" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-[#306A51] text-sm font-bold text-[#306A51] no-underline lg:hidden">
              <LayoutGrid className="size-4" aria-hidden="true" />
              Manage club
            </Link>
          </div>
        </div>
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
              blurb={data.banners[0].blurb}
              durationLabel={data.banners[0].durationLabel}
              ageMin={data.banners[0].ageMin}
              ageMax={data.banners[0].ageMax}
              pageCount={data.banners[0].pageCount}
              href={focus ? `/club/packs/${data.banners[0].slug}?mode=together&child=${focus.id}` : `/club/packs/${data.banners[0].slug}`}
              featured
            />
          </>
        )}
        <DashboardHome home={data.home} members={data.children} focusId={focus?.id ?? null} />
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

function isGroupIcon(value: string | null | undefined): value is GroupIconId {
  return !!value && (GROUP_ICONS as readonly string[]).includes(value);
}
