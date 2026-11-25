"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import { CountryFlag } from "@/components/brand/country-flag";
import { GROUP_ICONS, GroupIcon, type GroupIconId } from "@/components/brand/group-icon";
import { DashboardHome } from "@/components/club/dashboard-home";
import { EmptyPackBanner, PackBanner } from "@/components/club/pack-banner";
import { Scrapbook } from "@/components/club/scrapbook";
import { shortName } from "@/lib/format";
import type { loadDashboard } from "@/lib/club/data";

type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;

export function DashboardView({ data, notice }: { data: DashboardData; notice?: string }) {
  const { account } = data;
  const [bookId, setBookId] = useState<string | null>(null);
  const membersRow = useRef<HTMLDivElement>(null);
  const membersLabel = useRef<HTMLParagraphElement>(null);
  const identityText = useRef<HTMLDivElement>(null);
  const identityRow = useRef<HTMLDivElement>(null);
  const groupIcon = useRef<HTMLAnchorElement>(null);
  useLayoutEffect(() => {
    const row = membersRow.current;
    const label = membersLabel.current;
    const text = identityText.current;
    const icon = groupIcon.current;
    const align = () => {
      if (row && label) {
        const avatar = row.querySelector(".member-avatar");
        if (avatar) {
          const inset = avatar.getBoundingClientRect().left - row.getBoundingClientRect().left;
          label.style.marginLeft = `${Math.max(0, Math.round(inset))}px`;
        }
      }
      if (identityRow.current) identityRow.current.style.minHeight = "";
      if (icon) {
        icon.style.width = "";
        icon.style.height = "";
      }
    };
    align();
    const observer = new ResizeObserver(align);
    if (row) observer.observe(row);
    if (text) observer.observe(text);
    window.addEventListener("resize", align);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", align);
    };
  }, [data.children.length, data.clubRank, data.clubPoints]);

  const focus = data.focus;
  const owned = data.packs.filter((pack) => pack.owned);

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] bg-white p-4 shadow-[0_18px_50px_rgba(23,53,42,0.06)] sm:p-5">
        <div className="grid grid-cols-1 gap-y-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-x-10">
          <p className="order-1 font-display text-sm font-bold text-[#306A51] lg:col-start-1 lg:row-start-1">Group Leader: {account.display_name}</p>
          <div className="order-3 lg:order-none lg:col-start-2 lg:row-start-1">
            <p ref={membersLabel} className="font-display text-sm font-bold text-[#306A51]">Group Members</p>
          </div>
          <div ref={identityRow} className="order-2 flex items-stretch gap-3 lg:order-none lg:col-start-1 lg:row-start-2">
            {isGroupIcon(account.group_icon) && (
              <Link ref={groupIcon} href="/club/group#profile" className="club-group-icon group relative shrink-0 self-stretch overflow-hidden rounded-[22px]" aria-label="Edit group icon">
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
            <div ref={identityText} className="flex min-w-0 flex-1 flex-col justify-center">
              <h1 className="flex items-center gap-2 font-display text-3xl leading-tight font-bold whitespace-nowrap text-[#17352A] sm:text-4xl">
                <span>{account.group_name || account.display_name}</span>
                {account.group_location && <CountryFlag country={account.group_location} className="h-4 w-6 shrink-0" />}
                <Link href="/club/group" aria-label="Manage club" className="manage-pen relative inline-flex size-8 items-center justify-center rounded-full text-[#306A51] no-underline hover:bg-[#E7F6EA]">
                  <Pencil className="size-4" aria-hidden="true" />
                  <span role="tooltip" className="manage-tip pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-md bg-[#17352A] px-2 py-1 text-xs font-bold whitespace-nowrap text-white">
                    Manage club
                  </span>
                </Link>
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
          <div className="order-4 min-w-0 lg:order-none lg:col-start-2 lg:row-start-2">
            <div ref={membersRow} className="flex flex-wrap justify-center gap-x-3 gap-y-3 lg:justify-start">
              {data.children.map((child) => {
                const name = memberName(child);
                return (
                  <button key={child.id} type="button" className="member-chip w-[calc((100%-1.5rem)/3)] text-center lg:w-max" onClick={() => setBookId(child.id)}>
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
                    <span className="mt-1 block whitespace-nowrap font-display text-sm font-bold leading-tight text-[#17352A]">{name}</span>
                    <span className="block whitespace-nowrap text-[10px] font-extrabold text-[#5e7266] sm:text-[11px]">@{child.nickname}</span>
                  </button>
                );
              })}
            </div>
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
        <DashboardHome home={data.home} members={data.children} focusId={focus?.id ?? null} leaderboard={data.leaderboard} />
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
