"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Bell,
  BookOpen,
  Cake,
  Camera,
  ChevronRight,
  Coins,
  Flag,
  Flame,
  Minus,
  Mountain,
  Rocket,
  Search,
  Shield,
  ShoppingCart,
  Star,
  Trees,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import { Button } from "@/components/ui/button";
import { MyPacksStrip } from "@/components/club/my-packs-strip";
import { PromoBanner } from "@/components/club/promo-banner";
import { remindPackLaunch } from "@/app/club/actions";
import type { DashboardHome, HomePackCard, HomeRelease } from "@/lib/club/home";
import { shopUrl } from "@/lib/env";
import type { GlobalBoardRow } from "@/lib/leaderboard";
import type { AvatarKey, CoverTone } from "@/lib/validators";

type Member = {
  id: string;
  nickname: string;
  first_name?: string | null;
  avatar_key: AvatarKey;
  gender?: "boy" | "girl" | "unspecified" | null;
  avatar_bg?: string | null;
  avatar_face?: string | null;
  avatar_hair_style?: string | null;
  avatar_hair_colour?: string | null;
  avatar_glasses?: boolean | null;
  avatar_hat?: string | null;
  avatar_skin?: string | null;
  avatar_eyes?: string | null;
  avatar_shirt?: string | null;
  avatar_options?: string | null;
};

const tones: Record<CoverTone, string> = {
  bottle: "bg-[#1e4d3a]",
  palm: "bg-[#2f6b45]",
  navy: "bg-[#1e3a5f]",
  plum: "bg-[#5c3d6e]",
  sea: "bg-[#245e78]",
};

export function DashboardHome({
  home,
  members,
  focusId,
  leaderboard,
}: {
  home: DashboardHome;
  members: Member[];
  focusId: string | null;
  leaderboard: GlobalBoardRow[];
}) {
  const opensOnCompleted = home.inProgress.length === 0;
  const [tab, setTab] = useState<"progress" | "completed">(opensOnCompleted ? "completed" : "progress");
  const [reminded, setReminded] = useState(() => new Set(home.remindedIds));
  const [pendingId, setPendingId] = useState<string | null>(null);

  function onTabKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = tab === "progress" ? "completed" : "progress";
    setTab(next);
    document.getElementById(next === "progress" ? "pack-tab-progress" : "pack-tab-completed")?.focus();
  }

  async function remind(packId: string) {
    if (reminded.has(packId) || pendingId) return;
    setPendingId(packId);
    const result = await remindPackLaunch(packId);
    setPendingId(null);
    if ("ok" in result && result.ok) {
      setReminded((current) => new Set(current).add(packId));
    }
  }

  return (
    <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-stretch">
      <div className="flex min-w-0 flex-col gap-4 lg:h-0 lg:min-h-full">
      <section className="min-w-0 rounded-[28px] bg-white p-4 shadow-[0_18px_50px_rgba(23,53,42,0.06)] sm:p-5">
        <div role="tablist" aria-label="Your quests" className="inline-flex max-w-full rounded-full bg-[#F3E7CF] p-1 max-sm:flex max-sm:w-full" onKeyDown={onTabKey}>
          <TabButton id="pack-tab-progress" controls="pack-panel-progress" selected={tab === "progress"} onSelect={() => setTab("progress")}>
            In progress
          </TabButton>
          <TabButton id="pack-tab-completed" controls="pack-panel-completed" selected={tab === "completed"} onSelect={() => setTab("completed")}>
            Completed
          </TabButton>
        </div>
        <div
          role="tabpanel"
          id="pack-panel-progress"
          aria-labelledby="pack-tab-progress"
          hidden={tab !== "progress"}
          className="mt-4 space-y-3"
        >
          {home.inProgress.length === 0 ? (
            <div className="rounded-[22px] bg-[#E7F6EA] px-4 py-8 text-center">
              <h2 className="font-display text-xl text-[#17352A]">No quests in progress</h2>
              <p className="mt-1 text-sm text-[#3d5348]">Pick an adventure and get started.</p>
              <div className="mt-5 text-left">
                <BuyMore />
              </div>
            </div>
          ) : (
            <>
              {home.inProgress.map((pack) => (
                <PackRow key={pack.id} pack={pack} members={members} focusId={focusId} mode="progress" />
              ))}
              <BuyMore />
            </>
          )}
        </div>
        <div
          role="tabpanel"
          id="pack-panel-completed"
          aria-labelledby="pack-tab-completed"
          hidden={tab !== "completed"}
          className="mt-4 space-y-3"
        >
          <BuyMore />
          {home.completed.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-[#3d5348]">No finished quests yet.</p>
          ) : (
            home.completed.map((pack) => <PackRow key={pack.id} pack={pack} members={members} focusId={focusId} mode="completed" />)
          )}
        </div>
      </section>
      {home.promo && <PromoBanner banner={home.promo} />}
      <MyPacksStrip packs={home.ownedPacks} />
      <LeaderboardPreview rows={leaderboard} />
      </div>
      <div className="min-w-0 space-y-4">
        <Stats home={home} />
        <ReleaseCard title="Recent releases" packs={home.recent} mode="recent" />
        <ReleaseCard title="Upcoming releases" packs={home.upcoming} mode="upcoming" reminded={reminded} pendingId={pendingId} onRemind={remind} />
      </div>
    </div>
  );
}

function TabButton({
  id,
  controls,
  selected,
  onSelect,
  children,
}: {
  id: string;
  controls: string;
  selected: boolean;
  onSelect: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-controls={controls}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      className={`min-h-11 rounded-full px-4 font-display text-sm font-semibold max-sm:flex-1 ${selected ? "bg-white text-[#17352A] shadow-[0_2px_8px_rgba(23,53,42,0.08)]" : "text-[#5e7266]"}`}
      onClick={onSelect}
    >
      {children}
    </button>
  );
}

function PackRow({
  pack,
  members,
  focusId,
  mode,
}: {
  pack: HomePackCard;
  members: Member[];
  focusId: string | null;
  mode: "progress" | "completed";
}) {
  const href = focusId ? `/club/packs/${pack.slug}?mode=together&child=${focusId}` : `/club/packs/${pack.slug}`;
  const finished = mode === "completed";
  const shown = members.filter((member) => (finished ? pack.completedMemberIds : pack.pendingMemberIds).includes(member.id));
  return (
    <article className="rounded-[22px] bg-[#f3faf4] p-3 sm:p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="relative shrink-0">
          <PackThumb title={pack.title} theme={pack.theme} tone={pack.coverTone} />
          {finished && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-[#306A51] text-[10px] font-bold text-white" aria-hidden="true">
              ✓
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg leading-tight text-[#17352A]">{pack.title}</h3>
              <p className="mt-0.5 text-sm text-[#3d5348]">
                {finished ? "Completed" : pack.nextStep ? `Next: ${pack.nextStep}` : "Still to finish"}
              </p>
              <div className="mt-3 hidden sm:block">
                <MemberFaces members={shown} finished={finished} />
              </div>
            </div>
            <div className="hidden shrink-0 sm:block">
              <PackAction href={href} finished={finished} />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-3 sm:hidden">
        <MemberFaces members={shown} finished={finished} />
        <PackAction href={href} finished={finished} />
      </div>
    </article>
  );
}

function MemberFaces({ members, finished }: { members: Member[]; finished: boolean }) {
  const label = finished
    ? `${members.length} ${members.length === 1 ? "member has" : "members have"} completed this quest`
    : `${members.length} ${members.length === 1 ? "member still needs" : "members still need"} to complete this quest`;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex -space-x-2">
        {members.map((member) => (
          <Avatar
            key={member.id}
            avatar={member.avatar_key}
            colour={member.avatar_bg}
            face={member.avatar_face}
            hairStyle={member.avatar_hair_style}
            hairColour={member.avatar_hair_colour}
            glasses={member.avatar_glasses}
            hat={member.avatar_hat}
            gender={member.gender === "girl" ? "girl" : "boy"}
            skin={member.avatar_skin}
            eyeColour={member.avatar_eyes}
            shirt={member.avatar_shirt}
            options={member.avatar_options}
            title={member.first_name?.trim() || member.nickname}
            className="size-7 rounded-full ring-2 ring-[#f3faf4]"
          />
        ))}
      </div>
      <p className="min-w-0 text-sm font-bold text-[#3d5348]">{label}</p>
    </div>
  );
}

function PackAction({ href, finished }: { href: string; finished: boolean }) {
  if (finished) {
    return (
      <Link href={href} className="inline-flex min-h-11 w-full items-center justify-center rounded-full border-2 border-[#306A51] bg-white px-4 text-sm font-bold text-[#306A51] no-underline sm:w-auto">
        View again
      </Link>
    );
  }
  return (
    <Button asChild variant="mustard" size="md" className="w-full sm:w-auto">
      <Link href={href}>Continue quest</Link>
    </Button>
  );
}

function BuyMore() {
  return (
    <div className="flex flex-col gap-3 rounded-[18px] bg-[#FFF6DE] px-3 py-3 sm:flex-row sm:items-center">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#17352A]">
        <ShoppingCart className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base text-[#17352A]">Buy more quests</p>
        <p className="text-sm text-[#3d5348]">New adventures are in the shop</p>
      </div>
      <Button asChild variant="mustard" size="sm" className="max-sm:min-h-11 max-sm:w-full">
        <Link href="/club/shop">Shop now</Link>
      </Button>
    </div>
  );
}

function Stats({ home }: { home: DashboardHome }) {
  const { stats } = home;
  const ownsAll = stats.shopTotal > 0 && stats.owned >= stats.shopTotal;
  const slotsFull = stats.available > 0 && stats.sent >= stats.available;
  const sentRatio = stats.available ? Math.min(1, stats.sent / stats.available) : 0;
  return (
    <section className="rounded-[28px] bg-white p-4 shadow-[0_18px_50px_rgba(23,53,42,0.06)] sm:p-5">
      <h2 className="font-display text-2xl text-[#17352A]">Your stats</h2>
      <ul className="mt-4 divide-y divide-[#F3E7CF]">
        <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
          <StatIcon icon={BookOpen} className="bg-[#E7F6EA] text-[#306A51]" />
          <div className="min-w-0 flex-1">
            {ownsAll ? (
              <p className="font-display text-lg text-[#17352A]">You&apos;ve completed all quests!</p>
            ) : (
              <>
                <p className="font-display text-lg text-[#17352A]">
                  {stats.owned} / {stats.shopTotal} quests
                </p>
                <p className="text-sm text-[#5e7266]">Quests owned</p>
              </>
            )}
          </div>
          {ownsAll ? (
            <a href={shopUrl()} className="text-sm font-extrabold text-[#306A51] underline">
              Shop merch
            </a>
          ) : (
            <Button asChild variant="mustard" size="sm" className="max-sm:min-h-11 max-sm:w-full">
              <Link href="/club/shop">Shop more quests</Link>
            </Button>
          )}
        </li>
        <li className="flex items-start gap-3 py-4">
          <StatIcon icon={Star} className="bg-[#FFF3D0] text-[#E8A428]" />
          <div className="min-w-0">
            <p className="font-display text-lg text-[#17352A]">{stats.points} points</p>
            <p className="text-sm text-[#3d5348]">{pointsNudge(stats.unfinished)}</p>
          </div>
        </li>
        <li className="py-4">
          <div className="flex items-start gap-3">
            <StatIcon icon={Camera} className="bg-[#E7F1FB] text-[#245e78]" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg text-[#17352A]">
                {stats.sent} of {stats.available} sent
              </p>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-[#E7F1E4]"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={stats.available}
                aria-valuenow={Math.min(stats.sent, stats.available)}
                aria-label={`${stats.sent} of ${stats.available} pieces of work sent`}
              >
                <div className="h-full rounded-full bg-[#9BD0A8]" style={{ width: `${Math.round(sentRatio * 100)}%` }} />
              </div>
              <p className="mt-2 text-sm text-[#3d5348]">{slotsFull ? "Well done!" : "Submit your work to earn more points."}</p>
              {slotsFull && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button asChild variant="green" size="sm" className="max-sm:min-h-11">
                    <Link href="/club/rewards">Unlock reward</Link>
                  </Button>
                  <Button asChild variant="mustard" size="sm" className="max-sm:min-h-11">
                    <Link href="/club/shop">Buy more quests</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </li>
      </ul>
    </section>
  );
}

function pointsNudge(unfinished: number) {
  if (unfinished <= 0) return "Get new quests to earn more points.";
  const label = unfinished === 1 ? "1 unfinished quest" : `${unfinished} unfinished quests`;
  return `Finish your ${label} or get new quests to earn more points.`;
}

function StatIcon({ icon: Icon, className }: { icon: LucideIcon; className: string }) {
  return (
    <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${className}`}>
      <Icon className="size-5" aria-hidden="true" />
    </span>
  );
}

function MoveMark({ move }: { move: GlobalBoardRow["move"] }) {
  if (move === "up") return <ArrowUp className="size-4 shrink-0 text-[#2f9d4a]" aria-label="Moving up" />;
  if (move === "down") return <ArrowDown className="size-4 shrink-0 text-[#d64545]" aria-label="Moving down" />;
  return <Minus className="size-4 shrink-0 text-[#8d8982]" aria-label="Staying put" />;
}

function LeaderboardPreview({ rows }: { rows: GlobalBoardRow[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [count, setCount] = useState(() => Math.min(rows.length, 4));

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const apply = () => {
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      if (!wide) {
        setCount(Math.min(rows.length, 4));
        return;
      }
      const style = getComputedStyle(section);
      const limit = section.getBoundingClientRect().bottom - (parseFloat(style.paddingBottom) || 0);
      const lis = [...section.querySelectorAll("li")];
      const fit = lis.filter((li) => li.getBoundingClientRect().bottom <= limit + 1).length;
      const next = Math.min(rows.length, Math.max(fit, lis.length ? 1 : 0));
      setCount((current) => (current === next ? current : next));
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(section);
    return () => observer.disconnect();
  }, [rows.length]);

  const shown = rows.slice(0, count);
  return (
    <section ref={sectionRef} className="flex flex-col rounded-[28px] bg-white p-4 shadow-[0_18px_50px_rgba(23,53,42,0.06)] sm:p-5 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <div data-board-header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-[#17352A]">Leaderboard</h2>
        <Link href="/club/leaderboard" className="inline-flex min-h-11 items-center gap-1 rounded-full border-2 border-[#306A51] px-3 text-sm font-bold text-[#306A51] no-underline">
          View leaderboards
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-[#5e7266]">No scores yet.</p>
      ) : (
        <ol className="space-y-2">
          {shown.map((row) => {
            const first = row.firstName?.trim();
            const name = first ? `@${row.nickname} (${first})` : `@${row.nickname}`;
            return (
              <li key={row.id} className={`flex items-center gap-2 rounded-2xl px-2 py-1.5 ${row.isMine ? "ring-2 ring-[#e8a428]" : ""}`}>
                <span className="w-6 shrink-0 text-center font-display text-lg text-[#306A51]">{row.rank}</span>
                <MoveMark move={row.move} />
                <Avatar
                  avatar={row.avatarKey as AvatarKey}
                  options={row.avatarOptions}
                  colour={row.avatarBg}
                  face={row.avatarFace}
                  hairStyle={row.avatarHairStyle}
                  hairColour={row.avatarHairColour}
                  glasses={row.avatarGlasses}
                  hat={row.avatarHat}
                  gender={row.gender === "girl" ? "girl" : "boy"}
                  skin={row.avatarSkin}
                  eyeColour={row.avatarEyes}
                  shirt={row.avatarShirt}
                  title={name}
                  className="size-9 shrink-0 rounded-full"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#17352A]">{name}</span>
                <span className="shrink-0 font-display text-lg text-[#17352A]">{row.points}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function ReleaseCard({
  title,
  packs,
  mode,
  reminded,
  pendingId,
  onRemind,
}: {
  title: string;
  packs: HomeRelease[];
  mode: "recent" | "upcoming";
  reminded?: Set<string>;
  pendingId?: string | null;
  onRemind?: (packId: string) => void;
}) {
  return (
    <section className="rounded-[28px] bg-white p-4 shadow-[0_18px_50px_rgba(23,53,42,0.06)] sm:p-5">
      <h2 className="font-display text-2xl text-[#17352A]">{title}</h2>
      <ul className="mt-3 divide-y divide-[#F6F1E6]">
        {packs.map((pack) => (
          <li key={pack.id} className="flex min-w-0 items-center gap-3 py-3">
            <PackThumb title={pack.title} theme={pack.theme} tone={pack.coverTone} />
            <p className="min-w-0 flex-1 font-display text-base leading-tight text-[#17352A]">
              {pack.title}
              {pack.free && <span className="ml-2 inline-flex rounded-full bg-[#9BD0A8] px-1.5 py-0.5 align-middle font-sans text-[10px] font-extrabold tracking-wide text-[#17352A]">FREE</span>}
            </p>
            {mode === "recent" ? (
              pack.owned ? (
                <span className="shrink-0 rounded-full bg-[#E7F6EA] px-3 py-1 text-sm font-bold text-[#306A51]">Owned</span>
              ) : (
                <Button asChild variant="mustard" size="sm" className="shrink-0 max-sm:min-h-11">
                  <Link href={`/club/shop#${pack.slug}`}>Unlock</Link>
                </Button>
              )
            ) : reminded?.has(pack.id) ? (
              <button type="button" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-[#d9e5db] bg-[#f4f7f4] px-3 text-sm font-bold text-[#5e7266]" disabled>
                We&apos;ll tell you
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-2 border-[#306A51] bg-white px-3 text-sm font-bold text-[#306A51] disabled:opacity-60"
                disabled={pendingId === pack.id}
                onClick={() => onRemind?.(pack.id)}
              >
                <Bell className="size-4" aria-hidden="true" />
                Notify me
              </button>
            )}
          </li>
        ))}
        {packs.length === 0 && <li className="py-4 text-sm text-[#5e7266]">Nothing here yet.</li>}
      </ul>
    </section>
  );
}

function PackThumb({ title, theme, tone }: { title: string; theme: string; tone: CoverTone }) {
  const Icon = iconFor(title, theme);
  return (
    <span role="img" aria-label={title} className={`flex aspect-[1/1.414] w-16 shrink-0 items-center justify-center rounded-xl ${tones[tone]} text-white`}>
      <Icon className="size-6" aria-hidden="true" />
    </span>
  );
}

function iconFor(title: string, theme: string): LucideIcon {
  const value = `${title} ${theme}`.toLowerCase();
  if (value.includes("pirate")) return Flag;
  if (value.includes("egypt") || value.includes("roman") || value.includes("dino")) return Mountain;
  if (value.includes("spy") || value.includes("code")) return Search;
  if (value.includes("knight") || value.includes("castle")) return Shield;
  if (value.includes("space") || value.includes("rocket")) return Rocket;
  if (value.includes("money")) return Coins;
  if (value.includes("rain") || value.includes("garden") || value.includes("nature")) return Trees;
  if (value.includes("ocean") || value.includes("sea")) return Waves;
  if (value.includes("volcano") || value.includes("science")) return Flame;
  if (value.includes("baker") || value.includes("food")) return Cake;
  return BookOpen;
}
